# Unit-Model Matrix -- Reign of Brabant

**Version**: 1.0.0
**Date**: 2026-04-07
**Purpose**: Maps every unit type across all 4 factions to its 3D model requirements, including existing asset status, visual category, sharing strategy, and Meshy generation prompts.

---

## Table of Contents

1. [Model Version Overview](#model-version-overview)
2. [Brabanders](#brabanders)
3. [Randstad](#randstad)
4. [Limburgers](#limburgers)
5. [Belgen](#belgen)
6. [Summary](#summary)
7. [Sharing Strategy](#sharing-strategy)
8. [Priority Order](#priority-order)
9. [Meshy Prompt Guide](#meshy-prompt-guide)

---

## Model Version Overview

Current model pipeline has three tiers:

| Version | Content | Status |
|---------|---------|--------|
| **v01** | Initial Meshy models (Brabanders + Randstad only) | Fallback only |
| **v02** | Meshy v6 production models (all 4 factions: worker, infantry, ranged) | Active -- static |
| **v03** | Skeletal animated models (all 4 factions: worker, infantry, ranged) | Active -- animated |

**Existing models per faction** (v02/v03): `worker.glb`, `infantry.glb`, `ranged.glb`
**Missing**: Heavy, Siege, Support, Special, Hero, and all faction-unique units.

### Path Convention

```
public/assets/models/v02/<faction>/<unit-type>.glb   -- static model
public/assets/models/v03/<faction>/<unit-type>.glb   -- animated model (rigged)
```

---

## Brabanders

**Faction Aesthetic**: Medieval Dutch carnival. Warm orange/amber palette. Rustic farming tools, carnival costumes, festive decorations. Wooden carts, beer barrels, worstenbroodjes.

| Unit Name | ExtendedId | Role | Tier | Visual Category | Model Source | Shares With | Notes |
|-----------|-----------|------|------|-----------------|--------------|-------------|-------|
| Boer | 0 | Worker | T1 | Worker | EXISTING | -- | v02+v03 exist. Farmer with pitchfork/basket. |
| Carnavalvierder | 1 | Infantry (melee) | T1 | Light Melee | EXISTING | -- | v02+v03 exist as `infantry.glb`. Carnival reveler with improvised weapon. |
| Sluiper | 2 | Ranged (stealth) | T1 | Ranged | EXISTING | -- | v02+v03 exist as `ranged.glb`. Hooded figure with crossbow/sling. |
| Boerinne | 3 | Support / Healer | T1 | Support/Healer | NEW | -- | Female farmer with herb basket, apron, healing staff. Distinct robed silhouette vs fighters. |
| Muzikant | 4 | Buffer / Debuffer | T2 | Special | NEW | -- | Carnival musician with large instrument (tuba/accordion). Very distinct round silhouette from instrument. |
| Tractorrijder | 5 | Heavy / Cavalry | T2 | Heavy/Cavalry | NEW | -- | Farmer riding a small tractor. Wide silhouette, bulky. Clearly larger than infantry. |
| Frituurmeester | 6 | Siege | T3 | Siege | UNIQUE | -- | Operator behind a mobile deep-fryer cannon. Machine-based silhouette required. |
| Praalwagen | 7 | Super Siege | T3 | Siege | UNIQUE | -- | Carnival parade float with mounted weapon. VERY large, most distinctive unit. Must read as a vehicle. |
| Prins van Brabant | 8 | Hero: Tank/Buffer | Hero | Hero | UNIQUE | -- | Noble prince in ornate orange/gold carnival regalia, crown, scepter. 1.5x unit scale. |
| Boer van Brabant | 9 | Hero: Tank/Summoner | Hero | Hero | UNIQUE | -- | Burly master farmer, oversized pitchfork, leather apron, straw hat. 1.5x unit scale. |

### Brabanders Model Count
- **Existing (v02+v03)**: 3 (worker, infantry, ranged)
- **New models needed**: 3 (Boerinne, Muzikant, Tractorrijder)
- **Unique models needed**: 4 (Frituurmeester, Praalwagen, Prins van Brabant, Boer van Brabant)
- **Total models for full roster**: 10

---

## Randstad

**Faction Aesthetic**: Modern corporate/tech. Blue suit palette. Office equipment repurposed as weapons (laptop shields, stapler crossbows, PowerPoint projectors). Glass/steel architecture vibe.

| Unit Name | ExtendedId | Role | Tier | Visual Category | Model Source | Shares With | Notes |
|-----------|-----------|------|------|-----------------|--------------|-------------|-------|
| Stagiair | 10 | Worker | T1 | Worker | EXISTING | -- | v02+v03 exist. Young intern with coffee cups and clipboard. |
| Manager | 11 | Ranged / Debuff | T1 | Ranged | EXISTING | -- | v02+v03 exist as `infantry.glb`. Suit-wearing manager, despite being ranged in stats. Model may need UPGRADE for ranged weapon visibility. |
| Consultant | 12 | Debuff specialist | T1 | Ranged | EXISTING | -- | v02+v03 exist as `ranged.glb`. Business casual figure with laptop/tablet. |
| Hipster | 13 | Scout | T2 | Special | NEW | -- | Skinny jeans, man-bun, fixie bike or e-scooter for speed. Distinct tall-thin silhouette. |
| HR-Medewerker | 14 | Support / Healer | T2 | Support/Healer | NEW | -- | Office worker with clipboard, motivational poster. Distinct from combat units via softer posture. |
| Corporate Advocaat | 15 | Heavy melee | T2 | Heavy/Cavalry | NEW | -- | Massive figure in power suit, briefcase as shield, gavel as weapon. Wide-shouldered, imposing. |
| Influencer | 16 | Ranged / AoE | T2 | Ranged | NEW | -- | Trendy figure with ring light and phone on selfie stick (used as ranged weapon). |
| Vastgoedmakelaar | 17 | Siege | T3 | Siege | UNIQUE | -- | Real estate agent with a mobile "SOLD" sign battering ram or property demolition crane model. Machine silhouette. |
| De CEO | 18 | Hero: Commander/Buffer | Hero | Hero | UNIQUE | -- | Power suit with golden cufflinks, oversized tie, throne-like office chair mount. 1.5x scale. |
| De Politicus | 19 | Hero: Caster/Manipulator | Hero | Hero | UNIQUE | -- | Politician at a mobile podium, microphone as staff, Dutch flag pin. 1.5x scale. Ranged hero. |

### Randstad Model Count
- **Existing (v02+v03)**: 3 (worker, infantry, ranged)
- **New models needed**: 4 (Hipster, HR-Medewerker, Corporate Advocaat, Influencer)
- **Unique models needed**: 3 (Vastgoedmakelaar, De CEO, De Politicus)
- **Total models for full roster**: 10

---

## Limburgers

**Faction Aesthetic**: Mining/medieval fortress. Dark green and grey/silver palette. Heavy stone armor (mergel), mining equipment, tunnels. Sturdy, stocky proportions. South-Limburg hills and caves.

| Unit Name | ExtendedId | Role | Tier | Visual Category | Model Source | Shares With | Notes |
|-----------|-----------|------|------|-----------------|--------------|-------------|-------|
| Mijnwerker | 20 | Worker | T1 | Worker | EXISTING | -- | v02+v03 exist. Miner with pickaxe, headlamp, coal-dusted clothes. |
| Schutterij | 21 | Infantry (ranged) | T1 | Ranged | EXISTING | -- | v02+v03 exist as `infantry.glb`. Traditional shooting guild member with musket/crossbow. Despite being mapped to Infantry slot in code, visually ranged. |
| Vlaaienwerper | 22 | Ranged / Specialist | T1 | Ranged | EXISTING | -- | v02+v03 exist as `ranged.glb`. Vlaai (pie) thrower with bandolier of pies. Comedic but distinct. |
| Mergelridder | 23 | Heavy / Cavalry | T2 | Heavy/Cavalry | NEW | -- | Heavily armored knight in grey mergel-stone armor. Massive shield, war hammer. Widest silhouette in faction. |
| Kolenbrander | 24 | Siege | T3 | Siege | UNIQUE | -- | Operates a coal-burning siege engine (flaming cart/furnace on wheels). Machine-based, smoke trail. |
| Sjpion | 25 | Support / Healer | T1 | Support/Healer | NEW | -- | Limburg dialect for "spy/healer". Hooded figure with herbs/poultices, mining lantern. Robed silhouette. |
| Mijnrat | 26 | Stealth / Sabotage | T3 | Special | NEW | -- | Small, hunched saboteur with dynamite/explosives. Rat-like crouched posture, very low profile. |
| Heuvelwacht | 27 | Scout | T1 | Special | NEW | -- | Hill watchman with spyglass, light leather armor, signal horn. Tall-thin silhouette, elevated posture. |
| De Mijnbaas | 28 | Hero: Tank/Controller | Hero | Hero | UNIQUE | -- | Mine foreman in heavy reinforced mergel armor, oversized mining hammer, headlamp crown. 1.5x scale. |
| De Maasridder | 29 | Hero: Caster/Disruptor | Hero | Hero | UNIQUE | -- | River knight with flowing cape, water-themed staff, mergel-plated robe. 1.5x scale. Caster stance. |

### Limburgers Model Count
- **Existing (v02+v03)**: 3 (worker, infantry, ranged)
- **New models needed**: 4 (Mergelridder, Sjpion, Mijnrat, Heuvelwacht)
- **Unique models needed**: 3 (Kolenbrander, De Mijnbaas, De Maasridder)
- **Total models for full roster**: 10

---

## Belgen

**Faction Aesthetic**: Beer, chocolate, waffles, frieten. Burgundy/gold palette. Diplomatic and festive. French-Flemish cultural blend. Slightly surreal (Magritte influence). Monastery/abbey architecture.

| Unit Name | ExtendedId | Role | Tier | Visual Category | Model Source | Shares With | Notes |
|-----------|-----------|------|------|-----------------|--------------|-------------|-------|
| Frietkraamhouder | 30 | Worker | T1 | Worker | EXISTING | -- | v02+v03 exist. Frites vendor with apron, basket of fries, serving cone. |
| Bierbouwer | 31 | Infantry (melee) | T1 | Light Melee | EXISTING | -- | v02+v03 exist as `infantry.glb`. Beer brewer wielding a barrel tap as weapon, leather apron. |
| Chocolatier | 32 | Ranged | T1 | Ranged | EXISTING | -- | v02+v03 exist as `ranged.glb`. Chocolate maker throwing pralines, white chef coat. |
| Frituurridder | 33 | Heavy / Cavalry | T2 | Heavy/Cavalry | NEW | -- | Knight with frying-pan shield and spatula lance. Burgundy heavy armor with waffle-pattern embossing. |
| Manneken Pis-kanon | 34 | Siege | T2 | Siege | UNIQUE | -- | Siege cannon shaped like a large Manneken Pis statue. Unmistakable silhouette -- a peeing statue on wheels. |
| Wafelzuster | 35 | Support / Healer | T1 | Support/Healer | NEW | -- | Nun-like figure in abbey robes serving healing waffles. Carries a waffle iron as staff. Robed silhouette. |
| Dubbele Spion | 36 | Stealth / Sabotage | T2 | Special | NEW | -- | Dual-identity spy: half-French half-Flemish outfit split down the middle. Trenchcoat, fedora. Low crouched posture. |
| De Frietkoning | 37 | Hero: Tank/Support | Hero | Hero | UNIQUE | -- | King of fries in golden-brown armor, crown made of fries, giant frituurschep (fry scoop) as weapon. 1.5x scale. |
| De Abdijbrouwer | 38 | Hero: Monk/Caster | Hero | Hero | UNIQUE | -- | Trappist monk in dark robes with glowing beer chalice as casting focus, barrel backpack. 1.5x scale. |

### Belgen Model Count
- **Existing (v02+v03)**: 3 (worker, infantry, ranged)
- **New models needed**: 3 (Frituurridder, Wafelzuster, Dubbele Spion)
- **Unique models needed**: 3 (Manneken Pis-kanon, De Frietkoning, De Abdijbrouwer)
- **Total models for full roster**: 9

---

## Summary

### Total Model Count

| Category | Brabanders | Randstad | Limburgers | Belgen | Total |
|----------|-----------|----------|------------|--------|-------|
| Existing (v02+v03) | 3 | 3 | 3 | 3 | **12** |
| New (shareable base) | 3 | 4 | 4 | 3 | **14** |
| Unique (dedicated) | 4 | 3 | 3 | 3 | **13** |
| **Faction Total** | **10** | **10** | **10** | **9** | **39** |

### Models Needed: 27 new models total (14 shareable + 13 unique)

### Existing Model Quality Notes

| Faction | v02 Quality | v03 Quality | Upgrade Needed? |
|---------|------------|------------|-----------------|
| Brabanders | Good (Meshy v6) | Good (rigged) | No -- generate new units at same quality level |
| Randstad | Good (Meshy v6) | Good (rigged) | No -- generate new units at same quality level |
| Limburgers | Excellent (latest batch) | Good (rigged) | No -- reference quality for new models |
| Belgen | Excellent (latest batch) | Good (rigged) | No -- reference quality for new models |

---

## Sharing Strategy

### Within-Faction Sharing

Units in the same visual category within a faction can share a **base mesh** with material/color variations, but should have distinct weapon attachments or accessories to maintain silhouette readability.

| Visual Category | Can Share Base? | Distinguishing Feature |
|-----------------|----------------|----------------------|
| Worker | No sharing needed | Only 1 worker per faction |
| Light Melee | Possible with Infantry | Different weapon attachment |
| Ranged | Possible among ranged variants | Different projectile/weapon prop |
| Support/Healer | Must be distinct from combat | Robed/staff silhouette, no weapon |
| Heavy/Cavalry | Must be distinct from infantry | 1.3x scale, wider proportions, heavy armor |
| Siege | NEVER share | Each siege unit is a machine/vehicle, unique by definition |
| Hero | NEVER share | Each hero is unique, 1.5x scale, ornate |
| Special | NEVER share cross-category | Each special unit has a unique role and silhouette |

### Cross-Faction Sharing

**NEVER share models across factions.** Each faction must be instantly identifiable by silhouette and color at RTS zoom level. The entire point of 4 factions is visual and strategic diversity.

### Silhouette Hierarchy (smallest to largest)

For each faction, the size hierarchy should be:

```
Scout/Spy < Worker < Ranged < Support < Light Melee < Special < Heavy/Cavalry < Siege < Hero
(0.7x)      (0.9x)   (1.0x)   (1.0x)    (1.0x)       (1.1x)   (1.3x)          (1.5x)  (1.5x)
```

This ensures players can identify unit types at a glance during gameplay.

---

## Priority Order

Models should be generated in this order, based on gameplay impact and visibility:

### Priority 1 -- Heroes (immediate impact, always on screen)
These are the most visible units in any match. Players bond with heroes. Must be highest quality.

1. **Prins van Brabant** -- Brabanders hero, already has archetype data
2. **Boer van Brabant** -- Brabanders hero, already has archetype data
3. **De CEO** -- Randstad hero, already has archetype data
4. **De Politicus** -- Randstad hero, already has archetype data
5. **De Mijnbaas** -- Limburgers hero, needs archetype data first
6. **De Maasridder** -- Limburgers hero, needs archetype data first
7. **De Frietkoning** -- Belgen hero, needs archetype data first
8. **De Abdijbrouwer** -- Belgen hero, needs archetype data first

### Priority 2 -- Heavy/Cavalry (mid-game power units, high visual impact)
These define the mid-game power spike and are large enough to be visually striking.

9. **Tractorrijder** (Brabanders)
10. **Corporate Advocaat** (Randstad)
11. **Mergelridder** (Limburgers)
12. **Frituurridder** (Belgen)

### Priority 3 -- Siege (late-game, very distinctive silhouettes)
These define the end-game push and must look like machines/vehicles.

13. **Frituurmeester** (Brabanders)
14. **Praalwagen** (Brabanders)
15. **Vastgoedmakelaar** (Randstad)
16. **Kolenbrander** (Limburgers)
17. **Manneken Pis-kanon** (Belgen)

### Priority 4 -- Support/Healer (every army needs one)
Distinct from combat units. Must be clearly identifiable as non-combat.

18. **Boerinne** (Brabanders)
19. **HR-Medewerker** (Randstad)
20. **Sjpion** (Limburgers)
21. **Wafelzuster** (Belgen)

### Priority 5 -- Special/Unique units (flavor, lower urgency)
These add faction personality but aren't essential for core gameplay.

22. **Muzikant** (Brabanders)
23. **Hipster** (Randstad)
24. **Influencer** (Randstad)
25. **Heuvelwacht** (Limburgers)
26. **Mijnrat** (Limburgers)
27. **Dubbele Spion** (Belgen)

---

## Meshy Prompt Guide

All prompts target **Meshy v6 production mode** with `realistic` art style. Each prompt should produce a single character or machine suitable for an isometric/top-down RTS game at ~50px on screen.

### General Prompt Rules
- Always include: "low-poly stylized game character" or "low-poly stylized game vehicle"
- Always include the faction color: orange/amber (Brabanders), blue/grey (Randstad), dark green/grey (Limburgers), burgundy/gold (Belgen)
- Always include: "standing pose, clear silhouette, white background"
- For heroes: add "ornate, larger scale, heroic pose"
- For siege: add "wheeled machine, mechanical, game prop"
- Max 300 characters per prompt

---

### Brabanders Prompts

#### Boerinne (Support/Healer)
```
Low-poly stylized female Dutch farmer, medieval dress with white apron, herb basket on hip, wooden healing staff with ribbon, warm orange and cream colors, standing pose, clear silhouette, white background, game character
```

#### Muzikant (Buffer/Debuffer)
```
Low-poly stylized medieval Dutch carnival musician, large brass tuba instrument, orange festive costume with feathered hat, round silhouette from instrument, standing pose, clear silhouette, white background, game character
```

#### Tractorrijder (Heavy/Cavalry)
```
Low-poly stylized Dutch farmer riding small vintage orange tractor, overalls, straw hat, mounted charge pose, wide silhouette, clear silhouette, white background, game character vehicle hybrid
```

#### Frituurmeester (Siege)
```
Low-poly stylized mobile deep fryer cannon on wooden cart with wheels, orange and brown colors, brass fittings, steam vents, medieval Dutch food vendor siege weapon, clear silhouette, white background, game prop
```

#### Praalwagen (Super Siege)
```
Low-poly stylized large carnival parade float with mounted catapult, orange and gold decorations, festive banners, wooden wheels, very large vehicle, medieval Dutch carnival, clear silhouette, white background, game prop
```

#### Prins van Brabant (Hero)
```
Low-poly stylized heroic medieval Dutch prince, ornate orange and gold carnival regalia, golden crown, royal scepter, flowing cape, larger scale heroic pose, regal bearing, clear silhouette, white background, game character
```

#### Boer van Brabant (Hero)
```
Low-poly stylized heroic burly Dutch master farmer, oversized wooden pitchfork, thick leather apron, wide straw hat, muscular build, orange and brown colors, larger scale heroic pose, clear silhouette, white background, game character
```

---

### Randstad Prompts

#### Hipster (Scout)
```
Low-poly stylized modern Dutch hipster on electric scooter, man-bun hairstyle, skinny jeans, blue denim jacket, takeaway coffee cup, fast agile pose, thin silhouette, white background, game character
```

#### HR-Medewerker (Support/Healer)
```
Low-poly stylized modern Dutch office HR worker, blue business casual, clipboard with motivational stickers, glasses, friendly supportive pose, blue and white colors, standing pose, clear silhouette, white background, game character
```

#### Corporate Advocaat (Heavy)
```
Low-poly stylized imposing Dutch corporate lawyer, dark blue power suit, oversized briefcase as shield, wooden gavel weapon, wide shoulders, bulky build, stern expression, clear silhouette, white background, game character
```

#### Influencer (Ranged/AoE)
```
Low-poly stylized modern Dutch social media influencer, ring light on stick as weapon, smartphone, trendy blue outfit, expressive pose, clear silhouette, white background, game character
```

#### Vastgoedmakelaar (Siege)
```
Low-poly stylized mobile real estate demolition crane, blue corporate colors, "TE KOOP" sign on side, wheeled construction vehicle, mechanical arms, clear silhouette, white background, game prop vehicle
```

#### De CEO (Hero)
```
Low-poly stylized heroic corporate CEO, luxurious dark blue power suit with golden cufflinks, oversized red tie, mobile office throne chair, commanding pose, larger scale, clear silhouette, white background, game character
```

#### De Politicus (Hero)
```
Low-poly stylized heroic Dutch politician, mobile podium with microphone staff, blue suit with Dutch flag pin, persuasive casting pose, papers flying around, larger scale, clear silhouette, white background, game character
```

---

### Limburgers Prompts

#### Mergelridder (Heavy/Cavalry)
```
Low-poly stylized medieval knight in grey mergel stone armor, massive stone shield, heavy war hammer, dark green cape, very heavy bulky build, stocky proportions, clear silhouette, white background, game character
```

#### Sjpion (Support/Healer)
```
Low-poly stylized medieval Limburg herb healer, hooded dark green robe, leather poultice bag, mining lantern staff, mysterious healer pose, clear silhouette, white background, game character
```

#### Mijnrat (Stealth/Sabotage)
```
Low-poly stylized small hunched medieval mine saboteur, dark clothing, dynamite bundle, crouched sneaking pose, rat-like posture, very small profile, dark green and brown colors, clear silhouette, white background, game character
```

#### Heuvelwacht (Scout)
```
Low-poly stylized medieval Limburg hill watchman, leather armor, brass spyglass, signal horn on belt, elevated alert pose, tall thin build, dark green and grey colors, clear silhouette, white background, game character
```

#### Kolenbrander (Siege)
```
Low-poly stylized coal-burning siege furnace on iron wheels, chimney with smoke, dark grey and green colors, medieval mining industrial style, flaming coal catapult, clear silhouette, white background, game prop vehicle
```

#### De Mijnbaas (Hero)
```
Low-poly stylized heroic medieval mine foreman, heavy reinforced mergel stone armor plates, oversized mining hammer, glowing headlamp crown, commanding pose, dark green and grey, larger scale, clear silhouette, white background, game character
```

#### De Maasridder (Hero)
```
Low-poly stylized heroic medieval river knight, flowing dark green cape, water-themed crystal staff, mergel-plated ornate robe, mystical caster stance, larger scale, clear silhouette, white background, game character
```

---

### Belgen Prompts

#### Frituurridder (Heavy/Cavalry)
```
Low-poly stylized medieval Belgian knight, burgundy heavy armor with waffle-pattern embossing, large frying pan shield, spatula lance, gold trim, bulky build, clear silhouette, white background, game character
```

#### Wafelzuster (Support/Healer)
```
Low-poly stylized Belgian abbey nun, dark burgundy robes, waffle iron staff, serving tray with healing waffles, gentle healer pose, monastery aesthetic, clear silhouette, white background, game character
```

#### Dubbele Spion (Stealth/Sabotage)
```
Low-poly stylized Belgian double agent spy, split outfit half-French half-Flemish, long trenchcoat, fedora hat, crouched sneaking pose, small profile, burgundy and gold colors, clear silhouette, white background, game character
```

#### Manneken Pis-kanon (Siege)
```
Low-poly stylized large Manneken Pis bronze statue mounted on wheeled siege cart, water cannon, burgundy and gold decorations, humorous siege weapon, unmistakable silhouette, white background, game prop vehicle
```

#### De Frietkoning (Hero)
```
Low-poly stylized heroic Belgian king of fries, golden-brown armor suit, crown made of golden fries, giant fry scoop scepter weapon, royal burgundy cape, larger scale heroic pose, clear silhouette, white background, game character
```

#### De Abdijbrouwer (Hero)
```
Low-poly stylized heroic Belgian Trappist monk, dark monastery robes, glowing golden beer chalice casting focus, wooden barrel backpack, mystical brewing pose, larger scale, clear silhouette, white background, game character
```

---

## UnitRenderer Integration Notes

### Current State
The `UnitRenderer.ts` (line 17) only recognizes three `UnitTypeName` values: `worker`, `infantry`, `ranged`. The `UNIT_MODEL_PATHS` map (lines 29-44) only maps these 3 types x 4 factions = 12 entries.

### Required Changes for Full Roster

1. **Extend `UnitTypeName`** to include all visual categories:
   ```typescript
   type UnitTypeName = 'worker' | 'infantry' | 'ranged' | 'heavy' | 'siege' | 'support' | 'special' | 'hero';
   ```

2. **Extend `UNIT_MODEL_PATHS`** with new entries:
   ```typescript
   // Brabanders new
   heavy_0:   'assets/models/v02/brabanders/heavy.glb',
   siege_0:   'assets/models/v02/brabanders/siege.glb',
   siege2_0:  'assets/models/v02/brabanders/siege2.glb',     // Praalwagen
   support_0: 'assets/models/v02/brabanders/support.glb',
   special_0: 'assets/models/v02/brabanders/special.glb',    // Muzikant
   hero_0_0:  'assets/models/v02/brabanders/hero_prins.glb',
   hero_0_1:  'assets/models/v02/brabanders/hero_boer.glb',
   // ... repeat pattern for all factions
   ```

3. **Map `ExtendedUnitTypeId` to model paths** in a new lookup function that resolves the correct visual category from the extended type ID rather than just the base `UnitTypeId`.

4. **Hero rendering**: Heroes need 1.5x scale applied in the renderer. They should also get a permanent golden selection ring or name plate for visibility.

### Animation Requirements

| Visual Category | Required Animations | Rigging Notes |
|-----------------|-------------------|---------------|
| Worker | Idle, Walk, Gather, Return, Attack, Die | Standard humanoid rig |
| Light Melee | Idle, Walk, Attack, Die | Standard humanoid rig |
| Ranged | Idle, Walk, Attack (ranged), Die | Standard humanoid rig + projectile spawn point |
| Support/Healer | Idle, Walk, Cast (heal), Die | Standard humanoid rig + staff/casting bone |
| Heavy/Cavalry | Idle, Walk, Attack, Die | Extended rig (mount + rider or heavy proportions) |
| Siege | Idle, Move, Fire, Die (destruction) | Mechanical rig (wheels, arm, turret) |
| Hero | Idle, Walk, Attack, Cast (Q/W/E), Die | Full humanoid rig + ability VFX attachment points |
| Special | Idle, Walk, Special Action, Die | Varies per unit |

---

## Appendix: ExtendedUnitTypeId to Visual Category Mapping

Quick-reference for code implementation:

```typescript
const EXTENDED_UNIT_VISUAL_CATEGORY: Record<ExtendedUnitTypeId, string> = {
  // Brabanders
  [ExtendedUnitTypeId.Boer]:              'worker',
  [ExtendedUnitTypeId.Carnavalvierder]:   'infantry',
  [ExtendedUnitTypeId.Sluiper]:           'ranged',
  [ExtendedUnitTypeId.Boerinne]:          'support',
  [ExtendedUnitTypeId.Muzikant]:          'special',
  [ExtendedUnitTypeId.Tractorrijder]:     'heavy',
  [ExtendedUnitTypeId.Frituurmeester]:    'siege',
  [ExtendedUnitTypeId.Praalwagen]:        'siege',
  [ExtendedUnitTypeId.PrinsVanBrabant]:   'hero',
  [ExtendedUnitTypeId.BoerVanBrabant]:    'hero',

  // Randstad
  [ExtendedUnitTypeId.Stagiair]:          'worker',
  [ExtendedUnitTypeId.Manager]:           'infantry',
  [ExtendedUnitTypeId.Consultant]:        'ranged',
  [ExtendedUnitTypeId.Hipster]:           'special',
  [ExtendedUnitTypeId.HRMedewerker]:      'support',
  [ExtendedUnitTypeId.CorporateAdvocaat]: 'heavy',
  [ExtendedUnitTypeId.Influencer]:        'ranged',
  [ExtendedUnitTypeId.Vastgoedmakelaar]:  'siege',
  [ExtendedUnitTypeId.DeCEO]:            'hero',
  [ExtendedUnitTypeId.DePoliticus]:       'hero',

  // Limburgers
  [ExtendedUnitTypeId.Mijnwerker]:        'worker',
  [ExtendedUnitTypeId.Schutterij]:        'ranged',
  [ExtendedUnitTypeId.Vlaaienwerper]:     'ranged',
  [ExtendedUnitTypeId.Mergelridder]:      'heavy',
  [ExtendedUnitTypeId.Kolenbrander]:      'siege',
  [ExtendedUnitTypeId.Sjpion]:            'support',
  [ExtendedUnitTypeId.Mijnrat]:           'special',
  [ExtendedUnitTypeId.Heuvelwacht]:       'special',
  [ExtendedUnitTypeId.DeMijnbaas]:        'hero',
  [ExtendedUnitTypeId.DeMaasridder]:      'hero',

  // Belgen
  [ExtendedUnitTypeId.Frietkraamhouder]:  'worker',
  [ExtendedUnitTypeId.Bierbouwer]:        'infantry',
  [ExtendedUnitTypeId.Chocolatier]:       'ranged',
  [ExtendedUnitTypeId.Frituurridder]:     'heavy',
  [ExtendedUnitTypeId.MannekenPisKanon]:  'siege',
  [ExtendedUnitTypeId.Wafelzuster]:       'support',
  [ExtendedUnitTypeId.DubbeleSpion]:      'special',
  [ExtendedUnitTypeId.DeFrietkoning]:     'hero',
  [ExtendedUnitTypeId.DeAbdijbrouwer]:    'hero',
};
```

---

## Appendix: Model File Naming Convention

```
public/assets/models/v02/<faction>/<category>.glb          -- base units
public/assets/models/v02/<faction>/siege2.glb               -- second siege variant (Praalwagen)
public/assets/models/v02/<faction>/hero_<name>.glb          -- hero units
public/assets/models/v02/<faction>/special_<name>.glb       -- special units (if multiple)
```

Example complete file tree for Brabanders:
```
public/assets/models/v02/brabanders/
  worker.glb            -- Boer (EXISTING)
  infantry.glb          -- Carnavalvierder (EXISTING)
  ranged.glb            -- Sluiper (EXISTING)
  support.glb           -- Boerinne (NEW)
  special_muzikant.glb  -- Muzikant (NEW)
  heavy.glb             -- Tractorrijder (NEW)
  siege.glb             -- Frituurmeester (UNIQUE)
  siege_praalwagen.glb  -- Praalwagen (UNIQUE)
  hero_prins.glb        -- Prins van Brabant (UNIQUE)
  hero_boer.glb         -- Boer van Brabant (UNIQUE)
```
