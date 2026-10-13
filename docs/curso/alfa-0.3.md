# Alfa 0.3 — Dados do jogo e validação

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `13217f7` (use `git log --oneline` para conferir e `git show 13217f7` para ver o código como ficou).

## Objetivo

Ao fim desta versão o jogo tem todo o conteúdo da Saga da Onda (jutsus, efeitos, clãs, itens, inimigos, mapa de 26 encontros e títulos) escrito como dados tipados, e uma validação que recusa dados com erro de formato ou com referência para um id que não existe.

## Escopo

### Entra

- Pontos da história e seus nomes em `src/data/story.ts` (`STORY_NAMES`, `storyIndex`).
- Efeitos (buff, debuff, controle, dano contínuo, transformação) em `src/data/effects.ts`.
- Jutsus jogáveis do MVP, jutsus de fases futuras (só para a Enciclopédia) e golpes de inimigo em `src/data/jutsus.ts`.
- Clãs (Uchiha, Uzumaki e Sem clã jogáveis; os demais como dados de fases futuras) em `src/data/clans.ts`.
- Itens (consumíveis, armas, armaduras, Pergaminho Raro) em `src/data/items.ts`.
- Arquétipos, inimigos e a tabela de elites (`ELITE_OF`) em `src/data/enemies.ts`.
- O mapa da Saga da Onda (`SAGA_ONDA`) em `src/data/saga.ts`.
- Títulos com condição como dado em `src/data/titles.ts`.
- A validação com Zod e referências cruzadas em `src/data/validate.ts` (`validateGameData`, `assertGameData`).
- Os testes dos dados em `tests/data.test.ts`.

### Fica de fora

- O código que **aplica** a regra de desbloqueio: os campos ficam prontos aqui, mas `meetsRequirements` e `checkUnlocks` entram na Alfa 0.4, em `src/game/progression/unlock.ts`, junto com o personagem.
- O código que interpreta efeitos, cargas e transformações: Alfa 0.5 (`src/game/effects/EffectSystem.ts`).
- A geração de inimigos a partir dos arquétipos e do grau: Alfa 0.6 (`src/game/combat/enemyFactory.ts`).
- Chamar `assertGameData` ao abrir o jogo: entra na Beta 0.9.0, no boot do `GameStore` (`src/store/GameStore.ts`). Nesta versão a validação só roda nos testes.
- Conteúdo da Fase 2 em diante (Exame Chunin, clãs Hyuuga, Nara, Akimichi e Aburame jogáveis): fora do MVP pela spec; esses jutsus existem como dados sem efeito mecânico, só para a Enciclopédia mostrar o que vem depois.

## Passo a passo

### Passo 1 — Conteúdo como dados tipados, regras como código

**O quê**: descreva cada coisa do jogo como um objeto com interface própria. `JutsuDef` em `src/data/jutsus.ts` tem `id`, `category`, `element`, `clan`, `requires`, `prereq`, `minStory`, `grade`, `cost`, `power` (ou `null` para jutsu sem dano) e uma lista de `effects` que aponta para ids de `src/data/effects.ts`. `EffectDef` usa um único formato para buff, debuff, controle, dano contínuo e transformação, com `mods` (os modificadores de `src/game/types.ts`), `duration` e campos opcionais de carga. `TitleDef` guarda a condição como uma união discriminada (`{ kind: 'bossDefeated', enemyId: 'zabuza' }`, `{ kind: 'bossLowHp', maxHpPct: 0.1 }`). O mapa em `src/data/saga.ts` é gerado por `buildOndaNodes`: 12 comuns, Zabuza, 12 comuns, Haku, com três comuns por **nível de história** (o número que define a força do inimigo). Para cada lista há um índice por id (`JUTSUS`, `ITEMS`, `ENEMIES`, `TITLES`).

**Por quê**: um **roguelike** (o gênero deste jogo) é uma sequência de runs curtas em que o jogador morre, recomeça e vai descobrindo conteúdo; o valor do jogo cresce com a quantidade de jutsus, inimigos e títulos. Se cada jutsu fosse um bloco de código, todo jutsu novo exigiria mexer no combate e escrever testes de combate novos. Separando **o que existe** (dados) de **como funciona** (regras), um jutsu novo é uma linha em `JUTSU_LIST` que reaproveita efeitos e fórmulas já testados. É assim que o projeto já guarda os jutsus da Fase 2 e da Fase 3 sem uma linha de regra para eles, e é por isso que o comentário de `src/data/effects.ts` diz que Modo Sábio ou Bijuu no futuro serão só dados novos. Correções de design também ficam baratas: a C7 (Gogyou Fuuin geral, não exclusivo) e a C4 (Kunai com +2 de Crítico) do `docs/ANALISE.md` são edições de dado, sem mudança de regra.

