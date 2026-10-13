# Alfa 0.8 — Save e simulador

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `3df4c72`, `c8dc2ea`, `3395adb`, `6b09742` e `e4db64a` (use `git log --oneline` para conferir e `git show <sha>` para ver o código como ficou).

## Objetivo

Ao fim desta versão a run e a meta-progressão podem ser gravadas e lidas de volta com segurança (versão, migração, quarentena de save inválido e recarga que volta ao início do encontro), e um simulador sem interface joga milhares de runs com um robô para medir o balanceamento contra as metas da spec; os graus de inimigo foram calibrados com esses números.

## Escopo

### Entra

- O salvamento em `src/game/save/save.ts`: a interface `KeyValueStore`, as chaves `RUN_KEY` e `META_KEY`, as migrações `RUN_MIGRATIONS` e `META_MIGRATIONS`, `saveRun`, `loadRun`, `deleteRun`, `saveMeta` e `loadMeta`, com validação por Zod.
- O robô jogador em `src/game/sim/bot.ts`: `allocationByWeights`, `botShop`, `botLoadout`, `botReward`, `botAction` e `simulateRun`.
- As 8 builds do Apêndice A.5 do DD v2 em `src/game/sim/builds.ts` (`SIM_BUILDS`).
- O relatório em `src/game/sim/report.ts`: `simulateMany`, `TARGETS`, `checkTargets` e `formatTable`.
- O comando em `tools/simulate.ts` (`npm run sim` e `npm run sim:check`).
- O registro da calibração em `docs/balance-log.md` e os novos valores de grau em `src/game/Balance.ts`.
- Os testes em `tests/save.test.ts` e `tests/sim.test.ts`.

### Fica de fora

- Quem chama o save no navegador (o `localStorage` de verdade, o relógio e o tratamento das falhas de escrita): Beta 0.9.0, em `src/main.ts` e `src/store/GameStore.ts`.
- Fechar as metas que a calibração não conseguiu: os botões permitidos moviam todas as builds juntas. A solução (faixas por build) veio no Plano 3; ver "Alterado".
- Deixar o `npm run sim` abaixo de 30 s: a meta de desempenho da spec ficou para depois (ver "Problemas conhecidos").
- Mudar regra de jogo para fechar a diferença entre builds (cura do kit, passiva do Uzumaki): decisão de design, fora do alcance da calibração.

## Passo a passo

### Passo 1 — Save versionado com migração e quarentena

**O quê**: `src/game/save/save.ts` grava a run em `nxr.run.v1` e a meta em `nxr.meta.v1`, sempre como JSON com o campo `version`. O armazenamento chega por parâmetro como `KeyValueStore` (três métodos: `getItem`, `setItem`, `removeItem`). Ao ler, `migrate` aplica as migrações em ordem a partir da versão do save (um save sem `version` é tratado como versão 0, e a migração 0 → 1 cria `ownedEquipment`); uma versão mais nova que a suportada é recusada. Depois, um esquema Zod mínimo (`RunShape`, `MetaShape`) confere o que o jogo precisa para não quebrar, e regras extras recusam saves que carregariam mas quebrariam depois (`nodeIndex` fora dos nós, fase de batalha sem `encounterStart`). Save inválido vai para **quarentena**: a cópia é guardada em nxr.run.corrupt.(instante) ou nxr.meta.corrupt.(instante), a chave original é removida e o jogo segue limpo, com um aviso. `saveRun` aplica o anti save-scum da Alfa 0.7: se a run está no meio de uma batalha, grava a foto de `encounterStart` (fase `'map'`, sem batalha, o RNG e as estatísticas do início do encontro).

**Por quê**: injetar o armazenamento mantém o motor puro: `src/game/**` não toca em `window` nem em `localStorage`, e os testes passam um `Map` no lugar. O **versionamento** existe porque o jogo vai mudar e o save do jogador fica: sem `version`, não há como saber se um save antigo precisa ganhar um campo novo. A regra de ouro do save é que **a leitura nunca lança**: um save corrompido não pode impedir o jogo de abrir, porque o jogador não tem como consertá-lo à mão. A quarentena, em vez de apagar, guarda a prova para investigar depois. Gravar o início do encontro, e não o meio da luta, é o que impede o save-scum: quem fecha a aba perdendo volta para a mesma luta, com os mesmos sorteios.

