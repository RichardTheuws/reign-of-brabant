# Reign of Brabant — Sub-PRD: Audio

**Versie**: 1.1.0
**Datum**: 2026-04-06
**Status**: Draft
**Auteur**: Audio Director Agent
**Parent**: PRD.md v1.0.0

---

## Inhoudsopgave

1. [Voice Line Script](#1-voice-line-script)
2. [SFX Catalogus](#2-sfx-catalogus)
3. [Muziek Cue Sheet](#3-muziek-cue-sheet)
4. [Audio Systeem Architectuur](#4-audio-systeem-architectuur)
5. [Voice Recording Guide](#5-voice-recording-guide)
6. [Productie Overzicht](#6-productie-overzicht)

---

## 1. Voice Line Script

### 1.0 Overzicht

| Factie | Units | Lijnen per unit (gem.) | Totaal lijnen |
|--------|-------|----------------------|---------------|
| Brabanders | 10 | ~14 | 140 |
| Randstad | 10 | ~14 | 140 |
| Limburgers | 8 | ~14 | 108 |
| Belgen | 8 | ~14 | 108 |
| **TOTAAL** | **36** | | **~496 lijnen** |

**Acties per unit (6 categorieen):**
- **Select** (3 varianten): speler klikt op de unit
- **Move** (3 varianten): speler geeft een move-commando
- **Attack** (3 varianten): speler geeft een attack-commando
- **Death** (2 varianten): unit sterft
- **Ability** (2 varianten): unit gebruikt een ability
- **Idle** (2 varianten): unit doet 30+ seconden niets

**Dialect richtlijnen:**
- **Brabanders**: Zachte g, echt Brabants dialect, warm en gezellig. Kernwoorden: "hedde", "ge", "nie", "moar", "laot", "dur", "houdoe"
- **Randstad**: Strak ABN, corporate buzzwords, droog. Kernwoorden: "stakeholders", "synergy", "alignment", "escaleren"
- **Limburgers**: Zachte klanken, kortere zinnen, mysterieuzer. Kernwoorden: "Gluck auf", "sjoen", "hej", "jao", "ich"
- **Belgen**: Vlaams, mix Frans/Nederlands, chaotisch warm. Kernwoorden: "amai", "allez", "goesting", "ambetant", "ne keer"

---

### 1.1 Brabanders

#### Boer (Worker)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Ja?" | Nuchter, kalm | 0.5 |
| Select | 2 | "Zeg het mar" | Bereidwillig | 0.8 |
| Select | 3 | "Ge hedde me nodig?" | Geduldig | 0.8 |
| Move | 1 | "Is goed" | Kort, bevestigend | 0.4 |
| Move | 2 | "Ik ga al, rustug an" | Ontspannen | 0.8 |
| Move | 3 | "Jao jao, ik loop al" | Licht geergerd | 0.8 |
| Attack | 1 | "Moet da nou?!" | Onwillig | 0.6 |
| Attack | 2 | "Vooruit dan moar..." | Zuchtend | 0.8 |
| Attack | 3 | "Ge vraagt erom, jong!" | Opgehitst | 0.8 |
| Death | 1 | "Wie... melkt de koeien..." | Stervend, bezorgd | 1.5 |
| Death | 2 | *kreun + zucht* | Stervend | 1.0 |
| Ability | 1 | "Hooivork erin! Komaan!" | Strijdlustig | 1.0 |
| Ability | 2 | "Dit is mijn land!" | Vastberaden | 0.8 |
| Idle | 1 | *humming van een volksliedje* | Tevreden, verveeld | 2.0 |
| Idle | 2 | "Die akker gaat zichzelf nie ploegen, he..." | Ongeduldig | 1.5 |

#### Carnavalvierder (Infantry)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "ALAAF!" | Euforisch, luid | 0.5 |
| Select | 2 | "Nog eentje dan!" | Aangeschoten vrolijk | 0.8 |
| Select | 3 | "Wa ist feest?!" | Verwonderd, euforisch | 0.6 |
| Move | 1 | "Op naar het feest!" | Enthousiast | 0.8 |
| Move | 2 | "Ik dans ernaartoe!" | Vrolijk | 0.8 |
| Move | 3 | "Polonaise dur de modder!" | Hysterisch blij | 1.0 |
| Attack | 1 | "Alaaf op je muil!" | Dronken agressief | 0.8 |
| Attack | 2 | "Brabant vergeet nie!" | Strijdkreet | 0.8 |
| Attack | 3 | "Ge gaat eraan, jongen!" | Feestend agressief | 0.8 |
| Death | 1 | "...moar het was zo'n mooi feest..." | Dromerig stervend | 1.5 |
| Death | 2 | "Alaaa..." *stopt abrupt* | Cutoff | 0.8 |
| Ability | 1 | "POLONAISE! Allemaal d'r bij!" | Commando, euforisch | 1.2 |
| Ability | 2 | "Vasthouden! Nie loslaoten!" | Roepend | 0.8 |
| Idle | 1 | *zingt* "Brabant, mooi land achter de rivieren..." | Neurieen | 2.5 |
| Idle | 2 | "Is 't al weer tied vur carnaval?" | Hoopvol | 1.2 |

#### Sluiper (Ranged / Stealth)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Ik ken iemand die iemand kent..." | Samenzweerderig | 1.2 |
| Select | 2 | "Niks gezien, niks gehoord" | Fluisterend | 1.0 |
| Select | 3 | "Psst... hier, jong" | Geheimzinnig | 0.6 |
| Move | 1 | "Sssst, ik ga al" | Fluisterend | 0.6 |
| Move | 2 | "Via het sluipweggetje" | Sluw | 0.8 |
| Move | 3 | "Ge hedde mij nooit gezien" | Samenzweerderig | 1.0 |
| Attack | 1 | "Van achteren! Surprise!" | Verrassingsluid | 0.8 |
| Attack | 2 | "Verrassing, slechterik!" | Vals lachend | 0.8 |
| Attack | 3 | "Niemand die dit ziet!" | Fluisterend agressief | 0.8 |
| Death | 1 | "Ze... hedde me gevonden..." | Fluisterend stervend | 1.2 |
| Death | 2 | *korte kreun* | Verrast | 0.5 |
| Ability | 1 | "Nu zie ge me... nu nie meer" | Mysterieus | 1.0 |
| Ability | 2 | "Weg ben ik, houdoe!" | Snel, fluisterend | 0.8 |
| Idle | 1 | "Ik verveel me... zal ik iemand bespioneren?" | Rusteloos | 1.5 |
| Idle | 2 | *stille voetstappen + zucht* | Ongeduldig | 1.0 |

#### Boerinne (Support / Healer)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Hedde al gegeten?" | Zorgzaam, warm | 0.8 |
| Select | 2 | "Kom hier, dan plak ik er een pleister op" | Moederlijk | 1.2 |
| Select | 3 | "Wa kan ik voor oe doen, schat?" | Behulpzaam | 1.0 |
| Move | 1 | "Ik kom eraan, wacht!" | Haastig, zorgzaam | 0.8 |
| Move | 2 | "Wacht even, ik pak de koekenpan" | Dreigend liefdevol | 1.2 |
| Move | 3 | "Goed, ik ga al!" | Moeder-toon | 0.6 |
| Attack | 1 | "Ge had moeten luisteren!" | Koekenpan-woede | 0.8 |
| Attack | 2 | "PAN EROP!" | Strijdkreet, koekenpan | 0.5 |
| Attack | 3 | "Da's voor uw eigen bestwil!" | Bestraffend | 0.8 |
| Death | 1 | "Wie... maakt het eten klaar nu..." | Bezorgd stervend | 1.5 |
| Death | 2 | "De koekenpan... die erft de kleine..." | Dramatisch | 1.5 |
| Ability | 1 | "Koffie en gebak! Komaan, aanschuiven!" | Warm, uitnodigend | 1.5 |
| Ability | 2 | "Even bijkomen, dan gaat 't weer" | Rustgevend | 1.0 |
| Idle | 1 | "Als niemand gewond is, dan ruim ik moar op" | Verantwoordelijk | 1.5 |
| Idle | 2 | *humming + gerinkel van pannen* | Huiselijk | 2.0 |

#### Muzikant (Buffer / Debuffer)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "En dan nu... LIMBO!" | Showman, enthousiast | 0.8 |
| Select | 2 | "Een, twee, drie, VIER!" | Aftellend, energiek | 0.8 |
| Select | 3 | "De fanfare is compleet!" | Trots | 0.8 |
| Move | 1 | "Marsorders! Voorwaarts!" | Militair-komisch | 0.8 |
| Move | 2 | "Ik speel onderweg wel dur" | Nonchalant | 1.0 |
| Move | 3 | "Links, rechts, links, rechts!" | Marcheerritme | 0.8 |
| Attack | 1 | "Luister hier naar, sukkel!" | Agressief muzikaal | 0.8 |
| Attack | 2 | "Ik blaas je weg, letterlijk!" | Dreigend, speels | 1.0 |
| Attack | 3 | "Tuba-aanval!" | Komisch strijdlustig | 0.6 |
| Death | 1 | *trieste tuba-noot + kreun* | Dramatisch komisch | 1.5 |
| Death | 2 | "De... muziek... stopt..." | Melancholisch | 1.2 |
| Ability | 1 | "IEDEREEN MEEZINGEN! Nu!" | Commando, euforisch | 1.0 |
| Ability | 2 | "Carnavalskraker drie, vier!" | Aftellend | 0.8 |
| Idle | 1 | *speelt een stukje carnavalsmuziek op tuba* | Verveeld | 2.5 |
| Idle | 2 | "Ge kunt me toch nie laote staan zonder publiek?" | Teleurgesteld | 1.5 |

#### Tractorrijder (Heavy / Cavalry)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Meer pk's dan ge aankunt!" | Trots, luid | 0.8 |
| Select | 2 | "Die akker ploegt zichzelf nie" | Nuchter boers | 1.0 |
| Select | 3 | "Motor draait, baas!" | Klaar voor actie | 0.8 |
| Move | 1 | "Volgas!" | Kort, krachtig | 0.4 |
| Move | 2 | "Ik rijd d'r dwars doorheen!" | Vastberaden | 0.8 |
| Move | 3 | "Berm of weg, maakt mij niks uit!" | Nonchalant | 1.0 |
| Attack | 1 | "AAN DE KANT!" | Brullend | 0.6 |
| Attack | 2 | "Ze gaan plat!" | Agressief | 0.5 |
| Attack | 3 | "Die ziet mijn bumper nie aankomen!" | Dreigend | 1.2 |
| Death | 1 | "De motor... slaat af... *cough*" | Stervend, mechanisch | 1.5 |
| Death | 2 | *motorstotter + crash-geluid + kreun* | Dramatisch | 1.5 |
| Ability | 1 | "VOLGAS! UIT DE WEG!" | Maximale intensiteit | 0.8 |
| Ability | 2 | "Tractorcharge! BRRRR!" | Motor + schreeuw | 0.8 |
| Idle | 1 | *motor stationair + "Ze laoten me moar wachten..."* | Motor idle + mompelen | 2.0 |
| Idle | 2 | "Zal ik een rondje rijden ofzo?" | Verveeld | 1.0 |

#### Frituurmeester (Siege)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Een grote friet met!" | Enthousiast, professional | 0.8 |
| Select | 2 | "Da wordt een kroket, jongen!" | Dreigend blij | 0.8 |
| Select | 3 | "Het vet is heet, baas!" | Klaar voor actie | 0.8 |
| Move | 1 | "Nie morsen!" | Voorzichtig, geconcentreerd | 0.5 |
| Move | 2 | "De frietkar rijdt!" | Trots | 0.6 |
| Move | 3 | "Met frituurvet op pad" | Nuchter | 0.8 |
| Attack | 1 | "Frituurvet in je gezicht!" | Agressief, koks-humor | 1.0 |
| Attack | 2 | "Frikandel SPECIAAL!" | Strijdkreet | 0.8 |
| Attack | 3 | "Ik bak ze BRUIN!" | Dreigende kok | 0.6 |
| Death | 1 | "De... frituur... gaat uit..." | Dramatisch stervend | 1.2 |
| Death | 2 | *sissend vet-geluid + kreun* | Tragisch | 1.0 |
| Ability | 1 | "Frikandel SPECIAAL! Brand!" | Maximaal enthousiast | 1.0 |
| Ability | 2 | "Kokend vet! Pas op je bakkes!" | Waarschuwend, dreigend | 1.0 |
| Idle | 1 | "Frieten bakken zichzelf nie, mensen" | Ongeduldig | 1.2 |
| Idle | 2 | *sissend vet + hummen* | Werkend, verveeld | 2.0 |

#### Praalwagen (Super Siege)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "De wagen is klaar!" | Trots, feestelijk | 0.8 |
| Select | 2 | "Alaaf en vooruit!" | Carnavalesk | 0.6 |
| Select | 3 | "Confetti geladen, baas!" | Klaar voor actie | 0.8 |
| Move | 1 | "De optocht gaat verder!" | Plechtig feestelijk | 0.8 |
| Move | 2 | "Langzaam moar zeker!" | Geduldig | 0.8 |
| Move | 3 | "Maak de weg vrij!" | Autoritair | 0.6 |
| Attack | 1 | "CONFETTI-KANON! VUUR!" | Explosief enthousiast | 1.0 |
| Attack | 2 | "Alaaf op je dak!" | Strijdlustig feestend | 0.8 |
| Attack | 3 | "Pak aan, van Oeteldonk!" | Carnavals-strijdkreet | 0.8 |
| Death | 1 | "De wagen... valt uiteen... *kraken*" | Crashend, dramatisch | 1.5 |
| Death | 2 | *confetti-explosie + instorten* | Episch tragisch | 1.5 |
| Ability | 1 | "MEGA-CONFETTI-BOMBARDEMENT!" | Maximale intensiteit | 1.2 |
| Ability | 2 | "Alles erop en eraan!" | Vol overgave | 0.8 |
| Idle | 1 | "De wagen staat klaar moar niemand kijkt..." | Teleurgesteld | 1.5 |
| Idle | 2 | *carnavalsmuziekje vanuit de wagen* | Sfeergeluid | 2.0 |

#### Prins van Brabant (Hero - Tank/Buffer)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "De Prins is hier!" | Koninklijk, warm | 0.8 |
| Select | 2 | "Alaaf, Brabant!" | Plechtig feestelijk | 0.8 |
| Select | 3 | "Spreek, onderdaan!" | Speels koninklijk | 0.8 |
| Move | 1 | "Voor Brabant!" | Heroisch | 0.5 |
| Move | 2 | "De Prins marcheert!" | Plechtig | 0.8 |
| Move | 3 | "Ik leid de optocht!" | Trots | 0.7 |
| Attack | 1 | "In naam van het worstenbroodje!" | Epische strijdkreet | 1.2 |
| Attack | 2 | "Brabant valt aan! ALAAF!" | Commando + kreet | 1.0 |
| Attack | 3 | "Scepter op je kop!" | Dreigend komisch | 0.6 |
| Death | 1 | "Het... carnaval... gaat dur... zonder mij..." | Dramatisch stervend | 2.0 |
| Death | 2 | "Lang... leve... Brabant..." | Laatste woorden | 1.2 |
| Ability (Toespraak) | 1 | "Luister, Brabanders! SAMEN zijn we STERK!" | Inspirerend, luid | 1.5 |
| Ability (Sleutel) | 2 | "De sleutel van de stad... is van ONS!" | Autoritair | 1.2 |
| Ability (Drie Dwaze Dansen) | 3 | "DRIE DWAZE DANSEN! Iedereen meedansen!" | Euforisch commando | 1.5 |
| Ultimate (ALAAF!) | 1 | "ALAAAAAF! BRABANT IS ONOVERWINNELIJK!" | Maximaal episch | 2.0 |
| Idle | 1 | "Een prins zonder volk... is moar een man met een hoed" | Filosofisch | 2.0 |
| Idle | 2 | *zingt zachtjes* "...want Brabant is het mooiste land..." | Sentimenteel | 2.5 |

#### Boer van Brabant (Hero - Tank/Summoner)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "De akker wacht" | Kalm, diep | 0.6 |
| Select | 2 | "Wat er ook komt, Brabant blijft staan" | Vastberaden | 1.2 |
| Select | 3 | "De Boer van Brabant, tot uw dienst" | Formeel warm | 1.2 |
| Move | 1 | "Ik ga waar de oogst me brengt" | Filosoof-boer | 1.0 |
| Move | 2 | "Mestvork vooruit!" | Strijdlustig | 0.6 |
| Move | 3 | "Daar gaat de boer" | Nuchter | 0.5 |
| Attack | 1 | "De oogst is nu... JIJ!" | Dreigend, diep | 1.0 |
| Attack | 2 | "Mestvork erin! Geen genade!" | Agressief | 1.0 |
| Attack | 3 | "Dit is MIJN land!" | Territoriaal | 0.6 |
| Death | 1 | "De grond... neemt me terug..." | Vredevol stervend | 1.5 |
| Death | 2 | "Plant een boom... op mijn graf..." | Poetisch | 1.5 |
| Ability (Mestverspreider) | 1 | "MEST! Overal MEST!" | Maniakaal blij | 1.0 |
| Ability (Opstand) | 2 | "BOEREN, AAN MIJ! OPSTAND!" | Rebellenkreet | 1.2 |
| Ultimate (Tractorcharge) | 1 | "TRACTOOOOR! UIT DE WEG OF ERONDER!" | Maximaal volume | 1.5 |
| Idle | 1 | "De grond fluistert... ze zegt da er onkruid staat" | Mystiek-boer | 2.0 |
| Idle | 2 | "Ik mis mijn koeien" | Sentimenteel | 0.8 |

---

### 1.2 Randstad

#### Stagiair (Worker)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Ik hoop dat dit telt voor mijn stageverslag" | Onzeker, hoopvol | 1.5 |
| Select | 2 | "Kan ik dit op mijn LinkedIn zetten?" | Naief enthousiast | 1.2 |
| Select | 3 | "Ja, euh, hoi! Wat kan ik doen?" | Nerveus | 1.0 |
| Move | 1 | "Ik ga! ...waar moest ik heen?" | Verward | 1.0 |
| Move | 2 | "Oke, dit is mijn moment!" | Over-enthousiast | 0.8 |
| Move | 3 | "Loopt mijn contract nog? Oke, ik ga" | Onzeker | 1.2 |
| Attack | 1 | "Dit stond echt niet in mijn functieprofiel!" | Paniek | 1.5 |
| Attack | 2 | "Mijn manager gaat hier van horen!" | Dreigend maar zwak | 1.2 |
| Attack | 3 | "Ik... ik vecht! Met... mijn stapler!" | Wanhopig | 1.2 |
| Death | 1 | "Mijn... stageverslag... was bijna af..." | Stervend, tragisch | 1.5 |
| Death | 2 | "Geen evaluatie meer nodig..." | Donker komisch | 1.2 |
| Ability | 1 | "Ik heb hier een spreadsheet voor!" | Desperaat hulpvaardig | 1.0 |
| Ability | 2 | "PowerPoint presentatie incoming!" | Over-enthousiast | 1.0 |
| Idle | 1 | "Euh... is er een koffieapparaat hier?" | Verdwaald | 1.2 |
| Idle | 2 | *typgeluiden* "Ik update mijn LinkedIn maar even..." | Verveeld | 1.5 |

#### Manager (Ranged / Debuff)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Dit staat niet in de planning!" | Geirriteerd | 1.0 |
| Select | 2 | "Even mijn agenda checken... nee, nu niet" | Druk, afwijzend | 1.2 |
| Select | 3 | "Ik heb over vijf minuten een call" | Gehaast, belangrijk | 1.0 |
| Move | 1 | "Ik plan een verplaatsing in" | Bureaucratisch | 0.8 |
| Move | 2 | "Ik neem dit mee naar de volgende stand-up" | Absurd corporate | 1.2 |
| Move | 3 | "Fine. Maar dit heeft impact op de roadmap" | Zuchtend | 1.2 |
| Attack | 1 | "Dit eskaleert!" | Dreigend, formeel | 0.6 |
| Attack | 2 | "Ik bel mijn advocaat!" | Dreigend | 0.8 |
| Attack | 3 | "Performance review: ONVOLDOENDE!" | Vernietigend oordeel | 1.2 |
| Death | 1 | "Mijn... out-of-office... is aan..." | Stervend, corporate | 1.2 |
| Death | 2 | "Meeting... geannuleerd..." | Fluisterend | 1.0 |
| Ability (Perf. Review) | 1 | "Ik geef je een ONE op een schaal van vijf!" | Vernietigend | 1.2 |
| Ability (Perf. Review) | 2 | "Je bent hiermee niet aligned!" | Corporate woede | 1.0 |
| Idle | 1 | "Heeft er iemand de notulen? IEMAND?" | Geirriteerd zoekend | 1.5 |
| Idle | 2 | *zucht* "Weer geen actionable feedback..." | Vermoeid | 1.2 |

#### Consultant (Debuff Specialist)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Vanuit mijn optiek..." | Bedachtzaam, arrogant | 0.8 |
| Select | 2 | "We moeten de stakeholders meenemen" | Serieus, jargon | 1.2 |
| Select | 3 | "Ik heb hier een framework voor" | Zelfverzekerd | 1.0 |
| Move | 1 | "Ik stuur je een offerte" | Droog, transactioneel | 0.8 |
| Move | 2 | "Ik adviseer om die kant op te gaan" | Diplomatiek | 1.0 |
| Move | 3 | "Pro bono, uiteraard" | Sarcastisch | 0.8 |
| Attack | 1 | "Mijn advies? Geef op!" | Koud, professioneel | 1.0 |
| Attack | 2 | "Ik reorganiseer je!" | Dreigend, soft-spoken | 0.8 |
| Attack | 3 | "Dit staat in mijn rapport, pagina 47" | Droog dreigend | 1.2 |
| Death | 1 | "Stuur... de factuur... naar mijn kantoor..." | Stervend, nog steeds zakelijk | 1.5 |
| Death | 2 | "Dit was... niet in scope..." | Verrast stervend | 1.0 |
| Ability (Reorganisatie) | 1 | "REORGANISATIE! Iedereen op andere plekken!" | Autoritair | 1.2 |
| Ability (Reorganisatie) | 2 | "De transitie begint NU" | Koud, definitief | 1.0 |
| Idle | 1 | "Ik factureer dit als wachttijd, hoor" | Droog | 1.2 |
| Idle | 2 | *papier ritselen* "Nog een bijlage bij het rapport..." | Werkzaam | 1.5 |

#### Hipster (Scout)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Dit was populairder voordat jullie het ontdekten" | Snobistisch | 1.5 |
| Select | 2 | "Is hier ergens specialty coffee?" | Zoekend, veeleisend | 1.0 |
| Select | 3 | "Oh, je kent mij? Dat is... super mainstream" | Teleurgesteld | 1.5 |
| Move | 1 | "Ik ga, maar ironisch" | Droog | 0.6 |
| Move | 2 | "Ooh, daar is vast een pop-up!" | Enthousiast | 0.8 |
| Move | 3 | "Ik fixie er wel naartoe" | Nonchalant | 0.8 |
| Attack | 1 | "Deze vinyl is LIMITED EDITION!" | Verontwaardigd | 1.0 |
| Attack | 2 | "Taste my artisanal violence!" | Ironisch agressief | 1.0 |
| Attack | 3 | "Je bent SO 2025!" | Beledigend | 0.6 |
| Death | 1 | "Doodgaan was... cool... voordat het mainstream werd..." | Ironisch stervend | 2.0 |
| Death | 2 | "Mijn... vinyl collectie..." | Tragisch | 1.0 |
| Ability (Gentrificatie) | 1 | "Dit is nu een CONCEPT space. Van mij" | Triomfantelijk | 1.2 |
| Ability (Gentrificatie) | 2 | "Gentrificatie baby! Welkom in de toekomst" | Smug | 1.2 |
| Idle | 1 | "Ik post dit op mijn blog. Niemand leest het, maar dat is het punt" | Filosofisch hipster | 2.0 |
| Idle | 2 | *nipt koffie* "Hmm, underdeveloped acidity..." | Pretentieus | 1.5 |

#### HR-medewerker (Support / Healer)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Hoe gaat het echt met je?" | Nep-empathisch | 0.8 |
| Select | 2 | "Even je werkgeluk meten" | Clipboard-energie | 0.8 |
| Select | 3 | "Ik ben er voor het team!" | Overenthusiast HR | 0.8 |
| Move | 1 | "Ik doe een ronde langs de vloer" | Professioneel | 1.0 |
| Move | 2 | "Even polsen hoe het gaat" | Zacht, zorgzaam | 0.8 |
| Move | 3 | "On my way! Met een positieve mindset!" | Over the top | 1.0 |
| Attack | 1 | "Dit is een veilige ruimte... WAS een veilige ruimte!" | Van zacht naar agressief | 1.5 |
| Attack | 2 | "Ik heb hier een formulier voor!" | Paperwork als wapen | 1.0 |
| Attack | 3 | "Exit-interview! NU!" | Autoritair | 0.8 |
| Death | 1 | "Vergeet niet... de medewerkerstevredenheids... enquete..." | Stervend, nog steeds bezig | 2.0 |
| Death | 2 | "HR... neemt geen afscheid... we faciliteren transities..." | Corporate tot het einde | 2.0 |
| Ability (Teambuilding) | 1 | "TEAMBUILDING! Iedereen in de kring! NU!" | Dwingend enthousiast | 1.2 |
| Ability (Teambuilding) | 2 | "Vertrouwensoefening! Val achterover!" | Hyper-enthousiast | 1.2 |
| Idle | 1 | "Ik stuur even een 'hoe gaat het?' Slackje..." | Afwezig | 1.2 |
| Idle | 2 | "Moet ik weer een mediation inplannen?" | Zuchtend | 1.2 |

#### Corporate Advocaat (Heavy Melee)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Namens mijn client..." | Formeel, dreigend | 0.8 |
| Select | 2 | "Dit heeft juridische consequenties" | Koud | 1.2 |
| Select | 3 | "Ik heb hier een precedent voor" | Zelfverzekerd | 1.0 |
| Move | 1 | "Ik dagvaard je ter plaatse" | Dreigend lopend | 0.8 |
| Move | 2 | "Op weg naar de rechtbank" | Plechtig | 0.8 |
| Move | 3 | "Elk uur dat ik loop factureer ik" | Droog | 1.0 |
| Attack | 1 | "BEZWAAR! VERWORPEN! *slaat*" | Rechtbank agressief | 1.2 |
| Attack | 2 | "Artikelen 1 door 47 zeggen: jij verliest!" | Intimiderend | 1.5 |
| Attack | 3 | "De wet is aan MIJN kant!" | Zelfverzekerd | 0.8 |
| Death | 1 | "Ik ga... in hoger beroep..." | Stervend maar strijdbaar | 1.2 |
| Death | 2 | "Object... sustained..." | Dramatisch Engels | 1.0 |
| Ability (Juridische Procedure) | 1 | "Uw zaak is IN BEHANDELING! Stilzitten!" | Autoritair juridisch | 1.2 |
| Ability (Dwangsom) | 2 | "DWANGSOM! Productie STILGELEGD!" | Dreigend, definitief | 1.2 |
| Idle | 1 | *bladert door wetboeken* "Hmm, clausule 7b..." | Studieeus | 1.5 |
| Idle | 2 | "Ik factureer dit uurtarief, hoor" | Dreigend | 1.0 |

#### Influencer (Ranged / AoE)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "OMG dit is SO Brabant" | Valley girl accent | 0.8 |
| Select | 2 | "Link in bio!" | Automatische reflex | 0.4 |
| Select | 3 | "Wait, ben ik on camera? Goed!" | Ijdel, enthousiast | 1.0 |
| Move | 1 | "Content opportunity die kant op!" | Enthousiast | 1.0 |
| Move | 2 | "Ik vlog dit" | Nonchalant | 0.5 |
| Move | 3 | "Walking content! Love it!" | Overenthusiast | 0.8 |
| Attack | 1 | "Je wordt GECANCELD!" | Dreigend, modern | 0.8 |
| Attack | 2 | "Sponsored destruction!" | Ironisch commercieel | 0.8 |
| Attack | 3 | "Ratio + L + cancelled!" | Gen-Z strijdkreet | 0.8 |
| Death | 1 | "Mijn... followers... zullen mij... wreken..." | Dramatisch stervend | 1.5 |
| Death | 2 | "Dit is SO niet aesthetisch..." | Verontwaardigd stervend | 1.2 |
| Ability (Viral Post) | 1 | "POST gaat VIRAL! SHARE! SHARE! SHARE!" | Maniakaal enthousiast | 1.5 |
| Ability (Cancel Culture) | 2 | "CANCEL CULTURE ACTIVATED! Geen buffs meer voor jou!" | Dreigend blij | 1.5 |
| Idle | 1 | "Wacht, even mijn analytics checken..." | Afgeleid | 1.2 |
| Idle | 2 | "Ugh, mijn engagement is down... HELP" | Paniek | 1.2 |

#### Vastgoedmakelaar (Siege)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Prachtige locatie!" | Enthousiast verkooppraat | 0.8 |
| Select | 2 | "Vraagprijs is slechts een richtlijn" | Gladde verkoper | 1.2 |
| Select | 3 | "Dit pand heeft potentie!" | Verkoopsmodus | 0.8 |
| Move | 1 | "Ik ga de buurt verkennen" | Professioneel | 0.8 |
| Move | 2 | "Nieuwe locatie scouten!" | Enthousiast | 0.8 |
| Move | 3 | "Op naar de open huizendag!" | Verkoopblij | 0.8 |
| Attack | 1 | "Dit pand wordt GESLOOPT! Voor de herbouw!" | Vastgoed-agressief | 1.2 |
| Attack | 2 | "Ontwikkelingsplan GOEDGEKEURD!" | Autoritair | 1.0 |
| Attack | 3 | "Boven vraagprijs VERNIETIGD!" | Dreigend blij | 0.8 |
| Death | 1 | "Mijn... portfolio..." | Stervend, materialistisch | 0.8 |
| Death | 2 | "De huizenmarkt... crasht..." | Dramatisch | 1.0 |
| Ability (Bod boven Vraagprijs) | 1 | "Ik bied BOVEN VRAAGPRIJS! Dit is nu van MIJ!" | Triomfantelijk | 1.5 |
| Ability (Bod boven Vraagprijs) | 2 | "VERKOCHT! Aan de hoogste bieder: IK!" | Zegevierend | 1.2 |
| Idle | 1 | "De huizenmarkt wacht niet, mensen..." | Ongeduldig | 1.2 |
| Idle | 2 | *telefoon* "Ja, ik heb nog een object voor je..." | Aan het bellen | 1.5 |

#### De CEO (Hero - Commander/Buffer)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Wat is de ROI hiervan?" | Koud, calculerend | 0.8 |
| Select | 2 | "Ik heb exact drie minuten" | Gehaast, belangrijk | 0.8 |
| Select | 3 | "De CEO spreekt. Luister" | Autoritair | 0.8 |
| Move | 1 | "Ik verplaats het hoofdkantoor" | Grandioos | 0.8 |
| Move | 2 | "Business trip" | Kort, zakelijk | 0.4 |
| Move | 3 | "De markt beweegt, ik beweeg mee" | Filosofisch corporate | 1.0 |
| Attack | 1 | "Vijandige overname! Geen genade!" | IJskoud, agressief | 1.0 |
| Attack | 2 | "Je bent ontslagen. PERMANENT" | Vernietigend | 1.0 |
| Attack | 3 | "De aandeelhouders eisen bloed!" | Dramatisch | 1.0 |
| Death | 1 | "Mijn... gouden... parachute..." | Stervend, nog steeds geld | 1.2 |
| Death | 2 | "De koers... crasht..." | Dramatisch stervend | 1.0 |
| Ability (Kwartaalcijfers) | 1 | "KWARTAALCIJFERS! Productie OMHOOG! NU!" | Boardroom commando | 1.2 |
| Ability (Ontslagronde) | 2 | "ONTSLAGRONDE! Offer voor de winst!" | IJskoud, definitief | 1.2 |
| Ability (Golden Handshake) | 3 | "GOUDEN HANDDRUK! Je bent UITGESCHAKELD!" | Grimmig | 1.2 |
| Ultimate (Vijandige Overname) | 1 | "VIJANDIGE OVERNAME! Dit is nu eigendom van de Randstad!" | Maximaal corporate evil | 2.0 |
| Idle | 1 | "De CEO wacht op niemand. Behalve nu, blijkbaar" | Sarcastisch | 1.5 |
| Idle | 2 | *typt op laptop* "Kwartaalcijfers, kwartaalcijfers..." | Bezig | 1.5 |

#### De Politicus (Hero - Caster/Manipulator)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Ik beloof je alles!" | Glimlachend, onbetrouwbaar | 0.8 |
| Select | 2 | "Stem op mij en alles wordt beter" | Politiek glad | 1.0 |
| Select | 3 | "De Politicus luistert. Maar doet niks" | Eerlijk voor een keer | 1.2 |
| Move | 1 | "Ik verplaats me naar de kiezer" | Politiek | 0.8 |
| Move | 2 | "Werkbezoek!" | Enthousiast nep | 0.4 |
| Move | 3 | "Ik loop voor het klimaat!" | Virtue signaling | 0.8 |
| Attack | 1 | "MOTIE VAN WANTROUWEN!" | Parlementair agressief | 1.0 |
| Attack | 2 | "Mijn retoriek is dodelijk!" | Zelfingenomen | 0.8 |
| Attack | 3 | "Debat mij! Oh wacht, je kunt niet meer" | Arrogant | 1.2 |
| Death | 1 | "Ik... heb spijt... van helemaal NIKS" | Politicus tot het einde | 1.5 |
| Death | 2 | "Het volk... zal mij herinneren... als held..." | Zelfoverschattend | 1.5 |
| Ability (Verkiezingsbelofte) | 1 | "Ik BELOOF jullie: meer van ALLES! Tijdelijk..." | Glad politiek | 1.5 |
| Ability (Subsidie) | 2 | "SUBSIDIE goedgekeurd! Geen wachttijd!" | Genereus met andermans geld | 1.2 |
| Ability (Lobby) | 3 | "LOBBY ingezet! Jullie research duurt een eeuwigheid!" | Sinister tevreden | 1.5 |
| Ultimate (Kamerdebat) | 1 | "KAMERDEBAT! IEDEREEN stilzitten en LUISTEREN!" | Parlementair maximaal | 1.5 |
| Idle | 1 | "Heeft iemand een teleprompter?" | Verloren zonder script | 1.2 |
| Idle | 2 | "Ik doe alsof ik het druk heb, maar..." | Eerlijk | 1.2 |

---

### 1.3 Limburgers

#### Mijnwerker (Worker)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Gluck auf" | Kort, traditioneel | 0.5 |
| Select | 2 | "Jao, wat is 't?" | Nuchter Limburgs | 0.6 |
| Select | 3 | "Hej, ich bin hier" | Kalm, diep | 0.6 |
| Move | 1 | "Ich gank" | Kort, beslist | 0.4 |
| Move | 2 | "Door de tunnels, sjneller" | Mysterieus | 0.8 |
| Move | 3 | "Goed, ich loop al" | Bereidwillig | 0.6 |
| Attack | 1 | "Pikhouweel op je kop!" | Dreigend, direct | 0.8 |
| Attack | 2 | "Gluck auf... voor JOU nie!" | Donker humoristisch | 1.0 |
| Attack | 3 | "De mijn slaat terug!" | Strijdlustig | 0.6 |
| Death | 1 | "De mijn... neemt alles..." | Duister, filosofisch | 1.2 |
| Death | 2 | *rotsfallend geluid + kreun* | Mijn-instorting | 1.0 |
| Ability | 1 | "Dieper! Altied dieper!" | Obsessief | 0.8 |
| Ability | 2 | "De aarde geeft, de aarde neemt" | Mystiek | 1.0 |
| Idle | 1 | *tikt met pikhouweel op steen* "Wachte..." | Ritmisch geduldig | 1.5 |
| Idle | 2 | "Hej... geit d'r nog jet gebeure vandaag?" | Ongeduldig | 1.5 |

#### Schutterij (Infantry / Ranged)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Sjutterij, gereed!" | Militair, trots | 0.6 |
| Select | 2 | "De vaandel waait" | Plechtig | 0.6 |
| Select | 3 | "Hej, Limburg steit" | Patriottisch | 0.6 |
| Move | 1 | "Mars! Voorwaarts!" | Militair | 0.6 |
| Move | 2 | "De sjutterij rukt op" | Formeel | 0.6 |
| Move | 3 | "Achter de vaandel aan" | Plichtsgetrouw | 0.8 |
| Attack | 1 | "VUUR!" | Kort, commando | 0.3 |
| Attack | 2 | "Sjeet! Sjeet! Sjeet!" | Repetitief, urgent | 0.8 |
| Attack | 3 | "Voor Limburg en eer!" | Strijdkreet | 0.8 |
| Death | 1 | "De vaandel... laot 'm nie valle..." | Stervend, plichtsgetrouw | 1.5 |
| Death | 2 | *musket valt + kreun* | Kort | 0.8 |
| Ability (Vaandelzwaaien) | 1 | "VAANDEL OMHOOG! Limburg vreest niks!" | Inspirerend | 1.2 |
| Ability (Vaandelzwaaien) | 2 | "Zwaaien! De sjutterij houdt stand!" | Commando | 1.0 |
| Idle | 1 | *poetst geweer* "Wachte op beveel..." | Geduldig | 1.2 |
| Idle | 2 | "Ich sjta hier al eure..." | Mopperend | 0.8 |

#### Vlaaienwerper (Specialist)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Vlaai? Welke smaak?" | Kok-achtig, Limburgs | 0.8 |
| Select | 2 | "De vlaai is gereed" | Kalm, professioneel | 0.6 |
| Select | 3 | "Ich heb kersenvlaai en pruimevlaai" | Menu-achtig | 1.0 |
| Move | 1 | "Ich bring de vlaai!" | Bezorger-toon | 0.6 |
| Move | 2 | "Pas op, nie laote valle!" | Voorzichtig | 0.8 |
| Move | 3 | "Vlaai-express!" | Snelle bezorging | 0.5 |
| Attack | 1 | "VLAAI IN JE GEZICHT!" | Agressief, komisch | 0.8 |
| Attack | 2 | "Pruimevlaai! Extra kleffe!" | Dreigend blij | 0.8 |
| Attack | 3 | "Proef de Limburgse wraak!" | Dramatisch | 0.8 |
| Death | 1 | "De vlaai... valt op de grond... nee..." | Tragisch over de vlaai | 1.5 |
| Death | 2 | *splat geluid + kreun* | Vlaai-en-al | 1.0 |
| Ability | 1 | "MEGA-VLAAI! Iedereen onder de stroop!" | Explosief | 1.2 |
| Ability | 2 | "Speciale recept! Extra plakkerig!" | Kwade kok | 1.0 |
| Idle | 1 | "Ich bak alvast de volgende..." | Productief wachtend | 1.0 |
| Idle | 2 | *kneedt deeg* "De vlaai wacht op niemand" | Filosofisch | 1.2 |

#### Mergelridder (Heavy)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "De mergel beschermt" | Laag, echoend | 0.6 |
| Select | 2 | "Sjtein en sjild" | Kort, zwaar | 0.5 |
| Select | 3 | "Ich ben de berg" | Mystiek, diep | 0.5 |
| Move | 1 | "Langzaam maar zeker" | Zwaar, onvermurwbaar | 0.8 |
| Move | 2 | "De berg bewoog" | Episch, laag | 0.6 |
| Move | 3 | "Onvermurwbaar" | Een woord, diep | 0.5 |
| Attack | 1 | "Sjtein op vlees!" | Primitief, krachtig | 0.6 |
| Attack | 2 | "De berg VALT!" | Epische strijdkreet | 0.6 |
| Attack | 3 | "Ich breek je!" | Direct, dreigend | 0.4 |
| Death | 1 | "Terug... naar de berg..." | Vredevol stervend | 1.0 |
| Death | 2 | *brokkelend steen-geluid* | Steenachtig uiteenvallen | 1.2 |
| Ability (Steenhuid) | 1 | "STEENHUID! Raak me als je durft!" | Uitdagend, onkwetsbaar | 1.2 |
| Ability (Steenhuid) | 2 | "De mergel verhardt!" | Krachtig | 0.8 |
| Idle | 1 | *kraak-kraak van steen* "...wachte..." | Geduldig als een berg | 1.0 |
| Idle | 2 | "Zelfs de berg verveelt zich" | Droog | 0.8 |

#### Heuvelrenner (Scout)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Boven op de heuvel!" | Energiek, jong | 0.6 |
| Select | 2 | "Ich zie alles van hierbove!" | Trots, uitzicht | 0.8 |
| Select | 3 | "Hej! Sjnelle voeten hier!" | Zelfverzekerd | 0.6 |
| Move | 1 | "Bergop of bergaf, ich ren!" | Atletisch | 0.8 |
| Move | 2 | "Over de heuvels!" | Snel, enthousiast | 0.6 |
| Move | 3 | "Ge ziet mich nie!" | Fluisterend snel | 0.5 |
| Attack | 1 | "Van de heuvel af, recht in je gezicht!" | Aanvallend | 1.0 |
| Attack | 2 | "Bergafwaarts! AANVALLE!" | Strijdkreet | 0.8 |
| Attack | 3 | "De heuvels vallen aan!" | Episch | 0.6 |
| Death | 1 | "Ich... val... van de heuvel..." | Vallend stervend | 1.0 |
| Death | 2 | *rollend geluid + kreun* | Heuvelafwaarts | 0.8 |
| Ability | 1 | "SPRINT! Niemand is sjneller!" | Maximum snelheid | 0.8 |
| Ability | 2 | "Over de toppen en weg!" | Vluchtend snel | 0.8 |
| Idle | 1 | "Van hier kan ich tot aan Duitsland kieke..." | Mijmerend | 1.5 |
| Idle | 2 | "Ich ren een rondje... gewoon voor de lol" | Rusteloos | 1.0 |

#### Mijnrat (Stealth / Sabotage)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Ssst... in de tunnel" | Fluisterend, ondergronds | 0.8 |
| Select | 2 | "De rat weet de weg" | Mysterieus, sinister | 0.8 |
| Select | 3 | *snuivend geluid* "Ich ruik ze" | Dierlijk | 0.6 |
| Move | 1 | "Door de gangen..." | Fluisterend | 0.6 |
| Move | 2 | "Ondergronds is sjneller" | Wetend | 0.6 |
| Move | 3 | "Niemand ziet de rat" | Sinister | 0.6 |
| Attack | 1 | "De mijn bijt terug!" | Agressief fluisterend | 0.6 |
| Attack | 2 | "Achter je! TE LAAT!" | Verrassing | 0.8 |
| Attack | 3 | *piepend rat-geluid + aanval* | Dierlijk agressief | 0.6 |
| Death | 1 | "De tunnels... sluiten zich..." | Stervend, duister | 1.0 |
| Death | 2 | *rat-piep die vervaagt* | Dierlijk stervend | 0.8 |
| Ability (Mine placement) | 1 | "Een cadeautje... in de grond" | Sinister blij | 1.0 |
| Ability (Mine placement) | 2 | "BOEM... straks" | Fluisterend, dreigend | 0.8 |
| Idle | 1 | *krabbend in de tunnel* "Wachte... wachte..." | Ongeduldig rondschuifelend | 1.2 |
| Idle | 2 | "Ich hoor ze bove... ze weten niks" | Samenzweerderig | 1.2 |

#### De Mijnbaas (Hero - Tank)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "De Mijnbaas spreekt" | Diep, autoritair | 0.8 |
| Select | 2 | "Ich ken elke sjtein in deze berg" | Mystiek, oud | 1.0 |
| Select | 3 | "Gluck auf, soldaat" | Plechtig | 0.6 |
| Move | 1 | "De berg bewegt zich" | Episch, langzaam | 0.8 |
| Move | 2 | "Waar de kolen zijn, is de Mijnbaas" | Filosofisch | 1.0 |
| Move | 3 | "Ich daal af" | Kort, onheilspellend | 0.5 |
| Attack | 1 | "De MIJN STORTT IN! Op JULLIE!" | Maximaal dreigend | 1.2 |
| Attack | 2 | "Geen genade in de diepte!" | Duister | 0.8 |
| Attack | 3 | "Pikhouweel en vuist!" | Primitief krachtig | 0.6 |
| Death | 1 | "De berg... vergeet nie... de Mijnbaas..." | Stervend, legendarisch | 1.5 |
| Death | 2 | "Gluck... auf..." | Laatste woorden | 0.8 |
| Ability (Mijnschacht Instorten) | 1 | "MIJNSCHACHT INSTORTEN! De aarde beeft!" | Maximaal volume, echo | 1.5 |
| Ability (Mijnschacht Instorten) | 2 | "ALLES SJTORTT IN! BEGRAVEN!" | Apocalyptisch | 1.2 |
| Ultimate | 1 | "DE BERG LEEFT! En hij is WOEDEND!" | Episch maximaal | 1.5 |
| Idle | 1 | "De berg fluistert... als je luistert" | Mystiek | 1.2 |
| Idle | 2 | *tikt met pikhouweel op de grond, ritmisch* | Meditatief | 2.0 |

#### De Maasmeester (Hero - Caster)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "De Maas stroomt door mijn aderen" | Mystiek, vloeiend | 1.2 |
| Select | 2 | "Water wacht, water weet" | Enigmatisch | 0.8 |
| Select | 3 | "De Maasmeester hoort je" | Kalm, diep | 0.8 |
| Move | 1 | "Als water, ich stroom" | Vloeiend | 0.6 |
| Move | 2 | "De Maas vindt altied een weg" | Filosofisch | 1.0 |
| Move | 3 | "Stroomafwaarts" | Kort, mystiek | 0.4 |
| Attack | 1 | "De VLOED komt! Verdrinken in de Maas!" | Dreigend, waterachtig | 1.2 |
| Attack | 2 | "MAASVLOED! Weggespoeld!" | Strijdkreet | 0.8 |
| Attack | 3 | "Water verslindt alles" | Sinister kalm | 0.8 |
| Death | 1 | "Ich... keer terug... naar de rivier..." | Vloeiend stervend | 1.2 |
| Death | 2 | *watergeluid dat vervaagt* | Mystiek | 1.0 |
| Ability (Maasvloed) | 1 | "MAASVLOED! De rivier stijgt! ALLES weg!" | Maximaal episch | 1.5 |
| Ability (Maasvloed) | 2 | "Limburg's water kent geen genade!" | Dreigend | 1.0 |
| Ultimate | 1 | "DE MAAS ONTWAAKT! Overstroming over het HELE land!" | Apocalyptisch waterachtig | 2.0 |
| Idle | 1 | *watergeluiden* "De rivier fluistert verhalen..." | Mystiek, dromerig | 1.5 |
| Idle | 2 | "Zelfs de Maas heeft pauze nodig... nee, eigenlijk nie" | Droog | 1.5 |

---

### 1.4 Belgen

#### Frietkraamhouder (Worker)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Amai, wat mag het zijn?" | Warm Vlaams | 0.8 |
| Select | 2 | "Allez, ik sta klaar!" | Bereidwillig | 0.6 |
| Select | 3 | "Met of zonder mayonaise?" | Professioneel frietbakker | 0.8 |
| Move | 1 | "Ik kom eraan, eh!" | Haastig Vlaams | 0.6 |
| Move | 2 | "Allez, ik ga al" | Bereidwillig | 0.5 |
| Move | 3 | "De frieten wachten niet!" | Urgent | 0.6 |
| Attack | 1 | "Ge krijgt een portie rammel!" | Vlaams agressief | 0.8 |
| Attack | 2 | "Frietvet in uw smoel!" | Direct dreigend | 0.8 |
| Attack | 3 | "Amai, da gaat pijn doen!" | Waarschuwend | 0.8 |
| Death | 1 | "De frituur... gaat dicht..." | Tragisch, zakelijk | 1.0 |
| Death | 2 | "Wie... maakt de frieten nu..." | Bezorgd stervend | 1.0 |
| Ability | 1 | "EXTRA GROTE PORTIE! Met alles erop!" | Enthousiast | 1.0 |
| Ability | 2 | "Speciaal recept van mijn bomma!" | Trots op traditie | 1.0 |
| Idle | 1 | "Amai, geen klanten... ik eet er zelf maar eentje" | Praktisch | 1.5 |
| Idle | 2 | *sissend frituurvet + neurien* | Werkend | 1.5 |

#### Bierbouwer (Infantry)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Een Trappist? Altijd!" | Enthousiast bierman | 0.6 |
| Select | 2 | "Allez, wie moet er op zijn bakkes?" | Strijdlustig Vlaams | 1.0 |
| Select | 3 | "Proost! En daarna rammen!" | Chaotisch vrolijk | 0.8 |
| Move | 1 | "Naar de volgende kroeg!" | Enthousiast | 0.6 |
| Move | 2 | "Ik brouw onderweg wel" | Nonchalant | 0.6 |
| Move | 3 | "Allez hop, op stap!" | Vlaams energiek | 0.6 |
| Attack | 1 | "BIER-CHARGE!" | Strijdkreet | 0.4 |
| Attack | 2 | "Een Duvel op uw kop!" | Dreigend specifiek | 0.8 |
| Attack | 3 | "Ge hebt het verdiend!" | Agressief rechtvaardig | 0.6 |
| Death | 1 | "Mijn... laatste... pint..." | Stervend, tragisch | 1.0 |
| Death | 2 | *glas breekt + zucht* | Bier-tragiek | 0.8 |
| Ability | 1 | "BERSERKER-BIER! Drink en vecht!" | Vikingachtig | 0.8 |
| Ability | 2 | "Speciaal bier! 12%! AANVAL!" | Dronken strijdlustig | 1.0 |
| Idle | 1 | "Ge kunt nie vechten op een droge keel..." | Klagend | 1.2 |
| Idle | 2 | *drinkt + boert* "Excuseer" | Onbeschaamd | 1.0 |

#### Chocolatier (Ranged)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Praline of truffel?" | Verfijnd, Belgisch | 0.6 |
| Select | 2 | "De chocolade is getemperd en dodelijk" | Dreigend elegant | 1.2 |
| Select | 3 | "Amai, ik ben klaar met bonbons maken" | Klaar voor actie | 1.0 |
| Move | 1 | "Met de gratie van gesmolten chocolade" | Elegant | 1.0 |
| Move | 2 | "Ik glijd erheen" | Soepel | 0.4 |
| Move | 3 | "De Chocolatier verplaatst zich" | Formeel | 0.8 |
| Attack | 1 | "Praline SURPRISE! Met een vuist erin!" | Verrassingsaanval | 1.2 |
| Attack | 2 | "Vergiftigde bonbon! Proef en LIJD!" | Sinister elegant | 1.2 |
| Attack | 3 | "Pure chocolade! 99% PIJN!" | Dreigend specifiek | 0.8 |
| Death | 1 | "De chocolade... smelt..." | Dramatisch stervend | 0.8 |
| Death | 2 | "Mon dieu... les pralines..." | Stervend, Frans accent | 1.0 |
| Ability (Praline Surprise) | 1 | "PRALINE SURPRISE! Vergiftigd en verslavend!" | Sinister blij | 1.2 |
| Ability (Praline Surprise) | 2 | "Speciale bonbon! Ge zult WENSEN dat ge dood waart!" | Extreem dreigend | 1.5 |
| Idle | 1 | *chocolade roeren* "De perfecte temperatuur vergt geduld..." | Ambachtelijk | 1.5 |
| Idle | 2 | "Ik maak alvast bonbons... met een verrassing" | Sinister rustgevend | 1.5 |

#### Frituurridder (Heavy)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "De Frituurridder staat paraat!" | Ridderlijk, Vlaams | 0.8 |
| Select | 2 | "Mijn harnas ruikt naar frituurvet. Met trots!" | Trots, komisch | 1.2 |
| Select | 3 | "Allez, wie durft?" | Uitdagend | 0.5 |
| Move | 1 | "De ridder rijdt!" | Episch, Vlaams | 0.5 |
| Move | 2 | "Op mijn friettenpaard!" | Absurd heroisch | 0.8 |
| Move | 3 | "Voorwaarts, voor de friet!" | Strijdlustig | 0.6 |
| Attack | 1 | "FRIET-CHARGE! ALLEZ!" | Ridderlijke strijdkreet | 0.8 |
| Attack | 2 | "Het zwaard van de frituur slaat!" | Episch komisch | 1.0 |
| Attack | 3 | "Ge gaat GEBAKKEN worden!" | Dreigend woordspeling | 0.8 |
| Death | 1 | "De frituur... ridder... valt..." | Episch stervend | 1.0 |
| Death | 2 | *metaal + frituurvet-sissing* | Dramatisch | 1.0 |
| Ability (Charge + Slow) | 1 | "FRITUUR-CHARGE! Alles onder de mayonaise!" | Maximaal absurd | 1.2 |
| Ability (Charge + Slow) | 2 | "SLOW COOK! Ge kunt niet meer bewegen!" | Dreigend | 1.0 |
| Idle | 1 | "Een ridder zonder strijd is als frieten zonder zout" | Filosofisch | 1.5 |
| Idle | 2 | *poetst harnas* "Altijd vettig dat ding..." | Mopperend | 1.2 |

#### Manneken Pis-kanon (Siege)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Manneken Pis is geladen!" | Trots, komisch | 0.8 |
| Select | 2 | "Amai, dit wordt nat!" | Waarschuwend blij | 0.6 |
| Select | 3 | "De nationale trots staat klaar!" | Ironisch plechtig | 0.8 |
| Move | 1 | "Het Manneken verplaatst zich!" | Plechtig | 0.8 |
| Move | 2 | "Voorzichtig, niet morsen!" | Komisch voorzichtig | 0.8 |
| Move | 3 | "Op naar het doelwit!" | Militair | 0.6 |
| Attack | 1 | "MANNEKEN PIS VUUR! Tsssss!" | Komisch militair | 1.0 |
| Attack | 2 | "Dit gebouw gaat NAT!" | Dreigend, dubbelzinnig | 0.8 |
| Attack | 3 | "Belgische waterdruk, baby!" | Trots | 0.8 |
| Death | 1 | "Het Manneken... pist niet meer..." | Tragisch absurd | 1.2 |
| Death | 2 | *water dat ophoudt + druppelgeluid* | Komisch tragisch | 1.2 |
| Ability | 1 | "MEGA-PLAS! MAXIMUM DRUK!" | Maximaal absurd | 1.0 |
| Ability | 2 | "Belgische waterval!" | Episch komisch | 0.8 |
| Idle | 1 | "Het Manneken moet ook weleens pauze hebben..." | Droog | 1.2 |
| Idle | 2 | *druppelgeluiden* "Toch nog een beetje over..." | Komisch | 1.0 |

#### Dubbele Spion (Stealth)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Wie ben ik nu weer?" | Verward, mysterieus | 0.8 |
| Select | 2 | "Oui... euh, ja... euh, nein... allez" | Talenverwarring | 1.2 |
| Select | 3 | "De Dubbele Spion kent geen loyaliteit" | Koud, professioneel | 1.2 |
| Move | 1 | "Ik infiltreer" | Kort, professioneel | 0.4 |
| Move | 2 | "Niemand weet wie ik ben. Zelfs ik niet" | Existentieel | 1.2 |
| Move | 3 | "Incognito, allez" | Nonchalant spion | 0.6 |
| Attack | 1 | "Surprise! Ik ben NIET wie ge denkt!" | Verrassing | 1.2 |
| Attack | 2 | "De Spion slaat toe! Vanuit de schaduwen!" | Dramatisch | 1.2 |
| Attack | 3 | "Verraad! Met een glimlach!" | Sinister vrolijk | 1.0 |
| Death | 1 | "Welke kant... was ik ook alweer..." | Verward stervend | 1.2 |
| Death | 2 | "De spion... sterft twee keer..." | Cryptisch | 1.0 |
| Ability (Disguise) | 1 | "TRANSFORMATIE! Ik ben nu een van jullie!" | Kwade glimlach | 1.2 |
| Ability (Disguise) | 2 | "Nieuwe identiteit, zelfde chaos" | Nonchalant | 1.0 |
| Idle | 1 | "Ik heb zo veel identiteiten dat ik vergeet wie ik ben" | Existentiele crisis | 2.0 |
| Idle | 2 | "Wacht, ben ik nu de goede of de slechte?" | Verward | 1.2 |

#### De Frietkoning (Hero - Tank/Support)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "De Frietkoning regeert!" | Koninklijk, Vlaams | 0.8 |
| Select | 2 | "Amai, eindelijk erkenning!" | Trots, warm | 0.8 |
| Select | 3 | "Met saus of zonder?" | Koninklijke kok | 0.6 |
| Move | 1 | "De Koning marcheert!" | Plechtig | 0.6 |
| Move | 2 | "Op naar het slagveld! Met frieten!" | Absurd heroisch | 1.0 |
| Move | 3 | "Allez, volg de Koning!" | Commando, warm | 0.6 |
| Attack | 1 | "KONINKLIJKE PORTIE RAMMEL!" | Strijdkreet | 1.0 |
| Attack | 2 | "Frieten regenen op je neer!" | Episch | 0.8 |
| Attack | 3 | "De Frietkoning kent geen genade! Alleen mayonaise!" | Dreigend absurd | 1.5 |
| Death | 1 | "Het koninkrijk... van de friet... valt..." | Episch stervend | 1.2 |
| Death | 2 | "Lang... leve... de friet..." | Laatste woorden | 1.0 |
| Ability (Koninklijke Portie) | 1 | "KONINKLIJKE PORTIE! Iedereen geheeld!" | Genereus, warm | 1.2 |
| Ability (Koninklijke Portie) | 2 | "Frieten voor het hele leger! Eet en vecht!" | Inspirerend | 1.2 |
| Ultimate | 1 | "DE FRIETKONING ONTKETENT DE GOUDEN FRITUUR! Onkwetsbaar!" | Maximaal episch | 2.0 |
| Idle | 1 | "Een koning zonder volk is als frieten zonder zout" | Filosofisch | 1.5 |
| Idle | 2 | "Ik bak alvast voor het overwinningsfeest" | Optimistisch | 1.2 |

#### De Abdijheer (Hero - Monk/Caster)

| Actie | Variant | Tekst | Emotie | Duur (s) |
|-------|---------|-------|--------|----------|
| Select | 1 | "Stilte. De Abdij luistert" | Kalm, monastiek | 0.8 |
| Select | 2 | "In nomine Belgii..." | Quasi-Latijns, plechtig | 0.8 |
| Select | 3 | "De Abdijheer kent het gebed EN het zwaard" | Dubbele natuur | 1.2 |
| Move | 1 | "De pelgrimstocht gaat verder" | Vredig | 0.8 |
| Move | 2 | "Ik wandel in stilte" | Monastiek | 0.6 |
| Move | 3 | "Waar God mij leidt" | Devoot | 0.5 |
| Attack | 1 | "De HEER vergeeft! Ik NIET!" | Strijdend monnik | 1.0 |
| Attack | 2 | "Heilig vuur! Op de heidenen!" | Kruistochtachtig | 1.0 |
| Attack | 3 | "Zwijg en ontvang uw straf!" | Autoritair monastiek | 0.8 |
| Death | 1 | "De Abdij... bidt voor mij..." | Vredig stervend | 1.0 |
| Death | 2 | "Pater noster..." | Latijns gebed, stervend | 1.0 |
| Ability (Stiltegelofte) | 1 | "STILTE! Geen magie, geen woorden, geen helden!" | Monastiek commando | 1.5 |
| Ability (Stiltegelofte) | 2 | "De stilte is mijn wapen! ZWIJG!" | Paradoxaal luid | 1.2 |
| Ultimate | 1 | "DE ABDIJ SPREEKT! ALLE ZONDEN VERGEVEN... NA STRAF!" | Maximaal monastiek | 2.0 |
| Idle | 1 | *gregoriaansgezang, zacht* | Meditatief | 2.5 |
| Idle | 2 | "Ik brouw Trappist. Bidden kan ook later" | Pragmatisch | 1.2 |

---

### 1.5 Narrator / Announcer Voice Lines

Naast unit voice lines, een set narrator-lijnen voor game events:

| Event | Tekst | Toon |
|-------|-------|------|
| Game Start | "De strijd om Brabant begint!" | Episch, warm |
| Player Under Attack | "Uw nederzetting wordt aangevallen!" | Urgent |
| Building Complete | "Gebouw voltooid" | Neutraal bevestigend |
| Unit Training Complete | "Eenheid getraind" | Neutraal |
| Upgrade Complete | "Upgrade voltooid" | Positief |
| Research Complete | "Onderzoek afgerond" | Positief |
| Gold Mine Depleted | "De goudmijn is uitgeput" | Waarschuwend |
| Not Enough Resources | "Niet genoeg grondstoffen" | Afwijzend |
| Not Enough Population | "Meer huizen nodig" | Afwijzend |
| Victory | "OVERWINNING! Brabant is van u!" | Triomfantelijk |
| Defeat | "Brabant is gevallen..." | Somber |
| Hero Killed | "Uw held is gevallen!" | Dramatisch urgent |
| Hero Revived | "Uw held is herrezen!" | Hoopvol |
| Ally Under Attack | "Uw bondgenoot heeft hulp nodig!" | Urgent |
| Carnavalsrage Activated | "ALAAF! De Carnavalsrage ontbrandt!" | Euforisch |
| Vergadering Activated | "Vergadering begonnen! Vijanden vastgezet!" | Droog corporate |
| Vloedgolf van Vlaai Activated | "De vlaai overspoelt het veld!" | Komisch episch |
| Diplomatieke Verwarring Activated | "Belgische diplomatie! Totale chaos!" | Chaotisch |
| Werkoverleg Started (Randstad) | "Werkoverleg! Productie pauzeert..." | Waarschuwend |
| Werkoverleg Ended (Randstad) | "Vergadering afgelopen. Terug aan het werk" | Opluchtend |

**Totaal narrator lijnen**: ~20

---

## 2. SFX Catalogus

### 2.1 Combat SFX

| # | Naam | Beschrijving | Duur (s) | ElevenLabs Prompt | Loop | Prio |
|---|------|-------------|---------|-------------------|------|------|
| 1 | `combat_sword_swing` | Zwaard/wapen zwaai door de lucht, whoosh | 0.3 | "Sword swing whoosh, medieval weapon cutting through air" | Nee | 1 |
| 2 | `combat_sword_hit` | Metaal-op-metaal impact, zwaard raakt schild | 0.4 | "Metal sword hitting metal shield, sharp clang" | Nee | 1 |
| 3 | `combat_melee_hit_flesh` | Stomp wapen raakt vlees, doffe impact | 0.3 | "Blunt weapon hitting flesh, dull thud impact" | Nee | 1 |
| 4 | `combat_ranged_throw` | Projectiel gelanceerd (bierpul, vinyl, spreadsheet) | 0.4 | "Object being thrown through air, short whoosh with weight" | Nee | 1 |
| 5 | `combat_ranged_hit` | Projectiel raakt doel, impact + breken | 0.3 | "Thrown object shattering on impact, glass breaking on stone" | Nee | 1 |
| 6 | `combat_arrow_fly` | Pijl/projectiel door de lucht, hoog whoosh | 0.5 | "Arrow flying through air, high-pitched whistle, fast" | Nee | 2 |
| 7 | `combat_explosion_small` | Kleine explosie (frikandel speciaal, mine) | 0.8 | "Small medieval explosion, powder keg detonation" | Nee | 1 |
| 8 | `combat_explosion_large` | Grote explosie (praalwagen kanon, mijnschacht instorten) | 1.2 | "Large explosion with debris and rumble, castle wall collapsing" | Nee | 1 |
| 9 | `combat_shield_block` | Schild blokkeert aanval, metaal-ring | 0.3 | "Shield blocking a strike, metallic ring with vibration" | Nee | 2 |
| 10 | `combat_charge_impact` | Cavalerie/tractor charge impact, zware botsing | 0.6 | "Heavy cavalry charge impact, horse and armor crashing into soldiers" | Nee | 1 |
| 11 | `combat_critical_hit` | Extra hard impact + metaal ring, kritische hit | 0.4 | "Critical strike impact, powerful metallic hit with resonance" | Nee | 2 |
| 12 | `combat_miss` | Wapen mist, whoosh zonder impact | 0.3 | "Weapon swing missing target, whoosh ending in nothing" | Nee | 2 |
| 13 | `combat_knockback` | Eenheid wordt teruggeslagen, body sliding | 0.5 | "Body being knocked back, sliding on dirt with grunt" | Nee | 2 |

### 2.2 Death SFX

| # | Naam | Beschrijving | Duur (s) | ElevenLabs Prompt | Loop | Prio |
|---|------|-------------|---------|-------------------|------|------|
| 14 | `death_unit_generic` | Generiek stervend geluid, val + stilte | 0.8 | "Soldier falling dead to the ground, armor clattering, final breath" | Nee | 1 |
| 15 | `death_unit_heavy` | Zwaar gepantserde unit sterft, metaal crash | 1.0 | "Heavy armored unit collapsing, loud metal crash on stone ground" | Nee | 2 |
| 16 | `death_hero` | Hero death, dramatisch, met echo | 1.5 | "Epic hero death, dramatic fall with reverberating echo, slow motion feel" | Nee | 1 |

### 2.3 Building SFX

| # | Naam | Beschrijving | Duur (s) | ElevenLabs Prompt | Loop | Prio |
|---|------|-------------|---------|-------------------|------|------|
| 17 | `building_hammer` | Hamer op hout/steen, bouwgeluid | 0.4 | "Hammer hitting wood, construction sound, single strike" | Nee | 1 |
| 18 | `building_construct_loop` | Bouwproces loop: hamer, zaag, gereedschap mix | 2.0 | "Construction sounds loop, hammering sawing building medieval" | Ja | 1 |
| 19 | `building_complete` | Bouw voltooid: heldere beloning + laatste hamerslagen | 1.0 | "Building construction complete, triumphant chime with final hammer strike" | Nee | 1 |
| 20 | `building_destroy` | Gebouw stort in: kraken, stof, puin | 1.5 | "Building collapsing, wood cracking stone crumbling, dust cloud" | Nee | 1 |
| 21 | `building_upgrade` | Upgrade geluid: magische shimmer + hamers | 1.0 | "Building upgrade sound, magical shimmer transforming with construction" | Nee | 1 |
| 22 | `building_place` | Gebouw plaatsen op terrein, grond-impact | 0.5 | "Heavy structure being placed on ground, thud with settling" | Nee | 2 |

### 2.4 UI SFX

| # | Naam | Beschrijving | Duur (s) | ElevenLabs Prompt | Loop | Prio |
|---|------|-------------|---------|-------------------|------|------|
| 23 | `ui_click` | Button click, subtiel, responsief | 0.1 | "Subtle UI button click, soft tap, satisfying" | Nee | 1 |
| 24 | `ui_select_unit` | Unit geselecteerd, zachte ping | 0.2 | "Unit selection sound, soft ping, gentle notification" | Nee | 1 |
| 25 | `ui_deselect` | Deselectie, zachte whoosh omlaag | 0.15 | "Deselection sound, soft downward whoosh" | Nee | 2 |
| 26 | `ui_error` | Foutmelding, negatieve buzz | 0.3 | "Error sound, negative buzz, wrong action notification" | Nee | 1 |
| 27 | `ui_notification` | Notificatie, zacht belletje | 0.3 | "Notification chime, gentle bell, attention sound" | Nee | 1 |
| 28 | `ui_achievement` | Achievement unlocked, triomfantelijke fanfare kort | 0.8 | "Achievement unlocked jingle, short triumphant fanfare" | Nee | 2 |
| 29 | `ui_menu_open` | Menu opent, zachte swipe omhoog | 0.2 | "Menu opening sound, soft upward swipe, paper unfolding" | Nee | 2 |
| 30 | `ui_menu_close` | Menu sluit, zachte swipe omlaag | 0.2 | "Menu closing sound, soft downward swipe, paper folding" | Nee | 2 |
| 31 | `ui_minimap_ping` | Minimap klik, radar-achtige ping | 0.3 | "Radar ping sound, minimap click, sonar blip" | Nee | 2 |
| 32 | `ui_research_complete` | Research voltooid, mystieke shimmer | 0.5 | "Research complete chime, mystical shimmer, knowledge gained" | Nee | 2 |

### 2.5 Ability SFX (Factie-specifiek)

| # | Naam | Beschrijving | Duur (s) | ElevenLabs Prompt | Loop | Prio |
|---|------|-------------|---------|-------------------|------|------|
| 33 | `ability_carnavalsrage` | Confetti-explosie + feesttoeter + menigte juichen | 1.5 | "Carnival confetti explosion with party horns and crowd cheering" | Nee | 1 |
| 34 | `ability_polonaise` | Marcheerritme, voeten stampend + zingen | 2.0 | "Group marching in polonaise, feet stomping rhythmically with singing" | Nee | 1 |
| 35 | `ability_smokkelroute` | Stealth activatie, zachte whoosh + fade | 0.8 | "Stealth activation, soft fade out whoosh, invisibility cloak" | Nee | 1 |
| 36 | `ability_koffie_gebak` | Koffie inschenken + taart serveren, gezellig | 1.0 | "Coffee pouring into cup with cake plate setting down, cozy" | Nee | 2 |
| 37 | `ability_tractor_charge` | Tractor motor rev-up + charge + crash | 1.5 | "Tractor engine revving up loudly, charging forward, heavy impact crash" | Nee | 1 |
| 38 | `ability_frikandel_speciaal` | Sissend vet + splatter + brand | 1.0 | "Hot oil sizzling, splatter explosion, fire igniting, frying" | Nee | 1 |
| 39 | `ability_confetti_kanon` | Groot confetti-kanon, explosie + confetti regen | 1.2 | "Confetti cannon firing, loud pop followed by confetti raining down" | Nee | 1 |
| 40 | `ability_vergadering` | Kantoor ambiance + laptop openen + koffie + stoel schuiven | 2.0 | "Office meeting starting, chairs scraping, laptop opening, coffee cups" | Nee | 1 |
| 41 | `ability_performance_review` | Paper shuffle + stempel + negative buzzer | 0.8 | "Papers shuffling, heavy stamp on document, negative buzzer" | Nee | 2 |
| 42 | `ability_reorganisatie` | Chaos: papier vliegt, stoelen schuiven, verwarring | 1.0 | "Office reorganization chaos, papers flying, chairs moving, confusion" | Nee | 2 |
| 43 | `ability_gentrificatie` | Hipster cafe ambiance fade-in, vintage vinyl spelen | 1.5 | "Hipster cafe sounds fading in, vinyl record starting to play, coffee machine" | Nee | 2 |
| 44 | `ability_viral_post` | Smartphone notificaties cascade, likes/shares | 1.0 | "Cascade of smartphone notifications, rapid fire likes and shares, viral" | Nee | 2 |
| 45 | `ability_cancel_culture` | Crowd boo-ing + X/delete geluid | 0.8 | "Crowd booing followed by digital delete sound, cancellation" | Nee | 2 |
| 46 | `ability_overname` | Corporate takeover: stamp + kassa + document ondertekenen | 1.0 | "Corporate takeover, heavy stamp, cash register, pen signing document" | Nee | 2 |
| 47 | `ability_vlaai_splash` | Grote vlaai-impact, natte klap + druipen | 0.8 | "Pie splatting on surface, wet splat with dripping" | Nee | 1 |
| 48 | `ability_vloedgolf_vlaai` | Golf van vlaaien, natte massa-impact + splatter | 1.5 | "Wave of pies crashing, massive wet impact, splattering everywhere" | Nee | 1 |
| 49 | `ability_steenhuid` | Steen verhardend, gesteente kraak + echo | 0.8 | "Stone hardening, rock cracking and solidifying with deep echo" | Nee | 1 |
| 50 | `ability_mijnschacht_instorten` | Mijn instorting: rotsen vallen, aarde beeft, stof | 2.0 | "Mine shaft collapsing, rocks falling, earth trembling, dust settling" | Nee | 1 |
| 51 | `ability_maasvloed` | Watervloed, rivier stijgt, overspoelend water | 1.5 | "River flood surge, water rising rapidly, overwhelming wave crashing" | Nee | 1 |
| 52 | `ability_tunnel_teleport` | Aarde opent + whoosh + aarde sluit, teleportatie | 1.0 | "Ground opening, magical whoosh through tunnel, ground closing" | Nee | 1 |
| 53 | `ability_diplomatieke_verwarring` | Chaotische stemmen in meerdere talen, verwarring | 1.5 | "Chaotic voices in multiple languages talking over each other, confusion" | Nee | 1 |
| 54 | `ability_praline_surprise` | Chocolade-bom: smelt geluid + giftige sisser | 0.8 | "Chocolate melting then poisonous hiss, toxic candy" | Nee | 2 |
| 55 | `ability_manneken_pis` | Water onder druk, fontein-achtig + splash | 1.0 | "Pressurized water stream, fountain shooting, splash impact" | Nee | 1 |
| 56 | `ability_disguise` | Transformatie-geluid, shimmer + nieuwe identiteit | 0.8 | "Shapeshifting transformation, shimmering magical disguise" | Nee | 2 |
| 57 | `ability_stiltegelofte` | Plotselinge absolute stilte + kerkklok | 1.0 | "Sudden absolute silence, then single deep church bell tolling" | Nee | 2 |
| 58 | `ability_kamerdebat` | Parlementair gehamer + "orde! orde!" menigte | 1.0 | "Parliament gavel banging, crowd settling, order order" | Nee | 2 |

### 2.6 Resource SFX

| # | Naam | Beschrijving | Duur (s) | ElevenLabs Prompt | Loop | Prio |
|---|------|-------------|---------|-------------------|------|------|
| 59 | `resource_chop_tree` | Bijl in hout, houthakkerslag | 0.4 | "Axe chopping into tree, wood chipping" | Nee | 1 |
| 60 | `resource_tree_fall` | Boom valt om, kraken + impact | 1.5 | "Tree falling in forest, wood cracking, heavy thud on ground" | Nee | 2 |
| 61 | `resource_mine_gold` | Pikhouweel in steen, metaal-achtig | 0.4 | "Pickaxe hitting rock in mine, metallic mineral clink" | Nee | 1 |
| 62 | `resource_carry_pickup` | Resources oppakken, zak/mand optillen | 0.3 | "Picking up heavy sack, lifting with effort" | Nee | 2 |
| 63 | `resource_deposit` | Resources afleveren bij Town Hall, zak neerleggen + coins | 0.5 | "Sack of goods dropped at depot, coins settling, delivery complete" | Nee | 1 |
| 64 | `resource_node_depleted` | Resource-node uitgeput, leeg geluid | 0.5 | "Resource depleted, empty hollow sound, nothing left" | Nee | 2 |

### 2.7 Ambient SFX

| # | Naam | Beschrijving | Duur (s) | ElevenLabs Prompt | Loop | Prio |
|---|------|-------------|---------|-------------------|------|------|
| 65 | `ambient_wind` | Zachte wind over velden, Brabants landschap | 8.0 | "Gentle wind blowing across open fields, rural countryside breeze" | Ja | 1 |
| 66 | `ambient_birds` | Vogelgezang, landelijke sfeer, meerdere soorten | 10.0 | "Birds singing in countryside, multiple species, peaceful morning" | Ja | 1 |
| 67 | `ambient_crickets` | Krekels, avondsfeer | 8.0 | "Crickets chirping at dusk, evening countryside atmosphere" | Ja | 2 |
| 68 | `ambient_church_bells` | Kerkklokken in de verte, dorps | 3.0 | "Distant church bells ringing, small village, echoing" | Nee | 2 |
| 69 | `ambient_crowd_distant` | Verre menigte, carnaval/markt geroezemoes | 6.0 | "Distant crowd noise, market or carnival, muffled chattering" | Ja | 2 |
| 70 | `ambient_water_stream` | Beekje/rivier, stromend water | 8.0 | "Gentle stream flowing, water over rocks, peaceful river" | Ja | 2 |
| 71 | `ambient_fire_crackle` | Kampvuur, knisperend vuur | 6.0 | "Campfire crackling, wood burning, warm cozy fire" | Ja | 3 |
| 72 | `ambient_rain` | Regen op daken en velden | 8.0 | "Rain falling on rooftops and fields, steady rainfall" | Ja | 3 |
| 73 | `ambient_thunder` | Onweer in de verte | 2.0 | "Distant thunder rumbling, approaching storm" | Nee | 3 |
| 74 | `ambient_night` | Nachtgeluiden: uilen, wind, stilte | 8.0 | "Night ambience, owl hooting, gentle wind, peaceful silence" | Ja | 3 |

### 2.8 Movement SFX

| # | Naam | Beschrijving | Duur (s) | ElevenLabs Prompt | Loop | Prio |
|---|------|-------------|---------|-------------------|------|------|
| 75 | `move_footsteps_light` | Lichte voetstappen op gras | 0.6 | "Light footsteps walking on grass, soft steps" | Nee | 1 |
| 76 | `move_footsteps_heavy` | Zware voetstappen, gepantserd | 0.6 | "Heavy armored footsteps on stone, metal clanking" | Nee | 1 |
| 77 | `move_footsteps_group` | Groep marcheert, meerdere voeten | 1.0 | "Group marching together, multiple feet in rhythm" | Nee | 2 |
| 78 | `move_tractor_engine` | Tractormotor stationair | 3.0 | "Tractor engine idling, diesel motor rumbling" | Ja | 2 |
| 79 | `move_tractor_drive` | Tractor rijdend | 3.0 | "Tractor driving on dirt road, engine and wheels" | Ja | 2 |
| 80 | `move_horse_gallop` | Paard galop (Frituurridder) | 1.0 | "Horse galloping on dirt, hooves pounding" | Nee | 2 |

### 2.9 Totaal SFX Overzicht

| Categorie | Aantal | Prio 1 | Prio 2 | Prio 3 |
|-----------|--------|--------|--------|--------|
| Combat | 13 | 8 | 5 | 0 |
| Death | 3 | 2 | 1 | 0 |
| Building | 6 | 4 | 2 | 0 |
| UI | 10 | 4 | 6 | 0 |
| Ability (factie-specifiek) | 26 | 14 | 12 | 0 |
| Resource | 6 | 3 | 3 | 0 |
| Ambient | 10 | 2 | 4 | 4 |
| Movement | 6 | 2 | 4 | 0 |
| **TOTAAL** | **80** | **39** | **37** | **4** |

---

## 3. Muziek Cue Sheet

### 3.1 Main Menu Theme

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_main_menu` |
| **Titel** | "Reign of Brabant" |
| **Stijl/Mood** | Episch, warm, avontuurlijk met Brabantse folklore ondertoon |
| **Instrumentatie** | Orkest (strijkers + koper), accordeon solo intro, Brabantse harmonie, warme hoorn, trom build-up |
| **Tempo** | 90 BPM |
| **Duur** | 2:30 (loop-friendly) |
| **Trigger** | Main menu screen geladen |
| **Loop** | Ja, seamless loop |
| **Crossfade** | Fade out 2s naar geselecteerde factie-theme bij game start |
| **Suno Prompt** | "Epic orchestral fantasy main theme, warm and adventurous, Dutch folk accordion melody intro, brass fanfare, strings building, medieval RTS game menu music, 90 BPM, triumphant yet cozy, loop-friendly ending" |

### 3.2 Brabanders Theme

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_brabanders` |
| **Titel** | "De Gezelligen" |
| **Stijl/Mood** | Warm, volksmuziek, gezellig, carnaval-ondertoon, uitnodigend |
| **Instrumentatie** | Accordeon (lead), hobo, viool, dwarsfluit, handklappen, tamboerijn, contrabas, lichte percussie |
| **Tempo** | 110 BPM |
| **Duur** | 3:00 (loop-friendly) |
| **Trigger** | Brabander-speler start match / Brabander-base zichtbaar |
| **Loop** | Ja |
| **Crossfade** | 3s crossfade met battle music bij combat, 2s crossfade met andere factie-themes |
| **Suno Prompt** | "Warm Dutch folk music, accordion lead, violin, flute, hand claps, tambourine, carnival undertone, cozy and inviting, medieval fantasy, 110 BPM, tavern celebration meets battlefield march, seamless loop" |

### 3.3 Randstad Theme

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_randstad` |
| **Titel** | "Corporate Conquest" |
| **Stijl/Mood** | Strak, klinisch, corporate synth met onheilspellende ondertoon, stressvol maar efficient |
| **Instrumentatie** | Synthesizer pads, strak drumpatroon (electronic), strijkers (staccato), piano (minimal), klok-tikken als percussie, telefoonrinkel als accent |
| **Tempo** | 100 BPM |
| **Duur** | 3:00 (loop-friendly) |
| **Trigger** | Randstad-speler start match / Randstad-base zichtbaar |
| **Loop** | Ja |
| **Crossfade** | 3s crossfade met battle music |
| **Suno Prompt** | "Corporate dystopian synth music, clinical and efficient, staccato strings, electronic drums, minimal piano, clock ticking percussion, ominous and stressful, corporate office meets medieval conquest, 100 BPM, seamless loop" |

### 3.4 Limburgers Theme

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_limburgers` |
| **Titel** | "De Diepte" |
| **Stijl/Mood** | Mysterieus, echoend, mijnwerkerslied, diep en aards, ondergronds gevoel |
| **Instrumentatie** | Lage strijkers (cello, contrabas), mijnwerkershamers als percussie, echoende hoorn, duduk/klarinet (donker), druppelwater ambient, mannenkoor (laag) |
| **Tempo** | 75 BPM |
| **Duur** | 3:00 (loop-friendly) |
| **Trigger** | Limburger-speler start match / Limburger-base zichtbaar |
| **Loop** | Ja |
| **Crossfade** | 3s crossfade met battle music |
| **Suno Prompt** | "Dark mysterious underground mining music, low cello and double bass, echoing horn, pickaxe percussion, dripping water ambience, deep male choir, subterranean fortress feel, 75 BPM, medieval dark folk, seamless loop" |

### 3.5 Belgen Theme

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_belgen` |
| **Titel** | "Le Grand Compromis" |
| **Stijl/Mood** | Chaotisch vrolijk, mix van stijlen, musette/chanson met middeleeuwse elementen, verwarrend maar charmant |
| **Instrumentatie** | Accordeon (musette stijl), viool, klarinet, snaredrum (militair), bel/triangel, contrabas, onverwachte instrumentwissels |
| **Tempo** | 120 BPM |
| **Duur** | 3:00 (loop-friendly) |
| **Trigger** | Belgische speler start match / Belgische base zichtbaar |
| **Loop** | Ja |
| **Crossfade** | 3s crossfade met battle music |
| **Suno Prompt** | "Chaotic joyful Belgian folk music, musette accordion, violin, clarinet, military snare drum, unexpected instrument switches, medieval meets Parisian cafe, 120 BPM, charming chaos, diplomatic dance, seamless loop" |

### 3.6 Battle Intensity Low

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_battle_low` |
| **Titel** | "Eerste Schermutselingen" |
| **Stijl/Mood** | Spanning opbouwend, onheilspellend, alertheid |
| **Instrumentatie** | Lage strijkers tremolo, subtiele percussie (snaredrum roll), spanning akkoorden, lage hoorn |
| **Tempo** | 85 BPM |
| **Duur** | 2:00 (loop-friendly) |
| **Trigger** | 1-3 vijandelijke units in sight range, eerste contact |
| **Loop** | Ja |
| **Crossfade** | 2s crossfade van factie theme, 1.5s crossfade naar medium bij escalatie |
| **Suno Prompt** | "Low intensity battle music, building tension, low tremolo strings, subtle snare drum roll, ominous horn, RTS game scouting music, 85 BPM, alert and watchful, seamless loop" |

### 3.7 Battle Intensity Medium

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_battle_medium` |
| **Titel** | "De Slag Ontbrandt" |
| **Stijl/Mood** | Actief gevecht, urgentie, adrenaline zonder paniek |
| **Instrumentatie** | Orkest vol (strijkers + koper), militaire drums, hoorn fanfare, snelle strijkers, cymbalenslagen |
| **Tempo** | 120 BPM |
| **Duur** | 2:30 (loop-friendly) |
| **Trigger** | 4-10 vijandelijke units in combat, actief gevecht |
| **Loop** | Ja |
| **Crossfade** | 1.5s crossfade van low, 1.5s crossfade naar high bij grote slag |
| **Suno Prompt** | "Medium intensity battle music, full orchestra, military drums, horn fanfare, fast strings, cymbal crashes, active combat RTS music, 120 BPM, urgent and driving, seamless loop" |

### 3.8 Battle Intensity High

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_battle_high` |
| **Titel** | "Totale Oorlog" |
| **Stijl/Mood** | Vol orkest, maximale intensiteit, episch, overweldigend |
| **Instrumentatie** | Vol orkest fortissimo, oorlogstrommen, koorkoor, koper fanfare, snelle strijker-runs, pauken, bekkens, alles erop en eraan |
| **Tempo** | 140 BPM |
| **Duur** | 2:30 (loop-friendly) |
| **Trigger** | 10+ vijandelijke units in combat, hero vs hero, base aanval |
| **Loop** | Ja |
| **Crossfade** | 1.5s crossfade van medium, 3s fade-out naar factie theme als combat stopt |
| **Suno Prompt** | "Maximum intensity epic battle music, full orchestra fortissimo, war drums, choir, brass fanfare, fast string runs, timpani, total war RTS game, 140 BPM, overwhelming and epic, seamless loop" |

### 3.9 Victory Fanfare

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_victory` |
| **Titel** | "Brabant Triomfeert" |
| **Stijl/Mood** | Triomfantelijk, warm, Brabants, vreugdevol, feestelijk |
| **Instrumentatie** | Koper fanfare (trompet lead), strijkers crescendo, accordeon, handklappen, kerkklokken, triomfmars |
| **Tempo** | 100 BPM |
| **Duur** | 1:30 (geen loop, eenmalig) |
| **Trigger** | Speler wint de match |
| **Loop** | Nee (maar houdt laatste akkoord aan tot scene wisselt) |
| **Crossfade** | Direct cut van battle music |
| **Suno Prompt** | "Triumphant victory fanfare, brass trumpet lead, strings crescendo, accordion, hand claps, church bells, medieval victory celebration, 100 BPM, warm and joyful, Dutch folk triumph, one-shot ending" |

### 3.10 Defeat Theme

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_defeat` |
| **Titel** | "Brabant Valt" |
| **Stijl/Mood** | Melancholisch, somber, verlies maar waardig, hoopvol einde |
| **Instrumentatie** | Solo cello, zachte strijkers, solo hobo, lage piano akkoorden, zachte kerkklokken aan het einde |
| **Tempo** | 60 BPM |
| **Duur** | 1:00 (geen loop) |
| **Trigger** | Speler verliest de match |
| **Loop** | Nee |
| **Crossfade** | Abrupte cut van battle music, fade-in 1s |
| **Suno Prompt** | "Melancholic defeat theme, solo cello melody, soft strings, solo oboe, low piano chords, gentle church bells at end, 60 BPM, dignified loss, somber but with hope, one-shot" |

### 3.11 Campaign Cutscene Music

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_cutscene` |
| **Titel** | "Het Verhaal van Brabant" |
| **Stijl/Mood** | Verhalend, cinematisch, dynamisch, spanning en verwondering |
| **Instrumentatie** | Vol orkest, dynamisch (piano solo bij rustige momenten, vol orkest bij onthullingen), harp voor mysterie, strijkers voor emotie |
| **Tempo** | 80 BPM (variabel) |
| **Duur** | 3:00 (loop-friendly voor langere scenes) |
| **Trigger** | Campaign cutscene / story moment |
| **Loop** | Ja (optioneel) |
| **Crossfade** | 2s fade-in, 2s fade-out |
| **Suno Prompt** | "Cinematic storytelling music, full orchestra, dynamic intensity, piano solo for quiet moments, full orchestra for revelations, harp for mystery, strings for emotion, 80 BPM, medieval narrative, epic fantasy story" |

### 3.12 Lobby / Waiting Music

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_lobby` |
| **Titel** | "De Herberg" |
| **Stijl/Mood** | Ontspannen, taverne-achtig, gezellig, wachtend op avontuur |
| **Instrumentatie** | Akoestische gitaar, dwarsfluit, lichte percussie (tamboerijn), contrabas, luit |
| **Tempo** | 95 BPM |
| **Duur** | 2:00 (loop-friendly) |
| **Trigger** | Lobby / game setup / map selectie |
| **Loop** | Ja |
| **Crossfade** | 2s crossfade naar factie theme bij game start |
| **Suno Prompt** | "Medieval tavern music, acoustic guitar, flute, tambourine, double bass, lute, cozy and relaxed, waiting for adventure, 95 BPM, RPG lobby music, warm and inviting, seamless loop" |

### 3.13 Tutorial Music

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_tutorial` |
| **Titel** | "De Eerste Les" |
| **Stijl/Mood** | Licht, speels, bemoedigend, niet opdringerig |
| **Instrumentatie** | Xylofoon/glockenspiel, lichte strijkers (pizzicato), harp, zachte fluit |
| **Tempo** | 100 BPM |
| **Duur** | 2:00 (loop-friendly) |
| **Trigger** | Tutorial modus |
| **Loop** | Ja |
| **Crossfade** | 2s crossfade naar factie theme na tutorial |
| **Suno Prompt** | "Playful tutorial music, xylophone glockenspiel, pizzicato strings, harp, soft flute, light and encouraging, not intrusive, learning adventure, 100 BPM, medieval whimsical, seamless loop" |

### 3.14 Boss Battle Theme

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_boss_battle` |
| **Titel** | "De Eindbaas" |
| **Stijl/Mood** | Intens, dreigend, episch, finale confrontatie |
| **Instrumentatie** | Vol orkest fortissimo, koorkoor (Latijns-achtig), oorlogstrommen, orgel (kerk), dissonante strijkers, koperblazers fff |
| **Tempo** | 150 BPM |
| **Duur** | 2:30 (loop-friendly) |
| **Trigger** | Hero vs Hero gevecht, finale campaign missie |
| **Loop** | Ja |
| **Crossfade** | 1s crossfade van battle high, 3s fade-out naar victory/defeat |
| **Suno Prompt** | "Intense boss battle music, full orchestra fortissimo, Latin choir, war drums, church organ, dissonant strings, brass fff, final confrontation, 150 BPM, epic and menacing, medieval dark fantasy boss fight, seamless loop" |

### 3.15 Easter Egg Music (Guus Meeuwis Cheat)

| Eigenschap | Waarde |
|-----------|--------|
| **Naam** | `music_easter_egg_guus` |
| **Titel** | "Brabant (Cheat Mode)" |
| **Stijl/Mood** | Stadium-schlager, Guus Meeuwis-stijl, vol gas feest |
| **Instrumentatie** | Akoestische gitaar (strumming), keyboard, drums (pop-rock), meezingbaar refrein, stadionklappen |
| **Tempo** | 108 BPM |
| **Duur** | 2:00 (loop-friendly) |
| **Trigger** | Cheat code "GUUSMEEUWIS" of "BRABANT" in chat getypt |
| **Loop** | Ja (zolang cheat actief is) |
| **Crossfade** | Abrupte switch (comic effect), geen fade |
| **Suno Prompt** | "Dutch stadium singalong pop-rock, acoustic guitar strumming, keyboard, pop drums, anthemic chorus, crowd clapping along, Brabant celebration, 108 BPM, feel-good party anthem, seamless loop" |

### 3.16 Muziek Overzicht

| # | Track | Stijl | Duur | Loop | Prio |
|---|-------|-------|------|------|------|
| 1 | Main Menu Theme | Episch orkestaal | 2:30 | Ja | 1 |
| 2 | Brabanders Theme | Warm volksmuziek | 3:00 | Ja | 1 |
| 3 | Randstad Theme | Corporate synth | 3:00 | Ja | 1 |
| 4 | Limburgers Theme | Mysterieus mijnwerker | 3:00 | Ja | 1 |
| 5 | Belgen Theme | Chaotisch musette | 3:00 | Ja | 1 |
| 6 | Battle Low | Spanning | 2:00 | Ja | 1 |
| 7 | Battle Medium | Actief | 2:30 | Ja | 1 |
| 8 | Battle High | Episch vol | 2:30 | Ja | 1 |
| 9 | Victory Fanfare | Triomf | 1:30 | Nee | 1 |
| 10 | Defeat Theme | Melancholisch | 1:00 | Nee | 1 |
| 11 | Campaign Cutscene | Cinematisch | 3:00 | Ja | 2 |
| 12 | Lobby Music | Taverne | 2:00 | Ja | 2 |
| 13 | Tutorial Music | Speels | 2:00 | Ja | 2 |
| 14 | Boss Battle | Intens | 2:30 | Ja | 1 |
| 15 | Easter Egg (Guus) | Stadium | 2:00 | Ja | 3 |
| | **TOTAAL** | | **~35:00** | | |

---

## 4. Audio Systeem Architectuur

### 4.1 Howler.js Configuratie

```javascript
// audio/AudioManager.js

class AudioManager {
  constructor() {
    // === Globale instellingen ===
    this.masterVolume = 1.0;
    this.musicVolume = 0.6;     // Muziek standaard 60%
    this.sfxVolume = 0.8;       // SFX standaard 80%
    this.voiceVolume = 1.0;     // Voice lines altijd luid
    this.ambientVolume = 0.3;   // Ambient subtiel

    // === Categorieen (aparte Howl instances) ===
    this.music = null;          // Huidige muziek track
    this.musicNext = null;      // Volgende track (voor crossfade)
    this.sfxPool = {};          // SFX pool per geluid
    this.voiceQueue = [];       // Voice line queue (max 1 tegelijk)
    this.ambientLayers = [];    // Ambient geluidlagen (max 3)

    // === State ===
    this.isMuted = false;
    this.isFocused = true;
    this.currentMusicTrack = null;
    this.battleIntensity = 0;   // 0=none, 1=low, 2=medium, 3=high
    this.voicePlaying = false;
  }

  init() {
    // Howler globale configuratie
    Howler.autoUnlock = true;    // iOS/Chrome autoplay unlock
    Howler.html5PoolSize = 10;  // HTML5 audio pool
    Howler.autoSuspend = false; // Voorkom auto-suspend

    // Browser blur/focus handlers
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onBlur();
      } else {
        this.onFocus();
      }
    });

    // Preload essentiele SFX
    this.preloadSFX();
    this.preloadAmbient();
  }
}
```

### 4.2 Audio Sprite Sheets (UI SFX)

Alle UI SFX in een enkel bestand voor minimale HTTP requests:

```javascript
// Alle UI geluiden in 1 sprite sheet
this.uiSprite = new Howl({
  src: ['audio/sfx/ui-sprite.webm', 'audio/sfx/ui-sprite.mp3'],
  sprite: {
    click:          [0, 100],      // 0ms - 100ms
    select_unit:    [200, 200],    // 200ms - 400ms
    deselect:       [500, 150],    // 500ms - 650ms
    error:          [750, 300],    // 750ms - 1050ms
    notification:   [1200, 300],   // 1200ms - 1500ms
    achievement:    [1600, 800],   // 1600ms - 2400ms
    menu_open:      [2500, 200],   // 2500ms - 2700ms
    menu_close:     [2800, 200],   // 2800ms - 3000ms
    minimap_ping:   [3100, 300],   // 3100ms - 3400ms
    research:       [3500, 500],   // 3500ms - 4000ms
  },
  volume: 0.8,
  preload: true,
});
```

### 4.3 3D Spatial Audio

```javascript
// === Spatial Audio Setup ===
// Listener = camera positie (update elke frame)
// Sources = unit posities (update per unit)

class SpatialAudioManager {
  constructor(camera) {
    this.camera = camera;

    // Howler spatial defaults
    Howler.pos(0, 0, 0);          // Listener start positie
    Howler.orientation(0, 0, -1,  // Forward vector
                       0, 1, 0);  // Up vector
  }

  // Update listener positie (call in render loop)
  updateListener() {
    const pos = this.camera.position;
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    Howler.pos(pos.x, pos.y, pos.z);
    Howler.orientation(dir.x, dir.y, dir.z, 0, 1, 0);
  }

  // Speel 3D SFX af op een unit positie
  playSpatialSFX(soundId, position, options = {}) {
    const sound = this.sfxPool[soundId];
    if (!sound) return;

    const id = sound.play();

    // 3D positionering
    sound.pos(position.x, position.y, position.z, id);

    // Distance attenuation
    sound.pannerAttr({
      panningModel: 'HRTF',
      refDistance: options.refDistance || 10,
      maxDistance: options.maxDistance || 100,
      rolloffFactor: options.rolloff || 1.5,
      distanceModel: 'exponential',
      coneInnerAngle: 360,
      coneOuterAngle: 360,
      coneOuterGain: 0.5,
    }, id);

    return id;
  }
}
```

### 4.4 Distance Attenuation Curves

```
Geluidstype       | refDistance | maxDistance | rolloffFactor | Model
------------------|-----------|------------|---------------|------
Voice lines       | 8         | 60         | 1.0           | exponential
Combat SFX        | 10        | 80         | 1.5           | exponential
Building SFX      | 15        | 100        | 1.2           | exponential
Ability SFX       | 20        | 120        | 1.0           | exponential
Ambient SFX       | 30        | 150        | 0.8           | exponential
Movement SFX      | 5         | 40         | 2.0           | exponential
Music             | N/A       | N/A        | N/A           | Niet spatiaal
UI SFX            | N/A       | N/A        | N/A           | Niet spatiaal
```

**Uitleg:**
- `refDistance`: Afstand waarop het geluid op volle sterkte is
- `maxDistance`: Afstand waarop het geluid niet meer hoorbaar is
- `rolloffFactor`: Hoe snel het volume afneemt (hoger = sneller)
- Voice lines zijn belangrijk dus ze vallen langzamer af
- Movement SFX vallen snel af (je hoort ze alleen dichtbij)

### 4.5 Audio Priority Systeem

```javascript
// Maximum gelijktijdige geluiden per categorie
const AUDIO_LIMITS = {
  music: 2,           // Huidige + crossfade target
  voice: 1,           // Slechts 1 voice line tegelijk
  combat_sfx: 8,      // Max 8 combat geluiden
  building_sfx: 3,    // Max 3 bouwgeluiden
  ability_sfx: 4,     // Max 4 ability geluiden
  ambient: 3,         // Max 3 ambient lagen
  ui_sfx: 3,          // Max 3 UI geluiden
  movement_sfx: 6,    // Max 6 movement geluiden
  // TOTAAL MAXIMUM: ~30 gelijktijdige geluiden
};

// Prioriteitslijst (hogere = belangrijker, verdringt lagere)
const AUDIO_PRIORITY = {
  voice_hero: 10,       // Hero voice lines - altijd hoorbaar
  voice_narrator: 9,    // Narrator/announcer
  voice_unit: 7,        // Unit voice lines
  ability_sfx: 6,       // Ability geluiden
  combat_sfx: 5,        // Combat geluiden
  death_sfx: 5,         // Death geluiden
  building_complete: 4, // Gebouw voltooid
  resource_sfx: 3,      // Resource geluiden
  movement_sfx: 2,      // Bewegingsgeluiden
  ambient: 1,           // Omgevingsgeluiden
};
```

**Regels:**
1. Als het maximum voor een categorie bereikt is, wordt het oudste/verste geluid gestopt
2. Hogere prioriteit kan lagere prioriteit onderbreken
3. Hero voice lines onderbreken ALTIJD alle andere voice lines
4. UI SFX worden NOOIT onderdrukt (ze zijn niet-spatiaal en kritisch voor feedback)

### 4.6 Music Crossfade Systeem

```javascript
class MusicCrossfader {
  // Crossfade van huidig naar nieuw track
  crossfade(newTrackId, duration = 2000) {
    const newTrack = new Howl({
      src: [`audio/music/${newTrackId}.webm`,
            `audio/music/${newTrackId}.mp3`],
      loop: true,
      volume: 0,
      html5: true,  // Streaming voor muziek
    });

    // Fade-out huidig
    if (this.currentTrack) {
      this.currentTrack.fade(
        this.currentTrack.volume(),
        0,
        duration
      );
      setTimeout(() => {
        this.currentTrack.stop();
        this.currentTrack.unload();
      }, duration);
    }

    // Fade-in nieuw
    newTrack.play();
    newTrack.fade(0, this.musicVolume, duration);
    this.currentTrack = newTrack;
    this.currentTrackId = newTrackId;
  }
}
```

### 4.7 Dynamic Battle Music

```javascript
class DynamicBattleMusic {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.intensity = 0;
    this.combatUnits = 0;
    this.updateInterval = null;
  }

  start() {
    // Check elke 2 seconden
    this.updateInterval = setInterval(() => {
      this.evaluateIntensity();
    }, 2000);
  }

  evaluateIntensity() {
    // Tel vijandelijke units in zichtbare combat
    const visibleEnemiesInCombat = this.countVisibleEnemiesInCombat();
    const heroInCombat = this.isHeroInCombat();
    const baseUnderAttack = this.isBaseUnderAttack();

    let newIntensity = 0;

    if (baseUnderAttack || heroInCombat) {
      newIntensity = 3; // HIGH - altijd als base/hero in gevaar
    } else if (visibleEnemiesInCombat >= 10) {
      newIntensity = 3; // HIGH
    } else if (visibleEnemiesInCombat >= 4) {
      newIntensity = 2; // MEDIUM
    } else if (visibleEnemiesInCombat >= 1) {
      newIntensity = 1; // LOW
    } else {
      newIntensity = 0; // NONE - terug naar factie theme
    }

    if (newIntensity !== this.intensity) {
      this.transitionTo(newIntensity);
      this.intensity = newIntensity;
    }
  }

  transitionTo(intensity) {
    const tracks = {
      0: this.audioManager.currentFactionTheme,
      1: 'music_battle_low',
      2: 'music_battle_medium',
      3: 'music_battle_high',
    };

    const crossfadeDuration = {
      0: 3000,  // 3s terug naar factie theme
      1: 2000,  // 2s naar low
      2: 1500,  // 1.5s naar medium
      3: 1000,  // 1s naar high (snelle reactie)
    };

    this.audioManager.crossfadeMusic(
      tracks[intensity],
      crossfadeDuration[intensity]
    );
  }
}
```

### 4.8 Audio Ducking

```javascript
class AudioDucker {
  // Wanneer een voice line speelt:
  // - Muziek naar 30% volume
  // - SFX naar 60% volume
  // - Na voice line: terug naar normaal (fade 500ms)

  duckForVoice() {
    if (this.audioManager.music) {
      this.audioManager.music.fade(
        this.audioManager.musicVolume,
        this.audioManager.musicVolume * 0.3,
        300  // 300ms fade naar stil
      );
    }
    // SFX pool volume verlagen
    this.audioManager.sfxDuckMultiplier = 0.6;
  }

  unduckAfterVoice() {
    if (this.audioManager.music) {
      this.audioManager.music.fade(
        this.audioManager.musicVolume * 0.3,
        this.audioManager.musicVolume,
        500  // 500ms terug naar normaal
      );
    }
    this.audioManager.sfxDuckMultiplier = 1.0;
  }
}
```

### 4.9 Mute on Blur

```javascript
// Automatisch muten wanneer de browser tab niet in focus is
onBlur() {
  this.isFocused = false;
  this.preMuteVolume = Howler.volume();
  Howler.volume(0);
}

onFocus() {
  this.isFocused = true;
  // Fade-in bij terugkomen (niet abrupt)
  const targetVol = this.preMuteVolume || 1.0;
  Howler.volume(0);
  // Handmatige fade-in over 300ms
  const steps = 10;
  const stepSize = targetVol / steps;
  let current = 0;
  const interval = setInterval(() => {
    current += stepSize;
    if (current >= targetVol) {
      Howler.volume(targetVol);
      clearInterval(interval);
    } else {
      Howler.volume(current);
    }
  }, 30);
}
```

### 4.10 Voice Line Systeem

```javascript
class VoiceLineManager {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.lastPlayedTime = {};     // Cooldown per unit type
    this.minInterval = 2000;      // Minimaal 2s tussen voice lines
    this.currentVoice = null;
  }

  play(faction, unit, action, position) {
    // === Cooldown check ===
    const key = `${faction}-${unit}-${action}`;
    const now = Date.now();
    if (this.lastPlayedTime[key] &&
        now - this.lastPlayedTime[key] < this.minInterval) {
      return; // Te snel na vorige
    }

    // === Selecteer random variant ===
    const variants = this.getVariants(faction, unit, action);
    const variant = variants[Math.floor(Math.random() * variants.length)];

    // === Onderbreek huidige voice (tenzij hero/narrator) ===
    if (this.currentVoice && !this.currentVoice.isHero) {
      this.currentVoice.sound.stop();
    }

    // === Duck andere audio ===
    this.audioManager.ducker.duckForVoice();

    // === Speel af met spatial ===
    const fileName =
      `${faction}-${unit}-${action}-${variant}.webm`;
    const sound = new Howl({
      src: [`audio/voice/${faction}/${fileName}`,
            `audio/voice/${faction}/${fileName.replace('.webm','.mp3')}`],
      volume: this.audioManager.voiceVolume,
    });

    const id = sound.play();

    // Spatial positionering
    if (position) {
      sound.pos(position.x, position.y, position.z, id);
      sound.pannerAttr({
        refDistance: 8,
        maxDistance: 60,
        rolloffFactor: 1.0,
        distanceModel: 'exponential',
      }, id);
    }

    sound.on('end', () => {
      this.audioManager.ducker.unduckAfterVoice();
      this.currentVoice = null;
    });

    this.currentVoice = {
      sound,
      id,
      isHero: unit.includes('prins') ||
              unit.includes('boer-van') ||
              unit.includes('ceo') ||
              unit.includes('politicus') ||
              unit.includes('mijnbaas') ||
              unit.includes('maasmeester') ||
              unit.includes('frietkoning') ||
              unit.includes('abdijheer'),
    };

    this.lastPlayedTime[key] = now;
  }

  // Idle voice lines: 30s+ geen actie
  checkIdleVoices(units) {
    for (const unit of units) {
      if (unit.isSelected && unit.idleTime > 30000) {
        const randomChance = Math.random();
        if (randomChance < 0.1) { // 10% kans per check
          this.play(unit.faction, unit.type, 'idle', unit.position);
          unit.idleTime = 0; // Reset timer
        }
      }
    }
  }
}
```

### 4.11 Bestandsformaten

| Formaat | Gebruik | Reden |
|---------|---------|-------|
| **WebM (Opus)** | Primair voor alle audio | Kleinste bestanden, best ondersteund in moderne browsers |
| **MP3** | Fallback | Safari legacy, oudere browsers |
| **WAV** | Alleen source/recording | Niet voor in-game, te groot |

**Compressie-instellingen:**
- Voice lines: Opus 48kbps mono (klein, spraak-geoptimaliseerd)
- SFX: Opus 96kbps mono
- Music: Opus 128kbps stereo
- Ambient: Opus 64kbps mono (achtergrond, lage kwaliteit ok)

### 4.12 Folder Structuur

```
reign-of-brabant/
├── audio/
│   ├── music/
│   │   ├── music_main_menu.webm
│   │   ├── music_main_menu.mp3
│   │   ├── music_brabanders.webm
│   │   ├── music_randstad.webm
│   │   ├── music_limburgers.webm
│   │   ├── music_belgen.webm
│   │   ├── music_battle_low.webm
│   │   ├── music_battle_medium.webm
│   │   ├── music_battle_high.webm
│   │   ├── music_victory.webm
│   │   ├── music_defeat.webm
│   │   ├── music_cutscene.webm
│   │   ├── music_lobby.webm
│   │   ├── music_tutorial.webm
│   │   ├── music_boss_battle.webm
│   │   └── music_easter_egg_guus.webm
│   ├── sfx/
│   │   ├── ui-sprite.webm        # UI sprite sheet
│   │   ├── ui-sprite.mp3
│   │   ├── combat/
│   │   │   ├── combat_sword_swing.webm
│   │   │   ├── combat_sword_hit.webm
│   │   │   └── ... (alle combat SFX)
│   │   ├── building/
│   │   │   ├── building_hammer.webm
│   │   │   └── ...
│   │   ├── ability/
│   │   │   ├── ability_carnavalsrage.webm
│   │   │   └── ...
│   │   ├── resource/
│   │   │   ├── resource_chop_tree.webm
│   │   │   └── ...
│   │   ├── ambient/
│   │   │   ├── ambient_wind.webm
│   │   │   └── ...
│   │   └── movement/
│   │       ├── move_footsteps_light.webm
│   │       └── ...
│   └── voice/
│       ├── brabanders/
│       │   ├── brabanders-boer-select-1.webm
│       │   ├── brabanders-boer-select-2.webm
│       │   ├── brabanders-boer-select-3.webm
│       │   ├── brabanders-boer-move-1.webm
│       │   └── ... (alle Brabander voice lines)
│       ├── randstad/
│       │   └── ...
│       ├── limburgers/
│       │   └── ...
│       └── belgen/
│           └── ...
```

### 4.13 Geschatte Bestandsgroottes

| Categorie | Bestanden | Gem. grootte | Totaal |
|-----------|-----------|-------------|--------|
| Music (15 tracks) | 30 (webm+mp3) | ~800KB | ~24 MB |
| Voice lines (~496) | ~992 | ~15KB | ~15 MB |
| SFX (80) | 160 | ~25KB | ~4 MB |
| UI Sprite Sheet | 2 | ~50KB | ~0.1 MB |
| **TOTAAL** | | | **~43 MB** |

**Lazy loading strategie:**
1. **Preload (onmiddellijk):** UI sprite, narrator lines, menu music (~3 MB)
2. **Load op game start:** Geselecteerde factie voice lines, factie theme, battle music (~15 MB)
3. **Load on demand:** Overige factie voice lines, ambient, ability SFX (~25 MB)

---

## 5. Voice Recording Guide

### 5.1 Microfoon Setup

**Aanbevolen setup:**
- Microfoon: condensator USB mic (bv. Blue Yeti, Rode NT-USB, AT2020)
- Afstand: 15-20cm van de microfoon
- Pop filter: verplicht (voorkomt plof-geluiden op "p" en "b")
- Kamer: zo stil mogelijk, zachte oppervlakken (deken over bureau, deur dicht)
- Geen achtergrondgeluid: airco uit, ramen dicht, telefoon stil

**Software:**
- Opname: Audacity (gratis) of GarageBand
- Instellingen: 48kHz sample rate, 24-bit depth, mono
- Monitor: koptelefoon (geen speakers, voorkomt feedback)

**Pre-recording checklist:**
- [ ] Pop filter gemonteerd
- [ ] Goede microfoon afstand (15-20cm)
- [ ] Stil in de kamer
- [ ] Test opname gemaakt en beluisterd
- [ ] Water bij de hand (droge keel = slechte opnames)
- [ ] Voice warmup gedaan (5 min praten/hummen)

### 5.2 Stemrichtlijnen per Factie

#### Brabanders Voice

| Eigenschap | Richtlijn |
|-----------|-----------|
| **Pitch** | Normaal tot iets lager, warm |
| **Tempo** | Ontspannen, niet gehaast. Brabanders hebben geen stress |
| **Emotie** | Warm, gezellig, nuchter. Zelfs in gevecht: "ach ja, vooruit dan" |
| **Dialect** | Zachte g, echt Brabants. "hedde", "ge", "nie", "moar", "laot", "dur" |
| **Sleutelwoorden** | "hedde", "ge", "nie", "moar", "houdoe", "Alaaf!" |
| **Valkuil** | Niet te hard of te agressief. Brabanders zijn strijdlustig maar altijd warm |
| **Referentie** | Denk aan een gezellige oom die toevallig ook kan vechten |

**Dialect reminder:**
- "niet" -> "nie"
- "maar" -> "moar"
- "laat" -> "laot"
- "door" -> "dur"
- "hebben" -> "hedde" (2e persoon)
- "jij" -> "ge"
- Zachte g (geen keelschrapen)
- Warme, ontspannen toon in alles

#### Randstad Voice

| Eigenschap | Richtlijn |
|-----------|-----------|
| **Pitch** | Normaal, iets hoger bij stress |
| **Tempo** | Snel, efficient, geen woord te veel (behalve jargon, dat is eindeloos) |
| **Emotie** | Droog, cynisch, gestrest. Altijd een beetje geirriteerd |
| **Dialect** | Zuiver ABN, GEEN accent. Corporate Nederlands |
| **Sleutelwoorden** | "stakeholders", "alignment", "roadmap", "escaleren", "KPI" |
| **Valkuil** | Niet te komisch - de humor zit in de DROOGHEID, niet in overdrijving |
| **Referentie** | Denk aan een vermoeide manager die net uit een vergadering komt |

#### Limburgers Voice

| Eigenschap | Richtlijn |
|-----------|-----------|
| **Pitch** | Lager dan normaal, diep, echoend gevoel |
| **Tempo** | Langzaam, bedachtzaam, korte zinnen. Spreekt in mysteries |
| **Emotie** | Mysterieus, nuchter, stoisch. Weinig woorden, veel betekenis |
| **Dialect** | Zachte klanken, "ich" ipv "ik", "sjt" ipv "st", "geit" ipv "gaat" |
| **Sleutelwoorden** | "Gluck auf", "sjoen", "hej", "jao", "de berg" |
| **Valkuil** | Niet te snel praten. Limburgers nemen hun tijd |
| **Referentie** | Denk aan een oude mijnwerker die alles al heeft gezien |

#### Belgen Voice

| Eigenschap | Richtlijn |
|-----------|-----------|
| **Pitch** | Variabel - van hoog enthousiast tot laag dreigend |
| **Tempo** | Onvoorspelbaar - soms snel, soms langzaam, altijd verrassend |
| **Emotie** | Chaotisch warm, "amai!", expressief. Springt van emotie naar emotie |
| **Dialect** | Vlaams: zachter dan Nederlands, "ge" ipv "je", Franstalige woorden |
| **Sleutelwoorden** | "amai", "allez", "goesting", "ambetant", "ne keer" |
| **Valkuil** | Niet te Frans - het is Vlaams met een sausje Frans, niet andersom |
| **Referentie** | Denk aan een Vlaamse kroegbaas die tegelijk kookt en vertelt |

### 5.3 Opname Format & Naamconventie

**Format:**
- WAV, 48kHz, 24-bit, mono
- Geen processing (EQ, compressie, reverb) - dat doet ElevenLabs
- Minimaal 0.5s stilte voor en na elke lijn
- Opname in een stille ruimte

**Naamconventie:**
```
<factie>-<unit>-<actie>-<variant>.wav

Voorbeelden:
brabanders-boer-select-1.wav
brabanders-boer-select-2.wav
brabanders-boer-move-1.wav
brabanders-carnavalvierder-attack-3.wav
randstad-stagiair-death-1.wav
limburgers-mijnwerker-idle-2.wav
belgen-frietkoning-ultimate-1.wav
```

**Actie codes:**
| Code | Actie |
|------|-------|
| `select` | Unit geselecteerd |
| `move` | Move commando |
| `attack` | Attack commando |
| `death` | Unit sterft |
| `ability` | Ability gebruikt |
| `idle` | 30+ seconden inactief |
| `ultimate` | Hero ultimate ability |

### 5.4 Geschatte Opnametijd per Factie

**Basis opname (Richard spreekt zelf in):**

| Factie | Units | Lijnen per unit | Totaal lijnen | Geschatte opnametijd |
|--------|-------|----------------|--------------|---------------------|
| Brabanders | 10 | ~15 | ~150 | 2-3 uur |
| Randstad | 10 | ~15 | ~150 | 2-3 uur |
| Limburgers | 8 | ~15 | ~120 | 1.5-2.5 uur |
| Belgen | 8 | ~15 | ~120 | 1.5-2.5 uur |
| Narrator | 1 | ~20 | ~20 | 30 min |
| **TOTAAL** | | | **~560** | **~8-12 uur** |

**Planning suggestie:**
- Dag 1: Brabanders (meest natuurlijk, warm-up)
- Dag 2: Randstad (andere stem, fris beginnen)
- Dag 3: Limburgers + Narrator (kort, gefocust)
- Dag 4: Belgen + retakes van alle facties

**Tips voor efficiente sessies:**
1. Neem per unit ALLE lijnen achter elkaar op (consistente stem)
2. 3-5 seconden pauze tussen lijnen (makkelijker knippen)
3. Neem elke lijn 2-3 keer op, kies de beste
4. Doe elke 30 minuten een pauze van 5 min (water, stem rust)
5. Werk per factie, wissel niet tussendoor (dialect-consistentie)
6. Begin met de makkelijkste emotie (select) en eindig met de zwaarste (death/ultimate)

### 5.5 Dialect Consistentie Tips

**Brabants:**
- Luister vooraf naar 10 minuten Brabants dialect op YouTube
- Oefen de kernzinnen: "Hedde al gegeten?", "Ge kunt er niks aan doen"
- De zachte g moet CONSISTENT zijn - gebruik hem in ELKE lijn
- "nie" ipv "niet", "moar" ipv "maar", "ge" ipv "jij" — consequent!
- Bij twijfel: spreek het zoals thuis, niet overdreven

**Randstad (ABN):**
- Geen enkele verbuiging, geen enkel accent. Vlak en zakelijk
- Oefen corporate zinnen alsof je ze in een echt meeting zou zeggen
- De humor komt uit de INHOUD, niet uit de uitspraak

**Limburgs:**
- "Ich" ipv "ik" is het belangrijkste kenmerk
- Langzamer praten dan normaal
- Zachte klanken, niets scherp
- Minder is meer: korte zinnen, weinig woorden

**Vlaams:**
- "Ge" ipv "je", "gij" ipv "jij"
- "Amai" is de Vlaamse versie van "wow/wauw" - gebruik het veel
- Toon-variatie is groter dan in Nederlands - overdrijf iets
- Mix af en toe een Frans woord erin, maar niet te veel

### 5.6 ElevenLabs Voice Cloning Pipeline

**Stap 1: Basis voice clone**
1. Selecteer de ~20 beste Brabander opnames als training data
2. Upload naar ElevenLabs Professional Voice Clone
3. Test de clone met een paar testzinnen
4. Fine-tune indien nodig (meer samples toevoegen)

**Stap 2: 4 factie-variaties**
Met de base clone, maak 4 voice presets:

| Preset | Instellingen | Doel |
|--------|-------------|------|
| `brabanders_warm` | Stability: 0.5, Clarity: 0.7, Style: 0.3 | Warm, gezellig Brabants |
| `randstad_corporate` | Stability: 0.8, Clarity: 0.9, Style: 0.1 | Strak, droog ABN |
| `limburgers_deep` | Stability: 0.6, Clarity: 0.5, Style: 0.4 | Diep, echoend |
| `belgen_chaotic` | Stability: 0.3, Clarity: 0.6, Style: 0.7 | Expressief, variabel |

**Stap 3: Genereer alle voice lines**
- Input: de tekst uit dit document + factie-voice-preset
- Output: WAV 48kHz mono per lijn
- Review: beluister ELKE lijn, retake bij slechte kwaliteit

**Stap 4: Post-processing**
1. Trim stilte (max 0.2s voor/na)
2. Normalize volume (-3dB peak)
3. Exporteer als WebM (Opus 48kbps) + MP3 fallback
4. Naamgeving volgens conventie

---

## 6. Productie Overzicht

### 6.1 Totale Audio Assets

| Categorie | Aantal items | Geschatte grootte |
|-----------|-------------|------------------|
| Voice lines | ~496 | ~15 MB |
| Narrator lines | ~20 | ~0.5 MB |
| SFX | 80 | ~4 MB |
| UI Sprite Sheet | 1 (10 geluiden) | ~0.1 MB |
| Music tracks | 15 | ~24 MB |
| **TOTAAL** | **~612 items** | **~43.6 MB** |

### 6.2 Productie Pipeline

```
Fase 1: Voorbereiding (1 dag)
├── Microfoon setup testen
├── Dialect oefenen (alle 4 facties)
└── Voice warmup routine opstellen

Fase 2: Opname (4 dagen)
├── Dag 1: Brabanders voice lines (~150 lijnen)
├── Dag 2: Randstad voice lines (~150 lijnen)
├── Dag 3: Limburgers + Narrator (~140 lijnen)
└── Dag 4: Belgen + retakes (~140 lijnen)

Fase 3: ElevenLabs Processing (1 dag)
├── Voice clone training (3-4 uur)
├── 4 factie-presets maken en testen
├── Genereer alle lijnen (~2 uur met review)
└── Post-processing en export

Fase 4: SFX Productie (1 dag)
├── ElevenLabs SFX generatie (80 effecten)
├── Review en retake slechte resultaten
├── UI sprite sheet compileren
└── Export naar WebM + MP3

Fase 5: Muziek Productie (2-3 dagen)
├── Richard maakt tracks in Suno (handmatig)
├── 15 tracks x ~20 min per track = ~5 uur generatie
├── Review, selectie, loop-point editing
└── Export en compressie

Fase 6: Integratie (1-2 dagen)
├── AudioManager implementeren
├── Spatial audio setup
├── Voice line systeem testen
├── Music crossfade systeem testen
├── Performance profiling
└── Finale mix en balancing

TOTAAL: ~10-12 werkdagen
```

### 6.3 Kosten Schatting

| Item | Kosten | Bron |
|------|--------|------|
| ElevenLabs Voice Clone + lijnen | $0 | Bestaand abonnement |
| ElevenLabs SFX generatie | $0 | Bestaand abonnement |
| Suno muziek generatie | $0 | Bestaand abonnement / Richard handmatig |
| Microfoon (indien nodig) | $0-100 | Eenmalig, waarschijnlijk al aanwezig |
| Audacity | $0 | Gratis software |
| **TOTAAL** | **$0-100** | |

### 6.4 MVP Audio (Minimaal voor v0.1)

Voor de MVP met 2 facties (Brabanders + Randstad):

| Categorie | Items | Beschrijving |
|-----------|-------|-------------|
| Voice lines | ~240 | 2 facties x 10 units x ~12 lijnen |
| Narrator | 10 | Kernmeldingen |
| SFX (Prio 1) | 39 | Alle prio 1 effecten |
| Music | 7 | Menu + 2 factie + 3 battle + victory |
| **Totaal MVP** | **~296** | |

---

## Appendix A: Audio File Naming Quick Reference

```
Voice:  <factie>-<unit>-<actie>-<variant>.webm
SFX:    <categorie>_<naam>.webm
Music:  music_<naam>.webm

Facties:  brabanders, randstad, limburgers, belgen
Acties:   select, move, attack, death, ability, idle, ultimate
Varianten: 1, 2, 3
```

## Appendix B: Howler.js Dependencies

```json
{
  "dependencies": {
    "howler": "^2.2.4"
  }
}
```

Geen andere audio-dependencies nodig. Howler.js handelt alles af inclusief Web Audio API, HTML5 Audio fallback, sprite sheets, 3D spatial audio en cross-browser compatibiliteit.

---

**Einde document**

*Dit sub-PRD bevat het volledige audio blueprint voor Reign of Brabant. Alle ~612 audio assets zijn gespecificeerd met productie-instructies, technische architectuur en een duidelijke productie-pipeline.*
