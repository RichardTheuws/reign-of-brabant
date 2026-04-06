# Brabanders Campaign — Missies 10, 11 & 12

**Versie**: 1.0.0
**Datum**: 2026-04-06
**Status**: Draft — Wacht op goedkeuring
**Parent Document**: `SUB-PRD-CAMPAIGN.md`
**Scope**: De laatste drie missies van "Het Gouden Worstenbroodje" — opbouw, climax en finale

---

## Voorwoord

Deze drie missies vormen het laatste derde deel van de Brabanders campaign. Na negen missies van groei — van een simpele boer in Reusel tot een alliantie die drie regio's omspant — is het tijd voor de afrekening.

**Narratieve boog**:
- **Missie 10**: De grote alliantie wordt gesmeed. Alle draden komen samen. Voorbereiding op de oorlog.
- **Missie 11**: De zwaarste veldslag in de hele campaign. Alles staat op het spel.
- **Missie 12**: De finale. Het Gouden Worstenbroodje terughalen. Episch, emotioneel, memorabel.

**Continuiteit vanuit Missie 9**: De Brabanders hebben in de Mijn van Waarheid de Receptuur ontdekt — het geheim achter het Gouden Worstenbroodje. De Limburgers zijn definitief bondgenoten. De CEO is ontmaskerd als directe vijand. De weg naar de Randstad is nog geblokkeerd door hun hoofdmacht, die zich verzamelt voor een totale invasie van Brabant.

---

### Missie 10: "De Raad van Brabant"

**Locatie**: Den Bosch — de Sint-Janskathedraal en het marktplein, met uitlopers naar de Dieze en omliggende weilanden
**Geschatte speelduur**: 30 min (Easy) / 40 min (Medium) / 50 min (Hard)

**Briefing tekst**:
> *Na de Mijn van Waarheid is er geen weg meer terug. De Randstad weet dat we de Receptuur hebben. Ze weten dat we komen. En ze bereiden zich voor.*
>
> *Maar wij ook. In Den Bosch — het kloppende hart van Brabant — roepen we de Raad van Brabant bijeen. Brabanders, Limburgers en Belgen aan dezelfde tafel. Voor het eerst in de geschiedenis.*
>
> *Bouw de grootste alliantie die het zuiden ooit heeft gezien. Maar wees gewaarschuwd: de Randstad stuurt saboteurs om de boel te saboteren. Bescherm de kathedraal. Bescherm de alliantie. En bereid je voor op oorlog.*

**Objectives**:
- **Primair**: Bouw een Tier 3-basis rond de Sint-Janskathedraal (upgrade Boerderij naar Herenboerderij)
- **Primair**: Bescherm de Sint-Janskathedraal (speciaal neutraal gebouw, 3000 HP) tegen 3 sabotagepoging-golven
- **Primair**: Voltooi 3 Alliantie-taken (zie Speciale mechanics)
- **Primair**: Bereik 50 population (leger opbouwen voor de finale)
- **Bonus**: Voltooi alle 3 Alliantie-taken binnen 15 minuten (unlocks: "Eerste Onder Gelijken" title + alliantie-units in Missie 11)
- **Bonus**: Verzamel 1000 Worstenbroodjes en 800 Bier als oorlogsvoorraad (unlocks: +25% startresources in Missie 12)

**Map layout**:
- **Grootte**: 256x256 (groot, gevarieerd terrein)
- **Start positie**: Centrum — de Sint-Janskathedraal (neutraal gebouw, niet-claimbaar maar verdedigbaar) + Boerderij ten zuiden ervan. 8 Boeren, 6 Carnavalvierders, 4 Kansen, 2 Boerinnen, Prins van Brabansen.
- **Limburgse bondgenoot**: Oost — kleine basis met Grottentempel. Mijnbaas hero + 6 Schutterij + 2 Mergelridders. AI-gestuurd.
- **Belgische bondgenoot**: West — kleine basis met Belgisch stadhuis. Frietkoning hero + 6 Bierbouwers + 2 Frituurridders. AI-gestuurd.
- **Vijand posities**: Noorden (hoofdmacht) + verborgen saboteurs die op getimede momenten spawnen vanuit het Fog of War
- **Speciale features**: De Sint-Janskathedraal als centraal gebouw — enorm, imposant, met glas-in-loodramen die oplichten bij narratieve events. De Dieze (rivier) loopt oost-west en vormt een natuurlijke verdedigingslinie in het noorden. 3 bruggen over de Dieze als chokepoints. Marktplein rondom de kathedraal fungeert als Gezelligheid-zone (+50% Gezelligheid generatie). 4 Gold Mines (2 dichtbij, 2 contested voorbij de Dieze). Weilanden in het zuiden met boomclusters.
- **Atmosfeer**: Herfstavond, warm licht uit de kathedraal, fakkels op het marktplein, opkomende spanning

**Beschikbare units/gebouwen**:
- Units: Alle Brabandse units inclusief Tier 3 (Frituurmeester, Praalwagen). Beide heroes (Prins + Boer van Brabansen).
- Gebouwen: Alle Brabandse gebouwen. Dorpsweide krijgt extra belang (Gezelligheid voor Alliantie-taken).
- Bondgenoot units (AI-gestuurd, niet controleerbaar): Limburgse en Belgische eenheden helpen bij verdediging.

**Vijandelijke samenstelling**:
- **Sabotage Golf 1 (minuut 5)**: 6 Hipsters (stealth, proberen kathedraal te "gentrificeren") + 4 Managers als afleiding vanuit het noorden over de westbrug
- **Sabotage Golf 2 (minuut 12)**: 3 Influencers (infiltreren je basis, debuffen je units met "Negatieve Reviews") + 8 Managers + 2 Consultants vanuit het noorden over alle 3 bruggen
- **Sabotage Golf 3 (minuut 20)**: De Politicus (hero) + 12 Managers + 4 Corporate Advocaten + 2 Vastgoedmakelaars — volle aanval op de kathedraal. De Politicus gebruikt Kamerdebat om verdediging te stoppen.
- **Verborgen saboteurs**: 2 Stagiaires disguised als neutrale NPC's op het marktplein — worden vijandig bij Golf 2 en proberen een gebouw te saboteren (Vijandige Overname light: gebouw gaat 30s offline)

