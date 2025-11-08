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
    purifyingWater: `${CDN_BASE_URL}/assets/weapon/purifying-water.png`,
    purifyingWaterSpike: `${CDN_BASE_URL}/assets/weapon/purifying-water-spike.png`,
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
      gui: {
        buttonClick: `${CDN_BASE_URL}/assets/audio/gui/button-click.mp3`,
        slideUp: `${CDN_BASE_URL}/assets/audio/gui/slide-up.mp3`,
        slideDown: `${CDN_BASE_URL}/assets/audio/gui/slide-down.mp3`,
        ingameStart: `${CDN_BASE_URL}/assets/audio/gui/ingame-start.wav`,
      },
      weapon: {
        dokkabiFire: `${CDN_BASE_URL}/assets/audio/weapon/dokkaebi-fire.mp3`,
        fanWind: `${CDN_BASE_URL}/assets/audio/weapon/fan-wind.mp3`,
        jakduBlade: `${CDN_BASE_URL}/assets/audio/weapon/jakdu-blade.mp3`,
        talisman: `${CDN_BASE_URL}/assets/audio/weapon/talisman.mp3`,
        // TODO: 아래 무기들의 효과음 파일 추가 필요
        // moktakSound: `${CDN_BASE_URL}/assets/audio/weapon/moktak-sound.mp3`,
        // purifyingWater: `${CDN_BASE_URL}/assets/audio/weapon/purifying-water.mp3`,
      },
      enemy: {
        common01: `${CDN_BASE_URL}/assets/audio/enemy/common-01.mp3`,
        common02: `${CDN_BASE_URL}/assets/audio/enemy/common-02.mp3`,
        common03: `${CDN_BASE_URL}/assets/audio/enemy/common-03.mp3`,
        common04: `${CDN_BASE_URL}/assets/audio/enemy/common-04.mp3`,
        ghost01: `${CDN_BASE_URL}/assets/audio/enemy/ghost-01.mp3`,
      },
      boss: {
        whiteTiger: {
          attack: `${CDN_BASE_URL}/assets/audio/boss/white-tiger/attack.mp3`,
          fire: `${CDN_BASE_URL}/assets/audio/boss/white-tiger/fire.mp3`,
          injury: `${CDN_BASE_URL}/assets/audio/boss/white-tiger/injury.mp3`,
        },
      },
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
    CDN_ASSETS.gui.bgStage,
    CDN_ASSETS.gui.shamanSignature,
    // BGM (필수)
    CDN_ASSETS.audio.bgm.main,
    CDN_ASSETS.audio.sfx.gui.buttonClick,
  ],

  // 높음: 초반 스테이지에서 사용 (높음까지 로드해야 Press to Start 표시)
  high: [CDN_ASSETS.gui.back, CDN_ASSETS.gui.resume, CDN_ASSETS.gui.restart, CDN_ASSETS.gui.sound],

  // 중간: 중반 스테이지에서 사용 (여기부터 로오오딩중 표시)
  medium: [
    CDN_ASSETS.enemy.skeletonWalk,
    CDN_ASSETS.enemy.dokkaebiGreenWalk,
    CDN_ASSETS.enemy.foxOrangeWalk,
    CDN_ASSETS.weapon.talisman,
    CDN_ASSETS.weapon.mocktak,
    CDN_ASSETS.weapon.jakdu,
    CDN_ASSETS.weapon.dokkabiFire,
    CDN_ASSETS.weapon.wind,
    CDN_ASSETS.weapon.purifyingWater,
    CDN_ASSETS.weapon.purifyingWaterSpike,
    CDN_ASSETS.drop.spiritEnergy1,
    CDN_ASSETS.drop.spiritEnergy2,
    CDN_ASSETS.drop.spiritEnergy3,
    CDN_ASSETS.drop.soul,
    CDN_ASSETS.powerUp.attackPower,
    CDN_ASSETS.powerUp.attackSpeed,
    CDN_ASSETS.powerUp.moveSpeed,
    CDN_ASSETS.powerUp.healthPlus,
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
    CDN_ASSETS.powerUp.healthGenerate,
    CDN_ASSETS.powerUp.magnetic,
    CDN_ASSETS.powerUp.drain,
    CDN_ASSETS.powerUp.kill,
    CDN_ASSETS.powerUp.criticalChance,
    CDN_ASSETS.powerUp.criticalDamage,
    // BGM
    CDN_ASSETS.audio.bgm.game01,
    CDN_ASSETS.audio.bgm.game02,
    // GUI 효과음
    CDN_ASSETS.audio.sfx.gui.slideUp,
    CDN_ASSETS.audio.sfx.gui.slideDown,
    CDN_ASSETS.audio.sfx.gui.ingameStart,
    // 무기 효과음
    CDN_ASSETS.audio.sfx.weapon.dokkabiFire,
    CDN_ASSETS.audio.sfx.weapon.fanWind,
    CDN_ASSETS.audio.sfx.weapon.jakduBlade,
    CDN_ASSETS.audio.sfx.weapon.talisman,
    // 적 효과음
    CDN_ASSETS.audio.sfx.enemy.ghost01,
    CDN_ASSETS.audio.sfx.enemy.common01,
    CDN_ASSETS.audio.sfx.enemy.common02,
    CDN_ASSETS.audio.sfx.enemy.common03,
    CDN_ASSETS.audio.sfx.enemy.common04,
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
    // 보스 효과음
    CDN_ASSETS.audio.sfx.boss.whiteTiger.attack,
    CDN_ASSETS.audio.sfx.boss.whiteTiger.fire,
    CDN_ASSETS.audio.sfx.boss.whiteTiger.injury,
  ],
} as const;

