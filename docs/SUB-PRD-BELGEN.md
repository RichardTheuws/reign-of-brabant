# Sub-PRD: Belgen Factie

**Versie**: 1.0.0
**Datum**: 2026-04-06
**Status**: Draft
**Auteur**: Game Master Agent
**Parent**: PRD.md v1.0.0

---

## Inhoudsopgave

1. [Factie Overzicht](#1-factie-overzicht)
2. [Units](#2-units)
3. [Buildings](#3-buildings)
4. [Tech Tree](#4-tech-tree)
5. [Diplomatie / Het Compromis Mechanic](#5-diplomatie--het-compromis-mechanic)
6. [Voice Lines](#6-voice-lines)

---

## 1. Factie Overzicht

### 1.1 Identiteit

**Naam**: Belgen — "De Diplomaten"
**Motto**: *"Ceci n'est pas une army"*
**Thema**: Chaos, bureaucratische overvloed, surrealistisch genie
**Kleurenpalet**: Rood, geel, zwart (Belgische vlag), gouden accenten

### 1.2 Culturele Kern

De Belgen zijn de verpersoonlijking van georganiseerde chaos. Zes regeringen, drie taalgemeenschappen, maar op een of andere manier altijd de beste frieten, chocolade en bier ter wereld. Hun kracht is hun onvoorspelbaarheid. Waar de Brabanders winnen door gezelligheid en de Randstad door bureaucratie, winnen de Belgen door niemand te laten begrijpen wat ze eigenlijk aan het doen zijn.

### 1.3 Resources

| Resource | Naam | Equivalent | Verzameld van |
|----------|------|-----------|---------------|
| **Primair** (Gold) | Frieten | Gold | Frituurknopen op de map |
| **Secundair** (Lumber) | Trappist | Lumber | Abdij-bomen / hop-struiken |
| **Tertiair** | Chocolade | Special | Chocolaterie-gebouw (passief) |

**Chocolade-generatie**: +2 Chocolade per 10 seconden per Chocolaterie. Max 3 Chocolateries tegelijk. Chocolade wordt gebruikt voor diplomatie-abilities, premium units (Frituurridder, Manneken Pis-kanon) en de factie-ability.

### 1.4 Playstyle

**Sterkte**: Diplomatie-mechanics, sterke economie, verwarring-abilities, hoge carry capacity
**Zwakte**: Trage bouw (vergunningen), individueel gemiddelde stats
**Playstyle**: Economic boom + diplomatie. Disruptie van vijandelijke productie en commando's. De Belgen winnen niet door brute kracht maar door de vijand gek te maken.

### 1.5 Visuele Stijl

- Gebouwen: Art Nouveau-invloeden (Horta), mengsel van Vlaamse baksteenarchitectuur en Frans-Waalse elegantie
- Units: Kleurrijke mix van Vlaamse en Waalse kledij, altijd een beetje chaotisch
- Effecten: Surrealistisch (Magritte-achtige wolken, regen van frieten, bowler hats)
- Humor in animaties: units struikelen over taalbarrieren, gebouwen hebben twee naamborden (NL/FR)

---

## 2. Units

### 2.1 Frietkraamhouder (Worker)

> *De ruggengraat van de Belgische economie. Bakt frieten, bouwt gebouwen, en klaagt over de BTW. Draagt een wit schort vol vetvlekken en een papieren hoedje.*

| Stat | Waarde |
|------|--------|
| HP | 55 |
| Attack | 5 |
| Attack Speed | 1.5s |
| DPS | 3.3 |
| Armor | 0 |
| Armor Type | Light |
| Speed | 4.5 |
| Range | 0 (melee) |
| Build Time | 15s |
| Cost | 50/0 |
| Population | 1 |
| Carry Capacity | 12 |

- **Wapen**: Frietschep (melee)
- **Passief — Dubbele Portie**: Carry Capacity 12 in plaats van standaard 10. De Belgen zijn gewend aan overvloed.
- **Ability — Snel Bakken**: Bouwsnelheid +25% voor 15 seconden, maar gebouw verliest 10% max HP (slechte vergunning). Cooldown: 30s.

**Persoonlijkheid**: Mopperend maar vriendelijk. Klaagt constant over belastingen, wisselkoersen en het weer, maar stopt nooit met werken. Spreekt een chaotische mix van Vlaams en Frans.

---

### 2.2 Bierbouwer (Infantry — melee)

> *Brouwmonnik die zijn abdij verliet toen het bier op was. Gevaarlijk nuchter en nog gevaarlijker beschonken. Draagt een versleten pij met een trappistenlabel op de borst.*

| Stat | Waarde |
|------|--------|
| HP | 90 |
| Attack | 12 |
| Attack Speed | 1.2s |
| DPS | 10.0 |
| Armor | 1 |
| Armor Type | Light |
| Speed | 5.0 |
| Range | 0 (melee) |
| Build Time | 18s |
| Cost | 80/30 |
| Population | 1 |

- **Wapen**: Biervat-knuppel (melee)
- **Passief — Tapinstinct**: Na elke kill: +15% speed voor 8 seconden (stapelbaar tot +45%). De adrenaline van de brouwer.
- **Ability — Trappistenfurie**: Drinkt een Trappist. +30% Attack en +20% Armor voor 10 seconden, maar daarna 3 seconden "kater" (kan niet aanvallen). Cooldown: 25s.

**Persoonlijkheid**: Filosofisch en rustig totdat iemand zijn bier morst. Dan wordt het persoonlijk.

---

### 2.3 Chocolatier (Ranged)

> *Meester-chocolatier die zijn pralines als wapens gebruikt. Elke bonbon is een klein kunstwerk van vernietiging. Draagt een chique chef-jas met gouden knopen en een koksmuts schuin op het hoofd.*

| Stat | Waarde |
|------|--------|
| HP | 50 |
| Attack | 15 |
| Attack Speed | 1.8s |
| DPS | 8.3 |
| Armor | 0 |
| Armor Type | Light |
| Speed | 4.5 |
| Range | 8 |
| Build Time | 22s |
| Cost | 100/60 |
| Population | 1 |

- **Wapen**: Pralinebommen (ranged, thrown)
- **Ability — Praline Surprise**: Gooit een speciale praline op een locatie. AoE (radius 3): 10 damage + poison (3 DPS voor 5 seconden). Cooldown: 20s.
- **Passief — Tempereren**: Elke 4e aanval is een "perfecte praline" die +50% damage doet.

**Persoonlijkheid**: Artistiek en pretentieus. Beschouwt zijn werk als kunst en zijn vijanden als barbaren die geen smaak hebben.

---

### 2.4 Frituurridder (Heavy / Cavalry)

> *Geharnast in een pantser gesmeed uit frituurpannen en dekschalen. Berijd een gigantische Belgische trekpaard. De grond trilt als hij nadert, en de lucht ruikt naar heet vet.*

| Stat | Waarde |
|------|--------|
| HP | 220 |
| Attack | 22 |
| Attack Speed | 2.0s |
| DPS | 11.0 |
| Armor | 4 |
| Armor Type | Heavy |
| Speed | 4.0 |
| Range | 0 (melee) |
| Build Time | 35s |
| Cost | 180/130 |
| Population | 2 |

- **Wapen**: Frituurlans (melee)
- **Ability — Frietcharge**: Charget in rechte lijn (18 units afstand). Eerste target: 40 damage + knockback. Alle units in pad: 15 damage + -30% speed (vettig terrein), 6 seconden. Cooldown: 25s. Na charge: 4 seconden disabled (paard moet uitblazen).
- **Passief — Vetpantser**: Neemt 15% minder schade van ranged aanvallen (projectielen glijden af).

**Persoonlijkheid**: Ridderlijk en trots. Spreekt alsof hij uit een middeleeuws epos komt, maar bestelt regelmatig frieten tijdens het gevecht.

---

### 2.5 Manneken Pis-kanon (Siege)

> *Een bronzen standbeeld op wielen dat een onophoudelijke stroom destructieve vloeistof afvuurt op vijandelijke gebouwen. Belgisch erfgoed als wapen van massavernietiging.*

| Stat | Waarde |
|------|--------|
| HP | 80 |
| Attack | 12 (units) / 55 (buildings) |
| Attack Speed | 3.0s |
| DPS | 4.0 (units) / 18.3 (buildings) |
| Armor | 1 |
| Armor Type | Medium |
| Speed | 3.0 |
| Range | 10 |
| Splash Radius | 3 |
| Build Time | 40s |
| Cost | 200/150 |
| Population | 3 |

- **Wapen**: Bronzen waterstraal (ranged, AoE, anti-building)
- **Ability — Overdruk**: Verhoogt range met +4 en splash radius met +2 voor de volgende 3 aanvallen. Cooldown: 30s.
- **Passief — Nationaal Erfgoed**: Vijandelijke units aanvallen het Manneken Pis-kanon met -15% attack (ze voelen zich schuldig).

**Persoonlijkheid**: Stil (het is een standbeeld), maar maakt obscene watergeluiden. De bediener ernaast maakt excuses: "Sorry, hij kan er niks aan doen."

---

### 2.6 Wafelzuster (Support / Healer)

> *Een non uit een Brusselse abdij die wafeldeeg als medicijn beschouwt. Haar Luikse wafels genezen wonden en haar Brusselse wafels breken moralen. Draagt een habijt met een schort vol suiker.*

| Stat | Waarde |
|------|--------|
| HP | 55 |
| Attack | 6 (melee, wafel-ijzer) |
| Attack Speed | 1.5s |
| Heal | 14 HP per cast |
| Heal Speed | 2.0s |
| Armor | 0 |
| Armor Type | Light |
| Speed | 4.5 |
| Range | 6 (heal range) |
| Build Time | 25s |
| Cost | 90/65 |
| Population | 1 |

- **Auto-heal**: Target automatisch de meest beschadigde ally in range
- **Ability — Luikse Wafel**: AoE heal (20 HP) + removes debuffs van allies in radius 6. Cooldown: 25s.
- **Passief — Suikercoating**: Gehealte units krijgen +10% Armor voor 8 seconden.

**Persoonlijkheid**: Warm, moederlijk en absoluut onverstoorbaar. Bidt rustig door terwijl om haar heen de chaos uitbreekt. Biedt vijanden een wafel aan voor ze sterven.

---

### 2.7 Dubbele Spion (Special — Stealth / Sabotage)

> *Een agent die voor alle zes de Belgische regeringen werkt en voor geen enkele loyaal is. Kan zich voordoen als vijandelijke unit. Draagt een trenchcoat, bowler hat (hommage aan Magritte), en heeft altijd een appel bij zich.*

| Stat | Waarde |
|------|--------|
| HP | 40 |
| Attack | 6 |
| Attack Speed | 1.5s |
| DPS | 4.0 |
| Armor | 0 |
| Armor Type | Light |
| Speed | 6.0 |
| Range | 0 (melee) |
| Build Time | 28s |
| Cost | 90/70 |
| Population | 1 |

- **Wapen**: Verborgen mes (melee)
- **Ability 1 — Vermomming**: Neemt het uiterlijk aan van een vijandelijke unit (zelfde type als dichtstbijzijnde vijand). Vijand ziet de Spion als eigen unit. Wordt ontdekt als hij aanvalt of binnen range 3 van vijandelijk Town Hall komt. Cooldown: 45s (na ontmaskering).
- **Ability 2 — Sabotage**: Wanneer vermomd naast vijandelijk gebouw: gebouw produceert 50% langzamer voor 20 seconden. Niet-vermomd: vijandelijk gebouw verliest 5 HP/s voor 10 seconden (zichtbaar). Cooldown: 30s.
- **Passief — Dubbel Paspoort**: Kan door vijandelijke gebouwzones lopen zonder automatisch aangevallen te worden (zolang vermomd).

**Persoonlijkheid**: Paranoia en mysterie. Fluistert altijd, vertrouwt niemand, en heeft voor elke situatie een complottheorie. "Ceci n'est pas un espion."

---

### 2.8 Hero: De Frietkoning (Tank / Support Hero)

> *De legendarische heerser van het Belgische Frietimperium. Draagt een kroon gemaakt van gouden frieten, een hermelijnen mantel bespat met mayonaise, en een scepter met een gouden frikandel. Zijn aanwezigheid alleen al maakt elke Belg trots.*

| Stat | Waarde |
|------|--------|
| HP | 500 |
| Attack | 20 |
| Attack Speed | 1.5s |
| DPS | 13.3 |
| Armor | 5 |
| Armor Type | Heavy |
| Speed | 4.5 |
| Range | 0 (melee) |
| Build Time | — |
| Cost | 400/200 + 30 Chocolade |
| Population | 5 |
| Revive Time | 60s bij Town Hall |

- **Wapen**: Gouden Frikandelscepter (melee)
- **Ability 1 — Koninklijke Portie**: AoE heal (30 HP) + +15% alle stats voor allies in radius 10, 12 seconden. Cooldown: 35s.
- **Ability 2 — Belgisch Decreet**: Target vijandelijke unit wisselt van team voor 10 seconden (wordt tijdelijk jouw unit). Kost 20 Chocolade. Cooldown: 60s. Range: 8.
- **Ability 3 — Frituurfondue**: Creeer een zone (radius 6) die 15 DPS doet aan vijanden en +5 HP/s healt allies. Duurt 10 seconden. Cooldown: 45s.
- **Ultimate — Het Belgisch Compromis**: Alle vijandelijke productiegebouwen op de map stoppen 15 seconden. Alle Belgische units krijgen +25% alle stats voor 20 seconden. Kost 50 Chocolade. Cooldown: 180s.

**Persoonlijkheid**: Koninklijk maar benaderbaar. Spreekt in pluralis majestatis ("Wij hebben beslist...") maar deelt persoonlijk frieten uit aan zijn troepen. Heeft een oneindige voorraad mayonaise.

---

### 2.9 Hero: De Abdijbrouwer (Monk / Caster Hero)

> *Voormalig abt van een Trappistenklooster die ontdekte dat zijn bier niet alleen geesten verheft maar ook vijanden verlamt. Draagt een monnikspij met een mysterieus glanzend bierglas dat nooit leeg raakt.*

| Stat | Waarde |
|------|--------|
| HP | 280 |
| Attack | 10 |
| Attack Speed | 2.0s |
| DPS | 5.0 |
| Armor | 2 |
| Armor Type | Medium |
| Speed | 4.5 |
| Range | 9 |
| Build Time | — |
| Cost | 350/300 + 40 Chocolade |
| Population | 5 |
| Revive Time | 60s bij Town Hall |

- **Wapen**: Heilig Bier (ranged magic)
- **Ability 1 — Stiltegelofte**: Target vijandelijke hero kan 8 seconden geen abilities gebruiken (silence). Cooldown: 45s. Range: 10.
- **Ability 2 — Trappistenzegen**: Ally units in radius 8 krijgen +3 HP/s regeneratie voor 15 seconden. Cooldown: 30s.
- **Ability 3 — Dubbel of Tripel**: Creeer 2 illusie-kopien van de Abdijbrouwer (50% HP, 0 damage, 15 seconden). Vijand weet niet welke echt is. Cooldown: 50s.
- **Ultimate — Laatste Avondbrouwsel**: AoE radius 12. Vijandelijke units worden "dronken": movement is random (25% kans verkeerde richting), -40% attack accuracy, 10 seconden. Ally units in zelfde radius: +30% attack speed. Kost 50 Chocolade. Cooldown: 180s.

**Persoonlijkheid**: Sereen en filosofisch. Spreekt in cryptische wijsheden die altijd met bier te maken hebben. "Zoals het Trappistenbier: de waarheid zit in de tweede gisting."

---

## 3. Buildings

### 3.1 Gebouwenoverzicht

| # | Gebouw | Type | Tier | Produceert / Functie | Kosten | Bouwtijd | HP |
|---|--------|------|------|---------------------|--------|---------|-----|
| 1 | **Stadhuis** | Town Hall | 1 | Frietkraamhouders, resource drop-off | — | — | 1600 |
| 2 | **Frituur** | Barracks | 1 | Bierbouwer, Chocolatier | 200/0 | 32s | 850 |
| 3 | **Abdij** | Resource gen | 1 | +3 Trappist/10s | 150/75 | 28s | 650 |
| 4 | **Frietfabriek** | Resource gen | 1 | +2 Frieten/10s | 125/50 | 25s | 600 |
| 5 | **Chocolaterie** | Tertiair resource | 1 | +2 Chocolade/10s (max 3) | 200/100 | 30s | 600 |
| 6 | **EU-Parlement** | Tech/Upgrade | 2 | Upgrades, Tier 2 unlock, diplomatie | 300/175 | 45s | 800 |
| 7 | **Rijschool** | Advanced unit | 2 | Frituurridder, Wafelzuster | 300/200 | 42s | 800 |
| 8 | **Wafelkraam** | Support (mobiel) | 1 | Healt nabije units (+8 HP/10s) | 100/50 | 15s | 300 |
| 9 | **Brusselse Woning** | Housing | 1 | +8 population | 100/50 | 20s | 500 |
| 10 | **Surrealistisch Atelier** | Special | 2 | Dubbele Spion, Manneken Pis-kanon | 250/200 | 40s | 700 |
| 11 | **Commissiegebouw** | Defense tower | 2 | Vertraagt vijanden in radius (aura) | 225/225 | 35s | 900 |
| 12 | **Diplomatiek Salon** | Diplomatie hub | 3 | Diplomatie-abilities, Compromis-mechanic | 350/250 | 50s | 750 |

### 3.2 Gebouwdetails

#### Stadhuis (Town Hall)

Het Belgische Stadhuis is een prachtig Art Nouveau-gebouw met twee ingangen: een Vlaamse en een Waalse. Beide deuren leiden naar dezelfde ruimte, maar dat vertelt niemand.

- **Functie**: Produceert Frietkraamhouders, dient als resource drop-off punt
- **Passief — Tweetalig Onthaal**: Allies in radius 8 krijgen +5% speed (ze voelen zich welkom, ongeacht taal)
- **Upgrade Tier 2**: Stadhuis → **Provinciehuis** (300/200, 40s) — +200 HP, unlocks Tier 2 gebouwen
- **Upgrade Tier 3**: Provinciehuis → **Federaal Paleis** (400/300, 50s) — +300 HP, unlocks Tier 3, Diplomatiek Salon

#### Frituur (Barracks)

Het iconische Belgische frietkot. Klein, vettig, en altijd open. Hier worden de krijgers van het Belgische leger getraind tussen de frituurpannen.

- **Produceert**: Bierbouwer (Tier 1), Chocolatier (Tier 1), Frituurridder (Tier 2, na Rijschool)
- **Passief — Altijd Open**: Produceert 10% sneller dan standaard barracks (Belgen zijn gewend aan nachtwerk)

#### Abdij (Resource Generation)

Een Trappistenklooster waar monniken in stilte brouwen. Het bier stroomt, de resources stijgen.

- **Functie**: Genereert +3 Trappist per 10 seconden
- **Upgrade — Dubbel Recept** (Tier 2, EU-Parlement): +2 Trappist/10s extra

#### Frietfabriek (Resource Generation)

Industriele frietenproductie. Belgisch vakmanschap op schaal.

- **Functie**: Genereert +2 Frieten per 10 seconden
- **Upgrade — Dubbele Frietlijn** (Tier 2, EU-Parlement): +1 Friet/10s extra

#### Chocolaterie (Tertiaire Resource)

De heilige graal van de Belgische economie. Hier worden de pralines gemaakt die oorlogen beeindigen.

- **Functie**: Genereert +2 Chocolade per 10 seconden
- **Limiet**: Maximaal 3 Chocolateries tegelijk
- **Upgrade — Meester-Chocolatier** (Tier 3): +1 Chocolade/10s extra per Chocolaterie

#### EU-Parlement (Tech/Upgrade Building)

Een kolossaal gebouw vol vergaderzalen, tolken en koffieautomaten. Hier worden de Belgische upgrades "besproken" (eindeloos) en uiteindelijk goedgekeurd.

- **Functie**: Research hub voor alle upgrades, unlocks Tier 2
- **Passief — Vertaalkosten**: Alle upgrades kosten 10% meer, maar geven +10% bonus (de vertaling naar twee talen maakt alles net iets beter)

#### Rijschool (Advanced Unit Building)

Waar de Frituurridders hun paarden leren mennen en de Wafelzusters hun helende kunsten perfectioneren.

- **Produceert**: Frituurridder, Wafelzuster
- **Vereist**: Frituur + EU-Parlement

#### Wafelkraam (Support — Mobiel)

Een kleine kar die allies healt. Belgische variant van de Brabandse Frietkar.

- **Functie**: Healt allies in radius 6 (+8 HP per 10 seconden, passief)
- **Mobiel**: Kan verplaatst worden na plaatsing (langzaam, 2.0 speed)

#### Brusselse Woning (Housing)

Een typisch Brussels rijhuis met smeedijzeren balkons. Biedt onderdak aan 8 eenheden.

- **Functie**: +8 population cap

#### Surrealistisch Atelier (Special Unit Building)

Een Magritte-achtig gebouw waar niets is wat het lijkt. De deur is een schilderij, het raam is een pijp die geen pijp is, en de spionnen die hier getraind worden bestaan niet. Officieel.

- **Produceert**: Dubbele Spion (Tier 2), Manneken Pis-kanon (Tier 3)
- **Vereist**: EU-Parlement
- **Passief — Ceci n'est pas un batiment**: Vijandelijke units hebben -20% sight range in radius 10 van dit gebouw (het is verwarrend om naar te kijken)

#### Commissiegebouw (Defense Tower)

Een gebouw vol bureaucraten die vijanden vertragen met formulieren, vergunningen en procedures.

- **Functie**: Vijandelijke units in radius 10 krijgen -25% speed + -15% attack speed
- **Geen directe damage** — het is een bureaucratische verdediging
- **Passief — Procedure**: Vijandelijke siege units in radius worden 30% minder effectief tegen gebouwen

#### Diplomatiek Salon (Diplomatie Hub — Tier 3)

Het epicentrum van het Belgische Compromis. Hier worden de meest absurde diplomatieke manoeuvres uitgedacht.

- **Functie**: Unlocks de Compromis-mechanic (zie sectie 5), factie-ability Diplomatieke Verwarring
- **Vereist**: Federaal Paleis (Tier 3 Town Hall)
- **Ability — Commissie Oprichten**: Selecteer vijandelijk productiegebouw. Dat gebouw produceert 40% langzamer voor 30 seconden. Cooldown: 60s. Range: 15.

---

## 4. Tech Tree

### 4.1 Overzicht

```
Tier 1 (Start)
├── Stadhuis → Frietkraamhouder
├── Frituur → Bierbouwer, Chocolatier
├── Abdij → +3 Trappist/10s
├── Frietfabriek → +2 Frieten/10s
├── Chocolaterie → +2 Chocolade/10s
├── Wafelkraam → Passieve heal
├── Brusselse Woning → +8 population
│
│   [Bouw EU-Parlement]
│        ↓
Tier 2
├── EU-Parlement → Upgrades, Tier 2 unlock
├── Rijschool → Frituurridder, Wafelzuster
├── Surrealistisch Atelier → Dubbele Spion
├── Commissiegebouw → Defensieve vertraging
├── Frituur → + Frituurridder (na Rijschool)
├── Heroes beschikbaar (Frietkoning via Stadhuis, Abdijbrouwer via Abdij)
│
│   [Upgrade Stadhuis → Provinciehuis → Federaal Paleis]
│        ↓
Tier 3
├── Diplomatiek Salon → Compromis-mechanic, factie-ability
├── Surrealistisch Atelier → + Manneken Pis-kanon
├── Geavanceerde upgrades beschikbaar
└── Factie-ability: Diplomatieke Verwarring
```

### 4.2 Universele Upgrades (per Tier)

Geresearched in het EU-Parlement. Door Vertaalkosten 10% duurder, maar 10% effectiever.

| Tier | Upgrade | Effect | Kosten |
|------|---------|--------|--------|
| 1 | Geslepen Messen I | +2 Attack alle melee | 110/55 |
| 1 | Pantserplaten I | +1 Armor alle units | 110/83 |
| 2 | Geslepen Messen II | +2 Attack alle melee | 220/110 |
| 2 | Pantserplaten II | +2 Armor alle units | 220/165 |
| 2 | Snelle Benen | +15% Speed alle units | 165/110 |
| 3 | Geslepen Messen III | +3 Attack alle units | 330/220 |
| 3 | Pantserplaten III | +3 Armor alle units | 330/275 |
| 3 | Factie Mastery | Unlock Diplomatieke Verwarring | 440/440 |

### 4.3 Factie-specifieke Upgrades

| Tier | Upgrade | Geresearched in | Effect | Kosten |
|------|---------|----------------|--------|--------|
| 1 | **Dubbel Gebakken** | EU-Parlement | Frietkraamhouder +20% gather speed | 100/50 |
| 1 | **Abdijbier** | EU-Parlement | Bierbouwer +15 HP | 75/50 |
| 2 | **Belgische Pralines** | EU-Parlement | Chocolatier +20% attack range | 150/100 |
| 2 | **Dubbel Recept** | EU-Parlement | Abdijen +2 Trappist/10s | 175/100 |
| 2 | **Dubbele Frietlijn** | EU-Parlement | Frietfabrieken +1 Friet/10s | 150/75 |
| 2 | **Vetgeharde Schilden** | EU-Parlement | Frituurridder +2 Armor | 200/150 |
| 2 | **Diplomatiek Protocol** | EU-Parlement | Compromis-abilities kosten 15% minder Chocolade | 175/125 |
| 3 | **Meester-Chocolatier** | EU-Parlement | Chocolateries +1 Chocolade/10s | 250/200 |
| 3 | **Surrealistisch Offensief** | Surrealistisch Atelier | Dubbele Spion Vermomming duurt 50% langer | 200/175 |
| 3 | **Overdruk Deluxe** | Surrealistisch Atelier | Manneken Pis-kanon +15% damage vs buildings | 225/200 |
| 3 | **Koninklijk Recept** | EU-Parlement | Frietkoning Koninklijke Portie healt +50% meer | 300/250 |
| 3 | **Eeuwig Brouwsel** | EU-Parlement | Abdijbrouwer abilities -20% cooldown | 275/225 |

### 4.4 Factie Mastery: Diplomatieke Verwarring

- **Kosten**: 440/440 (Factie Mastery upgrade) + 80 Chocolade per gebruik
- **Vereist**: Diplomatiek Salon + Federaal Paleis
- **Effect**: Vijandelijke units in radius 15 van targetlocatie:
  - 50% kans commando's worden genegeerd (unit staat stil)
  - 25% kans op friendly fire (valt eigen teamgenoot aan)
  - 10% kans unit gaat zitten en doet 10 seconden niks ("vergadermodus")
  - 15% kans unit loopt in willekeurige richting
  - Duur: 12 seconden
  - Visueel: Magritte-achtige wolken verschijnen, bowler hats vallen uit de lucht
- **Cooldown**: 200 seconden

---

## 5. Diplomatie / Het Compromis Mechanic

### 5.1 Overzicht

De Belgen zijn de ENIGE factie met een actief diplomatie-systeem. Waar andere facties alleen maar kunnen vechten, kunnen de Belgen onderhandelen, saboteren en manipuleren. Dit maakt ze uniek: ze kunnen oorlogen winnen zonder een slag te leveren.

Het Compromis-systeem wordt ge-unlocked door de **Diplomatiek Salon** (Tier 3).

### 5.2 Compromis Aanbieden

**Hoe het werkt:**
1. Selecteer de Diplomatiek Salon
2. Klik op "Compromis Aanbieden" (hotkey: C)
3. Kies een vijandelijke speler als target
4. Kies een type Compromis (zie hieronder)
5. De vijand krijgt een pop-up: accepteren of weigeren
6. Bij acceptatie: beide spelers krijgen de effect

**Types Compromis:**

| Type | Kosten (Chocolade) | Effect Belgen | Effect Vijand | Duur |
|------|-------------------|---------------|---------------|------|
| **Wapenstilstand** | 30 | Geen aanvallen van/naar vijand | Geen aanvallen van/naar Belgen | 60s |
| **Handelsovereenkomst** | 20 | +25% resource gathering | +15% resource gathering | 90s |
| **Culturele Uitwisseling** | 25 | Kan 1 vijandelijke unit-type trainen (tijdelijk) | Kan 1 Belgische unit-type trainen (tijdelijk) | 120s |
| **Niet-aanvalspact** | 15 | Vijand kan Belgische gebouwen niet aanvallen | Belgen kunnen vijandelijke gebouwen niet aanvallen | 45s |

**Regels:**
- Maximaal 1 actief Compromis per vijand tegelijk
- Belgen kunnen het Compromis EENZIJDIG verbreken (maar verliezen 20 Chocolade als straf)
- AI-vijanden accepteren op basis van hun situatie (verliezende AI accepteert vaker)
- In multiplayer: de vijandelijke speler besluit zelf

### 5.3 Chocolade-Overtuiging

**Hoe het werkt**: De Frietkoning (hero) kan individuele vijandelijke units "overtuigen" met Chocolade.

- **Belgisch Decreet** (Hero ability): Target vijandelijke unit wisselt tijdelijk van team
- Kosten: 20 Chocolade per unit
- Duur: 10 seconden
- Cooldown: 60s
- Werkt NIET op heroes of workers

### 5.4 Commissie Oprichten

**Hoe het werkt**: Via het Commissiegebouw (defense tower) of de Diplomatiek Salon kan een "Commissie" opgericht worden gericht op een vijandelijk productiegebouw.

- **Effect**: Target productiegebouw produceert 40% langzamer
- **Duur**: 30 seconden
- **Kosten**: 15 Chocolade
- **Range**: 15 (Diplomatiek Salon) / 10 (Commissiegebouw)
- **Cooldown**: 60s
- **Visueel**: Een groep kleine bureaucraten-figuren verschijnt bij het gebouw met dossiermappen
- Maximaal 2 actieve Commissies tegelijk

### 5.5 Belgisch Compromis (Damage Split)

**Passief effect** (altijd actief na Diplomatiek Salon):
- Wanneer een Belgische unit damage zou ontvangen die meer dan 40% van zijn max HP is in een enkele hit:
  - 50% van de overtollige damage wordt "doorgestuurd" naar de dichtstbijzijnde vijandelijke unit (niet de aanvaller)
  - Visueel: een gouden flits en een bureaucratisch stempel-effect
  - Dit maakt de Belgen bijzonder sterk tegen burst-damage en siege-aanvallen

---

## 6. Voice Lines

### Dialect Richtlijnen

- **Taal**: Vlaams met Franse woorden erdoor. Chaotische mix.
- **Kernwoorden**: "amai", "allez", "goesting", "ambetant", "'t is plezant", "ca va", "voila", "komaan"
- **Stijl**: Warcraft-kort, punchy, memorabel
- **Humor**: Surrealistisch, bureaucratisch, compromis-grappen, frieten-trots
- **GEEN** -ansen suffix (dat is Brabanders-specifiek)
- **Vlaamse uitspraak**: zachter dan ABN, meer melodisch

---

### 6.1 Frietkraamhouder (Worker)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Ja, wat mag het zijn?" | Vriendelijk, professioneel | 0.8 |
| Select | 2 | "Frietje? Stoverij? Allez, zeg het" | Ongeduldig uitnodigend | 1.0 |
| Select | 3 | "De frituur is open!" | Trots | 0.7 |
| Move | 1 | "Voila, ik ga al" | Bevestigend | 0.6 |
| Move | 2 | "Met de hele barak erbij" | Zuchtend | 0.8 |
| Move | 3 | "Ca va, ca va, ik kom" | Half Frans, haastig | 0.8 |
| Attack | 1 | "Amai, da's ambetant!" | Verontwaardigd | 0.8 |
| Attack | 2 | "Ge krijgt mijn frietschep!" | Dreigend | 0.8 |
| Attack | 3 | "Frieten, niet patat! NOOIT patat!" | Woedend, principieel | 1.2 |
| Death | 1 | "De frituur... gaat dicht..." | Tragisch stervend | 1.2 |
| Death | 2 | *sissend vet + zucht* | Dramatisch | 0.8 |
| Ability | 1 | "Snel bakken! Geen vergunning nodig!" | Rebels, snel | 1.0 |
| Ability | 2 | "Allez hop, da gaat rapper!" | Energiek | 0.8 |
| Idle | 1 | "Die BTW gaat me nog kapot maken..." | Mopperend | 1.2 |
| Idle | 2 | *humming + frietjes-bakgeluid* | Werkend, verveeld | 2.0 |

---

### 6.2 Bierbouwer (Infantry)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Sanitas per cerevisiam" | Plechtig, monnik-achtig | 1.0 |
| Select | 2 | "Amai, is het al tijd voor vespers?" | Slaperig, filosofisch | 1.0 |
| Select | 3 | "Zeg het maar, vriend" | Kalm, diep | 0.7 |
| Move | 1 | "Met Gods wil en goed bier" | Plechtig | 0.8 |
| Move | 2 | "Allez, vooruit" | Nuchter | 0.5 |
| Move | 3 | "Ik breng het vat mee" | Vastberaden | 0.7 |
| Attack | 1 | "In naam van de Trappist!" | Strijdkreet | 0.8 |
| Attack | 2 | "Ge hebt mijn bier gemorst!" | Persoonlijk beledigd | 0.8 |
| Attack | 3 | "Proef mijn vuist, ketetter!" | Monnik-woede | 0.8 |
| Death | 1 | "Breng mij... een laatste Westmalle..." | Stervend, dramatisch | 1.5 |
| Death | 2 | *glas breekt + kreun* | Tragisch | 0.8 |
| Ability | 1 | "TRAPPIST! Nu wordt het serieus!" | Transformatie, krachtig | 1.0 |
| Ability | 2 | "Op de gezondheid... van niemand!" | Dreigend, dronken | 1.0 |
| Idle | 1 | "'t Is stilaan tijd voor een goeie pint..." | Verlangend | 1.2 |
| Idle | 2 | *fluit een gregoriaans gezang* | Meditatief | 2.0 |

---

### 6.3 Chocolatier (Ranged)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Ah, een kenner!" | Gevleid, arrogant | 0.6 |
| Select | 2 | "Mijn pralines zijn kunst, geen wapens. Maar allez." | Gekweld artiest | 1.5 |
| Select | 3 | "Wilt ge proeven? Nee? Jammer." | Teleurgesteld | 1.0 |
| Move | 1 | "Voorzichtig, de pralines!" | Bezorgd | 0.7 |
| Move | 2 | "Ik verplaats mijn atelier" | Dramatisch | 0.8 |
| Move | 3 | "Bon, ik ga" | Kort, Frans | 0.4 |
| Attack | 1 | "Proef en sterf!" | Theatraal agressief | 0.6 |
| Attack | 2 | "Ganache in uw gezicht!" | Venijnig | 0.7 |
| Attack | 3 | "Dit is GEEN Cote d'Or, barbaar!" | Beledigd, snobistisch | 1.2 |
| Death | 1 | "Mijn... meesterwerk... onafgemaakt..." | Artistiek stervend | 1.5 |
| Death | 2 | *chocolade-splat + zucht* | Dramatisch | 0.8 |
| Ability | 1 | "Praline Surprise! Amai, die gaat ge voelen!" | Sadistisch blij | 1.2 |
| Ability | 2 | "Speciale editie, just for you!" | Sarcastisch charmant | 1.0 |
| Idle | 1 | "De cacao oxidert als ik hier blijf staan..." | Geagiteerd | 1.2 |
| Idle | 2 | *snuift aan een praline* "Magnifique..." | Zelfvoldaan | 1.5 |

---

### 6.4 Frituurridder (Heavy / Cavalry)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "De ridder van de gouden friet!" | Heroisch, plechtig | 1.0 |
| Select | 2 | "Mijn lans is heet en mijn vet is kokend" | Dreigend, trots | 1.2 |
| Select | 3 | "Allez, voor Belgie!" | Patriottisch | 0.7 |
| Move | 1 | "Te paard!" | Kort, militair | 0.5 |
| Move | 2 | "De frituur rijdt!" | Trots | 0.6 |
| Move | 3 | "Wij marcheren, met mayo" | Absurd plechtig | 0.8 |
| Attack | 1 | "CHARGE! En vergeet de saus niet!" | Strijdkreet + absurd | 1.2 |
| Attack | 2 | "Uw laatste maaltijd wordt FRIETEN!" | Dreigend | 1.0 |
| Attack | 3 | "In de pan met u!" | Agressief, culinair | 0.6 |
| Death | 1 | "Het paard... het vet... alles koud..." | Episch stervend | 1.5 |
| Death | 2 | *paardengehinnik + metaalklank + kreun* | Dramatisch | 1.2 |
| Ability | 1 | "FRIETCHARGE! Uit de weg of in de pan!" | Maximale intensiteit | 1.2 |
| Ability | 2 | "Volgas! Het vet spat alle kanten op!" | Chaotisch | 1.0 |
| Idle | 1 | "Mijn paard heeft goesting in een wortel..." | Gemoedelijk | 1.2 |
| Idle | 2 | "Een ridder wacht. Maar niet eeuwig, hoor." | Ongeduldig, waardig | 1.2 |

---

### 6.5 Manneken Pis-kanon (Siege)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | *bediener:* "Het Manneken is paraat!" | Professioneel | 0.8 |
| Select | 2 | *bediener:* "Sorry voor de... geluiden" | Beschaamd | 0.8 |
| Select | 3 | *waterstraal-geluid + bediener:* "Ja, hij doet dat" | Vermoeid accepterend | 1.0 |
| Move | 1 | *bediener:* "Voorzichtig rollen!" | Gespannen | 0.6 |
| Move | 2 | *bediener:* "Let op de plassen!" | Waarschuwend | 0.6 |
| Move | 3 | *wielengepiep + bediener:* "Allez, doorschuiven" | Nonchalant | 0.8 |
| Attack | 1 | *bediener:* "Overdruk! Ga ervoor!" *spuitgeluid* | Commando + effect | 1.0 |
| Attack | 2 | *bediener:* "Amai, da's een mooie boog!" | Bewonderend | 0.8 |
| Attack | 3 | *bediener:* "Ceci n'est pas de la pluie!" | Magritte-referentie | 1.0 |
| Death | 1 | *bediener:* "Het standbeeld... is gevallen..." *bronzen klank* | Rouwend | 1.5 |
| Death | 2 | *bronzen krak + bediener:* "Nee! Nationaal erfgoed!" | Geschokt | 1.0 |
| Ability | 1 | *bediener:* "MAXIMALE DRUK! Laat maar gaan!" | Enthousiast | 1.0 |
| Ability | 2 | *bediener:* "Extra bereik! Mikken... en los!" | Geconcentreerd | 1.0 |
| Idle | 1 | *bediener:* "Hij staat daar maar te... je weet wel" | Ongemakkelijk | 1.2 |
| Idle | 2 | *druppelgeluid + bediener zucht* | Verveeld | 1.0 |

---

### 6.6 Wafelzuster (Support / Healer)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Luikse of Brusselse, kind?" | Warm, moederlijk | 0.8 |
| Select | 2 | "Kom, ik heb net vers beslag" | Uitnodigend | 0.8 |
| Select | 3 | "De Heer geeft, en ik bak" | Sereen | 0.7 |
| Move | 1 | "Met Gods zegen en warme wafels" | Plechtig warm | 0.8 |
| Move | 2 | "Ik kom eraan, geduld" | Kalm, onverstoorbaar | 0.7 |
| Move | 3 | "Allez, de wafels wachten niet" | Licht haastig | 0.8 |
| Attack | 1 | "Vergeef me, Heer, want dit gaat pijn doen" | Kalm dreigend | 1.0 |
| Attack | 2 | "Het wafel-ijzer is heet!" | Waarschuwend | 0.7 |
| Attack | 3 | "Een tik van zuster, en ge bidt ook!" | Streng, non-humor | 1.0 |
| Death | 1 | "Het beslag... laat het niet aanbranden..." | Stervende zorg | 1.2 |
| Death | 2 | *zacht gebed + zucht* | Vredig | 1.0 |
| Ability | 1 | "Luikse wafels voor iedereen! Genees en eet!" | Genereus, warm | 1.2 |
| Ability | 2 | "Suiker geneest alle wonden, kinderen" | Moederlijk wijs | 1.0 |
| Idle | 1 | *zacht bidden + wafelbeslag roeren* | Meditatief | 2.0 |
| Idle | 2 | "Wie heeft er goesting in een wafel? Niemand? ...Ik dan" | Licht beledigd | 1.5 |

---

### 6.7 Dubbele Spion (Special)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Ceci n'est pas un espion" | Mysterieus, droog | 0.8 |
| Select | 2 | "Ik werk voor zes regeringen. Tegelijk." | Fluisterend, trots | 1.0 |
| Select | 3 | "Psst... vertrouw niemand. Ook mij niet." | Paranoia | 1.0 |
| Move | 1 | "Ik ben er nooit geweest" | Samenzweerderig | 0.7 |
| Move | 2 | "Via het diplomatieke kanaal" | Sluw | 0.7 |
| Move | 3 | "Onzichtbaar. Zoals de Belgische identiteit." | Filosofisch cynisch | 1.2 |
| Attack | 1 | "Sorry, dit is... niets persoonlijks. Misschien." | Onzeker agressief | 1.2 |
| Attack | 2 | "Namens... iemand. Ik weet niet meer wie." | Verward gevaarlijk | 1.2 |
| Attack | 3 | "Surprise!" | Kort, dodelijk | 0.4 |
| Death | 1 | "Welke kant... was ik ook alweer..." | Existentieel stervend | 1.2 |
| Death | 2 | *fluisterend:* "Vernietig... de dossiers..." | Paranoia tot het einde | 1.0 |
| Ability | 1 | "Nu ben ik iemand anders. Wie? Maakt niet uit." | Transformatie, kalm | 1.2 |
| Ability | 2 | "Een beetje sabotage... pour le bien commun" | Fluisterend, tevreden | 1.2 |
| Idle | 1 | "Ik vertrouw zelfs mijn eigen schaduw niet meer" | Paranoia, mompelend | 1.5 |
| Idle | 2 | *papier ritselen + fluisteren:* "Dossier 47... of was het 48..." | Geobsedeerd | 1.5 |

---

### 6.8 De Frietkoning (Hero)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Wij, Koning der Frieten, luisteren" | Koninklijk, pluralis majestatis | 1.0 |
| Select | 2 | "Amai, eindelijk wordt er naar ons geluisterd" | Koninklijk + Vlaams | 1.2 |
| Select | 3 | "Het Frietimperium staat tot uw dienst" | Plechtig, warm | 1.0 |
| Move | 1 | "Wij marcheren. Met saus." | Absurd koninklijk | 0.7 |
| Move | 2 | "De koning beweegt, het volk volgt" | Majestueus | 0.8 |
| Move | 3 | "Allez, richting overwinning" | Informeel koninklijk | 0.7 |
| Attack | 1 | "In naam van de Gouden Friet!" | Epische strijdkreet | 0.8 |
| Attack | 2 | "Wij serveren gerechtigheid! Met mayo!" | Heroisch absurd | 1.0 |
| Attack | 3 | "Kniel voor de Frietkoning of wordt gebakken!" | Dreigend koninklijk | 1.2 |
| Death | 1 | "De kroon... valt... wie bakt nu de frieten..." | Episch stervend | 1.5 |
| Death | 2 | "Lang... leve... Belgie..." *kroon klettert* | Patriottisch, dramatisch | 1.5 |
| Ability | 1 | "Koninklijke Portie! Eet, drink en vecht!" | Genereus, krachtig | 1.2 |
| Ability | 2 | "Wij bieden u chocolade aan. Weiger niet." | Diplomatiek dreigend | 1.2 |
| Ability | 3 | "De frituur brandt! Vriend en vijand, opgepast!" | Commando, waarschuwend | 1.2 |
| Idle | 1 | "Een koning zonder oorlog is een frituurbaas zonder klanten" | Filosofisch | 1.8 |
| Idle | 2 | *deelt frieten uit aan onzichtbare onderdanen* "Alstublieft, met de complimenten" | Gul, excentriek | 2.0 |

---

### 6.9 De Abdijbrouwer (Hero)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "De waarheid zit in de tweede gisting" | Cryptisch, wijs | 1.0 |
| Select | 2 | "Spreek, kind. Maar zacht." | Sereen, mysterieus | 0.8 |
| Select | 3 | "Stilte is goud. Bier is diamant." | Filosofisch | 0.8 |
| Move | 1 | "De pelgrimstocht gaat verder" | Plechtig | 0.7 |
| Move | 2 | "Waar bier is, is een weg" | Wijs, kalm | 0.7 |
| Move | 3 | "Allez, de abdij wacht niet" | Nuchter, pragmatisch | 0.7 |
| Attack | 1 | "God vergeeft. Ik brouw." | Koud, dreigend | 0.7 |
| Attack | 2 | "Proef de toorn van de Trappist!" | Strijdlustig, mystiek | 1.0 |
| Attack | 3 | "Dit bier... is niet voor u bestemd" | Kalm agressief | 0.8 |
| Death | 1 | "Het recept... mag niet... verloren gaan..." | Stervend, bezorgd | 1.5 |
| Death | 2 | *glas valt + vloeistof stroomt + zucht* "Amen." | Vredig stervend | 1.2 |
| Ability | 1 | "Stilte! In naam van het brouwsel!" | Autoritair, krachtig | 0.8 |
| Ability | 2 | "Drink, broeders, en wordt heel" | Zacht, helend | 0.8 |
| Ability | 3 | "Welke van ons is echt? Zelfs ik weet het niet" | Mysterieus, speels | 1.2 |
| Idle | 1 | "Zoals het Trappistenbier: geduld wordt beloond" | Meditatief | 1.2 |
| Idle | 2 | *gregoriaans gezang, onderbroken door een boer* "Pardon." | Komisch sereen | 1.5 |

---

## Bijlage A: Unit Vergelijkingstabel

| Unit | Rol | HP | ATK | AS | DPS | Armor | Type | Spd | Range | Cost | Pop | Tier |
|------|-----|-----|-----|-----|-----|-------|------|-----|-------|------|-----|------|
| Frietkraamhouder | Worker | 55 | 5 | 1.5s | 3.3 | 0 | Light | 4.5 | 0 | 50/0 | 1 | 1 |
| Bierbouwer | Infantry | 90 | 12 | 1.2s | 10.0 | 1 | Light | 5.0 | 0 | 80/30 | 1 | 1 |
| Chocolatier | Ranged | 50 | 15 | 1.8s | 8.3 | 0 | Light | 4.5 | 8 | 100/60 | 1 | 1 |
| Frituurridder | Heavy | 220 | 22 | 2.0s | 11.0 | 4 | Heavy | 4.0 | 0 | 180/130 | 2 | 2 |
| Manneken Pis-kanon | Siege | 80 | 12/55 | 3.0s | 4/18.3 | 1 | Medium | 3.0 | 10 | 200/150 | 3 | 3 |
| Wafelzuster | Support | 55 | 6 | 1.5s | 4.0 | 0 | Light | 4.5 | 6 | 90/65 | 1 | 2 |
| Dubbele Spion | Special | 40 | 6 | 1.5s | 4.0 | 0 | Light | 6.0 | 0 | 90/70 | 1 | 2 |
| Frietkoning | Hero | 500 | 20 | 1.5s | 13.3 | 5 | Heavy | 4.5 | 0 | 400/200+30C | 5 | 2 |
| Abdijbrouwer | Hero | 280 | 10 | 2.0s | 5.0 | 2 | Medium | 4.5 | 9 | 350/300+40C | 5 | 2 |

## Bijlage B: Building Vergelijkingstabel

| Gebouw | Tier | Kosten | Bouwtijd | HP | Vereist |
|--------|------|--------|---------|-----|---------|
| Stadhuis | 1 | — | — | 1600 | Start |
| Frituur | 1 | 200/0 | 32s | 850 | Stadhuis |
| Abdij | 1 | 150/75 | 28s | 650 | Stadhuis |
| Frietfabriek | 1 | 125/50 | 25s | 600 | Stadhuis |
| Chocolaterie | 1 | 200/100 | 30s | 600 | Stadhuis |
| Wafelkraam | 1 | 100/50 | 15s | 300 | Stadhuis |
| Brusselse Woning | 1 | 100/50 | 20s | 500 | Stadhuis |
| EU-Parlement | 2 | 300/175 | 45s | 800 | Stadhuis |
| Rijschool | 2 | 300/200 | 42s | 800 | Frituur + EU-Parlement |
| Surrealistisch Atelier | 2 | 250/200 | 40s | 700 | EU-Parlement |
| Commissiegebouw | 2 | 225/225 | 35s | 900 | EU-Parlement |
| Diplomatiek Salon | 3 | 350/250 | 50s | 750 | Federaal Paleis |

## Bijlage C: Balans Notities

### Sterke punten vs andere facties
- **vs Brabanders**: Diplomatie doorbreekt Gezelligheid-deathball (Compromis/Commissie vertraagt hun grouping)
- **vs Randstad**: Dubbele Spion saboteert hun productiegebouwen, Commissies stapelen met hun eigen Bureaucratie-vertraging
- **vs Limburgers**: Diplomatieke Verwarring countered tunnel-hit-and-run (verwarde units kunnen geen coordinated strikes doen)

### Zwakke punten
- **Trage opstart**: Geen sterke early-game rush optie, afhankelijk van Chocolaterie-opbouw
- **Chocolade-afhankelijk**: Zonder Chocolade verliest de factie haar unieke kracht
- **Individueel gemiddeld**: Geen enkele unit is de "beste" in zijn categorie — de kracht zit in synergie en diplomatie
- **Tier 3 afhankelijk**: De Compromis-mechanic, het sterkste wapen, is pas beschikbaar in Tier 3

### Design Intentie
De Belgen zijn de "mind games"-factie. Ze winnen door de vijand te verwarren, vertragen en manipuleren. Een goede Belgen-speler wint oorlogen door ze te voorkomen (Compromis), vijandelijke economie te saboteren (Dubbele Spion + Commissies), en in late game het complete diplomatieke arsenaal in te zetten. De factie beloont geduld, planning en creatief gebruik van abilities boven raw micro-management.

---

**Einde document**
**Versie**: 1.0.0
**Woorden**: ~4500
**Status**: Klaar voor review
