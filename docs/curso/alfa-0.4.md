# Alfa 0.4 — Personagem e progressão

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `58685ee` (use `git log --oneline` para conferir e `git show 58685ee` para ver o código como ficou).

## Objetivo

Ao fim desta versão o jogo tem um personagem de verdade: criado com clã, afinidade e pontos distribuídos, que ganha XP e sobe de nível, aprende jutsus sozinho quando cumpre os requisitos, equipa até 4 deles e fica melhor em cada jutsu à medida que o usa (maestria), com o custo de chakra calculado a partir disso.

## Escopo

### Entra

- O personagem da run (`PlayerCharacter`), a criação (`createCharacter`), a distribuição de pontos (`allocatePoints`), o ganho de XP (`gainXp`) e o atributo efetivo com equipamento (`effectiveAttrs`) em `src/game/progression/character.ts`.
- Os slots de jutsu (`slotCount`, `equipJutsu`, `unequipJutsu`, `setLoadout`) em `src/game/progression/loadout.ts`.
- A maestria (`masteryStepUses`, `masteryCap`, `masteryLevelFromUses`, `masteryProgress`) e o custo de chakra (`jutsuChakraCost`) em `src/game/progression/mastery.ts`.
- A regra fixa de desbloqueio (`meetsRequirements`, `missingRequirements`, `checkUnlocks`) em `src/game/progression/unlock.ts`.
- Os testes em `tests/progression.test.ts` e `tests/unlock.test.ts`.

### Fica de fora

- A escolha 1-de-3 que acompanha cada nível ganho: `gainXp` só devolve quantos níveis subiram (`levelsGained`); quem gera uma oferta por nível é a run, na Alfa 0.7 (`rollRewardChoices` em `src/game/run/runManager.ts`).
- O personagem dentro da batalha: o combate não usa `PlayerCharacter`, e sim um `Combatant` genérico, que entra na Alfa 0.5 (`src/game/combat/types.ts`). A ponte entre os dois (`playerToCombatant`, `applyBattleResult`) é da Alfa 0.7.
- Quem conta os usos de maestria: o contador `masteryUses` existe aqui, mas só a batalha da Alfa 0.6 o incrementa (`src/game/combat/battle.ts`).
- Os presets de distribuição (correção C9 do `docs/ANALISE.md`): entram na Beta 0.9.0, em `src/game/progression/presets.ts` (commit `ff7bc45`).
- Ranks acima de Genin (mais slots): fora do MVP; `slotCount` já é o ponto de extensão.

## Passo a passo

### Passo 1 — Criar o personagem

**O quê**: em `src/game/progression/character.ts`, defina a interface `PlayerCharacter` (nome, clã, afinidade, nível, XP, atributos base, pontos livres, jutsus aprendidos e equipados, usos de maestria, equipamento, inventário, ryo, reputação, título, HP e chakra) e a função `createCharacter(params)`. Ela valida o nome (1 a 20 caracteres), exige um clã jogável, recusa título inexistente e exige que a distribuição inicial some exatamente `attributes.creationPoints` = 10<!-- fact: BALANCE.attributes.creationPoints=10 --> pontos, inteiros e não negativos (`normalizeAllocation`). Os atributos base começam em `attributes.start` = 5<!-- fact: BALANCE.attributes.start=5 --> em cada um dos oito atributos, e a distribuição é somada por cima: 8 × 5 + 10 = 50 pontos no nível 1. A afinidade vem do clã quando ele a fixa (`fixedAffinity`: Uchiha é sempre Fogo) e da escolha do jogador nos outros casos. HP e chakra começam cheios, calculados por `characterMaxHp` e `characterMaxChakra` com as fórmulas da Alfa 0.2.

**Por quê**: num roguelike, criar o personagem é a primeira decisão estratégica da run, e ela precisa ser barata de testar. Por isso `createCharacter` é uma função que recebe um objeto simples e devolve outro, sem tela nem estado global: o teste monta um Uzumaki em uma linha. O jogo separa dois tipos de atributo. O **base** (`baseAttrs`) é o que o jogador distribuiu mais o que o clã e os Pergaminhos Raros deram; o **efetivo** (`effectiveAttrs`) é o base mais o equipamento. Essa separação existe por causa da regra de desbloqueio do Passo 3. Os **destaques** do clã (`highlights`, por exemplo Gen e Crítico no Uchiha) não entram na criação: eles dão +1 automático por nível, no Passo 2.

