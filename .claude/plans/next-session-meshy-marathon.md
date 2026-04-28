# Volgende sessie: Bundel 5 — Meshy v6 marathon (12 GLBs)

**Versie target**: v0.37.36 → v0.37.39 (gespreid per factie)
**Voorbereiding**: 2026-04-28 (na Bundel 3 deploy v0.37.35), Richard akkoord 2026-04-28
**Aanpak**: Gerichte Meshy v6 image-to-3D batch om visuele dubbele-meshes weg te werken. Per factie 3 nieuwe GLBs (TertiaryResource + UpgradeBuilding + FactionSpecial1) → BuildingRenderer rewire → deploy.
**Werkwijze**: pre-deploy regression gate (`npm run test:all`) blokkeert breakage. Per factie een version-bump + live-test-window (1-2 minuten checken in skirmish).

---

## Status nu (na v0.37.35)

12 building-types met `lumbercamp.glb` of `blacksmith.glb` als fallback:

| Type | Brabant | Randstad | Limburg | Belgen |
|------|---------|----------|---------|--------|
| **TertiaryResource** | (n.v.t. Bundel 4A) | Havermoutmelkbar — `lumbercamp.glb` | Mijnschacht — `lumbercamp.glb` | Chocolaterie — `lumbercamp.glb` |
| **UpgradeBuilding** | Wagenbouwer — `blacksmith.glb` | Innovatie Lab — `blacksmith.glb` | Hoogoven — `blacksmith.glb` | Diamantslijperij — `blacksmith.glb` |
| **FactionSpecial1** | Carnavalstent — `lumbercamp.glb` | Boardroom — `lumbercamp.glb` | Vlaaiwinkel — `lumbercamp.glb` | Diplomatiek Salon — `lumbercamp.glb` |

= **12 unieke GLBs nodig**. Brabant TertiaryResource (Worstenbroodjeskraam) bestaat archetype-data nog niet — zit in Bundel 4A en is uitgesteld.

**Richard-feedback (live-test v0.37.35)**: "Klopt dat starbucks, boardroom en havermoutbar nu nog dezelfde buildings zijn?" — actief verwarrend in gameplay. Boardroom click-actie kan niet getarget zonder visuele identifier.

---

## Pre-flight (5 min)

1. `/session-start` — laadt context, runt UAT/typecheck baseline.
2. Lees deze plan-file + `BACKLOG.md`.
3. `npm test` — bevestig 1152 groen.
4. Bevestig Meshy Studio API-key in `.env` (`MESHY_API_KEY`). Per memory: gebruik **altijd v6 production image-to-3D**, **nooit preview**.
5. Test 1 baseline Meshy v6 call (sync endpoint) om credits/quota te valideren.

---

## Bundel 5A — Concept-art briefs (~30 min)

Per gebouw een 1024×1024 isometrische top-down concept-art (Flux Dev) als input voor Meshy image-to-3D. **NIET** een gerenderde 3D scene — een dia-graph stijl 2D image waar Meshy een mesh van kan extraheren.

### Aanpak per concept-art image
- **Stijl-template** (gevalideerd in Bundel 2.5 + 3 portrait-batches):
  ```
  "isometric top-down 3/4 view game asset, single building [SUBJECT],
   centered on transparent or simple gray background, low-poly stylized,
   no characters, no text, fantasy RTS art, painted clean linework"
  ```
- **Per factie color-palette guidance** (pakt door naar latere Meshy-mesh-tinting):
  - Brabant: oranje/rood/geel (carnavalsthema)
  - Randstad: blauw/glas/staal
  - Limburg: warm bruin/mergel/hout
  - Belgen: zwart/goud/bordeaux
- **Aspect**: 1:1 vierkant, frontal-3/4 perspectief (Meshy verwacht dit).

### Concept-art lijst (12)

**TertiaryResource × 3** (Brabant n.v.t.):
1. `randstad-tertiary` — Havermoutmelkbar (modern juice-bar facade, glas + plant-decoratie)
2. `limburg-tertiary` — Mijnschacht (mergel-stenen toren met rails + mijnkar)
3. `belgen-tertiary` — Chocolaterie (Belgisch winkelpand met chocolade-vitrine)

**UpgradeBuilding × 4**:
4. `brabant-upgrade` — Wagenbouwer (boerderij-werkplaats met wiel-onderdelen)
5. `randstad-upgrade` — Innovatie Lab (futuristisch glazen kubus + servers)
6. `limburg-upgrade` — Hoogoven (industriële schoorsteen + mergel-buitenwand)
7. `belgen-upgrade` — Diamantslijperij (art-deco juwelierswerkplaats)

