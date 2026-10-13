# NarutoTxGame — Documento de Design v3

> Reescrita do DD v2 incorporando as correções C1–C15 (`docs/ANALISE.md`) e os números finais do código e do simulador. Onde este documento e o código divergirem, vale o código.

**Versão 3.0 — o design depois do MVP.** O DD v2 (`docs/referencia/NarutoTxGame_Documento_de_Design_v2.md`) fechou a base numérica por simulação; a spec do MVP (`docs/superpowers/specs/2026-10-04-narutotxgame-mvp-design.md`) corrigiu quinze inconsistências dele (C1–C15) e decidiu o que entra no primeiro jogo jogável. Esta versão junta as duas coisas num texto só: as regras são as do DD v2 com as correções aplicadas, e todo número vem do código. As constantes de balanceamento estão em `src/game/Balance.ts`; o conteúdo (clãs, jutsus, efeitos, itens, inimigos, saga, títulos), em `src/data/`. Cada número de balanceamento deste documento leva colado um comentário HTML com o caminho no `BALANCE` e o valor, que o `npm run docs:check` confere contra o código; números que vivem em `src/data/` citam o arquivo.

**Estado de cada seção.** Toda seção abre com uma linha de estado:

| Estado | Significado |
|---|---|
| Implementado (MVP) | A regra está no código e é jogável na Saga da Onda |
| Parcial (MVP) | Uma parte está no código; o resto continua como visão de design, com a fase indicada |
| Futuro (F2/F3) | Visão de design; nada (ou só dados para a Enciclopédia) existe no código |

**Legenda de fases** (mantida do DD v2): **[F0]** fatia vertical; **[F1A]** núcleo da Saga da Onda; **[F1B]** camadas de conteúdo e meta; **[F2]** a **[F4]** fases seguintes do roadmap (Seção 21); **[Futuro]** backlog de longo prazo (Seção 20). O MVP cobre F0, F1A e parte da F1B.

---

## Sumário

1. Visão Geral do Projeto · 2. Pilares do Design · 3. Atributos e Fórmulas · 4. Rank Ninja e Reputação · 5. Criação de Personagem · 6. Clãs · 7. Chakra e Elementos · 8. Jutsus e Progressão · 9. Combate e Grau de Inimigos · 10. Efeitos · 11. Economia e Loja · 12. Modo História · 13. Interface · 14. Ficha do Ninja · 15. Progressão e Meta-Progressão · 16. Histórico de Runs · 17. Modo Online · 18. Arquitetura Técnica · 19. Estrutura do Projeto · 20. Visão de Longo Prazo · 21. Roadmap · Apêndices A–E

---

## 1. Visão Geral do Projeto

**Estado:** Parcial (MVP)

**NarutoTxGame** é um RPG tático por turnos com estrutura roguelike, para um jogador, rodando no navegador (nos moldes de PokéRogue). O foco é a customização do personagem por atributos e clãs, um combate 1x1 em que cada turno é uma decisão, uma economia simples (ryo, reputação e loja) e uma campanha, o Modo História, que segue a cronologia do anime. Uma **run** é uma tentativa completa: o jogador cria um ninja, atravessa a saga encontro por encontro e, se morrer, recomeça do zero; o que sobrevive entre runs é a meta-progressão (Enciclopédia, títulos, histórico).

O MVP é a Saga da Onda inteira: 26 encontros, com Zabuza (grau C) no 13º e Haku (grau B) no 26º, três caminhos de clã (Uchiha, Uzumaki e Sem clã), loja, maestria de jutsus, títulos, Enciclopédia de Jutsus e Histórico de Runs. O jogo é 100% local; o package npm se chama `ninja-x-rogue` e não usa arte oficial (personagens e cenário são placeholders).

### Objetivos principais

- **O investimento em atributo define o arsenal.** As escolhas de pontos decidem quais técnicas o personagem consegue aprender, não só o quanto ele bate. No código, o desbloqueio olha só para o atributo base (`src/game/progression/unlock.ts`).
- **Clã dá identidade sem ser obrigatório.** As técnicas mais icônicas (Rasengan, Kage Bunshin) são gerais; o clã muda passiva, atributos de destaque e um pool pequeno de jutsus exclusivos.
- **A cronologia do anime é respeitada.** Nenhum jutsu aparece antes do ponto da história em que ele existe na obra: o Rasengan não pode ser aprendido antes da Busca por Tsunade, mesmo com Ninjutsu alto.
- **Combate tático com informação completa.** Buffs, debuffs e controles ativos ficam sempre visíveis, com os turnos restantes, nos dois lados da batalha.
- **Números dirigidos por dados e validados por simulação.** Toda constante de balanceamento mora em `src/game/Balance.ts` e passa pelo simulador headless (`npm run sim:check`) antes de virar conteúdo (Seção 18).
- **Base de código para crescer por muito tempo.** A ambição continua sendo cobrir, aos poucos, a lore de Naruto e possivelmente Boruto (Seção 20); o motor já separa regras, dados e apresentação para isso.

### Escopo por fase

**[F0] Fatia vertical** — **Estado:** Implementado (MVP)

- Criação de personagem com nome, clã (Uchiha, Uzumaki ou Sem clã) e afinidade (Seção 5).
- Combate 1x1 com as fórmulas da Seção 3: ordem por Velocidade, chakra, crítico, esquiva e roda elemental.
- Efeitos básicos (queimadura, buff temporário, controle) e log de batalha.
- Ganho de nível com distribuição de pontos e desbloqueio de jutsu por atributo e saga.
- Loja mínima e save da run em andamento.

**[F1A] Núcleo da Saga da Onda** — **Estado:** Implementado (MVP)

- Saga da Onda completa: 26 encontros, Zabuza e Haku como chefes, Acampamento antes de cada chefe (Seção 12, `src/data/saga.ts`).
- Uchiha e Uzumaki completos e o caminho Sem clã com compensação real (Seção 6).
- Ryo, reputação, loja e equipamento de 2 slots (Arma e Armadura).
- 4 slots de jutsu e maestria por uso (Seção 8).
- Menu principal com Modo História, Modo Infinito ("Em breve", desabilitado) e Enciclopédia de Jutsus.

**[F1B] Camadas adicionais** — **Estado:** Parcial (MVP)

- Entram no MVP: Histórico de Runs; a escolha 1-de-3 ao subir de nível; Títulos com buff; a Ficha do Ninja com as abas Perfil, Atributos, Jutsus e Equipamento; o Pergaminho Raro; os jutsus Henge e Doryuuheki.
- Ficam para depois: a aba Registro de Batalha e a tela de equipamento com silhueta (as estatísticas são coletadas e aparecem de forma simples no Histórico), e os eventos entre encontros (loja ambulante, treino, descanso).
- Os slots 6/8 e as promoções de rank existem como regra de design, mas só ficam testáveis na F2, quando o Exame Chunin entra.

**Fica de fora do MVP (spec §1):** modo online, PvP, servidor e cronômetro de turno (decisão do usuário: jogo 100% local); Modo Infinito (só a entrada de menu desabilitada); promoção a Chunin/Jounin, slots 6/8, segunda afinidade, Raio e Chidori (dependem da saga do Exame Chunin, F2); clãs Hyuuga, Nara, Akimichi e Aburame e o Sharingan tomoe 2/3 (F2); Livro Bingo, rival, Pontos de Legado, cosméticos e desbloqueio de clãs (F2); sprites, áudio e layout mobile abaixo de 1024 px.

