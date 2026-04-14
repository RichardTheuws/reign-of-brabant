# Voice Line Scripts — Limburgers & Belgen

**Versie**: 1.0.0  
**Datum**: 2026-04-14  
**Status**: Ready for Recording  
**Auteur**: Audio Director Agent  
**Referentie**: `SUB-PRD-LIMBURGERS.md` (sectie 6), `SUB-PRD-BELGEN.md` (sectie 6), `ELEVENLABS-VOICE-PLAN.md`

---

## ElevenLabs Global Settings

| Parameter | Waarde | Toelichting |
|-----------|--------|-------------|
| **Model** | `eleven_multilingual_v2` | Nederlands + dialect support |
| **Language** | `nl` | Nederlandse text normalisatie |
| **Output format** | `mp3_44100_128` | Game-kwaliteit |
| **Boost** | +8dB post-processing | Standaard voice boost |

---

## LIMBURGERS (48 lines, 8 units)

**Dialect**: Limburgs -- zacht, zangerig, "ich/dich/sjoen/jao/waat/neet/Gluck auf"  
**Primaire stem**: Reinoud `5tiZStRJQ98Xw420MFFx`  
**Alternatief**: Nick `PrYUlaJFEdOSVy6jaEaG`, Luk Balcer `ppGIZI01uUlIWI734dUU`

### L1. Mijnwerker (Worker)

**Voice**: Reinoud | **Karakter**: Man, 40-50, vermoeid maar stoer, kalme basstem  
**Settings**: stability 0.45, similarity 0.75, style 0.35

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Jao?" | Kort, rustig, nuchter |
| 2 | Select | "Waat is 't?" | Onverstoord |
| 3 | Select | "Ich luister" | Geduldig, laag |
| 4 | Move | "Ich gank al" | Kalm bevestigend |
| 5 | Move | "Is good" | Minimaal, zuchtend |
| 6 | Attack | "Mot dat echt?" | Onwillig, zucht |
| 7 | Attack | "Pikhouweel d'r in!" | Opgehitst, plots luid |
| 8 | Death | "De mijn... roep mich..." | Zacht stervend, afdalend |

**File naming**: `limburgers/mijnwerker/select_1.mp3` ... `death_1.mp3`

---

### L2. Schutterij (Infantry)

**Voice**: Reinoud | **Karakter**: Man, 30-40, gedisciplineerd schuttersgilde-lid, formeel trots  
**Settings**: stability 0.50, similarity 0.75, style 0.40

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Schutterij, paraat!" | Formeel, trots |
| 2 | Select | "Zeg maar waat" | Kort, gedisciplineerd |
| 3 | Select | "Het vaandel wappert" | Trots, opkijkend |
| 4 | Move | "In formatie!" | Scherp commando |
| 5 | Move | "Veuruit, mars!" | Energiek, marcheerend |
| 6 | Attack | "Vuur!" | Kort, scherp, explosief |
| 7 | Attack | "Limburg sjeet terug!" | Strijdlustig, krachtig |
| 8 | Death | "Het vaandel... laot 't neet valle..." | Stervend, bezorgd om eer |

---

### L3. Vlaaienwerper (Ranged)

**Voice**: Nick | **Karakter**: Man, 25-35, chaotisch vrolijk, bakker-met-wapen  
**Settings**: stability 0.35, similarity 0.75, style 0.55

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Welke smaak wiltse?" | Vrolijk, vals grijnsje |
| 2 | Select | "De vlaai is warm!" | Enthousiast |
| 3 | Select | "Hej! Ich bak, ich gooi!" | Chaotisch blij |
| 4 | Move | "Ich kom met vlaai!" | Enthousiast, rennend |
| 5 | Move | "Neet morsse!" | Geconcentreerd, bakplaat balancerend |
| 6 | Attack | "Vlaai in dien smoel!" | Agressief blij |
| 7 | Attack | "Kersenvlaai SPECIAAL!" | Strijdkreet, maniakaal |
| 8 | Death | "De vlaai... brandt aan..." | Dramatisch stervend |

---

### L4. Mergelridder (Heavy)

**Voice**: Luk Balcer | **Karakter**: Man, 50-60, diep en traag, levende berg  
**Settings**: stability 0.55, similarity 0.80, style 0.30, speed 0.90

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Steen breekt neet" | Diep, kalm, onwrikbaar |
| 2 | Select | "Ich stao" | Minimaal, twee woorden, krachtig |
| 3 | Select | "De heuvels spreke" | Mysterieus, laag |
| 4 | Move | "Langzaam maar zeker" | Geduldig, zware stappen |
| 5 | Move | "Ich kom eraan. Wacht maar" | Dreigend kalm |
| 6 | Attack | "Mergel op dien kop!" | Kort, krachtig, explosief |
| 7 | Attack | "De berg valt op dich!" | Strijdkreet, donder |
| 8 | Death | "Terug... nao de steen..." | Vredevol, instortend |

