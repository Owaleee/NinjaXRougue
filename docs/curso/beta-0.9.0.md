# Beta 0.9.0 — Casca da interface e GameStore

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `0d07169`, `593aeca`, `ff7bc45`, `cbb351a`, `c8b9b93` e `1dfd7cd` (use `git log --oneline` para conferir e `git show <sha>` para ver o código como ficou).

## Objetivo

Ao fim desta versão o projeto tem a casca de um app de navegador (Vite, Phaser instalado, estilos e textos em pt-BR) e, entre o motor e as futuras telas, o `GameStore`: a fonte única da verdade que recebe comandos, chama o motor, salva, registra o fim da run e publica estado e eventos, junto com as funções puras que as telas vão usar para montar números e o log de batalha.

## Escopo

### Entra

- A página e os estilos: `index.html` (só um `<div id="app">` e o módulo de entrada), `src/styles.css` (tokens de cor e tamanho em variáveis CSS) e `src/main.ts`, que nesta versão é provisório e só escreve o título do jogo na página.
- O dicionário de textos em `src/i18n/pt-BR.ts`: o objeto `PT_BR`, o tipo `I18nKey` e as funções `t`, `pct` e `num`.
- A formatação do log de batalha em `src/ui-dom/view/log.ts` (`formatEvent`).
- Os presets de distribuição de pontos em `src/game/progression/presets.ts` (`PRESET_WEIGHTS`, `presetAllocation`).
- Os derivados de tela em `src/ui-dom/view/derived.ts`: `ninjaPower`, `fightingStyle`, `previewCharacter`, `creationPreview`, `jutsuGoals`, `combatantView` e `jutsuButtons`.
- O `GameStore` em `src/store/GameStore.ts`, com o tipo `UiState`.
- O armazenamento de mentira e os cenários de teste em `tests/ui/memoryStore.ts`, e os testes em `tests/ui/i18n.test.ts`, `tests/ui/log.test.ts`, `tests/ui/presets.test.ts`, `tests/ui/derived.test.ts`, `tests/ui/store.test.ts` e `tests/ui/store-battle.test.ts`.
- A dependência `phaser` no `package.json` e a configuração de build em `vite.config.ts` (`base: './'`, para o `dist/` abrir de qualquer pasta).

### Fica de fora

- As telas (menu, criação, mapa, resultado, preparação, Ficha, Histórico, Enciclopédia, títulos) e o `App` que as monta: Beta 0.9.1. É lá também que `src/main.ts` passa a criar o `GameStore` com o `localStorage`, o relógio e a semente de verdade (commit `5425a49`).
- A arena da batalha em Phaser e o animador que trava e destrava o store: Beta 0.9.2. Nesta versão o Phaser só é instalado.
- Arte oficial: o MVP usa só placeholders (spec §10).
- Outros idiomas: só existe pt-BR; a estrutura do dicionário permite acrescentar outro sem mudar as telas.

## Passo a passo

### Passo 1 — Camadas: motor puro, GameStore, telas

**O quê**: a aplicação é montada em três camadas. Embaixo, o motor (`src/game/**`), puro, sem `window`, `document`, `Math.random` nem `Date.now`, construído nas Alfas. No meio, o `GameStore` (`src/store/GameStore.ts`), que recebe pelo construtor as dependências do mundo real (`StoreDeps`: `storage`, `now`, `newSeed` e, opcional, `validateData`). Em cima, as telas da Beta 0.9.1, que só leem `store.state`, chamam métodos do store e se inscrevem em `subscribe`. O único arquivo que toca no navegador de verdade é `src/main.ts`: na Beta 0.9.1 ele escolhe o `localStorage` (ou um `Map` em memória, se o navegador bloquear), passa `Date.now` como relógio e sorteia a semente com `crypto.getRandomValues`. Nos testes, `tests/ui/memoryStore.ts` faz o mesmo papel com um `MemoryStore` (que pode simular cota estourada com `failWrites` ou `failKeys`), um relógio que avança 1 ms por chamada e sementes previsíveis.