**Speciale mechanics — Alliantie-taken**:

De 3 Alliantie-taken moeten voltooid worden om de Raad officieel te laten slagen. Ze zijn parallel uitvoerbaar:

| Taak | Beschrijving | Voltooiingsvoorwaarde |
|------|-------------|----------------------|
| **Limburgse Eed** | Stuur de Prins naar de Limburgse basis voor een ceremonie | Prins moet 30 seconden ononderbroken bij de Grottentempel staan (combat onderbreekt) |
| **Belgisch Verdrag** | Lever 200 Worstenbroodjes af bij de Belgische basis als diplomatiek geschenk | Stuur een Boer met resources naar het Belgisch stadhuis |
| **De Receptuur Onthullen** | Breng de Boer van Brabansen naar de kathedraal om de Receptuur te presenteren aan de Raad | Boer van Brabansen moet 20 seconden in de kathedraal kanaliseren. Vijanden proberen dit te onderbreken. |

Elke voltooide taak triggert een narratief event EN versterkt de alliantie-bondgenoten (+10% stats permanent voor die factie).

**Trigger events**:
1. **Start**: Cutscene — camera sweept over Den Bosch bij avondlicht. De kathedraal gloeit. Narrator: *"Er zijn momenten die de geschiedenis veranderen. Niet door zwaarden of kanonnen — maar door handen die elkaar vinden. Dit is zo'n moment."*
2. **Prins arriveert bij Limburgse basis (Taak 1)**: Mijnbaas stapt naar voren. *"Brabander. We zijn begonnen als vreemden. In de Mijn van Waarheid werden we bondgenoten. Vandaag..."* Hij knielt. *"Vandaag worden we broeders."* Prins: *"Sta op, vriend. In Brabant knielen we nie. We proosten."*
3. **Resources afgeleverd bij Belgen (Taak 2)**: Frietkoning proeft een worstenbroodje. Stilte. Zijn ogen worden groot. *"Sacrebleu... dit is... LEKKERDER DAN FRIETEN."* Dramatische stilte. *"Maar vertel dat aan niemand."*
4. **Receptuur onthuld in kathedraal (Taak 3)**: Het glas-in-lood begint te gloeien. De Boer van Brabansen heft de Receptuur omhoog. Narrator: *"En daar, in het hart van de kathedraal waar duizend jaar geleden het eerste Worstenbroodje werd gebakken, zwoer de Raad van Brabant een eed: het Gouden Worstenbroodje komt thuis."* Alle bondgenoten roepen: *"VOOR BRABANT!"*
5. **Sabotage Golf 1**: Alarm. Kansen-scout: *"Beweging bij de bruggen! En... zijn dat Hipsters? Ze proberen de kathedraal te... ze zetten er een pop-up koffiebar IN!"*
6. **Saboteurs ontmaskerd (Golf 2)**: *"Die Stagiaires op het plein — dat zijn GEEN Stagiaires! Ze hebben laptops met RANDSTAD-logo's!"*
7. **De Politicus arriveert (Golf 3)**: Politicus: *"Jullie 'alliantie' is illegaal. Ik heb hier een wet... artikel 47b... lid 3..."* Prins: *"Artikel dit."* Activeert Carnavalsrage.
8. **Victory (alle taken voltooid + kathedraal overleeft)**: Epische cutscene. De drie leiders staan samen op het bordes van de kathedraal, uitkijkend over het noorden. Prins: *"Morgen marcheren we."* Mijnbaas: *"Limburg is gereed."* Frietkoning: *"De frieten zijn warm."* Narrator: *"De Raad van Brabant was gesmeed in vuur en vertrouwen. En de Randstad... de Randstad had geen idee wat er op hen af kwam."*

**Difficulty scaling**:
- **Easy**: Kathedraal heeft 4000 HP. Sabotage-golven zijn 30% kleiner. Alliantie-taken hebben geen timer. Bondgenoten starten sterker (+20% stats).
- **Medium**: Standaard.
- **Hard**: Kathedraal heeft 2500 HP. Sabotage-golven zijn 30% groter + een 4e golf op minuut 25 (CEO verschijnt persoonlijk). Alliantie-taken moeten binnen 20 minuten voltooid. Bondgenoten starten zwakker (-15% stats). Verborgen saboteurs: 4 in plaats van 2.

**Victory condition**: Sint-Janskathedraal overleeft + alle 3 Alliantie-taken voltooid + Sabotage Golf 3 overleefd.
**Defeat condition**: Sint-Janskathedraal vernietigd OF eigen Boerderij vernietigd.

**Nieuwe mechanics geintroduceerd**:
- Alliantie-taken als parallelle quest objectives (multi-objective management)
- Bescherm-een-gebouw met vijandelijke sabotage (niet puur combat maar stealth-infiltratie)
- Diplomatie door resource-giften (economie als diplomatie-tool)
- Kanaliseer-mechanic (hero moet ongestoord bij een locatie staan)
- Verborgen vijanden die zich onthullen mid-missie

**Story beats**:
- De Raad van Brabant als emotioneel hoogtepunt — drie culturen worden een
- De Receptuur als symbool: het gaat niet om het Worstenbroodje, het gaat om wat het BETEKENT
- De Politicus als komische maar gevaarlijke antagonist
- Setup voor Missie 11: het leger is klaar, de alliantie is gesmeed, de oorlog begint
- Thema: eenheid in verscheidenheid — Brabant, Limburg en Belgie zijn anders maar samen sterker

**Missie-specifieke muziek**:
- **Ambient**: Warme orchestrale track, kerkklokken, koorgeluiden op de achtergrond. Sfeer: plechtig maar hoopvol.
- **Combat**: Brabanders faction theme met zwaardere percussie en lagere tonen. Spanning stijgt bij elke golf.
- **Alliantie-taak voltooid**: Korte triomfantelijke stinger (3-5 seconden) — fanfare met accordeon, cello en hoorn.
- **Victory**: Volledige alliantie-anthem — alle drie factie-themes verweven tot een nieuw thema. Emotioneel, episch, ganzenbumpen.
- **Suno prompt suggestie**: "Epic alliance anthem, Dutch folk accordion meets underground cello meets Belgian musette, building choir, cathedral bells, medieval war council ambiance, triumphant crescendo, 95 BPM, emotional and powerful"

