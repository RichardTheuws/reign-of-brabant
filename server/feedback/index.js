import express from 'express';

const app = express();
const PORT = process.env.PORT || 3007;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'RichardTheuws/reign-of-brabant';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/issues`;

const VALID_CATEGORIES = ['bug', 'balance', 'feature', 'praise'];
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// --- Rate limiter (in-memory) ---

const rateLimitMap = new Map();

function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}

// Cleanup every 10 minutes
setInterval(cleanupRateLimits, 10 * 60 * 1000).unref();

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry = { windowStart: now, count: 0 };
    rateLimitMap.set(ip, entry);
  }

  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// --- Middleware ---

app.use(express.json({ limit: '5mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://reign-of-brabant.nl');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// --- Health check ---

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rob-feedback-api' });
});

// --- POST /report ---

app.post('/report', async (req, res) => {
  try {
    // Rate limit
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        success: false,
        error: 'Te veel verzoeken. Probeer het over een uur opnieuw.'
      });
    }

    // Validate required fields
    const { title, description, category, gameState, screenshot } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Titel is verplicht.' });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Beschrijving is verplicht.' });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Categorie moet een van: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // Build issue body
    const body = formatIssueBody({
      category,
      description: description.trim(),
      gameState: gameState || {},
      screenshot,
      userAgent: req.headers['user-agent'] || 'onbekend'
    });

    // Create GitHub Issue
    if (!GITHUB_TOKEN) {
      console.error('[feedback] GITHUB_TOKEN is not set');
      return res.status(500).json({ success: false, error: 'Server configuratiefout.' });
    }

    const ghResponse = await fetch(GITHUB_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `[${capitalize(category)}] ${title.trim()}`,
        body,
        labels: ['player-report', category]
      })
    });

    if (!ghResponse.ok) {
      const errorText = await ghResponse.text();
      console.error(`[feedback] GitHub API error ${ghResponse.status}: ${errorText}`);
      return res.status(500).json({ success: false, error: 'Kon issue niet aanmaken.' });
    }

    const issue = await ghResponse.json();

    console.log(`[feedback] Issue #${issue.number} created: ${issue.html_url}`);

    return res.status(201).json({
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url
    });
  } catch (err) {
    console.error('[feedback] Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Er ging iets mis. Probeer het later opnieuw.' });
  }
});

// --- Helpers ---

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatIssueBody({ category, description, gameState, screenshot, userAgent }) {
  const gs = gameState;
  const stats = gs.stats || {};
  const browser = gs.browser || {};
  const version = gs.version || 'onbekend';
  const faction = gs.faction || 'onbekend';
  const difficulty = gs.difficulty || 'onbekend';
  const elapsed = gs.elapsedSeconds != null ? `${gs.elapsedSeconds}s` : 'onbekend';
  const mission = gs.mission || 'Schermutsel';
  const unitsProduced = stats.unitsProduced ?? '?';
  const unitsLost = stats.unitsLost ?? '?';
  const enemiesKilled = stats.enemiesKilled ?? '?';
  const resolution = browser.resolution || 'onbekend';

  let body = `## ${capitalize(category)}: Speler Rapport

### Beschrijving
${description}

### Game State
| | |
|---|---|
| Versie | v${version} |
| Factie | ${faction} |
| Moeilijkheid | ${difficulty} |
| Speeltijd | ${elapsed} |
| Missie | ${mission} |

### Stats
- Eenheden getraind: ${unitsProduced}
- Verloren: ${unitsLost}
- Vijanden verslagen: ${enemiesKilled}

### Browser
${userAgent}
${resolution}`;

  if (screenshot && typeof screenshot === 'string' && screenshot.length > 100) {
    // screenshot may be a full data URI or raw base64
    const imgSrc = screenshot.startsWith('data:') ? screenshot : `data:image/png;base64,${screenshot}`;
    body += `

<details>
<summary>Screenshot</summary>

![screenshot](${imgSrc})

</details>`;
  }

  body += `

---
*Ingediend via in-game feedback systeem*`;

  return body;
}

// --- Start ---

app.listen(PORT, () => {
  console.log(`[feedback] Reign of Brabant feedback API running on port ${PORT}`);
  console.log(`[feedback] GitHub repo: ${GITHUB_REPO}`);
});
