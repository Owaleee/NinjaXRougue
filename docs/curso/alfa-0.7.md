# Alfa 0.7 — Loja, run e meta-progressão

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `bbc2e8f`, `6d7f716`, `9b57eeb` e `e47876f` (use `git log --oneline` para conferir e `git show <sha>` para ver o código como ficou).

## Objetivo

Ao fim desta versão o motor joga uma run inteira da Saga da Onda, do primeiro encontro até Haku, com loja, equipamento, Pergaminho Raro, Acampamento, bifurcações de elite, recompensas, escolha 1-de-3 ao subir de nível e estatísticas, e registra o fim de cada run numa meta-progressão que sobrevive entre runs (Histórico, títulos e Enciclopédia).

## Escopo

### Entra

- A loja em `src/game/run/shop.ts`: `generateStock`, `priceOf`, `buyItem`, `equipItem` e `useRareScroll`.
- Os tipos da run em `src/game/run/types.ts`: `RunNode`, `RunPhase`, `RunState`, `EncounterResult` e `REWARD_OPTIONS`.
- O ciclo da run em `src/game/run/runManager.ts`: `buildRunNodes`, `newRun`, `restAtCamp`, `startEncounter`, `battleAction`, a função interna `finishEncounter`, `chooseReward`, `continueFromResult` e as variantes "na run" da loja e da preparação (`buyInRun`, `equipItemInRun`, `useRareScrollInRun`, `allocateRunPoints`, `equipJutsuInRun`, `setLoadoutInRun`).
- A ponte entre a run e a batalha em `src/game/run/battleSetup.ts`: `playerToCombatant` e `applyBattleResult`.
- As estatísticas da run em `src/game/meta/stats.ts`: `emptyRunStats`, `trackBattleEvents`, `trackEncounterEnd` e `mostUsedJutsu`.
- A meta-progressão em `src/game/meta/meta.ts`: `emptyMeta`, `recordRunEnd`, `runEndText`, `isTitleEarned`, `availableTitles` e `encyclopedia`.
- Os testes em `tests/shop.test.ts`, `tests/run.test.ts`, `tests/stats.test.ts` e `tests/meta.test.ts`.

### Fica de fora

- Gravar a run e a meta no navegador: Alfa 0.8, em `src/game/save/save.ts`. Nesta versão a run só existe em memória, mas já guarda a "foto" do início do encontro que o save vai usar.
- O simulador que joga milhares de runs e a calibração dos graus de inimigo: Alfa 0.8.
- Telas de loja, mapa, resultado e Histórico: Beta 0.9.1. Esta versão só tem as regras.
- A promoção a Chunin: o título "Novo Chunin" existe nos dados, mas `isTitleEarned` devolve `false` para a condição `promotedRank`, porque a promoção é da Fase 2 do DD v2.
- Outras sagas e o Modo Infinito: o MVP tem só a Saga da Onda (`src/data/saga.ts`).

## Passo a passo

### Passo 1 — Loja com estoque sorteado e Pergaminho Raro

**O quê**: em `src/game/run/shop.ts`, `generateStock(rng)` monta o estoque: todos os consumíveis (estoque ilimitado), 2<!-- fact: BALANCE.shop.equipmentOffers=2 --> equipamentos sorteados de `EQUIPMENT_POOL` e 1<!-- fact: BALANCE.shop.rareScrollsPerStock=1 --> Pergaminho Raro. `priceOf` aplica o desconto do título (o Colecionador dá −5%). `buyItem(personagem, estoque, itemId)` confere, nesta ordem, se o item existe, se está no estoque, se o equipamento já é do jogador e se há ryo; só depois clona o personagem e o estoque, desconta o preço e entrega o item. `equipItem` troca arma ou armadura e soma ao HP e ao chakra atuais a diferença do máximo. `useRareScroll` gasta um Pergaminho Raro e dá +1 permanente (nesta run) num atributo **base**, até 5<!-- fact: BALANCE.shop.rareScrollMaxPerRun=5 --> por run (`RuleError('rareScrollLimit')`). O estoque é sorteado no início da run e de novo depois de cada chefe. A recompensa "ryo" da escolha 1-de-3 (Passo 2) vale 60<!-- fact: BALANCE.shop.rewardRyo=60 --> ryo.

