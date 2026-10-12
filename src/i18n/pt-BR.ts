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
  'notice.runExists': 'Já existe uma run em andamento. Abandone-a no menu antes de começar outra.',
  'notice.noRun': 'Nenhuma run em andamento.',
  'notice.unexpected': 'Erro inesperado: {msg}',
  'error.title': 'Algo deu errado',
  'error.reload': 'Recarregar o jogo',
  'screen.wip': 'Tela em construção.',
  'menu.subtitle': 'Saga da Onda — roguelite de ninjas por turnos',
  'menu.continue': 'Continuar run',
  'menu.continueInfo': '{name} — encontro {n} de {total}',
  'menu.story': 'Modo História',
  'menu.infinite': 'Modo Infinito (em breve)',
  'menu.soon': 'Em breve',
  'menu.encyclopedia': 'Enciclopédia de Jutsus',
  'menu.history': 'Histórico de Runs',
  'menu.titles': 'Títulos',
  'menu.abandonTitle': 'Abandonar a run atual?',
  'menu.abandonBody': 'A run de {name} será encerrada e registrada no Histórico como abandonada.',
  'menu.abandonConfirm': 'Abandonar e criar novo ninja',
  'notice.storageUnavailable': 'O armazenamento do navegador está indisponível: o progresso não será salvo nesta sessão.',
  'element.fogo': 'Fogo',
  'element.vento': 'Vento',
  'element.raio': 'Raio',
  'element.terra': 'Terra',
  'element.agua': 'Água',
  'log.battleStart': 'A batalha contra {enemy} começou.',
  'log.round': '— Rodada {n} —',
  'log.attack': '{who} ataca.',
  'log.jutsu': '{who} usa {jutsu} (−{cost} chakra).',
  'log.damage': '{target} sofre {amount} de dano.',
  'log.damageCrit': '✦ CRÍTICO! {target} sofre {amount} de dano.',
  'log.superEffective': ' (vantagem elemental)',
  'log.notEffective': ' (desvantagem elemental)',
  'log.dodge': '{target} ESQUIVOU.',
  'log.missHenge': 'O golpe de {who} errou o alvo disfarçado (Henge).',
  'log.negatedKawarimi': '{target} escapa com Kawarimi: golpe anulado.',
  'log.negatedClone': 'Um clone de {target} absorve o golpe.',
  'log.dot': '{target} sofre {amount} de dano por {effect}.',
  'log.heal': '{target} recupera {hp} de HP e {chakra} de chakra.',
  'log.defend': '{who} se defende (+{chakra} chakra).',
  'log.meditate': '{who} medita (+{chakra} chakra).',
  'log.item': '{who} usa {item}.',
  'log.effectOn': '{target}: {effect} ({turns} turnos).',
  'log.effectOnSustained': '{target}: {effect} (sustentado ∞).',
  'log.resisted': '{target} resiste a {effect}.',
  'log.resistedTenacity': '{target} está imune a controle (Tenacidade): {effect} falhou.',
  'log.effectOff': '{target}: {effect} terminou.',
  'log.skip': '{who} perde o turno ({effect}).',
  'log.transformOn': '{who} ativa {form}.',
  'log.transformOff': '{who} desativa {form}.',
  'log.transformOffNoChakra': '{who} fica sem chakra e perde {form}.',
  'log.mastery': 'Maestria de {jutsu} subiu para +{level}!',
  'log.defeated': '{target} foi derrotado.',
  'log.victory': 'Vitória!',
  'log.defeat': 'Derrota...',
  'log.timeout': 'Derrota: a luta passou do limite de rodadas.',
  'log.reward': '+{xp} XP, +{ryo} ryo, +{rep} de reputação.',
  'log.levelUp': '▲ Subiu para o nível {level}!',
  'log.learned': '★ Novo jutsu aprendido: {jutsu}.',
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
