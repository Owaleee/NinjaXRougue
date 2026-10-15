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

export function iconUrl(icon: IconArt): string {
  return `${ART_BASE}icones/${icon}.png`;
}

export const ATTR_ICON: Record<AttrKey, IconArt> = {
  hp: 'coracao',
  tai: 'soco',
  nin: 'selo_maos',
  gen: 'olho',
  vel: 'bota_velocidade',
  int: 'redemoinho_agua',
  crit: 'shuriken',
  def: 'escudo',
};

/** Raio ainda não tem ícone (só entra na F2). */
export const ELEMENT_ICON: Partial<Record<Element, IconArt>> = {
  fogo: 'fogo',
  vento: 'vento',
  terra: 'pedras',
  agua: 'onda_agua',
};

export const ITEM_ICON: Record<string, IconArt> = {
  kit_medico: 'cura',
  pilula_chakra: 'pocao',
  pergaminho_reforco: 'pergaminho',
  kunai: 'shuriken',
  katana: 'shuriken',
  colete_ninja: 'armadura',
  colete_reforcado: 'armadura',
  pergaminho_raro: 'pergaminho',
};
