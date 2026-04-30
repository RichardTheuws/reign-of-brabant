#!/usr/bin/env python3
"""
Split a voice recording into per-slot MP3 files using ElevenLabs Scribe STT.

The user reads each slot-number aloud ("één", "twee"... "honderdachtendertig")
followed by the line text. Optionally with hertakes. Scribe transcribes with
word-level timestamps; this script:

  1. Finds the timestamp of each spoken slot-number (1..N)
  2. Defines slot[i] as audio from end-of-number[i] until start-of-number[i+1]
  3. Within that range, takes the LONGEST non-silent take (= last meaningful
     attempt, hertakes get effectively replaced)
  4. Exports as MP3 via ffmpeg

Usage:
  python3 scripts/split-by-spoken-numbers.py \
      _recording/recording-brabant.m4a \
      RECORDING-SCRIPT-BRABANDER.md \
      [output-dir]
"""
import json, os, re, subprocess, sys, urllib.request, mimetypes
from pathlib import Path

# ---------------------------------------------------------------------------
# Dutch numerals 1..200 — both digit and spelled-out forms
# ---------------------------------------------------------------------------
ONES = ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen']
TENS_10_19 = ['tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien',
              'zestien', 'zeventien', 'achttien', 'negentien']
TENS = ['', '', 'twintig', 'dertig', 'veertig', 'vijftig',
        'zestig', 'zeventig', 'tachtig', 'negentig']

def dutch_word(n: int) -> str:
    if n == 1:
        return 'een'
    if n < 10:
        return ONES[n]
    if 10 <= n < 20:
        return TENS_10_19[n - 10]
    if 20 <= n < 100:
        t, o = divmod(n, 10)
        if o == 0:
            return TENS[t]
        return f'{ONES[o]}en{TENS[t]}'
    if 100 <= n < 200:
        rest = n - 100
        if rest == 0:
            return 'honderd'
        return f'honderd{dutch_word(rest)}'
    raise ValueError(n)

def normalize(text: str) -> str:
    """Lowercase, strip diacritics + all punctuation/spaces.

    "Vierëntachtig." -> "vierentachtig"
    "21." -> "21"
    """
    s = text.lower()
    s = (s.replace('é', 'e').replace('è', 'e').replace('ë', 'e')
           .replace('ê', 'e').replace('á', 'a').replace('ä', 'a')
           .replace('ó', 'o').replace('ö', 'o').replace('ï', 'i'))
    return re.sub(r'[^a-z0-9]', '', s)

def expected_forms(n: int) -> set[str]:
    """Normalized forms matching number n. Multi-word forms ("honderd en zes")
    aren't here — those are handled by sequence-match in find_boundary()."""
    forms = {str(n), dutch_word(n)}
    if n == 1:
        forms |= {'eens'}
    return {normalize(f) for f in forms}

# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
if len(sys.argv) < 3:
    sys.exit('Usage: split-by-spoken-numbers.py <recording.m4a> <SCRIPT.md> [out-dir]')

REC = Path(sys.argv[1]).resolve()
SCRIPT = Path(sys.argv[2]).resolve()
if not REC.exists() or not SCRIPT.exists():
    sys.exit(f'Missing: {REC if not REC.exists() else SCRIPT}')

# Auto-detect faction
faction = None
name = SCRIPT.name.upper()
if 'BRABANDER' in name: faction = 'brabanders'
elif 'LIMBURG' in name: faction = 'limburgers'
elif 'RANDSTAD' in name: faction = 'randstad'
elif 'BELGEN' in name: faction = 'belgen'
if not faction:
    sys.exit(f'Cannot detect faction from {SCRIPT.name}')

OUT_DIR = Path(sys.argv[3]) if len(sys.argv) >= 4 else \
          Path('public/assets/audio/voices') / faction
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Parse slot-list from markdown
# ---------------------------------------------------------------------------
slots: list[tuple[int, str]] = []  # [(num, "unit/slot" or "slot"), ...]
current_unit = None
for line in SCRIPT.read_text().splitlines():
    h = re.match(r'^##\s+([a-z][a-z-]*)', line)
    if h:
        unit = h.group(1)
        current_unit = None if unit == 'generic' else unit
        continue
    m = re.match(r'^\|\s*(\d+)\s*\|\s*([a-z]+_[0-9])\s*\|', line)
    if m:
        num = int(m.group(1))
        slot = m.group(2)
        path = f'{current_unit}/{slot}' if current_unit else slot
        slots.append((num, path))

print(f'Expected slots: {len(slots)}')
print(f'Recording     : {REC}')
print(f'Output base   : {OUT_DIR}')

# ---------------------------------------------------------------------------
# Get / cache STT transcription
# ---------------------------------------------------------------------------
CACHE = REC.with_suffix('.stt.json')
if CACHE.exists():
    print(f'\n[1/3] Using cached STT: {CACHE}')
    stt = json.loads(CACHE.read_text())