**Por quê**: **fonte única da verdade** quer dizer que existe um só lugar com o estado atual da aplicação, e todo o resto lê dali. Sem isso, a tela do mapa e o HUD da batalha poderiam ter cópias diferentes do HP do jogador e mostrar números que não batem. O fluxo é sempre o mesmo: a tela pede um comando, o store chama o motor, o motor devolve a run nova e os eventos, o store guarda, salva e avisa quem está inscrito. Injetar armazenamento, relógio e semente é o que deixa o store inteiro testável sem navegador: o teste de "recarregar no meio da luta" cria dois stores sobre o mesmo `MemoryStore`, sem abrir página nenhuma.

**Alternativas**: deixar cada tela chamar o motor e o save direto (sem store) é menos código no começo, mas espalha a regra "salvar depois de cada comando" e "registrar o fim da run" por todas as telas, e basta uma esquecer. Uma biblioteca de estado pronta (Redux, Zustand) resolveria a inscrição, mas acrescentaria uma dependência e um vocabulário (reducers, actions) para um app de uma tela por vez; a classe com `set` e `subscribe` cabe em poucas linhas. Um framework de componentes (React, Vue) traria a reatividade, mas o plano escolheu DOM puro com funções de tela re-renderizadas, e o Phaser já é a dependência pesada.

**Riscos e armadilhas**: a camada só é útil se ninguém a contornar. Uma tela que alterasse `store.state.run` direto mudaria o estado sem salvar e sem avisar os inscritos; por isso `state` é exposto como `Readonly<UiState>` e toda mudança passa pelo método privado `set`. O motor continuar puro depende de disciplina: só `src/main.ts` usa `localStorage`, relógio e sorteio de semente (as telas usam `document`, mas nunca essas três coisas); se um arquivo de `src/game/**` chamar `Date.now`, o simulador e os testes de determinismo deixam de reproduzir as runs. E `src/main.ts` só existe como casca nesta versão: quem testa a página no navegador ao fim da Beta 0.9.0 vê só o título.

### Passo 2 — i18n: toda string de interface num arquivo só

**O quê**: `src/i18n/pt-BR.ts` guarda todas as strings de **interface** num objeto `PT_BR` declarado `as const`, com chaves como `'notice.saveFailed'` e variáveis no formato `{nome}`. `t(chave, variáveis)` devolve o texto preenchido; uma variável não informada fica visível como `{n}` em vez de sumir. `pct` e `num` formatam porcentagem e número no padrão brasileiro (16,7% e 1.220). Nomes de conteúdo (jutsus, itens, inimigos) continuam nos dados de `src/data/`. `formatEvent`, em `src/ui-dom/view/log.ts`, converte cada `GameEvent` do motor numa linha do log (`LogLine`, com `kind` e `text`) usando essas chaves; eventos de bastidor, como a escolha de uma ação que não é ataque, não geram linha.

**Por quê**: **i18n** (de *internationalization*) é separar os textos do código. Mesmo com um idioma só, ter todos os textos num arquivo dá consistência (o mesmo aviso escrito do mesmo jeito em todo lugar) e permite revisar a escrita do jogo inteiro lendo um arquivo, sem caçar strings em dezenas de telas. O `as const` faz o TypeScript conhecer cada chave: `t('chave.errada')` vira erro de compilação, não texto quebrado na tela. No log, o texto sozinho diz o que aconteceu, inclusive crítico e vantagem elemental, porque a spec §10 proíbe passar informação só pela cor.

**Alternativas**: uma biblioteca de i18n (como i18next) traz plural, gênero e troca de idioma em tempo de execução, mas é muito mais do que um jogo com um idioma precisa. Strings literais nas telas são mais rápidas de escrever e mais difíceis de revisar e de manter iguais. Um arquivo JSON de textos perderia a checagem de chaves pelo TypeScript.

