import { mkdir, writeFile, readFile, rename, stat } from "node:fs/promises";
import { existsSync, createReadStream } from "node:fs";
import { join, resolve, normalize } from "node:path";
import { randomUUID } from "node:crypto";
import {
  CHARACTERS,
  ALLOWED_EXTENSIONS,
  MIME_BY_EXT,
  MAX_FILE_SIZE,
  RATE_LIMIT_PER_HOUR,
  RATE_LIMIT_WINDOW_MS,
  type Character,
  type AudioExtension,
  type Submission,
  type PublicSubmission,
} from "./types.js";

// ---------- Configuration ----------
const PORT = Number(process.env.PORT ?? 3110);
const DATA_DIR = resolve(process.env.DATA_DIR ?? "./uploads");
const SUBMISSIONS_FILE = join(DATA_DIR, "submissions.json");
const ALLOWED_ORIGINS = new Set([
  "https://reign-of-brabant.nl",
  "http://localhost:5173",
]);
const STARTED_AT = Date.now();

// ---------- Helpers ----------
function log(ip: string, method: string, path: string, msg = ""): void {
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[${ts}] ${ip} ${method} ${path} ${msg}`.trimEnd());
}

function clientIp(req: Request, server: { requestIP?: (r: Request) => { address: string } | null }): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  try {
    const ip = server.requestIP?.(req);
    if (ip?.address) return ip.address;
  } catch {
    /* noop */
  }
  return "unknown";
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://reign-of-brabant.nl";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

function jsonResponse(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extra },
  });
}

function sanitizeName(raw: string): string {
  return raw.replace(/[<>&"'`]/g, "").trim();
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "anon"
  );
}

function isCharacter(v: string): v is Character {
  return (CHARACTERS as readonly string[]).includes(v);
}

function isExtension(v: string): v is AudioExtension {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(v);
}

function getExtension(filename: string): string | null {
  const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : null;
}

function isValidEmail(email: string): boolean {
  // Pragmatic check; not RFC 5322
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// ---------- Rate limiting (in-memory sliding window) ----------
const rateMap = new Map<string, number[]>();

function rateLimitCheck(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (rateMap.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_PER_HOUR) {
    const oldest = hits[0];
    return { ok: false, retryAfter: Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000) };
  }
  hits.push(now);
  rateMap.set(ip, hits);
  return { ok: true };
}

setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [ip, hits] of rateMap) {
    const fresh = hits.filter((t) => t > cutoff);
    if (fresh.length === 0) rateMap.delete(ip);
    else rateMap.set(ip, fresh);
  }
}, 5 * 60 * 1000).unref?.();

// ---------- Storage ----------
async function ensureStorage(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  for (const c of CHARACTERS) {
    await mkdir(join(DATA_DIR, c), { recursive: true });
  }
  if (!existsSync(SUBMISSIONS_FILE)) {
    await writeFile(SUBMISSIONS_FILE, "[]", "utf8");
  }
}

async function readSubmissions(): Promise<Submission[]> {
  try {
    const raw = await readFile(SUBMISSIONS_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as Submission[]) : [];
  } catch {
    return [];
  }
}

// Atomic append: read → modify → write tmp → rename. Serialised via mutex.
let writeChain: Promise<void> = Promise.resolve();
async function appendSubmission(sub: Submission): Promise<void> {
  const task = writeChain.then(async () => {
    const all = await readSubmissions();
    all.push(sub);
    const tmp = `${SUBMISSIONS_FILE}.tmp`;
    await writeFile(tmp, JSON.stringify(all, null, 2), "utf8");
    await rename(tmp, SUBMISSIONS_FILE);
  });
  writeChain = task.catch(() => undefined);
  await task;
}

