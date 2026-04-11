# Server Architecture — Reign of Brabant

**Server**: Mac mini M4 (64GB RAM, 14 cores, 926GB SSD)
**SSH alias**: `server-mini` (Tailscale: 100.65.114.23)
**Last verified**: 2026-04-11

---

## Network Topology

```
                        Internet
                           |
                     [Cloudflare DNS]
                     Proxy enabled (orange cloud)
                           |
                 +---------+---------+
                 |                   |
          reign-of-brabant.nl   analytics.reign-of-brabant.nl
          www.reign-of-brabant.nl
                 |                   |
                 +---+---+-----------+
                     |
              [Cloudflare Tunnel]
              Tunnel ID: fdfcdb26-d6fa-41ac-ac07-f590a384bb81
                     |
            +--------+--------+
            |  cloudflared    |  (Docker container)
            |  No ports       |
            +--------+--------+
                     |
                 [webnet]  (Docker bridge network)
                     |
            +--------+--------+
            |   Caddy :80     |  (Docker container, caddy:2)
            |   auto_https off|  (TLS handled by Cloudflare)
            +--------+--------+
                     |
         +-----------+-----------+
         |                       |
    Static files            Reverse proxy
    (volume mount, :ro)     /api/* requests
         |                       |
  /Users/Shared/srv/www/    +----+----+
  reign-of-brabant/         | rob-payments |
  (file_server)             | :3100        |
                            +--------------+
```

## Request Flow

### Static content (HTML, JS, CSS, assets)

```
Browser
  -> Cloudflare (DNS + CDN + TLS termination)
  -> Cloudflare Tunnel (encrypted)
  -> cloudflared container
  -> caddy:80 (host: reign-of-brabant.nl)
  -> file_server from /Users/Shared/srv/www/reign-of-brabant/
  -> Response with cache headers:
       *.js, *.css, *.wasm: 1 year immutable
       *.glb, *.mp3, *.ogg, *.wav: 30 days
       *.html, /: no-cache, no-store, must-revalidate
```

### Payment API (/api/*)

```
Browser POST /api/payment
  -> Cloudflare -> Tunnel -> cloudflared -> caddy:80
  -> Caddy handle /api/* { reverse_proxy rob-payments:3100 }
  -> rob-payments Express server (Node 20 Alpine)
  -> Mollie API (payment creation)
  -> Returns checkout URL to browser
  -> Browser redirects to Mollie
  -> Mollie webhook POST /api/webhook -> same path -> rob-payments
  -> rob-payments saves donation to /app/data/donations.json
```

### Analytics (analytics.reign-of-brabant.nl)

```
Browser script tag
  -> Cloudflare -> Tunnel -> cloudflared -> caddy:80
  -> Caddy handle @umami { reverse_proxy umami:3000 }
  -> Umami container (ghcr.io/umami-software/umami:postgresql-latest)
  -> umami-db (PostgreSQL 16 Alpine, Docker volume)
```

### Voice Studio (tools.theuws.com/voice-studio/)

```
Browser
  -> Cloudflare -> Tunnel -> cloudflared -> caddy:80
  -> Caddy @voice_studio { uri strip_prefix /voice-studio; reverse_proxy host.docker.internal:3847 }
  -> voice-studio container (port 3847 on host -> 3000 in container)
  -> Data stored in /Users/Shared/srv/voice-studio/data/
```

Note: Voice Studio runs OUTSIDE the webnet network (published port on host). Caddy
reaches it via `host.docker.internal:3847` instead of container name.

---

## Docker Containers (RoB-related)

| Container | Image | Port | Network | Status | Restart Policy |
|-----------|-------|------|---------|--------|----------------|
| `cloudflared` | cloudflare/cloudflared:latest | none | webnet | Up 21h | unless-stopped |
| `caddy-caddy-1` | caddy:2 | 80 (expose only) | webnet | Up 21h | unless-stopped |
| `rob-payments` | node:20-alpine (custom) | 3100 (expose only) | webnet | Up 2h, 0 restarts | unless-stopped |
| `umami` | ghcr.io/umami-software/umami:postgresql-latest | 3000 (expose only) | webnet | Up 21h | unless-stopped |
| `umami-db` | postgres:16-alpine | 5432 (expose only) | webnet | Up 21h, healthy | unless-stopped |
| `voice-studio-voice-studio-1` | custom build | 3847->3000 (host published) | default (not webnet) | Up 5 days | unless-stopped |

### Docker Network: `webnet`

All RoB-related containers (except voice-studio) share the `webnet` external bridge network.
This is also shared with ~28 other containers on this server (theuws.nl, awesomeday.nl, etc.).

The webnet network contains: `caddy-caddy-1`, `cloudflared`, `rob-payments`, `umami`, `umami-db`,
plus all other project containers on the M4.

---

## File Paths and Permissions

### Web root
```
Path:  /Users/Shared/srv/www/reign-of-brabant/
Owner: server:staff
Size:  982 MB
```