**FactionSpecial1 × 4**:
8. `brabant-faction1` — Carnavalstent (oranje-rode tent met vlag)
9. `randstad-faction1` — Boardroom (modern kantoor-paviljoen met groot raam)
10. `limburg-faction1` — Vlaaiwinkel (cozy bakkerij met houten luifel)
11. `belgen-faction1` — Diplomatiek Salon (klassieke ambassade-stijl met zuilen)

### Output-pad
`/Users/richardtheuws/Documents/games/reign-of-brabant/public/assets/concepts/buildings/<key>.png`

### Asset Generator agent
Spawn één Asset Generator agent met de hele lijst. Verwacht: ~12 generaties × 10s = ~2 min API-tijd.

---

## Bundel 5B — Meshy v6 image-to-3D batch (~90 min)

Per concept-art één Meshy-call. Production-quality (geen preview), realistic textures (per memory `feedback_meshy_quality.md`).

### Pipeline per GLB
1. Upload concept-art image via Meshy API.
2. Sync image-to-3D call (geen polling — direct response in v6).
3. Download GLB → save naar `/public/assets/models/v02/<faction>/<key>.glb`.
4. Verify: file-size > 50KB (sanity-check), open in `/animation-preview.html` als spot-check.

### Output-naming
- `randstad/tertiary.glb` (was: lumbercamp.glb fallback)
- `limburg/tertiary.glb`
- `belgen/tertiary.glb`
- `brabant/upgrade.glb` (was: blacksmith.glb fallback)
- `randstad/upgrade.glb`
- `limburg/upgrade.glb`
- `belgen/upgrade.glb`
- `brabant/special1.glb` (was: lumbercamp.glb fallback)
- `randstad/special1.glb`
- `limburg/special1.glb`
- `belgen/special1.glb`

### Asset Generator agent (Meshy-mode)
Aparte agent-call met expliciete instructie om Meshy v6 production image-to-3D te gebruiken (per agent-memory). Verwacht: 12 × ~3 min = ~36 min API-tijd.

**Risico**: Meshy quota-limiet of credit-uitputting. Mitigatie: doe per factie 3 GLBs, deploy, test, dan volgende. Splits in 4 sub-deploys (v0.37.36/37/38/39).

---

## Bundel 5C — BuildingRenderer rewire + tests (~30 min)

### Source-wijzigingen
**File**: `src/rendering/BuildingRenderer.ts:14-122` (BUILDING_MODEL_PATHS_V02 + V01 fallback maps).

Per factie 3 entries flippen van `lumbercamp.glb` of `blacksmith.glb` naar de nieuwe `tertiary.glb` / `upgrade.glb` / `special1.glb`. Voorbeeld:
```diff
- 'tertiary_1': '/assets/models/v02/randstad/lumbercamp.glb',
+ 'tertiary_1': '/assets/models/v02/randstad/tertiary.glb',
- 'upgrade_1': '/assets/models/v02/randstad/blacksmith.glb',
+ 'upgrade_1': '/assets/models/v02/randstad/upgrade.glb',
- 'special1_1': '/assets/models/v02/randstad/lumbercamp.glb',
+ 'special1_1': '/assets/models/v02/randstad/special1.glb',
```

### V01-fallback (legacy v01 path map)
Behoud `lumbercamp.glb`/`blacksmith.glb` als V01-fallback (zonder de v02-changes). Dit is de "oude versie" pad voor Safari-rendering issues. Niet aanraken.

### Tests (+~12)
**Nieuw**: `tests/BuildingRenderer-mesh-uniqueness.test.ts`

Per factie assert dat de 11 building-types **11 unieke GLB-paden** hebben. Voorkomt dat een toekomstige refactor weer fallbacks introduceert. ~12 tests (4 facties × 3 type-combinaties + cross-faction sanity).

```ts
it('Randstad has 11 unique GLB paths in V02 map', () => {
  const randstadPaths = Object.entries(BUILDING_MODEL_PATHS_V02)
    .filter(([k]) => k.endsWith('_1'))
    .map(([, v]) => v);
  expect(new Set(randstadPaths).size).toBe(randstadPaths.length);
});
```

---

## Bundel 5D — Per-factie deploy-rotatie (~30 min)

Vier mini-deploys, één per factie:
1. **v0.37.36** — Brabant 3 GLBs gewired → deploy → live-test (klik tour van Wagenbouwer/Carnavalstent in skirmish met Brabant)
2. **v0.37.37** — Randstad 3 GLBs → deploy → live-test
3. **v0.37.38** — Limburg 3 GLBs → deploy → live-test
4. **v0.37.39** — Belgen 3 GLBs → deploy → live-test

Per deploy:
- `npm run test:all` (gate)
- bump package.json + CHANGELOG entry (kort, focussed op factie-update)
- `bash deploy-rob.sh`
- `curl -s https://reign-of-brabant.nl/play/ | grep "factionSpecial"` (sanity)
- Hard-refresh + 30s skirmish met die factie + Richard-confirmation