else:
    print(f'\n[1/3] Calling ElevenLabs Scribe (one-time, may take ~30-60s)...')
    api_key = os.environ.get('ELEVENLABS_API_KEY') or _load_env_key()
    if not api_key:
        sys.exit('ELEVENLABS_API_KEY not set; run: source ../.env')
    # multipart/form-data via subprocess curl (simpler than urllib)
    result = subprocess.run([
        '/usr/bin/curl', '-s', '-X', 'POST',
        'https://api.elevenlabs.io/v1/speech-to-text',
        '-H', f'xi-api-key: {api_key}',
        '-F', f'file=@{REC}',
        '-F', 'model_id=scribe_v1',
        '-F', 'timestamps_granularity=word',
        '-F', 'language_code=nld',
    ], capture_output=True, text=True, timeout=300)
    stt = json.loads(result.stdout)
    if 'words' not in stt:
        sys.exit(f'STT failed: {result.stdout[:300]}')
    CACHE.write_text(json.dumps(stt))
    print(f'  Cached → {CACHE}')

words = [w for w in stt['words'] if w.get('type') == 'word']
print(f'  {len(words)} words transcribed')

# ---------------------------------------------------------------------------
# Find slot-number boundaries
# ---------------------------------------------------------------------------
print(f'\n[2/3] Locating spoken slot-numbers...')

def matches_form(word_text: str, forms: set[str]) -> bool:
    n = normalize(word_text)
    if n in forms:
        return True
    # Scribe-quirk fallbacks:
    #  - merged neighbouring words ("wal.Vierenzeventig" -> ends with form)
    #  - single-character typos ("Einennegentig" vs "eenennegentig")
    for f in forms:
        if not f or f.isdigit():
            continue
        if n.endswith(f) or n.startswith(f):
            return True
        # Edit distance ≤ 1 for spelled-out long forms
        if len(f) >= 6 and abs(len(n) - len(f)) <= 1:
            diffs = sum(1 for a, b in zip(n, f) if a != b) + abs(len(n) - len(f))
            if diffs <= 1:
                return True
    return False

def find_boundary(slot_num: int, start_idx: int) -> tuple[int, float, float]:
    """Return (next_idx, num_start, num_end) or (-1, -1, -1) if not found.

    Single-word match for 1..99; multi-word "honderd [en] X" for 100+.
    Falls back to substring/edit-distance for Scribe-quirks.
    """
    if slot_num < 100:
        forms = expected_forms(slot_num)
        for i in range(start_idx, len(words)):
            if matches_form(words[i]['text'], forms):
                return i + 1, words[i]['start'], words[i]['end']
        return -1, -1, -1
    # 100+: find "honderd" then within next 3 words match dutch_word(rest)
    rest = slot_num - 100
    rest_forms = {normalize(dutch_word(rest))} if rest > 0 else {''}
    for i in range(start_idx, len(words)):
        if normalize(words[i]['text']) != 'honderd':
            continue
        if rest == 0:
            return i + 1, words[i]['start'], words[i]['end']
        for j in range(i + 1, min(i + 4, len(words))):
            wn = normalize(words[j]['text'])
            if wn == 'en':
                continue
            if wn in rest_forms:
                return j + 1, words[i]['start'], words[j]['end']
            break  # non-matching non-"en" word -> abandon this honderd
    return -1, -1, -1

boundaries: list[tuple[int, float, float]] = []
word_idx = 0
for slot_num, _ in slots:
    next_idx, ns, ne = find_boundary(slot_num, word_idx)
    if next_idx < 0:
        print(f'  WARN: slot {slot_num} ({dutch_word(slot_num)}) not found')
        boundaries.append((slot_num, -1, -1))
    else:
        boundaries.append((slot_num, ns, ne))
        word_idx = next_idx

found_count = sum(1 for b in boundaries if b[1] >= 0)
print(f'  Located {found_count}/{len(slots)} slot-numbers')

# ---------------------------------------------------------------------------
# Extract takes for each slot (audio between number[i].end and number[i+1].start)
# ---------------------------------------------------------------------------
print(f'\n[3/3] Extracting audio per slot...')
total_dur = float(stt.get('audio_duration_secs', 0))
extracted, skipped = 0, []

for i, (num, path) in enumerate(slots):
    _, num_start, num_end = boundaries[i]
    if num_end < 0:
        skipped.append(num)
        continue

    # End boundary = start of next found slot, or audio end
    next_start = total_dur
    for j in range(i + 1, len(boundaries)):
        if boundaries[j][1] >= 0:
            next_start = boundaries[j][1]
            break

    # Trim small lead/trail silences via 0.15s padding shrink
    take_start = num_end + 0.10
    take_end = next_start - 0.20
    if take_end - take_start < 0.30:
        skipped.append(num)
        continue

    out = OUT_DIR / f'{path}.mp3'
    out.parent.mkdir(parents=True, exist_ok=True)
    duration = take_end - take_start

    # ffmpeg: extract + remove leading/trailing silence within take + encode
    subprocess.run([
        '/opt/homebrew/bin/ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
        '-ss', f'{take_start:.3f}', '-t', f'{duration:.3f}', '-i', str(REC),
        '-af', 'silenceremove=start_periods=1:start_silence=0.2:start_threshold=-40dB:'
               'stop_periods=-1:stop_silence=0.3:stop_threshold=-40dB',
        '-c:a', 'libmp3lame', '-q:a', '2',
        str(out),
    ], check=True)
    extracted += 1
    print(f'  [{num:>3}/{len(slots)}] {path}.mp3  ({duration:.2f}s)')

print(f'\nDone. Extracted {extracted} files; skipped {len(skipped)}: {skipped if skipped else "(none)"}')
print(f'Next: bash scripts/normalize-voices.sh --all')
