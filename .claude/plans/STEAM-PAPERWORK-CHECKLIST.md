# Steam Paperwork Checklist — Reign of Brabant

**Doel**: alles wat Richard zelf moet regelen bij Steam, parallel aan Sprint 7-9 development.
**Tijd**: ~3-7 kalenderdagen actief werk, 1-3 weken doorlooptijd door externe verificaties.
**Cost**: $100 USD (recoupable bij $1.000 adjusted gross revenue).

---

## Fase 1 — Steamworks Account (1 dag)

### Stap 1.1 — Steamworks partner-account aanvragen
- Ga naar **https://partner.steamgames.com/**
- Log in met Steam-account (overweeg een dedicated `theuws-publisher` account los van je gaming-account, om persoonlijk + zakelijk te scheiden)
- Klik "Sign Up" → kies **Company** (Theuws Consulting BV)
- Vul in:
  - Bedrijfsnaam: **Theuws Consulting BV**
  - KvK-nummer + zakelijk adres
  - Btw-nummer (NL)
  - Telefoonnummer (verificatie via SMS)
  - Email: richard@theuws.com
- **Naam-match KRITIEK**: KvK-naam moet exact matchen met bank-tenaamstelling én Steamworks account-naam. Eén tikfout = verificatie-blocker

### Stap 1.2 — Steam Direct fee
- $100 USD, eenmalig per app
- Betalingsmethoden: credit card, PayPal
- Recoupable: zodra de game $1.000 adjusted gross revenue maakt, krijg je de $100 terug
- **Tip**: niet de fee betalen tot de tax + bank info verified zijn — anders staat geld vast zonder app-ID

---

## Fase 2 — Tax & Bank (1-3 dagen, kan stallen op verificaties)

### Stap 2.1 — Tax interview (W-8BEN-E voor Theuws Consulting BV)
- In Steamworks dashboard → "Tax Information"
- Kies **W-8BEN-E** (entity-versie, niet W-8BEN — die is voor individuele personen)
- Velden om in te vullen:
  - **Name of organization**: Theuws Consulting BV
  - **Country of incorporation**: Netherlands
  - **Chapter 3 status**: "Corporation" (BV is een corporation in IRS-termen)
  - **FATCA status**: meestal "Active NFFE" (Active Non-Financial Foreign Entity) voor een dev-bedrijf zonder financial-services activiteiten
  - **Foreign TIN**: **NL btw-nummer** óf **RSIN** (RSIN heeft voorkeur — staat op KvK-uittreksel)
  - **Treaty claim**: Article 12 (Royalties) — Netherlands-US Tax Treaty → **0% withholding** op royalties
- NL-VS belastingverdrag activeren = anders 30% bronbelasting
- Digitaal ondertekenen door tekenbevoegde (Richard als bestuurder Theuws Consulting BV)

### Stap 2.2 — Bank info
- IBAN (Nederlandse rekening werkt)
- BIC/SWIFT
- Naam moet matchen met Steamworks account-naam
- Verificatie: micro-deposit of direct vanaf je bank
- **Wachttijd**: 1-3 werkdagen voor verificatie

### Stap 2.3 — Optioneel: btw-registratie
- Steam houdt btw zelf in voor consumenten (geen actie nodig voor jou)
- Als je BTW-ondernemer bent, kun je btw-nummer invoeren voor B2B-verkopen
- Voor PWYW-model + Free-to-Play met DLC: standaard consumer-flow is prima

---

## Fase 3 — App aanmaken (na fee + verificatie)

### Stap 3.1 — App-ID aanvragen
- Steamworks dashboard → "Create New Application"
- App-naam: **Reign of Brabant**
- App-type: **Game**
- **Pricing model: Free-to-Play** (BELANGRIJK — niet "Paid")
- App-ID wordt direct toegekend (numeriek, bv. 2845620)
- Schrijf app-ID op — nodig voor SDK init + CI/CD secrets