**Riscos e armadilhas**: o que mais escapa são os pedaços pequenos. Separadores como `' · '` e formatos de HUD ficaram escritos direto no código das telas e só foram para o dicionário depois: o separador no commit `2a4f2a7` (chave `format.dot`, Beta 0.9.1), os formatos do HUD de batalha no `95f4d50` (Beta 0.9.2) e o restante na revisão final do Plano 2 (`bec6a2e`). Plural é outra armadilha: o log escrevia "(1 turnos)" para um efeito com 1 turno restante até a Task 3 do Plano 3 (`597df55`) criar a chave `log.effectOnOne`. O teste `nenhuma chave tem texto vazio` pega a chave criada e esquecida.

### Passo 3 — O GameStore: comandos, salvamento e trava de animação

**O quê**: cada comando da run (`rest`, `fight`, `act`, `chooseReward`, `continueFromResult`, `allocate`, `buy`, `equipItem`, `useRareScroll`, `equipJutsu`, `setLoadout`) passa pelo método privado `step` e devolve `true` se foi aceito e `false` se não foi. `step` chama a função do motor; um `RuleError` vira um aviso (`notify`) e a run não muda; outro erro leva à tela de erro. Com a run nova, o store salva com `saveRun` ou, se a run acabou (`'dead'` ou `'victory'`), registra o fim **no mesmo comando**: `recordEnd` chama `recordRunEnd` (Alfa 0.7) e `finalizeStorage` grava a meta e só então apaga o save da run. Depois formata as linhas do log, enfileira em `swapQueue` os jutsus aprendidos com os slots cheios, guarda em `battleSnapshot` o quadro do HUD (com `lastFrame`, que mantém a luta visível depois de o motor descartar a batalha) e publica tudo num `set`. Se há eventos e uma cena de animação inscrita em `onBattleEvents`, o store liga `locked`, entrega os eventos e espera `animationsDone()`; enquanto `locked` está ligado, `step` recusa qualquer comando. `boot()` valida os dados do jogo, lê a meta e a run (avisos de save inválido viram `notices`) e refinaliza uma run encerrada cuja meta não chegou a ser gravada.

**Por quê**: devolver `true`/`false` deixa a tela decidir o que fazer (fechar um modal, por exemplo) sem conhecer a regra: quem decide se a ação vale é o motor. Registrar o fim da run no mesmo comando que a encerrou garante que fechar a aba durante a animação da morte não perde a run: ela já está no Histórico e já saiu do save (Review Focus 3 do Plano 2). A **trava de animação** resolve um problema típico de jogo: a regra resolve um turno inteiro num instante, mas a tela leva alguns segundos para mostrar golpe por golpe. Se o jogador aperta `A` três vezes durante a animação, só a primeira tecla vale; as outras chegam com `locked` ligado e são ignoradas, sem erro e sem ação dupla (Review Focus 2).

**Alternativas**: comandos que lançam exceção para a tela tratar obrigariam cada botão a ter seu próprio `try`. Registrar a meta só quando a animação da morte termina deixa a run sem registro se a aba fechar antes. Enfileirar as teclas apertadas durante a animação, em vez de ignorá-las, faria o jogador executar ações que já não queria quando a animação acabasse.