**Alternativas**: chamar `localStorage` direto de dentro do motor é o mais curto, mas prende o motor ao navegador e obriga os testes a simular `window`. Um banco no navegador (IndexedDB) aguenta mais dados, mas tem API assíncrona, e uma run de poucos KB não precisa disso. Validar o save inteiro com Zod daria mais garantias, mas duplicaria todos os tipos do jogo num esquema que teria de acompanhar cada mudança; o esquema mínimo com `passthrough` cobre o que derruba o jogo. Apagar o save inválido sem cópia é mais simples, mas perde a informação de por que ele quebrou.

**Riscos e armadilhas**: a primeira versão (`3df4c72`) fazia a quarentena **dentro do `catch`** com `setItem` direto: se o save estava corrompido **e** o armazenamento estava cheio ou bloqueado, o `setItem` do backup lançava de dentro do `catch` e a leitura, que deveria tratar o erro, derrubava o jogo; o `getItem` também ficava fora de qualquer `try`. O `c8dc2ea` levou a cópia para `quarantine`, que tem dois `try` separados (guardar a cópia e remover a original) e nunca lança, pôs a leitura num `try` e acrescentou as regras de `nodeIndex` e de batalha sem encontro (testes do bloco `leitura nunca lança (falhas de armazenamento)`). A regra do `nodeIndex` trouxe outro problema: na vitória o índice fica em `nodes.length`, e o save da run vencida era recusado; a revisão final do Plano 1 (`662d506`) aceitou esse caso só na fase `'victory'`. A escrita (`saveRun`, `saveMeta`, `deleteRun`) lança de propósito: quem chama decide o que mostrar (Beta 0.9.0).

### Passo 2 — Simulador headless

**O quê**: `simulateRun(build, semente)`, em `src/game/sim/bot.ts`, cria uma run com a build e joga até a morte ou a vitória usando as mesmas funções de `src/game/run/runManager.ts` que a interface vai usar. O robô segue o Apêndice A.5 do DD v2: distribui pontos pelos pesos da build (`allocationByWeights`, um ponto por vez no atributo mais atrasado), compra na ordem fixa colete, kunai, dois kits, pílula, katana (só builds de Taijutsu) e colete reforçado (`botShop`), equipa os 4 jutsus de dano mais fortes (`botLoadout`) e, na luta (`botAction`), liga a transformação quando tem chakra, usa kit abaixo de 35% de HP, pílula nos chefes abaixo de 30% de chakra, defende abaixo de 25% de HP e, no resto, usa o jutsu de maior dano esperado se ele supera Atacar. `simulateMany(build, runs, sementeBase)`, em `src/game/sim/report.ts`, roda várias runs e agrega as métricas (chega a Zabuza, vence Zabuza, completa a saga, Haku dado Zabuza, rodadas, HP no fim dos comuns, maestria do jutsu mais usado). `tools/simulate.ts` roda as 8 builds de `src/game/sim/builds.ts` (Ninjutsu e Taijutsu nos três clãs, as 6 "focadas", mais duas de referência) e imprime a tabela.

**Por quê**: **balancear** um jogo é ajustar os números para que ele não seja fácil nem impossível. Jogar à mão dá uma impressão; simular dá dados: 3000 runs por build mostram em minutos que uma build vence Zabuza em 97% das vezes, coisa que dezenas de partidas manuais não mostrariam com certeza. **Headless** quer dizer sem tela: é possível porque o motor é puro e determinístico (Alfas 0.1 a 0.7), então a mesma semente reproduz a mesma run e uma métrica estranha pode ser investigada pela semente. O robô é simples de propósito, com limiares fixos que são do robô e não do jogo: um humano deve jogar melhor que ele, então as metas medem o piso de um jogador razoável.

**Alternativas**: um robô "ótimo" que busca a melhor jogada mediria o teto do jogo, não a experiência de quem está aprendendo, e seria muito mais lento. Medir com jogadores de verdade (playtest) é insubstituível para sensação, mas não dá milhares de amostras a cada mudança de número. Simular só a batalha, sem a run, perderia o efeito da loja, da recuperação entre encontros e da escolha 1-de-3, que pesam no resultado contra os chefes.

