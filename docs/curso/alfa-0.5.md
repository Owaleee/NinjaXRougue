# Alfa 0.5 — Efeitos e resolução de golpe

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `41b4395` e `cad6791` (use `git log --oneline` para conferir e `git show <sha>` para ver o código como ficou).

## Objetivo

Ao fim desta versão o jogo tem as peças de que a batalha precisa: um participante genérico de luta (`Combatant`), uma lista de eventos que descreve tudo o que acontece, um sistema único para buffs, debuffs, controles, dano contínuo e transformações, e a função que resolve um golpe (anulação, esquiva, crítico, elemento, bônus e redução) com a fórmula de dano da spec.

## Escopo

### Entra

- O combatente (`Combatant`), o efeito ativo (`ActiveEffect`), as ações (`Action`) e o estado da batalha (`BattleState`) em `src/game/combat/types.ts`.
- Os eventos do motor (`GameEvent`) em `src/game/events.ts`.
- O sistema de efeitos em `src/game/effects/EffectSystem.ts`: `aggregateMods`, `effectiveAttr`, `applyEffect`, `removeEffect`, `tickDurations`, `consumeCharge`, `applyDots`, `payTransformationUpkeep`, `cleanseIllusions`, `controlDuration`.
- O custo de chakra visto pelo combatente (`costFor`, `currentMasteryLevel`) em `src/game/combat/cost.ts`.
- A resolução de golpe (`resolveHit`) em `src/game/combat/damage.ts` e a constante `damage.minDamage` em `src/game/Balance.ts`.
- O gerador de sorteios de teste (`SeqRng`) e o combatente neutro (`makeCombatant`) em `tests/helpers.ts`.
- Os testes em `tests/effects.test.ts` e `tests/damage.test.ts`.

### Fica de fora

- Quem chama tudo isso numa ordem de turnos: a máquina de estados da batalha entra na Alfa 0.6 (`src/game/combat/battle.ts`). Nesta versão, efeitos e golpes são testados chamando as funções diretamente.
- Ligar e desligar a transformação como ação do jogador e o Kai como ação: Alfa 0.6. Aqui só existem a aplicação, a manutenção e a remoção do efeito.
- Quem lê os eventos: o log de batalha (`src/ui-dom/view/log.ts`) e a fila de animação da batalha (`src/scenes/animationQueue.ts`) entram na Beta 0.9; o rastreador de estatísticas, na Alfa 0.7.
- Invocações e equipes: o combate já trabalha com uma lista de combatentes, mas o MVP só tem um contra um.

## Passo a passo

### Passo 1 — Eventos (`GameEvent`) como a saída do motor

**O quê**: em `src/game/events.ts`, declare `GameEvent` como uma **união discriminada**: um tipo que é "um destes objetos", cada um com um campo `type` diferente e os seus próprios dados (`{ type: 'damage'; sourceId; targetId; amount; crit; elementMult; jutsuId; hpAfter }`, `{ type: 'dodge'; ... }`, `{ type: 'effectApplied'; ... }`, `{ type: 'transformOff'; reason: 'manual' | 'noChakra' | 'battleEnd' }` e outros). Toda função do motor que muda o estado devolve, junto, a lista dos eventos que produziu, na ordem em que aconteceram. Em `src/game/combat/types.ts`, o `Combatant` descreve qualquer participante (jogador ou inimigo) com os mesmos campos: atributos, HP, chakra, jutsus, efeitos ativos, Tenacidade, multiplicador de dano do grau.

**Por quê**: numa batalha de jogo, uma ação do jogador desencadeia várias coisas: o golpe, o dano, um efeito aplicado, o inimigo derrotado, o fim da luta. A tela precisa **mostrar** cada uma, em sequência, com animação e texto. Se o motor devolvesse só o estado final, a interface teria de comparar "antes" e "depois" e adivinhar o que aconteceu (o HP caiu 30: foi um golpe ou uma queimadura? houve crítico?). Com a lista de eventos, o motor conta a história e quem está de fora decide o que fazer com ela: o log a escreve, o animador a encena, as estatísticas a contam. O motor não conhece nenhum deles, o que mantém `src/game/` sem DOM nem Phaser. Um evento é também um bom alvo de teste: `expect(events[0]).toMatchObject({ type: 'dodge' })`.

**Alternativas**: callbacks (`onDamage(fn)`) ou um `EventEmitter` dariam o mesmo desacoplamento, mas fariam o motor chamar código da interface **durante** o cálculo, no meio de uma mutação; um erro na animação interromperia a regra no meio, e a ordem passaria a depender de quem se inscreveu primeiro. Uma lista devolvida é dado puro: dá para guardar, comparar em teste e reanimar depois. Strings livres no log ("Naruto causou 30 de dano") seriam mais rápidas, mas amarrariam o motor ao idioma e não serviriam ao animador.

