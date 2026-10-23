import type { AttrKey, ClanId, Element } from '../game/types';

/**
 * Arte do jogo: qual arquivo de public/assets/ representa cada coisa.
 * Os PNGs saem de assets/ via `python3 tools/prepare-assets.py`.
 * Caminhos relativos ao index.html (base './'), valem no dev e no dist/.
 */
export const ART_BASE = 'assets/';

export type CharacterArt =
  | 'player_uzumaki'
  | 'player_uchiha'
  | 'player_semclan'
  | 'inimigo_bandido'
  | 'inimigo_renegado'
  | 'inimigo_ninjaagua'
  | 'chefe_zabuza'
  | 'chefe_haku';

export type IconArt =
  | 'armadura' | 'aumento_nivel' | 'bolsa' | 'bota_velocidade' | 'coracao' | 'cura' | 'escudo'
  | 'fogo' | 'medalha' | 'moedas' | 'olho' | 'onda_agua' | 'pedras' | 'pergaminho' | 'pocao'
  | 'redemoinho_agua' | 'selo_maos' | 'shuriken' | 'soco' | 'vento';

export const CHARACTER_ARTS: CharacterArt[] = [
  'player_uzumaki', 'player_uchiha', 'player_semclan',
  'inimigo_bandido', 'inimigo_renegado', 'inimigo_ninjaagua', 'chefe_zabuza', 'chefe_haku',
];

/**
 * Para que lado o desenho original olha. A arena põe o jogador à esquerda olhando
 * para a direita e o inimigo à direita olhando para a esquerda; quem olha para o
 * lado errado é espelhado.
 */
export const CHARACTER_FACING: Record<CharacterArt, 'left' | 'right'> = {
  player_uzumaki: 'right',
  player_uchiha: 'right',
  player_semclan: 'right',
  inimigo_bandido: 'left',
  inimigo_renegado: 'left',
  inimigo_ninjaagua: 'right',
  chefe_zabuza: 'left',
  chefe_haku: 'right',
};

const CLAN_ART: Partial<Record<ClanId, CharacterArt>> = {
  uzumaki: 'player_uzumaki',
  uchiha: 'player_uchiha',
  semcla: 'player_semclan',
};

/** As elites (D+) usam o mesmo desenho do comum que substituem. */
export const ENEMY_ART: Record<string, CharacterArt> = {
  bandido: 'inimigo_bandido',
  bandido_veterano: 'inimigo_bandido',
  ninja_renegado: 'inimigo_renegado',
  renegado_veterano: 'inimigo_renegado',
  mercenario_nevoa: 'inimigo_ninjaagua',
  mercenario_veterano: 'inimigo_ninjaagua',
  zabuza: 'chefe_zabuza',
  haku: 'chefe_haku',
};

export function clanArt(clan: ClanId | null): CharacterArt {
  return (clan && CLAN_ART[clan]) || 'player_semclan';
}

export function enemyArt(templateId: string | null): CharacterArt {
  return (templateId && ENEMY_ART[templateId]) || 'inimigo_renegado';
}

export function characterUrl(art: CharacterArt): string {
  return `${ART_BASE}personagens/${art}.png`;
}

/** Ícones vetoriais da entrega de arte: assets/icones/<tipo>/<id>.svg (ver tools/prepare-assets.py). */
export type IconKind = 'jutsu' | 'item' | 'effect' | 'attr' | 'element' | 'category' | 'grade' | 'clan' | 'title' | 'ui' | 'menu' | 'style' | 'preset';
export interface SvgIcon {
  kind: IconKind;
  id: string;
}
/** Um ícone é um PNG antigo (por nome) ou um SVG novo (tipo + id do dado). */
export type IconRef = IconArt | SvgIcon;

export const svg = (kind: IconKind, id: string): SvgIcon => ({ kind, id });

export function svgIconUrl(kind: IconKind, id: string, locked = false): string {
  return `${ART_BASE}icones/${kind}/${id}${locked ? '_locked' : ''}.svg`;
}

/** Folha de quadros e atlas (JSON Array do Phaser) de um lutador animado; opcionais. */
export function spriteSheetUrl(art: CharacterArt): string {
  return `${ART_BASE}sprites/${art}/sheet.png`;
}
export function spriteAtlasUrl(art: CharacterArt): string {
  return `${ART_BASE}sprites/${art}/atlas.json`;
}

export function iconUrl(icon: IconRef): string {
  return typeof icon === 'string' ? `${ART_BASE}icones/${icon}.png` : svgIconUrl(icon.kind, icon.id);
}

