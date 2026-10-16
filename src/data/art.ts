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
