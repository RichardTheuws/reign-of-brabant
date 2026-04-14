# PRD: Reign of Brabant v1.0

**Van PoC naar Release** | Versie 1.0 | 14 april 2026
**Huidige versie**: v0.32.0 (Proof of Concept)
**Doel**: Een complete, speelbare, gepolijste browser-based RTS

---

## Inhoudsopgave

1. [Huidige Staat](#1-huidige-staat)
2. [Visie v1.0](#2-visie-v10)
3. [Sprint 1: Tutorial & Onboarding](#3-sprint-1-tutorial--onboarding)
4. [Sprint 2: Buildings & Tech Tree](#4-sprint-2-buildings--tech-tree)
5. [Sprint 3: Units, Combat & Abilities](#5-sprint-3-units-combat--abilities)
6. [Sprint 4: HUD, Icons & UI Polish](#6-sprint-4-hud-icons--ui-polish)
7. [Sprint 5: Audio & Voice Lines](#7-sprint-5-audio--voice-lines)
8. [Sprint 6: Visual Effects & Animations](#8-sprint-6-visual-effects--animations)
9. [Sprint 7: Mission Design & Campaign](#9-sprint-7-mission-design--campaign)
10. [Sprint 8: Maps & Game Modes](#10-sprint-8-maps--game-modes)
11. [Sprint 9: Balance & QA](#11-sprint-9-balance--qa)
12. [Volledige Asset Inventaris](#12-volledige-asset-inventaris)
13. [Niet in Scope (Post-v1.0)](#13-niet-in-scope-post-v10)

---

## 1. Huidige Staat

### Wat werkt (v0.32.0)

| Systeem | Status | Details |
|---------|--------|---------|
| Facties | 4/4 | Brabanders, Randstad, Limburgers, Belgen |
| Units (basis) | 4/7 types | Worker, Infantry, Ranged, Heavy per factie |
| Heroes | 8 gedefinieerd | 2 per factie, abilities grotendeels placeholder |
| Gebouwen (kern) | 4/9 types | TownHall, Barracks, LumberCamp, Blacksmith functioneel |
| Gebouwen (overig) | 5 placeholder | Housing, Tertiary, Tower, FactionSpecial1/2 |
| Combat | Basis | Damage, armor, ranged/melee, auto-aggro |
| Pathfinding | Compleet | Recast WASM, 256 agents, formaties |
| Fog of War | Compleet | 3-state visibility, 5 FPS update |
| Maps | 6 templates | Procedureel, fixed 128x128 |
| Campaign | 25 missies | 12 Brabanders, 5 Limburgers, 3 Belgen, 5 Randstad |
| Tutorial | Basis | 8 stappen, UX problemen, AI valt te snel aan |
| Music | Excellent | Dynamische intensiteit, factie-thema's, boss battle |
| SFX | 15 geluiden | Kern gedekt, gaps bij gebouwen/heroes |
| Voice Lines | 25% | Brabanders volledig (66), Randstad deels (12), Limburgers/Belgen: 0 |
| Particles | 6 types | GPU-efficient, 500 pool |
| Unit Animaties | Rigged GLBs | Idle/Walk/Attack clips, fallback voor static |
| HUD | 80% | Building panel met fal.ai icons, unit panel nog SVG |
| Projectielen | Visueel | Pijlen met parabool + trail, geen hitbox |

### Kritieke Gaps

1. **Tutorial is geen echte tutorial** - stappen gaan te snel, geen visuele highlights, AI valt aan na 120s
2. **Geen tech tree** - alles direct beschikbaar, geen unlock-progressie
3. **5 gebouwtypes zijn placeholder** - Housing geeft geen pop cap, towers schieten niet, tertiary genereert niets
4. **3 unit types ontbreken** - Siege, Support, Special niet geimplementeerd
5. **Hero abilities zijn placeholder** - Framework staat, effecten niet
6. **Unit command icons zijn SVG** - Alleen building actions hebben fal.ai images
7. **Geen control groups** - Geen 1-9 hotkeys voor groepen
8. **2 facties onbesproken** - Limburgers en Belgen hebben 0 voice lines
9. **Geen gebouw-destructie animatie** - Gebouwen verdwijnen instant
10. **Missie-progressie is vlak** - Geen geleidelijke unlock van nieuwe gebouwen/units

---

## 2. Visie v1.0

### Core Loop
```
Tutorial (1 missie, ~15 min)
  -> Campagne per factie (8-12 missies, unlock-progressie)
    -> Skirmish (vrij spelen, alle facties/maps)
```

### Design Principes
- **Progressieve complexiteit**: Elke missie introduceert max 1 nieuw concept
- **Faction identity**: Elke factie speelt fundamenteel anders
- **Visuele kwaliteit**: Geen placeholder, geen SVG fallbacks, geen emoji's
- **Audio-dekking**: Elke actie heeft geluid, elke factie heeft stem
- **Eerlijke AI**: Duidelijke difficulty levels, geen verborgen cheats

### Succescriteria v1.0
- [ ] Tutorial voltooibaar in 1x door nieuwe speler zonder externe hulp
- [ ] Brabanders campagne (12 missies) volledig speelbaar met progressie
- [ ] Alle 4 facties speelbaar in Skirmish met uniek gameplay
- [ ] Alle gebouwen en units functioneel (geen placeholders)
- [ ] Alle HUD-elementen met echte afbeeldingen
- [ ] Alle 4 facties met voice lines
- [ ] Geen game-breaking bugs in 30 min gameplay sessie

---

## 3. Sprint 1: Tutorial & Onboarding

### Probleem
De huidige tutorial is geen veilige leeromgeving. De speler wordt overladen met informatie, kan stappen overslaan, en wordt na 120s aangevallen terwijl hij nog leert.

### Oplossing: Scenario-gedreven Tutorial Missie

**Duur**: ~15 minuten, 12 stappen, GEEN vijandelijke aanvallen tot stap 10

| Stap | Leerdoel | Trigger | Blokkade |
|------|----------|---------|----------|
| 1 | Camera bewegen | WASD/pijltjes + scroll | Geen andere acties mogelijk |
| 2 | Unit selecteren | Klik op worker | Highlight ring rond worker |
| 3 | Meerdere units selecteren | Sleep selectiekader | Highlight alle workers |
| 4 | Resources verzamelen | Rechts-klik op goudmijn | Highlight goudmijn, arrow indicator |
| 5 | Wachten op gold (50) | Gold >= 50 | Info-panel over resources |
| 6 | Gebouw plaatsen (Barracks) | B-toets, klik om te plaatsen | Highlight B-knop, ghost building |
| 7 | Wachten op constructie | Barracks klaar | Info over bouwsnelheid |
| 8 | Unit trainen | Klik Barracks, druk W | Highlight Barracks + W-knop |
| 9 | Wachten op training | Unit klaar | Info over productie-queue |
| 10 | Aanvallen | Selecteer soldaat, rechts-klik vijand | 3 vijanden verschijnen, highlight |
| 11 | Verdedigen | Overleef aanval | 5 vijanden verschijnen |
| 12 | Missie voltooien | Verzamel 200 gold | Victory screen met uitleg sterren |

### Technische Wijzigingen
- **Input lock per stap**: Blokkeer acties die niet bij de huidige stap horen
- **Visuele highlights**: Pulserende ring + pijl-indicator naar tutorial target
- **Geen AI tot stap 10**: `gracePeriod: Infinity` tot trigger
- **Gedwongen pauze bij nieuwe concepten**: Overlay pauzeert de game, klik om door te gaan
- **Geen skip-knop tot stap 8**: Tutorial moet minimaal tot combat gevolgd worden
- **Tooltip systeem**: Persistente tooltips voor hotkeys bij eerste gebruik

### Bestanden
- `src/core/Tutorial.ts` — Volledig herschrijven
- `src/campaign/MissionDefinitions.ts` — Tutorial missie herdefiniëren
- `play/index.html` — Tutorial overlay CSS + highlight animaties

---

## 4. Sprint 2: Buildings & Tech Tree

### Huidige Staat
41 gebouwen gedefinieerd, 4 functioneel. Alles direct bouwbaar. Geen prerequisite-systeem.

### Tech Tree Design (3 Tiers)

```
TIER 1 (Start)                    TIER 2 (na Blacksmith)              TIER 3 (na T2 upgrade)
--------------------              ----------------------              -------------------
TownHall (workers)                Advanced Barracks (Heavy)           Faction Special 2
Barracks (Infantry, Ranged)       Defense Tower (ranged attack)       Siege Workshop
LumberCamp (wood dropoff)         Housing (pop cap +10)               Hero Temple
                                  Tertiary Building (factie resource)
                                  Faction Special 1

Blacksmith vereist voor T2 ───────┘
T2 Upgrade "Geavanceerd" vereist voor T3 ──────────────────────────────┘
```

### Gebouw Functionaliteit Implementeren

| Gebouw | Type ID | Functie | Implementatie |
|--------|---------|---------|---------------|
| **Housing** | 4 | Pop cap +10 per gebouw | `PopulationSystem` — tel Housing buildings, verhoog cap |
| **Defense Tower** | nieuw | Ranged aanval op vijanden in range | `TowerSystem` — scan enemies in radius, spawn projectielen |
| **Tertiary Resource** | 5 | Genereer factie-resource (Gezelligheid/Kolen/Chocolade/Havermoutmelk) | `TertiaryResourceSystem` fixen — lees gebouw-ownership |
| **Siege Workshop** | nieuw | Train siege units | Gebruik ProductionSystem, nieuw BuildingTypeId |
| **Faction Special 1** | 7 | Per factie uniek (Dorpsweide/Starbucks/Mijnschacht/Chocolaterie) | Factie-specifieke ability trigger |
| **Faction Special 2** | 8 | Per factie uniek (Feestzaal/Parkeergarage/Mijnwerkerskamp/Rijschool) | Advanced unit production |

### Unlock-Progressie per Missie

| Missie | Nieuw Beschikbaar | Uitleg in-game |
|--------|-------------------|----------------|
| Tutorial | TownHall, Barracks | Basis gebouwen |
| Missie 2 | LumberCamp | "Nu kun je hout verzamelen" |
| Missie 3 | Blacksmith + T1 upgrades | "Verbeter je wapens en pantser" |
| Missie 4 | Housing | "Je hebt meer ruimte nodig voor je leger" |
| Missie 5 | Defense Tower | "Verdedig je basis met torens" |
| Missie 6 | Tertiary Building | "Ontgrendel je factie-resource" |
| Missie 7 | Advanced Barracks (Heavy) | "Train zwaardere eenheden" |
| Missie 8 | Faction Special | "Unieke factie-gebouwen" |
| Missie 10+ | Siege Workshop | "Beleger vijandelijke forten" |

### Placement Validatie
- **Collision check**: Geen overlap met bestaande gebouwen (bounding box)
- **Terrain check**: Niet op water, niet op rotswanden
- **Minimum afstand**: 2 grid cells van vijandelijke gebouwen
- **Resource proximity**: LumberCamp moet binnen 20 units van bomen staan

### Bestanden
- `src/systems/PopulationSystem.ts` — Nieuw: tel Housing, enforce cap
- `src/systems/TowerSystem.ts` — Nieuw: defense tower combat
- `src/systems/TertiaryResourceSystem.ts` — Fix: koppel aan gebouwen
- `src/systems/TechTreeSystem.ts` — Uitbreiden: tier prerequisites
- `src/systems/BuildSystem.ts` — Uitbreiden: placement validatie
- `src/types/index.ts` — Nieuwe BuildingTypeId's
- `src/entities/archetypes.ts` — Alle 41 gebouwen met correcte stats

---

## 5. Sprint 3: Units, Combat & Abilities

### Unit Types Voltooien

Huidige 4 types + 3 nieuwe:

| Type | ID | Rol | Sterk Tegen | Zwak Tegen |
|------|----|----|-------------|------------|
| Worker | 0 | Verzamelen, bouwen | — | Alles |
| Infantry | 1 | Front-line melee | Ranged | Heavy |
| Ranged | 2 | Afstand damage | Infantry | Cavalry |
| Heavy | 3 | Tank, hoge HP | Infantry | Ranged |
| **Siege** | **4** | **Anti-building** | **Buildings** | **Infantry** |
| **Support** | **5** | **Healer** | **— (niet-combat)** | **Alles** |
| **Special** | **6** | **Factie-uniek** | **Varieert** | **Varieert** |

### Siege Units per Factie

| Factie | Siege Unit | Visueel | Aanval |
|--------|-----------|---------|--------|
| Brabanders | Tractorrijder (upgrade) | Tractor met kanon | Projectiel + AOE schade |
| Randstad | Vastgoedmakelaar | Sloopkogel-kraan | Swing + gebouw-bonus damage |
| Limburgers | Kolenbrander | Mijnkar met explosieven | Explosie AOE |
| Belgen | Manneken Pis-kanon | Bronzen beeld op wielen | Water-straal projectiel |

### Support Units per Factie

| Factie | Support Unit | Ability |
|--------|-------------|---------|
| Brabanders | Boerinne | Heal 5 HP/s in radius 6, boost morale |
| Randstad | HR-Medewerker | Heal 4 HP/s, buff productie-snelheid |
| Limburgers | Sjpion | Heal 3 HP/s, reveal fog of war radius 15 |
| Belgen | Wafelzuster | Heal 6 HP/s, chocolade-buff +20% armor |

### Hero Abilities Implementeren

Alle 8 heroes hebben 3 abilities (Q/W/E). Huidige staat: framework aanwezig, effecten grotendeels placeholder.

**Per hero te implementeren:**
- **Visueel effect** (particle burst, projectiel, aura ring)
- **Geluidseffect** (ability cast sound)
- **Gameplay effect** (damage, buff, debuff, summon)
- **Cooldown UI** (radiale timer op ability knop)
- **GLB animatie** (cast animation als beschikbaar)

### Combat Verbeteringen

| Feature | Huidige Staat | v1.0 Doel |
|---------|---------------|-----------|
| Armor systeem | `ATK - ARM*0.5` | Toevoegen: armor types (light/medium/heavy) |
| Siege bonus | Enum bestaat | +200% damage vs buildings |
| AOE damage | Niet geimplementeerd | Siege + hero abilities |
| Projectiel hitbox | Visueel only | Echte collision op trajectory |
| Building damage | Instant destroy | HP-based, visuele schade |
| Unit stance | Niet geimplementeerd | Aggressive / Defensive / Hold Position |

### Bestanden
- `src/entities/archetypes.ts` — Siege/Support/Special unit stats
- `src/systems/CombatSystem.ts` — Armor types, siege bonus, AOE
- `src/systems/HealSystem.ts` — Nieuw: support unit healing
- `src/systems/AbilitySystem.ts` — Hero ability effecten implementeren
- `src/rendering/AbilityEffects.ts` — Nieuw: visuele ability effecten

---

## 6. Sprint 4: HUD, Icons & UI Polish

### Unit Command Icons (fal.ai)

Huidige unit commands gebruiken SVG. Elk commando moet een fal.ai painted icon krijgen:

| Commando | Huidige Icon | Nieuw (fal.ai) |
|----------|-------------|----------------|
| Move (Q) | SVG pijl | Geschilderde voeten/marcheer icon |
| Attack (W) | SVG zwaarden | Geschilderde aanvallende vuist |
| Stop (E) | SVG octagon | Geschilderd schild met hand |
| Hold (R) | SVG schild | Geschilderd fort/verdedigingspost |

### Blacksmith Research Icons (fal.ai)

| Upgrade | Huidige | Nieuw (fal.ai) |
|---------|---------|----------------|
| Zwaardvechten I/II | SVG UPG | Geschilderd zwaard met glow |
| Boogschieten I/II | SVG UPG | Geschilderde pijlpunt |
| Bepantsering I/II | SVG UPG | Geschilderd harnas/schild |
| Snelle Mars I | SVG UPG | Geschilderde vleugels/laarzen |

### Unit Portraits (fal.ai)

Per factie, per unit type een geschilderd portret (WarCraft-stijl):

| Factie | Worker | Infantry | Ranged | Heavy | Siege | Support |
|--------|--------|----------|--------|-------|-------|---------|
| Brabanders | Boer | Carnavalvierder | Sluiper | Tractorrijder | Tractorkanon | Boerinne |
| Randstad | Stagiair | Manager | Consultant | CorporateAdvocaat | Vastgoedmakelaar | HR-Medewerker |
| Limburgers | Mijnwerker | Schutterij | Vlaaienwerper | Mergelridder | Kolenbrander | Sjpion |
| Belgen | Frietkraamhouder | Bierbouwer | Chocolatier | Frituurridder | Manneken Pis | Wafelzuster |

**Totaal: 24 unit portraits** (4 facties x 6 unit types)

### Hero Portraits
8 heroes hebben al portret-images. Controleer kwaliteit en update indien nodig.

### Nieuwe HUD Features

| Feature | Prioriteit | Beschrijving |
|---------|-----------|--------------|
| Control Groups (1-9) | HOOG | Ctrl+1-9 om groep te assignen, 1-9 om te selecteren |
| Idle Worker knop | HOOG | Knop rechtsboven, springt naar idle worker |
| Stance knoppen | MEDIUM | Aggressive / Defensive / Stand Ground per unit |
| Production queue detail | MEDIUM | Meerdere items in queue tonen, cancel per item |
| Upgrade indicators | MEDIUM | Visuele badge op units met upgrades |
| Damage numbers | LAAG | Floating damage numbers bij hits |

### Bestanden
- `src/ui/HUD.ts` — Control groups, idle worker, stances
- `src/ui/CommandIcons.ts` — Image fallback voor alle icons
- `play/index.html` — Nieuwe HUD elementen, CSS
- `assets/ui/commands/` — 4 nieuwe unit command icons
- `assets/ui/upgrades/` — 7 upgrade icons
- `assets/portraits/units/` — 24 unit portraits

---

## 7. Sprint 5: Audio & Voice Lines

### Ontbrekende SFX

| Geluid | Prioriteit | Beschrijving |
|--------|-----------|--------------|
| building_destroy.mp3 | HOOG | Gebouw vernietigd (instortend hout/steen) |
| upgrade_complete.mp3 | HOOG | Upgrade klaar (kling + fanfare) |
| hero_spawn.mp3 | HOOG | Hero verschijnt (epische horn) |
| hero_death.mp3 | HOOG | Hero sterft (dramatische stinger) |
| ability_cast.mp3 | HOOG | Generiek ability geluid |
| low_resources.mp3 | MEDIUM | Waarschuwing: te weinig goud |
| population_cap.mp3 | MEDIUM | Waarschuwing: pop cap bereikt |
| siege_impact.mp3 | MEDIUM | Siege unit raakt gebouw (explosie) |
| heal_tick.mp3 | LAAG | Support unit healt |
| construction_progress.mp3 | LAAG | Hameren tijdens bouw |

### Voice Lines Voltooien

| Factie | Huidige staat | Nodig | Actie |
|--------|--------------|-------|-------|
| Brabanders | 66 lines, compleet | 0 | Controleer kwaliteit |
| Randstad | 12 lines, generiek | +54 | Unit-specifieke lines genereren |
| Limburgers | 0 lines | +66 | Complete set genereren |
| Belgen | 0 lines | +66 | Complete set genereren |

**Totaal nieuw te genereren: ~186 voice lines** (via ElevenLabs)

Per unit type, per actie:
- Select (3 varianten)
- Move (3 varianten)
- Attack (3 varianten)
- Gather (3 varianten)
- Death (2 varianten)
- Idle (2 varianten)
- Ability (2 varianten)
= ~18 lines per unit type, 4 unit types per factie = ~72 per factie

### Bestanden
- `assets/audio/sfx/` — 10 nieuwe SFX
- `assets/audio/voices/` — 186 nieuwe voice lines
- `src/audio/AudioManager.ts` — Nieuwe SFX registreren
- `src/audio/UnitVoices.ts` — Nieuwe facties toevoegen

---

## 8. Sprint 6: Visual Effects & Animations

### Ontbrekende Visuele Effecten

| Effect | Type | Beschrijving | Systeem |
|--------|------|-------------|---------|
| Building destruction | Particle + model | Instortende structuur, stofwolk, puin | ParticleSystem + custom |
| Hero ability Q/W/E | Particle + projectiel | Per ability uniek (aura, projectiel, shockwave) | AbilityEffects.ts |
| Siege impact | Particle + screen shake | Explosie bij gebouw-hit, grotere screen shake | ParticleSystem |
| Heal aura | Particle | Groene opwaartse particles rond target | ParticleSystem |
| Buff indicator | Particle | Gloeiende ring rond gebuffede units | ParticleSystem |
| Victory celebration | Particle + camera | Vuurwerk particles, camera zoom out | Special sequence |
| Building construction progress | Visual | Scaffolding/translucent → solid transition | BuildingRenderer |

### 3D Model Behoeften

| Model | Prioriteit | Methode | Doel |
|-------|-----------|---------|------|
| Siege units (4) | HOOG | Meshy v6 image-to-3D | Per factie uniek siege unit model |
| Support units (4) | HOOG | Meshy v6 image-to-3D | Per factie uniek healer model |
| Special units (4) | MEDIUM | Meshy v6 image-to-3D | Per factie uniek special model |
| Defense Tower (4) | HOOG | Meshy v6 image-to-3D | Per factie unieke toren |
| Housing (4) | MEDIUM | Meshy v6 image-to-3D | Per factie uniek woonhuis |
| Siege Workshop (4) | MEDIUM | Meshy v6 image-to-3D | Per factie unieke werkplaats |
| Walls/Gate segments | LAAG | Meshy v6 text-to-3D | Modulaire muur + poort stukken |

**Totaal: ~24 nieuwe GLB modellen** (Meshy v6 production)

### Unit Animatie Gaps

| Animatie | Huidige Staat | v1.0 |
|----------|---------------|------|
| Idle | Aanwezig (bob) | OK |
| Walk | Aanwezig | OK |
| Attack (melee) | Aanwezig | OK |
| Attack (ranged) | Aanwezig | OK |
| Death | Aanwezig | OK |
| **Hero Q cast** | **Ontbreekt** | **Nodig** |
| **Hero W cast** | **Ontbreekt** | **Nodig** |
| **Hero E cast** | **Ontbreekt** | **Nodig** |
| **Siege attack** | **Ontbreekt** | **Nodig** |
| **Heal cast** | **Ontbreekt** | **Nodig** |
| **Building destroy** | **Ontbreekt** | **Nodig** |

---

## 9. Sprint 7: Mission Design & Campaign

### Brabanders Campagne Herstructurering

De huidige 12 missies moeten herwerkt worden met:
1. **Progressieve unlock** — Elke missie introduceert max 1 nieuw gebouw/unit
2. **Gevarieerde doelen** — Niet alleen "verzamel X" of "vernietig Y"
3. **Narrative flow** — Elk trio missies vertelt een verhaal-arc

| Missie | Titel | Nieuwe Mechaniek | Doel Type |
|--------|-------|-----------------|-----------|
| 0 | De Eerste Oogst (Tutorial) | Basis controls | Guided tutorial |
| 1 | De Nederzetting | LumberCamp | Build & gather |
| 2 | De Smid | Blacksmith + upgrades | Research & defend |
| 3 | Het Dorp Groeit | Housing + pop cap | Economy management |
| 4 | De Verdediging | Defense Tower | Wave defense |
| 5 | De Binnendieze | Commando (geen basis) | Stealth/tactical |
| 6 | Boerenopstand | Tertiary resource | Multi-objective |
| 7 | Zware Jongens | Heavy units | Full army assault |
| 8 | De Raad | Faction Special buildings | Alliance mission |
| 9 | Belegering | Siege units + workshop | Siege warfare |
| 10 | Twee Fronten | All buildings/units | Two-front war |
| 11 | De Gouden Worstenbroodje | Everything | Final boss + narrative |

### AI Difficulty per Missie

| Missie | Grace Period | AI Productie | Waves | Agressie |
|--------|-------------|--------------|-------|----------|
| Tutorial | Oneindig tot stap 10 | Nee | 0 | Geen |
| 1-2 | 180s | Nee | 1-2 | Laag |
| 3-4 | 150s | Nee | 3-4 | Gemiddeld |
| 5-6 | 120s | Ja (traag) | 3-5 | Gemiddeld |
| 7-8 | 90s | Ja | 4-6 | Hoog |
| 9-11 | 60s | Ja (snel) | 5-8 | Brutaal |

### Andere Campagnes (Limburgers, Belgen, Randstad)

Structuur volgt hetzelfde patroon maar met factie-specifieke thema's:
- **Limburgers**: Underground/mining focus, tunnel mechanics centraal
- **Belgen**: Diplomacy/economy focus, handelsmissies
- **Randstad**: Corporate aggression, hostile takeover thema

Elk minimaal 8 missies met dezelfde progressieve unlock.

---

## 10. Sprint 8: Maps & Game Modes

### Variable Map Sizes

| Size | Dimensie | Spelers | Typisch Gebruik |
|------|----------|---------|-----------------|
| Klein | 80x80 | 2 | Snelle skirmish, tutorial |
| Medium | 128x128 | 2-3 | Standaard campaign, skirmish |
| Groot | 192x192 | 3-4 | Late-game campaign, epic battles |

### Skirmish Mode Verbeteren

Huidige skirmish is 2-player only. Uitbreiden:
- **2-4 spelers** (1 human + 1-3 AI)
- **Map size selectie** (klein/medium/groot)
- **AI difficulty** (easy/normal/hard)
- **Victory condition**: Eliminatie (vernietig alle vijandige TownHalls)
- **Starting resources**: Selecteerbaar (low/medium/high)
- **Fog of War**: Toggle aan/uit

### Map Templates Uitbreiden

Huidige 6 templates + 2 nieuwe:
- **'canyon'** — Smalle vallei met choke points, verticale gevechten
- **'archipelago'** — Meerdere eilanden verbonden door smalle bruggen

---

## 11. Sprint 9: Balance & QA

### Unit Balance Matrix

Elke unit moet een duidelijke rock-paper-scissors relatie hebben:

```
Infantry  →  slaat Ranged    (close gap + high DPS)
Ranged    →  slaat Heavy     (kite, range advantage)
Heavy     →  slaat Infantry  (tank damage, high HP)
Siege     →  slaat Buildings (200% bonus damage)
Support   →  healt allies    (geen combat, fragiel)
Special   →  factie-uniek    (niche counters)
```

### Performance Targets

| Metric | Doel | Huidige |
|--------|------|---------|
| FPS (200 units) | 60 FPS | ~55 FPS |
| FPS (500 units) | 30 FPS | Niet getest |
| Load time | < 5s | ~3s |
| Memory | < 500MB | ~350MB |
| Bundle size (JS) | < 2MB | 1.2MB |
| GLB model budget | < 15MB per model | 3-11MB |

### Test Checklist

- [ ] Tutorial voltooibaar zonder bugs
- [ ] Elke missie winbaar op Normal difficulty
- [ ] Elke missie winbaar met 3 sterren op Hard
- [ ] Alle 4 facties speelbaar in Skirmish
- [ ] Alle gebouwen plaatsbaar en functioneel
- [ ] Alle units trainbaar en met correcte combat stats
- [ ] Alle hero abilities werken met visueel effect
- [ ] Alle voice lines triggeren correct
- [ ] Geen crashes bij 200+ units op scherm
- [ ] Fog of War werkt correct
- [ ] Minimap reflecteert game state
- [ ] Save/load campaign voortgang persistent

---

## 12. Volledige Asset Inventaris

### Te Genereren Assets

| Categorie | Aantal | Methode | Geschatte Tijd |
|-----------|--------|---------|----------------|
| Unit command icons (fal.ai) | 4 | fal.ai Flux Dev | 10 min |
| Upgrade icons (fal.ai) | 7 | fal.ai Flux Dev | 15 min |
| Unit portraits (fal.ai) | 24 | fal.ai Flux Dev | 45 min |
| Unit 3D models (Meshy) | 12 | Meshy v6 image-to-3D | 2-3 uur |
| Building 3D models (Meshy) | 12 | Meshy v6 image-to-3D | 2-3 uur |
| SFX (ElevenLabs/Suno) | 10 | ElevenLabs SFX | 30 min |
| Voice lines (ElevenLabs) | 186 | ElevenLabs TTS | 2-3 uur |
| Concept art voor Meshy | 24 | fal.ai Flux Pro | 45 min |

**Totaal geschatte asset-productie: ~10-12 uur**

### Bestaande Assets (herbruikbaar)

- 53 GLB modellen (units + buildings, v01/v02/poc)
- 12 muziek tracks (dynamisch systeem compleet)
- 15 SFX
- 66 Brabanders voice lines
- 12 Randstad voice lines
- 6 command icons (fal.ai, vandaag gemaakt)
- 2 terrain feature GLBs (bridge + tunnel, vandaag gemaakt)

---

## 13. Niet in Scope (Post-v1.0)

| Feature | Reden | Mogelijke v1.x |
|---------|-------|----------------|
| Multiplayer (online) | Networking stack te complex | v1.5 |
| Map Editor | Nice-to-have, niet core | v1.2 |
| Dag/nacht cyclus | Visueel, geen gameplay impact | v1.1 |
| Naval units | Geen water-combat systeem | v2.0 |
| Replay systeem | Opname-architectuur nodig | v1.3 |
| Weather effecten | Visueel, geen gameplay impact | v1.1 |
| Achievements | Leuk maar niet core | v1.1 |
| Leaderboards (uitgebreid) | Basis al aanwezig | v1.1 |
| Mod support | API design nodig | v2.0 |

---

## Sprint Planning (Geschatte Volgorde)

```
Sprint 1: Tutorial & Onboarding .............. 2-3 sessies
Sprint 2: Buildings & Tech Tree .............. 3-4 sessies
Sprint 3: Units, Combat & Abilities .......... 3-4 sessies
Sprint 4: HUD, Icons & UI Polish ............ 2-3 sessies
Sprint 5: Audio & Voice Lines ............... 2-3 sessies
Sprint 6: Visual Effects & Animations ....... 3-4 sessies
Sprint 7: Mission Design & Campaign ......... 3-4 sessies
Sprint 8: Maps & Game Modes ................ 1-2 sessies
Sprint 9: Balance & QA ..................... 2-3 sessies
                                              ────────────
                                     Totaal: 21-30 sessies
```

**Sprints 2-6 kunnen deels parallel** — asset-generatie (Sprint 4-6) kan terwijl systemen (Sprint 2-3) gebouwd worden.

---

*PRD opgesteld op basis van 6 parallelle codebase-analyses. Alle genoemde bestanden, line numbers, en technische details zijn geverifieerd tegen de huidige codebase (v0.32.0, SHA 636e6960).*
