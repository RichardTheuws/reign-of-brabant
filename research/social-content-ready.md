# Social Content -- Ready to Post

**Versie**: 1.0.0
**Datum**: 2026-04-11
**Status**: Copy-paste ready -- geen placeholders, direct te gebruiken
**Bron**: social-media-strategy.md + itch-indiedb-draft.md + press/index.html

---

## Week 1 -- Launch Posts

---

### Instagram (5 posts)

---

#### IG Post 1 -- Introductie Reel

**Type**: Reel (9:16, max 90s)

**Caption**:

```
Een WarCraft-achtige RTS. In je browser. Gebouwd door 1 persoon.

4 facties. 127 3D modellen. 525 voice lines in Brabants dialect.
Worstenbroodjes als resource. Managers die spreadsheets gooien.

Het jaar is 1473. Het Gouden Worstenbroodje is gestolen.
Vier facties botsen in een strijd om cultuur, identiteit en het recht op een frikandel speciaal.

De Brabanders worden sterker in groep. De Randstad begint traag maar schaalt door. De Limburgers graven tunnels achter je linies. De Belgen bekeren je eenheden met chocolade.

Gratis. Geen download. Geen account. Link in bio.

Gebouwd met Three.js, Meshy, Blender, ElevenLabs en Claude Code.
33.000 regels TypeScript. 192 tests. v0.21.0.

#reignofbrabant #indiegame #rts #gamedev #brabant #warcraft #browsergame #solodev #3dgame #madewithAI #nederlandsegame #threejs #indiedev #gamedevelopment #screenshotsaturday
```

**Afbeelding/video**: 30 seconden gameplay montage. Begin met base building (5s), dan een gevecht met meerdere units en voice lines (10s), dan een hero ability (5s), dan een zoom op 3D modellen (5s), eindig met het logo + "reign-of-brabant.nl" tekst (5s). Opnemen via OBS in 1920x1080, croppen naar 1080x1920 door in te zoomen op het actieve gedeelte. Tekst-overlay bovenaan: "1 persoon. AI-tools. 127 3D modellen."

---

#### IG Post 2 -- Faction Carousel: De Brabanders

**Type**: Carousel (1:1, 1080x1080)

**Carousel slides**:
- Slide 1: `public/assets/steun/faction-brabant.webp` met grote tekst "DE BRABANDERS" en subtitel "Boeren, cafebazen en carnavalvierders"
- Slide 2: `public/assets/steun/hero-prins.webp` met quote "Hedde gij da gezien? Wa een bansen!" en tekst "Hero: De Prins van Oranje"
- Slide 3: Visuele uitleg Gezelligheid-mechanic -- screenshot van Brabanders dicht bij elkaar met tekst "+50% stats als eenheden bij elkaar staan"
- Slide 4: Twee iconen met tekst "Resources: Worstenbroodjes + Bier" -- gebruik in-game screenshot van resource panel
- Slide 5: Tekst op donkere achtergrond: "Kies jouw factie. Gratis speelbaar in je browser. Link in bio." met het game logo (`public/assets/ui/logo.png`)

**Caption**:

```
De Brabanders.

Boeren, cafebazen en carnavalvierders. Hun eenheden worden sterker naarmate ze dichter bij elkaar staan. De Gezelligheid-mechanic geeft +50% stats.

Resources: worstenbroodjes en bier.
Hero: De Prins van Oranje.
Ultimate: Carnavalsrage -- een aanval die verandert in een optocht die niet te stoppen is.

Elke factie speelt compleet anders. Geen reskins. Vier verschillende ervaringen.

Volgende week: De Randstad. Consultants, bureaucratie en havermelk.

Welke factie past bij jou?

#reignofbrabant #brabant #rts #indiegame #gamedev #faction #carnaval #worstenbroodje #browsergame #solodev #warcraft #nederlandsegame
```

---

#### IG Post 3 -- Dev Log Reel: AI Pipeline

**Type**: Reel (9:16, max 90s)

**Afbeelding/video**: Screen recording van de volledige pipeline (versneld):
- Stap 1 (5s): Tekst-prompt typen in Meshy Studio ("medieval Brabant farmer with pitchfork, stylized")
- Stap 2 (8s): 3D model verschijnt in Meshy preview, draait rond
- Stap 3 (8s): Terminal met Blender CLI output -- armature wordt geplaatst, weights worden berekend, animaties gegenereerd
- Stap 4 (5s): Het model loopt, vecht en sterft in de game
- Tekst-overlay per stap: "Tekst prompt", "3D model in 40 seconden", "Auto-rig in 20 seconden", "In de game"
- Eindshot (4s): Getal "x127" met logo

