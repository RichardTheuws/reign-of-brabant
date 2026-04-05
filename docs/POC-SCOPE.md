# Reign of Brabant — Proof of Concept Scope

**Versie**: 1.0.0
**Datum**: 2026-04-05
**Status**: Draft — Wacht op goedkeuring
**Parent**: PRD.md v1.0.0

---

## 1. Doel

### Fundamentele vraag

> **"Kunnen we een speelbare RTS core loop draaien in de browser op 60 FPS, met pathfinding, resource gathering, building, combat en AI — op een niveau dat FUN is?"**

### Wat het PoC bewijst

1. **Performance**: Three.js + bitECS + recast-navigation-js kan 50+ units smooth renderen en updaten op 60 FPS in een desktop browser
2. **Pathfinding**: recast-navigation-js levert betrouwbare navmesh pathfinding die dynamisch reageert op geplaatste gebouwen (TileCache)
3. **Core loop**: De gameplay loop van "verzamel resources -> bouw gebouwen -> train units -> val aan" is implementeerbaar en speelbaar in de browser
4. **AI opponent**: Een computer-tegenstander kan dezelfde loop uitvoeren en een uitdaging bieden
5. **Fun factor**: Een potje van 10-15 minuten voelt als een mini-RTS en is daadwerkelijk leuk om te spelen

### Wat het PoC NIET bewijst

- Visuele kwaliteit (we gebruiken gekleurde dozen)
- Multiplayer haalbaarheid
- Mobile performance
- Balancing van 4 facties
- Campaign/narrative

---

## 2. Core Loop

De minimale gameplay loop die functioneel MOET zijn, in volgorde van afhankelijkheid:

```
1. Camera    → Speler kan het terrein bekijken (pan, zoom)
2. Selectie  → Speler kan units selecteren (klik, box select)
3. Movement  → Geselecteerde units bewegen naar rechts-klik positie (pathfinding)
4. Gathering → Worker rechts-klikt op gold mine → loopt ernaartoe →
               verzamelt → loopt terug naar Town Hall → deponeert → herhaalt
5. Building  → Speler plaatst gebouw-ghost → worker bouwt het op →
               gebouw wordt functioneel → navmesh update
6. Training  → Speler selecteert gebouw → traint unit → unit spawnt
7. Combat    → Units aanvallen vijandelijke units → damage → death
8. AI        → Computer doet stappen 4-7 zelfstandig → stuurt army naar speler
9. Win/Lose  → Town Hall vernietigd = verloren
```

Elke stap bouwt voort op de vorige. Als stap 3 (pathfinding) niet werkt, werkt niets erna.

---

## 3. IN Scope (exhaustieve lijst)

### 3.1 Rendering

| Element | Implementatie | Details |
|---------|--------------|---------|
| Units | `InstancedMesh` (gekleurde dozen) | Blauw = speler, rood = vijand, geel = worker |
| Gebouwen | `BoxGeometry` (gekleurde dozen, grotere schaal) | Kleur per type, semi-transparant ghost bij plaatsing |
| Terrein | Vlakke plane met simplex noise heightmap | 128x128 game units (halve PRD-grootte), basiskleur groen/bruin |
| Resource nodes | `SphereGeometry` (goud) / `ConeGeometry` (bomen) | Goud = gele bol, boom = groene kegel |
| Health bars | 3D billboard sprites boven units/gebouwen | Rode/groene balk, alleen zichtbaar bij damage |
| Selectie-indicator | Groene cirkel onder geselecteerde units | `RingGeometry` op grond |
| Move-marker | Witte cirkel op klik-positie | Fade out na 1 seconde |
| Minimap | Canvas 2D overlay (rechtsonder) | Terrein kleur, unit dots, camera frustum |
| Projectielen | Kleine `SphereGeometry` | Vliegen van ranged unit naar target |

**NIET**: 3D modellen, texturen, animaties, particle effects, schaduwen, post-processing.

### 3.2 Camera

| Feature | Implementatie |
|---------|--------------|
| Pan | WASD / pijltjestoetsen |
| Edge scrolling | Muis binnen 20px van schermrand |
| Zoom | Scrollwiel (min 15, max 80 hoogte) |
| Perspective | ~60 graden hoek, vaste richting (geen rotatie) |
| Minimap klik | Klik op minimap = camera springt naar positie |
| Bounds | Camera kan niet buiten de map |