/**
 * BGM 파일 경로 매핑
 */
export const BGM_PATHS = {
  main: CDN_ASSETS.audio.bgm.main,
  'game-01': CDN_ASSETS.audio.bgm.game01,
  'game-02': CDN_ASSETS.audio.bgm.game02,
} as const;

/**
 * SFX 파일 경로 매핑
 */
export const SFX_PATHS = {
  // GUI 효과음
  'button-click': CDN_ASSETS.audio.sfx.gui.buttonClick,
  'slide-up': CDN_ASSETS.audio.sfx.gui.slideUp,
  'slide-down': CDN_ASSETS.audio.sfx.gui.slideDown,
  'ingame-start': CDN_ASSETS.audio.sfx.gui.ingameStart,
  // 무기 효과음
  'dokkabi-fire': CDN_ASSETS.audio.sfx.weapon.dokkabiFire,
  'fan-wind': CDN_ASSETS.audio.sfx.weapon.fanWind,
  'jakdu-blade': CDN_ASSETS.audio.sfx.weapon.jakduBlade,
  talisman: CDN_ASSETS.audio.sfx.weapon.talisman,
  // 적 효과음
  'enemy-common-01': CDN_ASSETS.audio.sfx.enemy.common01,
  'enemy-common-02': CDN_ASSETS.audio.sfx.enemy.common02,
  'enemy-common-03': CDN_ASSETS.audio.sfx.enemy.common03,
  'enemy-common-04': CDN_ASSETS.audio.sfx.enemy.common04,
  'enemy-ghost-01': CDN_ASSETS.audio.sfx.enemy.ghost01,
  // 보스 효과음
  'boss-white-tiger-attack': CDN_ASSETS.audio.sfx.boss.whiteTiger.attack,
  'boss-white-tiger-fire': CDN_ASSETS.audio.sfx.boss.whiteTiger.fire,
  'boss-white-tiger-injury': CDN_ASSETS.audio.sfx.boss.whiteTiger.injury,
  // TODO: 아래 무기들의 효과음 파일 추가 필요
  // 'moktak-sound': CDN_ASSETS.audio.sfx.weapon.moktakSound,
  // 'purifying-water': CDN_ASSETS.audio.sfx.weapon.purifyingWater,
} as const;

/**
 * 오디오 쿨다운 설정 (초 단위)
 *
 * 효과음이 너무 자주 재생되는 것을 방지하기 위한 쿨다운 시간
 */
export const AUDIO_COOLDOWNS = {
  /** 보스 피격 효과음 쿨다운 */
  BOSS_INJURY: 0.3,

  /** 무기 글로벌 효과음 쿨다운 */
  WEAPON_GLOBAL: 0.15,

  /** 적 사망 효과음 쿨다운 */
  ENEMY_DEATH: 0.1,
} as const;
