# Alfa 0.2 — Tipos, constantes e fórmulas

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `4181fe6` (use `git log --oneline` para conferir e `git show 4181fe6` para ver o código como ficou).

## Objetivo

Ao fim desta versão o jogo tem o vocabulário de domínio (atributos, elementos, graus, clãs, pontos da história), um arquivo único com todas as constantes de balanceamento e as fórmulas puras de HP, chakra, redução de dano, esquiva, crítico, elemento, XP e chance de controle.

## Escopo

### Entra

- Tipos de domínio em `src/game/types.ts`: `ATTR_KEYS`, `ELEMENTS`, `GRADES`, `CLAN_IDS`, `JUTSU_CATEGORIES`, `PHASES`, `STORY_POINTS` e a interface `Modifiers`.
- Utilitários de atributos em `src/game/attributes.ts`: `ATTR_NAMES`, `CATEGORY_ATTR`, `emptyAttributes`, `addAttributes`, `sumAttributes`.
- As constantes de balanceamento em `src/game/Balance.ts` (`BALANCE`).
- As fórmulas puras em `src/game/formulas.ts`.
- O erro de regra tipado `RuleError` em `src/game/errors.ts`.
- Os testes das fórmulas em `tests/formulas.test.ts`.

### Fica de fora

- A fórmula de dano completa (Poder × maestria × atributo × elemento × bônus × redução × crítico × variação): ela precisa de efeitos, cargas e do `Rng`, e entra na Alfa 0.5 em `src/game/combat/damage.ts`. Esta versão só define as peças que ela usa.
- Os dados (jutsus, clãs, itens, inimigos): entram na Alfa 0.3; os tipos daqui são a base deles.
- Os valores finais de inimigo (`enemyGrades`): os números desta versão são os do DD v2 com as correções da spec; a calibração pelo simulador muda alguns deles na Alfa 0.8 (commit `e4db64a`).
- As chaves de `BALANCE` que só existem quando há quem as use: `damage.minDamage` entra na Alfa 0.5, `ai` na Alfa 0.6, `run.eliteForks` e `xp.bossMultDefault` na Alfa 0.7.

## Passo a passo

### Passo 1 — `Balance.ts` como fonte única de números

**O quê**: crie `src/game/Balance.ts` exportando o objeto `BALANCE`, agrupado por assunto: `attributes`, `hp`, `chakra`, `damage`, `power`, `defense`, `dodge`, `crit`, `control`, `mastery`, `xp`, `enemyGrades`, `rewards`, `shop` e outros. Exemplos do que vive ali: o divisor de atributo no dano, `damage.attrDivisor` = 40<!-- fact: BALANCE.damage.attrDivisor=40 -->; o teto de esquiva, `dodge.capPct` = 40<!-- fact: BALANCE.dodge.capPct=40 --> (por cento); o teto de crítico, `crit.capPct` = 55<!-- fact: BALANCE.crit.capPct=55 --> (por cento); o teto da redução pela Defesa, `defense.cap` = 0.6<!-- fact: BALANCE.defense.cap=0.6 -->; e o teto da redução somada com efeitos, `defense.totalCap` = 0.75<!-- fact: BALANCE.defense.totalCap=0.75 -->. O resto do código importa `BALANCE` (em geral como `B`) e nunca escreve um número de regra solto.

**Por quê**: **balancear** um jogo é ajustar números até ele ficar justo e divertido: o chefe não pode ser impossível nem trivial, nenhum clã pode ser sempre melhor. Esse ajuste é feito por tentativa e erro, muitas vezes (aqui, com o simulador da Alfa 0.8). Se os números estiverem espalhados pelo código, cada tentativa exige caçá-los, e é fácil mudar um e esquecer a cópia em outro arquivo. Com uma fonte única, ajustar é editar um arquivo e rodar `npm run sim:check`. Os comentários do próprio arquivo registram a origem de cada valor (seção do DD v2 ou correção da spec, como a C6 no HP do Haku), o que deixa a calibração rastreável em `docs/balance-log.md`. A regra está nas restrições globais do Plano 1 (`docs/superpowers/plans/2026-10-04-plano-1-motor.md`): toda constante numérica de balanceamento vive em `Balance.ts`, sem número mágico de balanceamento em outros arquivos.