**Riscos e armadilhas**: a união só ajuda se quem a consome tratar todos os casos. O log da Beta 0.9 (`formatEvent` em `src/ui-dom/view/log.ts`) tem um `default: return null`, de propósito, para eventos que não viram linha (como `turnStart`); o efeito colateral é que um tipo de evento novo acrescentado aqui some do log em silêncio, sem erro de compilação. Quem acrescentar um evento precisa procurar os `switch (e.type)` do projeto. Outro risco é a ordem: a interface anima na ordem da lista, então emitir `defeated` antes do `damage` que o causou faria o inimigo cair antes de apanhar.

### Passo 2 — Um sistema genérico de efeitos e a transformação

**O quê**: em `src/game/effects/EffectSystem.ts`, todo efeito é uma `EffectDef` dos dados (Alfa 0.3) e, quando ativo num combatente, um `ActiveEffect` com `remaining` (turnos restantes, ou `null` para "sustentado"), quem aplicou e se a carga já foi usada. `aggregateMods` soma as passivas (clã, título) e os `mods` de todos os efeitos ativos num único objeto de totais; `effectiveAttr(c, 'vel')` = atributo × (1 + soma dos percentuais). `applyEffect` trata três casos: **controle** (Imobilizado, Atordoado, Ilusão) é recusado durante a Tenacidade, tem a duração limitada por `controlDuration` e, se já houver um controle, só renova a duração; **transformação** substitui outra transformação ativa; os demais renovam a duração se já existirem, sem acumular. `removeEffect` tira o efeito e, se for controle, liga a Tenacidade (`control.tenacityTurns` = 2<!-- fact: BALANCE.control.tenacityTurns=2 --> turnos). `tickDurations` desconta um turno de tudo e da Tenacidade. `applyDots` aplica o dano por turno (Queimadura: 4% do HP máximo, mínimo 1). `consumeCharge` gasta uma **carga**. `payTransformationUpkeep` cobra a manutenção da transformação ou a desliga com `transformOff` motivo `noChakra`.

**Por quê**: um **efeito por tempo** é qualquer alteração que dura alguns turnos e depois some: +10% de Defesa por 3 turnos, −20% de Velocidade por 2, Queimadura por 3. Uma **carga** é um efeito que espera um gatilho e se gasta nele: Kawarimi anula o próximo golpe recebido, Henge dá 30% de chance de o próximo golpe errar, o clone do Kage Bunshin absorve um golpe. Em vez de escrever código para cada jutsu, todos passam pelas mesmas funções, e um efeito novo é só dado. O **controle** tira o turno do alvo, e por isso é limitado: no máximo `control.maxTurnsCommon` = 2<!-- fact: BALANCE.control.maxTurnsCommon=2 --> turnos em inimigos comuns e `control.maxTurnsBoss` = 1<!-- fact: BALANCE.control.maxTurnsBoss=1 --> em chefes, e depois de cada controle o alvo fica imune por 2 turnos (a **Tenacidade**). Sem esses limites, uma sequência de controles prenderia o chefe a luta inteira. A **transformação** (Sharingan, nos dados) é um efeito sustentado: custa 0 para ativar e 2 de chakra por turno (`activationCost` e `upkeepPerTurn` em `src/data/effects.ts`), e acaba sozinha quando o chakra não paga a manutenção.

**Alternativas**: uma classe por efeito (`class Queimadura extends Efeito { onTurnStart() }`) é o padrão "Strategy" e deixa cada efeito livre para fazer qualquer coisa, mas tira o efeito dos dados: a Enciclopédia não conseguiria listar o que ele faz, e salvar um efeito ativo exigiria reconstruir a classe. Acumular efeitos repetidos (duas Defesas Reduzidas = −10%) daria profundidade, mas abriria espaço para combinações sem teto; o MVP escolheu "reaplicar renova".

**Riscos e armadilhas**: as funções do `EffectSystem` **mutam** o combatente recebido (`c.effects.push`, `c.hp -= ...`). Isso é uma exceção documentada à regra "o motor não muta o argumento": elas são chamadas só pela batalha, sobre um estado **já clonado** (`structuredClone` em `applyAction`, Alfa 0.6). Chamar `applyEffect` sobre o combatente guardado na run, sem clonar, corromperia o estado salvo e quebraria o "recarregar volta ao início do encontro". Outro cuidado é a ordem dentro de `tickDurations`: ela itera sobre uma cópia (`[...c.effects]`), porque `removeEffect` troca o array no meio do laço. Por fim, `consumeCharge` remove o efeito só quando ele não tem `mods`: Kawarimi some ao ser gasto, mas o Kage Bunshin continua dando +25% de dano de jutsu depois de perder o clone (teste `cargas: Kawarimi some ao consumir; Kage Bunshin mantém o bônus`).

