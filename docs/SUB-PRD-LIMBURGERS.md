# Sub-PRD: Limburgers Factie

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
5. [Underground Netwerk Mechanic](#5-underground-netwerk-mechanic)
6. [Voice Lines](#6-voice-lines)

---

## 1. Factie Overzicht

### 1.1 Identiteit

| Eigenschap | Waarde |
|-----------|--------|
| **Factienaam** | Limburgers — "De Mijnwerkers" |
| **Thema** | Mysterie, diepte, veerkracht, zachte kracht |
| **Sterkte** | Underground tunnel-netwerk, hit-and-run tactics, sterke verdediging |
| **Zwakte** | Langzame economie, dure units |
| **Playstyle** | Hit-and-run, guerrilla warfare, fortress met tunnels |
| **Kleurenpalet** | Grijs, donkergroen, steenkleur, blauw |
| **Setting** | Heuvelland, mijnbouw-verleden, carnaval (Vastelaovend), mysterie |

### 1.2 Resources

| Type | Naam | Equivalent | Verzameld van |
|------|------|-----------|---------------|
| **Primair** (Gold) | Vlaai | Worstenbroodjes / PowerPoints | Resource nodes op de map |
| **Secundair** (Lumber) | Mergel | Bier / LinkedIn Connections | Bomen / mergelgroeves op de map |
| **Tertiair** | Kolen | Gezelligheid / Havermoutmelk | Mijnschacht-gebouw (passief) |

### 1.3 Dialect Richtlijnen

- **Toon**: Zacht, mysterieus, kort en krachtig
- **Kernwoorden**: "Gluck auf", "sjoen", "hej", "jao", "waat", "ich", "neet", "dich", "alles good", "joonk"
- **Kenmerken**: Zachte g, meer melodisch dan Brabants, kortere zinnen, ondertoon van iets duisters/mysterieus
- **Verboden**: GEEN -ansen suffix (dat is Brabanders), GEEN ABN

### 1.4 Factie-Ability: Vloedgolf van Vlaai

| Eigenschap | Waarde |
|-----------|--------|
| **Kosten** | 100 Kolen |
| **Target** | Gekozen gebied, radius 15 |
| **Vijandelijk effect** | -50% speed, -25% attack, 20 seconden |
| **Terrein effect** | "Plakkerig" speed debuff zone, 30 seconden |
| **Eigen effect** | Limburgse units: +25% attack |
| **Cooldown** | 180 seconden |
| **Visueel** | Golf van vlaai-substantie overspoelt het terrein, plakkerige roze/oranje residue |

---

## 2. Units

### 2.1 Mijnwerker (Worker)

**Beschrijving**: Stoere, stille kerels met een pikhouweel over de schouder en een helm met lamp. Ze graven, bouwen en zwijgen — tenzij je ze aanspreekt. Dan krijg je een kort, zacht antwoord en gaan ze weer door. De ruggengraat van Limburg: betrouwbaar, onverwoestbaar, onopvallend.

**Persoonlijkheid**: Nuchter, zwijgzaam, hardwerkend. Klaagt niet, doet gewoon.

| Stat | Waarde |
|------|--------|
| HP | 65 |
| Attack | 7 |
| Attack Speed | 1.5s |
| DPS | 4.7 |
| Armor | 1 |
| Armor Type | Light |
| Speed | 4.5 |
| Range | 0 (melee) |
| Build Time | 16s |
| Cost | 55/0 |
| Population | 1 |
| Carry Capacity | 10 |

- **Wapen**: Pikhouweel
- **Passief — Stevig Gebouwd**: +1 Armor base (al inbegrepen in stats). Sterkste worker in het spel.
- **Ability — Noodschacht**: Graaft een tijdelijke schuilplaats. Mijnwerker wordt 8 seconden onzichtbaar en onkwetsbaar, maar kan niks doen. Cooldown: 60s.

---

### 2.2 Schutterij (Infantry — Ranged)

**Beschrijving**: Limburgse schuttersgilden met hun vaandels en geweren. Ze marcheren in formatie, schieten precies, en zwaaien trots met het vaandel als ze winnen. Een mix van traditie en dodelijke precisie.

**Persoonlijkheid**: Trots, formeel, gedisciplineerd. Spreken in korte, scherpe commando's.

| Stat | Waarde |
|------|--------|
| HP | 70 |
| Attack | 14 |
| Attack Speed | 1.8s |
| DPS | 7.8 |
| Armor | 1 |
| Armor Type | Medium |
| Speed | 4.5 |
| Range | 9 |
| Build Time | 22s |
| Cost | 85/35 |
| Population | 1 |

- **Wapen**: Schuttersgeweer (ranged projectile)
- **Ability — Vaandelzwaaien**: Buff voor alle Schutterij in radius 6: +20% attack speed, 10 seconden. Cooldown: 30s.
- **Passief — Formatieschot**: Wanneer 3+ Schutterij naast elkaar staan, +15% accuracy bonus.

---

### 2.3 Vlaaienwerper (Ranged / Specialist)

**Beschrijving**: Excentrieke bakers die hun mislukte vlaaien als wapens gebruiken. Elke vlaai is gevuld met iets anders — soms kersen, soms iets dat je liever niet wilt weten. Ze zijn de clowns van het leger, maar onderschat ze niet.

**Persoonlijkheid**: Vrolijk, chaotisch, een tikje gestoord. De carnavalsgek van de factie.

| Stat | Waarde |
|------|--------|
| HP | 50 |
| Attack | 10 |
| Attack Speed | 1.6s |
| DPS | 6.3 |
| Armor | 0 |
| Armor Type | Light |
| Speed | 5.0 |
| Range | 8 |
| Build Time | 18s |
| Cost | 65/45 |
| Population | 1 |

- **Wapen**: Vlaaien (ranged, thrown, AoE splash radius 2)
- **Ability — Zoete Wraak**: Geraakte vijanden krijgen "Zoet" debuff: -20% speed + -10% attack, 8 seconden. Stapelbaar tot 2x.
- **Ability — Kersenexplosie**: Volgende worp explodeert bij impact. +50% damage, splash radius 4. Cooldown: 20s.

---

### 2.4 Mergelridder (Heavy / Cavalry)

**Beschrijving**: Geharnast in mergelsteen-pantser, massief en onverzettelijk als de heuvels zelf. Ze bewegen langzaam maar zijn bijna niet te stoppen. Wanneer ze uitvallen vanuit een tunnel, schrikt elke vijand.

**Persoonlijkheid**: Stoicijns, weinig woorden, diep respect voor de grond onder hun voeten.

| Stat | Waarde |
|------|--------|
| HP | 250 |
| Attack | 20 |
| Attack Speed | 2.0s |
| DPS | 10 |
| Armor | 5 |
| Armor Type | Heavy |
| Speed | 3.0 |
| Range | 0 (melee) |
| Build Time | 35s |
| Cost | 175/125 |
| Population | 2 |

- **Wapen**: Mergelhamer (zware melee)
- **Ability — Steenhuid**: Mergelridder wordt 5 seconden immuun voor alle schade. Kan niet aanvallen tijdens Steenhuid. Cooldown: 40s.
- **Passief — Heuvelvoordeel**: +20% armor wanneer staand op heuvel-terrein.

---

### 2.5 Kolenbrander (Siege) [Tier 3]

**Beschrijving**: Een sinistere figuur die een antieke mijnkar vol gloeiende kolen voortduwt. De kar heeft een catapultmechanisme dat brandende kolenbrokken de lucht in slingert. Gebouwen branden, muren scheuren, en de Kolenbrander grijnst.

**Persoonlijkheid**: Duister, zacht pratend, een beetje pyromaan. Geniet te veel van zijn werk.

| Stat | Waarde |
|------|--------|
| HP | 95 |
| Attack | 12 (units) / 48 (buildings) |
| Attack Speed | 3.0s |
| DPS | 4 (units) / 16 (buildings) |
| Armor | 1 |
| Armor Type | Medium |
| Speed | 3.5 |
| Range | 10 |
| Splash Radius | 3 |
| Build Time | 40s |
| Cost | 200/150 |
| Population | 3 |

- **Wapen**: Gloeiende kolen (ranged, AoE, brandschade)
- **Ability — Mijngas**: Laat een gifwolk achter op targetlocatie. 8 DPS voor 10 seconden, radius 4. Cooldown: 35s.
- **Passief — Brandstichter**: Gebouwen geraakt door Kolenbrander branden 3 seconden door na elke hit (3 DPS extra).

---

### 2.6 Sjpion (Support / Healer)

**Beschrijving**: Een zachte, bijna fluisterende figuur in een lange mantel. Niemand weet precies waar de Sjpion vandaan komt of naartoe gaat. Ze duiken op wanneer je ze het minst verwacht, lappen je wonden, en verdwijnen weer. Half arts, half geest.

**Persoonlijkheid**: Mysterieus, fluisterend, zorgzaam maar op afstand. Spreekt in raadsels.

| Stat | Waarde |
|------|--------|
| HP | 55 |
| Attack | 6 (melee, wandelstok) |
| Attack Speed | 1.5s |
| Heal | 14 HP per cast |
| Heal Speed | 2.0s |
| DPS | 4 (attack) / 7 HP/s (heal) |
| Armor | 0 |
| Armor Type | Light |
| Speed | 5.0 |
| Range | 7 (heal range) |
| Build Time | 25s |
| Cost | 85/65 |
| Population | 1 |

- **Auto-heal**: Target automatisch de meest beschadigde ally in range
- **Ability — Mergelzalf**: AoE heal (20 HP) + removes debuffs van allies in radius 6. Cooldown: 30s.
- **Ability — Grotherstel**: Wanneer naast een Grot (tunnel-gebouw): heal rate verdubbeld.

---

### 2.7 Mijnrat (Special — Stealth/Sabotage) [Tier 3]

**Beschrijving**: Kleine, snelle saboteurs die door de tunnels kruipen als ratten. Ze planten mijnen, saboteren gebouwen en verdwijnen voor je ze ziet. De nachtmerrie van elke basis-bouwer.

**Persoonlijkheid**: Schichtig, giechelig, sadistisch. Vindt het hilarisch om dingen op te blazen.

| Stat | Waarde |
|------|--------|
| HP | 30 |
| Attack | 4 |
| Attack Speed | 1.2s |
| DPS | 3.3 |
| Armor | 0 |
| Armor Type | Light |
| Speed | 6.0 |
| Range | 0 (melee) |
| Build Time | 20s |
| Cost | 50/40 |
| Population | 1 |

- **Wapen**: Dolkje (melee, zwak)
- **Passief — Underground Movement**: Kan zich verplaatsen via het tunnel-netwerk. Onzichtbaar tijdens underground travel.
- **Ability — Kolenmijn Plaatsen**: Plant een onzichtbare mijn op een locatie. Explodeert bij vijandelijke unit (40 damage, radius 3). Max 3 actieve mijnen. Cooldown: 15s per mijn.
- **Ability — Sabotage**: Target vijandelijk gebouw: -50% productie, 20 seconden. Moet melee-range zijn. Cooldown: 45s.

---

### 2.8 Heuvelansen (Scout) [Tier 1]

**Beschrijving**: Lenige berggeiten van kerels die over de Limburgse heuvels rennen alsof het vlak terrein is. Ze kennen elk pad, elke grot, elk geheim van het heuvelland. Snel, licht, en altijd een stap voor.

**Persoonlijkheid**: Energiek, speels, een beetje wild. De jongste van het leger.

| Stat | Waarde |
|------|--------|
| HP | 35 |
| Attack | 5 |
| Attack Speed | 1.5s |
| DPS | 3.3 |
| Armor | 0 |
| Armor Type | Light |
| Speed | 8.0 |
| Sight Range | 14 |
| Range | 4 (ranged, slingshot) |
| Build Time | 12s |
| Cost | 40/20 |
| Population | 1 |

- **Wapen**: Slinger (ranged, kort bereik)
- **Passief — Heuvelkind**: +50% speed op heuvel-terrein. Geen speed penalty op moeilijk terrein.
- **Ability — Mergelstof**: Gooit een wolk mergelstof. Radius 4, vijanden verliezen sight range 50% voor 8 seconden. Cooldown: 25s.

---

### 2.9 Hero: De Mijnbaas (Tank / Controller) [Tier 2]

**Beschrijving**: De patriarch van de mijnen. Een kolossale figuur met een kolenbestoft gezicht en ogen die gloeien in het donker. Hij heeft de tunnels gebouwd, hij kent elk gangpad, en hij heerst over het ondergrondse rijk met een ijzeren maar rechtvaardige hand. Zijn stem galmt door de schachten als een ondergrondse donder.

**Persoonlijkheid**: Autoritair, vaderlijk, diep. Spreekt langzaam en met gewicht. Elk woord telt.

| Stat | Waarde |
|------|--------|
| HP | 550 |
| Attack | 22 |
| Attack Speed | 1.8s |
| DPS | 12.2 |
| Armor | 6 |
| Armor Type | Heavy |
| Speed | 4.0 |
| Range | 0 (melee) |
| Build Time | 50s |
| Cost | 400/250 |
| Population | 5 |

- **Wapen**: Mijnhamer (zware melee)
- **Ability 1 — Mijnschacht Instorten**: AoE stun radius 8. Alle units (vriend en vijand) in het gebied worden 4 seconden gestund door instortende rotsen. 25 damage. Cooldown: 45s.
- **Ability 2 — Gluck Auf**: Buff alle Limburgse units in radius 12: +25% attack, +15% armor, 15 seconden. Cooldown: 60s.
- **Ability 3 — Tunnelcommando**: Teleporteer de Mijnbaas + maximaal 8 units in radius 6 naar een willekeurige Grot. Cooldown: 90s. Vereist minstens 1 Grot.
- **Ultimate — Aardbeving**: Hele map schudt. Alle vijandelijke gebouwen nemen 50 damage. Alle vijandelijke units -30% speed, 10 seconden. Kost 50 Kolen. Cooldown: 180s.

---

### 2.10 Hero: De Maasridder (Caster / Disruptor) [Tier 2]

**Beschrijving**: Een mysterieuze ridder in watergroen wapenrusting die de kracht van de Maas zelf lijkt te beheersen. Half legende, half werkelijkheid. De Maasridder verschijnt wanneer Limburg het meest in nood is, en verdwijnt net zo snel. Zijn aanvallen golven als water — onvoorspelbaar en onontkombaar.

**Persoonlijkheid**: Mysterieus, poëtisch, kalm als het water voor de storm. Spreekt in metaforen.

| Stat | Waarde |
|------|--------|
| HP | 300 |
| Attack | 12 |
| Attack Speed | 2.0s |
| DPS | 6 |
| Armor | 3 |
| Armor Type | Medium |
| Speed | 5.0 |
| Range | 10 |
| Build Time | 45s |
| Cost | 350/300 |
| Population | 5 |

- **Wapen**: Maaswater-straal (ranged magic)
- **Ability 1 — Maasvloed**: Line AoE (breedte 4, lengte 20). Duwt alle vijandelijke units terug + 30 damage. Cooldown: 30s.
- **Ability 2 — Nevelgordijn**: Creëert fog in radius 10 voor 15 seconden. Vijandelijke units verliezen sight range volledig. Limburgse units in de fog: +20% speed. Cooldown: 45s.
- **Ability 3 — Watergraf**: Target locatie wordt onbegaanbaar terrein (water) voor 12 seconden. Radius 5. Cooldown: 60s.
- **Ultimate — Watersnood**: Massief AoE (radius 20). Alle vijandelijke units nemen 40 damage + worden 6 seconden vertraagd (-60% speed). Terrein wordt moeilijk begaanbaar 20 seconden. Kost 50 Kolen. Cooldown: 180s.

---

## 3. Buildings

### 3.1 Gebouwen Overzicht

| # | Gebouw | Type | Produceert/Functie | Kosten (V/M) | Bouwtijd | HP | Tier |
|---|--------|------|--------------------|--------------|---------|-----|------|
| 1 | **Mergelhoeve** | Town Hall | Mijnwerkers | Start | — | 1600 | 1 |
| 2 | **Schuttershal** | Barracks | Schutterij, Vlaaienwerper, Heuvelansen | 225/0 | 32s | 850 | 1 |
| 3 | **Vlaaibakkerij** | Resource gen | +3 Vlaai/10s | 150/50 | 25s | 600 | 1 |
| 4 | **Mergelgroeve** | Resource gen | +2 Mergel/10s | 100/100 | 25s | 600 | 1 |
| 5 | **Mijnschacht** | Tertiair resource + Tunnel | +2 Kolen/10s + fungeert als Grot | 200/150 | 40s | 750 | 1 |
| 6 | **Grot** | Tunnel endpoint | Tunnelverbinding (max 4 totaal) | 150/100 | 30s | 500 | 1 |
| 7 | **Klooster** | Tech/Upgrade | Upgrades, Tier 2 unlock | 275/175 | 45s | 800 | 2 |
| 8 | **Wachttoren** | Defense tower | Scherpschutter (ranged dmg) | 200/200 | 35s | 900 | 1 |
| 9 | **Mijnwerkerskamp** | Advanced unit | Mergelridder, Kolenbrander, Mijnrat | 325/225 | 48s | 850 | 2 |
| 10 | **Huuske** | Housing | +8 population | 100/50 | 20s | 500 | 1 |

### 3.2 Gebouw Details

#### Mergelhoeve (Town Hall)

De centrale basis van de Limburgers. Gebouwd van massief mergelsteen met een kenmerkend blauw dak. De ingang is laag en breed — alles in Limburg is gebouwd om stand te houden.

| Eigenschap | Waarde |
|-----------|--------|
| HP | 1600 |
| Armor | 5 |
| Sight Range | 12 |
| Population | +10 (startbonus) |
| Produceert | Mijnwerkers |
| Garnizoensplaatsen | 10 units (schieten vanuit het gebouw) |

**Upgrades:**
- Mergelhoeve (Tier 1) → **Kasteelhoeve** (Tier 2): +400 HP, +15 garrison capacity, +2 sight range. Kosten: 300/200. Bouwtijd: 60s.
- Kasteelhoeve (Tier 2) → **Vesting van Valkenburg** (Tier 3): +500 HP, garrison units krijgen +3 attack, +3 sight range. Kosten: 500/400. Bouwtijd: 80s.

---

#### Schuttershal (Barracks)

Een lang, laag stenen gebouw waar de gildeleden trainen. Vaandels hangen aan de muren.

| Eigenschap | Waarde |
|-----------|--------|
| HP | 850 |
| Armor | 2 |
| Produceert | Schutterij (Tier 1), Vlaaienwerper (Tier 1), Heuvelansen (Tier 1) |

---

#### Vlaaibakkerij (Resource Generator — Primair)

Een warme bakkerij waar de vlaai nooit ophoudt. Rook kringelt uit de schoorsteen.

| Eigenschap | Waarde |
|-----------|--------|
| HP | 600 |
| Armor | 1 |
| Generatie | +3 Vlaai per 10 seconden |
| Max gebouwen | 3 |

---

#### Mergelgroeve (Resource Generator — Secundair)

Een open groeve waar blokken mergel worden uitgehakt.

| Eigenschap | Waarde |
|-----------|--------|
| HP | 600 |
| Armor | 1 |
| Generatie | +2 Mergel per 10 seconden |
| Max gebouwen | 3 |

---

#### Mijnschacht (Tertiair Resource + Tunnel)

De kern van de Limburger economie en strategie. Produceert Kolen EN fungeert als een Grot-endpoint voor het tunnel-netwerk. Twee Mijnschachten verbinden zich automatisch via tunnels.

| Eigenschap | Waarde |
|-----------|--------|
| HP | 750 |
| Armor | 3 |
| Generatie | +2 Kolen per 10 seconden |
| Tunnel | Telt als Grot voor ondergronds netwerk |
| Max gebouwen | 4 (gecombineerd met Grotten, max 4 tunnel-endpoints totaal) |

---

#### Grot (Tunnel Endpoint)

Een natuurlijke grotopening die als doorgang dient naar het tunnel-netwerk. Goedkoper dan een Mijnschacht, maar produceert geen Kolen.

| Eigenschap | Waarde |
|-----------|--------|
| HP | 500 |
| Armor | 2 |
| Tunnel | Verbindt automatisch met alle andere Grotten en Mijnschachten |
| Max gebouwen | 4 (gecombineerd met Mijnschachten, max 4 tunnel-endpoints totaal) |
| Onzichtbaar | Vijanden zien Grotten NIET tenzij ze binnen sight range 4 zijn |

---

#### Klooster (Tech / Upgrade Gebouw)

Een somber, oud klooster waar de monniken van Limburg de geheimen van de mijn bestuderen. Hier worden upgrades onderzocht.

| Eigenschap | Waarde |
|-----------|--------|
| HP | 800 |
| Armor | 2 |
| Functie | Tier 2 unlock bij voltooiing. Onderzoekt upgrades. |

---

#### Wachttoren (Defense Tower)

Een hoge mergelstenen toren met een scherpschutter bovenin.

| Eigenschap | Waarde |
|-----------|--------|
| HP | 900 |
| Armor | 4 |
| Attack | 15 |
| Attack Speed | 2.0s |
| Range | 10 |
| Sight Range | 12 |

---

#### Mijnwerkerskamp (Advanced Barracks)

Een zwaar versterkt kamp bij de mijn-ingang. Hier worden de elite-eenheden getraind.

| Eigenschap | Waarde |
|-----------|--------|
| HP | 850 |
| Armor | 3 |
| Produceert | Mergelridder (Tier 2), Kolenbrander (Tier 3), Mijnrat (Tier 3) |
| Vereist | Klooster |

---

#### Huuske (Housing)

Klein, knus Limburgs woonhuis. Bescheiden maar stevig.

| Eigenschap | Waarde |
|-----------|--------|
| HP | 500 |
| Armor | 1 |
| Population | +8 |

---

## 4. Tech Tree

### 4.1 Tier Structuur

```
Tier 1 (Start)
├── Mergelhoeve → Mijnwerker
├── Schuttershal → Schutterij, Vlaaienwerper, Heuvelansen
├── Vlaaibakkerij, Mergelgroeve (resource gen)
├── Mijnschacht (Kolen + tunnel)
├── Grot (tunnel endpoint)
├── Wachttoren (defense)
└── Huuske (housing)

    [Bouw Klooster → Tier 2 unlock]
         ↓
Tier 2
├── Klooster → tech upgrades
├── Mijnwerkerskamp → Mergelridder
├── Hero: De Mijnbaas (via Schuttershal)
├── Hero: De Maasridder (via Mijnwerkerskamp)
└── Geavanceerde upgrades beschikbaar

    [Upgrade Mergelhoeve → Kasteelhoeve → Vesting van Valkenburg]
         ↓
Tier 3
├── Kolenbrander beschikbaar (Mijnwerkerskamp)
├── Mijnrat beschikbaar (Mijnwerkerskamp)
├── Factie-ability: Vloedgolf van Vlaai
└── Ultimate tech upgrades
```

### 4.2 Universele Upgrades

| Tier | Upgrade | Effect | Kosten (V/M) | Research Tijd | Gebouw |
|------|---------|--------|--------------|---------------|--------|
| 1 | Scherpere Pikhouwelen I | +2 Attack alle melee | 100/50 | 30s | Klooster |
| 1 | Mergelharnas I | +1 Armor alle units | 100/75 | 30s | Klooster |
| 2 | Scherpere Pikhouwelen II | +2 Attack alle melee | 200/100 | 45s | Klooster |
| 2 | Mergelharnas II | +2 Armor alle units | 200/150 | 45s | Klooster |
| 2 | Snelle Voeten | +15% Speed alle units | 150/100 | 40s | Klooster |
| 3 | Scherpere Pikhouwelen III | +3 Attack alle units | 300/200 | 60s | Klooster |
| 3 | Mergelharnas III | +3 Armor alle units | 300/250 | 60s | Klooster |
| 3 | Factie Mastery | Unlock Vloedgolf van Vlaai | 400/400 | 90s | Klooster |

### 4.3 Factie-specifieke Upgrades

| Tier | Upgrade | Effect | Kosten (V/M/K) | Research Tijd | Gebouw |
|------|---------|--------|----------------|---------------|--------|
| 1 | **Betere Lampen** | Mijnwerkers +20% gather speed | 75/50/0 | 25s | Mijnschacht |
| 1 | **Verstevigde Tunnels** | Grotten +200 HP | 100/75/0 | 30s | Klooster |
| 2 | **Diepe Aders** | Mijnschachten +1 Kolen/10s | 150/100/20 | 40s | Mijnschacht |
| 2 | **Schutterseed** | Schutterij +2 Range | 175/100/0 | 35s | Schuttershal |
| 2 | **Mergelkern** | Mergelridder +50 HP, +1 Armor | 200/150/10 | 45s | Mijnwerkerskamp |
| 2 | **Geheime Gangen** | Tunneltransport is 50% sneller, +1 max Grot (5 totaal) | 200/200/30 | 50s | Klooster |
| 3 | **Kolengas** | Kolenbrander +25% splash radius, Mijngas duur +5s | 250/200/40 | 55s | Mijnwerkerskamp |
| 3 | **Schaduwmijnen** | Mijnrat max actieve mijnen +2 (5 totaal), mijn damage +10 | 200/150/30 | 50s | Mijnwerkerskamp |
| 3 | **Vloed der Diepte** | Vloedgolf van Vlaai: radius +5, duration +10s | 350/300/50 | 70s | Klooster |

### 4.4 Hero Upgrades

| Tier | Upgrade | Effect | Kosten (V/M/K) | Gebouw |
|------|---------|--------|----------------|--------|
| 2 | **Mijnbaas: Diepe Wortels** | Aardbeving damage +25, stun duration +2s | 250/200/30 | Klooster |
| 2 | **Maasridder: Springvloed** | Maasvloed breedte +2, damage +15 | 250/200/30 | Klooster |
| 3 | **Mijnbaas: Koning der Diepte** | Tunnelcommando capacity +4 (12 totaal), Gluck Auf +10% stats | 350/300/50 | Klooster |
| 3 | **Maasridder: Zondvloed** | Watersnood radius +5, damage +20, slow duration +4s | 350/300/50 | Klooster |

---

## 5. Underground Netwerk Mechanic

### 5.1 Kernregels

Het Underground Netwerk is de signatuur-mechanic van de Limburgers. Het stelt ze in staat units onzichtbaar over de map te verplaatsen, verrassingsaanvallen uit te voeren, en een onvoorspelbare dreiging te vormen.

| Regel | Detail |
|-------|--------|
| **Tunnel-endpoints** | Grotten en Mijnschachten fungeren als tunnel-ingangen |
| **Max endpoints** | 4 standaard (5 met Geheime Gangen upgrade) |
| **Verbinding** | Alle endpoints verbinden automatisch met elkaar |
| **Transporttijd** | 3 seconden standaard (1.5s met Geheime Gangen) |
| **Capaciteit** | Max 12 units tegelijk in transit |
| **Zichtbaarheid vijand** | Vijanden zien het netwerk NIET. Grotten zijn onzichtbaar tenzij vijand binnen sight range 4 komt. Mijnschachten zijn zichtbaar (groot gebouw). |
| **Unit types** | Alle ground units. Heroes mogen ook. Siege units NIET. |
| **Kolen-onderhoud** | Elke Grot kost 1 Kolen/30s onderhoud. Bij 0 Kolen: tunnels sluiten tot er weer Kolen zijn. |

### 5.2 Gameplay Flow

1. **Bouw Mijnschacht** (basis-tunnel + Kolen productie)
2. **Bouw Grot** op strategische locatie (dichtbij vijandelijke basis, resource nodes, of heuvel)
3. **Selecteer units** → rechts-klik op Grot → units lopen naar dichtstbijzijnde tunnel-ingang
4. **3 seconden transit** → units verschijnen bij gekozen Grot
5. **Verrassingsaanval** vanuit de Grot

### 5.3 Counters & Balancing

| Counter | Hoe |
|---------|-----|
| **Scouts** | Hoge sight range kan Grotten ontdekken |
| **AoE bij exits** | Splash damage bij bekende Grot-locaties |
| **Grot vernietigen** | Bij vernietiging: alle units in transit naar die Grot spawnen op het oppervlak (kwetsbaar) |
| **Kolen-blokkade** | Vernietig Mijnschachten = geen Kolen = tunnels sluiten |
| **Detection abilities** | Sommige factie-units kunnen stealth detecteren |

### 5.4 Visueel

- **Tunnel-ingang**: Donkere opening in een rotsformatie (Grot) of mijngebouw (Mijnschacht)
- **Transit**: Korte animatie van unit die in de opening verdwijnt / verschijnt
- **Eigen speler**: Ziet dunne, gloeiende lijnen tussen tunnel-endpoints op de minimap
- **Vijand**: Ziet NIETS. Geen lijnen, geen indicators, alleen de units die plotseling verschijnen
- **Bij vernietiging**: Instortingsanimatie + stofwolk

---

## 6. Voice Lines

### 6.0 Richtlijnen

- **Dialect**: Limburgs — zachte klanken, "ich", "dich", "sjoen", "hej", "jao", "waat", "neet", "Gluck auf"
- **Toon**: Zachter en mysterieuzer dan Brabanders, minder luid, meer ondertoon
- **Stijl**: Warcraft-achtig — kort, punchy, memorabel, elk karakter uniek
- **Verboden**: GEEN -ansen suffix, GEEN hard ABN, GEEN lange zinnen

---

### 6.1 Mijnwerker (Worker)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Jao?" | Kort, rustig | 0.4 |
| Select | 2 | "Waat is 't?" | Nuchter | 0.6 |
| Select | 3 | "Ich luister" | Geduldig | 0.6 |
| Move | 1 | "Ich gank al" | Kalm bevestigend | 0.5 |
| Move | 2 | "Is good" | Kort | 0.4 |
| Move | 3 | "Dao gaon ich heen" | Rustig | 0.7 |
| Attack | 1 | "Mot dat echt?" | Onwillig | 0.6 |
| Attack | 2 | "Vooruit dan" | Zuchtend | 0.5 |
| Attack | 3 | "Pikhouweel d'r in!" | Opgehitst | 0.7 |
| Death | 1 | "De mijn... roep mich..." | Zacht stervend | 1.2 |
| Death | 2 | *kreun + vallend gruis* | Instortend | 0.8 |
| Ability | 1 | "Ich graaf mich eruit" | Vastberaden | 0.8 |
| Ability | 2 | "Onder de grond is 't veilig" | Fluisterend | 1.0 |
| Idle | 1 | *tikt pikhouweel tegen steen* | Verveeld werkend | 1.5 |
| Idle | 2 | "Die kolen hakke zich neet vanzelf..." | Ongeduldig | 1.2 |

---

### 6.2 Schutterij (Infantry — Ranged)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Schutterij, paraat!" | Formeel, trots | 0.8 |
| Select | 2 | "Zeg maar waat" | Kort, gedisciplineerd | 0.5 |
| Select | 3 | "Het vaandel wappert" | Trots | 0.7 |
| Move | 1 | "In formatie!" | Commando | 0.5 |
| Move | 2 | "Jao, ich kom" | Gehoorzaam | 0.5 |
| Move | 3 | "Veuruit, mars!" | Energiek | 0.5 |
| Attack | 1 | "Vuur!" | Kort, scherp | 0.3 |
| Attack | 2 | "Limburg sjeet terug!" | Strijdlustig | 0.8 |
| Attack | 3 | "Raak!" | Zelfverzekerd | 0.3 |
| Death | 1 | "Het vaandel... laot 't neet valle..." | Stervend, bezorgd | 1.5 |
| Death | 2 | *schot + val* | Kort, dramatisch | 0.8 |
| Ability | 1 | "Vaandel omhoog! Sjutter eer!" | Inspirerend | 1.0 |
| Ability | 2 | "Veur het gilde!" | Trots | 0.6 |
| Idle | 1 | "Niks te sjete, niks te doen..." | Verveeld | 1.0 |
| Idle | 2 | *poetst geweer + neurieen* | Werkend, rustig | 1.5 |

---

### 6.3 Vlaaienwerper (Ranged / Specialist)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Welke smaak wiltse?" | Vrolijk, vals | 0.7 |
| Select | 2 | "De vlaai is warm!" | Enthousiast | 0.6 |
| Select | 3 | "Hej! Ich bak, ich gooi!" | Chaotisch blij | 0.8 |
| Move | 1 | "Ich kom met vlaai!" | Enthousiast | 0.7 |
| Move | 2 | "Neet morsse!" | Geconcentreerd | 0.5 |
| Move | 3 | "Met de bakplaat op pad" | Nonchalant | 0.7 |
| Attack | 1 | "Vlaai in dien smoel!" | Agressief blij | 0.7 |
| Attack | 2 | "Kersenvlaai SPECIAAL!" | Strijdkreet | 0.8 |
| Attack | 3 | "Ich bak ze bruin!" | Dreigend grijnzend | 0.6 |
| Death | 1 | "De vlaai... brandt aan..." | Dramatisch stervend | 1.2 |
| Death | 2 | *splat-geluid + zucht* | Komisch tragisch | 0.8 |
| Ability | 1 | "Kerse-EXPLOSIE!" | Maniakaal blij | 0.6 |
| Ability | 2 | "Zuut, he? Zuut als wraak!" | Samenzweerderig | 1.0 |
| Idle | 1 | "Ich eet ze zelf op as ich niks te gooie heb..." | Smakkend | 1.5 |
| Idle | 2 | *snuift* "Hmm, die ruikt sjoen..." | Afgeleid | 1.0 |

---

### 6.4 Mergelridder (Heavy / Cavalry)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Steen breekt neet" | Diep, kalm | 0.6 |
| Select | 2 | "Ich stao" | Minimaal, krachtig | 0.4 |
| Select | 3 | "De heuvels spreke" | Mysterieus | 0.7 |
| Move | 1 | "Langzaam maar zeker" | Geduldig | 0.7 |
| Move | 2 | "Ich kom eraan. Wacht maar" | Dreigend kalm | 0.8 |
| Move | 3 | "De grond draagt mich" | Filosofisch | 0.7 |
| Attack | 1 | "Mergel op dien kop!" | Kort, krachtig | 0.7 |
| Attack | 2 | "Ich breek dich" | Dreigend, zacht | 0.5 |
| Attack | 3 | "De berg valt op dich!" | Strijdkreet | 0.8 |
| Death | 1 | "Terug... nao de steen..." | Vredevol stervend | 1.2 |
| Death | 2 | *krakend steen + diepe zucht* | Instortend | 1.0 |
| Ability | 1 | "Steenhuid! Raak mich neet!" | Uitdagend | 0.8 |
| Ability | 2 | "Ich bin de berg!" | Krachtig, trots | 0.6 |
| Idle | 1 | "Steen is geduldig. Ich ook." | Filosofisch | 1.2 |
| Idle | 2 | *schraapt steen over harnas* | Onderhoudend | 1.5 |

---

### 6.5 Kolenbrander (Siege)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Het vuur brandt..." | Zacht, sinister | 0.7 |
| Select | 2 | "Waat moot ich in brand steke?" | Gretig, fluisterend | 0.8 |
| Select | 3 | "Kolen... altied kolen..." | Obsessief | 0.7 |
| Move | 1 | "De kar rolt" | Nuchter | 0.5 |
| Move | 2 | "Ich breng het vuur" | Dreigend kalm | 0.6 |
| Move | 3 | "Neet te dich bij de vlam..." | Waarschuwend | 0.8 |
| Attack | 1 | "Brand!" | Kort, intens | 0.3 |
| Attack | 2 | "Gloeiende kolen! Vang!" | Sadistisch blij | 0.8 |
| Attack | 3 | "Alles wordt as" | Fluisterend dreigend | 0.6 |
| Death | 1 | "Het vuur... geit oet..." | Zacht stervend | 1.0 |
| Death | 2 | *explosie + sissend geluid* | Dramatisch | 1.0 |
| Ability | 1 | "Mijngas... ajem in..." | Fluisterend, kwaadaardig | 0.8 |
| Ability | 2 | "De lucht wurd zwaar..." | Sinister | 0.7 |
| Idle | 1 | *blaast op gloeiende kolen* "Sjoen..." | Hypnotisch | 1.5 |
| Idle | 2 | "Zonder vuur is 't niks..." | Melancholisch | 1.0 |

---

### 6.6 Sjpion (Support / Healer)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Ich bin d'r" | Fluisterend, plots | 0.5 |
| Select | 2 | "Waat fielt dich?" | Zorgzaam, zacht | 0.6 |
| Select | 3 | "Stil... ich heur dich" | Mysterieus | 0.7 |
| Move | 1 | "As een sjaduw" | Fluisterend | 0.5 |
| Move | 2 | "Ich glij d'r heen" | Zacht | 0.5 |
| Move | 3 | "Niemand zeet mich gaon" | Mysterieus | 0.7 |
| Attack | 1 | "Neet mien stiel... maar good" | Tegenzin | 0.8 |
| Attack | 2 | "Een tik met de stok" | Nuchter | 0.6 |
| Attack | 3 | "Sorry. Mot ech" | Beleefd dreigend | 0.5 |
| Death | 1 | "De nevels... neme mich op..." | Verdwijnend | 1.2 |
| Death | 2 | *fluistering die wegsterft* | Etherisch | 0.8 |
| Ability | 1 | "Mergelzalf op de wond..." | Zorgzaam | 0.8 |
| Ability | 2 | "Laot mich dich heel make" | Zacht, warm | 0.7 |
| Idle | 1 | "Ich wacht... dat is waat ich doe" | Geduldig | 1.0 |
| Idle | 2 | *zacht neurieen van een oud Limburgs lied* | Melancholisch | 2.0 |

---

### 6.7 Mijnrat (Special — Stealth/Sabotage)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Hihihi... jao?" | Giechelig | 0.5 |
| Select | 2 | "Ssst! Ich bin d'r!" | Fluisterend opgewonden | 0.6 |
| Select | 3 | "Waat laote we knalle?" | Gretig | 0.6 |
| Move | 1 | "Door de gange!" | Snel, opgewonden | 0.5 |
| Move | 2 | "Ich kruup ernaotoe" | Sluipend | 0.6 |
| Move | 3 | "Ze zeen mich neet!" | Zelfverzekerd | 0.5 |
| Attack | 1 | "Sjtekske erin!" | Snel, giechelig | 0.5 |
| Attack | 2 | "Hihihi, raak!" | Sadistisch blij | 0.5 |
| Attack | 3 | "Klein maar gemeen!" | Trots | 0.5 |
| Death | 1 | "Ze... hadde mich toch..." | Verrast stervend | 0.8 |
| Death | 2 | *piepje + stilte* | Abrupt | 0.4 |
| Ability (Mijn) | 1 | "Boem! ...straks" | Giechelig, verwachtingsvol | 0.6 |
| Ability (Sabotage) | 2 | "Effe hieraan draaie... hihihi" | Kwaadaardig speels | 0.8 |
| Idle | 1 | "Verveeld... zal ich waat opblaoze?" | Ongedurig | 1.0 |
| Idle | 2 | *knaagt ergens op* | Klein geluid | 1.0 |

---

### 6.8 Heuvelansen (Scout)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Hej!" | Kort, energiek | 0.3 |
| Select | 2 | "Bove op de heuvel!" | Enthousiast | 0.6 |
| Select | 3 | "Ich ziej alles van hierbo!" | Trots | 0.8 |
| Move | 1 | "Ich ren!" | Kort, snel | 0.3 |
| Move | 2 | "Over de heuvels!" | Blij | 0.5 |
| Move | 3 | "Niemand is sneller!" | Uitdagend | 0.6 |
| Attack | 1 | "Sjtein weg!" | Kort, scherp | 0.4 |
| Attack | 2 | "Raak! Van de heuvel af!" | Trots | 0.7 |
| Attack | 3 | "Neem dat!" | Speels | 0.4 |
| Death | 1 | "De heuvel... is te steil..." | Vallend | 0.8 |
| Death | 2 | *rollend geluid + oef* | Komisch | 0.6 |
| Ability | 1 | "Sjtof in dien ouge!" | Schalkse grijns | 0.6 |
| Ability | 2 | "Kiek neet zo good meer, he?" | Pesterig | 0.8 |
| Idle | 1 | "Ich ziej... niks. Saai." | Verveeld | 0.8 |
| Idle | 2 | *fluit een deuntje + springt op en neer* | Rusteloos | 1.5 |

---

### 6.9 Hero: De Mijnbaas (Tank / Controller)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Gluck auf" | Diep, plechtig | 0.6 |
| Select | 2 | "De Mijnbaas sprikt" | Autoritair | 0.7 |
| Select | 3 | "Waat wiltse van de diepte?" | Vaderlijk, kalm | 0.8 |
| Move | 1 | "Ich gaon" | Kort, zwaar | 0.4 |
| Move | 2 | "De tunnels weze mich de weg" | Mysterieus | 0.8 |
| Move | 3 | "Bove of onder, ich kom" | Vastberaden | 0.7 |
| Attack | 1 | "Gluck auf... veur dich is 't aafgeloupe!" | Dreigend | 1.2 |
| Attack | 2 | "De mijn nemp dich!" | Krachtig, donker | 0.7 |
| Attack | 3 | "Onder de grond met dich!" | Strijdkreet | 0.7 |
| Death | 1 | "De mijn... sluit zich... ich bliev..." | Stervend, vredevol | 1.5 |
| Death | 2 | "Gluck... auf..." | Laatste fluistering | 0.8 |
| Ability (Instorten) | 1 | "DE SCHACHT STORT IN!" | Brullend, krachtig | 1.0 |
| Ability (Gluck Auf) | 2 | "GLUCK AUF, LIMBURG! STAO OP!" | Inspirerend, luid | 1.2 |
| Ability (Tunnel) | 3 | "Volg mich... door de diepte" | Zacht, samenzweerderig | 0.8 |
| Ultimate (Aardbeving) | 1 | "DE GROND BEEFT! LIMBURG RIEST ZICH!" | Maximaal episch | 1.5 |
| Idle | 1 | "Ich heur de aarde ajem... hoortse 't?" | Mysterieus | 1.5 |
| Idle | 2 | "Een baas zonder mijn... is maar een man met een hamer" | Filosofisch | 2.0 |

---

### 6.10 Hero: De Maasridder (Caster / Disruptor)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Het water streumt" | Kalm, melodisch | 0.6 |
| Select | 2 | "Ich bin de Maas" | Mysterieus, diep | 0.6 |
| Select | 3 | "Waat wil het water?" | Poëtisch | 0.6 |
| Move | 1 | "As water over sjtein" | Vloeiend | 0.6 |
| Move | 2 | "De Maas vindt altied zien weg" | Kalm, wijs | 0.8 |
| Move | 3 | "Ich streum" | Minimaal | 0.4 |
| Attack | 1 | "De vloed komt!" | Dreigend, kalm | 0.5 |
| Attack | 2 | "Water breekt sjtein" | Filosofisch agressief | 0.6 |
| Attack | 3 | "Verdrinke in de Maas!" | Krachtig | 0.7 |
| Death | 1 | "Het water... kiert terug nao de bron..." | Poëtisch stervend | 1.5 |
| Death | 2 | *watergeluid dat wegstroomt* | Etherisch | 1.0 |
| Ability (Maasvloed) | 1 | "DE MAAS BREKT DOOR!" | Explosief, krachtig | 0.8 |
| Ability (Nevelgordijn) | 2 | "Nevel... bedek ons..." | Fluisterend | 0.7 |
| Ability (Watergraf) | 3 | "Hier streumt gein mens meer" | Kalm, definitief | 0.8 |
| Ultimate (Watersnood) | 1 | "WATERSNOOD! DE MAAS NEMP ALLES!" | Maximaal episch, stormachtig | 1.5 |
| Idle | 1 | "Het water fluistert geheime... wiltse luistere?" | Mysterieus | 1.5 |
| Idle | 2 | *geluid van stromend water + zacht neurieen* | Meditatief | 2.0 |

---

## Bijlage A: Balancing Notities

### Unit Vergelijking (Worker)

| Stat | Brabanders (Boer) | Randstad (Stagiair) | Limburgers (Mijnwerker) |
|------|-------------------|---------------------|-------------------------|
| HP | 60 | 45 | 65 |
| Attack | 5 | 3 | 7 |
| Speed | 5.0 | 5.5 | 4.5 |
| Cost | 50/0 | 35/0 | 55/0 |
| Carry | 10 | 8 | 10 |
| Niche | Balanced | Goedkoop/snel | Sterk/langzaam |

De Mijnwerker is de duurste en sterkste worker, maar ook de langzaamste. Dit past bij de Limburgse playstyle: langzame economie, maar wat je hebt is stevig.

### DPS Vergelijking (Infantry)

| Unit | DPS | HP | Cost | Niche |
|------|-----|----|------|-------|
| Carnavalvierder (Brab) | 8.3 | 80 | 75/25 | Melee, groepsbuff |
| Manager (Rand) | 6.0 | 70 | 90/30 | Ranged, debuff |
| Schutterij (Limb) | 7.8 | 70 | 85/35 | Ranged, formatie |

### Factie Sterkte per Fase

| Fase | Brabanders | Randstad | Limburgers |
|------|-----------|----------|------------|
| Early game | Medium | Zwak (bureaucratie) | Zwak (dure units) |
| Mid game | Sterk (groepsbuff) | Medium (stacks opbouwen) | Sterk (tunnels + raids) |
| Late game | Zeer sterk (deathball) | Zeer sterk (stacks + tech) | Sterk (guerrilla + siege) |

De Limburgers zijn het sterkst in mid-game guerrilla-warfare via tunnels. Hun late game hangt af van succesvolle hit-and-run en het beschermen van Mijnschachten voor Kolen-productie.

---

## Bijlage B: Voice Line Totalen

| Categorie | Per unit | Units | Totaal |
|-----------|---------|-------|--------|
| Select | 3 | 10 | 30 |
| Move | 3 | 10 | 30 |
| Attack | 3 | 10 | 30 |
| Death | 2 | 10 | 20 |
| Ability | 2-4 | 10 | 26 |
| Idle | 2 | 10 | 20 |
| **TOTAAL** | | | **156** |

*Heroes hebben extra lijnen voor meerdere abilities en ultimate. Mijnbaas: 18 lijnen. Maasridder: 18 lijnen. Reguliere units: 15 lijnen gemiddeld.*
