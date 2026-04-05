# Reign of Brabant — Product Requirements Document

**Versie**: 1.0.0
**Datum**: 2026-04-05
**Status**: Draft — Wacht op goedkeuring
**Genre**: Real-Time Strategy (RTS)
**Platform**: Desktop browser (Three.js/WebGL), mobile secondary
**Inspiratie**: WarCraft: Reign of Chaos + Brabantse cultuur

---

## 1. Game Overview

### 1.1 Elevator Pitch

Een 3D browser-based RTS game waarin vier Nederlandse/Belgische facties strijden om de controle over Brabant. Met authentieke cultuur, absurdistische humor en diep strategisch gameplay. De Brabanders verdedigen hun worstenbroodjes tegen de bureaucratische Randstad, met hulp van de chaotische Belgen en het mysterieuze Limburg.

### 1.2 Setting

Het jaar 1473, alternatief Brabant. Het Hertogdom Brabant staat op een kruispunt. Het legendarische **Gouden Worstenbroodje** — gesmeed in de ovens van de Sint-Janskathedraal — is gestolen. Op de plaats delict: een visitekaartje van de *Randstad Ontwikkelingsmaatschappij*. De oorlog begint.

### 1.3 Unique Selling Points

1. **Gezelligheid-mechanic**: Brabandse units worden sterker naarmate ze dichter bij elkaar zijn — een mechanic die nergens anders bestaat
2. **4 asymmetrische facties** gebaseerd op echte regionale cultuurverschillen
3. **Humor als feature**: Resources heten "Worstenbroodjes" en "LinkedIn Connections", abilities heten "Eindeloze Vergadering"
4. **Volledig in de browser**: geen install, direct speelbaar
5. **AI-generated assets**: 3D modellen (Meshy/Blender), voices (ElevenLabs), muziek (Suno)

### 1.4 Target Audience

- Nederlandse/Vlaamse gamers (cultuurherkenning)
- Retro RTS fans (WarCraft/Age of Empires nostalgie)
- Casual strategy gamers (browser = lage drempel)

### 1.5 Release Strategie

| Release | Inhoud | Target |
|---------|--------|--------|
| **MVP (v0.1)** | 2 facties, 1 map, skirmish vs AI | Speelbaar prototype |
| **v1.0** | 3 facties, 3 maps, 5-missie campaign | Publiek speelbaar |
| **v2.0** | 4 facties, multiplayer, volledige campaign | Feature-complete |

---

## 2. Core Mechanics

### 2.1 Resource System

Twee universele resources, factie-specifiek benoemd:

| Resource | Brabanders | Limburgers | Belgen | Randstad | Verzameld van |
|----------|-----------|------------|--------|----------|---------------|
| **Primair** (Gold) | Worstenbroodjes | Vlaai | Frieten | PowerPoints | Resource nodes op de map |
| **Secundair** (Lumber) | Bier | Mergel | Trappist | LinkedIn Connections | Bomen / props op de map |

**Regels:**
- Workers verzamelen resources en brengen ze naar het Town Hall
- Workers dragen max 10 eenheden per trip
- Resource nodes hebben een eindig aantal (gold mines: 1500, bomen: 100 per boom)
- Meerdere workers op dezelfde node = sneller uitgeput
- Gebouwen en units kosten een combinatie van beide resources

**Tertiaire resource** (per factie, geavanceerd):

| Factie | Tertiair | Hoe verkregen | Gebruikt voor |
|--------|----------|---------------|---------------|
| Brabanders | Gezelligheid | Genereert passief wanneer units bij elkaar staan | Factie-ability, hero ultimates, tier 3 tech |
| Limburgers | Kolen | Mijnschacht-gebouw (passief) | Geavanceerde units, underground netwerk |
| Belgen | Chocolade | Chocolaterie-gebouw (passief) | Premium units, diplomatie-abilities |
| Randstad | Havermoutmelk | Starbucks-gebouw (passief) | Hipster-units, geavanceerde tech |

### 2.2 Building System

**Bouwregels:**
- Alleen workers kunnen bouwen
- Gebouwen kosten resources + bouwtijd
- Gebouwen moeten geplaatst worden op begaanbaar terrein
- Gebouwen blokkeren pathfinding (navmesh update via TileCache)
- Gebouwen hebben health en kunnen vernietigd worden
- Sommige gebouwen unlocken andere gebouwen (tech tree dependency)

**Population cap:**
- Start: 10 (Town Hall)
- Per housing building: +8
- Maximum: 100 units per speler

### 2.3 Unit System

**Unit types (universeel):**

| Rol | Functie | Voorbeeld |
|-----|---------|-----------|
| Worker | Verzamelt resources, bouwt gebouwen | Boer, Stagiair |
| Infantry (melee) | Basis grondtroepen | Carnavalvierder, Manager |
| Ranged | Afstandsaanvallen | Sjansen/Kansen, Consultant |
| Cavalry/Heavy | Langzaam, hoge HP, charge | Tractorrijder, Corporate Advocaat |
| Siege | Anti-gebouw specialist | Frituurmeester, Vastgoedmakelaar |
| Support | Healer/buffer | Boerinne, HR-medewerker |
| Special | Unieke factie-mechanic | Muzikansen, Dubbele Spion |
| Hero | Krachtige unieke unit (max 1) | Prins van Brabansen, De CEO |

**Unit stats:**

| Stat | Beschrijving |
|------|-------------|
| HP | Hit points — bij 0 is de unit dood |
| Attack | Schade per aanval |
| Attack Speed | Tijd tussen aanvallen (seconden) |
| DPS | Attack / Attack Speed |
| Armor | Reduceert inkomende schade |
| Speed | Bewegingssnelheid (units/sec) |
| Range | Aanvalsbereik (0 = melee) |
| Build Time | Trainingstijd in seconden |
| Cost | [Primair, Secundair] resources |
| Population | Hoeveel supply de unit kost |

### 2.4 Combat System

**Damage berekening:**
```
Effective Damage = Attack - (Armor * 0.5)
Minimum Damage = 1 (altijd minstens 1 schade)
```

**Armor types:**
| Type | Sterk tegen | Zwak tegen |
|------|------------|------------|
| Light | Magic | Melee |
| Medium | Melee | Ranged |
| Heavy | Ranged | Siege |
| Building | Alles behalve siege | Siege |

**Attack modifiers:**
| Aanvaller → Doel | Bonus |
|------------------|-------|
| Melee → Light | +50% |
| Ranged → Medium | +50% |
| Siege → Building | +100% |
| Magic → Heavy | +50% |

**Combat flow:**
1. Unit krijgt attack-commando
2. Beweeg naar target tot binnen range
3. Face target
4. Attack animation + damage op attack speed interval
5. Target reageert: schade-flash, health bar update
6. Bij HP=0: death animation, unit verdwijnt na 3 sec

**Projectiles:**
- Ranged units schieten projectielen met travel time
- Projectielen kunnen missen als target beweegt (dodge based on speed)
- Siege projectielen zijn AoE (splash radius in stats)

### 2.5 Tech Tree

**3 tiers per factie, unlocked door upgrade-gebouwen:**

```
Tier 1 (Start)
├── Town Hall → Worker
├── Barracks → Infantry, Ranged
└── Resource buildings

    [Bouw upgrade-gebouw]
         ↓
Tier 2
├── Upgrade-gebouw → tech upgrades
├── Barracks → + Heavy unit
├── Nieuwe gebouwen beschikbaar
└── Hero beschikbaar

    [Upgrade Town Hall naar level 2]
         ↓
Tier 3
├── Siege unit beschikbaar
├── Special unit beschikbaar
├── Geavanceerde upgrades
└── Factie-ability beschikbaar
```

**Universele upgrades (per tier):**

| Tier | Upgrade | Effect | Kosten |
|------|---------|--------|--------|
| 1 | Scherpe Wapens I | +2 Attack alle melee | 100/50 |
| 1 | Stevige Schilden I | +1 Armor alle units | 100/75 |
| 2 | Scherpe Wapens II | +2 Attack alle melee | 200/100 |
| 2 | Stevige Schilden II | +2 Armor alle units | 200/150 |
| 2 | Snelle Voeten | +15% Speed alle units | 150/100 |
| 3 | Scherpe Wapens III | +3 Attack alle units | 300/200 |
| 3 | Stevige Schilden III | +3 Armor alle units | 300/250 |
| 3 | Factie Mastery | Unlock factie-ability | 400/400 |

### 2.6 Fog of War

**Drie states:**
1. **Unexplored** (zwart): nooit gezien, terrein onbekend
2. **Explored** (donker/grijs): eerder gezien, terrein zichtbaar, geen units zichtbaar
3. **Visible** (helder): binnen sight range van eigen unit, alles zichtbaar