| Path | Owner | Permissions | Size |
|------|-------|-------------|------|
| `/Users/Shared/srv/www/reign-of-brabant/` | server:staff | drwxr-xr-x | 982 MB |
| `index.html` | server:staff | -rw-r--r-- (644) | 49 KB |
| `assets/` | server:staff | drwxr-xr-x | 981 MB |
| `play/` | server:staff | drwxr-xr-x | 72 KB |
| `play/index.html` | server:staff | -rw-r--r-- | 73 KB |
| `play/assets` | server:staff | symlink -> `/Users/Shared/srv/www/reign-of-brabant/assets` | - |

The `play/assets` symlink is critical -- the game engine at `/play/` loads assets via relative
paths. The deploy script (`deploy-rob.sh`) recreates this symlink after every rsync.

### Key subdirectories
```
assets/audio/       # Music + SFX + voice lines
assets/models/      # GLB 3D models (heroes, buildings, units)
assets/factions/    # Faction logos and images
assets/portraits/   # HUD hero portraits
assets/og/          # Open Graph images
assets/steun/       # Donation page assets
assets/ui/          # UI sprites and icons
```

### Caddy volume mount
Caddy mounts the entire www directory as read-only:
```yaml
volumes:
  - /Users/Shared/srv/www:/Users/Shared/srv/www:ro
```

### rob-payments
```
Code:     /Users/Shared/srv/docker/rob-payments/
Data:     /Users/Shared/srv/docker/rob-payments/data/ (mounted as /app/data in container)
.env:     /Users/Shared/srv/docker/rob-payments/.env (contains MOLLIE_API_KEY)
```

### Voice Studio
```
Code:     /Users/Shared/srv/voice-studio/
Data:     /Users/Shared/srv/voice-studio/data/
```

### Umami
```
Compose:  /Users/Shared/srv/docker/umami/docker-compose.yml
DB data:  Docker volume `umami-db-data`
```

### Cloudflare Tunnel
```
Config:       /Users/Shared/srv/docker/cloudflared/.cloudflared/config.yml
Credentials:  /Users/Shared/srv/docker/cloudflared/.cloudflared/<tunnel-id>.json
```

---

## Deployment Pipeline

### deploy-rob.sh (from MacBook Pro M5 Pro)

```
Location: ~/Documents/games/deploy-rob.sh
Method:   rsync over SSH (Tailscale)
```

Steps:
1. **Build**: `cd reign-of-brabant && npm run build` -> `dist/`
2. **SSH check**: Verify Tailscale + SSH connectivity
3. **Backup**: `tar -czf` current production to `/Users/Shared/srv/www/backups/`
4. **rsync**: `rsync -avz --delete` from `dist/` to `server-mini:/Users/Shared/srv/www/reign-of-brabant/`
   - Excludes `.DS_Store` and `*.map`
   - `--delete` removes stale files on server
5. **Symlink**: Recreate `play/assets -> /Users/Shared/srv/www/reign-of-brabant/assets`
6. **Verify**: Check `index.html` and `play/index.html` exist
7. **Cache purge**: Cloudflare API purge_everything for zone `b49ad07d...`
8. **Health check**: curl site URL, expect HTTP 200

Rollback: If rsync fails, restore from the backup tarball created in step 3.

### Cloudflare Cache
```
Zone ID:   b49ad07decd377bfe4068f5f1701452e
API Token: Stored in deploy-rob.sh (CF_API_TOKEN variable)
Strategy:  purge_everything after every deploy
```

---

## Disk Usage

| Resource | Size |
|----------|------|
| RoB web root | 982 MB |
| RoB assets/ | 981 MB |
| RoB backups (22 files) | ~14.5 GB (part of 15 GB total backups) |
| Total /Users/Shared | 723 GB used / 926 GB (82% full) |
| Available | 169 GB |

---

## Backup Strategy

### Current state
- **Method**: Tarball snapshot before each deploy (`tar -czf`)
- **Location**: `/Users/Shared/srv/www/backups/`
- **Naming**: `reign-of-brabant.backup-YYYYMMDD-HHMMSS.tar.gz`
- **Count**: 22 RoB backups on disk (2026-04-10 to 2026-04-11)
- **Size per backup**: ~650-784 MB each
- **Total backups dir**: 15 GB (includes tools.theuws.com backups too)
- **Automation**: None -- backups only created by deploy-rob.sh during deployment
- **No scheduled crontab or launchd jobs found**
- **M1 nightly backups**: According to project notes, the M1 runs nightly backup checks,
  but no automated backup configuration was found on the M4 itself

---

## Risks and Single Points of Failure

### Critical risks

1. **Disk space at 82%** -- 22 RoB backups consume ~14.5 GB. Each backup is 650-784 MB.
   At the current pace (~22 deploys over 2 days), disk will fill within weeks.
   **Recommendation**: Add backup rotation (keep last 5 backups, delete older ones).

2. **No backup automation** -- Backups only happen during deploys. If the server disk fails
   between deploys, all data is lost. The `data/donations.json` in rob-payments is
   particularly vulnerable (payment records).
   **Recommendation**: Add nightly backup to M1 or external storage.

