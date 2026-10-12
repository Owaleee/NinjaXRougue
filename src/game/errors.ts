/**
 * Erro de regra do jogo (ação inválida, compra sem ryo, etc.).
 * O `code` é estável e pode ser usado pela interface para decidir a mensagem.
 */
export class RuleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'RuleError';
  }
}