**Implementatie:**
- Visibility texture (canvas 2D) geprojecteerd op terrein als shader mask
- Update frequentie: 5-10 fps (niet elke frame)
- Elke unit heeft een `sightRange` stat (cirkelvormig)
- Buildings hebben ook sight range
- Scouts hebben extra groot sight range

### 2.7 Camera & Controls

**Camera:**
- Perspective camera met hoge hoek (~60 graden)
- Pan: WASD / pijltjes / muis aan schermrand (edge scrolling)
- Zoom: scrollwiel (min/max grenzen)
- Rotate: middle mouse button (optioneel, kan uitgeschakeld)
- Minimap klik = camera sprong

**Unit controls:**
- Links klik: selecteer unit
- Shift + links klik: voeg toe aan selectie
- Box select: sleep een rechthoek over units
- Rechts klik: contextgevoelig commando
  - Op terrein: move
  - Op vijandelijke unit: attack
  - Op resource: gather
  - Op eigen gebouw: garrison (toekomstig)
- Ctrl + 1-9: control group opslaan
- 1-9: control group oproepen
- A: attack-move (beweeg en val alles onderweg aan)
- S: stop
- H: hold position

**Hotkeys per gebouw:**
- Q/W/E/R/T: train unit 1-5
- Escape: deselecteer

---

## 3. Facties

### 3.1 Brabanders — "De Gezelligen"

**Thema**: Gemeenschap, feest, onverwachte kracht
**Sterkte**: Groepen units zijn extreem sterk (Gezelligheid-mechanic)
**Zwakte**: Individuele units zijn relatief zwak
**Playstyle**: Deathball — verzamel een grote groep en overpower de vijand
**Kleurenpalet**: Oranje, bruin, groen, goud

#### Unieke Mechanic: Gezelligheid

Brabandse units worden sterker naarmate ze dichter bij elkaar zijn:

| Units bij elkaar | Stat bonus | Gezelligheid generatie |
|-----------------|-----------|----------------------|
| 1 (alleen) | +0% | Geen |
| 2-5 | +10% alle stats | Langzaam |
| 6-10 | +20% alle stats | Matig |
| 11-20 | +30% alle stats + passieve heal | Snel |
| 20+ | +50% alle stats + damage reduction | Explosief |

*Radius: 15 units afstand. Stats gelden voor Attack, Speed en Armor.*

#### Factie-Ability: Carnavalsrage

- **Kosten**: 100 Gezelligheid
- **Effect**: ALLE Brabandse units op de map krijgen 30 seconden:
  - +50% Attack
  - +25% Speed
  - +25% Armor
  - Confetti visueel effect
  - Voice line: "ALAAF!"
- **Cooldown**: 180 seconden

#### Gebouwen

| # | Gebouw | Type | Produceert | Kosten | Bouwtijd | HP |
|---|--------|------|-----------|--------|---------|-----|
| 1 | **Boerderij** | Town Hall | Boeren | — | — | 1500 |
| 2 | **Cafe** | Barracks | Carnavalvierder, Kansen | 200/0 | 30s | 800 |
| 3 | **Bakkerij** | Resource gen | +3 Worstenbroodjes/10s | 150/50 | 25s | 600 |
| 4 | **Brouwerij** | Resource gen | +2 Bier/10s | 100/100 | 25s | 600 |
| 5 | **Kermistent** | Tech/Upgrade | Upgrades, Tier 2 unlock | 250/150 | 40s | 700 |
| 6 | **Kerk** | Defense tower | Klokkengebeier (AoE dmg) | 200/200 | 35s | 900 |
| 7 | **Feestzaal** | Advanced unit | Tractorrijder, Frituurmeester | 300/200 | 45s | 800 |
| 8 | **Dorpsweide** | Special | Gezelligheid burst (20+ units) | 150/100 | 20s | 400 |
| 9 | **Frietkar** | Support (mobiel) | Healt nabije units | 100/50 | 15s | 300 |
| 10 | **Boerenhoeve** | Housing | +8 population | 100/50 | 20s | 500 |

*Upgrade: Boerderij → Grote Hoeve (Tier 2) → Herenboerderij (Tier 3)*

#### Units

**Boer** (Worker)
| Stat | Waarde |
|------|--------|
| HP | 60 |
| Attack | 5 |
| Attack Speed | 1.5s |
| Armor | 0 |
| Speed | 5.0 |
| Range | 0 (melee) |
| Build Time | 15s |
| Cost | 50/0 |
| Population | 1 |
| Carry Capacity | 10 |

- Wapen: Hooivork
- Kan vechten als het moet (desperate defense)
- Voice select: *"Ja?"* / *"Zeg het maar"* / *"Ik luister"*
- Voice move: *"Ok!"* / *"Is goed"* / *"Ik ga al"*
- Voice attack: *"Moet dat?!"* / *"Vooruit dan maar"*

---

**Carnavalvierder** (Infantry — melee)
| Stat | Waarde |
|------|--------|
| HP | 80 |
| Attack | 10 |
| Attack Speed | 1.2s |
| Armor | 1 |
| Armor Type | Light |
| Speed | 5.5 |
| Range | 0 (melee) |
| Build Time | 18s |
| Cost | 75/25 |
| Population | 1 |

- Wapen: Feesttoeter (melee) + confetti
- **Ability — Polonaise**: Wanneer 5+ Carnavalvierders bij elkaar zijn, vormen ze een polonaise: +30% speed, +20% attack, maar kunnen niet stoppen tot de polonaise eindigt (8 seconden)
- Polonaise cooldown: 30 seconden
- Voice select: *"ALAAF!"* / *"Nog eentje dan!"* / *"Waar is de bar?"*
- Voice move: *"Op naar het feest!"* / *"Ik dans ernaartoe"*
- Voice attack: *"Pansen erop!"* / *"Brabant vergeet niet!"*

---

**Kansen** (Ranged / Stealth)
| Stat | Waarde |
|------|--------|
| HP | 55 |
| Attack | 12 |
| Attack Speed | 1.8s |
| Armor | 0 |
| Armor Type | Light |
| Speed | 6.0 |
| Range | 8 |
| Build Time | 22s |
| Cost | 60/40 |
| Population | 1 |

- Wapen: Bierpullen (ranged, thrown)
- **Ability — Smokkelroute**: Wordt onzichtbaar voor 10 seconden. Kan bewegen maar niet aanvallen. Cooldown: 45 seconden.
- Voice select: *"Ik ken iemansen die iemansen kent..."* / *"Niks gezien, niks gehoord"*
- Voice move: *"Sssst, ik ga al"*
- Voice attack: *"Vansen de vrachtansen gevallen!"*

---

**Boerinne** (Support / Healer)
| Stat | Waarde |
|------|--------|
| HP | 50 |
| Attack | 8 (melee, koekenpan) |
| Attack Speed | 1.5s |
| Heal | 15 HP per cast |
| Heal Speed | 2.0s |
| Armor | 0 |
| Armor Type | Light |
| Speed | 5.0 |
| Range | 6 (heal range) |
| Build Time | 25s |
| Cost | 80/60 |
| Population | 1 |

- **Auto-heal**: Target automatisch de meest beschadigde ally in range
- **Ability — Koffie met Gebak**: AoE heal (25 HP) + genereert 5 Gezelligheid. Radius: 8 units. Cooldown: 30 seconden.
- Voice select: *"Hedde al gegeten?"* / *"Kom hier, dan plak ik er een plansen op"*
- Voice move: *"Ik kom eraan, jansen!"*

---

**Muzikansen** (Buffer / Debuffer) [Tier 2]
| Stat | Waarde |
|------|--------|
| HP | 45 |
| Attack | 5 |
| Attack Speed | 2.0s |
| Armor | 0 |
| Armor Type | Light |
| Speed | 5.0 |
| Range | 0 (melee) |
| Build Time | 28s |
| Cost | 100/75 |
| Population | 1 |

- Wapen: Instrument (tuba/trom)
- **Aura — Opzwepende Marsmuziek**: Allies in radius 10 krijgen +25% attack speed (passief, altijd actief)
- **Ability — Carnavalskraker**: Vijandelijke units in radius 8 stoppen 3 seconden (ze zingen mee). Cooldown: 40 seconden.
- **Debuff — Valse Nansen**: Vijanden in radius 8 krijgen -20% accuracy. Passief.
- Voice select: *"En dan nu... LIMBO!"* / *"Eansen, twee, drie, VIER!"*

---