---

### Missie 11: "De Slag om de A2"

**Locatie**: De A2-corridor — van Den Bosch tot Utrecht, een uitgestrekt slagveld langs de snelweg
**Geschatte speelduur**: 40 min (Easy) / 55 min (Medium) / 70 min (Hard)

**Briefing tekst**:
> *Ze kwamen bij het ochtendgloren. Langs de A2, in een eindeloze kolonne van pakken en PowerPoints, marcheerde de Randstad naar het zuiden. Meer dan we ooit gezien hadden. Meer dan we ooit hadden durven vrezen.*
>
> *Dit is het. De Randstad gooit ALLES in de strijd. De CEO leidt persoonlijk de aanval. De Politicus stuurt de reserves. En achter hen... de hele bureaucratische machine van Nederland.*
>
> *Maar wij staan niet alleen. Brabant, Limburg en Belgie — zij aan zij. Dit is de dag waarop we laten zien dat het zuiden nie buigt.*
>
> *Dit is de Slag om de A2. Win, en de weg naar de Randstad ligt open. Verlies... en er IS geen Brabant meer.*

**Objectives**:
- **Primair**: Verdedig de Brabantse Linie (3 forten langs de A2: Fort Den Bosch, Fort Veghel, Fort Best — elk een Town Hall met 2500 HP)
- **Primair**: Overleef 6 aanvalsgolven (elke golf zwaarder dan de vorige)
- **Primair**: Vernietig het Randstad Veldkwartier (mobiel Hoofdkantoor dat elke 5 minuten positie verandert langs de A2, 4000 HP)
- **Primair**: Versla De CEO OF De Politicus (minstens 1 vijandelijke hero moet vallen)
- **Bonus**: Alle 3 forten overleven met meer dan 50% HP (unlocks: "Brabant Onverwoestbaar" title + alle forten krijgen Kantoor-torens in Missie 12)
- **Bonus**: Win met minder dan 20 unit verliezen (unlocks: "Meester Strateeg" medal — levert een eenmalige Carnavalsrage op bij start Missie 12)

**Map layout**:
- **Grootte**: 384x384 (XL — de grootste campaign map)
- **Start positie**: Zuid-centrum — Fort Den Bosch. Volledig uitgebouwde Tier 3 basis. 30 start-units inclusief beide heroes.
- **Fort Veghel**: Centrum-oost. AI-gecontroleerde Brabantse voorpost. 12 Carnavalvierders + 4 Kansen + 2 Tractorrijders + muren.
- **Fort Best**: Centrum-west. AI-gecontroleerde Brabantse voorpost. 10 Carnavalvierders + 4 Frituurmeesters + 2 Muzikanten + muren.
- **Limburgse flank**: Oost. Mijnbaas + 15 Limburgse units. Bewaken de oostelijke bossen en de Maas-oversteek. Hebben tunnelnetwerk (3 Grotten verbonden).
- **Belgische flank**: West. Frietkoning + 12 Belgische units. Bewaken de westelijke wegen. Hebben een Chocolaterie die Diplomatieke Verwarring mogelijk maakt.
- **Randstad (noorden)**: De A2 loopt van noord naar zuid door het midden van de map. 4 Randstad-legervleugels marcheren vanuit het noorden. Veldkwartier beweegt langs de A2.
- **Speciale features**:
  - **De A2** als centrale as: brede weg (+30% movement speed) die de map in tweeen deelt. Strategisch: snel troepen verplaatsen, maar de vijand ook.
  - **Bruggen over de Dommel en de Aa**: 4 bruggen als chokepoints. Vernietigbaar (500 HP) — als je een brug vernietigt, moet de vijand omlopen.
  - **Boerenland**: Weilanden met schuren (destructible cover), boomclusters, windmolens (decoratief).
  - **Heuvelrug**: Centraal-oost — hoger terrein geeft sight range bonus en ranged attack bonus (+10% range).
  - **Verlaten tankstation**: Neutraal gebouw op de A2. Wie het claimt krijgt een eenmalige boost: 200 resources + 4 gratis Carnavalvierders.
  - **Randstad Veldkwartier**: Mobiel — verplaatst zich elke 5 minuten over de A2 (noord → centrum → oost → west → terug naar noord). Heeft 4 Kantoor-torens die meebewegen. Produceert continu (1 unit/12s).
- **Atmosfeer**: Ochtendmist die langzaam optrekt, stofwolken van marcherende legers, verre explosies, het geluid van duizenden voetstappen op asfalt

**Beschikbare units/gebouwen**:
- Units: Alle Brabandse units, alle Tier 3, beide heroes. Limburgse en Belgische bondgenoten (AI-gestuurd).
- Gebouwen: Alle Brabandse gebouwen. Fort-specifieke verdedigingen (muren, Kerken als defense towers).
- **Nieuw**: Als je de bonus van Missie 10 hebt behaald, starten de bondgenoten met +10% stats en heb je 6 extra alliantie-units (2 Mergelridders + 2 Frituurridders + 2 Schutterij) die je WEL zelf kunt controleren.

**Vijandelijke samenstelling** (totaal ~120 units over 6 golven — de grootste battle in de campaign):

