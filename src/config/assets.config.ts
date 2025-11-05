/**
 * 에셋 경로 설정
 */

/**
 * CDN 기본 URL
 * - 빈 문자열: 로컬 에셋 사용 (앱인토스 환경)
 * - CDN URL: 외부 CDN 사용 (예: 'https://cdn.tailbound.xyz')
 */
export const CDN_BASE_URL = 'https://cdn.tailbound.xyz';

/**
 * 로컬 에셋 경로 (번들에 포함)
 * - 로딩 화면에 필요한 최소한의 에셋만 포함
 */
export const LOCAL_ASSETS = {
  // 로딩 화면
  loadingBackground: '/assets/gui/bg-main.png',
  loadingLogo: '/assets/gui/title.png',

  // SEO/메타
  favicon: '/favicon.png',
  ogImage: '/og-image.png',
  appleTouchIcon: '/favicon.png',
} as const;

/**
 * CDN 에셋 경로
 */
export const CDN_ASSETS = {
  // Player
  player: {
    shaman: `${CDN_BASE_URL}/assets/player/shaman.png`,
    shamanWalk: `${CDN_BASE_URL}/assets/player/shaman-walk.png`,
  },

  // NPC
  npc: {
    monk: `${CDN_BASE_URL}/assets/npc/monk.png`,
  },

  // Weapons
  weapon: {
    dokkabiFire: `${CDN_BASE_URL}/assets/weapon/dokkabi-fire.png`,
    mocktak: `${CDN_BASE_URL}/assets/weapon/mocktak.png`,
    talisman: `${CDN_BASE_URL}/assets/weapon/talisman.png`,
    jakdu: `${CDN_BASE_URL}/assets/weapon/jakdu.png`,
    wind: `${CDN_BASE_URL}/assets/weapon/wind.png`,
  },

  // Enemies
  enemy: {
    skeletonWalk: `${CDN_BASE_URL}/assets/enemy/skeleton-walk.png`,
    womanGhostProjectile: `${CDN_BASE_URL}/assets/enemy/woman-ghost-projectile.png`,
    evilSpirit: `${CDN_BASE_URL}/assets/enemy/evil-spirit.png`,
    evilSpiritAttack: `${CDN_BASE_URL}/assets/enemy/evil-spirit-attack.png`,
    dokkaebiGreenWalk: `${CDN_BASE_URL}/assets/enemy/dokkaebi-green-walk.png`,
    dokkaebiBlueWalk: `${CDN_BASE_URL}/assets/enemy/dokkaebi-blue-walk.png`,
    dokkaebiRedWalk: `${CDN_BASE_URL}/assets/enemy/dokkaebi-red-walk.png`,
    foxOrangeWalk: `${CDN_BASE_URL}/assets/enemy/fox-orange-walk.png`,
    foxWhiteWalk: `${CDN_BASE_URL}/assets/enemy/fox-white-walk.png`,
    maskGreenWalk: `${CDN_BASE_URL}/assets/enemy/mask-green-walk.png`,
    maskRedWalk: `${CDN_BASE_URL}/assets/enemy/mask-red-walk.png`,
    grimReaperWalk: `${CDN_BASE_URL}/assets/enemy/grim-reaper-walk.png`,
    waterGhostWalk: `${CDN_BASE_URL}/assets/enemy/water-ghost-walk.png`,
    totemWalk: `${CDN_BASE_URL}/assets/enemy/totem-walk.png`,
    womanGhostRedWalk: `${CDN_BASE_URL}/assets/enemy/woman-ghost-red-walk.png`,
    womanGhostWhiteAttack: `${CDN_BASE_URL}/assets/enemy/woman-ghost-white-attack.png`,
    womanGhostRedAttack: `${CDN_BASE_URL}/assets/enemy/woman-ghost-red-attack.png`,
    womanGhostWhiteWalk: `${CDN_BASE_URL}/assets/enemy/woman-ghost-white-walk.png`,
    enemyFireball: `${CDN_BASE_URL}/assets/enemy/enemy-fireball.png`,
  },

  // Boss
  boss: {
    bossAOE: `${CDN_BASE_URL}/assets/boss/boss-AOE.png`,
    bossSkillEffect: `${CDN_BASE_URL}/assets/boss/boss-skill-effect.png`,
    bossToeAttack: `${CDN_BASE_URL}/assets/boss/boss-toe-attack.png`,
    lighting: `${CDN_BASE_URL}/assets/boss/lighting.png`,
    wt: `${CDN_BASE_URL}/assets/boss/wt.png`,
    wtIdle: `${CDN_BASE_URL}/assets/boss/wt-idle.png`,
    bossDragon: `${CDN_BASE_URL}/assets/boss/boss-dragon.png`,
    bossFire: `${CDN_BASE_URL}/assets/boss/boss-fire.png`,
    bossSoulball: `${CDN_BASE_URL}/assets/boss/boss-soulball.png`,
    bossTiger: `${CDN_BASE_URL}/assets/boss/boss-tiger.png`,
  },

  // Tiles
  tile: {
    tileDeco: `${CDN_BASE_URL}/assets/tile/tile_deco.png`,
    tileGreen1: `${CDN_BASE_URL}/assets/tile/tile_green1.png`,
    tile1: `${CDN_BASE_URL}/assets/tile/tile1.png`,
    tile2: `${CDN_BASE_URL}/assets/tile/tile2.png`,
    tile3: `${CDN_BASE_URL}/assets/tile/tile3.png`,
    outlineBottom: `${CDN_BASE_URL}/assets/tile/outline-bottom.png`,
    outlineLeft: `${CDN_BASE_URL}/assets/tile/outline-left.png`,
    outlineRight: `${CDN_BASE_URL}/assets/tile/outline-right.png`,
  },

  // GUI
  gui: {
    back: `${CDN_BASE_URL}/assets/gui/back.png`,
    sound: `${CDN_BASE_URL}/assets/gui/sound.png`,
    resume: `${CDN_BASE_URL}/assets/gui/resume.png`,
    restart: `${CDN_BASE_URL}/assets/gui/restart.png`,
    settings: `${CDN_BASE_URL}/assets/gui/settings.png`,
    bgButton: `${CDN_BASE_URL}/assets/gui/bg-button.png`,
    titleFan: `${CDN_BASE_URL}/assets/gui/title-fan.png`,
    bgStage: `${CDN_BASE_URL}/assets/gui/bg-stage.png`,
    shamanSignature: `${CDN_BASE_URL}/assets/gui/shaman-signature.png`,
    loadingSprite: `${CDN_BASE_URL}/assets/gui/loading-sprite.png`,
    pattern: `${CDN_BASE_URL}/assets/gui/pattern.png`,
  },

  // Power-ups
  powerUp: {
    kill: `${CDN_BASE_URL}/assets/power-up/kill.png`,
    drain: `${CDN_BASE_URL}/assets/power-up/drain.png`,
    moveSpeed: `${CDN_BASE_URL}/assets/power-up/move-speed.png`,
    healthPlus: `${CDN_BASE_URL}/assets/power-up/health-plus.png`,
    healthGenerate: `${CDN_BASE_URL}/assets/power-up/health-generate.png`,
    attackSpeed: `${CDN_BASE_URL}/assets/power-up/attack-speed.png`,
    attackPower: `${CDN_BASE_URL}/assets/power-up/attack-power.png`,
    magnetic: `${CDN_BASE_URL}/assets/power-up/magnetic.png`,
    criticalChance: `${CDN_BASE_URL}/assets/power-up/critical-chance.png`,
    damageReduction: `${CDN_BASE_URL}/assets/power-up/damage-reduction.png`,
    experienceBoost: `${CDN_BASE_URL}/assets/power-up/experience-boost.png`,
    criticalDamage: `${CDN_BASE_URL}/assets/power-up/critical-damage.png`,
    giftbox: `${CDN_BASE_URL}/assets/power-up/giftbox.png`,
  },

  // Drops
  drop: {
    spiritEnergy1: `${CDN_BASE_URL}/assets/drop/spirit-enery-1.png`,
    spiritEnergy2: `${CDN_BASE_URL}/assets/drop/spirit-enery-2.png`,
    spiritEnergy3: `${CDN_BASE_URL}/assets/drop/spirit-enery-3.png`,
    soul: `${CDN_BASE_URL}/assets/drop/soul.png`,
  },

  // Audio
  audio: {
    bgm: {
      main: `${CDN_BASE_URL}/audio/bgm-main.mp3`,
      game01: `${CDN_BASE_URL}/audio/bgm-game-01.mp3`,
      game02: `${CDN_BASE_URL}/audio/bgm-game-02.mp3`,
    },
    sfx: {
      // SFX는 동적으로 로드되므로 베이스 경로만 제공
      base: `${CDN_BASE_URL}/audio/`,
    },
  },
} as const;