---

### L5. Kolenbrander (Siege)

**Voice**: Reinoud | **Karakter**: Man, 35-45, sinister, obsessief met vuur, fluisteraar  
**Settings**: stability 0.30, similarity 0.75, style 0.50, speed 0.85

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Het vuur brandt..." | Zacht, sinister, starend in vlammen |
| 2 | Select | "Waat moot ich in brand steke?" | Gretig, fluisterend |
| 3 | Select | "Kolen... altied kolen..." | Obsessief, monotoon |
| 4 | Move | "De kar rolt" | Nuchter, wielen knarsen |
| 5 | Move | "Ich breng het vuur" | Dreigend kalm |
| 6 | Attack | "Brand!" | Kort, intens, explosief |
| 7 | Attack | "Gloeiende kolen! Vang!" | Sadistisch blij |
| 8 | Death | "Het vuur... geit oet..." | Zacht stervend, vlam dooft |

---

### L6. Sjpion (Support)

**Voice**: Nick | **Karakter**: Man, 30-50 (onbepaald), fluisterend, etherisch, half-arts half-geest  
**Settings**: stability 0.25, similarity 0.75, style 0.45, speed 0.90

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Ich bin d'r" | Fluisterend, plots verschijnend |
| 2 | Select | "Waat fielt dich?" | Zorgzaam, zacht |
| 3 | Select | "Stil... ich heur dich" | Mysterieus, luisterend |
| 4 | Move | "As een sjaduw" | Fluisterend, glijd |
| 5 | Move | "Niemand zeet mich gaon" | Mysterieus, verdwijnend |
| 6 | Attack | "Neet mien stiel... maar good" | Tegenzin, zucht |
| 7 | Attack | "Sorry. Mot ech" | Beleefd dreigend |
| 8 | Death | "De nevels... neme mich op..." | Verdwijnend, etherisch |

---

### L7. Mijnrat (Stealth)

**Voice**: Reinoud | **Karakter**: Man, 20-25, klein, giechelig, hyperactief, saboteur  
**Settings**: stability 0.20, similarity 0.75, style 0.65, speed 1.10

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Hihihi... jao?" | Giechelig, opkijkend |
| 2 | Select | "Ssst! Ich bin d'r!" | Fluisterend opgewonden |
| 3 | Select | "Waat laote we knalle?" | Gretig, ogen groot |
| 4 | Move | "Door de gange!" | Snel, rennend |
| 5 | Move | "Ze zeen mich neet!" | Zelfverzekerd, sluipend |
| 6 | Attack | "Sjtekske erin!" | Snel, giechelig |
| 7 | Attack | "Klein maar gemeen!" | Trots, venijnig |
| 8 | Death | "Ze... hadde mich toch..." | Verrast stervend |

---

### L8. Heuvelwacht (Scout)

**Voice**: Nick | **Karakter**: Man, 18-22, jong, energiek, ongeduldig, snelste van de groep  
**Settings**: stability 0.30, similarity 0.75, style 0.55, speed 1.15

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Hej!" | Kort, scherp, energiek |
| 2 | Select | "Bove op de heuvel!" | Enthousiast, wijzend |
| 3 | Select | "Ich ziej alles van hierbo!" | Trots, uitkijkend |
| 4 | Move | "Ich ren!" | Kort, al in beweging |
| 5 | Move | "Over de heuvels!" | Blij, springend |
| 6 | Attack | "Sjtein weg!" | Kort, scherp, slingerend |
| 7 | Attack | "Raak! Van de heuvel af!" | Trots, neerkijkend |
| 8 | Death | "De heuvel... is te steil..." | Vallend, omlaag rollend |

---

## BELGEN (56 lines, 7 units)

**Dialect**: Vlaams met Franse doorspekking -- "amai/allez/goesting/ambetant/voila/komaan"  
**Primaire stem**: Hans Claesen `s7Z6uboUuE4Nd8Q2nye6`  
**Vrouwelijk**: Petra Vlaams `ANHrhmaFeVN0QJaa0PhL`  
**Alternatief**: Bart `eWrnzOwO7JvyjacVxTzV`, Walter `tRyB8BgRzpNUv3o2XWD4`

### B1. Frietkraamhouder (Worker)

**Voice**: Hans Claesen | **Karakter**: Man, 45-55, kroegbaas-energie, vriendelijk maar mopperig  
**Settings**: stability 0.50, similarity 0.75, style 0.35

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Ja, wat mag het zijn?" | Vriendelijk, professioneel |
| 2 | Select | "Frietje? Stoverij? Allez, zeg het" | Ongeduldig uitnodigend |
| 3 | Select | "De frituur is open!" | Trots, uitnodigend |
| 4 | Move | "Voila, ik ga al" | Bevestigend, zuchtje |
| 5 | Move | "Ca va, ca va, ik kom" | Half Frans, haastig |
| 6 | Attack | "Ge krijgt mijn frietschep!" | Dreigend, schep zwaaiend |
| 7 | Attack | "Frieten, niet patat! NOOIT patat!" | Woedend, principieel |
| 8 | Death | "De frituur... gaat dicht..." | Tragisch stervend |