| Golf | Minuut | Richting | Samenstelling | Speciaal |
|------|--------|----------|---------------|----------|
| **1: Voorhoede** | 3 | A2 noord → centrum | 12 Managers, 4 Stagiaires (scouts), 2 Hipsters | Verkenning — zwak maar snel. Test je verdediging. |
| **2: Westvleugel** | 8 | Noordwest → Fort Best | 10 Managers, 4 Consultants, 3 Influencers, 2 HR-medewerkers | Influencers debuffen Fort Best-garrisoen. |
| **3: Oostvleugel** | 13 | Noordoost → Fort Veghel + Limburgse flank | 12 Managers, 6 Corporate Advocaten, 2 Vastgoedmakelaars | Vastgoedmakelaars focussen op muren. De CEO leidt deze aanval. |
| **4: Tangbeweging** | 18 | West EN oost tegelijk | 8 Managers + 3 Consultants (west) + 8 Managers + 3 Consultants (oost) | Splitsen je leger — keuze: welk fort red je eerst? |
| **5: Hoofdmacht** | 24 | A2 frontaal + flanken | De Politicus + 15 Managers + 8 Corporate Advocaten + 4 Vastgoedmakelaars + 3 Influencers + 2 HR-medewerkers | De zwaarste golf. Politicus gebruikt Kamerdebat om je verdediging te breken. |
| **6: Alles of Niets** | 30 | Alle richtingen | CEO + Politicus + 20 Managers + 10 Corporate Advocaten + 4 Vastgoedmakelaars + alle overgebleven vijanden | Finale push. Als het Veldkwartier nog staat, produceert het versneld (1/8s). |

**Veldkwartier-mechanic**:
Het mobiele Veldkwartier is het strategische hart van de vijand. Zolang het staat:
- Vijandelijke units krijgen +10% alle stats (command aura)
- Elke 12 seconden spawnt een nieuwe unit
- Het verplaatst zich elke 5 minuten (in een voorspelbaar patroon over de A2)
- **Strategie**: Val het Veldkwartier aan wanneer het dichtbij is en zwak bewaakt — maar dit betekent dat je forten onverdedigd zijn

**Trigger events**:
1. **Start**: Epische cutscene — drone-perspectief. Camera vliegt laag over de A2 vanuit het zuiden, langs de forten, en dan over de horizon waar je de Randstad-legermacht ziet aankomen. Een zee van pakken. Narrator: *"De A2. Ooit de levensader van Nederland. Vandaag de frontlinie van een oorlog die niemand zag aankomen."*
2. **Golf 1 arriveert**: Alarm in alle forten. Prins: *"Daar zijn ze. Brabanders — ge weet waarvoor we vechten. Nie voor grond. Nie voor goud. Maar voor wie we ZIJN."*
3. **Golf 3 (CEO verschijnt)**: CEO op een zwarte tractor (custom mount): *"Ik heb de kwartaalcijfers bekeken. Brabant is een VERLIESPOST. En ik saneer verliesposten."* Mijnbaas: *"Die man heeft duidelijk nooit Limburgse vlaai geproefd."*
4. **Eerste brug vernietigd (door speler)**: Narrator: *"De brug is gevallen! De vijand moet omlopen — maar dat gaat niet lang duren."* Strategische tip.
5. **Fort onder 30% HP**: Alarm. *"Fort [naam] houdt het nie vol! Stuur versterkingen!"*
6. **Veldkwartier onder aanval**: CEO (als in de buurt): *"BESCHERM HET VELDKWARTIER! Dat is mijn HYBRIDE WERKPLEK!"*
7. **Golf 5 (De Politicus)**: Politicus: *"In naam van de democratie eisen wij overgave!"* Frietkoning: *"In naam van de frieten eisen wij dat ge opflikkert!"*
8. **Golf 6 start**: Narrator: *"Dit is het. Hun laatste kaart. Als we dit overleven..."* Prins: *"DAN GAAN WE NAAR DE RANDSTAD!"* Alle bondgenoten schreeuwen oorlogskreten.
9. **Victory (Veldkwartier vernietigd + minstens 1 hero verslagen)**: Het Randstad-leger vlucht over de A2 naar het noorden. Prins staat op een heuvel, kijkend naar de vluchters. *"Rennen maar. Morgen komen WIJ naar de Randstad."* Mijnbaas naast hem: *"Ik hoop dat ze parking hebben. De Mergelridders nemen veel ruimte in."* Frietkoning: *"En ik neem de frietketel mee. Voor de overwinningsfriet."* Camera zoomt uit over het slagveld. Narrator: *"Op deze dag, op de A2, brak de Randstad. En heel het zuiden wist: het was nog maar het begin."*

**Difficulty scaling**:
- **Easy**: 5 golven in plaats van 6. Golven 30% kleiner. Bondgenoten +25% stats. Veldkwartier statisch (beweegt niet). Forten 3500 HP. Bruggen onverwoestbaar (altijd chokepoint).
- **Medium**: Standaard (6 golven, 2500 HP forten, mobiel Veldkwartier).
- **Hard**: 7 golven (extra golf op minuut 35: "De Reorganisatie" — CEO gebruikt Ontslagronde op ALLE overgebleven vijandelijke units, die +50% stats krijgen). Golven 35% groter. Bondgenoten -25% stats. Forten 2000 HP. Veldkwartier verplaatst elke 3 minuten. Extra Kantoor-torens bij de forten (werken nu voor de vijand — hij heeft ze gekaapt). Productie Veldkwartier: 1/7s.

**Victory condition**: Alle 3 forten overleven (minstens 1 HP per fort) + Randstad Veldkwartier vernietigd + minstens 1 vijandelijke hero verslagen.
**Defeat condition**: Een van de 3 forten vernietigd (Town Hall op 0 HP).

**Nieuwe mechanics geintroduceerd**:
- Grootschalige multi-front oorlog met 6 aanvalsgolven (piekmoment van de campaign qua schaal)
- Mobiel vijandelijk Veldkwartier (bewegend strategisch doel)
- Vernietigbare bruggen als tactische keuze
- Alliantie-warfare met 3 facties simultaan (meest complexe bondgenoot-interactie)
- A2 als strategisch terrein (speed bonus, maar voor beide zijden)

**Story beats**:
- Het keerpunt van de oorlog — de dag dat Brabant terugvocht
- De schaal van de Randstad-dreiging wordt voor het eerst volledig zichtbaar
- Brabant, Limburg en Belgie samen op het slagveld — het emotionele hoogtepunt van de alliantie
- De CEO en Politicus als directe tegenstanders in het veld
- De overwinning opent de weg naar de Randstad — setup voor de ultieme finale
- Thema: samen sta je sterk. Alleen had geen enkele factie dit overleefd.