---

## 2. Pilares do Design

**Estado:** Implementado (MVP)

Os pilares do DD v2 continuam valendo; o MVP é a primeira prova de que eles se sustentam juntos. Cada um vem com o que o MVP fez para cumpri-lo.

**Build definida por investimento, não por escolha única.** O clã dá identidade, mas são os atributos que abrem o leque de jutsus. No MVP, dois personagens do mesmo clã e do mesmo nível podem terminar a Saga da Onda com arsenais diferentes: um de Ninjutsu chega ao Kage Bunshin (Nin 20), um de Taijutsu fica com Sennen Goroshi e Investida Ninja.

**Jutsus icônicos são conquistados, não dados.** Rasengan não pertence a clã nenhum: pertence a quem investiu Ninjutsu e Inteligência suficientes, já aprendeu o Kage Bunshin e chegou à Busca por Tsunade. A correção C12 levou o pilar ao limite: **jutsu só se aprende cumprindo as condições de status**, e nenhuma outra fonte (escolha 1-de-3, loja, chefe, evento) concede jutsu.

**Fidelidade à obra.** Nomes, elementos e ordem de aparição de jutsus e personagens seguem o anime sempre que possível; jutsu sem natureza de chakra na lore não tem elemento no jogo. A exceção controlada é a regra de **Herança de clã** (Seção 8). A correção C7 aplicou o pilar ao conteúdo: Gogyou Fuuin é técnica do Orochimaru na obra e saiu do pool do Uzumaki.

**Combate tático por turnos.** Gasto de chakra, elemento, efeitos e ordem de ação por Velocidade decidem a luta. O jogador sempre vê o que está ativo nele e no inimigo, e por quantos turnos. Posicionamento não existe no 1x1 e só entra com batalhas em equipe (F3+).

**Interface leve e legível, inspirada em Pokémon.** HP, chakra, atributos e efeitos ativos sempre fáceis de ler. No MVP, as telas são HTML/CSS e só a arena da batalha é desenhada em Phaser (Seção 18).

**Sensação de coleção.** A Enciclopédia mostra todos os jutsus do jogo, inclusive os bloqueados e os de fases futuras, com os requisitos de cada um; "desbloqueado" significa aprendido em qualquer run (`src/ui-dom/screens/EncyclopediaScreen.ts`).

**Estabilidade antes de expansão.** Cada etapa precisa estar sólida antes da próxima camada. Por isso o MVP fechou F0 e F1A inteiros e só uma parte escolhida da F1B, e por isso um simulador com metas automáticas protege o balanceamento contra regressão (`docs/ANALISE.md` §6).

**Escalável para online desde o início.** A lógica de combate é separada da apresentação e todo sorteio usa RNG com semente (um gerador de números aleatórios que, com a mesma semente, repete a mesma sequência). O motor em `src/game/` não usa `Math.random`, `Date.now`, DOM nem Phaser, o que permite reproduzir uma luta e, no futuro, validá-la num servidor (Seção 17).

**O que o MVP aprendeu sobre os pilares.** O simulador mostrou que "build por investimento" tem um custo: builds com pontos espalhados não passam de Zabuza. A resposta (C9) não foi limitar a liberdade, e sim orientar o jogador com presets (Seção 5).

---

## 3. Sistema de Atributos e Fórmulas de Base

**Estado:** Implementado (MVP)

Todo personagem tem 8 atributos primários. Eles crescem por dois caminhos: pontos distribuídos livremente a cada nível (escolha do jogador) e o bônus automático de clã nos dois atributos de destaque.

| Atributo | Efeito |
|---|---|
| HP | +4 <!-- fact: BALANCE.hp.perPoint=4 --> de HP máximo por ponto |
| Taijutsu | Escala o dano dos jutsus de Taijutsu e da ação Atacar; controla quais jutsus de Taijutsu podem ser aprendidos |
| Ninjutsu | Escala o dano dos jutsus de Ninjutsu; controla quais jutsus de Ninjutsu podem ser aprendidos |
| Genjutsu | Aumenta a chance de aplicar Ilusão; controla quais jutsus de Genjutsu podem ser aprendidos. Genjutsu quase não causa dano direto |
| Velocidade | Define a ordem de turno e a chance de esquiva |
| Inteligência | +1 <!-- fact: BALANCE.chakra.perInt=1 --> de chakra máximo por ponto e +1 de regeneração a cada 8 <!-- fact: BALANCE.chakra.regenIntDivisor=8 --> pontos; escala o dano de Fuinjutsu e controla os jutsus de Fuinjutsu e de suporte. Não reduz o custo de chakra |
| Chance de Crítico | Probabilidade de acerto crítico, com retornos decrescentes |
| Defesa | Reduz o dano recebido, com retornos decrescentes |

O atributo que escala cada categoria de jutsu está em `src/game/attributes.ts` (`CATEGORY_ATTR`): Ninjutsu → Ninjutsu, Taijutsu → Taijutsu, Genjutsu → Genjutsu, Fuinjutsu → Inteligência.

### Progressão de atributos

- Todos os atributos começam em **5** <!-- fact: BALANCE.attributes.start=5 --> (total de 40).
- Na criação, o jogador distribui exatamente **10** <!-- fact: BALANCE.attributes.creationPoints=10 --> pontos extras (Seção 5).
- A cada nível, o personagem de clã ganha **5 pontos livres** e **+1 automático em cada um dos dois atributos de destaque** do clã.
- **Sem clã:** **6 pontos livres** por nível e nenhum bônus automático, além das vantagens da Seção 6.
- Chakra máximo não é distribuível: cresce por nível e com a Inteligência.
- **Pontos totais esperados** de um personagem de clã no nível N: `P(N) = 50 + 7·(N − 1)` (base 50 <!-- fact: BALANCE.attributes.expectedBase=50 -->, 7 <!-- fact: BALANCE.attributes.expectedPerLevel=7 --> por nível). P(N) é a régua da força dos inimigos: desde a C5, o bloco de atributos de cada inimigo é gerado por código como `round(P(N) × razão do grau)`, e não mais copiado de uma tabela (Seção 9).

Os pontos livres por nível e os destaques de cada clã são dados do clã (`freePointsPerLevel` e `highlights` em `src/data/clans.ts`); o ganho de nível está em `src/game/progression/character.ts` (`gainXp`).

### Fórmulas de base

Todas em `src/game/formulas.ts`, com as constantes em `src/game/Balance.ts`.

