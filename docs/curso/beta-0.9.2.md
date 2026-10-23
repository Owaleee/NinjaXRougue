# Beta 0.9.2 — Batalha em Phaser

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `9ab3025` e a correção de revisão `95f4d50` (use `git log --oneline` para conferir e `git show <sha>` para ver o código como ficou).

## Objetivo

Ao fim desta versão a batalha é jogável no navegador: o HUD em DOM mostra os dois lados, o log, os botões e os atalhos de teclado, e por baixo dele uma cena do Phaser anima, golpe por golpe, os eventos que o motor produziu, travando a entrada do jogador até a animação terminar.

## Escopo

### Entra

- A fila de animação sem Phaser em `src/scenes/animationQueue.ts`: `DURATIONS`, `FALLBACK_MARGIN_MS`, `stepsFor`, `waitStep` e a classe `AnimationQueue`.
- A arena em `src/scenes/BattleScene.ts` (placeholders: retângulos coloridos por elemento, nomes, números flutuantes, aura da transformação) e a cena de entrada `src/scenes/BootScene.ts`.
- `src/scenes/createGame.ts`, que cria o `Phaser.Game` dentro da camada do jogo e devolve um `BattleView` (`show`/`hide`) que acorda e adormece o loop.
- O HUD e os atalhos em `src/ui-dom/screens/BattleScreen.ts` (`BattleScreen`, `battleKeys`), registrados em `src/ui-dom/screens/index.ts`.
- Em `src/main.ts`, a criação do Phaser dentro de um `try`: sem WebGL nem canvas, o jogo segue jogável e mostra um aviso.
- Os testes `tests/ui/animation.test.ts` e `tests/ui/battle-hud.test.ts`.

### Fica de fora

- Arte, sprites, sons e efeitos de partículas: o MVP só usa placeholders (spec §10). O ponto onde o carregamento de arte entraria é a `BootScene`.
- Conferência visual no navegador (layout, cores, ritmo das animações): não há teste automático para isso; fica para o roteiro de conferência visual do fechamento do Plano 3, a ser seguido pelo usuário.
- O tratamento de um animador que lança exceção dentro do store: 1.0 (`bec6a2e`).
- Velocidade de animação configurável e "pular animação": fora do MVP.

## Passo a passo

### Passo 1 — O Phaser só desenha; o motor decide

**O quê**: a `BattleScene` (`src/scenes/BattleScene.ts`) não tem nenhuma regra. No `create`, ela se inscreve em `store.onBattleEvents` e recebe a lista de `GameEvent` que o motor produziu no comando (dano, esquiva, efeito aplicado, derrota...). Para cada evento, `animate` escolhe o desenho: avanço do atacante (`lunge`), tremida e piscada no alvo (`shake`, `flash`), número flutuante (`float`), aura vermelha da transformação (`setAura`), alvo apagado na derrota. Os combatentes são lidos de `run.battle` ou, depois do fim da luta, de `battleSnapshot`. Quando a fila esvazia, a cena chama `store.animationsDone()`. O HUD (`src/ui-dom/screens/BattleScreen.ts`) é DOM comum por cima do canvas e também só lê o estado. **Phaser** é uma biblioteca de jogos 2D para navegador: desenha num `canvas` com WebGL e oferece cenas, tweens (animação de uma propriedade de um valor a outro ao longo do tempo) e relógio próprio.

**Por quê**: quando o dano é decidido no motor, ele é testável sem navegador, reproduzível pela semente e o mesmo no simulador, no teste e na tela. Se a cena calculasse alguma coisa ("se o golpe é crítico, dobra"), haveria duas fontes de verdade, e a tela poderia mostrar um número que a regra não aplicou. Do ponto de vista de jogo, separar a **resolução** (o que aconteceu) da **apresentação** (como o jogador vê) é o que deixa a luta inteira ser resolvida num instante pelo motor e depois mostrada no ritmo que faz sentido para quem joga.

**Alternativas**: pôr a lógica da batalha numa cena do Phaser é o caminho de muitos tutoriais e funciona em jogos de ação, onde a física e o tempo real decidem; num jogo por turnos isso amarraria a regra ao `canvas` e mataria o simulador headless da Alfa 0.8. Fazer o HUD também no Phaser (textos e botões desenhados no canvas) daria um visual único, mas perderia os botões nativos, o foco do teclado, os atributos `aria-*` e os testes com happy-dom; o HUD em DOM reaproveita tudo da Beta 0.9.1.

