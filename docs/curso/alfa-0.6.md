# Alfa 0.6 — Batalha por turnos e IA

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `3887828` e `350f4eb` (use `git log --oneline` para conferir e `git show <sha>` para ver o código como ficou).

## Objetivo

Ao fim desta versão o jogo tem uma batalha completa entre o jogador e um inimigo: rodadas com ordem por Velocidade, início de turno com regeneração, manutenção, dano contínuo e controle, as seis ações do jogador, o Kai sob Ilusão, inimigos que decidem sozinhos (IA básica e os padrões de Zabuza e Haku) e inimigos gerados a partir do nível de história e do grau.

## Escopo

### Entra

- A máquina de estados da batalha em `src/game/combat/battle.ts`: `startBattle`, `applyAction`, `applyActionInPlace`, `getPlayer`, `getEnemy` e as funções internas `advance`, `newRound`, `beginTurn`, `checkEnd`, `execute`, `useJutsu`, `useItem`, `toggleTransformation`.
- A IA dos inimigos em `src/game/combat/ai.ts`: `chooseAiAction`, `expectedDamage`, `attackExpected` e os padrões `basic`, `zabuza` e `haku`. No primeiro commit (`3887828`) ela era um esboço que sempre atacava; o segundo (`350f4eb`) trouxe as regras.
- A geração de inimigos em `src/game/combat/enemyFactory.ts`: `distributePoints` e `createEnemy`.
- Os limiares da IA em `BALANCE.ai` (`src/game/Balance.ts`).
- Os testes em `tests/battle.test.ts` e `tests/ai.test.ts`.

### Fica de fora

- O encaixe da batalha na run (montar o `Combatant` do jogador a partir do personagem, devolver HP, chakra, usos de maestria e itens ao fim, dar XP e recompensas): Alfa 0.7, em `src/game/run/battleSetup.ts` e `src/game/run/runManager.ts`.
- Os valores finais dos graus de inimigo: esta versão usou os números da spec (HP do grau C ×1,3, do grau B ×1,5); a calibração pelo simulador da Alfa 0.8 (commit `e4db64a`) os mudou para os de hoje.
- A barra de ações, os atalhos de teclado e a animação dos eventos: Beta 0.9 (`src/ui-dom/screens/BattleScreen.ts`).
- Mais de um inimigo por vez: o estado guarda uma lista de combatentes, mas o MVP luta sempre um contra um.

## Passo a passo

### Passo 1 — A batalha como máquina de estados

**O quê**: em `src/game/combat/battle.ts`, o `BattleState` (de `src/game/combat/types.ts`) guarda os combatentes, a rodada, a ordem de ação da rodada, a posição na ordem, quem está agindo e o `status`: `'running'`, `'awaitingInput'` ou `'ended'`, com o `winner`. `startBattle(jogador, inimigo, rng)` clona os dois combatentes, cria o estado e chama `advance`, que roda turnos (resolvendo sozinho os do inimigo) até o jogador precisar agir ou a luta acabar. `applyAction(estado, ação, rng)` clona o estado e chama `applyActionInPlace`, que confere se é a vez do jogador (`RuleError('notYourTurn')` ou `'battleEnded'`), executa a ação e chama `advance` de novo. As duas devolvem o estado novo e a lista de eventos da Alfa 0.5. `newRound` monta a ordem da rodada pela Velocidade efetiva × (1 + sorteio de 0 a 10%, `turnOrderJitter`), recalculada a cada rodada.

**Por quê**: um **turno** é a vez de um combatente agir; uma **rodada** é a sequência em que todos agem uma vez. O jogo é de **turno sequencial**: ninguém age ao mesmo tempo, e cada ação acontece inteira antes da próxima. Uma **máquina de estados** é um objeto que só pode estar em um de poucos estados bem definidos, com regras claras de como passar de um para outro. Aqui são três: "rodando" (o motor está resolvendo turnos), "esperando o jogador" (a interface mostra os botões) e "encerrada". Isso responde de forma inequívoca à pergunta que a interface faz o tempo todo: "posso mostrar os botões agora?". Como o motor resolve os turnos do inimigo dentro do `advance`, a interface nunca precisa saber de quem é a vez: ela manda a ação do jogador e recebe de volta tudo o que aconteceu até a próxima decisão dele. O sorteio na ordem evita que o mais rápido sempre aja primeiro por 1 ponto de diferença.

