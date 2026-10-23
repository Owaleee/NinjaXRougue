# Análise do DD v2 e decisões do MVP

> Documento da spec §13.1. Cada afirmação sobre o código cita o arquivo; cada número do balanceamento vem do `BALANCE` e leva colado um comentário HTML `fact:` com o caminho no `BALANCE` e o valor, que o `npm run docs:check` confere contra o código.

## 1. Como ler este documento

O DD v2 (`docs/referencia/NarutoTxGame_Documento_de_Design_v2.md`) é o documento de design original; a spec do MVP (`docs/superpowers/specs/2026-10-04-narutotxgame-mvp-design.md`) registra só o que muda em relação a ele, e tudo o que ela não cita segue o DD v2. `ASSUMIDO` marca uma regra que o DD v2 não define e que a spec (ou o código) decidiu, com justificativa. Quando a spec e o código divergem, este documento descreve o código: o motor está em `src/game/`, os dados em `src/data/`, a interface em `src/ui-dom/` e o simulador em `src/game/sim/` (executado por `tools/simulate.ts`); todas as constantes numéricas estão em `src/game/Balance.ts`.

## 2. Inconsistências encontradas e correções (C1–C15)

### C1 — Maestria na fórmula de dano

**Problema no DD v2:** a fórmula da §3/§9 é `Poder × (1 + Maestria) × ...`; com a maestria valendo 1 a 5, cada nível daria +100% de dano, o que contradiz a §8 (+3% por nível).
**Correção:** o termo vira `(1 + 0,03·m)`, com `m` de 0 a 5: `mastery.damagePerLevel` = 0,03 <!-- fact: BALANCE.mastery.damagePerLevel=0.03 --> e teto `mastery.maxLevel` = 5 <!-- fact: BALANCE.mastery.maxLevel=5 -->.
**Onde está no código:** `src/game/combat/damage.ts` (`resolveHit`) e `src/game/Balance.ts`.

### C2 — Onde entram os bônus de dano

**Problema no DD v2:** o termo `(1 + Título)` não diz onde entram Sharingan, Afinidade Katon, Kage Bunshin e os buffs.
**Correção:** um único termo aditivo `(1 + Σ bônus % de dano)`, que soma título, clã, transformação e buffs (dano geral, dano de jutsu e dano do elemento do golpe).
**Onde está no código:** `src/game/combat/damage.ts` (variável `bonus`) e `src/game/effects/EffectSystem.ts` (`aggregateMods`).

### C3 — "Prioridade" do Kawarimi

**Problema no DD v2:** o Ap. B dá ao Kawarimi no Jutsu o efeito "Prioridade", que não tem sentido num turno sequencial.
**Correção:** a prioridade foi removida; o jutsu cria uma carga que anula o próximo golpe recebido, com duração de 2 turnos.
**Onde está no código:** `src/data/jutsus.ts` (entrada `kawarimi`), `src/data/effects.ts` e `src/game/combat/damage.ts` (carga `negateHit`).

### C4 — Kunai "+2 de Crítico"

**Problema no DD v2:** a tabela de itens diz "+2 Velocidade e +2 de Crítico" sem dizer se é atributo ou porcentagem.
**Correção:** +2 no atributo Chance de Crítico (e +2 Velocidade), preço 250, slot de arma.
**Onde está no código:** `src/data/items.ts` (entrada `kunai`, `attrBonus: { vel: 2, crit: 2 }`).

### C5 — Blocos de inimigo da tabela A.4

**Problema no DD v2:** a tabela A.4 dá ao Bandido nível 1 41 pontos (a regra `P(N) × razão` dá 35) e ao nível 4 53 (a regra dá 49,7), e a elite aparece com grau "E", que não existe.
**Correção:** os inimigos são gerados por código: `pontos = round(P(N) × razão do grau)`, distribuídos pelos pesos do arquétipo pelo maior resto, com mínimo de 1 por atributo. A elite é grau D+, com razão `enemyGrades.D+.pointsRatio` 0,9, HP ×1,0 e dano ×0,8.
**Onde está no código:** `src/game/combat/enemyFactory.ts` (`distributePoints`, `createEnemy`), `src/data/enemies.ts` (Veteranos de grau D+) e `src/game/Balance.ts` (`enemyGrades`).