Opnemen via OBS/QuickTime. Totaal 30 seconden.

**Caption**:

```
Van een tekst-prompt naar een volledig geanimeerde 3D unit. In twee minuten.

De pipeline:
1. Ik typ wat ik wil
2. Meshy Studio genereert een 3D model (40 seconden)
3. Een Blender-script rigt het automatisch -- 17 botten, 7 animaties, zero handwerk
4. ElevenLabs geeft het een stem in Brabants dialect
5. Claude Code schrijft de game logic

127 modellen. 525 voice lines. Geen enkele handmatig gemaakt in een 3D programma. Geen menselijke stemacteur.

De AI genereert het ruwe materiaal. De humor, de balans en het creatieve DNA -- dat komt van een mens met een WarCraft-tattoo op zijn rug.

De toekomst van solo game development? Of gewoon een gast met teveel vrije tijd en AI-abonnementen?

#gamedev #indiedev #AI #meshy #blender #threejs #solodev #pipeline #3dmodel #reignofbrabant #browsergame #gamedevelopment #screenshotsaturday
```

---

#### IG Post 4 -- Faction Carousel: De Randstad

**Type**: Carousel (1:1, 1080x1080)

**Carousel slides**:
- Slide 1: `public/assets/steun/faction-randstad.webp` met grote tekst "DE RANDSTAD" en subtitel "Consultants, managers en hipsters met havermelk"
- Slide 2: `public/assets/steun/hero-ceo.webp` met quote "Ik heb de spreadsheet gemaild." en tekst "Hero: De CEO"
- Slide 3: Visuele uitleg Bureaucratie-mechanic -- screenshot met tekst "Start 20% trager. Elke 5 minuten pauzeren alle gebouwen 8 seconden voor werkoverleg."
- Slide 4: Twee iconen met tekst "Resources: PowerPoints + LinkedIn Connections"
- Slide 5: Tekst op donkere achtergrond: "Langzame start. Onverslaanbaar lategame. Link in bio." met game logo

**Caption**:

```
De Randstad.

Consultants, managers en hipsters met havermelk. Beginnen 20% trager door bureaucratie. Elke vijf minuten stoppen al hun gebouwen acht seconden voor werkoverleg.

Maar als je ze laat doorgroeien worden ze onverslaanbaar.

Resources: PowerPoints en LinkedIn Connections.
Hero: De CEO.

Herkenbaar? Dat dacht ik al.

Vorige week: De Brabanders. Volgende week: De Limburgers -- tunnels, vlaai en verrassingsaanvallen.

Gratis spelen via link in bio.

#reignofbrabant #randstad #rts #indiegame #gamedev #consultant #linkedin #satire #browsergame #nederlandsegame #warcraft
```

---

#### IG Post 5 -- Gameplay Reel: Browser RTS

**Type**: Reel (9:16, max 90s)

**Afbeelding/video**: 20 seconden clip van een actueel gevecht. Meerdere eenheden in beeld, voice lines hoorbaar, explosies/effecten. Laat de UI zien (minimap, resources, control groups). Begin met een wide shot van twee legers die op elkaar af lopen, zoom in op het gevecht, eindig met een hero ability. Tekst-overlay: "Dit draait in je browser." Eindshot: "reign-of-brabant.nl -- gratis" met logo.

**Caption**:

```
Dit draait gewoon in je browser. Geen download. Geen install. Geen account.

Three.js + bitECS. 33.000 regels TypeScript. 60 FPS.

25 campaign missies. Skirmish modus tegen AI. 8 heroes. 39 unit types. 41 gebouwen.
WarCraft-style controls: control groups, attack-move, drag-select, minimap.

Het is een ongoing proof of concept. Elke week nieuwe content. Gebouwd door 1 persoon met AI-tools.

reign-of-brabant.nl -- link in bio.

#browsergame #webgl #threejs #rts #indiegame #gamedev #3d #realtime #reignofbrabant #solodev #warcraft #html5game
```

---

### Facebook Page (3 posts)

---

#### FB Post 1 -- Launch

**Tekst**:

