# Audit 05 — In-Game Guidance & UX

**Versie**: RoB v0.37.2 | **Datum**: 2026-04-17 | **Scope**: Placement hints, error copy, tooltips, tutorial hooks, minimap, a11y

---

## 1. Inventaris — wat is er AL

| Element | Bestand | Status |
|---------|---------|--------|
| Placement error alerts | `BuildSystem.ts:62-125` | ✅ NL strings |
| Unit-tooltips | `HUD.ts:2094-2209` | ✅ HP/DPS/speed/cost/bouwtijd |
| Building-tooltips | `HUD.ts` | ✅ trainlist/cost/HP |
| Hotkey-hints | `HUD.ts` (Q/E/R/T/F/G/Z/X) | ✅ consistent op worker-menu |
| Selection circles | `SelectionRenderer.ts` | ✅ |
| Health bars | `SelectionRenderer.ts` | ✅ kleur-gebaseerd |
| Box-select | `SelectionRenderer.ts` | ✅ groen dashed |
| Mode indicator | `HUD.ts:450` | ✅ "ESC om te annuleren" |
| Rally-point tooltip | `HUD.ts` | ✅ |
| Tier-lock class + tooltip | `HUD.ts` | ✅ "Vereist: Smederij" |
| Feedback-modal | `FeedbackReporter.ts` | ✅ 3-staps met screenshots |
| Campaign briefing | `CampaignUI.ts` | ✅ pre-mission |

---

## 2. Gaps per subsysteem

### 2.1 Building Placement — KRITIEK
- ❌ Geen ghost-model onder cursor.
- ❌ Geen kleur-feedback (groen/rood).
- ❌ Geen highlight van nearby resources (bij LumberCamp).
- ❌ Geen path-to-rules: speler leert rules alleen via error.
- ❌ Errors tonen geen afstand-context ("te dicht bij enemy" — welke? hoe ver?).

### 2.2 Rally Point — MEDIUM
- ❌ Geen path-preview building → rally.
- ❌ Geen marker op rally-locatie.
- ❌ Geen cursor-change in rally-mode.
- ❌ Geen confirmation na set.

### 2.3 Resource Gathering — LAAG
- ❌ Cursor-feedback: geen sword/hand/build-icons.
- ❌ Hover-tooltip op resources ontbreekt ("Rechts-klik om hout").
- ❌ Resource-shortfall geeft geen breakdown (`"Onvoldoende goud"` → zou moeten zijn `"Nodig 50g, hebt 35g, tekort 15g"`).

### 2.4 Unit Training — LAAG
- ❌ "Population cap reached" zonder pop/cap-display in context.
- ❌ Training-tooltip toont geen pop-cost: moet `"Boer | 50g/20h | pop 1/15"` worden.

### 2.5 Tech Tree — LAAG
- ❌ Tooltip zegt "Vereist: Smederij" maar niet of speler die al gebouwd heeft.
- ❌ Geen mini tech-tree view zichtbaar tijdens spel.

### 2.6 Campaign/Tutorial — KRITIEK
- ❌ GEEN tutorial-mission gevonden.
- ❌ Geen in-mission hints (dynamic coaching).
- ❌ Fail-state toont Game Over zonder retry-tips.
- ❌ Minimap toont units/buildings maar geen resources/rally points.

### 2.7 Copy Quality
Huidige error-strings zijn correct NL, maar niet actionable. Zie §4.

### 2.8 Minimap
- ✅ Allied/enemy units, buildings.
- ❌ Resource nodes.
- ❌ Rally points.
- ❌ Legend.

### 2.9 Accessibility
- ❌ Geen colorblind-mode (rood/groen health bars).
- ❌ Geen UI-scale slider.
- ❌ Audio-cues inconsistent bij warnings.

---

## 3. Top-10 Quick-Wins (prio + effort)

| # | Feature | Prio | Impact | Effort |
|---|---------|------|--------|--------|
| 1 | Building placement ghost (groen/rood) | KRIT | ⭐⭐⭐⭐ | 4h |
| 2 | Tutorial mission (5 stappen) | KRIT | ⭐⭐⭐⭐ | 6h |
| 3 | Rally path preview + marker | HIGH | ⭐⭐⭐ | 3h |
| 4 | Context-aware errors (afstand/target-name) | HIGH | ⭐⭐⭐ | 2h |
| 5 | Nearby-wood highlight bij LumberCamp | HIGH | ⭐⭐⭐ | 2h |
| 6 | Resource-shortfall breakdown | MED | ⭐⭐ | 1h |
| 7 | Cursor feedback (sword/hand/build) | MED | ⭐⭐ | 2h |
| 8 | Tier-lock status in tooltip ("Gebouwd ✓/✗") | MED | ⭐⭐ | 1h |
| 9 | Minimap resource + rally markers | MED | ⭐⭐ | 2h |
| 10 | Colorblind-mode + UI-scale | LOW | ⭐ | 3h |

---

## 4. Error-Copy Upgrade (Brabants ipv generiek)