**Por quê**: num **roguelike** (jogo em que cada partida, a **run**, começa do zero e termina na morte ou no fim da saga), a loja é onde o jogador transforma o que ganhou em poder, e o estoque sorteado obriga a decidir com o que aparece, em vez de seguir sempre a mesma receita. O Pergaminho Raro mexe no atributo base de propósito: a regra de desbloqueio da Alfa 0.3 só olha atributos base, então um pergaminho pode liberar um jutsu na hora; o limite de 5 por run impede que ryo vire atributo sem fim. A técnica de **validar antes de clonar** garante que um erro nunca deixa estado pela metade: se faltar ryo, o `RuleError` sai antes de qualquer mudança, e a interface só mostra a mensagem. Subir o HP atual junto com o máximo ao equipar evita a sensação de "comprei um colete e fiquei ferido".

**Alternativas**: validar e mudar ao mesmo tempo, mutando o personagem recebido, economizaria um `structuredClone`, mas um erro no meio (preço conferido depois de descontar, por exemplo) deixaria o jogador sem ryo e sem item. Uma loja com todos os equipamentos sempre à venda é mais simples, mas tira a decisão e deixa as runs parecidas. Dar o Pergaminho Raro como bônus no atributo **efetivo** (como um equipamento) não liberaria jutsu e esvaziaria o item.

**Riscos e armadilhas**: o `buyItem` trata os quatro `kind` de item que existem em `src/data/items.ts` com `if` separados e sem `else`: um quinto tipo de item, se for criado, passaria por todas as validações, cobraria o preço e não entregaria nada. O desconto do título usa `Math.round`, então o preço exibido tem de vir de `priceOf`, nunca de `item.price`; o `buyInRun` em `src/game/run/runManager.ts` lê o preço antes da compra para registrar o gasto nas estatísticas. Equipar compara o máximo antes e depois e soma a diferença ao atual; se a troca baixar o máximo, `clampVitals` corta o atual no novo teto.

### Passo 2 — O ciclo da run

**O quê**: `RunState` (em `src/game/run/types.ts`) guarda tudo de uma run: semente, estado do RNG (`rngState`), personagem, os 26 nós do mapa, o nó atual, a **fase** (`'camp'`, `'map'`, `'battle'`, `'result'`, `'dead'`, `'victory'`), a batalha em andamento, a loja, as escolhas 1-de-3 pendentes e as estatísticas. `newRun(params, seed, now)` cria o personagem, sorteia o mapa com `buildRunNodes` e o primeiro estoque. O mapa segue `src/data/saga.ts`: 12 comuns, Zabuza no nó 13, mais 12 comuns e Haku no nó 26, os dois chefes precedidos de Acampamento; `buildRunNodes` sorteia 3<!-- fact: BALANCE.run.eliteForks=3 --> bifurcações "Comum ou Elite", nunca no nó logo antes de um Acampamento. `restAtCamp` enche HP e chakra. `startEncounter(run, elite)` cria o inimigo (Alfa 0.6), monta o combatente do jogador com `playerToCombatant` e abre a batalha. `battleAction(run, ação)` repassa a ação ao motor de batalha. Quando a luta acaba, `finishEncounter` traz HP, chakra, maestria e itens de volta com `applyBattleResult` e, na vitória, paga ryo e reputação pela tabela do grau, dá XP (elite ×1.6<!-- fact: BALANCE.xp.eliteMult=1.6 -->), cria uma escolha 1-de-3 por nível ganho, devolve 25%<!-- fact: BALANCE.recovery.encounterHpPct=0.25 --> do HP e 50%<!-- fact: BALANCE.recovery.encounterChakraPct=0.5 --> do chakra máximos, renova a loja depois de chefe, avança a história e confere desbloqueios. `chooseReward` resolve a primeira escolha pendente (kit, pílula, reforço, ryo ou treino de +4<!-- fact: BALANCE.shop.trainingUses=4 --> usos de maestria; nunca jutsu, correção C12) e `continueFromResult` só segue com todas resolvidas.

