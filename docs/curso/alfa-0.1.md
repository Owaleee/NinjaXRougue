# Alfa 0.1 — Projeto e RNG com semente

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `6e0b7ec` (use `git log --oneline` para conferir e `git show 6e0b7ec` para ver o código como ficou).

## Objetivo

Ao fim desta versão o projeto tem um TypeScript estrito com Vitest funcionando e um gerador de números aleatórios com semente (`Rng`), a única fonte de sorte que o motor do jogo vai usar.

## Escopo

### Entra

- Estrutura do projeto: `package.json` (scripts `test`, `typecheck`, `build`, `sim`), `tsconfig.json` (modo `strict`) e `vite.config.ts` (nesta versão, só a configuração do Vitest).
- O gerador com semente, classe `Rng` em `src/game/Rng.ts`: `next`, `range`, `int`, `chance`, `pick`, `shuffle`, o getter `state` e `Rng.fromState`.
- Os testes de determinismo em `tests/rng.test.ts`.

### Fica de fora

- Qualquer regra de jogo (atributos, fórmulas, dados): começa na Alfa 0.2, porque toda regra que sorteia algo depende do `Rng` pronto e testado.
- Phaser, DOM e a configuração de build do jogo no `vite.config.ts`: entram na Beta 0.9.0 (commit `0d07169`), quando existe uma interface para construir. Até lá o Vite só serve de configuração para o Vitest.
- O campo `engines` (Node 22) no `package.json`: entrou depois, na 1.0 (commit `5aa63f0`).

## Passo a passo

### Passo 1 — Projeto TypeScript estrito com Vitest

**O quê**: crie o `package.json` com `"type": "module"` e os scripts `test` (`vitest run`), `typecheck` (`tsc --noEmit`) e `build`; o `tsconfig.json` com `"strict": true`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `isolatedModules` e `"noEmit": true` (quem gera JavaScript é o Vite/tsx, o `tsc` só confere tipos); e o `vite.config.ts` com `test.include: ['tests/**/*.test.ts']`. As pastas são `src/` (código), `tests/` (testes) e `tools/` (scripts de linha de comando, como o simulador).

**Por quê**: a parte central de um jogo como este é o **motor de regras**: o código que decide quanto dano um golpe causa, quem age primeiro, quando um jutsu é aprendido. É código de regra pura, sem tela, e um erro de regra raramente quebra com exceção: ele só deixa o jogo injusto em silêncio (um jutsu que custa `undefined` de chakra vira `NaN` e o jogador nunca fica sem chakra). Com `strict`, o TypeScript recusa `null` onde se espera número, parâmetro sem tipo e `switch` que esquece um caso, e pega muito desses erros antes de rodar. O Vitest roda os testes direto em TypeScript, sem etapa de compilação, e usa a mesma configuração do Vite que a interface vai usar na Beta 0.9.0.

**Alternativas**: JavaScript puro com JSDoc seria mais rápido de começar, mas o motor vai ter dezenas de estruturas (combatente, efeito, jutsu, run) que se cruzam, e sem o compilador cada renomeação de campo vira caça manual. Jest no lugar do Vitest também funcionaria, mas exigiria configurar a transformação de TypeScript e ESM à parte; com Vitest a configuração é a do próprio Vite.

**Riscos e armadilhas**: `strict` não liga `noUncheckedIndexedAccess`, e este projeto não liga essa opção. Sem ela, `items[i]` e `JUTSUS['id']` têm tipo `T` mesmo quando o índice não existe e o valor real é `undefined`; o compilador não avisa. Por isso o código usa `as T` e `!` em pontos onde a existência foi garantida à mão (por exemplo, o `pick` de `src/game/Rng.ts` confere a lista vazia antes de indexar), e cada `!` é uma promessa que o compilador não confere. O histórico tem um caso real: na revisão final do Plano 1 (commit `662d506`), `createCharacter` em `src/game/progression/character.ts` passou a recusar um `titleId` inexistente com `RuleError('unknownTitle')`, porque `TITLES[id]` desconhecido era tratado como se existisse. Regra prática: todo acesso por id que vem de fora (save, interface) precisa de conferência explícita.

### Passo 2 — Um gerador de números aleatórios com semente (`Rng`)

**O quê**: escreva a classe `Rng` em `src/game/Rng.ts`. O construtor recebe uma **semente** (um inteiro) e guarda um único inteiro de 32 bits como estado (`this.s = seed >>> 0`). `next()` avança o estado com o algoritmo `mulberry32` e devolve um número em `[0, 1)`. Em cima de `next()` vêm os utilitários que o jogo usa: `range(min, max)`, `int(min, max)` (inclusivo nas duas pontas), `chance(p)` (verdadeiro com probabilidade `p`), `pick(lista)` e `shuffle(lista)` (Fisher-Yates sobre uma cópia). O getter `state` expõe o estado e `Rng.fromState(estado)` recria um gerador exatamente do ponto em que outro parou.

**Por quê**: jogos sorteiam o tempo todo: se o golpe acerta, se é crítico, quanto dano varia, qual inimigo aparece, o que a loja vende. Um **RNG** (do inglês *random number generator*, gerador de números aleatórios) de computador não é aleatório de verdade: é uma fórmula que, a partir de um número inicial, produz uma sequência que *parece* aleatória. Esse número inicial é a **semente**. A consequência é o que importa para o jogo: **mesma semente, mesma sequência, mesmo jogo**. `Math.random()` também é uma fórmula desse tipo, mas a semente é escondida e não pode ser escolhida nem salva. Por isso `Math.random` é proibido no motor (`src/game/**`), e o motivo é triplo:
- **testes**: um teste de combate com semente fixa dá sempre o mesmo resultado, então pode afirmar números exatos;
- **bugs reproduzíveis**: guardar a semente de uma run com problema basta para repetir a run inteira;
- **anti save-scum**: "save-scum" é recarregar o jogo até a sorte mudar. Como o estado do `Rng` é salvo junto com a run, recarregar no meio de uma luta repete os mesmos sorteios em vez de virar roleta.
O `mulberry32` foi escolhido por ser curto (seis linhas), rápido e ter um estado de um único inteiro, trivial de salvar em JSON.