**Missie-specifieke muziek**:
- **Pre-battle**: Stille spanning. Lage strijkers, hartslag-ritme, wind over weilanden. De stilte voor de storm.
- **Golf 1-3**: Battle-theme met stijgende intensiteit. Brabanders faction-percussie, steeds meer instrumenten.
- **Golf 4-5**: Volledige oorlogsmuziek. Alle drie factie-themes verweven (Brabant-accordeon + Limburg-cello + Belgie-klarinet) met zware drums en koper. Koor op de achtergrond.
- **Golf 6**: Climax-track. Tempo versnelt. Alles komt samen. Het moet voelen als het einde van de wereld.
- **Victory**: Triomfantelijk, maar met ondertoon van melancholie — er zijn offers gebracht. Langzame build naar een hoopvolle fanfare.
- **Suno prompt suggestie**: "Epic massive battle orchestral, three armies fighting together, Dutch folk accordion and Belgian clarinet and underground cello unite, thundering war drums, brass fanfare building through 6 waves, choir crescendo, medieval total war meets Lord of the Rings Helm's Deep, 130 BPM climax, emotional triumph finale"

---

### Missie 12: "Het Gouden Worstenbroodje" (Finale)

**Locatie**: De Randstad — een megalomane metropool van glas, staal en vergaderzalen. Amsterdam/Den Haag hybride. Het Corporate Tower domineert de skyline.
**Geschatte speelduur**: 35 min (Easy) / 50 min (Medium) / 65 min (Hard)

**Briefing tekst**:
> *Dit is het, Brabant.*
>
> *Achter ons liggen twaalf dorpen, drie allianties en een oorlog die begon met een gestolen worstenbroodje. Voor ons ligt de Randstad. Een stad van glas en staal, waar de zon nauwelijks doorheen komt. Ergens daarbinnen — in de kluis van het Corporate Tower, veertig verdiepingen hoog — ligt het Gouden Worstenbroodje.*
>
> *Het wordt niet makkelijk. De Randstad heeft drie verdedigingsringen. Kantoor-torens op elke hoek. En De CEO wacht op ons op het dak van zijn toren, met zijn "exit-strategie".*
>
> *Maar wij hebben iets dat hij nooit zal begrijpen. Wij hebben gezelligheid. Wij hebben Limburgse tunnels en Belgische frieten. Wij hebben een Prins die danst in de regen en een Boer die een tractor kan besturen door een kantoorgebouw heen.*
>
> *Haal het Worstenbroodje terug. Beeindig Project Gentrificatie. En laat de Randstad weten: Brabant buigt nie.*
>
> *VOOR HET WORSTENBROODJE!*

**Objectives**:
- **Primair**: Bouw een aanvalsbasis aan de zuidrand van de Randstad
- **Primair**: Doorbreek de 3 verdedigingsringen (Buitenwijken → Bedrijventerrein → Centrum)
- **Primair**: Vernietig het Corporate Tower (Randstad Tier 3 HQ, 5000 HP, bewaakt door alles wat de Randstad heeft)
- **Primair**: Versla De CEO in een 3-fasen boss fight
- **Primair**: Claim het Gouden Worstenbroodje (kanaliseer 15 seconden bij het verwoeste Corporate Tower met minstens 1 hero)
- **Bonus**: Versla zowel De CEO als De Politicus (unlocks: "Totale Overwinning" achievement + geheime epiloog cutscene)
- **Bonus**: Win met 0 hero deaths gedurende de hele missie (unlocks: Brabanders gold skin voor alle units + geheime post-credits scene)

**Map layout**:
- **Grootte**: 320x320 (XL)
- **Start positie**: Zuiden — open poldergebied aan de rand van de Randstad. Genoeg ruimte voor een basis. 3 Gold Mines, boomclusters. De A2 loopt recht naar het noorden de stad in.
- **Vijand positie**: Noorden + centrum — de Randstad metropool, opgebouwd in 3 concentrische ringen.
- **Ring 1 — De Buitenwijken** (zuidelijke helft van de stad):
  - Vinex-wijken (vijandige housing — vernietigen verlaagt enemy pop cap)
  - 2 Kantoor-torens bij de stadspoorten
  - Lichte verdediging: patrouilles van Managers + Hipsters
  - Neutraal gebouw: "De Laatste Brabantse Bakker" — NPC bakkerij in de Vinex-wijk. Stuur een Boer erheen voor 300 bonus resources + een emotioneel moment.
- **Ring 2 — Het Bedrijventerrein** (midden):
  - Coworking Spaces (barracks, produceren vijandelijke units)
  - Starbucks-gebouwen (genereren Havermoutmelk = versterken vijand)
  - 4 Kantoor-torens op kruispunten
  - Zwaardere verdediging: Corporate Advocaten, HR-medewerkers, Influencers
  - De Politicus patrouilleert hier met een elite-escorte
  - Speciale feature: "De Vergadermachine Mk II" — een verbeterde versie van de Eindeloze Vergadermachine uit Missie 10. AoE stun-pulse elke 40 seconden in een groot gebied. Moet vernietigd worden (2000 HP) om Ring 3 effectief aan te vallen.
- **Ring 3 — Het Centrum** (noorden, rondom Corporate Tower):
  - Vergaderzalen (produceren elite units)
  - Parkeergarages (opslag — vernietigen stopt vijandelijke productie tijdelijk)
  - 6 Kantoor-torens in een ring rondom het Corporate Tower
  - Corporate Tower zelf: 40 verdiepingen (visueel imposant), 5000 HP, onkwetsbaar zolang minstens 3 Kantoor-torens in Ring 3 intact zijn
  - De CEO bevindt zich op het dak van het Corporate Tower