```
Reign of Brabant is live.

Een WarCraft-achtige 3D RTS die draait in je browser. 4 facties, 127 3D modellen, 525 voice lines in Brabants dialect. Gebouwd door 1 persoon met AI-tools.

Het jaar is 1473. Het Gouden Worstenbroodje -- het symbool van alles waar Brabant voor staat -- is gestolen. Vier facties maken er ruzie over. Jij kiest welke kant je kiest.

De Brabanders -- Boeren en carnavalvierders. Worden sterker in groep (+50% stats). Resources: worstenbroodjes en bier.

De Randstad -- Consultants en managers. Langzame start, onverslaanbaar lategame. Resources: PowerPoints en LinkedIn Connections.

De Limburgers -- Mijnwerkers met tunnels. Verschijnen achter je linies. Resources: vlaai en mergel.

De Belgen -- Frietkoning en zijn leger. Bekeren vijanden met chocolade. Resources: frieten, trappist en chocolade.

Gratis. Geen download. Geen account. Open je browser en speel.
```

**Link**: `https://reign-of-brabant.nl/play/?utm_source=facebook&utm_medium=social&utm_campaign=launch`

**Afbeelding**: `public/assets/og/og-play.jpg` (1200x630, gameplay focus)

---

#### FB Post 2 -- Het persoonlijke verhaal

**Tekst**:

```
Waarom bouw ik dit?

Ik heb een WarCraft: Reign of Chaos tattoo op mijn rug. Die game heeft mijn jeugd bepaald. Nu, 20+ jaar later, bouw ik mijn eigen versie. Maar dan met worstenbroodjes in plaats van goud, en managers die spreadsheets gooien in plaats van orc peons.

Ik doe het solo. Met AI-tools die 3D modellen genereren, voice acting in dialect produceren, en muziek componeren die reageert op gevechten.

De pipeline: Claude Code schrijft de game engine. Meshy Studio genereert 127 3D modellen. Blender rigt ze automatisch. ElevenLabs produceert 525+ voice lines in Brabants, Limburgs, Vlaams en ABN. Suno componeert de soundtrack per factie.

Het kost honderden euro's per maand aan AI-tools en hosting. Het is een passieproject, geen startup. Geen investors, geen team, geen kantoor. Gewoon een Brabander met een laptop en een obsessie.

De game heet Reign of Brabant. Het is een proof of concept. Actief in ontwikkeling, elke week nieuwe content. Gratis speelbaar.

Het hele verhaal: reign-of-brabant.nl/het-verhaal/
Wil je helpen? reign-of-brabant.nl/steun/
```

**Link**: `https://reign-of-brabant.nl/het-verhaal/?utm_source=facebook&utm_medium=social&utm_campaign=launch`

**Afbeelding**: `public/assets/og/og-verhaal.jpg` (1200x630, story focus)

---

#### FB Post 3 -- Factie poll

**Tekst**:

```
De vier facties van Reign of Brabant. Welke kies jij?

DE BRABANDERS
Boeren en carnavalvierders. Worden sterker in groep. Resources: worstenbroodjes en bier. Hero: De Prins van Oranje.

DE RANDSTAD
Consultants en managers. Langzame start, onverslaanbaar lategame. Resources: PowerPoints en LinkedIn Connections. Hero: De CEO.

DE LIMBURGERS
Mijnwerkers met tunnels. Verschijnen achter je linies. Resources: vlaai en mergel. Hero: De Mijnbaas.

DE BELGEN
Frietkoning en zijn leger. Bekeren vijanden met chocolade. Resources: frieten, trappist en chocolade. Hero: De Frietkoning.

Reageer met je keuze. Of speel ze allemaal -- gratis, in je browser, geen download nodig.
```

**Link**: `https://reign-of-brabant.nl/play/?utm_source=facebook&utm_medium=social&utm_campaign=launch`

**Afbeelding**: Combinatie van de vier factie-banners naast elkaar. Gebruik:
- `public/assets/steun/faction-brabant.webp`
- `public/assets/steun/faction-randstad.webp`
- `public/assets/steun/faction-limburg.webp`
- `public/assets/steun/faction-belgen.webp`

Tip: maak een 1200x630 collage in Canva of Figma met de vier afbeeldingen op een rij, factienaam eronder.

---

### LinkedIn (2 posts)

---

#### LinkedIn Post 1 -- Het grote verhaal (AI + solo dev)

**Tekst**:

```
Ik bouw een WarCraft-achtige game. Alleen.

127 3D modellen. 525 voice lines in 4 dialecten. 25 campaign missies. 33.000 regels code. In de browser, geen download.

Geen team. Geen funding. Geen studio. Een pipeline van AI-tools:

- Claude Code voor architectuur en game logic (7 gespecialiseerde agents die parallel werken)
- Meshy v6 voor 3D modellen (tekst naar model in 40 seconden)
- Blender CLI voor automatische rigging (17 botten, 7 animaties, zero handwerk)
- ElevenLabs voor voice acting in Brabants, Limburgs, Vlaams en ABN
- Suno voor dynamische soundtracks per factie

Het kost honderden euro's per maand. Het is geen startup. Het is een passion project van iemand met een WarCraft-tattoo en de overtuiging dat AI-tools solo game development fundamenteel veranderd hebben.

De game heet Reign of Brabant. Het speelt zich af in een satirisch middeleeuws Nederland waar vier facties vechten om een Gouden Worstenbroodje. Het is precies zo absurd als het klinkt.

De vraag die ik beantwoord: "Wat kan een solo developer in 2026 bouwen als de AI-tools goed genoeg zijn?"

Het antwoord staat live. Gratis speelbaar, no strings attached: reign-of-brabant.nl/play/

Het hele development verhaal: reign-of-brabant.nl/het-verhaal/

Wat denk jij -- veranderen AI-tools het speelveld voor solo creators, of is dit een uitzondering?

#gamedev #AI #solodev #indiegame #threejs #browsergame #innovation #buildinpublic #AItools #gamedevelopment
```

---

#### LinkedIn Post 2 -- De kosten van een passieproject

**Tekst**:

```
"Hoeveel kost het om solo een game te bouwen met AI?"

Hundreds of euros per month. This isn't a hypothetical.

De concrete kostenposten:
- Claude Code tokens (code, planning, 7 AI agents): substantieel
- Meshy Studio (127 3D modellen via API): maandelijks abonnement
- ElevenLabs (525+ voice lines in 4 Nederlandse dialecten): maandelijks abonnement
- Suno (factie-specifieke soundtracks): per generatie
- fal.ai (2D assets, textures): per API call
- Mac mini M4 server (hosting, analytics, CI): hardware + stroom
- Domein + infrastructuur: reign-of-brabant.nl

De "AI maakt alles gratis" mythe klopt niet. AI maakt dingen mogelijk die eerder een team van 10 vergden. Maar mogelijk is niet gratis.

Het verschil met traditionele game development: waar je vroeger een studio van 10 man 6 maanden nodig had voor dit niveau output, kan 1 persoon het nu in weken. De kosten verschuiven van salarissen naar API calls.

De vraag is niet "kan AI een game maken?" maar "is 1 creatief persoon met een AI-pipeline een viable model voor game development?"

Ik test dat. Publiek. Alles open. Het project heet Reign of Brabant -- een 3D RTS in de browser met 4 facties, Brabants dialect en worstenbroodjes als resource.

Speel het zelf: reign-of-brabant.nl/play/
Het hele verhaal: reign-of-brabant.nl/het-verhaal/

#gamedev #AI #costs #solodev #innovation #buildinpublic #indiegame #startup #AItools
```

---

### TikTok (3 video concepts)

---

#### TikTok 1 -- De Hook

**Format**: Talking head + gameplay overlay / snelle cuts
**Duur**: 15-20 seconden

**Script/voiceover**:

```
[Tekst op scherm, eerste 2 seconden: "Ik bouw een WarCraft-achtige game. Alleen."]

[Richard kijkt in camera, of alleen tekst + gameplay]

Honderdzevenentwintig 3D modellen.
Vijfhonderdvijfentwintig voice lines.
Vier facties.
Nul teamleden.

[Snelle gameplay montage: base building, gevecht, hero, voice line]

[Eindtekst: "Link in bio. Gratis. In je browser."]
```

**Visuele beschrijving**: Begin met zwart scherm + witte tekst (hook). Dan snelle cuts van gameplay: een basis die wordt opgebouwd (2s), een leger dat aanvalt (3s), een hero die een ability gebruikt (2s), een voice line in Brabants dialect (2s), eindig met het game logo en "reign-of-brabant.nl". Alles snel, punchy, geen seconde stilstand.

