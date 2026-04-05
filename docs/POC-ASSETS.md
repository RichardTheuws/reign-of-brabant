# Reign of Brabant -- PoC 3D Asset Specification

**Versie**: 1.0.0
**Datum**: 2026-04-05
**Status**: Ready for generation
**Pipeline**: Blender 5.1 procedural -> GLB export -> Three.js
**Script**: `scripts/blender/generate_poc_assets.py`

---

## Overview

Dit document specificeert EXACT welke 3D placeholder assets nodig zijn voor het Proof of Concept van Reign of Brabant. Alle assets worden procedureel gegenereerd in Blender 5.1, geexporteerd als GLB, en direct geladen in Three.js.

### Design Philosophy

- **Low-poly stylized**: Geen realisme, duidelijke silhouetten op RTS-afstand
- **Color-coded factions**: Oranje (Brabanders/speler), Blauw (AI-tegenstander)
- **Materiaal-only**: Principled BSDF met kleuren, geen textures voor PoC
- **Consistent scale**: 1 Blender unit = 1 meter game-world
- **Origin at (0,0,0)**: Alle modellen hebben origin op de grond, centered

### Factie-kleuren

| Factie | Primair (RGBA) | Accent | Gebruik |
|--------|---------------|--------|---------|
| **Brabanders (Speler)** | `#E86C1A` (oranje) | `#FFB366` (licht oranje) | Kleding, schilden, gebouwen |
| **AI Tegenstander** | `#1A6CE8` (blauw) | `#66B3FF` (licht blauw) | Kleding, schilden, gebouwen |
| **Neutral** | `#888888` (grijs) | `#AAAAAA` | Resources, props |

---

## Asset Lijst

### 1. Units (per factie: oranje + blauw variant)

#### 1.1 Worker

| Eigenschap | Waarde |
|-----------|--------|
| **Bestand** | `worker_orange.glb`, `worker_blue.glb` |
| **Vertices** | 80-100 |
| **Hoogte** | 1.0m (volwassen humanoid op RTS-schaal) |
| **Beschrijving** | Simpele humanoid met hooivork. Rechthoekig lichaam, bol hoofd, cilinder-armen/benen. Hooivork als 3 tanden op een stok in de rechterhand. |
| **Materialen** | Huidkleur (gezicht/handen), factie-kleur (kleding), bruin (hooivork stok), grijs (hooivork tanden) |
| **Silhouet** | Herkenbaar door hooivork die boven het hoofd uitsteekt |

#### 1.2 Infantry

| Eigenschap | Waarde |
|-----------|--------|
| **Bestand** | `infantry_orange.glb`, `infantry_blue.glb` |
| **Vertices** | 100-130 |
| **Hoogte** | 1.1m (iets groter dan worker) |
| **Beschrijving** | Humanoid met zwaard in rechterhand en schild in linkerhand. Breder dan worker (shoulder pads). Helm op het hoofd (halve bol). |
| **Materialen** | Huidkleur (gezicht), factie-kleur (kleding + schild), donkergrijs (helm + zwaard), bruin (riem) |
| **Silhouet** | Herkenbaar door brede schouders, schild aan de zijkant, helm |

#### 1.3 Ranged (Boogschutter)

| Eigenschap | Waarde |
|-----------|--------|
| **Bestand** | `ranged_orange.glb`, `ranged_blue.glb` |
| **Vertices** | 90-120 |
| **Hoogte** | 1.0m |
| **Beschrijving** | Slanke humanoid met boog in linkerhand. Koker op de rug (cilinder). Boog is een gebogen cylinder met string (edge). Hood/kap op het hoofd (cone). |
| **Materialen** | Huidkleur (gezicht/handen), factie-kleur (kleding + kap), bruin (boog + koker), lichtgrijs (string) |
| **Silhouet** | Herkenbaar door boog aan de zijkant, kap, koker op de rug |

---

### 2. Gebouwen (per factie: oranje + blauw variant)

#### 2.1 Town Hall

| Eigenschap | Waarde |
|-----------|--------|
| **Bestand** | `townhall_orange.glb`, `townhall_blue.glb` |
| **Vertices** | 200-300 |
| **Afmetingen** | 4m x 4m x 3.5m (breed x diep x hoog) |
| **Beschrijving** | Grote boerderij-achtige structuur. Rechthoekige basis, schuin dak (piramide-achtig), schoorsteen aan de zijkant. Deur aan de voorkant (donkere rechthoek). Ramen (kleine lichtere rechthoeken). Brabants gevoel. |
| **Materialen** | Factie-kleur (muren/accenten), donkerbruin (dak/houten balken), cremebeige (muurvlakken), donkergrijs (schoorsteen), warm geel (raamopeningen) |
| **Silhouet** | Grootste gebouw, herkenbaar door schuin dak + schoorsteen |

#### 2.2 Barracks

| Eigenschap | Waarde |
|-----------|--------|
| **Bestand** | `barracks_orange.glb`, `barracks_blue.glb` |
| **Vertices** | 150-200 |
| **Afmetingen** | 3m x 2.5m x 2.5m |
| **Beschrijving** | Kleiner militair gebouw. Rechthoekige basis, platter dak dan Town Hall. Wapens aan de muur (zwaarden = platte rechthoeken). Open deuropening. Trainingsdummy naast het gebouw (kruis van cylinders). |
| **Materialen** | Factie-kleur (muren/accenten), donkerbruin (dak), beige (muurvlakken), grijs (wapens/dummy) |
| **Silhouet** | Herkenbaar door wapens aan de muur, training dummy |