**Tractorrijder** (Heavy / Cavalry equivalent) [Tier 2]
| Stat | Waarde |
|------|--------|
| HP | 200 |
| Attack | 22 |
| Attack Speed | 2.0s |
| Armor | 4 |
| Armor Type | Heavy |
| Speed | 4.0 |
| Range | 0 (melee) |
| Build Time | 35s |
| Cost | 150/100 |
| Population | 2 |

- Wapen: Tractor charge + hooivork
- **Ability — Volgas**: Charge in rechte lijn (20 units afstand), alles omver. 5 seconden disabled daarna (motor slaat af). Cooldown: 25 seconden. Damage: 40 + knockback.
- **Passief — Modder**: Laat een modderspoor achter dat vijanden vertraagt (-30% speed, 5 seconden).
- Voice select: *"Meer pk's dan je kunt tansen!"* / *"Die akker ploegt zichzelf nie"*
- Voice attack: *"BANSEN UIT DE WEG!"*

---

**Frituurmeester** (Siege) [Tier 3]
| Stat | Waarde |
|------|--------|
| HP | 100 |
| Attack | 15 (units) / 45 (buildings) |
| Attack Speed | 3.0s |
| Armor | 1 |
| Armor Type | Medium |
| Speed | 3.5 |
| Range | 10 |
| Splash Radius | 3 |
| Build Time | 40s |
| Cost | 200/150 |
| Population | 3 |

- Wapen: Kokend frituurvet (ranged, AoE)
- **Ability — Frikandel Speciaal**: AoE brandplek op targetlocatie. 10 DPS voor 8 seconden, radius 4. Cooldown: 35 seconden.
- Voice select: *"Een grote friet met!"* / *"Da wordt een kroketansen!"*

---

**Praalwagen** (Super Siege) [Tier 3]
| Stat | Waarde |
|------|--------|
| HP | 300 |
| Attack | 60 (buildings only) |
| Attack Speed | 4.0s |
| Armor | 3 |
| Armor Type | Heavy |
| Speed | 2.5 |
| Range | 12 |
| Splash Radius | 5 |
| Build Time | 55s |
| Cost | 300/250 |
| Population | 4 |

- Wapen: Confetti-kanon (extreme building damage)
- Kan NIET aanvallen op units (alleen gebouwen)
- Voice select: *"De wagen is klaar!"* / *"Alaaf en vansen!"*

---

#### Hero Units (max 1 per type, revive na 60s bij Town Hall)

**De Prins van Brabansen** (Tank / Buffer hero) [Tier 2, Cafe]
| Stat | Waarde |
|------|--------|
| HP | 500 |
| Attack | 25 |
| Attack Speed | 1.5s |
| Armor | 5 |
| Armor Type | Heavy |
| Speed | 5.0 |
| Range | 0 (melee) |
| Cost | 350/200 |
| Population | 5 |

- Wapen: Carnavalsscepter
- **Ability 1 — Prinselijke Toespraak**: Allies in radius 12 krijgen +30% alle stats, 20 seconden. Cooldown: 60s.
- **Ability 2 — Sleutel van de Stad**: Target vijandelijk gebouw wordt neutraal (unowned), 15 seconden. Cooldown: 90s. Range: 8.
- **Ability 3 — Drie Dwaze Dansen**: AoE stun radius 8, vijanden dansen oncontroleerbaar 4 seconden. Cooldown: 45s.
- **Ultimate — ALAAF!**: Alle Brabandse units op de HELE map krijgen invincibility 8 seconden. Kost 50 Gezelligheid. Cooldown: 180s.
- Voice select: *"De Prins is hier!"* / *"Alaaf, Brabant!"*

---

**De Boer van Brabansen** (Tank / Summoner hero) [Tier 2, Feestzaal]
| Stat | Waarde |
|------|--------|
| HP | 600 |
| Attack | 20 |
| Attack Speed | 1.8s |
| Armor | 6 |
| Armor Type | Heavy |
| Speed | 4.5 |
| Range | 0 (melee) |
| Cost | 400/250 |
| Population | 5 |

- Wapen: Mestvork
- **Ability 1 — Mestverspreider**: Cone AoE (30 graden, range 10), 30 damage + -40% speed 6 seconden. Cooldown: 20s.
- **Ability 2 — Boerenwijsheid**: Passief — alle workers in radius 15 verzamelen 50% sneller.
- **Ability 3 — Opstand**: Roept 6 tijdelijke militia-Boeren op (60 HP, 8 ATK, 30 seconden levensduur). Cooldown: 60s.
- **Ultimate — Tractorcharge**: Springt op een enorme tractor, ramt in rechte lijn 25 units afstand. 80 damage + knockback aan alles in pad. Cooldown: 120s.
- Voice select: *"De akker wacht"* / *"Wat er ook komt, Brabant blijft staan"*

---

### 3.2 Randstad — "De Bureaucraten"

**Thema**: Arrogantie, bureaucratie, overweldigende middelen
**Sterkte**: Late-game powerhouse, individueel sterke units, economische kracht
**Zwakte**: Trage opstart door vergadermechanics, werkoverleg pauzes
**Playstyle**: Turtle/boom — bouw een sterke economie, overpower in late game
**Kleurenpalet**: Grijs, wit, blauw, zilver

#### Unieke Mechanic: Bureaucratie

**Vergadercyclus:**
- Elke actie (bouwen, trainen, upgraden) duurt **20% langer** dan bij andere facties
- MAAR: elke voltooide actie geeft een **Efficientie-stack** (+3% snelheid per stack, max 20 stacks = +60%)
- Na 20+ voltooide acties is de Randstad SNELLER dan andere facties
- Stacks resetten NIET — eenmaal opgebouwd, permanent voordeel

**Werkoverleg:**
- Elke 5 minuten pauzeren ALLE Randstad-productiegebouwen 8 seconden
- Visueel: vergadertafel-icoontje boven elk gebouw
- **Kan uitgeschakeld worden** via Tier 3 tech: "Asynchroon Werken"
- Dit is de Achilleshiel: aanvallen TIJDENS werkoverleg = maximale impact

#### Factie-Ability: Eindeloze Vergadering

- **Kosten**: 100 LinkedIn Connections
- **Effect**: Alle vijandelijke units in radius 15 worden "uitgenodigd":
  - 10 seconden volledig stil (kunnen NIKS)
  - Visueel: vergadertafel materialiseert, units zitten eromheen met laptops
  - Na afloop: "Meeting Fatigue" debuff: -20% alle stats, 15 seconden
- **Cooldown**: 240 seconden (lang maar verwoestend)

#### Gebouwen

| # | Gebouw | Type | Produceert | Kosten | Bouwtijd | HP |
|---|--------|------|-----------|--------|---------|-----|
| 1 | **Hoofdkantoor** | Town Hall | Stagiaires | — | — | 1800 |
| 2 | **Vergaderzaal** | Barracks | Manager, Consultant | 250/0 | 36s | 900 |
| 3 | **Starbucks** | Resource gen + buff | +3 Havermoutmelk/10s + speed aura | 200/75 | 30s | 600 |
| 4 | **Netwerkborrel** | Resource gen | +2 LinkedIn/10s | 150/100 | 30s | 600 |
| 5 | **Coworking Space** | Tech/Upgrade | Upgrades, Tier 2 unlock | 300/175 | 48s | 800 |
| 6 | **Parkeergarage** | Advanced unit | Hipster, Corporate Advocaat | 350/250 | 50s | 900 |
| 7 | **Vinex-wijk** | Housing | +8 population | 125/75 | 24s | 600 |
| 8 | **Kantoor-toren** | Defense tower | Spreadsheet-barrage (ranged) | 250/250 | 40s | 1000 |

*Upgrade: Hoofdkantoor → Kantoorpand (Tier 2) → Corporate Tower (Tier 3)*
*Alle bouwtijden +20% door Bureaucratie, maar offset door Efficientie-stacks.*

#### Units

**Stagiair** (Worker)
| Stat | Waarde |
|------|--------|
| HP | 45 |
| Attack | 3 |
| Attack Speed | 1.5s |
| Armor | 0 |
| Speed | 5.5 |
| Range | 0 |
| Build Time | 12s |
| Cost | 35/0 |
| Population | 1 |
| Carry Capacity | 8 |

- Goedkoop en snel te produceren, maar zwak
- Carry Capacity lager (8 vs 10)
- Voice select: *"Ik hoop dat dit telt voor mijn stageverslag"* / *"Kan ik dit op mijn LinkedIn zetten?"*

---

**Manager** (Ranged / Debuff)
| Stat | Waarde |
|------|--------|
| HP | 70 |
| Attack | 9 |
| Attack Speed | 1.5s |
| Armor | 1 |
| Armor Type | Medium |
| Speed | 4.5 |
| Range | 7 |
| Build Time | 22s |
| Cost | 90/30 |
| Population | 1 |

