import { ATTR_NAMES } from '../../game/attributes';
import { BALANCE } from '../../game/Balance';
import type { AttrKey } from '../../game/types';
import { ATTR_ICON } from '../../data/art';
import { t } from '../../i18n/pt-BR';
import { h, icon } from '../dom';

/** Texto da explicação do atributo; os números vêm do BALANCE para não envelhecer. */
export function attrTip(k: AttrKey): string {
  return t(`attr.tip.${k}`, {
    n: k === 'hp' ? BALANCE.hp.perPoint : k === 'int' ? BALANCE.chakra.perInt : BALANCE.damage.critMultiplier,
    m: BALANCE.chakra.regenIntDivisor,
  });
}

/**
 * Ícone + nome do atributo, com a explicação em tooltip (mouse e foco de teclado).
 * POR QUÊ o texto fica em `data-tip` (desenhado por CSS) e não como filho: o
 * `textContent` da célula continua sendo só o nome, e o leitor de tela recebe
 * a explicação por `aria-description`.
 */
export function attrLabel(k: AttrKey): HTMLElement {
  const tip = attrTip(k);
  return h('span', { class: 'with-icon has-tip', attrs: { tabindex: '0', 'data-tip': tip, 'aria-description': tip } }, icon(ATTR_ICON[k]), ATTR_NAMES[k]);
}