**Alternativas**: um laço de jogo em tempo real (comum em jogos de ação, com `requestAnimationFrame` e um "tick" a cada quadro) não faz sentido num jogo de turnos e misturaria regra com tempo de tela. Uma barra de tempo por Velocidade (estilo ATB, em que o mais rápido pode agir duas vezes antes do outro) é mais rica, mas o DD v2 define rodadas com ordem por Velocidade. `async/await` esperando o clique do jogador dentro do motor deixaria o código linear, mas prenderia o motor à interface e tornaria impossível testar ou simular milhares de batalhas sem tela.

**Riscos e armadilhas**: o clone é parte do contrato: `applyAction` nunca muta o estado recebido, porque a run guarda o estado do início do encontro para o "recarregar volta ao mesmo encontro" (Alfa 0.8). `applyActionInPlace` existe para quem já tem uma cópia e não pode pagar outra: a run (`battleAction` em `src/game/run/runManager.ts`, Alfa 0.7) clona a run inteira uma vez e usa a variante mutável por dentro, e o simulador passa `inPlace: true` para não clonar nada, porque `structuredClone` a cada ação, em milhares de batalhas, custa caro. Usar `applyActionInPlace` num estado que a interface ainda está desenhando mudaria a tela por baixo dela. Outro risco é o laço do `advance`: se nada nunca terminar a luta (dois combatentes que só se curam), ele roda para sempre; o Passo 2 fecha isso com o limite de rodadas.

### Passo 2 — Início do turno e fim da batalha

**O quê**: `beginTurn` executa, nesta ordem (spec §4): zera o Defender do próprio combatente; regenera chakra (`chakraRegen` da Alfa 0.2); cobra a manutenção da transformação (`payTransformationUpkeep`); aplica o dano contínuo (`applyDots`); se o combatente morreu, pula o turno; senão confere o controle. Sem controle, desconta as durações (`tickDurations`) e ele age. Sob Imobilizado ou Atordoado, emite `controlledSkip` e perde a vez. Sob Ilusão, o jogador com Kai equipado e chakra para pagá-lo recebe a vez com `onlyKai` ligado (Passo 3). `checkEnd` roda depois de cada passo do `advance`: se alguém tem 0 de HP, a luta acaba com vitória do outro lado; se a rodada passou de `battle.maxRounds` = 200<!-- fact: BALANCE.battle.maxRounds=200 -->, acaba com vitória do inimigo e motivo `'timeout'`. Ao encerrar, toda transformação ativa é removida com `transformOff` motivo `'battleEnd'`, e só então sai o `battleEnd`.

**Por quê**: a ordem do início do turno decide situações de jogo reais. O chakra regenera antes da manutenção, para que um Uchiha com chakra no limite consiga manter o Sharingan. O dano contínuo vem antes da ação: queimar é perder vida no começo da própria vez. O caso que o Plano 1 marcou como risco (Review Focus 3 em `docs/superpowers/plans/2026-10-04-plano-1-motor.md`) é o jogador que morre por queimadura no início do próprio turno: a batalha tem de terminar ali, com vitória do inimigo, e não parar em `awaitingInput` esperando uma ação de um personagem morto. Por isso o `advance` chama `checkEnd` logo depois de `beginTurn`, antes de devolver a vez ao jogador (teste `jogador morre por queimadura no início do próprio turno (Review Focus 3)`). O limite de 200 rodadas é uma rede de segurança: nenhuma luta normal chega perto, mas o simulador roda milhares de lutas com um robô, e uma combinação inesperada que nunca acaba travaria o `npm run sim`. Contar o empate por tempo como derrota impede que "não perder" vire estratégia. O `transformOff` no fim existe para a interface apagar o visual da transformação e para nenhuma transformação ativa voltar para a run.