| Grandeza | Fórmula no código |
|---|---|
| HP máximo | `round((80 + 4·HP + 6·nível) × multiplicador de clã)`: base 80 <!-- fact: BALANCE.hp.base=80 -->, 6 <!-- fact: BALANCE.hp.perLevel=6 --> por nível |
| Chakra máximo | `30 + 4·nível + Inteligência`: base 30 <!-- fact: BALANCE.chakra.base=30 -->, 4 <!-- fact: BALANCE.chakra.perLevel=4 --> por nível |
| Regeneração de chakra | `2 + ⌊Inteligência / 8⌋` no início de cada turno do combatente: base 2 <!-- fact: BALANCE.chakra.regenBase=2 --> |
| Dano de um golpe | `Poder × (1 + 0,03·m) × (1 + Atributo/40) × Elemental × (1 + Σ bônus % de dano) × (1 − Redução) × Crítico × Variação × multiplicador de grau` (C1, C2) |
| Poder da ação Atacar | 18 <!-- fact: BALANCE.power.attack=18 -->, escalado por Taijutsu |
| Poder dos jutsus | Definido por jutsu em `src/data/jutsus.ts`; a referência por grau é D 26 <!-- fact: BALANCE.power.D=26 --> · C 40 <!-- fact: BALANCE.power.C=40 --> · B 60 <!-- fact: BALANCE.power.B=60 --> · A 90 <!-- fact: BALANCE.power.A=90 --> · S 130 <!-- fact: BALANCE.power.S=130 --> |
| Redução de dano (Defesa) | `mín(60%, Def / (Def + 50))`: constante 50 <!-- fact: BALANCE.defense.k=50 -->, teto 0,6 <!-- fact: BALANCE.defense.cap=0.6 --> |
| Redução total (Defesa + efeitos) | `mín(75%, redução da Defesa + bônus de redução)`: teto 0,75 <!-- fact: BALANCE.defense.totalCap=0.75 --> |
| Chance de esquiva | `clamp(4 + 0,8 × (Vel do alvo − Vel do atacante), 0, 40)% + bônus`, com teto total de 40%: base 4 <!-- fact: BALANCE.dodge.basePct=4 -->, 0,8 <!-- fact: BALANCE.dodge.perVelPct=0.8 --> por ponto de diferença, teto 40 <!-- fact: BALANCE.dodge.capPct=40 --> |
| Chance de crítico | `mín(55%, 50 × C / (C + 60) + bônus)`: escala 50 <!-- fact: BALANCE.crit.scalePct=50 -->, constante 60 <!-- fact: BALANCE.crit.k=60 -->, teto 55 <!-- fact: BALANCE.crit.capPct=55 --> |
| Dano crítico | ×1,5 <!-- fact: BALANCE.damage.critMultiplier=1.5 --> |
| Variação de dano | Sorteio entre 0,9 <!-- fact: BALANCE.damage.varianceMin=0.9 --> e 1,1 <!-- fact: BALANCE.damage.varianceMax=1.1 --> |
| Dano mínimo | 1 <!-- fact: BALANCE.damage.minDamage=1 --> por golpe que acerta |
| Modificador elemental | Vantagem ×1,3 <!-- fact: BALANCE.damage.elementAdvantage=1.3 --> · Desvantagem ×0,8 <!-- fact: BALANCE.damage.elementDisadvantage=0.8 --> · Neutro ×1,0 (Seção 7) |
| Ordem de turno | `Velocidade efetiva × (1 + sorteio entre 0 e 0,10)`, recalculada a cada rodada: oscilação 0,1 <!-- fact: BALANCE.turnOrderJitter=0.1 --> |

**As duas correções da fórmula de dano.** O DD v2 escrevia `(1 + Maestria)`, o que, com a maestria de 1 a 5, daria +100% de dano por nível. A **C1** troca o termo por `(1 + 0,03·m)`, com `m` de 0 a 5, coerente com os +3% por nível da Seção 8. O DD v2 também escrevia `(1 + Título)` sem dizer onde entravam o Sharingan, a Afinidade Katon, o Kage Bunshin e os buffs. A **C2** junta tudo num único termo aditivo `(1 + Σ bônus % de dano)`, que soma título, clã, transformação e buffs: o bônus de dano geral, o de dano de jutsu (só quando o golpe é um jutsu) e o do elemento do golpe. Somar em vez de multiplicar impede que três bônus pequenos virem um grande. A implementação é `resolveHit` em `src/game/combat/damage.ts`, com os bônus agregados por `aggregateMods` em `src/game/effects/EffectSystem.ts`.

O **atributo** da fórmula é o efetivo do atacante na categoria do golpe. O **multiplicador de grau** é o dano do grau do inimigo (Seção 9); para o jogador vale 1. Quem defende recebe metade do dano (Seção 7). A ordem de resolução de um golpe é: Kawarimi anula, Henge pode fazer errar, esquiva, clone do Kage Bunshin absorve e, só então, dano.

Notas sobre as curvas:

- **Crítico** é assintótico: só com atributo, o teto prático é 50%. Valores: 5 → 3,8% · 20 → 12,5% · 40 → 20% · 60 → 25%. Bônus fixos (Sharingan, títulos) somam por cima, com teto de 55%. A Kunai dá +2 no **atributo** Chance de Crítico, não +2% (C4).
- **Defesa:** 10 dá 16,7% de redução; 30, 37,5%; 50, 50%. O teto de 60% só cai com Defesa 75. Buffs de redução, como o Doryuuheki, somam por cima da Defesa até o teto total de 75% (`ASSUMIDO` da spec: sem um teto acima de 60%, o Doryuuheki não faria nada em quem já está no teto).
- **Esquiva** depende da diferença de Velocidade: com Velocidades iguais, 4%.

### Atributo base × atributo efetivo

- **Atributo base:** atributos iniciais + pontos distribuídos + bônus de clã + Pergaminhos Raros (Seção 11). É o único que desbloqueia jutsu.
- **Atributo efetivo:** atributo base + equipamento + efeitos temporários ativos. É o que entra nas fórmulas de combate.
- Equipamento e buffs melhoram o combate, mas não abrem jutsus: isso evita "aprender" um jutsu com um buff e perdê-lo em seguida. No código, `effectiveAttrs` em `src/game/progression/character.ts` soma base e equipamento, e `effectiveAttr` em `src/game/effects/EffectSystem.ts` acrescenta os efeitos de batalha.

### Requisitos de atributo por grau de jutsu

Referência para os requisitos da Seção 8 e do Apêndice B. Um jogador que especializa deve chegar ao grau por volta do nível indicado; uma build espalhada chega mais tarde. A tabela traz as faixas que o catálogo de `src/data/jutsus.ts` usa de fato (o DD v2 dava faixas um pouco diferentes; os dados são a referência):

| Grau | Atributo principal mínimo | Segundo atributo | Nível típico de um especialista |
|---|---|---|---|
| D | 5 a 8 | — | 1 |
| C | 10 a 14 | opcional (8 a 10) | 2–4 |
| B | 16 a 24 | opcional (12 a 18) | 5–9 |
| A | 25 a 34 | 15 a 25 | 12–20 |
| S | 40 a 45 | 20 a 30 | 25+ |

### Poder Ninja

Um número único que resume a força do personagem, para comparação rápida: `PN = 2·HP + 3·(maior entre Tai/Nin/Gen) + (soma dos outros dois ofensivos) + 2·Vel + Int + 2·Crit + 2·Def`, calculado sobre os atributos base mais equipamento, sem buffs. É só informativo e não entra em nenhuma fórmula de combate. Aparece na prévia da criação, no Perfil da Ficha e no painel de batalha, para o jogador e para o inimigo. A função é `ninjaPower` em `src/ui-dom/view/derived.ts`, de propósito fora do motor: é número de tela, não regra.

