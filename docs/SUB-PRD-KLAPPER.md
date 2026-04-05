# SUB-PRD: De Klapper van de Week

## Reign of Brabant — Showstopper Features

**Versie**: 1.0.0
**Datum**: 2026-04-05
**Status**: Draft — Wacht op goedkeuring
**Parent document**: `../PRD.md` v1.0.0
**Auteur**: Game Master (Creative Director)

---

> *"Een goede game wordt gespeeld. Een legendarische game wordt GEDEELD."*

Dit document beschrijft de features die Reign of Brabant tillen van "leuke browser game" naar "hoe is dit in godsnaam een browser game?!" — het soort momenten waardoor mensen hun telefoon pakken om een screenshot te sturen naar hun vriendengroep. Elke feature is ontworpen om een emotie op te roepen: verbazing, hilariteit, trots, of pure ongeloof.

---

## Inhoudsopgave

1. [DE KLAPPER: Epic Replay Systeem](#1-de-klapper-epic-replay-systeem)
2. [Seizoensgebonden Events](#2-seizoensgebonden-events)
3. [De Brabantse Weerservice](#3-de-brabantse-weerservice)
4. [AI Commentator](#4-ai-commentator)
5. [Shared Replay GIFs](#5-shared-replay-gifs)
6. [Weekly Challenge](#6-weekly-challenge)
7. [De Geheime 5e Factie](#7-de-geheime-5e-factie)
8. [Modding / Map Editor](#8-modding--map-editor)
9. [Statistieken Dashboard](#9-statistieken-dashboard)
10. [De Meta-Easter Egg](#10-de-meta-easter-egg)
11. [Feature Matrix & Roadmap](#11-feature-matrix--roadmap)

---

## 1. DE KLAPPER: Epic Replay Systeem

**WOW-factor: 10/10**
**Prioriteit: v1.0**
**Geschatte implementatietijd: 4-5 weken**

Dit is het. De feature waar mensen over PRATEN. De feature waardoor iemand op kantoor zegt: "Heb je die video gezien van die Brabantse RTS?!" En dan kijkt het hele kantoor mee.

### 1.1 Concept

Na elke game (skirmish, campaign missie, of multiplayer match) wordt de speler gevraagd:

> **"Wil je de KLAPPER VAN DE WEEK zien?"**

Dan begint een volledig geregisseerde replay van de meest spectaculaire momenten uit het gevecht — met cinematische camerahoeken, slowmotion, dramatische muziek, en live AI-commentaar in Brabants dialect.

Het voelt alsof je naar een WarCraft III cinematic kijkt. Maar dan over jouw eigen gevecht. In een browser.

### 1.2 Hoe het werkt: De Replay Pipeline

#### Stap 1: Event Recording (tijdens gameplay)

Tijdens het spel registreert een `BattleRecorder` alle significante events in een compact event-log:

```
Opgeslagen per event:
- timestamp (game tick)
- event_type (unit_killed, building_destroyed, ability_used, hero_action, faction_ability, resource_milestone)
- actor_id + actor_type + actor_faction
- target_id + target_type + target_faction
- position (x, y, z)
- metadata (damage dealt, units involved, ability name)
```

**Opslagformaat**: Compact JSON array. Een typische 15-minuten game genereert ~500-2000 events = ~50-200KB aan data. Peanuts.

**Geen video-opname**: We nemen GEEN video op. We nemen DATA op en RE-RENDEREN de scene met cinematische camera's. Dit is fundamenteel anders en maakt het mogelijk in een browser.

#### Stap 2: Highlight Detection (na afloop)

Een `HighlightDetector` analyseert het event-log en scoort momenten op basis van een gewogen systeem:

| Event | Base Score | Multipliers |
|-------|-----------|-------------|
| Hero kill | 100 | x2 als de hero een ability gebruikte |
| Building destruction | 80 | x1.5 als het een Town Hall was |
| Faction ability activation | 90 | x2 als het de game besliste |
| Groep van 5+ kills in 3 sec | 120 | x1.5 per extra kill |
| Comeback moment (was losing, now winning) | 150 | Hoogste multiplier |
| Eerste kill van de game | 60 | Eenmalig |
| Last stand (1 gebouw over) | 130 | x2 als je won |
| Siege unit vs gebouw (50%+ damage in 1 hit) | 70 | x1.5 als het explodeerde |
| Ability combo (2+ abilities in 5 sec) | 110 | x1.3 per extra ability |

De top 5-8 momenten worden geselecteerd als "highlights".

**Comebackdetectie**: Het systeem houdt een running `advantage_score` bij (gebaseerd op army value + resource income + building count). Als deze swingt van -30% naar +30% binnen 60 seconden, is dat een comeback en krijgt het de hoogste score.

#### Stap 3: Cinematische Replay

De `CinematicDirector` neemt de highlights en bouwt er een 30-90 seconden "film" van:

**Camera systeem (6 camera types):**

| Camera | Gebruik | Techniek |
|--------|---------|----------|
| **Hero Close-Up** | Hero kill, ability activation | Orbit camera op hero, depth of field op achtergrond |
| **Battle Overhead** | Grote gevechten (10+ units) | Crane shot van boven, langzaam inzoomend |
| **Charge Tracking** | Unit charges, army movements | Tracking shot die meereist met de aanvallende groep |
| **Dramatic Zoom** | Kill moment, building explosion | Snelle zoom in op impact punt, freeze frame 0.3s |
| **Establishing Shot** | Scene-overgang, map overview | Hoge camera, breed beeld, toont beide legers |
| **Ground Level** | Laatste stand, epic 1v1 | Camera op unit-hoogte, over-the-shoulder perspectief |

**Timing & pacing:**

```
[0.0s]  Establishing shot — breed overzicht van de map
[2.0s]  Fade-in titel: "DE KLAPPER VAN DE WEEK" (gouden tekst, confetti)
[4.0s]  Commentator intro: "Welkom bij de samenvatting van deze LEGENDARISCHE veldslag!"
[5.5s]  Highlight 1 — meest dramatische camera, slowmotion op impact
[12.0s] Overgang (whoosh SFX + camera sweep)
[13.0s] Highlight 2
[...etc, 6-10 seconden per highlight...]
[~50s]  Finale highlight (de beslissende klap) — EXTRA slowmotion
[~58s]  Victory shot — winnende factie hero pose, confetti/effect
[~62s]  Statistieken overlay (kills, resources, MVP)
[~70s]  "DEEL DEZE KLAPPER" button met share opties
```

**Slowmotion**: Implementatie via variabele `timeScale` op de Three.js clock. Key moments draaien op 0.25x snelheid (4x slowmotion). Audio pitch wordt NIET verlaagd (dat klinkt raar) — in plaats daarvan speelt er een epische drum-hit of brass stinger.

**Depth of Field**: Post-processing via `BokehPass` in Three.js. Focus op het primaire subject, achtergrond wazig. Maakt het instant "filmisch".

**Particle effects**: Elke kill explodeert met factie-specifieke particles:
- Brabanders: confetti + worstenbroodjes
- Randstad: PowerPoint slides + koffiebonen
- Limburgers: steengruis + vlaaistukken
- Belgen: frieten + chocolade

#### Stap 4: AI Commentaar

Zie [sectie 4](#4-ai-commentator) voor het volledige AI Commentator systeem. Tijdens replays wordt een SPECIALE "replay commentator" modus gebruikt die weet dat het een samenvatting is.

**Voorbeeld commentaarscript voor een replay:**

```
[Establishing shot]
"Dansen en hansen, welkom bij de KLAPPER VAN DE WEEK! Vandaag: de Brabanders
versus de Randstad in een gevecht dat de geschiedenisboeken in gaat!"

[Highlight: Tractor charge door 8 managers]
"EN DAAR GAAT DE TRACTORCHARGE! ACHT managers tegelijk! Die zagen ze nie
aankomen! WAT. EEN. KLAPPER!"

[Highlight: CEO activates Ontslagronde]
"De CEO slaat terug met een genadeloze ontslagronde — vijf eigen consultants
opgeofferd! Koud. Ijskoud. Maar de cijfers kloppen!"

[Highlight: Carnavalsrage activatie als comeback]
"De Brabanders hebben het moeilijk... maar WACHT — CARNAVALSRAGE
GEACTIVEERD! Het is CARNAVAL jongens! ALAAF!"

[Victory]
"En het is KLANSEN! De Brabanders winnen! Wat een spektakel! Deel deze
klapper met je matties!"
```

### 1.3 Delen & Viraliteit

Na de replay verschijnt een share-scherm:

**Optie 1: Video-link (primair)**
- De replay wordt opgeslagen als een "replay code" (gecomprimeerd event-log + highlight selectie + camera script)
- Link format: `theuws.com/games/reign-of-brabant/replay/{hash}`
- De ontvanger opent de link en ziet de replay IN DE BROWSER — geen download nodig
- Replay code is ~10-50KB — past in een URL parameter als base64, of wordt server-side opgeslagen
- Fallback voor platforms die geen browser-replay ondersteunen: een server-side gerenderde MP4 (via headless browser + FFmpeg op de M4 server)

**Optie 2: GIF (zie [sectie 5](#5-shared-replay-gifs))**

**Optie 3: Screenshot**
- Freeze-frame op het meest dramatische moment
- Automatisch watermark met game logo + factie emblem
- Direct deelbaar via Web Share API (native share dialoog op mobiel)

### 1.4 Technische Specificatie

| Component | Technologie | Complexiteit |
|-----------|-------------|-------------|
| Event recording | Custom event bus + array buffer | Laag |
| Highlight detection | Scoring algoritme (pure JS) | Medium |
| Cinematic camera | Three.js OrbitControls + Tween.js | Medium |
| Depth of field | Three.js EffectComposer + BokehPass | Medium |
| Slowmotion | Three.js Clock timeScale manipulation | Laag |
| Particle effects | Three.js Points / InstancedMesh | Medium |
| AI commentaar | ElevenLabs TTS (pre-generated per highlight type) | Medium |
| Share links | Server endpoint (PHP/Node) + replay viewer page | Medium |
| Server-side video | Puppeteer + FFmpeg op M4 server | Hoog |

**Performance overwegingen:**
- Event recording: < 0.1ms per event, geen impact op gameplay
- Replay rendering: Kan op lagere quality draaien dan gameplay (speler kijkt, speelt niet)
- Highlight detection: Eenmalige pass over event-log, < 50ms voor 2000 events
- Server-side video rendering: Async job, speler krijgt link zodra het klaar is (~30-60s)

### 1.5 Implementatieplan

| Week | Deliverable |
|------|-------------|
| Week 1 | Event recording systeem + event types definiëren + basic highlight scoring |
| Week 2 | Cinematic camera systeem (6 camera types) + transitions + slowmotion |
| Week 3 | Post-processing (DoF, particles, overlays) + replay viewer UI |
| Week 4 | AI commentaar integratie + pre-generated audio clips per highlight type |
| Week 5 | Share systeem (replay codes, server endpoint, social sharing) + polish |

### 1.6 Waarom dit DE KLAPPER is

1. **Niemand verwacht dit van een browser game.** Dit is AAA-level presentation in een browser.
2. **Het is DEELBAAR.** Elke replay is een marketing moment. Gratis viraliteit.
3. **Het maakt ELKE game memorabel.** Zelfs een verlies wordt een episch verhaal.
4. **De Brabantse commentaar maakt het UNIEK.** Geen enkele andere game heeft een Brabantse voetbalcommentator over een RTS gevecht.
5. **Het is technisch haalbaar.** We nemen data op, geen video. De browser doet het rendering-werk.

---

## 2. Seizoensgebonden Events

**WOW-factor: 9/10**
**Prioriteit: v2.0 (Carnaval = v1.0)**
**Geschatte implementatietijd: 2-3 weken per event, 8-10 weken totaal**

De game leeft. Letterlijk. Het verandert met de seizoenen, met de feestdagen, met de kalender. Spelers komen TERUG omdat er altijd iets nieuws is.

### 2.1 Carnaval Mode (februari-maart, 3 dagen rond carnaval)

**Activatie**: Automatisch op basis van datum (vrijdag t/m dinsdag van carnaval). Handmatig te activeren via settings voor testen.

#### Visuele Transformatie

ALLES verandert:

| Element | Normaal | Carnaval Mode |
|---------|---------|---------------|
| Map namen | De Kempen, De Peel, etc. | Kansen, Lampegansen, Oeteldonk, Kransen |
| Lucht | Normaal day/night cycle | Permanent feestverlichting, confetti regen |
| UI kleuren | Factie-specifiek | Rood-geel-groen overal |
| Gebouwen | Standaard textures | Versierd met slingers, vlaggen, lampjes |
| Muziek | Epic orchestral | Carnavalskrakers (Suno-generated, Brabants) |
| Unit voices | Standaard voice lines | Speciale carnavals-voicelines (ElevenLabs) |
| Loading screen | Standaard | "De Klansen Komen Eraan!" + aftelling naar carnaval |
| Cursor | Standaard pijl | Bierpul |
| Kill effect | Standaard | Confetti explosie + "ALAAF!" text popup |

#### Carnavals-skins (alle facties)

Elke unit krijgt een carnavalsvariant:

| Factie | Skin wijziging |
|--------|---------------|
| Brabanders | Al in thema, maar EXTRA — alle units krijgen een prinsenmuts |
| Randstad | Managers verkleed als cowboys, CEO in driedelig carnavalspak |
| Limburgers | Mijnwerkers met venetiaanse maskers, Grotten versierd met lampjes |
| Belgen | Frietkoning draagt reuze-carnavalshoed, alle units krijgen pruiken |

**Technische implementatie**: Skin-swap via texture atlas variant. Elk unit model heeft een `carnival` texture set die overlapt op het base model. Geen extra geometrie nodig — alleen textures + kleine mesh additions (hoedjes als child objects).

#### Carnaval Bonus Missies (3 stuks)

**Missie 1: "De Sleuteloverdracht"**
- Doel: Verover het stadhuis in het centrum van de map voordat de tegenstander het doet
- Twist: Neutrale "Raad van Elf" units bewaken het stadhuis. Ze zijn NIET vijandig, maar voeren je units dronken als je te dichtbij komt (random movement debuff)
- Beloning: Exclusive "Prins" skin voor je hero

**Missie 2: "De Optocht"**
- Doel: Bouw 5 Praalwagens en leid ze in een parade door 4 checkpoints op de map — terwijl de vijand je probeert te stoppen
- Twist: Je Praalwagens kunnen NIET aanvallen (het is een optocht, geen oorlog). Je moet ze beschermen met andere units
- Beloning: "Gouden Praalwagen" unit skin

**Missie 3: "De Kansen"**
- Doel: 3v1 — jij (Brabanders) tegen 3 AI facties. Maar je begint met Carnavalsrage permanent actief
- Twist: Om de 60 seconden krijg je een random "Carnavals-chaos" event: alle units op de map doen een polonaise (uncontrollable, 5 sec), random gebouwen veranderen van eigenaar, resources worden gedropt op willekeurige locaties
- Beloning: "Carnavalsmeester" achievement + exclusive UI theme

#### Carnaval-specifieke Mechanics

**Biertje Gooien** (tijdelijke ability voor alle facties):
- Alle ranged units krijgen een extra attack: "Biertje Gooien"
- Damage: 5 + slow (-20% speed, 3 sec)
- Cooldown: 10s
- Visueel: bierpul projectiel met schuim-trail

**Confetti Regen** (map-wide passive):
- Elke 60 seconden valt er een confetti-regen op een random gebied
- Units in het gebied krijgen +10% alle stats voor 15 seconden
- De locatie wordt 5 seconden van tevoren aangekondigd met een confetti-kanon geluid

### 2.2 Koningsdag (27 april, 1 dag)

**Activatie**: Automatisch op 27 april. Beschikbaar als "King's Day Skirmish" modus de hele week.

#### Visuele Transformatie

| Element | Wijziging |
|---------|-----------|
| Kleurenpalet | ALLES wordt oranje — UI, minimap borders, selectie-cirkels |
| Map | Oranje vlaggen op alle gebouwen, oranje ballonnen in de lucht |
| Water | Wordt oranje (sinaasappelsap, natuurlijk) |
| Achtergrondmuziek | "Het Wilhelmus" remix (Suno) + feestmuziek |

#### Vrijmarkt-mechanic

Een volledig nieuw resource-systeem speciaal voor Koningsdag:

**Hoe het werkt:**
1. Op de map verschijnen "Vrijmarkt-kraampjes" (neutrale gebouwen, 8-12 stuks)
2. Stuur een worker naar een kraampje om het te "claimen"
3. Een geclaimed kraampje genereert random items elke 30 seconden:
   - Oude troep (sell voor 20 primaire resource)
   - Tompouce (health pickup, healt 50 HP aan de unit die het oppakt)
   - Oranje-opblaaskroon (equip op een unit: +25% alle stats, 60 sec, eenmalig gebruik)
   - Koningsdagmedaille (50 van elke resource — jackpot)
4. Vijanden kunnen je kraampje overnemen door er een eigen worker naartoe te sturen
5. Er kan NIET gevochten worden bij een kraampje (het is Koningsdag, doe normaal) — units in een radius van 5 rondom een kraampje kunnen niet aanvallen

**Trade mechanic:**
- Twee spelers kunnen hun kraampjes "verbinden" door allebei een worker naar hetzelfde punt te sturen
- Verbonden kraampjes genereren DUBBELE items
- Dit is de enige manier om in multiplayer tijdelijk samen te werken (zelfs als je vijanden bent)
- Na 60 seconden vervalt de verbinding

#### Koningsdag Bonus Missie: "De Vlooienmarkt"

- Doel: Verzamel 500 resources via Vrijmarkt-kraampjes voordat de timer afloopt (10 minuten)
- Twist: Elke 2 minuten kondigt de "Gemeente" aan dat een deel van de map "opgeruimd" wordt — alle kraampjes in dat gebied verdwijnen. Je moet je workers constant verplaatsen
- Beloning: "Oranje Boven" achievement + oranje UI theme unlock

### 2.3 Sinterklaas (5 december, 3 dagen: 4-6 dec)

**Activatie**: Automatisch 4-6 december.

#### Visuele Transformatie

| Element | Wijziging |
|---------|-----------|
| Weer | Lichte sneeuw (particle effect) |
| Gebouwen | Schoentje bij de deur van elk gebouw |
| Nacht | Vroeger donker (kortere dag-cyclus, 50% sneller) |
| UI | Pepernoten-border rondom minimap |

#### Pakjesavond Mechanic

**De Stoomboot:**
- Om de 3 minuten verschijnt er een "Stoomboot" aan de rand van de map (aan water/kust)
- Het vaart langzaam over het water
- Op random momenten dropt het pakjes op de kust (3-5 per passing)
- Pakjes zijn neutraal — de eerste unit die het oppakt krijgt de inhoud

**Pakjes-inhoud (random, gewogen):**

| Item | Kans | Effect |
|------|------|--------|
| Chocoladeletter | 30% | +50 primaire resource |
| Pepernoten | 25% | AoE heal (30 HP, radius 5) |
| Boek | 15% | Instant research: random upgrade 50% korting |
| Roe | 10% | NEGATIEF: target unit krijgt -30% stats, 30 sec |
| Surprise | 10% | Random unit spawnt (kan van ELKE factie zijn) |
| Gouden Miter | 5% | JACKPOT: +200 van elke resource |
| Staf van Sinterklaas | 5% | Eenmalig: teleporteer je hele leger naar een willekeurig punt op de map |

**Pieten (neutrale units):**
- 4-6 Pieten spawnen op de map bij de start van de game
- Ze bewegen random rond en droppen pepernoten (health pickups) bij elk gebouw dat ze passeren
- Als je een Piet aanvalt, wordt SINT boos: je krijgt een map-wide debuff (-10% alle stats, 60 sec)
- Als je ze met rust laat, droppen ze steeds betere items
- Je kunt een Piet "rekruteren" door een Chocolaterie/Bakkerij te bouwen naast hun pad — ze stoppen daar voortaan altijd

### 2.4 Oud & Nieuw (31 december - 1 januari, 2 dagen)

**Activatie**: Automatisch 31 dec - 1 jan.

#### Visuele Transformatie

| Element | Wijziging |
|---------|-----------|
| Lucht | Donkere nacht met vuurwerk (constant, prachtig) |
| UI | Aftelling naar middernacht (als het 23:55 is IRL = 23:55 in-game) |
| Kill effects | VUURWERK in plaats van standaard death animation |
| Achtergrondmuziek | Feestelijke remix van het game-thema (Suno) |

#### Vuurwerk-abilities (alle facties)

Elke factie krijgt een tijdelijke "Vuurwerk" ability:

| Factie | Vuurwerk-ability | Effect |
|--------|-----------------|--------|
| Brabanders | Brabantse Pijl | AoE damage (30) + stun (2s) in radius 8. Lanceert een oranje/rode vuurpijl. |
| Randstad | PowerPoint Vuurwerk | AoE blind (units missen 50% attacks) + slow, radius 10. Projector-achtig wit licht. |
| Limburgers | Mijn-Vuurwerk | Verborgen mijn op het terrein die ontploft als vuurwerk als een vijand erover loopt. 50 damage. |
| Belgen | Belgisch Vuurwerk | De meest spectaculaire van allemaal: 3 achtereenvolgende explosies, elk radius 6, in een lijn. 20 damage per explosie. |

**Oliebollen** (health pickup):
- Spawnen om de 45 seconden op random locaties (3-5 tegelijk)
- Healen 40 HP
- Geven een "Vet" debuff: -10% speed voor 10 seconden (je hebt net 3 oliebollen op)
- Stapelbaar tot 3x (je wordt ECHT langzaam, maar je bent ook vol)

#### Middernacht-event

Als het IRL 00:00 wordt op 1 januari (gebaseerd op de klok van de speler):
- ALLE gevechten stoppen voor 10 seconden
- Massaal vuurwerk op de hele map
- Alle units doen een "cheers" animatie
- Tekst op scherm: "GELUKKIG NIEUWJAAR!" in gouden letters
- Een speciale "2027" achievement wordt automatisch unlocked
- Hierna: alle units krijgen +20% alle stats voor de rest van de game ("Nieuwjaarsenergie")

### 2.5 Technische Haalbaarheid Seizoensevents

| Aspect | Aanpak | Complexiteit |
|--------|--------|-------------|
| Datum-detectie | `new Date()` check bij game start | Triviaal |
| Texture swaps | Alternatieve texture atlases per event | Medium |
| Extra particles | Bestaand particle systeem + nieuwe emitters | Laag |
| Bonus missies | Scenario-scripting met bestaand mission framework | Medium |
| Event-specifieke mechanics | Nieuwe game rules module per event, lazy loaded | Medium |
| Audio (muziek + voices) | Suno + ElevenLabs, pre-generated, lazy loaded per event | Medium |
| Item drops | Extend bestaand pickup systeem | Laag |

**Asset budget per event:**
- Textures: 5-10 alternatieve atlases (~2-5MB per event)
- Audio: 3-5 muziekstukken + 10-15 voice lines (~10-15MB per event)
- Models: 2-3 extra modellen (Stoomboot, Pieten, Vuurpijlen) (~3MB per event)
- **Totaal per event**: ~15-25MB, lazy loaded wanneer het event actief is

### 2.6 Implementatieplan per Event

| Event | Week 1 | Week 2 | Week 3 |
|-------|--------|--------|--------|
| Carnaval | Visuele transformatie + skins | Bonus missies + mechanics | Audio + polish + testing |
| Koningsdag | Visuele transformatie + Vrijmarkt | Trade mechanic + bonus missie | Audio + polish |
| Sinterklaas | Visuele transformatie + Stoomboot | Pakjes systeem + Pieten AI | Audio + polish |
| Oud & Nieuw | Visuele transformatie + Vuurwerk abilities | Oliebollen + Middernacht event | Audio + polish |

---

## 3. De Brabantse Weerservice

**WOW-factor: 9/10**
**Prioriteit: v1.0**
**Geschatte implementatietijd: 1.5-2 weken**

Dit is de feature die mensen NIET geloven als je het ze vertelt. "Wacht, als het in het ECHT regent in Eindhoven, regent het OOK in de game?!" Ja. Precies dat.

### 3.1 Concept

De game-wereld is synchroon met het echte weer in Brabant. Niet als gimmick — het weer beinvloedt daadwerkelijk de gameplay. Dit maakt de game-wereld LEVEND op een manier die geen enkele andere game doet.

### 3.2 Weer API Integratie

**Primaire API**: Open-Meteo (gratis, geen API key nodig, GDPR-compliant)
- Endpoint: `https://api.open-meteo.com/v1/forecast`
- Locatie: Eindhoven (51.4416, 5.4697) — het hart van Brabant
- Parameters: `current=temperature_2m,rain,snowfall,wind_speed_10m,cloud_cover,weather_code`
- Rate limit: 10.000 calls/dag (meer dan genoeg — we cachen per 15 minuten)

**Fallback API**: OpenWeatherMap (gratis tier, API key in `.env`)

**Update frequentie**: Elke 15 minuten. Het weer verandert niet per seconde — een kwartier is genoeg. Bij een API-fout: gebruik het laatst bekende weer tot de volgende succesvolle call.

### 3.3 Weer-naar-Game Mapping

| Weer Conditie | Visueel Effect | Gameplay Effect |
|---------------|---------------|-----------------|
| **Zonnig** (clear sky) | Heldere lucht, warme kleuren, schaduwstralen | +10% gather speed (lekker weer = harder werken) |
| **Bewolkt** (overcast) | Grijze lucht, zachte schaduwen | Geen bonus/malus (standaard) |
| **Lichte regen** | Regendruppels (particles), natte textures | -5% unit speed (modderig) |
| **Zware regen** | Intense regen, plassen op terrein, bliksem | -15% unit speed, -10% ranged accuracy, +5% siege damage (nat hout = zwakker) |
| **Onweer** | Bliksem die inslaat op random locaties | Bliksem doet 10 damage aan random units elke 30s. Buildings met bliksemafleider (upgrade) zijn immuun |
| **Mist** | Fog shader over het terrein, beperkt zicht | Sight range alle units -30%. Fog of War wordt dikker. Stealth units zijn ONZICHTBAAR (normaal: semi-transparent) |
| **Sneeuw** | Sneeuwvlokken (particles), witte grond-overlay | -10% unit speed, maar +20% building HP (bevroren muren) |
| **IJzel** | Glanzend terrein | Units glijden door na een move-commando (overshoot 10% van hun pad). Grappig en tactisch |
| **Hittegolf** (>30C) | Hitte-shimmer shader, geel/rood kleurenpalet | +15% gather speed, maar units verliezen 1 HP per 10 seconden als ze niet in de buurt van water/gebouw zijn |
| **Vrieskou** (<0C) | Bevroren water, adem-particles bij units | Water wordt begaanbaar terrein (bevroren). Dit opent NIEUWE routes over de map |

### 3.4 Het "Brabants Weerbericht"

Bij het starten van een game verschijnt een kort weerbericht:

```
┌──────────────────────────────────────┐
│  HET BRABANTS WEERBERICHT            │
│                                      │
│  "Ja dansen en hansen, het is        │
│   vandaag 14 graden en bewolkt       │
│   in Brabant. Houd rekening met      │
│   wat modder op het slagveld!"       │
│                                      │
│  Huidige effecten:                   │
│  ☁ Bewolkt — geen bonus/malus        │
│  🌡 14°C — normaal                   │
│                                      │
│  [Begransen — Start de veldslag!]    │
└──────────────────────────────────────┘
```

**Voice-over** (ElevenLabs, Brabants accent): Het weerbericht wordt VOORGELEZEN door een vrolijke Brabantse stem. ~10 seconden. Voorgegenereerde zinnen met variabelen (temperatuur, conditie) ingevuld.

### 3.5 Dynamische Weer-wisselingen

Het weer kan VERANDEREN tijdens een game (als het IRL ook verandert):

- Transitie-animatie: 10 seconden geleidelijke overgang
- Melding in de UI: "Het weer verandert... [nieuwe conditie]"
- Gameplay effecten veranderen mee
- Dit maakt langere games EXTRA dynamisch — een gevecht dat begon in de zon kan eindigen in de sneeuw

### 3.6 Tactische Implicaties

Dit is niet alleen een gimmick. Het weer verandert HOE je speelt:

**Voorbeeld 1: Mist + Limburgers**
Als het mistig is, worden Limburgse tunnels nog dodelijker. Vijanden zien NIKS, en ineens verschijnt er een leger uit een Grotte midden in hun base. De mist maakt de hit-and-run factie onverslaanbaar.

**Voorbeeld 2: Regen + Brabanders**
Regen maakt units langzamer. Maar de Brabandse Gezelligheid-mechanic moedigt je al aan om units bij elkaar te houden. Langzamere units = langere tijd bij elkaar = meer Gezelligheid = harder slaan. Regen is eigenlijk een BUFF voor Brabanders.

**Voorbeeld 3: Hittegolf + Randstad**
De Randstad is gewend aan hitte (klimaatverandering in de stad). Hun speciale passief "Airco" (tier 2 upgrade) maakt ze immuun voor hitte-damage. De vijand smelt terwijl de Randstad doorbouwt.

**Voorbeeld 4: Vrieskou + water-maps**
Bevroren water opent nieuwe routes. Dit verandert de hele meta op water-maps. Een factie die normaal veilig is achter een rivier, is dat nu niet meer.

### 3.7 Settings & Overrides

- **Weer aan/uit**: Spelers die het weer niet willen, kunnen het uitzetten (standaard: "Mooi weer")
- **Specifiek weer forceren**: In custom games / map editor kan een specifiek weer gekozen worden
- **Offline fallback**: Als er geen internet is, gebruikt de game een random weer-cyclus (wisselt elke 5 minuten)
- **Campaign**: Missies hebben een VAST weer dat past bij het verhaal (tutorial = zonnig, finale = onweer)

### 3.8 Technische Specificatie

| Component | Technologie | Complexiteit |
|-----------|-------------|-------------|
| API calls | `fetch()` met 15-min cache in `localStorage` | Laag |
| Regen particles | Three.js Points met vertex shader | Medium |
| Sneeuw particles | Idem, andere texture + langzamere velocity | Laag (hergebruik) |
| Fog shader | Three.js FogExp2 + custom density | Laag |
| Bliksem | Randomized point light + line geometry + flash | Medium |
| Grond-overlay (sneeuw/ijs) | Blend-texture op terrain mesh | Medium |
| Bevroren water | Water material swap (reflective + solid pathfinding) | Medium |
| Hitte-shimmer | Post-processing distortion shader | Medium |
| Weerbericht UI | HTML/CSS overlay (DOM) | Laag |
| Weerbericht voice | ElevenLabs pre-generated, 20-30 varianten | Laag |

---

## 4. AI Commentator

**WOW-factor: 10/10**
**Prioriteit: v1.0 (basis), v2.0 (geavanceerd)**
**Geschatte implementatietijd: 3-4 weken**

Stel je voor: je speelt een RTS, en er is een COMMENTATOR. Alsof het een voetbalwedstrijd is. In het Brabants. Die reageert op wat er ECHT gebeurt in jouw game. Dat is de AI Commentator.

### 4.1 Architectuur: Template + Audio Bank

We gebruiken GEEN real-time TTS (te traag, te duur, te onbetrouwbaar voor gameplay). In plaats daarvan:

**Pre-generated Audio Bank:**
- ~200-300 audio clips per commentator-persoonlijkheid
- Gegenereerd met ElevenLabs (Brabants accent, mannelijke stem)
- Georganiseerd per event-type en intensiteit
- Clips zijn 1-5 seconden lang
- Totale grootte: ~30-50MB per commentator (lazy loaded)

**Event-naar-clip mapping:**

```
EventType.UNIT_KILLED + context.is_hero = "hero_kill" clips
EventType.BUILDING_DESTROYED + context.is_town_hall = "town_hall_destroyed" clips
EventType.FACTION_ABILITY + context.faction = "carnavalsrage" clips
EventType.COMEBACK_DETECTED = "comeback" clips
EventType.FIRST_BLOOD = "first_blood" clips
...etc
```

Per event-type zijn er 5-10 varianten zodat het niet repetitief wordt.

### 4.2 Audio Clip Categorieën

| Categorie | # Clips | Voorbeeld |
|-----------|---------|-----------|
| **Game start** | 5 | "Welkom bij de veldslag! Vandaag: [factie] tegen [factie]!" |
| **First blood** | 8 | "En daar gaat de eerste! Dat duurde nie lang!" |
| **Unit kill (normaal)** | 15 | "Weg is-ie!" / "Die zien we niet meer terug!" |
| **Hero kill** | 10 | "DE HELD IS GEVALLEN! Wat een drama!" |
| **Hero revive** | 5 | "Daar is-ie weer! Je kunt een goei Brabander nie klein krijgen!" |
| **Building destroy** | 10 | "En dat gebouw is PLANSEN!" / "Slopen maar!" |
| **Town Hall destroy** | 5 | "HET HOOFDKWARTIER GAAT ERAAN! Dit is het begin van het einde!" |
| **Faction ability** | 8 per factie | "CARNAVALSRAGE! Het is feest jongens!" |
| **Comeback** | 10 | "Wacht even... is dit een comeback?! JA DIT IS EEN COMEBACK!" |
| **Winning streak** | 8 | "Ze zijn niet te stoppen! Wat een reeks!" |
| **Losing badly** | 8 | "Het ziet er niet goed uit... maar opgeven is geen optie!" |
| **Epic battle (10+ units)** | 10 | "Wat een GEVECHT! Links en rechts vallen ze!" |
| **Charge/rush** | 8 | "DAAR GAAN ZE! Een volledige aanval!" |
| **Victory** | 8 | "EN HET IS KLANSEN! Wat een wedstrijd!" |
| **Defeat** | 5 | "Helaas... de vlag gaat halfstok. Maar we komen terug!" |
| **Idle/nothing happening** | 10 | "Het is stil op het slagveld... te stil..." / "Bouwen, bouwen, bouwen..." |
| **Resource milestone** | 5 | "De schatkist stroomt over! 500 worstenbroodjes!" |
| **Tech upgrade** | 5 | "Nieuwe technologie! Dit gaat het tij keren!" |
| **Siege** | 8 | "De muren trillen! Siege warfare op zijn best!" |

**Totaal**: ~200-250 clips per commentator.

### 4.3 Commentator-persoonlijkheden

Drie persoonlijkheden, elk met een eigen ElevenLabs-stem en schrijfstijl:

#### "Sjansen" — De Enthousiaste

- **Stem**: Hoog energieniveau, snel pratend, Brabants accent
- **Stijl**: Alles is GEWELDIG. Overdreven enthousiast over elk moment
- **Voorbeeld**: "OH MAN OH MAN WAT EEN KLAPPER! Die tractorcharge ging DWARS door de verdediging! ALAAF!"
- **Wanneer**: Standaard commentator, beste voor nieuwe spelers

#### "Ansen" — De Droge

- **Stem**: Laag, rustig, bijna monotoon, Brabants accent
- **Stijl**: Understatement. Alles is "wel aardig". Droge humor.
- **Voorbeeld**: "Ja... die is dood. Dat was te verwachten. Volgende."
- **Wanneer**: Unlock na 10 games gespeeld

#### "Tansen" — De Sarcastische

- **Stem**: Middentoon, cynisch, Brabants accent
- **Stijl**: Roast-commentator. Beledigt je op een grappige manier.
- **Voorbeeld**: "Ah, je stuurt je workers naar de verkeerde mijn. Weer. Voor de derde keer. Maar dat is goed, hoor. Iedereen leert op zijn eigen tempo."
- **Wanneer**: Unlock na 25 games gespeeld

### 4.4 Commentaar Timing & Prioriteit

Niet elk event verdient commentaar. Het systeem heeft een **priority queue** en een **cooldown**:

```
Priority levels:
1. CRITICAL (altijd): Town Hall destroyed, Victory, Defeat, Faction ability
2. HIGH (als geen cooldown): Hero kill, Comeback, Epic battle
3. MEDIUM (als 5s geen commentaar): Building destroy, Tech upgrade
4. LOW (als 10s geen commentaar): Unit kill, Resource milestone
5. IDLE (als 20s geen commentaar): Idle commentaar
```

**Cooldown regels:**
- Minimum 3 seconden tussen clips (anders wordt het irritant)
- Maximum 25 seconden stilte (anders voelt het dood)
- Dezelfde clip wordt nooit 2x achter elkaar gespeeld
- Een clip uit dezelfde categorie wordt maximaal 1x per 60 seconden gespeeld

### 4.5 Commentaar tijdens Replays

Tijdens het [Epic Replay Systeem](#1-de-klapper-epic-replay-systeem) schakelt de commentator over naar "replay mode":

**Verschil met live commentaar:**
- Langere zinnen (de commentator weet wat er gaat gebeuren)
- Build-up spanning: "Let op wat er nu gaat gebeuren..."
- Reactie-clips die passen bij slowmotion
- Intro en outro clips ("Welkom bij de KLAPPER VAN DE WEEK!")

### 4.6 Technische Specificatie

| Component | Technologie | Complexiteit |
|-----------|-------------|-------------|
| Event detection | Hooks in bestaande game events | Laag |
| Priority queue | Custom priority queue (JS) | Laag |
| Audio playback | Web Audio API (positional: NEEN, stereo) | Laag |
| Audio loading | Lazy load per commentator (IndexedDB cache) | Medium |
| Audio generation | ElevenLabs API (batch, offline, pre-deploy) | Medium |
| Script writing | 200-250 zinnen per commentator, handmatig | Medium (creatief) |
| Commentator unlock | Achievement systeem | Laag |
| Settings UI | Commentator aan/uit + keuze persoonlijkheid | Laag |

### 4.7 Implementatieplan

| Week | Deliverable |
|------|-------------|
| Week 1 | Event detection systeem + priority queue + audio playback engine |
| Week 2 | Commentaarscripts schrijven (alle 200+ zinnen per commentator) |
| Week 3 | ElevenLabs batch-generatie + audio editing (normalisatie, timing) |
| Week 4 | Replay-mode commentaar + commentator unlock systeem + polish |

---

## 5. Shared Replay GIFs

**WOW-factor: 8/10**
**Prioriteit: v1.0**
**Geschatte implementatietijd: 1.5-2 weken**

Het verschil tussen een goede game en een virale game: DEELBAARHEID. Elke keer dat iemand een GIF deelt van een epic moment uit Reign of Brabant, is dat gratis marketing.

### 5.1 Concept

Na specifieke "epic moments" verschijnt er een subtiele notificatie:

```
┌──────────────────────────────┐
│  EPIC MOMENT!                │
│  [Bekijk] [Deel als GIF]    │
└──────────────────────────────┘
```

De speler kan kiezen om het moment te bekijken als een 3-8 seconden clip met cinematische camera, en het te delen als een GIF of video-link.

### 5.2 Epic Moment Triggers

| Trigger | Beschrijving | GIF-lengte |
|---------|-------------|------------|
| Hero Kill | Je held verslaat een vijandelijke held | 5 sec |
| Town Hall Destruction | Een basis wordt vernietigd | 6 sec |
| Faction Ability | Carnavalsrage, Vergadering, etc. | 5 sec |
| Multi-kill (5+) | 5+ kills in 3 seconden | 4 sec |
| Comeback Kill | Je was aan het verliezen en doodt nu hun held | 6 sec |
| Perfect Defense | Een aanval van 10+ units volledig afgeslagen met 0 eigen verliezen | 5 sec |
| First Tractor Charge | Eerste keer dat een Tractorrijder zijn Volgas ability gebruikt | 4 sec |
| Building Rush | 3+ gebouwen vernietigd in 10 seconden | 8 sec |

### 5.3 GIF-generatie Pipeline

**In-browser (primair):**

1. Het moment wordt opgeslagen als een event-snapshot (3-8 seconden aan game state)
2. De `GifRecorder` rendert het moment opnieuw met een cinematische camera
3. Frames worden gecaptured via `canvas.toDataURL()` op 15 FPS
4. Frames worden geencodeerd naar GIF via [gif.js](https://github.com/jnordberg/gif.js) (Web Worker, geen main thread blocking)
5. GIF wordt aangeboden als download of direct share

**Specificaties:**
- Resolutie: 480x270 (klein genoeg voor snelle generatie en share, groot genoeg voor leesbaarheid)
- Framerate: 15 FPS
- Kleuren: 256 (GIF limitatie)
- Grootte: ~1-3MB per GIF
- Generatietijd: 2-5 seconden (Web Worker)

**Watermark:**
- Reign of Brabant logo in de rechteronderhoek (semi-transparant)
- Factie-emblem van de winnende factie in de linkeronderhoek
- Tekst: "reignofbrabant.nl" onderaan

### 5.4 Delen

| Platform | Methode |
|----------|---------|
| **WhatsApp** | Web Share API (native share dialoog) → GIF als bestand |
| **Twitter/X** | Link naar replay page + GIF als preview (OpenGraph) |
| **Discord** | Direct GIF embed via link |
| **Kopieren** | GIF naar clipboard (`navigator.clipboard.write()`) |
| **Download** | Directe download als .gif bestand |
| **Link** | Korte URL naar replay viewer (voor niet-GIF platforms) |

### 5.5 Sociale Integratie

**Auto-generated caption** (kopieerbaar):

```
"Net een TRACTORCHARGE door 8 managers gejaagd in Reign of Brabant!
WAT EEN KLAPPER! 🚜💥
Speel zelf: theuws.com/games/reign-of-brabant"
```

De caption wordt automatisch gegenereerd op basis van het moment-type en de betrokken facties/units.

### 5.6 Technische Specificatie

| Component | Technologie | Complexiteit |
|-----------|-------------|-------------|
| Moment detection | Hooks in bestaande game events | Laag |
| State snapshots | Serialized game state (positions, HP, animations) | Medium |
| Replay re-render | Three.js re-render met cinematische camera | Medium (hergebruik van replay systeem) |
| GIF encoding | gif.js (Web Worker) | Laag (library) |
| Share API | Web Share API + fallbacks | Laag |
| Watermark | Canvas overlay voor rendering | Laag |
| Preview page | Static HTML met meta tags (OG image = GIF) | Laag |

---

## 6. Weekly Challenge

**WOW-factor: 7/10**
**Prioriteit: v2.0**
**Geschatte implementatietijd: 2-3 weken**

Spelers komen terug als er een REDEN is om terug te komen. De Weekly Challenge is die reden. Elke week een nieuw doel, een nieuw leaderboard, een nieuwe beloning.

### 6.1 Concept

Elke maandag om 00:00 CET wordt een nieuwe challenge actief. De challenge loopt tot zondag 23:59. Iedereen die de challenge voltooit, krijgt een beloning. De top 10 krijgt een EXTRA beloning.

### 6.2 Challenge Types

**Categorie A: Restrictie-challenges**

| Challenge | Beschrijving | Moeilijkheid |
|-----------|-------------|-------------|
| "Alleen Boeren" | Win een skirmish met alleen workers (geen militaire units) | Hard |
| "Geen Gebouwen" | Win zonder extra gebouwen te bouwen (alleen Town Hall) | Insane |
| "Pacifist" | Win zonder een vijandelijke unit te doden (alleen gebouwen vernietigen) | Hard |
| "One Hero Army" | Win met alleen je hero unit (alle andere units zijn verboden) | Hard |
| "No Tech" | Win zonder enige upgrade te researchen | Medium |
| "Speed Run" | Win binnen 5 minuten | Hard |

**Categorie B: Objectief-challenges**

| Challenge | Beschrijving | Moeilijkheid |
|-----------|-------------|-------------|
| "De Sloper" | Vernietig 100 vijandelijke gebouwen deze week | Medium |
| "Harvest Festival" | Verzamel 10.000 totale resources in 1 game | Easy |
| "Generaal" | Win 10 games deze week | Medium |
| "Bodycount" | Dood 500 vijandelijke units deze week | Medium |
| "Zuinig" | Win een game terwijl je nooit meer dan 200 van een resource hebt | Hard |
| "Elke Factie" | Win minstens 1 game met elke factie deze week | Medium |

**Categorie C: Stijl-challenges**

| Challenge | Beschrijving | Moeilijkheid |
|-----------|-------------|-------------|
| "De Comeback Kid" | Win een game nadat je op minder dan 20% army value zat | Hard |
| "Dominantie" | Win een game zonder ooit een gebouw te verliezen | Hard |
| "De Verzamelaar" | Bezoek elke resource node op de map in 1 game | Medium |
| "Blitzkrieg" | Vernietig de vijandelijke Town Hall binnen 3 minuten na de eerste aanval | Hard |

### 6.3 Leaderboard

**Per-challenge leaderboard met de volgende metrics:**

| Metric | Beschrijving |
|--------|-------------|
| Completion time | Hoe snel je de challenge voltooide |
| Efficiency score | Resources spent / damage dealt ratio |
| Style points | Bonus voor extra restricties (geen hero used, all units survived, etc.) |

**Leaderboard UI:**
- Top 10 met player name, score, factie-icon, en timestamp
- Je eigen positie altijd zichtbaar (ook als je niet in de top 10 zit)
- Animated entry wanneer je de challenge voltooit (je naam "valt" op de juiste positie)

**Backend:**
- PHP + SQLite endpoint op M4 server (zelfde architectuur als Wolfenstein leaderboard)
- Endpoint: `POST /api/challenge/submit` met body: `{ player, challenge_id, score, metadata }`
- Anti-cheat: server-side validatie van game duration, unit counts, en resource totals
- Leaderboard reset elke maandag

### 6.4 Beloningen

| Tier | Wie | Beloning |
|------|-----|---------|
| **Deelname** | Iedereen die de challenge start | Niets (je moet hem VOLTOOIEN) |
| **Voltooid** | Iedereen die de challenge voltooit | Cosmetic unlock (unit skin, UI theme, cursor, of title) |
| **Top 10** | Top 10 op het leaderboard | Exclusive "Weekly Champion" badge + gouden border op je naam |
| **#1** | De winnaar | "Klapper van de Week" titel die de hele volgende week zichtbaar is |

**Cosmetic unlock pool** (roterend, elke week een ander item):

| Week | Unlock |
|------|--------|
| 1 | Gouden Tractor skin (Brabanders) |
| 2 | Neon UI theme |
| 3 | Regenboog cursor trail |
| 4 | "Veteransen" titel |
| 5 | Pixel art unit skins (retro mode) |
| 6 | Brabants dialect UI (alle tekst in dialect) |
| 7 | Confetti kill effects (permanent) |
| 8 | "De Baansen" titel |
| ... | Roterend, nooit dubbel |

### 6.5 Technische Specificatie

| Component | Technologie | Complexiteit |
|-----------|-------------|-------------|
| Challenge definitie | JSON config file, lazy loaded | Laag |
| Challenge tracking | In-game event hooks + local state | Medium |
| Leaderboard backend | PHP + SQLite (hergebruik Wolfenstein pattern) | Laag |
| Cosmetic unlocks | LocalStorage + cosmetic registry | Medium |
| Weekly rotation | Server-side challenge schedule (JSON) | Laag |
| Anti-cheat | Server-side validation van game-state checksums | Medium |

---

## 7. De Geheime 5e Factie

**WOW-factor: 10/10**
**Prioriteit: v2.0 (bonus)**
**Geschatte implementatietijd: 4-6 weken**

Dit is het ultieme geheim. Het moment waarop een speler die ALLES heeft gedaan, ALLES heeft gevonden, en ALLES heeft gewonnen, beloond wordt met iets dat niemand had zien aankomen.

### 7.1 De Factie: De Efteling

**Waarom De Efteling en niet De Braboniers:**
De Braboniers (gemengde factie) is een leuke fan-service, maar De Efteling is ICONISCH. Het is het meest herkenbare merk van Brabant. Het is sprookjesachtig, het is magisch, en het is compleet ANDERS dan de andere vier facties. Het contrast tussen middeleeuwse oorlog en sprookjes is grappig, onverwacht, en memorabel.

**Thema**: Sprookjes, magie, vervoering
**Sterkte**: Unieke magische abilities, charme (vijandelijke units bekeren)
**Zwakte**: Lage HP, afhankelijk van abilities
**Playstyle**: Caster/controller — domineer het slagveld met magie en illusies
**Kleurenpalet**: Paars, goud, donkergroen, sprookjesachtig

### 7.2 Unlock-voorwaarden

**ALLE drie de volgende moeten voltooid zijn:**

1. **Campaign Conqueror**: Voltooi alle campaign missies van alle 4 facties (MVP: alleen beschikbare facties)
2. **Achievement Hunter**: Unlock 50 van de beschikbare achievements
3. **Easter Egg Master**: Vind alle 7 verborgen easter eggs in de game (zie [sectie 10](#10-de-meta-easter-egg))

**Totale speeltijd om te unlocken**: ~20-40 uur (serieuze investering, maar niet onmogelijk)

### 7.3 De Onthulling

Dit moet ONVERGETELIJK zijn. Hier is het script:

**Stap 1: De Hint**
Na het voltooien van de laatste voorwaarde verschijnt er een subtiel bericht:

> *"Je hoort een verre melodie... een sprookje wacht op je..."*

De game-muziek verandert naar een mysterieuze variant van de Efteling-achtige muziek (Suno-generated, dromerig, orkest).

**Stap 2: De Zoektocht**
Op de main menu verschijnt een NIEUWE optie: een kleine, glinsterende deur in de hoek van het scherm. Bijna onzichtbaar. Geen label. Alleen een glow.

**Stap 3: Het Portaal**
Klikken op de deur start een speciale cutscene:

- De camera vliegt door een betoverd bos
- Sprookjesfiguren verschijnen in de mist
- Een verteller (ElevenLabs, diepe Brabantse stem) zegt:

> *"Lang geleden, voordat de facties vochten om Brabant... was er een plek waar sprookjes tot leven kwamen. Een plek die iedereen vergeten was. Tot nu."*

- De camera breekt door de mist en onthult: de Efteling-factie emblem
- GOUDEN tekst: **"DE VIJFDE FACTIE IS ONTGRENDELD"**
- Confetti, vuurwerk, fanfare

**Stap 4: De Beloning**
- Nieuwe factie beschikbaar in skirmish en multiplayer
- 3 unieke campaign missies voor De Efteling
- Exclusive "Sprookjesmeester" titel
- Unieke loading screen: sprookjesbos

### 7.4 Efteling Units

| Unit | Rol | HP | Attack | Speciale Ability |
|------|-----|----|---------|--------------------|
| **Kabouter** | Worker | 40 | 3 | "IJverig": gather speed +20% |
| **Roodkapje** | Infantry (melee) | 70 | 12 | "Mandje": draagt een health potion die ze kan gebruiken op zichzelf of een ally (heal 40 HP, 1x per leven) |
| **Wolf** | Cavalry | 150 | 18 | "Vermomming": kan zich vermommen als een vijandelijke unit (5 sec). Vijandelijke units vallen hem niet aan |
| **Pardoes** | Support/Buffer | 60 | 5 | "Toverij": AoE buff radius 10, +15% alle stats, 15 sec. Cooldown 30s |
| **Draak** | Ranged (fire) | 120 | 20 | "Vuurspuwer": Cone attack, hits alle units in een driehoek (range 8, breedte 6). Cooldown 8s |
| **Holle Boansen** | Stealth/Scout | 55 | 8 | "Verdwalen": vijandelijke units in radius 6 verliezen hun move-commando en bewegen random (3 sec). Cooldown 20s |
| **Langansen** | Siege | 90 | 40 (buildings) | "Reuzenklap": single target, massive damage aan gebouwen. Langzaam (speed 2.0). Visible boven Fog of War (hij is een reus) |
| **Sprookjesheks** | Caster | 80 | 15 | "Betovering": target vijandelijke unit vecht 10 sec voor jou (charm). Cooldown 60s. MAX 1 charmed unit tegelijk |

### 7.5 Efteling Hero: De Verteller

| Stat | Waarde |
|------|--------|
| HP | 400 |
| Attack | 18 |
| Speed | 5.5 |
| Range | 10 |
| Cost | 300/250 |

- **Ability 1 — "Er Was Eens..."**: Summon een sprookjesfiguur (random unit uit de Efteling roster) die 30 seconden meevecht. Cooldown 45s.
- **Ability 2 — "Het Einde"**: Target vijandelijke unit wordt instant gedood als die onder 15% HP is. Cooldown 30s. Range 8.
- **Ability 3 — "De Moraal van het Verhaal"**: AoE in radius 12: alle vijandelijke units krijgen -25% attack, alle eigen units +25% attack, 15 seconden. Cooldown 60s.
- **Ultimate — "Droomvlucht"**: Alle Efteling units op de map worden ONZICHTBAAR en krijgen +50% speed voor 12 seconden. Ze kunnen niet aanvallen tijdens Droomvlucht, maar het is de perfecte repositioning tool. Cooldown 180s.

### 7.6 Efteling Unieke Mechanic: Betovering

- Efteling units hebben een passieve "charme-aura" (radius 3)
- Vijandelijke units die langer dan 5 seconden in de aura staan, worden "betoverd": ze stoppen met aanvallen en staan stil voor 2 seconden
- Dit maakt melee-combat tegen Efteling FRUSTREREND — je units stoppen steeds
- Counter: ranged units (buiten de aura) of AoE abilities

### 7.7 Efteling Factie-Ability: De Sprookjesboom

- **Kosten**: 100 Magie (tertiaire resource, gegenereerd door Pardoes)
- **Effect**: Een gigantische boom groeit op de gekozen locatie
  - Radius 15: alle vijandelijke units worden "verhaald" — ze stoppen met vechten en lopen naar de boom
  - Duurt 10 seconden
  - Vijandelijke units nemen GEEN schade, maar ze zijn volledig uitgeschakeld
  - Na 10 seconden: de boom verdwijnt en de units worden vrijgelaten
- **Cooldown**: 180 seconden

### 7.8 Technische Specificatie

| Component | Technologie | Complexiteit |
|-----------|-------------|-------------|
| Unlock tracking | Achievement systeem + flags in localStorage | Laag |
| Cutscene | Three.js camera animation + DOM overlays + audio | Hoog |
| Unit modellen | Meshy-generated, Blender-rigged (8 modellen + hero) | Hoog |
| Abilities | Extend bestaand ability systeem | Medium |
| Campaign missies | Scenario-scripting | Medium |
| Charme-aura | Physics-based proximity check (spatial hash) | Medium |

---

## 8. Modding / Map Editor

**WOW-factor: 8/10**
**Prioriteit: v2.0**
**Geschatte implementatietijd: 4-6 weken**

De community bouwt de game voor je. Gratis content. Eindeloze speelplezier. En het bewijst dat je browser-game zo serieus is dat het een MAP EDITOR heeft.

### 8.1 Concept

Een volledig in-browser map editor waarmee spelers custom maps kunnen maken, opslaan, delen via link, en spelen. Geen download. Geen extra tools. Gewoon openen en bouwen.

### 8.2 Editor Interface

**Layout:**

```
┌────────────────────────────────────────────────────┐
│  [File]  [Edit]  [View]  [Test]  [Share]           │
├──────┬─────────────────────────────────────┬───────┤
│      │                                     │       │
│ Tool │          3D VIEWPORT                │ Props │
│ Bar  │     (dezelfde Three.js renderer     │ Panel │
│      │      als de game zelf)              │       │
│ [T]  │                                     │ Name: │
│ [R]  │                                     │ Size: │
│ [U]  │                                     │ Type: │
│ [P]  │                                     │       │
│ [S]  │                                     │       │
│ [E]  │                                     │       │
│      │                                     │       │
├──────┴─────────────────────────────────────┴───────┤
│                    MINIMAP                          │
└────────────────────────────────────────────────────┘
```

### 8.3 Editor Tools

| Tool | Shortcut | Functie |
|------|----------|---------|
| **Terrain** | T | Heightmap painting (raise/lower/smooth terrain) |
| **Resource** | R | Plaats resource nodes (goud, bomen, tertiaire) |
| **Unit Spawn** | U | Plaats start posities voor spelers (2-4 spelers) |
| **Props** | P | Decoratieve objecten (rotsen, bomen, huizen, bruggen) |
| **Scenery** | S | Water, wegen, muren, cliffs |
| **Erase** | E | Verwijder geplaatst object |
| **Paint** | B | Texture painting op terrein (gras, zand, sneeuw, modder) |

### 8.4 Terrain Systeem

**Heightmap:**
- Grid-based heightmap (64x64 tot 128x128 vertices)
- Brush-based editing: circulaire brush met adjustable radius en strength
- 3 brush modes: Raise, Lower, Smooth
- Real-time preview van water-level (alles onder een threshold = water)

**Textures:**
- 6 basis-textures: gras, zand, aarde, sneeuw, steen, modder
- Texture splatmap (RGBA channels = 4 textures per pass, 2 passes = 8 textures max)
- Brush-based painting met soft edges

**Pathfinding preview:**
- Toggle "pathfinding overlay" die laat zien waar units WEL en NIET kunnen lopen
- Rood = onbegaanbaar, groen = begaanbaar
- Automatisch berekend op basis van terrain slope + water + obstacles

### 8.5 Map Specificatie Formaat

Maps worden opgeslagen als een compact JSON document:

```json
{
  "version": "1.0",
  "name": "De Slag bij Eindhansen",
  "author": "SpelerNaam",
  "description": "Een 2-speler map in het hart van Brabant",
  "size": "medium",
  "players": 2,
  "heightmap": "<base64 encoded 128x128 float array>",
  "texturemap": "<base64 encoded splatmap>",
  "water_level": 0.3,
  "objects": [
    { "type": "gold_mine", "x": 45.2, "y": 32.1, "amount": 1500 },
    { "type": "tree", "x": 50.0, "y": 40.0, "variant": 2 },
    { "type": "spawn", "player": 1, "x": 10.0, "y": 10.0 },
    { "type": "spawn", "player": 2, "x": 118.0, "y": 118.0 }
  ],
  "weather": "random",
  "created": "2026-04-05T10:00:00Z"
}
```

**Grootte**: ~50-200KB per map (heightmap is de grootste component).

### 8.6 Delen & Community

**Delen via link:**
- Map-data wordt gecomprimeerd (LZ-String) en opgeslagen op de server
- Link format: `theuws.com/games/reign-of-brabant/map/{hash}`
- De ontvanger opent de link en kan de map instant spelen OF openen in de editor

**Community Maps Browser:**
- In-game browser met alle gedeelde maps
- Sorteerbaar op: Nieuwste, Populairste (meest gespeeld), Best beoordeeld
- Spelers kunnen maps beoordelen (1-5 sterren) na het spelen
- "Map van de Week" spotlight op de meest populaire map

**Backend:**
- PHP + SQLite (consistent met bestaande leaderboard)
- Endpoints:
  - `POST /api/maps/save` — map opslaan (max 500KB)
  - `GET /api/maps/{hash}` — map ophalen
  - `GET /api/maps/list?sort=popular&page=1` — maps browsen
  - `POST /api/maps/{hash}/rate` — beoordeling geven

### 8.7 Validatie & Beperkingen

| Regel | Beperking | Reden |
|-------|-----------|-------|
| Min. gold mines | 2 per speler | Speelbaarheid |
| Min. bomen | 10 per speler | Secundaire resource nodig |
| Max. objecten | 500 per map | Performance |
| Min. spawn afstand | 30 units | Fairness |
| Max. map grootte | 128x128 | Browser performance |
| Pathfinding check | Elke spawn moet bereikbaar zijn | Speelbaarheid |

De editor voert deze checks uit bij het opslaan en geeft duidelijke foutmeldingen.

### 8.8 "Test" Modus

- 1-click "Test Map" button
- Start een skirmish op je map met AI tegenstander
- Snelle iteratie: edit → test → edit → test
- Versnelde game speed optie (2x, 4x) voor sneller testen

### 8.9 Technische Haalbaarheid in een Browser

**Ja, dit is haalbaar.** Hier is waarom:

| Uitdaging | Oplossing |
|-----------|----------|
| 3D terrain editing | Three.js PlaneGeometry met vertex manipulation — standaard techniek |
| Texture painting | Canvas2D splatmap die als texture op de terrain wordt geprojecteerd |
| Real-time preview | Dezelfde renderer als de game — geen extra engine nodig |
| Performance | 128x128 grid = 16.384 vertices — peanuts voor WebGL |
| Opslag | JSON + base64 heightmap — compact, makkelijk te delen |
| Undo/redo | Command pattern met een stack van operaties |

**Wat NIET haalbaar is (en dus niet doen):**
- Scripting/modding van game logic (te complex, beveiligingsrisico)
- Custom unit creation (balancing nightmare)
- Terrain deformation in real-time tijdens gameplay (performance)

### 8.10 Technische Specificatie

| Component | Technologie | Complexiteit |
|-----------|-------------|-------------|
| 3D viewport | Three.js (hergebruik game renderer) | Medium |
| Terrain editing | PlaneGeometry + vertex manipulation | Medium |
| Texture painting | Canvas2D splatmap + Three.js DataTexture | Medium |
| Object placement | Raycasting + snap-to-grid | Laag |
| UI | HTML/CSS panels (DOM overlay) | Medium |
| Map serialization | JSON + LZ-String compression | Laag |
| Backend | PHP + SQLite (hergebruik pattern) | Laag |
| Undo/redo | Command pattern stack | Medium |
| Pathfinding preview | NavMesh generation + visualization | Hoog |

---

## 9. Statistieken Dashboard

**WOW-factor: 8/10**
**Prioriteit: v1.0**
**Geschatte implementatietijd: 2-3 weken**

Na elke game wil je WETEN wat er is gebeurd. Niet alleen "je hebt gewonnen" — je wilt het VOELEN. De data. De curves. De heatmap. Het verhaal van je gevecht verteld in grafieken.

### 9.1 Het Post-Game Dashboard

Na het einde van een game (of na het bekijken van de replay) opent het dashboard:

```
┌──────────────────────────────────────────────────────────────┐
│                    VELDSLAG RAPPORT                           │
│              De Kempen — 14:32 speeltijd                     │
│         Brabanders (JIJ) vs Randstad (AI - Hard)             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─── UITSLAG ───┐    ┌─── MVP UNIT ───────────────────┐    │
│  │   OVERWINNING  │    │  Tractorrijder "Pansen"         │    │
│  │   BRABANDERS   │    │  Kills: 23 │ Survived: YES     │    │
│  └───────────────┘    │  Damage dealt: 1,847            │    │
│                        └────────────────────────────────┘    │
│                                                              │
│  ┌─── STATISTIEKEN ─────────────────────────────────────┐   │
│  │  Units getraind:  47    │  Units verloren:  31       │   │
│  │  Vijanden gedood: 52    │  Gebouwen gebouwd: 12      │   │
│  │  Gebouwen verloren: 3   │  Vijandgebouwen verwoest: 8│   │
│  │  Resources verzameld: 4,230 / 2,180                  │   │
│  │  Gezelligheid opgebouwd: 340                         │   │
│  │  Abilities gebruikt: 17                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Heatmap] [Resource Curve] [Kill Feed] [Highlight Reel]    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 Heatmap

**Unit Movement Heatmap:**
- Overlay op de minimap
- Rode gebieden = veel unit-activiteit
- Blauwe gebieden = weinig unit-activiteit
- Toggle per speler (jouw heatmap vs vijand)
- Toggle per unit-type (alleen cavalry, alleen infantry, etc.)

**Technische implementatie:**
- Tijdens de game: sample elke unit positie elke 2 seconden
- Sla op in een 64x64 grid (tel per cel hoeveel samples)
- Na de game: render als een gradient overlay (Canvas2D heatmap)
- Kleuren: blauw (0%) → groen (25%) → geel (50%) → rood (75%) → wit (100%)

**Kill Heatmap (alternatieve view):**
- Dezelfde overlay, maar dan op basis van waar units STIERVEN
- Laat "killzones" zien — plekken waar de zwaarste gevechten waren
- Nuttig voor het leren van map control

### 9.3 Resource Curve

**Income over time grafiek:**

```
Resources
  ^
  │     ╱╲
  │    ╱  ╲     ╱──── Jij (Worstenbroodjes)
  │   ╱    ╲   ╱
  │  ╱      ╲ ╱
  │ ╱        ╳
  │╱        ╱ ╲
  │        ╱   ╲──── Vijand (PowerPoints)
  │       ╱     ╲
  └──────────────────> Tijd
  0min   5min   10min  15min
```

**Wat wordt getoond:**
- Lijn 1: Jouw primaire resource income (per minuut)
- Lijn 2: Jouw secundaire resource income
- Lijn 3: Vijandelijke primaire resource (als Fog of War data beschikbaar is na de game)
- Verticale markers op key events: "Eerste aanval", "Hero getraind", "Tech upgrade"

**Technische implementatie:**
- Sample resource totals elke 10 game-seconden
- Render via Canvas2D lijn-grafiek (geen externe library nodig)
- Interactief: hover over een punt = tooltip met exact bedrag + event

### 9.4 Kill Feed Timeline

Een scrollbare timeline van ALLE kills in chronologische volgorde:

```
[02:15] Je Carnavalvierder doodde vijandelijke Stagiair
[02:18] Je Carnavalvierder doodde vijandelijke Stagiair
[02:22] Vijandelijke Manager doodde je Boer           ← rood
[03:45] Je Tractorrijder doodde 3x vijandelijke Manager  ← goud (multi-kill)
[05:12] ★ Je Prins doodde vijandelijke CEO             ← sterretje (hero kill)
```

**Kleurcoding:**
- Groen: jouw kills
- Rood: jouw verliezen
- Goud: multi-kills (3+)
- Ster: hero kills
- Diamant: building destroys

### 9.5 MVP Unit

De "Most Valuable Pansen" — de unit die het meest bijdroeg aan de overwinning:

**Berekening:**
```
MVP Score = (kills * 10) + (damage_dealt * 0.1) + (damage_tanked * 0.05) + (heals * 0.2) + (buildings_destroyed * 20) + (survived_bonus * 50)
```

**Presentatie:**
- 3D model van de unit, langzaam roterend
- "Player card" stijl met stats
- Als de unit overleefde: gouden border
- Als de unit stierf: "Gevallen in de strijd" subtitle

### 9.6 Highlight Reel

Een lijst van de top 5 momenten (uit het [Highlight Detection](#stap-2-highlight-detection-na-afloop) systeem):

```
1. ★★★★★ Tractorcharge door 8 managers      [Bekijk]
2. ★★★★☆ Carnavalsrage activatie             [Bekijk]
3. ★★★★☆ Comeback na verlies Boerderij       [Bekijk]
4. ★★★☆☆ Hero kill op De CEO                 [Bekijk]
5. ★★★☆☆ Frituurmeester triple kill          [Bekijk]
```

Elk moment is klikbaar en opent de cinematische replay van DAT specifieke moment (hergebruik van het [Epic Replay Systeem](#1-de-klapper-epic-replay-systeem)).

### 9.7 Vergelijking (Multiplayer)

In multiplayer games wordt het dashboard uitgebreid met een side-by-side vergelijking:

| Stat | Speler 1 | Speler 2 |
|------|----------|----------|
| Units getraind | 47 | 52 |
| Units verloren | 31 | 52 |
| Gebouwen gebouwd | 12 | 9 |
| Resources verzameld | 4,230 | 3,890 |
| Abilities gebruikt | 17 | 12 |
| APM (Actions Per Minute) | 85 | 62 |

**APM tracking**: Simpele teller van alle user-inputs (clicks, hotkeys) per minuut. Leuk voor competitieve spelers.

### 9.8 Technische Specificatie

| Component | Technologie | Complexiteit |
|-----------|-------------|-------------|
| Stats tracking | In-game counters (kills, resources, etc.) | Laag |
| Heatmap | 64x64 grid sampling + Canvas2D gradient render | Medium |
| Resource curve | Canvas2D lijn-grafiek | Medium |
| Kill feed | Event log (hergebruik van replay event-log) | Laag |
| MVP berekening | Score formula op unit-level stats | Laag |
| Dashboard UI | HTML/CSS overlay (DOM) | Medium |
| Highlight reel | Hergebruik replay systeem | Laag (hergebruik) |

---

## 10. De Meta-Easter Egg

**WOW-factor: 10/10**
**Prioriteit: v1.0 (simpele versies), v2.0 (volledige set)**
**Geschatte implementatietijd: 1-2 weken**

Easter eggs zijn het hart van een game die met liefde is gemaakt. Ze belonen de spelers die echt KIJKEN. Ze doorbreken de vierde muur. Ze maken de speler onderdeel van het verhaal. En in Reign of Brabant zijn ze een liefdesbrief aan het ontwikkelproces zelf.

### 10.1 De 7 Easter Eggs

Elk easter egg is verborgen op een andere plek in de game. Ze zijn genummerd, maar spelers weten niet hoeveel er zijn (tot ze ze allemaal vinden).

---

#### Easter Egg #1: "De Tattoo"

**Locatie**: Op de arm van de Prins van Brabansen hero-model.

**Wat**: Als je HEEL ver inzoomt op de Prins van Brabansen (verder dan normaal nuttig is), zie je op zijn arm een tattoo. Het is het Reign of Chaos logo — dezelfde tattoo die Richard in het echt heeft.

**Trigger**: Zoom in tot camera afstand < 3 units van de hero. Een subtiel sparkle-effect verschijnt op de arm.

**Ontdekking**: Een tooltip verschijnt: *"De Prins draagt het teken van de Oude Oorlogen... Een tribute aan een ander Reign."*

**Achievement**: "Ink & Lore" — *"Je hebt de tattoo van de Prins gevonden."*

---

#### Easter Egg #2: "De AI Raad"

**Locatie**: Verborgen "credits" gebouw op elke map.

**Wat**: Op elke map staat er ergens (ver van de spawns, vaak in een hoek) een klein, onopvallend gebouw: een oud huisje met een bord "AI Raadszaal". Als je er een unit naartoe stuurt, opent er een pop-up:

```
┌────────────────────────────────────────────┐
│           DE AI RAAD VAN BRABANT            │
│                                             │
│  Dit spel is gebouwd door Richard           │
│  en zijn 7 raadgevers:                      │
│                                             │
│  🎮 Game Master — De creatief directeur     │
│  📊 Game Analyzer — De criticus             │
│  🎨 Asset Generator — De kunstenaar         │
│  🚀 Game Deployer — De ingenieur            │
│  📝 Scenario Writer — De verteller          │
│  🎬 3D Animation Director — De regisseur    │
│  🔊 Audio Director — De componist           │
│  🔄 Improvement Agent — De perfectionist    │
│                                             │
│  "Wij zijn de stemmen achter de schermen."  │
│                                             │
│  [Sluiten]                                  │
└────────────────────────────────────────────┘
```

**Achievement**: "Achter de Schermen" — *"Je hebt de AI Raad gevonden."*

---

#### Easter Egg #3: "De PRD"

**Locatie**: In het Brabandse Cafe-gebouw, als je het selecteert en 10 seconden wacht.

**Wat**: Na 10 seconden idle op een Cafe verschijnt er een subtiel geluid (papiergeruis) en een scroll-icon. Klikken opent een "oud perkament" met fragmenten uit DEZE SUB-PRD:

```
┌────────────────────────────────────────────┐
│         📜 GEVONDEN: OUD MANUSCRIPT         │
│                                             │
│  "...en de Game Master schreef:             │
│                                             │
│   'Een feature zo indrukwekkend dat         │
│    mensen het MOETEN delen. Iets dat        │
│    niemand verwacht van een browser game.'  │
│                                             │
│   Hij noemde het:                           │
│   DE KLAPPER VAN DE WEEK..."                │
│                                             │
│  [Dit document verwijst naar zichzelf.      │
│   Hoe is dit mogelijk? Wie schrijft dit?!]  │
│                                             │
│  [Sluiten]                                  │
└────────────────────────────────────────────┘
```

**Achievement**: "Recursie" — *"Een document dat naar zichzelf verwijst. Inception."*

---

#### Easter Egg #4: "De Wolfenstein Connectie"

**Locatie**: Verborgen kamer achter een muur op de map "De Peel".

**Wat**: Op de map "De Peel" is er een stuk muur dat er anders uitziet (iets lichter van kleur). Als je een unit ertegenaan stuurt (attack-move op de muur), schuift de muur open (met het iconische Wolfenstein 3D deuren-geluid) en onthult een verborgen kamer met goud.

In de kamer staat een bordje: *"Congratulations! You found a secret room! — B.J. Blazkowicz was here"*

**Beloning**: +500 van elke resource.

**Achievement**: "Geheime Gang" — *"Je hebt de Wolfenstein-kamer gevonden. Old school."*

---

#### Easter Egg #5: "De Andere Games"

**Locatie**: Random drop van een "Retro Arcade Cabinet" prop.

**Wat**: Zeer zeldzaam (~1% kans per game): er spawnt een klein Arcade Cabinet model op de map. Als je er een unit naartoe stuurt, verschijnt er een mini-game selector:

```
┌────────────────────────────────────────────┐
│         🕹️ BRABANTSE ARCADE                 │
│                                             │
│  [Pac-Man Reborn]  — Een omweg waard        │
│  [Metal Jump 3D]   — Spring voor je leven   │
│  [Wolfenstein 3D]  — 7 episodes!            │
│                                             │
│  Klik om te spelen op theuws.com/games/     │
│                                             │
│  [Sluiten]                                  │
└────────────────────────────────────────────┘
```

De links openen de echte games in een nieuw tabblad.

**Achievement**: "Easter Egg-ception" — *"Een game in een game. Gameception."*

---

#### Easter Egg #6: "De Onmogelijke Unit"

**Locatie**: Train precies 42 Boeren (de betekenis van het leven).

**Wat**: Als je totaal precies 42 Boeren hebt getraind (niet 41, niet 43), verschijnt er een speciale Boer met een gouden hooivork en de naam "De Uitverkoransen". Deze unit heeft:

- 420 HP (10x normaal)
- 42 Attack
- Voice line: *"Ik ben de Uitverkoransen. Ik was altijd al hier."*

De unit verdwijnt als je de game herstart. Eenmalig per sessie.

**Achievement**: "42" — *"Het antwoord op alles. Zelfs in Brabant."*

---

#### Easter Egg #7: "De Maker"

**Locatie**: Typ "richard" op je toetsenbord tijdens het main menu (geen input veld, gewoon typen).

**Wat**: Het scherm flikkert. De muziek stopt. Een stem (ElevenLabs, fluisterend):

> *"Je hebt me gevonden."*

Dan verschijnt een kort "developer commentary" scherm:

```
┌────────────────────────────────────────────┐
│         BERICHT VAN DE MAKER                │
│                                             │
│  "Dit spel begon als een droom.             │
│   Een tattoo op mijn arm die zei:           │
│   'Ooit maak ik mijn eigen RTS.'            │
│                                             │
│   29 games later is het zover.              │
│   Reign of Brabant is voor iedereen         │
│   die ooit een boerderij bouwde in          │
│   WarCraft en dacht: 'Dit kan ik ook.'      │
│                                             │
│   Maar bovenal is het voor Brabant.         │
│   Omdat de mooiste verhalen                 │
│   dichtbij huis beginnen."                  │
│                                             │
│                          — Richard          │
│                                             │
│  [Sluiten]                                  │
└────────────────────────────────────────────┘
```

**Achievement**: "De Maker" — *"Je kent de maker. Of de maker kent jou."*

---

### 10.2 Easter Egg Tracking

- Gevonden easter eggs worden opgeslagen in `localStorage`
- Een verborgen "Easter Egg Collectie" pagina (toegankelijk via settings → over → 5x klikken op versienummer) toont welke je hebt gevonden:

```
┌────────────────────────────────────────────┐
│         EASTER EGG COLLECTIE                │
│                                             │
│  [✓] #1 — Ink & Lore                       │
│  [✓] #2 — Achter de Schermen               │
│  [?] #3 — ???                               │
│  [?] #4 — ???                               │
│  [?] #5 — ???                               │
│  [✓] #6 — 42                               │
│  [?] #7 — ???                               │
│                                             │
│  3 van 7 gevonden                           │
│                                             │
│  [Hint: de antwoorden liggen in het         │
│   verleden, het heden, en de code zelf]     │
│                                             │
│  [Sluiten]                                  │
└────────────────────────────────────────────┘
```

Alle 7 vinden is een voorwaarde voor het unlocken van [De Geheime 5e Factie](#7-de-geheime-5e-factie).

### 10.3 Technische Specificatie

| Component | Technologie | Complexiteit |
|-----------|-------------|-------------|
| Tattoo zoom detection | Camera distance check + texture swap | Laag |
| Hidden building | Map object met interaction trigger | Laag |
| PRD scroll | DOM overlay met styled text | Laag |
| Wolfenstein kamer | Hidden collision zone + wall animation | Medium |
| Arcade cabinet | Random spawn + external links | Laag |
| 42 Boeren | Unit count tracker + special unit spawn | Laag |
| Konami-style input | Keyboard event listener op main menu | Laag |
| Tracking | LocalStorage flags | Laag |
| Collection UI | DOM overlay | Laag |
| Audio (fluistering) | ElevenLabs, 1 clip | Laag |

---

## 11. Feature Matrix & Roadmap

### 11.1 Prioriteit & Planning

| # | Feature | WOW | Prioriteit | Weken | Afhankelijkheden |
|---|---------|-----|-----------|-------|-----------------|
| 1 | **Epic Replay Systeem** | 10 | **v1.0** | 4-5 | Gameplay loop klaar |
| 2a | **Carnaval Mode** | 9 | **v1.0** | 3 | Basis game + assets |
| 2b | **Koningsdag** | 9 | v2.0 | 2-3 | Event framework van 2a |
| 2c | **Sinterklaas** | 9 | v2.0 | 2-3 | Event framework van 2a |
| 2d | **Oud & Nieuw** | 9 | v2.0 | 2-3 | Event framework van 2a |
| 3 | **Brabantse Weerservice** | 9 | **v1.0** | 1.5-2 | Gameplay loop klaar |
| 4 | **AI Commentator** | 10 | **v1.0** | 3-4 | ElevenLabs pipeline |
| 5 | **Shared Replay GIFs** | 8 | **v1.0** | 1.5-2 | Epic Replay (#1) |
| 6 | **Weekly Challenge** | 7 | v2.0 | 2-3 | Leaderboard backend |
| 7 | **Geheime 5e Factie** | 10 | v2.0 | 4-6 | Campaign + Achievements + Easter Eggs |
| 8 | **Map Editor** | 8 | v2.0 | 4-6 | Terrain systeem |
| 9 | **Statistieken Dashboard** | 8 | **v1.0** | 2-3 | Event recording (#1) |
| 10 | **Meta-Easter Eggs** | 10 | **v1.0** (basis) | 1-2 | Maps + UI |

### 11.2 v1.0 Totaal

| Feature | Weken |
|---------|-------|
| Epic Replay Systeem | 5 |
| Carnaval Mode | 3 |
| Brabantse Weerservice | 2 |
| AI Commentator | 4 |
| Shared Replay GIFs | 2 |
| Statistieken Dashboard | 3 |
| Easter Eggs (basis) | 1.5 |
| **Totaal v1.0 showstoppers** | **~20.5 weken** |

*NB: Dit komt BOVENOP de core gameplay implementatie uit de hoofd-PRD.*

### 11.3 v2.0 Totaal

| Feature | Weken |
|---------|-------|
| Koningsdag + Sinterklaas + Oud & Nieuw | 7.5 |
| Weekly Challenge | 3 |
| Geheime 5e Factie | 5 |
| Map Editor | 5 |
| **Totaal v2.0 showstoppers** | **~20.5 weken** |

### 11.4 Synergieen tussen Features

De features zijn niet los van elkaar — ze versterken elkaar:

```
Epic Replay ──► Shared GIFs (hergebruik camera systeem)
     │
     ├──► AI Commentator (commentaar OVER de replay)
     │
     └──► Statistieken Dashboard (event-log als data source)

Seizoensevents ──► Weekly Challenge (seizoensgebonden challenges)
     │
     └──► Easter Eggs (seizoensgebonden hints)

Weer Service ──► Seizoensevents (sneeuw in winter = Sinterklaas vibes)

Map Editor ──► Weekly Challenge (community maps als challenge-arena)

5e Factie ──► Easter Eggs (alle eggs vereist voor unlock)
     │
     └──► Campaign (nieuwe missies)
```

### 11.5 De WOW Piramide

```
                    ╱╲
                   ╱  ╲
                  ╱ 10 ╲     ← Epic Replay + AI Commentator
                 ╱      ╲       + 5e Factie + Easter Eggs
                ╱────────╲
               ╱    9     ╲   ← Seizoensevents + Weerservice
              ╱            ╲
             ╱──────────────╲
            ╱       8        ╲ ← GIFs + Map Editor + Dashboard
           ╱                  ╲
          ╱────────────────────╲
         ╱         7            ╲ ← Weekly Challenge
        ╱                        ╲
       ╱──────────────────────────╲
      ╱         CORE GAMEPLAY       ╲
     ╱   (4 facties, combat, AI,     ╲
    ╱     campaign, multiplayer)      ╲
   ╱──────────────────────────────────╲
```

Elke laag maakt de laag eronder BETER. Zonder core gameplay zijn de showstoppers niks. Maar zonder de showstoppers is de core gameplay gewoon "nog een RTS". Samen zijn ze LEGENDARISCH.

---

## Appendix A: Asset Generatie Planning

### Benodigde Assets voor Showstopper Features

| Feature | Asset Type | Tool | Aantal | Geschatte Tijd |
|---------|-----------|------|--------|---------------|
| Replay systeem | Particle textures | fal.ai (Flux Dev) | 12 | 1 uur |
| Replay systeem | Transition overlays | fal.ai (Flux Pro) | 4 | 30 min |
| Carnaval Mode | Texture variants (alle units) | fal.ai (Flux Dev) | 20 | 3 uur |
| Carnaval Mode | Muziek (3 tracks) | Suno | 3 | 1 uur |
| Koningsdag | Oranje texture variants | fal.ai (Flux Dev) | 10 | 1.5 uur |
| Sinterklaas | Stoomboot 3D model | Meshy v6 | 1 | 30 min |
| Sinterklaas | Pieten 3D modellen | Meshy v6 + Blender | 3 | 2 uur |
| AI Commentator | Voice clips (3 persoonlijkheden) | ElevenLabs | ~750 | 8 uur |
| AI Commentator | Commentator portraits | fal.ai (Flux Dev) | 3 | 30 min |
| Weer systeem | Particle textures (regen, sneeuw) | fal.ai + handmatig | 6 | 1 uur |
| Weer systeem | Weerbericht voice clips | ElevenLabs | 30 | 2 uur |
| 5e Factie | Unit 3D modellen (8 + hero) | Meshy v6 + Blender | 9 | 6 uur |
| 5e Factie | Cutscene muziek | Suno | 1 | 30 min |
| 5e Factie | Verteller voice | ElevenLabs | 5 | 30 min |
| Easter Eggs | Arcade cabinet model | Meshy v6 | 1 | 15 min |
| Easter Eggs | Fluister-voice | ElevenLabs | 1 | 5 min |
| Map Editor | UI icons | fal.ai (Recraft V3) | 15 | 1 uur |
| **TOTAAL** | | | **~870** | **~28 uur** |

### Audio Generatie Strategie

**ElevenLabs (~780 clips):**
- Gebruik 3 custom voices (Sjansen, Ansen, Tansen)
- Batch-genereer via API script
- Post-processing: normalisatie, trimming, fade-in/out (FFmpeg batch)
- Opslaan als OGG Vorbis (kleinere filesize dan MP3, betere kwaliteit)

**Suno (~7 tracks):**
- Carnaval: 3 tracks (uptempo, Brabants, feestelijk)
- Efteling cutscene: 1 track (mysterieus, orkest, dromerig)
- Koningsdag: 1 track (Wilhelmus remix)
- Oud & Nieuw: 1 track (feestelijke remix game-thema)
- Replay outro: 1 track (episch, kort, 15 seconden)

---

## Appendix B: Performance Budget

### Lazy Loading Strategie

Niet alle showstopper-assets hoeven bij game-start geladen te worden:

| Asset Group | Wanneer laden | Grootte |
|-------------|--------------|---------|
| Core game | Bij start | ~50MB |
| Weer-effecten | Bij game start (na weer API call) | ~2MB |
| Replay systeem | Na game-einde (als speler replay kiest) | ~5MB |
| AI Commentator | Bij game start (geselecteerde commentator) | ~30-50MB |
| Seizoensevent assets | Bij game start (als event actief) | ~15-25MB |
| 5e Factie | Bij selectie (als unlocked) | ~15MB |
| Map Editor | Bij openen editor | ~5MB |
| Easter Egg assets | Lazy, per egg bij trigger | ~1-2MB totaal |

**Totaal maximum (alles tegelijk)**: ~120-150MB — acceptabel voor een desktop browser game met 3D graphics.

**Eerste load (core + weer)**: ~52MB — vergelijkbaar met een gemiddelde webpagina met video.

---

## Appendix C: Glossary

| Term | Betekenis |
|------|-----------|
| **Klapper** | Brabants voor een spectaculaire actie of moment |
| **Pansen** | Brabants suffix, equivalent van "-en" (bijv. "kansen" = "kansen") |
| **Alaaf** | Carnavalsgroet, equivalent van "hoera" |
| **Sjansen** | Brabants voor "kansen pakken" / "sjansen" |
| **Dansen en Hansen** | Brabantse aanhef, equivalent van "dames en heren" |
| **Klansen** | Brabants voor "klaar" / "afgelopen" |

---

*Dit document is geschreven met de overtuiging dat browser games niet "minder" hoeven te zijn. Dat een game gemaakt met AI-tools, Brabantse humor, en pure passie net zo memorabel kan zijn als een AAA-titel. En dat de beste features niet de duurste zijn — maar de meest onverwachte.*

*De Klapper van de Week is niet een feature. Het is een belofte: elke keer dat je Reign of Brabant speelt, gebeurt er iets dat het delen waard is.*

---

**Versie**: 1.0.0
**Geschreven door**: Game Master (Creative Director)
**Datum**: 2026-04-05

*Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>*