**Alternativas**: checar o fim só depois de cada ação (o lugar "óbvio") deixa passar exatamente o caso da queimadura, que mata fora de uma ação. Declarar empate por tempo, em vez de derrota, exigiria um terceiro resultado em toda a run, nas estatísticas e na interface. Encerrar a transformação em silêncio, sem evento, deixaria o Sharingan desenhado na tela de resultado.

**Riscos e armadilhas**: a ordem entre dano contínuo e controle importa: se o controle fosse conferido antes, um inimigo atordoado pularia a queimadura daquele turno. Ao pular o turno por controle, as durações também são descontadas, senão um controle de 1 turno nunca acabaria. Um cuidado sutil está no `transformToggled` e no `onlyKai`: os dois são zerados no início de **cada** turno, para que uma permissão de um turno não vaze para o seguinte. E o `timeout` é medido na virada da rodada: a luta acaba quando a rodada 201 começaria.

### Passo 3 — As ações do jogador e o Kai sob Ilusão

**O quê**: `execute` trata cada `Action`. **Atacar** é um golpe de Taijutsu com `power.attack` e sem elemento. **Defender** marca `defending` (o dano recebido cai à metade até o próximo turno do próprio combatente) e recupera 10% do chakra máximo. **Meditar** recupera 25% do chakra máximo, mais o bônus do clã (o Uzumaki chega a 30%). **Item** usa um consumível do inventário (o Pergaminho de Reforço exige escolher o atributo, `RuleError('needAttr')`). **Jutsu** (`useJutsu`) confere se está equipado e se há chakra (`'noChakra'`), paga o custo de `costFor`, aplica o Kai se for o caso, resolve o golpe se o jutsu tem Poder, sorteia cada efeito (controle com `controlChance`, os outros com `effectChance`), aplicando efeitos no inimigo só se o golpe acertou, e soma 1 uso de maestria, emitindo `masteryUp` quando o nível sobe. **Transformar** (`toggleTransformation`) liga ou desliga a transformação uma vez por turno; quando `activationCostsTurn` é falso (o Sharingan), é uma **ação livre**: a vez continua com o jogador. Sob Ilusão, com `onlyKai` ligado, qualquer ação que não seja um jutsu de `cleanse` (o Kai) lança `RuleError('onlyKai')`.

**Por quê**: cada ação é uma troca diferente, e é isso que dá decisão a um turno: atacar é grátis e fraco, jutsu é forte e custa chakra, Defender e Meditar trocam o turno por recurso. A **ação livre** de transformar existe para que ligar o Sharingan não seja um castigo (perder o turno para ganhar um bônus que custa chakra todo turno). O Kai resolve a contradição da correção C13 do `docs/ANALISE.md`: o DD v2 dizia que o Kai remove controle de si mesmo, mas um controlado não age, então o Kai nunca poderia ser usado. A solução: sob **Ilusão** (o controle do Genjutsu), quem tem Kai e chakra recebe a vez, mas só pode usá-lo; Imobilizado e Atordoado continuam fazendo perder o turno. A Ilusão não expira sozinha enquanto o jogador pode usar o Kai (`tickDurations` com `keep`), para que ele não seja salvo pelo tempo sem decidir. Contar o uso de maestria mesmo quando o golpe erra torna a progressão previsível: cada conjuração conta.

**Alternativas**: tratar Transformar como ação comum que gasta o turno seria mais simples, mas tornaria o Sharingan uma armadilha nas lutas curtas. Liberar qualquer ação sob Ilusão quando o jogador tem Kai anularia o controle; deixar a Ilusão contra o jogador funcionar como Atordoado tornaria o Kai inútil. Cada uma dessas regras está nos testes de `tests/battle.test.ts`.