- **Limburgse bondgenoot**: Flankeert vanuit het oosten. Mijnbaas + 15 Limburgse units. Tunnelnetwerk geeft verrassingsaanval-optie op Ring 2.
- **Belgische bondgenoot**: Flankeert vanuit het westen. Frietkoning + 12 Belgische units. Diplomatieke Verwarring bruikbaar op Ring 1 voor makkelijke doorbraak.
- **Speciale features**:
  - **A2 snelweg**: Loopt van start tot Ring 3. Snelle route (+30% speed) maar ook de best verdedigde weg.
  - **Zij-ingangen**: Oost (industriegebied, minder verdedigd maar verder van Corporate Tower) en West (haven, vernietigbare kranen als obstakels).
  - **De Gracht**: Water rondom Ring 3. 2 bruggen (zwaar verdedigd) + 1 geheime tunnel-ingang (alleen beschikbaar als Limburgers Grot-connectie hebben vanuit Missie 9 bonus).
  - **Easter egg**: Een klein parkje in Ring 1 met een bordje: "Hier stond ooit een arcade. Nu is het een flex-werkplek." — referentie naar de 3D Game World landing page.
- **Atmosfeer**: Koud ochtendlicht door wolkenkrabbers. Staal en glas. Het contrast met het warme Brabant is scherp. Maar naarmate je de stad verovert, verschijnen er scheuren: oranje confetti, carnavalsbeelden, het geluid van accordeons.

**Beschikbare units/gebouwen**:
- Units: ALLES. Alle Brabandse units, alle tiers, beide heroes.
- Gebouwen: Alle Brabandse gebouwen. Dorpsweide is extra belangrijk (Gezelligheid voor Carnavalsrage in de finale).
- Bondgenoten: Mijnbaas + 15 Limburgse units. Frietkoning + 12 Belgische units. (Versterkt als je Missie 10 bonus behaalde.)
- **Nieuw**: Indien Missie 11 bonus (alle forten >50% HP) behaald: start je met 2 extra Kantoor-torens (defense) bij je basis.

**Vijandelijke samenstelling**:

| Zone | Verdediging | Totaal |
|------|-------------|--------|
| **Ring 1** | 10 Managers, 4 Consultants, 4 Hipsters, 2 Kantoor-torens, 4 Vinex-wijken | ~18 units |
| **Ring 2** | 14 Managers, 6 Corporate Advocaten, 4 HR-medewerkers, 3 Influencers, 2 Vastgoedmakelaars, De Politicus + 4 elite escorte, 4 Kantoor-torens, 2 Coworking Spaces, 2 Starbucks | ~33 units |
| **Ring 3** | 12 Managers, 8 Corporate Advocaten, 4 Vastgoedmakelaars (focus op siege defense), 6 Kantoor-torens, 2 Vergaderzalen, 2 Parkeergarages | ~24 units |
| **Corporate Tower** | De CEO (boss, 3 fasen), 4 Elite Corporate Advocaten (200 HP elk, bodyguards) | 5 units |
| **Productie** | Coworking Spaces: 1 unit/15s. Vergaderzalen: 1 elite unit/20s. Starbucks: +10% stats aura. | Continu |

Totaal startleger: ~80 units + continue productie. De grootste vijandelijke macht in de campaign.

**Boss Fight — De CEO (3 fasen)**:

De CEO-boss fight is het hoogtepunt van de hele campaign. Hij wordt getriggerd wanneer het Corporate Tower onder 50% HP komt.

| Fase | CEO HP | Locatie | Mechanics | Dialoog |
|------|--------|---------|-----------|---------|
| **Fase 1: "De Board Room"** | 500 → 350 HP | Op het dak van Corporate Tower | Standaard CEO abilities (Kwartaalcijfers, Golden Handshake). Roept 4 Stagiaires op als schild elke 30 seconden. Corporate Tower regenereert langzaam (50 HP/min) zolang deze fase duurt. | CEO: *"Jullie snappen het niet. Dit kantoor is gebouwd op SYNERGIE. Het kan niet vallen!"* |
| **Fase 2: "De Elevator Pitch"** | 350 → 175 HP | CEO springt van het dak, landt in Ring 2 | CEO krijgt +50% movement speed. Gebruikt Ontslagronde agressief (sacrificet eigen units voor buffs). Rent van positie naar positie — je moet hem achtervolgen. Elke 20 seconden probeert hij een Vijandige Overname op een van je gebouwen. | CEO: *"De kwartaalcijfers spreken voor ZICH! Brabant is een KOSTENPOST!"* Prins: *"En gij zijt een VERLIESPOST!"* |
| **Fase 3: "De Gouden Handdruk"** | 175 → 0 HP | CEO's laatste stand bij de ruines van het Corporate Tower | CEO wordt desperate. ALLE stats +50%. Permanent Ontslagronde actief (alle nabije vijandelijke units zijn gebuffd). Gebruikt Golden Handshake constant (3s cooldown in plaats van 60s). Probeert Vijandige Overname op je Town Hall. Bij <75 HP: enrage — AoE damage pulse elke 5 seconden, 20 damage. | CEO: *"IK... BEN... DE... SYNERGIEEEEE!"* Bij dood: *"Dit... dit stond niet... in het businessplan..."* Hij laat een gouden visitekaartje vallen. |

