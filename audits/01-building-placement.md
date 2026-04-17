# Audit 01 — Building Placement Validation

**Versie**: RoB v0.37.2 | **Datum**: 2026-04-17 | **Scope**: Alle placement-regels + zichtbaarheid voor speler

---

## 1. Root-Cause per Bug

### Bug A — "Mill moet binnen 20 eenheden van wood" zonder guide
**Bestand**: `src/systems/BuildSystem.ts:100-122`
**Status**: Regel werkt correct, maar is **onzichtbaar voor speler**.

- LumberCamp moet ≤ 20 units van een `ResourceType.Wood` entity staan.
- Error string (`BuildSystem.ts:120`): *"Houtkamp moet binnen 20 eenheden van bomen staan"*
- **Gap**: geen ghost-preview, geen resource-highlight, geen "nearest wood"-indicator. HUD toont alleen een alert NA de click.
- Copy-detail: string zegt "eenheden" maar game gebruikt intern "stappen"/"units" — speler weet niet welke schaal.

**Call-path**: `Game.ts:1758 → BuildSystem.validateBuildingPlacement() → Game.ts:1760 (alert via HUD)`

### Bug B — Bruggen kunnen overal geplaatst worden
**Bestand(en)**: `src/systems/BuildSystem.ts` (ontbrekende check) + `src/world/Terrain.ts:354-360` (dode API)
**Status**: Rivier-detectie BESTAAT maar wordt NOOIT aangeroepen bij plaatsing.

- `Terrain.ts:354-360` implementeert `isRiver(x,z)` (checkt `riverMask`).
- `BuildSystem.validateBuildingPlacement()` roept `isRiver()` nooit aan.
- Water-fallback (`BuildSystem.ts:61-68`): `getHeightAt(x,z) < 0.1` — te ruw, mist rivieren.
- `DefenseTower` (en mogelijk een dedicated `Bridge` type) heeft géén rivier-constraint in de rule-set.
- Secondaire bug: `Terrain.isWater()` wordt als optional in de signature genoemd maar is niet geïmplementeerd op de klasse.

**Gevolg**: brug / verdedigingstoren wordt overal geaccepteerd behalve op expliciete water-tiles (en zelfs die fallback is onbetrouwbaar).

---

## 2. Placement-Rules Matrix (intended vs implemented vs visible)

| Building | Intended rule (PRD) | Implemented | Zichtbaar | Note |
|----------|--------------------|-------------|-----------|------|
| TownHall | Pre-placed only | Collision+enemy-dist | ✅ | OK |
| Barracks | Standard | Water+collision+enemy | ✅ | OK |
| LumberCamp | ≤20u van wood | ✅ logic | ❌ geen UI | **Bug A** |
| Blacksmith | Standard | Standard | ✅ | OK |
| Housing | Standard | Standard | ✅ | OK |
| TertiaryResourceBuilding | Standard (nabij tertiair?) | Standard, geen proximity | ⚠️ | Mogelijk gap |
| UpgradeBuilding | Standard | Standard | ✅ | OK |
| FactionSpecial1 | Faction-specifiek? | Standard | ⚠️ | Gap |
| FactionSpecial2 | Faction-specifiek | Standard | ⚠️ | Gap |
| DefenseTower | ~~Op river-tile~~ (zie bug B) | Standard, geen river-check | ❌ | **Bug B** |
| SiegeWorkshop | Standard, tier 3 | Standard (tier via TechTree) | ✅ | Tier OK |

Legend: ✅ werkt + zichtbaar · ⚠️ werkt maar onduidelijk · ❌ werkt niet of onzichtbaar

---

## 3. Rules-die-ontbreken (gap-analyse)

| Building | Ontbrekende regel | Bron (PRD) | Impact |
|----------|------------------|-----------|--------|
| Bridge/DefenseTower | Must-be-on-river | PRD §2 | Breekt kaartstrategie |
| Farm (als komt) | Nabij water/molen | PRD | Dependency-bug patroon |
| Mine/Quarry | Op resource-tile | PRD | Zelfde patroon als LumberCamp |
| Walls | Adjacent to walls/gates | PRD | Line-placement ontbreekt volledig |
| Randstad-gebouwen | Network-connected | PRD faction | Faction-unique niet verwerkt |

---

## 4. Stemming Bugs (zelfde patroon elders)

1. **"Rule zonder visual"**: elke regel in `BuildSystem` heeft enkel een error-string, geen preview-hook — dus LumberCamp-style onzichtbaarheid keert terug bij elke toekomstige regel (mine, farm, faction-special).
2. **"Terrain API half-af"**: `isWater` belooft maar niet geleverd; `isRiver` bestaat niet als rule-integratie. Zelfde risico voor toekomstige `isCliff`, `isSwamp`.
3. **Hard-coded if-blok in validator**: de LumberCamp-check is een inline `if buildingTypeId === LumberCamp`. Voegt een nieuw gebouw toe → nieuwe if. Schaalt niet.
4. **Faction-specifieke regels ontbreken**: in `src/factions/` staat geen override-hook voor placement. FactionSpecial2 gebruikt dezelfde defaults — wat betekent dat unique factie-gebouwen die WEL regels zouden moeten hebben (Parkeergarage op straat-tiles?) er geen krijgen.

---

## 5. Fix-Approach (geen code — alleen plan)

**P0 (kaartstrategie)**
1. Implementeer `Terrain.isWater()` of laat validator direct `terrain.isRiver()` aanroepen.
2. Voeg bridge-rule toe: introduceer een dedicated `Bridge` building-type of check op DefenseTower wanneer die bridge-semantiek krijgt. Rule: "Moet in adjacent-cell van river-tile staan."

**P1 (UX — rule zichtbaar maken)**
3. Ghost-renderer koppelen aan `validateBuildingPlacement` — groen/rood tint per frame.
4. Bij LumberCamp-ghost: highlight alle wood-entities binnen 20u als ringen op terrain.
5. Error-strings upgraden met afstand-context: "Dichtste wood: 34u weg. Plaats dichterbij."

**P2 (architectuur)**
6. Refactor `validateBuildingPlacement` naar rule-registry per `buildingTypeId`:
   ```
   rules[BuildingTypeId.LumberCamp] = [collision, enemyDist, proximity(Wood, 20)]
   rules[BuildingTypeId.Bridge]     = [adjacentToRiver]
   ```
7. Rules krijgen een `describe()` method voor tooltip + ghost-overlay.
8. Per-faction overrides via `factions/<faction>.ts`.

---

## 6. Bestanden aangeraakt tijdens audit

| File | Regels | Rol |
|------|--------|-----|
| `src/systems/BuildSystem.ts` | 53-125 | Source of truth placement |
| `src/world/Terrain.ts` | 354-360 | `isRiver` (ongebruikt) |
| `src/core/Game.ts` | 1758-1760 | Placement-caller en HUD-alert |
| `src/entities/archetypes.ts` | 372-518 | Building defs, geen rules veld |
| `src/ui/HUD.ts` | (geen ghost hook) | UX-gap |
| `src/rendering/BuildingRenderer.ts` | — | Geen `validIndicator` call |

---

## 7. Risico's als niks gebeurt

- Spelers bouwen willekeurig → strategische map-layer verdwijnt (bruggen over land).
- Mill-regel wordt "lore" tussen spelers ipv zichtbare mechanic.
- Elke nieuwe factie-gebouwsoort erft dezelfde UX-gap.

---

**Einde audit 01.**