### C6 — Haku mais fácil que Zabuza

**Problema no DD v2:** pelo A.5 e pelo Ap. D item 3, Haku (grau B, HP ×1,3) sai mais fácil que Zabuza, embora seja o chefe final da saga.
**Correção:** a spec subiu o HP do grau B para ×1,5 e deu ao Haku uma 2ª fase abaixo de 50% de HP (`ai.phase2HpPct` = 0,5 <!-- fact: BALANCE.ai.phase2HpPct=0.5 -->); a calibração do simulador levou o HP para ×1,7 <!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 --> (seção 5). O dano do grau B ficou em ×0,8 <!-- fact: BALANCE.enemyGrades.B.damageMult=0.8 -->.
**Onde está no código:** `src/game/Balance.ts` (`enemyGrades.B`) e `src/game/combat/ai.ts` (funções `haku` e `zabuza`).

### C7 — Gogyou Fuuin exclusivo ou geral

**Problema no DD v2:** a §6 coloca Gogyou Fuuin entre os jutsus exclusivos do Uzumaki e o Ap. B.1 o lista como Geral.
**Correção:** Geral e da F2 (na obra é técnica do Orochimaru). O pool do Uzumaki fica com Kongou Fuusa (F1A) e Hakke no Fuuin Shiki (F3).
**Onde está no código:** `src/data/jutsus.ts` (`gogyou_fuuin` com clã `null` e fase F2; `kongou_fuusa` com clã `uzumaki`).

### C8 — Reputação das elites

**Problema no DD v2:** a §4 diz que, com 2 a 3 elites, quem completa a saga passa de 1000 de reputação; mas a elite substitui um comum e soma só 16 a mais (38 contra 22), então 928 + 48 = 976.
**Correção:** o texto foi corrigido; a missão de grau D opcional continua sendo o caminho até 1000 e fica para a F2. Os valores de reputação não mudaram: comum 22 <!-- fact: BALANCE.rewards.D.rep=22 -->, Zabuza 160 <!-- fact: BALANCE.rewards.C.rep=160 -->, Haku 240 <!-- fact: BALANCE.rewards.B.rep=240 -->.
**Onde está no código:** `src/game/Balance.ts` (`rewards`) e `src/i18n/pt-BR.ts` (`map.eliteInfo`, que não promete os 1000).

### C9 — Builds espalhadas travam em Zabuza

**Problema no DD v2:** o A.5 mostra que builds com pontos espalhados não passam de Zabuza, e a criação não orienta o jogador.
**Correção:** presets Ninjutsu, Taijutsu e Equilibrado-guiado na criação e um botão "Distribuir pelo preset" na distribuição de pontos; a distribuição manual continua livre.
**Onde está no código:** `src/game/progression/presets.ts`, `src/ui-dom/components/allocation.ts` e `src/ui-dom/screens/CreateScreen.ts`.

### C10 — Meditar fora da barra de batalha

**Problema no DD v2:** a §13 lista a barra de ações sem Meditar, que a §9 define como ação.
**Correção:** a barra tem Atacar, Defender, Meditar, Item, Transformar (só quem tem transformação) e os 4 jutsus.
**Onde está no código:** `src/ui-dom/screens/BattleScreen.ts`.

### C11 — "rank" em vez de "grau"

**Problema no DD v2:** a §13 e a §14 usam "rank" para item e inimigo, contra o glossário, que reserva o termo para o posto do ninja.
**Correção:** os textos de item e de inimigo usam "grau".
**Onde está no código:** `src/i18n/pt-BR.ts` (chaves `battle.grade`, `map.eliteInfo`, `hist.defeated`).

### C12 — Jutsu na escolha 1-de-3