### Passo 3 — Resolver um golpe

**O quê**: em `src/game/combat/damage.ts`, `resolveHit(atacante, alvo, spec, rng)` recebe o Poder, o atributo que escala o golpe, o elemento, o nível de maestria e o id do jutsu (ou `null` para Atacar, que usa `power.attack` = 18<!-- fact: BALANCE.power.attack=18 -->). A ordem é fixa: (1) uma carga de Kawarimi anula o golpe sem sortear nada; (2) uma carga de Henge é gasta e sorteia se o golpe erra; (3) sorteio de esquiva; (4) uma carga de clone do Kage Bunshin absorve o golpe; (5) sorteio de crítico, sorteio da variação e cálculo do dano:

`dano = Poder × (1 + 0,03·m) × (1 + Atr/40) × Elem × (1 + Σbônus) × (1 − Red) × Crit × Var × multGrau`, e ×0,5 se o alvo estiver defendendo.

O termo de maestria usa `mastery.damagePerLevel` = 0.03<!-- fact: BALANCE.mastery.damagePerLevel=0.03 --> (correção C1 do `docs/ANALISE.md`). O termo `(1 + Σbônus)` é um **balde aditivo único** (correção C2): soma dano geral, dano de jutsu (só se for jutsu) e dano do elemento do golpe, vindos de clã, título, transformação e buffs. A redução vem de `totalReduction` (Defesa efetiva do alvo mais efeitos, teto de 75%). `src/game/combat/cost.ts` completa a versão: `costFor` calcula o custo de chakra do jutsu para o combatente agora, com a maestria derivada dos usos (`currentMasteryLevel`) e o desconto de título somado pelo `aggregateMods`.

**Por quê**: o DD v2 escrevia `(1 + Maestria)`, o que, com maestria de 1 a 5, daria +100% de dano por nível; a C1 traz o termo para os +3% por nível que o próprio DD v2 promete na §8 (maestria +5 = +15%, teste `maestria +5 soma 15% de dano`). A C2 resolve uma ambiguidade: se cada bônus fosse um multiplicador separado, Sharingan (+15% de jutsu), afinidade Katon (+15% de Fogo) e Kage Bunshin (+25% de jutsu) se multiplicariam (1,15 × 1,15 × 1,25 ≈ 1,65) em vez de somar (1,55), e cada bônus novo tornaria a conta mais explosiva. A **ordem dos sorteios** é um contrato: o `Rng` com semente (Alfa 0.1) devolve uma sequência fixa de números, e cada sorteio consome o próximo. Se a ordem mudar (crítico antes da esquiva), a mesma semente passa a produzir outra luta: os testes que fixam sorteios com `SeqRng` (`[0.99, 0.99, 0.5]` = não esquiva, não crita, variação ×1,0) quebram, e um save feito no meio da run deixa de reproduzir o mesmo encontro.

**Alternativas**: sortear tudo de uma vez no começo (esquiva, crítico, variação) simplificaria a leitura, mas gastaria sorteios inúteis quando o golpe é anulado e mudaria a sequência por um detalhe de implementação. Um modelo de "acerto" com chance de errar além da esquiva (comum em RPGs) acrescentaria mais um sorteio sem decisão nova para o jogador; o DD v2 só tem esquiva. Multiplicar os bônus (o contrário da C2) foi descartado pelo motivo acima.

**Riscos e armadilhas**: o primeiro risco é sortear quando não se deve. O Kawarimi anula **sem** consumir sorteio (teste `Kawarimi anula o golpe sem sortear nada`, com `SeqRng([])` vazio); o Henge só sorteia se houver a carga. Um `rng.chance` a mais nesses caminhos desalinha toda a sequência seguinte. O segundo é o elemento do alvo: para o jogador, `element` é a afinidade, e ela também é o elemento de defesa; um Uchiha (Fogo) apanha mais de Água. O terceiro é a carga do Henge: ela é gasta acertando ou não (teste `Henge: 30% de errar, consumido acertando ou não`), e a chance vem de `chargeChance ?? 0`, que engole um dado ausente (ver "Problemas conhecidos"). Por fim, `resolveHit` muta o alvo (HP e cargas), pelo mesmo motivo do Passo 2.

### Passo 4 — O piso de dano vem do `Balance.ts`