**Alternativas**: uma classe `Character` com construtor e métodos (`personagem.levelUp()`) é o desenho mais comum em tutoriais de jogo, mas mistura dado e regra: o save (Alfa 0.8) teria de reconstruir instâncias a partir do JSON, e `structuredClone` não preserva métodos de classe. Com um objeto simples, salvar é `JSON.stringify` e clonar é `structuredClone`. Outra alternativa seria aceitar qualquer distribuição e deixar a interface impedir o erro; mas o motor é a fonte da regra, e a interface (ou um save editado à mão) pode errar.

**Riscos e armadilhas**: dados que vêm de fora do motor precisam ser conferidos no motor. O caso real do histórico é o título: a recusa de `titleId` inexistente com `RuleError('unknownTitle')` só foi acrescentada na revisão final do Plano 1 (commit `662d506`), porque a validação dos dados da Alfa 0.3 confere os títulos cadastrados, não o id que chega da tela de criação ou de um save. Sem ela, um título digitado errado entrava no personagem e era ignorado em silêncio, porque quem lê o título usa acesso opcional (`TITLES[id]?.mods`): o jogador escolhia um título e jogava sem o bônus, sem nenhum aviso. Outro cuidado é a ordem do cálculo: HP e chakra iniciais são calculados **depois** de montar os atributos, porque dependem deles (`hp` e `int`); calcular antes daria um personagem que começa a run ferido.

### Passo 2 — XP, níveis e a recompensa por nível

**O quê**: escreva `gainXp(personagem, quantidade)`. Ela recusa XP negativo, clona o personagem, soma a XP e, num laço `while`, sobe um nível enquanto a XP acumulada alcança `xpToNext(nível)` (da Alfa 0.2: `xp.toNextBase` = 24<!-- fact: BALANCE.xp.toNextBase=24 --> mais 12 por nível). A cada volta do laço: desconta o custo do nível, soma os pontos livres do clã (`freePointsPerLevel`: 5, ou 6 no Sem clã), dá +1 em cada atributo de destaque, sobe o HP e o chakra atuais junto com o máximo e ainda cura 25% do HP máximo (`recovery.levelUpHpPct`). Devolve o personagem novo e `levelsGained`. `allocatePoints` gasta os pontos livres depois, com a mesma regra de subir HP e chakra atuais quando o máximo sobe.

**Por quê**: **XP** (pontos de experiência) é a moeda que transforma vitórias em crescimento; o **nível** é o degrau que essa moeda compra. O laço existe porque um encontro pode dar XP para vários níveis de uma vez: o teste `216 de XP leva do nível 1 ao 5` em `tests/progression.test.ts` confere exatamente isso (36 + 48 + 60 + 72 = 216). O caso real é o chefe: o Review Focus 5 do Plano 1 (`docs/superpowers/plans/2026-10-04-plano-1-motor.md`) pede que um único Zabuza, que dá XP multiplicada, gere uma escolha 1-de-3 por nível ganho e acumule os pontos livres. Por isso `gainXp` devolve `levelsGained`: a run da Alfa 0.7 usa esse número para empilhar uma oferta por nível. Subir HP e chakra atuais junto com o máximo evita que subir de nível pareça castigo (máximo 150, atual 100: a barra "cai" sem o jogador ter apanhado).

**Alternativas**: subir no máximo um nível por chamada (`if` em vez de `while`) é mais simples, mas obriga quem chama a repetir a chamada e a lembrar de guardar a XP que sobrou; um esquecimento faz o jogador perder níveis. Uma tabela fixa de XP por nível (como muitos RPGs) seria fácil de ajustar à mão, mas a fórmula linear de `src/game/formulas.ts` já acompanha a tabela A.1 do DD v2 e fica em `Balance.ts`.

**Riscos e armadilhas**: um `while` que depende de entrada externa é um candidato a laço infinito. `gainXp(c, Infinity)` nunca termina, porque `Infinity − x` continua `Infinity`; `gainXp(c, NaN)` passa pela checagem `amount < 0` (`NaN < 0` é falso), não sobe nível e deixa `xp` como `NaN` para sempre. O motor só chama `gainXp` com XP calculada das próprias fórmulas, então isso não acontece no jogo, mas a função não se defende (ver "Problemas conhecidos"). Outra armadilha é clonar: `gainXp` trabalha sobre `structuredClone(c)` e o teste `não muta o personagem original` garante isso; mutar o argumento faria a tela de resultado mostrar o personagem já com o nível novo antes da animação. Note também que a cura de 25% vem **depois** de aumentar o máximo, e `clampVitals` corta o excesso.

### Passo 3 — Desbloqueio de jutsu só por status e os 4 slots

