# Reign of Brabant -- Listings Draft

**Versie**: v0.21.0
**Datum**: 2026-04-11
**Status**: Draft -- klaar voor review door Richard

---

## itch.io Listing

### Title
Reign of Brabant

### Short Description (max 140 chars)
WarCraft-achtige 3D RTS in je browser. 4 facties, Brabants dialect, 127 3D modellen. Solo gebouwd met AI-tools. Gratis.

### Genre
Strategy

### Tags (max 10)
1. rts
2. real-time-strategy
3. browser
4. html5
5. 3d
6. medieval
7. comedy
8. singleplayer
9. dutch
10. indie

### Classification
- **Kind of project**: Game
- **Release status**: In development
- **Pricing**: Free / $0
- **Platforms**: HTML5 (Web)
- **Language**: Dutch (Nederlands)
- **Multiplayer**: No (planned)
- **Accessibility**: Keyboard + Mouse
- **Made with**: Three.js, TypeScript, bitECS, Meshy, ElevenLabs, Blender, Claude Code

### Full Description (markdown, ~500 words)

```markdown
# Reign of Brabant

**Een WarCraft-achtige 3D RTS die draait in je browser. Vier facties, Brabants dialect, 127 3D modellen, 525 voice lines. Gebouwd door een persoon met AI-tools.**

## Het verhaal

Het jaar is 1473. Het Gouden Worstenbroodje -- het symbool van alles waar Brabant voor staat -- is gestolen. Vier facties botsen in een strijd om cultuur, identiteit en het recht op een frikandel speciaal.

Je speelt als de Brabanders, de Randstad, de Limburgers of de Belgen. Elke factie heeft eigen units, eigen gebouwen, eigen tech tree, eigen muziek en eigen stemacteurs. Geen reskins -- vier compleet verschillende speelervaringen.

## De vier facties

**De Brabanders** -- Boeren, cafebazen en carnavalvierders. Hun Gezelligheid-mechanic geeft +50% stats als eenheden dicht bij elkaar staan. Resources: worstenbroodjes en bier.

**De Randstad** -- Consultants, managers en hipsters met havermelk. Beginnen 20% trager (bureaucratie), maar worden uiteindelijk sneller dan iedereen. Resources: PowerPoints en LinkedIn Connections.

**De Limburgers** -- Mijnwerkers, heuvelbewoners en vlaaienbakkers. Hebben een compleet tunnelnetwerk waarmee eenheden onzichtbaar achter vijandelijke linies verschijnen. Resources: Vlaai en Mergel.

**De Belgen** -- De Frietkoning en zijn leger van frituurstrijders. De enige factie met een actief diplomatie-systeem: vijandelijke eenheden overtuigen met chocolade. Resources: Frieten, Trappist en Chocolade.

## Wat zit erin

- **25 campaign missies** over vier verhaalllijnen (15-20 uur speelduur)
- **Skirmish modus** -- speel tegen AI op 4 kaarten met 3 moeilijkheidsgraden
- **8 hero characters** met volledige backstories, unieke abilities en quotes
- **39 unit types** en **41 gebouwen**
- **525+ voice lines** in vier dialecten (Brabants, Limburgs, Vlaams, ABN)
- **127 3D modellen** gegenereerd met Meshy Studio v6
- **Factie-specifieke muziek** die reageert op de gevechtsintensiteit
- **WarCraft-style controls**: control groups, attack-move, drag-select, minimap

## Solo dev + AI

Dit project is gebouwd door een persoon (Richard Theuws) met een pipeline van AI-tools: Claude Code voor de architectuur en game logic, Meshy v6 voor 3D modellen, Blender CLI voor auto-rigging en animatie, ElevenLabs voor stemmen in vier dialecten, Suno voor de soundtrack, en fal.ai voor 2D assets.

De AI genereert modellen, stemmen en muziek. Maar het creatieve DNA -- de humor, de balans, de cultuurverwijzingen -- dat komt van een mens met een WarCraft-tattoo op zijn rug.

## Status

Dit is een ongoing proof of concept. Actief in ontwikkeling, elke week nieuwe content. Gratis speelbaar, geen account nodig. Open je browser en ga.

33.559 regels code | 192 tests | v0.21.0
```

### Suggested Screenshots to Upload