**Problema no DD v2:** a §12 põe "um jutsu elegível novo" entre as recompensas 1-de-3, o que contradiz o desbloqueio automático por status da §15.
**Correção (decisão do usuário):** jutsu só se aprende cumprindo as condições de status; a escolha 1-de-3 oferece apenas kit, pílula, reforço, ryo ou treino.
**Onde está no código:** `src/game/progression/unlock.ts` (`meetsRequirements`), `src/game/run/runManager.ts` (`rollRewardChoices`) e `src/game/run/types.ts` (`REWARD_OPTIONS`).

### C13 — Kai sob controle

**Problema no DD v2:** Kai "remove controle de si mesmo", mas quem está controlado não age, então nunca poderia usá-lo.
**Correção:** sob controle do tipo Ilusão a única ação permitida é Kai, que remove a Ilusão e inicia a Tenacidade; Imobilizado e Atordoado fazem perder o turno.
**Onde está no código:** `src/game/combat/battle.ts` (flag `onlyKai` e erro `onlyKai`).

### C14 — Títulos impossíveis no MVP

**Problema no DD v2:** "Colecionador" exige 5 Pergaminhos Raros (4500 ryo, contra cerca de 1220 de renda na saga) e "Novo Chunin" exige uma promoção que só existe na F2.
**Correção:** os dois existem nos dados com condição e buff, mas ficam ocultos (`hidden: true`) até a F2.
**Onde está no código:** `src/data/titles.ts`.

### C15 — Fase do Hakke no Fuuin Shiki

**Problema no DD v2:** a §6 marca Hakke no Fuuin Shiki como [F2+] e o Ap. B como F3.
**Correção:** F3, porque o Ap. B é mais específico; no MVP ele aparece só como dado na Enciclopédia.
**Onde está no código:** `src/data/jutsus.ts` (`hakke_no_fuuin_shiki`, fase F3).

## 3. O que foi mantido do DD v2

- **Fórmulas** (§3, §9): HP máx `80 + 4·HP + 6·nível` (`hp.base` 80 <!-- fact: BALANCE.hp.base=80 -->, `hp.perPoint` 4 <!-- fact: BALANCE.hp.perPoint=4 -->, `hp.perLevel` 6 <!-- fact: BALANCE.hp.perLevel=6 -->), redução `Def/(Def+50)` com teto de 60% <!-- fact: BALANCE.defense.cap=0.6 -->, crítico com teto de 55% <!-- fact: BALANCE.crit.capPct=55 --> e dano ×1,5 <!-- fact: BALANCE.damage.critMultiplier=1.5 -->, roda elemental ×1,3 <!-- fact: BALANCE.damage.elementAdvantage=1.3 --> / ×0,8 <!-- fact: BALANCE.damage.elementDisadvantage=0.8 -->. Em `src/game/formulas.ts` e `src/game/Balance.ts`.
- **Clãs** (§6): Uzumaki, Uchiha e Sem clã com destaques e passivas do DD v2. Em `src/data/clans.ts`.
- **Jutsus F1A** (Ap. B): requisitos, custos, graus e fases; os jutsus de fases posteriores entram como dados para a Enciclopédia. Em `src/data/jutsus.ts` e `src/data/effects.ts`.
- **Desbloqueio automático por status** (§15): atributo base, clã, saga mínima e pré-requisito. Em `src/game/progression/unlock.ts`.
- **Maestria** (§8): limiares 6/9/12/15/18 de usos, −5% de custo e +3% de dano por nível. Em `src/game/progression/mastery.ts`.
- **Economia** (§11): recompensa de comum 30 ryo <!-- fact: BALANCE.rewards.D.ryo=30 -->, chefe C 200 ryo <!-- fact: BALANCE.rewards.C.ryo=200 -->, preços dos itens e limite de 5 Pergaminhos Raros por run <!-- fact: BALANCE.shop.rareScrollMaxPerRun=5 -->. Em `src/data/items.ts`, `src/game/run/shop.ts` e `src/game/Balance.ts`.
- **Saga da Onda** (§12, A.3): 26 nós, Zabuza no 13 e Haku no 26, com Acampamento antes de cada chefe. Em `src/data/saga.ts`.
- **Arquétipos e graus de inimigo** (§9, A.4): pesos e razões dos arquétipos; só a forma de gerar os pontos mudou (C5). Em `src/data/enemies.ts`.

