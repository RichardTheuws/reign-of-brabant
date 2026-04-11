# Reign of Brabant — Voice Direction per Hero

**Versie**: 1.0.0
**Datum**: 2026-04-11
**Status**: Draft
**Auteur**: Scenario Writer Agent (in samenwerking met Audio Director richtlijnen)
**Scope**: ElevenLabs voice settings, regie-aanwijzingen, emotionele beats en dialectnotities per hero
**Referentie**: `ELEVENLABS-VOICE-PLAN.md` voor technische API details en stemkeuzes

---

## Inhoudsopgave

1. [Algemene Voice Direction Principes](#1-algemene-principes)
2. [Brabanders Heroes](#2-brabanders)
   - [De Prins van Brabant](#21-de-prins)
   - [De Boer van Brabant](#22-de-boer)
3. [Randstad Heroes](#3-randstad)
   - [De CEO](#31-de-ceo)
   - [De Politicus](#32-de-politicus)
4. [Limburgers Heroes](#4-limburgers)
   - [De Mijnbaas](#41-de-mijnbaas)
   - [De Maasmeester](#42-de-maasmeester)
5. [Belgen Heroes](#5-belgen)
   - [De Frietkoning](#51-de-frietkoning)
   - [De Abdijbrouwer](#52-de-abdijbrouwer)
6. [Cross-Hero Dialoog Settings](#6-cross-hero)
7. [Emotionele Beat Matrix](#7-emotionele-beats)

---

## 1. Algemene Voice Direction Principes {#1-algemene-principes}

### 1.1 Tone of Voice — Het Spectrum

Het spel beweegt op een spectrum tussen EPISCH en HUMOR. Elke hero zit ergens anders op dat spectrum, en verschuift afhankelijk van de situatie:

```
EPISCH ◄──────────────────────────────────────► HUMOR

Maasmeester  Mijnbaas  Abdijbrouwer  Boer  Prins  Frietkoning
    CEO                                          Politicus
```

**Regel**: Humor zit in de WOORDEN, niet in de LEVERING. De stem neemt zichzelf altijd serieus. Het publiek lacht omdat de situatie absurd is, niet omdat de character een grap maakt.

### 1.2 Dialect als Identiteit

Dialect is GEEN gimmick. Het is identiteit. Elke factie KLINKT anders, en dat verschil vertelt het verhaal voordat er een woord is gezegd.

| Factie | Dialect | Kenmerk | Valkuil |
|--------|---------|---------|---------|
| Brabanders | Brabants | Zachte g, "ge/gij", warm, melodisch | NOOIT karikatuur. Het is geen sketc. Het is hoe deze mensen echt praten. |
| Randstad | ABN / Randstedelijk | Hard, staccato, corporate-taal | NOOIT overdreven Goois. Nuchter ABN met hier en daar een anglicisme. |
| Limburgers | Limburgs | Zachte, zingende intonatie, nasaal | NOOIT dik Limburgs toneeldialect. Subtiel, melodisch, alsof het land zingt. |
| Belgen | Vlaams | Zachter dan Nederlands, meer legato | NOOIT Franstalig Belgisch. Vlaams, met af en toe een Frans woord. |

### 1.3 Audio Kwaliteitsregels

- **Minimale duur**: 2 seconden per voice line (korter klinkt afgehakt)
- **Volume boost**: +12dB post-processing op alle hero lines (heroes moeten BOVEN het gevecht uit komen)
- **Bass**: Mijnbaas en Boer krijgen extra bass (+3dB lage frequenties)
- **Reverb**: Mijnbaas-lines in tunnels: extra reverb (cave setting). Maasmeester: licht waterecho.
- **Compression**: Alle hero lines door dezelfde compressor voor consistentie

---

## 2. Brabanders Heroes {#2-brabanders}

### 2.1 De Prins van Brabant {#21-de-prins}

#### ElevenLabs Settings

| Parameter | Waarde | Reden |
|-----------|--------|-------|
| **Voice** | Richard (cloned) | Authentiek Brabants accent |
| **Voice ID** | `KJMAev3goFD3WOh1hVBT` | — |
| **Model** | eleven_multilingual_v2 | Beste voor Nederlandse dialecten |
| **Stability** | 0.40 | Laag — de Prins is expressief, emotioneel, wisselend |
| **Similarity** | 0.80 | Hoog — de stem moet herkenbaar blijven |
| **Style** | 0.45 | Hoog — veel emotionele variatie nodig |
| **Speed** | 1.05 | Iets sneller dan normaal — de Prins spreekt energiek |
| **Language** | nl | — |

#### Voice Acting Direction

**Kernkwaliteit**: Warmte. De Prins klinkt als de populairste man aan de bar — iemand naar wie je wilt luisteren, niet uit plicht maar uit goesting. Zijn stem is een arm om je schouder.

**Registers**:

| Register | Wanneer | Stem-karakter | Voorbeeld |
|----------|---------|--------------|-----------|
| **Opgewekt** | Selectie, idle, overwinning | Licht, glimlachend, zacht Brabants | *"ALAAF! Wa gansen we doen?"* |
| **Bevelen** | Aanvallen, verplaatsen | Steviger, lager, maar nooit boos | *"Erop! Brabanders — lansen we gansen!"* |
| **Inspirerend** | Toespraken, abilities | Voluit, crescendo, bijna zingend | *"Voor elke kroeg! Voor elke kermis! ALAAF!"* |
| **Kwetsbaar** | Near death, emotionele momenten | Zacht, trillend, bijna fluisterend | *"Boer... neem de scepter... ge kunt dit..."* |
| **Humor** | Idle banter, ontmoetingen | Droog, timing is alles, lichte grijns | *"Hoeveel vergaderingen zou dat gekost hebben?"* |

**Dialect-specifiek**:
- "Ge/gij" consequent gebruiken, nooit "je/jij"
- Zachte g altijd (inherent aan Richard's kloon)
- Eind-n inslikken: "ganse" niet "gansen" in uitspraak
- "Nie" in plaats van "niet"
- "Wa" in plaats van "wat"
- "Schoon" voor "mooi"
- NOOIT "-ansen" suffix als grap (Richard vindt dat niet grappig)

**Emotionele beats per line-categorie**:

| Categorie | Emotie | Intensiteit | Technische noot |
|-----------|--------|-------------|-----------------|
| Selectie | Enthousiast, klaar voor actie | 7/10 | Speed 1.1, stability 0.35 |
| Beweging | Bevestigend, energiek | 5/10 | Speed 1.0, stability 0.45 |
| Aanval | Strijdlustig, warm | 8/10 | Speed 1.1, stability 0.30, style 0.55 |
| Ability (Toespraak) | Episch, crescendo | 10/10 | Speed 0.95, stability 0.25, style 0.60 |
| Ability (ALAAF!) | Extatisch, schreeuwend | 10/10 | Speed 1.0, stability 0.20, style 0.70 |
| Near death | Gebroken, fluisterend | 3/10 | Speed 0.85, stability 0.50, style 0.30 |
| Idle | Ontspannen, peinzend | 4/10 | Speed 0.95, stability 0.50, style 0.35 |
| Victory | Vreugde, opluchting | 9/10 | Speed 1.1, stability 0.30, style 0.50 |

---

### 2.2 De Boer van Brabant {#22-de-boer}

#### ElevenLabs Settings

| Parameter | Waarde | Reden |
|-----------|--------|-------|
| **Voice** | Richard (cloned) of Joost | Zelfde accent, maar dieper en trager |
| **Voice ID** | `KJMAev3goFD3WOh1hVBT` (Richard) of `Q6dV0r9H1dI4d6gz3NVD` (Joost) | Joost als alternatief voor variatie |
| **Model** | eleven_multilingual_v2 | — |
| **Stability** | 0.60 | Hoger — de Boer is stabiel, kalm, voorspelbaar |
| **Similarity** | 0.80 | Hoog — herkenbare stem |
| **Style** | 0.20 | Laag — de Boer is niet expressief. Zijn kracht zit in WAT hij zegt, niet HOE. |
| **Speed** | 0.90 | Langzamer — de Boer haast zich niet |
| **Language** | nl | — |

#### Voice Acting Direction

**Kernkwaliteit**: Gewicht. Elke zin van de Boer voelt als een zware steen die op tafel wordt gelegd. Niet agressief, niet luid — maar onverzettelijk. De Boer praat alsof elk woord hem moeite kost, en daarom telt elk woord.

**Registers**:

| Register | Wanneer | Stem-karakter | Voorbeeld |
|----------|---------|--------------|-----------|
| **Nuchter** | Selectie, bevestiging | Vlak, laag, droog | *"Is goed."* |
| **Krachtig** | Aanval, abilities | Diep, borst-resonantie, langzaam stijgend | *"Brabant buigt NIE."* |
| **Tender** | Zeldzaam — verwijzingen naar dochter, boerderij | Zachter, bijna fluisterend, kwetsbaar | *"Mijn dochter zou dit moeten zien..."* |
| **Woede** | CEO-confrontaties, vernietigde boerderijen | Laag, langzaam, controlerend — geen schreeuwen, maar de lucht trilt | *"Dat. Was. Mijn. Land."* |
| **Droog** | Idle, observaties | Monotoon met een vleugje ironie | *"Meer beton. Schitterend."* |

**Dialect-specifiek**:
- Identiek aan de Prins qua Brabants, maar TRAGER en KORTER
- Zinnen van maximaal 5-8 woorden waar mogelijk
- Pauzes MIDDEN in zinnen — de Boer denkt na terwijl hij praat
- "Ge" en "gij" maar minder dan de Prins — de Boer praat meer in stellingen dan vragen
- NOOIT vloeken of schelden — de Boer is te waardig voor scheldwoorden

**Emotionele beats per line-categorie**:

| Categorie | Emotie | Intensiteit | Technische noot |
|-----------|--------|-------------|-----------------|
| Selectie | Kalm, bevestigend | 3/10 | Speed 0.85, stability 0.65 |
| Beweging | Nuchter | 2/10 | Speed 0.90, stability 0.70 |
| Aanval | Beheerste woede | 6/10 | Speed 0.90, stability 0.55, style 0.30 |
| Ability (Mestvork) | Krachtig, laag grommen | 8/10 | Speed 0.85, stability 0.45, style 0.35 |
| Ability (Opstand) | Bevelen, stern | 7/10 | Speed 0.95, stability 0.50, style 0.25 |
| Ability (Tractor) | Strijdlustig, zeldzaam expressief | 9/10 | Speed 1.0, stability 0.35, style 0.40 |
| Near death | Koppig, weigert op te geven | 5/10 | Speed 0.80, stability 0.60, style 0.25 |
| Idle | Peinzend, melancholisch | 3/10 | Speed 0.85, stability 0.65, style 0.20 |
| Victory | Opgelucht, kort | 4/10 | Speed 0.90, stability 0.60, style 0.20 |

---

## 3. Randstad Heroes {#3-randstad}

### 3.1 De CEO {#31-de-ceo}

#### ElevenLabs Settings

| Parameter | Waarde | Reden |
|-----------|--------|-------|
| **Voice** | Tijs | Diep, autoritair, podcast-host kwaliteit |
| **Voice ID** | `YgjXqgzBJa9op0K278OW` | — |
| **Model** | eleven_multilingual_v2 | — |
| **Stability** | 0.70 | Hoog — de CEO is gecontroleerd, berekend |
| **Similarity** | 0.85 | Zeer hoog — consistentie is de CEO's identiteit |
| **Style** | 0.25 | Laag-medium — emotie is zeldzaam en daarom impactvol |
| **Speed** | 1.00 | Precies normaal — de CEO verspilt geen seconde, maar haast zich ook niet |
| **Language** | nl | — |

#### Voice Acting Direction

**Kernkwaliteit**: Controle. De CEO klinkt als een man die de temperatuur in de kamer bepaalt door binnen te lopen. Zijn stem is een boardroom: koel, akoestisch perfect, en je WEET dat er security bij de deur staat.

**Registers**:

| Register | Wanneer | Stem-karakter | Voorbeeld |
|----------|---------|--------------|-----------|
| **Corporate** | Selectie, bevelen, standaard | Vlak, beleefd, zakelijk | *"Begrepen. Voer het uit."* |
| **Dreigend** | Confrontaties, vijandelijke heroes | Lager, langzamer, fluisterend bijna | *"Dit is niet persoonlijk. Dit is kwartaalcijfers."* |
| **Triomfantelijk** | Overwinning, gebouw veroverd | Een vleugje warmte — maar berekend | *"De portfolio groeit."* |
| **Brekend** | Near death, Veldkwartier onder vuur | Voor het EERST onstabiel — stem trilt, sneller, hoger | *"Dit is NIET het scenario! NIET het scenario!"* |
| **Venijnig** | Ontslagronde ability, Golden Handshake | Koud, scherp, geen empathie | *"Uw contract is beeindigd."* |

**Dialect-specifiek**:
- Standaard ABN. Geen dialect. De CEO heeft zijn achtergrond gepolished tot er niets van over is.
- Formeel: "u" in plaats van "je" tegen vijanden. "We" (pluralis majestatis van bedrijven) als hij over zichzelf praat.
- Corporate jargon bewust: "deliverables," "stakeholders," "ROI," "KPI" — maar nooit overdreven
- Correcte zinsbouw, geen afkortingen, geen straattaal
- Engelstalige termen met Nederlandse uitspraak (niet Amerikaans)

**Emotionele beats per line-categorie**:

| Categorie | Emotie | Intensiteit | Technische noot |
|-----------|--------|-------------|-----------------|
| Selectie | Neutraal, efficiënt | 2/10 | Speed 1.0, stability 0.75 |
| Beweging | Zakelijk | 1/10 | Speed 1.0, stability 0.80 |
| Aanval | Koud, berekend | 4/10 | Speed 1.0, stability 0.70, style 0.20 |
| Ability (Kwartaalcijfers) | Tevreden, superieur | 5/10 | Speed 1.0, stability 0.65, style 0.30 |
| Ability (Golden Handshake) | Venijnig, scherp | 6/10 | Speed 0.95, stability 0.60, style 0.35 |
| Ability (Overname) | Triomfantelijk, koud | 7/10 | Speed 1.0, stability 0.55, style 0.30 |
| Near death | PANIEK — stem breekt | 9/10 | Speed 1.15, stability 0.30, style 0.50 |
| Idle | Geïrriteerd, ongeduldig | 3/10 | Speed 1.05, stability 0.70, style 0.20 |
| Victory | Tevreden, maar nooit warm | 4/10 | Speed 1.0, stability 0.70, style 0.20 |

**Cruciaal**: De near-death voice lines zijn het ENIGE moment waarop de CEO echt klinkt. Het is de enige keer dat de mask afvalt. Dit moet VOELBAAR anders zijn dan alle andere lines.

---

### 3.2 De Politicus {#32-de-politicus}

#### ElevenLabs Settings

| Parameter | Waarde | Reden |
|-----------|--------|-------|
| **Voice** | Daniel Wichers | "Gooische" stem — perfect voor Randstad-politicus |
| **Voice ID** | `UdwnkJaZxPCOeR3qITvA` | — |
| **Model** | eleven_multilingual_v2 | — |
| **Stability** | 0.35 | Laag — de Politicus is onstabiel, wisselend, acteerend |
| **Similarity** | 0.75 | Medium-hoog |
| **Style** | 0.55 | Hoog — hij is een PERFORMER. Elke zin is theater. |
| **Speed** | 1.10 | Sneller — de Politicus praat te veel en te snel |
| **Language** | nl | — |

#### Voice Acting Direction

**Kernkwaliteit**: Gladheid. De Politicus klinkt als een autoverkoper in een maatpak. Zijn stem is olie: het glijdt overal doorheen, het is moeilijk vast te pakken, en je weet eigenlijk niet precies wanneer je bedrogen bent.

**Registers**:

| Register | Wanneer | Stem-karakter | Voorbeeld |
|----------|---------|--------------|-----------|
| **Campagnemodus** | Standaard, toespraken | Warm, toegankelijk, "ik begrijp u" | *"Ik begrijp uw zorgen volledig..."* |
| **Debat** | Abilities, confrontaties | Scherper, sneller, puntig | *"Artikel 47b, lid 3, paragraaf—"* |
| **Lafheid** | Near death, dreiging | Hogere stem, sneller, hakkelen | *"W-wacht! Ik kan onderhandelen!"* |
| **Manipulatief** | Lobby, buffs | Fluisterend, intiem, alsof hij een geheim deelt | *"Tussen u en mij... de CEO weet dit niet..."* |
| **Onthulling** | Verraadmoment, breakdown | Rauw, ontdaan van performance | *"De CEO gaat me niet redden, he?"* |

**Dialect-specifiek**:
- ABN met een vleugje Goois (Daniel Wichers' natuurlijke accent)
- "U" tegen publiek, "je" in vertrouwelijke momenten — de switch is veelzeggend
- Lange zinnen, subclauses, zijpaden — de Politicus praat om te VERMIJDEN, niet om te zeggen
- Politiek jargon: "in overweging nemen," "naar aanleiding van," "het voorstel luidt"
- Af en toe een Engels woord dat hij verkeerd uitspreekt (of juist te goed)

**Emotionele beats per line-categorie**:

| Categorie | Emotie | Intensiteit | Technische noot |
|-----------|--------|-------------|-----------------|
| Selectie | Overdreven enthousiast | 6/10 | Speed 1.1, stability 0.30, style 0.60 |
| Beweging | Aarzelend | 3/10 | Speed 1.0, stability 0.40 |
| Aanval | Overdreven dapper (compenserend) | 7/10 | Speed 1.15, stability 0.30, style 0.55 |
| Ability (Belofte) | Charismatisch, te mooi | 8/10 | Speed 1.1, stability 0.30, style 0.65 |
| Ability (Kamerdebat) | Autoritair, parlementair | 7/10 | Speed 1.0, stability 0.40, style 0.50 |
| Ability (Lobby) | Fluisterend, samenzweerderig | 4/10 | Speed 0.90, stability 0.50, style 0.40 |
| Near death | Panisch, onthullend | 9/10 | Speed 1.2, stability 0.20, style 0.60 |
| Idle | Nerveus, pratend tegen zichzelf | 5/10 | Speed 1.05, stability 0.35, style 0.50 |
| Victory | Zelfgefeliciterend, hol | 6/10 | Speed 1.1, stability 0.35, style 0.55 |

---

## 4. Limburgers Heroes {#4-limburgers}

### 4.1 De Mijnbaas {#41-de-mijnbaas}

#### ElevenLabs Settings

| Parameter | Waarde | Reden |
|-----------|--------|-------|
| **Voice** | Luk Balcer | 55 jaar, Belgisch Limburg, wijs en diep |
| **Voice ID** | `ppGIZI01uUlIWI734dUU` | — |
| **Model** | eleven_multilingual_v2 | — |
| **Stability** | 0.65 | Hoog — de Mijnbaas is STABIEL. Als een rots. |
| **Similarity** | 0.80 | Hoog — herkenbaarheid is cruciaal |
| **Style** | 0.20 | Laag — zijn expressie zit in PAUZES, niet in variatie |
| **Speed** | 0.80 | Langzaam — de Mijnbaas haast zich nooit. Elke zin is een besluit. |
| **Language** | nl | — |

#### Voice Acting Direction

**Kernkwaliteit**: Diepte. De Mijnbaas klinkt als de aarde zelf. Zijn stem komt van ergens diep — niet alleen qua toonhoogte, maar qua karakter. Als de Mijnbaas spreekt, stoppen mensen met praten. Niet uit angst. Uit respect.

**Registers**:

| Register | Wanneer | Stem-karakter | Voorbeeld |
|----------|---------|--------------|-----------|
| **Autoriteit** | Bevelen, strategie | Laag, langzaam, zwaar als mergelsteen | *"Tunnel drie. Nu."* |
| **Vaderlijk** | Troepen aanmoedigen | Iets warmer, een halve toon hoger | *"Gluck auf, jongens. Gluck auf."* |
| **Droog** | Humor, observaties | Onveranderd — maar er zit een grijns ACHTER de woorden | *"Die man heeft duidelijk nooit Limburgse vlaai geproefd."* |
| **Pijnlijk** | Grot verloren, troepen gevallen | Zachter, trager, een BARST in de rots | *"De grotten... driehonderd jaar... ingestort."* |
| **Woede** | CEO-confrontaties | Niet luider — LAGER. De grond trilt. | *"Probeer. Het. Maar."* |

**Dialect-specifiek**:
- Limburgs dialect: "ich" voor "ik", "dich" voor "jij", "waat" voor "wat"
- "Jao" voor "ja", "nee" blijft "nee" (soms "neet")
- "Sjoen" voor "mooi", "hej" als begroeting
- "Gluck auf" als rituele uitdrukking (mijnwerkersgroet)
- Zachte, zingende intonatie — maar bij de Mijnbaas INGEHOUDEN. Hij zingt niet; hij resoneert.
- Korte zinnen. Maximaal 6 woorden als het kan. De Mijnbaas spaart zijn woorden als kolen.
- NOOIT ABN. NOOIT Brabants. NOOIT -ansen suffix.

**Emotionele beats per line-categorie**:

| Categorie | Emotie | Intensiteit | Technische noot |
|-----------|--------|-------------|-----------------|
| Selectie | Bevestigend, minimaal | 2/10 | Speed 0.80, stability 0.70 |
| Beweging | Nuchter | 1/10 | Speed 0.80, stability 0.75 |
| Aanval | Beheerst, zwaar | 5/10 | Speed 0.80, stability 0.60, style 0.25 |
| Ability (Instorten) | Krachtig, borst | 8/10 | Speed 0.85, stability 0.45, style 0.35 |
| Ability (Gluck Auf) | Vaderlijk, warm | 6/10 | Speed 0.80, stability 0.55, style 0.30 |
| Ability (Aardbeving) | Donderend, ultiem | 10/10 | Speed 0.75, stability 0.30, style 0.40 |
| Near death | Gebroken, maar nog steeds sterk | 4/10 | Speed 0.75, stability 0.60, style 0.25 |
| Idle | Peinzend, diep | 2/10 | Speed 0.75, stability 0.70, style 0.15 |
| Victory | Kort, tevreden | 3/10 | Speed 0.80, stability 0.65, style 0.20 |

**Regie-aanwijzing voor de pauze**: De Mijnbaas gebruikt STILTE als wapen. Voeg bewust een halve seconde pauze toe aan het begin van elke line. Hij denkt na voor hij spreekt. Altijd.

---

### 4.2 De Maasmeester {#42-de-maasmeester}

#### ElevenLabs Settings

| Parameter | Waarde | Reden |
|-----------|--------|-------|
| **Voice** | Reinoud | "The nasal limburger" — nasaal, melodisch |
| **Voice ID** | `5tiZStRJQ98Xw420MFFx` | — |
| **Model** | eleven_multilingual_v2 | — |
| **Stability** | 0.30 | Laag — de Maasmeester is VLOEIEND, veranderlijk als water |
| **Similarity** | 0.75 | Medium-hoog |
| **Style** | 0.50 | Hoog — poetisch, melodisch, bijna zingend |
| **Speed** | 0.85 | Langzaam maar VLOEIEND — geen pauzes zoals de Mijnbaas, maar een constante stroom |
| **Language** | nl | — |

**Post-processing**: Licht waterecho (reverb met korte delay, lage decay). De Maasmeester klinkt alsof hij in een grot bij een ondergrondse rivier staat, zelfs als hij boven de grond is.

#### Voice Acting Direction

**Kernkwaliteit**: Stroom. De Maasmeester praat als water stroomt: continu, ononderbroken, soms een fluistering, soms een donderslag. Zijn zinnen vloeien in elkaar over. Er zijn geen harde overgangen — alles is een rivier.

**Registers**:

| Register | Wanneer | Stem-karakter | Voorbeeld |
|----------|---------|--------------|-----------|
| **Kalm water** | Standaard, observaties | Zacht, vloeiend, bijna een fluistering | *"De stroom vertelt... er komt verandering."* |
| **Stijgend water** | Abilities opladen | Luider wordend, als een rivier die zwelt | *"De Maas stijgt... STIJGT... NU!"* |
| **Vloedgolf** | Ultimate, woede | Donderend, oncontroleerbaar, KRACHT | *"WATERSNOOD!"* |
| **Bron** | Poetische momenten, idle | Fluisterend, intiem, als regendruppels | *"Elke druppel... was ooit een oceaan..."* |
| **IJs** | Confrontaties met de CEO | Koud, stil, als bevroren water | *"Gij probeert de rivier recht te trekken. Dat is altijd mislukt."* |

**Dialect-specifiek**:
- Limburgs, maar ZACHTER dan de Mijnbaas — meer melodie, minder gewicht
- "Ich" en "dich" maar met een vloeienere uitspraak
- Metaforen ALTIJD water-gerelateerd: stroom, bron, vloed, druppel, rivier, zee
- De Maasmeester spreekt soms in rijm — niet opzettelijk, maar omdat zijn gedachten zo stromen
- Langere zinnen dan de Mijnbaas — water houdt niet op bij drie woorden
- Af en toe een moment van volledige stilte midden in een zin — als een rivier die een rots omzeilt

**Emotionele beats per line-categorie**:

| Categorie | Emotie | Intensiteit | Technische noot |
|-----------|--------|-------------|-----------------|
| Selectie | Mysterieus, afwezig | 3/10 | Speed 0.85, stability 0.25, style 0.55 |
| Beweging | Stromend | 2/10 | Speed 0.85, stability 0.30, style 0.45 |
| Aanval | Krachtig, als een golf | 7/10 | Speed 0.90, stability 0.25, style 0.55 |
| Ability (Maasvloed) | Crescendo van stil naar donderend | 9/10 | Speed 0.80→1.0, stability 0.20, style 0.65 |
| Ability (Nevelgordijn) | Fluisterend, mystiek | 5/10 | Speed 0.80, stability 0.25, style 0.60 |
| Ability (Watersnood) | Maximaal, brekend | 10/10 | Speed 0.90, stability 0.15, style 0.70 |
| Near death | Serene acceptatie | 3/10 | Speed 0.75, stability 0.35, style 0.45 |
| Idle | Dromerig, poetisch | 2/10 | Speed 0.80, stability 0.25, style 0.55 |
| Victory | Kalm, tevreden | 3/10 | Speed 0.85, stability 0.30, style 0.45 |

---

## 5. Belgen Heroes {#5-belgen}

### 5.1 De Frietkoning {#51-de-frietkoning}

#### ElevenLabs Settings

| Parameter | Waarde | Reden |
|-----------|--------|-------|
| **Voice** | Walter | Warm, professioneel, Belgisch — storytelling kwaliteit |
| **Voice ID** | `tRyB8BgRzpNUv3o2XWD4` | — |
| **Model** | eleven_multilingual_v2 | — |
| **Stability** | 0.35 | Laag — de Frietkoning is THEATRAAL, vol variatie |
| **Similarity** | 0.80 | Hoog — zijn stem moet herkenbaar zijn zelfs midden in chaos |
| **Style** | 0.60 | Hoog — de Frietkoning is een PERFORMER |
| **Speed** | 1.05 | Iets sneller — hij heeft veel te zeggen en weinig geduld |
| **Language** | nl | — |

#### Voice Acting Direction

**Kernkwaliteit**: Grandeur. De Frietkoning klinkt als een Shakespeareaans acteur die op een Belgisch marktplein staat te speechen — met een puntzak frieten in de hand. Elke zin is een proclamatie. Elke pauze is theater. Hij is de meest entertainende stem in het hele spel.

**Registers**:

| Register | Wanneer | Stem-karakter | Voorbeeld |
|----------|---------|--------------|-----------|
| **Koninklijk** | Decreten, bevelen, abilities | Voluit, resonerend, pluralis majestatis | *"WIJ hebben beslist!"* |
| **Theatraal** | Ontmoetingen, confrontaties | Overdreven, expressief, handgebaren HOORBAAR | *"SACREBLEU! Dit is een OORLOGSMISDAAD!"* |
| **Warm** | Troepen aanmoedigen, healen | Zacht Vlaams, bijna vaderlijk | *"Hier, jongens. Frieten. Verse."* |
| **Komisch** | Idle, frieten-uitdelen | Timing is alles, droog-Belgische humor | *"Onze zes regeringen zijn het eens: de friet is heilig."* |
| **Kwetsbaar** | Near death, zeldzaam | Onder de mantel: een gewone man | *"Brouwer... bewaar ons een glas..."* |

**Dialect-specifiek**:
- Vlaams: zachte uitspraak, "ge/gij", langere klinkers
- "Amai" als uitroep (niet te vaak — max 2x per sessie)
- "Allez" als aansporng
- "Goesting" voor "zin"
- Af en toe een Frans woord ("sacrebleu", "magnifiek", "mon dieu") maar NOOIT complete Franse zinnen
- Pluralis majestatis: "Wij" in plaats van "ik" — consequent, zelfs in casualgesprekken
- Belgische humor: understatement, absurdisme, zelfrelativering

**Emotionele beats per line-categorie**:

| Categorie | Emotie | Intensiteit | Technische noot |
|-----------|--------|-------------|-----------------|
| Selectie | Koninklijk, enthousiast | 7/10 | Speed 1.05, stability 0.30, style 0.65 |
| Beweging | Bevestigend met flair | 5/10 | Speed 1.0, stability 0.35, style 0.55 |
| Aanval | Heroisch, theatraal | 8/10 | Speed 1.1, stability 0.30, style 0.65 |
| Ability (Portie) | Warm, genereus | 6/10 | Speed 1.0, stability 0.40, style 0.50 |
| Ability (Decreet) | Majestatisch, bevelend | 9/10 | Speed 1.0, stability 0.30, style 0.60 |
| Ability (Compromis) | Triomfantelijk, tactisch | 10/10 | Speed 1.05, stability 0.25, style 0.65 |
| Near death | Echt, ontdaan van theater | 4/10 | Speed 0.85, stability 0.50, style 0.35 |
| Idle | Entertainend, vrij | 5/10 | Speed 1.0, stability 0.35, style 0.60 |
| Victory | Feestelijk, deelt frieten uit | 9/10 | Speed 1.1, stability 0.25, style 0.65 |

---

### 5.2 De Abdijbrouwer {#52-de-abdijbrouwer}

#### ElevenLabs Settings

| Parameter | Waarde | Reden |
|-----------|--------|-------|
| **Voice** | Hans Claesen | Professionele Vlaamse stem, warm |
| **Voice ID** | `s7Z6uboUuE4Nd8Q2nye6` | — |
| **Model** | eleven_multilingual_v2 | — |
| **Stability** | 0.65 | Hoog — de Abdijbrouwer is de meest STABIELE character in het spel |
| **Similarity** | 0.80 | Hoog |
| **Style** | 0.25 | Laag — sereniteit, niet expressie. Zijn kracht zit in de RUST. |
| **Speed** | 0.80 | Langzaam — meditatief, bedachtzaam |
| **Language** | nl | — |

**Post-processing**: Zeer subtiele reverb (kathedraalsetting, lang decay, laag volume). De Abdijbrouwer klinkt alsof hij in een kapel staat, zelfs op het slagveld. Dit creëert een continu gevoel van heiligheid rondom zijn character.

#### Voice Acting Direction

**Kernkwaliteit**: Sereniteit. De Abdijbrouwer klinkt als een man die niets te verliezen heeft — niet uit wanhoop, maar uit vrede. Zijn stem is een kaars in de wind: klein, warm, en verrassend moeilijk te doven.

**Registers**:

| Register | Wanneer | Stem-karakter | Voorbeeld |
|----------|---------|--------------|-----------|
| **Meditatief** | Standaard, idle | Zacht, laag, constante cadans — als een gebed | *"De stilte vertelt meer dan woorden..."* |
| **Wijs** | Bier-metaforen, adviezen | Iets warmer, een glimlach in de stem | *"Zoals het Trappistenbier: geduld."* |
| **Zegenend** | Healing, buffs | Ritueel, bijna zingend | *"Trappistenzegen. Drinkt. En genees."* |
| **Scherp** | Confrontaties, silence ability | Plotseling helder, geen mist — een mes in de stilte | *"Genoeg gepraat. Stilte nu."* |
| **Menselijk** | Zeldzaam — near death, emotioneel | Kwetsbaar, een oude man die weet dat het einde nadert | *"Het Zevende Vat... wie bewaart het recept..."* |

**Dialect-specifiek**:
- Zacht Vlaams, maar OUDER klinkend dan de Frietkoning — formeler, kerksVlaams
- "Ge" en "gij" consequent
- Geen straattaal, geen modernismen
- Bier-metaforen in ELKE context: gisting = groei, brouwen = oorlog, tap = leiderschap
- Zinnen eindigen vaak met een pauze en een "..."
- Soms een Latijns woord (als voormalig abt): "Pax vobiscum" bij healing, "Ora et labora" bij idle
- De Abdijbrouwer parafraseert NOOIT — hij zegt het een keer, goed, en houdt dan op

**Emotionele beats per line-categorie**:

| Categorie | Emotie | Intensiteit | Technische noot |
|-----------|--------|-------------|-----------------|
| Selectie | Serene bevestiging | 2/10 | Speed 0.80, stability 0.70, style 0.20 |
| Beweging | Rustig, bedachtzaam | 1/10 | Speed 0.80, stability 0.70, style 0.15 |
| Aanval | Verdrietig maar vastbesloten | 4/10 | Speed 0.85, stability 0.60, style 0.25 |
| Ability (Stiltegelofte) | Scherp, onverwacht krachtig | 7/10 | Speed 0.90, stability 0.50, style 0.35 |
| Ability (Zegen) | Warm, ritueel | 5/10 | Speed 0.75, stability 0.60, style 0.30 |
| Ability (Avondbrouwsel) | Episch, oud, krachtig | 9/10 | Speed 0.80, stability 0.40, style 0.45 |
| Near death | Vreedzaam, bijna blij | 3/10 | Speed 0.75, stability 0.65, style 0.25 |
| Idle | Contemplatief | 1/10 | Speed 0.75, stability 0.70, style 0.20 |
| Victory | Dankbaar, stil | 2/10 | Speed 0.80, stability 0.65, style 0.20 |

---

## 6. Cross-Hero Dialoog Settings {#6-cross-hero}

Wanneer twee heroes een conversatie hebben (ontmoeting, confrontatie), passen de settings aan:

### 6.1 Brabanders onderling

De Prins en de Boer praten als familie. De Prins wordt iets rustiger (stability +0.10), de Boer wordt iets warmer (style +0.05). Hun dialogen voelen als een keukentafelgesprek.

### 6.2 Brabanders vs. Randstad

De Prins wordt FELLER tegen de Randstad (style +0.15, stability -0.10). De Boer wordt KOUDER (speed -0.05, stability +0.05). Het verschil laat zien wie ze echt zijn: de Prins wordt boos, de Boer wordt gevaarlijk.

### 6.3 Limburgers onderling

De Mijnbaas en de Maasmeester praten in een eigen ritme. De Mijnbaas wordt marginaal warmer (style +0.05). De Maasmeester wordt iets concreter (stability +0.10). Ze ontmoeten elkaar halverwege.

### 6.4 Belgen onderling

De Frietkoning dempt zijn theatraliteit voor de Abdijbrouwer (stability +0.15, style -0.10). De Abdijbrouwer wordt iets menselijker (style +0.10). Hun dialogen zijn de meest gebalanceerde in het spel.

### 6.5 Cross-factie ontmoetingen

| Ontmoeting | Setting-aanpassing | Reden |
|------------|-------------------|-------|
| Prins ↔ Mijnbaas | Prins: stability +0.15 (respectvoller, stiller) | De Prins voelt het gewicht van de Mijnbaas |
| Prins ↔ Frietkoning | Beide: style +0.10 (meer expressie, humor) | Twee performers die van elkaar genieten |
| Boer ↔ Mijnbaas | Geen aanpassing nodig | Ze zijn al identiek qua register |
| Maasmeester ↔ Abdijbrouwer | Beide: stability -0.05, speed -0.05 | De diepste, langzaamste dialoog in het spel |
| CEO ↔ Prins | CEO: stability -0.10 (geïrriteerd); Prins: style +0.10 (provocerend) | De CEO verliest controle; de Prins geniet |
| CEO ↔ Mijnbaas | CEO: stability -0.05 (licht onzeker); Mijnbaas: geen wijziging | De Mijnbaas verandert voor niemand |

---

## 7. Emotionele Beat Matrix {#7-emotionele-beats}

Overzicht van de emotionele journey van elke hero door de campaign:

### Brabanders Campaign

| Missie | Prins | Boer |
|--------|-------|------|
| 1 (Tutorial) | Nieuwsgierig, licht | N/A |
| 2 (Grens) | Vastbesloten, eerste strijd | N/A |
| 3 (Tilburg) | Woedend over gentrificatie | N/A |
| 4 (Den Bosch) | Gespannen, stealth | N/A |
| 5 (Limburg) | Diplomatiek, groeiend | N/A |
| 6 (Boerenopstand) | Inspirerend, rebel | N/A |
| 7 (Carnaval) | PIEK — vreugde in oorlogstijd | N/A |
| 8 (Verraad) | Gebroken, gevangen | N/A (zoekt de Prins) |
| 9 (Mijn van Waarheid) | Hersteld, alliantie | Geintroduceerd — nuchter, krachtig |
| 10 (Raad) | Leider, verantwoordelijk | Anker, stabiel |
| 11 (Slag om A2) | Episch, alles op het spel | Persoonlijk keerpunt (verwoeste boerderij) |
| 12 (Finale) | Koningschap zonder kroon | Thuiskomen |

### Randstad Campaign (als vijanden)

| Moment | CEO | Politicus |
|--------|-----|-----------|
| Eerste verschijning | Kalm, superieur | Glad, overmoedig |
| Mid-campaign | Geïrriteerd, maar gecontroleerd | Zenuwachtig, compenserend |
| Slag om A2 | Eerste barst — "Dit is NIET het scenario" | Probeert over te lopen |
| Finale | Volledig brekend | Alleen, verlaten |

### Limburgers Campaign

| Missie | Mijnbaas | Maasmeester |
|--------|----------|-------------|
| 1 (Mergelschacht) | Introductie — zwaar, autoritair | N/A |
| 2-3 (Exploratie) | Nuchter, beschermend | N/A |
| 4 (Venlo) | Strijdlustig, trots | N/A |
| 5 (Drielandenpunt) | Sceptisch over Belgen | Geintroduceerd — mysterieus, waterig |
| 6 (Mergelschild) | Defensief, vaderlijk | Support, vloeiend |
| 7 (Brabantse Handdruk) | Groeiend vertrouwen | Observerend |
| 8 (Mijn van Waarheid) | Diep, persoonlijk | Krachtig, element |

### Belgen Campaign

| Missie | Frietkoning | Abdijbrouwer |
|--------|-------------|-------------|
| 1 (Antwerpen) | Introductie — koninklijk, theatraal | N/A |
| 2 (Brugge) | Beschermend, warm | N/A |
| 3 (Brussel) | Woedend (Starbucks bij Manneken Pis!) | N/A |
| 4 (Spionage) | N/A | Geintroduceerd — stil, scherp |
| 5 (Alliantie) | Diplomatiek, groeiend | Observerend, wijs |
| 6 (Finale) | Alles op het spel | Zegenend, krachtig |

---

**Einde document**

*Versie 1.0.0 — 2026-04-11*