**Riscos e armadilhas**: a regra "1 jutsu por turno, 1 uso de maestria" depende de cada ação encerrar o turno; se um dia outra ação livre puder lançar jutsu, a maestria passará a subir duas vezes por turno. O `transformToggled` impede ligar e desligar várias vezes na mesma vez (`RuleError('alreadyToggled')`), o que permitiria pagar a ativação e fugir da manutenção. O `canKai` confere chakra **antes** de dar a vez: se o jogador tem Kai mas não pode pagá-lo, ele perde o turno como num controle comum, em vez de receber uma vez em que nenhuma ação é permitida. Erros de regra (`'noChakra'`, `'notEquipped'`, `'onlyKai'`) são lançados antes de qualquer mudança no estado, então a ação inválida não deixa a batalha pela metade.

### Passo 4 — A IA dos inimigos e a geração por nível

**O quê**: em `src/game/combat/ai.ts`, `chooseAiAction(estado, inimigo)` escolhe a ação do inimigo pelo campo `ai` do modelo. A IA **básica** segue o DD v2 §9: com HP abaixo de `ai.defensiveHpPct` = 0.25<!-- fact: BALANCE.ai.defensiveHpPct=0.25 --> do máximo, usa um jutsu defensivo (só efeitos em si mesmo) que ainda não esteja ativo; senão, entre os jutsus de dano que pode pagar, prioriza os com vantagem elemental sobre o jogador e, entre eles, o de maior dano esperado (`expectedDamage`, sem sorteio); se nenhum tem vantagem e o melhor não supera Atacar (`attackExpected`), ataca. **Zabuza** abre com Kirigakure (névoa) e a renova quando expira; abaixo de `ai.phase2HpPct` = 0.5<!-- fact: BALANCE.ai.phase2HpPct=0.5 --> do HP entra na 2ª fase: Muon Satsujin de dentro da névoa ou Suiryuudan. **Haku** abre com Makyou Hyoushou (espelhos) e, na 2ª fase, renova os espelhos e prioriza Sensatsu Suishou, depois Senbon, depois Atacar. Em `src/game/combat/enemyFactory.ts`, `createEnemy(modelo, nívelDeHistória)` calcula os pontos como `round(P(N) × pointsRatio do grau)`, os distribui pelos pesos do arquétipo com `distributePoints` (maior resto, mínimo 1 por atributo; correção C5) e calcula o HP como `maxHp × hpMult do grau`. Hoje o grau C (Zabuza) tem HP ×2.1<!-- fact: BALANCE.enemyGrades.C.hpMult=2.1 --> e o grau B (Haku) ×1.7<!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 -->.

**Por quê**: a **IA** de um jogo de turnos não precisa ser inteligente, precisa ser **legível**: o jogador aprende o padrão do inimigo e se prepara para ele, e isso é parte da diversão de um chefe. Por isso ela é determinística: o mesmo estado gera sempre a mesma escolha, sem sorteio. Isso também mantém os testes estáveis e deixa o simulador medir o balanceamento sem ruído extra. Os chefes ganham padrões próprios com uma **2ª fase** (mudar de comportamento abaixo de metade da vida), que dá à luta um momento de virada; a correção C6 usou a 2ª fase do Haku, junto com mais HP no grau B, para que o chefe final não fosse mais fácil que Zabuza. Gerar o inimigo pelo **nível de história** do encontro, e não pelo nível do jogador, faz o mundo ter dificuldade fixa: quem treinou mais chega mais forte, em vez de ver o inimigo crescer junto. A geração por fórmula substitui os blocos prontos da tabela A.4 do DD v2, que não batiam com a própria regra (C5).

**Alternativas**: uma IA que simula cada ação possível e escolhe a melhor (busca em árvore, como em jogos de tabuleiro) jogaria melhor, mas seria imprevisível para o jogador e cara para o simulador. Escolher ao acaso entre as ações válidas é o mais simples, mas faz o chefe parecer bobo e esconde o balanceamento atrás do sorteio. Blocos de atributo escritos à mão por inimigo (como a tabela A.4) dão controle fino, mas precisariam ser refeitos a cada mudança de P(N) ou dos graus.

