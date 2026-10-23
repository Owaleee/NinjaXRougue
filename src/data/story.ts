import { STORY_POINTS, type StoryPointId } from '../game/types';

export const STORY_NAMES: Record<StoryPointId, string> = {
  inicio: 'Início',
  onda: 'Saga da Onda',
  onda_pos_zabuza: 'Saga da Onda (após Zabuza)',
  exame_chunin_inicio: 'Exame Chunin (início)',
  exame_chunin_floresta: 'Exame Chunin (Floresta da Morte)',
  exame_chunin_preliminares: 'Exame Chunin (Preliminares)',
  exame_chunin: 'Exame Chunin (mês de treino)',
  exame_chunin_finais: 'Exame Chunin (Finais)',
  busca_tsunade: 'Busca por Tsunade',
  recuperacao_sasuke: 'Recuperação do Sasuke',
  shippuden: 'Shippuden',
  perseguicao_itachi: 'Perseguição a Itachi',
};

/** Posição cronológica; usada para comparar "saga mínima" com o ponto atual. */
export function storyIndex(id: StoryPointId): number {
  return STORY_POINTS.indexOf(id);
}