**Alternativas**: um `if (jutsu.id === 'goukakyuu')` por jutsu dentro do combate é o caminho mais rápido para os primeiros cinco jutsus, mas espalha o conteúdo pelo motor, impede a Enciclopédia de listar requisitos sem duplicar informação e transforma cada ajuste de balanceamento numa mudança de código. Guardar os dados em arquivos JSON separaria ainda mais conteúdo e código, mas perderia a checagem de tipos em tempo de compilação e os atalhos como a função `future()` de `src/data/jutsus.ts`, que preenche os jutsus de fases futuras com efeito vazio.

**Riscos e armadilhas**: o tipo garante o formato, mas não garante que um id citado exista: `effectId: 'queimdura'` com erro de digitação compila, porque `effectId` é `string`. É esse buraco que o Passo 2 fecha. Outro risco são ids que chegam de fora dos dados, como o título escolhido na criação de personagem: na revisão final do Plano 1 (commit `662d506`), `createCharacter` passou a recusar `titleId` inexistente com `RuleError('unknownTitle')`, porque a validação dos dados não cobre o que vem do save ou da interface. Por fim, não confunda "grau" com "rank": o DD v2 usava "rank" para item e inimigo, e a correção C11 reserva "rank" para o posto do ninja; nos dados, a escala D..S é `grade`, com o comentário em `src/game/types.ts` avisando.

### Passo 2 — Validação com Zod e referências cruzadas

**O quê**: em `src/data/validate.ts`, defina esquemas Zod para jutsu, efeito, item e inimigo, montados a partir das mesmas listas `as const` de `src/game/types.ts` (`z.enum(ELEMENTS)`, `z.enum(GRADES)`), para que tipo e validação nunca divirjam. `validateGameData(dados)` devolve uma lista de problemas em texto (vazia significa dados válidos) e confere: o esquema de cada jutsu, efeito, item e inimigo (por exemplo, custo inteiro e não negativo, chance entre 0 e 1); ids duplicados em jutsus, efeitos, itens, inimigos e títulos; e as referências cruzadas: pré-requisito de jutsu existente, efeito de jutsu existente, golpe de inimigo existente, inimigo e chefe de cada nó da saga existentes, transformação e custos por jutsu de cada clã existentes, e chefe citado em título existente. `assertGameData` lança um `Error` com todos os problemas juntos.

**Por quê**: um erro de digitação num requisito não quebra nada na hora; ele faz um jutsu nunca ser aprendido, ou um inimigo travar a run no encontro 20, depois de meia hora de jogo. Validar ao carregar é **falhar cedo**: o problema aparece no primeiro teste (ou, a partir da Beta 0.9.0, ao abrir o jogo), com a mensagem dizendo qual id está errado, em vez de virar um bug silencioso que só um jogador encontra. Devolver a lista inteira, em vez de parar no primeiro problema, deixa corrigir tudo de uma vez. Como `validateGameData` recebe os dados por parâmetro (com `DEFAULT_DATA` como padrão), os testes conseguem passar dados quebrados de propósito e conferir que o erro é acusado.

**Alternativas**: validar só com os tipos do TypeScript não pega referência inexistente nem número fora da faixa. Escrever a validação à mão (`if (typeof j.cost !== 'number')`) dispensaria a dependência, mas seria longa e fácil de deixar desatualizada; o Zod já era a escolha da spec e é a única dependência de runtime do motor. Validar de forma preguiçosa, só quando o dado é usado, adiaria o erro para o meio da run, o oposto do objetivo.

**Riscos e armadilhas**: os esquemas são **parciais**, e é importante saber o que eles não cobrem. O esquema de efeito confere só `id`, `name`, `type` e `duration`; `mods`, `charge` e `chargeChance` passam sem conferência (a Alfa 0.5 registra que `chargeChance ?? 0` engole um dado ausente). Clãs, títulos e o mapa da saga não têm esquema Zod, só as referências listadas acima. `ELITE_OF` em `src/data/enemies.ts` não é conferido: um nome de elite errado só aparece quando a bifurcação sorteia aquele comum, como `RuleError('unknownEnemy')` de `createEnemy`. E ciclos de pré-requisito (A exige B, B exige A) não são detectados: os dois jutsus simplesmente nunca seriam aprendidos. O cuidado com o esquema e o tipo juntos é outro ponto: se um campo novo entra na interface `JutsuDef` e não entra no `JutsuSchema`, o Zod aceita o objeto e ignora o campo (o esquema não é `.strict()`), então o campo nunca é validado.

### Passo 3 — A regra fixa de desbloqueio nos dados