### Stap 3.2 — Early Access activeren
- App-Settings → "Steam Early Access"
- Vink aan: "This game will release as Early Access"
- Verklaring nodig:
  - **Why Early Access?** → "Reign of Brabant is een live-service RTS in actieve ontwikkeling. We gebruiken Early Access om community-feedback te integreren tijdens de campagne-uitbreidingen en balance-iteraties."
  - **Approximate length of EA?** → "12-18 maanden, met regelmatige updates"
  - **What's the planned full release version?** → "v2.0 — uitgebreide multiplayer, level-editor, Workshop-support"
  - **Current EA state?** → "v1.0 — 4 complete campagnes (40 missies), skirmish 2-4 spelers, 4 facties met unieke units/buildings, Steam Cloud saves, achievements"

### Stap 3.3 — Supporter DLC apps aanmaken (gratis sub-entries)
Dit zijn gratis onder de hoofd-app:
- **DLC #1**: Steunpilaar — €4.99
- **DLC #2**: Brabander voor het Leven — €9.99
- **DLC #3**: Hertog van Brabant — €24.99
- Elk DLC krijgt eigen app-ID maar valt onder de $100 base-fee

---

## Fase 4 — Builder sub-account voor CI/CD (10 minuten)

### Stap 4.1 — Sub-account aanmaken
- Steamworks → "Users & Permissions" → "Add User"
- Naam: `rob-ci-builder`
- Email: **`richard+rob-ci@theuws.com`** (plus-addressing — mail valt in dezelfde inbox, Steam ziet het als uniek adres)
  - Als Steam plus-addressing afwijst: maak een mail-alias aan bij je domain-registrar (1 min werk, route naar `richard@theuws.com`)
- Permissions: **alleen Build/Upload** — geen financial, geen store-page-edit
- Steam Guard activeren met TOTP-app (Google Authenticator / Authy / 1Password)

### Stap 4.2 — Lokaal `config.vdf` seeden voor GitHub Actions
Wordt door Claude/dev-pipeline gedaan zodra app-ID en builder-account er zijn:
1. `steamcmd +login rob-ci-builder <pwd>` lokaal
2. Steam Guard 2FA-code invoeren
3. `~/Library/Application Support/Steam/config/config.vdf` ontstaat
4. `base64 -i config.vdf` → store als GitHub secret `STEAM_CONFIG_VDF`
5. Ook secrets: `STEAM_USERNAME=rob-ci-builder`, `STEAM_APP_ID=<numeric>`

---

## Fase 5 — Store-page assets (parallel werk, geen blocker)

Hoeft niet voor Sprint 7 — kan in week 4-5 parallel met Sprint 8-9.

### Required (Steam-side)
| Asset | Dimensie | Doel |
|-------|----------|------|
| Header capsule | 460×215 | Library, search, recommendations |
| Small capsule | 231×87 | Lijsten |
| Main capsule | 616×353 | Featured carousel |
| Vertical capsule | 374×448 | Mobile, broadcast |
| Library capsule | 600×900 | Steam library |
| Library hero | 3840×1240 | Steam library hero-banner |
| Library logo | 1280×720 PNG transparent | Game-logo overlay |
| Page background | 1438×810 | Store-page achtergrond |
| Screenshots | 1920×1080 (5+) | Store-page gallery |
| Trailer | 60s, MP4 H.264, 1080p | Store-page video |

### Recommended (door ons te genereren met fal.ai + Photoshop)
- 5-10 gameplay-screenshots (geen UI-bugs, mooi licht)
- 1 trailer (60s, montage van campagne-momenten + skirmish + voice-lines)
- Store-page tekst NL + EN (about, features, system-requirements)

### System requirements voor Steam-page
**Minimum**:
- OS: Windows 10 64-bit
- CPU: Intel i3-6100 / AMD FX-8350 of equivalent
- RAM: 4 GB
- GPU: Integrated Intel UHD 620 / AMD Vega 8 (WebGL2 support)
- Storage: 500 MB
- Network: Niet vereist (single-player)

**Recommended**:
- OS: Windows 11 64-bit
- CPU: Intel i5-10400 / AMD Ryzen 5 3600
- RAM: 8 GB
- GPU: Dedicated 4GB VRAM (GTX 1650 / RX 580)
- Storage: 1 GB