**Por quê**: a run também é uma **máquina de estados** (o conceito da Alfa 0.6): cada função confere a fase com `requirePhase` e lança `RuleError('wrongPhase')` se a ação não cabe ali, o que impede, por exemplo, comprar no meio de uma luta. Todas as funções devolvem uma run **nova**, e o RNG da run vive como número em `rngState`: cada função recria o `Rng` com `Rng.fromState`, usa e guarda o estado novo. Assim, mesma semente e mesmas ações dão a mesma run inteira (teste `mesma semente + mesmas ações = mesma run`). O jogo tem um cuidado contra **save-scum** (salvar, perder e recarregar até a sorte ajudar): `startEncounter` guarda em `encounterStart` o estado do RNG e as estatísticas **antes** do encontro. A Alfa 0.8 usa essa foto: quem recarrega no meio da luta volta ao início do mesmo encontro, com os mesmos sorteios, e não ganha uma luta nova. A recuperação parcial entre encontros e o Acampamento antes dos chefes fazem o HP virar um recurso da run inteira, não só de uma luta.

**Alternativas**: uma classe `Run` com métodos que mudam o próprio estado é o jeito mais comum em JavaScript, mas o "recarregar volta ao mesmo encontro", o simulador e os testes de determinismo precisam de estados que não mudam por baixo. Sortear a semente de novo a cada encontro (`Math.random`) deixaria recarregar a página como forma de trocar a sorte. Oferecer jutsus na escolha 1-de-3, como o DD v2 sugeria, contradiz a regra fixa de desbloqueio por status (C12 em `docs/ANALISE.md`).

**Riscos e armadilhas**: `battleAction` clona a run inteira a cada ação; o simulador passa `inPlace: true` para pular o clone, e o comentário da função avisa que nesse modo a run recebida é **mutada**, então a interface nunca pode usá-lo. No fim da saga o `nodeIndex` fica igual a `nodes.length` (todos os nós concluídos): a validação de save da Alfa 0.8 rejeitava esse índice e descartava a run vencida, o que só a revisão final do Plano 1 (`662d506`) corrigiu. Na vitória as escolhas 1-de-3 pendentes são descartadas de propósito, porque não há próximo encontro. E a ordem dentro de `finishEncounter` importa: a recuperação de 25% vem **depois** de medir `hpPctEnd`, senão o título "Por um Fio" (Passo 3) nunca seria possível.

### Passo 3 — Estatísticas da run derivadas de eventos

**O quê**: em `src/game/meta/stats.ts`, `RunStats` guarda dano causado e recebido, maior golpe, críticos, usos de cada jutsu, chakra gasto, turnos, itens, ryo ganho e gasto, derrotados por grau, chefes vencidos, elites, vitórias sem dano e `bossMinHpPct` (o menor HP, em fração, com que um chefe foi vencido). `trackBattleEvents(stats, eventos, 'player')` percorre os eventos da Alfa 0.5 (`damage`, `dot`, `jutsuUsed`, `turnStart`, `itemUsed`) e devolve estatísticas novas. `trackEncounterEnd` soma o que só se sabe no fim do encontro (vitória, grau, chefe, `hpPctEnd`). `mostUsedJutsu` aponta o jutsu mais usado da run. A run chama as duas em `absorbBattleEvents` e `finishEncounter`.

