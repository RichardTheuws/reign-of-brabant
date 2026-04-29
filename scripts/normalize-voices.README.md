# normalize-voices.sh

Batch audio-normalisatie pipeline voor de 525 voice MP3's onder
`public/assets/audio/voices/`. Brengt loudness en EQ in lijn over alle
ElevenLabs sessies (verschillende dagen / stem-IDs) zonder de bron
te overschrijven.

## Filter-chain (single-pass ffmpeg)

| Stap        | Filter                                                          | Doel |
|-------------|-----------------------------------------------------------------|------|
| High-pass   | `highpass=f=80`                                                 | Verwijdert rumble / mic-handling onder 80 Hz |
| Low-shelf   | `equalizer=f=150:t=h:width=2:g=-2`                              | -2 dB low-mud onder ~200 Hz |
| Presence    | `equalizer=f=3000:t=h:width=2:g=1.5`                            | +1.5 dB rond 3 kHz voor verstaanbaarheid |
| De-essing   | `compand=attacks=0:points=-80/-80\|-50/-50\|-20/-15:soft-knee=6` | Mild — knipt scherpe sissers |
| Loudnorm    | `loudnorm=I=-16:TP=-1:LRA=11`                                   | -16 LUFS integrated, -1 dBTP, 11 LU range |

Output blijft MP3 (`libmp3lame -q:a 2`, ~190 kbps VBR — transparant t.o.v. ElevenLabs source).

## Modes

```bash
# Default: 3 random files per factie -> voices-normalized-sample/  (12 totaal)
bash scripts/normalize-voices.sh --sample

# Volledige run (~525 files, 10-30 min) -> voices-normalized/
bash scripts/normalize-voices.sh --all

# Eén specifieke file -> voices-normalized-single/
bash scripts/normalize-voices.sh --single public/assets/audio/voices/brabanders/boer/select_1.mp3

# Print ffmpeg commando's zonder uit te voeren
bash scripts/normalize-voices.sh --sample --dry-run
```

## A/B test workflow

1. Run `bash scripts/normalize-voices.sh --sample`. De 12 paths worden geprint.
2. Open in Finder of QuickLook telkens twee bestanden naast elkaar:
   ```
   public/assets/audio/voices/brabanders/boer/select_1.mp3                    # ORIG
   public/assets/audio/voices-normalized-sample/brabanders/boer/select_1.mp3  # NORM
   ```
3. Beoordeel:
   - Loudness: voelen ze nu gelijk-luid?
   - EQ: nog te scherp (sissers)? -> `compand` stappen aanpassen
   - Bas: nog te dik? -> low-shelf naar -3 dB
4. Pas indien nodig de filter-chain in `scripts/normalize-voices.sh` aan en
   run opnieuw met `--sample`.

## Volledige batch

Wanneer de sample bevalt:

```bash
bash scripts/normalize-voices.sh --all
```

Resultaat: parallelle tree onder `public/assets/audio/voices-normalized/`.

## Integratie

Twee opties — kies er één:

**Optie A — drop-in vervanging (simpel):**
```bash
# Backup eerst!
mv public/assets/audio/voices public/assets/audio/voices.bak
mv public/assets/audio/voices-normalized public/assets/audio/voices
```

**Optie B — pad updaten in code:**
Pas `UnitVoices.ts` (of welke service de voice paths laadt) aan om
`voices-normalized/` te gebruiken. Voordeel: eenvoudig terugrollen
door één pad-constante.

## Logs & errors

Falende ffmpeg-runs worden niet stilzwijgend genegeerd:
- Counter blijft doorlopen, file wordt overgeslagen
- `[SKIP] <pad>` naar stderr
- Volledige ffmpeg stderr in `scripts/normalize-voices.log`

## Caveats

- **macOS single-pass loudnorm** target ±1 LU rond -16 LUFS. Voor
  exact targeting zou two-pass nodig zijn (analyse-pass + apply-pass)
  wat de runtime verdubbelt. Voor in-game audio is ±1 LU ruim binnen
  perceptuele drempels.
- **De-essing is bewust mild.** Als sissers nog door komen: `points`
  agressiever zetten (`-20/-18` -> `-20/-22`). Als stemmen dof klinken:
  compand-regel verwijderen.
- **Output is MP3 -> MP3** (lossy -> lossy). Theoretisch kwaliteitsverlies,
  in praktijk niet hoorbaar bij q=2. Wil je dit absoluut vermijden:
  laat ElevenLabs WAV genereren en pas deze pipeline op WAV toe.
- **Genormaliseerde dirs zijn .gitignored** (`voices-normalized*`).
  Niet committen — deze regenereer je vanuit de bron.