**File naming**: `belgen/frietkraamhouder/select_1.mp3` ... `death_1.mp3`

---

### B2. Bierbouwer (Infantry)

**Voice**: Bart | **Karakter**: Man, 35-50, monnik-brouwer, diep en plechtig, dronkenmanswijsheid  
**Settings**: stability 0.50, similarity 0.75, style 0.40

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Sanitas per cerevisiam" | Plechtig, monnik-Latijn |
| 2 | Select | "Amai, is het al tijd voor vespers?" | Slaperig, filosofisch |
| 3 | Select | "Zeg het maar, vriend" | Kalm, diep, vertrouwelijk |
| 4 | Move | "Met Gods wil en goed bier" | Plechtig |
| 5 | Move | "Ik breng het vat mee" | Vastberaden, zwaar sjouwend |
| 6 | Attack | "In naam van de Trappist!" | Strijdkreet, krachtig |
| 7 | Attack | "Ge hebt mijn bier gemorst!" | Persoonlijk beledigd, woedend |
| 8 | Death | "Breng mij... een laatste Westmalle..." | Stervend, dramatisch |

---

### B3. Chocolatier (Ranged)

**Voice**: Hans Claesen | **Karakter**: Man, 30-45, arrogante artiest, snobistisch, theatraal  
**Settings**: stability 0.40, similarity 0.75, style 0.55

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Ah, een kenner!" | Gevleid, arrogant opkijkend |
| 2 | Select | "Mijn pralines zijn kunst, geen wapens. Maar allez." | Gekweld artiest, zucht |
| 3 | Select | "Wilt ge proeven? Nee? Jammer." | Teleurgesteld, snobistisch |
| 4 | Move | "Voorzichtig, de pralines!" | Bezorgd om zijn chocolade |
| 5 | Move | "Bon, ik ga" | Kort, Frans-Vlaams |
| 6 | Attack | "Proef en sterf!" | Theatraal agressief |
| 7 | Attack | "Dit is GEEN Cote d'Or, barbaar!" | Beledigd, venijnig |
| 8 | Death | "Mijn... meesterwerk... onafgemaakt..." | Artistiek stervend |

---

### B4. Frituurridder (Heavy)

**Voice**: Walter | **Karakter**: Man, 35-45, heroische ridder, absurd plechtig, mayonaise-eer  
**Settings**: stability 0.50, similarity 0.75, style 0.45

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "De ridder van de gouden friet!" | Heroisch, plechtig |
| 2 | Select | "Mijn lans is heet en mijn vet is kokend" | Dreigend, trots |
| 3 | Select | "Allez, voor Belgie!" | Patriottisch, vuist omhoog |
| 4 | Move | "Te paard!" | Kort, militair commando |
| 5 | Move | "Wij marcheren, met mayo" | Absurd plechtig |
| 6 | Attack | "CHARGE! En vergeet de saus niet!" | Strijdkreet + absurd |
| 7 | Attack | "In de pan met u!" | Agressief, culinair dreigend |
| 8 | Death | "Het paard... het vet... alles koud..." | Episch stervend, dalend |

---

### B5. Manneken Pis-kanon (Siege)

**Voice**: Hans Claesen | **Karakter**: Man, 25-35, bediener van het kanon, beschaamd maar professioneel  
**Settings**: stability 0.45, similarity 0.75, style 0.40

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Het Manneken is paraat!" | Professioneel, militair |
| 2 | Select | "Sorry voor de... geluiden" | Beschaamd, blik afwendend |
| 3 | Select | "Ja, hij doet dat" | Vermoeid accepterend |
| 4 | Move | "Voorzichtig rollen!" | Gespannen, balancerend |
| 5 | Move | "Let op de plassen!" | Waarschuwend, bezorgd |
| 6 | Attack | "Overdruk! Ga ervoor!" | Commando, loslaten |
| 7 | Attack | "Ceci n'est pas de la pluie!" | Magritte-referentie, droog |
| 8 | Death | "Het standbeeld... is gevallen..." | Rouwend, nationaal erfgoed |

---

### B6. Wafelzuster (Support)

