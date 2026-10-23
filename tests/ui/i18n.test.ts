import { describe, it, expect } from 'vitest';
import { PT_BR, num, pct, t } from '../../src/i18n/pt-BR';

describe('i18n pt-BR', () => {
  it('interpola variáveis', () => {
    expect(t('common.ryo', { n: 30 })).toBe('30 ryo');
    expect(t('common.level', { n: 4 })).toBe('Nível 4');
  });

  it('deixa intacta uma variável não informada (bug visível, não silencioso)', () => {
    expect(t('common.ryo')).toBe('{n} ryo');
  });

  it('formata porcentagem e número no padrão brasileiro', () => {
    expect(pct(0.1667)).toBe('16,7%');
    expect(pct(0.04, 0)).toBe('4%');
    expect(num(1220)).toBe('1.220');
  });

  it('nenhuma chave tem texto vazio', () => {
    for (const [k, v] of Object.entries(PT_BR)) expect(v.trim(), k).not.toBe('');
  });
});
