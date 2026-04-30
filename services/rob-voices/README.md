# rob-voices

Voice-file upload microservice voor **Reign of Brabant**. Parallel aan `rob-payments`,
draait standalone op port **3110**, route-prefix `/voice-uploads/*`.

Stack: **Bun + TypeScript** (geen Express — Bun's native `Bun.serve` + `request.formData()`).
Storage: filesysteem (geen DB), JSON-metadata met atomic temp-file rename.

---

## Endpoints

| Methode | Pad                                              | Doel                                  |
|---------|--------------------------------------------------|---------------------------------------|
| `POST`  | `/voice-uploads/api/submit`                      | Multipart upload (file + metadata)    |
| `GET`   | `/voice-uploads/api/list?character=brabant`      | Lijst submissions (geen email exposed)|
| `GET`   | `/voice-uploads/files/:character/:filename`      | Stream audio met juiste content-type  |
| `GET`   | `/voice-uploads/api/health`                      | `{ ok, submissions, uptime }`         |

### Constraints
- Max upload: **50 MB** (`413` als overschreden)
- Rate-limit: **5 uploads / uur / IP** (in-memory sliding window, cleanup 5 min)
- Allowed extensies: `.m4a` `.mp3` `.wav` `.ogg`
- Allowed characters: `brabant` `limburg-male` `limburg-female` `randstad-male` `randstad-female` `belgen-male` `belgen-female`
- CORS: `https://reign-of-brabant.nl` + `http://localhost:5173`
- `submitterName` 2-50 chars, HTML-tekens gestript
- Path-traversal verdediging op `/files/...` route

### Voorbeeld submit response
```json
{ "ok": true, "id": "uuid-v4", "filename": "richard_2026-04-30T12-34-56-789Z.m4a", "character": "brabant" }
```

### Storage layout
```
DATA_DIR/
  brabant/                 richard_2026-04-30T12-34-56-789Z.m4a
  limburg-male/            ...
  ...
  submissions.json         [{ id, character, submitterName, email?, filename, size, uploadedAt }, ...]
```

Atomic write: read → modify → schrijf naar `submissions.json.tmp` → `rename`. Calls geserialiseerd via promise-chain.

---

## Lokaal runnen (zonder Docker)

```bash
cd services/rob-voices
bun install
bun run src/server.ts
# → [rob-voices] listening on :3110 — DATA_DIR=/abs/path/services/rob-voices/uploads
```

Test:
```bash
curl http://localhost:3110/voice-uploads/api/health

curl -F "file=@sample.m4a" \
     -F "character=brabant" \
     -F "submitterName=Richard" \
     -F "email=richard@theuws.com" \
     http://localhost:3110/voice-uploads/api/submit

curl "http://localhost:3110/voice-uploads/api/list?character=brabant"
```

Env-vars (allemaal optioneel):
| Var          | Default                | Beschrijving                           |
|--------------|------------------------|----------------------------------------|
| `PORT`       | `3110`                 | HTTP port                              |
| `DATA_DIR`   | `./uploads`            | Storage root (binnen container `/data`)|
| `NODE_ENV`   | —                      | `production` voor minimale logging     |

---

## Deploy op M4 (server-mini)

### 1. Maak host-volume klaar
```bash
ssh server-mini "sudo mkdir -p /Users/Shared/srv/docker/rob-voices/uploads && \
                 sudo chown -R $USER /Users/Shared/srv/docker/rob-voices"
```

### 2. Sync source naar M4
TCC-beperking: SSH heeft geen toegang tot `~/Documents`. Workaround:
```bash
# Op MacBook: stage in /tmp via Screen Sharing → Terminal → cp
cp -R ~/Documents/games/reign-of-brabant/services/rob-voices /tmp/

# Vervolgens vanaf M4:
rsync -av --exclude=node_modules --exclude=uploads \
  /tmp/rob-voices/ /Users/Shared/srv/docker/rob-voices/source/
```
(of: scp/rsync naar een dir die niet onder `~/Documents` valt)

### 3. Build + start
```bash
ssh server-mini
cd /Users/Shared/srv/docker/rob-voices/source
docker compose build
docker compose up -d
docker compose logs -f rob-voices
```

### 4. Verifieer
```bash
curl http://localhost:3110/voice-uploads/api/health
# {"ok":true,"submissions":0,"uptime":12}
```

### 5. Caddy reverse-proxy snippet
Voeg toe aan de Caddyfile op M4 (binnen het bestaande `reign-of-brabant.nl`-blok of als matcher):

```caddy
@rob host reign-of-brabant.nl

handle @rob /voice-uploads/api/* {
    reverse_proxy rob-voices:3110
}
handle @rob /voice-uploads/files/* {
    reverse_proxy rob-voices:3110
}
```

> Caddy moet op het `webnet` Docker-netwerk zitten zodat de container-naam `rob-voices` resolveerbaar is.
> Dit is de bestaande conventie van `rob-payments`.

Reload:
```bash
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### 6. Smoke-test productie
```bash
curl https://reign-of-brabant.nl/voice-uploads/api/health
```

---

## Monitoring & onderhoud

- **Logs**: `docker compose logs -f rob-voices` (alle requests met IP, method, path, status)
- **Storage**: `du -sh /Users/Shared/srv/docker/rob-voices/uploads`
- **Submissions count**: `curl localhost:3110/voice-uploads/api/health | jq .submissions`
- **Backup**: nightly tar van `/Users/Shared/srv/docker/rob-voices/uploads/` (incl. `submissions.json`)

Veiligheidsnotities:
- Email-veld wordt opgeslagen in `submissions.json` maar NIET door `/api/list` geretourneerd
- Bestanden zijn publiek leesbaar via `/files/...` — gebruik niet voor privacygevoelige content
- Rate-limit is per IP en in-memory: reset bij container-restart (acceptabel voor MVP)