**Riscos e armadilhas**: a primeira versão do robô (`3395adb`) entrava numa **espiral de defesa**: abaixo de 25% de HP e sem kit, ele defendia todo turno; Defender recupera chakra e corta o dano à metade, mas não causa dano, então o robô morria devagar em vez de reagir, e as métricas de sobrevivência mediam o robô, não o jogo. O `6b09742` passou a regra "nunca defende dois turnos seguidos" (o laço de `simulateRun` guarda `justDefended`, porque o `defending` do combatente é zerado no início de cada turno), mudou a compra para estrita na ordem (sem ryo para o próximo item, o robô para e poupa, como o A.5 descreve) e trocou o limiar fixo de 20 de chakra para ligar o Sharingan pelo custo de ativação e manutenção lido de `src/data/effects.ts`. A medição inicial da calibração foi feita depois desse commit. O simulador também usa `battleAction` com `inPlace: true` (Alfa 0.7) por desempenho, e tem uma trava de 5000 passos contra laço infinito.

### Passo 3 — Metas e calibração

**O quê**: `TARGETS`, em `src/game/sim/report.ts`, traz as metas da spec §12 para as builds focadas: HP no fim de um comum entre 75% e 85%, 2 a 4 rodadas por comum, chegar a Zabuza em pelo menos 95%, vencer Zabuza entre 45% e 75%, completar a saga entre 35% e 70%, vencer Haku entre 70% e 85% de quem venceu Zabuza, e maestria média do jutsu principal entre +2 e +4. `checkTargets` lista o que saiu da faixa, e `npm run sim:check` (1000 runs por build) termina com erro se a lista não estiver vazia. A calibração seguiu as regras do Plano 1: uma constante por iteração, só os botões permitidos (`damageMult` e `hpMult` dos graus D, C e B, e os `mastery.stepUses`), nunca fórmulas do jogador, passivas de clã, jutsus ou recompensas, e no máximo 8 iterações. O resultado, registrado em `docs/balance-log.md`, foram 4 iterações, de 23 para 8 metas fora: `enemyGrades.D.damageMult` de 0,6 para 0.65<!-- fact: BALANCE.enemyGrades.D.damageMult=0.65 -->, `enemyGrades.C.hpMult` de 1,3 para 2.1<!-- fact: BALANCE.enemyGrades.C.hpMult=2.1 -->, `enemyGrades.C.damageMult` de 0,72 para 0.81<!-- fact: BALANCE.enemyGrades.C.damageMult=0.81 --> e `enemyGrades.B.hpMult` de 1,5 para 1.7<!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 -->.

**Por quê**: uma **meta de balanceamento** transforma "o jogo está difícil demais?" numa pergunta com resposta: vencer Zabuza em 97% das vezes, como na medição inicial, quer dizer que o primeiro chefe não ameaça ninguém. As faixas largas (30 pontos em "vence Zabuza") aceitam o ruído das builds. A regra de uma constante por iteração permite saber qual mudança causou qual efeito; a lista fechada de botões protege as decisões de design do DD v2 (o jogador não fica mais fraco para o jogo parecer equilibrado: o inimigo é que muda). O limite de 8 iterações impede ajuste sem fim, e mandou parar e relatar ao usuário quando os botões deixaram de ajudar.

**Alternativas**: otimizar todas as constantes juntas por busca automática acharia uma combinação com menos metas fora, mas sem explicação de por que cada número tem o valor que tem, e provavelmente encaixada demais no robô. Ajustar as fórmulas do jogador fecharia metas mais depressa, mas mudaria o jogo que o DD v2 descreve. Aceitar as metas fora sem registro deixaria o `sim:check` vermelho para sempre e inútil como alarme.

**Riscos e armadilhas**: a calibração mostrou um limite estrutural: a distância entre a build mais fraca contra chefes (Ninjutsu / Uchiha, que vence Zabuza em 44,7%) e a mais forte (Taijutsu / Uzumaki, 74%) é de uns 30 pontos, igual à largura da faixa, e os botões de grau movem todas as builds juntas. As 8 metas que sobraram (Haku dado Zabuza alto nos Uzumaki e no Sem clã de Ninjutsu, Nin/Uchiha no limite inferior, maestria acima de +4 no Taijutsu, HP fim comum de Tai/Sem clã em 74,5%) não são um nível geral de dificuldade errado, e sim diferença entre builds. Outra armadilha: o resultado depende do número de runs; com 3000 runs Nin/Uchiha vence Zabuza em 41% e completa 31%, abaixo das 1000 runs do `sim:check`, então o limite inferior não tem folga. Mudar `src/game/Balance.ts` também quebrou testes que tinham os números antigos escritos à mão (Alfa 0.6, commit `5c0e7d4`).

