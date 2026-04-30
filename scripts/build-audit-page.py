#!/usr/bin/env python3
"""Generate voices-audit-<faction>.html from RECORDING-SCRIPT-*.md."""
import re, sys
from pathlib import Path

if len(sys.argv) < 2:
    sys.exit('Usage: build-audit-page.py <RECORDING-SCRIPT.md>')

script = Path(sys.argv[1])
md = script.read_text()

# Detect faction
name = script.name.upper()
faction = next((f for f in ['BRABANDERS','LIMBURGERS','RANDSTAD','BELGEN']
                if f.replace('S','') in name or f in name), None)
if 'BRABANDER' in name: faction = 'brabanders'
elif 'LIMBURG' in name: faction = 'limburgers'
elif 'RANDSTAD' in name: faction = 'randstad'
elif 'BELGEN' in name:  faction = 'belgen'
gender_suffix = ''
if 'FEMALE' in name: gender_suffix = '-female'
elif 'MALE' in name:  gender_suffix = '-male'

# Parse: collect (unit_or_generic, slot_id, suggested_text) in order
sections = []  # list of (unit_label, [(slot_id, text), ...])
current_unit = None
current_label = None
current_rows = []
for line in md.splitlines():
    h = re.match(r'^##\s+([a-z][a-z-]*)\b', line)
    if h:
        if current_label is not None:
            sections.append((current_label, current_unit, current_rows))
        unit = h.group(1)
        # Use full heading text for display label
        current_label = line.lstrip('#').strip()
        current_unit = None if unit == 'generic' else unit
        current_rows = []
        continue
    m = re.match(r'^\|\s*(\d+)\s*\|\s*([a-z]+_[0-9])\s*\|\s*(.*?)\s*\|', line)
    if m:
        num, slot, text = m.group(1), m.group(2), m.group(3).strip()
        current_rows.append((num, slot, text))
if current_label is not None and current_rows:
    sections.append((current_label, current_unit, current_rows))

# Render HTML
title = f'{faction.title()}{gender_suffix} Voice Audit'
out = [f'''<!DOCTYPE html>
<html lang="nl"><head><meta charset="UTF-8"><title>{title}</title>
<style>
  body {{ font-family: -apple-system, sans-serif; background: #1a1a1f; color: #e8e8ee; padding: 24px; max-width: 920px; margin: 0 auto; }}
  h1 {{ color: #f3c969; }}
  h2 {{ color: #f3c969; border-bottom: 1px solid #3a3a45; padding-bottom: 4px; margin-top: 28px; text-transform: uppercase; letter-spacing: 1px; font-size: 16px; }}
  .row {{ display: grid; grid-template-columns: 60px 110px 1fr 230px; gap: 10px; align-items: center; padding: 5px 8px; background: #25252d; margin-bottom: 3px; border-radius: 4px; font-size: 13px; }}
  .num {{ color: #f3c969; font-weight: 600; text-align: center; }}
  .file {{ font-family: ui-monospace, monospace; color: #aac8ff; }}
  .text {{ color: #e8e8ee; }}
  audio {{ width: 100%; height: 28px; }}
</style></head><body>
<h1>{title}</h1>
<p style="color:#a0a0aa;font-size:13px;">Click play per regel; vergelijk met de tekst. Als iets verkeerd klinkt → noem slot-id zoals "boer/select_2" of "generic gather_1".</p>''']

for label, unit, rows in sections:
    out.append(f'<h2>{label}</h2>')
    for num, slot, text in rows:
        path = f'/assets/audio/voices/{faction}/{unit}/{slot}.mp3' if unit else f'/assets/audio/voices/{faction}/{slot}.mp3'
        slot_label = f'{unit}/{slot}' if unit else slot
        out.append(f'<div class="row"><span class="num">{num}</span><span class="file">{slot_label}</span><span class="text">{text}</span><audio controls preload="none" src="{path}"></audio></div>')

out.append('</body></html>')

dest = Path(f'public/voices-audit-{faction}{gender_suffix}.html')
dest.write_text('\n'.join(out))
total = sum(len(r) for _,_,r in sections)
print(f'Generated {dest} ({len(sections)} sections, {total} slots)')