- Wapen: Spreadsheets (ranged projectile)
- **Passief — Administratieve Last**: Elke hit voegt -5% speed toe (stapelbaar tot -50%, 10 seconden duration per stack)
- **Ability — Performance Review**: Target unit verliest 30% attack voor 10 seconden. Cooldown: 25s. Range: 7.
- Voice select: *"Dit staat niet in de planning!"* / *"Even mijn agenda checken"*
- Voice attack: *"Dit eskaleert!"* / *"Ik bel mijn advocaat!"*

---

**Consultant** (Debuff specialist)
| Stat | Waarde |
|------|--------|
| HP | 55 |
| Attack | 0 (doet GEEN directe damage) |
| Armor | 0 |
| Armor Type | Light |
| Speed | 5.0 |
| Range | 9 |
| Build Time | 20s |
| Cost | 70/50 |
| Population | 1 |

- Doet geen schade maar debufft continu
- **Aura — Adviesrapport**: Vijandelijke GEBOUWEN in radius 10 produceren 30% langzamer
- **Ability — Reorganisatie**: Target worker stopt 5 seconden met werken. Cooldown: 15s.
- Voice select: *"Vanuit mijn optiek..."* / *"We moeten de stakeholders meenemen"*
- Voice move: *"Ik stuur je een offerte"*

---

**Hipster** (Scout) [Tier 2]
| Stat | Waarde |
|------|--------|
| HP | 40 |
| Attack | 6 |
| Attack Speed | 1.5s |
| Armor | 0 |
| Armor Type | Light |
| Speed | 7.5 (snelste unit in het spel) |
| Range | 5 |
| Sight Range | 14 (extra groot) |
| Build Time | 15s |
| Cost | 50/30 |
| Population | 1 |

- Wapen: Vintage vinyl platen (ranged)
- **Ability — Gentrificatie**: Als Hipster 20 seconden ongestoord bij een neutraal gebouw/resource staat, claimt de Randstad die locatie. Cooldown: 60s.
- Voice select: *"Dit was populairder voordat jullie het ontdekten"* / *"Is hier ergens specialty coffee?"*

---

**HR-medewerker** (Support / Healer) [Tier 2]
| Stat | Waarde |
|------|--------|
| HP | 55 |
| Attack | 5 (melee) |
| Heal | 12 HP per cast |
| Heal Speed | 2.5s |
| Armor | 0 |
| Armor Type | Light |
| Speed | 4.5 |
| Range | 7 (heal) |
| Build Time | 25s |
| Cost | 90/70 |
| Population | 1 |

- **Ability — Teambuilding**: AoE buff radius 8. +20% alle stats, 10 seconden, maar units staan STIL tijdens casting (3s). Cooldown: 35s.
- Voice select: *"Hoe gaat het echt met je?"* / *"Even je werkgeluk meten"*

---

**Corporate Advocaat** (Heavy melee) [Tier 2]
| Stat | Waarde |
|------|--------|
| HP | 180 |
| Attack | 18 |
| Attack Speed | 2.0s |
| Armor | 4 |
| Armor Type | Heavy |
| Speed | 3.5 |
| Range | 0 (melee) |
| Build Time | 35s |
| Cost | 175/125 |
| Population | 2 |

- Wapen: Wetboeken (zware melee)
- **Ability — Juridische Procedure**: Target hero is stunned 6 seconden ("uw zaak is in behandeling"). Cooldown: 45s.
- **Ability — Dwangsom**: Target vijandelijk gebouw stopt met produceren tot de Advocaat sterft of het commando annuleert. Range: 8. Max 1 actief.
- Voice select: *"Namens mijn client..."* / *"Dit heeft juridische consequenties"*

---

**Influencer** (Ranged / AoE) [Tier 2]
| Stat | Waarde |
|------|--------|
| HP | 45 |
| Attack | 8 |
| Attack Speed | 1.5s |
| Armor | 0 |
| Armor Type | Light |
| Speed | 5.5 |
| Range | 8 |
| Build Time | 20s |
| Cost | 80/60 |
| Population | 1 |

- Wapen: Selfie-straal (AoE morale damage)
- **Ability — Viral Post**: Aanval die zich VERSPREIDT: geraakt unit infecteert nabije units (radius 3, max 3 extra targets). 5 damage per spread. Cooldown: 20s.
- **Ability — Cancel Culture**: Target hero verliest ALLE buffs. Cooldown: 60s. Range: 10.
- Voice select: *"OMG dit is SO Brabant"* / *"Link in bio!"*

---

**Vastgoedmakelaar** (Siege) [Tier 3]
| Stat | Waarde |
|------|--------|
| HP | 90 |
| Attack | 10 (units) / 50 (buildings) |
| Attack Speed | 3.5s |
| Armor | 1 |
| Armor Type | Medium |
| Speed | 3.5 |
| Range | 11 |
| Build Time | 45s |
| Cost | 225/175 |
| Population | 3 |

- Wapen: Ontwikkelingsplannen (ranged, anti-building)
- **Ability — Bod boven Vraagprijs**: Insta-capture vijandelijk resource-gebouw (wordt van jou). Cooldown: 120s. Range: 8. Werkt NIET op Town Hall.
- Voice select: *"Prachtige locatie!"* / *"Vraagprijs is slechts een richtlijn"*

---

#### Hero Units

**De CEO** (Commander / Buffer hero) [Tier 2]
| Stat | Waarde |
|------|--------|
| HP | 450 |
| Attack | 20 |
| Attack Speed | 1.8s |
| Armor | 4 |
| Armor Type | Heavy |
| Speed | 4.5 |
| Range | 0 (melee) |
| Cost | 400/250 |
| Population | 5 |

- Wapen: Gouden handdruk (melee)
- **Ability 1 — Kwartaalcijfers**: Alle Randstad-gebouwen produceren +50% sneller, 20 seconden. Cooldown: 60s.
- **Ability 2 — Ontslagronde**: Sacrifice 5 eigen units, alle overgebleven units +30% alle stats, 20 seconden. Cooldown: 90s.
- **Ability 3 — Golden Handshake**: Target vijandelijke hero uitgeschakeld 8 seconden (telt vertrekpremie). Cooldown: 60s. Range: 6.
- **Ultimate — Vijandige Overname**: Capture vijandelijk gebouw permanent. Alleen bruikbaar op gebouwen onder 50% HP. Cooldown: 180s. Range: 8.

---

**De Politicus** (Caster / Manipulator hero) [Tier 2]
| Stat | Waarde |
|------|--------|
| HP | 350 |
| Attack | 15 |
| Attack Speed | 2.0s |
| Armor | 2 |
| Armor Type | Medium |
| Speed | 5.0 |
| Range | 9 |
| Cost | 350/300 |
| Population | 5 |

- Wapen: Retoriek (ranged magic)
- **Ability 1 — Verkiezingsbelofte**: Allies in radius 10 krijgen +40% alle stats... maar de buff vervalt na 15 seconden. Cooldown: 30s.
- **Ability 2 — Subsidiestroomm**: Target eigen gebouw krijgt instant-upgrade (geen research tijd). Cooldown: 120s.
- **Ability 3 — Lobby**: Target vijandelijk tech-gebouw: research duurt 50% langer, 30 seconden. Cooldown: 45s. Range: 12.
- **Ultimate — Kamerdebat**: Alle units (vriend EN vijand) in radius 20 stoppen met vechten voor 12 seconden. Randstad-units herstellen health tijdens het debat (+5 HP/s). Cooldown: 180s.

---

### 3.3 Limburgers — "De Mijnwerkers" [v1.0]

**Thema**: Mysterie, diepte, veerkracht
**Sterkte**: Underground tunnel-netwerk, hit-and-run tactics, sterke verdediging
**Zwakte**: Langzame economie, dure units
**Playstyle**: Hit-and-run, guerrilla warfare, fortress met tunnels
**Kleurenpalet**: Grijs, donkergroen, steenkleur, blauw

#### Unieke Mechanic: Ondergronds Netwerk

- Limburgers kunnen **Grotten** bouwen (special building)
- Twee Grotten verbinden zich automatisch via tunnels
- Units kunnen INSTANT teleporteren tussen verbonden Grotten
- Vijanden zien het netwerk NIET tenzij ze een Grotte vernietigen
- Max 4 Grotten tegelijk

#### Factie-Ability: Vloedgolf van Vlaai