Prioriteit 1 (hero images -- breed, hoge impact):
- `public/assets/og/og-main.jpg` (1200x630, algemeen overzicht)
- `public/assets/og/og-play.jpg` (1200x630, gameplay focus)
- `public/assets/og/og-steun.jpg` (1200x630, visueel sterk)
- `public/assets/og/og-verhaal.jpg` (1200x630, story focus)

Prioriteit 2 (factie visuals):
- `public/assets/steun/faction-brabant.webp`
- `public/assets/steun/faction-randstad.webp`
- `public/assets/steun/faction-limburg.webp`
- `public/assets/steun/faction-belgen.webp`

Prioriteit 3 (hero portraits):
- `public/assets/steun/hero-prins.webp`
- `public/assets/steun/hero-ceo.webp`
- `public/assets/steun/hero-mijnbaas.webp`
- `public/assets/steun/hero-frietkoning.webp`

Prioriteit 4 (overig):
- `public/assets/steun/world-map.webp`
- `public/assets/steun/hero-banner.webp`
- `public/assets/ui/logo.png` (voor cover/branding)

**Let op**: itch.io ondersteunt max 5 screenshots prominent. Gebruik og-main, og-play, en de 4 factie-images als primaire set. Maak daarnaast in-game screenshots van actieve gameplay (gevechten, base building, campaign missies) -- die ontbreken nu nog als losse bestanden.

---

## IndieDB Listing

### Game Name
Reign of Brabant

### Summary (2-3 zinnen)
Reign of Brabant is a browser-based 3D real-time strategy game set in a satirical medieval Netherlands. Four factions -- Brabanders, Randstad, Limburgers, and Belgians -- clash over the stolen Golden Sausage Roll, each with unique units, buildings, tech trees, and voice acting in regional Dutch dialects. Built entirely by a solo developer using an AI-powered pipeline of Claude Code, Meshy 3D, Blender, and ElevenLabs.

### Genre
Real-Time Strategy

### Theme
Comedy, Fantasy

### Players
Singleplayer

### Engine
Custom (Three.js + bitECS)

### Platform
Web Browser (HTML5)

### Full Description (~300 words, tech/dev story angle)

```
Reign of Brabant is a 3D real-time strategy game that runs entirely in the browser, built with Three.js and an Entity Component System (bitECS). No downloads, no plugins -- just open the URL and play.

What makes this project unusual is how it's made. One developer, zero traditional artists or voice actors, and a pipeline of AI tools that turns a text description into a rigged, animated, voiced 3D unit in under two minutes.

The pipeline works like this: Claude Code (with 7 specialized agents running in parallel) handles architecture, game logic, and AI behavior. Meshy Studio v6 generates 127 3D models from text prompts. A custom Blender CLI script auto-rigs each model with a 17-bone humanoid armature, distance-based weight painting, and 7 animation sets per unit category. ElevenLabs produces 525+ voice lines in four Dutch dialects (Brabants, Limburgs, Flemish, and standard Dutch). Suno generates faction-specific soundtracks with a dynamic battle intensity system.

The game itself is a love letter to WarCraft: Reign of Chaos -- complete with base building, resource gathering, tech trees, hero units with abilities, and RTS controls (control groups, attack-move, drag-select, minimap). Four factions offer genuinely different playstyles: the Brabanders get stronger when grouped together (Gezelligheid mechanic), the Randstad starts slow but scales exponentially (Bureaucracy), the Limburgers use underground tunnels for surprise attacks, and the Belgians can convert enemy units through diplomacy.

Current state: 25 campaign missions across four storylines, skirmish mode with AI opponents, 8 hero characters, 39 unit types, 41 buildings. 33,559 lines of TypeScript, 192 automated tests.

This is an ongoing proof of concept -- actively developed, free to play, no account required. The codebase is public on GitHub.
```

### Tags
real-time-strategy, browser-game, three-js, ai-generated, comedy, medieval, indie, solo-dev, dutch, free

### Links
- **Homepage**: https://reign-of-brabant.nl
- **Play**: https://reign-of-brabant.nl/play/
- **Source**: https://github.com/RichardTheuws/reign-of-brabant

---

## Reddit Posts

---

### r/indiegaming