export const ATTR_ICON: Record<AttrKey, IconRef> = {
  hp: svg('attr', 'hp'),
  tai: svg('attr', 'tai'),
  nin: svg('attr', 'nin'),
  gen: svg('attr', 'gen'),
  vel: svg('attr', 'vel'),
  int: svg('attr', 'int'),
  crit: svg('attr', 'crit'),
  def: svg('attr', 'def'),
};

export const ELEMENT_ICON: Record<Element, IconRef> = {
  fogo: svg('element', 'fogo'),
  vento: svg('element', 'vento'),
  terra: svg('element', 'terra'),
  agua: svg('element', 'agua'),
  raio: svg('element', 'raio'),
};

export const ITEM_ICON: Record<string, IconRef> = {
  kit_medico: svg('item', 'kit_medico'),
  pilula_chakra: svg('item', 'pilula_chakra'),
  pergaminho_reforco: svg('item', 'pergaminho_reforco'),
  kunai: svg('item', 'kunai'),
  katana: svg('item', 'katana'),
  colete_ninja: svg('item', 'colete_ninja'),
  colete_reforcado: svg('item', 'colete_reforcado'),
  pergaminho_raro: svg('item', 'pergaminho_raro'),
};

/** Ícone do jutsu pelo id (a entrega tem um por jutsu). */
export const jutsuIconRef = (id: string): SvgIcon => svg('jutsu', id);

/** Ações da batalha e recompensas. */
export const UI_ICON = (id: string): SvgIcon => svg('ui', id);

/** Fundos de tela da entrega de arte (assets/cenarios/tela/<fundo>.webp). */
export type ScreenBg = 'menu' | 'criacao' | 'mapa' | 'preparacao' | 'resultado' | 'fim_vitoria' | 'fim_morte' | 'biblioteca' | 'erro';
export const SCREEN_BGS: ScreenBg[] = ['menu', 'criacao', 'mapa', 'preparacao', 'resultado', 'fim_vitoria', 'fim_morte', 'biblioteca', 'erro'];

export function screenBgUrl(bg: ScreenBg): string {
  return `${ART_BASE}cenarios/tela/${bg}.webp`;
}

/** Qual fundo cada tela usa. A batalha não usa: o Phaser desenha a arena. */
export function screenBg(screen: string, runResult?: 'victory' | 'dead' | 'abandoned' | null): ScreenBg | null {
  switch (screen) {
    case 'menu': return 'menu';
    case 'create': return 'criacao';
    case 'map': return 'mapa';
    case 'prep': return 'preparacao';
    case 'result': return 'resultado';
    case 'runEnd': return runResult === 'victory' ? 'fim_vitoria' : 'fim_morte';
    case 'sheet': case 'encyclopedia': case 'history': case 'titles': return 'biblioteca';
    case 'error': return 'erro';
    default: return null;
  }
}

/** Efeitos visuais animados (public/assets/vfx/<nome>/{sheet.png,atlas.json}); ver tools/art/. */
export const VFX_NAMES = [
  'fx_hit', 'fx_hit_neutro', 'fx_hit_fogo', 'fx_hit_vento', 'fx_hit_raio', 'fx_hit_terra', 'fx_hit_agua', 'fx_slash', 'fx_crit', 'fx_dodge',
  'fx_fumaca', 'fx_tronco', 'fx_heal', 'fx_chakra', 'fx_defend', 'fx_resisted', 'fx_defeated', 'fx_turn_marker', 'fx_aura_sharingan', 'fx_transform_on',
  'fx_bola_de_fogo', 'fx_explosao', 'fx_goukakyuu', 'fx_daitoppa', 'fx_suiryuudan', 'fx_onda_agua', 'fx_sennen_goroshi', 'fx_investida', 'fx_golpe_pesado',
  'fx_kunai', 'fx_kubikiribouchou', 'fx_nevoa', 'fx_muon_satsujin', 'fx_senbon', 'fx_makyou', 'fx_sensatsu', 'fx_doryuuheki', 'fx_kai', 'fx_kongou_fuusa',
  'fx_genjutsu_sharingan', 'st_queimadura', 'st_imobilizado', 'st_atordoado', 'st_ilusao', 'st_lentidao', 'st_defesa_reduzida', 'st_reforco', 'st_tenacidade',
] as const;
export type VfxName = (typeof VFX_NAMES)[number];

export const vfxSheetUrl = (n: VfxName): string => `${ART_BASE}vfx/${n}/sheet.png`;
export const vfxAtlasUrl = (n: VfxName): string => `${ART_BASE}vfx/${n}/atlas.json`;
export const VFX_MANIFEST_URL = `${ART_BASE}vfx/manifest.json`;