- **Kosten**: 100 Kolen
- **Effect**: Golf van vlaai over een gekozen gebied (radius 15):
  - Vijandelijke units: -50% speed, -25% attack, 20 seconden
  - Terrein wordt "plakkerig" (speed debuff zone, 30 seconden)
  - Limburgse units: +25% attack
- **Cooldown**: 180 seconden

#### Kernunits (beknopt)

| Unit | Rol | HP | ATK | Spd | Range | Cost | Special |
|------|-----|-----|-----|-----|-------|------|---------|
| Mijnwerker | Worker | 65 | 7 | 4.5 | 0 | 55/0 | Sterker dan andere workers |
| Schutterij | Infantry (ranged) | 70 | 14 | 4.5 | 9 | 85/35 | Vaandelzwaaien buff |
| Vlaaienwerper | Specialist | 50 | 10 | 5.0 | 8 | 65/45 | "Zoet" debuff: -20% speed |
| Mergelridder | Heavy | 250 | 20 | 3.0 | 0 | 175/125 | Steenhuid: 5s immune |
| Heuvelklansen | Scout | 35 | 5 | 8.0 | 4 | 40/20 | +50% speed op heuvels |
| Mijnrat | Stealth/Sabotage | 30 | 4 | 6.0 | 0 | 50/40 | Underground movement, mine placement |
| Hero: De Mijnbaas | Tank | 550 | 22 | 4.0 | 0 | 400/250 | Mijnschacht Instorten (AoE stun) |
| Hero: De Maasmansen | Caster | 300 | 12 | 5.0 | 10 | 350/300 | Maasvloed (AoE push + damage) |

---

### 3.4 Belgen — "De Diplomaten" [v2.0]

**Thema**: Chaos, overvloed, onverwachte brillantie
**Sterkte**: Diplomatie-mechanics, sterke economie, verwarring-abilities
**Zwakte**: Trage bouw (vergunningen), individueel gemiddeld
**Playstyle**: Economic boom + diplomatie, disruptie van vijand
**Kleurenpalet**: Rood, geel, zwart (Belgische vlag), gouden accenten

#### Unieke Mechanic: Belgisch Compromis

- Belgen kunnen op elk moment een "Compromis" aanbieden aan een niet-Randstad speler
- Compromis: beide spelers krijgen een tijdelijke buff, maar betalen resources
- Belgen kunnen ook vijandelijke UNITS tijdelijk neutraal maken
- De diplomatie-factie: kan bondgenootschappen vormen en breken

#### Factie-Ability: Diplomatieke Verwarring

- **Kosten**: 80 Chocolade
- **Effect**: Vijandelijke units in radius 15:
  - 50% kans commando's worden genegeerd
  - 25% kans op friendly fire (valt eigen team aan)
  - 10% kans unit gaat zitten en doet niks
  - Duur: 12 seconden
- **Cooldown**: 200 seconden

#### Kernunits (beknopt)

| Unit | Rol | HP | ATK | Spd | Range | Cost | Special |
|------|-----|-----|-----|-----|-------|------|---------|
| Frietkraamhouder | Worker | 55 | 5 | 4.0 | 0 | 50/0 | Draagt meer per trip (12) |
| Bierbouwer | Infantry | 90 | 12 | 5.0 | 0 | 80/30 | Speed boost na kill |
| Chocolatier | Ranged | 50 | 15 | 4.5 | 8 | 100/60 | Praline Surprise AoE poison |
| Frituurridder | Heavy | 220 | 22 | 4.0 | 0 | 180/130 | Charge + slow debuff |
| Manneken Pis-kanon | Siege | 80 | 55 (bldg) | 3.0 | 10 | 200/150 | Anti-building only |
| Dubbele Spion | Stealth | 40 | 6 | 6.0 | 0 | 90/70 | Disguise als vijandelijke unit |
| Hero: De Frietkoning | Tank/Support | 500 | 20 | 4.5 | 0 | 400/200 | Koninklijke Portie AoE heal |
| Hero: De Abdijbransen | Monk/Caster | 280 | 10 | 4.5 | 9 | 350/300 | Stiltegelofte (silence heroes) |

---

## 4. Maps

### 4.1 MVP Map: "De Kempen"

Gebaseerd op het landschap tussen Eindhoven, Tilburg en de Belgische grens.

**Afmetingen**: 256x256 game units
**Terrein**: Vlak met lichte heuvels, bossen, weilanden, vennen
**Speler posities**: 2 (tegenover elkaar, diagonaal)

**Elementen:**
| Element | Aantal | Beschrijving |
|---------|--------|-------------|
| Gold mines | 6 | 2 dicht bij elke start, 2 centraal (contested) |
| Bomen-clusters | 8-10 | Verspreid, eindig (100 hout per boom) |
| Heuvels | 3-4 | Sight range bonus, strategisch |
| Ven (water) | 1-2 | Onbegaanbaar terrein, creëert chokepoints |
| Ruïnes | 2 | Neutraal gebouw, claimbaar voor extra sight |
| Bruggen | 1-2 | Over water, chokepoint |

**Map layout (schematisch):**
```
[P1 Start]  Bomen   Heuvel    Bomen
   Gold      ...     Ven       ...
  Bomen     Gold    Brug      Gold
   ...      Heuvel   ...     Bomen
  Bomen      ...    Gold    [P2 Start]
```

### 4.2 Additionele Maps [v1.0]

**"Oeteldonk"** — Stedelijk, veel muren en chokepoints (Den Bosch thema)
**"Het Groene Woud"** — Dicht bebost, weinig open terrein, favoriet voor Limburg

### 4.3 Map Format

Maps worden opgeslagen als JSON:
```json
{
  "name": "De Kempen",
  "size": [256, 256],
  "terrain": { "heightmap": "kempen-height.png", "texture": "kempen-terrain.png" },
  "startPositions": [[20, 20], [236, 236]],
  "resources": [
    { "type": "gold", "position": [30, 30], "amount": 1500 },
    { "type": "trees", "positions": [[50,50],[51,50],...], "amountPerTree": 100 }
  ],
  "obstacles": [
    { "type": "water", "polygon": [[100,100],[120,100],[120,130],[100,130]] }
  ],
  "decorations": [
    { "type": "ruins", "position": [128, 128] }
  ]
}
```

---

## 5. Campaign [v1.0+]

### 5.1 Brabanders Campaign: "Het Gouden Worstenbroodje" (12 missies)

| # | Missie | Type | Nieuwe elementen | Locatie |
|---|--------|------|-----------------|---------|
| 1 | De Oogst | Tutorial | Workers, bouwen, resources | Reusel |
| 2 | Smokkel bij de Grens | Co-op intro | Belgen als NPC allies | Grens |
| 3 | Kermisgevecht | Eerste battle | Infantry, Cafe | Tilburg |
| 4 | De Binnendieze | Stealth | Kansen unit, stealth | Den Bosch |
| 5 | Heuvelland Diplomatie | Diplomatie | Limburgers intro | Limburg |
| 6 | De Boerenopstand | Groot gevecht | Tractorrijder, Frituurmeester | Groene Woud |
| 7 | Carnaval in Oorlogstijd | Speciale missie | Carnavalsrage | Oeteldonk |
| 8 | Verraad in Oeteldonk | Plot twist | Gegentrifieerde stad | Den Bosch |
| 9 | De Mijn van Waarheid | Alliance | Limburgers als allies | Limburg |
| 10 | Brainport Sabotage | Infiltratie | Eindeloze Vergadermachine ontdekt | Eindhoven |
| 11 | De Slag om Brabant | Episch gevecht | Alle facties, alle units | Brabant breed |
| 12 | Het Gouden Worstenbroodje | Finale | Boss: CEO + Politicus | Randstad HQ |

**Post-credits**: Limburger zegt: *"En nu... willen wij OOK een Gouden Worstenbroodje."* Sequel tease.

---

## 6. Technical Architecture

### 6.1 Tech Stack

| Component | Technologie | Waarom |
|-----------|------------|--------|
| Rendering | Three.js (WebGPU + WebGL2 fallback) | r171+ WebGPU = 100x sneller instanced rendering |
| ECS | **bitECS** | Snelste JS ECS (335K ops/s), essentieel voor 200+ units |
| Pathfinding | **recast-navigation-js** + @recast-navigation/three | Industrie-standaard, WASM, crowd simulation, TileCache |
| Game AI | **Yuka.js** | Steering behaviors, FSM, goal-driven AI, perception |
| Audio | **Howler.js** (playback + 3D spatial) | 7KB, sprite support, auto-fallback |
| Terrain | Simplex noise + Depth Anything heightmaps | fal.ai concept art → heightmap pipeline |
| UI | HTML/CSS overlay (geen canvas UI) | Performant, responsive |
| Bundler | Vite | Snelle dev server, tree shaking |
| Taal | TypeScript | Type safety voor complex systeem |
| Performance | stats-gl + three-perf + Spector.js | GPU/CPU monitoring + WebGL frame debugging |