### Por que atributo e não só nível

Nível sozinho não diferencia builds. Atrelar o desbloqueio de jutsu ao valor do atributo investido garante que dois jogadores no mesmo nível tenham arsenais diferentes, e faz da distribuição de pontos a decisão mais importante da run.

---

## 4. Rank Ninja e Reputação

**Estado:** Parcial (MVP)

No MVP, a reputação existe, é ganha a cada vitória e fica visível no cabeçalho da run; todo personagem é Genin do começo ao fim, porque a primeira promoção depende da saga do Exame Chunin (F2). O resto desta seção é o design do rank, mantido como visão.

Todo personagem tem um **rank ninja** (Genin, Chunin, Jounin...), que representa o reconhecimento oficial na vila, e uma **reputação**, o número que mede o quanto ele já provou seu valor. O rank sobe quando a reputação atinge um limite e o personagem completa a missão de promoção correspondente.

> **Nomenclatura:** "rank" designa **somente** o rank ninja. A escala D a S de jutsus, inimigos e itens se chama **grau** (Apêndice C). A C11 aplicou a regra aos textos da interface que ainda diziam "rank" para item e inimigo (`src/i18n/pt-BR.ts`).

### Ranks

**Estado:** Futuro (F2/F3)

| Rank | Reputação necessária | Como é obtido |
|---|---|---|
| **Genin** | — | Rank inicial de todo personagem (o único do MVP) |
| Chunin | 1000 | Ao atingir a reputação, libera a Missão de Promoção a Chunin; concluí-la promove o personagem |
| Jounin | 4000 | Ao atingir a reputação, libera a Missão de Promoção a Jounin |
| Ranks futuros | — | Reservados para expansões (ANBU, Kage), Seção 20 |

### Como a reputação é ganha

**Estado:** Implementado (MVP)

- Cada inimigo derrotado dá reputação pelo seu **grau** (tabela `rewards` em `src/game/Balance.ts`, aplicada em `src/game/run/runManager.ts`): comum grau D **22** <!-- fact: BALANCE.rewards.D.rep=22 -->, elite grau D+ **38**, chefe C **160** <!-- fact: BALANCE.rewards.C.rep=160 -->, chefe B **240** <!-- fact: BALANCE.rewards.B.rep=240 -->, chefe A **400** <!-- fact: BALANCE.rewards.A.rep=400 --> (este último para sagas futuras).
- Títulos com bônus de reputação somam por cima (`repPct`); no MVP o único título com esse bônus é o Novo Chunin, oculto até a F2 (C14).
- **Conta da Saga da Onda (C8):** 24 comuns + Zabuza + Haku dão 24 × 22 + 160 + 240 = **928**. O DD v2 dizia que, com 2 a 3 elites, quem completa a saga passa de 1000. Não passa: a elite **substitui** um comum e soma só 16 a mais (38 contra 22). Com as 3 <!-- fact: BALANCE.run.eliteForks=3 --> bifurcações de elite de uma run, o máximo é 928 + 3 × 16 = **976**. O texto foi corrigido e a interface não promete os 1000 (`map.eliteInfo` em `src/i18n/pt-BR.ts`).
- **O caminho até 1000** continua sendo uma "missão de grau D" opcional (3 encontros, cerca de 70 de reputação) antes da promoção, sem grind obrigatório. Ela entra na F2, junto com a promoção.
- O contador de reputação fica sempre visível no cabeçalho da run (`src/ui-dom/components/runHeader.ts`). A barra de progresso até o próximo rank entra com o rank Chunin (F2).

### Missão de promoção

**Estado:** Futuro (F2/F3)

Um encontro especial (um chefe ou uma sequência de encontros) que só fica disponível quando a reputação mínima é atingida. No Modo História, a Missão de Promoção a Chunin corresponde à entrada da saga do Exame Chunin (Seção 12).

### Benefícios de cada promoção

**Estado:** Futuro (F2/F3)

- Bônus fixo de pontos de atributo, à escolha do jogador: **+10 ao virar Chunin, +15 ao virar Jounin**.
- Mais slots de jutsu: Genin 4 → Chunin 6 → Jounin 8 (Seção 8). No código, `slotCount` em `src/game/progression/loadout.ts` já é o ponto único onde os slots por rank vão entrar; hoje devolve sempre os 4 do Genin.
- A loja passa a oferecer itens de grau mais alto (Seção 11).
- Badge de rank ao lado do nome na interface.
- O título Novo Chunin (+5% de reputação) já está nos dados, oculto até existir promoção (C14, `src/data/titles.ts`).

### O rank ninja não trava jutsus

O rank é reconhecimento, bônus e acesso à loja; **não** é o que trava jutsus fortes. Isso evita uma inconsistência com o anime, em que o protagonista aprende técnicas avançadas (como o Rasengan) ainda Genin. Quem decide quando um jutsu pode ser aprendido é a combinação de atributo e saga da história (Seção 8).

### Escopo por run

Rank, reputação e ryo são da **run atual**: toda run começa como Genin, com reputação e ryo zerados (`createCharacter` em `src/game/progression/character.ts`). O que persiste entre runs está na Seção 15.

**Fica de fora do MVP (spec §1):** promoção a Chunin e Jounin, missão de promoção, missão de grau D opcional, barra de progresso até o próximo rank e a loja por rank (F2).

---

## 5. Criação de Personagem

**Estado:** Implementado (MVP)

### Versão do protótipo [F0/F1A]

**Estado:** Implementado (MVP)

| Campo | Descrição |
|---|---|
| Nome | Escolhido livremente, de 1 a 20 caracteres |
| Clã | Uchiha, Uzumaki ou Sem clã (build livre, com a compensação da Seção 6) |
| Afinidade elemental | Ver regras abaixo |
| Distribuição inicial | Exatamente 10 <!-- fact: BALANCE.attributes.creationPoints=10 --> pontos entre os 8 atributos, com prévia ao vivo e presets (abaixo) |
| Título inicial [F1B] | Opcional: um título já conquistado em runs anteriores, que dá um pequeno buff durante a run (Seção 14) |

Todo personagem começa como **Genin**, no nível 1, com os atributos em 5 antes da distribuição, 0 ryo e inventário vazio (`ASSUMIDO` da spec: não desviar da calibração do Apêndice A.5). A tela é `src/ui-dom/screens/CreateScreen.ts`; a validação (nome, clã jogável, título existente, soma exata dos pontos) é de `createCharacter` em `src/game/progression/character.ts`, de modo que a regra vale também fora da interface, no simulador e nos testes.

**Prévia ao vivo.** Enquanto o jogador distribui os pontos, a tela mostra HP e chakra máximos, regeneração, chance de crítico, redução de dano, Poder Ninja e os jutsus que aquela distribuição já desbloqueia (`creationPreview` em `src/ui-dom/view/derived.ts`). A decisão de onde pôr os pontos fica concreta: "com Nin 12, Daitoppa e Doryuuheki entram".

### Presets de distribuição (C9)

