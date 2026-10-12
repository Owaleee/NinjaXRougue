import { ATTR_NAMES } from '../../game/attributes';
import { ATTR_KEYS, type Attributes } from '../../game/types';
import { t } from '../../i18n/pt-BR';

/** "+2 Velocidade, +2 Chance de Crítico" */
export function bonusText(b?: Partial<Attributes>): string {
  if (!b) return t('format.none');
  const parts = ATTR_KEYS.filter((k) => (b[k] ?? 0) !== 0).map((k) => `+${b[k]} ${ATTR_NAMES[k]}`);
  return parts.length ? parts.join(t('format.join')) : t('format.none');
}

/** Comparação antes de trocar (DD v2 §13): seta + sinal, nunca só cor. */
export function compareText(next?: Partial<Attributes>, cur?: Partial<Attributes>): string {
  const parts = ATTR_KEYS.map((k) => ({ k, d: (next?.[k] ?? 0) - (cur?.[k] ?? 0) }))
    .filter((x) => x.d !== 0)
    .map((x) => `${x.d > 0 ? '▲ +' : '▼ −'}${Math.abs(x.d)} ${ATTR_NAMES[x.k]}`);
  return parts.length ? parts.join(t('format.join')) : t('prep.noChange');
}
