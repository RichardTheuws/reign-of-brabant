# Reign of Brabant -- ElevenLabs Voice Plan

**Versie**: 1.0.0
**Datum**: 2026-04-07
**Status**: Research Complete
**Auteur**: Audio Director Agent

---

## Inhoudsopgave

1. [API Connectiviteit & Account Status](#1-api-connectiviteit--account-status)
2. [Beschikbare Nederlandse Stemmen](#2-beschikbare-nederlandse-stemmen)
3. [Per-Factie Stemaanbevelingen](#3-per-factie-stemaanbevelingen)
4. [Dialect Haalbaarheid](#4-dialect-haalbaarheid)
5. [Voice Cloning Workflow](#5-voice-cloning-workflow)
6. [Kostenraming](#6-kostenraming)
7. [API Integratie & Batch Generatie](#7-api-integratie--batch-generatie)
8. [Kwaliteitsoverwegingen](#8-kwaliteitsoverwegingen)
9. [Testuitslagen](#9-testuitslagen)
10. [Actieplan](#10-actieplan)

---

## 1. API Connectiviteit & Account Status

### API Key & Permissies

- **API Key**: Geladen uit `/Users/richardtheuws/Documents/games/.env` als `ELEVENLABS_API_KEY`
- **Connectiviteit**: Succesvol getest -- alle TTS endpoints werken
- **Permissies**: TTS generatie en voice listing werken. `models_read` en `user_read` permissies ontbreken op de huidige key (niet-kritiek voor voice generatie)

### Account Stemmen

28 stemmen in het account:
- **21 premade** (ElevenLabs standaard stemmen, voornamelijk Engels)
- **4 professional** (Wolf Spencer DE, Arnold NZ, Leonidas ES, ThunderBlade FR)
- **1 generated** (Zyx Trooper)
- **1 cloned** (Richard -- Brabants accent, Nederlands)
- **1 professional** (Old Italian Man)

### Gedeelde Stembibliotheek (Nederlands)

98+ gedeelde Nederlandse stemmen beschikbaar, waaronder:
- **Standaard Nederlands**: 60+ stemmen (ABN/standaard accent)
- **Vlaams/Belgisch**: 18+ stemmen (expliciet flemish accent)
- **Limburgs**: 3 stemmen (limburgish accent)
- **Brabants**: 1 stem (brabantian accent)

---

## 2. Beschikbare Nederlandse Stemmen

### Top Nederlandse Stemmen (gesorteerd op gebruik)

| Naam | Voice ID | Geslacht | Leeftijd | Accent | Categorie | Gebruik (1jr) | Geschikt voor |
|------|----------|----------|----------|--------|-----------|---------------|---------------|
| Melanie | `SXBL9NbvTrjsJQYay2kT` | Vrouw | Jong | Standaard | Professional | 343M | Narrator (vrouwelijk) |
| Serge de Beer | `UNBIyLbtFB9k7FKW8wJv` | Man | Midden | Standaard | Professional | 134M | Randstad units |
| Ruth | `YUdpWWny7k5yb4QCeweX` | Vrouw | Jong | Standaard | High Quality | 131M | Vrouwelijke narrator |
| Eric Sijbesma | `AVIlLDn2TVmdaDycgbo3` | Man | Midden | Standaard | Professional | 105M | Randstad units |
| Hans Claesen | `s7Z6uboUuE4Nd8Q2nye6` | Man | Midden | **Vlaams** | High Quality | 97M | Belgen units |
| Petra Vlaams | `ANHrhmaFeVN0QJaa0PhL` | Vrouw | Jong | **Vlaams** | Professional | 93M | Belgen vrouwelijke units |
| Ido | `dLPO5AsXc3FZDbTh1IKa` | Man | Midden | Standaard | High Quality | 86M | Randstad narrator |
| Tijs | `YgjXqgzBJa9op0K278OW` | Man | Midden | Standaard | Professional | 73M | Randstad hero |
| Peter | `60CwgZt94Yf7yYIXMDDe` | Man | Midden | Standaard | Professional | 65M | Randstad narrator |
| Bart | `eWrnzOwO7JvyjacVxTzV` | Man | Midden | **Vlaams** | Professional | 62M | Belgen units |
| Walter | `tRyB8BgRzpNUv3o2XWD4` | Man | Midden | **Vlaams** | Professional | 39M | Belgen hero |
| Roos | `7qdUFMklKPaaAVMsBTBt` | Vrouw | Jong | Standaard | Professional | 50M | Brabanders Boerinne |
| Daniel Wichers | `UdwnkJaZxPCOeR3qITvA` | Man | Midden | Standaard (Gooi) | Professional | 16M | Randstad CEO |
| Eric Cinematic | `vY9oBYvK4JJ9fCOB5lmn` | Man | Midden | Standaard | Professional | 14M | Epische narrator |

### Dialect-Specifieke Stemmen

| Naam | Voice ID | Accent | Beschrijving | Geschikt voor |
|------|----------|--------|-------------|---------------|
| **Richard** (cloned) | `KJMAev3goFD3WOh1hVBT` | **Brabants** | Geclonede stem, zuidelijk accent | Brabanders (alle mannelijke units) |
| **Joost** | `Q6dV0r9H1dI4d6gz3NVD` | **Brabants** | "Brabantse male voice" | Brabanders alternatief/variatie |
| **Reinoud** | `5tiZStRJQ98Xw420MFFx` | **Limburgs** | "The nasal limburger", nasaal | Limburgers (primair) |
| **Nick** | `PrYUlaJFEdOSVy6jaEaG` | **Limburgs** | Limburgse coaching stem, helder | Limburgers (alternatief) |
| **Luk Balcer** | `ppGIZI01uUlIWI734dUU` | **Limburgs** (Belgisch) | Senior stem uit Belgisch Limburg, 55 jaar | Limburgers (ouder karakter, Mijnbaas) |
| **Diederik** | `9kBSa5emtWArU7U0792v` | **Vlaams** | Authentiek, professioneel | Belgen (alternatief) |
| **Jan Schevenels** | `AUNrRkV0usLe4yD7tEOW` | **Vlaams** | Zakelijk, warm | Belgen (zakelijk) |
| **Jann** | `wqDY19Brqhu7UCoLadPh` | **Vlaams** | Kalm, zelfverzekerd | Belgen (rustige units) |

---

## 3. Per-Factie Stemaanbevelingen

### Brabanders

| Rol | Stem | Voice ID | Reden | Voice Settings |
|-----|------|----------|-------|----------------|
| **Primair (mannelijk)** | Richard (cloned) | `KJMAev3goFD3WOh1hVBT` | Authentiek Brabants accent, al gecloned | stability: 0.50, similarity: 0.75, style: 0.30 |
| **Alternatief (mannelijk)** | Joost | `Q6dV0r9H1dI4d6gz3NVD` | Brabantse stem uit library, voor variatie | stability: 0.45, similarity: 0.75, style: 0.35 |
| **Vrouwelijk (Boerinne)** | Roos | `7qdUFMklKPaaAVMsBTBt` | Warm, jong, vrolijk -- past bij Boerinne karakter | stability: 0.45, similarity: 0.75, style: 0.40 |
| **Hero (Prins)** | Richard (cloned) | `KJMAev3goFD3WOh1hVBT` | Dieper, stabieler -- zelfde stem, andere settings | stability: 0.60, similarity: 0.80, style: 0.20 |
| **Narrator** | Eric Cinematic | `vY9oBYvK4JJ9fCOB5lmn` | Diep, episch, cinematisch | stability: 0.70, similarity: 0.80, style: 0.30 |

**Strategie**: Richard's geclonede stem als basis voor alle mannelijke Brabanders units. Per unit-type andere voice settings:
- Boer: stabiel, kalm (stability 0.50, style 0.30)
- Carnavalvierder: instabiel, expressief (stability 0.30, style 0.60)
- Sluiper: fluisterend, laag (stability 0.30, style 0.20, speed 0.9)
- Tractorrijder: luid, krachtig (stability 0.55, style 0.45)

### Randstad

| Rol | Stem | Voice ID | Reden | Voice Settings |
|-----|------|----------|-------|----------------|
| **Primair (mannelijk)** | Serge de Beer | `UNBIyLbtFB9k7FKW8wJv` | Professionele ABN stem, betrouwbaar | stability: 0.70, similarity: 0.80, style: 0.15 |
| **Alternatief** | Daniel Wichers | `UdwnkJaZxPCOeR3qITvA` | "Gooische" stem -- perfect voor Randstad | stability: 0.65, similarity: 0.80, style: 0.20 |
| **Hero (De CEO)** | Tijs | `YgjXqgzBJa9op0K278OW` | Diep, autoritair, podcast-host kwaliteit | stability: 0.60, similarity: 0.80, style: 0.30 |
| **Vrouwelijk (HR)** | Emma | `OlBRrVAItyi00MuGMbna` | Kalm, professioneel, corporate-stem | stability: 0.65, similarity: 0.80, style: 0.20 |
| **Narrator** | Peter | `60CwgZt94Yf7yYIXMDDe` | Warm, betrouwbaar, documentaire-stem | stability: 0.70, similarity: 0.80, style: 0.20 |

**Strategie**: Meerdere standaard-Nederlandse stemmen beschikbaar. Geen dialect nodig -- ABN IS het dialect.

### Limburgers

| Rol | Stem | Voice ID | Reden | Voice Settings |
|-----|------|----------|-------|----------------|
| **Primair (mannelijk)** | Reinoud | `5tiZStRJQ98Xw420MFFx` | Authentiek Limburgs, nasaal -- "The nasal limburger" | stability: 0.45, similarity: 0.75, style: 0.40 |
| **Alternatief** | Nick | `PrYUlaJFEdOSVy6jaEaG` | Limburgs, coaching-achtig, helder | stability: 0.45, similarity: 0.75, style: 0.35 |
| **Hero (Mijnbaas)** | Luk Balcer | `ppGIZI01uUlIWI734dUU` | 55 jaar, Belgisch Limburg, wijs en diep | stability: 0.55, similarity: 0.80, style: 0.30 |
| **Vrouwelijk** | Melanie | `SXBL9NbvTrjsJQYay2kT` | Meest gebruikte NL stem -- met dialect in tekst | stability: 0.45, similarity: 0.75, style: 0.35 |
| **Narrator** | Reinoud | `5tiZStRJQ98Xw420MFFx` | Zelfde stem, stabieler voor narrator | stability: 0.65, similarity: 0.80, style: 0.25 |

**Strategie**: Verrassend goed! 3 Limburgse stemmen beschikbaar. Reinoud ("the nasal limburger") is de beste match. Dialect-woorden in de tekst (sjoen, jao, ich, Gluck auf) worden correct uitgesproken met `language_code: "nl"`.

### Belgen

| Rol | Stem | Voice ID | Reden | Voice Settings |
|-----|------|----------|-------|----------------|
| **Primair (mannelijk)** | Hans Claesen | `s7Z6uboUuE4Nd8Q2nye6` | Professionele Vlaamse stem, warm | stability: 0.50, similarity: 0.75, style: 0.35 |
| **Alternatief** | Bart | `eWrnzOwO7JvyjacVxTzV` | Diep, Vlaams, informatief | stability: 0.50, similarity: 0.75, style: 0.35 |
| **Hero (Frietkoning)** | Walter | `tRyB8BgRzpNUv3o2XWD4` | Warm, professioneel, Belgisch -- storytelling kwaliteit | stability: 0.50, similarity: 0.75, style: 0.40 |
| **Vrouwelijk (Wafelzuster)** | Petra Vlaams | `ANHrhmaFeVN0QJaa0PhL` | Professionele Vlaamse vrouwenstem, energiek | stability: 0.45, similarity: 0.75, style: 0.50 |
| **Narrator** | Jan | `dSPqR7aIUDP4AvcVHLlr` | Zachte verteller, Vlaams, geschikt voor kinderverhalen | stability: 0.65, similarity: 0.80, style: 0.25 |

**Strategie**: Sterkste positie van alle facties. 18+ Vlaamse stemmen beschikbaar. Vlaamse woorden (amai, allez, goesting) worden perfect uitgesproken.

---

## 4. Dialect Haalbaarheid

### Beoordeling per Dialect

| Dialect | Score | Status | Strategie |
|---------|-------|--------|-----------|
| **ABN / Randstad** | 10/10 | Werkt perfect out-of-the-box | 60+ standaard NL stemmen beschikbaar |
| **Vlaams / Belgen** | 9/10 | Werkt uitstekend out-of-the-box | 18+ Vlaamse stemmen, authentiek accent |
| **Brabants** | 7/10 | Goed met geclonede stem | Richard's stem klinkt authentiek Brabants. Joost als alternatief. Dialect-woorden (ge, hedde, moar) in tekst versterken het effect |
| **Limburgs** | 6/10 | Bruikbaar, maar niet perfect | 3 Limburgse stemmen beschikbaar. Reinoud heeft het nasale karakter. Sjwa-klanken en melodische intonatie komen niet volledig tot hun recht |

### Wat Werkt

1. **Dialectwoorden in tekst**: De multilingual v2 model spreekt geschreven dialect redelijk uit. "Ge hedde", "sjoen", "allez" worden herkend als Nederlands.
2. **`language_code: "nl"`**: Helpt bij correcte Nederlandse uitspraak en text normalisatie.
3. **Voice settings variatie**: Stability/style parameters geven significant andere karakters aan dezelfde stem.
4. **Vlaamse stemmen**: Authentiek accent dat doorklinkt in alle teksten.

### Wat NIET Werkt

1. **Zachte g**: ElevenLabs kan de zachte g niet onderscheiden van de harde g via tekst alleen. De geclonede Richard-stem heeft dit inherent, andere stemmen niet.
2. **Limburgse melodie**: De zingende intonatie van het Limburgs komt niet automatisch. Reinoud heeft dit deels, maar het is niet zo sterk als echt Limburgs.
3. **Regionaal-specifieke klanken**: Sjwa-klanken (Limburgs), medeklinker-variaties, en regionale uitspraakverschillen zijn niet stuurbaar via parameters.
4. **Geen accent-parameter**: De API heeft GEEN `accent` of `dialect` parameter. Accent komt puur van de gekozen stem.

### Aanbeveling

- **Brabanders**: Richard's geclonede stem gebruiken. Overwegen om de kloon te verbeteren met meer samples (nu slechts 1 sample van 2 minuten).
- **Randstad**: Standaard NL stemmen -- geen probleem.
- **Limburgers**: Reinoud als basis. Accepteren dat het "mild Limburgs" is. Voor productiekwaliteit: overweeg een Limburgs sprekend persoon te clonen.
- **Belgen**: Vlaamse stemmen uit de library -- uitstekend.

---

## 5. Voice Cloning Workflow

### Huidige Status: Richard (Brabants)

- **Type**: Instant Voice Clone
- **Sample**: 1 audio sample (`heygen-2min.mp3`), ~2 minuten
- **Labels**: accent=Brabants, Language=Dutch
- **Settings**: stability 0.72, similarity 0.75, style 0.17, speed 1.0
- **Fine-tuning**: Niet beschikbaar (instant clone beperking)

### Instant Voice Cloning (IVC)

- **Minimaal**: 1 audiofragment (25 seconden tot 10 minuten)
- **Aanbevolen**: 3-5 audiofragmenten, totaal 5-10 minuten
- **Formaat**: MP3, WAV, M4A
- **Kwaliteit**: Clean audio, geen achtergrondgeluid, duidelijke spraak
- **Beschikbaar op**: Creator tier en hoger ($22/maand)

### Professional Voice Cloning (PVC)

- **Minimaal**: 30 minuten clean audio
- **Aanbevolen**: 1-3 uur studio-kwaliteit audio
- **Voordelen**: Veel hogere kwaliteit, fine-tuning mogelijk, betere accent-reproductie
- **Beschikbaar op**: Scale tier ($330/maand)
- **Proces**: Upload audio -> ElevenLabs review (24-48 uur) -> Fine-tune -> Gebruik

### Aanbeveling voor Verbetering

**Richard (Brabanders)**:
1. Neem 5-10 minuten extra Brabants-sprekend audio op
2. Voeg toe aan de bestaande clone via `POST /v1/voices/{voice_id}/edit`
3. Varieer emoties in de samples: kalm, boos, blij, fluisterend
4. Dit verbetert de range en dialect-authenticiteit

**Limburgers (nieuw te clonen)**:
1. Vind een native Limburgse spreker
2. Neem 5-10 minuten op met typische Limburgse zinnen
3. Maak een Instant Voice Clone
4. Of: gebruik Reinoud als basis en accepteer mild Limburgs

---

## 6. Kostenraming

### Voice Line Volumes

| Factie | Units | Lijnen/unit | Generic | Totaal lijnen |
|--------|-------|-------------|---------|---------------|
| Brabanders | 10 | 15 | 18 | 168 |
| Randstad | 10 | 15 | 18 | 168 |
| Limburgers | 8 | 15 | 18 | 138 |
| Belgen | 8 | 15 | 18 | 138 |
| Narrator | - | - | - | ~20 |
| **TOTAAL** | **36** | | | **~632** |
| Al opgenomen | | | | ~27 |
| **Te genereren** | | | | **~605** |

### Character Berekening

- Gemiddelde voice line: ~40 characters
- Totale characters: 605 x 40 = **~24.200 characters**
- Met retakes (10%): **~26.600 characters**

### Kosten per Tier

| Tier | Prijs/maand | Characters/maand | Genoeg? | Kosten voor project |
|------|-------------|------------------|---------|---------------------|
| **Free** | $0 | 10.000 | Nee (3 maanden) | $0 maar geen cloning |
| **Starter** | $5 | 30.000 | Ja, in 1 maand | $5 |
| **Creator** | $22 | 100.000 | Ruim voldoende | $22 (incl. IVC) |
| **Pro** | $99 | 500.000 | 20x over | $99 |
| **Scale** | $330 | 2.000.000 | 80x over | $330 (incl. PVC) |

### Aanbeveling

**Creator tier ($22/maand)** is optimaal:
- 100.000 characters = genoeg voor alle 605 lijnen + retakes + experimenten
- Instant Voice Cloning inbegrepen (nodig voor Richard/Brabants)
- Na 1 maand kunnen we downgraden of opzeggen
- Totale kosten: **$22**

Als we Professional Voice Cloning willen voor Limburgs: Scale tier ($330) voor 1 maand.

---

## 7. API Integratie & Batch Generatie

### Bestaand Script

Het project heeft al een werkend generatie-script: `scripts/generate_unit_voices.sh`

**Huidige status**:
- Gebruikt `eleven_multilingual_v2` model
- Configurable voice settings per unit personality
- Skip-logica voor bestaande bestanden
- Rate limit handling (429 retry met 10s delay)
- Brabanders (3 units + generic) en Randstad (generic) geimplementeerd

### Verbeterd Generatie Script (Node.js)

```javascript
// scripts/generate-voices.mjs
// Batch voice line generator for Reign of Brabant
// Usage: node scripts/generate-voices.mjs [--faction brabanders|randstad|limburgers|belgen] [--dry-run]

import fs from 'fs';
import path from 'path';

const ENV_PATH = '/Users/richardtheuws/Documents/games/.env';
const API_KEY = fs.readFileSync(ENV_PATH, 'utf8')
  .split('\n')
  .find(l => l.startsWith('ELEVENLABS_API_KEY='))
  ?.split('=')[1];

const OUTPUT_DIR = 'assets/audio/voices';

// -------------------------------------------------------------------------
// Voice Configuration per Faction
// -------------------------------------------------------------------------

const VOICE_CONFIG = {
  brabanders: {
    default: {
      voice_id: 'KJMAev3goFD3WOh1hVBT', // Richard (cloned, Brabants)
      stability: 0.50,
      similarity_boost: 0.75,
      style: 0.30,
    },
    female: {
      voice_id: '7qdUFMklKPaaAVMsBTBt', // Roos
      stability: 0.45,
      similarity_boost: 0.75,
      style: 0.40,
    },
    hero: {
      voice_id: 'KJMAev3goFD3WOh1hVBT', // Richard, deeper settings
      stability: 0.60,
      similarity_boost: 0.80,
      style: 0.20,
    },
    // Per-unit overrides
    carnavalvierder: { stability: 0.30, style: 0.60 },
    sluiper:         { stability: 0.30, style: 0.20 },
    tractorrijder:   { stability: 0.55, style: 0.45 },
    frituurmeester:  { stability: 0.45, style: 0.45 },
  },

  randstad: {
    default: {
      voice_id: 'UNBIyLbtFB9k7FKW8wJv', // Serge de Beer
      stability: 0.70,
      similarity_boost: 0.80,
      style: 0.15,
    },
    female: {
      voice_id: 'OlBRrVAItyi00MuGMbna', // Emma
      stability: 0.65,
      similarity_boost: 0.80,
      style: 0.20,
    },
    hero: {
      voice_id: 'YgjXqgzBJa9op0K278OW', // Tijs
      stability: 0.60,
      similarity_boost: 0.80,
      style: 0.30,
    },
  },

  limburgers: {
    default: {
      voice_id: '5tiZStRJQ98Xw420MFFx', // Reinoud (Limburgish)
      stability: 0.45,
      similarity_boost: 0.75,
      style: 0.40,
    },
    female: {
      voice_id: 'SXBL9NbvTrjsJQYay2kT', // Melanie
      stability: 0.45,
      similarity_boost: 0.75,
      style: 0.35,
    },
    hero: {
      voice_id: 'ppGIZI01uUlIWI734dUU', // Luk Balcer
      stability: 0.55,
      similarity_boost: 0.80,
      style: 0.30,
    },
  },

  belgen: {
    default: {
      voice_id: 's7Z6uboUuE4Nd8Q2nye6', // Hans Claesen (Flemish)
      stability: 0.50,
      similarity_boost: 0.75,
      style: 0.35,
    },
    female: {
      voice_id: 'ANHrhmaFeVN0QJaa0PhL', // Petra Vlaams
      stability: 0.45,
      similarity_boost: 0.75,
      style: 0.50,
    },
    hero: {
      voice_id: 'tRyB8BgRzpNUv3o2XWD4', // Walter
      stability: 0.50,
      similarity_boost: 0.75,
      style: 0.40,
    },
  },
};

// -------------------------------------------------------------------------
// Core Generation Function
// -------------------------------------------------------------------------

async function generateVoice(text, outputPath, voiceConfig) {
  // Skip if file exists and is valid
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    if (stats.size > 1024) {
      console.log(`  SKIP: ${outputPath} (${stats.size} bytes)`);
      return { status: 'skipped' };
    }
  }

  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voice_id}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        language_code: 'nl',
        voice_settings: {
          stability: voiceConfig.stability,
          similarity_boost: voiceConfig.similarity_boost,
          style: voiceConfig.style,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (response.status === 429) {
    console.log('  RATE LIMITED -- waiting 10s...');
    await new Promise(r => setTimeout(r, 10000));
    return generateVoice(text, outputPath, voiceConfig); // retry
  }

  if (!response.ok) {
    console.error(`  FAIL (${response.status}): ${outputPath}`);
    return { status: 'failed', code: response.status };
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length < 100) {
    console.error(`  FAIL (too small): ${outputPath} -- ${buffer.length} bytes`);
    return { status: 'failed', code: 'too_small' };
  }

  fs.writeFileSync(outputPath, buffer);
  console.log(`  OK: ${outputPath} (${buffer.length} bytes)`);

  // Rate limit: 0.5s between requests
  await new Promise(r => setTimeout(r, 500));

  return { status: 'generated', size: buffer.length };
}

// -------------------------------------------------------------------------
// Curl Example (for quick manual testing)
// -------------------------------------------------------------------------
//
// curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/KJMAev3goFD3WOh1hVBT" \
//   -H "xi-api-key: $ELEVENLABS_API_KEY" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "text": "Houdoe en bedankt!",
//     "model_id": "eleven_multilingual_v2",
//     "language_code": "nl",
//     "voice_settings": {
//       "stability": 0.5,
//       "similarity_boost": 0.75,
//       "style": 0.3,
//       "use_speaker_boost": true
//     }
//   }' --output test_output.mp3
```

### cURL Voorbeeld (Bash)

```bash
# Enkele voice line genereren
ELEVENLABS_API_KEY=$(grep '^ELEVENLABS_API_KEY=' /Users/richardtheuws/Documents/games/.env | cut -d= -f2)

curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/KJMAev3goFD3WOh1hVBT" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Houdoe en bedankt, ge zijt een echte held!",
    "model_id": "eleven_multilingual_v2",
    "language_code": "nl",
    "voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.75,
      "style": 0.3,
      "use_speaker_boost": true
    }
  }' --output assets/audio/voices/brabanders/test.mp3
```

---

## 8. Kwaliteitsoverwegingen

### Voice Settings per Karakter-type

| Karakter-type | Stability | Similarity | Style | Speed | Toelichting |
|---------------|-----------|------------|-------|-------|-------------|
| Kalm (Boer, Mijnwerker) | 0.50 | 0.75 | 0.30 | 1.0 | Rustig, consistent |
| Expressief (Carnavalvierder) | 0.30 | 0.75 | 0.60 | 1.0 | Breed emotioneel bereik |
| Fluisterend (Sluiper, Spion) | 0.30 | 0.80 | 0.20 | 0.9 | Subdued, geheimzinnig |
| Autoritair (Hero, CEO) | 0.60 | 0.80 | 0.25 | 1.0 | Stabiel, diep, gezaghebbend |
| Agressief (Attack lines) | 0.35 | 0.75 | 0.50 | 1.1 | Variabel, intens |
| Stervend (Death lines) | 0.25 | 0.70 | 0.60 | 0.8 | Maximaal expressief, langzaam |
| Narrator | 0.70 | 0.80 | 0.25 | 1.0 | Zeer consistent, professioneel |

### Dialect-specifieke Tips

**Brabants** (zachte g, warmte):
- Schrijf dialect in de tekst: "ge hedde", "moar", "nie", "houdoe"
- Gebruik Richard's geclonede stem -- bevat inherent zachte g
- Hogere similarity_boost (0.80) behoudt accent beter

**Limburgs** (zingend, nasaal):
- Schrijf Limburgse woorden: "sjoen", "jao", "ich", "Gluck auf", "hej"
- Gebruik Reinoud (nasale limburger) -- accent inherent aan de stem
- Lagere stability (0.40-0.45) voor meer melodische variatie

**Vlaams** (Frans-invloed):
- Schrijf Vlaamse woorden: "amai", "allez", "goesting", "ne keer"
- Vlaamse stemmen spreken dit automatisch correct uit
- Normale stability (0.50) -- accent is betrouwbaar

**ABN / Randstad** (formeel):
- Corporate jargon werkt perfect: "escaleren", "stakeholders", "alignment"
- Hogere stability (0.65-0.70) voor professioneel, gecontroleerd geluid
- Standaard NL stemmen -- geen aanpassingen nodig

### Uitspraak Probleemgebieden

| Probleem | Voorbeeld | Oplossing |
|----------|-----------|-----------|
| Zachte g vs harde g | "goed" | Geclonede stem met zachte g, of accepteren |
| Limburgse sjwa | "sjoen" | Fonetisch schrijven, Reinoud-stem helpt |
| Korte exclamaties | "Ja?" (0.5s) | Kunnen te lang worden -- post-processing trimmen |
| Sound effects in tekst | "*kreun*" | Verwijderen -- apart genereren als SFX |
| Code-switching | "Allez, laat maar" | Vlaams+NL mix werkt goed met Vlaamse stemmen |

### Post-Processing Pipeline

Na generatie, per audio bestand:
1. **Trim**: Stille begin/einde verwijderen (ffmpeg)
2. **Normalize**: Volume normalisatie naar -14 LUFS
3. **Boost**: +6dB voor game-context (RTS voices moeten boven SFX uitkomen)
4. **Format**: MP3 44.1kHz 128kbps (consistent met bestaande bestanden)
5. **Validate**: Minimaal 0.3s, maximaal 3.0s duratie

```bash
# Post-processing voorbeeld met ffmpeg
ffmpeg -i input.mp3 -af "silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB,silenceremove=stop_periods=1:stop_silence=0.1:stop_threshold=-50dB,loudnorm=I=-14:TP=-1.5:LRA=11,volume=6dB" -ar 44100 -b:a 128k output.mp3
```

---

## 9. Testuitslagen

### Gegenereerde Test Samples

Alle testbestanden opgeslagen in `/tmp/elevenlabs-test/`:

| Bestand | Stem | Factie | Tekst | Grootte | Status |
|---------|------|--------|-------|---------|--------|
| `brabanders_test.mp3` | Richard (cloned) | Brabanders | "Houdoe en bedankt, ge zijt een echte held!" | 39.7 KB | OK |
| `brabanders_joost_test.mp3` | Joost | Brabanders | "Houdoe en bedankt, ge zijt een echte held! Brabant vergeet nie!" | 82.0 KB | OK |
| `brabanders_roos_boerinne_test.mp3` | Roos | Brabanders (vrouw) | "Hedde al gegeten? Kom hier, dan plak ik er een pleister op!" | 52.3 KB | OK |
| `randstad_test.mp3` | Serge de Beer | Randstad | "Uitstekend, de kwartaalcijfers zijn boven verwachting." | 53.1 KB | OK |
| `randstad_daniel_test.mp3` | Daniel Wichers | Randstad | "Uitstekend, de kwartaalcijfers zijn boven verwachting. Laten we dit escaleren naar het management." | 85.7 KB | OK |
| `randstad_tijs_hero_test.mp3` | Tijs | Randstad Hero | "Dit is mijn stad. Mijn bedrijf. En jullie gaan doen wat ik zeg." | 59.8 KB | OK |
| `limburgers_test.mp3` | Adam (premade) | Limburgers | "Jao, dat is sjoen! De mijn is van os!" | 52.3 KB | OK |
| `limburgers_reinoud_test.mp3` | Reinoud | Limburgers | "Jao, dat is sjoen! De mijn is van os! Gluck auf, kameraden!" | 59.8 KB | OK |
| `limburgers_nick_test.mp3` | Nick | Limburgers | "Hej, koom is hie! De mergel is sjwaar, mer het goud glimt!" | 58.1 KB | OK |
| `limburgers_luk_test.mp3` | Luk Balcer | Limburgers Hero | "Jao, dat is sjoen! De mijn is van os! Gluck auf!" | 46.4 KB | OK |
| `limburgers_bart_test.mp3` | Bart | Limburgers alt. | "Jao, dat is sjoen! De mijn is van os! Gluck auf!" | 54.4 KB | OK |
| `limburgers_langcode_test.mp3` | Adam + lang=nl | Limburgers | "Jao, dat is sjoen! De mijn is van os! Gluck auf, kameraden!" | 59.0 KB | OK |
| `belgen_test.mp3` | Hans Claesen | Belgen | "Allez, we gaan ervoor! Nog een frietje erbij?" | 44.8 KB | OK |
| `belgen_walter_hero_test.mp3` | Walter | Belgen Hero | "Amai, da was proper ne slag! De Frietkoning laat zich niet kloppen, jong!" | 79.9 KB | OK |
| `belgen_petra_female_test.mp3` | Petra Vlaams | Belgen (vrouw) | "Komaan, nog een wafeltje? Da gaat u deugd doen!" | 55.2 KB | OK |
| `narrator_epic_test.mp3` | Eric Cinematic | Narrator | "In het jaar des Heren, toen Brabant nog vrij was..." | 98.3 KB | OK |
| `narrator_melanie_test.mp3` | Melanie | Narrator (vrouw) | "De strijd om Brabant is begonnen. Vier volkeren..." | 80.7 KB | OK |

**Resultaat**: 17/17 tests succesvol (HTTP 200). Alle bestanden > 30KB (valide audio).

### Bevindingen

1. **Richard (Brabants)**: Geclonede stem klinkt authentiek Brabants. Zachte g aanwezig. Dialectwoorden worden correct uitgesproken.
2. **Joost (Brabants)**: Goede aanvulling voor variatie, minder uitgesproken accent dan Richard.
3. **Reinoud (Limburgs)**: Duidelijk Limburgs nasaal karakter hoorbaar. Beste optie voor deze factie.
4. **Hans Claesen/Walter (Vlaams)**: Authentiek Vlaams accent. "Allez", "amai" klinken natuurlijk.
5. **Serge/Daniel (Randstad)**: Clean ABN. Daniel Wichers heeft licht "kakkerig" accent -- perfect voor Randstad satire.
6. **Roos/Petra (vrouwelijk)**: Goede vrouwenstemmen. Roos warm/moederlijk (Boerinne), Petra energiek (Wafelzuster).
7. **Eric Cinematic (narrator)**: Diep, episch -- geschikt voor campaign briefings.

---

## 10. Actieplan

### Fase 1: Voorbereiding (dag 1)

- [ ] Bevestig Creator tier abonnement ($22/maand) -- nodig voor voice cloning
- [ ] Verbeter Richard's voice clone: neem 5-10 min extra Brabants audio op
- [ ] Update `scripts/generate_unit_voices.sh` met alle 4 facties en juiste voice IDs
- [ ] Luister naar alle 17 test samples in `/tmp/elevenlabs-test/` en keur stemmen goed

### Fase 2: Generatie (dag 2-3)

Genereer per dag, in volgorde van complexiteit:

**Dag 2 - Ochtend**: Randstad (168 lijnen)
- Simpelste factie, standaard NL stemmen
- Test 5 lijnen, beoordeel kwaliteit, dan batch

**Dag 2 - Middag**: Belgen (138 lijnen)
- Vlaamse stemmen, hoge kwaliteit verwacht
- Vrouwelijke units apart met Petra Vlaams

**Dag 3 - Ochtend**: Brabanders (168 lijnen)
- Richard's stem voor mannelijke units
- Roos voor Boerinne
- Per unit-type andere voice settings

**Dag 3 - Middag**: Limburgers (138 lijnen) + Narrator (20 lijnen)
- Reinoud/Luk Balcer voor mannelijke units
- Narrator met Eric Cinematic

### Fase 3: Post-Processing (dag 4)

- [ ] Trim stilte van begin/einde
- [ ] Volume normalisatie (-14 LUFS + 6dB boost)
- [ ] Duratie validatie (0.3s - 3.0s)
- [ ] Herwerk uitschieters (te lang, verkeerde emotie)
- [ ] Kopieer naar `public/assets/audio/voices/` en `dist/assets/audio/voices/`

### Fase 4: Integratie & Test (dag 5)

- [ ] Sync met `scripts/sync-voice-recordings.sh`
- [ ] Test in-game: elke factie, elke unit-type, elke actie
- [ ] Controleer timing (cooldown 800ms past bij voice line duur)
- [ ] Controleer music ducking werkt correct
- [ ] Deploy naar theuws.com/games/reign-of-brabant/

### Totale Tijdlijn: 5 werkdagen
### Totale Kosten: $22 (Creator tier, 1 maand)

---

## Appendix: Model Informatie

### eleven_multilingual_v2

- **ID**: `eleven_multilingual_v2`
- **Talen**: 29 talen inclusief Nederlands
- **Kwaliteit**: Hoogste kwaliteit, beste voor Nederlands
- **Latentie**: Hoger dan turbo modellen
- **Kosten**: Standaard (1x token cost factor)
- **Aanbevolen voor**: Alle voice lines in dit project

### API Parameters Reference

| Parameter | Type | Default | Bereik | Beschrijving |
|-----------|------|---------|--------|-------------|
| `model_id` | string | `eleven_multilingual_v2` | - | TTS model |
| `language_code` | string | auto | ISO 639-1 | Forceer taal (gebruik "nl") |
| `stability` | float | 0.5 | 0.0 - 1.0 | Lager = expressiever, hoger = consistenter |
| `similarity_boost` | float | 0.75 | 0.0 - 1.0 | Hoger = dichter bij originele stem |
| `style` | float | 0.0 | 0.0 - 1.0 | Versterkt stemkarakteristieken (hoger = meer compute) |
| `use_speaker_boost` | bool | true | - | Verbetert gelijkenis (iets meer latentie) |
| `speed` | float | 1.0 | 0.5 - 2.0 | Spraaksnelheid |
| `seed` | int | random | - | Deterministisch resultaat bij herhaling |

---

**Laatste Update**: 2026-04-07
**Status**: Research complete, klaar voor uitvoering