### 6.1.1 3D Asset Pipeline (Uitgebreid)

```
UNITS:
  Blender procedureel (basis units) ──→ AccuRIG 2.0 (gratis auto-rig) ──→ GLB
  Meshy/Tripo3D v2.5 (heroes/specials) ──→ Tripo Auto-Rig (rig + walk/idle/attack presets) ──→ GLB

GEBOUWEN:
  Blender procedureel (parametrisch) ──→ Meshy v5 Retexture (PBR skins) ──→ GLB

PROPS:
  Blender procedureel (bomen/rotsen/hekken) ──→ GenPBR (gratis PBR maps) ──→ GLB

TERRAIN:
  Flux Pro (concept art) ──→ Depth Anything (heightmap) ──→ Three.js terrain
  Poly Haven / AmbientCG (gratis CC0 PBR textures) ──→ terrain materialen

TEXTURES:
  Nano Banana (portraits/icons) + fal.ai Flux Dev (sprites)
  Flux Kontext (chirurgische texture edits zonder regeneratie)

AUDIO:
  ElevenLabs (voices + SFX, loop: true voor ambient) + Suno (muziek, Richard maakt)
```

**Nieuwe tools ontdekt (april 2026):**

| Tool | Wat het doet | Impact | Kosten |
|------|-------------|--------|--------|
| **Tripo3D v2.5** (fal.ai) | 3D model + auto-rig + animatie presets in 1 stap | Game-changer voor unit pipeline | ~$0.15/gen |
| **Trellis 2** (fal.ai) | Microsoft, 3D met PBR in ~3s | Snel prototypen | ~$0.10/gen |
| **Hunyuan3D 2.1** (fal.ai) | Tencent, beste open-source PBR pipeline | Complex modellen | ~$0.10/gen |
| **AccuRIG 2.0** | Gratis auto-rigging + motion library | Lost Blender rigging bottleneck op | GRATIS |
| **Yuka.js** | Complete game AI library | Steering, FSM, perception voor units | GRATIS |
| **bitECS** | Snelste JS ECS (335K ops/s) | Essentieel voor 200+ units | GRATIS |
| **GenPBR** | Browser-based PBR map generator | Instant normal/roughness/AO maps | GRATIS |
| **Flux Kontext** (fal.ai) | Chirurgische image editing | Fix textures zonder regeneratie | ~$0.03/gen |

### 6.2 Architecture Overview

```
reign-of-brabant/
├── src/
│   ├── core/           # Game loop, ECS, state machine
│   ├── world/          # Terrain, map loading, fog of war
│   ├── entities/       # Units, buildings, resources
│   ├── factions/       # Faction-specific data, abilities
│   ├── combat/         # Damage calc, projectiles, abilities
│   ├── ai/             # Unit FSM, strategic AI
│   ├── pathfinding/    # Recast integration, formation movement
│   ├── camera/         # RTS camera, minimap
│   ├── input/          # Mouse, keyboard, selection, commands
│   ├── ui/             # HTML/CSS HUD, menus, unit panel
│   ├── audio/          # Music, SFX, voice manager
│   └── assets/         # Asset loader, model manager
├── assets/
│   ├── models/         # GLB files per faction
│   ├── textures/       # Terrain, building textures
│   ├── audio/          # Music, SFX, voice lines
│   ├── icons/          # Unit portraits, ability icons
│   └── maps/           # Map JSON + heightmaps
├── scripts/
│   ├── blender/        # Procedural asset generation scripts
│   └── generate-assets.sh
├── public/
│   └── index.html
├── PRD.md
├── CHANGELOG.md
├── VERSION
└── package.json
```

### 6.3 Performance Targets

| Metric | Target | Strategie |
|--------|--------|-----------|
| FPS (desktop) | 60 fps | WebGPU, InstancedMesh |
| FPS (mobile) | 30 fps | LOD, reduced draw calls |
| Max units on screen | 200 | InstancedMesh per unit type |
| Max total units | 400 (200 per speler) | Object pooling |
| Draw calls | < 150 | InstancedMesh, texture atlassen |
| Load time | < 5s | Lazy loading, compressed GLB |
| Memory | < 512MB | Texture budgets, model LOD |

### 6.4 Key Libraries

| Library | Versie | Doel |
|---------|--------|------|
| three | latest | 3D rendering |
| recast-navigation | latest | Pathfinding + crowd |
| @recast-navigation/three | latest | Three.js integration |
| simplex-noise | latest | Terrain generatie |
| howler | latest | Audio playback |
| vite | latest | Build tool |
| typescript | latest | Type safety |

---

## 7. Asset Pipeline

### 7.1 3D Modellen — Blender + Meshy Hybrid

**Strategie**: Blender procedureel voor alles dat geometrisch/parametrisch kan; Meshy alleen voor complexe organische vormen. Getest en geverifieerd op Blender 5.1 / M5 Pro.

| Asset Categorie | Tool | Reden | Aantal | GLB grootte | Gen. tijd |
|----------------|------|-------|--------|-------------|-----------|
| **Gebouwen** (alle facties) | Blender | Boxes + roofs + primitives, parametrisch | ~40 | 3-12K/stuk | 57ms/8 stuks |
| **Props** (bomen, rotsen, hekken) | Blender | Simpele vormen, seed-variatie | ~55 | ~5K/stuk | 27ms/55 stuks |
| **Resource nodes** | Blender | Iconische vormen | ~6 | ~5K/stuk | 10ms |
| **Voertuigen** (tractoren, karren) | Blender | Box+cylinder composities | ~4 | ~19K/stuk | 29ms/stuk |
| **Basis units** (workers, infantry) | Blender + rigging | 80-130 verts humanoids | ~20 | 5-8K/stuk | 13ms/10 stuks |
| **Hero units** | Meshy v6 | Unieke silhouetten, detail nodig | ~8 | 50-200K/stuk | Meshy queue |
| **Cavalry/mounted** | Meshy v6 | Organische dier-vormen | ~6 | 50-200K/stuk | Meshy queue |
| **Special/elite units** | Meshy v6 | Robes, staven, magie-detail | ~10 | 50-200K/stuk | Meshy queue |
| **Siege (uniek)** | Meshy v6 | Creatieve unieke vormen | ~4 | 50-200K/stuk | Meshy queue |
| **Terrein** | Blender | Subdivided plane + displacement | ~2 | Heightmap | Code |
| **TOTAAL** | | | **~155** | | |

**Blender: ~127 modellen (82%)** — GRATIS, ~500ms totale generatietijd
**Meshy: ~28 modellen (18%)** — ~$14-20 (1 maand Max plan credits)

**Volledige pipeline generatietijd**: <60 seconden (geometry) / ~10 minuten (met texture baking op 512x512)

### 7.2 Blender Procedurele Pipeline

**Geverifieerd op Blender 5.1.0 / MacBook Pro M5 Pro.**

```bash
# Genereer ALLE assets voor een factie (gebouwen, props, units)
blender --background --python scripts/blender/generate_rts_assets.py -- \
  --faction brabanders \
  --output assets/models/brabanders/

# Genereer gedeelde props (bomen, rotsen, hekken)
blender --background --python scripts/blender/generate_rts_assets.py -- \
  --type shared_props \
  --tree-count 30 --rock-count 20 --fence-count 10 \
  --output assets/models/shared/

# Genereer en rig een basis unit met animaties
blender --background --python scripts/blender/generate_rts_assets.py -- \
  --type unit \
  --faction brabanders \
  --unit-type worker \
  --rig humanoid_15bone \
  --animations idle,walk,attack,death,gather \
  --output assets/models/brabanders/units/
```

**Factie-specifieke bouwstijlen (parametrisch):**

| Factie | Muren | Dak | Accenten | Materialen |
|--------|-------|-----|----------|-----------|
| Brabanders | Baksteen cubes | Steile 4-vertex cone (zadeldak) | Houten balken, schoorstenen | Rood/bruin/groen |
| Randstad | Glazen cubes + cylinders | Plat (alleen cubes) | Rasterramen, modern | Grijs/blauw/zilver |
| Limburgers | Mergel cubes (dik) | Gotische cone (hoog) | Mijnschachten, torens | Grijs/donkergroen/steen |
| Belgen | Scheef gestapelde cubes | Mix zadeldak + plat | Uithangborden, stoom | Rood/geel/zwart |

