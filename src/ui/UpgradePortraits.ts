/**
 * UpgradePortraits.ts
 *
 * Maps UpgradeId → portrait-image filename. Asset Generator produces these
 * under `/public/assets/portraits/upgrades/<key>.png`. If the file is missing,
 * the HUD falls back to the generic 'UPG' SVG icon.
 *
 * Filename convention is shared with the asset-generator pipeline so renaming
 * happens in one place.
 */

import { UpgradeId } from '../types/index';

const UPGRADE_IMAGE_KEYS: Record<UpgradeId, string> = {
  [UpgradeId.MeleeAttack1]:           'melee-attack-1',
  [UpgradeId.MeleeAttack2]:           'melee-attack-2',
  [UpgradeId.RangedAttack1]:          'ranged-attack-1',
  [UpgradeId.RangedAttack2]:          'ranged-attack-2',
  [UpgradeId.ArmorUpgrade1]:          'armor-upgrade-1',
  [UpgradeId.ArmorUpgrade2]:          'armor-upgrade-2',
  [UpgradeId.MoveSpeed1]:             'move-speed-1',
  [UpgradeId.WoodCarry1]:             'wood-carry-1',
  [UpgradeId.WoodCarry2]:             'wood-carry-2',
  [UpgradeId.WoodGather]:             'wood-gather',
  [UpgradeId.MeleeAttack3]:           'melee-attack-3',
  [UpgradeId.RangedAttack3]:          'ranged-attack-3',
  [UpgradeId.ArmorUpgrade3]:          'armor-upgrade-3',
  [UpgradeId.MoveSpeed2]:             'move-speed-2',
  [UpgradeId.Carnavalsvuur]:          'carnavalsvuur',
  [UpgradeId.AIOptimization]:         'ai-optimization',
  [UpgradeId.Mergelharnas]:           'mergelharnas',
  [UpgradeId.DiamantgloeiendeWapens]: 'diamantgloeiende-wapens',
  // Faction stub-IDs without portrait yet — fall back to SVG
  [UpgradeId.GezelligheidsBoost]:     'gezelligheids-boost',
  [UpgradeId.Carnavalsrage]:          'carnavalsrage',
  [UpgradeId.BrabantseVlijt]:         'brabantse-vlijt',
  [UpgradeId.SamenSterk]:             'samen-sterk',
  [UpgradeId.EfficiencyConsultant]:   'efficiency-consultant',
  [UpgradeId.Agile]:                  'agile',
  [UpgradeId.PowerPointMastery]:      'powerpoint-mastery',
  [UpgradeId.VergaderingProtocol]:    'vergadering-protocol',
  [UpgradeId.DiepeSchacht]:           'diepe-schacht',
  [UpgradeId.MergelPantsering]:       'mergel-pantsering',
  [UpgradeId.VlaaiMotivatie]:         'vlaai-motivatie',
  [UpgradeId.Mijnbouwexplosief]:      'mijnbouwexplosief',
  [UpgradeId.PralineProductie]:       'praline-productie',
  [UpgradeId.BelgischeVerzetskracht]: 'belgische-verzetskracht',
  [UpgradeId.TrappistBrouwerij]:      'trappist-brouwerij',
  [UpgradeId.FritenvetFundering]:     'fritenvet-fundering',
};

export function getUpgradeImagePath(id: UpgradeId): string | null {
  const key = UPGRADE_IMAGE_KEYS[id];
  if (!key) return null;
  return `/assets/portraits/upgrades/${key}.png`;
}