## Critérios de conclusão

- `npx vitest run tests/save.test.ts tests/sim.test.ts` passa.
- `npm run sim` imprime a tabela das 8 builds; com 3000 runs por build o resultado está registrado em `docs/balance-log.md`.
- Ao fim desta versão, `npm run sim:check` terminava com 8 metas fora; hoje ele passa com as faixas por build (ver "Alterado").

## Testes

- `tests/save.test.ts`: prova a ida e volta da run e da meta, o jogo sem save (run nula, meta vazia, sem erro), o save corrompido com backup e aviso, a versão mais nova recusada, a migração do save v0 sem `version` e sem `ownedEquipment`, o save no meio da batalha que volta ao mapa com o RNG do início do encontro, o `deleteRun`, a leitura que nunca lança (`getItem` que lança, save corrompido com `setItem` que lança), a escrita que lança, as regras de `nodeIndex` e de batalha sem encontro e, depois do `662d506`, a run vencida que volta do save, a meta com `lifetime` vazio recusada e a meta antiga sem `lastRecordedRunId`.
- `tests/sim.test.ts`: prova a distribuição de pontos pelos pesos, que uma run simulada termina e é determinística pela semente, que o relatório agrega, formata e confere as metas só das builds focadas, e que o robô nunca defende dois turnos seguidos.

## Patch log

### Adicionado

- O salvamento versionado com migração, quarentena e anti save-scum em `src/game/save/save.ts`.
- O robô, as builds e o relatório do simulador em `src/game/sim/bot.ts`, `src/game/sim/builds.ts` e `src/game/sim/report.ts`.
- Os comandos `npm run sim` e `npm run sim:check` em `tools/simulate.ts`.
- O registro de balanceamento `docs/balance-log.md`.
- Testes em `tests/save.test.ts` e `tests/sim.test.ts`.

### Alterado

- Os graus de inimigo em `src/game/Balance.ts`: dano do grau D, HP e dano do grau C e HP do grau B, pela calibração do `e4db64a`.
- Na Task 2 do Plano 3 (`68d6179`), o `sim:check` passou a falhar só quando uma build sai da sua própria faixa de regressão (`BUILD_BANDS` e `bandFor` em `src/game/sim/report.ts`, nunca mais estreita que a meta de design), e a distância para as metas de design passou a ser impressa como informação (`designGaps`); a decisão está em `docs/balance-log.md`, com os testes em `tests/sim-bands.test.ts`.

### Corrigido

- A leitura de save não lança mais com armazenamento bloqueado ou cheio, e saves com `nodeIndex` fora dos nós ou batalha sem início de encontro são recusados (`c8dc2ea`).
- O robô não entra mais na espiral de defesa, compra estritamente na ordem do A.5 e lê o custo da transformação dos dados (`6b09742`).
- O save de uma run vencida voltou a ser aceito e a meta passou a ter `lifetime` validado (`662d506`, revisão final do Plano 1).

### Removido

- O limiar fixo de chakra do robô para ligar a transformação (`BOT_TRANSFORM_MIN_CHAKRA`), trocado pelo custo lido de `src/data/effects.ts` no `6b09742`.

### Problemas conhecidos

- O relatório completo (`npm run sim`, 3000 runs × 8 builds) leva cerca de 141 s, acima da meta de 30 s da spec; o `sim:check` (1000 runs) leva de 33 a 45 s.
- As builds de Uzumaki vencem Haku em 94–95% das vezes depois de vencer Zabuza, e a Ninjutsu / Uchiha fica no limite inferior contra os chefes; fechar essa diferença exige decisão de design (cura do kit, passiva do Uzumaki), registrada em `docs/balance-log.md`.
- A build Equilibrado / Sem clã (de referência) nunca vence Zabuza com os valores atuais.