// ---------- Route handlers ----------
async function handleSubmit(req: Request, ip: string): Promise<Response> {
  const rl = rateLimitCheck(ip);
  if (!rl.ok) {
    return jsonResponse(
      { ok: false, error: "rate_limited", retryAfter: rl.retryAfter },
      429,
      { "Retry-After": String(rl.retryAfter ?? 3600) },
    );
  }

  // Quick early bail on Content-Length oversize
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength && contentLength > MAX_FILE_SIZE + 64 * 1024) {
    return jsonResponse({ ok: false, error: "file_too_large", maxBytes: MAX_FILE_SIZE }, 413);
  }

  let form: Awaited<ReturnType<Request["formData"]>>;
  try {
    form = await req.formData();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_multipart" }, 400);
  }

  const file = form.get("file");
  const characterRaw = String(form.get("character") ?? "");
  const submitterRaw = String(form.get("submitterName") ?? "");
  const emailRaw = form.get("email") ? String(form.get("email")) : "";

  if (!(file instanceof File)) {
    return jsonResponse({ ok: false, error: "missing_file" }, 400);
  }
  if (file.size === 0) {
    return jsonResponse({ ok: false, error: "empty_file" }, 400);
  }
  if (file.size > MAX_FILE_SIZE) {
    return jsonResponse({ ok: false, error: "file_too_large", maxBytes: MAX_FILE_SIZE }, 413);
  }
  if (!isCharacter(characterRaw)) {
    return jsonResponse({ ok: false, error: "invalid_character" }, 400);
  }
  const submitterName = sanitizeName(submitterRaw);
  if (submitterName.length < 2 || submitterName.length > 50) {
    return jsonResponse({ ok: false, error: "invalid_submitterName" }, 400);
  }
  let email: string | undefined;
  if (emailRaw) {
    if (!isValidEmail(emailRaw)) {
      return jsonResponse({ ok: false, error: "invalid_email" }, 400);
    }
    email = emailRaw;
  }

  const ext = getExtension(file.name);
  if (!ext || !isExtension(ext)) {
    return jsonResponse({ ok: false, error: "invalid_extension", allowed: ALLOWED_EXTENSIONS }, 400);
  }

  const id = randomUUID();
  const slug = slugify(submitterName);
  const isoStamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${slug}_${isoStamp}.${ext}`;
  const targetDir = join(DATA_DIR, characterRaw);
  const targetPath = join(targetDir, filename);

  // Ensure target dir resolves inside DATA_DIR (defence in depth)
  if (!resolve(targetPath).startsWith(resolve(DATA_DIR))) {
    return jsonResponse({ ok: false, error: "path_traversal" }, 400);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(targetPath, buf);

  const submission: Submission = {
    id,
    character: characterRaw,
    submitterName,
    email,
    filename,
    size: buf.byteLength,
    uploadedAt: new Date().toISOString(),
  };
  await appendSubmission(submission);

  log(ip, "POST", "/voice-uploads/api/submit", `id=${id} char=${characterRaw} size=${buf.byteLength}`);
  return jsonResponse({ ok: true, id, filename, character: characterRaw }, 201);
}

async function handleList(url: URL): Promise<Response> {
  const filter = url.searchParams.get("character");
  const all = await readSubmissions();
  const filtered = filter && isCharacter(filter) ? all.filter((s) => s.character === filter) : all;
  const publicOnly: PublicSubmission[] = filtered.map((s) => ({
    id: s.id,
    character: s.character,
    submitterName: s.submitterName,
    filename: s.filename,
    size: s.size,
    uploadedAt: s.uploadedAt,
  }));
  return jsonResponse({ submissions: publicOnly });
}

async function handleFile(character: string, filename: string): Promise<Response> {
  if (!isCharacter(character)) {
    return jsonResponse({ ok: false, error: "invalid_character" }, 400);
  }
  // Reject any path components — only allow flat filenames
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..") || normalize(filename) !== filename) {
    return jsonResponse({ ok: false, error: "invalid_filename" }, 400);
  }
  const ext = getExtension(filename);
  if (!ext || !isExtension(ext)) {
    return jsonResponse({ ok: false, error: "invalid_extension" }, 400);
  }
  const filePath = join(DATA_DIR, character, filename);
  // Final containment check
  if (!resolve(filePath).startsWith(resolve(join(DATA_DIR, character)) + "/")) {
    return jsonResponse({ ok: false, error: "path_traversal" }, 400);
  }
  if (!existsSync(filePath)) {
    return jsonResponse({ ok: false, error: "not_found" }, 404);
  }
  const st = await stat(filePath);
  // Bun supports passing Node ReadStream as a Response body
  const stream = createReadStream(filePath);
  return new Response(stream as unknown as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": MIME_BY_EXT[ext as AudioExtension],
      "Content-Length": String(st.size),
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

async function handleHealth(): Promise<Response> {
  const all = await readSubmissions();
  return jsonResponse({
    ok: true,
    submissions: all.length,
    uptime: Math.floor((Date.now() - STARTED_AT) / 1000),
  });
}

// ---------- Router ----------
async function route(req: Request, ip: string): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (method === "POST" && path === "/voice-uploads/api/submit") {
    return handleSubmit(req, ip);
  }
  if (method === "GET" && path === "/voice-uploads/api/list") {
    return handleList(url);
  }
  if (method === "GET" && path === "/voice-uploads/api/health") {
    return handleHealth();
  }
  // /voice-uploads/files/:character/:filename
  const fileMatch = path.match(/^\/voice-uploads\/files\/([^/]+)\/([^/]+)$/);
  if (method === "GET" && fileMatch) {
    return handleFile(decodeURIComponent(fileMatch[1]), decodeURIComponent(fileMatch[2]));
  }

  return jsonResponse({ ok: false, error: "not_found", path }, 404);
}

// ---------- Bootstrap ----------
await ensureStorage();

const server = Bun.serve({
  port: PORT,
  // Enforce upload cap at the runtime level too
  maxRequestBodySize: MAX_FILE_SIZE + 1 * 1024 * 1024,
  async fetch(req) {
    const ip = clientIp(req, server);
    const origin = req.headers.get("origin");
    const cors = corsHeaders(origin);
    try {
      const res = await route(req, ip);
      // Merge CORS headers (don't clobber existing)
      for (const [k, v] of Object.entries(cors)) {
        if (!res.headers.has(k)) res.headers.set(k, v);
      }
      log(ip, req.method, new URL(req.url).pathname, `→ ${res.status}`);
      return res;
    } catch (err) {
      log(ip, req.method, new URL(req.url).pathname, `ERROR: ${(err as Error).message}`);
      return new Response(JSON.stringify({ ok: false, error: "internal" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }
  },
});

// eslint-disable-next-line no-console
console.log(`[rob-voices] listening on :${server.port} — DATA_DIR=${DATA_DIR}`);