**Riscos e armadilhas**: a fronteira é uma regra do plano, não um teste: só `src/main.ts` e os arquivos de `src/scenes/` podem importar `phaser`. Se `GameStore`, uma tela ou um arquivo de `src/game/` importasse o Phaser, os testes em happy-dom passariam a carregar uma biblioteca que espera WebGL, e o motor deixaria de rodar no Node para o simulador. Hoje só os três arquivos de `src/scenes/` têm `import Phaser from 'phaser'` (confira com `grep -rn "from 'phaser'" src tests`). Outra armadilha: o canvas fica por baixo do HUD, e a camada de UI na batalha usa `pointer-events: none` com os filhos em `auto` (em `src/styles.css`), senão o DOM transparente engoliria os cliques e o canvas por baixo nunca seria alcançado.

### Passo 2 — Uma fila de animação testável sem Phaser

**O quê**: `src/scenes/animationQueue.ts` não importa o Phaser. `stepsFor(events)` converte eventos em passos (`AnimStep`) com a duração de `DURATIONS` (dano 450 ms, derrota 600 ms...), descarta eventos sem animação e soma 350 ms ao início do turno do inimigo, para o jogador perceber que a vez mudou. `AnimationQueue` toca os passos em ordem, aceita eventos novos no meio, engole a exceção de um passo quebrado e chama `onIdle` (o `animationsDone` do store) uma vez quando esvazia. `waitStep(duração, engineDelay, timer)` espera o passo terminar pelo relógio do Phaser (`this.time.delayedCall`) **ou** por um `setTimeout` de garantia de duração mais `FALLBACK_MARGIN_MS` (1000 ms), o que vier primeiro, e resolve uma vez só. Em `src/scenes/createGame.ts`, o loop do Phaser dorme fora da batalha (`game.loop.sleep()`) e acorda quando o `App` chama `show()` (`game.loop.wake()`).

**Por quê**: um **loop de jogo** é a repetição que o motor gráfico faz de 30 a 60 vezes por segundo: atualizar animações e redesenhar o quadro. Cada volta é um **tick**. O Phaser usa `requestAnimationFrame` do navegador para isso, e enquanto o loop roda ele gasta CPU e bateria mesmo com a tela parada. Fora da batalha não há nada para animar, então o loop dorme. Separar a fila do Phaser deixa provar com Vitest e relógio falso que a ordem é mantida, que a fila sempre libera o store e que um passo quebrado não trava nada, sem abrir navegador.

**Alternativas**: esperar cada passo só pelo relógio do Phaser é mais simples e é o que a maioria dos jogos faz, mas deixa o jogo refém do loop (próximo parágrafo). Esperar só por `setTimeout` funcionaria, mas descolaria a espera dos tweens do Phaser, que andam pelo relógio dele. Usar uma `Promise` por evento sem fila, disparando todas juntas, sobreporia as animações e chamaria `animationsDone` antes da hora.

**Riscos e armadilhas**: o navegador **para** o `requestAnimationFrame` de uma aba em segundo plano, e o loop do Phaser também para quando está dormindo. Sem a garantia, um jogador que troca de aba no meio de um golpe voltaria a um jogo travado: o relógio do Phaser nunca dispararia o fim do passo, a fila nunca chamaria `animationsDone` e o store ficaria com `locked` ligado para sempre. O `setTimeout` de `waitStep` continua andando (mais devagar, mas anda) e resolve o passo. Os testes `relógio do motor parado: o setTimeout de garantia resolve depois de duração + folga` e `com o loop do Phaser dormindo, a fila ainda libera o store (animationsDone)` provam isso. Também há uma armadilha de inicialização em `createGame`: `show`/`hide` podem chegar antes de a `BattleScene` existir, e é no `create` dela que o animador se inscreve no store. Por isso o loop só obedece ao primeiro `hide` depois que a cena `battle` está ativa (o ouvinte `settle` em `POST_STEP`); adormecer antes disso deixaria o jogo sem animador.

### Passo 3 — HUD em DOM sobre o canvas, com atalhos de teclado

