# Backlog — bevindingen onderweg

Gestart **2026-04-28** tijdens Bundel 1 sessie. Alles wat we *onderweg* tegenkomen
en niet in scope is van de huidige bundel landt hier, gesorteerd op prioriteit.

Iedere entry: **datum-gevonden | tijdens-bundel | status | beknopte beschrijving**.
Bij oppakken: subject + commit-SHA invullen onder "Resolved".

---

## 🔴 P0 / P1 — game-breakers of wrong-state bugs

### Chocolaterie heeft verkeerde `typeId` — genereert geen Chocolade
- **Gevonden**: 2026-04-28 tijdens Belgen-mapping (post-Bundel 1)
- **Bundel-fit**: Bundel 4A (Brabant Worstenbroodjeskraam adds Brabant TertiaryResource case — natuurlijke plek om Belgen te fixen).
- **Bug**: `factionData.ts:1296` — Chocolaterie archetype heeft `typeId: BuildingTypeId.LumberCamp` ipv `BuildingTypeId.TertiaryResourceBuilding`. Hij genereert geen Chocolade omdat TertiaryResourceSystem (regel 41) op typeId filtert.
- **Verificatie nodig**: idem check voor Randstad Havermoutmelkbar + Limburg Mijnschacht — mogelijk dezelfde bug.
- **Test-lock**: nieuwe `tests/tertiary-resource-archetype.test.ts` die voor elk van de 4 facties asserteert dat de TertiaryResource-naamgeving (`Worstenbroodjeskraam`/`Havermoutmelkbar`/`Mijnschacht`/`Chocolaterie`) hoort bij `BuildingTypeId.TertiaryResourceBuilding`.

---

## 🟡 P2 — kwaliteitsverbeteringen / tooling

### Game-deployer agent memory niet bijgewerkt na 3D-landing restore
- **Gevonden**: 2026-04-28 (sessie-start, na Game Deployer agent run)
- **Bundel-fit**: post-deploy housekeeping, geen bundel-blokker.
- **Issue**: `.claude/agents/memory/game-deployer.md` permission-denied tijdens agent-run. Mist nu (a) deploy-entry van 3D landing restore, (b) waarschuwing dat `--landing-page` flag de 3D versie destructief overschrijft.
- **Actie**: handmatige update van die memory file.

### `deploy-ftp.sh --landing-page` is een footgun
- **Gevonden**: 2026-04-28 (sessie-start, oorzaak van 3D-landing verlies)
- **Bundel-fit**: tooling-cleanup, los van game-bundels.
- **Issue**: `--landing-page` flag (deploy-ftp.sh:60) uploadt de lokale statische `landing-page.html` als `index.html`, wat de 3D Game World destructief overschrijft. Geen waarschuwing, geen confirm, geen versiecheck.
- **Voorstel**: óf rename naar `--legacy-landing` met confirm-prompt, óf vervang door `--3d-landing` flag die `3d-landing/dist/` deployt. Bespreken met Richard.

---

## 🟢 P3 — visuele upgrades / mesh-batch

### Meshy v6 batch — 12 ontbrekende GLBs (4 facties × 3 building-types)
- **Gevonden**: 2026-04-28 tijdens Belgen-mapping
- **Bundel-fit**: **Bundel 4C** plant dit als mesh-audit *doc* (queue-only). Reële uitvoering = **nieuwe Bundel 5** Meshy-marathon (één sessie, batch-prompting, één BuildingRenderer-rewire-PR).
- **Scope**:
  - **HOOG: UpgradeBuilding × 4** — alle 4 facties gebruiken nu `<faction>/blacksmith.glb` als fallback (speler ziet 2× dezelfde Smederij). Brabant=?, Randstad=?, Limburg=?, Belgen=Diamantslijperij.
  - **HOOG: FactionSpecial1 × 4** — alle 4 gebruiken nu `<faction>/lumbercamp.glb`. Carnavalstent / Boardroom / Vlaaiwinkel / Diplomatiek Salon. Archetypes komen in Bundel 3.
  - **MEDIUM: TertiaryResource × 4** — alle 4 gebruiken nu `<faction>/lumbercamp.glb`. Worstenbroodjeskraam / Havermoutmelkbar / Mijnschacht / Chocolaterie. Brabant-archetype komt in Bundel 4A.
- **Aanpak**: per gebouw concept-art prompt (image generatie) → Meshy v6 production image-to-3D → GLB + faction-aesthetic check → BuildingRenderer.ts:56-70 primary-path update → render-test in skirmish.
- **Volgorde**: na Bundel 4 (alle archetypes + functies LIVE), zodat we tegelijk visueel sluiten.

---

## ✅ Resolved

(leeg — vul in bij oppakken met datum + commit-SHA)

---

## 🛒 Plan-discipline-regel (afgesproken 2026-04-28)

> **"Plan respecteren + alle 'extra' findings → direct in deze backlog, oppakken zodra we er aan toe komen."**

Niet onderweg uitbreiden van de huidige bundel-scope; ander werk blokkeert
momentum. Backlog wordt elke bundel-end-of-session geconsulteerd.