---

### 3. Resources (neutraal, niet factie-gekleurd)

#### 3.1 Gold Mine

| Eigenschap | Waarde |
|-----------|--------|
| **Bestand** | `gold_mine.glb` |
| **Vertices** | 50-80 |
| **Afmetingen** | 2m x 2m x 1.5m |
| **Beschrijving** | Gouden rots/heuvel. Deformed icosphere als basis (rocky shape). Goudkleurige vlekken/facetten. Donkere ingang (halve cirkel aan een kant). Klein bordje of markering. |
| **Materialen** | Donkergrijs (rots basis), goud/geel metallic (goudaderen), donkerbruin (ingang) |
| **Silhouet** | Gloeiende gouden heuvel, duidelijk anders dan regulier terrein |

---

### 4. Props (neutraal)

#### 4.1 Trees (3 varianten)

| Eigenschap | Waarde |
|-----------|--------|
| **Bestanden** | `tree_variant_0.glb`, `tree_variant_1.glb`, `tree_variant_2.glb` |
| **Vertices** | 30-60 per variant |
| **Hoogte** | 2.0-3.0m (varieert per seed) |
| **Beschrijving** | Simpele boom: bruine cylinder stam + groene cone/icosphere kruin. Drie varianten via random seed: verschil in hoogte, kruin-vorm (cone vs sphere vs dubbele cone), stamdikte. |
| **Materialen** | Bruin (stam), groen (kruin) -- 3 tinten groen voor variatie |
| **Silhouet** | Klassieke boom-silhouet, resource-harvesting target |

#### 4.2 Rocks (3 varianten)

| Eigenschap | Waarde |
|-----------|--------|
| **Bestanden** | `rock_variant_0.glb`, `rock_variant_1.glb`, `rock_variant_2.glb` |
| **Vertices** | 12-20 per variant |
| **Hoogte** | 0.3-0.8m (varieert per seed) |
| **Beschrijving** | Gedeformeerde icosphere. Drie varianten via random seed: verschil in grootte, vervorming, vlakheid. |
| **Materialen** | Middengrijs met lichte kleurvariatie per variant |
| **Silhouet** | Decoratief terrein-element, niet interactief in PoC |

---

### 5. Gameplay Elements

#### 5.1 Selection Circle

| Eigenschap | Waarde |
|-----------|--------|
| **Bestand** | `selection_circle.glb` |
| **Vertices** | 64 (32-segment torus) |
| **Afmetingen** | Radius 0.6m, buis-radius 0.02m |
| **Beschrijving** | Platte ring/torus die op de grond wordt geplaatst onder geselecteerde units. Groen semi-transparant. Heel plat (bijna 2D). |
| **Materialen** | Groen (`#00FF00`), alpha 0.7 (semi-transparant), emissive voor glow-effect |
| **Gebruik** | Wordt via code onder geselecteerde unit/gebouw geplaatst, schaalt mee |

#### 5.2 Arrow (Projectiel)

| Eigenschap | Waarde |
|-----------|--------|
| **Bestand** | `arrow.glb` |
| **Vertices** | ~20 |
| **Lengte** | 0.5m |
| **Beschrijving** | Dunne cylinder (schacht) + cone (punt) + kleine vlakken (veren aan het uiteinde). Gealligneerd langs de Y-as (voorwaarts). |
| **Materialen** | Bruin (schacht), donkergrijs metallic (punt), wit (veren) |
| **Gebruik** | Gespawnd bij ranged attack, vliegt via code naar target |

---

## Gegenereerde Bestanden (verwacht)

```
assets/models/poc/
  units/
    worker_orange.glb
    worker_blue.glb
    infantry_orange.glb
    infantry_blue.glb
    ranged_orange.glb
    ranged_blue.glb
  buildings/
    townhall_orange.glb
    townhall_blue.glb
    barracks_orange.glb
    barracks_blue.glb
  resources/
    gold_mine.glb
  props/
    tree_variant_0.glb
    tree_variant_1.glb
    tree_variant_2.glb
    rock_variant_0.glb
    rock_variant_1.glb
    rock_variant_2.glb
  gameplay/
    selection_circle.glb
    arrow.glb
```

**Totaal: 19 GLB bestanden** (6 units + 4 gebouwen + 1 resource + 6 props + 2 gameplay)

---

## Generatie Commando

```bash
blender --background --python scripts/blender/generate_poc_assets.py -- --output ./assets/models/poc/
```

### Verwachte performance

Gebaseerd op eerdere benchmarks (gebouwen 57ms, bomen 13ms):
- Units (6x): ~300ms totaal
- Gebouwen (4x): ~250ms totaal
- Resources (1x): ~30ms
- Props (6x): ~80ms
- Gameplay (2x): ~20ms
- **Geschatte totaal: < 1 seconde** voor alle 18 assets

---

## Upgrade Pad (na PoC)

| Fase | Actie | Tool |
|------|-------|------|
| **PoC** (nu) | Procedurele placeholders | Blender Python |
| **Alpha** | Meshy v6 3D modellen voor units | fal.ai API |
| **Beta** | Hand-getweakte modellen + animaties | Blender + Mixamo |
| **Release** | Professionele assets + LOD system | Blender handmatig |
