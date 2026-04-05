# Reign of Brabant — Sub-PRD: Multiplayer & Networking

**Versie**: 1.0.0
**Datum**: 2026-04-05
**Status**: Draft — Wacht op goedkeuring
**Parent PRD**: `../PRD.md` (v1.0.0)
**Scope**: Alles wat multiplayer betreft: architectuur, netcode, lobby, matchmaking, anti-cheat, communicatie, leaderboard

---

## Inhoudsopgave

1. [Architectuur](#1-architectuur)
2. [Lobby & Matchmaking](#2-lobby--matchmaking)
3. [Game Modes](#3-game-modes)
4. [Netcode Details](#4-netcode-details)
5. [Reconnection & Error Handling](#5-reconnection--error-handling)
6. [Anti-Cheat](#6-anti-cheat)
7. [Invite Systeem](#7-invite-systeem-gedetailleerd)
8. [Leaderboard & Stats](#8-leaderboard--stats)
9. [Chat & Communicatie](#9-chat--communicatie)
10. [Edge Cases](#10-edge-cases)

---

## 1. Architectuur

### 1.1 Protocol Keuze: WebSocket + Colyseus (Server-Authoritative)

**Keuze**: WebSocket via Colyseus op de Mac mini M4.
**Niet WebRTC, niet Hybrid**. Onderbouwing:

| Criterium | WebSocket (Colyseus) | WebRTC DataChannel | Hybrid |
|-----------|---------------------|--------------------|--------|
| **Server authority** | Ja, native | Nee, P2P = geen centrale autoriteit | Deels |
| **NAT traversal** | Niet nodig (client→server) | STUN/TURN vereist, fragiel | STUN/TURN voor P2P deel |
| **Anti-cheat** | Server valideert alles | Onmogelijk (clients vertrouwen) | Verdeeld, complex |
| **Fog of War** | Server stuurt alleen zichtbare data | Alle data bij alle clients | Deels |
| **Reconnection** | Simpel (server heeft state) | Extreem complex | Complex |
| **Complexiteit** | Laag | Hoog | Zeer hoog |
| **Latency** | ~50-100ms (prima voor RTS) | ~20-50ms (overkill voor RTS) | Gemixed |
| **Browser support** | 100% | ~95% (Safari issues) | ~95% |

**Waarom niet WebRTC?**
- RTS is geen FPS. 50-100ms latency is onmerkbaar bij unit commands (de unit beweegt toch 1-2 seconden naar zijn doel).
- Anti-cheat is onmogelijk zonder server authority. Bij P2P heeft elke client de volledige game state, inclusief fog of war data van de tegenstander.
- NAT traversal faalt in ~15% van de gevallen (symmetrische NAT). Dan is een TURN relay nodig, wat effectief een server is met extra overhead.

**Waarom niet Hybrid (WebSocket commands + WebRTC state)?**
- Twee protocollen = dubbele complexiteit, dubbele bugs, dubbele debug effort.
- De latency-winst van WebRTC is irrelevant voor RTS.

### 1.2 Netcode Model: Server-Authoritative met Client-Side Prediction

**Niet lockstep.** Onderbouwing:

| Model | Voordelen | Nadelen | Geschikt voor RTS? |
|-------|-----------|---------|-------------------|
| **Lockstep** | Deterministic, laag bandbreedte | Traagste speler bepaalt snelheid, spectator moeilijk, desync = crash | Klassiek (SC1, WC3) maar verouderd |
| **Server-authoritative** | Anti-cheat, fog of war, reconnection, spectator, variable client FPS | Meer bandbreedte, server-kosten | Modern, schaalbaar |
| **Client-side prediction** | Responsive UI ondanks latency | Correcties soms zichtbaar (rollback) | Ja, maar selectief |

**Gekozen: Server-authoritative met selectieve client-side prediction.**

De server is de single source of truth. Clients sturen *commands* (intenties), niet *state*. De server valideert, simuleert, en stuurt *state updates* terug.

Client-side prediction wordt ALLEEN toegepast op:
- **Unit movement**: client begint direct te bewegen na klik, server corrigeert als nodig
- **Building placement ghost**: client toont onmiddellijk de placement preview

Client-side prediction wordt NIET toegepast op:
- **Combat damage**: server resolvet, client toont pas na bevestiging
- **Resource changes**: server is authoritative
- **Tech tree unlocks**: server is authoritative
- **Fog of War**: server bepaalt zichtbaarheid, stuurt nooit verborgen data

### 1.3 State Synchronisatie

**Strategie: Delta Compression + Snapshot Interpolation**

```
Client                          Server (Colyseus)
  |                                |
  |--- Command (move unit 5) ---->|
  |                                |-- Validate command
  |                                |-- Simulate tick
  |                                |-- Compute delta
  |<-- Delta patch (changed) -----|
  |                                |
  |-- Apply delta to local state   |
  |-- Interpolate visual positions |
  |-- Render frame                 |
```

**Delta Compression (Colyseus Schema):**
- Colyseus `Schema` tracked automatisch welke properties gewijzigd zijn per tick.
- Alleen gewijzigde velden worden verstuurd (geen volledige snapshots).
- Binary serialisatie via `@colyseus/schema` (significant kleiner dan JSON).
- Typisch RTS frame: 50-500 bytes delta vs 5-50KB volledige snapshot.

**Snapshot Interpolation:**
- Client ontvangt server state updates op tick rate (10 Hz).
- Visuele posities worden geinterpoleerd tussen twee bekende server states.
- Interpolation buffer: 2 ticks (200ms bij 10 Hz) — unit posities lopen 200ms achter op de server maar bewegen smooth.
- Bij gap in updates: extrapoleren maximaal 500ms, daarna freeze (liever stutter dan desync).

**State Schema (vereenvoudigd):**

```typescript
class UnitState extends Schema {
  @type("uint16") id: number;
  @type("uint8") owner: number;       // player index
  @type("uint8") unitType: number;
  @type("float32") x: number;
  @type("float32") z: number;
  @type("float32") rotation: number;
  @type("int16") hp: number;
  @type("uint8") state: number;       // idle, moving, attacking, dead
  @type("uint16") targetId: number;   // attack target
  @type("float32") targetX: number;   // move target
  @type("float32") targetZ: number;
}

class BuildingState extends Schema {
  @type("uint16") id: number;
  @type("uint8") owner: number;
  @type("uint8") buildingType: number;
  @type("float32") x: number;
  @type("float32") z: number;
  @type("int16") hp: number;
  @type("float32") buildProgress: number; // 0.0 - 1.0
  @type("uint8") rallyX: number;
  @type("uint8") rallyZ: number;
}

class PlayerState extends Schema {
  @type("uint8") id: number;
  @type("string") name: string;
  @type("uint8") faction: number;
  @type("int32") resourcePrimary: number;
  @type("int32") resourceSecondary: number;
  @type("int32") resourceTertiary: number;
  @type("uint8") populationUsed: number;
  @type("uint8") populationCap: number;
  @type("uint8") tier: number;
  @type([UnitState]) units = new ArraySchema<UnitState>();
  @type([BuildingState]) buildings = new ArraySchema<BuildingState>();
}

class GameState extends Schema {
  @type("uint32") tick: number;
  @type("float32") gameTime: number;
  @type("uint8") phase: number;       // lobby, countdown, playing, paused, ended
  @type([PlayerState]) players = new ArraySchema<PlayerState>();
}
```

### 1.4 Tick Rate & Timing

| Parameter | Waarde | Rationale |
|-----------|--------|-----------|
| **Server simulation tick** | 10 Hz (100ms) | RTS units bewegen langzaam; 10 updates/sec is meer dan genoeg voor smooth gameplay |
| **State broadcast rate** | 10 Hz (elke tick) | Gelijk aan simulation tick; Colyseus delta compression houdt het klein |
| **Client render rate** | 60 FPS (16.7ms) | Three.js requestAnimationFrame; interpolatie tussen server ticks |
| **Command send rate** | Onbeperkt (event-driven) | Commands worden gestuurd wanneer de speler klikt, niet op een timer |
| **Heartbeat interval** | 2 seconden | Colyseus built-in; detecteert dode connecties |
| **Heartbeat timeout** | 8 seconden | 4 gemiste heartbeats = disconnect |

**Waarom 10 Hz en niet 20 Hz of hoger?**
- Een RTS unit die 5 units/sec beweegt, legt 0.5 units af per tick bij 10 Hz. Dat is sub-pixel op de meeste camera zoom levels.
- Bij 4 spelers met elk 100 units (400 units totaal) genereert 10 Hz ~4000 unit updates per seconde. Bij 20 Hz wordt dat 8000 — onnodig voor de M4 server.
- Bandbreedte per speler bij 10 Hz: ~5-20 KB/s (delta compressed). Bij 20 Hz: ~10-40 KB/s.

### 1.5 Server: Mac mini M4

**Hardware**: Mac mini M4, 64GB RAM, 14 cores, 926GB SSD.
**Runtime**: Node.js + Colyseus 0.15+.
**Deployment**: Docker container op `server-mini` (Tailscale IP: `100.65.114.23`).

**Capaciteit schatting:**

| Metric | Per game room | M4 capaciteit |
|--------|--------------|---------------|
| CPU per room | ~2-5% van 1 core | 14 cores = ~280 rooms theoretisch |
| RAM per room | ~10-30 MB | 64 GB = ~2000 rooms theoretisch |
| Bandbreedte per room | ~20-80 KB/s totaal | 1 Gbps = duizenden rooms |
| **Praktisch maximum** | — | **50-100 concurrent rooms** (met marge) |

**Server architectuur:**

```
Mac mini M4 (Docker)
├── colyseus-server (Node.js container)
│   ├── Port 2567 (WebSocket)
│   ├── Port 2568 (HTTP API: matchmaking, leaderboard)
│   └── SQLite database (stats, leaderboard, room history)
├── nginx (reverse proxy)
│   └── WSS termination (TLS via Let's Encrypt)
└── monitoring
    └── PM2 of Docker healthcheck
```

**URL**: `wss://games-api.theuws.com` (reverse proxy naar Colyseus).
**Fallback**: Als games-api.theuws.com niet beschikbaar is, direct via Tailscale IP (alleen voor development).

---

## 2. Lobby & Matchmaking

### 2.1 Lobby Flow

```
Browser laadt game
       ↓
   Main Menu
   ├── Quick Match (random opponent)
   ├── Custom Game (create/join lobby)
   ├── Join via Link (?join=ROOM_CODE)
   └── Leaderboard
       ↓
   Lobby Room (Colyseus Room type: "lobby")
   ├── Spelers zien elkaars naam + factie
   ├── Host kan settings wijzigen
   ├── Chat
   ├── Ready-up systeem
   └── Start (als alle spelers ready)
       ↓
   Game Room (Colyseus Room type: "game")
   ├── 3-2-1 countdown
   ├── Game begint
   └── Game eindigt → Post-Game scherm
```

### 2.2 Room-Based Lobby (Colyseus)

**Room types:**

| Room Type | Doel | Max clients | Levensduur |
|-----------|------|-------------|------------|
| `lobby` | Wachtruimte voor het spel | 8 (4 spelers + 4 spectators) | Tot game start of alle spelers vertrekken |
| `game` | Actief spel | 8 (4 spelers + 4 spectators) | Tot game eindigt |
| `matchmaking` | Quick match queue | Onbeperkt (server-side) | Altijd actief (singleton) |

**Lobby State:**

```typescript
class LobbyState extends Schema {
  @type("string") roomCode: string;        // 6-char code
  @type("string") hostId: string;          // session ID van de host
  @type("uint8") maxPlayers: number;       // 2-4
  @type("string") mapId: string;           // map identifier
  @type("uint8") gameSpeed: number;        // 0=slow, 1=normal, 2=fast
  @type("boolean") isPublic: boolean;      // zichtbaar in game browser
  @type("string") password: string;        // leeg = geen wachtwoord (nooit naar clients gestuurd)
  @type("uint8") aiDifficulty: number;     // 0=easy, 1=normal, 2=hard
  @type("uint32") createdAt: number;       // timestamp
  @type([LobbyPlayer]) players = new ArraySchema<LobbyPlayer>();
  @type([ChatMessage]) chat = new ArraySchema<ChatMessage>();
}

class LobbyPlayer extends Schema {
  @type("string") sessionId: string;
  @type("string") name: string;
  @type("uint8") faction: number;          // 0=random, 1=Brabanders, 2=Limburgers, 3=Belgen, 4=Randstad
  @type("uint8") team: number;             // 0=none, 1-2 voor team games
  @type("uint8") slot: number;             // 0-3 player slot
  @type("uint8") color: number;            // player color index
  @type("boolean") isReady: boolean;
  @type("boolean") isHost: boolean;
  @type("boolean") isAI: boolean;
  @type("uint8") aiDifficulty: number;     // voor AI slots
}
```

### 2.3 Quick Match (Random Opponent)

**Flow:**

1. Speler klikt "Quick Match" en kiest factie (of random).
2. Client stuurt `join("matchmaking", { faction, elo })` naar Colyseus.
3. Server plaatst speler in de matchmaking queue.
4. Matchmaking algoritme zoekt een tegenstander:
   - **Prioriteit 1**: ELO verschil < 200, wachttijd < 30 seconden.
   - **Prioriteit 2**: ELO verschil < 400, wachttijd 30-60 seconden.
   - **Prioriteit 3**: Iedereen, wachttijd > 60 seconden.
5. Match gevonden: server creeeert een `game` room en stuurt beide spelers de room ID.
6. Clients joinen de `game` room automatisch.
7. 5 seconden countdown, game start.

**Matchmaking queue:**

```typescript
interface QueueEntry {
  sessionId: string;
  name: string;
  faction: number;
  elo: number;
  joinedAt: number; // timestamp
}
```

**Matchmaking tick**: elke 3 seconden scant de server de queue.

### 2.4 Custom Game Lobby

**Host flow:**

1. Klik "Create Game".
2. Configureer settings:
   - Map (selectie uit beschikbare maps)
   - Max spelers (2, 3, of 4)
   - Game speed (Slow / Normal / Fast)
   - Starting resources (Low / Normal / High)
   - Fog of War (On / Off)
   - Publiek of Prive
   - Wachtwoord (optioneel)
   - AI slots invullen (optioneel)
3. Room wordt aangemaakt, room code gegenereerd.
4. Host ziet lobby met share-link en QR code.
5. Andere spelers joinen via link, room code, of game browser.

**Lobby regels:**

| Regel | Specificatie |
|-------|-------------|
| Factie selectie | Elke speler kiest een factie; dezelfde factie mag meerdere keren |
| Team toewijzing | Alleen bij 2v2; host wijst teams toe |
| Ready systeem | Alle spelers moeten "Ready" zijn; host kan starten |
| Kick | Host kan spelers kicken |
| AI vullen | Lege slots kunnen gevuld worden met AI (Easy/Normal/Hard) |
| Start vereiste | Minimaal 2 spelers (human of AI) |
| Swap slots | Host kan spelers tussen slots verplaatsen |
| Factie random | Speler kan "Random" kiezen; wordt resolved bij game start |

### 2.5 Spectator Mode

- Spectators joinen een actief `game` room als observer.
- Spectators ontvangen de volledige game state (alle spelers, geen fog of war).
- Spectators kunnen NIET interacten met het spel.
- Spectators kunnen vrij wisselen tussen speler-perspectieven.
- Spectator delay: **30 seconden** (anti-ghosting bij publieke games).
- Private games: host kan kiezen of spectators mogen joinen.
- Max 4 spectators per game.

**Spectator UI:**
- Dropdown: "Alle spelers" / "Speler 1" / "Speler 2" etc.
- Resource overview van alle spelers
- Unit count per speler
- Minimap zonder fog of war

### 2.6 Game Browser

Publieke games verschijnen in een game browser:

| Kolom | Data |
|-------|------|
| Game naam | Room code of custom naam |
| Host | Hostnaam |
| Spelers | 1/4 (huidige/max) |
| Map | Map naam |
| Status | Wachtend / Bezig |
| Ping | Latency indicator |

Spelers kunnen filteren op: map, aantal spelers, status, wachtwoord (ja/nee).

---

## 3. Game Modes

### 3.1 1v1 Skirmish

| Eigenschap | Specificatie |
|-----------|-------------|
| Spelers | 2 |
| Maps | Symmetrische maps met gelijke resource verdeling |
| Win conditie | Vernietig alle gebouwen van de tegenstander OF tegenstander surrendert |
| Ranked | Ja, ELO rating (optioneel; speler kan kiezen ranked/unranked) |
| Game duur | Typisch 15-30 minuten |
| Starting resources | 500 primair, 200 secundair, 0 tertiair |
| Starting units | 1 Town Hall, 5 Workers |

**Ranked regels:**
- Minimaal 5 placement matches voor ELO toewijzing.
- Abandon = verlies + extra ELO penalty (dubbel verlies).
- Surrender telt als verlies (geen penalty).
- Disconnect > 3 minuten = verlies.

### 3.2 2v2 Team Battle

| Eigenschap | Specificatie |
|-----------|-------------|
| Spelers | 4 (2 teams van 2) |
| Maps | 4-player maps met team start posities |
| Win conditie | Vernietig alle gebouwen van BEIDE tegenstanders |
| Gedeelde resources | Optioneel (host setting): spelers in een team delen een resource pool |
| Gedeelde visie | Ja, teamgenoten delen fog of war |
| Gedeeld population cap | Nee, elk 100 individueel |

**Gedeelde resources mode:**
- Beide spelers dragen bij aan en putten uit dezelfde pool.
- Resource income indicator per speler (wie levert hoeveel).
- Eeen speler kan resources transferren naar teamgenoot (handmatig, via UI).

**Ally interactie:**
- Ally units kunnen genezen worden door eigen healers.
- Ally buildings tellen NIET als eigen (geen training/research).
- Gedeelde minimap met ally posities.

### 3.3 Free For All (FFA)

| Eigenschap | Specificatie |
|-----------|-------------|
| Spelers | 3-4 |
| Maps | Symmetrische maps met gelijke afstanden |
| Win conditie | Laatste speler met een Town Hall |
| Allianties | Geen formele allianties; diplomatie is informeel (via chat) |
| Ranking | Positie bepaald door volgorde van eliminatie (4e, 3e, 2e, 1e) |

**FFA balancing:**
- Startposities op gelijke afstand van het centrum.
- Resource nodes gelijk verdeeld per kwadrant.
- Geen shared vision (iedereen voor zich).
- ELO: 1e krijgt +ELO, 4e krijgt -ELO. 2e en 3e krijgen fractie.

### 3.4 Co-op vs AI

| Eigenschap | Specificatie |
|-----------|-------------|
| Spelers | 1-4 (human) vs 1-4 AI |
| AI moeilijkheid | Easy / Normal / Hard / Brutal |
| Maps | Alle maps, inclusief asymmetrische (verdediging vs aanval) |
| Win conditie | Vernietig alle AI gebouwen |
| Gedeelde visie | Ja (alle human spelers delen fog of war) |

**AI difficulty scaling:**

| Difficulty | Resource bonus | Build speed | Aggression | Micro |
|-----------|---------------|-------------|------------|-------|
| Easy | +0% | +0% | Passief, aanval na 15 min | Geen |
| Normal | +25% | +15% | Gebalanceerd, aanval na 10 min | Basis |
| Hard | +50% | +30% | Agressief, rush na 7 min | Goed |
| Brutal | +100% | +50% | Zeer agressief, rush na 5 min | Perfect |

### 3.5 Carnavalsmode (Party Mode)

| Eigenschap | Specificatie |
|-----------|-------------|
| Spelers | 2-4 |
| Maps | Speciale "Carnaval" maps met extra props |
| Win conditie | Meeste punten na 20 minuten OF vernietig alle vijanden |
| Special | Random events elke 2 minuten |

**Random events** (server kiest willekeurig uit de pool):

| Event | Effect | Duur |
|-------|--------|------|
| **Bieroverstroming** | Alle units bewegen 50% langzamer | 30 sec |
| **Worstenbroodje Regen** | Random resource drops over de map | 20 sec |
| **Polonaise!** | Alle melee units van alle spelers marcheren naar het centrum | 15 sec |
| **Mist van Brabant** | Fog of War range gehalveerd voor iedereen | 45 sec |
| **Gouden Kansen** | Random neutrale goudmijn spawnt op de map | Permanent |
| **Alaaf!** | Alle units krijgen +50% attack speed | 20 sec |
| **Bureaucratische Storing** | Geen gebouwen plaatsen/upgraden | 30 sec |
| **Carnavals Draaimolen** | Random teleport van 5 units per speler | Instant |
| **Traktatie** | Alle units worden volledig geheald | Instant |
| **Omgekeerde Dag** | Controls zijn omgekeerd (links=rechts) | 30 sec |

**Punten systeem (Carnavalsmode):**

| Actie | Punten |
|-------|--------|
| Vijandelijke unit doden | +10 |
| Vijandelijk gebouw vernietigen | +50 |
| Resource node claimen | +5 |
| Overleven (per minuut) | +20 |
| Vijandelijke hero doden | +100 |
| Event bonus pakken | +25 |

---

## 4. Netcode Details

### 4.1 Command Protocol

Alle speler-acties worden als **commands** naar de server gestuurd. De server valideert en voert uit.

**Command types:**

```typescript
enum CommandType {
  MOVE = 1,
  ATTACK = 2,
  ATTACK_MOVE = 3,
  STOP = 4,
  HOLD_POSITION = 5,
  BUILD = 6,
  TRAIN_UNIT = 7,
  RESEARCH = 8,
  USE_ABILITY = 9,
  SET_RALLY = 10,
  GATHER = 11,
  PATROL = 12,
  SURRENDER = 13,
  CHAT = 14,
  PING_MAP = 15,
}

interface GameCommand {
  type: CommandType;
  tick: number;           // client's last known server tick
  unitIds: number[];      // welke units het commando uitvoeren
  targetX?: number;       // doel positie
  targetZ?: number;
  targetId?: number;      // doel unit/gebouw ID
  buildingType?: number;  // voor BUILD commando
  abilityId?: number;     // voor USE_ABILITY
  param?: number;         // extra parameter (unit type voor TRAIN, research ID, etc.)
}
```

**Command validatie (server-side):**

```
1. Is de speler eigenaar van de opgegeven units?
2. Zijn de units alive (HP > 0)?
3. Is het commando geldig voor dit unit type? (worker kan niet attack-move)
4. Zijn de resources beschikbaar? (voor BUILD, TRAIN, RESEARCH)
5. Is de target locatie valide? (binnen map bounds, begaanbaar terrein voor BUILD)
6. Is er population cap beschikbaar? (voor TRAIN)
7. Is de target unit/gebouw zichtbaar voor deze speler? (fog of war check)
```

Bij ongeldige command: server stuurt een `COMMAND_REJECTED` message terug met reden. Client toont foutmelding ("Niet genoeg resources", "Positie geblokkeerd", etc.).

### 4.2 Unit Movement Synchronisatie

**Server-side pathfinding:**
- Server berekent het pad via A* op de navmesh.
- Server stuurt het volledige pad NIET naar de client (te veel data).
- Server stuurt alleen de huidige positie (x, z) en target positie elke tick.
- Client interpoleert visueel tussen bekende posities.

**Client-side prediction voor movement:**

```
1. Speler klikt "move to X,Z"
2. Client stuurt MOVE command naar server
3. Client berekent LOKAAL een pad (zelfde navmesh copy)
4. Client begint unit DIRECT te bewegen langs dit pad (prediction)
5. Server ontvangt command, berekent eigen pad, simuleert
6. Server stuurt state update met server-positie
7. Client vergelijkt predicted positie met server positie
   - Verschil < 1.0 unit: geen correctie (acceptabel)
   - Verschil 1.0-3.0 units: smooth interpolation correctie (200ms)
   - Verschil > 3.0 units: teleport snap naar server positie
```

**Bandbreedte optimalisatie voor movement:**
- Units die stilstaan worden NIET in de delta opgenomen.
- Units die hetzelfde pad volgen worden gegroepeerd (formation data i.p.v. individuele posities).
- Positie-floats worden afgerond op 0.1 units nauwkeurigheid (float32 is overkill; dit scheelt delta's).

### 4.3 Combat Resolution

**Server resolvet ALLE damage.** Geen client-side combat prediction.

**Combat flow (netwerk):**

```
Tick N:   Client stuurt ATTACK command (unit 5 → target unit 12)
Tick N+1: Server valideert: unit 5 is in range? Target 12 is zichtbaar?
Tick N+1: Server start attack animation timer
Tick N+3: Server resolvet damage:
          - Berekent effective damage (attack - armor * 0.5, min 1)
          - Past damage modifiers toe (armor type vs attack type)
          - Past factie-specifieke buffs toe (Gezelligheid bonus, etc.)
          - Update target HP
Tick N+3: Server broadcast delta: unit 12 HP changed, unit 5 state=attacking
Tick N+4: Client ontvangt delta, speelt attack animatie + impact effect
```

**Waarom geen client-side combat prediction?**
- Combat in RTS is niet latency-gevoelig. De speler geeft een attack-commando en kijkt toe.
- Rollback van damage is verwarrend (health bar gaat omhoog na schade).
- Server moet damage resolven voor anti-cheat en fog of war enforcement.

**Projectielen:**
- Server simuleert projectiel travel time.
- Client ontvangt "projectile spawned" event met start positie, target positie, en speed.
- Client rendert het projectiel visueel (volledig cosmetisch; server bepaalt hit/miss).
- Bij miss (target is verplaatst): server stuurt miss event, client toont projectiel dat de grond raakt.

### 4.4 Building Placement Synchronisatie

```
1. Client toont placement ghost (lokaal, geen netwerk)
2. Speler klikt om te plaatsen
3. Client stuurt BUILD command (buildingType, x, z)
4. Server valideert:
   - Positie vrij? (geen overlap met andere gebouwen/units)
   - Terrein begaanbaar?
   - Resources beschikbaar?
   - Worker beschikbaar en in range?
5. Server plaatst gebouw met buildProgress = 0.0
6. Server broadcast: nieuw gebouw in state
7. Client ziet gebouw verschijnen (constructie-animatie)
8. Worker beweegt naar gebouw en bouwt (buildProgress += rate per tick)
9. Bij buildProgress = 1.0: gebouw is klaar
```

**Placement rejection:**
- Als de server de plaatsing afwijst, stuurt het een `BUILD_REJECTED` met reden.
- Client verwijdert de ghost en toont een error indicator.
- Latency: 50-100ms vertraging tussen klik en bevestiging/afwijzing. Acceptabel.

### 4.5 Resource Gathering Synchronisatie

- **Server-authoritative**: alleen de server update resource balances.
- Client toont resource counts op basis van server state.
- Gathering cycle:
  1. Worker arriveert bij resource node (server bevestigt)
  2. Server start gather timer (2 seconden voor 10 eenheden)
  3. Server vermindert node amount, verhoogt worker carry amount
  4. Worker keert terug naar Town Hall (pathfinding op server)
  5. Server voegt resources toe aan speler's pool bij aankomst
- Client-side prediction: GEEN. Resource count wijzigt pas na server update. Vertraging is onmerkbaar (gather cycle duurt sowieso 10+ seconden).

### 4.6 Fog of War Enforcement

**Kritisch voor anti-cheat. Server stuurt NOOIT data die de speler niet mag zien.**

**Implementatie:**

```typescript
// Server-side: per tick, per speler
function getVisibleState(player: PlayerState, fullState: GameState): PartialState {
  const visibleUnits: UnitState[] = [];
  const visibleBuildings: BuildingState[] = [];

  // Bereken visibility map op basis van eigen units + buildings
  const visibilityMap = computeVisibility(player);

  for (const otherPlayer of fullState.players) {
    if (otherPlayer.id === player.id) continue;       // eigen units altijd zichtbaar
    if (otherPlayer.team === player.team) continue;    // ally units altijd zichtbaar

    for (const unit of otherPlayer.units) {
      if (visibilityMap.isVisible(unit.x, unit.z)) {
        visibleUnits.push(unit);
      }
      // NIET zichtbaar? NIET meesturen. Punt.
    }

    for (const building of otherPlayer.buildings) {
      if (visibilityMap.isVisible(building.x, building.z)) {
        visibleBuildings.push(building);
      } else if (visibilityMap.wasExplored(building.x, building.z)) {
        // Gebouwen in eerder verkend gebied: toon "last known state"
        visibleBuildings.push(building.lastKnownSnapshot);
      }
    }
  }

  return { visibleUnits, visibleBuildings };
}
```

**Gevolg voor Colyseus Schema:**
- Standaard Colyseus `Schema` stuurt de volledige state naar alle clients.
- Dit is ONACCEPTABEL voor fog of war.
- Oplossing: **per-client state filtering** via Colyseus `filterChildren()` of een custom `onStateChange` implementatie.
- Alternatief: gebruik een custom binary protocol naast Colyseus Schema voor unit/building state, waarbij de server per-client filtert.

### 4.7 Ability/Spell Synchronisatie

Abilities worden behandeld als commands:

```
Client stuurt: USE_ABILITY { unitIds: [heroId], abilityId: 3, targetX, targetZ }
Server valideert:
  - Hero alive?
  - Ability unlocked?
  - Ability niet op cooldown?
  - Resource kosten beschikbaar? (Gezelligheid, etc.)
  - Target in range?
Server voert ability uit:
  - Bereken AoE targets
  - Pas effects toe (damage, stun, buff, etc.)
  - Start cooldown timer
  - Broadcast: ability effect event + state changes
Client ontvangt:
  - Speelt ability animatie + VFX + SFX
  - Update getroffen units (HP changes, debuff icons, etc.)
```

**Latency voor abilities:**
- 50-100ms vertraging na klik. Bij snelle abilities (stun) merk je dit.
- Oplossing: client speelt de "cast animation" DIRECT af (prediction). Als de server afwijst, stopt de animatie en toont een error.

### 4.8 Latency Compensation

| Techniek | Toepassing | Detail |
|----------|-----------|--------|
| **Client-side prediction** | Unit movement | Client beweegt unit direct; server corrigeert |
| **Interpolation** | Alle visuele posities | 200ms buffer tussen server states |
| **Input buffering** | Commands | Server buffert commands en voert ze uit op de juiste tick |
| **Timestamp reconciliation** | Commands | Command bevat client tick; server past toe op de correcte simulation tick |

**Latency targets:**

| Latency | Ervaring |
|---------|----------|
| 0-80ms | Excellent (nauwelijks merkbaar) |
| 80-150ms | Goed (minimale delay op commands) |
| 150-250ms | Acceptabel (merkbaar maar speelbaar) |
| 250-500ms | Matig (commands voelen traag) |
| 500ms+ | Slecht (waarschuwing tonen aan speler) |

Bij latency > 250ms: toon een geel waarschuwingsicoon.
Bij latency > 500ms: toon een rood waarschuwingsicoon + "Slechte verbinding" melding.

### 4.9 Jitter Buffer

**Probleem**: Netwerk jitter zorgt ervoor dat state updates niet regelmatig aankomen. Zonder buffer resulteert dit in stotterend gameplay.

**Oplossing**: Adaptive jitter buffer op de client.

```typescript
class JitterBuffer {
  private buffer: StateUpdate[] = [];
  private bufferSize: number = 2;  // start: 2 ticks (200ms)
  private readonly MIN_BUFFER = 1; // 100ms
  private readonly MAX_BUFFER = 5; // 500ms

  addUpdate(update: StateUpdate) {
    this.buffer.push(update);
    this.buffer.sort((a, b) => a.tick - b.tick);
  }

  getNextUpdate(currentTick: number): StateUpdate | null {
    // Lever updates af met bufferSize ticks vertraging
    const targetTick = currentTick - this.bufferSize;
    const idx = this.buffer.findIndex(u => u.tick >= targetTick);
    if (idx >= 0) {
      return this.buffer.splice(0, idx + 1).pop()!;
    }
    return null; // buffer underrun — extrapoleer
  }

  // Adaptief: vergroot buffer bij veel jitter, verklein bij stabiel
  adjustBuffer(jitterMs: number) {
    const jitterTicks = Math.ceil(jitterMs / 100); // 100ms per tick
    this.bufferSize = Math.max(this.MIN_BUFFER,
                      Math.min(this.MAX_BUFFER, jitterTicks + 1));
  }
}
```

---

## 5. Reconnection & Error Handling

### 5.1 Disconnect Detectie

| Methode | Interval | Threshold | Actie |
|---------|----------|-----------|-------|
| **Colyseus heartbeat** | 2 seconden | 8 seconden (4 gemist) | Markeer als disconnected |
| **WebSocket close event** | Instant | N.v.t. | Markeer als disconnected |
| **Client-side ping** | 5 seconden | 3 gemiste pongs | Toon "Verbinding verloren" UI |

### 5.2 Reconnection Flow

```
Speler disconnect
       ↓
Server markeert speler als "disconnected" (NIET verwijderd)
Server start reconnection timer: 180 seconden (3 minuten)
Server stuurt "player disconnected" event naar andere spelers
Andere spelers zien: "[Speler] is losgekoppeld (2:59...)"
       ↓
Speler's browser herlaadt / verbinding hersteld
       ↓
Client stuurt reconnect request met:
  - sessionId (opgeslagen in sessionStorage)
  - roomId (opgeslagen in URL hash)
  - reconnectionToken (Colyseus built-in)
       ↓
Server valideert reconnection token
       ↓
Server stuurt VOLLEDIGE state snapshot naar reconnected client
(Niet alleen delta — client heeft niets meer)
       ↓
Client herbouwt volledige game state
Client hervat gameplay
Andere spelers zien: "[Speler] is opnieuw verbonden"
```

**Reconnection token:**
- Colyseus genereert een uniek token bij join.
- Token wordt opgeslagen in `sessionStorage` (overleeft page refresh maar niet browser close).
- Token verloopt na 180 seconden.
- Bij succesvolle reconnect: nieuw token gegenereerd.

### 5.3 Wat Gebeurt er bij Disconnect?

**Opties (configureerbaar door host in lobby):**

| Optie | Gedrag | Default |
|-------|--------|---------|
| **AI Takeover** | AI neemt de disconnected speler's units/gebouwen over met Easy difficulty | **Ja (default)** |
| **Pauze** | Game pauzeert voor alle spelers tot reconnect of timeout | Nee |
| **Timer Only** | Units/gebouwen staan stil, worden niet aangevallen tot timer verloopt | Nee |

**AI Takeover details:**
- AI gebruikt Easy difficulty (defensief, geen aanvallen).
- AI traint geen nieuwe units en bouwt geen gebouwen.
- AI laat bestaande workers resources verzamelen.
- AI stuurt bestaande units op "hold position" bij gebouwen (verdediging).
- Bij reconnect: speler krijgt volledige controle terug; AI stopt direct.

**Na timeout (180 seconden):**
- 1v1: disconnected speler verliest. Andere speler wint.
- 2v2: AI blijft op Easy difficulty voor de rest van het spel. Teamgenoot kan gebouwen/resources van de AI-speler gebruiken.
- FFA: disconnected speler is geëlimineerd. Units/gebouwen worden neutraal (crumble na 60 seconden).

### 5.4 Desync Detectie en Recovery

**Desync**: wanneer de client's verwachte state afwijkt van de server's state.

In een server-authoritative model is desync technisch onmogelijk (server IS de truth). Maar de client's VISUELE representatie kan afwijken:

| Symptoom | Oorzaak | Detectie | Recovery |
|---------|---------|----------|----------|
| Unit op verkeerde positie | Prediction drift | Positie verschil > 3.0 units | Teleport snap |
| Gebouw zichtbaar dat er niet is | Stale fog of war cache | Server stuurt removal event, client mist het | Periodieke full state check (elke 30 seconden) |
| Resource count mismatch | Race condition in prediction | Client vergelijkt bij elke server update | Server value overschrijft altijd |
| HP mismatch | Cosmetische fout | Health bar toont andere waarde dan server | Server HP is truth; override op elke delta |

**Periodieke full state sync:**
- Elke 30 seconden stuurt de server een compressed full state snapshot.
- Client vergelijkt deze met de lokale state.
- Afwijkingen worden gecorrigeerd.
- Dit is een safety net, niet het primaire synchronisatiemechanisme.

### 5.5 Browser Tab Achtergrond (Visibility API)

**Probleem**: Browsers throttlen JavaScript execution wanneer een tab niet zichtbaar is. `requestAnimationFrame` stopt, `setTimeout`/`setInterval` worden vertraagd tot 1Hz.

**Oplossing:**

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Tab is op de achtergrond
    client.send('PLAYER_AFK', { afk: true });

    // Stop rendering (Three.js)
    renderer.setAnimationLoop(null);

    // WebSocket BLIJFT open (browser throttelt ws niet)
    // Maar: stuur commands op een lagere rate
    // Server buffert state updates (client haalt ze op bij terugkeer)
  } else {
    // Tab is weer actief
    client.send('PLAYER_AFK', { afk: false });

    // Vraag full state snapshot aan
    client.send('REQUEST_FULL_STATE');

    // Hervat rendering
    renderer.setAnimationLoop(gameLoop);
  }
});
```

**Server-side AFK handling:**
- AFK speler's units blijven actief (AI takeover NIET automatisch bij AFK).
- Na 60 seconden AFK: waarschuwing naar de speler (push notification als beschikbaar).
- Na 120 seconden AFK: behandel als disconnect (start reconnection timer).

### 5.6 Rage Quit Handling

**Surrender optie:**
- Speler kan op elk moment surrenderen via het menu.
- Surrender = formeel verlies (ELO penalty zoals normaal verlies).
- Bevestigingsdialog: "Weet je zeker dat je wilt opgeven?"
- Na surrender: speler wordt spectator (kan het spel verder kijken).

**Abandon (browser sluiten zonder surrender):**
- Wordt behandeld als disconnect.
- Na timeout (180 seconden): telt als verlies + extra ELO penalty.
- ELO penalty: normaal verlies = -25 ELO, abandon = -40 ELO.
- Bij herhaald abandonen (3+ in 24 uur): tijdelijke ban van ranked matches (1 uur).

**Abandon tracking:**

```typescript
interface AbandonRecord {
  playerId: string;
  timestamp: number;
  gameMode: string;
  gameId: string;
}
```

---

## 6. Anti-Cheat

### 6.1 Filosofie

De server is de ENIGE autoriteit. Clients zijn uitsluitend input devices en renderers. Geen enkele game-state-modifying berekening vindt plaats op de client. Dit is de fundamentele anti-cheat laag.

### 6.2 Server-Side Validatie van Alle Acties

Elke command wordt gevalideerd voordat hij wordt uitgevoerd:

| Command | Validatie checks |
|---------|-----------------|
| MOVE | Unit bestaat? Eigenaar? Unit alive? Target op de map? Target begaanbaar? |
| ATTACK | Unit bestaat? Eigenaar? Unit alive? Target bestaat? Target alive? Target zichtbaar (fog)? Target in max engage range? |
| BUILD | Worker bestaat? Eigenaar? Worker alive? Resources beschikbaar? Positie vrij? Positie begaanbaar? Tech requirements met? Pop cap ruimte? |
| TRAIN | Building bestaat? Eigenaar? Building klaar (progress = 1.0)? Resources beschikbaar? Unit type geldig voor dit gebouw? Pop cap ruimte? |
| RESEARCH | Building bestaat? Eigenaar? Research niet al onderzocht? Resources beschikbaar? Tech tree requirement met? Building niet al bezig met research? |
| USE_ABILITY | Unit bestaat? Eigenaar? Unit alive? Ability unlocked? Niet op cooldown? Resource kosten beschikbaar? Target in range? |
| GATHER | Worker bestaat? Eigenaar? Worker alive? Resource node bestaat? Node niet leeg? |

Bij ELKE gefaalde validatie: log het incident (speler ID, command, reden). 3+ gefaalde validaties per minuut = verdacht. 10+ per minuut = mogelijke cheat. Server stuurt waarschuwing of disconnect.

### 6.3 Rate Limiting op Commands

| Limit | Waarde | Rationale |
|-------|--------|-----------|
| Commands per seconde (per speler) | Max 30 | Normale gameplay: 1-5 commands/sec. 30 = ruim genoeg voor snelle spelers |
| Commands per tick (per speler) | Max 5 | Bij 10 Hz: 50 commands/sec theoretisch max. Limit op 5 per tick = 50/sec |
| Burst tolerance | 50 commands in 1 seconde | Korte bursts zijn normaal (box select + move). Maar sustained > 30/sec = verdacht |

Bij rate limit overschrijding:
1. **Soft limit** (30-50 cmd/sec): commands worden gebufferd en vertraagd uitgevoerd. Geen straf.
2. **Hard limit** (50+ cmd/sec sustained > 5 sec): waarschuwing naar speler. Commands worden gedropt.
3. **Extreme** (100+ cmd/sec): automatische disconnect. Mogelijke bot/script.

### 6.4 Fog of War Enforcement

Zie sectie 4.6. De kern: **de server stuurt NOOIT data over units/gebouwen die niet zichtbaar zijn voor de speler.**

Dit maakt de volgende cheats ONMOGELIJK:
- Maphack (alle units zien): client heeft de data gewoon niet.
- Unit tracking (weten waar vijandelijke units zijn): data is er niet.
- Production scouting (weten wat de vijand bouwt): data is er niet.

**Uitzondering**: gebouwen in eerder verkend gebied. De "last known state" wordt gestuurd, maar NIET geupdate tot de speler opnieuw zicht heeft. Een speler kan dus zien dat er een gebouw WAS, maar niet weten of het er nog steeds is of wat de huidige HP is.

### 6.5 Speed Hack Detectie

**Probleem**: Een aangepaste client kan commands sturen alsof units sneller bewegen dan toegestaan.

**Detectie**: Server simuleert alle movement. Client-positie is IRRELEVANT. De server beweegt units op de correcte snelheid. Een speed-hacked client zou alleen ZIEN dat zijn units snel bewegen, maar de server (en alle andere spelers) zien de correcte snelheid.

Effectief: speed hacks zijn onmogelijk in een server-authoritative model. De client kan zijn eigen rendering versnellen, maar dit heeft geen effect op de game state.

### 6.6 Resource Manipulation Detectie

Zelfde principe als speed hacks. Resources worden ALLEEN op de server bijgehouden. Een client die zijn lokale resource count aanpast, ziet alleen een verkeerd getal — het heeft geen effect op wat de server toestaat.

### 6.7 Additional Anti-Cheat Maatregelen

| Maatregel | Detail |
|-----------|--------|
| **Command replay detectie** | Server detecteert identieke command sequences (bot replay). Threshold: 95% match over 60 seconden. |
| **APM monitoring** | Actions Per Minute tracking. >600 APM sustained = onmenselijk, waarschuwing. >1000 APM = bot. |
| **Timing analysis** | Menselijke input heeft variatie in timing. Exact regelmatige intervals (precies 50ms tussen elke command) = bot. |
| **Client version check** | Server controleert client build hash bij connect. Mismatch = weigeren. |

---

## 7. Invite Systeem (Gedetailleerd)

### 7.1 Link Generatie Flow

```
Host creeeert lobby
       ↓
Server genereert room code: "BRK7M3"
       ↓
Invite URL: theuws.com/games/reign-of-brabant/?join=BRK7M3
       ↓
Host ziet in de lobby UI:
  ┌──────────────────────────────────────────────┐
  │  Nodig een vriend uit!                       │
  │                                              │
  │  🔗 theuws.com/games/reign-of-brabant/      │
  │     ?join=BRK7M3                             │
  │                                              │
  │  [Kopieer Link]  [Deel via...]  [QR Code]   │
  │                                              │
  │  Code: BRK7M3  (verloopt over 29:45)        │
  └──────────────────────────────────────────────┘
```

### 7.2 Room Code Specificaties

| Eigenschap | Specificatie |
|-----------|-------------|
| Lengte | 6 karakters |
| Alfabet | `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (32 tekens) |
| Uitgesloten | `O` (verwarring met 0), `0` (verwarring met O), `I` (verwarring met l/1), `L` (verwarring met I/1), `1` (verwarring met l/I) |
| Mogelijke codes | 32^6 = 1.073.741.824 (~1 miljard) |
| Generatie | Cryptographically random (`crypto.randomBytes`) |
| Uniekheid | Server controleert tegen actieve rooms (collision = regenerate) |

**Code generatie:**

```typescript
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}
```

### 7.3 QR Code Generatie

- Client-side QR generatie via `qrcode` npm package (geen server call nodig).
- QR bevat de volledige invite URL.
- QR code wordt getoond als overlay/modal.
- Gebruik case: speler toont QR code aan iemand in dezelfde ruimte (LAN party, evenement).

### 7.4 Kopieer-naar-Clipboard

```typescript
async function copyInviteLink(roomCode: string) {
  const url = `https://theuws.com/games/reign-of-brabant/?join=${roomCode}`;

  try {
    await navigator.clipboard.writeText(url);
    showToast('Link gekopieerd!'); // Subtiele bevestiging
  } catch {
    // Fallback voor browsers zonder Clipboard API
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('Link gekopieerd!');
  }
}
```

### 7.5 Join via Link Flow

```
Vriend ontvangt link: theuws.com/games/reign-of-brabant/?join=BRK7M3
       ↓
Browser laadt de game
       ↓
Client detecteert ?join= parameter
       ↓
Client vraagt om naam (simpele input; GEEN account/login vereist)
  ┌──────────────────────────────────┐
  │  Je bent uitgenodigd!            │
  │                                  │
  │  Jouw naam: [____________]      │
  │                                  │
  │  [Deelnemen]                     │
  └──────────────────────────────────┘
       ↓
Client stuurt join request naar Colyseus met room code
       ↓
Server valideert:
  - Room bestaat?
  - Room is niet vol?
  - Room is niet verlopen?
  - Wachtwoord correct? (als vereist)
       ↓
Speler verschijnt in de lobby
```

**Geen account nodig:**
- Spelers worden geidentificeerd door sessie (sessionStorage).
- Naam wordt opgeslagen in localStorage voor hergebruik.
- ELO wordt gekoppeld aan een fingerprint (localStorage ID + browser fingerprint). Niet waterdicht, maar goed genoeg voor een casual browser game.

### 7.6 Link Expiry

| Parameter | Waarde |
|-----------|--------|
| Verlooptijd | 30 minuten na aanmaak |
| Verlenging | Elke keer dat een nieuwe speler joint, wordt de timer NIET gereset |
| Na verlopen | Link werkt niet meer; "Deze uitnodiging is verlopen" melding |
| Lobby leeft door | De lobby zelf blijft bestaan zolang er spelers in zitten; alleen de LINK verloopt |
| Nieuwe link | Host kan een nieuwe link genereren (nieuwe code) als de oude verloopt |

### 7.7 Max Spelers per Room

| Game mode | Max players | Max spectators | Totaal |
|-----------|------------|----------------|--------|
| 1v1 | 2 | 4 | 6 |
| 2v2 | 4 | 4 | 8 |
| FFA | 4 | 4 | 8 |
| Co-op vs AI | 4 | 4 | 8 |
| Carnavalsmode | 4 | 4 | 8 |

### 7.8 Host Migration

**Wanneer de host de lobby verlaat (voor game start):**

1. Server detecteert host disconnect.
2. Server wijst automatisch een nieuwe host aan:
   - Prioriteit: langst aanwezige speler.
3. Nieuwe host krijgt host-privileges (settings wijzigen, kicken, starten).
4. Alle spelers ontvangen een melding: "[Nieuwe Host] is nu de host."
5. Lobby settings blijven behouden.

**Wanneer de host disconnect TIJDENS het spel:**
- Geen host migration nodig. De server is de autoriteit.
- Het spel gaat gewoon door (host = gewoon een speler voor de server).
- Host's disconnect wordt behandeld als normale disconnect (sectie 5.3).

### 7.9 Private vs Public Games

| Type | Game Browser | Join via link | Join via code | Wachtwoord |
|------|-------------|--------------|---------------|------------|
| **Public** | Ja, zichtbaar | Ja | Ja | Optioneel |
| **Private** | Nee, niet zichtbaar | Ja (enige manier) | Ja, als je de code kent | Optioneel |

**Default**: Private. Spelers moeten bewust kiezen om hun game publiek te maken.

### 7.10 Wachtwoord-optie

- Host kan een wachtwoord instellen (max 20 karakters).
- Bij join: client toont wachtwoord-prompt VOOR het joinen.
- Server valideert het wachtwoord. Fout = "Verkeerd wachtwoord" melding.
- Wachtwoord wordt NIET verstuurd naar clients (server-side check only).
- Wachtwoord wordt NIET opgeslagen na het spel (in-memory only).

---

## 8. Leaderboard & Stats

### 8.1 ELO Rating Systeem

**Gebaseerd op het standaard ELO systeem (FIDE-variant):**

| Parameter | Waarde |
|-----------|--------|
| Start ELO | 1000 |
| K-factor (< 30 games) | 40 (snelle kalibratie) |
| K-factor (30-100 games) | 20 (standaard) |
| K-factor (> 100 games) | 10 (stabiel) |
| Minimum ELO | 100 (kan niet lager) |
| Maximum ELO | 3000 (theoretisch) |

**ELO berekening:**

```
Expected score: E = 1 / (1 + 10^((opponent_elo - player_elo) / 400))
New ELO: new_elo = old_elo + K * (actual - expected)
  actual = 1.0 (win), 0.5 (draw), 0.0 (loss)
```

**Voorbeeld:**
- Speler A (ELO 1200) vs Speler B (ELO 1000)
- E_A = 1 / (1 + 10^(-200/400)) = 0.76
- A wint: new_A = 1200 + 20 * (1.0 - 0.76) = 1200 + 4.8 = 1205
- B verliest: new_B = 1000 + 20 * (0.0 - 0.24) = 1000 - 4.8 = 995

**ELO per game mode:**
- 1v1 Ranked: eigen ELO
- 2v2 Ranked: team ELO (gemiddelde van beide spelers)
- FFA/Carnavalsmode: geen ELO impact (unranked)
- Co-op vs AI: geen ELO impact

### 8.2 Win/Loss/Draw Tracking

**Per speler opgeslagen:**

```typescript
interface PlayerStats {
  playerId: string;
  name: string;
  elo: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  abandons: number;
  winStreak: number;        // huidige win streak
  bestWinStreak: number;    // alltime best
  totalPlaytimeMinutes: number;

  // Per factie
  factionStats: {
    [factionId: number]: {
      gamesPlayed: number;
      wins: number;
      losses: number;
    }
  };

  // Lifetime stats
  totalUnitsProduced: number;
  totalUnitsLost: number;
  totalUnitsKilled: number;
  totalBuildingsBuilt: number;
  totalBuildingsDestroyed: number;
  totalResourcesGathered: number;
  totalHeroesSummoned: number;
  totalAbilitiesUsed: number;
  fastestWinSeconds: number;
  longestGameSeconds: number;
}
```

**Draw conditie:**
- Beide Town Halls vernietigd in dezelfde tick (extreem zeldzaam).
- Beide spelers surrenderen tegelijk (niet mogelijk door sequentieel verwerken).
- Game timer verloopt (alleen in Carnavalsmode, en dan wint de speler met de meeste punten).

### 8.3 Factie Winrate Statistieken

Globale statistieken (alle spelers geaggregeerd):

| Statistiek | Beschrijving |
|-----------|-------------|
| Factie winrate | % wins per factie (overall) |
| Factie winrate per ELO bracket | Winrate per factie bij <1000, 1000-1500, 1500+ ELO |
| Factie matchup winrate | Winrate per factie vs elke andere factie (4x4 matrix) |
| Populairste factie | Meest gekozen factie |
| Gemiddelde game duration per factie | Welke facties leiden tot langere/kortere games |

Dit is waardevol voor balancing. Als Brabanders 65% winrate hebben tegen Randstad, moeten we de balans aanpassen.

### 8.4 Backend: PHP/SQLite (Bestaand Systeem)

Het leaderboard backend gebruikt hetzelfde patroon als het Wolfenstein 3D leaderboard:

**Endpoint**: `https://theuws.com/games/reign-of-brabant/api/`

**API routes:**

| Method | Endpoint | Beschrijving |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Top 100 spelers gesorteerd op ELO |
| GET | `/api/leaderboard?faction=1` | Top 100 per factie |
| GET | `/api/player/:id` | Speler profiel + stats |
| POST | `/api/game-result` | Game resultaat registreren (alleen vanuit Colyseus server) |
| GET | `/api/stats/global` | Globale statistieken (factie winrates, etc.) |

**SQLite schema:**

```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,              -- fingerprint-based ID
  name TEXT NOT NULL,
  elo INTEGER DEFAULT 1000,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  abandons INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  total_playtime_minutes INTEGER DEFAULT 0,
  total_units_produced INTEGER DEFAULT 0,
  total_units_killed INTEGER DEFAULT 0,
  total_buildings_destroyed INTEGER DEFAULT 0,
  total_resources_gathered INTEGER DEFAULT 0,
  fastest_win_seconds INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faction_stats (
  player_id TEXT NOT NULL,
  faction_id INTEGER NOT NULL,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  PRIMARY KEY (player_id, faction_id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE game_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_code TEXT NOT NULL,
  game_mode TEXT NOT NULL,            -- '1v1', '2v2', 'ffa', 'coop', 'carnaval'
  map_id TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_players (
  game_id INTEGER NOT NULL,
  player_id TEXT NOT NULL,
  faction_id INTEGER NOT NULL,
  team INTEGER DEFAULT 0,
  result TEXT NOT NULL,               -- 'win', 'loss', 'draw', 'abandon'
  elo_before INTEGER NOT NULL,
  elo_after INTEGER NOT NULL,
  units_produced INTEGER DEFAULT 0,
  units_killed INTEGER DEFAULT 0,
  buildings_built INTEGER DEFAULT 0,
  buildings_destroyed INTEGER DEFAULT 0,
  resources_gathered INTEGER DEFAULT 0,
  PRIMARY KEY (game_id, player_id),
  FOREIGN KEY (game_id) REFERENCES game_results(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX idx_players_elo ON players(elo DESC);
CREATE INDEX idx_game_results_created ON game_results(created_at DESC);
```

**Authenticatie voor POST:**
- De Colyseus server stuurt game results naar de PHP API met een shared secret (API key in environment variable).
- Clients kunnen NOOIT direct game results posten.

### 8.5 Leaderboard UI

In-game leaderboard tab:

```
┌─────────────────────────────────────────────────────────┐
│  LEADERBOARD                    [1v1] [2v2] [Alle]     │
│                                                         │
│  #   Naam              ELO    W/L      Favoriete Factie │
│  1.  BrabantseJansen   1847   142/31   Brabanders       │
│  2.  VlaaiMeester      1792   98/27    Limburgers       │
│  3.  FrietjesMansen    1756   76/22    Belgen           │
│  4.  DeConsultant      1701   64/28    Randstad         │
│  5.  CarnavalKansen    1688   53/19    Brabanders       │
│  ...                                                    │
│  42. JIJ → RichardT    1234   12/8     Brabanders       │
│                                                         │
│  [Vorige]  Pagina 1 van 5  [Volgende]                  │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Chat & Communicatie

### 9.1 In-Game Text Chat

**Chat channels:**

| Channel | Wie ziet het | Wanneer beschikbaar |
|---------|-------------|---------------------|
| **All** | Alle spelers + spectators | Altijd |
| **Team** | Alleen teamgenoten | Alleen in 2v2 |
| **Spectator** | Alleen spectators | Alleen spectators |

**Chat UI:**
- Semi-transparant overlay rechtsonder (zoals standaard RTS chat).
- Enter = open chat input.
- Tab = wissel channel (All / Team).
- Messages verdwijnen na 10 seconden (maar scrollbaar in chat history).
- Max message lengte: 200 karakters.
- Profanity filter: basis woordenlijst (Nederlands + Engels). Optioneel, host kan uitschakelen.

**Chat via Colyseus:**

```typescript
// Client → Server
client.send('CHAT', {
  channel: 'all',    // 'all' | 'team' | 'spectator'
  message: 'GG!'
});

// Server → Clients (na validatie)
// Server controleert: message lengte, rate limit (max 5 berichten per 10 sec), channel access
room.broadcast('CHAT', {
  sender: playerName,
  channel: 'all',
  message: 'GG!',
  timestamp: Date.now()
});
```

### 9.2 Ping Systeem

Spelers kunnen pingen op de minimap of de game wereld:

**Ping types:**

| Ping | Kleur | Geluid | Betekenis |
|------|-------|--------|-----------|
| **Alert** | Rood | Urgente ping | "Gevaar hier!" / "Aanval!" |
| **Help** | Geel | Zachte ping | "Help hier!" |
| **On My Way** | Groen | Bliep | "Ik kom eraan!" |
| **Gather Here** | Blauw | Ding | "Verzamel hier" |

**Ping mechanica:**
- Alt + klik op minimap of game wereld = Alert ping (default).
- Ping wheel: houd Alt ingedrukt + klik = toon ping type selectie.
- Rate limit: max 3 pings per 10 seconden.
- Ping verdwijnt na 5 seconden (visueel + minimap indicator).
- Ping is ALLEEN zichtbaar voor teamgenoten (niet voor vijanden).

**Ping data:**

```typescript
interface PingEvent {
  type: 'alert' | 'help' | 'omw' | 'gather';
  x: number;
  z: number;
  sender: string;   // player name
  timestamp: number;
}
```

### 9.3 Preset Messages (Quick Chat)

Snelle berichten via functietoetsen (F5-F8):

| Toets | Bericht | Situatie |
|-------|---------|---------|
| F5 | "Help!" | Wanneer aangevallen |
| F6 | "Aanval hier!" | Coordinatie |
| F7 | "GG" | Einde spel |
| F8 | "ALAAF!" | Altijd (Brabants) |
| F9 | "Ik geef me over..." | Pre-surrender |
| F10 | "Worstenbroodje?" | Humor / truce aanbod |

**Preset messages zijn:**
- Automatisch vertaald (toekomstige overweging).
- Niet onderhevig aan profanity filter.
- Rate limited: max 3 per 10 seconden (zelfde als pings).
- Zichtbaar als chat bericht met een speciaal icoon.

### 9.4 Post-Game Chat

Na het spel:

```
┌─────────────────────────────────────────────────────────┐
│  GAME OVER — Brabanders winnen!                        │
│                                                         │
│  Speler 1 (Brabanders) — WINNAAR                       │
│  Score: 1500 | Units: 47 killed, 12 lost               │
│                                                         │
│  Speler 2 (Randstad) — VERLIEZER                       │
│  Score: 800 | Units: 12 killed, 47 lost                │
│                                                         │
│  ─────────────────────────────────────────              │
│  Chat:                                                  │
│  [Speler2]: GG, die tractors zijn OP                   │
│  [Speler1]: ALAAF!                                     │
│  [Speler1]: Haha nee, je had me bijna met die siege    │
│                                                         │
│  [Terug naar menu]  [Rematch]  [Profiel bekijken]      │
└─────────────────────────────────────────────────────────┘
```

**Post-game lobby:**
- Alle spelers blijven in de room na game over.
- Chat is open (All channel only).
- "Rematch" knop: creeeert een nieuwe lobby met dezelfde settings en dezelfde spelers.
- Lobby sluit na 5 minuten inactiviteit of wanneer alle spelers vertrekken.

---

## 10. Edge Cases

### 10.1 Speler met Lage FPS

**Probleem**: Een speler draait op 15 FPS terwijl de ander op 60 FPS speelt.

**Impact**: GEEN impact op gameplay fairness.
- De server simuleert op 10 Hz, onafhankelijk van client FPS.
- Een speler met 15 FPS ontvangt dezelfde state updates als een speler met 60 FPS.
- Het verschil is PUUR visueel: smooth animaties vs choppy animaties.
- Commands worden even snel verwerkt (netwerk latency, niet FPS, bepaalt snelheid).

**Mitigatie:**
- Client detecteert lage FPS (< 30 gemiddeld over 10 seconden).
- Auto quality reduction: lagere Three.js render settings (minder schaduwen, lagere texture resolutie, minder particles).
- UI indicator: "Lage prestaties — grafische instellingen verlaagd."

### 10.2 Server Crash Mid-Game

**Probleem**: De Colyseus server crasht of herstart midden in een game.

**Mitigatie:**

1. **State persistence**: Elke 60 seconden schrijft de server een full state snapshot naar disk (SQLite of JSON file).
2. **PM2/Docker restart**: Server herstart automatisch na crash.
3. **State recovery**: Bij herstart laadt de server opgeslagen snapshots en probeert rooms te herstellen.
4. **Client reconnection**: Clients detecteren disconnect en proberen automatisch te reconnecten (max 3 pogingen, 5 seconden interval).
5. **Recovery flow**:
   - Server herstart (< 10 seconden)
   - Server laadt laatste snapshot
   - Clients reconnecten
   - Server stuurt full state sync
   - Game hervat (met max 60 seconden verloren data)
6. **Worst case**: Als recovery faalt, worden alle actieve games als "no contest" geeindigd (geen ELO impact).

**Monitoring:**
- Docker healthcheck elke 30 seconden.
- M1 externe monitor checkt elke 15 minuten of de Colyseus container draait.
- Alert via n8n workflow bij downtime > 2 minuten.

### 10.3 Extreme Unit Count Asymmetrie (100 vs 5)

**Probleem**: Een speler heeft 100 units, de ander 5. De 100-unit speler genereert 20x meer state updates.

**Impact op performance:**

| Metric | 100 units | 5 units | Totaal |
|--------|----------|---------|--------|
| State updates per tick | ~100 unit deltas | ~5 unit deltas | ~105 |
| Bandbreedte per tick | ~2 KB | ~0.1 KB | ~2.1 KB |
| Server CPU per tick | ~2ms (pathfinding, combat) | ~0.1ms | ~2.1ms |

**Mitigatie:**
- Population cap (100) voorkomt extreme gevallen (200+ units).
- Fog of war filtering: de 5-unit speler ontvangt NIET alle 100 vijandelijke unit states. Alleen zichtbare units.
- Als de 5-unit speler geen zicht heeft op de 100-unit army: hij ontvangt 0 vijandelijke unit updates. Minimale bandbreedte.
- Delta compression: stilstaande units genereren geen updates.

**Conclusie**: Dit scenario is een gameplay probleem (een speler verliest), niet een technisch probleem.

### 10.4 Tie (Beide Town Halls Vernietigd)

**Scenario**: Speler A stuurt siege naar B's Town Hall. Speler B stuurt siege naar A's Town Hall. Beide worden vernietigd.

**Server resolution:**
1. Server simuleert sequentieel per tick. Binnen een tick zijn alle acties simultaan.
2. Als beide Town Halls in dezelfde tick vernietigd worden: **Draw**.
3. ELO berekening: actual = 0.5 voor beide spelers.
4. Stats: beide krijgen +1 draw.

**Alternatieve win condities (als ingeschakeld door host):**
- "Alle gebouwen" modus: Town Hall is niet de enige win conditie. Pas als ALLE gebouwen vernietigd zijn, verlies je.
- "Regicide" modus: verlies als je Hero sterft (niet respawn). Town Hall irrelevant.

### 10.5 Mobile Browser Focus/Tab Switch

**iOS Safari specifiek:**
- Safari pauzeert WebSocket verbindingen na ~30 seconden op de achtergrond.
- `visibilitychange` event wordt gefired.
- Oplossing: bij `visibilitychange` naar hidden, toon een overlay bij terugkeer: "Verbinding herstellen..." en request full state sync.

**Android Chrome:**
- Chrome houdt WebSocket verbindingen langer open (tot ~5 minuten).
- Maar: `requestAnimationFrame` stopt.
- Oplossing: zelfde als iOS, maar de reconnectie is sneller.

**PWA / fullscreen:**
- Als de game als PWA of in fullscreen draait, is tab switch minder problematisch.
- Maar: home button op mobile = altijd achtergrond.

**Concrete implementatie:**

```typescript
let lastVisibleTimestamp = Date.now();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    lastVisibleTimestamp = Date.now();
  } else {
    const awayTime = Date.now() - lastVisibleTimestamp;

    if (awayTime > 5000) {
      // Meer dan 5 seconden weg: waarschijnlijk disconnected
      showOverlay('Verbinding herstellen...');

      if (client.readyState === WebSocket.OPEN) {
        // WebSocket nog open: vraag state sync
        client.send('REQUEST_FULL_STATE');
        hideOverlay();
      } else {
        // WebSocket dicht: reconnect
        attemptReconnect();
      }
    }
    // Minder dan 5 seconden: negeer (was waarschijnlijk een notificatie)
  }
});
```

### 10.6 iOS Safari WebSocket Disconnects op Background

Dit is een berucht probleem. iOS Safari sluit WebSocket verbindingen agressief op de achtergrond.

**Mitigatie strategie:**

1. **Detectie**: `visibilitychange` + WebSocket `onclose` event.
2. **Informatie**: Bij game start op iOS, toon een melding: "Tip: houd deze tab op de voorgrond voor de beste ervaring."
3. **Reconnection**: Automatische reconnect bij terugkeer (zie sectie 5.2).
4. **State recovery**: Full state sync na reconnect.
5. **AI takeover**: Tijdens disconnect neemt AI het over (30 seconden grace period voordat de disconnect timer start).

**iOS-specifieke workaround:**
- Gebruik een Web Worker voor de WebSocket verbinding (Web Workers worden minder agressief gepauzeerd op sommige iOS versies).
- Ping de server elke seconde (i.p.v. elke 2 seconden) op iOS om de verbinding warm te houden.
- `navigator.userAgent` check voor iOS detectie.

### 10.7 Adblock / CSP Issues

**Probleem**: Sommige adblockers blokkeren WebSocket verbindingen naar onbekende domeinen.

**Mitigatie:**

| Maatregel | Detail |
|-----------|--------|
| **Same-origin WebSocket** | WebSocket server op `wss://theuws.com/games-ws/` (zelfde domein als de game). Dit voorkomt cross-origin blocking. |
| **Fallback URL** | Als `wss://theuws.com/games-ws/` faalt, probeer direct IP (alleen voor development). |
| **CSP headers** | Game pagina bevat correcte CSP headers: `connect-src 'self' wss://theuws.com wss://games-api.theuws.com` |
| **Detectie** | Bij WebSocket connect failure, toon een melding: "Kan geen verbinding maken. Controleer of je adblocker WebSocket verbindingen toestaat." |
| **Troubleshoot pagina** | Link naar een help pagina met instructies per populaire adblocker. |

**CDN/asset blocking:**
- Alle game assets worden gehost op hetzelfde domein (`theuws.com/games/reign-of-brabant/`).
- Geen externe CDN afhankelijkheden voor kritische game assets.
- Three.js wordt lokaal gehost (niet via CDN).

### 10.8 Simultane Disconnects (Alle Spelers)

**Scenario**: Server-side netwerk issue; alle spelers disconnecten tegelijk.

**Server gedrag:**
- Server detecteert dat alle clients disconnected zijn.
- Server pauzeert de game simulatie (geen reden om door te simuleren).
- Reconnection timers starten voor alle spelers.
- Als GEEN speler reconnect binnen 180 seconden: game wordt gecanceld (no contest).
- Als sommige spelers reconnecten: game hervat, niet-reconnected spelers worden behandeld als disconnected (sectie 5.3).

### 10.9 Map Exploits (Building Outside Bounds)

**Probleem**: Client stuurt een BUILD command met coordinaten buiten de speelbare map.

**Mitigatie:**
- Server valideert ALLE coordinaten tegen map bounds.
- Server valideert tegen navmesh (moet begaanbaar terrein zijn).
- Server valideert minimum afstand tot map edges (5 units buffer).
- Bij invalid: command rejected, incident gelogd.

### 10.10 Browser Memory Exhaustion

**Probleem**: Na 30+ minuten gameplay, browser memory groeit tot GB+, tab crasht.

**Mitigatie:**
- Object pooling voor units, projectielen, en particle effects (geen `new` in de game loop).
- Dispose Three.js geometries en materials bij unit death (na death animation).
- Maximum particle count: 500 globaal.
- State history: client bewaart GEEN oude state frames (alleen huidige + vorige voor interpolatie).
- Memory monitoring: `performance.memory` (Chrome only) check elke 60 seconden. Bij > 1 GB: force garbage collection hint + verlaag kwaliteit.

---

## Appendix A: Protocol Message Catalogue

### Client → Server

| Message | Payload | Rate limit |
|---------|---------|------------|
| `COMMAND` | `GameCommand` object | 30/sec |
| `CHAT` | `{ channel, message }` | 5/10sec |
| `PING_MAP` | `{ type, x, z }` | 3/10sec |
| `READY` | `{ ready: boolean }` | 2/sec |
| `SELECT_FACTION` | `{ faction: number }` | 2/sec |
| `KICK_PLAYER` | `{ sessionId }` (host only) | 1/sec |
| `CHANGE_SETTINGS` | `{ settings }` (host only) | 1/sec |
| `SURRENDER` | `{}` | 1/game |
| `PLAYER_AFK` | `{ afk: boolean }` | 1/sec |
| `REQUEST_FULL_STATE` | `{}` | 1/30sec |

### Server → Client

| Message | Payload | Rate |
|---------|---------|------|
| State delta | Automatic Colyseus Schema patch | 10 Hz |
| `COMMAND_REJECTED` | `{ commandType, reason }` | Per event |
| `CHAT` | `{ sender, channel, message, timestamp }` | Per event |
| `PING_MAP` | `{ sender, type, x, z }` | Per event |
| `PLAYER_JOINED` | `{ name, sessionId }` | Per event |
| `PLAYER_LEFT` | `{ name, reason }` | Per event |
| `PLAYER_DISCONNECTED` | `{ name, timeout }` | Per event |
| `PLAYER_RECONNECTED` | `{ name }` | Per event |
| `GAME_STARTED` | `{ countdown: number }` | Once |
| `GAME_OVER` | `{ winner, stats }` | Once |
| `CARNAVAL_EVENT` | `{ eventType, duration, params }` | Per event |
| `FULL_STATE` | Complete state snapshot | On request |

---

## Appendix B: Bandbreedte Budget

**Scenario: 4-player FFA, elk 50 units, 10 gebouwen**

| Data | Per tick (100ms) | Per seconde | Richting |
|------|-----------------|-------------|----------|
| Unit deltas (50 moving units, 12 bytes/unit) | 600 bytes | 6 KB | Server → Client |
| Building deltas (2 changed) | 40 bytes | 400 bytes | Server → Client |
| Resource deltas (4 players) | 32 bytes | 320 bytes | Server → Client |
| Fog of war filtered units | -(50% gefilterd) | -3 KB | N.v.t. |
| Commands (5 per seconde) | N.v.t. | 200 bytes | Client → Server |
| Chat (1 per 10 sec) | N.v.t. | 20 bytes | Bidirectional |
| **Totaal per client** | | **~4 KB/sec** | |
| **Totaal server upload** | | **~16 KB/sec** (4 clients) | |

Dit is ruim binnen de capaciteit van de M4 server en een gemiddelde thuisverbinding.

---

## Appendix C: Technologie Stack

| Component | Technologie | Versie |
|-----------|------------|--------|
| Game server framework | Colyseus | 0.15+ |
| Runtime | Node.js | 20 LTS |
| State serialization | @colyseus/schema | Latest |
| Transport | WebSocket (ws) | Via Colyseus |
| Database (leaderboard) | SQLite | Via better-sqlite3 |
| API (leaderboard) | PHP 8.x | Bestaand op theuws.com |
| QR code generatie | qrcode (npm) | Client-side |
| Reverse proxy | nginx | Latest |
| TLS | Let's Encrypt | Auto-renewal |
| Process manager | Docker | Op M4 server |
| Monitoring | Docker healthcheck + M1 monitor | Bestaand |

---

## Appendix D: Implementatie Volgorde

| Fase | Scope | Geschatte effort |
|------|-------|-----------------|
| **Fase 1** | Colyseus server setup, lobby systeem, room codes, invite links | 2-3 dagen |
| **Fase 2** | 1v1 game room, state sync, unit movement, fog of war filtering | 3-5 dagen |
| **Fase 3** | Combat resolution, building/training sync, resource sync | 2-3 dagen |
| **Fase 4** | Reconnection, AI takeover, disconnect handling | 1-2 dagen |
| **Fase 5** | Chat, pings, preset messages, post-game screen | 1 dag |
| **Fase 6** | Leaderboard (PHP/SQLite), ELO systeem, stats tracking | 1-2 dagen |
| **Fase 7** | Anti-cheat hardening, rate limiting, logging | 1 dag |
| **Fase 8** | 2v2, FFA, Co-op vs AI, Carnavalsmode | 2-3 dagen |
| **Fase 9** | Spectator mode, game browser | 1-2 dagen |
| **Fase 10** | Edge case handling, mobile fixes, load testing | 2-3 dagen |
| **Totaal** | | **16-25 dagen** |

---

**Einde document**

*Versie 1.0.0 — 2026-04-05*
*Auteur: Game Master (Claude Code)*
*Status: Draft — Wacht op goedkeuring*