## 4. Suposições (ASSUMIDO)

A busca `grep -n "ASSUMIDO"` na spec encontra 15 linhas e `grep -rn "ASSUMIDO" src tools` encontra 2. Delas, três não são suposições próprias: a linha da spec que define o marcador (topo da spec), a linha da §13 que pede este documento, e o comentário de `run.eliteForks` em `src/game/Balance.ts`, que repete a suposição das elites da spec §7 (está na mesma linha da tabela). Sobram 14 suposições, todas abaixo, na ordem da spec e depois a do código.

| Suposição | Por quê | Onde está |
|---|---|---|
| Cada combatente escolhe a ação na sua vez (sequencial), na ordem `Vel efetiva × (1 + rng[0; 0,10])` recalculada por rodada | Corresponde ao "Seu turno / Turno do inimigo" da §13 do DD v2 | `src/game/combat/battle.ts` |
| Buffs de redução somam por cima da redução por Defesa com teto total de 75% <!-- fact: BALANCE.defense.totalCap=0.75 --> | Sem um teto acima de 60%, o Doryuuheki não teria efeito em quem já está no teto | `src/game/formulas.ts` (`totalReduction`), `src/game/Balance.ts` |
| O elemento do defensor é a sua afinidade; inimigos sem elemento são neutros | O DD v2 não diz qual elemento o defensor tem | `src/game/run/battleSetup.ts`, `src/game/combat/damage.ts` |
| Os modificadores de custo de chakra são multiplicativos | O DD v2 lista os modificadores sem dizer como se combinam | `src/game/progression/mastery.ts` (`jutsuChakraCost`), `src/game/combat/cost.ts` |
| Usar item consome a ação do turno | O DD v2 não define; evita curar e atacar no mesmo turno | `src/game/combat/battle.ts` (`useItem`) |
| Ativar o Sharingan não gasta o turno (`activationCostsTurn: false`) | O Uchiha já rende abaixo das outras builds na Saga da Onda | `src/data/effects.ts`, `src/game/combat/battle.ts` |
| Detalhes dos efeitos dos jutsus do MVP onde o Ap. B é vago (Henge com rolagem independente de 30%, Bunshin +12% de esquiva, Kage Bunshin com carga de absorção, chances de controle de Kongou Fuusa e Genjutsu: Sharingan) | O Ap. B dá só o nome do efeito em vários jutsus | `src/data/jutsus.ts`, `src/data/effects.ts` |
| Elites opcionais: 3 bifurcações <!-- fact: BALANCE.run.eliteForks=3 --> "Comum ou Elite (D+)" sorteadas por run, nunca no nó antes de um Acampamento, com XP ×1,6 <!-- fact: BALANCE.xp.eliteMult=1.6 --> | O DD v2 cita elites sem dizer quantas nem onde | `src/game/run/runManager.ts` (`buildRunNodes`), `src/game/Balance.ts`, `src/data/enemies.ts` |
| A run começa com 0 ryo e inventário vazio | Não desviar da calibração do A.5 | `src/game/progression/character.ts` |
| Detalhes dos padrões de chefe (abertura, renovação de Kirigakure e Makyou, prioridades da 2ª fase) | O DD v2 §9 dá só as regras gerais de IA | `src/game/combat/ai.ts` |
| O atributo do Pergaminho de Reforço (+10% em Tai/Nin/Gen/Vel/Def) é escolhido ao usar | O DD v2 não diz qual atributo o pergaminho reforça | `src/data/items.ts`, `src/game/combat/battle.ts` (`useItem`) |
| Pergaminho Raro dá +1 no atributo base escolhido | O DD v2 dizia "+1 ou +2" sem regra para decidir | `src/game/run/shop.ts` |
| Caçador de Bandidos conta 30 inimigos grau D somando todas as runs (vitalício) | Numa run só há 24 comuns, então a contagem por run seria impossível | `src/data/titles.ts` (`lifetimeDefeatedGrade`) |
| Não há save dentro da batalha: o save guarda o estado do início do encontro, e recarregar recomeça a mesma luta | Evita save-scum do RNG, porque a semente do encontro é fixa | `src/game/save/save.ts` (`saveRun`) |
| Simulador: Uzumaki e Sem clã usam afinidade Vento; a build "Semi-equilibrado" recebeu pesos próprios | Daitoppa é o único jutsu elemental de dano da afinidade deles na Onda; o DD v2 não dá pesos para a Semi-equilibrada | `src/game/sim/builds.ts` |