**O quê**: `BattleScreen` mostra os dois lados (nome, nível, grau, Poder Ninja, barras de HP e chakra com números, crítico, redução, esquiva e efeitos com turnos restantes), o indicador de turno ("Seu turno", "Turno do inimigo", "Resolvendo…"), o log (as últimas 80 linhas de `battleLog`), os botões básicos (Atacar, Defender, Meditar, Item e, se houver forma, Transformar) e os botões de jutsu com custo e maestria. Jutsu é escolhido em dois tempos: o primeiro clique (ou a tecla `1`–`4`) **seleciona** e mostra a descrição; o segundo clique, `Enter` ou o botão "Usar (Enter)" **confirma**. `battleKeys` liga `A`, `D`, `M`, `I`, `T`, `1`–`4`, `Enter` e `Esc`. `Esc` só fecha a descrição ou o painel de itens, nunca sai da batalha. Só dá para agir na batalha real, na vez do jogador e sem animação (`liveBattle`). O botão e a tecla perguntam à **mesma função** se a ação está bloqueada: `basicBlock` (Ilusão ativa, sem forma, forma já alternada neste turno) e `jutsuReason` (Ilusão, falta de chakra). Tecla segurada (`e.repeat`) é ignorada.

**Por quê**: selecionar antes de confirmar evita gastar chakra num jutsu escolhido por engano e dá ao jogador a chance de ler a descrição na hora de decidir; num jogo por turnos, a decisão é o jogo, então ela merece um passo a mais. Os atalhos deixam a luta rápida para quem já conhece os jutsus. E um único predicado para botão e tecla garante que o teclado nunca faça o que o botão não deixa.

**Alternativas**: um clique que usa o jutsu direto é mais rápido, mas sem descrição e sem volta. Atalhos com `keyup` em vez de `keydown` evitariam a repetição da tecla segurada, mas deixariam o jogo com atraso perceptível. Deixar o botão desabilitado e, na tecla, mostrar um aviso de "ação bloqueada" foi descartado: a tecla de um botão apagado é ignorada em silêncio, como o próprio botão.

**Riscos e armadilhas**: a primeira versão (`9ab3025`) tinha regras diferentes para botão e tecla. Sob Ilusão os botões Atacar, Defender, Meditar e Transformar ficavam apagados, mas as teclas `A`, `D`, `M` e `T` não checavam a Ilusão: o comando chegava ao store, o motor recusava e o jogador via um aviso de erro por uma tecla que deveria só ser ignorada. O botão de Transformar também ficava apagado depois de alternar a forma no turno, enquanto a tecla `T` só conferia se havia forma. A correção `95f4d50` criou `basicBlock`, usada pelos dois, e passou a ignorar `e.repeat` (segurar `A` disparava várias tentativas de ataque); os testes `sob Ilusão: A, D, M, I e T não geram ação nem aviso`, `Uchiha: T alterna uma vez; T de novo no mesmo turno não gera ação nem aviso` e `tecla segurada (repeat) não age` provam isso. O mesmo commit levou para `src/i18n/pt-BR.ts` os formatos do HUD e dos números flutuantes, que estavam montados com template strings. Outro detalhe: `Enter` com um jutsu selecionado chama `e.preventDefault()`, porque, se o foco estiver num botão, o navegador também dispararia o clique dele e o jogador faria duas ações. E o botão da Ficha fica desabilitado durante a animação, porque sair da tela de batalha antes de a luta resolver deixaria a animação sem cena.

### Passo 4 — A morte é registrada antes da animação

**O quê**: quando o golpe que mata o jogador é resolvido, o `GameStore` (Beta 0.9.0) já registra o fim da run no mesmo comando: grava a meta com o Histórico, apaga o save da run e guarda em `battleSnapshot` o último quadro da luta. Só depois entrega os eventos à `BattleScene`, que anima a derrota com o HUD ainda na tela. Quando a fila termina, `animationsDone()` solta a trava e aplica a navegação adiada para a tela de fim de run. A luta também tem fim garantido: depois de 200 rodadas <!-- fact: BALANCE.battle.maxRounds=200 -->, o motor encerra a batalha por tempo e o inimigo vence.

**Por quê**: a animação é só apresentação, e quem fecha a aba no meio dela não pode perder a run nem "salvar-se" da morte recarregando a página (isso seria um save-scum, Alfa 0.8). Registrar primeiro e animar depois faz do Histórico a verdade, independente de a animação chegar ao fim. O `battleSnapshot` existe porque o motor descarta a batalha ao encerrá-la; sem ele o HUD ficaria vazio durante a animação da derrota.