**Waarom 4 deploys**: rollback-granularity. Als Belgen-mesh een visual bug heeft die Brabant niet had, kunnen we precies tot v0.37.38 rollbacken zonder Brabant-werk te verliezen.

---

## Werkvolgorde (start hier bij sessie-begin)

### Pre-flight (5 min)
1. `/session-start`
2. Lees `next-session-meshy-marathon.md` + `BACKLOG.md`
3. Bevestig Meshy Studio API + credits

### Bundel 5A (~30 min)
4. Spawn Asset Generator agent voor 12 concept-art images
5. Wacht op completion (~2 min API + visual review)
6. Spot-check 2-3 images, regenerate als kwaliteit tegenvalt

### Bundel 5B (~90 min)
7. Spawn Asset Generator agent (Meshy-mode) voor 12 GLBs
8. Per factie batch (3 GLBs tegelijk per call)
9. Verifieer file-sizes + visual spot-check via `/animation-preview.html`

### Bundel 5C (~30 min)
10. BuildingRenderer.ts rewire (12 path-flips)
11. Schrijf `BuildingRenderer-mesh-uniqueness.test.ts` (12 tests)
12. Run `npm test` → groen

### Bundel 5D (~30 min)
13. Deploy v0.37.36 (Brabant) → live-test
14. Deploy v0.37.37 (Randstad) → live-test
15. Deploy v0.37.38 (Limburg) → live-test
16. Deploy v0.37.39 (Belgen) → live-test
17. Update updates-pagina entry voor v0.37.36-39 (één combined entry "Bundel 5: alle 12 GLBs uniek")

### Sessie-end
18. `/session-end` — werk bevindingen in memory in
19. Backlog-update: 12-GLB item naar Resolved sectie

---

## Risico's + mitigaties

| Risico | Mitigatie |
|--------|-----------|
| Meshy v6 produceert lelijke mesh voor een specifiek concept | Regenerate met aangepaste concept-art (max 2 retries). Bij 3e fail: live met huidige fallback, item terug naar backlog voor fine-tuning. |
| Meshy API quota-uitputting | Splits in 2 sessies (8 GLBs + 4 GLBs). Per memory: Meshy Studio abonnement geeft hogere credit-limit. |
| BuildingRenderer-rewire breekt bestaande tests | Pre-deploy gate vangt; per-factie deploy isoleert blast-radius. |
| Visual inconsistentie tussen v02 nieuwe + v01 fallback | V01 wordt alleen op Safari-fallback ingezet; per memory weinig users. Document in CHANGELOG. |
| Concept-art Flux genereert 3D-look ipv 2D | Stijl-template expliciet "low-poly stylized, painted clean linework" — geen "rendered" of "3D" termen. |

---

## Verwachte impact (totaal Bundel 5)

| Metric | Voor | Na | Delta |
|--------|------|-----|-------|
| GLB-bestanden | 28 unique meshes | 40 unique meshes | +12 |
| Visuele dubbele-meshes | 12 (3/factie) | 0 | -100% |
| Test-suite | 1152 | ~1164 | +12 |
| Build-size impact | ~600KB GLBs nu | ~1.0-1.2MB GLBs | +400-600KB (acceptabel) |
| Sessie-runtime | — | 3-3.5 uur | |
| Deploys | — | 4 (gate-gated, per factie) | |

---

## Na Bundel 5

**Bundel 4** wordt dan de logische opvolger:
- 4A: Brabant Worstenbroodjeskraam (nieuwe TertiaryResource archetype + +0.5 Gezelligheid/sec passive)
- 4B: Per-gebouw smoke UAT (44 tests = 11 types × 4 facties)
- 4C: Mesh-audit doc → kan grotendeels Resolved worden gemarkeerd na Bundel 5

Per memory: Brabant TertiaryResource is leeg slot (Gezelligheid is proximity-based via GezeligheidSystem, niet building-based). Worstenbroodjeskraam vult dat gat op zonder de bestaande mechaniek te breken.

---

## Open vragen voor Richard (begin sessie)

1. **Akkoord 4 mini-deploys vs 1 big-bang?** Aanbeveling: 4 mini-deploys (rollback-granularity).
2. **Welke factie eerst?** Aanbeveling: Brabant (jouw woonregio, snelste live-feedback).
3. **Concept-art stijl preferentie?** Isometric 3/4 view of pure side-view? Aanbeveling: 3/4 isometric (meeste Meshy-quality).
4. **Mag Asset Generator parallel agent draaien terwijl ik BuildingRenderer-tests schrijf?** Aanbeveling: ja (zelfde pattern als Bundel 2.5/3).
