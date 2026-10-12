import { ATTR_NAMES, emptyAttributes, sumAttributes } from '../../game/attributes';
import { BALANCE } from '../../game/Balance';
import type { RewardOptionId } from '../../game/run/types';
import { JUTSUS } from '../../data/jutsus';
import { t, type I18nKey } from '../../i18n/pt-BR';
import { allocationPanel } from '../components/allocation';
import { runHeader } from '../components/runHeader';
import { button, h } from '../dom';
import type { ScreenRenderer } from '../types';
import { jutsuGoals } from '../view/derived';

const REWARD_TEXT: Record<RewardOptionId, { name: I18nKey; desc: I18nKey }> = {
  kit: { name: 'reward.kit.name', desc: 'reward.kit.desc' },
  pilula: { name: 'reward.pilula.name', desc: 'reward.pilula.desc' },
  reforco: { name: 'reward.reforco.name', desc: 'reward.reforco.desc' },
  ryo: { name: 'reward.ryo.name', desc: 'reward.ryo.desc' },
  treino: { name: 'reward.treino.name', desc: 'reward.treino.desc' },
};

/** Resultado do encontro (spec §10): recompensas, pontos com "faltam X para jutsu" e 1-de-3. */
export const ResultScreen: ScreenRenderer = (ctx) => {
  const { store } = ctx;
  const run = store.state.run;
  const r = run?.lastResult;
  if (!run || !r) return h('div', { class: 'panel' }, t('notice.noRun'));
  const c = run.character;
  const ui = ctx.local('ui', () => ({ draft: emptyAttributes(0), training: false }));

  const summary = h(
    'div',
    { class: 'panel' },
    h('h1', {}, t('result.victory', { enemy: r.enemyName })),
    h('p', {}, t('result.rewards', { xp: r.xp, ryo: r.ryo, rep: r.rep })),
    r.levelsGained > 0 ? h('p', {}, t('result.levels', { n: r.levelsGained, level: c.level })) : null,
    r.learned.length ? h('p', {}, t('result.learned', { list: r.learned.map((id) => JUTSUS[id]?.name ?? id).join(', ') })) : null,
  );

  const points =
    c.unspentPoints > 0
      ? h(
          'div',
          { class: 'panel' },
          h('h2', {}, t('result.pointsTitle')),
          allocationPanel({ base: c.baseAttrs, points: c.unspentPoints, draft: ui.draft, onChange: () => ctx.rerender() }),
          button(
            t('alloc.confirm'),
            () => {
              if (store.allocate({ ...ui.draft })) ui.draft = emptyAttributes(0);
              ctx.rerender();
            },
            { primary: true, disabled: sumAttributes(ui.draft) === 0 },
          ),
          h('p', { class: 'muted' }, t('result.pointsLeft')),
        )
      : null;

  const goals = jutsuGoals(c, run.story);
  const goalsPanel = goals.length
    ? h(
        'div',
        { class: 'panel' },
        h('h3', {}, t('result.goals')),
        h(
          'ul',
          {},
          ...goals.map((g) =>
            h(
              'li',
              {},
              t('result.goal', {
                jutsu: JUTSUS[g.jutsuId]?.name ?? g.jutsuId,
                missing: g.missing.map((m) => t('result.goalPart', { n: m.missing, attr: ATTR_NAMES[m.attr] })).join(t('result.goalJoin')),
              }),
            ),
          ),
        ),
      )
    : null;

  const offer = run.pendingChoices[0];
  const training = ui.training && !!offer?.includes('treino');
  const choice = offer
    ? h(
        'div',
        { class: 'panel' },
        h('h2', {}, t('result.choiceTitle', { n: run.pendingChoices.length })),
        h(
          'div',
          { class: 'row' },
          ...offer.map((o) => {
            const isTrain = o === 'treino';
            return h(
              'div',
              { class: 'card' },
              button(
                `${isTrain && training ? '✓ ' : ''}${t(REWARD_TEXT[o].name)}`,
                () => {
                  if (isTrain) {
                    ui.training = !training;
                    return ctx.rerender();
                  }
                  ui.training = false;
                  store.chooseReward(o);
                },
                // Só o Treino é um toggle; os outros cartões resolvem na hora.
                { attrs: isTrain ? { 'data-reward': o, 'aria-pressed': String(training) } : { 'data-reward': o } },
              ),
              h('p', { class: 'muted' }, t(REWARD_TEXT[o].desc, { n: o === 'ryo' ? BALANCE.shop.rewardRyo : BALANCE.shop.trainingUses })),
            );
          }),
        ),
        training
          ? h(
              'div',
              { class: 'row' },
              h('span', {}, t('result.trainPick')),
              ...c.equipped.map((id) =>
                button(
                  JUTSUS[id]?.name ?? id,
                  () => {
                    ui.training = false;
                    store.chooseReward('treino', id);
                  },
                  { attrs: { 'data-train': id } },
                ),
              ),
            )
          : null,
      )
    : null;

  const blocked = run.pendingChoices.length > 0;
  return h(
    'div',
    { class: 'screen' },
    runHeader(run),
    summary,
    choice,
    points,
    goalsPanel,
    h(
      'div',
      { class: 'row' },
      button(t('map.prep'), () => store.go('prep')),
      button(t('map.sheet'), () => store.go('sheet')),
      button(t('common.continue'), () => store.continueFromResult(), { primary: true, disabled: blocked }),
    ),
    blocked ? h('p', { class: 'muted', attrs: { role: 'status' } }, t('result.continueBlocked')) : null,
  );
};
