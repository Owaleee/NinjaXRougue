# Curso: do zero ao NarutoTxGame

Este curso reconstrói o NarutoTxGame, um roguelike de batalhas por turnos ambientado na Saga da Onda, do primeiro arquivo do projeto até a versão 1.0 do MVP. Ele segue a ordem real em que o código foi escrito: cada versão do curso corresponde a um ou mais commits do repositório, e você pode abrir esses commits com `git show <sha>` para ver o código exatamente como estava.

## Como ler

- O curso tem 12 versões: oito Alfas (o motor de regras, sem interface), três Betas (a interface no navegador) e a 1.0 (robustez, calibração e entrega).
- Leia na ordem. Cada versão depende das anteriores e explica os conceitos de jogo na primeira vez em que aparecem (RNG com semente, turno, máquina de estados, tick e outros).
- Todas as versões têm o mesmo formato: objetivo, escopo (o que entra e o que fica de fora), passo a passo, critérios de conclusão, testes e patch log.
- Cada passo responde quatro perguntas: **o quê** fazer, **por quê** (a razão técnica e a razão de jogo), quais **alternativas** existiam e quais **riscos e armadilhas** apareceram de verdade no histórico do repositório.
- Cada versão termina com a suíte de testes verde (`npm test`). Os critérios de conclusão dizem quais testes rodar para conferir aquela versão isoladamente.
- Uma versão descreve o código como estava ao fim dela. Quando uma versão posterior mudou algo, o texto avisa (por exemplo, "Alterado na Beta 0.9.0").
- Os arquivos citados entre crases existem no repositório e os números de balanceamento citados batem com `src/game/Balance.ts`: o comando `npm run docs:check` confere as duas coisas, com o verificador em `tools/docs-check.ts`.

## Versões

| Versão | Título | Arquivo | Commits |
|---|---|---|---|
| Alfa 0.1 | Projeto e RNG com semente | [alfa-0.1.md](alfa-0.1.md) | 6e0b7ec |
| Alfa 0.2 | Tipos, constantes e fórmulas | [alfa-0.2.md](alfa-0.2.md) | 4181fe6 |
| Alfa 0.3 | Dados do jogo e validação | [alfa-0.3.md](alfa-0.3.md) | 13217f7 |
| Alfa 0.4 | Personagem e progressão | [alfa-0.4.md](alfa-0.4.md) | 58685ee |
| Alfa 0.5 | Efeitos e resolução de golpe | [alfa-0.5.md](alfa-0.5.md) | 41b4395, cad6791 |
| Alfa 0.6 | Batalha por turnos e IA | [alfa-0.6.md](alfa-0.6.md) | 3887828, 350f4eb |
| Alfa 0.7 | Loja, run e meta-progressão | [alfa-0.7.md](alfa-0.7.md) | bbc2e8f, 6d7f716, 9b57eeb, e47876f |
| Alfa 0.8 | Save e simulador | [alfa-0.8.md](alfa-0.8.md) | 3df4c72, c8dc2ea, 3395adb, 6b09742, e4db64a |
| Beta 0.9.0 | Casca da interface e GameStore | [beta-0.9.0.md](beta-0.9.0.md) | 0d07169, 593aeca, ff7bc45, cbb351a, c8b9b93, 1dfd7cd |
| Beta 0.9.1 | Telas | [beta-0.9.1.md](beta-0.9.1.md) | 5425a49, f015e01, a369ca2, 52d7088, e148bb1 e correções |
| Beta 0.9.2 | Batalha em Phaser | [beta-0.9.2.md](beta-0.9.2.md) | 9ab3025, 95f4d50 |
| 1.0 | Robustez, calibração e entrega | [1.0.md](1.0.md) | 0b6fbee, 5aa63f0, bec6a2e e as tasks de código do Plano 3 |

## Pré-requisitos

- **Node 22** ou mais novo (o `package.json` exige `node >= 22`) e npm.
- **JavaScript** moderno (módulos, `class`, arrow functions, spread) e o básico de **TypeScript** (tipos, interfaces, uniões de strings). O curso explica os recursos menos comuns quando aparecem, como `as const` e `Record`.
- **Git** para navegar no histórico: `git log --oneline` e `git show <sha>`.
- **Nenhuma experiência em jogos.** Todo conceito de jogo (turno, RNG com semente, grau de inimigo, balanceamento, roguelike) é explicado no ponto em que é usado pela primeira vez.
