# Meshy 3D Model Concept Art Plan -- Sprints 2-6

**Versie**: 1.0.0
**Datum**: 2026-04-14
**Status**: Klaar voor uitvoering
**Doel**: Alle concept art prompts voor fal.ai Flux Pro, gegroepeerd per sprint en batch

---

## Inhoudsopgave

1. [Bestaande Model Inventaris](#1-bestaande-model-inventaris)
2. [Nieuwe Unit Modellen (Sprint 3)](#2-nieuwe-unit-modellen-sprint-3)
3. [Nieuwe Building Modellen (Sprint 2/6)](#3-nieuwe-building-modellen-sprint-26)
4. [Concept Art Batch Plan](#4-concept-art-batch-plan)
5. [Meshy Credits Schatting](#5-meshy-credits-schatting)

---

## 1. Bestaande Model Inventaris

### Per Faction -- Huidige Modellen

#### Brabanders (v02 + v03)

| Model | v02 | v03 (animated) | Grootte | Kwaliteit | Opmerking |
|-------|-----|-----------------|---------|-----------|-----------|
| worker.glb | Ja | Ja | 3.4 MB | LAAG | fal.ai generatie, needs regen |
| infantry.glb | Ja | Ja | 3.7 MB | LAAG | fal.ai generatie, needs regen |
| ranged.glb | Ja | Ja | 3.2 MB | LAAG | fal.ai generatie, needs regen |
| heavy.glb | Ja | Nee | 11.0 MB | MEDIUM | Nieuwer, v02 only |
| townhall.glb | Ja | -- | 4.0 MB | LAAG | fal.ai generatie |
| barracks.glb | Ja | -- | 4.4 MB | LAAG | fal.ai generatie |
| lumbercamp.glb | Ja | -- | 4.7 MB | MEDIUM | Dedicated model |
| blacksmith.glb | Ja | -- | 4.4 MB | MEDIUM | Dedicated model |

#### Randstad (v02 + v03)

| Model | v02 | v03 (animated) | Grootte | Kwaliteit | Opmerking |
|-------|-----|-----------------|---------|-----------|-----------|
| worker.glb | Ja | Ja | 3.4 MB | LAAG | fal.ai generatie, needs regen |
| infantry.glb | Ja | Ja | 2.7 MB | LAAG | fal.ai generatie, needs regen |
| ranged.glb | Ja | Ja | 3.3 MB | LAAG | fal.ai generatie, needs regen |
| heavy.glb | Ja | Nee | 7.2 MB | MEDIUM | Nieuwer, v02 only |
| townhall.glb | Ja | -- | 3.1 MB | LAAG | fal.ai generatie |
| barracks.glb | Ja | -- | 3.0 MB | LAAG | fal.ai generatie |
| lumbercamp.glb | Ja | -- | 4.6 MB | MEDIUM | Dedicated model |
| blacksmith.glb | Ja | -- | 5.0 MB | MEDIUM | Dedicated model |

#### Limburgers (v02 + v03)

| Model | v02 | v03 (animated) | Grootte | Kwaliteit | Opmerking |
|-------|-----|-----------------|---------|-----------|-----------|
| worker.glb | Ja | Ja | 21.4 MB | HOOG | Meshy Studio direct |
| infantry.glb | Ja | Ja | 17.0 MB | HOOG | Meshy Studio direct |
| ranged.glb | Ja | Ja | 21.4 MB | HOOG | Meshy Studio direct |
| heavy.glb | Ja | Nee | 8.5 MB | MEDIUM | Nieuwer, v02 only |
| townhall.glb | Ja | -- | 36.0 MB | HOOG | Meshy Studio direct |
| barracks.glb | Ja | -- | 35.2 MB | HOOG | Meshy Studio direct |
| lumbercamp.glb | Ja | -- | 4.5 MB | MEDIUM | Dedicated model |
| blacksmith.glb | Ja | -- | 4.5 MB | MEDIUM | Dedicated model |

#### Belgen (v02 + v03)

| Model | v02 | v03 (animated) | Grootte | Kwaliteit | Opmerking |
|-------|-----|-----------------|---------|-----------|-----------|
| worker.glb | Ja | Ja | 23.2 MB | HOOG | Meshy Studio direct |
| infantry.glb | Ja | Ja | 20.7 MB | HOOG | Meshy Studio direct |
| ranged.glb | Ja | Ja | 17.2 MB | HOOG | Meshy Studio direct |
| heavy.glb | Ja | Nee | 9.5 MB | MEDIUM | Nieuwer, v02 only |
| townhall.glb | Ja | -- | 52.4 MB | HOOG | Meshy Studio direct |
| barracks.glb | Ja | -- | 44.9 MB | HOOG | Meshy Studio direct |
| lumbercamp.glb | Ja | -- | 5.5 MB | MEDIUM | Dedicated model |
| blacksmith.glb | Ja | -- | 4.7 MB | MEDIUM | Dedicated model |

#### Heroes (dedicated directory)

| Model | Grootte | Kwaliteit |
|-------|---------|-----------|
| brabant-prins.glb | 8.5 MB | HOOG |
| brabant-boer.glb | 9.5 MB | HOOG |
| randstad-ceo.glb | 6.2 MB | HOOG |
| randstad-politicus.glb | 6.6 MB | HOOG |
| limburg-mijnbaas.glb | 9.3 MB | HOOG |
| limburg-maasmeester.glb | 7.6 MB | HOOG |
| belgen-frietkoning.glb | 8.2 MB | HOOG |
| belgen-abdijbrouwer.glb | 6.9 MB | HOOG |

#### Shared (v02)

| Model | Grootte | Kwaliteit |
|-------|---------|-----------|
| bridge.glb | 10.7 MB | HOOG |
| tunnel_entrance.glb | 8.0 MB | HOOG |
| goldmine.glb | 4.9 MB | MEDIUM |
| tree_pine.glb | 4.9 MB | MEDIUM |

### Samenvatting Bestaand

- **Units**: 12 basis (worker/infantry/ranged x 4 facties) + 4 heavy = **16 unit modellen**
- **Heroes**: **8 hero modellen** (alle 8 bestaan al)
- **Buildings**: 24 building modellen (townhall/barracks/lumbercamp/blacksmith x 4 + 4 shared)
- **Totaal bestaand**: **48 GLB bestanden**

### Wat Ontbreekt

| Categorie | Ontbrekend | Details |
|-----------|-----------|---------|
| **Unit: Siege** | 4 modellen | 1 per factie (Frituurmeester, Vastgoedmakelaar, Kolenbrander, Manneken Pis-kanon) |
| **Unit: Support** | 4 modellen | 1 per factie (Boerinne, HR-Medewerker, Sjpion, Wafelzuster) |
| **Unit: Special** | 6 modellen | Muzikant, Hipster, Influencer, Heuvelwacht, Mijnrat, Dubbele Spion |
| **Building: Defense Tower** | 4 modellen | 1 per factie |
| **Building: Housing** | 4 modellen | 1 per factie |
| **Building: Siege Workshop** | 4 modellen | 1 per factie |
| **Building: Tertiary** | 4 modellen | 1 per factie (Dorpsweide, Starbucks, Mijnschacht, Chocolaterie) |
| **Building: Faction Special 1** | 4 modellen | 1 per factie |
| **Building: Faction Special 2** | 4 modellen | 1 per factie |
| **Totaal ontbrekend** | **38 modellen** | 14 units + 24 buildings |

> **Opmerking**: Heroes en Heavy units bestaan al. De task in de user request noemde 24 modellen (12 units + 12 buildings), maar de volledige scope is 38. Dit plan dekt de 24 uit het request (siege + support units en de 3 building types: tower/housing/workshop) plus de overige units/buildings uit de UNIT-MODEL-MATRIX.

---

## 2. Nieuwe Unit Modellen (Sprint 3)

### 2.1 Siege Units (4 modellen) -- Prioriteit HOOG

#### SIEGE-01: Frituurmeester (Brabanders)

| Veld | Waarde |
|------|--------|
| **Model naam** | frituurmeester.glb |
| **Factie** | Brabanders |
| **Sprint** | Sprint 3 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/brabanders/siege.glb` |
| **Type** | Siege -- machine/vehicle |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized mobile deep fryer cannon on wooden medieval cart with four wooden wheels, brass fittings, bubbling oil vat with steam vents, orange and brown color scheme, Dutch carnival food vendor transformed into siege weapon, front-facing view, white background, centered, game art style, clean edges, vibrant colors
```

---

#### SIEGE-02: Vastgoedmakelaar (Randstad)

| Veld | Waarde |
|------|--------|
| **Model naam** | vastgoedmakelaar.glb |
| **Factie** | Randstad |
| **Sprint** | Sprint 3 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/randstad/siege.glb` |
| **Type** | Siege -- machine/vehicle |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized mobile demolition crane vehicle, blue and grey corporate colors, wrecking ball shaped like a house key, "TE KOOP" real estate sign on the side, construction vehicle on wheels, modern corporate siege weapon, front-facing view, white background, centered, game art style, clean edges, vibrant colors
```

---

#### SIEGE-03: Kolenbrander (Limburgers)

| Veld | Waarde |
|------|--------|
| **Model naam** | kolenbrander.glb |
| **Factie** | Limburgers |
| **Sprint** | Sprint 3 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/limburgers/siege.glb` |
| **Type** | Siege -- machine/vehicle |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized coal-burning siege furnace on heavy iron wheels, tall chimney with orange smoke, glowing coal catapult mechanism, dark grey and dark green color scheme, medieval mining industrial style, front-facing view, white background, centered, game art style, clean edges, vibrant colors
```

---

#### SIEGE-04: Manneken Pis-kanon (Belgen)

| Veld | Waarde |
|------|--------|
| **Model naam** | manneken-pis-kanon.glb |
| **Factie** | Belgen |
| **Sprint** | Sprint 3 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/belgen/siege.glb` |
| **Type** | Siege -- machine/vehicle |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized large bronze Manneken Pis statue mounted on a wheeled wooden siege cart, water cannon nozzle, burgundy and gold decorations, Belgian flags, humorous siege weapon with unmistakable peeing boy silhouette, front-facing view, white background, centered, game art style, clean edges, vibrant colors
```

---

### 2.2 Support/Healer Units (4 modellen) -- Prioriteit HOOG

#### SUPPORT-01: Boerinne (Brabanders)

| Veld | Waarde |
|------|--------|
| **Model naam** | boerinne.glb |
| **Factie** | Brabanders |
| **Sprint** | Sprint 3 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/brabanders/support.glb` |
| **Type** | Unit -- humanoid |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized full body female Dutch farmer character, medieval dress with white apron, woven herb basket on her hip, wooden healing staff wrapped with orange ribbon, warm orange and cream colors, standing pose facing forward, white background, centered, game art style, clean edges, vibrant colors
```

---

#### SUPPORT-02: HR-Medewerker (Randstad)

| Veld | Waarde |
|------|--------|
| **Model naam** | hr-medewerker.glb |
| **Factie** | Randstad |
| **Sprint** | Sprint 3 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/randstad/support.glb` |
| **Type** | Unit -- humanoid |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized full body modern Dutch office worker character, blue business casual outfit, rectangular glasses, clipboard with colorful motivational stickers, friendly supportive pose, lanyard with badge, blue and white color scheme, standing pose facing forward, white background, centered, game art style, clean edges, vibrant colors
```

---

#### SUPPORT-03: Sjpion (Limburgers)

| Veld | Waarde |
|------|--------|
| **Model naam** | sjpion.glb |
| **Factie** | Limburgers |
| **Sprint** | Sprint 3 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/limburgers/support.glb` |
| **Type** | Unit -- humanoid |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized full body medieval hooded healer character, dark green hooded robe with herb pouches, leather satchel of poultices, mining lantern on a wooden staff, mysterious apothecary figure, dark green and brown color scheme, standing pose facing forward, white background, centered, game art style, clean edges, vibrant colors
```

---

#### SUPPORT-04: Wafelzuster (Belgen)

| Veld | Waarde |
|------|--------|
| **Model naam** | wafelzuster.glb |
| **Factie** | Belgen |
| **Sprint** | Sprint 3 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/belgen/support.glb` |
| **Type** | Unit -- humanoid |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized full body Belgian abbey nun character, dark burgundy monastery robes with gold trim, carrying a large waffle iron as a staff, serving tray with golden waffles, gentle healer pose, burgundy and gold color scheme, standing pose facing forward, white background, centered, game art style, clean edges, vibrant colors
```

---

### 2.3 Special Units (6 modellen) -- Prioriteit MEDIUM

#### SPECIAL-01: Muzikant (Brabanders)

| Veld | Waarde |
|------|--------|
| **Model naam** | muzikant.glb |
| **Factie** | Brabanders |
| **Sprint** | Sprint 3 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/brabanders/special_muzikant.glb` |
| **Type** | Unit -- humanoid |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized full body medieval Dutch carnival musician character, large brass tuba instrument held upright, orange festive costume with feathered carnival hat, round silhouette from the instrument, warm orange and brass colors, standing pose facing forward, white background, centered, game art style, clean edges, vibrant colors
```

---

#### SPECIAL-02: Hipster (Randstad)

| Veld | Waarde |
|------|--------|
| **Model naam** | hipster.glb |
| **Factie** | Randstad |
| **Sprint** | Sprint 3 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/randstad/special_hipster.glb` |
| **Type** | Unit -- humanoid |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized full body modern Dutch hipster character on an electric scooter, man-bun hairstyle, skinny jeans, blue denim jacket, takeaway coffee cup in hand, fast agile riding pose, thin tall silhouette, blue and grey color scheme, white background, centered, game art style, clean edges, vibrant colors
```

---

#### SPECIAL-03: Influencer (Randstad)

| Veld | Waarde |
|------|--------|
| **Model naam** | influencer.glb |
| **Factie** | Randstad |
| **Sprint** | Sprint 3 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/randstad/special_influencer.glb` |
| **Type** | Unit -- humanoid |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized full body modern Dutch social media influencer character, LED ring light mounted on a selfie stick weapon, smartphone in other hand, trendy blue outfit with designer accessories, expressive confident pose, blue and white color scheme, standing pose facing forward, white background, centered, game art style, clean edges, vibrant colors
```

---

#### SPECIAL-04: Heuvelwacht (Limburgers)

| Veld | Waarde |
|------|--------|
| **Model naam** | heuvelwacht.glb |
| **Factie** | Limburgers |
| **Sprint** | Sprint 3 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/limburgers/special_heuvelwacht.glb` |
| **Type** | Unit -- humanoid |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized full body medieval hill watchman character, light leather armor, brass spyglass held to eye, signal horn hanging from belt, elevated alert scout pose, tall thin build, dark green cloak with grey trim, standing pose facing forward, white background, centered, game art style, clean edges, vibrant colors
```

---

#### SPECIAL-05: Mijnrat (Limburgers)

| Veld | Waarde |
|------|--------|
| **Model naam** | mijnrat.glb |
| **Factie** | Limburgers |
| **Sprint** | Sprint 3 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/limburgers/special_mijnrat.glb` |
| **Type** | Unit -- humanoid (small) |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized full body small hunched medieval mine saboteur character, dark tattered clothing, bundle of dynamite sticks strapped to back, crouched sneaking pose with very low profile, rat-like posture, dark green and brown color scheme, small scale figure, white background, centered, game art style, clean edges, vibrant colors
```

---

#### SPECIAL-06: Dubbele Spion (Belgen)

| Veld | Waarde |
|------|--------|
| **Model naam** | dubbele-spion.glb |
| **Factie** | Belgen |
| **Sprint** | Sprint 3 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/belgen/special_dubbele_spion.glb` |
| **Type** | Unit -- humanoid |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric game asset, low-poly stylized full body Belgian double agent spy character, split outfit half-French half-Flemish down the middle, long trenchcoat, fedora hat pulled low, crouched sneaking pose, small profile, burgundy and gold split color scheme, mysterious figure, white background, centered, game art style, clean edges, vibrant colors
```

---

## 3. Nieuwe Building Modellen (Sprint 2/6)

### 3.1 Defense Tower (4 modellen) -- Prioriteit HOOG

#### TOWER-01: Kerktoren (Brabanders)

| Veld | Waarde |
|------|--------|
| **Model naam** | defense_tower.glb |
| **Factie** | Brabanders |
| **Sprint** | Sprint 2 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/brabanders/defense_tower.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Kerktoren met kanon" |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized medieval Dutch church tower with a mounted cannon on top, red-orange brick construction, pointed steeple with weather vane, arrow slits in walls, warm orange and red-brown color scheme, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

#### TOWER-02: Corporate Security Tower (Randstad)

| Veld | Waarde |
|------|--------|
| **Model naam** | defense_tower.glb |
| **Factie** | Randstad |
| **Sprint** | Sprint 2 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/randstad/defense_tower.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Corporate security tower" |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized modern corporate security guard tower, glass and steel construction, surveillance cameras on top, blue LED accent lighting, security checkpoint booth at base, corporate blue and grey color scheme, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

#### TOWER-03: Wachttoren (Limburgers)

| Veld | Waarde |
|------|--------|
| **Model naam** | defense_tower.glb |
| **Factie** | Limburgers |
| **Sprint** | Sprint 2 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/limburgers/defense_tower.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Wachttoren" (mergelstenen toren met scherpschutter) |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized tall medieval watchtower built from grey mergel limestone blocks, sharpshooter platform on top with wooden railings, mine shaft entrance at base, dark green banner hanging from side, dark green and grey color scheme, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

#### TOWER-04: Commissiegebouw (Belgen)

| Veld | Waarde |
|------|--------|
| **Model naam** | defense_tower.glb |
| **Factie** | Belgen |
| **Sprint** | Sprint 2 |
| **Prioriteit** | HOOG |
| **Output pad** | `public/assets/models/v02/belgen/defense_tower.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Commissiegebouw" (vertraagt vijanden via bureaucratie-aura) |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized Belgian EU commission building tower, art nouveau architecture with ornate balconies, tall narrow structure with domed top, Belgian flag on pole, bureaucratic scrolls visible through windows, burgundy and gold color scheme, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

### 3.2 Housing (4 modellen) -- Prioriteit MEDIUM

#### HOUSING-01: Brabantse Boerderij (Brabanders)

| Veld | Waarde |
|------|--------|
| **Model naam** | housing.glb |
| **Factie** | Brabanders |
| **Sprint** | Sprint 2 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/brabanders/housing.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Brabantse boerderij" |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized traditional Dutch Brabant farmhouse, long rectangular shape with thatched straw roof, white-washed walls with green shutters, small barn door, hay bales beside it, warm orange and cream color scheme, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

#### HOUSING-02: Flatgebouw (Randstad)

| Veld | Waarde |
|------|--------|
| **Model naam** | housing.glb |
| **Factie** | Randstad |
| **Sprint** | Sprint 2 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/randstad/housing.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Flatgebouw/kantoor" |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized modern Dutch apartment block, three stories with glass balconies, flat roof with rooftop terrace, concrete and glass construction, bicycle rack at entrance, blue and grey corporate color scheme, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

#### HOUSING-03: Huuske (Limburgers)

| Veld | Waarde |
|------|--------|
| **Model naam** | housing.glb |
| **Factie** | Limburgers |
| **Sprint** | Sprint 2 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/limburgers/housing.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Huuske" (Vakwerkhuis / Limburgs woonhuis) |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized traditional Limburg half-timbered house, vakwerk construction with dark wooden beams and white plaster walls, steep slate roof, small chimney with smoke, flower boxes in windows, dark green and grey color scheme, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

#### HOUSING-04: Brusselse Woning (Belgen)

| Veld | Waarde |
|------|--------|
| **Model naam** | housing.glb |
| **Factie** | Belgen |
| **Sprint** | Sprint 2 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/belgen/housing.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Brusselse Woning" |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized Belgian Brussels row house, narrow tall facade with ornate art nouveau details, arched windows, decorative ironwork balcony, stepped gable roof, burgundy brick with gold stone accents, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

### 3.3 Siege Workshop (4 modellen) -- Prioriteit MEDIUM

#### WORKSHOP-01: Tractorschuur (Brabanders)

| Veld | Waarde |
|------|--------|
| **Model naam** | siege_workshop.glb |
| **Factie** | Brabanders |
| **Sprint** | Sprint 2 (building) / Sprint 6 (model) |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/brabanders/siege_workshop.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Tractorschuur" |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized Dutch barn workshop with large sliding doors open showing a tractor inside, wooden plank construction, orange-brown weathered wood, anvil and tools visible, hay on the roof, warm orange and brown color scheme, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

#### WORKSHOP-02: Bouwplaats (Randstad)

| Veld | Waarde |
|------|--------|
| **Model naam** | siege_workshop.glb |
| **Factie** | Randstad |
| **Sprint** | Sprint 2/6 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/randstad/siege_workshop.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Bouwplaats met kraan" |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized modern construction site workshop, portable office container with blueprint table, small crane in background, orange safety barriers, hard hats on hooks, blue and orange corporate color scheme, construction scaffolding, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

#### WORKSHOP-03: Mijnwerkerskamp (Limburgers)

| Veld | Waarde |
|------|--------|
| **Model naam** | siege_workshop.glb |
| **Factie** | Limburgers |
| **Sprint** | Sprint 2/6 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/limburgers/siege_workshop.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Mijnwerkerskamp" (advanced unit production) |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized medieval mining camp workshop, stone and timber construction, mine cart rail tracks leading inside, forge with glowing coals, stacked dynamite crates, dark green canvas tent sections, dark green and grey color scheme, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

#### WORKSHOP-04: Surrealistisch Atelier / Rijschool (Belgen)

| Veld | Waarde |
|------|--------|
| **Model naam** | siege_workshop.glb |
| **Factie** | Belgen |
| **Sprint** | Sprint 2/6 |
| **Prioriteit** | MEDIUM |
| **Output pad** | `public/assets/models/v02/belgen/siege_workshop.glb` |
| **Type** | Building -- static |
| **PRD naam** | "Surrealistisch Atelier" (Dubbele Spion + Manneken Pis-kanon production) |
| **Concept art nodig** | Ja |

**fal.ai Flux Pro prompt:**
```
Isometric building, low-poly stylized surrealist Belgian art workshop, Magritte-inspired architecture with impossible windows, bowler hat weathervane on roof, paint-splattered walls, bronze foundry chimney, burgundy and gold with surreal green accents, front-facing detailed facade, white background, centered, game art style, clean edges, vibrant colors
```

---

## 4. Concept Art Batch Plan

Groepeer de 24 fal.ai Flux Pro prompts in efficiente batches van 4-6, georganiseerd op prioriteit en sprint.

### Batch 1: Defense Towers (Sprint 2 -- HOOG)

Eerste batch: deze modellen zijn nodig zodra Sprint 2 (Buildings & Tech Tree) start.

| # | Model | Factie | Prompt ID |
|---|-------|--------|-----------|
| 1 | Kerktoren met kanon | Brabanders | TOWER-01 |
| 2 | Corporate Security Tower | Randstad | TOWER-02 |
| 3 | Wachttoren | Limburgers | TOWER-03 |
| 4 | Commissiegebouw | Belgen | TOWER-04 |

**Actie**: Genereer 4 concept art images via fal.ai Flux Pro, dan 4x Meshy v6 image-to-3D.

---

### Batch 2: Siege Units (Sprint 3 -- HOOG)

Tweede batch: siege units zijn de meest visueel onderscheidende nieuwe eenheden.

| # | Model | Factie | Prompt ID |
|---|-------|--------|-----------|
| 5 | Frituurmeester | Brabanders | SIEGE-01 |
| 6 | Vastgoedmakelaar | Randstad | SIEGE-02 |
| 7 | Kolenbrander | Limburgers | SIEGE-03 |
| 8 | Manneken Pis-kanon | Belgen | SIEGE-04 |

**Actie**: Genereer 4 concept art, dan 4x Meshy v6. Siege units krijgen GEEN rigging (mechanisch).

---

### Batch 3: Support/Healer Units (Sprint 3 -- HOOG)

Derde batch: elke factie heeft een healer nodig voor balanced gameplay.

| # | Model | Factie | Prompt ID |
|---|-------|--------|-----------|
| 9 | Boerinne | Brabanders | SUPPORT-01 |
| 10 | HR-Medewerker | Randstad | SUPPORT-02 |
| 11 | Sjpion | Limburgers | SUPPORT-03 |
| 12 | Wafelzuster | Belgen | SUPPORT-04 |

**Actie**: Genereer 4 concept art, dan 4x Meshy v6 + 4x rigging (humanoid, 1.7m).

---

### Batch 4: Housing Buildings (Sprint 2 -- MEDIUM)

| # | Model | Factie | Prompt ID |
|---|-------|--------|-----------|
| 13 | Brabantse Boerderij | Brabanders | HOUSING-01 |
| 14 | Flatgebouw | Randstad | HOUSING-02 |
| 15 | Huuske | Limburgers | HOUSING-03 |
| 16 | Brusselse Woning | Belgen | HOUSING-04 |

**Actie**: Genereer 4 concept art, dan 4x Meshy v6. Geen rigging (static building).

---

### Batch 5: Siege Workshops (Sprint 2/6 -- MEDIUM)

| # | Model | Factie | Prompt ID |
|---|-------|--------|-----------|
| 17 | Tractorschuur | Brabanders | WORKSHOP-01 |
| 18 | Bouwplaats met kraan | Randstad | WORKSHOP-02 |
| 19 | Mijnwerkerskamp | Limburgers | WORKSHOP-03 |
| 20 | Surrealistisch Atelier | Belgen | WORKSHOP-04 |

**Actie**: Genereer 4 concept art, dan 4x Meshy v6. Geen rigging (static building).

---

### Batch 6: Special Units (Sprint 3 -- MEDIUM)

| # | Model | Factie | Prompt ID |
|---|-------|--------|-----------|
| 21 | Muzikant | Brabanders | SPECIAL-01 |
| 22 | Hipster (op scooter) | Randstad | SPECIAL-02 |
| 23 | Influencer | Randstad | SPECIAL-03 |
| 24 | Heuvelwacht | Limburgers | SPECIAL-04 |

**Actie**: Genereer 4 concept art, dan 4x Meshy v6. Hipster: rigging complex (scooter), overige: standaard humanoid rigging.

---

### Batch 7: Remaining Special Units (Sprint 3 -- MEDIUM)

| # | Model | Factie | Prompt ID |
|---|-------|--------|-----------|
| 25 | Mijnrat | Limburgers | SPECIAL-05 |
| 26 | Dubbele Spion | Belgen | SPECIAL-06 |

**Actie**: Genereer 2 concept art, dan 2x Meshy v6 + 2x rigging.

---

### Uitvoeringsvolgorde Samenvatting

```
WEEK 1 (Sprint 2 start):
  Batch 1: Defense Towers (4 concept art + 4 Meshy)     -- HOOG
  Batch 4: Housing (4 concept art + 4 Meshy)             -- MEDIUM

WEEK 2 (Sprint 3 start):
  Batch 2: Siege Units (4 concept art + 4 Meshy)         -- HOOG
  Batch 3: Support Units (4 concept art + 4 Meshy + 4 rig) -- HOOG

WEEK 3 (Sprint 3 vervolg):
  Batch 5: Siege Workshops (4 concept art + 4 Meshy)     -- MEDIUM
  Batch 6: Special Units A (4 concept art + 4 Meshy + rig) -- MEDIUM

WEEK 4 (Sprint 6 vervolg):
  Batch 7: Special Units B (2 concept art + 2 Meshy + rig) -- MEDIUM
```

---

## 5. Meshy Credits Schatting

### Per Model Type

| Stap | Credits | Toepassing |
|------|---------|------------|
| Image-to-3D (Meshy v6) | 30 | Elk model |
| Rigging (humanoid) | 5 | Alleen humanoid units |
| Animation (per clip) | 3 | Idle + Walk + Attack = 9 per unit |
| Remesh (indien nodig) | 5 | Alleen als polycount te hoog |

### Totaal Berekening

| Categorie | Aantal | Meshy Credits | Rigging | Animatie (3 clips) | Subtotaal |
|-----------|--------|---------------|---------|--------------------|-----------| 
| **Siege units** | 4 | 4 x 30 = 120 | 0 (mechanisch) | 0 (mechanisch) | **120** |
| **Support units** | 4 | 4 x 30 = 120 | 4 x 5 = 20 | 4 x 9 = 36 | **176** |
| **Special units** | 6 | 6 x 30 = 180 | 5 x 5 = 25 | 5 x 9 = 45 | **250** |
| **Defense towers** | 4 | 4 x 30 = 120 | 0 (building) | 0 (building) | **120** |
| **Housing** | 4 | 4 x 30 = 120 | 0 (building) | 0 (building) | **120** |
| **Siege workshops** | 4 | 4 x 30 = 120 | 0 (building) | 0 (building) | **120** |
| | | | | | |
| **TOTAAL** | **26** | **780** | **45** | **81** | **906 credits** |

### fal.ai Kosten (Concept Art)

| Item | Aantal | Model | Geschatte kost |
|------|--------|-------|----------------|
| Concept art images | 26 | Flux Pro v1.1 | ~26 x $0.05 = **$1.30** |
| Background removal | 26 | BiRefNet | ~26 x $0.01 = **$0.26** |
| **fal.ai totaal** | | | **~$1.56** |

### Meshy Studio Kosten

Met een Studio-abonnement (1000 credits/maand):

- **Maand 1**: 906 credits voor alle 26 modellen (inclusief rigging + animatie)
- **Resterende credits**: ~94 credits over voor eventuele hergeneraties of test-runs
- **Geschat aantal hergeneraties**: ~5-8 modellen (op basis van eerdere ervaring met Meshy kwaliteit)
- **Buffer nodig**: +150-240 extra credits (5-8 x 30)
- **Realistische schatting**: **~1050-1150 credits totaal** (1 maand + een klein overschot)

---

## Appendix A: Bestaande Concept Art

De volgende concept art images bestaan al in `public/assets/factions/`:

| Bestand | Gebruikt voor | Nog bruikbaar? |
|---------|--------------|----------------|
| brabanders-boer.png | Worker v01/v02 | Nee -- voor regen, niet nieuwe modellen |
| brabanders-carnavalvierder.png | Infantry v01/v02 | Nee |
| brabanders-prins.png | Ranged/Hero v01/v02 | Nee |
| brabanders-boerderij.png | Townhall v01/v02 | Nee |
| brabanders-cafe.png | Barracks v01/v02 | Nee |
| randstad-stagiair.png | Worker v01/v02 | Nee |
| randstad-manager.png | Infantry v01/v02 | Nee |
| randstad-hipster.png | Ranged v01/v02 | Nee |
| randstad-ceo.png | Hero | Nee |
| randstad-hoofdkantoor.png | Townhall/Barracks v01/v02 | Nee |
| belgen-frietkoning.png | Hero | Nee |
| limburgers-mijnbaas.png | Hero | Nee |

Geen van de bestaande concept art is bruikbaar voor de 26 nieuwe modellen -- alle prompts in dit plan genereren nieuwe concept art.

---

## Appendix B: Meshy Parameters Quick Reference

### Voor Unit Modellen (humanoid)

```json
{
  "ai_model": "meshy-6",
  "topology": "triangle",
  "target_polycount": 15000,
  "should_remesh": false,
  "should_texture": true,
  "enable_pbr": true,
  "image_enhancement": true,
  "remove_lighting": true,
  "target_formats": ["glb"],
  "origin_at": "bottom",
  "symmetry_mode": "auto"
}
```

### Voor Siege/Vehicle Modellen

```json
{
  "ai_model": "meshy-6",
  "topology": "triangle",
  "target_polycount": 18000,
  "should_remesh": false,
  "should_texture": true,
  "enable_pbr": true,
  "image_enhancement": true,
  "remove_lighting": true,
  "target_formats": ["glb"],
  "origin_at": "bottom",
  "symmetry_mode": "auto"
}
```

### Voor Building Modellen (static)

```json
{
  "ai_model": "meshy-6",
  "topology": "triangle",
  "target_polycount": 20000,
  "should_remesh": false,
  "should_texture": true,
  "enable_pbr": true,
  "image_enhancement": true,
  "remove_lighting": true,
  "target_formats": ["glb"],
  "origin_at": "bottom",
  "symmetry_mode": "auto"
}
```

### Rigging Parameters (voor humanoid units)

```json
{
  "input_task_id": "<meshy-task-id>",
  "height_meters": 1.7
}
```

---

## Appendix C: Output Pad Overzicht

Complete lijst van bestanden die dit plan genereert:

```
public/assets/models/v02/brabanders/
  siege.glb               -- Frituurmeester (NIEUW)
  support.glb             -- Boerinne (NIEUW)
  special_muzikant.glb    -- Muzikant (NIEUW)
  defense_tower.glb       -- Kerktoren (NIEUW)
  housing.glb             -- Brabantse Boerderij (NIEUW)
  siege_workshop.glb      -- Tractorschuur (NIEUW)

public/assets/models/v02/randstad/
  siege.glb               -- Vastgoedmakelaar (NIEUW)
  support.glb             -- HR-Medewerker (NIEUW)
  special_hipster.glb     -- Hipster (NIEUW)
  special_influencer.glb  -- Influencer (NIEUW)
  defense_tower.glb       -- Corporate Security Tower (NIEUW)
  housing.glb             -- Flatgebouw (NIEUW)
  siege_workshop.glb      -- Bouwplaats (NIEUW)

public/assets/models/v02/limburgers/
  siege.glb               -- Kolenbrander (NIEUW)
  support.glb             -- Sjpion (NIEUW)
  special_heuvelwacht.glb -- Heuvelwacht (NIEUW)
  special_mijnrat.glb     -- Mijnrat (NIEUW)
  defense_tower.glb       -- Wachttoren (NIEUW)
  housing.glb             -- Huuske (NIEUW)
  siege_workshop.glb      -- Mijnwerkerskamp (NIEUW)

public/assets/models/v02/belgen/
  siege.glb               -- Manneken Pis-kanon (NIEUW)
  support.glb             -- Wafelzuster (NIEUW)
  special_dubbele_spion.glb -- Dubbele Spion (NIEUW)
  defense_tower.glb       -- Commissiegebouw (NIEUW)
  housing.glb             -- Brusselse Woning (NIEUW)
  siege_workshop.glb      -- Surrealistisch Atelier (NIEUW)
```

**Totaal: 26 nieuwe GLB bestanden**

---

*Plan opgesteld op basis van PRD-v1.0.md, UNIT-MODEL-MATRIX.md, MESHY-GENERATION-PLAN.md, SUB-PRD-LIMBURGERS.md, SUB-PRD-BELGEN.md, en inventarisatie van bestaande modellen in public/assets/models/.*