**Boom generatie (3 stijlen, seed-variatie):**
- **Dennenboom**: Cylinder stam + 3 gestapelde 6-vertex cones (variabele radius/hoogte)
- **Eikenboom**: Cylinder stam + subdiv-1 icosphere (12 verts bladerkroon)
- **Berkenboom**: Dunne cylinder + verticaal geschaalde icosphere
- Per boom: 30-60 vertices, ~5K GLB, 50+ unieke varianten via seed

**Texture baking (geverifieerd):**
- Procedurele materialen (Noise Texture + Color Ramp + Principled BSDF)
- UV unwrap via `bpy.ops.uv.smart_project()`
- Bake via Cycles GPU (Metal op M5 Pro), 4 samples
- 512x512 texture: ~80ms per bake, ~137K PNG
- Factie-kleurpaletten als Python dict → direct toepasbaar

### 7.2.1 Meshy vs Blender Decision Matrix

| Vraag | → Blender | → Meshy |
|-------|-----------|---------|
| Is het geometrisch/parametrisch? | Ja → Blender | |
| Heeft het organische vormen? | | Ja → Meshy |
| Moet het visueel uniek zijn op close-up? | | Ja → Meshy |
| Worden er 5+ varianten van nodig? | Ja → Blender | |
| Heeft het dierlijke vormen? | | Ja → Meshy |
| Is het een hero/boss character? | | Ja → Meshy |
| Is het een simpele humanoid op RTS-afstand? | Ja → Blender | |
| Is het een gebouw of prop? | Ja → Blender | |

### 7.2.2 Blender 5.1 API Notities

- **Animatie**: `pbone.keyframe_insert()` i.p.v. `action.fcurves` (Blender 5.x layered actions)
- **GLB export**: `bpy.ops.export_scene.gltf()` met Draco compressie beschikbaar
- **Rigify**: Moet expliciet enabled: `bpy.ops.preferences.addon_enable(module='rigify')`
- **Texture baking**: `render.engine = 'CYCLES'`, GPU via Metal
- **Geometry Nodes**: `Realize Instances` node VERPLICHT voor GLB export

### 7.3 2D Assets — fal.ai + Nano Banana

| Asset Type | Aantal | Tool | Geschatte kosten |
|-----------|--------|------|-----------------|
| Unit portraits (per unit) | ~30 | Nano Banana (free tier) | $0 |
| Ability icons | ~40 | Nano Banana (free tier) | $0 |
| Building icons | ~20 | fal.ai Flux Dev | ~$0.50 |
| Terrain textures (tileable) | ~8 | fal.ai Flux Pro | ~$0.45 |
| UI elements | ~15 | fal.ai Flux Dev | ~$0.40 |
| Faction splash art | 4 | fal.ai Flux Pro | ~$0.25 |
| Loading screens | 2 | fal.ai Flux Pro | ~$0.15 |
| OG image | 1 | fal.ai Flux Pro | ~$0.10 |
| **TOTAAL** | **~120** | | **~$2** |

*Nano Banana free tier: 50 images/dag = ~1500/maand. Meer dan genoeg voor alle portraits en icons.*

### 7.4 Audio — ElevenLabs + Suno (bestaande abonnementen)

**Voice Lines (ElevenLabs)**:

| Factie | Voice style | Lijnen per unit | Units | Totaal lijnen |
|--------|-----------|-----------------|-------|--------------|
| Brabanders | Brabants dialect, warm | 6 (select x2, move x2, attack x2) | 10 | 60 |
| Randstad | ABN, corporate | 6 | 10 | 60 |
| Limburgers | Limburgs dialect | 6 | 8 | 48 |
| Belgen | Vlaams accent | 6 | 8 | 48 |
| **TOTAAL** | | | | **216 lijnen** |

**Voice Pipeline: Zelf Inspreken + AI Cloning**

1. **Richard spreekt de basis voice lines ZELF in** — echt Brabants dialect, geen AI kan dat
2. **ElevenLabs Professional Voice Clone** van Richards stem
3. **4 factie-variaties** van die clone: warm Brabants, corporate ABN, Limburgs, Vlaams
4. **Genereer 216 voice lines** met consistente stemmen

*Waarom zelf inspreken? Omdat "Hedde al gegeten?" alleen goed klinkt als het ECHT is.*

**SFX (ElevenLabs)**:

| Categorie | Aantal |
|-----------|--------|
| Combat (sword, impact, projectile) | 10 |
| Building (construct, complete, destroy) | 6 |
| UI (click, select, error, notification) | 8 |
| Ambient (birds, wind, crowd) | 5 |
| Abilities (confetti, vlaai splash, vergadering) | 12 |
| **TOTAAL** | **~41 SFX** |

**Muziek (Suno)**:

| Track | Stijl | Gebruik |
|-------|-------|--------|
| Main Menu Theme | Episch, orkestaal, Brabantse melodie | Menu |
| Brabanders Theme | Warm, volksmuziek, accordeon, gezellig | Brabanders gameplay |
| Randstad Theme | Corporate synth, strak, stressvol | Randstad gameplay |
| Limburgers Theme | Mysterieus, echoënd, mijnwerkerslied | Limburg gameplay |
| Belgen Theme | Vrolijk, accordeon, musette | Belgen gameplay |
| Battle Intensity Low | Spanning opbouwend | Combat (klein) |
| Battle Intensity High | Vol orkest, drums, urgentie | Combat (groot) |
| Victory Fanfare | Triomfantelijk, Brabants | Win screen |
| Defeat Theme | Melancholisch | Lose screen |
| Campaign Cutscene | Verhalend, cinematisch | Cutscenes |
| **TOTAAL** | **10 tracks** | |

*Richard genereert muziek handmatig via Suno.*

---

## 8. UI/UX Design

### 8.1 HUD Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Resources]  Worstenbroodjes: 450  |  Bier: 230  |  Pop: 45/60  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                     GAME WORLD                              │
│                                                             │
│                                                             │
│                                             ┌─────────┐    │
│                                             │ MINIMAP │    │
│                                             │         │    │
│                                             └─────────┘    │
├─────────────────────────────────────────────────────────────┤
│ [Portrait] │ Unit Name    │ [Ability 1] [Ability 2] [Ability 3] │
│  [Icon]    │ HP: ████░ 80 │ [Q]         [W]         [E]         │
│            │ ATK: 10  ARM: 1 │                                  │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Kleurenschema per Factie

| Factie | Primary | Secondary | Accent | Player color |
|--------|---------|-----------|--------|-------------|
| Brabanders | #E67E22 (oranje) | #8B4513 (bruin) | #2ECC71 (groen) | Oranje |
| Randstad | #3498DB (blauw) | #95A5A6 (grijs) | #ECF0F1 (wit) | Blauw |
| Limburgers | #27AE60 (groen) | #7F8C8D (steengrijs) | #2C3E50 (donkerblauw) | Groen |
| Belgen | #E74C3C (rood) | #F1C40F (geel) | #2C3E50 (zwart) | Rood |

### 8.3 Menu Flow

```
Main Menu
├── Skirmish
│   ├── Map Select
│   ├── Faction Select
│   ├── AI Difficulty (Easy/Medium/Hard)
│   └── Start Game
├── Campaign
│   ├── Faction Select
│   └── Mission Select (unlocked progressief)
├── Settings
│   ├── Audio (Master/Music/SFX/Voice)
│   ├── Graphics (Quality preset)
│   └── Controls (Keybindings)
├── Credits
└── How to Play (interactive tutorial)
```

---

## 9. AI System

### 9.1 Unit AI (Finite State Machine)

Elke unit heeft een FSM met deze states:

```
IDLE → MOVE_TO → ATTACK → GATHER → RETURN_RESOURCE → BUILD
  ↑      ↑         ↑       ↑           ↑               ↑
  └──────┴─────────┴───────┴───────────┴───────────────┘
                    (any state can transition to DEATH)
```

**State details:**

| State | Trigger | Gedrag |
|-------|---------|--------|
| IDLE | Geen commando | Staat stil, zoekt vijanden in sight range |
| MOVE_TO | Rechts-klik op terrein | Pathfinding naar target positie |
| ATTACK | Rechts-klik op vijand / auto-detect | Beweeg naar target, val aan wanneer in range |
| GATHER | Rechts-klik op resource (worker) | Beweeg naar resource, verzamel, return |
| RETURN_RESOURCE | Worker draagt max | Breng resources naar dichtsbijzijnde Town Hall |
| BUILD | Rechts-klik op ghost building (worker) | Beweeg naar bouwplaats, bouw op |
| DEATH | HP = 0 | Death animatie, verwijder na 3 seconden |

