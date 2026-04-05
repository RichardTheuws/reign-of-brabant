# Reign of Brabant — Sub-PRD: UI/UX, Settings, Accessibility

**Versie**: 1.0.0
**Datum**: 2026-04-05
**Status**: Draft — Wacht op goedkeuring
**Parent document**: `../PRD.md` v1.0.0
**Scope**: Alle schermen, settings, error states, accessibility, responsive design, notificaties en tutorial

---

## Inhoudsopgave

1. [Design Principes](#1-design-principes)
2. [Alle Schermen](#2-alle-schermen)
3. [Settings Menu](#3-settings-menu)
4. [Error States & Edge Cases](#4-error-states--edge-cases)
5. [Accessibility](#5-accessibility)
6. [Responsive Design](#6-responsive-design)
7. [Notificatie Systeem](#7-notificatie-systeem)
8. [Tutorial Systeem](#8-tutorial-systeem)

---

## 1. Design Principes

### 1.1 Visuele Identiteit

| Aspect | Richting |
|--------|---------|
| **Stijl** | Middeleeuws-Brabants met moderne accenten — perkament-texturen, wax seals, maar strakke typografie |
| **Lettertype headings** | Serif, zwaar (bijv. Cinzel, Almendra) |
| **Lettertype body** | Sans-serif, leesbaar (bijv. Inter, Source Sans Pro) |
| **Kleurenpalet** | Perkament-goud (#D4A853), Brabant-rood (#8B1A1A), Donkerbruin (#3C1F0E), Crème (#F5E6C8), Randstad-grijs (#4A4A5A) |
| **Accenten** | Factie-kleuren als highlight (oranje Brabant, grijs Randstad, donkergroen Limburg, rood/geel Belgen) |
| **Animaties** | Subtiel: fade-in, slide-up, scale. Geen overdreven motion. Respecteer reduced-motion preference. |
| **Audio feedback** | Zachte UI klik-geluiden bij hover/selectie. Factie-thema muziek in menu's. |

### 1.2 UI Layering

```
Laag 0: 3D scene (Three.js canvas)
Laag 1: In-game HUD (HTML overlay, pointer-events: none op lege gebieden)
Laag 2: In-game panels (unit panel, build menu, minimap — pointer-events: auto)
Laag 3: Notifications / Toasts
Laag 4: Modal dialogs (pause menu, settings)
Laag 5: Full-screen overlays (loading, victory, defeat)
Laag 6: Critical overlays (crash report, browser warning)
```

### 1.3 Transitie Patronen

| Van → Naar | Transitie | Duur |
|------------|-----------|------|
| Menu → Menu | Crossfade | 300ms |
| Menu → Game | Fade to black → loading screen → fade in | 500ms + loading + 500ms |
| Game → Pause | Blur achtergrond + slide-in panel | 200ms |
| Game → Victory/Defeat | Slow-motion 2s → fade to overlay | 2500ms |
| Notification in | Slide-in van rechts | 250ms |
| Notification out | Fade + slide-out | 200ms |

---

## 2. Alle Schermen

### 2.1 Splash / Loading Screen

**Doel**: Eerste indruk, engine initialisatie, asset preloading.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│                                                  │
│              [Reign of Brabant Logo]             │
│              Perkament-stijl, goud               │
│                                                  │
│         ━━━━━━━━━━━━━━━━━━━━ 67%                │
│         [Loading progress bar]                   │
│                                                  │
│         "Het Gouden Worstenbroodje               │
│          wordt verwarmd..."                      │
│                                                  │
│         [Tip/Lore snippet, roteert]              │
│                                                  │
│                                        v0.1.0    │
│└──────────────────────────────────────────────────│
```

**Elementen**:

| Element | Beschrijving |
|---------|-------------|
| Logo | `assets/ui/logo.png`, centered, max 400px breed, subtle glow animatie |
| Progress bar | Perkament-stijl track, gouden fill. Toont percentage + label ("Modellen laden...", "Terrein genereren...", "Audio voorbereiden...") |
| Loading labels | Roteren door: "Modellen laden", "Terrein genereren", "Facties mobiliseren", "Worstenbroodjes bakken", "Bier tappen", "Vergaderagenda's invullen" |
| Tip/Lore | Random tip uit de tip-pool (zie sectie 8.4). Wisselt elke 5 seconden met fade. |
| Versienummer | Rechtsonder, klein, `v{VERSION}` |
| Achtergrond | Donker perkament-textuur, subtiel vignette-effect |

**Interacties**:
- Geen interactie mogelijk tijdens laden
- Bij voltooiing: progress bar vult tot 100%, label wordt "Gereed!", 500ms wacht, fade naar Main Menu
- Als laden > 15 seconden duurt: toon "Dit duurt langer dan verwacht..." onder de progress bar

**Technisch**:
- Laad eerst: fonts, UI sprites, logo, menu-achtergrond (~2MB)
- Lazy load: 3D modellen, terrain textures, audio (pas bij game start)
- Progress callback van asset loader mapped naar 0-100%

---

### 2.2 Main Menu

**Doel**: Navigatiehub naar alle game modes en instellingen.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│                                                  │
│  [Logo — kleiner dan splash]                     │
│                                                  │
│  ┌────────────────────────┐                      │
│  │  ⚔️  Schermutsel       │    [3D scene:        │
│  │  🏰  Veldtocht         │     langzaam          │
│  │  🌐  Slagveld Online   │     roterend          │
│  │  ⚙️  Instellingen      │     Brabants dorp     │
│  │  📖  Hoe Te Spelen     │     met units]        │
│  │  🏆  Ranglijst         │                      │
│  │  🎖️  Prestaties        │                      │
│  │  📜  Credits           │                      │
│  └────────────────────────┘                      │
│                                                  │
│  [Taal: NL/EN]           [Volledig Scherm]  v0.1 │
│──────────────────────────────────────────────────│
```

**Elementen**:

| Element | Positie | Beschrijving |
|---------|---------|-------------|
| Logo | Top-center of top-left | Kleiner dan splash, geen animatie |
| Menu items | Links, verticale lijst | Grote knoppen met icoon + tekst. Hover: glow + factie-kleur accent. Focus: duidelijke outline. |
| 3D preview | Rechts (60% breedte) | Lichte 3D scene: Brabants dorpje met idle-animatie units. Langzame camera rotate. Laag polycount (~5K tris). |
| Taalwissel | Linksonder | Toggle NL/EN, vlag-icoontje |
| Fullscreen knop | Rechtsonder | Icoon + tekst "Volledig Scherm" |
| Versie | Rechtsonder | `v{VERSION}` |
| Audio controls | Rechtsonder, naast versie | Mute/unmute icoon |

**Menu Items (in volgorde)**:

| # | Label NL | Label EN | Actie | Beschikbaar |
|---|----------|----------|-------|-------------|
| 1 | Schermutsel | Skirmish | → Faction Select (skirmish mode) | Altijd |
| 2 | Veldtocht | Campaign | → Campaign Map Screen | Altijd |
| 3 | Slagveld Online | Multiplayer | → Multiplayer Lobby | v2.0 (grayed out + "Binnenkort" badge tot dan) |
| 4 | Instellingen | Settings | → Settings Screen (modal overlay) | Altijd |
| 5 | Hoe Te Spelen | How to Play | → Tutorial/How to Play Screen | Altijd |
| 6 | Ranglijst | Leaderboard | → Leaderboard Screen | Altijd |
| 7 | Prestaties | Achievements | → Achievement Screen | Altijd |
| 8 | Credits | Credits | → Credits Screen | Altijd |

**Interacties**:
- Keyboard: pijltjes omhoog/omlaag navigeren door items, Enter selecteert, Tab cyclet door alle interactieve elementen
- Eerste bezoek: "Hoe Te Spelen" pulseert subtiel om aandacht te trekken
- Multiplayer knop: als v2.0 nog niet uit is, toon als disabled met tooltip "Beschikbaar in een toekomstige update"
- ESC: geen actie (je bent al op het hoogste niveau)
- Achtergrondmuziek: Brabants thema, start automatisch (mits audio context actief)

---

### 2.3 Faction Select Screen

**Doel**: Factie kiezen voor skirmish of multiplayer.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│  [← Terug]                    Kies Je Factie     │
│                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │Braban│ │Randst│ │Limbu │ │Belge │           │
│  │ders  │ │  ad  │ │rgers │ │  n   │           │
│  │[wapen│ │[wapen│ │[wapen│ │[wapen│           │
│  │schild│ │schild│ │schild│ │schild│           │
│  │ icoon│ │ icoon│ │ icoon│ │ icoon│           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│   ●actief  ○         🔒v1.0   🔒v2.0           │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │  [Factie Preview Panel]                     │ │
│  │                                             │ │
│  │  BRABANDERS — "De Gezelligen"               │ │
│  │                                             │ │
│  │  [3D model: Prins]  Thema: Gemeenschap      │ │
│  │                      Sterkte: Groepen       │ │
│  │                      Zwakte: Solo zwak      │ │
│  │                      Playstyle: Deathball   │ │
│  │                                             │ │
│  │  Unieke Mechanic: Gezelligheid              │ │
│  │  Units dicht bij elkaar worden sterker.     │ │
│  │  Tot +50% stats bij 20+ units samen.        │ │
│  │                                             │ │
│  │  [Stats radar chart: Economy/Army/Tech/     │ │
│  │   Defense/Speed]                            │ │
│  │                                             │ │
│  │  Lore: "In het jaar 1473 stond Brabant op   │ │
│  │  een kruispunt..."                          │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│              [Volgende: Kies Kaart →]            │
│──────────────────────────────────────────────────│
```

**Elementen**:

| Element | Beschrijving |
|---------|-------------|
| Factie kaarten | 4 kaarten horizontaal. Geselecteerde kaart heeft gouden rand + factie-kleur glow. Locked facties tonen slot-icoon + release versie. |
| Wapenschild icoon | Uniek per factie: Brabant (leeuw + worstenbroodje), Randstad (kantoorgebouw), Limburg (mijnhamer + vlaai), Belgen (frietkegel + bierpul) |
| Preview panel | Slide-in of cross-fade bij factie-wissel. Bevat: |
| - 3D model | Hero unit van de factie, idle animatie, langzaam roterend. 500px hoog. |
| - Stats | Tekst: Thema, Sterkte, Zwakte, Playstyle |
| - Radar chart | 5-assig: Economy (1-5), Army Strength (1-5), Tech Speed (1-5), Defense (1-5), Early Game (1-5) |
| - Unieke mechanic | Korte beschrijving (2-3 regels) van de factie-mechanic |
| - Lore | 3-4 regels factie-achtergrondverhaal, italic, perkament-stijl |
| Volgende knop | Groot, rechtsonder. Disabled als geen factie geselecteerd. |
| Terug knop | Linksboven, gaat naar Main Menu |

**Factie Radar Stats**:

| Factie | Economy | Army | Tech | Defense | Early Game |
|--------|---------|------|------|---------|------------|
| Brabanders | 3 | 4 | 3 | 2 | 4 |
| Randstad | 5 | 4 | 5 | 4 | 1 |
| Limburgers | 2 | 3 | 3 | 5 | 3 |
| Belgen | 4 | 3 | 3 | 3 | 3 |

**Interacties**:
- Klik op factie-kaart: selecteert factie, update preview panel
- Hover op locked factie: tooltip "Beschikbaar in v1.0" / "Beschikbaar in v2.0"
- Keyboard: links/rechts pijltjes wisselen factie, Enter bevestigt
- Locked facties: niet selecteerbaar, grayed out met slot-overlay
- Als maar 2 facties beschikbaar (MVP): toon alle 4 maar locked facties duidelijk als "Binnenkort"

---

### 2.4 Map Select Screen

**Doel**: Kaart kiezen voor skirmish of multiplayer.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│  [← Terug]                     Kies Slagveld     │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ [Thumbnail │  │ [Thumbnail │  │ [Thumbnail │ │
│  │  kaart 1]  │  │  kaart 2]  │  │  kaart 3]  │ │
│  │            │  │            │  │            │ │
│  │ De Kempen  │  │ Oeteldonk  │  │ Het Groene │ │
│  │ 2 spelers  │  │ 2 spelers  │  │   Woud     │ │
│  │            │  │  🔒 v1.0   │  │  🔒 v1.0   │ │
│  └────────────┘  └────────────┘  └────────────┘ │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │  DE KEMPEN                                  │ │
│  │                                             │ │
│  │  [Minimap preview]    Spelers: 2            │ │
│  │                       Grootte: 256x256      │ │
│  │                       Terrein: Vlak met     │ │
│  │                       lichte heuvels        │ │
│  │                                             │ │
│  │  "Het hartland van Brabant. Weilanden,      │ │
│  │  vennen en bossen vormen het decor voor     │ │
│  │  de eerste schermutselingen."               │ │
│  │                                             │ │
│  │  Resources: 6 goudmijnen, 8-10 bosclusters │ │
│  │  Specials: 2 ruines, 1-2 bruggen           │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌─ Tegenstander ─────────────────────────────┐ │
│  │  AI Moeilijkheid: [Makkelijk ▾]            │ │
│  │  AI Factie:       [Willekeurig ▾]          │ │
│  │  Startpositie:    [Willekeurig ▾]          │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│              [Start Gevecht →]                   │
│──────────────────────────────────────────────────│
```

**Elementen**:

| Element | Beschrijving |
|---------|-------------|
| Map thumbnails | Horizontale rij kaarten. Actieve kaart: gouden rand. Locked: slot + versie badge. |
| Map preview | Grotere minimap render van de geselecteerde kaart + metadata |
| Beschrijving | 2-3 regels flavour text over de kaart |
| Tegenstander opties | Alleen bij Skirmish mode |

**Tegenstander Instellingen (Skirmish)**:

| Setting | Opties | Default |
|---------|--------|---------|
| AI Moeilijkheid | Makkelijk, Normaal, Moeilijk, Onmogelijk | Normaal |
| AI Factie | Willekeurig, Brabanders, Randstad, (locked facties grayed out) | Willekeurig |
| Startpositie | Willekeurig, Vast (positie 1 of 2) | Willekeurig |

**Interacties**:
- Klik thumbnail: selecteer kaart, update preview
- Dropdown menus: standaard HTML select, gestyled met game-thema
- "Start Gevecht" knop: disabled als geen kaart geselecteerd
- ESC of Terug: terug naar Faction Select
- Keyboard: Tab door thumbnails en dropdowns, Enter om te selecteren

---

### 2.5 Lobby Screen (Multiplayer) [v2.0]

**Doel**: Multiplayer lobby voor het matchen van spelers.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│  [← Terug]               Slagveld Online         │
│                                                  │
│  ┌─ Lobby ─────────────────────────────────────┐ │
│  │                                             │ │
│  │  Speler 1 (Host)              Speler 2      │ │
│  │  ┌──────────────┐         ┌──────────────┐  │ │
│  │  │ [Avatar]     │         │ [Wachtend... │  │ │
│  │  │ RichardT     │         │  of Avatar]  │  │ │
│  │  │ Brabanders   │         │ [Naam]       │  │ │
│  │  │ ✓ Gereed     │         │ Randstad     │  │ │
│  │  └──────────────┘         │ ○ Niet gereed│  │ │
│  │                           └──────────────┘  │ │
│  │                                             │ │
│  │  Kaart: De Kempen          [Wijzig Kaart]   │ │
│  │  Snelheid: Normaal         [Wijzig]         │ │
│  │                                             │ │
│  │  [Uitnodigingslink kopiëren 📋]             │ │
│  │  https://theuws.com/games/rob/lobby/abc123  │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌─ Chat ──────────────────────────────────────┐ │
│  │  RichardT: gg                               │ │
│  │  Speler2: klaar?                            │ │
│  │  [Typ een bericht...              ] [Stuur] │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│              [Start Gevecht →]                   │
│          (alleen actief als alle spelers gereed)  │
│──────────────────────────────────────────────────│
```

**Elementen**:

| Element | Beschrijving |
|---------|-------------|
| Speler slots | 2 slots (uitbreidbaar voor toekomstige 4-player maps). Toont avatar, naam, gekozen factie, gereed-status. |
| Host controls | Alleen de host kan kaart/snelheid wijzigen en het gevecht starten. |
| Uitnodigingslink | Kopieerbaar URL. Bij klik: "Gekopieerd!" feedback 2 seconden. |
| Chat | Simpele tekst chat. Max 200 karakters per bericht. Scrollbaar. Chat filter optie in settings. |
| Ready toggle | Elke speler klikt "Gereed" wanneer klaar. Beide moeten gereed zijn om te starten. |
| Start knop | Alleen voor host, alleen actief als alle spelers gereed. |

**Interacties**:
- Host kan factie en kaart wijzigen; gast kan alleen eigen factie kiezen
- Als gast disconnectt: slot gaat terug naar "Wachtend..."
- Chat: Enter stuurt bericht, Shift+Enter voor newline
- ESC: "Wil je de lobby verlaten?" bevestigingsmodal
- Als host de lobby verlaat: gast krijgt melding "Host heeft de lobby verlaten" en wordt teruggestuurd naar main menu

**Lobby States**:

| State | UI |
|-------|-----|
| Wachtend op speler | Slot 2 toont pulserende "Wachtend..." tekst + uitnodigingslink is prominent |
| Speler joined | Slot vult zich, welkomstbericht in chat |
| Speler niet gereed | Oranje cirkel naast naam |
| Speler gereed | Groen vinkje naast naam |
| Alle gereed | Start knop licht op met gouden glow |
| Speler disconnect | Slot gaat terug naar "Wachtend...", chat melding |

---

### 2.6 Loading / Map Generate Screen

**Doel**: Transitie tussen lobby/menu en gameplay. Map generatie, asset loading.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│                                                  │
│         [Kaart naam — groot]                     │
│         DE KEMPEN                                │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  │          [Concept art van de kaart]          │ │
│  │          of [Factie illustratie]             │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  "De Brabanders geloven dat een goed             │
│   worstenbroodje de sleutel is tot vrede.        │
│   De Randstad gelooft dat ook — maar dan         │
│   als PowerPoint-slide."                         │
│                                                  │
│         ━━━━━━━━━━━━━━━━━━━━ 45%                │
│         Terrein genereren...                     │
│                                                  │
│  💡 Tip: Groepeer je Brabandse units voor de     │
│     Gezelligheid-bonus!                          │
│──────────────────────────────────────────────────│
```

**Elementen**:

| Element | Beschrijving |
|---------|-------------|
| Kaart naam | Groot, serif, centered. Subtitel met kaart-thema. |
| Illustratie | Concept art of factie-art, 60% breedte, centered. Fade-in animatie. |
| Lore snippet | Korte verhalende tekst gerelateerd aan de gekozen kaart of facties. Wisselt elke 8 seconden. |
| Progress bar | Zelfde stijl als splash screen. Labels: "Terrein genereren...", "Eenheden plaatsen...", "Fog of War initialiseren...", "AI voorbereiden..." |
| Tip | Random tip uit de tip-pool. Wisselt elke 6 seconden. Lampje-icoon ervoor. |

**Loading Stappen** (mapped naar progress):

| Stap | Progress | Label |
|------|----------|-------|
| Heightmap laden/genereren | 0-15% | Terrein genereren... |
| Terrain mesh + textures | 15-30% | Landschap opbouwen... |
| Building models laden | 30-45% | Gebouwen laden... |
| Unit models laden | 45-60% | Eenheden mobiliseren... |
| NavMesh genereren | 60-70% | Paden berekenen... |
| Audio laden | 70-80% | Slagveldgeluiden laden... |
| Fog of War init | 80-85% | Mist des oorlogs activeren... |
| AI initialiseren | 85-95% | Tegenstander voorbereiden... |
| Final setup | 95-100% | Het slagveld is gereed! |

---

### 2.7 In-Game HUD

**Doel**: Alle informatie die de speler nodig heeft tijdens gameplay, zonder het slagveld te blokkeren.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│  [Resources]                    [Alerts / Clock] │
│  🍞 523  🍺 312  😊 45/100     ⏱ 12:34  ⚠ ×2  │
│  Pop: 34/58                                      │
│                                                  │
│                                                  │
│                                                  │
│              [3D GAME WORLD]                     │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│  ┌──────┐                                        │
│  │Mini  │                      [Toast area]      │
│  │map   │                                        │
│  │      │                                        │
│  │      │  ┌──────────────────────────────────┐  │
│  └──────┘  │ [Unit/Building Panel]            │  │
│            │ [Portrait] [Stats] [Actions/Build]│  │
│            │ [Ability bar: Q W E R]           │  │
│            └──────────────────────────────────┘  │
│──────────────────────────────────────────────────│
```

#### 2.7.1 Resource Bar (Top)

**Positie**: Bovenkant, links uitgelijnd, horizontaal.

| Element | Beschrijving | Visueel |
|---------|-------------|---------|
| Primaire resource | Factie-specifiek icoon + aantal. Bijv. 🍞 523 voor Brabanders. | Icoon 24px + getal, wit op semi-transparante donkere achtergrond |
| Secundaire resource | Factie-specifiek icoon + aantal. Bijv. 🍺 312. | Zelfde stijl |
| Tertiaire resource | Factie-specifiek icoon + aantal/max. Bijv. 😊 45/100 (Gezelligheid). | Met fill-bar achtergrond |
| Population | Icoon + huidige/maximum. Bijv. 👥 34/58. | Rood als op of boven 90% van cap |
| Income indicators | Kleine +/- per seconde naast elk resource getal | Groen voor positief, grijs bij 0 |

**Resource namen per factie (in HUD)**:

| Factie | Primair icoon | Secundair icoon | Tertiair icoon |
|--------|--------------|-----------------|----------------|
| Brabanders | Worstenbroodje | Bierpul | Hartje (Gezelligheid) |
| Randstad | PowerPoint | LinkedIn logo | Kopje (Havermoutmelk) |
| Limburgers | Vlaai | Mergelblok | Kolenwagen (Kolen) |
| Belgen | Friet | Trappist | Chocoladereep (Chocolade) |

**Interacties**:
- Hover op resource: tooltip met volledige naam + income breakdown ("Worstenbroodjes: 523 (+8/min van 4 Boeren, -6/min bouwkosten)")
- Population rood + knippert als cap bereikt
- Resource knippert rood als onder 0 dreigt te komen bij een actie

#### 2.7.2 Clock & Alerts (Top-right)

| Element | Beschrijving |
|---------|-------------|
| Klok | Game time of real time (instelbaar). Format: MM:SS of HH:MM:SS. |
| Alert counter | Aantal actieve alerts (bijv. "3 eenheden onder aanval"). Klik: spring naar eerste alert locatie. |
| FPS counter | Alleen zichtbaar als ingeschakeld in settings. Klein, grijs. |
| Ping | Alleen multiplayer. Groen/geel/rood icoon + ms waarde. |

#### 2.7.3 Minimap (Bottom-left)

**Grootte**: Instelbaar (Klein: 150px, Medium: 200px, Groot: 250px).

| Element | Beschrijving |
|---------|-------------|
| Terrain | Vereenvoudigde topdown weergave. Groen = gras, blauw = water, bruin = heuvels. |
| Fog of War | Zwart = unexplored, donkergrijs = explored, helder = visible |
| Eigen units | Groene stippen |
| Vijandelijke units | Rode stippen (alleen in visible area) |
| Gebouwen | Vierkantjes in factie-kleur |
| Resource nodes | Gele stippen (goud), groene stippen (bomen) |
| Camera viewport | Witte rechthoek die het huidige cameragebied toont |
| Alert pings | Rode pulserende cirkels bij aanvallen |

**Interacties**:
- Linksklik op minimap: camera springt naar die locatie
- Rechtsklik op minimap: stuur geselecteerde units naar die locatie
- Scroll op minimap: geen effect (voorkom onbedoeld zoomen)
- Minimap drag: continue camera movement terwijl je sleept

#### 2.7.4 Unit / Building Selection Panel (Bottom-center)

**Wanneer NIETS geselecteerd**: Panel is verborgen (meer viewport).

**Wanneer 1 UNIT geselecteerd**:
```
┌──────────────────────────────────────────────────┐
│ [Portrait 64px]  Carnavalvierder          Lvl 1  │
│                  HP: ████████░░ 65/80             │
│                  ATK: 10  ARM: 1  SPD: 5.5       │
│                  Status: Idle                     │
│                                                  │
│  [Q] Polonaise   [W] —   [E] —   [R] —          │
│  Cooldown: ████░░ 12s                            │
│                                                  │
│  [S] Stop  [H] Hold  [A] Attack-Move  [P] Patrol│
│──────────────────────────────────────────────────│
```

| Element | Beschrijving |
|---------|-------------|
| Portrait | 64x64 unit portrait/icon. Factie-kleur rand. |
| Naam | Unit type naam |
| HP bar | Groen > geel > rood gradient op basis van percentage. Numeriek erbij. |
| Stats | Compacte stats: ATK, ARM, SPD, RNG (alleen als > 0) |
| Status | Huidige state: Idle, Moving, Attacking, Gathering, Building, Fleeing |
| Ability bar | Hotkey labels (Q/W/E/R) met ability icoon. Grayed out als on cooldown. Cooldown radial timer overlay. |
| Command buttons | S (Stop), H (Hold), A (Attack-Move), P (Patrol). Met hotkey labels. |

**Wanneer MEERDERE UNITS geselecteerd** (max 24 in selectie):
```
┌──────────────────────────────────────────────────┐
│ 12 eenheden geselecteerd                         │
│                                                  │
│ [Port][Port][Port][Port][Port][Port]             │
│ [Port][Port][Port][Port][Port][Port]             │
│                                                  │
│ [S] Stop  [H] Hold  [A] Attack-Move  [P] Patrol │
│──────────────────────────────────────────────────│
```

| Element | Beschrijving |
|---------|-------------|
| Unit grid | Grid van kleine portraits (32x32). Klik op portrait: selecteer alleen die unit. Ctrl+klik: verwijder uit selectie. |
| HP indicator | Dunne HP bar onder elk portrait. Kleur op basis van health percentage. |
| Groepstats | Geen geaggregeerde stats (te complex). Alleen het aantal geselecteerde eenheden. |
| Double-click portrait | Selecteer ALLE units van dat type op het scherm |

**Wanneer 1 GEBOUW geselecteerd**:
```
┌──────────────────────────────────────────────────┐
│ [Icon 64px]  Cafe                         Tier 1 │
│              HP: ████████████ 800/800            │
│              Status: Training...                 │
│                                                  │
│  Productie: Carnavalvierder ████░ 12/18s         │
│  Wachtrij: [Carnaval] [Kansen] [—] [—] [—]      │
│                                                  │
│  [Q] Carnavalvierder  75🍞 25🍺  18s             │
│  [W] Kansen           60🍞 40🍺  22s             │
│  [E] Muzikansen       100🍞 75🍺  28s  🔒Tier2  │
│  [R] Rally Point                                 │
│──────────────────────────────────────────────────│
```

| Element | Beschrijving |
|---------|-------------|
| Build icon | Gebouw icon, factie-kleur rand |
| HP bar | Gebouw HP, blauw als er een shield/aura op zit |
| Production progress | Bar met timer voor het huidige unit-in-training |
| Queue | Max 5 units in queue. Klik op queue-item: annuleer (met bevestiging als "Bevestig destructieve acties" aanstaat) |
| Build options | Hotkey + unit naam + kosten + bouwtijd. Grayed out als te duur of locked. Locked items tonen slot + unlock-conditie. |
| Rally Point | R-knop om een verzamelpunt in te stellen (klik op terrein na knopdruk) |

**Interacties**:
- Hover op ability/build optie: uitgebreide tooltip met beschrijving, stats, kosten
- Klik op locked item: tooltip "Vereist: [gebouw/tier]"
- Resource tekst rood als je niet genoeg hebt
- ESC: deselecteer alles
- Tab: cycle door abilities/build opties

#### 2.7.5 Control Groups (Top, onder resource bar)

```
[1] ■■■  [2] ■■  [3]  [4]  [5]  [6]  [7]  [8]  [9]
```

| Element | Beschrijving |
|---------|-------------|
| Group nummer | 1-9, altijd zichtbaar |
| Unit indicator | Kleine stippen die het aantal units in de groep tonen (max 5 stippen, daarna getal) |
| Lege groep | Dim/transparant |
| Actieve groep | Helder + outline |

**Interacties**:
- Ctrl + 1-9: wijs geselecteerde units toe aan groep
- 1-9: selecteer groep
- Dubbel-druk op nummer: selecteer en center camera op groep
- Hover op groep: tooltip met samenstelling ("3 Carnavalvierders, 2 Kansen, 1 Boerinne")

#### 2.7.6 Build Grid Overlay

Wanneer een worker geselecteerd is en de speler een gebouw wil plaatsen:
- Groen raster: valide bouwlocatie
- Rood raster: onvalide (te dicht bij ander gebouw, water, buiten bereik)
- Ghost van het gebouw volgt de muis
- Linksklik: plaats gebouw
- Rechtsklik of ESC: annuleer plaatsing
- Building grid overlay kan permanent aan/uit gezet worden in settings

---

### 2.8 In-Game Pause Menu

**Doel**: Pauze, settings, opslaan, opgeven.

**Trigger**: ESC toets (als niets geselecteerd) of dedicated Pause-knop (als die in HUD staat).

**Layout**:
```
┌──────────────────────────────────────────────────┐
│                                                  │
│         [Game blurred + donker overlay]           │
│                                                  │
│         ┌────────────────────────┐               │
│         │                        │               │
│         │   ⏸ GEPAUZEERD        │               │
│         │                        │               │
│         │   [Hervat Gevecht]     │               │
│         │   [Instellingen]       │               │
│         │   [Opslaan]            │               │
│         │   [Laden]              │               │
│         │   [Hoe Te Spelen]      │               │
│         │   [Geef Op]            │               │
│         │   [Verlaat Spel]       │               │
│         │                        │               │
│         └────────────────────────┘               │
│                                                  │
│──────────────────────────────────────────────────│
```

**Menu Items**:

| # | Label | Actie | Beschikbaarheid |
|---|-------|-------|-----------------|
| 1 | Hervat Gevecht / Resume | Sluit pause menu, hervat game loop | Altijd |
| 2 | Instellingen / Settings | Open settings modal (subset: audio, graphics, game) | Altijd |
| 3 | Opslaan / Save | Sla huidige game state op in localStorage | Alleen singleplayer |
| 4 | Laden / Load | Laad opgeslagen game | Alleen singleplayer |
| 5 | Hoe Te Spelen / How to Play | Open hotkey/controls reference | Altijd |
| 6 | Geef Op / Surrender | Bevestigingsmodal → Defeat Screen | Altijd |
| 7 | Verlaat Spel / Quit to Menu | Bevestigingsmodal → Main Menu | Altijd |

**Interacties**:
- ESC: sluit pause menu (hervat)
- Game loop PAUZEERT volledig (singleplayer)
- In multiplayer: game pauzeert NIET, maar overlay verschijnt. "Geef Op" werkt, "Opslaan/Laden" zijn verborgen.
- "Geef Op" en "Verlaat Spel" tonen bevestigingsmodal: "Weet je het zeker? Niet-opgeslagen voortgang gaat verloren." met [Ja, geef op] en [Annuleer].
- Keyboard: pijltjes navigeren, Enter selecteert, ESC sluit

**Save System**:
- localStorage key: `rob-save-{slot}` (max 3 slots)
- Opslaan toont: slot selectie → overschrijf bevestiging als slot bezet → "Opgeslagen!" feedback
- Laden toont: slot selectie met timestamp + factie + kaartnaam per slot → bevestiging → laden

---

### 2.9 Victory Screen

**Doel**: Vieren van overwinning, statistieken tonen, terugkeren naar menu.

**Trigger**: Alle vijandelijke Town Halls vernietigd (of surrender).

**Transitie**: Slow-motion 2 seconden op het laatste gebouw dat vernietigd wordt → confetti/fireworks particle effect → fade naar Victory Screen.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│                                                  │
│              ⚔️ OVERWINNING! ⚔️                  │
│              "Brabant is veilig!"                 │
│                                                  │
│  ┌─ Slagveld Statistieken ─────────────────────┐ │
│  │                                             │ │
│  │  Speeltijd:          24:31                  │ │
│  │  Eenheden getraind:  87                     │ │
│  │  Eenheden verloren:  34                     │ │
│  │  Vijanden verslagen: 62                     │ │
│  │  Gebouwen gebouwd:   14                     │ │
│  │  Gebouwen vernietigd:8                      │ │
│  │  Resources verzameld:4.230 / 2.810          │ │
│  │  Grootste leger:     42 eenheden            │ │
│  │  Hero kills:         8                      │ │
│  │  Abilities gebruikt: 12                     │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌─ Beloningen ────────────────────────────────┐ │
│  │  🏆 Eerste Overwinning!     [NIEUW]         │ │
│  │  ⭐ ⭐ ⭐ (3 sterren — geen gebouw verloren) │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  [Opnieuw Spelen]  [Volgende Missie →]  [Menu]  │
│──────────────────────────────────────────────────│
```

**Elementen**:

| Element | Beschrijving |
|---------|-------------|
| Titel | "OVERWINNING!" met gouden tekst, factie-kleur accenten, subtiele shimmer animatie |
| Subtitle | Factie-specifiek: "Brabant is veilig!" / "De spreadsheets zijn compleet!" |
| Statistieken | Complete breakdown van de match (zie tabel) |
| Sterren | 1-3 sterren op basis van prestatie (zie criteria) |
| Achievements | Eventueel unlocked achievements, met [NIEUW] badge |
| Knoppen | Opnieuw Spelen (zelfde settings), Volgende Missie (alleen campaign), Menu (terug naar main menu) |

**Sterren Criteria (Campaign)**:

| Sterren | Voorwaarde |
|---------|-----------|
| 1 ster | Missie voltooid |
| 2 sterren | Missie voltooid + minder dan 50% units verloren |
| 3 sterren | Missie voltooid + minder dan 20% units verloren + geen eigen gebouw vernietigd |

**Interacties**:
- Stats verschijnen met een counter-up animatie (getallen rollen omhoog)
- Sterren verschijnen een voor een met een glow-effect en geluid
- Nieuwe achievements: unlock-animatie + geluid
- Keyboard: Tab door knoppen, Enter selecteert
- "Opnieuw Spelen" start direct dezelfde match opnieuw
- "Volgende Missie" gaat naar Campaign Briefing van de volgende missie

---

### 2.10 Defeat Screen

**Doel**: Informatief einde bij verlies, motiveren om opnieuw te proberen.

**Trigger**: Spelers Town Hall vernietigd (laatste Town Hall als er meerdere waren).

**Transitie**: Camera focust op brandend Town Hall → slow-motion → fade to red → Defeat Screen.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│                                                  │
│              💀 VERSLAGEN 💀                      │
│              "Het worstenbroodje is verloren..."  │
│                                                  │
│  ┌─ Wat ging er mis? ─────────────────────────┐  │
│  │                                             │ │
│  │  Speeltijd:          18:42                  │ │
│  │  Eenheden getraind:  43                     │ │
│  │  Eenheden verloren:  43                     │ │
│  │  Vijanden verslagen: 28                     │ │
│  │  Resources verzameld:2.100 / 1.430          │ │
│  │                                             │ │
│  │  💡 Tip: "Probeer je Brabandse units        │ │
│  │     bij elkaar te houden voor de            │ │
│  │     Gezelligheid-bonus!"                    │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│       [Opnieuw Proberen]  [Menu]                 │
│──────────────────────────────────────────────────│
```

**Elementen**:

| Element | Beschrijving |
|---------|-------------|
| Titel | "VERSLAGEN" met donkerrode tekst, somber |
| Subtitle | Factie-specifiek: "Het worstenbroodje is verloren..." / "De aandelen kelderen..." |
| Statistieken | Zelfde stats als Victory maar compacter |
| Tip | Contextuele tip gebaseerd op wat er misging (bijv. te weinig units getraind → tip over productie, te snel gerushed → tip over economy) |
| Knoppen | Opnieuw Proberen (zelfde match, zelfde settings), Menu (terug naar main menu) |

**Contextuele Tips**:

| Situatie | Tip |
|----------|-----|
| < 20 units getraind | "Train meer eenheden! Een grotere legermacht geeft je meer flexibiliteit." |
| 0 gebouwen vernietigd | "Probeer het vijandelijke kamp eerder aan te vallen. Scouts helpen je hun basis te vinden." |
| < 5 min speeltijd | "Neem de tijd om je economie op te bouwen voordat je aanvalt." |
| > 30 min speeltijd | "Probeer agressiever te spelen. Laat de vijand niet te lang bouwen." |
| 0 abilities gebruikt | "Vergeet je abilities niet! Ze kunnen het verschil maken in een gevecht." |
| Brabanders + lage groepsgrootte | "Groepeer je Brabandse units voor de Gezelligheid-bonus!" |

**Interacties**:
- "Opnieuw Proberen" start direct dezelfde match met dezelfde settings
- Keyboard: Tab door knoppen, Enter selecteert
- Geen achievements getoond bij verlies (voorkom frustratie)

---

### 2.11 Leaderboard Screen

**Doel**: Ranglisten tonen voor skirmish en campaign.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│  [← Terug]                     Ranglijst         │
│                                                  │
│  [Skirmish]  [Veldtocht]  [Wekelijks]            │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │  #   Speler          Score   Factie  Wins   │ │
│  │  1.  👑 RichardT     12.450  Brabant  28    │ │
│  │  2.  NachtWansen     11.230  Randst.  25    │ │
│  │  3.  FrietFanaat     10.890  Belgen   24    │ │
│  │  4.  MijnHansen      9.770   Limburg  22    │ │
│  │  5.  StageStrijder   8.340   Randst.  19    │ │
│  │  ...                                        │ │
│  │  42. Jansen          1.230   Brabant  3     │ │
│  │                                             │ │
│  │  ── Jouw positie ──                         │ │
│  │  15. RichardT        5.670   Brabant  12    │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  Sorteer op: [Score ▾]  Filter factie: [Alle ▾]  │
│──────────────────────────────────────────────────│
```

**Tabs**:

| Tab | Inhoud |
|-----|--------|
| Skirmish | Hoogste scores uit skirmish matches |
| Veldtocht | Campaign completion: sterren per missie, totaal sterren |
| Wekelijks | Top spelers van de afgelopen 7 dagen |

**Score Berekening (Skirmish)**:

| Component | Punten |
|-----------|--------|
| Overwinning | 500 |
| Per vijand verslagen | 5 |
| Per gebouw vernietigd | 25 |
| Snelheidsbonus (< 15 min) | 200 |
| Geen gebouw verloren bonus | 150 |
| AI moeilijkheid multiplier | Makkelijk 0.5x, Normaal 1x, Moeilijk 1.5x, Onmogelijk 2x |

**Interacties**:
- Klik op tab: wissel leaderboard
- Sorteer dropdown: Score, Wins, Snelste tijd
- Filter dropdown: Alle, per factie
- Eigen positie altijd zichtbaar onderin als je niet in de top 10 staat
- Hover op speler: tooltip met gedetailleerde stats
- Backend: PHP + SQLite op theuws.com (zelfde pattern als Wolfenstein leaderboard)

---

### 2.12 Settings Screen

**Doel**: Alle game-instellingen op een plek. Bereikbaar vanuit Main Menu en Pause Menu.

Zie [Sectie 3: Settings Menu](#3-settings-menu) voor de volledige specificatie.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│  [← Terug / Sluiten ✕]          Instellingen     │
│                                                  │
│  [Grafisch] [Audio] [Besturing] [Spel] [Online]  │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  │  [Inhoud van geselecteerde tab]             │ │
│  │  (zie sectie 3 voor alle details)           │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  [Standaard Herstellen]          [Opslaan]       │
│──────────────────────────────────────────────────│
```

**Interacties**:
- Tab navigatie: klik of links/rechts pijltjes
- Wijzigingen: worden direct toegepast (live preview)
- "Standaard Herstellen": bevestigingsmodal → reset alle settings in huidige tab
- "Opslaan": schrijft naar localStorage `rob-settings`
- ESC of Sluiten: als er onopgeslagen wijzigingen zijn → "Wijzigingen opslaan?" modal
- Bij openen vanuit Pause Menu: alleen relevante tabs (geen Multiplayer tab als singleplayer)

---

### 2.13 Credits Screen

**Doel**: Iedereen en alles credits geven.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│  [← Terug]                       Credits         │
│                                                  │
│              REIGN OF BRABANT                    │
│                                                  │
│  [Langzaam scrollend, auto of manueel]           │
│                                                  │
│  Game Design & Development                       │
│  Richard Theuws                                  │
│                                                  │
│  AI Assistentie                                  │
│  Claude Code (Anthropic)                         │
│                                                  │
│  3D Modellen                                     │
│  Blender 5.1 (procedureel)                       │
│  Meshy v6 (AI-gegenereerd)                       │
│  AccuRIG 2.0 (rigging)                           │
│                                                  │
│  Muziek                                          │
│  Suno (AI-gecomponeerd)                          │
│  Richard Theuws (compositie)                     │
│                                                  │
│  Stemmen                                         │
│  ElevenLabs (AI voices)                          │
│                                                  │
│  Geluidseffecten                                 │
│  ElevenLabs (AI SFX)                             │
│                                                  │
│  2D Assets & Textures                            │
│  fal.ai (Flux Dev/Pro, Recraft V3)               │
│  GenPBR (PBR maps)                               │
│  Poly Haven & AmbientCG (CC0 textures)           │
│                                                  │
│  Technologie                                     │
│  Three.js — 3D rendering                         │
│  bitECS — Entity Component System                │
│  recast-navigation-js — Pathfinding              │
│  Yuka.js — Game AI                               │
│  Howler.js — Audio                               │
│  Vite — Build tool                               │
│  TypeScript                                      │
│                                                  │
│  Speciale Dank                                   │
│  Alle worstenbroodjesbakkers van Brabant         │
│  De uitvinders van carnaval                      │
│  Iedereen die ooit ALAAF heeft geroepen          │
│                                                  │
│  © 2026 Richard Theuws                           │
│  theuws.com/games/reign-of-brabant               │
│──────────────────────────────────────────────────│
```

**Interacties**:
- Auto-scroll: langzaam omhoog, cinema-stijl
- Manueel scrollen: scroll-wiel of pijltjes
- ESC of Terug: stop scroll, terug naar menu
- Achtergrondmuziek: rustig, episch thema
- Easter egg: na alle credits, wacht 5 seconden → korte grap ("Geen worstenbroodjes zijn beschadigd tijdens de ontwikkeling van dit spel.")

---

### 2.14 Campaign Map Screen

**Doel**: Missie selectie en voortgang overzicht voor de campaign.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│  [← Terug]          Het Gouden Worstenbroodje    │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  │     [Gestileerde kaart van Brabant]         │ │
│  │                                             │ │
│  │     ①──②──③──④                              │ │
│  │     Reusel  Grens Tilburg Den Bosch         │ │
│  │                    ↓                        │ │
│  │              ⑤──⑥──⑦──⑧                    │ │
│  │              Limburg  Groene  Oeteldonk      │ │
│  │                       Woud   Den Bosch      │ │
│  │                         ↓                   │ │
│  │                    ⑨──⑩──⑪──⑫              │ │
│  │                    Limburg Eindhoven Brabant │ │
│  │                                  Randstad   │ │
│  │                                  HQ         │ │
│  │                                             │ │
│  │  ⭐⭐⭐ = voltooid (3 sterren)               │ │
│  │  ⭐⭐☆ = voltooid (2 sterren)               │ │
│  │  ●    = beschikbaar                         │ │
│  │  🔒   = gelocked                            │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  Totaal: ⭐ 18/36       Missies: 7/12 voltooid  │
│──────────────────────────────────────────────────│
```

**Elementen**:

| Element | Beschrijving |
|---------|-------------|
| Kaart | Gestileerde topdown kaart van Brabant en omgeving. Missie-nodes verbonden met paden. |
| Missie nodes | Cirkels op de kaart. Kleur/stijl op basis van status. |
| Pad | Lijn tussen missie-nodes. Goud als voltooid, grijs als beschikbaar, onzichtbaar als locked. |
| Sterren | Kleine sterren onder voltooide missie-nodes |
| Totaal voortgang | Onderin: totaal sterren + voltooide missies |

**Missie Node States**:

| State | Visueel | Interactie |
|-------|---------|-----------|
| Voltooid (3 sterren) | Gouden cirkel + 3 gouden sterren | Klikbaar: herbespeel voor hogere score |
| Voltooid (< 3 sterren) | Zilveren cirkel + sterren | Klikbaar: herbespeel voor meer sterren |
| Beschikbaar | Pulserend wit cirkel | Klikbaar: open Campaign Briefing |
| Gelocked | Grijze cirkel + slot | Hover: "Voltooi missie X om dit te ontgrendelen" |

**Interacties**:
- Klik op beschikbare/voltooide missie: open Campaign Briefing
- Hover op missie: tooltip met missienaam, locatie, beste score
- Keyboard: pijltjes navigeren tussen missie-nodes, Enter opent briefing
- Zoom in/uit op kaart: scrollwiel (optioneel)
- Pan: slepen (optioneel)

---

### 2.15 Campaign Briefing Screen

**Doel**: Verhalende intro voor een campaign missie + doelstellingen.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│  [← Terug]         Missie 4: De Binnendieze      │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │                                             │ │
│  │  [Illustratie: Den Bosch bij nacht]         │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  "De Randstad heeft hun spionnen in Den Bosch    │
│   gestationeerd. De enige manier om hun          │
│   geheime plannen te achterhalen is via de       │
│   eeuwenoude Binnendieze — het ondergrondse      │
│   waterwegennetwerk onder de stad."              │
│                                                  │
│  ┌─ Doelstellingen ───────────────────────────┐  │
│  │  ☐ Primair: Infiltreer het Randstad-kamp    │ │
│  │  ☐ Primair: Steel de vergaderstukken        │ │
│  │  ☐ Bonus: Geen alarm getriggerd             │ │
│  │  ☐ Bonus: Alle Kansen overleven             │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  Nieuwe eenheid ontgrendeld: KANSEN              │
│  [Portrait]  Stealth ranged unit. Bierpullen     │
│              werpen + Smokkelroute ability.       │
│                                                  │
│  ┌─ Sterren Criteria ─────────────────────────┐  │
│  │  ⭐ Missie voltooid                         │ │
│  │  ⭐⭐ + Geen alarm                           │ │
│  │  ⭐⭐⭐ + Alle Kansen overleven               │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│              [Start Missie →]                    │
│──────────────────────────────────────────────────│
```

**Elementen**:

| Element | Beschrijving |
|---------|-------------|
| Illustratie | Concept art of AI-gegenereerde sceneafbeelding, 100% breedte, max 250px hoog |
| Narratieve tekst | Verhalende intro, 3-5 zinnen. Italic, perkament-stijl achtergrond. Optioneel: typewriter-effect animatie. |
| Doelstellingen | Checkboxes (puur visueel). Primaire (verplicht) en bonus doelen. |
| Nieuwe elementen | Als de missie nieuwe units/gebouwen/mechanics introduceert: preview met portrait + korte beschrijving. |
| Sterren criteria | Uitleg wat nodig is voor 1, 2, 3 sterren. |
| Start knop | Groot, centered. Start de missie (→ Loading Screen → gameplay). |

**Interacties**:
- Scrollbaar als content te lang is
- "Start Missie" start Loading Screen met missie-specifieke tips/lore
- ESC of Terug: terug naar Campaign Map
- Keyboard: Tab naar Start Missie, Enter start
- Bij herbespelen: toont vorige score + "Verbeter je score!"

---

### 2.16 Achievement / Unlock Screen

**Doel**: Verzameling van achievements en unlocks.

**Layout**:
```
┌──────────────────────────────────────────────────┐
│  [← Terug]                     Prestaties        │
│                                                  │
│  Ontgrendeld: 8/32           Voortgang: 25%      │
│  ━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░                 │
│                                                  │
│  ┌─ Gevecht ──────────────────────────────────┐  │
│  │  ✅ Eerste Bloed — Versla je eerste vijand  │  │
│  │  ✅ Legerbouwer — Train 100 eenheden       │  │
│  │  🔒 Onverslaanbaar — Win 10 gevechten       │  │
│  │  🔒 ??? — [Verborgen achievement]           │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─ Economie ─────────────────────────────────┐  │
│  │  ✅ Bakker — Verzamel 1000 Worstenbroodjes │  │
│  │  🔒 Tycoon — Verzamel 10.000 van elke     │  │
│  │  🔒 ??? — [Verborgen achievement]           │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─ Veldtocht ────────────────────────────────┐  │
│  │  ✅ Hoofdstuk 1 — Voltooi missie 1-4       │  │
│  │  🔒 Perfectionist — Alle missies 3 sterren │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─ Speciaal ─────────────────────────────────┐  │
│  │  🔒 ALAAF! — Gebruik Carnavalsrage 10 keer │  │
│  │  🔒 ??? — [Verborgen achievement]           │  │
│  └────────────────────────────────────────────┘  │
│──────────────────────────────────────────────────│
```

**Achievement Categorieen**:

| Categorie | Beschrijving |
|-----------|-------------|
| Gevecht | Gerelateerd aan combat en overwinningen |
| Economie | Gerelateerd aan resources en bouwen |
| Veldtocht | Campaign-specifieke achievements |
| Speciaal | Factie-specifieke, easter eggs, grappige achievements |

**Achievement List (MVP)**:

| # | Naam | Beschrijving | Categorie | Verborgen |
|---|------|-------------|-----------|-----------|
| 1 | Eerste Bloed | Versla je eerste vijandelijke eenheid | Gevecht | Nee |
| 2 | Legerbouwer | Train 100 eenheden in totaal | Gevecht | Nee |
| 3 | Veldheer | Win 5 schermutselgevechten | Gevecht | Nee |
| 4 | Onverslaanbaar | Win 10 gevechten zonder een gebouw te verliezen | Gevecht | Nee |
| 5 | Blitzkrieg | Win een gevecht in minder dan 10 minuten | Gevecht | Nee |
| 6 | David vs Goliath | Win tegen Onmogelijke AI | Gevecht | Nee |
| 7 | Bakker | Verzamel 1.000 Worstenbroodjes (cumulatief) | Economie | Nee |
| 8 | Tapper | Verzamel 1.000 Bier (cumulatief) | Economie | Nee |
| 9 | Tycoon | Verzamel 10.000 van elke resource (cumulatief) | Economie | Nee |
| 10 | Stedenbouwer | Bouw 50 gebouwen (cumulatief) | Economie | Nee |
| 11 | Hoofdstuk 1 | Voltooi missies 1-4 | Veldtocht | Nee |
| 12 | Hoofdstuk 2 | Voltooi missies 5-8 | Veldtocht | Nee |
| 13 | Hoofdstuk 3 | Voltooi missies 9-12 | Veldtocht | Nee |
| 14 | Perfectionist | Alle campaign missies met 3 sterren | Veldtocht | Nee |
| 15 | ALAAF! | Gebruik Carnavalsrage 10 keer (cumulatief) | Speciaal | Nee |
| 16 | Gezelligheidsmeester | Bereik 100 Gezelligheid in een gevecht | Speciaal | Nee |
| 17 | Vergaderterrorist | Win een gevecht terwijl de Randstad in Werkoverleg is | Speciaal | Ja |
| 18 | Worstenbroodjesroof | Steel als Randstad de eerste resource node | Speciaal | Ja |
| 19 | Pacifist | Win een gevecht zonder meer dan 10 vijanden te doden | Speciaal | Ja |
| 20 | Speedrunner | Voltooi de hele campaign in < 2 uur totale speeltijd | Speciaal | Ja |

**Interacties**:
- Hover op unlocked achievement: beschrijving + datum behaald
- Hover op locked + niet-verborgen: beschrijving + voortgang (bijv. "3/10 overwinningen")
- Hover op verborgen: "???" + "Blijf spelen om dit te ontgrendelen"
- Achievement data opgeslagen in localStorage `rob-achievements`
- Scrollbaar per categorie

**How to Play Screen**: zie [Sectie 8: Tutorial Systeem](#8-tutorial-systeem).

---

## 3. Settings Menu

Alle settings worden opgeslagen in `localStorage` onder key `rob-settings`. Elk setting heeft een `key`, `default`, mogelijke waarden, en een beschrijving van het effect.

### 3.1 Grafisch / Graphics

| # | Setting | Key | Type | Default | Opties | Effect |
|---|---------|-----|------|---------|--------|--------|
| 1 | Kwaliteitsinstelling | `gfx.preset` | Dropdown | `high` | `low`, `medium`, `high`, `ultra` | Stelt alle onderstaande grafische opties in een keer in (zie preset tabel). Schakelt naar "Aangepast" als individuele settings worden gewijzigd. |
| 2 | Resolutieschaal | `gfx.resolution` | Slider | `100` | `50` - `200` (stappen van 10) | Percentage van de native resolutie. 50% = half resolution (beter performance). 200% = supersampling (scherper maar zwaarder). Live preview. |
| 3 | Schaduwen | `gfx.shadows` | Dropdown | `high` | `off`, `low`, `high` | Off: geen schaduwen. Low: alleen Sun shadow, 1024px map. High: Sun + unit shadows, 2048px map. |
| 4 | Anti-aliasing | `gfx.antialiasing` | Dropdown | `fxaa` | `off`, `fxaa`, `smaa` | Off: geen. FXAA: snel, licht blur. SMAA: scherper, iets zwaarder. |
| 5 | Deeltjeseffecten | `gfx.particles` | Dropdown | `medium` | `low`, `medium`, `high` | Low: 25% particle count. Medium: 50%. High: 100%. Betreft: confetti, rook, stof, bloed, magie. |
| 6 | Fog of War kwaliteit | `gfx.fow` | Dropdown | `high` | `low`, `high` | Low: 128px visibility texture, 5fps update. High: 256px, 10fps update. |
| 7 | FPS-begrenzing | `gfx.fpsCap` | Dropdown | `60` | `30`, `60`, `unlimited` | Begrenst de maximum framerate. 30 = spaart batterij/warmte. Unlimited = geen limiet. |
| 8 | VSync | `gfx.vsync` | Toggle | `on` | `on`, `off` | Synchroniseert rendering met monitor refresh. Voorkomt screen tearing maar kan input lag veroorzaken. |
| 9 | Renderer | `gfx.renderer` | Dropdown | `auto` | `auto`, `webgpu`, `webgl` | Auto: kiest WebGPU als beschikbaar, anders WebGL2. Force WebGPU: foutmelding als niet beschikbaar. Force WebGL: altijd WebGL2. |
| 10 | Terreindetail | `gfx.terrain` | Dropdown | `high` | `low`, `medium`, `high` | Low: 64x64 segments. Medium: 128x128. High: 256x256. Betreft terrain mesh subdivisions. |
| 11 | Texturekwaliteit | `gfx.textures` | Dropdown | `high` | `low`, `medium`, `high` | Low: 256px textures. Medium: 512px. High: 1024px. Betreft unit/building/terrain textures. |
| 12 | LOD afstand | `gfx.lod` | Slider | `100` | `50` - `150` (stappen van 10) | Percentage van standaard LOD-afstanden. Lager = eerder naar lagere LOD = beter performance. |

**Kwaliteitsinstelling Presets**:

| Setting | Low | Medium | High | Ultra |
|---------|-----|--------|------|-------|
| Resolutieschaal | 75% | 100% | 100% | 150% |
| Schaduwen | Off | Low | High | High |
| Anti-aliasing | Off | FXAA | FXAA | SMAA |
| Deeltjeseffecten | Low | Medium | Medium | High |
| Fog of War | Low | Low | High | High |
| FPS cap | 30 | 60 | 60 | Unlimited |
| Terreindetail | Low | Medium | High | High |
| Texturekwaliteit | Low | Medium | High | High |
| LOD afstand | 60% | 80% | 100% | 130% |

**Auto-detect**: Bij eerste start: benchmark scene (~2 seconden). Op basis van gemeten FPS:
- < 25 FPS → Low preset
- 25-40 FPS → Medium preset
- 40-55 FPS → High preset
- 55+ FPS → Ultra preset

---

### 3.2 Audio

| # | Setting | Key | Type | Default | Opties | Effect |
|---|---------|-----|------|---------|--------|--------|
| 1 | Hoofdvolume | `audio.master` | Slider | `80` | `0` - `100` | Globaal volume. Alle andere volumes zijn relatief hieraan. Bij 0: alles stil, mute-icoon in HUD. |
| 2 | Muziekvolume | `audio.music` | Slider | `70` | `0` - `100` | Achtergrondmuziek (Suno tracks). Menu muziek + in-game muziek. |
| 3 | Effecten volume | `audio.sfx` | Slider | `80` | `0` - `100` | Geluidseffecten: zwaardklappen, explosies, gebouw-plaatsing, UI klikken. |
| 4 | Stemmen volume | `audio.voice` | Slider | `90` | `0` - `100` | Unit voice lines bij selectie, commando's, abilities. Campaign narrator. |
| 5 | Omgevingsvolume | `audio.ambient` | Slider | `60` | `0` - `100` | Achtergrondgeluiden: wind, vogels, water, dorpsgeluiden. 3D spatial audio. |
| 6 | Demp bij inactiviteit | `audio.muteUnfocused` | Toggle | `on` | `on`, `off` | Als het browsertabblad niet actief is: demp alle audio. On = muten, Off = blijft spelen. |
| 7 | Stereo balans | `audio.balance` | Slider | `0` | `-100` (links) - `100` (rechts) | Voor spelers die beter horen aan een kant of met een luidspreker. 0 = gecentreerd. |
| 8 | 3D Audio | `audio.spatial` | Toggle | `on` | `on`, `off` | Positioneel audio (pannen/afstand). Uit = alles mono/stereo, geen positie-afhankelijkheid. |

---

### 3.3 Besturing / Controls

#### 3.3.1 Camera

| # | Setting | Key | Type | Default | Opties | Effect |
|---|---------|-----|------|---------|--------|--------|
| 1 | Muisscrollsnelheid | `controls.scrollSpeed` | Slider | `50` | `10` - `100` | Snelheid van camera panning via scrollwiel (zoom). 10 = traag, 100 = snel. |
| 2 | Randscrolling | `controls.edgeScroll` | Toggle | `on` | `on`, `off` | Camera beweegt wanneer muis aan de rand van het scherm is. |
| 3 | Randscrollsnelheid | `controls.edgeScrollSpeed` | Slider | `50` | `10` - `100` | Snelheid van edge scrolling. Alleen actief als randscrolling aanstaat. |
| 4 | Camera rotatie | `controls.cameraRotation` | Toggle | `off` | `on`, `off` | Middelste muisknop roteert de camera. Uit = vaste hoek. |
| 5 | Camera shaking | `controls.cameraShake` | Toggle | `on` | `on`, `off` | Schermtrillingen bij explosies, charges, siege aanvallen. |
| 6 | Zoom limiet (in) | `controls.zoomMin` | Slider | `20` | `10` - `40` | Hoe dichtbij je kunt inzoomen (hogere waarde = verder weg). |
| 7 | Zoom limiet (uit) | `controls.zoomMax` | Slider | `80` | `50` - `120` | Hoe ver je kunt uitzoomen (hogere waarde = verder weg). |

#### 3.3.2 Eenheden

| # | Setting | Key | Type | Default | Opties | Effect |
|---|---------|-----|------|---------|--------|--------|
| 8 | Dubbelklik selectie | `controls.doubleClickSelect` | Toggle | `on` | `on`, `off` | Dubbelklik op een unit selecteert alle units van dat type op het scherm. |
| 9 | Rechtermuisknopmenu | `controls.rightClickMenu` | Toggle | `off` | `on`, `off` | Toont contextmenu bij rechtermuisklik (in plaats van direct commando). Aan = bevestigingsstap, Uit = direct commando. |

#### 3.3.3 Keybinding Aanpassing

Elke hotkey is aanpasbaar. Conflicten worden gedetecteerd en getoond.

**Default Keybindings**:

| Actie | Default key | Categorie |
|-------|-------------|-----------|
| Camera omhoog | `W` / `ArrowUp` | Camera |
| Camera omlaag | `S` / `ArrowDown` | Camera |
| Camera links | `A` / `ArrowLeft` | Camera |
| Camera rechts | `D` / `ArrowRight` | Camera |
| Zoom in | `ScrollUp` / `=` | Camera |
| Zoom uit | `ScrollDown` / `-` | Camera |
| Center op selectie | `Space` | Camera |
| Selecteer alles | `Ctrl+A` | Selectie |
| Control group 1-9 | `1` - `9` | Selectie |
| Wijs control group toe | `Ctrl+1` - `Ctrl+9` | Selectie |
| Voeg toe aan groep | `Shift+1` - `Shift+9` | Selectie |
| Attack-move | `A` + klik | Commando |
| Stop | `S` (geen selectie context) | Commando |
| Hold position | `H` | Commando |
| Patrol | `P` | Commando |
| Ability 1 | `Q` | Abilities |
| Ability 2 | `W` (context: ability) | Abilities |
| Ability 3 | `E` | Abilities |
| Ultimate | `R` | Abilities |
| Train unit 1 | `Q` (context: gebouw) | Productie |
| Train unit 2 | `W` (context: gebouw) | Productie |
| Train unit 3 | `E` (context: gebouw) | Productie |
| Train unit 4 | `R` (context: gebouw) | Productie |
| Train unit 5 | `T` (context: gebouw) | Productie |
| Rally point | `R` (context: gebouw, na productie) | Productie |
| Pauze | `Escape` / `F10` | Systeem |
| Snelle opslag | `F5` | Systeem |
| Snel laden | `F9` | Systeem |
| Toggle minimap | `M` | HUD |
| Toggle health bars | `Alt` (hold) | HUD |
| Toggle building grid | `G` | HUD |
| Cycle idle workers | `.` (punt) | Selectie |
| Select all army | `Ctrl+Shift+A` | Selectie |
| Deselecteer | `Escape` | Selectie |

**Keybinding UI**:
- Lijst van alle acties met huidige binding
- Klik op binding → "Druk op een toets..." → wacht op toetsdruk → opslaan
- Conflictdetectie: als een toets al bezet is → waarschuwing "Toets al in gebruik voor [actie]. Overschrijven?"
- "Reset naar standaard" knop per actie + globale reset
- Ondersteunt enkele toetsen en modifier combinaties (Ctrl, Shift, Alt + toets)

---

### 3.4 Spel / Game

| # | Setting | Key | Type | Default | Opties | Effect |
|---|---------|-----|------|---------|--------|--------|
| 1 | Taal | `game.language` | Dropdown | `nl` | `nl`, `en` | Verandert alle UI tekst, tooltips, unit namen, achievement beschrijvingen. Voice lines blijven in de oorspronkelijke taal (Brabants/Nederlands). |
| 2 | Ondertiteling | `game.subtitles` | Toggle | `on` | `on`, `off` | Toont ondertitels bij voice lines en campaign narrator. Positie: onderkant scherm, semi-transparante achtergrond. |
| 3 | Spelsnelheid | `game.speed` | Dropdown | `normal` | `slow` (0.5x), `normal` (1x), `fast` (2x) | Alleen singleplayer. Versnelt of vertraagt de hele game tick. Multiplayer: altijd normal. |
| 4 | Auto-opslaan | `game.autosave` | Dropdown | `5` | `off`, `2`, `5`, `10` (minuten) | Automatisch opslaan elke X minuten. Gebruikt een dedicated auto-save slot (apart van handmatige saves). |
| 5 | Kleurenblindmodus | `game.colorblind` | Dropdown | `off` | `off`, `deuteranopia`, `protanopia`, `tritanopia` | Past kleurenpalet aan. Eigen units: blauw. Vijandelijke units: oranje. Affected: minimap, health bars, selectie-highlights, team kleuren. Zie sectie 5.3 voor details. |
| 6 | Verminderde beweging | `game.reducedMotion` | Toggle | `off` | `on`, `off` | Schakelt uit: camera shake, particle bursts, screen flash, confetti. Behoudt: basis animaties, unit movement. Respecteert ook `prefers-reduced-motion` OS setting. |
| 7 | Eenheid HP-balken | `game.healthBars` | Dropdown | `damaged` | `always`, `selected`, `damaged`, `never` | Always: alle units tonen HP bar. Selected: alleen geselecteerde units. Damaged: alleen units onder 100% HP. Never: geen HP bars (hardcore). |
| 8 | Bouwraster overlay | `game.buildGrid` | Toggle | `off` | `on`, `off` | Toont een grid overlay op het terrein die bouwlocaties visueel maakt. Altijd zichtbaar vs alleen bij build-modus. |
| 9 | Minimap grootte | `game.minimapSize` | Dropdown | `medium` | `small` (150px), `medium` (200px), `large` (250px) | Grootte van de minimap in de linkeronderhoek. |
| 10 | Klokformaat | `game.clock` | Dropdown | `game` | `game` (MM:SS), `real` (HH:MM), `both` | Welke klok getoond wordt in de HUD. Game time = tijd sinds start gevecht. Real time = werkelijke tijd. Both = beide. |
| 11 | Bevestig destructieve acties | `game.confirmDestructive` | Toggle | `on` | `on`, `off` | Vraagt bevestiging bij: annuleren productie-queue, gebouw slopen, opgeven. On = bevestigingsmodal. Off = direct uitvoeren. |
| 12 | Hoog contrast | `game.highContrast` | Toggle | `off` | `on`, `off` | Verhoogd contrast op UI elementen: dikkere borders, sterkere achtergrondkleuren, grotere tekstschaduw. Voor spelers met verminderd zicht. |
| 13 | Tekstschaal | `game.textScale` | Slider | `100` | `75` - `150` (stappen van 25) | Schaalt alle UI tekst. 75% = kleiner, 150% = groter. Betreft: tooltips, stats, namen, menu's. |
| 14 | Notificatieduur | `game.notificationDuration` | Dropdown | `5` | `3`, `5`, `8`, `persistent` | Hoe lang toast-notificaties zichtbaar blijven. Persistent = tot handmatig weggeklikt. |
| 15 | Scherm flitsen | `game.screenFlash` | Toggle | `on` | `on`, `off` | Korte schermflitsen bij grote explosies, ability activaties, hero deaths. Uit = veiliger voor lichtgevoelige spelers. |

---

### 3.5 Online / Multiplayer [v2.0]

| # | Setting | Key | Type | Default | Opties | Effect |
|---|---------|-----|------|---------|--------|--------|
| 1 | Spelersnaam | `mp.playerName` | Tekstveld | `Speler` | Max 20 tekens, alfanumeriek + spaties | Zichtbaar voor andere spelers in lobby en leaderboard. |
| 2 | Toon ping | `mp.showPing` | Toggle | `on` | `on`, `off` | Toont latency (ms) in de HUD rechtsbovenhoek. Groen < 50ms, Geel 50-150ms, Rood > 150ms. |
| 3 | Chatfilter | `mp.chatFilter` | Toggle | `on` | `on`, `off` | Filtert grof taalgebruik in chat. On = vervangt door "***". Off = ongefilterd. |
| 4 | Toestaan toeschouwers | `mp.allowSpectators` | Toggle | `off` | `on`, `off` | Toestaan dat anderen je match bekijken als toeschouwer. |
| 5 | Toon "GG" knop | `mp.showGG` | Toggle | `on` | `on`, `off` | Toont een "GG" (Good Game) snelknop na afloop van een multiplayer match. |

---

### 3.6 Settings Opslag & Sync

| Aspect | Implementatie |
|--------|--------------|
| Opslag | `localStorage.setItem('rob-settings', JSON.stringify(settings))` |
| Laden | Bij game start: lees localStorage, merge met defaults voor missende keys |
| Reset | Per tab of globaal. Bevestigingsmodal altijd. |
| Sync | Geen cloud sync (v1.0). Toekomstig: sync via leaderboard account. |
| Migratie | Als settings format wijzigt: versienummer in settings object, migratiefunctie bij laden. |

---

## 4. Error States & Edge Cases

Elke mogelijke error, hoe de UI reageert, en wat de speler ziet.

### 4.1 Browser & Rendering Errors

#### 4.1.1 WebGL niet ondersteund

| Aspect | Detail |
|--------|--------|
| **Detectie** | `!window.WebGLRenderingContext` of canvas.getContext('webgl2') faalt |
| **UI** | Fullscreen overlay, centered card |
| **Titel** | "Je browser ondersteunt geen 3D graphics" |
| **Bericht** | "Reign of Brabant heeft WebGL 2.0 nodig om te draaien. Update je browser naar de nieuwste versie of probeer een andere browser." |
| **Acties** | Links naar Chrome, Firefox, Edge download pagina's |
| **Stijl** | Perkament-achtergrond, logo bovenaan, grote leesbare tekst |
| **Fallback** | Geen game content laden, alleen dit scherm |

#### 4.1.2 WebGPU niet beschikbaar (maar gevraagd)

| Aspect | Detail |
|--------|--------|
| **Detectie** | `!navigator.gpu` wanneer `gfx.renderer === 'webgpu'` of bij auto-detect |
| **UI** | Toast notificatie (niet-blokkerend) |
| **Bericht** | "WebGPU is niet beschikbaar in je browser. We gebruiken WebGL2 als alternatief. Performance kan lager zijn." |
| **Actie** | Automatische fallback naar WebGL2. Setting wordt geupdate naar `webgl`. |
| **Duur** | Toast verdwijnt na 8 seconden of bij wegklikken |

#### 4.1.3 Browser te oud

| Aspect | Detail |
|--------|--------|
| **Detectie** | Feature detection: `typeof SharedArrayBuffer`, `typeof BigInt`, ES2020+ features |
| **Minimum** | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| **UI** | Fullscreen overlay (zelfde stijl als WebGL error) |
| **Titel** | "Je browser is verouderd" |
| **Bericht** | "Reign of Brabant vereist een moderne browser. Je huidige browser ({naam} {versie}) wordt niet ondersteund." |
| **Acties** | Links naar browser updates |
| **Stijl** | Tabel met minimum versies per browser |

### 4.2 Audio Errors

#### 4.2.1 Audio Context geblokkeerd

| Aspect | Detail |
|--------|--------|
| **Detectie** | `AudioContext.state === 'suspended'` na initialisatie |
| **UI** | Semi-transparante overlay over het hele scherm |
| **Bericht** | "Klik ergens om audio te activeren" met een luidspreker-icoon |
| **Interactie** | Elke klik/tap op het scherm: `audioContext.resume()`, overlay verdwijnt |
| **Stijl** | Minimaal, niet-intrusief, verdwijnt instant bij interactie |
| **Timing** | Verschijnt alleen als audio context suspended is en game audio nodig heeft |

#### 4.2.2 Audio bestanden niet gevonden

| Aspect | Detail |
|--------|--------|
| **Detectie** | Howler.js `loaderror` event |
| **UI** | Geen visuele melding aan speler (graceful degradation) |
| **Gedrag** | Missende audio wordt overgeslagen. Console warning voor development. |
| **Fallback** | Spel draait gewoon door zonder het missende geluid |

### 4.3 Network Errors (Multiplayer)

#### 4.3.1 Server niet bereikbaar

| Aspect | Detail |
|--------|--------|
| **Detectie** | WebSocket connection failure of HTTP request timeout (> 10 seconden) |
| **UI** | Modal overlay met countdown |
| **Titel** | "Server niet bereikbaar" |
| **Bericht** | "Verbinding met de gameserver mislukt. Opnieuw proberen over {countdown}..." |
| **Countdown** | Automatisch: 5s → retry. Max 3 retries met exponential backoff (5s, 15s, 30s). |
| **Na 3 retries** | "Kan geen verbinding maken met de server. Controleer je internetverbinding." + [Opnieuw Proberen] + [Terug naar Menu] |
| **Stijl** | Donkere overlay, centered card, animated loading spinner naast countdown |

#### 4.3.2 Multiplayer disconnect (mid-game)

| Aspect | Detail |
|--------|--------|
| **Detectie** | WebSocket `close` event of heartbeat timeout (> 5 seconden geen response) |
| **UI** | Semi-transparante overlay, game pauzeert niet (voor eerlijkheid) |
| **Titel** | "Verbinding verloren" |
| **Bericht** | "Verbinding met de server is verbroken. Poging tot herverbinden..." |
| **Animatie** | Pulserende WiFi-icoon + "Herverbinden..." tekst |
| **Timeout** | Max 30 seconden herverbinden. Na 30s: "Herverbinden mislukt. Je match is verloren." + [Terug naar Menu] |
| **Game state** | Als herverbinding slaagt: game state sync, korte freeze, dan doorgaan |

#### 4.3.3 Tegenstander disconnect

| Aspect | Detail |
|--------|--------|
| **Detectie** | Server meldt dat tegenstander disconnected is |
| **UI** | Toast notificatie + chat bericht |
| **Bericht** | "{Spelersnaam} heeft de verbinding verloren. Wachten op herverbinding..." |
| **Timeout** | 60 seconden wachten. Na 60s: automatische overwinning voor de verbonden speler. |
| **Leaderboard** | Disconnect = verlies voor de disconnected speler |

### 4.4 Game State Errors

#### 4.4.1 Game crash / JavaScript exception

| Aspect | Detail |
|--------|--------|
| **Detectie** | `window.onerror` en `window.onunhandledrejection` |
| **UI** | Fullscreen overlay (game is gestopt) |
| **Titel** | "Er ging iets mis" |
| **Bericht** | "Het spel is onverwacht gestopt. Je voortgang is mogelijk opgeslagen via auto-save." |
| **Details** | Inklapbare sectie met error message + stack trace (voor bugreports) |
| **Acties** | [Kopieer Foutmelding] (kopieert naar clipboard) + [Herstart Spel] (pagina reload) + [Terug naar Menu] (als mogelijk) |
| **Auto-save** | Als auto-save aanstaat: probeer emergency save voor het crash-scherm verschijnt |

#### 4.4.2 Save file corrupt

| Aspect | Detail |
|--------|--------|
| **Detectie** | JSON.parse failure of schema validatie faalt bij laden |
| **UI** | Modal dialog |
| **Titel** | "Opgeslagen spel beschadigd" |
| **Bericht** | "Het opgeslagen spel in slot {X} kan niet worden geladen. De data is beschadigd." |
| **Acties** | [Verwijder beschadigd bestand] + [Annuleer] |
| **Recovery** | Probeer eerst: JSON repair (strip trailing characters, fix common corruption). Als dat faalt: meld als onherstelbaar. |

#### 4.4.3 LocalStorage vol

| Aspect | Detail |
|--------|--------|
| **Detectie** | `DOMException: QuotaExceededError` bij `localStorage.setItem` |
| **UI** | Modal dialog |
| **Titel** | "Opslagruimte vol" |
| **Bericht** | "Er is niet genoeg ruimte om het spel op te slaan. Wil je oude opslagbestanden verwijderen?" |
| **Acties** | Lijst van saves met grootte + datum. Checkbox om te selecteren voor verwijdering. [Verwijder geselecteerde] + [Annuleer] |
| **Auto-actie** | Als auto-save faalt door ruimte: verwijder oudste auto-save, probeer opnieuw |

### 4.5 Performance Errors

#### 4.5.1 Out of memory

| Aspect | Detail |
|--------|--------|
| **Detectie** | `performance.memory` (Chrome) check: als `usedJSHeapSize > 0.9 * jsHeapSizeLimit` |
| **UI** | Waarschuwingsbanner bovenaan het scherm (geel, niet-blokkerend) |
| **Bericht** | "Geheugengebruik is hoog. Overweeg om de grafische kwaliteit te verlagen of het spel te herstarten." |
| **Acties** | [Verlaag Kwaliteit] (stelt preset een stap lager) + [Negeer] |
| **Timing** | Verschijnt als threshold bereikt wordt. Verdwijnt na actie of na 15 seconden. |

#### 4.5.2 FPS te laag

| Aspect | Detail |
|--------|--------|
| **Detectie** | Gemiddeld < 20 FPS over 10 seconden |
| **UI** | Toast notificatie (niet-blokkerend) |
| **Bericht** | "Performance is laag ({fps} FPS). Wil je de grafische kwaliteit verlagen?" |
| **Acties** | [Automatisch Aanpassen] (verlaagt preset een stap) + [Negeer] |
| **Frequentie** | Max eenmaal per 5 minuten (voorkom spam) |
| **Automatisch** | Als FPS < 15 voor > 30 seconden en er is nog ruimte om te verlagen: automatisch verlagen + notificatie |

#### 4.5.3 GPU context lost

| Aspect | Detail |
|--------|--------|
| **Detectie** | WebGL `webglcontextlost` event |
| **UI** | Fullscreen overlay |
| **Titel** | "Grafische context verloren" |
| **Bericht** | "De grafische processor is gereset. Het spel probeert te herstellen..." |
| **Automatisch** | Wacht op `webglcontextrestored` event → herinitialiseer renderer → verberg overlay |
| **Timeout** | Na 10 seconden zonder restore: "Herstel mislukt. Herstart het spel." + [Herstart] |

### 4.6 Platform Errors

#### 4.6.1 Fullscreen request geweigerd

| Aspect | Detail |
|--------|--------|
| **Detectie** | `document.fullscreenElement === null` na `requestFullscreen()` |
| **UI** | Toast notificatie |
| **Bericht** | "Volledig scherm niet beschikbaar. Je browser staat dit mogelijk niet toe. Probeer F11." |
| **Actie** | Verdwijnt na 5 seconden. Geen verdere actie nodig. |

#### 4.6.2 Mobile landscape aanbeveling

| Aspect | Detail |
|--------|--------|
| **Detectie** | `window.innerHeight > window.innerWidth` op touchscreen device |
| **UI** | Fullscreen overlay met rotatie-icoon |
| **Titel** | "Draai je scherm" |
| **Bericht** | "Reign of Brabant speelt het best in liggende modus. Draai je apparaat." |
| **Icoon** | Animated telefoon die 90 graden draait |
| **Gedrag** | Verdwijnt automatisch wanneer landscape wordt gedetecteerd |
| **Bypass** | Kleine "Toch doorgaan" link onderaan |

#### 4.6.3 404 op assets (missende models/textures)

| Aspect | Detail |
|--------|--------|
| **Detectie** | HTTP 404 bij asset loading |
| **UI** | Geen visuele melding aan speler (graceful degradation) |
| **Fallback model** | Roze/magenta kubus (standaard debug mesh) |
| **Fallback texture** | Checker patroon (magenta/zwart) |
| **Fallback audio** | Geen geluid (skip) |
| **Console** | `console.warn('Asset not found: {url}, using fallback')` |

#### 4.6.4 Clipboard API niet beschikbaar

| Aspect | Detail |
|--------|--------|
| **Detectie** | `!navigator.clipboard` of `clipboard.writeText` rejected |
| **UI** | Toast |
| **Bericht** | "Kopiëren niet mogelijk. Selecteer de tekst handmatig." |
| **Fallback** | Toon de tekst in een selecteerbaar tekstveld |

---

## 5. Accessibility

### 5.1 WCAG 2.1 Compliance Target

**Target level**: AA voor alle menu's en informatieve schermen. Best-effort voor in-game HUD (real-time game beperkingen).

### 5.2 Keyboard Navigatie

| Context | Implementatie |
|---------|--------------|
| **Alle menu's** | Volledig navigeerbaar met Tab (vooruit), Shift+Tab (achteruit), pijltjes (binnen groepen), Enter (activeer), Escape (terug/sluiten). |
| **Focus indicator** | Duidelijk zichtbare focus ring: 3px gouden outline met 2px offset. Nooit verborgen. |
| **Focus trap** | Modals en overlays vangen focus: Tab cyclet binnen de modal. Focus keert terug naar trigger-element bij sluiten. |
| **Skip links** | Niet van toepassing (geen traditionele webpagina), maar eerste Tab-druk in menu focust het eerste interactieve element. |
| **Tab-volgorde** | Logisch, van links-naar-rechts, boven-naar-beneden. Matches visuele volgorde. |
| **In-game** | Alle hotkeys functioneren als keyboard-only besturing. Geen functionaliteit die ALLEEN met muis bereikbaar is. |

**Keyboard-only alternatieven voor muisacties**:

| Muisactie | Keyboard alternatief |
|-----------|---------------------|
| Klik op terrain (move) | Selecteer unit → pijltjes + Enter om locatie te kiezen (minimap focus mode met M → pijltjes → Enter) |
| Box select | Ctrl+A (alles), dubbelklik equivalent via hotkey |
| Rechtermuisklik commando | A (attack-move), H (hold), P (patrol), S (stop) |
| Build placement | Tab door grid posities, Enter om te plaatsen |
| Minimap klik | M toets → pijltjes navigatie op minimap → Enter om camera te verplaatsen |

### 5.3 Kleurenblindmodi

Drie modi voor de drie meest voorkomende vormen van kleurenblindheid.

**Aanpassingen per modus**:

| UI Element | Normaal | Deuteranopia (rood-groen) | Protanopia (rood-groen) | Tritanopia (blauw-geel) |
|------------|---------|---------------------------|-------------------------|------------------------|
| Eigen units/gebouwen | Groen | Blauw | Blauw | Blauw |
| Vijandelijke units | Rood | Oranje | Oranje | Magenta |
| Ally units | Geel | Cyaan | Cyaan | Groen |
| Minimap eigen | Groen stip | Blauw stip + vierkant shape | Blauw stip + vierkant | Blauw stip + vierkant |
| Minimap vijand | Rood stip | Oranje stip + driehoek shape | Oranje stip + driehoek | Magenta stip + driehoek |
| HP bar (hoog) | Groen | Blauw | Blauw | Blauw |
| HP bar (midden) | Geel | Cyaan | Cyaan | Wit |
| HP bar (laag) | Rood | Oranje | Oranje | Magenta |
| Resource tekst (voldoende) | Wit | Wit | Wit | Wit |
| Resource tekst (te weinig) | Rood | Oranje + onderstreept | Oranje + onderstreept | Magenta + onderstreept |

**Belangrijk**: Kleurenblindmodi gebruiken ALTIJD shape-differentiation naast kleur. Eigen = vierkant, vijand = driehoek, ally = cirkel op de minimap.

### 5.4 Hoog Contrast Modus

| Element | Normaal | Hoog Contrast |
|---------|---------|---------------|
| Panel achtergronden | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.9)` |
| Tekst | `#E0D5C0` (crème) | `#FFFFFF` (wit) |
| Borders | `1px rgba(255,255,255,0.2)` | `3px #FFFFFF` |
| Knoppen | Subtiele achtergrond | Dikke witte rand + hoge contrast achtergrond |
| Focus ring | `3px gold` | `4px white` + `2px black outline` (double ring) |
| Tooltips | Semi-transparant | Ondoorzichtig zwart + witte tekst |
| Minimap | Normale kleuren | Extra dikke stippen, hogere contrast grenzen |

### 5.5 Verminderde Beweging

Wanneer `game.reducedMotion === 'on'` OF `prefers-reduced-motion: reduce` in OS settings:

| Element | Normaal | Verminderde Beweging |
|---------|---------|---------------------|
| Menu transities | Slide/fade 300ms | Instant (0ms) of eenvoudige fade 100ms |
| Camera shake | Trillingen bij explosies | Uitgeschakeld |
| Particle bursts | Confetti, rookwolken | Enkele statische sprites of uitgeschakeld |
| Screen flash | Witte/rode flits | Uitgeschakeld |
| Victory confetti | Vallende confetti animatie | Statisch "Overwinning" scherm |
| Loading spinner | Roterend icoon | Pulserend icoon (opacity) |
| Achievement popup | Slide-in + bounce | Fade-in |
| Minimap pings | Pulserende ringen | Statisch icoon (geen animatie) |
| Unit death | Uitgebreide death animatie | Snelle fade-out |

### 5.6 Screen Reader Ondersteuning

**Scope**: Menu's en informatieve schermen. In-game HUD is niet volledig screen-reader toegankelijk vanwege real-time aard, maar biedt auditieve cues.

| Element | Implementatie |
|---------|--------------|
| **Menu items** | `role="menuitem"`, `aria-label` met volledige beschrijving |
| **Knoppen** | Semantische `<button>` elementen met duidelijke labels |
| **Sliders** | `<input type="range">` met `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` |
| **Toggles** | `role="switch"`, `aria-checked` |
| **Tabs** | `role="tablist"`, `role="tab"`, `role-tabpanel"`, `aria-selected` |
| **Tooltips** | `aria-describedby` linkt naar tooltip content |
| **Modals** | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| **Loading progress** | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| **Alerts** | `role="alert"` voor toast-notificaties (screen reader leest automatisch voor) |
| **Live regions** | `aria-live="polite"` voor resource updates, `aria-live="assertive"` voor aanvalsalarmen |
| **Settings veranderingen** | `aria-live="polite"` region die veranderingen bevestigt ("Schaduwkwaliteit ingesteld op Hoog") |

### 5.7 Tekstschaal

| Schaal | Base font | HUD tekst | Tooltip tekst | Menu tekst |
|--------|-----------|-----------|---------------|------------|
| 75% | 12px | 10px | 10px | 14px |
| 100% (default) | 16px | 13px | 13px | 18px |
| 125% | 20px | 16px | 16px | 22px |
| 150% | 24px | 20px | 20px | 28px |

**Implementatie**: CSS custom property `--text-scale` op `:root`, alle tekst-groottes als `calc(base * var(--text-scale))`.

### 5.8 Audio Cues voor Visuele Events

Voor spelers die visuele cues missen of als aanvulling:

| Visueel Event | Audio Cue |
|---------------|-----------|
| Eenheid onder aanval | Alarm geluid + positional audio richting aanval |
| Gebouw voltooid | Bouwgeluiden stoppen + "klaar" chime |
| Unit getraind | Unit voice line "Klaar voor actie!" |
| Resource op | Waarschuwings-toon (laag) |
| Population cap bereikt | Waarschuwings-toon (hoog) |
| Upgrade voltooid | Fanfare geluid |
| Hero gesneuveld | Dramatische stinger |
| Vijand in zicht | Subtiel alert geluid |
| Ability gereed (cooldown over) | Zachte "ready" chime |
| Aanval op Town Hall | Urgente alarm + voice "Je basis wordt aangevallen!" |

### 5.9 One-Handed Play Ondersteuning

Beperkte maar mogelijke ondersteuning:

| Functie | Implementatie |
|---------|--------------|
| Alle hotkeys remappable | Speler kan alle functies op een hand-bereikbare cluster mappen |
| Muis-only mode | Alle commando's beschikbaar via klikken in HUD panels (geen hotkeys nodig) |
| Touch/tablet | Touch controls voor alle acties (zie sectie 6.3) |
| Pauze beschikbaar | Singleplayer kan op elk moment pauzeren voor herpositionering |

**Beperkingen**: RTS games vereisen snelle invoer. One-handed play is mogelijk maar minder competitief. Spelsnelheid verlagen naar "Traag" wordt aanbevolen.

---

## 6. Responsive Design

### 6.1 Breakpoints

| Naam | Breedte | Hoogte min | Primair gebruik |
|------|---------|------------|-----------------|
| Desktop XL (4K) | >= 2560px | - | 4K monitoren, DPR schaling |
| Desktop | 1920px - 2559px | >= 900px | Optimale ervaring |
| Laptop | 1366px - 1919px | >= 700px | Laptop schermen |
| Tablet Landscape | 1024px - 1365px | >= 600px | iPad landscape |
| Tablet Portrait | 768px - 1023px | >= 900px | iPad portrait (beperkt) |
| Mobile Landscape | 568px - 767px | >= 320px | Telefoon landscape |
| Mobile Portrait | < 568px | - | Niet ondersteund (rotatie-melding) |

### 6.2 Desktop (1920x1080 — Optimaal)

| Element | Specificatie |
|---------|-------------|
| Game canvas | 100vw x 100vh |
| HUD resource bar | Top, 400px breed, 40px hoog |
| Minimap | 200x200px, linksonder, 16px margin |
| Unit panel | Onderin, centered, max 600px breed, 180px hoog |
| Control groups | Top, onder resource bar, 450px breed |
| Toast area | Rechts, 300px breed, max 4 toasts gestapeld |
| Menus | Centered card, max 800px breed, max 600px hoog |
| Settings | Centered, max 900px breed, max 700px hoog, scrollbaar |

### 6.3 Laptop (1366x768 — Minimum Desktop)

| Aanpassing | Detail |
|------------|--------|
| HUD elementen | 10% kleiner (font-size, padding, icon-size) |
| Minimap | 150px default (small preset) |
| Unit panel | Max 500px breed |
| Toast area | Max 3 toasts |
| Menu's | Max 700px breed |
| 3D preview in menu | Verborgen of kleiner (40% breedte) |

### 6.4 Tablet Landscape (1024px+)

| Aanpassing | Detail |
|------------|--------|
| Touch controls | Ingeschakeld |
| Edge scrolling | Uitgeschakeld (conflicteert met touch) |
| Camera | Touch: twee-vinger pan, pinch zoom, twee-vinger rotate |
| Selectie | Touch: tap = select, long press = box select start, drag = box select |
| Commando's | Tap op terrein = move, tap op vijand = attack, tap op resource = gather |
| HUD | Grotere touch targets (min 44x44px per WCAG) |
| Minimap | Grotere touch target, 220px |
| Build menu | Grotere knoppen, 56x56px per item |
| Ability bar | Grotere knoppen, direct beschikbaar zonder hover |
| Tooltips | Verschijnen bij long-press (500ms) |
| On-screen controls | Optionele on-screen D-pad voor camera movement |

### 6.5 Mobile Landscape (568px+)

| Aanpassing | Detail |
|------------|--------|
| Ondersteuning | Minimaal. Speelbaar maar niet optimaal. |
| Resolutie | Automatisch naar 50-75% schaal |
| HUD | Sterk gereduceerd: alleen resources + minimap |
| Unit panel | Collapsed by default, expandable |
| Abilities | Overlay knoppen, groot (60x60px) |
| Menu's | Full-screen, geen side-panels |
| Performance | Auto: Low preset, 30 FPS cap |
| Touch | Zelfde als tablet maar met grotere targets |

### 6.6 Mobile Portrait

| Aanpassing | Detail |
|------------|--------|
| Ondersteuning | NIET ondersteund |
| UI | Rotatie-overlay (zie sectie 4.6.2) |
| Bypass | "Toch doorgaan" link beschikbaar maar sterk afgeraden |

### 6.7 4K / Retina Schaling

| Aspect | Detail |
|--------|--------|
| DPR detectie | `window.devicePixelRatio` |
| Canvas | Render op native resolutie als `gfx.resolution >= 100%` |
| UI | CSS `rem`-based, schaalt met DPR |
| Texturen | Gebruik hogere resolutie textures als `gfx.textures === 'high'` |
| Icons | SVG waar mogelijk, anders 2x raster assets |
| Fonts | Vector fonts, geen bitmap fonts |

### 6.8 Fullscreen Gedrag

| Aspect | Detail |
|--------|--------|
| Trigger | Knop in Main Menu + F11 toets |
| API | `document.documentElement.requestFullscreen()` |
| Exit | ESC (browser default) of knop in pause menu |
| Pointer lock | Optioneel: `canvas.requestPointerLock()` voor betere edge-scroll. Toon instructie "Druk ESC om de muis vrij te geven." |
| Resize handling | `window.addEventListener('resize', ...)` → update camera aspect, canvas size, HUD layout |

---

## 7. Notificatie Systeem

### 7.1 Toast Notificaties

**Positie**: Rechts, verticaal gestapeld, 16px van de rand.

**Stacking**: Max 4 toasts tegelijk. Nieuwe toast duwt oude omhoog. Oudste verdwijnt als er > 4 zijn.

**Anatomie**:
```
┌────────────────────────────────┐
│ [Icoon]  Tekst              ✕ │
│          Subtekst (optioneel)  │
│ ━━━━━━━━━━━━━━━━ (tijdsbalk)  │
└────────────────────────────────┘
```

| Component | Detail |
|-----------|--------|
| Icoon | Relevant icoon per type (zwaard, hamer, uitroepteken, ster) |
| Tekst | Max 2 regels, 14px |
| Subtekst | Optioneel, kleiner, 12px, grijs |
| Sluit knop | ✕, altijd zichtbaar |
| Tijdsbalk | Dunne balk die afloopt (duur instelbaar via settings) |
| Achtergrond | Semi-transparant, kleur op basis van type |

**Toast Types**:

| Type | Kleur | Icoon | Voorbeelden |
|------|-------|-------|-------------|
| Info | Blauw-grijs (#4A5568) | ℹ️ | "Gebouw voltooid", "Upgrade klaar" |
| Succes | Groen (#48BB78) | ✓ | "Achievement ontgrendeld!", "Opgeslagen" |
| Waarschuwing | Geel-oranje (#ED8936) | ⚠ | "Resource bijna op", "Population cap bereikt" |
| Gevaar | Rood (#E53E3E) | ⚔ | "Eenheid onder aanval!", "Basis wordt aangevallen!" |
| Achievement | Goud (#D69E2E) | 🏆 | "Achievement: Eerste Bloed!" |

### 7.2 In-Game Alert Types

Gedetailleerde specificatie van elk alert type.

#### 7.2.1 Eenheid onder aanval

| Aspect | Detail |
|--------|--------|
| Trigger | Eigen unit krijgt schade van vijandelijke unit |
| Toast | Type: Gevaar. "Eenheden onder aanval!" + "[Locatie]" |
| Minimap | Rode pulserende cirkel op aanvalslocatie (3 pulsen, 2 seconden) |
| Audio | Alert geluid (korte urgente toon) |
| Cooldown | Zelfde locatie: max 1 alert per 10 seconden (voorkom spam) |
| Interactie | Klik op toast: camera springt naar locatie |

#### 7.2.2 Gebouw voltooid

| Aspect | Detail |
|--------|--------|
| Trigger | Gebouw bouw is afgerond |
| Toast | Type: Info. "[Gebouw naam] voltooid" |
| Audio | Bouw-complete geluid |
| Minimap | Korte glow op gebouw locatie |
| Interactie | Klik op toast: camera springt naar gebouw, selecteert het |

#### 7.2.3 Eenheid getraind

| Aspect | Detail |
|--------|--------|
| Trigger | Unit training voltooid in gebouw |
| Toast | Type: Info. "[Unit naam] getraind" (alleen als gebouw niet in viewport) |
| Audio | Unit voice line |
| Cooldown | Max 1 per 3 seconden (bij batch training) |

#### 7.2.4 Resource uitgeput

| Aspect | Detail |
|--------|--------|
| Trigger | Resource node is leeg (gold mine of bomencluster) |
| Toast | Type: Waarschuwing. "[Resource type] uitgeput bij [locatie]" |
| Audio | Waarschuwingstoon |
| Workers | Idle workers gaan automatisch naar de dichtstbijzijnde resource (als die bestaat) |

#### 7.2.5 Population cap bereikt

| Aspect | Detail |
|--------|--------|
| Trigger | Poging om unit te trainen terwijl pop = max |
| Toast | Type: Waarschuwing. "Populatielimiet bereikt! Bouw meer woningen." |
| Audio | "Niet genoeg ruimte" geluid |
| HUD | Population counter knippert rood |
| Cooldown | Max 1 per 15 seconden |

#### 7.2.6 Upgrade voltooid

| Aspect | Detail |
|--------|--------|
| Trigger | Tech upgrade research voltooid |
| Toast | Type: Succes. "Upgrade voltooid: [upgrade naam]" |
| Audio | Upgrade fanfare |
| Effect | Betreffende units/gebouwen krijgen korte glow |

#### 7.2.7 Niet genoeg resources

| Aspect | Detail |
|--------|--------|
| Trigger | Poging om iets te bouwen/trainen zonder voldoende resources |
| Toast | Type: Waarschuwing. "Niet genoeg [resource naam]" |
| Audio | "Insufficient funds" geluid |
| HUD | Ontbrekende resource knippert rood in resource bar |
| Cooldown | Max 1 per 5 seconden |

#### 7.2.8 Hero gesneuveld

| Aspect | Detail |
|--------|--------|
| Trigger | Hero unit HP bereikt 0 |
| Toast | Type: Gevaar. "[Hero naam] is gesneuveld! Revive over 60s bij je Hoofdkwartier." |
| Audio | Dramatische stinger + hero death voice line |
| HUD | Hero portrait in control group wordt grijs + countdown timer |
| Minimap | Skull icoon op death locatie |

#### 7.2.9 Hero revived

| Aspect | Detail |
|--------|--------|
| Trigger | Hero revive timer bereikt 0 |
| Toast | Type: Succes. "[Hero naam] is herrezen!" |
| Audio | Heroic fanfare |
| HUD | Hero portrait licht op |

#### 7.2.10 Werkoverleg (Randstad-specifiek, als vijand)

| Aspect | Detail |
|--------|--------|
| Trigger | Als speler TEGEN Randstad speelt: Randstad Werkoverleg start |
| Toast | Type: Info. "De Randstad houdt werkoverleg! Nu is je kans!" |
| Audio | Subtiel alert |
| Timing | Verschijnt alleen als speler zicht heeft op Randstad gebouwen |

#### 7.2.11 Ally verzoek (Multiplayer)

| Aspect | Detail |
|--------|--------|
| Trigger | Multiplayer ally stuurt een hulpverzoek |
| Toast | Type: Info. "[Speler] vraagt om hulp bij [locatie]!" |
| Minimap | Geel pulserende cirkel op verzoek-locatie |
| Interactie | Klik op toast: camera springt naar locatie |

#### 7.2.12 Achievement behaald

| Aspect | Detail |
|--------|--------|
| Trigger | Achievement conditie vervuld |
| Toast | Type: Achievement. Grotere toast, gouden rand. "[Achievement naam]" + "[beschrijving]" |
| Audio | Achievement unlock geluid (distinct, belonend) |
| Animatie | Glow effect, sterren, langer zichtbaar (8 seconden) |
| Duur | 8 seconden (ongeacht notification duration setting) |

### 7.3 Alert Prioriteit

Als er meerdere alerts tegelijk plaatsvinden, worden ze geprioriteerd:

| Prioriteit | Type | Gedrag |
|------------|------|--------|
| 1 (hoogst) | Basis onder aanval | Altijd tonen, altijd geluid, niet onderdrukt |
| 2 | Hero gesneuveld | Altijd tonen |
| 3 | Eenheden onder aanval | Cooldown 10s per locatie |
| 4 | Resource/population waarschuwing | Cooldown 15s |
| 5 | Achievement | Altijd tonen maar na gevechtsalerts |
| 6 (laagst) | Gebouw/unit voltooid | Kan verborgen als queue > 4 |

---

## 8. Tutorial Systeem

### 8.1 First-Time Player Detection

| Aspect | Detail |
|--------|--------|
| Detectie | `localStorage.getItem('rob-tutorial-complete') === null` |
| Trigger | Bij eerste klik op "Schermutsel" of "Veldtocht" |
| Prompt | Modal: "Het lijkt erop dat je voor het eerst speelt. Wil je de interactieve tutorial volgen?" |
| Opties | [Ja, leer me spelen] → Tutorial mission / [Nee, ik ken RTS games] → Normal game |
| Herinnering | Als "Nee" gekozen en speler verliest binnen 5 minuten: subtiele hint "Probeer de tutorial via Hoe Te Spelen" |

### 8.2 Interactieve Tutorial (Campaign Missie 1: "De Oogst")

De eerste campaign missie functioneert als tutorial. Kan ook apart gestart worden via "Hoe Te Spelen".

**Stap-voor-stap flow**:

| Stap | Focus | Instructie | Actie vereist | Highlight |
|------|-------|-----------|---------------|-----------|
| 1 | Camera | "Welkom bij Brabant! Gebruik WASD of de muis aan de rand om rond te kijken." | Pan de camera naar de Boerderij | Pijltjes-animatie aan schermranden |
| 2 | Zoom | "Scroll om in en uit te zoomen." | Zoom in en uit | Scroll-icoon animatie |
| 3 | Selectie | "Klik op je Boerderij om het te selecteren." | Klik op Town Hall | Gouden glow op Boerderij, pijl ernaartoe |
| 4 | Training | "Train een Boer door op het Boer-icoon te klikken (of druk Q)." | Train 1 Boer | Highlight op train-knop, Q-toets hint |
| 5 | Wachten | "Goed zo! Je Boer wordt getraind. Wacht even..." | Wacht tot Boer klaar is | Progress bar in focus |
| 6 | Worker select | "Selecteer je nieuwe Boer door erop te klikken." | Selecteer Boer | Glow op Boer unit |
| 7 | Gathering | "Rechtermuisklik op de Worstenbroodjes-mijn om te gaan verzamelen." | Rechtermuisklik op gold mine | Glow op gold mine, pijl |
| 8 | Resources | "Je Boer verzamelt nu Worstenbroodjes! Kijk naar je resources bovenin." | Wacht tot 50 Worstenbroodjes | Highlight op resource bar |
| 9 | Meer workers | "Train nog 2 Boeren — meer workers = snellere economie!" | Train 2 Boeren | Highlight op train knop |
| 10 | Bouwen | "Selecteer een Boer en klik op 'Bouw' (of B). Bouw een Cafe." | Start Cafe bouw | Highlight op build menu, Cafe optie |
| 11 | Plaatsing | "Kies een locatie voor je Cafe. Groen = goed, rood = niet mogelijk." | Plaats Cafe | Build grid overlay |
| 12 | Training military | "Je Cafe is klaar! Selecteer het en train een Carnavalvierder (Q)." | Train Carnavalvierder | Highlight op Cafe, train knop |
| 13 | Military select | "Selecteer je Carnavalvierder." | Selecteer unit | Glow op unit |
| 14 | Attack-move | "Druk A en klik dan op een locatie om in aanvalsmodus te bewegen." | Attack-move commando | A-toets hint, terrein highlight |
| 15 | Combat | "Vijandelijke scouts! Val ze aan met rechtermuisklik!" | Versla 2 vijandelijke scouts | Glow op vijanden |
| 16 | Multi-select | "Selecteer meerdere units door een rechthoek te slepen." | Box-select 3+ units | Instructie-animatie |
| 17 | Control groups | "Druk Ctrl+1 om deze groep op te slaan. Druk 1 om ze later snel te selecteren." | Maak control group | Ctrl+1 hint |
| 18 | Gezelligheid | "Merk je de glow? Brabandse units worden sterker als ze bij elkaar zijn! Dit is de Gezelligheid-bonus." | Houd units bij elkaar | Gezelligheid meter highlight |
| 19 | Missie einde | "Goed gedaan! Je bent klaar om Brabant te verdedigen!" | — | Applaus geluid, confetti |

**Tutorial UI Elementen**:

| Element | Beschrijving |
|---------|-------------|
| Instructie-panel | Onderin-midden, boven de unit panel. Perkament-stijl. Max 2 regels tekst. Pijl die wijst naar relevant UI element. |
| Highlight | Gouden glow/pulse op het element waar de speler op moet klikken. Alles er omheen is subtiel gedempt. |
| Skip knop | Klein, rechtsonder in het instructie-panel: "Spring over →". Bevestigingsmodal: "Weet je zeker dat je de tutorial wilt overslaan?" |
| Progressie | Geen stap kan geskipt worden (behalve met Skip-knop die alles skipt). Volgend stap verschijnt pas na voltooiing van huidige. |
| Pauze-compatibel | Tutorial kan gepauzeerd worden. State wordt bewaard. |

### 8.3 Contextual Tooltips

Tooltips die verschijnen op basis van spelergedrag buiten de tutorial.

| Trigger | Tooltip | Max keer getoond |
|---------|---------|-----------------|
| Speler heeft > 500 resources en < 3 gebouwen | "Tip: je hebt veel resources! Overweeg om meer gebouwen te bouwen." | 2 |
| Speler heeft 0 militaire units na 3 minuten | "Tip: bouw een Cafe en train soldaten om je te verdedigen!" | 1 |
| Speler wordt aangevallen met units idle | "Tip: je hebt idle eenheden! Stuur ze naar het gevecht." | 2 |
| Speler heeft nooit een control group gebruikt (na 10 min) | "Tip: gebruik Ctrl+1 om een control group te maken voor snellere selectie." | 1 |
| Speler heeft nooit attack-move gebruikt (na 15 min) | "Tip: druk A en klik om in aanvalsmodus te bewegen. Hiermee val je vijanden onderweg aan." | 1 |
| Population cap bereikt, geen housing gebouwd | "Tip: bouw meer woningen om je populatielimiet te verhogen!" | 2 |
| Speler als Brabanders, units verspreid | "Tip: houd je Brabandse eenheden bij elkaar voor de Gezelligheid-bonus!" | 3 |
| Hero beschikbaar maar niet getraind | "Tip: je kunt nu een Hero trainen! Heroes zijn krachtige unieke eenheden." | 1 |
| Tier 2 beschikbaar maar niet geupgraded | "Tip: bouw een upgrade-gebouw om Tier 2 te ontgrendelen en sterkere eenheden te krijgen." | 1 |

**Contextual Tooltip UI**: Verschijnt als zachte toast (Info type), met lamp-icoon. Kan uitgeschakeld worden via "Toon geen tips meer" checkbox in de tooltip. Opgeslagen in `localStorage.setItem('rob-tips-disabled', 'true')`.

### 8.4 "Wist je dat?" Loading Screen Tips

Getoond op de Loading Screen en in-game Loading/Map Generate Screen. Random selectie, geen herhaling tot alle tips een keer getoond zijn.

**Tip Pool** (50 tips):

**Basis Gameplay (10)**:

1. "Wist je dat? Boeren kunnen ook vechten in noodgevallen — maar ze zijn er niet blij mee."
2. "Wist je dat? Je kunt meerdere workers op dezelfde resource zetten voor sneller verzamelen, maar de resource raakt dan ook sneller op."
3. "Wist je dat? Gebouwen blokkeren het pad van je eenheden. Plan je basis-layout!"
4. "Wist je dat? Rechtermuisklik op een vijandelijke eenheid geeft een aanvalscommando, maar op terrein een bewegingscommando."
5. "Wist je dat? Je kunt een rally point instellen voor gebouwen. Nieuwe eenheden gaan automatisch naar dat punt."
6. "Wist je dat? Siege eenheden doen enorme schade aan gebouwen, maar zijn kwetsbaar voor gewone troepen."
7. "Wist je dat? Dubbelklik op een eenheid selecteert alle eenheden van dat type op je scherm."
8. "Wist je dat? Je kunt de game op elk moment pauzeren met ESC en je strategie overdenken."
9. "Wist je dat? Control groups (Ctrl+1-9) zijn essentieel voor snelle reacties in gevechten."
10. "Wist je dat? De minimap toont je vijandelijke eenheden alleen als ze in je zichtgebied zijn."

**Factie-Specifiek (12)**:

11. "Wist je dat? Brabandse eenheden krijgen tot +50% stats als ze bij elkaar blijven — de Gezelligheid-mechanic!"
12. "Wist je dat? De Randstad Werkoverleg pauzeert alle productie elke 5 minuten. Het perfecte moment om aan te vallen!"
13. "Wist je dat? Limburgse tunnels zijn onzichtbaar voor de vijand totdat een Grot vernietigd wordt."
14. "Wist je dat? Belgische eenheden kunnen tijdelijk vijandelijke units neutraal maken met diplomatie."
15. "Wist je dat? De Carnavalvierder Polonaise-ability activeert alleen met 5+ Carnavalvierders samen."
16. "Wist je dat? De Randstad Consultant doet geen directe schade, maar vertraagt vijandelijke gebouwen met 30%."
17. "Wist je dat? De Kansen-unit onzichtbaar kan worden voor 10 seconden met de Smokkelroute-ability."
18. "Wist je dat? De Tractorrijder laat een modderspoor achter dat vijanden vertraagt."
19. "Wist je dat? Het Randstad Werkoverleg kan permanent uitgeschakeld worden met de Tier 3 'Asynchroon Werken' upgrade."
20. "Wist je dat? De Randstad Efficientie-stacks maken ze na 20+ acties sneller dan alle andere facties."
21. "Wist je dat? De Praalwagen kan ALLEEN gebouwen aanvallen, maar doet 60 schade per klap."
22. "Wist je dat? De Hipster kan neutrale gebouwen claimen voor de Randstad met Gentrificatie."

**Strategie (10)**:

23. "Wist je dat? Scouts zijn cruciaal in de vroege game. Ken het terrein voordat je vijand dat doet."
24. "Wist je dat? Een gemixte legermacht is sterker dan een leger van alleen hetzelfde type."
25. "Wist je dat? Bruggen en chokepoints zijn de beste plekken voor een verdediging."
26. "Wist je dat? Heroes reviven na 60 seconden bij je Town Hall. Verlies ze niet onnodig!"
27. "Wist je dat? Je kunt vijandelijke resource-routes verstoren door hun workers aan te vallen."
28. "Wist je dat? De centrale resource nodes zijn het meest gecontesteerd — wie ze controleert, controleert de map."
29. "Wist je dat? Ranged eenheden achter melee eenheden plaatsen is een klassieke RTS-strategie die ook hier werkt."
30. "Wist je dat? Vergeet je support units niet! Een Boerinne kan je leger veel langer in het veld houden."
31. "Wist je dat? Attack-move (A + klik) laat je eenheden alles onderweg aanvallen. Handig voor patrouilles."
32. "Wist je dat? Je kunt meerdere gebouwen tegelijk bouwen als je genoeg workers hebt."

**Lore & Humor (10)**:

33. "Wist je dat? Het Gouden Worstenbroodje werd volgens de legende gesmeed in de ovens van de Sint-Janskathedraal."
34. "Wist je dat? De Randstad Stagiair hoopt dat het gevecht telt voor zijn stageverslag."
35. "Wist je dat? De Frituurmeester gebruikt authentiek Brabants frituurvet als wapen. De geur alleen al is dodelijk."
36. "Wist je dat? ALAAF is de traditionele Brabantse carnavalsroep. De Brabanders gebruiken het als oorlogskreet."
37. "Wist je dat? De Consultant van de Randstad heeft een PowerPoint-presentatie klaar voor elke situatie."
38. "Wist je dat? De Corporate Advocaat vecht met wetboeken. Letterlijk."
39. "Wist je dat? Het jaar is 1473 — maar de Randstad heeft op mysterieuze wijze al LinkedIn uitgevonden."
40. "Wist je dat? De Manneken Pis-kanon van de Belgen is precies wat je denkt dat het is."
41. "Wist je dat? De Belgische Dubbele Spion kan zich vermommen als vijandelijke eenheid. Vertrouw niemand!"
42. "Wist je dat? Limburgse Vlaai is niet alleen een delicatesse, maar ook een effectief wapen."

**Technisch & Meta (8)**:

43. "Wist je dat? Je kunt de grafische kwaliteit verlagen in de Instellingen als het spel traag is."
44. "Wist je dat? Alle 3D modellen in dit spel zijn procedureel gegenereerd of AI-gecreeerd."
45. "Wist je dat? Je kunt alle hotkeys aanpassen in de Instellingen onder Besturing."
46. "Wist je dat? Er zijn kleurenblindmodi beschikbaar in de Instellingen voor beter zicht."
47. "Wist je dat? Auto-opslaan bewaart je voortgang elke 5 minuten. Aanpasbaar in Instellingen."
48. "Wist je dat? Dit spel is volledig speelbaar met alleen het toetsenbord."
49. "Wist je dat? De camera ondersteunt rotatie met de middelste muisknop (kan aan/uit in Instellingen)."
50. "Wist je dat? Er zijn verborgen achievements. Blijf experimenteren om ze te ontdekken!"

### 8.5 How to Play Screen

Bereikbaar vanuit Main Menu en Pause Menu. Interactieve referentie voor alle controls en mechanics.

**Layout**: Tabbed interface met de volgende secties.

**Tabs**:

| Tab | Inhoud |
|-----|--------|
| Basis | Camera, selectie, commando's, resource gathering |
| Gevecht | Unit types, armor/damage systeem, formations |
| Bouwen | Gebouwen, tech tree, upgrades |
| Facties | Overzicht van elke factie + unieke mechanics |
| Hotkeys | Complete hotkey referentie (2-koloms tabel) |

**Per tab**: Korte tekst + afbeeldingen/diagrammen + optioneel: "Probeer het!" knop die een mini-scenario start.

---

## Appendix A: UI Component Library

Herbruikbare UI componenten voor consistente look & feel.

| Component | Gebruik | Stijl |
|-----------|---------|-------|
| `Button.primary` | Start knoppen, bevestigingen | Goud achtergrond, donkere tekst, hover: lichter, active: donkerder |
| `Button.secondary` | Annuleer, terug | Transparant, gouden rand, hover: lichte fill |
| `Button.danger` | Opgeven, verwijderen | Rood achtergrond, witte tekst |
| `Button.disabled` | Locked content, onvoldoende resources | Grijs, cursor: not-allowed, opacity: 0.5 |
| `Slider` | Volume, scroll speed | Track: donker. Thumb: goud. Fill: factie-kleur. |
| `Toggle` | On/off settings | Pill-shape. Off: grijs. On: groen. |
| `Dropdown` | Presets, moeilijkheidsgraad | Perkament-achtergrond, gouden rand, chevron icoon |
| `Modal` | Bevestigingen, errors | Centered card, donkere overlay, max 500px breed |
| `Toast` | Notificaties | Zie sectie 7.1 |
| `Tooltip` | Hover info | Donkere achtergrond, lichte tekst, pijltje naar trigger, max 250px |
| `ProgressBar` | Loading, training, cooldowns | Track: donker. Fill: goud/factie-kleur. Label: centered. |
| `TabBar` | Settings, How to Play | Horizontale tabs, actief: gouden underline, inactive: dim |
| `Card` | Factie select, map select | Rounded corners (8px), shadow, hover: scale(1.02) |
| `Badge` | Versie labels, "NIEUW", "Binnenkort" | Klein, rounded, gekleurde achtergrond |

---

## Appendix B: Localization Keys (NL/EN)

Voorbeeld van de taalstructuur. Alle UI tekst is gelokaliseerd.

```typescript
const i18n = {
  nl: {
    menu: {
      skirmish: "Schermutsel",
      campaign: "Veldtocht",
      multiplayer: "Slagveld Online",
      settings: "Instellingen",
      howToPlay: "Hoe Te Spelen",
      leaderboard: "Ranglijst",
      achievements: "Prestaties",
      credits: "Credits",
    },
    game: {
      victory: "Overwinning!",
      defeat: "Verslagen",
      paused: "Gepauzeerd",
      resume: "Hervat Gevecht",
      save: "Opslaan",
      load: "Laden",
      surrender: "Geef Op",
      quit: "Verlaat Spel",
    },
    hud: {
      population: "Bevolking",
      underAttack: "Eenheden onder aanval!",
      buildingComplete: "{building} voltooid",
      unitTrained: "{unit} getraind",
      resourceDepleted: "{resource} uitgeput",
      popCapReached: "Populatielimiet bereikt!",
      notEnoughResources: "Niet genoeg {resource}",
      heroFallen: "{hero} is gesneuveld!",
      heroRevived: "{hero} is herrezen!",
    },
    settings: {
      graphics: "Grafisch",
      audio: "Audio",
      controls: "Besturing",
      game: "Spel",
      multiplayer: "Online",
      resetDefaults: "Standaard Herstellen",
      save: "Opslaan",
    },
    errors: {
      webglNotSupported: "Je browser ondersteunt geen 3D graphics",
      browserTooOld: "Je browser is verouderd",
      serverUnreachable: "Server niet bereikbaar",
      connectionLost: "Verbinding verloren",
      saveCorrrupt: "Opgeslagen spel beschadigd",
      storageFull: "Opslagruimte vol",
      crashTitle: "Er ging iets mis",
    },
  },
  en: {
    menu: {
      skirmish: "Skirmish",
      campaign: "Campaign",
      multiplayer: "Multiplayer",
      settings: "Settings",
      howToPlay: "How to Play",
      leaderboard: "Leaderboard",
      achievements: "Achievements",
      credits: "Credits",
    },
    game: {
      victory: "Victory!",
      defeat: "Defeated",
      paused: "Paused",
      resume: "Resume Game",
      save: "Save",
      load: "Load",
      surrender: "Surrender",
      quit: "Quit to Menu",
    },
    hud: {
      population: "Population",
      underAttack: "Units under attack!",
      buildingComplete: "{building} complete",
      unitTrained: "{unit} trained",
      resourceDepleted: "{resource} depleted",
      popCapReached: "Population cap reached!",
      notEnoughResources: "Not enough {resource}",
      heroFallen: "{hero} has fallen!",
      heroRevived: "{hero} has risen!",
    },
    settings: {
      graphics: "Graphics",
      audio: "Audio",
      controls: "Controls",
      game: "Game",
      multiplayer: "Online",
      resetDefaults: "Reset to Defaults",
      save: "Save",
    },
    errors: {
      webglNotSupported: "Your browser does not support 3D graphics",
      browserTooOld: "Your browser is outdated",
      serverUnreachable: "Server unreachable",
      connectionLost: "Connection lost",
      saveCorrupt: "Save file corrupted",
      storageFull: "Storage full",
      crashTitle: "Something went wrong",
    },
  },
};
```

---

## Appendix C: Z-Index Map

Volledige z-index layering voor het UI systeem.

| Z-Index | Layer | Elementen |
|---------|-------|----------|
| 0 | Canvas | Three.js canvas |
| 10 | HUD base | Resource bar, clock, control groups |
| 20 | HUD interactive | Minimap, unit panel, build menu |
| 30 | Tooltips | Hover tooltips |
| 40 | Toast notifications | Toast stack |
| 50 | Contextual tooltips | Tutorial hints |
| 60 | Menus | Pause menu, settings |
| 70 | Modal overlays | Confirmation dialogs |
| 80 | Full-screen overlays | Loading, victory, defeat |
| 90 | Critical overlays | Crash report, browser warnings |
| 100 | Audio unlock | "Click to enable audio" overlay |

---

**Einde document**

*Versie 1.0.0 — Wachtend op goedkeuring*