---

## Fase 6 — Submit voor review (na alle bovenstaande klaar)

### Stap 6.1 — Build review
- Upload eerste Electron-build via SteamPipe (CI of handmatig)
- Steam reviewt: 1-5 werkdagen
- Tests: anti-virus scan, malware-check, basic launch-test op hun infra

### Stap 6.2 — Store-page review
- Submit store-page voor review
- Steam reviewt: 1-5 werkdagen
- Checks: capsule-art kwaliteit, trailer-content, geen misleidende claims

### Stap 6.3 — 2-week mandatory public window
- Zodra store-page goedgekeurd → **moet 14 dagen public staan vóór release**
- Tijdens deze window: wishlists verzamelen, feedback verwerken
- Je MAG niet eerder releasen, ook al zijn alle reviews door

---

## Fase 7 — Launch day

- Releasenotities op Steam-page
- Cloudflare-purge web-versie + verwijzing naar Steam-page
- Ko-fi-link blijft staan (Steam DLC's én externe donaties)
- Post-launch monitoring: Steam reviews, crash reports, user feedback
- Updates rollen via SteamPipe `beta` branch → handmatige promotie naar `default`

---

## Concrete actie-lijst voor Richard, deze week

### Vandaag of morgen
- [ ] Steamworks Company-account aanvragen op naam **Theuws Consulting BV** (Stap 1.1) — 30 min
- [ ] Tax interview **W-8BEN-E** met RSIN + Article 12 treaty claim (Stap 2.1) — 30 min
- [ ] Zakelijke IBAN invoeren (Stap 2.2) — 10 min, naam-match TC BV verifiëren
- [ ] Documenten klaarleggen: KvK-uittreksel, btw-nummer, RSIN, IBAN-tenaamstelling

### Deze week (zodra tax+bank verified)
- [ ] $100 Direct fee betalen (Stap 1.2)
- [ ] App aanmaken — Free-to-Play, naam "Reign of Brabant" (Stap 3.1)
- [ ] Early Access activeren met EA-tekst (Stap 3.2 — concept-tekst staat hierboven)
- [ ] 3 DLC sub-apps aanmaken (Stap 3.3)

### Volgende week
- [ ] Builder sub-account aanmaken (Stap 4.1)
- [ ] App-ID + credentials delen met Claude voor CI/CD setup

---

## Beslissingen — vastgelegd 2026-05-02

1. **Account type**: **Zakelijk — Theuws Consulting BV**
   - Bij Stap 1.1 kies "Company" ipv "Individual"
   - Vul KvK-nummer + zakelijk adres + zakelijk btw-nummer in
   - W-8BEN-E (entity-versie) ipv W-8BEN
   - Bank info: zakelijke IBAN op naam Theuws Consulting BV
   - Naam-match KRITIEK: KvK-naam = bank-naam = Steamworks account-naam, anders blocking
2. **Builder sub-account email**: **richard@theuws.com**
   - Steam vereist technisch een uniek emailadres per sub-account. Workarounds:
     - **Optie A (preferred)**: gebruik plus-addressing — `richard+rob-ci@theuws.com`. Mail komt direct in dezelfde inbox, Steam ziet het als uniek adres. Werkt op alle moderne mail-servers (Google Workspace, IMAP).
     - **Optie B (fallback)**: als plus-addressing geweigerd wordt door Steam, maak een aparte mail-alias aan in je domain-provider (1 minuut bij meeste registrars).
   - Eindresultaat: alle Steam-mails komen in `richard@theuws.com`-inbox
3. **Game-naam**: **Reign of Brabant** (op Steam-page, in store-listings, in metadata)
4. **EN store-page tekst**: Claude drafted in week 4 — Richard reviewt en past aan op stem/toon

---

## Bij blockers
- Steamworks support: `support@steampowered.com`
- Verificatie-issues: meestal docs-mismatch tussen account-naam en bank-naam
- Tax-issues: NL-fiscalisten kennen Steam meestal niet — vraag Claude voor algemene W-8BEN guidance, raadpleeg fiscalist alleen als BTW-vraag onduidelijk is