**NIET**: Camera rotatie, cinematische camera, smooth follow.

### 3.3 Terrein

| Feature | Implementatie |
|---------|--------------|
| Afmeting | 128x128 game units (kleiner dan PRD's 256x256) |
| Heightmap | Simplex noise, zachte heuvels (max 5 units hoogte) |
| Water | 1 onbegaanbaar rechthoekig ven (hardcoded polygoon) |
| Begaanbaarheid | Navmesh met water en gebouwen als obstacles |
| Visueel | Basis groen/bruin kleuren op basis van hoogte |
| Start posities | 2 diagonale hoeken: [15, 15] en [113, 113] |
| Gold mines | 4 totaal: 1 dichtbij elke start, 2 centraal (contested) |
| Bomen | 4 clusters van 6-8 bomen, verspreid |

**NIET**: Heightmap uit afbeelding, terrain texturing, meerdere biomes, bruggen, ruines, decoraties.

### 3.4 Units

**3 unit types**, geen factie-specifieke namen/stats. Generiek:

| Unit | Rol | HP | Attack | Speed | Range | Cost | Pop | Build Time |
|------|-----|-----|--------|-------|-------|------|-----|-----------|
| **Worker** | Verzamelt resources, bouwt | 60 | 5 | 5.0 | 0 (melee) | 50/0 | 1 | 15s |
| **Infantry** | Melee fighter | 80 | 10 | 5.5 | 0 (melee) | 75/25 | 1 | 18s |
| **Ranged** | Afstandsaanvaller | 55 | 12 | 5.0 | 8 | 60/40 | 1 | 22s |

**Unit features in scope:**
- Selectie (klik + box select)
- Multi-selectie (shift-klik)
- Control groups (Ctrl+1-5, recall met 1-5)
- Rechts-klik contextgevoelig: move / attack / gather
- Pathfinding via navmesh
- Auto-attack als vijand in sight range komt (range: 8 units)
- Health bar billboard
- Death: unit verdwijnt na fade

**NIET**: Cavalry, siege, support, heroes, abilities, armor types, attack modifiers, stealth, formations, hotkey training (Q/W/E). Geen factie-specifieke units.

### 3.5 Gebouwen

**2 gebouw types:**

| Gebouw | Functie | HP | Cost | Build Time | Pop bonus |
|--------|---------|-----|------|-----------|-----------|
| **Town Hall** | Resource drop-off, train workers | 1500 | Start-gebouw | - | +10 |
| **Barracks** | Train infantry + ranged | 800 | 200/50 | 30s | 0 |

**Building features in scope:**
- Ghost-placement met collision check (geen overlap, niet op water)
- Worker bouwt gebouw op (progressbar)
- Gebouw blokkeert pathfinding (navmesh update via TileCache)
- Gebouw selecteerbaar, toont train-opties
- Gebouw heeft health, kan vernietigd worden
- Rally point: rechts-klik vanuit geselecteerd gebouw zet spawn-punt

**NIET**: Housing, tech tree, upgrades, defense towers, resource-genererende gebouwen, Town Hall upgrades. Population is hardcapped op 30 per speler (geen housing nodig).

### 3.6 Resources

**1 resource type: Gold**

| Feature | Implementatie |
|---------|--------------|
| Gold mines | 4 nodes op de map, elk 1500 gold |
| Verzamelen | Worker rechts-klikt mine → loopt ernaartoe → "mined" 2s → draagt 10 gold → loopt naar Town Hall → deponeert |
| Uitputting | Mine verdwijnt als gold op is |
| Meerdere workers | Max 3 workers per mine tegelijk |
| Start resources | Elke speler begint met 300 gold |

**NIET**: Secundaire resource (hout/bier), tertiaire resource (gezelligheid), carry capacity variatie, bakkerij/brouwerij gebouwen. Alle kosten zijn alleen in gold.

### 3.7 Combat

| Feature | Implementatie |
|---------|--------------|
| Damage | `Effective Damage = Attack` (geen armor in PoC) |
| Melee | Unit loopt naar target, slaat op attack speed interval |
| Ranged | Unit stopt op range-afstand, vuurt projectiel met travel time |
| Projectielen | Rechte lijn, raakt altijd (geen miss-chance in PoC) |
| Health bars | Groen → rood, boven unit |
| Death | HP <= 0 → unit verdwijnt (geen animatie, directe remove na 1s) |
| Auto-attack | Idle units vallen automatisch vijanden aan in sight range |
| Attack-move | A + rechts-klik: beweeg en val alles onderweg aan |
| Stop | S toets: unit stopt huidige actie |
| Building attack | Units kunnen gebouwen aanvallen (normale damage) |

**NIET**: Armor types, attack modifiers (+50% melee vs light etc.), splash damage, abilities, heal, buffs/debuffs, hero mechanics, corpses, kill counters.

### 3.8 AI (Computer Opponent)

**1 moeilijkheidsgraad: "Medium"**

De AI volgt een vaste build order en escaleert naar aanval:

```
BUILD ORDER:
1. Train 3 extra workers (totaal 4)
2. Stuur workers naar dichtstbijzijnde gold mine
3. Bij 200 gold: bouw Barracks
4. Train 2 infantry + 1 ranged
5. Train 1 extra worker
6. Train 3 infantry + 2 ranged
7. Stuur leger naar speler's Town Hall
8. Herhaal: train units, stuur als groep van 5+
```

**AI features in scope:**
- Bouwt gebouwen op valide locaties
- Traint units automatisch
- Verzamelt resources met workers
- Stuurt army naar speler als groep (niet per unit)
- Herbouwt Barracks als die vernietigd wordt
- Traint nieuwe workers als er minder dan 3 zijn
- Verdedigt Town Hall als het aangevallen wordt (recall leger)

**NIET**: Scouting, counter-building, meerdere difficulty levels, build order variatie, expansion, tech upgrades, retreat logic, flanking.

### 3.9 UI (HTML/CSS Overlay)

| Element | Positie | Inhoud |
|---------|---------|--------|
| Resource bar | Top-center | "Gold: 450 | Pop: 12/30" |
| Minimap | Rechtsonder | Terrein + unit dots + camera rect |
| Unit panel | Onderkant-center | Bij selectie: unit naam, HP bar, portrait placeholder |
| Building panel | Onderkant-center | Bij gebouw-selectie: train knoppen (Worker/Infantry/Ranged) |
| Win/Lose overlay | Center | "VICTORY" of "DEFEAT" + restart knop |
| FPS counter | Linksboven | stats-gl of handmatig |

**NIET**: Ability bar, tech tree UI, settings menu, faction select, map select, main menu (game start direct), keybindings menu, loading screen, tooltips.

### 3.10 Pathfinding

| Feature | Implementatie |
|---------|--------------|
| Library | recast-navigation-js (WASM) |
| Navmesh | Gegenereerd van terrein + water obstacles |
| TileCache | Dynamische navmesh updates bij gebouw placement/vernietiging |
| Crowd | `CrowdAgent` per unit voor collision avoidance tussen units |
| Pad-visualisatie | Geen (intern alleen) |

**NIET**: Formation movement, waypoints, patrol routes, guard positions.

### 3.11 Fog of War

**NEE — niet in PoC.**

Fog of War is een significant systeem (visibility texture, shader mask, per-frame updates). De core loop werkt zonder. De speler ziet alles, de AI ook.

**Motivatie**: FoW voegt geen bewijs toe aan de fundamentele vraag. Het is een polish-feature die we na het PoC toevoegen.

### 3.12 Audio

**MINIMAAL — alleen feedback sounds.**

| Sound | Wanneer | Bron |
|-------|---------|------|
| Klik-bevestiging | Unit geselecteerd | Simpele "click" SFX |
| Move-bevestiging | Move commando gegeven | Simpele "acknowledge" SFX |
| Attack impact | Melee hit landt | Simpele "thud" SFX |
| Building complete | Gebouw afgebouwd | Simpele "ding" SFX |
| Win/Lose | Game eindigt | Simpele fanfare / somber toon |

**5 SFX totaal.** Geen muziek, geen voice lines, geen 3D spatial audio. Sounds via Howler.js voor browser-compatibility. Mute-knop in UI.

**NIET**: Muziek, voice lines, ambient sounds, 3D positional audio, dynamic music system.

---

## 4. UIT Scope (expliciet)

De volgende features zitten **NIET** in het PoC. Ze worden niet geprototyped, niet half-gebouwd, niet "als we tijd over hebben". Ze bestaan niet.

### Gameplay
- [ ] Geen multiplayer (geen netcode, geen lobby, geen P2P)
- [ ] Geen campaign of missies
- [ ] Geen factie-specifieke mechanics (geen Gezelligheid, geen Bureaucratie)
- [ ] Geen factie-keuze (beide spelers zijn generiek)
- [ ] Geen tech tree of upgrades
- [ ] Geen armor types of attack modifiers
- [ ] Geen abilities (Q/W/E skills)
- [ ] Geen hero units
- [ ] Geen siege units
- [ ] Geen support/healer units
- [ ] Geen cavalry/heavy units
- [ ] Geen population housing (hardcap op 30)
- [ ] Geen secondary resource (hout/bier)
- [ ] Geen tertiary resource (gezelligheid/havermoutmelk)
- [ ] Geen cheat codes
- [ ] Geen save/load
- [ ] Geen difficulty selectie

### Visueel
- [ ] Geen 3D modellen (alles is gekleurde dozen)
- [ ] Geen texturen of materials (alleen kleuren)
- [ ] Geen animaties (units schuiven, gebouwen poppen in)
- [ ] Geen particle effects (geen confetti, geen blood, geen dust)
- [ ] Geen schaduwen
- [ ] Geen post-processing (bloom, SSAO, etc.)
- [ ] Geen Fog of War
- [ ] Geen dag/nacht cyclus
- [ ] Geen weather effects
- [ ] Geen death animaties (units verdwijnen)
- [ ] Geen terrain texturing (alleen basis kleur)

### Audio
- [ ] Geen muziek
- [ ] Geen voice lines
- [ ] Geen ambient sounds
- [ ] Geen 3D spatial audio
- [ ] Geen dynamic music system

### UI
- [ ] Geen main menu
- [ ] Geen settings menu
- [ ] Geen faction select screen
- [ ] Geen map select screen
- [ ] Geen loading screen (behalve "Loading..." tekst)
- [ ] Geen tutorial
- [ ] Geen tooltips
- [ ] Geen hotkey overlay
- [ ] Geen replays

### Technisch
- [ ] Geen mobile support
- [ ] Geen touch controls
- [ ] Geen WebGPU (alleen WebGL2)
- [ ] Geen save/load systeem
- [ ] Geen analytics
- [ ] Geen leaderboard
- [ ] Geen deployment naar productie (alleen lokaal)

---

## 5. Success Criteria (meetbaar)

Het PoC is **geslaagd** als ALLE volgende criteria zijn behaald:

### Performance

- [ ] **60 FPS** met 50 units op scherm (25 per speler) op MacBook Pro M5 Pro in Chrome
- [ ] **60 FPS** met 30 units + 6 gebouwen + 4 gold mines + pathfinding actief
- [ ] **Geen frame drops** onder 45 FPS bij 50 units in gevecht (worst case)
- [ ] **Navmesh rebuild** bij gebouw plaatsen duurt < 50ms (geen merkbare stutter)
- [ ] **Load time** < 3 seconden van pagina-open tot speelbaar

### Pathfinding

- [ ] Units navigeren **om gebouwen heen** (niet erdoorheen)
- [ ] Units navigeren **om water heen** (niet erdoorheen)
- [ ] **Geen stuck units**: unit die 5 seconden niet beweegt terwijl het een move-commando heeft, reset naar idle
- [ ] **Crowd avoidance**: 10 units naar dezelfde plek gestuurd vormen geen stack maar spreiden
- [ ] Pathfinding werkt **na gebouw-placement** (TileCache dynamische update)

### Resource Loop

- [ ] Worker kan de **volledige gather loop** doen: idle → move to mine → gather → return to Town Hall → deposit → move to mine (automatisch herhalen)
- [ ] Gold teller in UI **klopt** (elke deposit voegt exact 10 toe)
- [ ] Gold mine **raakt op** na 1500 gold verzameld (150 trips)
- [ ] Meerdere workers op dezelfde mine **werken concurrent** (max 3)

### Building

- [ ] Speler kan Barracks **plaatsen** via UI-knop + ghost preview
- [ ] Ghost toont **rood bij invalid** placement (op water, op ander gebouw, buiten map)
- [ ] Worker **bouwt gebouw op** met visuele progressbar
- [ ] Gebouw is **functioneel** na voltooiing (kan units trainen)
- [ ] Gebouw **blokkeert pathfinding** na placement

### Combat

- [ ] Infantry kan vijandelijke infantry **aanvallen en doden**
- [ ] Ranged unit **vuurt projectiel** dat naar target vliegt en damage doet
- [ ] Units **auto-attacken** vijanden die in sight range komen
- [ ] Gebouwen zijn **aanvalbaar en vernietigbaar**
- [ ] Health bars zijn **zichtbaar en accuraat**

### AI

- [ ] AI **bouwt** een Barracks
- [ ] AI **traint** workers en military units
- [ ] AI **verzamelt** resources met workers
- [ ] AI **stuurt een leger** naar de speler (assault wave)
- [ ] AI **herbouwt** verloren gebouwen
- [ ] AI is **verslaanbaar** maar biedt **weerstand** (niet triviaal)

### Win Condition

- [ ] **Town Hall vernietigd** = defeat → overlay verschijnt
- [ ] **Vijandelijk Town Hall vernietigd** = victory → overlay verschijnt
- [ ] **Restart knop** werkt (nieuwe game zonder page reload)

### Speelbaarheid

- [ ] Een potje duurt **8-15 minuten**
- [ ] Speler ervaart het als een **herkenbare RTS** (niet als een tech demo)
- [ ] Minstens 3 strategische keuzes: wanneer expand, army size vs timing, unit composition (infantry vs ranged)

---

## 6. Geschatte Doorlooptijd per Systeem

**Totaal geschat: 52-68 uur (~7-9 volle werkdagen)**

| # | Systeem | Geschatte uren | Dependencies | Risico |
|---|---------|---------------|--------------|--------|
| 1 | **Project setup** (Vite + TS + Three.js + bitECS) | 2-3u | Geen | Laag |
| 2 | **Camera** (pan, zoom, edge scroll, bounds) | 3-4u | Setup | Laag |
| 3 | **Terrein** (simplex noise heightmap, water) | 3-4u | Setup | Laag |
| 4 | **Navmesh** (recast-navigation-js init + terrain) | 4-6u | Terrein | **Hoog** |
| 5 | **Unit rendering** (InstancedMesh, gekleurde dozen) | 3-4u | Setup | Laag |
| 6 | **Unit selectie** (klik, box select, shift, ctrl groups) | 4-5u | Units, Camera | Medium |
| 7 | **Movement** (rechts-klik → pathfinding → crowd) | 4-6u | Navmesh, Selectie | **Hoog** |
| 8 | **Minimap** (canvas 2D overlay) | 3-4u | Camera, Units | Laag |
| 9 | **Resource systeem** (gold mines, gather loop, deposit) | 4-5u | Movement | Medium |
| 10 | **Building placement** (ghost, validation, build) | 5-7u | Resources, Navmesh | Medium |
| 11 | **Navmesh update** (TileCache bij gebouwen) | 3-4u | Buildings, Navmesh | **Hoog** |
| 12 | **Unit training** (gebouw → unit spawn) | 2-3u | Buildings | Laag |
| 13 | **Combat** (melee, ranged, projectiles, death) | 5-7u | Movement | Medium |
| 14 | **Health bars** (3D billboards) | 2-3u | Combat | Laag |
| 15 | **AI opponent** (build order, gather, attack waves) | 5-7u | Alle systemen | Medium |
| 16 | **HUD** (resource bar, unit panel, build panel) | 3-4u | Resources, Buildings | Laag |
| 17 | **Win/Lose** (Town Hall destroyed check) | 1-2u | Combat | Laag |
| 18 | **Audio** (5 SFX, Howler.js) | 1-2u | Geen | Laag |
| 19 | **Polish + bugfixes** | 4-6u | Alles | Medium |

### Dependency Graph (kritiek pad)

```
Setup ──→ Terrein ──→ Navmesh ──→ Movement ──→ Resources ──→ Building ──→ AI
  │          │           │           │             │            │          │
  ├→ Camera  │           ├→ Crowd    ├→ Combat     ├→ Training  ├→ TileCache
  ├→ Units   │           │           │             │            │
  └→ HUD     └→ Minimap  └→ Selectie └→ Health bars└→ Win/Lose  └→ Polish
```

**Kritiek pad**: Setup → Terrein → Navmesh → Movement → Resources → Building → AI
**Geschatte kritiek pad**: ~30-40 uur

### Aanbevolen bouwvolgorde (per dag)

| Dag | Focus | Deliverable |
|-----|-------|-------------|
| **1** | Setup + Camera + Terrein + Units | Vlakke wereld met dozen die je kunt bekijken |
| **2** | Navmesh + Movement + Selectie | Units die je kunt selecteren en laten bewegen |
| **3** | Minimap + Resource systeem | Workers die gold ophalen en terugbrengen |
| **4** | Building placement + TileCache + Training | Gebouwen plaatsen, units trainen |
| **5** | Combat (melee + ranged + projectiles) | Units die kunnen vechten en sterven |
| **6** | Health bars + AI opponent (deel 1) | Health bars, AI die bouwt en gathered |
| **7** | AI opponent (deel 2) + Win/Lose | AI die aanvalt, win/lose conditie |
| **8** | HUD + Audio + Polish | Complete speelbare loop |
| **9** | Bugfixes + Performance testing | Stabiel, 60 FPS, alle criteria groen |

---

## 7. Risico's

### Hoog Risico

| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| **recast-navigation-js werkt niet goed met Three.js terrein** | Pathfinding is de basis van alles. Zonder werkende pathfinding geen PoC. | 25% | Dag 2 is volledig gewijd aan navmesh. Als het na 8 uur niet werkt: fallback naar A* grid-based pathfinding (eenvoudiger, minder mooi, maar functioneel). |
| **TileCache dynamische updates zijn instabiel** | Gebouwen blokkeren pathfinding niet, of navmesh rebuild crasht. | 30% | Fallback: statische navmesh, gebouwen alleen op vooraf bepaalde plekken. Minder flexibel maar werkbaar. |
| **Performance < 60 FPS met 50 units** | PoC bewijst niet dat browser-RTS haalbaar is. | 15% | InstancedMesh ipv individuele meshes. bitECS voor data-oriented updates. Profile vroeg (dag 2) met 50 dummy units. |
| **CrowdAgent collision avoidance levert stuck units** | Units die niet bij hun doel komen, pathfinding voelt kapot. | 35% | Timeout-mechanisme: unit die 5s niet beweegt, teleporteert naar dichtstbijzijnde vrije plek. Niet mooi, wel functioneel. |

### Medium Risico

| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| **AI is te dom of te sterk** | Geen fun: te makkelijk of onmogelijk. | 40% | Tweakbare timers en unit-counts in AI build order. 1 uur balance-tuning op dag 8. |
| **Box selection met perspective camera is onnauwkeurig** | Frustrerend om units te selecteren. | 20% | Raycasting + frustum test. Alternatief: screen-space projection van unit posities. |
| **Ranged projectiles missen of clippen door terrein** | Combat voelt buggy. | 25% | Projectielen als rechte lijn op vaste hoogte (Y+2 boven grond), negeer terrain collision. Simpel maar effectief. |

### Laag Risico

| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| **Three.js API changes** | Kleine code aanpassingen nodig. | 10% | Pin Three.js versie in package.json. |
| **bitECS leercurve** | Langzamere ontwikkeling eerste dagen. | 15% | ECS pattern is bekend. bitECS API is klein (~10 functies). |
| **Audio niet beschikbaar door browser autoplay policy** | Geen geluid tot eerste user interaction. | 100% (verwacht) | Howler.js handled dit automatisch. "Click to start" overlay bij game start. |

---

## 8. Go/No-Go Criteria

### Na het PoC: wanneer gaan we door?

**GO** als aan ALLE volgende voorwaarden is voldaan:

| # | Criterium | Meetbaar |
|---|-----------|---------|
| 1 | **Performance is bewezen** | 60 FPS met 50 units, geen drops onder 45 FPS |
| 2 | **Pathfinding is betrouwbaar** | < 5% stuck units in een 10-minuten sessie |
| 3 | **Core loop is fun** | Richard speelt vrijwillig 3+ potjes achter elkaar |
| 4 | **AI biedt uitdaging** | Potje duurt 8-15 minuten, niet triviaal winbaar |
| 5 | **Codebase is schoon** | ECS-architectuur is uitbreidbaar, geen god-objects |
| 6 | **Doorlooptijd klopt** | PoC is gebouwd binnen 9 werkdagen (±2 dagen marge) |

**NO-GO** als een van deze situaties zich voordoet:

| # | Situatie | Consequentie |
|---|----------|-------------|
| 1 | **< 30 FPS** met 50 units na optimalisatie | Browser-RTS in 3D is niet haalbaar → overweeg 2D (Phaser/PixiJS) of native (Electron) |
| 2 | **Pathfinding is onbetrouwbaar** (> 20% stuck units) | recast-navigation-js is niet geschikt → evalueer alternatief (navmesh.js, custom A*) |
| 3 | **Core loop voelt niet als RTS** | Fundamenteel design probleem → terug naar PRD, heroverweeg scope |
| 4 | **PoC duurt > 14 werkdagen** | Complexity te hoog → reduceer scope naar 2D of pre-built engine (Phaser RTS template) |
| 5 | **Geen enkel potje is "fun"** | Game design werkt niet → pivot naar ander genre of ander project |

### Bij GO: vervolgstappen

1. **Fase 1**: Fog of War + 2e resource (hout) + housing + population cap
2. **Fase 2**: Brabanders-factie implementeren (unieke units, Gezelligheid mechanic)
3. **Fase 3**: Randstad-factie implementeren (unieke units, Bureaucratie mechanic)
4. **Fase 4**: Tech tree + upgrades
5. **Fase 5**: 3D assets (Blender + Meshy pipeline)
6. **Fase 6**: Audio (ElevenLabs + Suno)
7. **Fase 7**: AI difficulty levels + balancing
8. **Fase 8**: Map: "De Kempen" (256x256, volledige PRD-specificatie)

### Bij NO-GO: fallback opties

| Optie | Inspanning | Trade-off |
|-------|-----------|-----------|
| **2D RTS (Phaser/PixiJS)** | Opnieuw beginnen, maar eenvoudiger | Verliest 3D unique selling point |
| **Pre-built RTS engine** | Engine evaluatie nodig | Minder controle, mogelijk licentiekosten |
| **Simplified scope** | Reduceer naar tower defense | Eenvoudiger maar ander genre |
| **Park het project** | 0 uur | Geen game, maar eerlijk |

---

## Appendix A: Technische Keuzes voor het PoC

| Keuze | Beslissing | Reden |
|-------|-----------|-------|
| Renderer | WebGL2 (geen WebGPU) | Bredere browser support, WebGPU later als optimalisatie |
| ECS | bitECS | Bewezen snel, kleine API, TypeScript support |
| Pathfinding | recast-navigation-js | Industrie-standaard navmesh, WASM performance, TileCache |
| Audio | Howler.js | Klein (7KB), autoplay handling, sprite support |
| Build tool | Vite | Snelle dev server, HMR, TypeScript out of box |
| Taal | TypeScript strict mode | Type safety voorkomt bugs in complexe systemen |
| State management | bitECS World als single source of truth | Geen extra state library nodig |
| UI | HTML/CSS overlay (geen canvas UI) | Sneller te bouwen, responsive, accessibility |

## Appendix B: Wat het PoC NIET is

- Het PoC is **geen vertical slice**. Een vertical slice toont de finale kwaliteit van een klein deel. Het PoC toont de breedte van de core loop op placeholder-kwaliteit.
- Het PoC is **geen prototype voor gebruikers**. Het wordt niet gedeployed, niet getoond aan anderen. Het is voor ONS om technische haalbaarheid te valideren.
- Het PoC is **geen basis voor de finale code**. Als het PoC slaagt, MOGEN we code hergebruiken, maar we zijn niet verplicht. Refactoring is toegestaan.

---

*PoC Scope opgesteld door Game Master (Claude)*
*Wacht op goedkeuring voor implementatie*