**O quê**: em `src/game/progression/unlock.ts`, `meetsRequirements(personagem, jutsu, pontoDaHistória)` confere as quatro condições da regra fixa (spec §5, em `docs/superpowers/specs/2026-10-04-narutotxgame-mvp-design.md`): não é golpe de inimigo (`enemyOnly`), o clã bate (ou o jutsu é geral), o ponto da história já chegou em `minStory`, o pré-requisito já foi aprendido, e os atributos **base** alcançam `requires`. `missingRequirements` diz quanto falta em cada atributo (a interface mostra "faltam 3 pontos"). `checkUnlocks` percorre `JUTSU_LIST`, aprende tudo o que ficou disponível e **repete até nada mudar**; cada jutsu novo ocupa um slot livre, e com os slots cheios fica só no repertório. Os slots vivem em `src/game/progression/loadout.ts`: `slotCount` devolve `loadout.geninSlots` = 4<!-- fact: BALANCE.loadout.geninSlots=4 -->, e `equipJutsu` com os slots cheios exige dizer qual jutsu substituir (`RuleError('slotsFull')`).

**Por quê**: a regra de jogo é que jutsu se aprende cumprindo condições, nunca escolhendo de uma lista (a correção C12 do `docs/ANALISE.md` tirou o jutsu da escolha 1-de-3 do DD v2). Isso torna a distribuição de pontos a decisão central. Os requisitos olham o atributo base, não o efetivo, porque o efetivo inclui equipamento: se valesse o efetivo, vestir uma Katana por um instante ensinaria um jutsu para sempre, e trocar de arma viraria um truque. O laço "até estabilizar" resolve cadeias: Rasengan exige Kage Bunshin; se o personagem passa a cumprir os dois de uma vez, a primeira volta aprende Kage Bunshin e a segunda, Rasengan (teste `pré-requisito: Rasengan exige Kage Bunshin`). Os 4 slots são a limitação que dá peso à escolha: o jogador sabe muitos jutsus, mas só leva quatro para a luta. Por isso aprender com os slots cheios não expulsa ninguém: o jogo não pode trocar a mão do jogador sem perguntar (Review Focus 4 do Plano 1).

**Alternativas**: percorrer a lista uma vez só, ordenada por dependência, evitaria o laço, mas exigiria manter a ordem de `JUTSU_LIST` correta à mão, e um jutsu fora de ordem ficaria para o próximo nível sem aviso. Equipar automaticamente o jutsu novo no lugar do mais fraco pouparia um clique, mas tiraria do jogador a decisão de montagem, que é parte do jogo.

**Riscos e armadilhas**: o histórico registra a duplicação de regra: a versão original de `checkUnlocks` comparava com `B.loadout.geninSlots` direto, enquanto `equipJutsu` usava `slotCount`; a revisão final (commit `662d506`) trocou para `slotCount(next)`, para que um rank futuro com mais slots não tenha de ser lembrado em dois lugares. Outro risco é o laço: ele termina porque cada volta só aprende jutsus ainda não aprendidos e a lista é finita; se um dia o desbloqueio puder **esquecer** um jutsu, o laço pode oscilar. Por fim, ciclos de pré-requisito não são detectados (registrado na Alfa 0.3): os dois jutsus nunca seriam aprendidos.

### Passo 4 — Maestria por usos e o custo de chakra

**O quê**: em `src/game/progression/mastery.ts`, a maestria de cada jutsu vai de +0 a +5 e é calculada a partir do número de usos guardado em `masteryUses`. `masteryStepUses(clã)` devolve quantos usos cada degrau exige (`mastery.stepUses`: 6, 9, 12, 15, 18, acumulados 6/15/27/42/60), com 25% a menos no Sem clã (`masteryUseMult`, arredondado para cima: 5, 7, 9, 12, 14). `masteryLevelFromUses(usos, jutsu, clã, afinidade)` soma os degraus até onde os usos alcançam e limita pelo teto: `mastery.maxLevel` = 5<!-- fact: BALANCE.mastery.maxLevel=5 -->, ou `mastery.maxLevelOffAffinity` = 3<!-- fact: BALANCE.mastery.maxLevelOffAffinity=3 --> para jutsu elemental fora da afinidade (o Sem clã ignora essa penalidade). `masteryProgress` alimenta a barra da interface. `jutsuChakraCost` calcula o custo final multiplicando: −5% por nível de maestria, +25% fora da afinidade, −10% em jutsu geral para o Sem clã, o desconto específico do clã (Uzumaki paga 20% a menos no Kage Bunshin) e o bônus de título; o resultado é arredondado, com mínimo de 1 (jutsu de custo zero continua zero).

