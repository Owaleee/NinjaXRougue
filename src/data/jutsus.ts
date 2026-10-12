import type { Attributes, ClanId, Element, Grade, JutsuCategory, Phase, StoryPointId } from '../game/types';

export interface JutsuEffectSpec {
  effectId: string;
  target: 'self' | 'enemy';
  /** Chance base (0..1). Controle passa por controlChance; o resto por effectChance. */
  chance: number;
  /** Para controle: duração pedida (o motor limita a 2 em comuns e 1 em chefes). */
  duration?: number;
}

export interface JutsuDef {
  id: string;
  name: string;
  category: JutsuCategory;
  element: Element | null;
  clan: ClanId | null;
  /** Requisitos de atributo BASE (spec §5). */
  requires: Partial<Attributes>;
  prereq: string | null;
  minStory: StoryPointId;
  grade: Grade;
  cost: number;
  /** null = jutsu sem dano direto. */
  power: number | null;
  effects: JutsuEffectSpec[];
  phase: Phase;
  /** Golpes exclusivos de inimigos (não aparecem na Enciclopédia). */
  enemyOnly?: boolean;
  /** Regra de Herança de clã (DD v2 §8). */
  inheritance?: boolean;
  /** Kai: remove Ilusão/efeitos de Genjutsu de si mesmo. */
  cleanse?: boolean;
  description: string;
}

/** Atalho para jutsus que só existem na Enciclopédia (fases futuras, sem efeito mecânico no MVP). */
function future(
  id: string,
  name: string,
  category: JutsuCategory,
  element: Element | null,
  clan: ClanId | null,
  requires: Partial<Attributes>,
  prereq: string | null,
  minStory: StoryPointId,
  grade: Grade,
  cost: number,
  power: number | null,
  phase: Phase,
  description: string,
  inheritance = false,
): JutsuDef {
  return { id, name, category, element, clan, requires, prereq, minStory, grade, cost, power, effects: [], phase, inheritance, description };
}

