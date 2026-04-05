# Reign of Brabant -- PoC Testplan

**Versie**: 1.0.0
**Datum**: 2026-04-05
**Status**: Draft
**Parent**: PRD.md v1.0.0, SUB-PRD-TECHNICAL.md v1.0.0
**Tester**: QA Lead
**Scope**: Proof of Concept -- 1 factie (Brabanders) vs AI, 3 unit types, 2 gebouwen, 1 resource

---

## Inhoudsopgave

1. [PoC Scope Definitie](#1-poc-scope-definitie)
2. [Acceptance Criteria (Pass/Fail)](#2-acceptance-criteria-passfail)
3. [Functionele Testcases](#3-functionele-testcases)
4. [Edge Cases & Bug Checklist](#4-edge-cases--bug-checklist)
5. [Performance Test Protocol](#5-performance-test-protocol)
6. [Memory Leak Test Protocol](#6-memory-leak-test-protocol)
7. [Browser Test Matrix](#7-browser-test-matrix)
8. [Regression Test Suite](#8-regression-test-suite)
9. [Known Limitations (PoC)](#9-known-limitations-poc)
10. [Test Rapportage Template](#10-test-rapportage-template)

---

## 1. PoC Scope Definitie

### Wat zit IN het PoC

| Categorie | Inhoud |
|-----------|--------|
| **Factie** | Brabanders (speler) vs Brabanders-kloon (AI) |
| **Units** | Worker (Boer), Infantry (Carnavalvierder), Ranged (Kansen) |
| **Gebouwen** | Town Hall (Boerderij), Barracks (Cafe) |
| **Resources** | Gold (Worstenbroodjes) -- 1 resource type |
| **Map** | "De Kempen" (256x256), vereenvoudigd |
| **AI** | Basis strategische AI (bouwt workers, barracks, army; valt aan na timer) |
| **Systemen** | Camera, selection, movement, pathfinding, combat, fog of war, minimap, building, resource gathering, unit production, win/lose |

### Wat zit NIET in het PoC

Zie [sectie 9: Known Limitations](#9-known-limitations-poc) voor de volledige lijst.

---

## 2. Acceptance Criteria (Pass/Fail)

Elk criterium is binair: PASS of FAIL. Het PoC is pas geslaagd als **alle criteria PASS** zijn, tenzij expliciet gemarkeerd als "nice-to-have".

### 2.1 Performance

| # | Criterium | Meetmethode | Threshold | Pass/Fail |
|---|-----------|-------------|-----------|-----------|
| P-01 | 60 FPS stabiel met 0 units (lege map) | stats-gl, 30s gemiddelde | >= 58 FPS avg, geen drops < 50 | [ ] |
| P-02 | 60 FPS met 20 units (10 per speler) | stats-gl, 60s gemiddelde | >= 58 FPS avg, geen drops < 45 | [ ] |
| P-03 | 45+ FPS met 50 units (25 per speler) | stats-gl, 60s gemiddelde in combat | >= 45 FPS avg | [ ] |
| P-04 | 30+ FPS met 100 units (50 per speler, stress test) | stats-gl, 60s gemiddelde in combat | >= 30 FPS avg | [ ] |
| P-05 | Eerste frame gerenderd binnen 3 seconden | Chrome DevTools Performance tab | First Contentful Paint < 3s | [ ] |
| P-06 | Totale laadtijd < 5 seconden | Chrome DevTools Performance tab | LoadComplete < 5s, incl. WASM + assets | [ ] |
| P-07 | Geen memory leaks na 30 minuten spelen | Chrome DevTools Memory tab | Heap groei < 50MB over 30 min | [ ] |
| P-08 | Draw calls onder budget | stats-gl of Spector.js | < 150 draw calls per frame | [ ] |
| P-09 | System execution binnen frame budget | Chrome DevTools Performance, custom markers | ECS systems totaal < 10ms per frame | [ ] |
| P-10 | Geen GC pauses > 16ms | Chrome DevTools Performance, GC markers | Geen individuele GC > 16ms | [ ] |

### 2.2 Camera

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| C-01 | WASD pan werkt soepel in alle 4 richtingen | Handmatig: druk W, A, S, D afzonderlijk en combinaties | [ ] |
| C-02 | Pijltjestoetsen pan werkt | Handmatig: druk pijltjestoetsen in alle richtingen | [ ] |
| C-03 | Edge scrolling werkt (muis aan schermrand) | Handmatig: beweeg muis naar alle 4 randen + 4 hoeken | [ ] |
| C-04 | Scrollwiel zoom werkt met min/max grenzen | Handmatig: zoom volledig in tot limiet, volledig uit tot limiet | [ ] |
| C-05 | Camera start boven speler's Town Hall | Visueel: bij game start is Town Hall gecentreerd in viewport | [ ] |
| C-06 | Camera blijft binnen map bounds | Handmatig: pan naar alle randen, camera stopt bij map edge | [ ] |
| C-07 | Minimap klik verplaatst camera naar juiste positie | Handmatig: klik op 4+ punten op minimap, verifieer camera positie | [ ] |
| C-08 | Camera pan snelheid is comfortabel (niet te snel, niet te traag) | Subjectief: 3 personen beoordelen (1-5 schaal, min 3 gemiddeld) | [ ] |
| C-09 | Zoom niveau persistent na pan | Handmatig: zoom in, pan, verifieer zoom niet gereset | [ ] |

### 2.3 Selection

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| S-01 | Linksklik selecteert precies 1 unit | Klik op unit, verifieer selectiecirkel + UI panel | [ ] |
| S-02 | Box-select selecteert alle units binnen rechthoek | Sleep rechthoek over 5 units, verifieer alle 5 geselecteerd | [ ] |
| S-03 | Shift+klik voegt unit toe aan bestaande selectie | Selecteer unit A, shift+klik unit B, verifieer beide geselecteerd | [ ] |
| S-04 | Shift+klik op reeds geselecteerde unit deselecteert die unit | Selecteer A+B, shift+klik A, verifieer alleen B geselecteerd | [ ] |
| S-05 | Klik op lege grond deselecteert alles | Selecteer units, klik op lege grond, verifieer geen selectie | [ ] |
| S-06 | Selectiecirkel zichtbaar onder geselecteerde units | Visueel: groene cirkel onder eigen geselecteerde units | [ ] |
| S-07 | Unit info panel update bij selectie | Selecteer Worker vs Infantry, verifieer HP/ATK/naam wisselt | [ ] |
| S-08 | Meerdere units selectie toont groepsinformatie | Selecteer 5+ units, verifieer groepspanel met unit types | [ ] |
| S-09 | Kan gebouw selecteren door erop te klikken | Klik op Town Hall, verifieer gebouwinformatie in panel | [ ] |
| S-10 | Kan vijandelijke units selecteren (read-only info) | Klik op vijandelijke unit, verifieer info maar geen commando's | [ ] |
| S-11 | Box-select pakt alleen eigen units (geen vijandelijke) | Box-select over mix van eigen + vijandelijke units, verifieer alleen eigen geselecteerd | [ ] |

### 2.4 Movement

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| M-01 | Rechtsklik op terrein geeft move commando | Selecteer unit, rechtsklik op terrein, verifieer unit beweegt | [ ] |
| M-02 | Units bewegen naar target via pathfinding (niet in rechte lijn door obstacles) | Plaats unit achter water/gebouw, geef move naar andere zijde, verifieer pad om obstacle | [ ] |
| M-03 | Units ontwijken gebouwen | Move unit naar punt achter gebouw, verifieer unit loopt eromheen | [ ] |
| M-04 | Units ontwijken andere units (geen overlapping) | Stuur 10 units naar zelfde punt, verifieer geen z-fighting/overlapping sprites | [ ] |
| M-05 | Units stoppen bij bestemming | Geef move commando, verifieer unit stopt en staat idle bij aankomst | [ ] |
| M-06 | Meerdere units spreiden bij aankomst (formation) | Selecteer 10 units, stuur naar 1 punt, verifieer ze spreiden (niet allemaal op exact dezelfde pixel) | [ ] |
| M-07 | Move commando toont feedback (cursor change of move indicator) | Visueel: rechtsklik toont move cursor of marker op doelpositie | [ ] |
| M-08 | Unit snelheden kloppen per type | Meet tijd over bekende afstand: Worker 5.0, Infantry 5.5, Ranged 6.0 u/s (+-10% tolerantie) | [ ] |
| M-09 | Units bewegen correct over heuvels (Y volgt terrein) | Stuur unit over heuvel, verifieer unit volgt terrein hoogte (niet door terrein of zwevend) | [ ] |

### 2.5 Resource Gathering

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| R-01 | Worker rechtsklik op Gold Mine start gather cycle | Selecteer worker, rechtsklik op gold mine, verifieer worker loopt ernaartoe en begint te verzamelen | [ ] |
| R-02 | Worker draagt resources naar Town Hall na vol inventaris | Wacht tot worker 10 gold draagt, verifieer automatisch terugloopt naar Town Hall | [ ] |
| R-03 | Worker loopt automatisch terug naar mine na aflevering | Verifieer na deposit dat worker zelfstandig terugloopt naar dezelfde mine | [ ] |
| R-04 | Gold teller in UI update correct bij aflevering | Noteer gold voor en na deposit, verifieer verschil = carry capacity (10) | [ ] |
| R-05 | Gold Mine raakt uitgeput (amount = 0) | Laat meerdere workers minen tot mine leeg, verifieer mine verdwijnt of grayed-out | [ ] |
| R-06 | Worker zoekt automatisch nieuwe mine na uitputting | Verifieer worker begint aan dichtstbijzijnde niet-uitgeputte mine | [ ] |
| R-07 | Meerdere workers op dezelfde mine werkt | Stuur 3 workers naar 1 mine, verifieer alle 3 verzamelen (max gatherers check) | [ ] |
| R-08 | Gather rate is correct | Meet: worker levert ~10 gold per trip, trip-duur klopt met afstand + gather time | [ ] |
| R-09 | Worker stopt met gatheren als Town Hall vernietigd wordt | Vernietig Town Hall terwijl worker gathered, verifieer worker stopt of zoekt ander TH | [ ] |

### 2.6 Building

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| B-01 | Worker kan Barracks (Cafe) bouwen als voldoende gold | Selecteer worker, klik build Cafe, verifieer ghost verschijnt | [ ] |
| B-02 | Ghost-gebouw verschijnt bij plaatsing (volgt muis) | Beweeg muis na build-selectie, verifieer transparant gebouw volgt cursor | [ ] |
| B-03 | Rood ghost = ongeldig (op water) | Beweeg ghost over water, verifieer rood/niet-plaatsbaar | [ ] |
| B-04 | Rood ghost = ongeldig (op ander gebouw) | Beweeg ghost over Town Hall, verifieer rood | [ ] |
| B-05 | Rood ghost = ongeldig (buiten map bounds) | Beweeg ghost naar map rand, verifieer rood | [ ] |
| B-06 | Groen ghost = geldig (op begaanbaar terrein) | Beweeg ghost over grasland, verifieer groen | [ ] |
| B-07 | Klik op groene positie bevestigt plaatsing | Klik, verifieer bouwplaats verschijnt en worker loopt ernaartoe | [ ] |
| B-08 | Escape annuleert plaatsing | Druk Escape tijdens ghost-fase, verifieer ghost verdwijnt | [ ] |
| B-09 | Worker loopt naar bouwplaats en bouwt | Verifieer worker navigeert naar gebouw en constructie-animatie start | [ ] |
| B-10 | Bouw-progressie zichtbaar (HP stijgt of progress bar) | Visueel: gebouw bouwt geleidelijk op, of progress indicator zichtbaar | [ ] |
| B-11 | Gebouw verschijnt volledig na voltooiing | Verifieer gebouw compleet gerenderd, worker keert terug naar idle | [ ] |
| B-12 | Pathfinding update na gebouw plaatsing | Bouw gebouw in een doorgang, stuur unit door, verifieer unit loopt om nieuw gebouw | [ ] |
| B-13 | Bouw kost gold (aftrek zichtbaar) | Noteer gold voor plaatsing, verifieer correcte aftrek (Cafe: 200 gold per PRD) | [ ] |
| B-14 | "Niet genoeg gold" melding bij te weinig | Probeer te bouwen met 0 gold, verifieer foutmelding en geen plaatsing mogelijk | [ ] |
| B-15 | Alleen Workers kunnen bouwen (geen Infantry/Ranged) | Selecteer Infantry, verifieer geen build opties in panel | [ ] |

### 2.7 Unit Production

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| U-01 | Klik op Town Hall toont "Train Worker" button | Selecteer Town Hall, verifieer train Worker knop in panel | [ ] |
| U-02 | Klik op Barracks toont "Train Infantry" en "Train Ranged" buttons | Selecteer Cafe, verifieer 2 trainknoppen | [ ] |
| U-03 | Klik op "Train Infantry" start productie | Klik train, verifieer progress indicator in UI | [ ] |
| U-04 | Productie kost gold (aftrek bij start) | Noteer gold, start training (Infantry: 75 gold), verifieer aftrek | [ ] |
| U-05 | "Not enough gold" alert bij te weinig | Probeer te trainen met 0 gold, verifieer foutmelding | [ ] |
| U-06 | Unit verschijnt bij gebouw na trainingstijd | Wacht trainingstijd af (Infantry: 18s), verifieer unit spawnt nabij gebouw | [ ] |
| U-07 | Gespawnde unit is van juiste type en stats | Selecteer nieuw gespawnde unit, verifieer type + HP + ATK correct | [ ] |
| U-08 | Population cap check | Bij max pop, probeer te trainen, verifieer "Pop limit reached" melding | [ ] |
| U-09 | Productie queue werkt (meerdere units in wachtrij) | Queue 3 units, verifieer ze worden achtereenvolgens getraind | [ ] |
| U-10 | Population teller in HUD update bij training | Verifieer pop count +1 bij elke getrainde unit | [ ] |

### 2.8 Combat

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| A-01 | Rechtsklik op vijandelijke unit geeft attack commando | Selecteer eigen unit, rechtsklik op vijand, verifieer attack cursor + unit beweegt | [ ] |
| A-02 | Unit beweegt naar target tot binnen attack range | Verifieer melee units stoppen op ~1.5 units afstand, ranged op ~8 units | [ ] |
| A-03 | Melee unit valt aan bij contact | Verifieer attack animatie speelt bij melee Infantry | [ ] |
| A-04 | Ranged unit schiet projectielen | Verifieer zichtbaar projectiel (bierpul) reist van Kansen naar target | [ ] |
| A-05 | Projectielen reizen naar target (niet instant hit) | Verifieer projectiel heeft travel time, niet teleporteert | [ ] |
| A-06 | Damage berekening klopt: `ATK - (ARM * 0.5)`, minimum 1 | Reken: Infantry (10 ATK) vs unit met 2 ARM = 10 - 1 = 9 dmg. Verifieer via HP drop | [ ] |
| A-07 | Minimum damage is altijd 1 | Creeer scenario met extreem hoge armor, verifieer altijd >= 1 damage | [ ] |
| A-08 | Health bars updaten bij schade | Verifieer health bar krimpt proportioneel bij elke hit | [ ] |
| A-09 | Unit sterft bij HP=0 | Verifieer death animation/fade speelt, unit verdwijnt na ~3 seconden | [ ] |
| A-10 | Auto-attack: idle units vallen nabije vijanden aan | Plaats idle unit nabij vijand (binnen aggro range), verifieer automatische aanval | [ ] |
| A-11 | Auto-attack: units achtervolgen niet oneindig (leash range) | Lok unit weg, verifieer unit stopt met achtervolgen na ~15 units afstand | [ ] |
| A-12 | Units retaliaten als ze aangevallen worden | Laat vijand eigen idle unit aanvallen, verifieer eigen unit valt terug aan | [ ] |
| A-13 | Dode units zijn niet meer selecteerbaar | Probeer dode unit te selecteren, verifieer niet mogelijk | [ ] |
| A-14 | Attack op eigen units is niet mogelijk | Rechtsklik op eigen unit, verifieer geen attack commando (move of niks) | [ ] |

### 2.9 AI (Computer Opponent)

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| AI-01 | AI bouwt workers automatisch (minimaal 4-6 workers in eerste 2 min) | Scout naar AI base na 2 min, tel workers | [ ] |
| AI-02 | AI verzamelt resources (gold teller stijgt) | Verifieer AI heeft units bij gold mine | [ ] |
| AI-03 | AI bouwt barracks | Scout naar AI base na 3-4 min, verifieer barracks aanwezig | [ ] |
| AI-04 | AI traint army (mix van Infantry en Ranged) | Scout na 4-5 min, verifieer militaire units bij AI base | [ ] |
| AI-05 | AI valt aan na timer (5-8 minuten) | Wacht passief, verifieer AI-army arriveert bij speler base tussen 5-8 min | [ ] |
| AI-06 | AI is verslaanbaar (niet onmogelijk) | Speel normaal, verifieer dat met goed spel AI te verslaan is | [ ] |
| AI-07 | AI is een uitdaging (niet triviaal) | Speel passief/slecht, verifieer dat AI de speler kan verslaan | [ ] |
| AI-08 | AI units bewegen via pathfinding (niet door obstacles) | Observeer AI army movement, verifieer ze lopen om water/gebouwen | [ ] |
| AI-09 | AI herbouwt army na verloren gevecht | Versla AI army, wacht 3-5 min, verifieer AI bouwt nieuwe army | [ ] |
| AI-10 | AI crasht niet bij edge cases | Vernietig alle AI workers, verifieer game crasht niet en AI doet iets redelijks | [ ] |

### 2.10 Fog of War

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| F-01 | Onverkend terrein is zwart (niet transparant, echt zwart) | Bij game start: verifieer terrein ver van base is volledig zwart | [ ] |
| F-02 | Verkend maar niet zichtbaar terrein is donkergrijs | Stuur unit naar plek, trek terug, verifieer terrein nu donkergrijs | [ ] |
| F-03 | Terrein nabij eigen units is volledig zichtbaar (helder) | Verifieer terrein rondom eigen units geen fog overlay heeft | [ ] |
| F-04 | Vijandelijke units alleen zichtbaar in eigen sight range | Stuur unit nabij vijand, verifieer vijand verschijnt; trek terug, verifieer vijand verdwijnt | [ ] |
| F-05 | Fog update wanneer units bewegen | Stuur unit langs een pad, verifieer fog onthult geleidelijk | [ ] |
| F-06 | Gebouwen hebben eigen sight range | Bouw gebouw, verifieer zichtbaarheid rondom gebouw zonder units | [ ] |
| F-07 | Fog bedekt minimap correct | Verifieer minimap toont donkere gebieden overeenkomend met game fog | [ ] |

### 2.11 Minimap

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| MM-01 | Terrein kleuren op minimap kloppen (groen = gras, blauw = water) | Visueel: vergelijk minimap met game world | [ ] |
| MM-02 | Eigen units zichtbaar als oranje/gekleurde dots | Verifieer speler units als herkenbare dots op minimap | [ ] |
| MM-03 | Vijandelijke units zichtbaar (alleen als niet in fog) | Verifieer vijandelijke units verschijnen/verdwijnen met fog state | [ ] |
| MM-04 | Gebouwen zichtbaar als grotere markers op minimap | Verifieer gebouwen herkenbaar groter dan unit dots | [ ] |
| MM-05 | Klik op minimap verplaatst camera correct | Klik op 4+ verschillende minimap posities, verifieer camera springt correct | [ ] |
| MM-06 | Camera viewport indicator zichtbaar op minimap | Verifieer wit/helder kader op minimap dat camera view aangeeft | [ ] |
| MM-07 | Minimap viewport indicator beweegt mee met camera | Pan camera, verifieer indicator op minimap volgt | [ ] |

### 2.12 Win/Lose Condities

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| W-01 | Speler wint als AI Town Hall vernietigd wordt | Vernietig AI Town Hall met army, verifieer Victory scherm | [ ] |
| W-02 | Speler verliest als eigen Town Hall vernietigd wordt | Laat AI eigen Town Hall vernietigen, verifieer Defeat scherm | [ ] |
| W-03 | Victory scherm verschijnt met correcte tekst | Verifieer "Victory" of "Overwinning" tekst zichtbaar | [ ] |
| W-04 | Defeat scherm verschijnt met correcte tekst | Verifieer "Defeat" of "Nederlaag" tekst zichtbaar | [ ] |
| W-05 | Stats worden getoond op eindscherm | Verifieer minimaal: speelduur, units getraind, units verloren, gold verzameld | [ ] |
| W-06 | Retry/Opnieuw button werkt | Klik retry op eindscherm, verifieer nieuwe game start correct | [ ] |
| W-07 | Game input stopt na win/lose (geen commands meer mogelijk) | Na victory/defeat: probeer units te bewegen, verifieer niks gebeurt | [ ] |

### 2.13 HUD & UI

| # | Criterium | Testmethode | Pass/Fail |
|---|-----------|-------------|-----------|
| UI-01 | Resource teller zichtbaar en leesbaar | Verifieer gold counter prominent in HUD | [ ] |
| UI-02 | Population counter zichtbaar (current/max) | Verifieer format "X/Y" met correcte waarden | [ ] |
| UI-03 | Selectie panel toont correcte unit info (naam, HP, ATK, ARM) | Selecteer elke unit type, verifieer alle stats correct | [ ] |
| UI-04 | Hotkeys werken (minimaal Q/W voor train in gebouw) | Selecteer Barracks, druk Q, verifieer training start | [ ] |
| UI-05 | Escape toets deselecteert alles | Druk Escape, verifieer selectie cleared | [ ] |
| UI-06 | Rechtermuisknop context menu van browser is onderdrukt | Rechtsklik in game, verifieer GEEN browser context menu verschijnt | [ ] |

---

## 3. Functionele Testcases

Gedetailleerde stap-voor-stap testcases voor de kernflows van het PoC.

### TC-001: Complete Gather Cycle

**Prioriteit**: P0 (blokkerend)
**Precondities**: Game geladen, speler heeft Worker en Town Hall

| Stap | Actie | Verwacht resultaat |
|------|-------|-------------------|
| 1 | Klik op Worker | Worker geselecteerd, selectiecirkel zichtbaar, info panel toont Worker stats |
| 2 | Rechtsklik op Gold Mine | Worker loopt naar Gold Mine via pathfinding |
| 3 | Wacht tot Worker bij mine is | Worker stopt, gather-animatie start |
| 4 | Wacht tot inventory vol (10 gold) | Worker draait om, loopt naar Town Hall |
| 5 | Wacht tot Worker bij Town Hall is | Gold teller +10, Worker draait om naar mine |
| 6 | Herhaal 3x | Elke trip levert +10 gold, consistent |

### TC-002: Building Placement & Construction

**Prioriteit**: P0
**Precondities**: Speler heeft Worker en >= 200 gold

| Stap | Actie | Verwacht resultaat |
|------|-------|-------------------|
| 1 | Selecteer Worker | Worker geselecteerd |
| 2 | Klik "Build Cafe" in panel | Ghost-gebouw verschijnt bij muis, volgt cursor |
| 3 | Beweeg muis over water | Ghost wordt rood |
| 4 | Beweeg muis over Town Hall | Ghost wordt rood |
| 5 | Beweeg muis over open grasland | Ghost wordt groen |
| 6 | Klik om te plaatsen | Gold -200, Worker loopt naar bouwplaats |
| 7 | Wacht bouwtijd af (30s per PRD) | Progress zichtbaar, gebouw bouwt op |
| 8 | Bouw compleet | Cafe volledig gerenderd, worker keert terug naar idle |
| 9 | Klik op Cafe | Cafe geselecteerd, train buttons zichtbaar |

### TC-003: Train Unit & Combat

**Prioriteit**: P0
**Precondities**: Speler heeft Cafe (Barracks) en >= 75 gold

| Stap | Actie | Verwacht resultaat |
|------|-------|-------------------|
| 1 | Selecteer Cafe | Train buttons zichtbaar: Infantry (Q), Ranged (W) |
| 2 | Klik "Train Infantry" | Gold -75, productie progress start |
| 3 | Wacht 18 seconden | Infantry (Carnavalvierder) spawnt nabij Cafe |
| 4 | Selecteer nieuw Infantry unit | Stats: HP=80, ATK=10, SPD=5.5, Range=0 |
| 5 | Ontdek vijandelijke unit via fog | Vijandelijke unit verschijnt |
| 6 | Rechtsklik op vijandelijke unit | Attack cursor, Infantry loopt naar vijand |
| 7 | Infantry bereikt melee range | Attack animatie start, vijand HP daalt |
| 8 | Wacht tot vijand HP=0 | Death animation, vijand verdwijnt na 3s |

### TC-004: Ranged Combat

**Prioriteit**: P0
**Precondities**: Speler heeft Kansen (Ranged unit) en zichtbare vijand

| Stap | Actie | Verwacht resultaat |
|------|-------|-------------------|
| 1 | Selecteer Kansen | Stats: HP=55, ATK=12, Range=8 |
| 2 | Rechtsklik op vijandelijke unit op afstand | Kansen loopt tot range 8, stopt |
| 3 | Kansen begint te schieten | Projectiel (bierpul) zichtbaar, reist naar target |
| 4 | Projectiel raakt target | Target HP daalt, health bar update |
| 5 | Target beweegt | Volgende projectiel richt op nieuwe positie |

### TC-005: Full Game Loop (Happy Path)

**Prioriteit**: P0
**Precondities**: Verse game start

| Stap | Actie | Verwacht resultaat |
|------|-------|-------------------|
| 1 | Game start | Camera boven Town Hall, 1 Town Hall + 4 Workers (of standaard start) |
| 2 | Stuur workers naar gold mine | Workers beginnen te gatheren |
| 3 | Bouw Cafe als gold >= 200 | Cafe gebouwd |
| 4 | Train 5 Infantry + 3 Ranged | Army bij Cafe |
| 5 | Scout richting vijand | Fog onthult vijand base |
| 6 | Selecteer army, rechtsklik op vijand Town Hall | Army beweegt en valt aan |
| 7 | Combat met AI defenders | Melee in front, ranged achter |
| 8 | Vernietig AI Town Hall | Victory scherm, stats getoond |
| 9 | Klik Retry | Nieuwe game start, vorige state volledig gereset |

### TC-006: AI Attacks Player

**Prioriteit**: P0
**Precondities**: Verse game start

| Stap | Actie | Verwacht resultaat |
|------|-------|-------------------|
| 1 | Start game, doe NIKS (alleen observeren) | Game draait normaal |
| 2 | Wacht 5-8 minuten | AI army verschijnt op minimap, beweegt richting speler base |
| 3 | AI army arriveert | AI units vallen Town Hall en/of speler units aan |
| 4 | AI vernietigt Town Hall (speler verdedigt niet) | Defeat scherm verschijnt |

### TC-007: Multi-Unit Selection & Group Movement

**Prioriteit**: P1
**Precondities**: Speler heeft 8+ units

| Stap | Actie | Verwacht resultaat |
|------|-------|-------------------|
| 1 | Box-select over 8 units | Alle 8 geselecteerd, groepspanel zichtbaar |
| 2 | Rechtsklik op terrein ver weg | Alle 8 units bewegen in formatie |
| 3 | Wacht tot aankomst | Units spreiden uit, geen overlapping |
| 4 | Shift+klik om 1 unit toe te voegen | 9 units nu geselecteerd |
| 5 | Shift+klik op al geselecteerde unit | 8 units, die ene verwijderd |

---

## 4. Edge Cases & Bug Checklist

Elk item hieronder is een potentiele bug of edge case die getest moet worden. Markeer als PASS (werkt correct), FAIL (bug), of N/A (niet toepasbaar in huidige build).

### 4.1 Selection Edge Cases

| # | Scenario | Verwacht gedrag | Resultaat |
|---|----------|-----------------|-----------|
| E-S-01 | Unit selecteren terwijl andere geselecteerd is | Oude selectie cleared, nieuwe unit geselecteerd | [ ] |
| E-S-02 | Box-select beginnen op een unit | Box-select start, niet per ongeluk single-click-select | [ ] |
| E-S-03 | Box-select met 0 units erin | Niets geselecteerd (als deselecteer) | [ ] |
| E-S-04 | Dubbelklikken op een unit | Selecteert alle units van hetzelfde type op scherm (of single select, consistent) | [ ] |
| E-S-05 | Selecteren tijdens camera pan (WASD ingedrukt) | Selectie werkt normaal ondanks pan | [ ] |

### 4.2 Command Edge Cases

| # | Scenario | Verwacht gedrag | Resultaat |
|---|----------|-----------------|-----------|
| E-C-01 | Move commando geven aan unit die aan het aanvallen is | Unit stopt met aanvallen, begint te bewegen | [ ] |
| E-C-02 | Attack commando op eigen unit | Niks (geen friendly fire in PoC) | [ ] |
| E-C-03 | Move commando naar onbereikbaar punt (midden in water) | Unit beweegt naar dichtstbijzijnd bereikbaar punt | [ ] |
| E-C-04 | Move commando naar buiten map | Unit beweegt naar map-rand of dichtstbijzijnd geldig punt | [ ] |
| E-C-05 | Rapid-fire move commando's (spam rechtermuisknop) | Unit gehoorzaamt laatste commando, geen crash | [ ] |
| E-C-06 | Move commando naar precies de huidige positie | Unit doet niks (geen stutter) | [ ] |
| E-C-07 | Attack commando op gebouw | Unit loopt naar gebouw en valt aan | [ ] |
| E-C-08 | Commando's geven terwijl game gepauzeerd | Commando's worden gebufferd of genegeerd (consistent) | [ ] |

### 4.3 Resource Edge Cases

| # | Scenario | Verwacht gedrag | Resultaat |
|---|----------|-----------------|-----------|
| E-R-01 | Resources proberen te verzamelen met Infantry | Niks -- Infantry heeft geen gather ability | [ ] |
| E-R-02 | Resources proberen te verzamelen met Ranged unit | Niks -- Ranged heeft geen gather ability | [ ] |
| E-R-03 | Gold op 0, probeer gebouw te bouwen | "Niet genoeg gold" melding, geen actie | [ ] |
| E-R-04 | Gold op 0, probeer unit te trainen | "Niet genoeg gold" melding, geen actie | [ ] |
| E-R-05 | Worker gathert terwijl mine depleted wordt door andere worker | Worker stopt, zoekt nieuwe mine of gaat idle | [ ] |
| E-R-06 | Alle gold mines uitgeput | Economie stopt, game draait door zonder crash | [ ] |
| E-R-07 | Worker onderweg naar Town Hall, Town Hall vernietigd | Worker stopt of zoekt ander Town Hall; geen crash | [ ] |

### 4.4 Building Edge Cases

| # | Scenario | Verwacht gedrag | Resultaat |
|---|----------|-----------------|-----------|
| E-B-01 | Gebouw plaatsen terwijl geen worker geselecteerd | Bouw-modus start niet (button niet beschikbaar of disabled) | [ ] |
| E-B-02 | Worker sterft terwijl hij bouwt | Bouw pauzeert, incompleet gebouw blijft staan, andere worker kan voltooien | [ ] |
| E-B-03 | Twee gebouwen exact naast elkaar plaatsen | Beide plaatsbaar als er geen overlap is | [ ] |
| E-B-04 | Ghost-gebouw plaatsen op resource node | Rood ghost (ongeldig) of resource wordt geconsumeerd (consistent gedrag) | [ ] |
| E-B-05 | Cancel building placement (Escape of rechtermuisknop) | Ghost verdwijnt, gold niet afgetrokken | [ ] |
| E-B-06 | Gebouw onder constructie wordt aangevallen | Health daalt, als HP=0 voor voltooiing: gebouw vernietigd, resources verloren | [ ] |

### 4.5 Combat Edge Cases

| # | Scenario | Verwacht gedrag | Resultaat |
|---|----------|-----------------|-----------|
| E-A-01 | 2 melee units die elkaar tegelijk aanvallen | Beide slaan, geen deadlock, een van beide sterft eerst | [ ] |
| E-A-02 | Ranged unit schiet op target dat net sterft | Projectiel verdwijnt of mist, geen crash | [ ] |
| E-A-03 | Unit krijgt attack commando op target dat buiten sight is | Unit beweegt richting laatst bekende positie | [ ] |
| E-A-04 | 100 units selecteren en naar 1 vijandelijke unit sturen | Pathfinding stress: units bewegen zonder crash, mogelijk vertraging maar < 5s | [ ] |
| E-A-05 | Alle eigen military units dood, alleen workers over | Game draait door, workers kunnen nog vechten (zwak, maar functioneel) | [ ] |
| E-A-06 | Alle workers dood, alleen military over | Game draait door, speler kan niet meer bouwen/gatheren maar kan nog aanvallen | [ ] |

### 4.6 AI Edge Cases

| # | Scenario | Verwacht gedrag | Resultaat |
|---|----------|-----------------|-----------|
| E-AI-01 | Alle AI workers gedood in rush | AI herbouwt workers vanuit Town Hall, of game is bijna gewonnen | [ ] |
| E-AI-02 | AI Town Hall vernietigd voordat AI aanvalt | Victory condition triggered, game eindigt | [ ] |
| E-AI-03 | AI gold mines allemaal uitgeput | AI gedraagt zich nog rationeel (bouwt army met wat het heeft) | [ ] |
| E-AI-04 | Speler bouwt muur van gebouwen om AI base | AI pathfinds eromheen of valt gebouwen aan | [ ] |
| E-AI-05 | AI en speler doen allebei niks voor 30 minuten | Geen crash, geen memory explosion | [ ] |

### 4.7 Browser & Systeem Edge Cases

| # | Scenario | Verwacht gedrag | Resultaat |
|---|----------|-----------------|-----------|
| E-SYS-01 | Browser tab wisselen en terugkomen | Game pauzeert of hervat correct, geen crash, geen time-skip burst | [ ] |
| E-SYS-02 | Window resizen tijdens gameplay | Canvas schaal correct mee, UI responsief, geen render artefacten | [ ] |
| E-SYS-03 | Rechtsklik op minimap | Geen browser context menu, optioneel: camera verplaatst | [ ] |
| E-SYS-04 | Camera zoom tot absolute maximum en minimum | Camera stopt bij grenzen, geen crash, geen inverted view | [ ] |
| E-SYS-05 | Alt+Tab weg tijdens loading | Loading hervat normaal bij terugkeer | [ ] |
| E-SYS-06 | Fullscreen toggle (F11) | Game schaalt correct, UI responsief | [ ] |
| E-SYS-07 | Laptop deksel dicht en open (sleep/wake) | Game hervat correct na wake | [ ] |
| E-SYS-08 | Netwerkverlies tijdens gameplay (als assets CDN-loaded) | Reeds geladen game draait door, nieuwe assets tonen fallback | [ ] |
| E-SYS-09 | Twee game tabs tegelijk open | Beide draaien onafhankelijk, geen shared state corruptie | [ ] |

---

## 5. Performance Test Protocol

### 5.1 Benodigde Tools

| Tool | Versie | Doel | Installatie |
|------|--------|------|-------------|
| **stats-gl** | latest | In-game FPS/GPU/CPU overlay | `npm i stats-gl`, integreer in game loop |
| **Chrome DevTools -- Performance tab** | Chrome 124+ | Frame timing, GC events, long tasks | Ingebouwd |
| **Chrome DevTools -- Memory tab** | Chrome 124+ | Heap snapshots, allocation timelines | Ingebouwd |
| **Spector.js** | latest | WebGL draw call inspector | Browser extension |
| **three-perf** (optioneel) | latest | Three.js specifieke metrics | `npm i three-perf` |

### 5.2 stats-gl Integratie

```typescript
// Voeg toe aan game loop voor PoC testing
import Stats from 'stats-gl';

const stats = new Stats({
  trackGPU: true,
  trackHz: true,
  trackCPU: true,
  logsPerSecond: 4,
  graphsPerSecond: 30,
  samplesLog: 100,
  samplesGraph: 10,
  precision: 2,
  horizontal: true,
  minimal: false
});
document.body.appendChild(stats.dom);

// In game loop:
function gameLoop() {
  stats.begin();
  // ... game update + render ...
  stats.end();
  requestAnimationFrame(gameLoop);
}
```

### 5.3 Test Scenarios

Voer elk scenario uit en noteer de resultaten in de tabel.

#### Scenario 1: Idle Map (Baseline)

| Stap | Actie |
|------|-------|
| 1 | Start game, verwijder alle units (of laad lege map variant) |
| 2 | Camera op standaard positie (boven midden) |
| 3 | Wacht 5 seconden voor stabilisatie |
| 4 | Lees stats-gl: noteer avg FPS, min FPS, draw calls |
| 5 | Open Chrome DevTools Performance tab, record 10 seconden |
| 6 | Analyseer: langste frame, GC events, main thread utilization |

**Pass criteria**: avg >= 58 FPS, min >= 50 FPS, geen frame > 25ms

| Metric | Waarde | Pass? |
|--------|--------|-------|
| Avg FPS | ___ | [ ] |
| Min FPS | ___ | [ ] |
| Max frame time | ___ms | [ ] |
| Draw calls | ___ | [ ] |

#### Scenario 2: Standard Game (20 units)

| Stap | Actie |
|------|-------|
| 1 | Start standaard game (10 units speler, 10 units AI) |
| 2 | Speel 60 seconden normaal (gather, build, minor combat) |
| 3 | Noteer stats-gl metrics |
| 4 | Performance record 30 seconden tijdens pan+zoom |

**Pass criteria**: avg >= 58 FPS, min >= 45 FPS

| Metric | Waarde | Pass? |
|--------|--------|-------|
| Avg FPS | ___ | [ ] |
| Min FPS | ___ | [ ] |
| Max frame time | ___ms | [ ] |
| Draw calls | ___ | [ ] |

#### Scenario 3: Combat Stress (50 units)

| Stap | Actie |
|------|-------|
| 1 | Spawn 25 units per speler (via cheat code of debug tool) |
| 2 | Selecteer alle 25 eigen units |
| 3 | Attack-move naar AI base |
| 4 | Meet FPS tijdens 30 seconden actieve combat |

**Pass criteria**: avg >= 45 FPS

| Metric | Waarde | Pass? |
|--------|--------|-------|
| Avg FPS | ___ | [ ] |
| Min FPS | ___ | [ ] |
| Max frame time | ___ms | [ ] |
| Draw calls | ___ | [ ] |
| Projectielen actief (max) | ___ | [ ] |

#### Scenario 4: Extreme Stress (100 units)

| Stap | Actie |
|------|-------|
| 1 | Spawn 50 units per speler |
| 2 | Alle 50 eigen units attack-move naar AI |
| 3 | Meet FPS tijdens 60 seconden all-out combat |

**Pass criteria**: avg >= 30 FPS

| Metric | Waarde | Pass? |
|--------|--------|-------|
| Avg FPS | ___ | [ ] |
| Min FPS | ___ | [ ] |
| Max frame time | ___ms | [ ] |
| Draw calls | ___ | [ ] |

#### Scenario 5: Pathfinding Stress

| Stap | Actie |
|------|-------|
| 1 | Selecteer 30 units |
| 2 | Stuur naar 1 punt aan andere kant van map (door obstacles) |
| 3 | Meet FPS drop op moment van path request |
| 4 | Herhaal 5x met verschillende doelen (rapid-fire commands) |

**Pass criteria**: FPS drop < 10 frames, geen freeze > 500ms

| Metric | Waarde | Pass? |
|--------|--------|-------|
| FPS drop bij path request | ___ frames | [ ] |
| Max stutter duration | ___ms | [ ] |
| Path computation time (DevTools) | ___ms | [ ] |

#### Scenario 6: Loading Performance

| Stap | Actie |
|------|-------|
| 1 | Clear browser cache (DevTools > Application > Clear) |
| 2 | Hard refresh (Ctrl+Shift+R) |
| 3 | Start DevTools Performance recording VOOR refresh |
| 4 | Noteer: First Contentful Paint, DOMContentLoaded, Load Complete |
| 5 | Noteer: WASM init time (recast-navigation), asset load time |

**Pass criteria**: First frame < 3s, volledig geladen < 5s

| Metric | Waarde | Pass? |
|--------|--------|-------|
| First Contentful Paint | ___ms | [ ] |
| WASM init (recast) | ___ms | [ ] |
| Asset loading | ___ms | [ ] |
| Game ready (interactief) | ___ms | [ ] |
| Total bundle size (gzipped) | ___KB | [ ] |

---

## 6. Memory Leak Test Protocol

### 6.1 30-Minuten Soak Test

Dit is de kritische test voor memory leaks. Volg het protocol EXACT.

| Stap | Actie |
|------|-------|
| 1 | Start game, open Chrome DevTools Memory tab |
| 2 | Klik "Take heap snapshot" = Snapshot 1. Noteer JS Heap Size |
| 3 | Speel 10 minuten normaal: gather, build, train units, minor combat |
| 4 | Klik "Take heap snapshot" = Snapshot 2. Noteer JS Heap Size |
| 5 | Speel 10 minuten met intensieve combat: train max units, grote veldslagen |
| 6 | Klik "Take heap snapshot" = Snapshot 3. Noteer JS Heap Size |
| 7 | Speel 10 minuten met herhaalde unit death + respawn cycles |
| 8 | Klik "Take heap snapshot" = Snapshot 4 (finale). Noteer JS Heap Size |
| 9 | Bereken totale groei: Snapshot 4 - Snapshot 1 |

**Pass criteria**: Totale groei < 50MB over 30 minuten

| Snapshot | JS Heap Size | Delta t.o.v. vorige |
|----------|-------------|-------------------|
| 1 (start) | ___MB | -- |
| 2 (10 min) | ___MB | +___MB |
| 3 (20 min) | ___MB | +___MB |
| 4 (30 min) | ___MB | +___MB |
| **Totale groei** | | **+___MB** |

### 6.2 Specifieke Leak Checks

| Check | Hoe testen | Wat zoeken | Pass/Fail |
|-------|-----------|-----------|-----------|
| Entity pooling | Spawn 50 units, kill ze, snapshot. Herhaal 5x. | Retained entity count moet stabiel zijn | [ ] |
| Three.js disposals | Bouw 10 gebouwen, vernietig ze. | Geen orphaned geometries/materials in heap | [ ] |
| Event listeners | Tab 50x weg en terug. | Listener count mag niet groeien | [ ] |
| Projectile cleanup | 100 ranged attacks. | Projectile count na combat = 0 | [ ] |
| Particle cleanup | Trigger 50 effecten (combat VFX). | Particle buffer niet oneindig groeien | [ ] |
| PathBuffer | 100 path requests, wacht tot units aankomen. | Path buffer size stabiel na completion | [ ] |

### 6.3 Performance.memory API Check (Chrome Only)

```javascript
// Plak in Chrome console, elke 30 seconden een reading
setInterval(() => {
  if (performance.memory) {
    console.log({
      usedHeap: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1) + 'MB',
      totalHeap: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1) + 'MB',
      limit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1) + 'MB'
    });
  }
}, 30000);
```

---

## 7. Browser Test Matrix

### 7.1 Primaire Browsers (Must Pass)

| Browser | Versie | OS | Renderer | Alle AC? | FPS Target | Notities |
|---------|--------|-----|----------|----------|-----------|----------|
| Chrome | 124+ | macOS 15+ (M-series) | WebGPU/WebGL2 | [ ] | 60 FPS | Primair dev target |
| Chrome | 124+ | Windows 11 | WebGPU/WebGL2 | [ ] | 60 FPS | Grootste playerbase |
| Firefox | 126+ | macOS 15+ | WebGL2 | [ ] | 60 FPS | Geen WebGPU |
| Firefox | 126+ | Windows 11 | WebGL2 | [ ] | 60 FPS | |

### 7.2 Secundaire Browsers (Should Pass)

| Browser | Versie | OS | Renderer | Alle AC? | FPS Target | Notities |
|---------|--------|-----|----------|----------|-----------|----------|
| Safari | 18+ | macOS 15+ | WebGPU/WebGL2 | [ ] | 60 FPS | WebGPU support limited |
| Edge | 124+ | Windows 11 | WebGPU/WebGL2 | [ ] | 60 FPS | Chromium-based |
| Chrome | 124+ | Linux (Ubuntu 22+) | WebGL2 | [ ] | 45 FPS | Nice-to-have |

### 7.3 Expliciet NIET Getest (PoC)

- Mobile browsers (iOS Safari, Android Chrome) -- geen touch controls in PoC
- Internet Explorer -- niet ondersteund
- Chrome < 120 / Firefox < 120 -- te oud voor ES2022 / WebGL2
- Browsers zonder WebGL2 support

### 7.4 Per Browser Test Checklist

Voer voor **elke browser** in de matrix de volgende subset uit:

| # | Test | Alle browsers | Resultaat |
|---|------|--------------|-----------|
| BT-01 | Game laadt zonder console errors | [ ] | |
| BT-02 | Camera WASD + zoom werkt | [ ] | |
| BT-03 | Unit selectie (click + box) werkt | [ ] | |
| BT-04 | Movement via rechtermuisknop werkt | [ ] | |
| BT-05 | Resource gathering cycle compleet | [ ] | |
| BT-06 | Building placement werkt | [ ] | |
| BT-07 | Unit training werkt | [ ] | |
| BT-08 | Combat (melee + ranged) werkt | [ ] | |
| BT-09 | Fog of war zichtbaar en functioneel | [ ] | |
| BT-10 | Minimap zichtbaar en klikbaar | [ ] | |
| BT-11 | FPS >= 45 met 20 units | [ ] | |
| BT-12 | Geen JS errors in console na 5 min spelen | [ ] | |
| BT-13 | WebGL context loss recovery (DevTools > More tools > Rendering > Lose WebGL context) | [ ] | |
| BT-14 | Browser context menu onderdrukt bij rechtermuisknop | [ ] | |

### 7.5 WebGPU vs WebGL2 Fallback Test

| # | Test | Resultaat |
|---|------|-----------|
| WG-01 | Browser met WebGPU: renderer initialiseert als WebGPU | [ ] |
| WG-02 | Browser zonder WebGPU: renderer valt terug naar WebGL2 | [ ] |
| WG-03 | Console log bevestigt welke renderer actief is | [ ] |
| WG-04 | Visuele output identiek op beide renderers | [ ] |
| WG-05 | Performance verschil acceptabel (WebGL2 max 20% trager) | [ ] |

---

## 8. Regression Test Suite

Na elke significante code change, voer de volgende minimale regressie-suite uit. Geschatte doorlooptijd: 15 minuten.

### Quick Smoke Test (5 minuten)

| # | Test | Max 30s per test | Pass/Fail |
|---|------|-----------------|-----------|
| QS-01 | Game laadt zonder errors | [ ] |
| QS-02 | Camera pan + zoom werkt | [ ] |
| QS-03 | Unit selectie + deselect werkt | [ ] |
| QS-04 | Worker gather cycle compleet (1 trip) | [ ] |
| QS-05 | Gebouw bouwen werkt | [ ] |
| QS-06 | Unit trainen werkt | [ ] |
| QS-07 | Combat (1v1 melee) werkt | [ ] |
| QS-08 | FPS >= 45 (stats-gl snelle check) | [ ] |

### Extended Smoke Test (10 minuten extra)

| # | Test | Pass/Fail |
|---|------|-----------|
| ES-01 | Box-select + group movement | [ ] |
| ES-02 | Ranged combat met projectiel | [ ] |
| ES-03 | Fog of war onthult + verbergt | [ ] |
| ES-04 | Minimap klik navigatie | [ ] |
| ES-05 | Population cap bereikt, training geweigerd | [ ] |
| ES-06 | Geen gold, bouwen geweigerd | [ ] |
| ES-07 | AI bouwt en valt aan (versneld: 2 min wachten of debug timer) | [ ] |
| ES-08 | Win condition triggered (AI TH vernietigd) | [ ] |
| ES-09 | Tab wisselen en terugkomen | [ ] |
| ES-10 | Window resize | [ ] |

---

## 9. Known Limitations (PoC)

De volgende features zijn **bewust niet geimplementeerd** in het PoC. Het ontbreken hiervan is GEEN bug.

### 9.1 Niet Aanwezig -- Features

| Feature | Waarom niet in PoC | Geplande versie |
|---------|-------------------|----------------|
| Tweede resource type (Bier/Lumber) | Complexiteitsreductie -- 1 resource volstaat voor PoC validatie | MVP (v0.1) |
| Factiemechanic Gezelligheid | Alleen Brabanders units, mechanic vereist tuning met 2e factie | MVP (v0.1) |
| Tech tree / upgrades | Niet nodig om core loop te valideren | MVP (v0.1) |
| Hero units | Complex systeem (revive, abilities), niet core | v1.0 |
| Abilities (Polonaise, Smokkelroute, etc.) | Unit abilities zijn boven op core combat, niet essentieel voor PoC | MVP (v0.1) |
| Support units (Boerinne, etc.) | Vereist heal systeem, niet core | MVP (v0.1) |
| Heavy/Siege units | Vereist armor types en building damage multipliers | MVP (v0.1) |
| Housing (Boerenhoeve) | Population cap via Town Hall alleen volstaat | MVP (v0.1) |
| Tweede factie (Randstad) | PoC valideert engine, niet factie-balans | MVP (v0.1) |
| Campaign / missions | PoC is skirmish only | v1.0 |
| Multiplayer | Expliciet out of scope | v2.0 |
| Save/Load systeem | Niet nodig voor PoC validatie (games zijn 10-15 min) | MVP (v0.1) |
| Sound/Muziek | Kan later worden toegevoegd zonder engine impact | MVP (v0.1) |
| Voice lines | Afhankelijk van ElevenLabs pipeline | v1.0 |
| Tutorial | PoC is voor interne validatie, niet eindgebruikers | v1.0 |
| Cheat codes | Debug tools volstaan voor PoC | MVP (v0.1) |
| Control groups (Ctrl+1-9) | Nice-to-have, niet essentieel voor PoC | MVP (v0.1) |
| Attack-move (A-key) | Nice-to-have | MVP (v0.1) |
| Rally points | Nice-to-have | MVP (v0.1) |
| Patrol / Guard commands | Nice-to-have | v1.0 |
| Middle mouse camera rotation | Expliciet optioneel in PRD | MVP (v0.1) |
| Mobile touch controls | Desktop first | v1.0 |
| Particle effects (confetti, dust) | Visuele polish, niet functioneel | MVP (v0.1) |
| LOD system (3 niveaus) | Kan later, gaat over performance optimization | MVP (v0.1) |
| Adaptive quality system | Later optimalisatie | v1.0 |

### 9.2 Niet Aanwezig -- Visueel

| Visueel element | PoC implementatie | Volledige implementatie |
|-----------------|-------------------|----------------------|
| Unit modellen | Gekleurde dozen (InstancedMesh) | GLB modellen (Blender/Meshy) |
| Gebouw modellen | Gekleurde dozen (groter) | GLB modellen |
| Terrein texturen | Eenvoudig groen/bruin/blauw | Multi-texture splat map |
| Animaties | Geen (statische dozen) | Idle, walk, attack, death, gather |
| Skybox | Solid color of simpele gradient | Cubemap of gradient sphere |
| Schaduwen | Mogelijk blob shadows of geen | PCF soft shadows (desktop) |
| Selectiecirkels | Simpele ring mesh | Pulserende ring met factie-kleur |
| Health bars | Simpele gekleurde quads | Billboarded quads met gradient |
| Projectielen | Kleine gekleurde sfeer | Model + trail effect |
| Damage numbers | Niet aanwezig | Floating text (pooled) |

### 9.3 Bekende Beperkingen -- Technisch

| Beperking | Impact | Workaround |
|-----------|--------|------------|
| Pathfinding kan stotteren bij 30+ simultane path requests | Mogelijke FPS drop van 1-3 frames | Web Worker moet dit oplossen; als Worker niet klaar is, queue requests |
| Fog of war update op 5-10 FPS | Lichte vertraging in fog-onthulling | Acceptabel, verhogen naar 10+ FPS indien performance het toelaat |
| Geen formation AI | Units klonteren bij aankomst | Handmatig spreiden; formation system in MVP |
| AI heeft vaste timer (5-8 min) | Weinig variatie in AI gedrag | Acceptabel voor PoC; difficulty levels in MVP |
| Geen unit collision avoidance op macro-level | Units kunnen vast raken in smalle doorgangen | Stuck detection + recovery is geimplementeerd per SUB-PRD-TECHNICAL |
| Max 2048 entities (bitECS world limit) | Genoeg voor PoC (<<2048) maar kan issue worden bij stress test | Verhoog indien nodig |

---

## 10. Test Rapportage Template

Gebruik dit template voor elke testrun.

```
=================================================================
REIGN OF BRABANT -- PoC TEST RAPPORT
=================================================================

Datum:          ____-__-__
Tester:         ________________________
Build versie:   v0.0.___
Branch/commit:  ________________________
Browser:        _____________ v___
OS:             _____________ v___
Hardware:       ________________________

-----------------------------------------------------------------
SAMENVATTING
-----------------------------------------------------------------
Acceptance Criteria:    __/__ PASS  (__/__ FAIL)
Functionele Tests:      __/__ PASS  (__/__ FAIL)
Edge Cases:             __/__ PASS  (__/__ FAIL)
Performance:            PASS / FAIL
Memory:                 PASS / FAIL
Browser Compat:         __/__ browsers PASS

OVERALL VERDICT:        [ ] PASS -- PoC geslaagd
                        [ ] FAIL -- Blokkerende issues gevonden

-----------------------------------------------------------------
BLOKKERENDE ISSUES (FAIL)
-----------------------------------------------------------------
1. [ID] Beschrijving:
   Stappen om te reproduceren:
   Verwacht:
   Werkelijk:
   Screenshot/video:

2. ...

-----------------------------------------------------------------
NIET-BLOKKERENDE ISSUES (bugs, polish)
-----------------------------------------------------------------
1. [ID] Beschrijving:
   Ernst: Laag / Medium / Hoog

2. ...

-----------------------------------------------------------------
PERFORMANCE RESULTATEN
-----------------------------------------------------------------
| Scenario          | Avg FPS | Min FPS | Draw Calls | Pass? |
|-------------------|---------|---------|------------|-------|
| Idle (0 units)    |         |         |            |       |
| Standard (20)     |         |         |            |       |
| Combat (50)       |         |         |            |       |
| Stress (100)      |         |         |            |       |
| Loading           |         |         |            |       |

Memory (30 min):    Start: ___MB  Einde: ___MB  Groei: ___MB

-----------------------------------------------------------------
OPMERKINGEN / AANBEVELINGEN
-----------------------------------------------------------------
...

=================================================================
```

---

## Bijlage A: Debug Tools voor PoC Testing

De volgende debug tools moeten beschikbaar zijn in de PoC build (achter een debug flag of key combo):

| Tool | Activatie | Functie |
|------|----------|---------|
| stats-gl overlay | Altijd aan in dev build | FPS/GPU/CPU monitoring |
| Entity inspector | F1 of debug panel | Toon ECS component data voor geselecteerde entity |
| Spawn unit | Debug console command | `debugSpawn('infantry', x, z, faction)` |
| Kill all AI | Debug console command | `debugKillAll(1)` -- alle AI entities doden |
| Set gold | Debug console command | `debugSetGold(faction, amount)` |
| Toggle fog | Debug console command | `debugToggleFog()` -- fog of war aan/uit |
| Speed multiplier | Debug console command | `debugSetSpeed(2.0)` -- game speed 2x |
| NavMesh visualizer | F2 | Toon navmesh polygons overlay |
| Spatial grid visualizer | F3 | Toon spatial hash grid cellen |
| AI state overlay | F4 | Toon AI state boven elke AI unit |

---

## Bijlage B: Traceability Matrix

Mapping van PRD requirements naar testcases.

| PRD Sectie | Requirement | Testcase(s) |
|------------|-------------|-------------|
| 2.1 Resource System | Workers verzamelen en brengen terug | R-01 t/m R-09, TC-001 |
| 2.2 Building System | Workers bouwen gebouwen | B-01 t/m B-15, TC-002 |
| 2.3 Unit System | 3 unit types met correcte stats | U-01 t/m U-10, TC-003, TC-004 |
| 2.4 Combat System | Damage formula, projectiles, death | A-01 t/m A-14, TC-003, TC-004 |
| 2.6 Fog of War | 3 states, visibility updates | F-01 t/m F-07 |
| 2.7 Camera & Controls | WASD, zoom, edge scroll, selection | C-01 t/m C-09, S-01 t/m S-11 |
| 6.3 Performance Targets | 60 FPS desktop, <5s load | P-01 t/m P-10, Scenario 1-6 |
| 9.1 Unit AI | FSM states, auto-attack | A-10 t/m A-12, TC-005 |
| 9.2 Strategic AI | Build order, attack timing | AI-01 t/m AI-10, TC-006 |
| SUB-PRD-TECH 1.6 | System execution order < 10ms | P-09 |
| SUB-PRD-TECH 3.8 | Stuck detection | E-C-03, E-A-04 |
| SUB-PRD-TECH 6.2 | WebGL context loss recovery | BT-13 |
| SUB-PRD-TECH 6.3 | Memory leak detection | P-07, Sectie 6 volledig |
| SUB-PRD-TECH 7.1 | Frame budget 16.6ms | P-09 |

---

*Testplan opgesteld door QA Lead*
*Versie 1.0.0 -- 2026-04-05*
*Scope: Proof of Concept (1 factie, 3 units, 2 gebouwen, 1 resource)*
