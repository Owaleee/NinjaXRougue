/**
 * Todas as strings de INTERFACE do jogo (spec §2: i18n PT-BR).
 * Nomes de conteúdo (jutsus, itens, inimigos...) ficam em src/data/.
 * POR QUÊ um objeto `as const`: o TypeScript passa a conhecer cada chave, e
 * um t('chave.errada') vira erro de compilação, não texto quebrado na tela.
 * Variáveis: "{nome}" no texto, preenchidas por t(chave, { nome: valor }).
 */
export const PT_BR = {
  'app.title': 'NarutoTxGame',
  'common.back': 'Voltar',
  'common.confirm': 'Confirmar',
  'common.cancel': 'Cancelar',
  'common.close': 'Fechar',
  'common.continue': 'Continuar',
  'common.ryo': '{n} ryo',
  'common.level': 'Nível {n}',
  'common.none': 'Nenhum',
  'notice.saveFailed': 'Não foi possível salvar o progresso (armazenamento cheio ou bloqueado). O jogo continua, mas pode se perder ao fechar a aba.',
  'notice.unexpected': 'Erro inesperado: {msg}',
  'error.title': 'Algo deu errado',
  'error.reload': 'Recarregar o jogo',
  'screen.wip': 'Tela em construção.',
  'element.fogo': 'Fogo',
  'element.vento': 'Vento',
  'element.raio': 'Raio',
  'element.terra': 'Terra',
  'element.agua': 'Água',
} as const;

export type I18nKey = keyof typeof PT_BR;

export function t(key: I18nKey, vars?: Record<string, string | number>): string {
  const tpl: string = PT_BR[key];
  if (!vars) return tpl;
  return tpl.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

/** 0.1667 → "16,7%". */
export function pct(fraction: number, digits = 1): string {
  return `${(fraction * 100).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

/** 1220 → "1.220". */
export function num(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}
