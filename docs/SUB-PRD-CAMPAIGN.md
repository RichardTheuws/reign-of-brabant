# SUB-PRD: Campaign Content, Bonus Levels & Easter Eggs

**Versie**: 1.0.0
**Datum**: 2026-04-05
**Status**: Draft — Wacht op goedkeuring
**Parent Document**: `../PRD.md` v1.0.0
**Scope**: Alle singleplayer campaign content, bonus levels, easter eggs, unlock systeem en cutscene design

---

## Inhoudsopgave

1. [Brabanders Campaign — "Het Gouden Worstenbroodje" (12 missies)](#1-brabanders-campaign)
2. [Limburgers Campaign — "De Schaduwen van het Heuvelland" (8 missies)](#2-limburgers-campaign)
3. [Belgen Campaign — "Het Compromis" (6 missies)](#3-belgen-campaign)
4. [Randstad Campaign — "De Andere Kant" (6 missies)](#4-randstad-campaign)
5. [Secret Campaign — "Het Sprookjesbos" (3 missies)](#5-secret-campaign)
6. [Bonus Levels](#6-bonus-levels)
7. [Easter Eggs (25+)](#7-easter-eggs)
8. [Unlock Systeem](#8-unlock-systeem)
9. [Campaign Cutscenes](#9-campaign-cutscenes)

---

## Globale Campaign Design Regels

**Difficulty modifiers** (gelden voor ALLE missies tenzij anders vermeld):

| Aspect | Easy | Medium | Hard |
|--------|------|--------|------|
| Vijandelijke HP | -20% | Normaal | +25% |
| Vijandelijke damage | -20% | Normaal | +20% |
| Vijandelijke army grootte | -30% | Normaal | +30% |
| Vijandelijke AI aggressie | Passief | Normaal | Agressief + counter-build |
| Speler start resources | +50% | Normaal | -25% |
| Timer objectives | +50% tijd | Normaal | -25% tijd |
| Hints/tooltips | Uitgebreid | Basis | Geen |
| Bonus objective reward | x1 | x1.5 | x2 |

**Narrative toon**: Humor in briefings en dialoog, maar gameplay is serieus en uitdagend. De wereld neemt zichzelf serieus; de humor komt voort uit de absurditeit van de situatie, niet uit slapstick.

---

## 1. Brabanders Campaign — "Het Gouden Worstenbroodje" {#1-brabanders-campaign}

*"Van boerendorp tot de poorten van de Randstad — de reis van een volk dat niet wist dat het helden kon zijn."*

**Totale speelduur**: 6-10 uur (afhankelijk van difficulty)
**Unlock**: Beschikbaar vanaf het begin
**Verhaallijn**: De Brabanders ontdekken dat het Gouden Worstenbroodje is gestolen door de Randstad Ontwikkelingsmaatschappij. Wat begint als een simpele zoektocht wordt een oorlog die heel Brabant verandert. Onderweg ontmoeten ze de mysterieuze Limburgers en de chaotische Belgen, en ontdekken ze dat het Worstenbroodje slechts een symptoom is van een veel groter complot.

---

### Missie 1: "De Oogst"

**Locatie**: Reusel — een klein boerendorp aan de Belgische grens
**Geschatte speelduur**: 15 min (Easy) / 20 min (Medium) / 25 min (Hard)

**Briefing tekst**:
> *Het is een rustige ochtend in Reusel. De vogels zingen, de koeien loeien, en de geur van versgebakken worstenbroodjes hangt in de lucht. Jij bent de nieuwe opzichter van de boerderij. Niets kan deze dag verpesten... toch?*
>
> *Leer de basis: verzamel resources, bouw gebouwen, en train je eerste werkers. Brabant heeft hardwerkende handen nodig.*

**Objectives**:
- **Primair**: Verzamel 200 Worstenbroodjes en 150 Bier
- **Primair**: Bouw een Cafe en een Bakkerij
- **Primair**: Train 3 Boeren (totaal 6 inclusief startende 3)
- **Bonus**: Bouw een Brouwerij binnen 3 minuten (unlocks: Boer-voiceline pack)
- **Bonus**: Verken de hele map (unlocks: concept art "Reusel bij Dageraad")

**Map layout**:
- **Grootte**: 128x128 (klein, tutorial-formaat)
- **Start positie**: Zuidwest — Boerderij (Town Hall) + 3 Boeren + 1 Gold Mine vlakbij
- **Speciale features**: Geen vijanden. 2 Gold Mines (1 dichtbij, 1 iets verder). 4 boomclusters. 1 klein ven (obstakel). Golvende weilanden met koeien (decoratief). Een pad dat naar het noorden leidt (narratief: "de weg naar Den Bosch").
- **Atmosfeer**: Ochtendlicht, vogelgeluiden, rustiek

**Beschikbare units/gebouwen**:
- Units: Boer (worker) alleen
- Gebouwen: Boerderij (start), Bakkerij, Brouwerij, Cafe, Boerenhoeve

**Vijandelijke samenstelling**: Geen vijanden. Dit is puur tutorial.

**Trigger events**:
1. **Start**: Cutscene — camera pant over het dorp. Narrator introduceert de setting.
2. **Bij eerste resource verzameld**: Tutorial pop-up over resource gathering.
3. **Bij eerste gebouw geplaatst**: Tutorial over building placement en bouwtijd.
4. **Na Cafe gebouwd**: Tutorial over unit training. Hint: "Train een paar Carnavalvierders. Wie weet wanneer je ze nodig hebt..."
5. **Bij 200/150 resources**: Cutscene trigger — een bode komt aangerend: *"Het Gouden Worstenbroodje! Het is weg! Gestolen! En op de plek lag een visitekaartje... van de RANDSTAD!"* Map eindigt.

**Difficulty scaling**:
- **Easy**: Start met 100/50 resources. Extra tooltips bij elke actie.
- **Medium**: Start met 50/25 resources. Basis tooltips.
- **Hard**: Start met 0/0 resources. Geen tooltips. Bonus objective: Verzamel 300/200 in plaats van 200/150.

**Victory condition**: Alle primaire objectives behaald + bode cutscene afgespeeld.
**Defeat condition**: Geen defeat mogelijk (tutorial level).

**Nieuwe mechanics geintroduceerd**:
- Resource gathering (Worstenbroodjes + Bier)
- Building placement en constructie
- Worker training
- Camera controls (WASD, zoom, minimap)
- Unit selectie en commando's

**Story beats**:
- Introductie van het dorp Reusel en de Brabantse cultuur
- Eerste hint van het Gouden Worstenbroodje als belangrijk artefact
- Cliffhanger: het Worstenbroodje is gestolen

**Dialoog**:
- **Boer (bij selectie eerste keer)**: *"Goeiemoransen! Wat kan ik doen?"*
- **Narrator (start)**: *"In het zuiden van Brabant, waar de akkers zo ver reiken als het oog kan zien, ligt Reusel. Een dorp waar de tijd stilstaat... tot vandaag."*
- **Bode (trigger)**: *"Opzichter! Opzichter! Verschrikkelijk nieuws uit Den Bosch! Het Gouden Worstenbroodje — het symbool van ons volk — het is GESTOLEN! En kijk... kijk wat ze achterlieten!"* (toont visitekaartje)

---

### Missie 2: "Smokkel bij de Grens"

**Locatie**: De Belgisch-Brabantse grens — bossen en smokkelpaden
**Geschatte speelduur**: 20 min (Easy) / 30 min (Medium) / 40 min (Hard)

**Briefing tekst**:
> *Het nieuws over de diefstal verspreidt zich als een lopend vuurtje. De Brabantse Raad heeft jou — de held van Reusel — aangewezen om het Worstenbroodje terug te halen. Maar eerst heb je bondgenoten nodig.*
>
> *Bij de Belgische grens zijn smokkelaars actief die kennis hebben van geheime routes naar het noorden. Maak contact met de Belgen en bescherm de smokkelpaden tegen Randstad-patrouilles.*

**Objectives**:
- **Primair**: Bouw een basis op en train minstens 8 militaire units (Carnavalvierders + Kansen)
- **Primair**: Bescherm het Belgische smokkelkonvooi (3 NPC karren) terwijl ze van oost naar west over de map bewegen
- **Primair**: Vernietig de Randstad-verkenningspost (kleine basis, noordoost)
- **Bonus**: Geen enkel konvooikar verloren (unlocks: Belgische Friet resource bonus in Missie 5)
- **Bonus**: Vind het verborgen smokkelhol (verstopt achter bomen, zuidoost) — bevat 200 bonus resources

**Map layout**:
- **Grootte**: 192x192 (medium)
- **Start positie**: Zuidwest — Boerderij + 5 Boeren + 2 Carnavalvierders
- **Vijand positie**: Noordoost — kleine Randstad-basis (Hoofdkantoor + Vergaderzaal + 6 Managers + 2 Stagiaires)
- **Speciale features**: Dicht bos in het midden. Twee smokkelpaden (noord en zuid om het bos heen). Belgisch konvooi start in het oosten. Verborgen smokkelhol achter destructible boomcluster in het zuidoosten. Grenspaaltjes als decoratie.
- **Konvooiroute**: Oost → pad langs zuidrand → west (aankomstpunt). Konvooi wordt aangevallen door 2 groepjes Randstad-units onderweg.

**Beschikbare units/gebouwen**:
- Units: Boer, Carnavalvierder, Kansen (ranged, unlocked na Cafe)
- Gebouwen: Boerderij, Cafe, Bakkerij, Brouwerij, Boerenhoeve

**Vijandelijke samenstelling**:
- **Statische basis**: 1 Hoofdkantoor, 1 Vergaderzaal, 1 Vinex-wijk
- **Patrouilles**: 2 groepjes van 3 Managers die het konvooi aanvallen
- **Verdediging**: 4 Managers + 2 Consultants bij de basis
- AI bouwt NIET extra units (scripted level)

**Trigger events**:
1. **Minuut 2**: Belgisch konvooi verschijnt in het oosten. NPC Belg roept: *"Hallo daar! Wij hebben frieten en informatie. Maar die Randstedelingen blokkeren de weg!"*
2. **Konvooi bij eerste patrouille**: Gevecht begint. Als speler geen units in de buurt heeft: konvooi neemt schade.
3. **Konvooi bij tweede patrouille**: Grotere patrouille. Hint: *"Gebruik je Kansen — ze kunnen vanuit het bos schieten zonder gezien te worden!"*
4. **Konvooi arriveert**: Belgische NPC: *"Merci! De Randstad bouwt iets in het noorden. Een soort... vergadermachine? Wij weten niet wat het is, maar het ruikt naar PowerPoints."*
5. **Verkenningspost vernietigd**: Victory. Tussen het puin: een document met de naam "Project Gentrificatie — Fase 1".

**Difficulty scaling**:
- **Easy**: Konvooi heeft 300 HP per kar. Patrouilles zijn 2 units elk. Start met 4 Carnavalvierders.
- **Medium**: Konvooi heeft 200 HP per kar. Patrouilles zijn 3 units elk.
- **Hard**: Konvooi heeft 150 HP per kar. Patrouilles zijn 4 units elk + 1 extra patrouille verschijnt halverwege.

**Victory condition**: Konvooi aangekomen (minstens 1 kar) + Randstad-verkenningspost vernietigd.
**Defeat condition**: Alle konvooikarren vernietigd OF eigen Boerderij vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Militaire units trainen
- Basisgevecht (melee + ranged)
- Escort missie mechanic (bescherm NPC's)
- Stealth hint (Kansen in bossen)
- Fog of War introductie

**Story beats**:
- Eerste ontmoeting met de Belgen als potentiele bondgenoten
- Eerste gevecht met de Randstad
- Ontdekking van "Project Gentrificatie" — de Randstad heeft grotere plannen dan alleen een Worstenbroodje stelen
- Belgische humor: *"In België hadden we dit opgelost met een compromis en drie soorten bier."*

---

### Missie 3: "Kermisgevecht"

**Locatie**: Tilburg — de Kermis, grootste kermis van de Benelux
**Geschatte speelduur**: 25 min (Easy) / 35 min (Medium) / 45 min (Hard)

**Briefing tekst**:
> *De berichten komen binnen: de Randstad heeft een voorpost gebouwd in Tilburg. Ze hebben de Kermis overgenomen en er een "innovatiehub" van gemaakt. De draaimolens draaien niet meer, de suikerspinkramen zijn vervangen door pop-up Starbucks.*
>
> *Dit is een brug te ver. Bevrijd de Tilburgse Kermis en jaag de Randstad de stad uit.*

**Objectives**:
- **Primair**: Bouw een functionele basis met minstens 15 units
- **Primair**: Verover de Kermis (neutraal gebouw in het centrum — stuur 5 units naar het plein en houd het 60 seconden vast)
- **Primair**: Vernietig het Randstad-Hoofdkantoor
- **Bonus**: Behoud alle 4 kermiskramen intact (gebouwen op het plein die de Randstad probeert te slopen)
- **Bonus**: Win binnen 20 minuten (unlocks: Kermis-decoratie voor Town Hall skin)

**Map layout**:
- **Grootte**: 224x224 (groot)
- **Start positie**: Zuid — open veld, 2 Gold Mines dichtbij
- **Vijand positie**: Noord — Randstad-basis achter een stadsmuur (chokepoint: 2 ingangen)
- **Centrum**: Het Kermisplein — 4 kermiskramen (neutrale gebouwen, elk 300 HP), draaimolen (decoratief), open plein omringd door gebouwen
- **Speciale features**: Stadsmuren als terreinobstakels (alleen 2 poorten). Rivier door het midden met 1 brug (tweede chokepoint). Kermiskramen genereren passief +1 Worstenbroodje/10s als je ze controleert.

**Beschikbare units/gebouwen**:
- Units: Boer, Carnavalvierder, Kansen, Boerinne (healer, unlocked deze missie)
- Gebouwen: Alle Tier 1 gebouwen + Kermistent (tech/upgrade)

**Vijandelijke samenstelling**:
- 1 Hoofdkantoor, 1 Vergaderzaal, 1 Coworking Space, 2 Vinex-wijken
- 8 Managers, 4 Consultants, 3 Stagiaires
- AI produceert continu Managers (1 per 25s)
- Na 8 minuten: AI stuurt eerste aanvalsgolf (6 Managers + 2 Consultants)
- Na 15 minuten: AI stuurt tweede golf met HR-medewerker support

**Trigger events**:
1. **Start**: Narrator: *"Tilburg. Ooit de thuisbasis van de grootste kermis ter wereld. Nu? Een LinkedIn-netwerkborrel met draaimolens die op zonne-energie draaien."*
2. **Bij nadering Kermisplein**: Gevangen Tilburger NPC: *"Godzijdansen! Ze hebben de oliebollen vervangen door açaí bowls! RED ONS!"*
3. **Kermis veroverd**: 2 gratis Carnavalvierders spawnen als dankbare Tilburgers. Kermiskramen beginnen resources te genereren.
4. **Eerste aanvalsgolf**: Alarm! Randstad counterattack. HR-medewerker roept: *"Dit is een onacceptabele inbreuk op de kantoorsfeer!"*
5. **Hoofdkantoor vernietigd**: Manager rent weg: *"De CEO hoort hier van! DIE HOORT HIER VAN!"* — setup voor latere missies.

**Difficulty scaling**:
- **Easy**: Randstad produceert langzamer (1 per 40s). Eerste golf na 10 min. Speler start met 200/100 resources.
- **Medium**: Standaard timing. Speler start met 100/50.
- **Hard**: Randstad produceert sneller (1 per 20s). Eerste golf na 6 min. Extra golf na 12 min. Speler start met 50/25.

**Victory condition**: Kermisplein veroverd + Randstad-Hoofdkantoor vernietigd.
**Defeat condition**: Eigen Boerderij vernietigd OF alle 4 kermiskramen vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Healing (Boerinne unit)
- Tech-gebouwen (Kermistent voor upgrades)
- Gebied veroveren en vasthouden (capture point mechanic)
- Neutraal gebouw control (kermiskramen als resource boost)
- Defensieve positionering (chokepoints gebruiken)

**Story beats**:
- De Randstad-bezetting concreet gemaakt — ze veranderen Brabantse cultuur
- Eerste grote overwinning voor de speler
- De vijand waarschuwt "De CEO" — foreshadowing van de eindbaas

---

### Missie 4: "De Binnendieze"

**Locatie**: Den Bosch — de ondergrondse watergang en de binnenstad
**Geschatte speelduur**: 20 min (Easy) / 30 min (Medium) / 40 min (Hard)

**Briefing tekst**:
> *Den Bosch. Het hart van Brabant. En volgens onze Belgische vrienden ligt hier ergens een geheim Randstad-archief met de blauwdruk van "Project Gentrificatie". Maar de stad is zwaar bewaakt.*
>
> *Gelukkig heeft Den Bosch een geheim: de Binnendieze — een ondergrondse watergang die zich door de hele stad slingert. Stuur je Kansen-spionnen door de tunnels, vind het archief, en kom levend terug.*

**Objectives**:
- **Primair**: Infiltreer met 3 Kansen-units via de Binnendieze (ondergrondse route) naar het stadscentrum
- **Primair**: Bereik het Randstad-archief (gebouw in het noordoosten) zonder gedetecteerd te worden
- **Primair**: Steel de documenten (10 seconden channelen bij het archief) en ontsnap naar de startpositie
- **Bonus**: Vernietig de 2 Randstad-bevoorradingsdepots onderweg (kleine gebouwen, elk bewaakt door 1 Manager)
- **Bonus**: Geen enkele Kansen verloren (unlocks: "Meestersmokkelaar" achievement + Kansen gold skin)

**Map layout**:
- **Grootte**: 192x192
- **Start positie**: Zuidwest — Klein kamp (geen Town Hall, dit is een commando-missie). 3 Kansen + 2 Carnavalvierders (backup).
- **Vijand positie**: Heel de stad — patrouilles, wachttorens, Kantoor-torens
- **Speciale features**: De Binnendieze als alternatieve route (ondergrondse watergang, alleen toegankelijk voor Kansen-units via speciale ingangen). 3 Binnendieze-ingangen op de map. Patrouilleroutes zijn voorspelbaar (gevisualiseerd als faint lines op Easy). Wachttorens met detectieradius (cirkels op de minimap). Archief-gebouw zwaar bewaakt maar met blinde hoek via de Binnendieze.
- **Atmosfeer**: Nacht, fakkellicht, spanning

**Beschikbare units/gebouwen**:
- Units: 3 Kansen (vast), 2 Carnavalvierders (vast). Geen nieuwe training mogelijk.
- Gebouwen: Geen. Dit is een commando-missie met vaste units.

**Vijandelijke samenstelling**:
- 3 patrouilles van 2 Managers (vaste routes, circulair)
- 2 Kantoor-torens (detectieradius 10, aanvalsradius 8)
- 4 stationaire Managers bij het archief
- 1 Hipster scout die willekeurig over de map beweegt
- Detectie = alarm: +6 extra Managers spawnen bij het Hoofdkantoor in het noorden en jagen op de speler

**Trigger events**:
1. **Start**: Narrator: *"De Sint-Janskathedraal torent boven je uit in het maanlicht. Ergens in deze stad liggen de antwoorden. Maar Den Bosch is niet meer van ons."*
2. **Bij Binnendieze-ingang**: Kansen voice: *"De Binnendieze... ik heb er verhalen over gehoord. Ze zeggen dat Jeroen Bosch hier zijn inspiratie vond."* (Easter egg referentie)
3. **Bij detectie**: Alarm sirene. Manager: *"INDRINGER! BELEGGEN! NU! ...Ik bedoel: GRIJP ZE!"*
4. **Bij archief**: Documenten gevonden. Kansen: *"Dit is... dit is veel groter dan een Worstenbroodje. Ze willen HEEL Brabant gentrificeren. Kijk: 'Project Gentrificatie — Elke stad een Vinex-wijk, elke kroeg een Starbucks.'"*
5. **Bij ontsnapping**: Kansen terug bij start. Briefing voor volgende missie: *"We moeten bondgenoten zoeken. De Limburgers kennen deze truc misschien al — ze leven zelf underground."*

**Difficulty scaling**:
- **Easy**: Patrouilleroutes zichtbaar op minimap. Detectieradius -30%. Kansen starten met Smokkelroute-ability (onzichtbaarheid).
- **Medium**: Patrouilleroutes niet zichtbaar. Standaard detectieradius.
- **Hard**: Patrouilleroutes willekeuriger (kleine variaties). Detectieradius +20%. Extra patrouille. Hipster heeft sight range 14.

**Victory condition**: Documenten gestolen + minstens 1 Kansen terug bij startpositie.
**Defeat condition**: Alle Kansen-units dood.

**Nieuwe mechanics geintroduceerd**:
- Stealth gameplay (Smokkelroute-ability, detectieradius, patrouilles)
- Commando-missie format (geen base building)
- Binnendieze als speciale terreinfeature (ondergrondse route)
- Channeling mechanic (10 sec bij archief staan)

**Story beats**:
- Ontdekking van Project Gentrificatie — de echte bedreiging
- Den Bosch als cultureel hart van Brabant, nu bezet
- Setup voor Limburgers-contact (zij kennen underground tactics)
- Jeroen Bosch referentie (cultureel)

---

### Missie 5: "Heuvelland Diplomatie"

**Locatie**: Zuid-Limburg — heuvels, mergelgrotten, wijngaarden
**Geschatte speelduur**: 30 min (Easy) / 40 min (Medium) / 50 min (Hard)

**Briefing tekst**:
> *De Limburgers. Mysterieus, nors, en beroemd om hun vlaai. Ze leven in de heuvels en grotten van het zuiden, en ze vertrouwen niemand — vooral geen Brabanders.*
>
> *Maar de documenten uit Den Bosch laten zien dat Project Gentrificatie ook HUN grotten bedreigt. Reis naar het Heuvelland, overleef hun tests, en overtuig de Mijnbaas om een alliantie te vormen.*

**Objectives**:
- **Primair**: Bouw een voorpost in het Heuvelland (Boerderij + Cafe + minstens 10 units)
- **Primair**: Overleef 3 golven Limburgse "tests" (ze vallen je aan om te kijken of je sterk genoeg bent als bondgenoot)
- **Primair**: Na de tests: stuur De Prins van Brabansen naar de Limburgse Grottentempel voor diplomatiek overleg
- **Bonus**: Vernietig geen enkel Limburgs gebouw tijdens de tests (zij vallen JOU aan, niet andersom) — unlocks: Limburgse Vlaai resource bonus (+20% resource gather speed missie 9)
- **Bonus**: Versla alle 3 golven zonder unit verlies (unlocks: "Onoverwinnelijke Gezelligheid" achievement)

**Map layout**:
- **Grootte**: 256x256 (groot)
- **Start positie**: Westen — vlak terrein, 2 Gold Mines, boomclusters
- **Limburgse positie**: Oosten — in de heuvels. Grottentempel (groot neutraal gebouw, niet aanvalbaar). 3 Grotten verspreid over de oostelijke heuvelkam.
- **Speciale features**: Heuvelachtig terrein (hoogteverschillen beinvloeden sight range: +3 per heuvel). Mergelgrotten als decoratie. Wijngaarden (special resource node: +2 Bier per 10s als je er een Boer naartoe stuurt). Smalle bergpassen als chokepoints.
- **Atmosfeer**: Mistig, mysterieus, groen heuvellandschap

**Beschikbare units/gebouwen**:
- Units: Boer, Carnavalvierder, Kansen, Boerinne, De Prins van Brabansen (hero, unlocked deze missie!)
- Gebouwen: Alle Tier 1 + Kermistent (Tier 2 unlock)

**Vijandelijke samenstelling** (Limburgse "tests" — scripted golven):
- **Golf 1 (minuut 5)**: 6 Schutterij + 2 Vlaaienwerpers. Narrator: *"De Limburgers testen je. Verdedig je, maar vernietig hun thuisbasis niet — dat zou onbeleefd zijn."*
- **Golf 2 (minuut 10)**: 4 Mergelridders + 4 Schutterij + 1 Mijnrat (plaatst een mijn bij je basis).
- **Golf 3 (minuut 15)**: De Mijnbaas (hero) + 8 gemixte units. De Mijnbaas is NIET te doden — hij trekt zich terug bij 50% HP.
- Na Golf 3: De Mijnbaas stopt het gevecht: *"Genoeg. Jullie zijn sterker dan ik dacht. Kom naar de Grottentempel. We praten."*

**Trigger events**:
1. **Start**: Camera pant over het Limburgse landschap. Narrator: *"Het Heuvelland. Hier hebben de Limburgers eeuwenlang de buitenwereld buitengehouden. Letterlijk."*
2. **Bij Prins spawn**: *"De Prins van Brabansen is gearriveerd! Een ware aanvoerder voor ons volk."* Tutorial over hero abilities.
3. **Golf 1**: Trompetgeschal uit de heuvels. Limburgse Schutterij marcheert.
4. **Golf 2**: Grond trilt. Mergelridders komen uit de grotten.
5. **Golf 3**: De Mijnbaas verschijnt met een leger. *"Als jullie DIT overleven, geloof ik dat jullie de Randstad aankunnen."*
6. **Diplomatiek overleg**: Cutscene bij de Grottentempel. De Mijnbaas toont zijn eigen bewijs van Randstad-inmenging. *"Ze willen onze grotten vullen met... een PARKEERGARAGE."*

**Difficulty scaling**:
- **Easy**: Golven zijn 30% kleiner. 3 minuten extra tussen golven. Prins start met full abilities.
- **Medium**: Standaard.
- **Hard**: Golven zijn 30% groter. 2 minuten minder tussen golven. Golf 3 bevat extra Mijnratten die mijnen leggen.

**Victory condition**: Alle 3 golven overleefd + Prins bij Grottentempel.
**Defeat condition**: Boerderij vernietigd OF Prins sterft (voor hero revive: hij mag niet dood zijn na golf 3).

**Nieuwe mechanics geintroduceerd**:
- Hero unit (De Prins van Brabansen) met abilities
- Survival waves mechanic
- Hoogteterrein effecten op sight range
- Diplomatieke missie-structuur (vecht, dan praat)
- Introductie Limburgse units als vijanden (die later bondgenoten worden)

**Story beats**:
- Introductie van de Limburgers als factie
- De Mijnbaas als memorabele NPC — nors maar eerlijk
- Ontdekking: de Randstad bedreigt ook Limburg
- Alliantie gevormd — maar nog fragiel
- Humor: *"Een parkeergarage? In MIJN mergelgrot? Die is 300 jaar oud!"*

---

### Missie 6: "De Boerenopstand"

**Locatie**: Het Groene Woud — uitgestrekt bosgebied tussen Eindhoven, Tilburg en Den Bosch
**Geschatte speelduur**: 30 min (Easy) / 40 min (Medium) / 50 min (Hard)

**Briefing tekst**:
> *De boeren van het Groene Woud zijn woedend. De Randstad heeft hun landbouwgrond geconfisqueerd voor een nieuw "woonwijk-concept". Tractors zijn in beslag genomen, koeien onteigend.*
>
> *Leid de boerenopstand. Bevrijd de confisqueerde tractors, rekruteer de opstandige boeren, en verdrijf de Randstad-garnizoensbasis uit het Groene Woud.*

**Objectives**:
- **Primair**: Bevrijd 3 confisqueerde tractors (neutrale gebouwen met 4 bewakers elk — vernietig bewakers, claim tractor)
- **Primair**: Rekruteer minstens 20 units (inclusief 3 Tractorrijders)
- **Primair**: Vernietig de Randstad-garnizoensbasis
- **Bonus**: Bevrijd alle 3 tractors binnen 10 minuten (unlocks: Gouden Tractor skin voor Tractorrijders)
- **Bonus**: Gebruik de Prins "Opstand" ability 3x in dezelfde missie (unlocks: Boer van Brabansen hero early unlock hint)

**Map layout**:
- **Grootte**: 256x256 (groot)
- **Start positie**: Zuidwesten — Grote basis met Boerderij, Cafe, Kermistent. 6 Boeren, 4 Carnavalvierders, Prins.
- **Vijand positie**: Noorden — middelgrote Randstad-basis (Hoofdkantoor Tier 2, Vergaderzaal, Coworking Space, Parkeergarage, 2 Vinex-wijken)
- **3 Tractor-locaties**: Verspreid over het midden (oost, west, centraal). Elk bewaakt door 4 Managers.
- **Speciale features**: Dicht bos (visuele dekking, beperkt zicht). Open velden voor grote gevechten. Twee rivieren met bruggen (chokepoints). Boerderij-ruines als decoratie (verhaal: onteigend).
- **Atmosfeer**: Herfst, vallende bladeren, rook van brandende boerderijen in de verte

**Beschikbare units/gebouwen**:
- Units: Boer, Carnavalvierder, Kansen, Boerinne, Prins, Tractorrijder (unlocked na bevrijd tractor), Frituurmeester (Tier 3, beschikbaar na Feestzaal)
- Gebouwen: Alle Tier 1 + Kermistent + Feestzaal (unlocked deze missie)

**Vijandelijke samenstelling**:
- Garnizoensbasis: Hoofdkantoor Tier 2, 10 Managers, 6 Consultants, 2 Corporate Advocaten, 2 HR-medewerkers
- 3 tractor-bewakingsgroepen: elk 4 Managers
- Patrouillegroep: 4 Managers + 1 Hipster (scouten naar speler)
- AI bouwt actief: 1 Manager per 20s, 1 Consultant per 30s
- Na 15 minuten: AI stuurt aanvalsgolf van 8 Managers + 2 Corporate Advocaten

**Trigger events**:
1. **Start**: Boer NPC: *"Opzichter! Ze hebben mijn tractor afgepakt! Mijn TRACTOR! Dat is alsof je een man z'n ziel afpakt!"*
2. **Eerste tractor bevrijd**: *"TRACTORRIJDERS staan nu tot je beschikking!"* Tutorial over Tractorrijder abilities (Volgas charge).
3. **Alle tractors bevrijd**: Narrator: *"Het Groene Woud brult. De boeren zijn verenigd. De Randstad heeft geen idee wat er op ze afkomt."*
4. **Bij nadering garnizoen**: Corporate Advocaat: *"U betreedt verboden terrein! Hier is het bestemmingsplan!"* Prins: *"Steek dat plan maar waar de zon niet schijnt."*
5. **Garnizoen vernietigd**: Boerenfeest-cutscene. Frituurmeester bakt de eerste friet van de overwinning.

**Difficulty scaling**:
- **Easy**: Tractor-bewakers zijn 3 per locatie. AI bouwt langzamer (1 per 30s). Aanvalsgolf na 20 minuten.
- **Medium**: Standaard.
- **Hard**: Tractor-bewakers zijn 5 per locatie + 1 Corporate Advocaat. AI bouwt sneller (1 per 15s). Aanvalsgolf na 10 minuten. Twee aanvalsgolven.

**Victory condition**: Alle 3 tractors bevrijd + Garnizoensbasis Hoofdkantoor vernietigd.
**Defeat condition**: Eigen Boerderij vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Tractorrijder unit + Volgas charge ability
- Tier 2 gebouwen (Feestzaal, Kermistent upgrades)
- Frituurmeester siege unit
- Claim/bevrijd mechanic (neutraal object → eigen unit na clearing)
- AI counter-attacks op timer

**Story beats**:
- Boerenwoede als emotionele motor
- Tractorrijder als iconische Brabantse eenheid
- De Randstad's arrogantie ("bestemmingsplan" als wapen)
- Eerste grote militaire overwinning

---

### Missie 7: "Carnaval in Oorlogstijd"

**Locatie**: Oeteldonk (Den Bosch) — de binnenstad tijdens carnaval
**Geschatte speelduur**: 25 min (Easy) / 35 min (Medium) / 45 min (Hard)

**Briefing tekst**:
> *Het is februari. En in Brabant stopt ALLES voor carnaval. Zelfs een oorlog.*
>
> *Maar de Randstad heeft andere plannen. Ze willen de carnavalsoptocht saboteren door de Praalwagens te vernietigen en de stad te bezetten terwijl iedereen feest viert. Bescherm het carnaval en laat zien dat Brabant zelfs feestend kan vechten.*

**Objectives**:
- **Primair**: Bescherm de 3 Praalwagens terwijl ze door de stad rijden (optocht-route: noord → oost → zuid → west → eindpunt markt)
- **Primair**: Bouw de Gezelligheid-meter op tot 100 (passief door units bij elkaar te houden + Dorpsweide)
- **Primair**: Activeer "Carnavalsrage" (factie-ability) minstens 1 keer
- **Bonus**: Alle 3 Praalwagens overleven de hele route (unlocks: Praalwagen siege unit)
- **Bonus**: Versla 50 vijandelijke units tijdens carnaval (unlocks: "Alaaf!" title)

**Map layout**:
- **Grootte**: 192x192 (stedelijk)
- **Start positie**: Centrum — de Markt. Boerderij + volledige Tier 1/2 basis. 12 gemixte units + Prins + Muzikansen.
- **Vijand posities**: 3 Randstad-aanvalspunten (noord, oost, west) — kleine bases buiten de stad
- **Speciale features**: Straten als paden (stadslayout met huizen als obstakels). Praalwagen-route duidelijk gemarkeerd. Confetti op de grond (decoratief). Carnavalsmuziek speelt continu. Dorpsweide in het centrum (Gezelligheid generator). Stadsmuren met poorten.
- **Praalwagens**: NPC-units die langzaam de route volgen. 500 HP elk. Kunnen NIET aanvallen.
- **Atmosfeer**: Feestelijk, kleurrijk, maar met spanning — het is carnaval EN oorlog

**Beschikbare units/gebouwen**:
- Units: Alle Tier 1 + Tier 2 (Muzikansen, Tractorrijder). Praalwagen (Tier 3 siege) unlocked na succesvolle bescherming.
- Gebouwen: Alle inclusief Dorpsweide (Gezelligheid burst generator)

**Vijandelijke samenstelling**:
- 3 aanvalsbases: elk 1 Vergaderzaal + Coworking Space
- **Golf 1 (minuut 3, noorden)**: 8 Managers + 2 Hipsters — target: Praalwagen 1
- **Golf 2 (minuut 7, oosten)**: 6 Managers + 3 Consultants + 2 Influencers — target: Praalwagen 2
- **Golf 3 (minuut 12, westen)**: 10 Managers + 4 Corporate Advocaten + 1 Vastgoedmakelaar — target: Praalwagen 3
- **Finale golf (minuut 18)**: Alle 3 bases tegelijk: totaal 18 units + De Politicus (hero)

**Trigger events**:
1. **Start**: Carnavalsmuziek begint. Prins: *"ALAAF! Vandaag vieren we carnaval! En NIEMAND houdt ons tegen!"*
2. **Golf 1**: Alarm in het noorden. Manager: *"Orde en rust! Dit evenement heeft geen vergunning!"*
3. **Gezelligheid 100 bereikt**: *"De Gezelligheid is op z'n hoogst! Carnavalsrage is beschikbaar!"* Tutorial over factie-ability.
4. **Carnavalsrage geactiveerd**: Epische slow-motion moment. Alle units gloeien oranje. Confetti-explosie. *"ALAAF!"* schreeuwt het hele leger.
5. **Finale golf**: De Politicus arriveert: *"Genoeg! In naam van de Tweede Kamer eisen wij orde!"* Prins: *"In naam van BRABANT eisen wij een biertje!"*
6. **Victory**: De Praalwagens bereiken de Markt. Massaal feest. Narrator: *"En zo bewees Brabant dat je kunt feesten EN vechten. Tegelijkertijd."*

**Difficulty scaling**:
- **Easy**: Praalwagens hebben 700 HP. Golven zijn 30% kleiner. Meer tijd tussen golven.
- **Medium**: Standaard.
- **Hard**: Praalwagens hebben 350 HP. Golven zijn 40% groter. Minder tijd tussen golven. Finale golf eerder (minuut 15).

**Victory condition**: Minstens 1 Praalwagen bereikt de Markt + Carnavalsrage minstens 1x geactiveerd.
**Defeat condition**: Alle 3 Praalwagens vernietigd OF eigen Boerderij vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Gezelligheid-meter en Carnavalsrage (factie-ability) volledig uitgelegd
- Dorpsweide-gebouw
- Muzikansen-unit (buffer/debuffer)
- Multi-directional verdediging (3 aanvalsrichtingen tegelijk)
- Praalwagen siege unit unlocked na voltooiing

**Story beats**:
- Carnaval als cultureel hart van Brabant, zelfs in oorlogstijd
- Eerste gebruik van Carnavalsrage — emotioneel hoogtepunt
- De Politicus als antagonist — bureaucratie vs feest
- Thema: Brabantse identiteit kan niet onderdrukt worden

---

### Missie 8: "Verraad in Oeteldonk"

**Locatie**: Den Bosch — de binnenstad, nu deels gegentrifieerd
**Geschatte speelduur**: 25 min (Easy) / 35 min (Medium) / 45 min (Hard)

**Briefing tekst**:
> *Na het carnaval keert de harde realiteit terug. De Randstad heeft Den Bosch stilletjes verder gegentrifieerd. Hele wijken zijn veranderd — ambachtelijke bakkers vervangen door Starbucks, bruin cafes door Yoga-studio's.*
>
> *Maar het ergste: er is een verrader in onze gelederen. Iemand heeft de Randstad onze posities doorgegeven. De Prins is in een hinderlaag gelokt en gevangen genomen. RED HEM.*

**Objectives**:
- **Primair**: Bevrijd De Prins van Brabansen uit de Randstad-gevangenis (zwaar versterkt gebouw in het centrum)
- **Primair**: Identificeer de verrader (3 verdachte NPC-units op de map — onderzoek ze door er een Kansen naartoe te sturen)
- **Primair**: Vernietig de "Gentrificatie-machine" (speciaal gebouw dat elke 60 seconden een neutraal gebouw omzet naar Randstad)
- **Bonus**: Bevrijd de Prins binnen 10 minuten (unlocks: Prins "Bevrijder" voice pack)
- **Bonus**: Red alle 3 nog niet-gegentrifieerde wijken (neutrale gebouwen die de Gentrificatie-machine target)

**Map layout**:
- **Grootte**: 224x224
- **Start positie**: Zuidwesten — versterkte buitenpost. Geen Town Hall! Beperkte basis (Cafe + Kermistent + 10 units). Resources: 300/200 vast.
- **Vijand positie**: Centrum (gevangenis) + noordoosten (Gentrificatie-machine + Randstad-basis)
- **Speciale features**: Den Bosch stadscentrum — mix van Brabantse en Randstad-gebouwen. Gegentrifieerde wijken (Randstad-kleur, produceren voor de vijand). Niet-gegentrifieerde wijken (goud/oranje, neutraal — als de machine ze target, worden ze vijandig). De 3 verdachten staan op verschillende plekken in de stad. Gevangenis: zwaar versterkt (2000 HP, 2 Kantoor-torens, 6 bewakers).
- **Atmosfeer**: Regenachtig, somber, stadsgeluiden vermengd met Randstad-corporate muziek

**Beschikbare units/gebouwen**:
- Units: Boer, Carnavalvierder, Kansen (3 extra voor onderzoek), Boerinne, Tractorrijder, Muzikansen. GEEN Prins (gevangen).
- Gebouwen: Cafe, Kermistent, Boerenhoeve. Geen Town Hall (kan geen nieuwe basis bouwen).

**Vijandelijke samenstelling**:
- Gevangenis: 2000 HP, 2 Kantoor-torens (defense), 6 Managers + 2 Corporate Advocaten
- Gentrificatie-machine: 1500 HP, bewaakt door 4 Managers + 1 Vastgoedmakelaar
- Randstad-basis: Hoofdkantoor Tier 2, actieve productie (1 unit/20s)
- Patrouilles: 3 groepjes van 3 Managers door de stad

**Trigger events**:
1. **Start**: Narrator: *"De regen valt op Den Bosch als tranen. De Prins is gevangen. En ergens in deze stad loopt een verrader vrij rond."*
2. **Verdachte 1 onderzocht** (bakker in het westen): Kansen rapporteert: *"Hij is onschuldig. Maar hij vertelt dat de verrader LINKEDIN gebruikt."*
3. **Verdachte 2 onderzocht** (kroegbaas in het midden): *"Niet hij. Maar hij zag iemand stiekem naar de Kantoor-toren lopen. Iemand die HAVERMOUTMELK dronk."*
4. **Verdachte 3 onderzocht** (raadslid in het oosten): *"HIJ IS HET! Hij heeft een Randstad-telefoon! Hij... hij is een undercover Consultant!"* De verrader onthult zich als Randstad-unit en vlucht naar de Randstad-basis.
5. **Prins bevrijd**: Prins breekt uit gevangenis. *"Dankjewansen! En die verrader... die mag z'n LinkedIn-profiel updaten naar 'werkloos'."*
6. **Gentrificatie-machine vernietigd**: Explosie. Alle gegentrifieerde gebouwen keren terug naar neutraal. *"De yoga-studio is weer een bruin cafe!"*

**Difficulty scaling**:
- **Easy**: Gevangenis heeft 1500 HP, 1 Kantoor-toren, 4 bewakers. Machine target langzamer (elke 90s).
- **Medium**: Standaard.
- **Hard**: Gevangenis heeft 2500 HP. 3 Kantoor-torens. Machine target sneller (elke 45s). Extra patrouilles.

**Victory condition**: Prins bevrijd + Verrader ontmaskerd + Gentrificatie-machine vernietigd.
**Defeat condition**: Alle eigen units dood (geen Town Hall om te rebuilden) OF alle neutrale wijken gegentrifieerd.

**Nieuwe mechanics geintroduceerd**:
- Geen Town Hall scenario (beperkte resources, geen herbouw)
- Onderzoeksmechanic (stuur scouts naar verdachten)
- Gentrificatie als vijandig terrein-effect
- Prioriteitskeuze (Prins redden vs. machine stoppen — beide urgent)

**Story beats**:
- Verraad als emotioneel dieptepunt
- De Randstad's meest sinistere plan: culturele uitwissing via gentrificatie
- Prins als geliefde NPC die je MOET redden
- De verrader als Consultant — perfect in-character voor de Randstad

---

### Missie 9: "De Mijn van Waarheid"

**Locatie**: Limburgse mergelgrotten — ondergronds netwerk
**Geschatte speelduur**: 30 min (Easy) / 40 min (Medium) / 50 min (Hard)

**Briefing tekst**:
> *De Mijnbaas heeft bericht gestuurd: de Randstad heeft een legermacht naar de mergelgrotten gestuurd om de Limburgse tunnels te bezetten. Als de tunnels vallen, verliest Brabant zijn enige verborgen route naar het noorden.*
>
> *Vecht zij aan zij met de Limburgers. Voor het eerst in de geschiedenis strijden Brabant en Limburg samen. Verdedig de grotten en ontdek het geheim dat diep in de Mijn van Waarheid verborgen ligt.*

**Objectives**:
- **Primair**: Verdedig de 4 Grot-ingangen tegen 5 golven Randstad-aanvallers (alliantie-missie met Limburgse AI-bondgenoot)
- **Primair**: Stuur een expeditie diep de Mijn van Waarheid in (speciale dungeon-achtige zone in het zuiden)
- **Primair**: Ontdek het Geheim (item aan het einde van de mijn)
- **Bonus**: Verlies geen enkele Grot-ingang (unlocks: Limburgse tunnels beschikbaar in Missie 11)
- **Bonus**: Vind de verborgen Vlaaischat (50 stuks vlaai = 500 bonus resources)

**Map layout**:
- **Grootte**: 256x256 (complex)
- **Start positie**: Centrum — gezamenlijke basis met Limburgers. Boerderij + Limburgse Grottentempel naast elkaar. Gedeelde resource nodes.
- **Vijand posities**: Alle 4 randen van de map — Randstad-troepen marcheren naar het centrum
- **Speciale features**: 4 Grot-ingangen (noord, oost, zuid, west) — elk een chokepoint met verdedigbare posities. Ondergrondse tunnels verbinden de grotten. Mijn van Waarheid: lineaire "dungeon" zone in het zuidoosten, met steeds sterkere vijanden (Managers → Advocaten → Vastgoedmakelaars). Limburgse NPC-units helpen met verdediging (AI-gecontroleerd bondgenoot).
- **Atmosfeer**: Ondergronds, fakkels, echoende geluiden, druppelend water

**Beschikbare units/gebouwen**:
- Units: Alle Brabandse units t/m Tier 3 (inclusief Praalwagen). Prins + Boer van Brabansen (2e hero, unlocked deze missie!).
- Gebouwen: Alle Brabandse gebouwen. Frietkar (mobiele healer, unlocked).
- Limburgse bondgenoot (AI): 8 Schutterij, 4 Mergelridders, 2 Vlaaienwerpers, De Mijnbaas (hero).

**Vijandelijke samenstelling**:
- **Golf 1 (minuut 3)**: 12 Managers + 4 Consultants (noorden + oosten)
- **Golf 2 (minuut 7)**: 10 Managers + 4 HR-medewerkers + 2 Hipsters (alle richtingen)
- **Golf 3 (minuut 12)**: 8 Corporate Advocaten + 6 Managers + 2 Influencers (westen + zuiden)
- **Golf 4 (minuut 17)**: De CEO (hero) + 15 gemixte units (noorden, grote push)
- **Golf 5 (minuut 22)**: Alles tegelijk — 20+ units van alle kanten
- **Mijn van Waarheid (dungeon)**: 5 kamers met steeds sterkere bewakers. Eindkamer: 2 Corporate Advocaten + 1 Vastgoedmakelaar

**Trigger events**:
1. **Start**: Mijnbaas: *"Brabansen. Vandaag vechten we samen. Probeer alsjeblieft niet teveel herrie te maken in mijn grotten."*
2. **Boer van Brabansen arriveert**: *"Nog een held voor Brabant! De Boer van Brabansen — sterk als een os, wijs als... nou ja, wijs genoeg."*
3. **Golf 4 (CEO verschijnt)**: CEO: *"Deze grotten worden het fundament van mijn nieuwe kantoorpand. 40 verdiepingen. Open werkplekken. Geen ramen."*
4. **Mijn van Waarheid bereikt**: Diep in de mijn: een oud altaar met een inscriptie. *"Hier werd het eerste Worstenbroodje gebakken, 1000 jaar geleden. En hier ligt de Receptuur — het recept dat het Gouden Worstenbroodje zijn kracht geeft."*
5. **Victory**: Mijnbaas: *"Jullie hebben ons gered. Limburg staat achter Brabant. Tot de dood."* Prins: *"Of tot de vlaai op is. Wat het eerst komt."*

**Difficulty scaling**:
- **Easy**: 4 golven in plaats van 5. Golven 25% kleiner. Limburgse bondgenoot sterker (+20% stats).
- **Medium**: Standaard.
- **Hard**: 6 golven. Golven 30% groter. Limburgse bondgenoot zwakker (-20% stats). CEO heeft Vijandige Overname beschikbaar.

**Victory condition**: Alle 5 golven overleefd + Geheim in de Mijn ontdekt.
**Defeat condition**: Alle 4 Grot-ingangen verloren (vijand verovert ze) OF eigen Boerderij vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Alliantie-gameplay (AI bondgenoot die meevecht)
- Tweede hero (Boer van Brabansen) — keuze in unit compositie
- Frietkar (mobiele healer)
- Dungeon-exploration als subzone binnen een RTS-missie
- Multi-front verdediging (4 richtingen)

**Story beats**:
- Brabant en Limburg zij aan zij — historisch moment
- De Receptuur als MacGuffin — het geheim achter het Gouden Worstenbroodje
- De CEO als directe antagonist, niet meer abstract
- Verdieping van de Brabants-Limburgse relatie

---

### Missie 10: "Brainport Sabotage"

**Locatie**: Eindhoven — de High Tech Campus en omgeving
**Geschatte speelduur**: 25 min (Easy) / 35 min (Medium) / 45 min (Hard)

**Briefing tekst**:
> *Eindhoven. De slimste regio van Nederland. En de Randstad heeft de High Tech Campus overgenomen om hun ultieme wapen te bouwen: de "Eindeloze Vergadermachine" — een apparaat dat IEDEREEN in een permanente vergadering kan opsluiten.*
>
> *Infiltreer de campus, saboteer de machine, en voorkom dat Brabant voor altijd vast komt te zitten in een vergadering zonder agenda.*

**Objectives**:
- **Primair**: Bouw een basis in de buitenwijken van Eindhoven
- **Primair**: Vernietig 3 Vergadermachine-onderdelen (verspreid over de campus, elk zwaar bewaakt)
- **Primair**: Vernietig de Vergadermachine zelf (centraal gebouw, 3000 HP, onkwetsbaar tot alle 3 onderdelen vernietigd)
- **Bonus**: Bevriend de Belgische friettent (NPC gebouw in het zuiden — stuur 100 resources voor permanent Belgisch frietkraamhouder-reinforcement)
- **Bonus**: Vernietig de Vergadermachine in 1 Carnavalsrage-push (unlocks: "Brainport Bevrijder" medal)

**Map layout**:
- **Grootte**: 256x256 (groot, stedelijk + campus)
- **Start positie**: Zuidwesten — buitenwijk. 2 Gold Mines, beperkte bomen.
- **Vijand positie**: Centrum-Oost — High Tech Campus. Zwaar versterkt met Kantoor-torens en muren.
- **Speciale features**: De High Tech Campus als versterkte zone (2 lagen muren, 4 Kantoor-torens). 3 Vergadermachine-onderdelen in aparte "labs" (noord, oost, west van de campus). De Vergadermachine zelf: centraal, met een AoE-aura die elke 45s alle units in radius 20 voor 5s stunt ("vergader-pulse"). Belgische friettent in het zuiden. Stadswegen als paden.
- **Atmosfeer**: Modern, technologisch, contrast tussen Brabantse basis en Randstad-campus

**Beschikbare units/gebouwen**:
- Units: Alle Brabandse units. Beide heroes beschikbaar.
- Gebouwen: Alle Brabandse gebouwen inclusief Dorpsweide.

**Vijandelijke samenstelling**:
- Campus-basis: Hoofdkantoor Tier 3 (Corporate Tower), 2 Vergaderzalen, 2 Parkeergarages, 3 Kantoor-torens, 4 Vinex-wijken
- Campus-leger: 12 Managers, 8 Consultants, 6 Corporate Advocaten, 4 HR-medewerkers, 2 Influencers, 2 Vastgoedmakelaars
- De CEO (hero) verdedigt de campus
- De Politicus (hero) patrouilleert de buitenwijken
- AI produceert continu (1 unit/15s)
- De Vergadermachine stunt periodiek (elke 45 seconden)

**Trigger events**:
1. **Start**: Narrator: *"De Randstad noemde Eindhoven ooit 'een dorp met een lampenfabriek'. Nu hebben ze de slimste regio van Nederland gekaapt voor hun eigen doeleinden."*
2. **Eerste onderdeel vernietigd**: *"De Vergadermachine begint te haperen! Nog 2 onderdelen!"*
3. **Vergader-pulse ervaren**: Alle units stoppen 5 seconden. Prins: *"Wat... wat gebeurt er? Ik kan me niet bewegen! Het is alsof ik in een VERGADERING zit!"*
4. **Alle onderdelen vernietigd**: Vergadermachine wordt kwetsbaar. Narrator: *"De machine staat bloot! VAL AAN!"*
5. **Machine vernietigd**: Epische explosie. PowerPoint-slides regenen uit de lucht. CEO rent weg: *"Dit is NIET wat we besproken hadden in de kwartaalreview!"*

**Difficulty scaling**:
- **Easy**: Machine-onderdelen hebben 1000 HP. Vergader-pulse elke 60s. CEO niet aanwezig.
- **Medium**: Standaard.
- **Hard**: Machine-onderdelen hebben 2000 HP. Vergader-pulse elke 30s. Beide heroes verdedigen. Extra Kantoor-torens.

**Victory condition**: Vergadermachine en alle onderdelen vernietigd.
**Defeat condition**: Eigen Boerderij vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Multi-target destructie (3 onderdelen + hoofddoel)
- Periodieke AoE stun (vergader-pulse — leer de timing)
- Belgisch reinforcement (diplomatie-gerelateerd)
- Volledige Tier 3 gameplay

**Story beats**:
- De Eindeloze Vergadermachine als absurd maar gevaarlijk wapen
- Eindhoven als symbool: Brabantse innovatie gekaapt door Randstad
- CEO als directe vijand in het veld
- Humor: vergader-mechanics als wapen

---

### Missie 11: "De Slag om Brabant"

**Locatie**: Heel Brabant — enorme map met meerdere regio's
**Geschatte speelduur**: 40 min (Easy) / 55 min (Medium) / 70 min (Hard)

**Briefing tekst**:
> *Het is zover. De Randstad stuurt hun volledige legermacht naar Brabant. Niet meer stukje bij beetje — dit is een totale invasie. Vanaf de A2 marcheren eindeloze kolonnes Managers, Consultants en Corporate Advocaten richting het zuiden.*
>
> *Maar Brabant staat niet alleen. De Limburgers bewaken het oosten. De Belgen sluiten de zuidgrens. En jij? Jij leidt de verdediging vanuit het hart van Brabant.*
>
> *Dit is de slag die alles beslist. Verlies, en Brabant wordt een Vinex-wijk. Win, en de weg naar de Randstad ligt open.*

**Objectives**:
- **Primair**: Verdedig 3 Brabantse steden (Den Bosch, Tilburg, Eindhoven — elk een Town Hall met 2000 HP)
- **Primair**: Versla de 4 Randstad-legervleugels (noord, noordoost, noordwest, centraal)
- **Primair**: Vernietig het Randstad Veldkwartier (mobiel Hoofdkantoor in het noorden, 3000 HP)
- **Bonus**: Alle 3 steden overleven met >50% HP (unlocks: "Brabant Onverwoestbaar" title + Praalwagen gold skin)
- **Bonus**: Win met minder dan 30 unit verliezen (unlocks: "Meester Strateeg" medal)

**Map layout**:
- **Grootte**: 384x384 (XL — de grootste campaign map)
- **Start positie**: Centrum-Zuid — Den Bosch. Volledige Tier 3 basis. 30 start-units.
- **Tilburg**: Zuidwest. AI-gecontroleerde Brabantse stad. 15 defensieve units.
- **Eindhoven**: Zuidoost. AI-gecontroleerde Brabantse stad. 15 defensieve units.
- **Limburgse bondgenoot**: Oost. AI-gecontroleerde Limburgse basis. 12 units + Mijnbaas hero. Bewaakt de oostflank.
- **Belgische bondgenoot**: Zuid. AI-gecontroleerde Belgische basis. 10 units. Bewaakt de zuidgrens.
- **Randstad**: Noorden — 4 legervleugels + Veldkwartier in het centrum-noord.
- **Speciale features**: Autosnelwegen (A2, A58) als snelle bewegingsroutes (+30% speed). Rivieren (Maas, Dommel) als natuurlijke verdedigingslinies. Bruggen als chokepoints. Heuvelachtig terrein in het oosten (Limburg).

**Beschikbare units/gebouwen**:
- Units: Alle Brabandse units. Beide heroes. Limburgse en Belgische bondgenoten (AI).
- Gebouwen: Alle Brabandse gebouwen. De 3 steden hebben reeds bestaande structuren.

**Vijandelijke samenstelling**:
- **Legervleugel Noord (A2)**: 20 Managers, 8 Corporate Advocaten, 4 Vastgoedmakelaars, De CEO
- **Legervleugel Noordoost**: 15 Managers, 6 Consultants, 4 HR-medewerkers, 3 Influencers
- **Legervleugel Noordwest**: 12 Managers, 8 Hipsters (scout + gentrificatie), 4 Consultants
- **Legervleugel Centraal**: De Politicus + 10 Managers + 6 Corporate Advocaten (reserveleger, activeert na 15 min)
- **Veldkwartier**: 3000 HP, 4 Kantoor-torens, continue productie (1 unit/10s)
- Totaal: ~80+ vijandelijke units (de grootste battle in de campaign)

**Trigger events**:
1. **Start**: Epische cutscene — camera vliegt over heel Brabant. Narrator: *"Ze komen. Vanaf de snelwegen, door de polders, over de rivieren. De Randstad stuurt alles wat ze hebben."*
2. **Minuut 5**: Noordelijke vleugel bereikt Den Bosch. Alarm. *"Ze zijn er! VERDEDIG DE STAD!"*
3. **Minuut 8**: Noordoostelijke vleugel bedreigt Eindhoven. Mijnbaas: *"Wij houden het oosten. Reken op ons."*
4. **Minuut 12**: Noordwestelijke vleugel nadert Tilburg. Belgische bondgenoot: *"We sturen versterkingen! Met extra frieten!"*
5. **Minuut 15**: Centraal reserveleger activeert. Politicus: *"Tijd voor het einddebat."*
6. **Veldkwartier onder aanval**: CEO (als nog leeft): *"Dit kantoor is onverwoestbaar! Het is gebouwd op SYNERGIE!"*
7. **Victory**: Alle vleugels verslagen, Veldkwartier vernietigd. Prins: *"De weg naar de Randstad is open. Het is tijd om ons Worstenbroodje terug te halen."*

**Difficulty scaling**:
- **Easy**: Vijandelijke units -30%. Bondgenoten +30%. Veldkwartier 2000 HP. Productie 1/15s.
- **Medium**: Standaard.
- **Hard**: Vijandelijke units +40%. Bondgenoten -20%. Veldkwartier 4000 HP. Productie 1/8s. Extra legervleugel vanuit het westen.

**Victory condition**: Alle 3 steden overleven (minstens 1 HP) + Veldkwartier vernietigd.
**Defeat condition**: Een van de 3 steden vernietigd (Town Hall op 0 HP).

**Nieuwe mechanics geintroduceerd**:
- Grootschalige multi-front oorlog
- Meerdere AI-bondgenoten tegelijk
- Autosnelwegen als strategisch terreinfeature
- Stadsverdediging op macroniveau

**Story beats**:
- Het keerpunt van de oorlog
- Brabant, Limburg en Belgie SAMEN — emotioneel hoogtepunt
- De Randstad op volle kracht — laat de schaal van de dreiging zien
- Setup voor de finale: de weg naar de Randstad is open

---

### Missie 12: "Het Gouden Worstenbroodje" (Finale)

**Locatie**: De Randstad — Amsterdam/Den Haag hybride metropool
**Geschatte speelduur**: 35 min (Easy) / 50 min (Medium) / 65 min (Hard)

**Briefing tekst**:
> *Dit is het. De Randstad zelf. Een stad van glas en staal, waar de zon nauwelijks doorheen komt. Ergens in deze betonnen jungle ligt het Gouden Worstenbroodje — opgesloten in de kluis van het Corporate Tower, het 40-verdiepingen-hoge hoofdkantoor van de Randstad Ontwikkelingsmaatschappij.*
>
> *Je leger marcheert. De Limburgers flanken. De Belgen brengen de frieten. Dit is het uur van Brabant.*
>
> *Haal het Worstenbroodje terug. Beeindig Project Gentrificatie. En laat de Randstad weten: Brabant buigt niet.*

**Objectives**:
- **Primair**: Bouw een aanvalsbasis aan de rand van de Randstad
- **Primair**: Vernietig het Corporate Tower (Randstad Tier 3 Town Hall, 5000 HP, bewaakt door ALLES)
- **Primair**: Versla De CEO (hero boss fight — 3 fasen, zie hieronder)
- **Primair**: Claim het Gouden Worstenbroodje (kanaliseer 15 seconden bij het verwoeste Corporate Tower)
- **Bonus**: Versla ook De Politicus (unlocks: "Totale Overwinning" achievement)
- **Bonus**: Win met 0 hero deaths (unlocks: geheime epiloog cutscene)

**Map layout**:
- **Grootte**: 320x320 (XL)
- **Start positie**: Zuiden — open poldergebied (de grens van Brabant met de Randstad). Ruimte voor basis.
- **Vijand positie**: Noorden + centrum — de Randstad metropool. 3 verdedigingsringen.
- **Speciale features**:
  - **Ring 1 (buitenwijken)**: Vinex-wijken, lichte verdediging, 2 Kantoor-torens
  - **Ring 2 (bedrijventerrein)**: Coworking Spaces, Starbucks (resource gen), zwaardere verdediging, 4 Kantoor-torens
  - **Ring 3 (centrum)**: Corporate Tower (40 verdiepingen, 5000 HP), Vergaderzalen, Parkeergarages, 6 Kantoor-torens
  - Limburgse bondgenoot: flankeert vanuit het oosten (AI)
  - Belgische bondgenoot: flankeert vanuit het westen (AI)
  - Autosnelweg A2 als snelle aanvalsroute naar het noorden

**Beschikbare units/gebouwen**:
- Units: ALLES. Alle Brabandse units, alle Tier 3, beide heroes.
- Gebouwen: Alle Brabandse gebouwen.
- Bondgenoten: 15 Limburgse units + Mijnbaas. 12 Belgische units + Frietkoning.

**Vijandelijke samenstelling**:
- Ring 1: 8 Managers, 4 Consultants, 2 Hipsters, 2 Kantoor-torens
- Ring 2: 12 Managers, 6 Corporate Advocaten, 4 HR-medewerkers, 3 Influencers, 2 Vastgoedmakelaars, 4 Kantoor-torens, 2 Starbucks
- Ring 3: 15 Managers, 8 Corporate Advocaten, 4 Vastgoedmakelaars, De Politicus, 6 Kantoor-torens
- Corporate Tower: De CEO (boss), 4 elite Corporate Advocaten (200 HP elk)
- Continue productie: 1 unit/10s uit alle Vergaderzalen

**Boss Fight — De CEO (3 fasen)**:

| Fase | HP | Locatie | Mechanics |
|------|-----|---------|-----------|
| **Fase 1: De Board Room** | 450 HP → 300 HP | Bij Corporate Tower | Standaard CEO abilities. Roept 4 Stagiaires op als schild. *"Dit is MIJN kantoor!"* |
| **Fase 2: De Elevator Pitch** | 300 HP → 150 HP | CEO rent naar Ring 2 | CEO wordt sneller (+50% speed). Gebruikt "Ontslagronde" agressief (sacrificet eigen units voor buffs). *"De kwartaalcijfers spreken voor zich!"* |
| **Fase 3: De Gouden Handdruk** | 150 HP → 0 | CEO's laatste stand bij Parking | CEO wordt desperate. Alle stats +50%. Gebruikt ALLE abilities tegelijk. Vijandige Overname op je gebouwen. *"IK BEN DE SYNERGIEEEEE!"* Bij dood: *"Dit... dit stond niet... in het businessplan..."* |

**Trigger events**:
1. **Start**: Epische cutscene. Brabants leger marcheert over de A2. Prins: *"Brabanders! Limburgers! Belgen! Vandaag halen we terug wat van ons is. VOOR HET WORSTENBROODJE!"*
2. **Ring 1 doorbroken**: *"De buitenwijken zijn gevallen. Maar het echte gevecht begint nu pas."*
3. **Ring 2 doorbroken**: Politicus verschijnt: *"U heeft geen mandaat voor deze invasie!"* Prins: *"Mijn mandaat is 12 missies aan woede."*
4. **Corporate Tower bereikt**: CEO verschijnt op het dak. *"Welkom in mijn wereld. Laat me jullie mijn... exit strategie tonen."*
5. **CEO verslagen**: Het Corporate Tower stort in. Tussen het puin: het Gouden Worstenbroodje, stralend van licht.
6. **Worstenbroodje geclaimd**: Finale cutscene (zie Sectie 9 — Cutscenes).

**Post-credits scene**:
Na de credits, in een donkere mergelgrot. De Mijnbaas van Limburg kijkt naar het Brabantse feest in de verte. Naast hem staat De Maasmansen.
- Mijnbaas: *"Ze hebben hun Worstenbroodje terug. Mooi zo."*
- Maasmansen: *"En nu..."*
- Mijnbaas: *"En nu... willen WIJ ook een Gouden Worstenbroodje."*
- Camera zoomt uit. Titel: **"Reign of Brabant II — De Vlaaienoorlog?"**

**Difficulty scaling**:
- **Easy**: Rings hebben 30% minder verdediging. CEO 300 HP totaal (2 fasen). Bondgenoten sterk (+30%).
- **Medium**: Standaard.
- **Hard**: Rings hebben 40% meer verdediging. CEO 600 HP totaal (3 fasen + enrage bij <50 HP). Bondgenoten zwak (-30%). Corporate Tower 7000 HP. Productie 1/7s.

**Victory condition**: CEO verslagen + Gouden Worstenbroodje geclaimd (15s kanaliseren).
**Defeat condition**: Eigen Boerderij vernietigd OF alle heroes dood tegelijkertijd.

**Nieuwe mechanics geintroduceerd**:
- Multi-fase boss fight
- Ring-verdediging doorbreken (progressieve fortress assault)
- Volledige alliantie-warfare (3 facties samen)
- Eindboss met veranderende arena

**Story beats**:
- De culminatie van 11 missies aan opbouw
- De Randstad in al zijn glorie/decadentie
- CEO als memorabele eindbaas
- Het Gouden Worstenbroodje als symbool van Brabantse identiteit
- Sequel tease: De Limburgers willen hun eigen artefact
- Emotioneel: van een simpele boer in Reusel tot de bevrijder van heel Brabant

---

## 2. Limburgers Campaign — "De Schaduwen van het Heuvelland" {#2-limburgers-campaign}

*"Het verhaal dat ze je niet vertelden. De oorlog die ondergronds werd gevoerd."*

**Totale speelduur**: 4-7 uur
**Unlock**: Beschikbaar na voltooiing van Brabanders Missie 5 ("Heuvelland Diplomatie")
**Verhaallijn**: Parallel aan de Brabanders-campaign, vanuit Limburgs perspectief. De Limburgers ontdekken dat de Randstad niet alleen Brabant bedreigt, maar een tunnel onder de Maas bouwt om direct bij hun mergelgrotten te komen. Een verhaal over trots, wantrouwen, en uiteindelijk samenwerking.

---

### Missie 1: "De Eerste Boor"

**Locatie**: Valkenburg — mergelgrotten en kasteelruines
**Geschatte speelduur**: 20 min (Easy) / 25 min (Medium) / 35 min (Hard)

**Briefing tekst**:
> *Diep onder Valkenburg trillen de grotten. Iets boort zich door het mergel. De Mijnbaas stuurt zijn beste Mijnwerkers om te onderzoeken. Wat ze vinden is erger dan ze vreesden: een Randstad-boortunnel, recht naar het hart van Limburg.*

**Objectives**:
- **Primair**: Bouw een basis in de grotten van Valkenburg (Grottentempel + 2 Grotten)
- **Primair**: Train 10 militaire units en vernietig de Randstad-boorinstallatie (1500 HP, noordoost)
- **Primair**: Maak het ondergrondse tunnelnetwerk operationeel (verbind 3 Grotten)
- **Bonus**: Versla alle vijanden zonder bovengronds te gaan (alleen tunnels gebruiken)
- **Bonus**: Bouw 4 Grotten (maximum) en verbind ze alle 4

**Map layout**:
- **Grootte**: 192x192 (mix boven/ondergronds)
- **Start positie**: Centrum — Grottentempel. Ondergrondse start.
- **Vijand positie**: Noordoost — boorinstallatie (bovengronds)
- **Speciale features**: 2-laags map (bovengronds landschap + ondergronds grottennetwerk). Grot-ingangen als verbindingspunten. De boorinstallatie breekt langzaam door (timer: 15 minuten tot ze je basis bereiken).

**Beschikbare units/gebouwen**:
- Units: Mijnwerker, Schutterij, Vlaaienwerper
- Gebouwen: Grottentempel (Town Hall), Grot (tunnel network), Mijnschacht (Kolen gen), Heuvelfort (barracks)

**Vijandelijke samenstelling**:
- Boorinstallatie: 1500 HP, 6 Stagiaires (bewakers), 4 Managers, boormachine (decoratief, doet geen damage maar fungeert als timer)
- 2 patrouilles bovengronds: 3 Managers elk

**Trigger events**:
1. **Start**: Mijnbaas: *"De grotten trillen. Dat is niet normaal. Ga kijken."*
2. **Boorinstallatie ontdekt**: *"Ze boren! Die Randstedelingen boren recht naar ons toe! Dit stoppen we. NU."*
3. **Tunnelnetwerk actief**: Tutorial over Grot-teleportatie. *"Onze tunnels zijn ons voordeel. Zij boren blind. Wij weten precies waar we zijn."*
4. **Installatie vernietigd**: Manager: *"Maar de projectleider zei dat dit een risicoloos project was!"*

**Victory condition**: Boorinstallatie vernietigd + 3 Grotten verbonden.
**Defeat condition**: Grottentempel vernietigd OF boorinstallatie bereikt je basis (timer afgelopen).

**Nieuwe mechanics geintroduceerd**:
- Ondergronds tunnelnetwerk (Grotten bouwen en verbinden)
- Instant teleportatie tussen Grotten
- 2-laags map concept
- Kolen als tertiaire resource (Mijnschacht)

---

### Missie 2: "Maastricht onder Druk"

**Locatie**: Maastricht — de Vrijthof en omgeving
**Geschatte speelduur**: 25 min / 35 min / 45 min

**Briefing tekst**:
> *Maastricht, de hoofdstad van Limburg, wordt belaagd. Randstad-Hipsters infiltreren de stad en gentrificeren wijk na wijk. Het Vrijthof dreigt een food hall te worden. De Mijnbaas weigert dit.*

**Objectives**:
- **Primair**: Verdedig het Vrijthof (centraal plein, 60 seconden vasthouden tegen 3 golven)
- **Primair**: Vernietig 4 Randstad-gentrificatiepunten (Starbucks-achtige gebouwen in de stad)
- **Primair**: Voorkom dat meer dan 3 wijken gegentrifieerd worden (6 neutrale wijken op de map)
- **Bonus**: Gebruik alleen Mergelridders voor de finale push (unlocks: Mergelridder elite skin)
- **Bonus**: Nul wijken gegentrifieerd (unlocks: "Puur Limburgs" achievement)

**Map layout**:
- **Grootte**: 224x224 (stedelijk)
- **Start**: Zuiden — basis bij de Maas, met 1 Grot-ingang
- **Vijand**: Noorden + Westen — Randstad-infiltratie
- **Speciale features**: De Maas als natuurlijke barriere (zuiden). Brug bij het Vrijthof (chokepoint). 6 neutrale wijken die langzaam gegentrifieerd worden (1 per 90s als niet verdedigd).

**Beschikbare units/gebouwen**:
- Units: Mijnwerker, Schutterij, Vlaaienwerper, Mergelridder (unlocked), Heuvelklansen (scout)
- Gebouwen: Alle Tier 1 + Mijnschacht

**Vijandelijke samenstelling**:
- 12 Hipsters (gentrificatie-focus), 8 Managers, 4 Consultants, 2 Influencers
- Golf-gebaseerd met continue Hipster-infiltratie tussen golven

**Trigger events**:
1. **Wijk gegentrifieerd**: *"De [wijknaam] is veranderd! De kroeg is nu een wijnbar met 'ambiance'!"*
2. **Vrijthof verdedigd**: *"Het Vrijthof is veilig! Andre Rieu kan weer optreden!"*

**Victory condition**: Vrijthof verdedigd + alle gentrificatiepunten vernietigd + max 3 wijken gegentrifieerd.
**Defeat condition**: Grottentempel vernietigd OF meer dan 3 wijken gegentrifieerd OF Vrijthof verloren.

**Nieuwe mechanics geintroduceerd**:
- Anti-gentrificatie mechanic (verdedig neutrale zones tegen langzame vijandelijke overname)
- Mergelridder unit (heavy, Steenhuid ability)
- Stedelijk combat met multiple objectives tegelijk

---

### Missie 3: "De Tunnel onder de Maas"

**Locatie**: Onder de Maas — volledig ondergrondse missie
**Geschatte speelduur**: 20 min / 30 min / 40 min

**Briefing tekst**:
> *De Randstad bouwt een geheime tunnel ONDER de Maas. Als die voltooid is, kunnen ze Limburg binnenvallen zonder ooit bovengronds te komen. Stuur je beste Mijnratten om de tunnel te saboteren.*

**Objectives**:
- **Primair**: Infiltreer met 5 Mijnratten de Randstad-tunnel (stealth missie)
- **Primair**: Plant 4 explosieven op de tunnelstructuur (channelen per explosief: 8 seconden)
- **Primair**: Ontsnap voordat de tunnel instort (60 seconden timer na laatste explosief)
- **Bonus**: Plant alle explosieven zonder gedetecteerd te worden
- **Bonus**: Vind de geheime Randstad-blauwdruk in de tunnel (verborgen kamer)

**Map layout**:
- **Grootte**: 128x256 (lang en smal — tunnelvormig)
- **Start**: Westen — Limburgse Grot-ingang
- **Vijand**: Verspreid door de tunnel — wachtposten, patrouilles, detectiesystemen
- **Speciale features**: Lineaire dungeon-stijl map. 4 explosief-locaties (structurele steunpunten). Waterstromen (vertragende zones). Rattenholen (shortcuts alleen voor Mijnratten).

**Beschikbare units/gebouwen**:
- Units: 5 Mijnratten (vast). Geen andere units. Geen gebouwen.
- Mijnrat abilities: underground movement, mijn leggen, stealth

**Vijandelijke samenstelling**:
- 6 wachtposten met 2 Managers elk
- 3 patrouilles van 2 Stagiaires
- Detectie-apparaten (statische sensors, radius 6)
- Alert systeem: bij detectie +8 Managers spawnen

**Victory condition**: Alle 4 explosieven geplaatst + minstens 1 Mijnrat ontsnapt.
**Defeat condition**: Alle Mijnratten dood.

**Nieuwe mechanics geintroduceerd**:
- Mijnrat unit (stealth specialist, underground movement, mijnen leggen)
- Volledig ondergrondse map
- Timed escape sequence

---

### Missie 4: "De Vlaaienslag van Venlo"

**Locatie**: Venlo — marktplein en omgeving
**Geschatte speelduur**: 25 min / 35 min / 45 min

**Briefing tekst**:
> *Venlo is strategisch cruciaal: wie Venlo controleert, controleert de toegang tot Duitsland. De Randstad wil die route voor zichzelf. Tijd voor de beroemdste veldslag in de Limburgse geschiedenis: de Vlaaienslag.*

**Objectives**:
- **Primair**: Bouw een volledig Tier 2 leger (20+ units inclusief Mergelridders en De Mijnbaas hero)
- **Primair**: Verover het Marktplein van Venlo (capture + 90 seconden vasthouden)
- **Primair**: Versla de Randstad-bezettingsmacht (15+ vijandelijke units + Kantoor-torens)
- **Bonus**: Gebruik "Vloedgolf van Vlaai" minstens 2x (unlocks: Vlaaienwerper splash art)
- **Bonus**: Verover Venlo in onder 15 minuten

**Map layout**:
- **Grootte**: 224x224
- **Start**: Zuiden — open veld, heuvelachtig
- **Vijand**: Noorden — Venlo-stad, versterkt
- **Speciale features**: De Maas stroomt door het midden. 2 bruggen (chokepoints). Marktplein als capture point. Heuvels in het zuiden (verdedigbaar).

**Beschikbare units/gebouwen**:
- Units: Alle Limburgse units + De Mijnbaas (hero, unlocked)
- Gebouwen: Alle Limburgse gebouwen

**Vijandelijke samenstelling**:
- 10 Managers, 6 Corporate Advocaten, 4 HR-medewerkers, 3 Kantoor-torens, 1 Vastgoedmakelaar
- AI bouwt actief vanuit 1 Vergaderzaal

**Trigger events**:
1. **Vloedgolf van Vlaai gebruikt**: Mijnbaas: *"VLAAIIIII!"* Vijandelijke units zwemmen in vlaai.
2. **Marktplein veroverd**: *"Venlo is Limburgs! De Kansen op de Weekmarkt zijn weer van ons!"*

**Victory condition**: Marktplein veroverd + bezettingsmacht verslagen.
**Defeat condition**: Grottentempel vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Vloedgolf van Vlaai (factie-ability)
- De Mijnbaas hero gameplay
- Capture + hold mechanic met tijdsdruk
- Brug-chokepoint strategieen

---

### Missie 5: "Het Dubbele Spel"

**Locatie**: De grens Limburg-Belgie — Drielandenpunt
**Geschatte speelduur**: 30 min / 40 min / 50 min

**Briefing tekst**:
> *De Belgen hebben een boodschap gestuurd: ze willen praten. Bij het Drielandenpunt — waar Nederland, Belgie en Duitsland elkaar raken — wacht een Belgische delegatie. Maar kan je de Belgen vertrouwen? Ze staan bekend om hun... compromissen.*

**Objectives**:
- **Primair**: Stuur De Maasmansen (2e hero) naar het Drielandenpunt voor onderhandeling
- **Primair**: Overleef het Belgische "test-gevecht" (ze vallen je aan om je kracht te meten — klinkt bekend?)
- **Primair**: Kies: alliantie met de Belgen (diplomatieke route) OF verover hun buitenpost (militaire route)
  - **Diplomatiek**: Stuur 200 resources naar de Belgen. Ze worden permanent bondgenoot.
  - **Militair**: Vernietig hun buitenpost. Ze trekken zich terug, geen bondgenoot in missie 8.
- **Bonus**: Vind het geheime Duitse bierkraam (verborgen achter het Drielandenpunt monument)
- **Bonus**: Win het test-gevecht zonder De Maasmansen ability's te gebruiken

**Map layout**:
- **Grootte**: 192x192 (driehoekig qua zones)
- **Start**: Oost (Limburg) — heuvelachtig, grotten
- **Belgen**: West — buitenpost met Belgische units
- **Randstad**: Noorden — verkenningsgroep die probeert het Drielandenpunt te bezetten
- **Drielandenpunt**: Centrum — neutraal monument met 3 vlaggen

**Beschikbare units/gebouwen**:
- Units: Alle Limburgse units + De Maasmansen (hero, unlocked deze missie)
- Gebouwen: Alle Limburgse gebouwen

**Vijandelijke samenstelling**:
- Belgische "test": 8 Bierbouwers, 4 Frituurridders, De Frietkoning (hero — trekt zich terug bij 40%)
- Randstad-verkenning: 6 Hipsters, 4 Managers (arriveert na 10 minuten)

**Trigger events**:
1. **Drielandenpunt bereikt**: Belgische Frietkoning: *"Ah, de Limburgers! Wij hebben gehoord dat jullie problemen hebben met de Randstad. Toevallig... wij ook. Maar eerst: kunnenjullie vechten?"*
2. **Test overleefd**: *"Niet slecht! Nu... een compromis?"*
3. **Keuze-moment**: Speler kiest diplomatiek of militair. Dit beinvloedt missie 8.
4. **Randstad arriveert**: *"Daar zijn ze! De Randstad wil het Drielandenpunt! Samen of apart — we moeten ze stoppen."*

**Victory condition**: Belgische test overleefd + keuze gemaakt + Randstad-verkenning verslagen.
**Defeat condition**: De Maasmansen sterft permanent (niet revivable in deze missie) OF Grottentempel vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Verhaalkeuze (diplomatiek vs militair) met gevolgen in latere missies
- De Maasmansen hero (caster, water-abilities)
- NPC-factie interactie (Belgen als potentiele bondgenoot)

---

### Missie 6: "Operatie Mergelschild"

**Locatie**: De Limburgse grens — verdedigingslinie door de heuvels
**Geschatte speelduur**: 30 min / 40 min / 50 min

**Briefing tekst**:
> *De Randstad stuurt een invasiemacht. Geen subtiliteit meer — dit is een frontale aanval. Bouw de Mergelschild-verdedigingslinie en houd ze tegen. Gebruik het terrein. Gebruik de tunnels. Gebruik de vlaai.*

**Objectives**:
- **Primair**: Bouw 6 verdedigingsstructuren langs de heuvellinie (Grot-ingangen + torens)
- **Primair**: Overleef 8 aanvalsgolven over 20 minuten
- **Primair**: Voorkom dat enige vijandelijke unit de Grottentempel bereikt
- **Bonus**: Vernietig 50+ vijandelijke units (unlocks: "Mergelschild" title)
- **Bonus**: Geen enkel verdedigingsgebouw verloren

**Map layout**:
- **Grootte**: 256x192 (breed, niet diep)
- **Start**: Zuiden — heuvelkam met Grottentempel
- **Vijand**: Noorden — open vlakte waar golven vandaan komen
- **Speciale features**: Heuvelkam als natuurlijke verdedigingslinie. 3 passen door de heuvels (chokepoints). Hoge grond = +sight range en +damage voor ranged units. Tunnels onder de heuvels (flankeringsmogelijkheid).

**Beschikbare units/gebouwen**: Alle Limburgse units en gebouwen. Beide heroes.

**Vijandelijke samenstelling** (8 golven, escalerend):
- Golf 1-2: 6-8 Managers
- Golf 3-4: 10 Managers + 4 Consultants
- Golf 5-6: 12 Managers + 6 Corporate Advocaten + 2 Influencers
- Golf 7: De CEO (hero) + 15 elite units
- Golf 8: 20+ units, alle typen, De Politicus, 2 Vastgoedmakelaars

**Victory condition**: 8 golven overleefd, geen vijand bij Grottentempel.
**Defeat condition**: Grottentempel vernietigd OF vijandelijke unit bereikt Grottentempel.

**Nieuwe mechanics geintroduceerd**:
- Pure verdedigingsmissie (tower defense-achtig)
- Terreinvoordeel uitbuiten (heuvelkam + chokepoints)
- Tunnel-flankering tactiek

---

### Missie 7: "De Brabantse Handdruk"

**Locatie**: Het Groene Woud — ontmoetingspunt Brabant-Limburg
**Geschatte speelduur**: 25 min / 35 min / 45 min

**Briefing tekst**:
> *De Brabanders hebben contact opgenomen. Hun Prins wil een alliantie. De Mijnbaas is sceptisch — "Die Brabanders vertrouwen is als een mijnschacht zonder stutten" — maar hij stemt in met een ontmoeting.*
>
> *Dit is dezelfde missie als Brabanders Missie 5, maar nu vanuit JOUW perspectief. Jij bent de Limburger die de Brabanders test.*

**Objectives**:
- **Primair**: Test de Brabanders met 3 golven aanvallen (stuur je troepen, zij moeten overleven)
- **Primair**: Stuur De Mijnbaas naar het diplomatieke overleg nadat de tests slagen
- **Primair**: Verdedig je eigen basis tegen een Randstad-verrassingsaanval (die terwijl je de Brabanders test)
- **Bonus**: De Mijnbaas verliest minder dan 30% HP tijdens de tests
- **Bonus**: Versla de Randstad-verrassingsaanval zonder Brabantse hulp

**Map layout**: Spiegelversie van Brabanders Missie 5. Jij start in het oosten (Limburgse heuvels), Brabanders AI in het westen.

**Beschikbare units/gebouwen**: Alle Limburgse units en gebouwen.

**Vijandelijke samenstelling**:
- Brabanders (NPC, niet vijand — jij stuurt JOUW units om ZIJ te testen, maar het is gescript)
- Randstad-verrassingsaanval (minuut 12): 10 Managers + 4 Hipsters vanuit het noorden

**Trigger events**:
1. **Golf 3 verstuurd**: Mijnbaas: *"Als ze dit overleven... dan zijn ze het misschien waard."*
2. **Brabanders overleven**: Mijnbaas (verbaasd): *"Hmm. Ze zijn taaier dan ze eruitzien. Goed. We praten."*
3. **Randstad-verrassingsaanval**: *"WAT?! De Randstad valt ONS aan terwijl we bezig zijn! Die sluwe..."*
4. **Overleg**: Mijnbaas en Prins schudden handen. *"Voor Limburg." "Voor Brabant." Samen: "Tegen de Randstad."*

**Victory condition**: Tests voltooid + diplomatiek overleg + Randstad-aanval overleefd.
**Defeat condition**: Grottentempel vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Parallel perspectief op eerder gespeelde missie (narratief)
- Twee fronten tegelijk (tests + verdediging)

---

### Missie 8: "De Diepe Mijn" (Finale)

**Locatie**: Diepste mergelgroeve van Limburg — het ondergrondse hart
**Geschatte speelduur**: 35 min / 45 min / 60 min

**Briefing tekst**:
> *De Randstad heeft hun laatste troef gespeeld: ze hebben de Diepe Mijn ontdekt — de oudste en diepste mergelgroeve van Limburg, waar volgens de legende de "Steen van Valkenburg" verborgen ligt, een artefact net zo machtig als het Gouden Worstenbroodje.*
>
> *Race naar de diepte. Vind de Steen. En bewijs dat Limburg zijn eigen schatten kan beschermen.*

**Objectives**:
- **Primair**: Race door 5 ondergrondse lagen (elke laag is een mini-map met eigen challenges)
- **Primair**: Versla de Randstad-expeditie die ook naar beneden gaat (parallel race)
- **Primair**: Bereik de Steen van Valkenburg in de diepste laag
- **Primair**: Versla De CEO in een ondergrondse boss fight
- **Bonus**: Bereik de Steen voor de Randstad-expeditie (ze raken laag 4 na 25 minuten)
- **Bonus**: Als je in Missie 5 diplomatiek koos: Belgische versterkingen in laag 3 (5 Bierbouwers + 3 Frituurridders)

**Map layout**:
- **Grootte**: 5 lagen van 128x128 elk (verticale progressie)
- **Laag 1**: Open grotten, lichte weerstand
- **Laag 2**: Smalle tunnels, Mijnratten-puzzels (omleiding via ratten)
- **Laag 3**: Ondergronds meer (beperkte routes, water-obstakels)
- **Laag 4**: Instabiel terrein (random instortingen die paden blokkeren)
- **Laag 5**: De Kamerzaal — gigantische grot met de Steen op een altaar, CEO als eindbaas

**Beschikbare units/gebouwen**: Alle Limburgse units, beide heroes. Beperkt bouwen (alleen op vlakke delen). Conditionele Belgische hulp.

**Vijandelijke samenstelling**:
- Per laag: escalerend (4 → 8 → 12 → 16 units Randstad)
- Laag 5: De CEO + 10 elite units + 2 Vastgoedmakelaars
- CEO boss fight: 2 fasen (normaal → ondergrondse enrage, gebruikt omgeving tegen je)

**Trigger events**:
1. **Laag 3 (als diplomatie)**: *"Belgische vrienden! Ze hebben de tunnels gevonden!"* Frietkoning (via hologram): *"Een belofte is een belofte. Hier, neem wat Bierbouwers!"*
2. **Laag 5**: CEO: *"Een steen? Jullie vechten voor een STEEN? ...Wacht. Die steen gloeit. Dat is geen steen. Dat is... VASTGOED."*
3. **CEO verslagen**: Mijnbaas pakt de Steen. *"Dit is van Limburg. Dit is ALTIJD van Limburg geweest."* De Steen gloeit goudkleurig.

**Post-credits**: Mijnbaas staat op de hoogste heuvel van Limburg. De Steen in zijn hand. In de verte: Brabant viert feest met het Gouden Worstenbroodje. *"Twee schatten. Twee volkeren. Eén vijand verslagen."* Beat. *"...maar wie heeft het BETERE artefact?"* Knipoogt naar camera.

**Victory condition**: Steen van Valkenburg verkregen + CEO verslagen.
**Defeat condition**: Alle heroes dood + geen units over in huidige laag.

---

## 3. Belgen Campaign — "Het Compromis" {#3-belgen-campaign}

*"Waarom vechten als je kunt onderhandelen? En waarom onderhandelen als je kunt feesten?"*

**Totale speelduur**: 3-5 uur
**Unlock**: Beschikbaar na voltooiing van Brabanders Missie 9 ("De Mijn van Waarheid")
**Verhaallijn**: De Belgen proberen neutraal te blijven in het conflict, maar worden er steeds dieper ingezogen. Hun methode: diplomatiek, culinair, en met een gezonde dosis chaos. De Frietkoning wil vrede — maar op ZIJN voorwaarden, met Belgische frieten als universele valuta.

---

### Missie 1: "De Frietvrede"

**Locatie**: Antwerpen — de haven en de binnenstad
**Geschatte speelduur**: 20 min / 30 min / 35 min

**Briefing tekst**:
> *Antwerpen, de poort van Belgie. De Randstad wil de haven overnemen voor hun "logistiek optimalisatieplan". De Frietkoning heeft een beter plan: vrede door frieten.*
>
> *Bouw je basis, produceer 500 Frieten, en nodig alle facties uit voor een Frietvrede-conferentie. Simpel? In Belgie is niets simpel.*

**Objectives**:
- **Primair**: Bouw een basis en produceer 500 Frieten (primaire resource)
- **Primair**: Verdedig de haven tegen Randstad-infiltranten (3 golven Hipsters)
- **Primair**: Bouw een Conferentiezaal (speciaal gebouw, deze missie) en nodig NPC-delegaties uit
- **Bonus**: Produceer 1000 Frieten (unlocks: Friet-resource skin — extra knapperig)
- **Bonus**: Geen enkel Belgisch gebouw beschadigd (unlocks: "Pacifist" title)

**Map layout**:
- **Grootte**: 192x192
- **Start**: Westen — haven van Antwerpen. Water aan westzijde (niet begaanbaar).
- **Vijand**: Oosten — Randstad-poging tot infiltratie
- **Speciale features**: De haven als economische hub (extra resource nodes). Scheepvaartroutes (decoratief). Conferentiezaal als speciaal gebouw (uiterlijk: groot wit gebouw met Belgische vlaggen).

**Beschikbare units/gebouwen**:
- Units: Frietkraamhouder, Bierbouwer, Chocolatier
- Gebouwen: Belgisch Raadhuis (Town Hall), Frituur (barracks), Chocolaterie (Chocolade gen), Brouwerij (Trappist gen), Conferentiezaal (special)

**Vijandelijke samenstelling**:
- Golf 1: 4 Hipsters + 2 Managers
- Golf 2: 6 Hipsters + 3 Consultants
- Golf 3: 8 Hipsters + 4 Managers + 1 Influencer
- Hipsters proberen gebouwen te gentrificeren, niet te vernietigen

**Trigger events**:
1. **Conferentiezaal gebouwd**: Drie NPC-delegaties arriveren (Brabants, Limburgs, Randstad). De Randstad-delegatie is stiekem spionage.
2. **Conferentie**: Frietkoning: *"Welkom! Ik stel voor: vrede. In ruil voor... frieten. Overal frieten. Belgische frieten."*
3. **Randstad-spion ontmaskerd**: *"Die ene met de latte macchiato... dat is een Consultant! GRIJP HEM!"*

**Victory condition**: 500 Frieten geproduceerd + alle golven overleefd + Conferentie gehouden.
**Defeat condition**: Raadhuis vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Belgische economie (Frieten als resource)
- Chocolade als tertiaire resource
- Diplomatieke gebouwen
- Belgisch Compromis-mechanic introductie
- Anti-gentrificatie verdediging

---

### Missie 2: "De Chocolade Oorlog"

**Locatie**: Brugge — kanalen en middeleeuwse binnenstad
**Geschatte speelduur**: 25 min / 35 min / 45 min

**Briefing tekst**:
> *De Randstad heeft Brugge getarget. Niet voor de gebouwen of de strategische positie — nee, ze willen de CHOCOLADE. Belgische pralines zijn de geheime brandstof achter Belgische diplomatie, en zonder chocolade... geen compromissen.*

**Objectives**:
- **Primair**: Bescherm 4 Chocolateries (resource-gebouwen, verspreid over Brugge)
- **Primair**: Train De Frietkoning (hero) en gebruik zijn "Koninklijke Portie" AoE heal 3x
- **Primair**: Versla de Randstad-plundertroepen die de chocolade proberen te stelen
- **Bonus**: Gebruik "Diplomatieke Verwarring" (factie-ability) op de Randstad-hoofdgroep
- **Bonus**: Bouw een Chocoladefontein (decoratief gebouw) op het marktplein

**Map layout**:
- **Grootte**: 192x192 (stedelijk, kanalen)
- **Start**: Centrum — Marktplein. 4 Chocolateries verspreid (N, O, Z, W).
- **Vijand**: Random spawn aan de randen
- **Speciale features**: Kanalen als obstakels (bruggen = chokepoints). Middeleeuwse straten (smal). Chocolateries als verdedigbare gebouwen (eigen verdedigingsaura: vijanden in radius 5 worden langzamer, "chocolade-verleiding").

**Beschikbare units/gebouwen**: Alle Belgische Tier 1 + De Frietkoning hero.

**Vijandelijke samenstelling**:
- 4 plundergroepen (1 per Chocolaterie): 4 Managers + 2 Stagiaires elk
- Hoofdgroep: 8 Managers + 4 Consultants + 1 Vastgoedmakelaar (target: grootste Chocolaterie)
- Spawnen in golven om de 5 minuten

**Victory condition**: Alle 4 Chocolateries overleven + Randstad-plundertroepen verslagen.
**Defeat condition**: 2+ Chocolateries vernietigd OF Raadhuis vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Frietkoning hero abilities
- Diplomatieke Verwarring (factie-ability — vijanden vallen eigen team aan)
- Multi-point verdediging in stedelijke omgeving
- Chocolaterie verdedigingsaura

---

### Missie 3: "Manneken Pis Marcheert"

**Locatie**: Brussel — het Atomium en het centrum
**Geschatte speelduur**: 30 min / 40 min / 50 min

**Briefing tekst**:
> *De Randstad heeft het gewaagd om een Starbucks te openen NAAST het Manneken Pis. De maat is vol. De Frietkoning mobiliseert het volledige Belgische leger. Inclusief het meest gevreesde wapen: het Manneken Pis-kanon.*

**Objectives**:
- **Primair**: Bouw een volledig Tier 2 leger (15+ units inclusief Manneken Pis-kanon siege)
- **Primair**: Verover het centrum van Brussel (Grote Markt — capture + hold 90s)
- **Primair**: Vernietig de Randstad "Embassy" (hun diplomatieke hoofdkwartier, 2500 HP)
- **Bonus**: Gebruik 3 Manneken Pis-kanons tegelijk op hetzelfde doel
- **Bonus**: Verover Brussel zonder De Frietkoning te gebruiken (unlocks: "Republikein" achievement)

**Map layout**:
- **Grootte**: 256x256 (groot, stedelijk)
- **Start**: Zuiden — Belgische buitenwijk
- **Vijand**: Noorden — EU-wijk (Randstad Embassy + verdedigingen)
- **Centrum**: Grote Markt (capture point) met Manneken Pis standbeeld (decoratief, maar klikken triggert easter egg)
- **Speciale features**: Het Atomium als landmarkering (navmesh obstakel). Wafelkramen als resource bonus. EU-gebouwen als obstakels.

**Beschikbare units/gebouwen**: Alle Belgische units t/m Tier 2 + Manneken Pis-kanon (siege).

**Vijandelijke samenstelling**:
- Embassy: 2500 HP, 3 Kantoor-torens
- 15 Managers, 8 Corporate Advocaten, 4 Influencers, 2 Vastgoedmakelaars
- De Politicus (hero) verdedigt de Embassy

**Victory condition**: Grote Markt veroverd + Embassy vernietigd.
**Defeat condition**: Raadhuis vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Manneken Pis-kanon (siege unit)
- Grote stedelijke conquest
- Capture & hold in vijandelijk gebied

---

### Missie 4: "Dubbele Spion"

**Locatie**: De grens Belgie-Randstad — niemandsland
**Geschatte speelduur**: 20 min / 30 min / 40 min

**Briefing tekst**:
> *De Abdijbransen, mysterieuze monnik en meester-spion, heeft een plan. Stuur Dubbele Spionnen de Randstad in om informatie te verzamelen. Maar pas op: de Randstad heeft hun eigen spionnen.*

**Objectives**:
- **Primair**: Infiltreer 3 Dubbele Spionnen in de Randstad-basis (ze vermommen zich als vijandelijke units)
- **Primair**: Verzamel 3 stukken inlichtingen (elk bij een ander Randstad-gebouw, 15 seconden channelen in disguise)
- **Primair**: Ontmasker en vernietig 2 Randstad-spionnen die in JOU basis zijn geinfilteerd
- **Bonus**: Geen enkele Dubbele Spion ontmaskerd door de vijand
- **Bonus**: Vind de dubbelspion die voor BEIDE kanten werkt (verborgen NPC)

**Map layout**:
- **Grootte**: 192x192
- **Start**: Zuiden — Belgische basis
- **Vijand**: Noorden — Randstad-basis (middelgroot)
- **Speciale features**: Niemandsland in het midden (open, gevaarlijk). Zij-paden door bossen (veiliger maar langer). Detectie-aura rond Randstad-gebouwen (Dubbele Spionnen ontmaskerd als ze te lang stilstaan: max 20 seconden).

**Beschikbare units/gebouwen**: Alle Belgische units + De Abdijbransen (hero, unlocked deze missie).

**Vijandelijke samenstelling**:
- Randstad-basis: 8 Managers, 4 Consultants, 2 Hipsters (extra detectie-range)
- 2 infiltranten in Belgische basis (lijken op Frietkraamhouders maar zijn Consultants — detecteerbaar via De Abdijbransen "Stiltegelofte" ability)

**Trigger events**:
1. **Eerste intel verzameld**: *"Project Gentrificatie Fase 3 — ze plannen een aanval op Antwerpen!"*
2. **Infiltrant ontmaskerd**: *"Die Frietkraamhouder bakt geen frieten! Hij maakt... NOTITIES!"*
3. **De Abdijbransen onthult**: *"De stilte vertelt meer dan woorden. Luister... die unit bidt niet. Hij MAILT."*

**Victory condition**: 3 intel verzameld + 2 infiltranten vernietigd.
**Defeat condition**: Alle Dubbele Spionnen dood OF Raadhuis vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Dubbele Spion gameplay (disguise als vijandelijke unit)
- De Abdijbransen hero (counter-intelligence, silence ability)
- Contra-spionage (vijandelijke spionnen in eigen basis)
- Timed disguise mechanic

---

### Missie 5: "De Wafelconferentie"

**Locatie**: Luik — de stad van wafels en industrieel verleden
**Geschatte speelduur**: 25 min / 35 min / 45 min

**Briefing tekst**:
> *De Frietkoning heeft alle facties uitgenodigd voor de Wafelconferentie — een laatste poging tot vrede via culinaire diplomatie. Brabanders en Limburgers komen als bondgenoten. De Randstad... komt met verborgen motieven.*
>
> *Organiseer de conferentie, serveer de wafels, en wees voorbereid op het onvermijdelijke verraad.*

**Objectives**:
- **Primair**: Bouw de Wafelconferentie-locatie (3 gebouwen: Wafelzaal, Keuken, Tuin)
- **Primair**: Produceer 300 Chocolade (voor de wafels)
- **Primair**: Wanneer de Randstad de conferentie saboteert (scripted): verdedig de locatie met je bondgenoten
- **Bonus**: Serveer "Perfecte Wafels" (300 Chocolade + 200 Frieten + 100 Trappist tegelijk) — unlocks: "Meester-Kok" achievement
- **Bonus**: Verras de Randstad door hun sabotage-plan te ontdekken VOOR het plaatsvindt (stuur Dubbele Spion naar Randstad-delegatie)

**Map layout**:
- **Grootte**: 224x224
- **Start**: Centrum — Belgische basis + conferentie-locatie
- **Bondgenoten**: Brabanders (AI, zuidwesten) + Limburgers (AI, zuidoosten)
- **Vijand**: Noorden — verborgen Randstad-legerbasis (onzichtbaar tot sabotage)
- **Speciale features**: Conferentie-locatie als centraal point of interest. Bondgenoot-delegaties als NPC-groepen. De Maas stroomt door het zuiden.

**Beschikbare units/gebouwen**: Alle Belgische units en gebouwen. Bondgenoten zijn AI-gecontroleerd.

**Vijandelijke samenstelling (na sabotage, minuut 15)**:
- 15 Managers, 8 Corporate Advocaten, 4 Influencers, 2 Vastgoedmakelaars, De CEO + De Politicus
- Massive aanval op de conferentie-locatie

**Trigger events**:
1. **Conferentie begint**: Alle delegaties rond de tafel. Frietkoning: *"Vrienden! Vijanden! Laten we eten en praten."*
2. **Als Dubbele Spion ontdekt sabotage**: *"De Randstad-delegatie heeft wapens onder de tafel!"* — speler krijgt 2 minuten extra om zich voor te bereiden.
3. **Sabotage (minuut 15)**: CEO staat op: *"Genoeg met de wafels. Dit is een vijandige overname."* — Randstad-leger verschijnt.
4. **Victory**: CEO vlucht. Frietkoning: *"Zo. Nu hebben we een reden om ECHT boos te zijn."*

**Victory condition**: Sabotage overleefd + conferentie-locatie niet vernietigd.
**Defeat condition**: Conferentie-locatie (3 gebouwen) allemaal vernietigd.

---

### Missie 6: "Het Grote Compromis" (Finale)

**Locatie**: Waterloo — het historische slagveld
**Geschatte speelduur**: 35 min / 45 min / 60 min

**Briefing tekst**:
> *Waterloo. Waar ooit Napoleon verslagen werd. Vandaag wordt hier een nieuw hoofdstuk geschreven. De Belgen, Brabanders en Limburgers staan samen tegen de Randstad-invasiemacht die Belgie probeert te annexeren.*
>
> *De Frietkoning heeft één woord: "Compromis." Maar dit keer is het compromis simpel: de Randstad vertrekt, of de Randstad wordt vertrokken.*

**Objectives**:
- **Primair**: Leid de geallieerde troepen (Belgen + Brabanders AI + Limburgers AI) tegen de Randstad-invasiemacht
- **Primair**: Vernietig 3 Randstad-aanvalsbasissen rond Waterloo
- **Primair**: Versla De Politicus in een boss fight op het slagveld
- **Bonus**: Win met minder dan 10 Belgische unit verliezen
- **Bonus**: Gebruik "Belgisch Compromis" mechanic op De Politicus (hij accepteert en wordt neutraal voor 30s — grappig cutscene)

**Map layout**:
- **Grootte**: 320x320 (XL)
- **Start**: Zuiden — Belgische hoofdbasis + bondgenoten
- **Vijand**: 3 basissen (noord, oost, west)
- **Speciale features**: Heuvel van Waterloo (centraal, hoge grond, strategisch). Leeuw van Waterloo als monument (decoratief). Open velden (cavalerie-terrein). Belgische bondgenoten aan weerszijden.

**Beschikbare units/gebouwen**: Alle Belgische units, beide heroes. AI bondgenoten (Brabanders + Limburgers).

**Vijandelijke samenstelling**:
- 3 basissen: elk met Hoofdkantoor + 12 gemixte units
- De Politicus als boss: 2 fasen
  - Fase 1: Kamerdebat — stunt alle units in radius 20 voor 12s, healt zichzelf
  - Fase 2: Filibuster — De Politicus wordt onstopbaar, sprint rond de map en debufft alles. Moet gecornerd worden door 3 groepen tegelijk.

**Post-credits**: De Frietkoning staat op de Heuvel van Waterloo. *"Vandaag hebben we iets bereikt. Niet door te vechten — maar door te ETEN. ...Goed, we hebben ook gevochten. Maar de frieten hielpen."*

**Victory condition**: Alle 3 basissen vernietigd + De Politicus verslagen.
**Defeat condition**: Belgisch Raadhuis vernietigd.

---

## 4. Randstad Campaign — "De Andere Kant" {#4-randstad-campaign}

*"Zijn wij de slechteriken? ...Nee. Wij zijn de toekomst."*

**Totale speelduur**: 3-5 uur
**Unlock**: Beschikbaar na voltooiing van Brabanders Campaign (alle 12 missies)
**Verhaallijn**: Speel de hele oorlog opnieuw, maar nu vanuit de Randstad. Ontdek dat de CEO niet puur slecht is — hij gelooft oprecht dat modernisering nodig is. Het morele dilemma: is traditie altijd beter dan vooruitgang? De toon is ernstiger, met momenten van zelfspot.

---

### Missie 1: "De Boardroom"

**Locatie**: Amsterdam — het hoofdkantoor van de Randstad Ontwikkelingsmaatschappij
**Geschatte speelduur**: 20 min / 25 min / 35 min

**Briefing tekst**:
> *Welkom bij de Randstad Ontwikkelingsmaatschappij. U bent de nieuwe COO — Chief Operating Officer. De CEO heeft een visie: moderniseer het achtergestelde zuiden. Breng innovatie, infrastructuur en... Starbucks.*
>
> *Uw eerste opdracht: bouw het perfecte hoofdkantoor. Efficientie is alles.*

**Objectives**:
- **Primair**: Bouw een volledig operationeel Hoofdkantoor met alle Tier 1 gebouwen
- **Primair**: Accumuleer 20 Efficientie-stacks (Bureaucratie-mechanic)
- **Primair**: Train 15 units en voer een succesvol "efficiency audit" uit (alle units naar rally point binnen 10 seconden)
- **Bonus**: Bereik 20 stacks in onder 8 minuten
- **Bonus**: Bouw een Starbucks naast elk productiegebouw (maximale aura-dekking)

**Map layout**:
- **Grootte**: 160x160
- **Start**: Centrum — Hoofdkantoor + 4 Stagiaires
- **Geen vijanden** — puur economische/tutorial missie

**Beschikbare units/gebouwen**:
- Units: Stagiair, Manager, Consultant
- Gebouwen: Hoofdkantoor, Vergaderzaal, Starbucks, Netwerkborrel, Vinex-wijk

**Trigger events**:
1. **Eerste Werkoverleg**: Alle gebouwen pauzeren 8s. CEO (narration): *"Het werkoverleg. Cruciaal voor afstemming. Irritant voor de planning."*
2. **10 Efficientie-stacks**: *"De machine loopt. Elke actie maakt de volgende sneller. Dit is het systeem."*
3. **20 stacks**: CEO: *"Perfectie. Nu... breng dit naar het zuiden."*

**Victory condition**: Alle objectives behaald.
**Defeat condition**: Niet mogelijk (tutorial).

**Nieuwe mechanics geintroduceerd**:
- Bureaucratie-mechanic volledig uitgelegd (vertraging + Efficientie-stacks)
- Werkoverleg als strategische factor
- Starbucks buff-aura

---

### Missie 2: "Het Visitekaartje"

**Locatie**: Den Bosch — de nachtelijke operatie om het Gouden Worstenbroodje te stelen
**Geschatte speelduur**: 20 min / 30 min / 40 min

**Briefing tekst**:
> *De CEO heeft een plan: steel het Gouden Worstenbroodje. Niet uit kwaadaardigheid — het artefact is "een inefficient gebruik van cultureel kapitaal." Het moet worden "herbestemd." Stuur een commando-team naar Den Bosch.*
>
> *En laat een visitekaartje achter. De CEO houdt van stijl.*

**Objectives**:
- **Primair**: Infiltreer Den Bosch met 4 Hipsters en 2 Consultants (nacht, stealth)
- **Primair**: Bereik de Sint-Janskathedraal ongedetecteerd
- **Primair**: Steel het Gouden Worstenbroodje (30 seconden channelen, ongestoord)
- **Bonus**: Leg het visitekaartje neer (narratief detail, automatisch bij succes)
- **Bonus**: Geen alarm getriggerd gedurende de hele missie

**Map layout**:
- **Grootte**: 160x160 (stedelijk, nacht)
- **Start**: Noorden — buitenrand van Den Bosch
- **Kathedraal**: Centrum-Zuiden — zwaar bewaakt door Brabantse wachters
- **Speciale features**: Nachtmap (reduced sight range voor iedereen). Brabantse patrouilles (Carnavalvierders, slaperig). Straten met lantaarns (lichtcirkels = detectiezones). De Binnendieze als alternatieve route (ja, de Randstad kent hem ook).

**Beschikbare units/gebouwen**: 4 Hipsters, 2 Consultants (vast). Geen gebouwen.

**Vijandelijke samenstelling**:
- 6 patrouilles van 2 Carnavalvierders (traag, slaperig — lagere detectie 's nachts)
- 2 Kansen-wachters bij de kathedraal (hogere detectie)
- Alert: +8 Carnavalvierders + Prins van Brabansen spawnen

**Trigger events**:
1. **Bij Binnendieze**: Hipster: *"Ew, het ruikt hier naar... authenticiteit."*
2. **Bij kathedraal**: Consultant fluistert: *"Het Worstenbroodje. Het is... het is gewoon een worstenbroodje. Maar dan goud."* CEO (via communicator): *"Pak het. Het is een investering."*
3. **Gestolen**: CEO: *"Excellent. Nu weten ze wie we zijn."* Hipster: *"Was het visitekaartje echt nodig?"* CEO: *"Marketing. Altijd marketing."*

**Victory condition**: Gouden Worstenbroodje gestolen.
**Defeat condition**: Alle units dood OF alarm getriggerd + speler verslaat de verdediging niet.

**Story beats (moreel dilemma)**:
- De speler ervaart de diefstal vanuit de "andere kant"
- De CEO gelooft oprecht in zijn missie — hij is geen cartoon-schurk
- Hint van twijfel: Consultant vraagt *"Moeten we dit echt doen?"*

---

### Missie 3: "Gentrificatie"

**Locatie**: Tilburg — de Randstad bouwt een voorpost
**Geschatte speelduur**: 25 min / 35 min / 45 min

**Briefing tekst**:
> *Fase 1 van Project Gentrificatie: moderniseer Tilburg. De CEO beschouwt dit als "verheffing." De Tilburgers noemen het iets anders.*
>
> *Bouw een Randstad-voorpost, gentrificeer 3 wijken, en verdedig je positie tegen de onvermijdelijke Brabantse tegenreactie. Probeer niet te veel te denken over of dit "goed" is.*

**Objectives**:
- **Primair**: Bouw een volledige Randstad-basis in Tilburg
- **Primair**: Gentrificeer 3 van de 5 neutrale wijken (stuur Hipsters, 30 seconden channelen per wijk)
- **Primair**: Verdedig tegen de Brabantse counterattack (minuut 12)
- **Bonus**: Gentrificeer alle 5 wijken (moreel dilemma: NPC-dialoog wordt steeds ongemakkelijker)
- **Bonus**: Bouw een Yoga-studio (speciaal cosmetisch gebouw) op de plek van het oude bruin cafe

**Map layout**: Spiegelversie van Brabanders Missie 3 — je bent nu de bezetter.

**Beschikbare units/gebouwen**: Alle Randstad Tier 1 + Hipsters.

**Vijandelijke samenstelling**:
- Brabantse counterattack (minuut 12): 10 Carnavalvierders, 4 Kansen, Prins
- Brabantse guerrilla: 2 groepjes Kansen die gebouwen saboteren

**Trigger events**:
1. **Eerste wijk gegentrifieerd**: Tilburger NPC: *"Mijn opa's cafe... het is nu een 'concept store'."* HR-medewerker: *"Verandering is moeilijk, maar nodig."*
2. **3e wijk gegentrifieerd**: Consultant (twijfelend): *"Chef... sommige van die gebouwen waren echt mooi. Moesten we ze echt vervangen?"* CEO: *"Vooruitgang kent geen sentimentaliteit."*
3. **4e wijk** (bonus, als je doorgaat): Stagiair: *"Ik... ik voel me hier niet goed bij."* Manager: *"Dat gevoel heet 'productiviteit'. Wen er maar aan."*
4. **5e wijk** (bonus): Stilte. Geen dialoog. Alleen de camera die langzaam pant over de veranderde stad. Muziek verandert naar melancholisch.

**Victory condition**: 3 wijken gegentrifieerd + counterattack overleefd.
**Defeat condition**: Hoofdkantoor vernietigd.

**Story beats**:
- Moreel dilemma: de speler IS de bezetter. NPCs worden steeds ongemakkelijker.
- Interne twijfel bij Randstad-units — niet iedereen staat achter de CEO
- De 5e wijk (bonus) is bewust ongemakkelijk — de game beloont je, maar het voelt niet goed
- Parallelle narratief: dit is Brabanders Missie 3 vanuit de andere kant

---

### Missie 4: "De Vergadermachine"

**Locatie**: Eindhoven — High Tech Campus
**Geschatte speelduur**: 30 min / 40 min / 50 min

**Briefing tekst**:
> *Uw meesterwerk: de Eindeloze Vergadermachine. Een apparaat dat de vijand kan opsluiten in een vergadering zonder einde. Bouw het. Test het. Verdedig het.*
>
> *Maar terwijl u bouwt, groeit een ongemakkelijk besef: is dit een wapen... of een spiegel?*

**Objectives**:
- **Primair**: Bouw de Vergadermachine (3 onderdelen, elk 2 minuten bouwtijd, elk kost 200/200)
- **Primair**: Verdedig de campus tegen Brabantse aanvallen terwijl je bouwt
- **Primair**: Test de machine op een groep gevangen Brabantse boeren (moreel dilemma keuze: TEST of WEIGER)
  - **TEST**: Machine werkt. +50% effectiviteit in latere missies. Maar NPC-reactie is verschrikkelijk.
  - **WEIGER**: CEO is woedend. Machine werkt slechts op 50%. Maar je team respecteert je meer (+morale buff).
- **Bonus**: Bouw de machine zonder enig onderdeel beschadigd tijdens constructie
- **Bonus**: Ontdek de geheime Brabantse achteringang (aanwijzing: de ventilatieschacht)

**Map layout**: Vergelijkbaar met Brabanders Missie 10, maar nu verdedig JIJ de campus.

**Beschikbare units/gebouwen**: Alle Randstad units en gebouwen t/m Tier 3.

**Vijandelijke samenstelling**:
- Brabantse guerrilla-aanvallen: elke 5 minuten, 6-10 units
- Grote Brabantse aanval (minuut 20): 15 units + Prins

**Trigger events**:
1. **TEST gekozen**: Boeren worden gestunt. Ze zitten aan een vergadertafel, glazig. Consultant: *"Ze... ze zitten vast. In een meeting over niks."* CEO: *"Precies zoals bedoeld."* Consultant: *"Is dit niet gewoon... wreed?"* CEO: *"Het is INNOVATIE."*
2. **WEIGER gekozen**: CEO: *"U weigert?! Dit is INSUBORDINATIE!"* Speler krijgt -20% productie voor 5 minuten. Maar alle units krijgen permanent +10% morale (stat buff). Consultant: *"Dank u. Dat was... moedig."*

**Victory condition**: Machine gebouwd + keuze gemaakt + campus verdedigd.
**Defeat condition**: Corporate Tower vernietigd.

**Story beats**:
- Het diepste morele dilemma van de Randstad-campaign
- De keuze (TEST/WEIGER) verandert de toon van de resterende missies
- De CEO als moreel ambigue leider — hij is niet gek, maar hij is doorgeschoten
- Interne scheuren in de Randstad-organisatie

---

### Missie 5: "De Invasie"

**Locatie**: A2 richting Brabant — de grote opmars
**Geschatte speelduur**: 30 min / 40 min / 50 min

**Briefing tekst**:
> *De tijd voor subtiliteit is voorbij. De CEO mobiliseert het volledige Randstad-leger. De A2 richting Brabant. Volledige invasie.*
>
> *Maar zelfs nu, in het marcherende leger, hoor je gemompel. Niet iedereen is overtuigd. "Waarom doen we dit eigenlijk?" Goede vraag.*

**Objectives**:
- **Primair**: Marcheer het Randstad-leger over de A2 (lineaire missie, 5 etappes)
- **Primair**: Doorbreek 3 Brabantse verdedigingslinies
- **Primair**: Bereik de grens van Brabant
- **Bonus**: Verlies minder dan 10 units gedurende de hele mars
- **Bonus**: Als WEIGER in Missie 4: geheim dialoog met de Consultant die begint te twijfelen

**Map layout**:
- **Grootte**: 128x512 (lang en smal — de A2)
- **Start**: Noorden — Randstad-leger (30+ units + CEO + Politicus)
- **Vijand**: 3 verdedigingslinies (Brabantse + Limburgse + Belgische troepen)
- **Speciale features**: Autosnelweg als hoofdpad. Zijwegen als flankeerroutes. Tankstations als resource nodes (humor).

**Beschikbare units/gebouwen**: Volledige Randstad-leger. Beperkt bouwen (alleen reparatie, geen nieuwe basis).

**Vijandelijke samenstelling**:
- Linie 1: 8 Carnavalvierders + 4 Kansen
- Linie 2: 6 Mergelridders + 4 Schutterij + 2 Vlaaienwerpers
- Linie 3: 10 gemixte units + Prins van Brabansen

**Trigger events**:
1. **Linie 1 doorbroken**: Manager: *"Ze vochten... met toeteransen? En bierpullen?"*
2. **Linie 2**: CEO (als TEST): *"Vooruit! Niets kan ons stoppen!"* CEO (als WEIGER): *"Ik vraag me af... hadden we moeten luisteren?"*
3. **Linie 3**: Prins van Brabansen verschijnt. Prins: *"DIT IS BRABANT!"* CEO: *"Dit is het verleden."* Episch duel.

**Victory condition**: Grens van Brabant bereikt.
**Defeat condition**: CEO sterft.

---

### Missie 6: "Het Laatste Kantoor" (Finale)

**Locatie**: Randstad — Corporate Tower, de val van het hoofdkwartier
**Geschatte speelduur**: 35 min / 50 min / 65 min

**Briefing tekst**:
> *De invasie is mislukt. Het Brabantse leger marcheert naar de Randstad. De CEO staat op het dak van het Corporate Tower en kijkt naar de horizon.*
>
> *Dit is het einde. Of... is dit een nieuw begin?*
>
> *KEUZE: Verdedig het Corporate Tower tot de dood (FIGHT ending)? Of open de deuren en onderhandel (PEACE ending)?*

**Objectives** (afhankelijk van keuze):

**FIGHT-route**:
- Verdedig Corporate Tower tegen 4 golven geallieerden
- Activeer de Vergadermachine als ultiem wapen
- Versla de Prins van Brabansen in een 1v1 boss duel (CEO vs Prins)
- Loss is de enige mogelijke uitkomst — maar je bepaalt HOE je verliest (met eer of met wreedheid)

**PEACE-route**:
- Stuur De Politicus als onderhandelaar naar het Brabantse leger
- Produceer 500 PowerPoints als "vredesoffering" (bureaucratische overdracht)
- Verdedig tegen CEO-loyalisten die de vrede willen saboteren (interne vijanden!)
- Bereik het compromis: de Randstad trekt zich terug uit Brabant, maar behoudt handelsroutes

**Map layout**: Vergelijkbaar met Brabanders Missie 12, maar in spiegelbeeld — je verdedigt.

**Beschikbare units/gebouwen**: Alles. Maar beperkte resources (je bent afgesneden van supply lines).

**Trigger events**:
1. **FIGHT — Golf 4**: CEO op het dak: *"IK BEN DE SYNERGIEEE!"* (dezelfde line als in Brabanders M12). Maar nu, vanuit zijn perspectief, is het wanhoop, niet arrogantie.
2. **FIGHT — Verlies**: CEO valt. *"Misschien... was het de moeite niet waard. Misschien was het worstenbroodje gewoon... een worstenbroodje."*
3. **PEACE — Onderhandeling**: Prins: *"Je wilt vrede? Na alles?"* Politicus: *"Soms is het moedigste wat je kunt doen... stoppen."*
4. **PEACE — Sabotage**: CEO-loyalisten: *"De CEO zou dit NOOIT goedkeuren!"* Speler moet eigen units bevechten.
5. **PEACE — Succes**: CEO (als overgeleverd): *"Ik begon dit met goede bedoelingen. Ergens onderweg... vergat ik dat."*

**Ending variaties**:
- **FIGHT + TEST (uit M4)**: Donkerste ending. CEO sterft onbekeerd. *"De Randstad is gevallen. Maar het had niet zo hoeven gaan."*
- **FIGHT + WEIGER**: CEO sterft, maar met spijt. *"Je had gelijk. Ik had moeten luisteren."*
- **PEACE + TEST**: Vrede, maar met wantrouwen. *"De vrede is fragiel. Maar het is een begin."*
- **PEACE + WEIGER**: Beste ending. Oprechte vrede. CEO geeft het Worstenbroodje persoonlijk terug. *"Het was nooit van ons."*

**Victory condition**: Afhankelijk van route — FIGHT: overleven tot het narratieve einde; PEACE: vrede bereikt.
**Defeat condition**: FIGHT: geen defeat, het is een narratief einde; PEACE: onderhandeling mislukt (Politicus sterft OF sabotage slaagt).

---

## 5. Secret Campaign — "Het Sprookjesbos" {#5-secret-campaign}

*"Achter de heuvels, voorbij de grotten, waar de werkelijkheid dunner wordt... ligt het Sprookjesbos."*

**Totale speelduur**: 2-3 uur
**Unlock**: Voltooiing van ALLE 4 reguliere campaigns
**Verhaallijn**: Na het einde van de oorlog opent een mysterieuze poort in het Groene Woud. Erachter: het Sprookjesbos — een magische dimensie vol Efteling-achtige sprookjesfiguren die hun eigen problemen hebben. Humor maximaal, maar de gameplay is verrassend tactisch.

---

### Missie 1: "Door de Poort"

**Locatie**: Het Groene Woud → het Sprookjesbos (magisch bos)
**Geschatte speelduur**: 25 min / 35 min / 45 min

**Briefing tekst**:
> *Een gouden poort is verschenen in het Groene Woud. Niemand weet waar hij vandaan komt. De Prins, de Mijnbaas, de Frietkoning en zelfs de CEO (in een ongemakkelijk poging tot vriendschap) besluiten samen te kijken.*
>
> *Achter de poort: een bos dat PRAAT. Bomen die bewegen. En een klein, boos mannetje dat roept: "EINDELIJK! WE HEBBEN HULP NODIG!"*

**Objectives**:
- **Primair**: Verken het Sprookjesbos met een mixed team (2 units van elke factie, 8 totaal + 4 heroes)
- **Primair**: Bevrijd Roodkapje (NPC) uit de klauwen van de Boze Wolf (mini-boss, 400 HP)
- **Primair**: Bereik het kasteel van de Sprookjeskoning (einde van het bos)
- **Bonus**: Vind alle 5 verborgen sprookjesfiguren (Hans en Grietje, Klein Duimpje, Assepoester, De Gelaarsde Kat, Rapunzel)
- **Bonus**: Versla de Boze Wolf zonder heroes te gebruiken

**Map layout**:
- **Grootte**: 256x256 (organisch, non-lineair)
- **Start**: Zuiden — de Gouden Poort (terugweg naar de echte wereld)
- **Kasteel**: Noorden — Sprookjeskoning's kasteel
- **Speciale features**: Pratende bomen (decoratief, geven hints als je erop klikt). Paddestoelenringen (teleportatie-punten). Snoephuisje van Hans en Grietje (verborgen resource cache). De Boze Wolf als mini-boss in het donkerste deel van het bos. Feeenglow als ambient verlichting.
- **Atmosfeer**: Magisch, kleurrijk, Efteling-achtige sfeer. Muziek: betoverend, orkestaal, dromerig.

**Beschikbare units/gebouwen**:
- Units: 2 per factie (vast), 4 heroes (Prins, Mijnbaas, Frietkoning, CEO). GEEN gebouwen — dit is een avontuurmissie.
- Speciale sprookjes-units unlocked na ontmoeting (zie hieronder)

**Sprookjes-units** (NPC's die je team joinen):
| Unit | Gebaseerd op | HP | ATK | Special |
|------|-------------|-----|-----|---------|
| Roodkapje | Roodkapje | 80 | 15 | Mandje: AoE heal 20 HP radius 8 |
| De Gelaarsde Kat | Efteling | 60 | 20 | Kat-reflexen: dodge 50% attacks |
| Klein Duimpje | Sprookje | 30 | 5 | Broodkruimels: onzichtbare padsensor (toont verborgen routes) |

**Vijandelijke samenstelling**:
- Boze Wolf: 400 HP, 30 ATK, Huilaanval (AoE fear, units rennen 5s)
- 6 Betoverde Boomgeesten (50 HP, 10 ATK — blokkeren paden)
- 3 Trol-brugwachters (100 HP, 15 ATK — bewaken bruggen, te verslaan of te slim-af-zijn via puzzel)

**Trigger events**:
1. **Door de poort**: CEO: *"Dit is... dit is niet te optimaliseren."* Prins: *"Het is PRACHTIG."*
2. **Bij pratende boom**: Boom: *"Hallo! Ik sta hier al 400 jaar. Hoe laat is het?"*
3. **Boze Wolf verslagen**: Roodkapje: *"Dankjewel! Mijn oma... ze is vast ergens in het kasteel."*
4. **Bij kasteel**: De Sprookjeskoning (een klein, oud mannetje met een baard tot op de grond): *"Ah! Helden! Mooi, mooi. Want wij hebben een PROBLEEM."*

**Victory condition**: Kasteel bereikt + Roodkapje bevrijd.
**Defeat condition**: Alle heroes dood.

---

### Missie 2: "De Betoverde Nacht"

**Locatie**: Het Sprookjeskasteel en het Donkere Bos
**Geschatte speelduur**: 30 min / 40 min / 50 min

**Briefing tekst**:
> *De Sprookjeskoning legt uit: een duistere tovenaar — de Zwarte Magiër — heeft de sprookjes vervloekt. Roodkapje is niet meer lief, de wolf is niet meer groot, en Doornroosje is WAKKER (en heel boos). De enige manier om de vloek te breken: vind de 3 Magische Sprookjesboeken en breng ze naar het kasteel.*

**Objectives**:
- **Primair**: Vind de 3 Magische Sprookjesboeken (verspreid over de map, elk bewaakt door een vervloekt sprookjesfiguur)
- **Primair**: Versla de 3 vervloekte bossbewakers:
  - **Boze Doornroosje**: 300 HP, slaapaanval (AoE sleep 8s), doornenbarriere (spawnt obstakels)
  - **Gigantische Reus**: 500 HP, grondstamp (AoE stun + damage), langzaam
  - **De Draak van Sprookjesland**: 400 HP, vuurspuwer (cone AoE), vliegt (kan niet melee'd)
- **Primair**: Breng alle 3 boeken naar het kasteel
- **Bonus**: Versla alle 3 bosses zonder hero deaths
- **Bonus**: Vind het verborgen 4e boek (het Verloren Sprookje — easter egg naar een echt Brabants sprookje)

**Map layout**:
- **Grootte**: 320x320 (groot, open world gevoel)
- **Start**: Centrum — Sprookjeskasteel als veilige zone (healt units)
- **3 Boeklocaties**: Noordwesten (Doornroosje's toren), Noordoosten (Reuzenfort), Zuiden (Drakenholster)
- **Speciale features**: Dag-nachtcyclus (eerst dag, wordt nacht halverwege — vijanden sterker 's nachts). Elfenpaden (verborgen snelroutes). Kabouters als neutrale NPC's die hints geven. Magische rivieren (helen units die erdoorheen waden).
- **Atmosfeer**: Overdag: kleurrijk, Efteling-achtig. 's Nachts: donker, mysterieus, licht griezelig

**Beschikbare units/gebouwen**:
- Units: Alle heroes + sprookjes-allies + 2 per factie. Kasteel als "Town Hall" (kan 4 speciale sprookjes-units trainen: Kabouter-werker, Elfenschutter, Trolstrijder, Feenheler).
- Gebouwen: Alleen het Kasteel (fixed).

**Sprookjes-produceerbare units**:
| Unit | Rol | HP | ATK | Cost | Special |
|------|-----|-----|-----|------|---------|
| Kabouter | Worker/Scout | 30 | 3 | 30/10 | Klein: onzichtbaar voor bosses. Verzamelt paddenstoelen (resource). |
| Elfenschutter | Ranged | 45 | 18 | 60/40 | Pijlen van licht: extra damage 's nachts. |
| Trolstrijder | Heavy melee | 200 | 16 | 100/80 | Regeneratie: +3 HP/s. Langzaam. |
| Feenheler | Support | 35 | 0 | 50/50 | AoE heal radius 10: +8 HP/s aan alles in range. |

**Victory condition**: 3 boeken bij kasteel afgeleverd.
**Defeat condition**: Alle heroes dood OF kasteel vernietigd.

---

### Missie 3: "Het Laatste Sprookje" (Finale)

**Locatie**: De Toren van de Zwarte Magiër — het hart van het Sprookjesbos
**Geschatte speelduur**: 35 min / 50 min / 65 min

**Briefing tekst**:
> *De 3 boeken zijn samen. Ze onthullen de locatie van de Zwarte Magiër: een zwevende toren in het hart van het bos, bereikbaar alleen via de Regenboogbrug.*
>
> *Dit is het: 4 helden, 4 facties, 1 doel. Versla de Zwarte Magiër en red het Sprookjesbos. En misschien... misschien ontdek je waarom deze poort zich opende.*

**Objectives**:
- **Primair**: Bereik de Zwevende Toren via de Regenboogbrug (puzzel: activeer 4 kleurelementen op de brug — elk element vereist een andere factie-hero's ability)
- **Primair**: Beklim de toren (5 verdiepingen, elke verdieping een gevecht)
- **Primair**: Versla de Zwarte Magiër (boss fight, 3 fasen, 1000 HP totaal)
- **Bonus**: Versla de Magiër binnen 20 minuten
- **Bonus**: Vind de Geheime Kamer onder de toren (bevat: de Efteling-sleutel — unlock cosmetisch)

**Map layout**:
- **Grootte**: 192x192 (compact maar verticaal)
- **Start**: Zuiden — Sprookjeskasteel, alle eenheden
- **Regenboogbrug**: Centrum — puzzel-brug die richting toren leidt
- **Zwevende Toren**: Noorden — 5 verdiepingen (elke verdieping is een aparte sub-zone)
- **Speciale features**: De Regenboogbrug verandert van kleur en vereist samenwerking:
  - Rood element: CEO moet Kwartaalcijfers activeren (Randstad-ability)
  - Blauw element: Mijnbaas moet Mijnschacht Instorten gebruiken (Limburg-ability)
  - Geel element: Frietkoning moet Koninklijke Portie gebruiken (Belgisch-ability)
  - Groen element: Prins moet Prinselijke Toespraak geven (Brabants-ability)

**Toren verdiepingen**:
| Verdieping | Thema | Vijanden | Puzzel |
|-----------|-------|---------|--------|
| 1 | Betoverd Bos | 8 Boomgeesten + 2 Wolven | Vernietig de wortel (500 HP) om door te gaan |
| 2 | IJskamer | 6 IJsreuzen (slow aura) | Gebruik vuur (Frituurmeester) om de ijsmuur te smelten |
| 3 | Spiegelzaal | Kwaadaardige spiegelversies van je heroes (50% stats) | Versla je eigen reflecties |
| 4 | Bibliotheek | 10 Betoverde Boeken (ranged, paper cuts) | Vind het JUISTE boek (puzzel) om de deur te openen |
| 5 | Troonzaal | De Zwarte Magiër | Boss fight |

**Boss Fight — De Zwarte Magiër (3 fasen)**:

| Fase | HP | Mechanic |
|------|-----|---------|
| **Fase 1: De Illusie** | 1000→700 | Magiër split in 4 kopieën. Slechts 1 is echt. Elke kopie neemt schade van maar 1 factie's units. Speler moet de juiste factie naar de juiste kopie sturen. |
| **Fase 2: De Betovering** | 700→300 | Magiër betovered random heroes (30s: hero vecht tegen je). Moet overleven tot betovering eindigt. AoE magic attacks. |
| **Fase 3: Het Sprookje** | 300→0 | Magiër wordt ENORM (filling de kamer). Alleen kwetsbaar voor samenwerking: alle 4 heroes moeten tegelijk aanvallen om schade te doen. Mechanics: synchroniseer je 4 heroes. |

**Trigger events**:
1. **Regenboogbrug-puzzel**: Elke hero activeert zijn element. CEO (ongemakkelijk): *"Ik gebruik mijn Kwartaalcijfers voor... GOED? Dit voelt raar."* Prins: *"Welkom bij het team."*
2. **Spiegelzaal**: CEO kijkt naar zijn reflectie. *"Is dat... is dat hoe zij mij zien?"* Reflectie-CEO: *"IK BEN DE SYNERGIEEEEE!"* CEO: *"...oh."*
3. **Magiër verschijnt**: *"Jullie zijn gekomen! 4 facties die SAMENWERKEN? Onmogelijk! Jullie haten elkaar!"* Prins: *"We... we hadden onze verschillen."* Mijnbaas: *"Maar we zijn hier."* Frietkoning: *"En we hebben frieten."* CEO: *"En een businessplan."*
4. **Magiër verslagen**: De vloek breekt. Het Sprookjesbos wordt licht. De Sprookjeskoning: *"Jullie hebben bewezen wat wij nooit konden: dat verschillende volkeren samen sterker zijn."*

**Epiloog-cutscene**:
De 4 heroes staan bij de Gouden Poort, klaar om terug te gaan. Het Sprookjesbos gloeit achter hen.
- Prins: *"Weet je, dit was... leuk."*
- Mijnbaas: *"Hmm. Het was acceptabel."*
- Frietkoning: *"Ik heb zoveel frieten uitgedeeld!"*
- CEO: *"Ik heb... geleerd. Misschien was het worstenbroodje niet het belangrijkste."*
- Prins: *"Wat dan wel?"*
- CEO: *"De mensen die het eten."*
- Stilte. Dan: iedereen lacht. Credits rollen.
- **Na de credits**: De Sprookjeskoning verschijnt op het menu-scherm. *"Goed gespeeld. Maar... er zijn nog meer sprookjes. Veel meer."* Knipoog.

**Victory condition**: Zwarte Magiër verslagen.
**Defeat condition**: Alle 4 heroes dood tegelijkertijd.

---

## 6. Bonus Levels {#6-bonus-levels}

### 6.1 Survival Mode — "De Eindeloze Golf"

**Unlock**: Na voltooiing van elke campaign (1 factie-variant per voltooide campaign)
**Locatie**: "De Arena" — circulaire map met de basis in het centrum

**Concept**: Bouw je basis, verdedig tegen eindeloze golven vijanden. Elke golf is sterker. Hoe lang houd je het vol?

**Regels**:
- Start met Town Hall + 5 workers + 200/200 resources
- Golven om de 90 seconden
- Elke 5e golf is een "boss wave" (sterkere units, meer variatie)
- Elke 10e golf is een "mega wave" (hero units, siege)
- Resources druppelen passief (+5/10s) zodat je altijd kunt bouwen
- Geen pop cap limiet (maar resources worden schaarser)
- Vijanden komen van alle kanten (360 graden)
- Dode vijanden droppen kleine resource pickups

**Golf escalatie**:

| Golf | Vijanden | Samenstelling |
|------|---------|--------------|
| 1-5 | 4-8 | Workers + basis infantry |
| 6-10 | 8-14 | Infantry + ranged |
| 11-15 | 12-20 | + Heavy units |
| 16-20 | 16-24 | + Support + debuffers |
| 21-25 | 20-30 | + Siege + heroes |
| 26-30 | 24-36 | Alle typen, boss waves met 2 heroes |
| 31+ | 28+ | ENRAGE: alle stats +5% per golf. Eindeloos. |

**Leaderboard**: Hoogste golf bereikt, per factie.
**Achievements**:
- Golf 10: "Tien Rondes" (bronze)
- Golf 20: "Survivor" (zilver)
- Golf 30: "Legendarisch" (goud)
- Golf 50: "Onmogelijk" (diamant)
- Golf 100: "..." (geheim achievement — krijgt speciale title)

---

### 6.2 Tower Defense — "De Sint-Janskathedraal"

**Unlock**: Na Brabanders Missie 4 ("De Binnendieze")
**Locatie**: Den Bosch — de Sint-Janskathedraal en omliggende straten

**Concept**: Klassieke tower defense. Bouw verdedigingstorens langs het pad. Vijanden marcheren in golven naar de kathedraal. Als ze de kathedraal bereiken, verlies je levens.

**Regels**:
- Kathedraal heeft 20 levens (elke vijand die aankomt = -1 leven)
- Bouw torens op vooraf bepaalde posities langs het pad
- 30 golven + eindbaas
- Resources verdien je per gedode vijand
- Torens zijn upgradeable (3 levels)

**Torentypen**:

| Toren | Gebaseerd op | Damage | Special | Cost |
|-------|-------------|--------|---------|------|
| Kerktoren | Kerk | Medium, AoE (klokken) | Vertraagt vijanden -20% speed | 100 |
| Frituurkanon | Frietkar | Hoog, single target | Olie-plas: -30% speed zone | 150 |
| Bierpul-katapult | Cafe | Hoog, AoE | Dronken effect: vijanden lopen zigzag | 200 |
| Carnavalstoren | Kermistent | Medium, buffer | +20% damage nabije torens | 175 |
| Praalwagen-blokkade | Praalwagen | Zeer hoog, single | Blokkeert pad 5s elke 20s | 250 |
| Sprookjestoren* | Sprookjesbos | Magic, piercing | Raakt ALLE vijanden in een lijn | 300 |

*Sprookjestoren alleen beschikbaar na voltooiing Secret Campaign.

**Golf variatie**: Vijanden zijn mix van alle 3 niet-speelbare facties (Randstad, Limburgers, Belgen — ze zijn hier "gesimuleerde" vijanden).

---

### 6.3 Boss Rush — "De Parade der Slechteriken"

**Unlock**: Na voltooiing van minstens 2 campaigns
**Locatie**: Een arena die verandert per boss

**Concept**: Vecht tegen alle campaign bosses achter elkaar met een vast team. Geen hersteltijd tussen gevechten. Health/abilities resetten NIET.

**Boss volgorde**:

| # | Boss | HP | Arena | Uit campaign |
|---|------|-----|-------|-------------|
| 1 | De Boze Wolf | 400 | Donker Bos | Sprookjesbos |
| 2 | Randstad Verkenningspost Commander | 300 | Grensgebied | Brabanders M2 |
| 3 | De Politicus | 350 | Stadhuis | Brabanders M7 |
| 4 | De Mijnbaas (test versie) | 550 | Heuvels | Brabanders M5 |
| 5 | Boze Doornroosje | 300 | Toren | Sprookjesbos |
| 6 | De Gigantische Reus | 500 | Fort | Sprookjesbos |
| 7 | De Draak | 400 | Grot | Sprookjesbos |
| 8 | De CEO (3 fasen) | 900 | Corporate Tower | Brabanders M12 |
| 9 | De Zwarte Magiër (3 fasen) | 1000 | Troonzaal | Sprookjesbos |
| 10 | ??? (Secret Boss) | 1500 | ??? | Zie Easter Eggs |

**Team selectie**: Kies 1 hero + 8 units van elke factie (4 heroes + 32 units totaal). Geen training tijdens de rush.

**Achievements**:
- "Bossenjager" (versla alle 9 bosses)
- "Perfectionist" (geen hero deaths)
- "Snelheidsduivel" (onder 30 minuten)
- "Eenzame Wolf" (met slechts 1 hero en 4 units)

---

### 6.4 Speedrun Mode

**Unlock**: Na voltooiing van elke campaign (speedrun voor die campaign)
**Concept**: Herplees campaign missies met een zichtbare timer. Globaal leaderboard. Ghost replay van je beste run.

**Regels**:
- Timer start bij eerste input, stopt bij victory condition
- Cutscenes zijn skippable (maar tellen mee in de timer)
- Difficulty: alleen Hard (gestandaardiseerd)
- Leaderboard per missie + totale campaign-tijd
- Ghost: transparante replay van je best run naast je huidige poging
- "World Record" indicator bij nieuw beste tijd

**Speciale achievements**:
- Per missie: "Gold Time" (onder streeftijd), "Silver", "Bronze"
- Hele campaign: "Speedrunner" (onder totale streeftijd)
- "Any% Legende": Alle campaigns samen onder 4 uur (Expert-level achievement)

**Streeftijden (voorbeeld, Brabanders)**:

| Missie | Bronze | Silver | Gold |
|--------|--------|--------|------|
| M1: De Oogst | 15 min | 10 min | 6 min |
| M2: Smokkel bij de Grens | 25 min | 18 min | 12 min |
| M3: Kermisgevecht | 30 min | 22 min | 15 min |
| ... | ... | ... | ... |
| M12: Het Gouden Worstenbroodje | 50 min | 40 min | 28 min |
| **Totaal** | **5:30:00** | **4:00:00** | **2:45:00** |

---

### 6.5 Puzzle Maps — "De Stratego's"

**Unlock**: Na voltooiing van Tutorial Campaign (Sectie 6.6)
**Concept**: Geen combat. Los strategische puzzels op met beperkte units en gebouwen. Denk: schaak met RTS-units.

**5 puzzels**:

**Puzzel 1: "De Brug"**
- 3 Boeren moeten een rivier oversteken. 1 brug, 2 vijandelijke torens.
- Oplossing: Gebruik Kansen's Smokkelroute om onzichtbaar langs de torens te gaan, dan de brug vernietigen zodat vijanden niet kunnen volgen.

**Puzzel 2: "De Vergadering"**
- 10 vijandelijke Managers staan in een cirkel (vergadering). 1 Muzikansen.
- Oplossing: Gebruik Carnavalskraker op het juiste moment om alle 10 te stunnen, dan 1-voor-1 uitschakelen.

**Puzzel 3: "Het Tunnel Netwerk"**
- 4 Grotten, 1 Mijnrat. 3 vijandelijke patrouilles.
- Oplossing: Teleporteer via de grotten, plant mijnen op patrouilleroutes, laat ze in de mijnen lopen.

**Puzzel 4: "Diplomatiek Schaak"**
- 1 Dubbele Spion, 8 vijandelijke units, 1 vijandelijk gebouw.
- Oplossing: Infiltreer als vijand, lok units weg van het gebouw, en vernietig het onbewaakt.

**Puzzel 5: "De Finale Zet"**
- Alle 4 faction heroes, 1 van elke type vijandelijke unit.
- Oplossing: Gebruik elke hero's unieke ability in de juiste volgorde om alle vijanden uit te schakelen in 1 keten.

---

### 6.6 Tutorial Campaign — "Brabant voor Beginners"

**Unlock**: Altijd beschikbaar (het eerste wat nieuwe spelers zien)
**Concept**: 3 korte missies die ALLE basismechanics leren via speelbare scenario's. Luchtige toon, geen falen mogelijk.

**Missie T1: "Je Eerste Boerderij" (5 minuten)**
- Leer: camera, selectie, movement, resource gathering, bouwen
- Setting: Een klein weiland. Een Boer en een droom.
- Dialoog: Narrator leidt je stap voor stap. *"Klik op de Boer. Ja, die. Mooi. Stuur hem nu naar dat goud. Nee, dat andere goud. JA!"*

**Missie T2: "Vechten met Stijl" (8 minuten)**
- Leer: unit training, combat, abilities, control groups
- Setting: Een kleine arena. Vijanden verschijnen in golven.
- Dialoog: *"Tijd om te vechten! Maar in Brabant vechten we met STIJL. En bierpullen."*

**Missie T3: "De Eerste Slag" (10 minuten)**
- Leer: base building, army composition, attack-move, chokepoints, hero
- Setting: Een mini-skirmish tegen een slappe AI.
- Dialoog: *"Gefeliciteerd! Je bent nu een ware Brabantse veldheer. Of in ieder geval een enthousiaste amateur."*

---

## 7. Easter Eggs {#7-easter-eggs}

### 7.1 Verborgen Units (5)

**EE-01: De Koe**
- **Trigger**: Klik 100 keer op een decoratieve koe op elke map
- **Effect**: De koe wordt een speelbare unit (150 HP, 25 ATK, speciale aanval: "Melkstraal" — ranged 8, slows -40%)
- **Voice**: *"MOO... maar dan BOOS."*
- **Referentie**: Blizzard's exploderende schapen in WarCraft

**EE-02: Guus Meeuwis**
- **Trigger**: Type "BRABANT" in het chat/console tijdens een Brabanders-game
- **Effect**: Een Guus Meeuwis-unit verschijnt bij je Town Hall (100 HP, 0 ATK, MAAR: passieve aura "Het Is Een Nacht": alle eigen units +40% alle stats in radius 15. Speelt continu "Het Is Een Nacht".)
- **Voice**: *"Het is een nacht die je normaal alleen in dromen ziet..."*

**EE-03: De Frikandel Speciaal**
- **Trigger**: Bouw 5 Frietkars naast elkaar
- **Effect**: Ze fuseren tot "De Megafrituur" — een kolossale mobiele frietkar (500 HP, AoE heal 30/s in radius 12, maar kan niet bewegen). Visueel: enorme dampende frituurpan op wielen.

**EE-04: Sinterklaas**
- **Trigger**: Speel het spel op 5 december (of elke datum in december)
- **Effect**: Sinterklaas verschijnt als neutrale NPC op de map. Als je een unit naar hem stuurt: gratis 500 resources + alle units krijgen een pepernoten-buff (+10% speed, 60 seconden).
- **Voice (Sint)**: *"Wie zoet is krijgt lekkers, wie stout is... krijgt een Performance Review."*

**EE-05: De Vliegende Hollander**
- **Trigger**: Stuur een unit naar de rand van een watergebied en wacht 3 minuten
- **Effect**: Een spookschip verschijnt op het water. "De Vliegende Hollander" — oncontroleerbaar NPC dat om de map vaart en elke vijandelijke unit die het passeert voor 5 seconden verlamd.

### 7.2 Cheat Codes (Singleplayer) — Uitgebreid

Naast de cheat codes uit de hoofd-PRD:

| Code | Effect | Referentie |
|------|--------|-----------|
| WANSEN | +10.000 Worstenbroodjes/PowerPoints | - |
| ANSEN DE PANSEN | Alle units max upgrades | - |
| HERTANSEN JAN | Oneindig Bier/LinkedIn | Hertog Jan bier |
| GUUANSEN MANSEN | Alle muziek wordt Guus Meeuwis | Guus Meeuwis |
| VLAAI STORM | Random vlaaien vallen uit lucht (damage iedereen) | - |
| VERGANSEN DERING | Vijandelijke units stoppen permanent | - |
| SPROOKANSEN BOS | Unlock geheime Efteling-factie | De Efteling |
| FRANSEN BANSEN | Fog of War uit | - |
| KANSEN PAKANSEN | Alle abilities geen cooldown | - |
| FANSEN FARE | Alle units 50% sneller | Fanfare |
| BLANSEN BANSEN | Alle gebouwen instant gebouwd | - |
| LANSEN VAN BANSEN | Alle heroes op de map tegelijk | - |
| GOUDEN BRANSEN | Alle units krijgen gouden skin | - |
| EANSEN IS GENOEG | Win de missie instant | - |

### 7.3 Culturele Referenties (5)

**EE-06: Jeroen Bosch's Tuin**
- **Trigger**: Op de Den Bosch map, stuur een unit naar de zuidoosthoek (bij de rivier)
- **Effect**: Een verborgen tuin verschijnt met bizarre, Bosch-achtige figuren. Klikken op figuren geeft cryptische hints. Een van de figuren geeft een item: "Het Oog van Bosch" — unit die het draagt heeft +5 sight range permanent.

**EE-07: Het Brabants Dialect Wiel**
- **Trigger**: Klik 10 keer op de factie-banner van de Brabanders in het UI
- **Effect**: Alle Brabantse voice lines worden EXTRA Brabants. *"Ja?"* wordt *"Jansen?"*, *"Ok!"* wordt *"JANSEN!"*

**EE-08: De ASML Machine**
- **Trigger**: Op de Eindhoven map, stuur een worker naar de noordoosthoek
- **Effect**: Je vindt een verborgen "chip-fabriek" die een ASML-achtige machine bevat. Effect: alle gebouwen produceren 20% sneller voor de rest van de missie. Narrator: *"De slimste regio ter wereld."*

**EE-09: PSV Eindhansen**
- **Trigger**: Stuur 11 Carnavalvierders in een formatie die lijkt op een voetbalopstelling (4-3-3)
- **Effect**: Ze krijgen rode shirts en een boost (+30% speed, +20% attack). Voice: *"BOEREN! BOEREN! BOEREN!"*

**EE-10: De Kempen Kansen**
- **Trigger**: Verken de volledige rand van de map "De Kempen"
- **Effect**: Verborgen NPC in de hoek: een oude man die vertelt over de geschiedenis van de Kempen. Geeft een item: "Kempenkaart" — onthult alle resource locaties op de huidige map.

### 7.4 Seizoensgebonden Easter Eggs (4)

**EE-11: Carnaval (Februari/Maart — 3 dagen rond carnaval)**
- **Effect**: Alle Brabanders-maps hebben confetti-effecten. Alle units dragen random een hoedje. Carnavalsrage geeft +10% extra stats.
- **Speciaal**: Een enorme polonaise van NPC's trekt over de map (decoratief, kan niet aangevallen worden).

**EE-12: Sinterklaas (28 nov — 5 dec)**
- **Effect**: Alle resource nodes zijn verpakt als cadeautjes. Workers dragen Sint-mutsen. Piet-NPC's rennen over de map en droppen pepernoten (kleine resource pickups, +5 primair).
- **Speciaal**: Sinterklaas-unit beschikbaar (zie EE-04).

**EE-13: Koningsdag (27 april)**
- **Effect**: ALLES is oranje. Alle facties. Alle gebouwen. Oranje overal. Units dragen oranje shirts.
- **Speciaal**: Alle resource nodes geven 27% meer resources. Nationaal volkslied speelt in het menu.

**EE-14: Kerst (20-31 december)**
- **Effect**: Sneeuw op alle maps. Bomen hebben kerstversiering. Town Halls hebben een kerstboom. Workers zingen kerstliedjes als idle.
- **Speciaal**: "Kerstbestand" — eerste 2 minuten van elke skirmish zijn wapenstilstand (geen aanvallen mogelijk). NPCs wisselen cadeautjes uit.

### 7.5 Click-Based Easter Eggs (3)

**EE-15: De Ongeduldige Narrator**
- **Trigger**: Klik 50 keer op de minimap zonder een unit te selecteren
- **Effect**: De narrator wordt gefrustreerd: *"Wil je het misschien zelf doen? Oh wacht, je DOET het zelf. Nou, doe het dan beter."*

**EE-16: De Dansende Gebouwen**
- **Trigger**: Klik 20 keer op een eigen gebouw
- **Effect**: Het gebouw begint te "dansen" (subtiele bounce-animatie). Alle nabije gebouwen joinen in. Duurt 10 seconden. Puur cosmetisch, maar schattig.

**EE-17: De Geheime Receptuur**
- **Trigger**: Klik op de Bakkerij, dan de Brouwerij, dan de Frietkar, dan de Feestzaal, in die volgorde, binnen 5 seconden
- **Effect**: Een pop-up verschijnt met het "Geheime Recept voor het Perfecte Worstenbroodje" — een echt recept dat je kunt nabakken! Met Brabantse humor in de instructies.

### 7.6 Map-Gebaseerde Secrets (3)

**EE-18: De Verborgen Mergelkamer**
- **Locatie**: Elke Limburgse map — ergens aan de rand
- **Trigger**: Stuur een Mijnrat naar een specifieke rots (geen visuele hint, alleen via community discovery)
- **Effect**: De Mijnrat opent een geheime kamer met een Limburgse schat: 300 Kolen + een verborgen lore-tekst over de oorsprong van de Mergelridders.

**EE-19: Het Verdronken Dorp**
- **Locatie**: Elke map met water
- **Trigger**: Zoom maximaal in op een watergebied
- **Effect**: Onder het water zijn contouren van een verdronken dorp zichtbaar (decoratief). Klikken op het water triggert een geluid van kerkklokken en een narrator-regel: *"Sommige dorpen vergeet de wereld. Dit dorp vergat de wereld niet."*

**EE-20: De Geheime Snelweg**
- **Locatie**: De Slag om Brabant (M11) + De Invasie (R-M5)
- **Trigger**: Stuur een unit naar een specifieke afrit op de A2
- **Effect**: De unit verdwijnt en verschijnt op de ANDERE kant van de map. Secret shortcut. Een bordje verschijnt: "Afrit 27 — Sprookjesbos (niet op de kaart)"

### 7.7 Audio Easter Eggs (2)

**EE-21: De Verborgen Track**
- **Trigger**: Blijf 10 minuten in het menu-scherm zonder iets te doen
- **Effect**: De menumuziek verandert langzaam naar een hidden track: een akoestische versie van het thema, gezongen door een koor. Beschikbaar na ontdekking in de jukebox.

**EE-22: De Voice Line Medley**
- **Trigger**: Selecteer en deselecteer snel 20 verschillende units in 30 seconden
- **Effect**: Alle voice lines worden afgespeeld tegelijkertijd, maar syncen magisch tot een (chaotisch) lied. Units reageren: *"Was dat... muziek? Of een ongeluk?"*

### 7.8 Meta-Referenties (3)

**EE-23: De Credits Invasion**
- **Trigger**: Klik op "Credits" in het menu en blijf kijken tot het einde
- **Effect**: Na de credits: een mini-game! Verdedig de creditstekst tegen invallende Managers. Space Invaders-stijl. High score wordt opgeslagen.

**EE-24: De Console**
- **Trigger**: Type "ADMIN" in het hoofdmenu
- **Effect**: Een nep-console opent met Randstad-bureaucratie: *"U heeft geen toegang. Uw aanvraag is in behandeling. Geschatte wachttijd: 47 werkdagen."* Type "VERGADERING": *"Uw toegang is goedgekeurd na een vergadering van 3 uur."* Console toont development stats (speeltijd, kills, deaths, resources verzameld).

**EE-25: De Vierde Muur**
- **Trigger**: Pauzeer het spel 5 keer in 1 minuut
- **Effect**: Een unit kijkt direct in de camera. *"Ja, WIJ zien jou ook, hoor. Kun je misschien stoppen met pauzeren? We proberen een oorlog te voeren."*

### 7.9 Efteling-Connectie (3)

**EE-26: Holle Boansen**
- **Trigger**: Op de Sprookjesbos-maps, vind de verborgen boom met een gezicht (visueel: grote eik met ogen en mond)
- **Effect**: De boom praat: *"Wie mijn bos betreedt... mag wel even luisteren."* Vertelt een kort verhaal (30 seconden) over het Sprookjesbos. Na het verhaal: alle units in radius 20 krijgen +15% alle stats permanent ("Wijsheid van het Bos").

**EE-27: Python van de Efteling**
- **Trigger**: In het Sprookjesbos, vind een verborgen grot met een slangenpatroon op de muur
- **Effect**: Een Python-achtbaan-geluid speelt af. De grot onthult een verborgen pad naar een bonus-arena waar je een geheime boss kunt bevechten: "De Pythonridder" (800 HP, slangenthema, spiral attack pattern).
- Dit is de Secret Boss in Boss Rush (slot 10).

**EE-28: Pardoes de Toveansen**
- **Trigger**: Gebruik alle 4 hero-abilities tegelijkertijd (binnen 2 seconden van elkaar) op de Sprookjesbos-map
- **Effect**: Een NPC verschijnt in het midden van de map: Pardoes (Efteling-mascotte-achtig figuur). *"Holadijee! Jullie hebben me geroepen!"*
- Pardoes is een tijdelijke super-unit (60 seconden): 999 HP, 50 ATK, magic attacks, vliegt. Na 60 seconden: *"Tot ziens! En vergeet niet: alles is een sprookje!"* Verdwijnt in een wolk sterren.

---

## 8. Unlock Systeem {#8-unlock-systeem}

### 8.1 Campaign Unlock Volgorde

```
                    ┌─────────────────────┐
                    │  Tutorial Campaign   │ ← Altijd beschikbaar
                    │  (3 tutorial missies) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Brabanders Campaign  │ ← Altijd beschikbaar
                    │  (12 missies)        │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │ Na Missie 5 │              │ Na Missie 9
        ┌────────▼────────┐           ┌──────▼──────────┐
        │ Limburgers Camp. │           │ Belgen Campaign  │
        │ (8 missies)      │           │ (6 missies)      │
        └────────┬────────┘           └──────┬──────────┘
                 │                            │
                 └─────────────┬─────────────┘
                               │ Na Brabanders M12
                    ┌──────────▼──────────┐
                    │ Randstad Campaign    │
                    │ (6 missies)          │
                    └──────────┬──────────┘
                               │ Na ALLE 4 campaigns
                    ┌──────────▼──────────┐
                    │ Secret Campaign      │
                    │ "Het Sprookjesbos"   │
                    │ (3 missies)          │
                    └─────────────────────┘
```

### 8.2 Missie Unlock per Campaign

Missies worden lineair unlocked (missie N+1 na voltooiing missie N), BEHALVE:
- Brabanders M5 kan overgeslagen worden als je de Limburgers campaign al hebt voltooid (je kent de Limburgers al)
- Randstad M2 vereist geen specifieke eerdere missie (standalone flashback)

### 8.3 Achievement Systeem

**Medailles per missie**:

| Medaille | Voorwaarde | Visueel |
|----------|-----------|---------|
| Bronze | Missie voltooid (Easy) | Bronzen schild |
| Silver | Missie voltooid (Medium) + 1 bonus objective | Zilveren schild |
| Gold | Missie voltooid (Hard) + alle bonus objectives | Gouden schild |
| Diamond | Gold + speedrun Gold time | Diamanten schild |

**Campaign-brede achievements**:

| Achievement | Voorwaarde | Reward |
|------------|-----------|--------|
| "Brabant Bevrijd" | Brabanders campaign voltooid | Brabanders faction splash art (wallpaper) |
| "Heuvelheld" | Limburgers campaign voltooid | Limburgers faction splash art |
| "Diplomatiek Meesterschap" | Belgen campaign voltooid | Belgen faction splash art |
| "De Andere Kant" | Randstad campaign voltooid (PEACE ending) | CEO redemption splash art |
| "Donkere Zijde" | Randstad campaign voltooid (FIGHT ending) | CEO villain splash art |
| "Sprookjesheld" | Secret campaign voltooid | Sprookjes faction splash art |
| "Perfectionist" | Alle campaigns Gold medaille op elke missie | Gouden kroon UI element |
| "De Ware Game Master" | ALLES (alle campaigns, alle bonus levels, alle achievements, alle easter eggs gevonden) | Titel boven je naam, speciale cursor skin, exclusive Narrator voice pack |

**Cross-campaign achievements**:

| Achievement | Voorwaarde |
|------------|-----------|
| "Beide Kansen" | Brabanders M3 EN Randstad M3 voltooid (zelfde slag, beide perspectieven) |
| "De Complete Diplomaat" | In Limburgers M5 diplomatiek gekozen EN in Brabanders M5 geen Limburgs gebouw vernietigd |
| "Vier Helden" | Alle 4 heroes tegelijk op het scherm in elke campaign |
| "Moreel Kompas" | In Randstad campaign altijd de "goede" keuze gemaakt (WEIGER + PEACE) |
| "Geschiedenisstudent" | Alle culturele easter eggs gevonden (EE-06 t/m EE-10) |
| "Seizoensfeester" | Het spel gespeeld op Carnaval, Koningsdag, Sinterklaas EN Kerst |

### 8.4 Cosmetic Unlocks

**Unit Skins** (puur visueel, geen stat-veranderingen):

| Skin | Unit | Unlock voorwaarde |
|------|------|------------------|
| Gouden Tractor | Tractorrijder | Brabanders M6 bonus |
| Kermis-decoratie | Boerderij (Town Hall) | Brabanders M3 bonus (speedrun) |
| Elite Mergelridder | Mergelridder | Limburgers M2 bonus |
| Gouden Kansen | Kansen | Brabanders M4 bonus (nul verliezen) |
| Praalwagen Gold | Praalwagen | Brabanders M11 bonus |
| Sprookjes-skin pack | Alle basis units | Secret Campaign voltooid |
| Corporate Casual | Alle Randstad units | Randstad campaign PEACE ending |
| Brabantse Winter | Alle Brabandse units | Kerst easter egg ontdekt |
| Carnavals-editie | Alle Brabandse units | Carnaval easter egg ontdekt |

**UI Cosmetics**:

| Item | Unlock |
|------|--------|
| Gouden resource iconen | Brabanders campaign Gold medailles |
| Sprookjes-cursor | Secret Campaign voltooid |
| Narrator voice: De Mijnbaas | Limburgers campaign voltooid |
| Narrator voice: De Frietkoning | Belgen campaign voltooid |
| Narrator voice: De CEO | Randstad campaign PEACE ending |
| Minimap-skin: Perkament | 50 missies voltooid |
| Minimap-skin: Sprookjes | Secret Campaign voltooid |

### 8.5 Cheat Code Beschikbaarheid

| Cheat Code | Beschikbaar na |
|-----------|---------------|
| WANSEN | Altijd (maar disabled achievements voor die sessie) |
| ANSEN DE PANSEN | Brabanders M3 voltooid |
| HERTANSEN JAN | Brabanders M6 voltooid |
| GUUANSEN MANSEN | Easter egg EE-02 ontdekt |
| VLAAI STORM | Limburgers campaign voltooid |
| VERGANSEN DERING | Brabanders M10 voltooid |
| SPROOKANSEN BOS | Secret Campaign voltooid |
| FRANSEN BANSEN | Brabanders campaign voltooid |
| KANSEN PAKANSEN | Alle campaigns voltooid |
| FANSEN FARE | Tutorial campaign voltooid |
| BLANSEN BANSEN | 10 missies voltooid |
| LANSEN VAN BANSEN | Secret Campaign voltooid |
| GOUDEN BRANSEN | "Perfectionist" achievement |
| EANSEN IS GENOEG | "De Ware Game Master" achievement |

**Regel**: Cheat codes in singleplayer disabled achievement-tracking voor DIE specifieke sessie. Een pop-up waarschuwt: *"Cheats geactiveerd! Achievements zijn uitgeschakeld voor deze sessie. Maar het is WEL leuk."*

---

## 9. Campaign Cutscenes {#9-campaign-cutscenes}

### 9.1 Cutscene Presentatie Formaat

**Stijl**: Comic-style panels met beperkte animatie (Ken Burns effect — langzaam zoom/pan op statische illustraties). Ondertiteld met gesproken narration.

**Technische implementatie**:
- Illustraties gegenereerd via fal.ai Flux Pro (middeleeuws-Brabantse stijl, semi-realistisch met humor)
- Typisch 3-6 panels per cutscene
- Ken Burns animatie: langzaam zoom (5%) of pan over 5-10 seconden per panel
- Tekst: ondertiteld in wit met zwarte outline, onderaan het scherm
- Voice: narrator + karakter-voicelines (ElevenLabs)
- Achtergrondmuziek: verhalende track (Suno)
- Skip-button altijd beschikbaar (maar eerste keer wordt een tooltip getoond: "Weet je het zeker? De story is het beste deel!")

**Panel stijl per campaign**:
| Campaign | Visuele stijl | Kleurpalet |
|----------|-------------|------------|
| Brabanders | Warm, volkse illustratie, middeleeuwse kaarten | Oranje, bruin, groen, goud |
| Limburgers | Donker, mysterieus, gravure-achtig | Grijs, donkergroen, blauw |
| Belgen | Kleurrijk, chaotisch, stripboek-achtig (Kuifje-stijl) | Rood, geel, zwart, goud |
| Randstad | Strak, corporate, minimalistisch | Grijs, blauw, wit, zilver |
| Sprookjesbos | Dromerig, waterverf, magisch | Alle kleuren, gloeiend |

### 9.2 Narrator Concept

**De Narrator** is een onzichtbaar personage dat WEET dat het een spel is — maar net niet genoeg om het te doorbreken. Denkt dat hij een kroniekschrijver is.

**Stemkarakter**: Warme, mannelijke stem. Brabants accent (subtiel). Soms sarcastisch, altijd betrokken. Denk: een opa die een verhaal vertelt bij het haardvuur, maar dan met kennis van militaire strategie.

**Voorbeeld narrator-stijlen**:
- **Episch**: *"En zo marcheerde het leger van Brabant. Niet omdat ze sterk waren — maar omdat ze gezellig waren."*
- **Humoristisch**: *"De CEO keek naar zijn spreadsheet en zag de waarheid. De waarheid was niet SMART geformuleerd."*
- **Emotioneel**: *"Soms vraag je je af waarom mensen vechten voor een worstenbroodje. Maar dan proef je het. En dan begrijp je het."*
- **Vierde-muur leunend**: *"Als je je afvraagt waarom die ene unit steeds 'Ansen' zegt — dat is Brabants. Wen er maar aan."*

**Voice pipeline**: Richard spreekt de narratortekst in (echt Brabants) → ElevenLabs voice clone voor consistentie.

### 9.3 Key Cutscene Momenten

**C-01: Opening (voor Tutorial)**
- **Duur**: 45 seconden (3 panels)
- **Panel 1**: Kaart van Brabant, 1473. Narrator: *"Het jaar 1473. Het Hertogdom Brabant..."*
- **Panel 2**: De Sint-Janskathedraal, gloeiend worstenbroodje op een altaar.
- **Panel 3**: Een hand grijpt het worstenbroodje. Een visitekaartje dwarrelt neer. Zoom in: "Randstad Ontwikkelingsmaatschappij — Innovatie. Efficiëntie. Synergieën."

**C-02: Na Brabanders M5 — De Alliantie**
- **Duur**: 30 seconden (2 panels)
- **Panel 1**: De Prins en De Mijnbaas schudden handen in de Grottentempel. Fakkellicht.
- **Panel 2**: Dubbele kaart: Brabant + Limburg, samen gekleurd. Narrator: *"Twee volkeren. Twee culturen. Een gemeenschappelijke vijand."*

**C-03: Brabanders M8 — Het Verraad**
- **Duur**: 40 seconden (3 panels)
- **Panel 1**: De Prins in een kooi. Regen. Zijn scepter op de grond.
- **Panel 2**: De verrader onmaskerd — een Consultant in een Brabants jasje. Narrator: *"Het ergste verraad komt niet van je vijanden."*
- **Panel 3**: Close-up van De Prins' ogen. Woede. Vastberadenheid.

**C-04: Brabanders M11 — De Slag**
- **Duur**: 60 seconden (4 panels)
- **Panel 1**: Luchtfoto van Brabant. Drie legers marcheren naar het noorden.
- **Panel 2**: De Prins, de Mijnbaas en de Frietkoning zij aan zij. Wind waait.
- **Panel 3**: De A2 vol met legers. Narrator: *"Dit is het. Het moment waar alles voor gebouwd is."*
- **Panel 4**: Explosie van kleur — de slag begint. Muziek zwelt aan.

**C-05: Brabanders M12 — De Finale**
- **Duur**: 90 seconden (6 panels — langste cutscene)
- **Panel 1**: Het Corporate Tower, 40 verdiepingen, imposant.
- **Panel 2**: De CEO op het dak. Wind. Eenzaam.
- **Panel 3**: Het Brabantse leger aan de voet. De Prins kijkt omhoog.
- **Panel 4**: De slag. Fragmenten: bierpullen, spreadsheets, confetti, kantoorpapier.
- **Panel 5**: De CEO valt. Het Worstenbroodje gloeit tussen het puin.
- **Panel 6**: De Prins houdt het Worstenbroodje omhoog. Heel Brabant juicht. Gouden licht. Narrator: *"En zo keerde het Gouden Worstenbroodje terug naar waar het hoort. Niet in een kluis. Niet in een vergadering. Maar in de handen van de mensen die er van houden."*

**C-06: Randstad M6 — PEACE Ending**
- **Duur**: 45 seconden (3 panels)
- **Panel 1**: De CEO geeft het Worstenbroodje aan De Prins. Beiden ontroerd.
- **Panel 2**: Een handdruk. Niet corporate — oprecht.
- **Panel 3**: De A2, maar nu zonder legers. Alleen mensen. Brabanders en Randstedelingen, samen. Een Starbucks NAAST een bruin cafe. Narrator: *"Misschien is de toekomst niet traditie OF innovatie. Misschien is het allebei."*

**C-07: Sprookjesbos Epiloog**
- **Duur**: 60 seconden (4 panels)
- **Panel 1**: De 4 heroes bij de Gouden Poort. Het Sprookjesbos gloeit.
- **Panel 2**: Ze kijken naar elkaar. Geen woorden nodig.
- **Panel 3**: Ze stappen door de poort. Het licht vervaagt.
- **Panel 4**: De Sprookjeskoning alleen. Kijkt naar de camera. Knipoogt. Narrator: *"Elk sprookje heeft een einde. Maar elk einde... is ook een begin."* Fade to black.

**C-08: Post-Credits — Sequel Tease**
- **Duur**: 15 seconden (1 panel)
- **Panel**: De Mijnbaas in zijn grot. De Steen van Valkenburg gloeit.
- Narrator: *"Maar dat... is een verhaal voor een andere keer."*
- Titel card: **REIGN OF BRABANT II — coming ???**

---

## Bijlage A: Campaign Statistieken

| Campaign | Missies | Geschatte speelduur | Unieke maps | Bossfights | Nieuwe units |
|----------|---------|--------------------|-----------| -----------|-------------|
| Tutorial | 3 | 0.5 uur | 3 | 0 | 0 |
| Brabanders | 12 | 6-10 uur | 12 | 3 (CEO 3-fase, Politicus, Mijnbaas test) | Alle Brabandse units progressief |
| Limburgers | 8 | 4-7 uur | 8 | 2 (CEO ondergronds, Draak) | Alle Limburgse units |
| Belgen | 6 | 3-5 uur | 6 | 1 (Politicus 2-fase) | Alle Belgische units |
| Randstad | 6 | 3-5 uur | 6 | 1 (Prins duel) | Alle Randstad units |
| Sprookjesbos | 3 | 2-3 uur | 3 | 3 (Wolf, Doornroosje/Reus/Draak, Zwarte Magiër 3-fase) | 4 Sprookjes-units |
| **TOTAAL** | **38** | **18.5-30.5 uur** | **38** | **10** | **~50** |

## Bijlage B: Bonus Level Statistieken

| Bonus Level | Unlock | Geschat uur herhaalbaarheid |
|-------------|--------|---------------------------|
| Survival Mode | Per campaign (4 varianten) | Eindeloos |
| Tower Defense | Brabanders M4 | 2-4 uur |
| Boss Rush | 2 campaigns | 1-2 uur |
| Speedrun Mode | Per campaign | Eindeloos |
| Puzzle Maps | Tutorial | 1-2 uur |
| **TOTAAL extra** | | **10+ uur** |

## Bijlage C: Easter Egg Checklist

| ID | Naam | Type | Trigger | Ontdekt? |
|----|------|------|---------|----------|
| EE-01 | De Koe | Verborgen unit | 100x klik op koe | [ ] |
| EE-02 | Guus Meeuwis | Verborgen unit | Type "BRABANT" | [ ] |
| EE-03 | De Frikandel Speciaal | Verborgen gebouw | 5 Frietkars naast elkaar | [ ] |
| EE-04 | Sinterklaas | Seizoensunit | Speel op 5 december | [ ] |
| EE-05 | De Vliegende Hollander | NPC event | Wacht 3 min bij water | [ ] |
| EE-06 | Jeroen Bosch's Tuin | Verborgen zone | Den Bosch map, zuidoosthoek | [ ] |
| EE-07 | Brabants Dialect Wiel | Audio | 10x klik factie-banner | [ ] |
| EE-08 | De ASML Machine | Verborgen gebouw | Eindhoven map, noordoosthoek | [ ] |
| EE-09 | PSV Eindhansen | Unit buff | 11 Carnavalvierders in 4-3-3 | [ ] |
| EE-10 | De Kempen Kansen | Verborgen NPC | Verken volledige maprand | [ ] |
| EE-11 | Carnaval | Seizoen | Speel rond carnaval | [ ] |
| EE-12 | Sinterklaas | Seizoen | 28 nov — 5 dec | [ ] |
| EE-13 | Koningsdag | Seizoen | 27 april | [ ] |
| EE-14 | Kerst | Seizoen | 20-31 december | [ ] |
| EE-15 | Ongeduldige Narrator | Click-based | 50x klik minimap | [ ] |
| EE-16 | Dansende Gebouwen | Click-based | 20x klik eigen gebouw | [ ] |
| EE-17 | Geheime Receptuur | Click-based | Gebouwen-sequentie | [ ] |
| EE-18 | Verborgen Mergelkamer | Map secret | Mijnrat naar specifieke rots | [ ] |
| EE-19 | Het Verdronken Dorp | Map secret | Zoom in op water | [ ] |
| EE-20 | Geheime Snelweg | Map secret | A2 afrit | [ ] |
| EE-21 | Verborgen Track | Audio | 10 min idle in menu | [ ] |
| EE-22 | Voice Line Medley | Audio | 20 units snel selecteren | [ ] |
| EE-23 | Credits Invasion | Meta | Credits uitkijken | [ ] |
| EE-24 | De Console | Meta | Type "ADMIN" in menu | [ ] |
| EE-25 | De Vierde Muur | Meta | 5x pauzeren in 1 min | [ ] |
| EE-26 | Holle Boansen | Efteling | Sprookjesbos, pratende boom | [ ] |
| EE-27 | Python van de Efteling | Efteling | Sprookjesbos, slangengrot | [ ] |
| EE-28 | Pardoes | Efteling | 4 hero abilities tegelijk | [ ] |

**Totaal**: 28 easter eggs

---

*SUB-PRD opgesteld door Game Master (Claude)*
*Parent: Reign of Brabant PRD v1.0.0*