**Auto-attack**: Units in IDLE/HOLD die een vijand in sight range detecteren, schakelen automatisch naar ATTACK state (tenzij HOLD position).

### 9.2 Strategic AI (Computer Opponent)

**3 difficulty levels:**

| Aspect | Easy | Medium | Hard |
|--------|------|--------|------|
| Build order | Random | Vaste strategie | Optimaal |
| Scouting | Geen | Sporadisch | Continu |
| Reaction to attacks | Verdedigt pas laat | Verdedigt normaal | Verdedigt + counterattack |
| Army composition | Random units | Basisstrategie | Counter-bouwt |
| Resource management | Inefficient | Normaal | Optimaal |
| Timing eerste aanval | 8-10 min | 5-7 min | 3-5 min (rush) |
| Cheat bonussen | Geen | Geen | +20% gather speed |
| Tech progression | Traag | Normaal | Snel |

**AI Architecture:**
1. **Economic Manager**: Bepaalt worker count, resource balans, expansion timing
2. **Military Manager**: Bepaalt army composition, attack timing, rally points
3. **Threat Assessor**: Evalueert vijandelijke kracht, bepaalt defensieve reacties
4. **Build Order Script**: Vaste sequentie voor eerste 3 minuten, daarna dynamisch

---

## 10. Development Phases

### Phase 1: Core Engine (2 weken)

**Goal**: Camera, terrein, unit selectie, movement — alles met gekleurde dozen, geen assets.

| Task | Geschat | Dependency |
|------|---------|-----------|
| Project setup (Vite + TS + Three.js) | 2u | — |
| RTS Camera (pan, zoom, edge scroll) | 4u | — |
| Terrain (heightmap + simplex noise) | 4u | — |
| Minimap (canvas 2D overlay) | 4u | Camera |
| Unit rendering (InstancedMesh, colored boxes) | 4u | — |
| Unit selection (click, box select, groups) | 6u | Unit rendering |
| Right-click commands (move, attack) | 4u | Selection |
| Pathfinding (recast-navigation-js) | 8u | Terrain |
| Fog of War (visibility texture) | 6u | Minimap, Units |
| HUD (HTML/CSS, resource display) | 4u | — |

### Phase 2: Economy + Building (1 week)

| Task | Geschat | Dependency |
|------|---------|-----------|
| Resource system (gather, carry, return) | 6u | Pathfinding |
| Building placement (ghost + build) | 6u | Terrain |
| Building production (train units) | 4u | Buildings |
| Population cap | 2u | Buildings |
| Tech tree / upgrades | 6u | Buildings |
| Worker AI (auto-gather, auto-build) | 4u | Resources |

### Phase 3: Combat (1 week)

| Task | Geschat | Dependency |
|------|---------|-----------|
| Damage system (armor types, modifiers) | 4u | Units |
| Health bars (3D billboards) | 3u | Units |
| Projectile system (travel, hit, miss) | 6u | Combat |
| Death + corpse system | 2u | Combat |
| Abilities system (cooldown, effects, AoE) | 8u | Combat |
| Hero system (unique units, revive) | 4u | Combat |

### Phase 4: AI (1-2 weken)

| Task | Geschat | Dependency |
|------|---------|-----------|
| Unit FSM (idle, move, attack, gather, build) | 6u | All core |
| Auto-attack / aggro range | 3u | FSM |
| Strategic AI — Economic Manager | 6u | Economy |
| Strategic AI — Military Manager | 6u | Combat |
| Strategic AI — Build Orders | 4u | Buildings |
| AI difficulty levels (easy/medium/hard) | 4u | Strategic AI |
| Formation movement (spread on arrival) | 4u | Pathfinding |

### Phase 5: Faction Implementation (1 week)

| Task | Geschat | Dependency |
|------|---------|-----------|
| Brabanders — all units, buildings, stats | 6u | All systems |
| Randstad — all units, buildings, stats | 6u | All systems |
| Brabanders — Gezelligheid mechanic | 4u | Faction system |
| Randstad — Bureaucratie mechanic | 4u | Faction system |
| Faction abilities (Carnavalsrage, Vergadering) | 4u | Abilities |
| Faction-specific upgrades | 3u | Tech tree |

### Phase 6: Assets + Audio (1 week)

| Task | Geschat | Dependency |
|------|---------|-----------|
| Blender: Brabanders gebouwen (10) | 4u | — |
| Blender: Randstad gebouwen (8) | 4u | — |
| Blender: Props (bomen, rotsen, etc.) | 3u | — |
| Blender: Basis units (8, rigged) | 8u | — |
| Meshy: Hero units (4) | 2u | — |
| Meshy: Speciale units (4) | 2u | — |
| fal.ai/Nano Banana: portraits, icons | 2u | — |
| ElevenLabs: Voice lines (120+) | 3u | — |
| ElevenLabs: SFX (41) | 2u | — |
| Suno: Richard maakt 10 tracks | — | Parallel |
| Asset integration + testing | 4u | All assets |

### Phase 7: Polish + Balancing (1-2 weken)

| Task | Geschat | Dependency |
|------|---------|-----------|
| Balance pass (unit stats tuning) | 8u | Playtesting |
| UI polish (animations, transitions) | 6u | HUD |
| Audio integration + mixing | 4u | All audio |
| Loading screen + main menu | 4u | — |
| Tutorial / How to Play | 6u | All systems |
| Performance optimization | 6u | All systems |
| Mobile touch controls (basic) | 4u | Input system |
| Deployment to theuws.com/games/reign-of-brabant/ | 2u | Build |

---

## 11. Budget Overzicht (Herzien)

### Asset Kosten

| Tool | Items | Kosten | Notes |
|------|-------|--------|-------|
| Blender procedureel | ~127 modellen | **$0** | <60s generatietijd, alleen CPU |
| Meshy v6 | ~28 modellen | **$14-20** | 1 maand Max plan ($48) met credits over |
| fal.ai | ~30 images | **$2** | Pay-per-use |
| Nano Banana | ~90 images | **$0** | Free tier (50/dag) |
| ElevenLabs | 216 voice lines + 41 SFX | **$0** | Bestaand abonnement |
| Suno | 10 tracks | **$0** | Bestaand abonnement (Richard maakt) |
| **TOTAAL** | | **~$16-22** | |

*Meshy Max abonnement ($48/maand) is 1 maand nodig. Credits zijn ruim voldoende voor 28 modellen (28 × 30 credits = 840 van de 4000 beschikbare).*

### Vergelijking met eerdere schatting

| | Eerste schatting (alleen Meshy) | Met Blender hybrid | Besparing |
|---|---|---|---|
| 3D modellen | $230 (107 Meshy + 3 mnd sub) | $48 (1 mnd Max) + $0 (Blender) | **$182 (79%)** |
| 2D images | $11 | $2 (Nano Banana free tier) | **$9** |
| Audio | $32 (sub kosten) | $0 (bestaande abonnementen) | **$32** |
| **TOTAAL** | **$273** | **~$50** | **~$223 bespaard (82%)** |

---

## 12. Cheat Codes (Singleplayer)

| Code | Effect |
|------|--------|
| WANSEN | +10.000 Worstenbroodjes/PowerPoints |
| ANSEN DE PANSEN | Alle units max upgrades |
| HERTANSEN JAN | Oneindig Bier/LinkedIn |
| GUUANSEN MANSEN | Alle muziek wordt Guus Meeuwis |
| VLAAI STORM | Random vlaaien vallen uit de lucht (damage aan iedereen) |
| VERGANSEN DERING | Alle vijandelijke units stoppen permanent |
| SPROOKANSEN BOS | Unlock geheime Efteling-factie |
| FRANSEN BANSEN | Fog of War uit |
| KANSEN PAKANSEN | Alle abilities geen cooldown |

---

## 13. Success Criteria

### MVP (v0.1) is geslaagd als:

- [ ] 2 speelbare facties (Brabanders, Randstad) met unieke mechanics
- [ ] Werkend skirmish vs AI op 1 map
- [ ] Alle core systems functioneel (resources, bouwen, combat, pathfinding, fog of war)
- [ ] 60 FPS op desktop, 30 FPS op mobile
- [ ] Basis audio (SFX, muziek, voice lines)
- [ ] Speelbaar en FUN — een potje duurt 15-25 minuten

### v1.0 is geslaagd als:

- [ ] 3 facties (+ Limburgers)
- [ ] 3 maps
- [ ] 5-missie campaign
- [ ] AI op 3 moeilijkheidsniveaus
- [ ] Gebalanceerd (geen factie > 60% winrate vs AI)

---

*PRD opgesteld door Game Master (Claude)*
*Wacht op goedkeuring voor implementatie*