## 5. Decisões tomadas depois da spec

### HP do Haku ×1,7 em vez de ×1,5

A C6 define o objetivo (Haku mais difícil que Zabuza, e de quem vence Zabuza 70% a 85% vencem Haku), não o número literal. Na calibração pelo simulador, `enemyGrades.B.hpMult` foi para ×1,7 <!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 -->, e Zabuza (grau C) foi para HP ×2,1 <!-- fact: BALANCE.enemyGrades.C.hpMult=2.1 --> e dano ×0,81 <!-- fact: BALANCE.enemyGrades.C.damageMult=0.81 -->. O registro das iterações está em `docs/balance-log.md`; os valores, em `src/game/Balance.ts`.

### Dano dos comuns (grau D) 0,65

`enemyGrades.D.damageMult` subiu para 0,65 <!-- fact: BALANCE.enemyGrades.D.damageMult=0.65 --> para o HP no fim dos comuns entrar na faixa de 75–85%; o passo seguinte (0,7) derrubava "chega a Zabuza" abaixo de 95% em Uzumaki e Sem clã. Detalhes em `docs/balance-log.md` (iteração 1); valor em `src/game/Balance.ts`.

### Métrica de maestria = jutsu principal

O simulador mede a maestria do jutsu principal, o mais usado da run (`mostUsedJutsu`), como a spec §12 pede. Em `src/game/sim/bot.ts`, `src/game/meta/stats.ts` e `src/game/sim/report.ts`.

### Robô do simulador não defende dois turnos seguidos e compra na ordem do A.5

O robô defende abaixo de um limite de HP, mas nunca em dois turnos seguidos (senão travaria em defesa infinita), e compra na ordem estrita do Apêndice A.5: sem ryo para o próximo item da lista, não compra nada. Em `src/game/sim/bot.ts`.

### Título "Por um Fio" usa o limite dos dados

A condição compara o menor HP com que o jogador terminou uma luta de chefe (`bossMinHpPct`, registrado em `src/game/meta/stats.ts`) com o limite `maxHpPct` da condição do título em `src/data/titles.ts`, e não com um 0,1 fixo no código. A comparação está em `src/game/meta/meta.ts`.

### `recordRunEnd` idempotente e boot que finaliza run encerrada

O id da run é estável (`run-${startedAt}-${seed}`) e a meta guarda `lastRecordedRunId`: chamar `recordRunEnd` duas vezes com a mesma run não duplica histórico nem títulos. No boot, uma run salva já encerrada (morte ou vitória) é finalizada na meta. Em `src/game/meta/meta.ts` e `src/store/GameStore.ts` (`boot`).

### Save que nunca lança

`loadRun` e `loadMeta` nunca lançam: um save inválido é copiado para `nxr.run.corrupt.<timestamp>` ou `nxr.meta.corrupt.<timestamp>` (quarentena) e o jogo segue com estado limpo. A validação aceita `nodeIndex === nodes.length` só quando a run está na fase de vitória. Em `src/game/save/save.ts`.

### Enciclopédia mostra jutsus bloqueados com requisitos

Cada carta mostra atributos mínimos, pré-requisito e saga mínima, também para jutsus bloqueados, e há filtro "bloqueados". Isso alimenta as metas "faltam X para Y" da spec §5. Em `src/ui-dom/screens/EncyclopediaScreen.ts`.

### Colecionador e Novo Chunin ocultos até a F2

Aplicação direta da C14: os dois títulos estão nos dados com `hidden: true`. Em `src/data/titles.ts`.

### Abandonar a run com a gravação da meta falhando