**Alternativas**: registrar a morte no `animationsDone` deixaria a tela e o save sincronizados com o que o jogador viu, mas fechar a aba durante a animação deixaria uma run morta salva como viva. Desabilitar o recarregamento durante a animação não é possível num navegador, e mesmo um aviso de "deseja sair?" não cobre uma queda de energia.

**Riscos e armadilhas**: com a trava ligada e a run já encerrada, um comando que chegue no meio da animação não pode reabrir nada: o store recusa tudo enquanto `locked` está ligado. O teste `morte: Histórico e save atualizados ANTES do fim da animação (Review Focus 3)`, em `tests/ui/store-battle.test.ts`, prova a ordem: com a animação ainda pendente, o save da run já é `null`, o Histórico já tem `dead` e o snapshot mostra o jogador com HP 0. O caso oposto também é uma armadilha: se o animador lança uma exceção, a trava nunca seria solta; nesta versão a fila protege só os passos que ela mesma toca, e o store passou a se proteger de um animador que lança na 1.0 (`bec6a2e`).

## Critérios de conclusão

- `npx vitest run tests/ui/animation.test.ts tests/ui/battle-hud.test.ts` passa.
- `npm run build` termina sem erros (o build roda `tsc --noEmit` e depois `vite build`).
- `grep -rn "from 'phaser'" src tests` lista só arquivos de `src/scenes/`.
- `npm run dev` abre o jogo; uma luta mostra a arena por baixo do HUD e os atalhos respondem.

## Testes

- `tests/ui/animation.test.ts`: prova que `stepsFor` ignora eventos sem animação e atrasa o turno do inimigo; que a `AnimationQueue` toca em ordem, aceita eventos no meio, avisa uma vez ao esvaziar, libera na hora um lote sem animação e não trava com um passo que falha; e que `waitStep` resolve pelo relógio de garantia com o Phaser parado, uma vez só com os dois relógios andando, e que a fila libera o store com o loop dormindo.
- `tests/ui/battle-hud.test.ts`: prova o HUD (vitais com números, Poder Ninja, indicador de turno), os atalhos (`D` defende, `1` seleciona e `1` de novo usa, `T` liga o Sharingan sem gastar o turno), os itens e o Pergaminho de Reforço, a Ficha aberta da batalha, a vitória pelo teclado, a repetição durante a animação (três `A` rápidos ou cliques repetidos geram uma ação só), `Esc` que nunca sai da batalha, `aria-pressed` e `✓` no jutsu selecionado, o motivo do jutsu sem chakra e os atalhos que seguem o estado dos botões.
- `tests/ui/store-battle.test.ts` (Beta 0.9.0): prova a morte registrada antes do fim da animação.

## Patch log

### Adicionado

- A fila de animação `src/scenes/animationQueue.ts`, as cenas `src/scenes/BattleScene.ts` e `src/scenes/BootScene.ts`, e `src/scenes/createGame.ts`.
- O HUD e os atalhos em `src/ui-dom/screens/BattleScreen.ts`.
- A criação do Phaser em `src/main.ts`, com aviso quando o navegador não tem canvas.
- Os testes `tests/ui/animation.test.ts` e `tests/ui/battle-hud.test.ts`.

### Alterado

- Na 1.0 (`bec6a2e`), o `GameStore` passou a tratar um animador que lança: avisa o erro e chama `animationsDone()` na hora, para a trava não ficar presa; e `go`, `back` e `toMenu` passaram a ser ignorados com a batalha travada.

### Corrigido

- Os atalhos seguem o estado dos botões pela mesma função (`basicBlock`), ignoram tecla segurada, e os formatos do HUD e dos números flutuantes foram para o i18n (`95f4d50`).

### Removido

Nada nesta versão.

### Problemas conhecidos

- A verificação visual da `BattleScene` só foi feita por build e por requisição HTTP ao servidor de desenvolvimento, não olhando o jogo no navegador; o roteiro de conferência visual (CONFERENCIA-VISUAL.md, no fechamento do Plano 3) fica para o usuário.
- O pacote gerado passa de 1,6 MB por causa do Phaser, que é carregado mesmo para quem só abre o menu.
- As durações das animações são fixas em `DURATIONS`; não há opção para acelerar ou pular.