**Por quê**: as estatísticas alimentam a Ficha, o Histórico e os títulos, mas o combate não sabe que elas existem. Derivar tudo dos **eventos** que o motor já emite para a interface desenhar mantém a batalha simples e garante que a tela e as estatísticas contam a mesma história: se o log mostra um crítico, a estatística conta um crítico. Um título novo que precise de outra contagem é uma linha a mais em `stats.ts`, sem tocar em `src/game/combat/battle.ts`. O título "Por um Fio" (vencer um chefe com menos de 10% de HP, em `src/data/titles.ts`) lê `bossMinHpPct`; por isso o campo começa em `null` ("nenhum chefe vencido"), e não em 0, que já contaria como "venceu com 0% de HP".

**Alternativas**: contadores dentro do motor de batalha (`state.crits++` no meio do cálculo de dano) são mais diretos, mas espalham regra de estatística pelo combate e criam o risco de a tela e a estatística divergirem. Calcular as estatísticas só no fim da run, a partir do estado final, perde o que não fica no estado (o maior golpe, os críticos).

**Riscos e armadilhas**: a mesma ação não pode ser contada duas vezes. A run soma as estatísticas por evento, e o save da Alfa 0.8 volta ao início do encontro; por isso `encounterStart` guarda também uma cópia das estatísticas, senão quem recarregasse no meio da luta somaria o dano daquela luta duas vezes. `trackBattleEvents` conta todo `dot` que não atinge o jogador como dano causado por ele, o que só vale enquanto a batalha é um contra um. `trackEncounterEnd` devolve as estatísticas intactas quando o encontro foi perdido, e o teste `derrota não conta como vitória e nada é mutado` protege isso.

### Passo 4 — Meta-progressão: Histórico, títulos e Enciclopédia

**O quê**: em `src/game/meta/meta.ts`, `MetaState` é o que sobrevive entre runs: jutsus aprendidos e dominados em qualquer run, títulos desbloqueados, estatísticas vitalícias e o Histórico, com no máximo 50<!-- fact: BALANCE.history.maxEntries=50 --> entradas (a mais recente primeiro). `recordRunEnd(meta, run, resultado, agora)` soma a run às estatísticas vitalícias, acrescenta a entrada do Histórico com o texto de `runEndText` ("Morreu na Saga da Onda, nível 6, para Zabuza Momochi") e um retrato do personagem, avalia os títulos com `isTitleEarned` e devolve a meta nova e os títulos novos. `availableTitles` lista os que o jogador pode escolher na criação (os ocultos nunca aparecem), e `encyclopedia` lista o pool completo de jutsus, sem os golpes exclusivos de inimigo, marcando os aprendidos e os dominados.

**Por quê**: num roguelike, perder a run é o normal, e a **meta-progressão** é o que dá sentido a perder: o jogador volta com um título novo (um bônus pequeno, como +3% de crítico), vê no Histórico como foi cada tentativa e acompanha a coleção de jutsus na Enciclopédia. Os bônus de título são pequenos de propósito: a run continua sendo decidida pelas escolhas dentro dela. Registrar tudo numa função só, chamada uma vez no fim da run, deixa claro o único ponto em que a meta muda.

**Alternativas**: atualizar a meta a cada encontro deixaria o Histórico com runs pela metade e somaria duas vezes o que for repetido depois de recarregar. Guardar a meta dentro da run perderia tudo quando a run é apagada. Um Histórico sem limite cresceria para sempre no `localStorage`, que tem cota pequena no navegador.

**Riscos e armadilhas**: a versão inicial de `recordRunEnd` (commit `e47876f`) **não era idempotente**: chamar duas vezes com a mesma run (o que acontece se o jogo fechar entre gravar a meta e apagar a run) somava a run duas vezes nas estatísticas vitalícias e criava duas entradas no Histórico. Além disso, o id da entrada era `run-${now}-${seed}`, com o relógio do momento do registro, então nem dava para reconhecer a repetição. A revisão final do Plano 1 (`662d506`) trocou o id por `run-${startedAt}-${seed}` (estável, porque `startedAt` é gravado na criação da run) e acrescentou `lastRecordedRunId`, que mantém a idempotência mesmo depois de o Histórico cortar a entrada antiga em 50 (teste `idempotência vale mesmo se o histórico já cortou a entrada`). Um cuidado sutil: `isTitleEarned` recebe a meta **já somada** com a run, porque "Demônio da Névoa" depende de Zabuza ter caído pelo menos uma vez e "Caçador de Bandidos" de 30 inimigos de grau D somando todas as runs, contando esta.