**Riscos e armadilhas**: a ordem de gravação no fim da run é a armadilha central, e `finalizeStorage` usa **dois `try` separados** de propósito. Se gravar a meta e apagar a run ficassem no mesmo `try`, uma falha ao gravar a meta (cota estourada) poderia ser seguida da run apagada, e a run sumiria sem entrar no Histórico. Com os dois separados, a run só é apagada se a meta foi gravada; senão o store salva a run encerrada, e o próximo `boot` a refinaliza, o que só é seguro porque `recordRunEnd` virou idempotente no `662d506` (testes `falha só na meta: a run continua salva e o boot seguinte refinaliza` e `run morta no save com meta que já a registrou: boot não duplica`). A trava também precisa ser respeitada fora de `step`: o `c8b9b93` fez `abandonRun` e `resolveSwap` a respeitarem e fez `startNewRun` e `toMenu` a zerarem, senão uma animação abandonada no meio deixaria a run seguinte nascer travada (teste `startNewRun depois de uma animação abandonada não nasce travado`). E sem cena inscrita (nos testes, ou sem WebGL) nada trava, para o jogo nunca ficar preso esperando uma animação que não vai acontecer.

### Passo 4 — Derivados de tela puros

**O quê**: `src/ui-dom/view/derived.ts` calcula os números que as telas mostram mas que não são regra do jogo. `ninjaPower` é o Poder Ninja do DD v2 §3, um número informativo que nunca entra em fórmula. `fightingStyle` dá o rótulo da Ficha (o atributo mais investido, se tiver pelo menos 30% do investido). `previewCharacter` e `creationPreview` montam a prévia da criação para qualquer distribuição parcial de pontos: HP, chakra, regeneração, crítico, redução de dano, Poder Ninja e os jutsus que a build libera. `jutsuGoals` lista os jutsus mais perto de liberar só por atributo base, que a tela de resultado mostra como "Faltam 2 de Ninjutsu para Bola de Fogo Básica". `combatantView` e `jutsuButtons` montam o modelo do HUD de batalha (vitais, porcentagens efetivas, efeitos com turnos, custo real de cada jutsu, botões apagados sem chakra e só o Kai liberado sob Ilusão). Em `src/game/progression/presets.ts`, os presets Ninjutsu, Taijutsu e Equilibrado da criação reaproveitam `allocationByWeights` do robô do simulador.

**Por quê**: tudo isso é função pura, que recebe dados e devolve dados, e por isso é **testável sem DOM**: `tests/ui/derived.test.ts` confere a prévia da criação e o custo mostrado no botão sem montar tela nenhuma. As telas ficam finas (só formatam e desenham), e a mesma conta não é repetida em duas telas. Os derivados chamam as fórmulas do motor (`characterMaxHp`, `critChance`, `checkUnlocks`), então a prévia nunca discorda do que vai acontecer na run. Os presets existem porque builds espalhadas travam em Zabuza (correção C9 e Apêndice A.5): reaproveitar o algoritmo do robô faz os presets Ninjutsu e Taijutsu iguais às builds que o simulador mediu.

**Alternativas**: calcular os números dentro das funções de tela é o caminho mais curto, mas cada teste de "a prévia mostra 114 de HP" passaria a precisar de um DOM simulado. Guardar os derivados no `UiState` deixaria o store responsável por recalculá-los a cada mudança, mesmo para telas que não estão abertas. Escrever a prévia com uma fórmula própria, sem chamar o motor, arriscaria a tela mostrar um número e a batalha usar outro.

**Riscos e armadilhas**: a prévia da criação precisa de um personagem válido, e `createCharacter` exige exatamente os 10 pontos da criação; `previewCharacter` cria um com a distribuição completa e depois troca os atributos base pela distribuição parcial que o jogador está montando, então qualquer validação nova em `createCharacter` precisa ser conferida aqui. `jutsuGoals` tem de distinguir atributo base de efetivo, como a regra de desbloqueio da Alfa 0.3; o commit `742335d` (Beta 0.9.1) reforçou os testes disso e da junção das exigências ("2 de Ninjutsu e 1 de Velocidade"). E `ninjaPower` é informativo: usar o Poder Ninja para decidir algo de regra (dificuldade, recompensa) mudaria o balanceamento medido pelo simulador.

## Critérios de conclusão