**Por quê**: maestria é a recompensa por insistir num jutsu: ele fica mais forte (+3% de dano por nível, aplicado na Alfa 0.5) e mais barato. Medir por **usos**, e não por XP, faz a progressão seguir o que o jogador realmente faz: quem usa a Bola de Fogo toda luta fica bom na Bola de Fogo. Com XP, todo jutsu equipado subiria junto, inclusive o que nunca é usado, e a escolha dos quatro slots perderia peso. O teto de +3 fora da afinidade dá sentido à afinidade elemental sem proibir nada: um Uchiha pode usar jutsu de Vento, só não chega a dominá-lo. Guardar só o contador de usos e **derivar** o nível evita estado duplicado: mudar `stepUses` em `Balance.ts` recalcula a maestria de todo mundo, inclusive de saves antigos.

**Alternativas**: guardar o nível de maestria diretamente (`mastery: { bola_de_fogo: 3 }`) dispensaria o cálculo, mas exigiria lembrar de subir o nível em cada uso e tornaria o teto e o desconto do Sem clã regras espalhadas pelo combate. Somar os modificadores de custo (−25% + 25% = 0) em vez de multiplicar seria mais simples, mas a spec §4 define o custo como multiplicativo, e somar daria custo zero ou negativo com descontos grandes.

**Riscos e armadilhas**: arredondamento muda a regra. Os degraus do Sem clã usam `Math.ceil` (o teste `Sem clã precisa de 25% menos usos (arredondado para cima)` fixa isso). Com `Math.round` quase tudo daria igual (4,5 vira 5 nos dois casos, 13,5 vira 14), mas o quarto degrau mudaria: 15 × 0,75 = 11,25 dá 12 com `ceil` e 11 com `round`. Uma diferença que só aparece num degrau passa despercebida sem um teste com os valores exatos. No custo, o piso `Math.max(1, ...)` impede que maestria +5 e descontos levem um jutsu barato a custar 0, o que o tornaria infinito; o jutsu de custo zero é tratado antes, para não virar custo 1. Por fim, `isOffAffinity` só vale para jutsu com elemento: Taijutsu e Genjutsu nunca sofrem a penalidade (teste `fora da afinidade trava em +3 (exceto Sem clã e jutsus neutros)`).

## Critérios de conclusão

- `npx vitest run tests/progression.test.ts tests/unlock.test.ts` passa.
- `npm run typecheck` termina sem erros.
- Nenhuma função pública de `src/game/progression/` muta o personagem recebido: todas trabalham sobre `structuredClone`; só o auxiliar `clampVitals` muta, e só sobre a cópia.

## Testes

- `tests/progression.test.ts`: prova a criação (50 pontos no nível 1, HP e chakra cheios, afinidade Fogo fixa do Uchiha, recusa de título inexistente, de distribuição inválida, de nome vazio e de clã não jogável); a XP e os níveis (216 de XP levam do nível 1 ao 5, pontos livres mais destaques somam P(N), Sem clã com 6 pontos e sem destaques, cura de 25% ao subir, original intacto); a distribuição de pontos e a separação entre atributo base e efetivo; e a maestria e o custo (limiares 6/15/27/42/60, Sem clã mais rápido, teto +3 fora da afinidade, barra de progresso e a combinação multiplicativa do custo).
- `tests/unlock.test.ts`: prova a regra fixa (aprende e equipa nos slots livres, equipamento não desbloqueia, jutsu exclusivo só para o próprio clã, Suiryuudan só depois de Zabuza, cadeia Kage Bunshin → Rasengan numa só checagem, quinto jutsu vai só para o repertório, `missingRequirements`, golpes de inimigo nunca aprendidos) e os slots (equipar, trocar quando cheio, validar).

## Patch log

### Adicionado

- Personagem, criação, distribuição de pontos e XP em `src/game/progression/character.ts`.
- Slots de jutsu em `src/game/progression/loadout.ts`.
- Maestria e custo de chakra em `src/game/progression/mastery.ts`.
- Regra fixa de desbloqueio em `src/game/progression/unlock.ts`.
- Testes em `tests/progression.test.ts` e `tests/unlock.test.ts`.

### Alterado

Nada nesta versão.

### Corrigido

Nada nesta versão. (Depois, na revisão final do Plano 1, o commit `662d506` acrescentou a recusa de título inexistente em `createCharacter` e passou `checkUnlocks` a usar `slotCount`.)

### Removido

Nada nesta versão.

### Problemas conhecidos

- `gainXp` não tem teto de nível e não recusa XP não finita: `Infinity` prende o laço e `NaN` envenena a XP sem erro.
- `unequipJutsu` com um id que não está equipado é um no-op silencioso: devolve uma cópia igual, sem `RuleError`.