**O quê**: cada `JutsuDef` traz as quatro condições da regra fixa da spec §5 (`docs/superpowers/specs/2026-10-04-narutotxgame-mvp-design.md`): `requires` (atributos **base** mínimos, como `{ nin: 12 }`), `clan` (clã exclusivo ou `null` para jutsu geral), `minStory` (o ponto da história a partir do qual o jutsu existe, comparado pela posição em `STORY_POINTS` via `storyIndex` de `src/data/story.ts`) e `prereq` (outro jutsu que precisa já ter sido aprendido, ou `null`). Os golpes que só inimigos usam (`golpe_pesado`, `kubikiribouchou`, `senbon` e outros) levam `enemyOnly: true`, `requires: {}` e ficam na mesma lista para reaproveitar a resolução de golpe.

**Por quê**: a regra de jogo é que o jutsu é **aprendido automaticamente** no momento em que o personagem cumpre as quatro condições, e nenhuma outra fonte (escolha de recompensa, loja, chefe) dá jutsu. Isso faz a distribuição de atributos ser a decisão principal do jogador: colocar pontos em Ninjutsu é escolher rumo a Daitoppa e Kage Bunshin. Os requisitos olham o atributo **base** (o que o jogador distribuiu), e não o efetivo (com equipamento e buffs), porque senão vestir uma Katana por um turno ensinaria um jutsu para sempre, e trocar de equipamento viraria um truque para aprender tudo. O `minStory` amarra o conteúdo à narrativa: Suiryuudan, o dragão de água de Zabuza, só fica disponível em `onda_pos_zabuza`, depois de vencê-lo (o teste em `tests/data.test.ts` confere isso). O `enemyOnly` existe porque esses golpes não têm requisito e seriam aprendidos por qualquer personagem no primeiro nível se a regra não os excluísse; eles também ficam fora da Enciclopédia.

**Alternativas**: uma árvore de habilidades em que o jogador gasta pontos para comprar jutsus (comum em RPGs) daria mais controle, mas duplicaria a decisão (pontos de atributo e pontos de jutsu) e contrariaria o DD v2. Separar os golpes de inimigo numa lista própria evitaria o `enemyOnly`, mas obrigaria a resolução de golpe a procurar em duas listas e a duplicar os campos de dano.

**Riscos e armadilhas**: a regra depende de todos os pontos que mudam atributo base ou história chamarem a verificação (distribuir pontos, aplicar Pergaminho Raro, avançar a história, criar o personagem); esquecer um deles deixa o jogador cumprindo os requisitos sem aprender nada até o próximo gatilho. Isso é responsabilidade da Alfa 0.4, que implementa `meetsRequirements` com a exclusão de `enemyOnly` na primeira linha. Um `minStory` com valor fora de `STORY_POINTS` é recusado pelo esquema (`z.enum(STORY_POINTS)`), mas um `prereq` que aponta para um jutsu de clã diferente passa na validação e torna o jutsu inalcançável. Por fim, `requires` usa `Partial<Attributes>` com inteiros não negativos (`PartialAttrs` é `.strict()`), então uma chave de atributo com erro de digitação, como `{ ninj: 12 }`, é recusada.

## Critérios de conclusão

- `npx vitest run tests/data.test.ts` passa.
- `validateGameData()` devolve `[]` para os dados padrão (é o primeiro teste de `tests/data.test.ts`).
- `npm run typecheck` termina sem erros.

## Testes

- `tests/data.test.ts`: prova que os dados padrão passam no esquema e nas referências (`validateGameData` vazio e `assertGameData` sem lançar); que um pré-requisito inexistente, um efeito inexistente, um id duplicado e um custo negativo são acusados; que a Saga da Onda tem 26 nós com os níveis de história do Apêndice A.3 e os chefes Zabuza (nó 12, com Acampamento antes e avanço para `onda_pos_zabuza`) e Haku (nó 25); que os pesos de cada arquétipo de inimigo somam 100%; e que Gogyou Fuuin é geral e da F2 (correção C7) e Suiryuudan só fica disponível depois de Zabuza.

## Patch log

### Adicionado

- Conteúdo da Saga da Onda como dados: `src/data/story.ts`, `src/data/effects.ts`, `src/data/jutsus.ts`, `src/data/clans.ts`, `src/data/items.ts`, `src/data/enemies.ts`, `src/data/saga.ts` e `src/data/titles.ts`.
- Validação com Zod e referências cruzadas em `src/data/validate.ts`.
- Testes em `tests/data.test.ts`.

### Alterado

Nada nesta versão.

### Corrigido

Nada nesta versão.

### Removido

Nada nesta versão.

### Problemas conhecidos

- `ELITE_OF` não é validado: uma elite com id errado só falha quando a bifurcação do mapa a sorteia.
- Ciclos de pré-requisito entre jutsus não são detectados; os jutsus envolvidos ficariam inalcançáveis sem aviso.
- Clãs, títulos e o mapa da saga não têm esquema Zod (só as referências cruzadas), e o esquema de efeito não confere `mods`, `charge` nem `chargeChance`.