O simulador do DD v2 (Apêndice A.5) mostrou que builds com pontos espalhados não passam de Zabuza, e a criação não orientava o jogador. A **C9** acrescentou presets na criação e um botão **"Distribuir pelo preset"** em toda distribuição de pontos (criação e subida de nível); a distribuição manual continua livre. Os pesos estão em `src/game/progression/presets.ts`:

| Preset | Distribuição |
|---|---|
| Ninjutsu | Nin 40% · HP 20% · Def 15% · Vel 15% · Crit 5% · Int 5% |
| Taijutsu | Tai 40% · HP 20% · Def 15% · Vel 15% · Crit 5% · Int 5% |
| Equilibrado-guiado | Nin 30% · Tai 10% · HP 20% · Def 15% · Vel 15% · Int 10% |

Os presets Ninjutsu e Taijutsu são as mesmas builds que o simulador mede, então o jogador que segue o preset joga a curva de dificuldade que foi calibrada. O botão soma pontos na direção do preset a partir da build atual (reaproveita o algoritmo do robô do simulador), sem desfazer o que o jogador já distribuiu à mão. O Equilibrado-guiado não é medido pelo simulador. O componente é `src/ui-dom/components/allocation.ts`.

### Regras de afinidade elemental

A afinidade define de qual natureza de chakra o personagem é "nativo". Ela existe para gerar escolhas reais sem trancar o jogador:

- **Escolha no MVP:** Fogo, Vento, Terra ou Água (`AFFINITY_OPTIONS` em `src/ui-dom/screens/CreateScreen.ts`). O **Raio** entra na F2, junto com o Chidori: não há jutsu de Raio antes do Exame Chunin.
- **Uchiha:** afinidade **Fogo** fixa (herança do clã, Seção 6); a tela trava o seletor. Uzumaki e Sem clã escolhem livremente.
- **Jutsus elementais da afinidade:** custo normal e maestria até +5 <!-- fact: BALANCE.mastery.maxLevel=5 -->.
- **Jutsus elementais de outro elemento:** custo de chakra ×1,25 <!-- fact: BALANCE.cost.offAffinityMult=1.25 --> (+25%) e maestria máxima +3 <!-- fact: BALANCE.mastery.maxLevelOffAffinity=3 -->. Continuam aprendíveis (cumprindo atributo e saga), só ficam menos eficientes.
- **Sem clã ignora as duas penalidades** (parte da compensação do caminho livre).
- **Jutsus neutros** (Kage Bunshin, Kawarimi, Rasengan, a maior parte de Taijutsu, Genjutsu e Fuinjutsu) não são afetados.
- A afinidade também é o elemento do personagem quando ele **recebe** um golpe (`ASSUMIDO` da spec, `src/game/run/battleSetup.ts`): um Uchiha (Fogo) leva ×1,3 dos jutsus de Água de Zabuza e Haku (Seção 7).
- **Segunda afinidade [F2]:** ao ser promovido a Chunin, o jogador escolhe uma segunda natureza, sem penalidade nela.
- **Naturezas combinadas (Kekkei Genkai) [Futuro]:** modelo previsto na Seção 7.

### Versão completa [F2+]

**Estado:** Futuro (F2/F3)

| Campo | Descrição |
|---|---|
| Aparência | Corpo, rosto, cabelo, cores (cosmético) |
| Clã | Bônus de atributo, passiva e pool de jutsus exclusivos, entre os sete clãs |
| Natureza de Chakra | Fogo, Água, Vento, Raio, Terra e combinações avançadas (Kekkei Genkai) |
| Vila | Cosmético e lore, sem impacto mecânico |

**Fica de fora do MVP (spec §1):** Raio, segunda afinidade, aparência e vila (F2), desbloqueio de clãs pela meta-progressão (F2) e layout de criação para telas abaixo de 1024 px.

---

## 6. Sistema de Clãs

**Estado:** Parcial (MVP)

Cada clã tem uma **passiva** sempre ativa (ou sustentada, como uma transformação), **dois atributos de destaque** (+1 automático por nível em cada um) e um **pool pequeno de jutsus exclusivos**, com nomes fiéis ao anime (Apêndice B). O MVP joga três caminhos, Uchiha, Uzumaki e Sem clã (`PLAYABLE_CLANS` em `src/data/clans.ts`); os outros quatro clãs já existem nos dados com os destaques, marcados como não jogáveis, para a Enciclopédia e a F2.

Os valores das passivas são dados do clã em `src/data/clans.ts` (e, no caso do Sharingan, em `src/data/effects.ts`), não constantes do `BALANCE`. Os três caminhos do MVP foram medidos pelo simulador; os demais são estimativas a validar quando entrarem.

### Uzumaki [F1A]

**Estado:** Implementado (MVP)

- **Passiva:** +10% de HP máximo (multiplicador 1,1 na fórmula de HP); Meditar recupera 20% a mais (o 25% do chakra máximo vira 30%); Kage Bunshin no Jutsu custa −20% de chakra (afinidade natural, mas o jutsu continua geral).
- **Atributos de destaque:** HP, Inteligência.
- **Jutsus exclusivos (C7, C15):** Kongou Fuusa (Correntes de Chakra Adamantinas), da F1A, com Herança; e Hakke no Fuuin Shiki (Selo dos Oito Trigramas), jutsu de assinatura da **F3**. O DD v2 punha Fuuinjutsu: Gogyou Fuuin neste pool; a **C7** o tornou **Geral e da F2**, porque na obra é técnica do Orochimaru. O DD v2 também marcava o Hakke no Fuuin Shiki como [F2+] aqui e F3 no Apêndice B; a **C15** fixou **F3**, porque o apêndice é mais específico.
- **Balanceamento medido:** é o clã mais forte contra chefes. Nas builds focadas, quem vence Zabuza quase sempre vence Haku (cerca de 94–95%, acima da meta de 70–85%). As correções sugeridas (reduzir a cura do kit ou tirá-lo da escolha 1-de-3, revisar esta passiva) ficam para depois de o usuário jogar (`docs/ANALISE.md` §7, `docs/balance-log.md`).

### Uchiha [F1A]

**Estado:** Implementado (MVP)

- **Sharingan (tomoe 1) como transformação:** por decisão do usuário, o Sharingan é uma **transformação** (spec §4.1), uma categoria genérica do sistema de efeitos que no futuro também serve para Modo Sábio e Bijuu. Ativar custa 0 de chakra e **não gasta o turno** (`ASSUMIDO`: o Uchiha já rende abaixo na Saga da Onda); a manutenção é **2 de chakra por turno**; enquanto ativo, dá **+14% de chance de crítico, +10% de esquiva e +15% de dano de jutsus**. Ligar ou desligar é permitido 1 vez por turno, e a transformação termina por falta de chakra, ao desativar ou no fim da batalha. Os valores estão no efeito `sharingan` em `src/data/effects.ts`.
- **Tomoe 2 e 3 [F2]:** depois de 40 turnos ativos na run (tomoe 2) e de 120 (tomoe 3), os bônus aumentam e liberam a cópia parcial de jutsu inimigo. O motor já conta os turnos de transformação da run (`transformTurns`), e o contador é salvo.
- **Afinidade Katon:** afinidade Fogo fixa e **+15% de dano em jutsus de Fogo**, somada ao Sharingan no mesmo termo de bônus (C2).
- **Atributos de destaque:** Genjutsu, Chance de Crítico.
- **Jutsus exclusivos:** Katon: Goukakyuu no Jutsu e Genjutsu: Sharingan na F1A, os dois com Herança; Katon: Ryuuka no Jutsu na F2; Amaterasu e Tsukuyomi no Futuro.
- **Balanceamento medido:** o Uchiha é a build mais fraca contra chefes, porque os dois chefes são de Água (Água vence Fogo: os golpes de Fogo dele saem ×0,8 e os de Água dos chefes entram ×1,3) e o simulador não mede bem o valor do Genjutsu. Com 3000 runs, Ninjutsu / Uchiha vence Zabuza em 41% e completa a saga em 31%, abaixo das metas de design (45–75% e 35–70%) e dentro da faixa de regressão da build (`docs/ANALISE.md` §6). É deliberado: o clã cresce ao longo da campanha, com mais inimigos sem Água, e deve ser revisto na F2.