3. **Mollie API key in plain text** -- The live Mollie key is stored in:
   - `/Users/Shared/srv/docker/rob-payments/.env` (on server)
   - `deploy-rob.sh` contains the Cloudflare API token in plain text
   **Recommendation**: Move secrets to Docker secrets or a vault. Remove tokens from scripts.

4. **Single cloudflared tunnel** -- All traffic to all domains goes through one tunnel.
   If the tunnel or its container fails, all sites go down simultaneously.
   **Recommendation**: Acceptable for current scale, but monitor tunnel health.

5. **In-memory rate limiting** -- `rob-payments` uses an in-memory Map for rate limiting.
   Restarting the container resets all rate limit state.
   **Recommendation**: Acceptable for donation flow, but be aware.

6. **donations.json file-based storage** -- Payment records are stored in a JSON file
   (`/app/data/donations.json`). No database, no replication, no backup of this specific file
   beyond the full-site backups.
   **Recommendation**: Consider periodic sync of `data/` to a backup location.

### Moderate risks

7. **Shared webnet network** -- All 28+ containers share one Docker bridge network.
   A misconfigured container could theoretically access rob-payments or umami-db.
   **Recommendation**: Consider isolating RoB containers in their own network,
   with only Caddy having access to both.

8. **Caddy has auto_https off** -- TLS is entirely handled by Cloudflare. If someone
   bypasses Cloudflare and hits the server directly, traffic is unencrypted.
   **Recommendation**: Acceptable since the server is behind Tailscale/Cloudflare tunnel
   with no public ports exposed.

9. **Voice Studio outside webnet** -- voice-studio publishes port 3847 on the host.
   Caddy reaches it via `host.docker.internal`. If the host network changes, this breaks.
   **Recommendation**: Move voice-studio to webnet for consistency.

10. **No health monitoring for rob-payments** -- Unlike some other containers that have
    health checks, rob-payments has no Docker HEALTHCHECK configured.
    **Recommendation**: Add a healthcheck hitting `/api/health`.

---

## Recommendations for Deployment Pipeline

### Quick wins

1. **Add backup rotation to deploy-rob.sh**:
   ```bash
   # After creating new backup, keep only last 5
   ssh "$SERVER" "ls -t $BACKUP_DIR/reign-of-brabant.backup-*.tar.gz | tail -n +6 | xargs rm -f"
   ```

2. **Add healthcheck to rob-payments Dockerfile**:
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
     CMD wget -qO- http://localhost:3100/api/health || exit 1
   ```

3. **Remove secrets from deploy-rob.sh** -- Move `CF_API_TOKEN` to `.env` file
   (which is already gitignored).

### Medium-term

4. **Nightly backup of rob-payments data** -- Sync `donations.json` to M1 or
   cloud storage. Even a simple rsync cron job would suffice.

5. **Monitor disk space** -- Add an alert (via the existing Prometheus/Alertmanager
   stack on quantum-edge) when disk exceeds 85%.

6. **Add `www.reign-of-brabant.nl` redirect confirmation** -- The Caddyfile has the
   redirect. Verify Cloudflare DNS has CNAME for both `@` and `www` pointing to the tunnel.

---

## Complete Service Map

```
reign-of-brabant.nl ecosystem:

[MacBook Pro M5 Pro]                    [Mac mini M4 - server-mini]
                                        
deploy-rob.sh ----rsync over SSH---->  /Users/Shared/srv/www/reign-of-brabant/
                                         |
                                         +-- index.html (marketing site)
                                         +-- play/index.html (game)
                                         +-- play/assets -> assets/ (symlink)
                                         +-- assets/ (981 MB: 3D models, audio, images)
                                         +-- het-verhaal/, doneer/, community/, etc.
                                        
                                       /Users/Shared/srv/docker/rob-payments/
                                         +-- server.js (Express, Mollie integration)
                                         +-- data/donations.json
                                        
                                       /Users/Shared/srv/docker/caddy/
                                         +-- Caddyfile (routing rules)
                                        
                                       /Users/Shared/srv/docker/cloudflared/
                                         +-- .cloudflared/config.yml (tunnel routes)
                                        
                                       /Users/Shared/srv/docker/umami/
                                         +-- docker-compose.yml (analytics)
                                        
                                       /Users/Shared/srv/voice-studio/
                                         +-- Voice recording tool (port 3847)
                                        
                                       /Users/Shared/srv/www/backups/
                                         +-- 22 x reign-of-brabant.backup-*.tar.gz

DNS:
  reign-of-brabant.nl          -> Cloudflare Tunnel -> caddy -> static files + rob-payments
  www.reign-of-brabant.nl      -> Cloudflare Tunnel -> caddy -> 301 redirect to non-www
  analytics.reign-of-brabant.nl -> Cloudflare Tunnel -> caddy -> umami:3000
  tools.theuws.com/voice-studio -> Cloudflare Tunnel -> caddy -> host:3847 -> voice-studio
```
