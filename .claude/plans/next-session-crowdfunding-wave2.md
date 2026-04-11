# Volgende Sessie: Crowdfunding Wave 2 — Content + Diepgang

## Prioriteit 1: Landing Page Content (crowdfunding-kritiek)

### Het Verhaal herschrijven
- Verander "3 dagen PoC" framing naar startdatum + ongoing
- "Als ik tijd heb of niet kan slapen werk ik er verder aan" — eerlijk verhaal
- Beschrijf wat er NU gebouwd wordt: 8 heroes met karakter, 25 campaign missies, 4 facties
- Gebruik HERO-CHARACTERS.md als bron voor hero-introductie op de pagina

### Steun sectie updaten
- Reflecteer wat de crowdfunding concreet oplevert
- Kosten eerlijk framen (honderden EUR/maand, niet $50)
- Perks updaten met nieuwe features (stem een karakter, bedenk een missie)

## Prioriteit 2: Hero Portraits in HUD
- HUD.ts heeft `portrait: string | null` field maar is ongebruikt
- Hero portraits bestaan al: hero-prins.webp, hero-ceo.webp, hero-mijnbaas.webp, hero-frietkoning.webp
- Integreer in building card systeem en unit selection panel
- Toon portrait bij hero selectie + ability gebruik

## Prioriteit 3: Map Variatie + Tunnels
- Terrain.ts: voeg bergen, bossen, beekdalen toe als tactische obstakels
- Implementeer tunnel systeem voor Limburg campaign (LumberCamp → tunnel exits)
- Missie 7/10/11 herontwerpen met CAMPAIGN-NARRATIVE.md als basis
- Dynamische wave spawns (variabele richtingen, patrouilles)
- 3 nieuwe terrein types: Knotwilgen, Beekdalen, Heide

## Prioriteit 4: Infrastructuur
- Mollie naar live key switchen (test → productie)
- Discord server aanmaken
- itch.io / IndieDB listings

## Bronnen beschikbaar
- `docs/HERO-CHARACTERS.md` — 8 character sheets met dialoog
- `docs/CAMPAIGN-NARRATIVE.md` — missie verbeteringen, terrein, easter eggs
- `docs/VOICE-DIRECTION.md` — ElevenLabs parameters per hero