**Title**: I'm building a WarCraft-style RTS that runs entirely in the browser -- 4 factions, 127 3D models, 525 voice lines, all AI-generated

**Body**:

Hey r/indiegaming,

I've been building a 3D real-time strategy game called **Reign of Brabant** that runs completely in the browser. No download, no install -- just open the link and play.

It's heavily inspired by WarCraft: Reign of Chaos (I have the logo tattooed on my back, so I guess this was inevitable). The twist: it's set in a satirical medieval Netherlands where four factions fight over a stolen Golden Sausage Roll.

**The four factions:**

- **Brabanders** -- Farmers and carnival partiers. Get +50% stats when grouped together ("Gezelligheid" mechanic). Resources: sausage rolls and beer.
- **Randstad** -- Corporate consultants and managers. Start 20% slower (bureaucracy), but eventually outscale everyone. Resources: PowerPoints and LinkedIn Connections.
- **Limburgers** -- Miners and hill dwellers. Can build underground tunnels to appear behind enemy lines. Resources: Pie and Limestone.
- **Belgians** -- The Fry King and his deep-fried army. Can convert enemy units through chocolate diplomacy. Resources: Fries, Trappist beer, and Chocolate.

**What's in the game right now (v0.21.0):**

- 25 campaign missions across 4 storylines
- Skirmish mode vs AI
- 8 hero characters with unique abilities
- 39 unit types, 41 buildings
- 525+ voice lines in 4 regional dialects
- Full WarCraft-style controls (control groups, attack-move, drag-select)

Everything is built by one person using AI tools -- Claude Code for the engine, Meshy for 3D models, Blender CLI for auto-rigging, ElevenLabs for voice acting, Suno for music. The AI generates the raw assets, but all creative direction, humor, and game design comes from a human.

Free to play, no account needed: **https://reign-of-brabant.nl/play/**

The full backstory: https://reign-of-brabant.nl/het-verhaal/

Would love to hear what you think. Feedback on gameplay, balance, anything -- it's all useful. This is an ongoing project and I'm actively developing it.

---

### r/WebGames

**Title**: Reign of Brabant -- een gratis 3D RTS in je browser (WarCraft-achtig, 4 facties, Brabants dialect)

**Body**:

Hoi r/WebGames,

Ik werk aan een 3D real-time strategy game die volledig in de browser draait. Geen download, geen plugin, gewoon klikken en spelen.

**Link**: https://reign-of-brabant.nl/play/

**Wat is het?**

Een WarCraft-achtige RTS met vier facties die vechten om het Gouden Worstenbroodje. Het is gebouwd met Three.js en bitECS, draait in elke moderne browser.

- 25 campaign missies
- Skirmish modus tegen AI
- 8 hero characters
- 525+ voice lines in Brabants, Limburgs, Vlaams en ABN
- 127 AI-gegenereerde 3D modellen
- WarCraft-style controls (ctrl-groepen, attack-move, drag-select)

Het is een ongoing project van een solo developer. Gratis, geen account nodig. Desktop aanbevolen.

Feedback welkom -- het is actief in ontwikkeling.

---

### r/gamedev

**Title**: Solo dev + AI pipeline: How I'm building a 3D RTS in the browser with Claude Code, Meshy, Blender CLI, and ElevenLabs

**Body**:

I wanted to share the development story of **Reign of Brabant**, a browser-based 3D RTS I'm building as a solo developer using an AI-powered asset pipeline.

**The question I started with**: Can one person, with the right AI tools, build a real RTS -- not a prototype, but something with 4 factions, campaigns, voice acting, and proper 3D models?

Six days in, here's where it stands: 33,559 lines of TypeScript, 127 3D models, 525+ voice lines, 192 automated tests, 25 campaign missions. It runs in the browser at 60+ FPS on Three.js + bitECS.

**The pipeline (text prompt to game-ready unit in ~2 minutes):**

1. **Claude Code** -- 7 specialized agents handle architecture, game logic, AI behavior, scenario writing, audio direction, 3D animation, and deployment. They run in parallel.
2. **Meshy Studio v6** -- Text-to-3D. 127 models generated via API with 20 parallel tasks. Each faction is visually distinct at RTS zoom level.
3. **Blender CLI** -- Custom auto-rig script. 17-bone humanoid armature, distance-based weight painting, 7 animation sets per unit type. Fully automated, zero manual Blender work.
4. **ElevenLabs** -- 525+ voice lines in 4 Dutch dialects. Each unit type has unique voice settings. Managed through a custom Voice Studio with sync scripts.
5. **Suno** -- Faction-specific soundtracks with dynamic battle intensity. The music responds to what's happening on the battlefield.