## Critérios de conclusão

- `npx vitest run tests/shop.test.ts tests/run.test.ts tests/stats.test.ts tests/meta.test.ts` passa.
- `npm run typecheck` termina sem erros.
- Com a mesma semente e as mesmas ações, duas runs terminam iguais (teste `mesma semente + mesmas ações = mesma run`).

## Testes

- `tests/shop.test.ts`: prova o estoque (consumíveis fixos, 2 equipamentos distintos, 1 Pergaminho Raro), a compra de consumível com estoque ilimitado, os `RuleError` sem ryo e fora do estoque, o equipamento que sai do estoque e não pode ser comprado duas vezes, o HP atual que sobe junto com o máximo ao equipar, o limite de 5 Pergaminhos Raros por run e o desconto do título Colecionador.
- `tests/run.test.ts`: prova a run nova (26 nós, 3 bifurcações de elite nunca antes de Acampamento, mesma semente gera a mesma run), os encontros (recompensas da tabela, elite só onde há bifurcação com XP ×1,6, Zabuza com Acampamento, vários níveis com uma escolha por nível, saga que avança e loja que renova, derrota que encerra a run, vitória sobre Haku que conclui a saga), a imutabilidade e a recusa de ação na fase errada, o determinismo e a preparação entre encontros (pontos e Pergaminho Raro que desbloqueiam jutsu, compra que registra o gasto).
- `tests/stats.test.ts`: prova a contagem por eventos (dano, maior golpe, críticos, jutsus, chakra, turnos, itens), o fim de encontro (vitórias, derrotados por grau, elites, ryo), chefe sem dano e chefe com menos de 10% de HP, e que a derrota não conta como vitória.
- `tests/meta.test.ts`: prova a idempotência de `recordRunEnd` (inclusive depois do corte em 50), o Histórico com texto e retrato, os textos de vitória e abandono, os títulos (Demônio da Névoa, Caçador de Bandidos somando runs, Sem um Arranhão, Por um Fio, Mestre de Jutsus, a linha elemental de maestria), os títulos ocultos fora da lista, a Enciclopédia sem golpes de inimigo e que a meta recebida não é mutada. Os testes de idempotência entraram com o `662d506`.

## Patch log

### Adicionado

- A loja, o equipamento e o Pergaminho Raro em `src/game/run/shop.ts`.
- O ciclo da run em `src/game/run/runManager.ts`, com os tipos em `src/game/run/types.ts` e a ponte com a batalha em `src/game/run/battleSetup.ts`.
- As estatísticas por eventos em `src/game/meta/stats.ts`.
- A meta-progressão em `src/game/meta/meta.ts`.
- `run.eliteForks` em `src/game/Balance.ts` (commit `9b57eeb`).
- Testes em `tests/shop.test.ts`, `tests/run.test.ts`, `tests/stats.test.ts` e `tests/meta.test.ts`.

### Alterado

- `recordRunEnd` passou a usar o id estável `run-${startedAt}-${seed}` e o campo `lastRecordedRunId` na revisão final do Plano 1 (`662d506`), depois da Alfa 0.8.

### Corrigido

Nada nesta versão.

### Removido

Nada nesta versão.

### Problemas conhecidos

- `buyItem` não tem `else` para um `kind` de item desconhecido: um tipo novo em `src/data/items.ts` seria cobrado sem ser entregue.
- `recordRunEnd`, como saiu desta versão, não é idempotente e usa o relógio no id da entrada; corrigido no `662d506` (ver "Alterado").
- `trackBattleEvents` assume batalha um contra um ao contar o dano contínuo como dano causado pelo jogador.
- A condição de título `promotedRank` sempre devolve `false` no MVP.