### Hyuuga [F2 — não simulado]

**Estado:** Futuro (F2/F3)

- **Passiva:** Byakugan sempre ativo, sem custo: +8% de Chance de Crítico e ignora 25% da Defesa do alvo.
- **Atributos de destaque:** Taijutsu, Chance de Crítico.
- **Jutsus exclusivos:** Jyuuken (com Herança), Hakke Sanjuuni Shou, Kaiten, Hakke Rokujuuyon Shou.

### Nara [F2 — não simulado]

**Estado:** Futuro (F2/F3)

- **Passiva:** jutsus de sombra aplicam Controle (chance base 60%, 1 a 2 turnos), sempre sujeitos à Resistência ao Controle (Seção 10).
- **Atributos de destaque:** Inteligência, Velocidade.
- **Jutsus exclusivos:** Kagemane no Jutsu, Kagenui no Jutsu, Kage Kubishibari no Jutsu.

### Akimichi [F2 — não simulado]

**Estado:** Futuro (F2/F3)

- **Passiva:** +15% de HP máximo (já nos dados: multiplicador 1,15) e −25% de dano de efeitos contínuos (queimadura, sangramento).
- **Atributos de destaque:** HP, Defesa.
- **Jutsus exclusivos:** Bubun Baika no Jutsu (com Herança), Baika no Jutsu, Nikudan Sensha, Chou Baika no Jutsu.

### Aburame [F2 — não simulado]

**Estado:** Futuro (F2/F3)

- **Passiva:** cada jutsu de Ninjutsu ou Taijutsu que acerta drena 4% do chakra máximo do inimigo e devolve metade ao usuário.
- **Atributos de destaque:** Ninjutsu, Inteligência.
- **Jutsus exclusivos:** Kikaichuu no Jutsu (com Herança), Mushi Bunshin no Jutsu, Mushidama.

### Sem clã [F0/F1A] — compensação definida

**Estado:** Implementado (MVP)

O caminho livre tem vantagens próprias, para não ser estritamente pior que qualquer clã (os clãs também acessam todos os jutsus gerais):

- **6 pontos livres por nível**, em vez de 5 mais os 2 automáticos dos destaques: um ponto a menos no total, mas todos onde o jogador quiser.
- **Sem penalidade de afinidade:** jutsus de qualquer elemento custam o normal e chegam à maestria +5.
- **Jutsus gerais custam −10% de chakra.**
- **A maestria sobe 25% mais rápido:** os usos exigidos por nível são multiplicados por 0,75 e arredondados para cima (Seção 8).
- Sem passiva de combate e sem jutsus exclusivos.

**Fica de fora do MVP (spec §1):** os clãs Hyuuga, Nara, Akimichi e Aburame, o Sharingan tomoe 2/3 e o desbloqueio de clãs pela meta-progressão (F2).

---

## 7. Sistema de Chakra e Elementos

**Estado:** Parcial (MVP)

O chakra e a roda dos cinco elementos estão no código; o Raio só tem jutsus na F2 e a infusão elemental é visão de longo prazo.

### Chakra

**Estado:** Implementado (MVP)

Recurso compartilhado por todas as ações especiais.

- **Máximo:** `30 + 4·nível + Inteligência`.
- **Regeneração:** `2 + ⌊Inteligência / 8⌋`, no início de cada turno do combatente, antes da manutenção das transformações e do dano contínuo (`src/game/combat/battle.ts`).
- **Meditar:** passa o turno e recupera **25%** <!-- fact: BALANCE.actions.meditateChakraPct=0.25 --> do chakra máximo (30% para o Uzumaki). Meditar está na barra de ações da batalha, que o DD v2 §13 havia esquecido (C10): Atacar, Defender, Meditar, Item, Transformar (só quem tem transformação) e os 4 jutsus.
- **Defender:** o dano recebido é multiplicado por 0,5 <!-- fact: BALANCE.actions.defendDamageMult=0.5 --> até o próximo turno do personagem, e ele recupera **10%** <!-- fact: BALANCE.actions.defendChakraPct=0.1 --> do chakra máximo. As duas ações têm papéis distintos: Defender protege, Meditar recarrega.
- **Entre encontros:** recupera 50% <!-- fact: BALANCE.recovery.encounterChakraPct=0.5 --> do chakra máximo (e 25% <!-- fact: BALANCE.recovery.encounterHpPct=0.25 --> do HP). No Acampamento, antes de cada chefe, HP e chakra voltam a 100%.
- **Custo de jutsu:** cada jutsu tem o seu custo em `src/data/jutsus.ts`. Os modificadores (maestria, fora da afinidade, Sem clã, desconto do clã, título) são **multiplicativos** (`ASSUMIDO` da spec, `jutsuChakraCost` em `src/game/progression/mastery.ts`), e o custo final nunca cai abaixo de 1.

### Roda de vantagem elemental

**Estado:** Implementado (MVP)

    Fogo → Vento → Raio → Terra → Água → Fogo

O elemento do atacante vence o seguinte na roda: **dano ×1,3** <!-- fact: BALANCE.damage.elementAdvantage=1.3 -->. O contrário: **dano ×0,8** <!-- fact: BALANCE.damage.elementDisadvantage=0.8 -->. Elementos não adjacentes são neutros (×1,0). A ordem da roda é a lista `ELEMENTS` em `src/game/types.ts`, e `elementMultiplier` em `src/game/formulas.ts` aplica o modificador.

**Quem tem elemento no golpe e na defesa.** O elemento do golpe é o do jutsu (a ação Atacar é neutra). O elemento do defensor é a sua afinidade, para o jogador, ou o elemento do inimigo; inimigos sem elemento são neutros (`ASSUMIDO` da spec). Na Saga da Onda, só Zabuza e Haku têm elemento, os dois Água (`src/data/enemies.ts`), e os comuns são neutros.

**Implicações na Saga da Onda:** contra os dois chefes, **Terra** é vantajosa (Terra vence Água) e **Fogo** é desvantajoso (Água vence Fogo). O gelo do Haku (Hyouton, Kekkei Genkai) conta como Água na F1. Como a afinidade também define o elemento do defensor, o Uchiha perde dos dois lados: bate ×0,8 com Fogo e recebe ×1,3 dos jutsus de Água. O único jutsu elemental de dano disponível na Onda para Uzumaki e Sem clã, além da Bola de Fogo, é o Daitoppa (Vento); por isso o simulador usa afinidade Vento para eles (`docs/ANALISE.md` §4).