**Voice**: Petra Vlaams | **Karakter**: Vrouw, 40-55, non/moeder-figuur, warm maar streng, wafel-ijzer als staf  
**Settings**: stability 0.45, similarity 0.75, style 0.50

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Luikse of Brusselse, kind?" | Warm, moederlijk |
| 2 | Select | "Kom, ik heb net vers beslag" | Uitnodigend, kneedend |
| 3 | Select | "De Heer geeft, en ik bak" | Sereen, non-wijsheid |
| 4 | Move | "Met Gods zegen en warme wafels" | Plechtig warm |
| 5 | Move | "Allez, de wafels wachten niet" | Licht haastig, onderweg |
| 6 | Attack | "Het wafel-ijzer is heet!" | Waarschuwend, zwaaiend |
| 7 | Attack | "Een tik van zuster, en ge bidt ook!" | Streng, non-humor |
| 8 | Death | "Het beslag... laat het niet aanbranden..." | Stervende zorg voor de wafels |

---

### B7. Dubbele Spion (Stealth)

**Voice**: Bart | **Karakter**: Man, 35-50, paranoia, identiteitscrisis, fluistert altijd  
**Settings**: stability 0.25, similarity 0.75, style 0.50, speed 0.90

| # | Actie | Tekst | Regie |
|---|-------|-------|-------|
| 1 | Select | "Ceci n'est pas un espion" | Mysterieus, droog |
| 2 | Select | "Ik werk voor zes regeringen. Tegelijk." | Fluisterend, trots |
| 3 | Select | "Psst... vertrouw niemand. Ook mij niet." | Paranoia, om zich heen kijkend |
| 4 | Move | "Ik ben er nooit geweest" | Samenzweerderig |
| 5 | Move | "Onzichtbaar. Zoals de Belgische identiteit." | Filosofisch cynisch |
| 6 | Attack | "Sorry, dit is... niets persoonlijks. Misschien." | Onzeker agressief |
| 7 | Attack | "Surprise!" | Kort, dodelijk, plots luid |
| 8 | Death | "Welke kant... was ik ook alweer..." | Existentieel stervend |

---

## Voice Assignment Matrix

### Limburgers

| Unit | Stem | Voice ID | Reden |
|------|------|----------|-------|
| Mijnwerker | Reinoud | `5tiZStRJQ98Xw420MFFx` | Basis Limburgs, nuchter |
| Schutterij | Reinoud | `5tiZStRJQ98Xw420MFFx` | Formeler register, hogere stability |
| Vlaaienwerper | Nick | `PrYUlaJFEdOSVy6jaEaG` | Lichter, vrolijker karakter |
| Mergelridder | Luk Balcer | `ppGIZI01uUlIWI734dUU` | Diep, oud, zware stem |
| Kolenbrander | Reinoud | `5tiZStRJQ98Xw420MFFx` | Sinister register, lage stability |
| Sjpion | Nick | `PrYUlaJFEdOSVy6jaEaG` | Zachter, etherisch |
| Mijnrat | Reinoud | `5tiZStRJQ98Xw420MFFx` | Hoog, giechelig register, max expressief |
| Heuvelwacht | Nick | `PrYUlaJFEdOSVy6jaEaG` | Jong, energiek, snel |

### Belgen

| Unit | Stem | Voice ID | Reden |
|------|------|----------|-------|
| Frietkraamhouder | Hans Claesen | `s7Z6uboUuE4Nd8Q2nye6` | Warm Vlaams, standaard |
| Bierbouwer | Bart | `eWrnzOwO7JvyjacVxTzV` | Diep, monnik-register |
| Chocolatier | Hans Claesen | `s7Z6uboUuE4Nd8Q2nye6` | Theatraal, hoger register |
| Frituurridder | Walter | `tRyB8BgRzpNUv3o2XWD4` | Heroisch, plechtig |
| Manneken Pis-kanon | Hans Claesen | `s7Z6uboUuE4Nd8Q2nye6` | Professioneel, droog |
| Wafelzuster | Petra Vlaams | `ANHrhmaFeVN0QJaa0PhL` | Enige vrouwenstem, warm |
| Dubbele Spion | Bart | `eWrnzOwO7JvyjacVxTzV` | Laag, fluisterend, paranoia |

---

## Totaal Overzicht

| Factie | Units | Lines/unit | Totaal lines |
|--------|-------|------------|-------------|
| Limburgers | 8 | 8 | 64 |
| Belgen | 7 | 8 | 56 |
| **TOTAAL** | **15** | | **120** |

**Geschatte ElevenLabs kosten**: ~120 TTS calls, ~60 seconden audio totaal, ruim binnen abonnement.

---

## Recording Checklist

- [ ] Genereer per unit alle 8 lines in een batch
- [ ] Luister steekproef: dialect-authenticiteit check (Richard beluistert)
- [ ] Post-processing: +8dB boost, normalize
- [ ] Opslaan als `assets/audio/voices/{factie}/{unit}/{actie}_{variant}.mp3`
- [ ] Voice sync draaien voor deploy: `sync-voice-recordings.sh --include-recorded`