/**
 * 로딩 우선순위 그룹
 */
export const ASSET_LOADING_GROUPS = {
  // 필수: 게임 시작 전 반드시 로드
  critical: [
    CDN_ASSETS.player.shaman,
    CDN_ASSETS.player.shamanWalk,
    CDN_ASSETS.tile.tile1,
    CDN_ASSETS.tile.tile2,
    CDN_ASSETS.tile.tile3,
    CDN_ASSETS.gui.bgButton,
    CDN_ASSETS.gui.settings,
    CDN_ASSETS.gui.loadingSprite,
    CDN_ASSETS.gui.pattern,
  ],

  // 높음: 초반 스테이지에서 사용
  high: [
    CDN_ASSETS.enemy.skeletonWalk,
    CDN_ASSETS.enemy.dokkaebiGreenWalk,
    CDN_ASSETS.enemy.foxOrangeWalk,
    CDN_ASSETS.weapon.talisman,
    CDN_ASSETS.weapon.mocktak,
    CDN_ASSETS.drop.spiritEnergy1,
    CDN_ASSETS.drop.spiritEnergy2,
    CDN_ASSETS.drop.spiritEnergy3,
    CDN_ASSETS.drop.soul,
    CDN_ASSETS.powerUp.attackPower,
    CDN_ASSETS.powerUp.attackSpeed,
    CDN_ASSETS.powerUp.moveSpeed,
    CDN_ASSETS.powerUp.healthPlus,
    CDN_ASSETS.gui.back,
    CDN_ASSETS.gui.resume,
    CDN_ASSETS.gui.restart,
    CDN_ASSETS.gui.sound,
  ],

  // 중간: 중반 스테이지에서 사용
  medium: [
    CDN_ASSETS.enemy.dokkaebiBlueWalk,
    CDN_ASSETS.enemy.dokkaebiRedWalk,
    CDN_ASSETS.enemy.foxWhiteWalk,
    CDN_ASSETS.enemy.maskGreenWalk,
    CDN_ASSETS.enemy.maskRedWalk,
    CDN_ASSETS.enemy.womanGhostRedWalk,
    CDN_ASSETS.enemy.womanGhostWhiteWalk,
    CDN_ASSETS.enemy.womanGhostRedAttack,
    CDN_ASSETS.enemy.womanGhostWhiteAttack,
    CDN_ASSETS.enemy.womanGhostProjectile,
    CDN_ASSETS.weapon.jakdu,
    CDN_ASSETS.weapon.dokkabiFire,
    CDN_ASSETS.weapon.wind,
    CDN_ASSETS.powerUp.healthGenerate,
    CDN_ASSETS.powerUp.magnetic,
    CDN_ASSETS.powerUp.drain,
    CDN_ASSETS.powerUp.kill,
    CDN_ASSETS.powerUp.criticalChance,
    CDN_ASSETS.powerUp.criticalDamage,
    CDN_ASSETS.gui.bgStage,
    CDN_ASSETS.gui.shamanSignature,
  ],

  // 낮음: 후반 스테이지/보스전에서 사용
  low: [
    CDN_ASSETS.enemy.grimReaperWalk,
    CDN_ASSETS.enemy.waterGhostWalk,
    CDN_ASSETS.enemy.totemWalk,
    CDN_ASSETS.enemy.evilSpirit,
    CDN_ASSETS.enemy.evilSpiritAttack,
    CDN_ASSETS.enemy.enemyFireball,
    CDN_ASSETS.boss.bossAOE,
    CDN_ASSETS.boss.bossSkillEffect,
    CDN_ASSETS.boss.bossToeAttack,
    CDN_ASSETS.boss.lighting,
    CDN_ASSETS.boss.wt,
    CDN_ASSETS.boss.wtIdle,
    CDN_ASSETS.boss.bossDragon,
    CDN_ASSETS.boss.bossFire,
    CDN_ASSETS.boss.bossSoulball,
    CDN_ASSETS.boss.bossTiger,
    CDN_ASSETS.powerUp.damageReduction,
    CDN_ASSETS.powerUp.experienceBoost,
    CDN_ASSETS.powerUp.giftbox,
    CDN_ASSETS.tile.tileDeco,
    CDN_ASSETS.tile.tileGreen1,
    CDN_ASSETS.tile.outlineBottom,
    CDN_ASSETS.tile.outlineLeft,
    CDN_ASSETS.tile.outlineRight,
    CDN_ASSETS.npc.monk,
    CDN_ASSETS.gui.titleFan,
  ],
} as const;

/**
 * 헬퍼 함수: 경로 기반으로 에셋 별칭 생성
 */
export function getAssetAlias(url: string): string {
  // CDN URL에서 파일명만 추출
  const filename =
    url
      .split('/')
      .pop()
      ?.replace(/\.[^/.]+$/, '') || '';
  return filename;
}