export const JUTSU_LIST: JutsuDef[] = [
  // ---------- Gerais jogáveis no MVP (Apêndice B.1) ----------
  { id: 'henge', name: 'Henge no Jutsu', category: 'ninjutsu', element: null, clan: null, requires: { nin: 5 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 6, power: null, effects: [{ effectId: 'henge', target: 'self', chance: 1 }], phase: 'F1B', description: 'Transformação: 30% de chance de o próximo golpe inimigo errar.' },
  { id: 'bunshin', name: 'Bunshin no Jutsu', category: 'ninjutsu', element: null, clan: null, requires: { nin: 5 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 8, power: null, effects: [{ effectId: 'bunshin', target: 'self', chance: 1 }], phase: 'F1A', description: 'Clones ilusórios: +12% de esquiva por 2 turnos.' },
  { id: 'kawarimi', name: 'Kawarimi no Jutsu', category: 'ninjutsu', element: null, clan: null, requires: { vel: 8 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 10, power: null, effects: [{ effectId: 'kawarimi', target: 'self', chance: 1 }], phase: 'F1A', description: 'Substituição por um tronco: anula o próximo golpe recebido (2 turnos).' },
  { id: 'bola_de_fogo', name: 'Bola de Fogo Básica', category: 'ninjutsu', element: 'fogo', clan: null, requires: { nin: 6 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 8, power: 26, effects: [{ effectId: 'queimadura', target: 'enemy', chance: 0.15 }], phase: 'F0', description: 'Pequena bola de fogo: dano e 15% de Queimadura.' },
  { id: 'sennen_goroshi', name: 'Sennen Goroshi', category: 'taijutsu', element: null, clan: null, requires: { tai: 6 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 8, power: 26, effects: [{ effectId: 'defesa_reduzida', target: 'enemy', chance: 1 }], phase: 'F0', description: 'O "Mil Anos de Dor" de Kakashi: dano e −5% de Defesa do alvo por 2 turnos.' },
  { id: 'investida_ninja', name: 'Investida Ninja', category: 'taijutsu', element: null, clan: null, requires: { tai: 12 }, prereq: null, minStory: 'inicio', grade: 'C', cost: 14, power: 40, effects: [], phase: 'F0', description: 'Técnica de Academia: investida de corpo inteiro (nome genérico, não canônico).' },
  { id: 'kai', name: 'Kai', category: 'genjutsu', element: null, clan: null, requires: { gen: 8 }, prereq: null, minStory: 'inicio', grade: 'D', cost: 6, power: null, effects: [], cleanse: true, phase: 'F1A', description: 'Dispersa o fluxo de chakra: remove Ilusão e efeitos de Genjutsu de si mesmo.' },
  { id: 'daitoppa', name: 'Fuuton: Daitoppa', category: 'ninjutsu', element: 'vento', clan: null, requires: { nin: 12 }, prereq: null, minStory: 'onda', grade: 'C', cost: 14, power: 40, effects: [{ effectId: 'lentidao', target: 'enemy', chance: 0.25 }], phase: 'F1A', description: 'Rajada de vento: dano e 25% de reduzir a Velocidade do alvo.' },
  { id: 'doryuuheki', name: 'Doton: Doryuuheki', category: 'ninjutsu', element: 'terra', clan: null, requires: { nin: 12 }, prereq: null, minStory: 'onda', grade: 'C', cost: 14, power: null, effects: [{ effectId: 'doryuuheki', target: 'self', chance: 1 }], phase: 'F1B', description: 'Muralha de lama: +25% de redução de dano por 3 turnos.' },
  { id: 'suiryuudan', name: 'Suiton: Suiryuudan no Jutsu', category: 'ninjutsu', element: 'agua', clan: null, requires: { nin: 22 }, prereq: null, minStory: 'onda_pos_zabuza', grade: 'B', cost: 22, power: 60, effects: [], phase: 'F1A', description: 'O dragão de água usado por Zabuza.' },
  { id: 'kage_bunshin', name: 'Kage Bunshin no Jutsu', category: 'ninjutsu', element: null, clan: null, requires: { nin: 20 }, prereq: null, minStory: 'onda', grade: 'B', cost: 24, power: null, effects: [{ effectId: 'kage_bunshin', target: 'self', chance: 1 }], phase: 'F1A', description: 'Clones reais: +25% de dano em jutsus por 3 turnos e um clone absorve 1 golpe.' },

  // ---------- Clã jogáveis no MVP (B.2 / B.3) ----------
  { id: 'kongou_fuusa', name: 'Kongou Fuusa', category: 'fuinjutsu', element: null, clan: 'uzumaki', requires: { int: 14, nin: 8 }, prereq: null, minStory: 'inicio', grade: 'C', cost: 16, power: null, effects: [{ effectId: 'imobilizado', target: 'enemy', chance: 0.55, duration: 2 }], phase: 'F1A', inheritance: true, description: 'Correntes de chakra adamantinas: 55% de imobilizar (1 a 2 turnos).' },
  { id: 'goukakyuu', name: 'Katon: Goukakyuu no Jutsu', category: 'ninjutsu', element: 'fogo', clan: 'uchiha', requires: { nin: 12 }, prereq: null, minStory: 'inicio', grade: 'C', cost: 14, power: 40, effects: [{ effectId: 'queimadura', target: 'enemy', chance: 0.25 }], phase: 'F1A', inheritance: true, description: 'A grande bola de fogo do clã Uchiha: dano e 25% de Queimadura.' },
  { id: 'genjutsu_sharingan', name: 'Genjutsu: Sharingan', category: 'genjutsu', element: null, clan: 'uchiha', requires: { gen: 10 }, prereq: null, minStory: 'inicio', grade: 'C', cost: 12, power: null, effects: [{ effectId: 'ilusao', target: 'enemy', chance: 0.4, duration: 1 }], phase: 'F1A', inheritance: true, description: 'Ilusão pelo olhar: 40% de prender o alvo num genjutsu (1 turno).' },

  // ---------- Fases futuras (só Enciclopédia) ----------
  future('konoha_senpuu', 'Konoha Senpuu', 'taijutsu', null, null, { tai: 14 }, null, 'exame_chunin_inicio', 'C', 14, 40, 'F2', 'Chute giratório da Folha.'),
  future('jubaku_satsu', 'Magen: Jubaku Satsu', 'genjutsu', null, null, { gen: 14 }, null, 'exame_chunin_inicio', 'C', 16, null, 'F2', 'Ilusão da árvore que prende o alvo.'),
  future('nehan_shouja', 'Magen: Nehan Shouja no Jutsu', 'genjutsu', null, null, { gen: 20 }, null, 'exame_chunin', 'B', 22, null, 'F2', 'Penas ilusórias que adormecem.'),
  future('gogyou_fuuin', 'Fuuinjutsu: Gogyou Fuuin', 'fuinjutsu', null, null, { int: 22 }, null, 'exame_chunin_floresta', 'B', 22, null, 'F2', 'Selo dos Cinco Elementos: sela buffs e passivas do alvo.'),
  future('naruto_rendan', 'Uzumaki Naruto Rendan', 'taijutsu', null, null, { tai: 20, nin: 12 }, 'kage_bunshin', 'exame_chunin_preliminares', 'B', 24, 70, 'F2', 'Combo de clones em sequência.'),
  future('shishi_rendan', 'Shishi Rendan', 'taijutsu', null, null, { tai: 22, vel: 14 }, null, 'exame_chunin_finais', 'B', 22, 65, 'F2', 'Combo do Leão: dois golpes.'),
  future('chidori', 'Chidori', 'ninjutsu', 'raio', null, { nin: 30, vel: 18 }, null, 'exame_chunin', 'A', 38, 100, 'F2', 'Mil pássaros: estocada de raio.'),
  future('rasengan', 'Rasengan', 'ninjutsu', null, null, { nin: 32, int: 15 }, 'kage_bunshin', 'busca_tsunade', 'A', 40, 100, 'F3', 'Esfera espiral de chakra puro.'),
  future('kuchiyose', 'Kuchiyose no Jutsu', 'ninjutsu', null, null, { nin: 25, int: 20 }, null, 'busca_tsunade', 'A', 40, null, 'Futuro', 'Invoca um aliado.'),
  future('rasen_shuriken', 'Fuuton: Rasen Shuriken', 'ninjutsu', 'vento', null, { nin: 45, int: 30 }, 'rasengan', 'shippuden', 'S', 70, 160, 'Futuro', 'Rasengan com natureza Vento.'),
  future('omote_renge', 'Omote Renge', 'taijutsu', null, null, { tai: 40, vel: 30 }, null, 'exame_chunin_preliminares', 'S', 60, 150, 'Futuro', 'Lótus Primária (Oito Portões).'),
  future('hakke_no_fuuin_shiki', 'Hakke no Fuuin Shiki', 'fuinjutsu', null, 'uzumaki', { int: 30, nin: 20 }, null, 'shippuden', 'A', 36, null, 'F3', 'Selo dos Oito Trigramas.'),
  future('ryuuka', 'Katon: Ryuuka no Jutsu', 'ninjutsu', 'fogo', 'uchiha', { nin: 24 }, null, 'exame_chunin', 'B', 24, 65, 'F2', 'Fogo do dragão.'),
  future('amaterasu', 'Amaterasu', 'ninjutsu', null, 'uchiha', { gen: 40, nin: 25 }, null, 'perseguicao_itachi', 'S', 50, 130, 'Futuro', 'Chamas negras que não se apagam.'),
  future('tsukuyomi', 'Tsukuyomi', 'genjutsu', null, 'uchiha', { gen: 42, nin: 20 }, null, 'perseguicao_itachi', 'S', 50, null, 'Futuro', 'Genjutsu supremo do Mangekyou.'),
  future('jyuuken', 'Jyuuken', 'taijutsu', null, 'hyuuga', { tai: 10 }, null, 'inicio', 'C', 12, 40, 'F2', 'Punho Gentil.', true),
  future('hakke_sanjuuni', 'Hakke Sanjuuni Shou', 'taijutsu', null, 'hyuuga', { tai: 18 }, null, 'exame_chunin', 'B', 22, 60, 'F2', 'Trinta e Duas Palmas.'),
  future('kaiten', 'Kaiten', 'taijutsu', null, 'hyuuga', { tai: 22, vel: 12 }, null, 'exame_chunin_preliminares', 'B', 22, null, 'F2', 'Rotação Celestial.'),
  future('hakke_rokujuuyon', 'Hakke Rokujuuyon Shou', 'taijutsu', null, 'hyuuga', { tai: 34, vel: 20 }, null, 'exame_chunin_finais', 'A', 38, 100, 'F2', 'Sessenta e Quatro Palmas.'),
  future('kagemane', 'Kagemane no Jutsu', 'ninjutsu', null, 'nara', { nin: 10, int: 12 }, null, 'exame_chunin_floresta', 'C', 14, null, 'F2', 'Imitação da Sombra.'),
  future('kagenui', 'Kagenui no Jutsu', 'ninjutsu', null, 'nara', { nin: 18, int: 16 }, null, 'exame_chunin', 'B', 22, 45, 'F2', 'Costura da Sombra.'),
  future('kage_kubishibari', 'Kage Kubishibari no Jutsu', 'ninjutsu', null, 'nara', { nin: 22, int: 18 }, null, 'exame_chunin_finais', 'B', 24, 50, 'F2', 'Estrangulamento da Sombra.'),
  future('bubun_baika', 'Bubun Baika no Jutsu', 'taijutsu', null, 'akimichi', { tai: 10 }, null, 'inicio', 'C', 12, 42, 'F2', 'Expansão parcial.', true),
  future('baika', 'Baika no Jutsu', 'taijutsu', null, 'akimichi', { tai: 16 }, null, 'exame_chunin', 'B', 20, null, 'F2', 'Expansão.'),
  future('nikudan_sensha', 'Nikudan Sensha', 'taijutsu', null, 'akimichi', { tai: 22 }, 'baika', 'exame_chunin_preliminares', 'B', 22, 70, 'F2', 'Tanque Humano.'),
  future('chou_baika', 'Chou Baika no Jutsu', 'taijutsu', null, 'akimichi', { tai: 30, hp: 25 }, null, 'recuperacao_sasuke', 'A', 36, null, 'F3', 'Super Expansão.'),
  future('kikaichuu', 'Kikaichuu no Jutsu', 'ninjutsu', null, 'aburame', { nin: 10, int: 10 }, null, 'inicio', 'C', 12, null, 'F2', 'Insetos parasitas de chakra.', true),
  future('mushi_bunshin', 'Mushi Bunshin no Jutsu', 'ninjutsu', null, 'aburame', { int: 14 }, null, 'exame_chunin', 'C', 14, null, 'F2', 'Clone de insetos.'),
  future('mushidama', 'Mushidama', 'ninjutsu', null, 'aburame', { nin: 30, int: 20 }, null, 'shippuden', 'A', 36, 90, 'Futuro', 'Esfera de insetos.'),

  // ---------- Golpes de inimigos (Apêndice A.4) ----------
  { id: 'golpe_pesado', name: 'Golpe Pesado', category: 'taijutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'D', cost: 8, power: 24, effects: [], phase: 'F0', enemyOnly: true, description: 'Pancada bruta.' },
  { id: 'kunai_lancada', name: 'Kunai Lançada', category: 'ninjutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'D', cost: 6, power: 22, effects: [], phase: 'F0', enemyOnly: true, description: 'Kunai arremessada.' },
  { id: 'kubikiribouchou', name: 'Kubikiribouchou', category: 'taijutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'C', cost: 0, power: 30, effects: [], phase: 'F1A', enemyOnly: true, description: 'Golpe da Espada Decapitadora.' },
  { id: 'kirigakure', name: 'Kirigakure no Jutsu', category: 'ninjutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'C', cost: 12, power: null, effects: [{ effectId: 'nevoa', target: 'self', chance: 1 }], phase: 'F1A', enemyOnly: true, description: 'Névoa Oculta: +15% de esquiva por 3 turnos.' },
  { id: 'muon_satsujin', name: 'Muon Satsujin', category: 'taijutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'C', cost: 18, power: 45, effects: [], phase: 'F1A', enemyOnly: true, description: 'Assassinato Silencioso.' },
  { id: 'senbon', name: 'Senbon', category: 'ninjutsu', element: null, clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'C', cost: 0, power: 30, effects: [], phase: 'F1A', enemyOnly: true, description: 'Agulhas precisas.' },
  { id: 'makyou_hyoushou', name: 'Makyou Hyoushou', category: 'ninjutsu', element: 'agua', clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'B', cost: 14, power: null, effects: [{ effectId: 'makyou', target: 'self', chance: 1 }], phase: 'F1A', enemyOnly: true, description: 'Espelhos de Gelo Demoníacos: +25% de esquiva por 3 turnos.' },
  { id: 'sensatsu_suishou', name: 'Sensatsu Suishou', category: 'ninjutsu', element: 'agua', clan: null, requires: {}, prereq: null, minStory: 'inicio', grade: 'B', cost: 20, power: 55, effects: [], phase: 'F1A', enemyOnly: true, description: 'Mil Agulhas da Morte de água.' },
];

export const JUTSUS: Record<string, JutsuDef> = Object.fromEntries(JUTSU_LIST.map((j) => [j.id, j]));