**Sound/muziek**: Gebruik een trending "dramatic reveal" sound of een opbouwend beat. Alternatief: de in-game Brabanders battle music als die catchy genoeg is.

**Trending format**: "I built X" / maker onthulling format. Vergelijkbaar met indie devs die hun project laten zien in snelle montages.

---

#### TikTok 2 -- De Resources

**Format**: Snelle opsomming met cuts
**Duur**: 20-25 seconden

**Script/voiceover**:

```
[Tekst op scherm: "In mijn game zijn dit je resources:"]

[Cut naar gameplay per factie, tekst erbij:]

Brabanders: worstenbroodjes en bier.
Randstad: PowerPoints en LinkedIn Connections.
Limburgers: vlaai en mergel.
Belgen: frieten, trappist en chocolade.

[Beat drop of transition]

[Gameplay clip van een groot gevecht]

[Eindtekst: "Welke factie kies jij? Link in bio."]
```

**Visuele beschrijving**: Per factie een korte clip (3s elk) van de resource panel of een kenmerkend moment. Brabanders: boeren met worstenbroodjes. Randstad: kantoorachtige units. Limburgers: tunnelnetwerk. Belgen: Frietkoning. Gebruik de factie-banners als tussenshots als er geen goede gameplay clips zijn.

**Sound/muziek**: Trending "list reveal" sound, of een beat die steeds intenser wordt per factie. Het type waar elke cut synct met de beat.

**Trending format**: "In my game..." opsommingsformat. Werkt goed voor absurde game mechanics.

---

#### TikTok 3 -- AI Pipeline Speedrun

**Format**: Versnelde screen recording met voiceover
**Duur**: 30-35 seconden

**Script/voiceover**:

```
[Tekst op scherm: "Hoe ik een complete game unit maak in 2 minuten"]

[Screen recording, versneld, per stap tekst erbij:]

Stap 1: Ik typ wat ik wil.
[Meshy prompt wordt getypt]

Stap 2: AI maakt een 3D model.
[Model verschijnt in Meshy, draait rond]

Stap 3: Een script rigt het automatisch.
[Terminal output van Blender CLI]

Stap 4: Het loopt rond in mijn game.
[Unit beweegt in de game, vecht, sterft]

[Tekst: "x127"]
[Snelle montage van meerdere modellen]

[Eindtekst: "reign-of-brabant.nl -- gratis in je browser"]
```

**Visuele beschrijving**: Volledig screen recording, maar sterk versneld (4x-8x speed). Per stap een subtiel color shift of frame zodat het niet een monotoon scherm is. Bij "x127" een snelle cascade van verschillende 3D modellen (2s). Eindig met 3s gameplay.

**Sound/muziek**: Trending "process" of "satisfying workflow" sound. Iets dat meegroeit met de stappen. De "oh no oh no" TikTok sound werkt NIET hier -- kies iets dat competentie uitstraalt, niet chaos.

**Trending format**: "How I make X" speedrun / process video. Populair bij creative devs en 3D artists.

---

### Discord Welcome Message

---

#### Server Description (voor Discord server listing)

```
Reign of Brabant -- een 3D RTS in je browser met WarCraft vibes en Brabants dialect. Gebouwd door 1 persoon met AI-tools. Community voor spelers, testers en meedenkers. Gratis speelbaar op reign-of-brabant.nl
```

#### Welcome Channel Message (#welkom)

```
Welkom bij Reign of Brabant.

Dit is de community rondom een 3D real-time strategy game die draait in je browser. Vier facties, Brabants dialect, worstenbroodjes als resource. Gebouwd door Richard Theuws -- solo, met een pipeline van AI-tools.

Wat je hier kunt doen:

-- Speel de game: https://reign-of-brabant.nl/play/
-- Lees het verhaal: https://reign-of-brabant.nl/het-verhaal/
-- Bekijk de roadmap: https://reign-of-brabant.nl/roadmap/

Kies je factie in #kies-je-factie en krijg een rol.
Bugs? Meld ze in #bugs.
Ideeen? Deel ze in #suggesties.
Gewoon kletsen? #algemeen staat open.

Dit project is actief in ontwikkeling. Elke update wordt gepost in #aankondigingen. Feedback is welkom -- het maakt de game beter.
```

#### Rules (#regels)