**What I learned:**

- **AI is a power tool, not a replacement.** The AI generates raw assets incredibly fast, but creative direction, game feel, humor, and balance still come from a human. Meshy gives you a model; making it look right in-game at RTS scale is a separate problem.
- **Blender CLI rigging is underrated.** Mixamo doesn't work well with AI-generated models. A custom script with distance-based weights and rigid weapon passes works much better.
- **ElevenLabs + dialects is tricky.** Getting authentic Brabants/Limburgs/Flemish requires very specific voice settings and phonetic guidance. Generic Dutch doesn't cut it.
- **The bottleneck isn't code anymore.** With Claude Code, the code writes itself in hours. The bottleneck is creative decisions: faction balance, campaign pacing, what's funny vs. what's forced.

**Costs**: This runs hundreds of euros per month. Claude tokens, ElevenLabs, Meshy, fal.ai, Suno, hosting on a Mac mini M4 server. It's a passion project with real operating costs.

The game is free to play, no account needed: https://reign-of-brabant.nl/play/

Full development story: https://reign-of-brabant.nl/het-verhaal/

GitHub: https://github.com/RichardTheuws/reign-of-brabant

Happy to answer questions about the pipeline, the architecture, or the tools. AMA.

---

### r/thenetherlands

**Title**: Ik bouw een WarCraft-achtige RTS die zich afspeelt in Brabant. Met worstenbroodjes als resources en managers die spreadsheets gooien.

**Body**:

Hallo r/thenetherlands,

Ik ben Richard, een Brabander uit Reusel, en ik bouw een 3D real-time strategy game die draait in je browser. Het heet **Reign of Brabant** en het is precies zo absurd als het klinkt.

**Het verhaal**: Het jaar is 1473. Het Gouden Worstenbroodje -- het symbool van alles waar Brabant voor staat -- is gestolen. Vier facties maken er ruzie over.

**De facties:**

- **De Brabanders** -- Boeren, cafebazen en carnavalvierders. Hun eenheden worden sterker naarmate ze dichter bij elkaar staan (Gezelligheid-mechanic, +50% stats). Resources: worstenbroodjes en bier. Hun Carnavalsrage verandert een aanval in een optocht die niet te stoppen is.

- **De Randstad** -- Consultants, managers en hipsters met havermelk. Beginnen 20% trager door bureaucratie, maar worden uiteindelijk sneller dan iedereen. Resources: PowerPoints en LinkedIn Connections. Elke vijf minuten pauzeren al hun gebouwen acht seconden voor werkoverleg.

- **De Limburgers** -- Mijnwerkers, heuvelbewoners en vlaaienbakkers. Bouwen tunnels waarmee eenheden onzichtbaar achter vijandelijke linies verschijnen. Resources: Vlaai en Mergel. De Mergelridder is de zwaarst gepantserde unit in het spel.

- **De Belgen** -- De Frietkoning en zijn leger van frituurstrijders. Kunnen vijandelijke eenheden overtuigen met chocolade-diplomatie. Resources: Frieten, Trappist en Chocolade. Hun chaos is hun kracht.

**De heroes praten in dialect.** 525+ voice lines in Brabants ("ge", "hedde", "nie"), Limburgs ("ich", "dich", "jao"), Vlaams ("amai", "allez", "goesting") en ABN voor de Randstad.

Het is een ongoing project -- gebouwd door 1 persoon met AI-tools (ik heb een WarCraft: Reign of Chaos tattoo op mijn rug, dus dit was min of meer onvermijdelijk). Het is gratis, draait in je browser, geen download nodig.

**Speel het**: https://reign-of-brabant.nl/play/

**Het hele verhaal**: https://reign-of-brabant.nl/het-verhaal/

**Steun het**: https://reign-of-brabant.nl/steun/

Ik hoor graag wat jullie ervan vinden. Welke factie kiezen jullie?