**Alternativas**: a biblioteca `seedrandom` oferece vários algoritmos com semente e é bem testada, mas acrescenta uma dependência de runtime para algo que cabe em seis linhas, e seu estado é um objeto, não um número. Algoritmos de qualidade estatística maior (xoshiro128, PCG) têm estado de 128 bits ou mais; para sortear golpes e lojas a qualidade do `mulberry32` sobra, e o estado de 32 bits simplifica o save. Passar `Math.random` por injeção de dependência resolveria os testes, mas não o replay nem o save-scum.

**Riscos e armadilhas**: o estado precisa ser salvo e restaurado como **número**, e cada função que sorteia precisa devolver o estado novo. O ciclo da run, escrito na Alfa 0.7 (`src/game/run/runManager.ts`), segue o padrão "recria com `Rng.fromState(r.rngState)`, sorteia, grava `r.rngState = rng.state`"; esquecer a última linha faz o próximo encontro repetir os sorteios do anterior. O anti save-scum depende disso: `startEncounter` guarda `encounterStart.rngState` antes da luta. Outra armadilha é o `>>> 0` (no construtor e em `next()`): ele mantém o estado sempre como inteiro sem sinal de 32 bits. Sem ele, `this.s + 0x6d2b79f5` cresceria a cada sorteio, passaria do limite de precisão dos números de JavaScript (2⁵³) e a sequência deixaria de ser a mesma entre execuções e entre salvar e carregar. Por fim, `pick` lança erro em lista vazia em vez de devolver `undefined` em silêncio, porque um inimigo `undefined` só quebraria muitas linhas depois.

### Passo 3 — Testes de determinismo

**O quê**: escreva `tests/rng.test.ts` com seis testes: a mesma semente gera a mesma sequência de 10 números; sementes diferentes geram primeiros números diferentes; 5000 valores ficam em `[0, 1)`; um gerador recriado com `Rng.fromState(a.state)` continua a sequência de `a`; `int(1, 3)` em 2000 sorteios produz exatamente `{1, 2, 3}`; e `pick([])` lança erro enquanto `shuffle` não altera a lista original.

**Por quê**: tudo o que vem depois (combate, loja, simulador, save) assume que o `Rng` é determinístico e restaurável. Se essa base falhar, os testes das versões seguintes ficam instáveis (passam numa execução e falham na outra) e o anti save-scum deixa de funcionar sem nenhum aviso. O teste de `fromState` é o contrato do save: é ele que garante que salvar e carregar no meio de uma run não muda o futuro. O teste dos limites de `int` pega o erro clássico de "um a mais ou um a menos" (`max - min` em vez de `max - min + 1`), que faria o último valor nunca sair.

**Alternativas**: um teste de "valores fixos" (`new Rng(42).next()` é igual a um número literal) congelaria o algoritmo e pegaria uma troca acidental de constante do `mulberry32`; não foi escrito nesta versão (ver "Problemas conhecidos"). Testes estatísticos (qui-quadrado sobre a distribuição) provariam a uniformidade, mas são lentos e frágeis para um jogo.

**Riscos e armadilhas**: o teste usa `[...seen].sort()` e `[...shuffled].sort()` para comparar números. Em JavaScript, `sort()` sem função de comparação ordena como **texto**: `[10, 2, 1].sort()` dá `[1, 10, 2]`. Funciona aqui só porque os valores têm um dígito; com listas de 10 ou mais elementos o teste quebraria ou, pior, compararia a ordem errada. A forma segura é `sort((a, b) => a - b)`. O problema foi registrado como pendência menor e adiada na revisão do Plano 1 e continua no arquivo. Outra armadilha: o teste "sementes diferentes" compara só o primeiro número de duas sementes; ele não prova que as sequências inteiras diferem, só que o gerador não ignora a semente.

## Critérios de conclusão

- `npx vitest run tests/rng.test.ts` passa (6 testes).
- `npm run typecheck` termina sem erros.
- Nenhum `Math.random` em `src/game/`: `grep -rn "Math.random" src/game` só encontra o comentário de `src/game/Rng.ts`.

## Testes

- `tests/rng.test.ts`: prova que o `Rng` é determinístico (mesma semente, mesma sequência), que a semente é usada, que `next()` fica em `[0, 1)`, que `fromState` restaura a sequência exatamente (a base do save e do anti save-scum), que `int` é inclusivo nas duas pontas e que `pick`/`shuffle` tratam lista vazia e não mutam a entrada.

## Patch log

### Adicionado

- Estrutura do projeto: `package.json`, `tsconfig.json` (modo estrito) e `vite.config.ts` com o Vitest.
- `Rng` com semente (`mulberry32`) em `src/game/Rng.ts`, com estado salvável (`state`, `fromState`).
- Testes de determinismo em `tests/rng.test.ts`.

### Alterado

Nada nesta versão.

### Corrigido

Nada nesta versão.

### Removido

Nada nesta versão.

### Problemas conhecidos

- Os testes não fixam valores do `mulberry32` (nenhum teste compara `new Rng(semente).next()` com um número literal): uma mudança acidental numa constante do algoritmo passaria nos testes, mas mudaria todas as runs salvas e todas as sementes registradas.
- `tests/rng.test.ts` ordena números com `sort()` sem comparador (ordem de texto); funciona só porque os valores têm um dígito.