**Riscos e armadilhas**: o histórico mostra o risco do número copiado: os testes de geração de inimigos fixavam `damageMult: 0.6` e os `hpMult` 1,3 e 1,5 como literais, e quebraram quando a calibração da Alfa 0.8 mudou os graus; o commit `5c0e7d4` os fez ler `BALANCE.enemyGrades`, e a revisão final (`662d506`) trocou o último literal que sobrou (o `hpMult` 0,8 do Bandido). Os limiares da IA seguem a mesma regra: o código do Plano 1 os escrevia como literais (`self.maxHp * 0.25`, `* 0.5`), e a implementação os levou para `BALANCE.ai` no próprio `350f4eb`. O `distributePoints` tem uma armadilha de soma: o mínimo de 1 por atributo pode fazer a soma passar do total (um arquétipo com peso 2% em Genjutsu, num total pequeno, ainda recebe 1); o laço final tira pontos do maior atributo até a soma bater, e o teste `distributePoints soma o total e dá no mínimo 1 a cada atributo` protege isso. Por fim, `chooseAiAction` pode marcar `aiOpened` no inimigo (a abertura do chefe acontece uma vez só), então só pode ser chamada dentro de um estado já clonado.

## Critérios de conclusão

- `npx vitest run tests/battle.test.ts tests/ai.test.ts` passa.
- `npm run typecheck` termina sem erros.
- Com a mesma semente e as mesmas ações, duas batalhas produzem os mesmos eventos (teste `mesma semente + mesmas ações = mesmo resultado`).

## Testes

- `tests/battle.test.ts`: prova o fluxo (o mais rápido age primeiro, depois da ação do jogador o inimigo age e a vez volta, erros de regra sem chakra, jutsu não equipado e batalha encerrada, vitória ao zerar o HP do inimigo, morte por queimadura no início do próprio turno) e as ações (transformação como ação livre 1 vez por turno com manutenção no turno seguinte, inimigo controlado perde o turno, sob Ilusão só o Kai, maestria com `masteryUp`, Meditar 25% e 30% no Uzumaki, Defender com 10% de chakra e dano reduzido, kit médico curando 40% e sendo consumido), além do determinismo pela semente e de `getEnemy`.
- `tests/ai.test.ts`: prova a IA básica (sem chakra ataca, maior dano esperado, prioridade elemental, jutsu defensivo abaixo de 25%), os scripts de chefe (Zabuza abre com Kirigakure, usa Muon Satsujin abaixo de 50% com névoa e renova a névoa; Haku abre com Makyou, prioriza Sensatsu Suishou na 2ª fase e usa Senbon sem chakra) e a geração de inimigos (soma e mínimo de `distributePoints`, Bandido nível 1 com 35 pontos, HP do grau em Zabuza nível 5 e Haku nível 10, `RuleError` para modelo desconhecido).

## Patch log

### Adicionado

- A máquina de estados da batalha em `src/game/combat/battle.ts`.
- A IA básica e os padrões de Zabuza e Haku em `src/game/combat/ai.ts`.
- A geração de inimigos por nível de história em `src/game/combat/enemyFactory.ts`.
- `ai.defensiveHpPct` e `ai.phase2HpPct` em `src/game/Balance.ts`.
- Testes em `tests/battle.test.ts` e `tests/ai.test.ts`.

### Alterado

- `src/game/combat/ai.ts` deixou de ser o esboço "sempre ataca" do commit `3887828` e passou a seguir o DD v2 §9 no `350f4eb`.

### Corrigido

- Os limiares de HP da IA (25% para o jutsu defensivo, 50% para a 2ª fase dos chefes), que o código do Plano 1 trazia como literais, passaram a vir de `BALANCE.ai`.

### Removido

Nada nesta versão.

### Problemas conhecidos

- Zabuza e a IA básica dão prioridade absoluta à vantagem elemental: contra um jogador de Fogo, Suiryuudan é sempre escolhido, mesmo que Kubikiribouchou cause mais dano esperado, e nessa situação a comparação com Atacar nem é feita. Na 2ª fase, Zabuza usa Suiryuudan direto, sem comparar o dano esperado.
- `expectedDamage` ignora o multiplicador de dano do grau, a maestria, os bônus e a Defesa do jogador; serve para comparar jutsus entre si, não para prever o dano real.