**Alternativas**: constantes espalhadas perto de quem usa (`const CRIT_CAP = 0.55` dentro de `formulas.ts`) deixam cada arquivo autocontido, mas obrigam a abrir vários arquivos para ver o balanceamento inteiro, e o simulador não teria um lugar único para conferir. Um arquivo JSON externo permitiria editar sem recompilar, mas perde os tipos e os comentários de origem; como o jogo é estático e todo valor passa pelos testes, o objeto TypeScript é mais seguro.

**Riscos e armadilhas**: o risco real é o número mágico que escapa. O histórico tem dois casos: o robô do simulador tinha `BOT_TRANSFORM_MIN_CHAKRA = 20` escrito em `src/game/sim/bot.ts`, e a correção `6b09742` passou a ler o custo da transformação dos dados (`activationCost` e `upkeepPerTurn`); e testes que fixavam `damageMult: 0.6` e `hpMult` `1.3`/`1.5` quebraram quando a calibração mudou os graus, até o commit `5c0e7d4` fazê-los ler `BALANCE.enemyGrades`. Outra armadilha é a constante que existe mas ninguém lê: os poderes por grau em `power` (D a S) são só referência do DD v2, e a revisão final (`662d506`) acrescentou um comentário avisando, porque os poderes reais vivem em `src/data/jutsus.ts`. Por fim, cuidado com a unidade: `dodge` e `crit` guardam porcentagens (`capPct: 40`), enquanto `defense` guarda frações (`cap: 0.6`); as fórmulas convertem, e misturar as duas escalas dá chance de 4000%.

### Passo 2 — Fórmulas puras

**O quê**: escreva `src/game/formulas.ts` com funções que recebem números e devolvem números, sem sortear nada: `expectedPoints(nível)` (os pontos de atributo esperados num nível, P(N)); `maxHp(hp, nível, mult)` = `(80 + 4·HP + 6·nível) × mult`; `maxChakra(int, nível)` = `30 + 4·nível + Int`; `chakraRegen(int)` = `2 + ⌊Int/8⌋`; `defenseReduction(def)` = `mín(60%, Def/(Def+50))`; `totalReduction(def, bônus)` com teto de 75%; `dodgeChance(velAlvo, velAtacante, bônus)` com piso 0 e teto 40%; `critChance(crit, bônus)` = `mín(55%, 50·C/(C+60) + bônus)`; `elementBeats` e `elementMultiplier` para a roda Fogo → Vento → Raio → Terra → Água → Fogo; `xpToNext` e `xpForCommon`; `controlChance` e `effectChance`. Os atributos e a lista de categorias ficam em `src/game/attributes.ts`, com `CATEGORY_ATTR` dizendo qual atributo escala cada categoria de jutsu (Taijutsu usa `tai`, Fuinjutsu usa `int`).

**Por quê**: uma **função pura** devolve sempre o mesmo resultado para a mesma entrada e não mexe em nada fora dela. Isso permite testar cada regra sozinha, com uma linha (`expect(maxHp(7, 1)).toBe(114)`), sem montar uma batalha. O sorteio fica de fora de propósito: a fórmula diz que a chance de esquiva é 0,04; quem joga o dado é o combate, com o `Rng` da Alfa 0.1. Os **tetos** são decisão de jogo: num jogo de turnos, cada ação é uma troca de golpes. Se a esquiva pudesse chegar a 100%, um personagem rápido o bastante nunca seria atingido e a luta perderia o sentido; com teto de 40%, Velocidade alta ajuda muito, mas o inimigo ainda acerta a maioria dos golpes. O mesmo vale para o crítico (55%), que usa uma curva assintótica (`C/(C+60)`): cada ponto de Crítico vale menos que o anterior, então despejar todos os pontos num atributo só deixa de compensar.

**Alternativas**: métodos dentro de uma classe `Character` (`personagem.maxHp()`) aproximariam dado e regra, mas obrigariam a construir um personagem inteiro para testar uma conta, e o inimigo (que não é `Character`) teria de duplicar a fórmula. Tabelas de valores pré-calculados (HP por nível) seriam mais fáceis de ler para quem desenha o jogo, mas não acompanham atributos e multiplicadores de clã.