| Huidig | Voorstel | Extra UI |
|--------|----------|----------|
| "Kan niet bouwen op water" | "Dat gaat niet in 't water, makker." | n.v.t. |
| "Overlapt met een bestaand gebouw" | "Daar staat al wat. Zoek 'n ander plekkie." | highlight conflicting building |
| "Te dicht bij een vijandelijk gebouw" | "Te dicht op 't vijandige bouwwerk [X stappen te kort]. Ga minsten 8 stappen verder." | range-ring rond enemy |
| "Houtkamp moet binnen 20 eenheden van bomen staan" | "Zet die houtzagerij bij de bomme [dichtste: 34 stappen weg]. Anders doet 't niks." | highlight trees |
| "Population cap reached" | "Je kasteel is vol [15/15]. Bouw huizen om uit te breiden." | knipperend pop-counter |
| "Insufficient gold" | "Te weinig worstenbroodjes. Nodig 50, hebt 35, tekort 15." | resource-glow |

---

## 5. Tutorial-Mission Blueprint

**Fase 1 — Cinematic intro (30s)**
- Voice-over Brabants (reuse voice-studio): "De worstenbroodjes zijn gestolen — en wie krijgt de schuld? Wij, natuurlijk."
- Mission briefing tekst.

**Fase 2 — Guided first mission (5 stappen)**
```
Step 1 Hint: "Klik op je eerste boer (de groene highlight)."
    Trigger: selection change → worker selected.
    Feedback toast: "Boer geselecteerd. Volgende..."

Step 2 Hint: "Rechts-klik op 'n boom om hout te halen."
    Trigger: worker assigned gather-wood target.
    Feedback toast: "+10 hout!"

Step 3 Hint: "Bouw 'n kazerne. Selecteer 't kasteel, druk Q."
    Trigger: TownHall selected AND build-mode Barracks.
    Feedback toast: "Placement-mode. Kies 'n plek."

Step 4 Hint: "Plaats de kazerne dichtbij 't kasteel."
    Trigger: building placed.
    Feedback toast: "Bouw loopt... 20 seconden."

Step 5 Hint: "Train 5 soldaten. Klik E op de kazerne."
    Trigger: production queue ≥ 5 soldaten.
    Feedback toast: "Training!" + show queue.
```

**Fase 3 — Dynamic in-mission hints**
- Onder attack → toast "Bouw torens voor verdediging."
- Resource-depletion nearby → toast "Zoek 'n nieuw bomen-gebied."
- Objective-progress: "5/20 soldaten getraind. Doel: 20."

**Fase 4 — Fail-state coaching**
- Game over → toast met 3 specifieke tips op basis van fail-cause:
  - Te weinig housing → "Bouw vroeger Huuskes."
  - Enemy overrun → "Meer units, dichter bij kasteel."
  - Resource-bankrupt → "Plaats houtzagerij direct bij bomen."

---

## 6. Implementatie-richtlijnen

### 6.1 Ghost-renderer (#1)
- Nieuw: `src/rendering/BuildingGhostRenderer.ts`
- Hook in `Game.ts:onBuildMode()`
- Per frame: `validateBuildingPlacement(cursorX, cursorZ)` → tint (groen/rood) + update halftransparant mesh.
- Error-string → toast boven ghost.

### 6.2 Tutorial (#2)
- Nieuw: `src/campaign/TutorialMission.ts` + `src/ui/TutorialUI.ts`.
- State-machine: array van steps met `{hint, trigger: () => boolean, feedback}`.
- Persistent in localStorage (skip-button).

### 6.3 Rally Preview (#3)
- In `SelectionRenderer.ts`: `renderRallyPath(buildingPos, rallyPos)` met `THREE.Line2`.
- Update bij rally-component change.

### 6.4 Context-errors (#4)
- `BuildSystem.validateBuildingPlacement` retourneert `{ valid, reason, data: { distance, targetName, etc. } }` ipv alleen string.
- HUD gebruikt `data` voor geformuleerde toast.

---

## 7. Testing Checklist

- [ ] Ghost volgt cursor.
- [ ] Groen/rood toggelt op basis van validatie.
- [ ] LumberCamp-ghost highlight trees.
- [ ] Errors tonen afstand-context.
- [ ] Tutorial 5 stappen completeerbaar zonder warnings.
- [ ] Rally-path zichtbaar na set.
- [ ] Minimap-resources verschijnen bij resource-entities spawn.
- [ ] Tier-tooltip toggles "Gebouwd ✓" correct.
- [ ] Colorblind-mode toggleable via settings.

---

## 8. Prioriteitsmatrix

| Subsysteem | Prio | Impact | Effort |
|-----------|------|--------|--------|
| Placement ghost | KRIT | ⭐⭐⭐⭐ | MED |
| Tutorial | KRIT | ⭐⭐⭐⭐ | HIGH |
| Rally preview | HIGH | ⭐⭐⭐ | MED |
| Context-errors | HIGH | ⭐⭐⭐ | LOW |
| Resource shortfall | MED | ⭐⭐ | LOW |
| Cursor feedback | MED | ⭐⭐ | LOW |
| Tech tree mini-view | LOW | ⭐⭐ | HIGH |
| Minimap resources | LOW | ⭐⭐ | MED |
| A11y | LOW | ⭐ | MED |

---

## 9. Conclusie

Game voelt "guessy" zonder placement-preview + tutorial. Alles wat in de codebase OVER placement bestaat is error-after-the-fact — speler leert door falen. Dat is acceptabel voor één mechanic, maar hier zijn 8+ mechanics die zo gepresenteerd worden.

**Start**: #1 (ghost) en #2 (tutorial). Samen 10 uur → nieuwe-speler-retentie vermoedelijk significant omhoog.

---

**Einde audit 05.**