### Elemento é opcional — só existe quando existe na lore

**Estado:** Implementado (MVP)

Elemento é um campo opcional de cada jutsu. Um jutsu só tem elemento se, na obra, ele tem natureza de chakra:

- **Com elemento:** Bola de Fogo Básica e Katon: Goukakyuu no Jutsu (Fogo), Suiton: Suiryuudan no Jutsu (Água), Fuuton: Daitoppa (Vento), Doton: Doryuuheki (Terra) e, nas fases futuras, Chidori (Raio), Katon: Ryuuka no Jutsu (Fogo) e Fuuton: Rasen Shuriken (Vento).
- **Sem elemento (neutros):** Kage Bunshin no Jutsu, Bunshin no Jutsu, Kawarimi no Jutsu, Henge no Jutsu, Rasengan e a maior parte de Taijutsu, Genjutsu e Fuinjutsu.

Jutsus neutros não participam da roda (modificador fixo 1,0), não sofrem penalidade de afinidade e chegam sempre à maestria +5.

### Raio [F2]

**Estado:** Futuro (F2/F3)

O Raio já faz parte da roda no código (vence Terra, perde para Vento), mas nenhum jutsu de Raio é aprendível antes do Exame Chunin, e a criação não oferece Raio como afinidade. O título de domínio elemental de Raio existe nos dados, oculto (`src/data/titles.ts`). Entra na F2, com o Chidori.

### Infusão elemental [Futuro]

**Estado:** Futuro (F2/F3)

Um jutsu neutro poderá receber um elemento e se transformar em outro jutsu; o exemplo principal é o Rasengan com natureza Vento virando o Rasen Shuriken. O modelo de dados do DD v2 prevê um campo opcional de infusões (elemento → jutsu resultante) em cada jutsu. No MVP esse campo não existe: o Rasen Shuriken está no catálogo como jutsu próprio, com o Rasengan como pré-requisito. Ver Seções 18 e 20.

**Fica de fora do MVP (spec §1):** jutsus e afinidade de Raio, segunda afinidade, naturezas combinadas (Kekkei Genkai) e infusão elemental.

---

## 8. Sistema de Jutsus e Progressão

**Estado:** Parcial (MVP)

O desbloqueio por status, os 4 slots do Genin, a troca de jutsus e a maestria estão no código. Os slots de Chunin e Jounin e os jutsus das fases seguintes são visão: os jutsus futuros já existem nos dados, com requisitos, e aparecem na Enciclopédia.

### Categorias

| Categoria | Atributo relacionado | Descrição |
|---|---|---|
| Ninjutsu | Ninjutsu | Dano à distância e técnicas de suporte; pode ou não ter elemento |
| Taijutsu | Taijutsu | Combate corpo a corpo |
| Genjutsu | Genjutsu | Controle e debuff; quase sem dano direto |
| Fuinjutsu | Inteligência | Selos e suporte |

### Regra de desbloqueio

**Estado:** Implementado (MVP)

> Um jutsu é **aprendido automaticamente** no momento em que o personagem cumpre **todas** as suas condições. Nenhuma outra fonte concede jutsus (C12).

1. **Atributo mínimo**, sempre o atributo **base**. Alguns jutsus exigem dois atributos. As faixas seguem a tabela por grau da Seção 3.
2. **Clã**, só para os jutsus exclusivos.
3. **Saga mínima** do Modo História: o ponto da campanha a partir do qual o jutsu existe na narrativa. É isso que garante a fidelidade cronológica: um jutsu que só aparece depois de certo arco não pode ser aprendido antes, mesmo com atributo alto. Por isso o Rasengan (saga mínima: Busca por Tsunade) não aparece num confronto com Zabuza.
4. **Pré-requisito de jutsu**, opcional: ter aprendido outro antes. O **Rasengan exige o Kage Bunshin no Jutsu**, como na obra.

O nível do personagem não desbloqueia jutsu diretamente. A regra é `meetsRequirements` em `src/game/progression/unlock.ts`, e `checkUnlocks` roda depois de criar o personagem, distribuir pontos, aplicar um Pergaminho Raro e avançar o ponto da história; ela repete a verificação até estabilizar, para resolver cadeias de pré-requisito numa chamada só.

**Os pontos da história**, em ordem, estão em `STORY_POINTS` (`src/game/types.ts`): Início, Onda, Onda depois de Zabuza, cinco etapas do Exame Chunin, Busca por Tsunade, Recuperação do Sasuke, Shippuden e Perseguição a Itachi. A run começa em Onda e vencer Zabuza avança para "Onda depois de Zabuza" (`src/data/saga.ts`); é esse avanço que libera o Suiryuudan, o dragão de água que o próprio Zabuza usa. Início e Onda são equivalentes no MVP; a distinção existe para as sagas futuras.

**Por que só por status (C12).** O DD v2 §12 punha "um jutsu elegível novo" entre as recompensas 1-de-3 ao subir de nível, o que contradizia o desbloqueio automático da §15. O usuário decidiu pela regra fixa: o jutsu é consequência do investimento, nunca de sorte. A escolha 1-de-3 oferece só kit, pílula, reforço, ryo ou treino (Seção 15).

### Regra de Herança de clã

**Estado:** Implementado (MVP)

Jutsus básicos de clã podem ter a marca **Herança**: o personagem os aprende já na Saga da Onda, ainda que na obra o portador canônico só os mostre mais tarde, porque o jogador cresce dentro da família. Vale só para técnicas básicas: Katon: Goukakyuu e Genjutsu: Sharingan para o Uchiha, Kongou Fuusa para o Uzumaki, e, nos clãs da F2, Jyuuken, Bubun Baika e Kikaichuu. **Jutsus de assinatura** (Amaterasu, Kaiten, Rokujuuyon Shou, Chou Baika, Hakke no Fuuin Shiki) seguem a cronologia sem exceção. Nos dados, a Herança é a marca `inheritance` e, na prática, uma saga mínima Início para o jutsu de clã (`src/data/jutsus.ts`).

### Descrição de cada jutsu

Todo jutsu tem uma descrição curta, fiel ao anime, que diz o que ele faz mecanicamente. Ela aparece no botão do jutsu na batalha, na tela de jutsus da Preparação e na Enciclopédia.

### Requisitos e catálogo completo

**Estado:** Parcial (MVP)

O catálogo de `src/data/jutsus.ts` tem 43 jutsus de jogador: 14 jogáveis no MVP e 29 de fases futuras, que existem só como dados para a Enciclopédia (mais os golpes exclusivos de inimigos, que não aparecem nela). A tabela completa, com efeitos, está no Apêndice B. Exemplos:

| Jutsu | Categoria | Elemento | Clã | Requisito | Saga mínima | Grau | Fase |
|---|---|---|---|---|---|---|---|
| Bunshin no Jutsu | Ninjutsu | — | — | Nin 5 | Início | D | F1A |
| Kawarimi no Jutsu | Ninjutsu | — | — | Vel 8 | Início | D | F1A |
| Bola de Fogo Básica | Ninjutsu | Fogo | — | Nin 6 | Início | D | F0 |
| Sennen Goroshi | Taijutsu | — | — | Tai 6 | Início | D | F0 |
| Kai | Genjutsu | — | — | Gen 8 | Início | D | F1A |
| Katon: Goukakyuu no Jutsu | Ninjutsu | Fogo | Uchiha | Nin 12 | Início (Herança) | C | F1A |
| Kongou Fuusa | Fuinjutsu | — | Uzumaki | Int 14 + Nin 8 | Início (Herança) | C | F1A |
| Fuuton: Daitoppa | Ninjutsu | Vento | — | Nin 12 | Onda | C | F1A |
| Kage Bunshin no Jutsu | Ninjutsu | — | — | Nin 20 | Onda | B | F1A |
| Suiton: Suiryuudan no Jutsu | Ninjutsu | Água | — | Nin 22 | Onda (após Zabuza) | B | F1A |
| Chidori | Ninjutsu | Raio | — | Nin 30 + Vel 18 | Exame Chunin (mês de treino) | A | F2 |
| Rasengan | Ninjutsu | — | — | Nin 32 + Int 15 (+ Kage Bunshin) | Busca por Tsunade | A | F3 |
| Amaterasu | Ninjutsu | — | Uchiha | Gen 40 + Nin 25 | Perseguição a Itachi | S | Futuro |

Os 14 jogáveis no MVP: Henge, Bunshin, Kawarimi, Bola de Fogo Básica, Sennen Goroshi, Investida Ninja, Kai, Daitoppa, Doryuuheki, Suiryuudan e Kage Bunshin (gerais), Kongou Fuusa (Uzumaki), Katon: Goukakyuu e Genjutsu: Sharingan (Uchiha). Três deles mudaram de comportamento em relação ao DD v2 por correções da spec: o **Kawarimi** perdeu a "Prioridade", que não tinha sentido num turno sequencial, e virou uma carga que anula o próximo golpe recebido por 2 turnos (C3); o **Kai** é a única ação permitida sob Ilusão, e remove a Ilusão (C13); o **Gogyou Fuuin** virou Geral e da F2 (C7).

### Filtragem de jutsus por combinação da run

**Estado:** Implementado (MVP)

Durante a run, as metas de "faltam X pontos para Y" (Ficha e tela de resultado da batalha) mostram só os jutsus relevantes para aquele personagem: os gerais e os do próprio clã, já liberados pela saga atual e com o pré-requisito cumprido (`jutsuGoals` em `src/ui-dom/view/derived.ts`). O jogador não vê, dentro da run, requisitos de jutsus de outros clãs; o pool completo, com os requisitos de todos, inclusive os bloqueados, fica na Enciclopédia (Seção 13), que tem filtro por categoria e por estado (todos, desbloqueados, bloqueados).

### Slots de jutsu

**Estado:** Parcial (MVP)

Só os jutsus **equipados** podem ser usados em batalha. O número de slots depende do rank ninja:

| Rank ninja | Slots de jutsu |
|---|---|
| Genin | 4 <!-- fact: BALANCE.loadout.geninSlots=4 --> |
| Chunin | 6 [F2] |
| Jounin | 8 [F2] |

- Os jutsus aprendidos ficam no repertório, sem limite; só os equipados aparecem na barra de batalha.
- Ao aprender um jutsu com slot livre, ele é equipado automaticamente. Com os 4 slots ocupados, o jogo pergunta qual jutsu equipado sai, ou se o novo fica só no repertório (`src/ui-dom/components/swap.ts`).
- A troca de jutsus equipados é feita fora da batalha, na Preparação, para que montar o conjunto antes da luta seja uma decisão tática (`src/game/progression/loadout.ts`).
- A maestria é guardada por jutsu: se ele sai do slot e volta depois, o progresso continua.
- Ao ser promovido [F2], os novos slots ficam livres para equipar.
- A ação básica Atacar não ocupa slot.

### Maestria de jutsu

**Estado:** Implementado (MVP)

Cada jutsu evolui com o uso, de +1 a +5 <!-- fact: BALANCE.mastery.maxLevel=5 -->, ficando mais barato, mais forte e mais confiável. A tabela de usos do DD v2 (recalibrada em relação à versão anterior, que exigia 90 usos para o +5) foi mantida: limiares 6,9,12,15,18 <!-- fact: BALANCE.mastery.stepUses=6,9,12,15,18 -->.

| Maestria | Usos para subir | Usos acumulados | Sem clã (usos × 0,75, para cima) |
|---|---|---|---|
| +1 | 6 | 6 | 5 (acumulado 5) |
| +2 | 9 | 15 | 7 (12) |
| +3 | 12 | 27 | 9 (21) |
| +4 | 15 | 42 | 12 (33) |
| +5 (máxima) | 18 | 60 | 14 (47) |

Efeito de cada nível:

- **Custo de chakra:** −5% <!-- fact: BALANCE.mastery.costPerLevel=0.05 --> por nível (−25% no +5).
- **Dano:** +3% <!-- fact: BALANCE.mastery.damagePerLevel=0.03 --> por nível (+15% no +5). É o termo `(1 + 0,03·m)` da fórmula de dano (C1).
- **Chance de efeito** (queimadura, imobilização, ilusão): +8% <!-- fact: BALANCE.mastery.effectChancePerLevel=0.08 --> relativo por nível; no +5, uma chance base de 20% vira 28%. Jutsus sem efeito só ganham custo e dano.
- **Teto fora da afinidade:** um jutsu elemental de outro elemento para em +3 <!-- fact: BALANCE.mastery.maxLevelOffAffinity=3 --> (exceto para o Sem clã).

Regras:

- Cada conjuração conta um uso, acertando ou não; como cabe um jutsu por turno, conta no máximo uma vez por turno (`src/game/combat/battle.ts`).
- A maestria pertence à run: cada nova run recomeça no +0. O que persiste entre runs é a maestria máxima alcançada em cada jutsu, guardada na meta-progressão (`src/game/meta/meta.ts`) e usada pelos títulos de domínio elemental (Seção 14).
- **Medido pelo simulador (Saga da Onda completa):** o jutsu principal da run, o mais usado, termina em média entre +2 e +4, como o DD v2 previa. A exceção é o Taijutsu, que concentra os usos num golpe só: Taijutsu / Uzumaki chega a +4,45 e Taijutsu / Sem clã a +4,04 (1000 runs), cobertos por faixas próprias de regressão (`docs/ANALISE.md` §6). O +5 continua sendo conquista de quem concentra o uso num jutsu a run inteira.
- Maestria não é grau: o grau (D a S) é o nível de poder da técnica; a maestria é o quanto o jogador a dominou. Para não confundir com a moeda persistente, os "Pontos de maestria" da meta-progressão se chamam **Pontos de Legado** (Seção 15, F2).
- Os parâmetros (usos por nível, bônus por nível, tetos) ficam em `src/game/Balance.ts`, e as funções em `src/game/progression/mastery.ts`: calibrar não exige mexer no código.

**Fica de fora do MVP (spec §1):** slots 6 e 8 (dependem da promoção, F2), os jutsus de F2, F3 e Futuro como técnicas jogáveis (estão nos dados só para a Enciclopédia) e a infusão elemental.