```
Serverregels

1. Respecteer iedereen. Geen haat, discriminatie of persoonlijke aanvallen. We maken hier grappen over facties, niet over mensen.

2. Houd het relevant. Deze server gaat over Reign of Brabant, game development en alles daaromheen. Off-topic in #algemeen mag, spam niet.

3. Geen NSFW content. Nergens.

4. Bug reports in #bugs. Beschrijf wat je deed, wat je verwachtte, en wat er gebeurde. Screenshots helpen.

5. Suggesties zijn welkom in #suggesties. Richard leest alles. Niet alles wordt geimplementeerd, maar alles wordt overwogen.

6. Geen reclame voor eigen projecten zonder toestemming. Wil je iets delen? Vraag het in #algemeen.

7. Spoilers over campaign missies in spoiler tags. Niet iedereen speelt even snel.

Richard (server eigenaar) heeft het laatste woord bij onduidelijkheden.
```

#### Channel Structure

```
WELKOM
  #welkom              -- Welkomstbericht + links
  #regels              -- Serverregels
  #kies-je-factie      -- Reageer voor een factie-rol (Brabander/Randstedelaar/Limburger/Belg)

NIEUWS
  #aankondigingen      -- Versie-updates en nieuwe features (alleen Richard)
  #dev-log             -- Behind-the-scenes en AI pipeline updates
  #press               -- Media coverage en reviews

COMMUNITY
  #algemeen            -- Vrij chatten
  #screenshots         -- Gameplay screenshots delen
  #suggesties          -- Feature requests en ideeen
  #bugs                -- Bug reports

FACTIES
  #brabanders          -- Voor iedereen met de Brabander-rol
  #randstad            -- Voor iedereen met de Randstedelaar-rol
  #limburgers          -- Voor iedereen met de Limburger-rol
  #belgen              -- Voor iedereen met de Belg-rol

DEVELOPMENT
  #roadmap             -- Roadmap discussie
  #ai-tools            -- De AI pipeline: Meshy, ElevenLabs, Claude Code, Blender
```

**Rollen**:
- Brabander (oranje)
- Randstedelaar (blauw)
- Limburger (groen)
- Belg (rood)
- Playtester (paars) -- voor actieve testers
- Steun-ridder (goud) -- voor donateurs

---

## Week 1 -- Community Engagement

### 5 Reply Templates

---

#### 1. Reactie op "wow cool" / "vet" / "nice"

```
Bedankt! Als je het wilt proberen: reign-of-brabant.nl/play/ -- draait in je browser, gratis, geen account nodig. Laat weten welke factie je kiest.
```

---

#### 2. Reactie op "hoe heb je dit gebouwd?" / "welke tools gebruik je?"

```
Een pipeline van AI-tools: Claude Code voor de code en game logic (7 agents die parallel werken), Meshy Studio v6 voor 3D modellen (tekst naar model in 40 seconden), een custom Blender CLI script voor automatische rigging en animatie, ElevenLabs voor 525+ voice lines in 4 dialecten, en Suno voor de soundtracks. De AI genereert het ruwe materiaal -- de creatieve keuzes, humor en balans zijn mensenwerk. Het hele verhaal staat op reign-of-brabant.nl/het-verhaal/
```

---

#### 3. Reactie op "kan ik het spelen?" / "waar kan ik het vinden?"

```
Ja! reign-of-brabant.nl/play/ -- draait in je browser (desktop aanbevolen), geen download, geen account. Gratis. Laat weten wat je ervan vindt, het is actief in ontwikkeling en feedback helpt.
```

---

#### 4. Reactie op "is het gratis?" / "wat kost het?"

```
Helemaal gratis. Geen paywall, geen account, geen verborgen kosten. Open reign-of-brabant.nl/play/ in je browser en je speelt. Het is een passieproject -- als je het wilt steunen kan dat via reign-of-brabant.nl/steun/ maar dat is volledig optioneel.
```

---

#### 5. Reactie op "wat komt er nog?" / "wat zijn de plannen?"

```
De roadmap staat publiek op reign-of-brabant.nl/roadmap/ -- de grote items zijn hero abilities met daadwerkelijke effecten (nu alleen stats), multiplayer, en meer campaign missies. Elke week gaat er een update live. Het is een ongoing proof of concept, dus er wordt constant aan gebouwd.
```

---

*Social content v1.0.0 -- 2026-04-11*
*Alle content in het Nederlands tenzij anders aangegeven.*
*Geen placeholders -- alles is copy-paste ready.*