Se gravar a meta falha ao encerrar a run (abandono, morte ou vitória), o `GameStore` não apaga a run: grava a run encerrada para o próximo boot refinalizar, e ela não se perde. Em `src/store/GameStore.ts` (`abandonRun` e o fechamento da run).

### Erro de render ou de animação nunca prende o jogador

Qualquer exceção no render, no motor ou no animador cai em `GameStore.fail`, que troca para a tela de erro com o botão Recarregar; a fila de animação libera a entrada mesmo quando a animação falha. Em `src/store/GameStore.ts`, `src/ui-dom/App.ts` e `src/ui-dom/screens/ErrorScreen.ts`.

### Versões de dependência

`phaser` fica fixo em `~3.88.2` (só correções da linha 3.88), e `happy-dom` (21.0.1) e `vitest` (5.0.4) foram atualizados por alertas de segurança do `npm audit`, só em devDependencies (Task 4 do Plano 3). Em `package.json`.

## 6. Metas de balanceamento: metas de design × faixas de regressão

As metas da spec §12 (por exemplo, vence Zabuza 45–75%, Haku dado Zabuza 70–85%) continuam sendo as **metas de design**, em `TARGETS` de `src/game/sim/report.ts`. Depois de 4 iterações de calibração, 8 métricas seguiam fora porque a distância entre a build mais fraca contra chefes (Uchiha) e a mais forte (Uzumaki) é maior que a largura das faixas, e os multiplicadores de grau movem todas as builds juntas. O usuário escolheu **faixas por build** (decisão registrada em `docs/balance-log.md`): cada build que mede fora da meta ganha uma faixa própria em `BUILD_BANDS`, nunca mais estreita que a meta. O `npm run sim:check` falha se uma build sair da sua faixa (proteção contra regressão), e a distância até a meta de design continua impressa por `designGaps`, só como informação. Nenhum valor de `src/game/Balance.ts` mudou nessa decisão.

| Build | Métrica | Medido (1000 runs) | Meta de design | Faixa da build |
|---|---|---|---|---|
| Ninjutsu / Uchiha | vence Zabuza | 44,7% | 45–75% | 40–75% |
| Ninjutsu / Uchiha | completa a saga | 33,8% | 35–70% | 30–70% |
| Ninjutsu / Uzumaki | Haku dado Zabuza | 95,4% | 70–85% | 70–97% |
| Ninjutsu / Sem clã | Haku dado Zabuza | 92,4% | 70–85% | 70–95% |
| Taijutsu / Uzumaki | Haku dado Zabuza | 93,9% | 70–85% | 70–97% |
| Taijutsu / Uzumaki | maestria do jutsu principal | +4,45 | +2 a +4 | +2 a +4,6 |
| Taijutsu / Sem clã | HP no fim dos comuns | 74,5% | 75–85% | 72–85% |
| Taijutsu / Sem clã | maestria do jutsu principal | +4,04 | +2 a +4 | +2 a +4,2 |

As builds Semi-equilibrado / Uzumaki e Equilibrado / Sem clã não são focadas (`focused: false` em `src/game/sim/builds.ts`) e servem só de referência.

## 7. Problemas conhecidos

- `npm run sim` (3000 runs × 8 builds) leva cerca de 141 s, acima da meta de 30 s da spec §12; o `npm run sim:check` (1000 runs) leva 33–45 s (`docs/balance-log.md`).
- Uchiha está no limite inferior: com 3000 runs, Ninjutsu / Uchiha vence Zabuza em 41% e completa a saga em 31%, dentro da faixa da build mas abaixo da meta de design.
- Uzumaki quase sempre vence o Haku depois de vencer Zabuza (94–95% nas builds focadas), acima da meta de 70–85%. As correções de design sugeridas (reduzir a cura do kit ou tirá-lo da escolha 1-de-3, revisar a passiva do Uzumaki) ficam para depois de o usuário jogar.
- A conferência visual no navegador (layout, animações, cores) não é coberta por teste automático.
- Este documento cobre só o escopo do MVP (F0, F1A e F1B parcial); as inconsistências de conteúdo da F2 e da F3 não foram analisadas.