- `npx vitest run tests/ui/store.test.ts tests/ui/store-battle.test.ts tests/ui/derived.test.ts` passa.
- `npx vitest run tests/ui/i18n.test.ts tests/ui/log.test.ts tests/ui/presets.test.ts` passa.
- `npm run build` termina sem erros e gera a pasta `dist/` com `index.html` e os arquivos de `assets/`.

## Testes

- `tests/ui/store.test.ts`: prova o boot (sem save, save de run corrompido com aviso e backup, dados do jogo inválidos levando à tela de erro), a run nova e a navegação (criar e salvar, parâmetros inválidos que viram aviso, não começar outra run por cima, pilha de `go`/`back`, continuar depois de recarregar), os comandos e erros (`RuleError` vira aviso, avisos dispensáveis, armazenamento cheio que avisa uma vez, abandonar registra no Histórico) e o fim de run com falha de armazenamento (meta que falha mantém a run salva para o boot refinalizar, boot que não duplica).
- `tests/ui/store-battle.test.ts`: prova o fluxo de batalha (log que começa do zero, trava até `animationsDone` ignorando ações repetidas, vitória que salva na fase `'result'`, recarregar no meio da luta volta ao RNG do início do encontro, morte registrada antes do fim da animação), a fila de troca de jutsu e as escolhas 1-de-3 em ordem com e sem animador (`1dfd7cd`), e a trava (`abandonRun` e `resolveSwap` ignorados, navegação adiada até `animationsDone`, run nova que não nasce travada).
- `tests/ui/derived.test.ts`: prova o Poder Ninja e o estilo de luta, a prévia da criação (derivados, jutsus liberados sem os de outro clã, multiplicador de HP do Uzumaki), as metas de jutsu e os modelos do HUD.
- `tests/ui/i18n.test.ts`, `tests/ui/log.test.ts` e `tests/ui/presets.test.ts`: provam a interpolação e a formatação brasileira, o texto do log que não depende da cor e os presets que somam 100% e respeitam o que já foi investido.

## Patch log

### Adicionado

- A casca do app: `index.html`, `src/styles.css`, `src/main.ts` provisório e a dependência `phaser`.
- O dicionário de textos em `src/i18n/pt-BR.ts` e o log de batalha em `src/ui-dom/view/log.ts`.
- Os presets em `src/game/progression/presets.ts` e os derivados de tela em `src/ui-dom/view/derived.ts`.
- O `GameStore` em `src/store/GameStore.ts`.
- O armazenamento de mentira em `tests/ui/memoryStore.ts` e os testes de `tests/ui/`.

### Alterado

- `src/main.ts` deixou de ser provisório na Beta 0.9.1 (`5425a49`), quando passou a montar o `App` e o `GameStore` com as dependências reais.
- A revisão final do Plano 2 (`bec6a2e`) fez `go`, `back` e `toMenu` respeitarem a trava na tela de batalha e levou erros de render e do animador para a tela de erro, sem deixar o jogo travado.
- A Task 3 do Plano 3 (`597df55`) impediu que a tela de erro fosse sobrescrita pela tela de batalha e criou o singular "1 turno" no log.

### Corrigido

- `abandonRun` e `resolveSwap` passaram a respeitar a trava, e `startNewRun` e `toMenu` passaram a zerá-la (`c8b9b93`).

### Removido

Nada nesta versão.

### Problemas conhecidos

- Nesta versão, `go` e `back` do store mudam de tela mesmo com uma luta em andamento; a tela de batalha não oferece esse caminho. A revisão final do Plano 2 (`bec6a2e`) bloqueou a navegação só enquanto a batalha está animando (`navBlocked`); fora da animação o store continua aceitando.
- Os separadores e formatos de HUD ainda escritos nas telas só foram para `src/i18n/pt-BR.ts` nas Betas seguintes (ver Passo 2).
- O pacote gerado pelo `npm run build` passa de 1,6 MB por causa do Phaser; para o Vite não avisar a cada build, o limite de aviso foi elevado para 2000 kB em `vite.config.ts`.