**Trigger events**:
1. **Start**: Epische opening. Camera volgt het Brabantse leger over de A2, richting de Randstad-skyline. De zon komt op achter het Corporate Tower. Prins loopt vooraan, scepter geheven. Achter hem: Carnavalvierders, Tractorrijders, Praalwagens, Muzikanten. Op de flanken: Limburgse Mergelridders, Belgische Frituurridders. Narrator: *"En zo marcheerden ze. Boeren die helden waren geworden. Mijnwerkers die het daglicht kozen. Diplomaten die voor het eerst kozen om te vechten. Op weg naar een stad van glas, om een worstenbroodje van goud terug te halen."* Prins: *"BRABANT! LIMBURG! BELGIE! Vandaag halen we terug wat van ons is. VOOR HET WORSTENBROODJE!"* Het hele leger: *"VOOR HET WORSTENBROODJE!"*
2. **Ring 1 doorbroken**: Het eerste stuk van de stad kleurt oranje. Confetti verschijnt. Carnavalsmuziek begint zachtjes. *"De buitenwijken zijn van ons. Maar het echte gevecht begint nu pas."*
3. **"De Laatste Brabantse Bakker" gevonden (Ring 1)**: Een oud vrouwtje in een klein bakkerswinkeltje tussen de Vinex-wijken. *"Jullie zijn hier! Na al die tijd!"* Ze geeft je een speciaal worstenbroodje: *"Dit is het laatst dat ik heb gebakken met het ECHTE recept. Neem het mee. Het brengt geluk."* Effect: +10% alle stats voor alle units, 120 seconden. De Prins knielt: *"We komen terug, mevrouw. Met het Gouden Worstenbroodje. Dat beloof ik."*
4. **Vergadermachine Mk II vernietigd (Ring 2)**: Enorme explosie van PowerPoint-slides. Alle vijandelijke units in de buurt worden 8 seconden gestunt. Narrator: *"De Vergadermachine is niet meer! De eindeloze vergadering is eindelijk voorbij!"*
5. **De Politicus confrontatie (Ring 2)**: Politicus: *"Dit is een SCHENDING van het bestuursrecht! Artikel 12! Lid 7! Sub-b!"* Frietkoning: *"Sub-DIT!"* (gooit een friet). Als de Politicus verslagen wordt: *"Ik... ik eis een hertelling..."*
6. **Ring 2 doorbroken**: Meer van de stad kleurt oranje. Muziek wordt luider. *"Het bedrijventerrein is gevallen. Alleen het centrum nog. Alleen het Corporate Tower."*
7. **Ring 3 betreden**: Camera kijkt omhoog naar het Corporate Tower. 40 verdiepingen van donker glas. CEO staat op het dak, silhouet tegen de hemel. CEO (megafoon): *"Welkom in MIJN wereld, Brabanders. Maar ik moet jullie teleurstellen: het Worstenbroodje... dat heb ik OMGESMOLTEN tot een gouden managementboek."* Stilte. Dan de Prins, kalm: *"Ge liegt. En dat weten we allebei."*
8. **Corporate Tower kwetsbaar (3 Kantoor-torens in Ring 3 vernietigd)**: Het schild rond het Corporate Tower valt. *"Het Tower is kwetsbaar! VAL AAN! Alles wat je hebt!"*
9. **Corporate Tower onder 50% HP**: Boss fight begint. CEO springt van het dak. *"Goed dan. Als jullie het op de harde manier willen... laat me jullie mijn EXIT-STRATEGIE tonen."*
10. **CEO verslagen (Fase 3)**: Het Corporate Tower begint te scheuren. Langzaam, dan sneller. Glas valt. Staal buigt. En dan — uit het puin, een gouden gloed. Het Gouden Worstenbroodje. Intact. Stralend.
11. **Worstenbroodje geclaimd (15 seconden kanaliseren)**: FINALE CUTSCENE (zie hieronder).

**Finale Cutscene**:

De Prins pakt het Gouden Worstenbroodje op. Het licht wordt warm. De koude Randstad-skyline begint te veranderen — glas wordt hout, staal wordt steen, de grijze lucht breekt open en zonlicht stroomt naar binnen.

Prins (fluisterend): *"Het is... warm."*

Hij draait zich om naar zijn leger. Alle bondgenoten staan samen: Brabanders, Limburgers, Belgen. Stilte.

Prins (luid): *"HET WORSTENBROODJE IS THUIS!"*

Gejuich. Confetti. Carnavalsmuziek. De Mijnbaas klopt de Prins op de schouder. De Frietkoning huilt in zijn frietvet. De Boer van Brabansen knuffelt een Tractorrijder.

Narrator: *"En zo eindigde de reis die begon in Reusel. Een boer die een opzichter werd. Een opzichter die een commandant werd. Een commandant die een held werd. Het Gouden Worstenbroodje — het symbool van alles wat Brabant is — was terug waar het hoorde."*

Camera trekt langzaam terug. We zien heel Brabant. Dorpen die feest vieren. Kermissen die draaien. Cafes die vollopen.

Narrator: *"Maar dit was nooit het verhaal van een worstenbroodje. Het was het verhaal van een volk dat ontdekte dat het samen sterker was dan alleen. Dat gezelligheid geen zwakte is, maar de grootste kracht die er bestaat."*

Zwart. Titel: **"Het Gouden Worstenbroodje — Einde"**

Credits rollen. Na de credits...

**Post-credits scene**:
Een donkere mergelgrot. De Mijnbaas van Limburg staart naar een kaart aan de muur. Naast hem staat De Maasmansen.

- Mijnbaas: *"Ze hebben hun Worstenbroodje terug. Mooi zo. Ze verdienen het."*
- Maasmansen: *"En nu?"*
- Mijnbaas (draait zich om, ogen glinsteren): *"En nu... willen WIJ ook iets gouden."*
- Camera zoomt in op de kaart. Een rode cirkel rond een locatie diep onder de Maas. Ernaast, in oud schrift: **"De Gouden Vlaai"**
- Zwart. Titel verschijnt: **"Reign of Brabant II — De Vlaaienoorlog?"**

**Geheime epiloog (unlocked bij bonus: 0 hero deaths)**:
Na de post-credits. Een klein huisje in Reusel. De Prins zit aan een tafel. Tegenover hem: het oude vrouwtje van de bakkerij. Ze eten samen een worstenbroodje.

- Bakster: *"Was het de moeite waard? Al die oorlog, voor een worstenbroodje?"*
- Prins (lang stil): *"Het ging nooit om het worstenbroodje, mevrouw."*
- Bakster (glimlacht): *"Ik weet het. Maar het is toch lekker, nie?"*
- Beiden lachen. Camera zoomt langzaam uit. We zien Reusel in de avondzon. Precies zoals in Missie 1.

**Difficulty scaling**:
- **Easy**: Ringen hebben 30% minder verdediging. CEO boss fight heeft 2 fasen (skip Fase 2). CEO totaal 400 HP. Bondgenoten +30% stats. Corporate Tower 3500 HP (kwetsbaar na 2 Kantoor-torens vernietigd). Vergadermachine Mk II is afwezig. Productie: 1 unit/20s.
- **Medium**: Standaard (3 ringen, 3-fasen boss, 5000 HP Corporate Tower, kwetsbaar na 3 Kantoor-torens).
- **Hard**: Ringen hebben 40% meer verdediging. CEO boss fight heeft een extra mechanic: bij <50 HP in Fase 3 enrage — AoE damage pulse wordt 30 damage elke 3 seconden + alle Kantoor-torens in Ring 3 reactiveren met 50% HP. Corporate Tower 7000 HP. CEO totaal 700 HP (Fase 1: 500-400, Fase 2: 400-200, Fase 3: 200-0). Bondgenoten -30%. Productie: 1 unit/8s. Extra objective: Corporate Tower regenereert 100 HP/min als De Politicus nog leeft (hij moet eerst).