**Riscos e armadilhas**: as funções devolvem chance como **fração** (0..1), mas as constantes de esquiva e crítico estão em porcentagem; a conversão (`/ 100`) está dentro de cada função e não pode ser duplicada por quem chama. O teto da esquiva é aplicado duas vezes de propósito: uma na parte vinda da Velocidade e outra depois de somar o bônus, para que um buff de esquiva não fure os 40%. Arredondamento importa: `maxHp` arredonda depois do multiplicador do clã (`Math.round` de 114 × 1,1 dá 125 no teste do Uzumaki); sem esse arredondamento o HP máximo viraria um número quebrado e a barra de vida mostraria casas decimais. Por fim, o bônus é somado depois do piso: um bônus negativo de esquiva ou de crítico levaria a chance abaixo de zero (ver "Problemas conhecidos").

### Passo 3 — `RuleError` com `code`

**O quê**: crie em `src/game/errors.ts` a classe `RuleError extends Error` com um campo `code` estável (`'noChakra'`, `'notYourTurn'`, `'invalidAllocation'`...) além da mensagem. Toda ação inválida do jogador lança `RuleError`; qualquer outro erro é tratado como defeito do programa.

**Por quê**: o motor precisa separar duas situações. Uma é o jogador tentar algo que a regra não permite (usar um jutsu sem chakra): isso é normal e deve virar um aviso na tela. A outra é um bug (um campo `undefined`): isso deve aparecer como erro. Com uma classe própria, quem chama distingue as duas com `instanceof RuleError`, e o `code` é um identificador que não muda quando o texto da mensagem é reescrito. Os testes usam o `code` (`tests/battle.test.ts` confere `'noChakra'` e `'onlyKai'`), e a interface pode escolher a mensagem por ele. Na Beta 0.9.0 o `GameStore` (`src/store/GameStore.ts`) passou a fazer exatamente essa separação: `RuleError` vira aviso e qualquer outro erro leva à tela de erro.

**Alternativas**: lançar `Error` genérico com mensagem obrigaria a interface a comparar textos para saber o que aconteceu, e um teste quebraria a cada revisão de texto. Devolver um objeto de resultado (`{ ok: false, code }`) em vez de lançar evitaria `try/catch`, mas cada função do motor teria de propagar o resultado à mão por várias camadas.

**Riscos e armadilhas**: o `code` só é útil se for estável; renomear `'noChakra'` quebra os testes e qualquer tradução que dependa dele. Na prática, o `GameStore` mostra hoje o `message` do `RuleError` como aviso (`handleError`), então a mensagem precisa estar em pt-BR já no motor. Outro risco é usar `RuleError` para defeito do programa: o erro viraria um aviso amarelo e o jogo seguiria num estado inconsistente; o motor só usa `RuleError` para ação do jogador ou dado de entrada inválido.

## Critérios de conclusão

- `npx vitest run tests/formulas.test.ts` passa.
- `npm run typecheck` termina sem erros.
- As constantes de regra de `src/game/formulas.ts` vêm todas de `B.` (o `BALANCE`); os únicos literais são conversões de unidade (`/ 100`) e o `1` das somas `(1 + ...)`.

## Testes

- `tests/formulas.test.ts`: prova as fórmulas contra os números da tabela A.1 do DD v2 (HP máximo, inclusive com o multiplicador do Uzumaki), o chakra máximo e a regeneração, a redução pela Defesa com os tetos de 60% e 75%, a curva e o teto do crítico, o piso e o teto da esquiva (inclusive com bônus), a roda elemental nos dois sentidos e com elemento nulo, a XP por nível e por inimigo, P(N), a chance de controle (ilusão, maestria, chefe, teto de 85%) e a chance de efeito comum. Também prova que `addAttributes` não muta a entrada.

## Patch log

### Adicionado

- Tipos de domínio em `src/game/types.ts` e utilitários em `src/game/attributes.ts`.
- `BALANCE` em `src/game/Balance.ts`, a fonte única das constantes.
- Fórmulas puras em `src/game/formulas.ts`.
- `RuleError` com `code` em `src/game/errors.ts`.
- Testes em `tests/formulas.test.ts`.

### Alterado

Nada nesta versão.

### Corrigido

Nada nesta versão.

### Removido

Nada nesta versão.

### Problemas conhecidos

- `dodgeChance` e `critChance` não têm piso em 0 depois de somar o bônus: um bônus negativo produziria chance negativa. Não afeta o MVP, porque nenhum dado dá bônus negativo de esquiva ou de crítico.