/** Jutsu → efeito do golpe. Jutsu ausente aqui usa o efeito de impacto do elemento. */
export const JUTSU_FX: Record<string, VfxName> = {
  bola_de_fogo: 'fx_bola_de_fogo',
  goukakyuu: 'fx_goukakyuu',
  daitoppa: 'fx_daitoppa',
  suiryuudan: 'fx_suiryuudan',
  sennen_goroshi: 'fx_sennen_goroshi',
  investida_ninja: 'fx_investida',
  golpe_pesado: 'fx_golpe_pesado',
  kunai_lancada: 'fx_kunai',
  kubikiribouchou: 'fx_kubikiribouchou',
  kirigakure: 'fx_nevoa',
  muon_satsujin: 'fx_muon_satsujin',
  senbon: 'fx_senbon',
  makyou_hyoushou: 'fx_makyou',
  sensatsu_suishou: 'fx_sensatsu',
  kai: 'fx_kai',
  doryuuheki: 'fx_doryuuheki',
  kongou_fuusa: 'fx_kongou_fuusa',
  genjutsu_sharingan: 'fx_genjutsu_sharingan',
};
/** Jutsus de suporte cujo efeito aparece no OPONENTE (os demais, em quem usa). */
export const JUTSU_FX_ON_OPPONENT: ReadonlySet<string> = new Set(['kongou_fuusa', 'genjutsu_sharingan']);

export const ELEMENT_HIT_FX: Record<Element, VfxName> = {
  fogo: 'fx_hit_fogo',
  vento: 'fx_hit_vento',
  raio: 'fx_hit_raio',
  terra: 'fx_hit_terra',
  agua: 'fx_hit_agua',
};

/** Efeito (EffectDef.id) → marca visual ao ser aplicado. */
export const STATUS_FX: Record<string, VfxName> = {
  queimadura: 'st_queimadura',
  imobilizado: 'st_imobilizado',
  atordoado: 'st_atordoado',
  ilusao: 'st_ilusao',
  lentidao: 'st_lentidao',
  defesa_reduzida: 'st_defesa_reduzida',
  reforco_tai: 'st_reforco',
  reforco_nin: 'st_reforco',
  reforco_gen: 'st_reforco',
  reforco_vel: 'st_reforco',
  reforco_def: 'st_reforco',
};

/** Cenários de batalha em 3 camadas (public/assets/cenarios/batalha/<cenario>_<camada>.webp). */
export const BATTLE_SCENES = ['estrada_floresta', 'costa_nevoa', 'lago_nevoa', 'ponte', 'acampamento'] as const;
export type BattleScene = (typeof BATTLE_SCENES)[number];
export const SCENE_LAYERS = ['ceu', 'meio', 'chao'] as const;
export const sceneLayerUrl = (s: BattleScene, layer: (typeof SCENE_LAYERS)[number]): string => `${ART_BASE}cenarios/batalha/${s}_${layer}.webp`;
export const OVERLAY_NEVOA_URL = `${ART_BASE}cenarios/batalha/overlay_nevoa.webp`;
export const OVERLAY_GELO_URL = `${ART_BASE}cenarios/batalha/overlay_espelhos_gelo.webp`;
export const LOADING_SCREEN_URL = `${ART_BASE}identidade/loading_screen.webp`;

/** Em que cenário cada inimigo luta, e qual camada de efeito entra por cima. */
const SCENE_OF_ENEMY: Record<string, { scene: BattleScene; overlay: 'nevoa' | 'gelo' | null }> = {
  bandido: { scene: 'estrada_floresta', overlay: null },
  bandido_veterano: { scene: 'estrada_floresta', overlay: null },
  ninja_renegado: { scene: 'estrada_floresta', overlay: null },
  renegado_veterano: { scene: 'estrada_floresta', overlay: null },
  mercenario_nevoa: { scene: 'costa_nevoa', overlay: 'nevoa' },
  mercenario_veterano: { scene: 'costa_nevoa', overlay: 'nevoa' },
  zabuza: { scene: 'ponte', overlay: 'nevoa' },
  haku: { scene: 'lago_nevoa', overlay: 'gelo' },
};

export function battleSceneFor(templateId: string | null): { scene: BattleScene; overlay: 'nevoa' | 'gelo' | null } {
  return (templateId && SCENE_OF_ENEMY[templateId]) || { scene: 'estrada_floresta', overlay: null };
}