**O quê**: depois de arredondar, o dano é `Math.max(B.damage.minDamage, Math.round(dmg))`, com `damage.minDamage` = 1<!-- fact: BALANCE.damage.minDamage=1 --> acrescentado a `src/game/Balance.ts` neste commit (`cad6791`). Ao zerar o HP do alvo, `resolveHit` emite também `defeated`.

**Por quê**: com redução alta, multiplicador de grau baixo e Defender, a conta pode dar menos que meio ponto, e `Math.round` levaria a 0. Um golpe que acerta e não causa dano é confuso para o jogador ("acertou e nada aconteceu?") e pode travar uma luta em que os dois lados só se defendem. O piso garante que todo acerto conta. O código do plano (`docs/superpowers/plans/2026-10-04-plano-1-motor.md`) escrevia `Math.max(1, ...)` com o literal; a implementação levou o número para o `BALANCE`, seguindo a regra de que não há número de balanceamento fora de `Balance.ts` (Alfa 0.2).

**Alternativas**: permitir dano 0 e mostrar "sem efeito" seria fiel a alguns jogos, mas, com a batalha limitada por rodadas (Alfa 0.6), uma luta de dano zero só terminaria por tempo. Um piso proporcional (5% do Poder) seria mais "justo" com golpes fortes, mas é uma regra nova que o DD v2 não tem.

**Riscos e armadilhas**: o piso só vale para golpe que **acerta**: esquiva, Kawarimi, Henge e clone devolvem `landed: false` sem dano, e isso é intencional. O piso também esconde erros de dados: um jutsu com Poder 0 por engano causaria sempre 1 de dano, sem quebrar nenhum teste de formato (o teste `nunca causa menos de 1 de dano e emite defeated ao zerar` usa Poder 1 de propósito). Mudar `minDamage` altera o resultado de lutas longas contra chefes de muita Defesa, então deve passar por `npm run sim:check`.

## Critérios de conclusão

- `npx vitest run tests/effects.test.ts tests/damage.test.ts` passa.
- `npm run typecheck` termina sem erros.
- `src/game/combat/damage.ts` não tem número de balanceamento literal: todos vêm de `B.` (o `BALANCE`).

## Testes

- `tests/helpers.ts`: não é um teste, é a base deles. `SeqRng` é um `Rng` que devolve, em ordem, os números passados (e depois um valor fixo), para que cada teste escolha o resultado de cada sorteio; `makeCombatant` monta um combatente neutro (atributos 5, 100 de HP, 50 de chakra) que cada teste sobrescreve.
- `tests/effects.test.ts`: prova que o buff dura N turnos e expira com evento, que reaplicar renova sem acumular, que controle em chefe dura no máximo 1 turno, a Tenacidade de 2 turnos, um controle por vez, a Queimadura (4% por turno, 3 turnos, `defeated` ao zerar), a soma aditiva de passivas e efeitos, o Pergaminho de Reforço no atributo efetivo, a manutenção da transformação e o desligamento sem chakra, as cargas (Kawarimi some, Kage Bunshin mantém o bônus), o Kai removendo a Ilusão e iniciando a Tenacidade, e `tickDurations` preservando um efeito.
- `tests/damage.test.ts`: prova o dano-base de Atacar, o crítico ×1,5, a esquiva sem dano, a vantagem elemental com bônus num único balde, a maestria +5 (+15%), o multiplicador de grau e o Defender, o Kawarimi sem sorteio, o clone que absorve depois da esquiva, o Henge consumido acertando ou não, e o piso de 1 de dano com `defeated`.

## Patch log

### Adicionado

- `Combatant`, `ActiveEffect`, `Action` e `BattleState` em `src/game/combat/types.ts`.
- `GameEvent` em `src/game/events.ts`.
- O sistema genérico de efeitos em `src/game/effects/EffectSystem.ts`.
- `costFor` e `currentMasteryLevel` em `src/game/combat/cost.ts`.
- `resolveHit` em `src/game/combat/damage.ts` e `damage.minDamage` em `src/game/Balance.ts`.
- `SeqRng` e `makeCombatant` em `tests/helpers.ts`; testes em `tests/effects.test.ts` e `tests/damage.test.ts`.

### Alterado

Nada nesta versão.

### Corrigido

Nada nesta versão.

### Removido

Nada nesta versão.

### Problemas conhecidos

- `chargeChance ?? 0` em `resolveHit` engole um dado ausente: um efeito de carga `missChance` sem `chargeChance` seria gasto sem nunca fazer o golpe errar, e a validação dos dados (Alfa 0.3) não confere esse campo.
- `effectiveAttr` não tem piso em 0: debuffs que somem mais de −100% num atributo dariam atributo negativo. Não acontece no MVP, cujos debuffs são de −5% (Defesa) e −20% (Velocidade).