**Victory condition**: CEO verslagen + Gouden Worstenbroodje geclaimd (15 seconden kanaliseren met minstens 1 hero bij het verwoeste Corporate Tower).
**Defeat condition**: Eigen Boerderij vernietigd OF alle heroes dood tegelijkertijd.

**Nieuwe mechanics geintroduceerd**:
- 3-fasen boss fight met veranderende arena en escalerende mechanics
- Ring-verdediging doorbreken (progressieve fortress assault met 3 zones)
- Gebouw-kwetsbaarheid gekoppeld aan sub-objectives (Kantoor-torens vernietigen om Tower te ontgrendelen)
- Volledige alliantie-warfare (3 facties samen in de grootst mogelijke battle)
- Kanaliseer-mechanic als finale objective (15 seconden ongestoord bij het doel)
- Campaign-spanning bonussen (keuzes uit Missie 10 en 11 beinvloeden Missie 12)

**Story beats**:
- De culminatie van 11 missies — van Reusel tot de Randstad
- De Randstad in al zijn glorie en decadentie — het contrast met Brabant
- De CEO als memorabele eindbaas: komisch, dreigend, en uiteindelijk tragisch
- Het Gouden Worstenbroodje als symbool: het gaat niet om het object, maar om identiteit
- De bakster in Reusel als emotioneel anker — ze was er aan het begin, ze is er aan het einde
- Sequel tease: de Limburgers willen hun eigen artefact — de cyclus begint opnieuw
- Thema: gezelligheid wint van synergie. Gemeenschap wint van bureaucratie. Brabant wint.

**Missie-specifieke muziek**:
- **Openingsmars**: Alle drie factie-themes samen in een langzame, plechtige mars. Drums, koper, accordeon, cello, klarinet. Het moment waarop drie volkeren als een marcheren.
- **Ring 1**: Brabanders faction theme, energiek, met carnavalspercussie. Hoopvol en strijdlustig.
- **Ring 2**: Battle-theme intensiveert. Limburgse cello-motief voegt zich erbij. Zwaardere drums. Spanning stijgt.
- **Ring 3**: Volledige oorlogsmuziek. Alle instrumenten. Koor zingt. Het moet voelen als het lot van de wereld.
- **Boss Fight Fase 1**: Donker, dreigend. Piano + strijkers. Corporate sfeer meets medieval battle. De CEO's thema.
- **Boss Fight Fase 2**: Tempo versnelt. Chaos. De muziek reflecteert de achtervolging. Onregelmatige maatsoorten.
- **Boss Fight Fase 3**: Alles op vol volume. Koor. Drums. Het climaxmoment. Bij CEO's dood: plotselinge stilte.
- **Worstenbroodje geclaimd**: Langzame build vanuit stilte. Een enkele accordeon. Dan viool. Dan cello. Dan hoorn. Dan het volledige orkest + koor. Het alliantie-anthem uit Missie 10, nu in volle glorie. Tranen-muziek.
- **Credits**: Akoestische versie van het hoofdthema, gezongen door een koor. Warm, nostalgisch, voldaan.
- **Post-credits**: Limburgse faction theme, langzaam, mysterieus. De Mijnbaas' motief. Eindigt op een open noot — er komt meer.
- **Suno prompt suggestie (finale)**: "Grand finale orchestral, emotional victory theme, Dutch folk accordion solo building to full orchestra with choir, cathedral bells, carnival confetti celebration, tears of joy, medieval fantasy triumph, 100 BPM building to 120, the greatest moment of a hero's journey, seamless transition from battle to celebration"

---

## Appendix: Cross-Missie Bonusconnecties

De laatste drie missies vormen een verbonden trilogie waar keuzes doorwerken:

| Bonus behaald in | Effect in latere missie |
|-----------------|------------------------|
| **Missie 10: Alle Alliantie-taken binnen 15 min** | Missie 11: 6 extra alliantie-units (zelf controleerbaar) + bondgenoten +10% stats |
| **Missie 10: 1000/800 oorlogsvoorraad** | Missie 12: +25% startresources |
| **Missie 11: Alle forten >50% HP** | Missie 12: 2 extra Kantoor-torens (defense) bij je basis |
| **Missie 11: <20 unit verliezen** | Missie 12: eenmalige Carnavalsrage bij start (gratis) |
| **Missie 9: Geen Grot-ingang verloren** | Missie 12: geheime tunnel-ingang naar Ring 3 beschikbaar (Limburgse Grot) |

Dit systeem beloont zorgvuldig spel door de hele campaign heen en geeft replay-waarde: spelers willen terug om bonussen te behalen die de finale makkelijker maken.

---

## Appendix: Totale Campaign Statistieken (Missies 1-12)

| Statistiek | Waarde |
|-----------|--------|
| Totale missies | 12 |
| Geschatte speelduur (Medium) | 7-9 uur |
| Unieke locaties | 12 (Reusel, grens, Tilburg, Den Bosch, Limburg, platteland, Oeteldonk, Eindhoven, mergelgrotten, Den Bosch II, A2-corridor, De Randstad) |
| Maximale mapgrootte | 384x384 (Missie 11) |
| Vijandelijke hero encounters | CEO (5x), Politicus (4x) |
| Alliantie-facties | 3 (Brabanders + Limburgers + Belgen) |
| Boss fight fasen | 3 (Missie 12 finale) |
| Mechanics geintroduceerd | 30+ unieke mission-specifieke mechanics |
| Easter eggs in Missie 10-12 | 3 (arcade-referentie, Laatste Bakster callback, Vlaaienoorlog tease) |
