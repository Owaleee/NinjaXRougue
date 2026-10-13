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

---

## 9. Sistema de Combate e Grau de Inimigos

**Estado:** Implementado (MVP)

O combate 1x1 por turnos, as ações, a recuperação, os graus de inimigo e a IA estão no código. Batalhas em equipe são visão.

### Formato

O MVP é 1x1; batalhas 3x3 continuam anotadas como possibilidade futura. Mesmo em 1x1, o motor trata a batalha como uma **lista de combatentes** com lado (jogador ou inimigo), e não como "um jogador contra um inimigo" fixo (`BattleState.combatants` em `src/game/combat/types.ts`). Isso deixa o caminho aberto para invocações e batalhas em equipe (Seções 18 e 20).

### Ordem de turno

A cada rodada, todo combatente vivo age uma vez, do mais rápido para o mais lento, pela `Velocidade efetiva × (1 + sorteio entre 0 e 0,10)` recalculada a cada rodada (Seção 3). Uma pequena vantagem de Velocidade não garante a iniciativa em todo turno, e a Velocidade deixa de ser obrigatória. O turno é **sequencial** (`ASSUMIDO` da spec): cada combatente escolhe a ação na sua vez, o que corresponde ao "Seu turno / Turno do inimigo" da interface. Por isso não existe "prioridade": o DD v2 dava prioridade a alguns jutsus e itens, e o único que a tinha, o Kawarimi, virou uma carga que anula o próximo golpe recebido (C3).

O início de cada turno segue uma ordem fixa: regeneração de chakra, manutenção da transformação, dano contínuo, controle e, por fim, a contagem das durações (`beginTurn` em `src/game/combat/battle.ts`). Uma luta que passa de 200 <!-- fact: BALANCE.battle.maxRounds=200 --> rodadas termina com a vitória do inimigo: é uma trava contra lutas infinitas, não uma regra de jogo que o jogador deva encontrar.

### Ações por turno

| Ação | Descrição | Custo |
|---|---|---|
| Atacar | Golpe básico de Taijutsu, Poder 18 <!-- fact: BALANCE.power.attack=18 -->, neutro; a arma entra pelos atributos que dá | 0 |
| Usar Jutsu | Um dos jutsus equipados (Seção 8), com o dano escalado pelo atributo da categoria | Chakra |
| Defender | Dano recebido ×0,5 <!-- fact: BALANCE.actions.defendDamageMult=0.5 --> até o próximo turno e recupera 10% <!-- fact: BALANCE.actions.defendChakraPct=0.1 --> do chakra máximo | — |
| Meditar | Passa o turno e recupera 25% <!-- fact: BALANCE.actions.meditateChakraPct=0.25 --> do chakra máximo (30% no Uzumaki); não reduz dano | — |
| Usar Item | Consumível do inventário (kit médico, pílula de chakra, Pergaminho de Reforço) | A ação do turno (`ASSUMIDO`); o item é gasto |
| Transformar | Liga ou desliga a transformação (Sharingan); só aparece para quem tem uma | Não gasta o turno (`ASSUMIDO`); 1 vez por turno |
| Trocar personagem | Só em batalhas em equipe [Futuro] | — |

A barra de batalha tem Atacar, Defender, Meditar, Item, Transformar e os 4 jutsus (C10, Seção 13). Sob **Ilusão**, a única ação permitida é Kai, que remove a Ilusão (C13, Seção 10).

### Fórmula de dano e chance de acerto

A fórmula é a da Seção 3, já com as duas correções: o termo de maestria `(1 + 0,03·m)` (C1) e o termo único `(1 + Σ bônus % de dano)` que soma título, clã, transformação e buffs (C2). Para o inimigo, entra também o **multiplicador de dano do grau** (tabela abaixo); para o jogador ele vale 1. Não existe teste de precisão separado: o golpe sempre tenta acertar e o defensor pode esquivar (teto de 40%). Antes da esquiva, uma carga de Kawarimi anula o golpe e a de Henge pode fazê-lo errar; depois dela, um clone do Kage Bunshin pode absorvê-lo (`resolveHit` em `src/game/combat/damage.ts`). Efeitos de névoa e de espelhos, como o Kirigakure de Zabuza e o Makyou de Haku, somam bônus de esquiva sob o mesmo teto.

### Recuperação entre encontros e Acampamento

| Momento | Recupera |
|---|---|
| Fim de cada encontro vencido | 25% <!-- fact: BALANCE.recovery.encounterHpPct=0.25 --> do HP máximo e 50% <!-- fact: BALANCE.recovery.encounterChakraPct=0.5 --> do chakra máximo |
| Subir de nível | +25% <!-- fact: BALANCE.recovery.levelUpHpPct=0.25 --> do HP máximo, além do aumento do próprio máximo (`gainXp` em `src/game/progression/character.ts`) |
| **Acampamento** (antes de cada chefe) | HP e chakra a 100% (`restAtCamp` em `src/game/run/runManager.ts`) |
| Kit médico / pílula de chakra | 40% do HP / 50% do chakra máximo (Seção 11) |

O Acampamento também é ponto de save, como o fim de cada encontro (Seção 18). Dentro da batalha não há save: recarregar no meio da luta volta ao início do encontro, com a mesma semente (`ASSUMIDO` da spec, contra save-scum).

### Grau de inimigos

Todo inimigo, comum ou chefe, mostra um **grau** de dificuldade, na mesma escala D a S dos jutsus e dos itens. Na batalha, o painel do inimigo traz o badge "Grau D", "Grau D+", "Grau C" ou "Grau B" (`battle.grade` em `src/i18n/pt-BR.ts`).

> **Grau não é rank.** "Grau" é a escala D a S de inimigos, jutsus e itens; "rank" é só o posto do ninja (Genin, Chunin, Jounin, Seção 4). O DD v2 §13 e §14 ainda chamavam de "rank" o grau de itens e inimigos; a **C11** trocou o termo em todos os textos da interface (`battle.grade`, `map.eliteInfo` e `hist.defeated` em `src/i18n/pt-BR.ts`). O "D+" do inimigo elite também não é um grau de item ou de jutsu: é uma variante do grau D que só existe para inimigos.

| Grau | Tipo de inimigo | No MVP (`src/data/enemies.ts`) |
|---|---|---|
| D | Bandidos e ninjas renegados sem clã (encontros comuns) | Bandido, Ninja Renegado, Mercenário da Névoa |
| D+ (Elite) | Variante de um comum, opcional, mais forte e mais recompensadora | Bandido Veterano, Renegado Veterano, Mercenário Veterano |
| C | Primeiro chefe de saga | Zabuza Momochi (Água) |
| B | Chefe final ou segunda fase de saga | Haku (Água) |
| A | Chefe de arco maior | [F2] Gaara (Invasão de Konoha), Orochimaru |
| S | Chefe raro ou final de fase avançada | [Futuro] reservado |

### Escala de força dos inimigos

A força de um inimigo **não depende do nível real do jogador**, e sim do **nível de história do encontro** (Seção 12): quem está abaixo do nível esperado sente o risco, e quem está acima é recompensado.

1. **Pontos de atributo** = `round(P(N) × razão do grau)`, com `P(N) = 50 + 7·(N − 1)` (Seção 3). Desde a **C5**, os inimigos são **gerados por código**, e não copiados da tabela A.4 do DD v2, que dava ao Bandido de nível 1 41 pontos quando a própria regra dá 35, e que chamava a elite de grau "E", inexistente. Os pontos são distribuídos pelos pesos do **arquétipo** (bruto, ninja, espadachim, ágil) pelo método do maior resto, com mínimo de 1 por atributo (`distributePoints` e `createEnemy` em `src/game/combat/enemyFactory.ts`).
2. HP e chakra usam as mesmas fórmulas do jogador, e o HP máximo é multiplicado pelo multiplicador de HP do grau. Esquiva e crítico também são as do jogador.
3. O **multiplicador de dano** entra na fórmula de dano dos golpes do inimigo. É ele que faz um comum tirar uma fatia controlada do HP do jogador por luta, e não o atributo.

| Grau | Razão de pontos | Multiplicador de HP | Multiplicador de dano | Situação |
|---|---|---|---|---|
| D | 0,7 <!-- fact: BALANCE.enemyGrades.D.pointsRatio=0.7 --> | ×0,8 <!-- fact: BALANCE.enemyGrades.D.hpMult=0.8 --> | ×0,65 <!-- fact: BALANCE.enemyGrades.D.damageMult=0.65 --> | simulado; dano calibrado de 0,6 para 0,65 |
| D+ (Elite) | 0,9 | ×1,0 | ×0,8 | jogável, não medido em separado pelo simulador |
| C | 1,1 <!-- fact: BALANCE.enemyGrades.C.pointsRatio=1.1 --> | ×2,1 <!-- fact: BALANCE.enemyGrades.C.hpMult=2.1 --> | ×0,81 <!-- fact: BALANCE.enemyGrades.C.damageMult=0.81 --> | simulado e calibrado |
| B | 1,2 <!-- fact: BALANCE.enemyGrades.B.pointsRatio=1.2 --> | ×1,7 <!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 --> | ×0,8 <!-- fact: BALANCE.enemyGrades.B.damageMult=0.8 --> | simulado e calibrado (C6) |
| A | 1,35 <!-- fact: BALANCE.enemyGrades.A.pointsRatio=1.35 --> | ×1,5 <!-- fact: BALANCE.enemyGrades.A.hpMult=1.5 --> | ×0,9 <!-- fact: BALANCE.enemyGrades.A.damageMult=0.9 --> | **não simulado** (estimativa do DD v2) |
| S | 1,5 <!-- fact: BALANCE.enemyGrades.S.pointsRatio=1.5 --> | ×1,7 <!-- fact: BALANCE.enemyGrades.S.hpMult=1.7 --> | ×1,0 <!-- fact: BALANCE.enemyGrades.S.damageMult=1 --> | **não simulado** (estimativa do DD v2) |

**Os graus C e B foram calibrados pelo simulador.** O DD v2 dava ao grau C HP ×1,3 e dano ×0,72, e ao grau B HP ×1,3 e dano ×0,8. Com esses números, quase todas as builds venciam Zabuza (93–98%), e Haku saía mais fácil que Zabuza, embora fosse o chefe final (o problema da **C6**). A spec subiu o HP do grau B para ×1,5 e deu ao Haku uma segunda fase; a calibração seguinte, em quatro iterações registradas em `docs/balance-log.md`, levou o grau C a HP ×2,1 e dano ×0,81 e o grau B a HP ×1,7. A C6 fixava o objetivo (de quem vence Zabuza, 70% a 85% vencem Haku), não o número literal; por isso vale o valor do código (`docs/ANALISE.md` §5).

Exemplos gerados pelo código (pontos, HP máximo e chakra máximo):

| Inimigo | Nível de história | Grau | Pontos | HP | Chakra |
|---|---|---|---|---|---|
| Bandido | 1 | D | 35 | 94 | 36 |
| Ninja Renegado | 4 | D | 50 | 112 | 50 |
| Bandido Veterano | 4 | D+ | 64 | 160 | 49 |
| Zabuza Momochi | 5 | C | 86 | 374 | 55 |
| Mercenário da Névoa | 9 | D | 74 | 149 | 71 |
| Haku | 10 | B | 136 | 347 | 78 |

Haku tem menos HP que Zabuza, mas é mais difícil: o arquétipo ágil concentra os pontos dele em Velocidade (38 no nível 10) e Ninjutsu (33), os Espelhos de Gelo somam +25% de esquiva e a segunda fase prioriza o golpe mais forte.

### IA de inimigos

**Estado:** Implementado (MVP)

A IA é determinística: o mesmo estado gera a mesma escolha, o que mantém testes e simulador estáveis (`src/game/combat/ai.ts`).

1. Abaixo de 25% <!-- fact: BALANCE.ai.defensiveHpPct=0.25 --> do HP, usa um jutsu defensivo (sem dano, só com efeitos em si mesmo) que ainda não esteja ativo, se tiver.
2. Se um jutsu de dano tem vantagem elemental sobre o jogador, ele tem prioridade, mesmo que não seja o de maior dano bruto.
3. Senão, usa o jutsu de maior dano esperado que o chakra permite, ou Atacar, se Atacar render mais.
4. Sem chakra para nenhum jutsu, ataca.
5. **Chefes** têm padrões próprios (`ASSUMIDO` da spec nos detalhes) e mudam abaixo de 50% <!-- fact: BALANCE.ai.phase2HpPct=0.5 --> do HP. **Zabuza** abre com Kirigakure no Jutsu e a renova sempre que expira; na segunda fase, ataca de dentro da névoa com Muon Satsujin ou usa o Suiryuudan. **Haku** abre com Makyou Hyoushou; na segunda fase, renova os espelhos e prioriza Sensatsu Suishou (C6).

**Fica de fora do MVP (spec §1):** batalhas em equipe e a ação Trocar, inimigos de grau A e S, cronômetro de turno.

---

## 10. Efeitos, Buffs e Debuffs

**Estado:** Implementado (MVP)

Tudo o que altera temporariamente um combatente (buff, debuff, controle, dano contínuo, carga e transformação) é um **efeito**, tratado por um único sistema genérico (`src/game/effects/EffectSystem.ts`), com os efeitos descritos como dados em `src/data/effects.ts`. Vale para jutsus, itens, passivas de clã, títulos e ações de inimigos.

### Estrutura de um efeito

| Campo | Descrição |
|---|---|
| Nome, ícone e descrição | Como aparece na interface |
| Tipo | Buff, debuff, controle, dano contínuo ou transformação |
| Fonte | Quem aplicou (o efeito guarda o id da fonte) |
| Modificadores | O que altera: % de atributo, esquiva, crítico, % de dano (geral, de jutsu ou por elemento), redução de dano, custo de chakra, ryo, reputação, preço na loja |
| Carga | Opcional: consumida pelo próximo golpe recebido (anular, absorver ou chance de errar) |
| Duração | Em turnos do próprio portador, até o fim da batalha ou sustentada |

**Acúmulo:** reaplicar um efeito que já está ativo **renova a duração** e não soma intensidade. A exceção é o controle, com a regra própria abaixo.

### Tipos de duração

- **Por turnos:** conta os turnos do **próprio portador** e expira depois de N deles (Pergaminho de Reforço 5 turnos, Queimadura 3, Kawarimi 2).
- **Sustentado:** fica ativo enquanto o portador paga o custo por turno. É o caso do Sharingan, 2 de chakra por turno, que termina sozinho quando falta chakra. A interface mostra "∞" no lugar da contagem.
- **Passivo da run:** passivas de clã e o buff do título ativo não são efeitos com duração; entram como modificadores permanentes do combatente durante a run inteira (Seção 14).

### Transformação

A transformação é uma categoria genérica, decidida pelo usuário para o Sharingan (spec §4.1) e pensada para receber Modo Sábio e Bijuu sem código novo. Tem custo de ativação, custo por turno, a marca de gastar ou não o turno ao ativar, e os modificadores. Só uma transformação fica ativa por vez, ela pode ser ligada ou desligada 1 vez por turno e termina por falta de chakra, ao ser desligada ou no fim da batalha. Os valores do Sharingan estão na Seção 6.

### Cargas

Três efeitos do MVP são **cargas**, consumidas pelo próximo golpe recebido: Kawarimi anula o golpe por inteiro (C3), Henge dá 30% de chance de ele errar e Kage Bunshin põe um clone para absorvê-lo (o clone some; o bônus de +25% de dano em jutsus continua até a duração acabar). As cargas resolvem a ideia de "prioridade" do DD v2 sem quebrar o turno sequencial.

### Regras de balanceamento de efeitos

**Controle** (Imobilizado, Atordoado e Ilusão no MVP) é o efeito mais perigoso do jogo, porque, em 1x1, ficar sem agir é quase derrota. Por isso:

- **Duração máxima:** 2 <!-- fact: BALANCE.control.maxTurnsCommon=2 --> turnos em inimigos comuns e 1 <!-- fact: BALANCE.control.maxTurnsBoss=1 --> em chefes; o Kongou Fuusa, que pede 2 turnos, prende Zabuza e Haku só por 1.
- **Tenacidade:** quando um controle termina, o alvo fica imune a novos controles por 2 <!-- fact: BALANCE.control.tenacityTurns=2 --> turnos. Isso impede o "stun-lock" sem eliminar a estratégia.
- **Resistência de chefe:** a chance de controlar um chefe é multiplicada por 0,5 <!-- fact: BALANCE.control.bossChanceMult=0.5 -->.
- **Chance de aplicar controle** = `chance base × (1 + Genjutsu/100, só para Ilusão) × (1 + 0,08·m) × resistência de chefe`, com teto de 85% <!-- fact: BALANCE.control.chanceCap=0.85 -->: nunca é garantido (`controlChance` em `src/game/formulas.ts`, divisor de Genjutsu 100 <!-- fact: BALANCE.control.genjutsuDivisor=100 -->).
- **Um controle por vez:** aplicar outro controle enquanto há um ativo só renova a duração do atual, sem somar.
- **Imobilizado e Atordoado** fazem perder o turno. Sob **Ilusão**, o jogador que tem Kai equipado e chakra para ele só pode usar Kai, que remove a Ilusão e inicia a Tenacidade; enquanto ele não usa, a Ilusão não expira sozinha. Sem Kai ou sem chakra, ele perde o turno como nos outros controles (C13, flag `onlyKai` em `src/game/combat/battle.ts`). O DD v2 dizia que Kai "remove controle de si mesmo", o que era impossível: quem está controlado não age.
- **Efeitos que não são controle** (queimadura, lentidão) têm chance `chance base × (1 + 0,08·m)`, sem teto de 85% e sem resistência de chefe (`effectChance`). Efeitos no inimigo de um jutsu de dano só valem se o golpe acertou.
- **Dano contínuo (Queimadura):** 4% do HP máximo do alvo no início de cada turno dele, por 3 turnos, sem acumular intensidade (renova a duração). O DD v2 marcava o valor como ainda não simulado; o código manteve os 4% e o simulador do MVP já joga com eles.

### Efeitos do MVP

| Efeito | Tipo | Fonte | Duração |
|---|---|---|---|
| Reforço de um atributo (+10%) | Buff | Pergaminho de Reforço (Tai, Nin, Gen, Vel ou Def, escolhido ao usar) | 5 turnos |
| Sharingan | Transformação | Uchiha | Sustentado (2 de chakra por turno) |
| Névoa (+15% de esquiva) | Buff | Kirigakure no Jutsu (Zabuza) | 3 turnos |
| Espelhos de Gelo (+25% de esquiva) | Buff | Makyou Hyoushou (Haku) | 3 turnos |
| Muralha de Lama (+25% de redução de dano) | Buff | Doton: Doryuuheki | 3 turnos |
| Clones Ilusórios (+12% de esquiva) | Buff | Bunshin no Jutsu | 2 turnos |
| Clones das Sombras (+25% de dano em jutsus, absorve 1 golpe) | Buff com carga | Kage Bunshin no Jutsu | 3 turnos |
| Substituição (anula o próximo golpe) | Carga | Kawarimi no Jutsu | 2 turnos |
| Henge (30% de o próximo golpe errar) | Carga | Henge no Jutsu | 1 turno |
| Queimadura (4% do HP máximo por turno) | Dano contínuo | Bola de Fogo Básica, Katon: Goukakyuu | 3 turnos |
| Defesa Reduzida (−5% de Defesa) | Debuff | Sennen Goroshi | 2 turnos |
| Lentidão (−20% de Velocidade) | Debuff | Fuuton: Daitoppa | 2 turnos |
| Imobilizado | Controle | Kongou Fuusa | 1 a 2 turnos (1 em chefes) |
| Ilusão | Controle | Genjutsu: Sharingan | 1 turno |

### Exibição na interface

**Estado:** Parcial (MVP)

- Abaixo das barras de HP e chakra de **cada lado** fica a fileira de efeitos ativos, cada um com o nome e os turnos restantes, ou "∞" para sustentado; passar o mouse mostra a descrição curta (`fighterPanel` em `src/ui-dom/screens/BattleScreen.ts`).
- Ficam para depois: cores e bordas distintas por tipo de efeito (hoje todos os chips têm a mesma borda, e a informação vem do texto), o ícone próprio de controle com a Tenacidade visível e a área separada para passivas de clã e título, que hoje não aparecem na batalha.

### Pensado para crescer

**Estado:** Futuro (F2/F3)

O sistema é a base de mecânicas futuras: **Modo Sábio**, **invocações**, formas avançadas, tomoe 2 e 3 do Sharingan e técnicas sustentadas. Nenhuma delas está no MVP, mas todas cabem no formato de efeito acima, como dados novos (Seção 20).

**Fica de fora do MVP (spec §1):** efeitos dos clãs da F2 (Byakugan, sombras do Nara, drenagem do Aburame, redução de dano contínuo do Akimichi) e Sangramento.

---

## 11. Economia e Loja

**Estado:** Parcial (MVP)

Ryo, recompensas, loja, equipamento de 2 slots e Pergaminho Raro estão no código. O estoque por rank e os slots de equipamento futuros são visão.

### Moeda: ryo

O ryo é a moeda do jogo. **Reputação** promove o personagem (Seção 4); **ryo** compra itens na loja. Os dois pertencem à run e começam em 0.

### Recompensas por encontro

**Estado:** Implementado (MVP)

| Encontro | Ryo | Reputação | XP |
|---|---|---|---|
| Inimigo comum (grau D) | 30 <!-- fact: BALANCE.rewards.D.ryo=30 --> | 22 <!-- fact: BALANCE.rewards.D.rep=22 --> | `8 + 4·N` (base 8 <!-- fact: BALANCE.xp.commonBase=8 -->, 4 <!-- fact: BALANCE.xp.commonPerLevel=4 --> por nível) |
| Inimigo elite (grau D+) | 50 | 38 | ×1,6 <!-- fact: BALANCE.xp.eliteMult=1.6 --> o XP de um comum, arredondado |
| Chefe grau C (Zabuza) | 200 <!-- fact: BALANCE.rewards.C.ryo=200 --> | 160 <!-- fact: BALANCE.rewards.C.rep=160 --> | ×4 o XP de um comum |
| Chefe grau B (Haku) | 300 <!-- fact: BALANCE.rewards.B.ryo=300 --> | 240 <!-- fact: BALANCE.rewards.B.rep=240 --> | ×4 o XP de um comum |
| Chefe grau A [F2] | 500 <!-- fact: BALANCE.rewards.A.ryo=500 --> | 400 <!-- fact: BALANCE.rewards.A.rep=400 --> | ×6 o XP de um comum (estimativa) |

N é o nível de história do encontro (Seção 12). Os títulos com bônus de ryo ou reputação multiplicam a recompensa (`finishEncounter` em `src/game/run/runManager.ts`). Os encontros obrigatórios da Saga da Onda rendem **1220 ryo** (24 × 30 + 200 + 300); cada elite troca 30 por 50, e cada "Bolsa de ryo" escolhida na subida de nível soma 60 <!-- fact: BALANCE.shop.rewardRyo=60 --> (Seção 15).

### Itens e preços

**Estado:** Implementado (MVP)

| Item | Grau | Efeito | Preço |
|---|---|---|---|
| Kit médico | D | Restaura 40% do HP máximo | 80 |
| Pílula de chakra | D | Restaura 50% do chakra máximo | 70 |
| Pergaminho de Reforço | D | +10% em Tai, Nin, Gen, Vel ou Def por 5 turnos (o atributo é escolhido ao usar, `ASSUMIDO`) | 60 |
| Kunai | D | +2 Velocidade e +2 no atributo Chance de Crítico, arma (C4) | 250 |
| Colete ninja | D | +3 Defesa, armadura | 300 |
| Katana | C | +4 Taijutsu, arma | 600 |
| Colete reforçado | C | +5 Defesa e +3 HP, armadura | 700 |
| Pergaminho Raro | Raro | +1 permanente num atributo base à escolha | 900 |

Os itens estão em `src/data/items.ts`. O orçamento de cerca de 1220 ryo permite, por exemplo, colete, kunai e alguns consumíveis, **mas não** tudo: o jogador precisa escolher. O Pergaminho Raro só cabe se ele abrir mão de quase todo o resto. O simulador compra numa ordem fixa (colete ninja, kunai, kits, pílula, katana só nas builds de Taijutsu e colete reforçado, Apêndice A.5) e não compra Pergaminho Raro (`botShop` em `src/game/sim/bot.ts`).

### A loja

**Estado:** Implementado (MVP)

- Fica na **Preparação**, aberta entre encontros pelo mapa (inclusive no Acampamento) e pela tela de resultado (`src/ui-dom/screens/PrepScreen.ts`). Não há loja dentro da batalha.
- **Estoque:** os consumíveis estão sempre à venda; 2 <!-- fact: BALANCE.shop.equipmentOffers=2 --> dos 4 equipamentos são sorteados, e cada um sai do estoque quando comprado (não se compra o mesmo equipamento duas vezes); há 1 <!-- fact: BALANCE.shop.rareScrollsPerStock=1 --> Pergaminho Raro por estoque (`generateStock` em `src/game/run/shop.ts`).
- O estoque é sorteado no início da run e **renova depois de cada chefe**. O DD v2 também previa renovar a cada saga; no MVP há uma saga só.
- O título Colecionador (−5% nos preços) existe nos dados, oculto até a F2 (C14).

**Estoque por rank [F2]** — **Estado:** Futuro (F2/F3)

O rank ninja define a qualidade do estoque: Genin vê itens de grau D e C; Chunin passa a ver grau B; Jounin, grau A. Itens S só aparecem como recompensa rara. No MVP todo personagem é Genin, e o estoque é o de graus D e C acima.

### Categorias de itens

**1. Equipamentos** — **Estado:** Parcial (MVP). Bônus passivos leves, em dois slots, **Arma** e **Armadura**. A Kunai é a arma rápida (Velocidade e crítico); a Katana, a pesada (Taijutsu). A arma entra no Atacar pelos atributos que dá, e não por um modificador próprio. Os coletes dão Defesa e, no grau C, um pouco de HP. A troca é feita fora da batalha, na Preparação, e o HP e o chakra atuais acompanham a mudança do máximo (`equipItem`). Os slots Bandana, Luvas, Calça, Botas e Pergaminho são visão (Seção 13).

**2. Consumíveis** — **Estado:** Implementado (MVP). Kit médico, Pílula de chakra e Pergaminho de Reforço; usar um gasta a ação do turno. Também saem da escolha 1-de-3 ao subir de nível (Seção 15).

**3. Pergaminho Raro** — **Estado:** Implementado (MVP).

- Dá **+1** no atributo **base** escolhido. O DD v2 dizia "+1 ou +2" sem regra para decidir; o código fixou +1 (`ASSUMIDO`, `useRareScroll` em `src/game/run/shop.ts`).
- Por ser atributo base, **ajuda a desbloquear jutsus** (Seção 3): aplicar um pergaminho roda o desbloqueio.
- Limite de 5 <!-- fact: BALANCE.shop.rareScrollMaxPerRun=5 --> por run, para o ganho permanente nunca ficar exponencial.
- "Raro" não é um grau da escala D a S: nos dados o pergaminho usa `S` só para ordenação, e a interface mostra "Raro".
- O DD v2 previa que ele também caísse de chefes; no MVP só a loja o vende [F2].

### Princípio de balanceamento

Equipamentos e pergaminhos são complemento, não a fonte principal de poder: a soma dos bônus de itens deve ficar em até cerca de **15% do total de pontos de atributo** do personagem (no nível 9, cerca de 16 pontos). O equipamento mais caro do MVP dá 8 pontos (Colete reforçado). O buff do título ativo é pequeno e único (Seção 14).

### Ao morrer

Ryo, reputação, equipamento, itens e maestria da run se perdem junto com ela. O que persiste entre runs está na Seção 15.

**Fica de fora do MVP (spec §1):** loja por rank, itens de grau B ou acima, Pergaminho Raro como recompensa de chefe, loja ambulante (evento entre encontros) e os slots de equipamento além de Arma e Armadura.

---

## 12. Modo História

**Estado:** Parcial (MVP)

O Modo História é o modo principal do jogo e segue a cronologia do anime, saga por saga. O MVP tem uma saga, a da Onda, completa. **A história avança por encontros, não por nível**: cada saga é uma sequência fixa de encontros, e o nível de história de cada um define a força do inimigo (Seção 9). A regra antiga, "chefe a cada 5 níveis", saiu ainda no DD v2, porque conflitava com a posição de Haku na saga.

### Estrutura de saga

**Estado:** Implementado (MVP)

- Uma saga é um dado (`SagaDef` em `src/data/saga.ts`): o nome, o ponto da história em que começa e a lista ordenada de nós. Cada nó tem o tipo (comum ou chefe), o nível de história, o pool de inimigos comuns ou o chefe fixo, a marca de Acampamento antes dele e, quando houver, o ponto da história para onde vencê-lo leva.
- Os jutsus cuja saga mínima é um dado ponto ficam aprendíveis quando a run chega lá (Seção 8). Vencer Zabuza leva a "Onda depois de Zabuza" e libera o Suiryuudan.
- No design, a saga também escolhe o cenário e a paleta da arena. No MVP, a arena é única e de placeholders [F2].
- **Duração-alvo:** 26 encontros, cerca de 25 a 35 minutos por run.

### Saga da Onda [F1A]

**Estado:** Implementado (MVP)

| Encontros | Nível de história | Conteúdo | Chefe |
|---|---|---|---|
| 1 a 3 | 1 | Bandido ou Ninja Renegado (grau D) | — |
| 4 a 6 | 2 | idem | — |
| 7 a 9 | 3 | idem | — |
| 10 a 12 | 4 | idem | — |
| **13** | 5 | Acampamento antes da luta | **Zabuza Momochi (grau C)** |
| 14 a 16 | 6 | Mercenário da Névoa ou Ninja Renegado (grau D) | — |
| 17 a 19 | 7 | idem | — |
| 20 a 22 | 8 | idem | — |
| 23 a 25 | 9 | idem | — |
| **26** | 10 | Acampamento antes da luta | **Haku (grau B)** |

Regra de ritmo: **três encontros comuns equivalem a um nível** (`buildOndaNodes` em `src/data/saga.ts`). Vencer Haku conclui a saga e encerra a run com vitória.

**Elites (C8).** Em cada run, 3 <!-- fact: BALANCE.run.eliteForks=3 --> nós comuns são sorteados como **bifurcação "Comum ou Elite"**: o mapa oferece lutar contra o comum ou contra a variante D+ dele (o Bandido vira Bandido Veterano, e assim por diante), mais forte e mais recompensadora. A bifurcação nunca cai no nó imediatamente antes de um Acampamento (`ASSUMIDO` da spec §7, `buildRunNodes` em `src/game/run/runManager.ts`). A elite **substitui** o comum, e por isso não leva a reputação a 1000 (C8, Seção 4). A "missão de grau D" opcional entra na F2, junto com a promoção.

### Variação entre runs

**Estado:** Parcial (MVP)

Para a saga não ser sempre idêntica:

- **Comuns sorteados:** o inimigo de cada nó comum sai do pool do nó, e as bifurcações de elite mudam de lugar. Os chefes ficam sempre fixos. A semente da run decide tudo, e a mesma semente repete a mesma saga.
- **Escolha 1-de-3 ao subir de nível [F1B]:** implementada, com as opções kit médico, pílula de chakra, Pergaminho de Reforço, ryo e treino (Seção 15). O DD v2 punha "um jutsu elegível novo" entre as opções; a **C12** o tirou, porque jutsu só se aprende cumprindo as condições de status.
- **Eventos entre encontros [F1B]:** loja ambulante, treino, descanso. Ficam para depois.

### Sagas futuras

**Estado:** Futuro (F2/F3)

Referência de planejamento, na ordem canônica:

| Saga | Chefe ou marco de referência | Observação |
|---|---|---|
| Exame Chunin — Floresta da Morte e Preliminares | Orochimaru (aparição, não chefe obrigatório) | **Missão de Promoção a Chunin** (1000 de reputação); Chidori (treino de Kakashi) |
| Exame Chunin — Finais e Invasão de Konoha | **Gaara** (grau A) | Na obra, Gaara é chefe aqui, e não na Recuperação do Kazekage |
| Busca por Tsunade | Kabuto (menor) e Orochimaru | Rasengan e Kuchiyose no Jutsu |
| Recuperação do Sasuke | Chefes do Som (grau B ou A) | Fim da Parte I |
| Shippuden — Recuperação do Kazekage | Sasori e Deidara | Começa a Parte II; Gaara é o resgatado |
| Shippuden — Perseguição a Itachi | Itachi | Amaterasu e Tsukuyomi |

Os pontos da história dessas sagas já existem (`STORY_POINTS` em `src/game/types.ts`, nomes em `src/data/story.ts`), porque os jutsus futuros os usam como saga mínima na Enciclopédia. A regra de ouro se mantém: **nenhum inimigo ou jutsu aparece antes do ponto da história em que existe na obra**, com a exceção controlada da Herança de clã (Seção 8).

### Modo Infinito

**Estado:** Futuro (F2/F3)

Um modo sem fim e sem amarras de cronologia: inimigos e jutsus de qualquer saga misturados, com a dificuldade escalando indefinidamente. No MVP existe só como entrada de menu desabilitada, "Modo Infinito (em breve)" (Seção 13).

**Fica de fora do MVP (spec §1):** todas as sagas depois da Onda, a missão de grau D, os eventos entre encontros, cenário por saga e o Modo Infinito.

---

## 13. Interface e Experiência do Jogador

**Estado:** Parcial (MVP)

Menu, criação, mapa, batalha, resultado, Preparação, Ficha, Enciclopédia, Histórico, Títulos, fim da run e tela de erro estão no código (`src/ui-dom/screens/`). A tela de equipamento com silhueta, o Registro de Batalha e o Livro Bingo são visão.

**Divisão técnica.** As telas de texto e tabela são **HTML/CSS** sobre o canvas, e o **Phaser** desenha só a arena da batalha (Seção 18). O canvas fica numa camada por baixo, e o loop do Phaser dorme fora da batalha para economizar CPU (`src/scenes/createGame.ts`).

**Layout desktop.** A largura mínima da página é **1024 px** (`min-width` do `body` em `src/styles.css`); as telas DOM ficam centradas, com até 1280 px de largura. O Phaser trabalha numa resolução lógica de 1280 × 720 e se ajusta à janela com `Scale.FIT`, centrado nos dois eixos. Layout mobile, abaixo de 1024 px, fica fora do MVP. Toda cor da interface sai dos tokens de `src/styles.css`, e nenhuma informação é transmitida só por cor (spec §10): um botão apagado diz o motivo em texto.

### Menu principal

**Estado:** Implementado (MVP)

| Opção | Função |
|---|---|
| **Continuar run** | Volta à run salva; desabilitado quando não há run em andamento |
| **Modo História** | Leva à criação de personagem. Com uma run em andamento, pede confirmação: a run atual é encerrada e registrada no Histórico como abandonada |
| **Modo Infinito** | "Em breve", desabilitado (Seção 12) |
| **Enciclopédia de Jutsus** | O pool completo de jutsus, com categoria, grau, requisitos e o marcador de desbloqueado ou bloqueado; filtros por categoria e situação; jutsus já levados à maestria +5 recebem o selo "★ Maestria +5" (`src/ui-dom/screens/EncyclopediaScreen.ts`) |
| **Histórico de Runs** | Seção 16 |
| **Títulos** | A coleção de títulos (Seção 14) |
| **Livro Bingo** [F2] | Registro permanente de inimigos (Seção 14) |

A Enciclopédia é a única tela que mostra o pool completo, independentemente do clã da run; "desbloqueado" é permanente e conta qualquer jutsu aprendido em qualquer run.

### Tela de batalha

**Estado:** Implementado (MVP)

Jogador à esquerda e inimigo à direita, frente a frente (`src/ui-dom/screens/BattleScreen.ts` e `src/scenes/BattleScene.ts`):

- **Arena (Phaser):** placeholders de forma e nome, nunca arte oficial. O Phaser só anima os eventos que o motor emite: avanço de quem age, número de dano, "CRÍTICO!", "ESQUIVOU", tremor e cor do elemento no alvo, cura, nome do efeito aplicado e a aura da transformação.
- **Painel de cada lado (DOM):** nome, nível, o badge de grau e o de chefe no inimigo (C11), **Poder Ninja**, barras de **HP** e **chakra**, os indicadores de **chance de crítico**, **redução de dano** e **esquiva** (valores efetivos, já com equipamento, título e efeitos) e a fileira de efeitos ativos com os turnos restantes e a descrição ao passar o mouse (Seção 10).
- **Centro:** indicador de turno ("Seu turno", "Turno do inimigo", "Resolvendo..." durante as animações e o aviso de Ilusão) e o **log de batalha**, uma lista rolável com cores distintas para jogador, inimigo, dano, cura, efeitos e sistema.
- **Barra de ações (C10):** Atacar, Defender, Meditar, Item, Transformar (só para quem tem transformação) e os **4 jutsus equipados**, cada um com o número do atalho, o custo de chakra e o nível de maestria. Jutsu sem chakra ou bloqueado pela Ilusão aparece apagado **com o motivo escrito**. Clicar num jutsu mostra a descrição com o botão Usar; clicar de novo confirma. Item abre a lista de consumíveis; o Pergaminho de Reforço pede o atributo.
- **Ficha:** o painel do jogador tem o botão da Ficha, em modo somente leitura e sem gastar turno; ele fica desabilitado durante as animações. O DD v2 previa o botão nos dois lados; a ficha do inimigo entra com o Livro Bingo [F2].
- **Entrada travada** enquanto as animações rodam, com um atraso curto no turno do inimigo, para que o jogador acompanhe o que aconteceu.
- **Sem cronômetro de turno:** limite de tempo só faz sentido no PvP futuro (Seção 17).

**Atalhos de teclado** (`battleKeys` em `src/ui-dom/screens/BattleScreen.ts`), que usam a mesma regra de bloqueio dos botões: um atalho de botão apagado é ignorado.

| Tecla | Ação |
|---|---|
| `1`–`4` | Seleciona o jutsu do slot; a mesma tecla de novo confirma |
| `Enter` | Confirma o jutsu selecionado |
| `A` | Atacar |
| `D` | Defender |
| `M` | Meditar |
| `I` | Abre ou fecha a lista de itens |
| `T` | Liga ou desliga a transformação |
| `Esc` | Fecha a descrição do jutsu ou a lista de itens; **nunca** sai da batalha |

Uma tecla segurada não repete a ação. Com um diálogo aberto, `Esc` fecha o diálogo, em qualquer tela.

### Mapa, resultado e Preparação

**Estado:** Implementado (MVP)

- **Mapa da saga** (`src/ui-dom/screens/MapScreen.ts`): os 26 nós em grade, com os vencidos, o atual e os chefes marcados por texto e borda, e o Acampamento (⛺) antes de cada chefe, com o botão Descansar. O próximo encontro mostra o inimigo e o grau e, nas bifurcações, o botão "Enfrentar elite" com a explicação da elite. Dali o jogador abre a Preparação, a Ficha ou salva e volta ao menu.
- **Resultado da batalha** (`src/ui-dom/screens/ResultScreen.ts`): XP, ryo e reputação ganhos, subida de nível, jutsus aprendidos, distribuição de pontos (com o botão "Distribuir pelo preset", C9), as metas "faltam X para *jutsu*" e as escolhas 1-de-3 pendentes, que precisam ser resolvidas antes de seguir.
- **Preparação** (`src/ui-dom/screens/PrepScreen.ts`): abas **Loja**, **Jutsus**, **Equipamento** e **Atributos**. A loja lista o estoque por categoria, com preço, descrição e efeito. A aba Jutsus mostra os slots do rank (4 no Genin) e o repertório, com maestria e barra de progresso; é nela que se trocam os jutsus equipados. Quando o jogador aprende um jutsu com os 4 slots ocupados, um diálogo pergunta qual sai ou se o novo fica só no repertório (`src/ui-dom/components/swap.ts`).
- **Criação de personagem** (`src/ui-dom/screens/CreateScreen.ts`): nome, clã, afinidade, título inicial, presets e a prévia ao vivo dos valores derivados e dos jutsus liberados (Seção 5). O preview visual do personagem fica para quando houver arte.
- **Fim da run** (`src/ui-dom/screens/RunEndScreen.ts`): vitória, morte ou abandono, com o texto do Histórico, as estatísticas da run e os títulos conquistados.
- **Erro** (`src/ui-dom/screens/ErrorScreen.ts`): qualquer exceção no render, no motor ou na animação leva a uma tela com o botão Recarregar, e o jogador nunca fica preso (`docs/ANALISE.md` §5).

### Tela de equipamento com silhueta [F1B]

**Estado:** Futuro (F2/F3)

No MVP, o equipamento é uma lista simples na Preparação e na Ficha. O design continua sendo o de um inventário **só de equipamentos**, com a **silhueta do ninja** no centro e os slots ao redor, ligados por linhas a etiquetas com o item equipado. Os slots planejados são Bandana, Luvas, Calça, Botas e Pergaminho, além de Arma e Armadura; slots que ainda não existem não aparecem, e os vazios ficam escurecidos com o contorno do tipo de item. Ao selecionar um slot, a tela mostra o item (nome, grau, bônus e descrição) e os equipamentos do mesmo tipo que o jogador tem, com a comparação de bônus antes de trocar (verde para melhora, vermelho para piora, sempre com o número escrito ao lado).

**Fica de fora do MVP (spec §1):** layout mobile abaixo de 1024 px, sprites e áudio, tela de equipamento com silhueta, Registro de Batalha, Livro Bingo e cronômetro de turno.

---

## 14. Ficha do Ninja (Sumário)

**Estado:** Parcial (MVP)

A Ficha é a tela de consulta inspirada no Sumário do Pokémon: reúne tudo sobre o personagem em **abas**, com leitura rápida (`src/ui-dom/screens/SheetScreen.ts`). Ela é **sempre somente leitura**: abre do mapa, da tela de resultado e da batalha, sem gastar turno; distribuir pontos e trocar jutsus ou equipamento são ações da tela de resultado e da Preparação. O MVP tem as abas Perfil, Atributos, Jutsus e Equipamento; Registro de Batalha e Títulos, como abas da Ficha, ficam para depois.

### Aba 1 — Perfil

**Estado:** Implementado (MVP)

Nome, clã, afinidade, nível com a barra de XP até o próximo, **Poder Ninja** (Seção 3), **estilo de luta**, reputação, título ativo com o buff, ryo, encontro atual ("n de 26") e ponto da história. O estilo de luta é um rótulo só informativo, calculado sobre os pontos investidos acima do valor inicial: se um atributo concentra pelo menos 30% deles, sem empate, o rótulo é o dele (Especialista em Ninjutsu, Lutador de Taijutsu, Ilusionista para Genjutsu, Estrategista para Inteligência, Muralha para HP ou Defesa, Ágil para Velocidade ou crítico); senão, Equilibrado (`fightingStyle` em `src/ui-dom/view/derived.ts`). O rank e a barra de reputação até o próximo rank entram com a promoção [F2]; o retrato, com a arte; o tempo de run não é medido.

### Aba 2 — Atributos

**Estado:** Implementado (MVP)

- Os 8 atributos com **valor base e valor efetivo** lado a lado (Seção 3). Na Ficha, o efetivo é base mais equipamento; os efeitos de batalha aparecem nos indicadores do painel de batalha.
- **Gráfico octogonal** (radar SVG de 8 pontas) com o formato da build: o contorno tracejado é o base, a área preenchida é o efetivo (`radarSvg` em `src/ui-dom/components/radar.ts`).
- HP e chakra atual e máximo, e os valores derivados em porcentagem: chance de crítico, esquiva com Velocidades iguais e redução de dano.
- As metas "faltam X pontos para Y" dos jutsus relevantes para a run (Seção 8).
- O detalhamento de onde vem cada bônus (clã, Pergaminhos Raros, equipamento, efeitos) fica para depois [F1B].

### Aba 3 — Jutsus

**Estado:** Implementado (MVP)

Os jutsus aprendidos, com a marca dos equipados. Cada um mostra grau, elemento, custo de chakra já com todos os descontos, maestria com a barra de progresso até o próximo nível, **onde foi aprendido** ("aprendido no nível X, encontro Y"), quantas vezes foi usado na run e a descrição. O dano total por jutsu não é registrado.

### Aba 4 — Equipamento

**Estado:** Implementado (MVP)

Arma e Armadura equipadas com os bônus, os consumíveis do inventário e os Pergaminhos Raros aplicados (por exemplo, "2/5"). A silhueta é a da tela de equipamento futura (Seção 13).

### Aba 5 — Registro de Batalha

**Estado:** Futuro (F2/F3)

Estatísticas da run com um alternador "Esta run / Total": inimigos derrotados por grau, elites e chefes, a lista de inimigos derrotados agrupada por tipo, dano causado e sofrido, maior golpe, críticos, jutsu mais usado, turnos, chakra gasto, ryo ganho e gasto, itens usados e vitórias sem sofrer dano. O motor **já coleta** todos esses números (`RunStats` em `src/game/meta/stats.ts`); no MVP eles aparecem de forma simples na tela de fim da run e no Histórico (Seção 16), e os totais vitalícios no topo do Histórico.

### Aba 6 — Títulos

**Estado:** Implementado (MVP)

Os títulos são conquistas permanentes que dão um **pequeno buff** durante a run. No MVP eles têm uma tela própria no menu (`src/ui-dom/screens/TitlesScreen.ts`), e não uma aba da Ficha; o título ativo aparece no Perfil.

**Como funciona**

- Cada título tem uma condição de conquista, descrita como **dado** (`src/data/titles.ts`). Cumprida, ele fica desbloqueado para sempre. A conferência acontece uma vez, no fim de cada run (Seção 15).
- Na criação de personagem, o jogador escolhe **um** título já desbloqueado para usar na run, ou nenhum; pode trocar a cada run.
- O buff vale a run inteira como modificador passivo do personagem (Seção 10).
- Na tela de Títulos, os ainda não conquistados aparecem como "???" com a dica da condição, reforçando a sensação de coleção.

**Regras de balanceamento**

- Buffs pequenos (de 2% a 6%) e um único título ativo, sem acúmulo.
- O buff de título **nunca altera atributo base**: só modificadores de combate e de economia (dano por elemento, custo de chakra, esquiva, crítico, redução, ryo, reputação, preço). Assim ele não abre jutsus (Seção 3).

**Títulos de domínio elemental**

A linha de cada elemento tem três títulos. Cada jutsu **diferente** daquele elemento levado à maestria +5, em qualquer run, conta para a linha. No código, cada nível é um título próprio, desbloqueado pela contagem, e o jogador pode escolher qualquer um dos que já tem; o DD v2 descrevia um título único que sobe de nível.

| Nível | Título (Fogo) | Condição | Buff |
|---|---|---|---|
| 1 | Iniciante do Fogo | Maestria +5 em 1 jutsu de Fogo | +2% de dano em jutsus de Fogo |
| 2 | Adepto do Fogo | Maestria +5 em 2 jutsus de Fogo diferentes | +4% de dano em jutsus de Fogo |
| 3 | Mestre do Fogo | Maestria +5 em 3 jutsus de Fogo diferentes | +6% de dano em jutsus de Fogo |

A mesma estrutura vale para Água, Vento e Terra. A linha do Raio existe nos dados, oculta até a F2. As linhas por categoria (Taijutsu, Genjutsu, Fuinjutsu) são ideia em aberto (Apêndice D).

**Títulos de feito**

| Título | Condição | Buff | No MVP |
|---|---|---|---|
| Demônio da Névoa | Derrotar Zabuza Momochi | +3% de esquiva | Visível |
| Caçador de Bandidos | Derrotar 30 inimigos de grau D, somando todas as runs (`ASSUMIDO`: numa run só há 24 comuns) | +5% de ryo recebido | Visível |
| Sem um Arranhão | Vencer um chefe sem sofrer dano | +2% de redução de dano | Visível |
| Por um Fio | Vencer um chefe com menos de 10% do HP (limite guardado na condição do título) | +3% de crítico | Visível |
| Mestre de Jutsus | Ter 10 jutsus aprendidos na mesma run | −3% de custo de chakra | Visível |
| Colecionador | Aplicar 5 Pergaminhos Raros na mesma run | −5% de preço na loja | Oculto até a F2 (C14) |
| Novo Chunin | Ser promovido a Chunin | +5% de reputação recebida | Oculto até a F2 (C14) |

No MVP são 17 títulos visíveis: os 5 de feito e as linhas de Fogo, Vento, Terra e Água.

**Títulos exclusivos [Futuro]:** o formato de dado (id, nome, condição, buff e a marca de oculto) permite títulos de evento, criados pelo desenvolvedor, sem código novo.

### Livro Bingo

**Estado:** Futuro (F2/F3)

O registro **permanente** de inimigos, de todas as runs, inspirado no Livro Bingo da série, no menu principal como a Enciclopédia. Uma página por inimigo já encontrado: nome, grau, saga, elemento, jutsus que usa, quantas vezes foi derrotado e quantas vezes derrotou o jogador, e a recompensa em ryo. Inimigos ainda não encontrados aparecem como silhueta "???". Só o **nome** faz referência à série; a arte é sempre original. A meta já guarda quantas vezes cada chefe foi derrotado (`lifetime.bossesDefeated` em `src/game/meta/meta.ts`).

### Ideias adicionais

**Estado:** Futuro (F2/F3)

- **Linha do tempo da run:** marcos em ordem (primeira vitória, subidas de nível, promoção, chefes, Pergaminhos Raros).
- **Informação do inimigo revelada aos poucos:** o Livro Bingo preenche mais detalhes a cada derrota do inimigo; Byakugan, Sharingan ou Inteligência alta poderiam revelar mais durante a batalha.
- **Aba de rival**, quando o sistema de rival existir (F2).
- **Cartão do Ninja exportável:** a Ficha como imagem para compartilhar.

### Como funciona por baixo

**Estado:** Implementado (MVP)

Nada disso exige que o motor conheça a interface. O motor emite **eventos** (dano causado, jutsu usado, inimigo derrotado, chefe vencido) e um rastreador de estatísticas os contabiliza (`trackBattleEvents` e `trackEncounterEnd` em `src/game/meta/stats.ts`). A Ficha, os títulos, o fim da run e o Histórico só leem esses números.

**Fica de fora do MVP (spec §1):** as abas Registro de Batalha e Títulos dentro da Ficha, a tela de equipamento com silhueta, o Livro Bingo, a aba de rival e o Cartão do Ninja.

---

## 15. Progressão do Personagem e Meta-Progressão

**Estado:** Parcial (MVP)

### Dentro da run

**Estado:** Implementado (MVP)

- O nível sobe por experiência de batalha: do nível L para o L+1 são `24 + 12·L` de XP (base 24 <!-- fact: BALANCE.xp.toNextBase=24 -->, 12 <!-- fact: BALANCE.xp.toNextPerLevel=12 --> por nível), com o XP de cada encontro da Seção 11. Cada nível dá **5 pontos livres** e **+1 automático em cada um dos dois atributos de destaque** do clã, ou 6 pontos livres no Sem clã (Seção 3), e cura 25% do HP máximo (Seção 9). Pontos não distribuídos ficam guardados para depois.
- **Escolha 1-de-3 a cada nível ganho [F1B]:** o jogo sorteia 3 de 5 opções (`rollRewardChoices` em `src/game/run/runManager.ts`): Kit médico, Pílula de chakra, Pergaminho de Reforço, Bolsa de ryo (+60 ryo) ou Treino (+4 <!-- fact: BALANCE.shop.trainingUses=4 --> usos de maestria num jutsu equipado; só aparece com algum jutsu equipado). Nunca um jutsu (C12). Com vários níveis de uma vez, as escolhas se resolvem em ordem; as que estiverem pendentes quando a run termina são descartadas.
- Os jutsus são aprendidos automaticamente ao cumprir atributo base, clã, saga e pré-requisito (Seção 8).
- A reputação sobe a cada vitória; a missão de promoção que ela libera entra na F2 (Seção 4).
- O ryo é ganho nos encontros e na escolha 1-de-3 e gasto na loja (Seção 11).
- A run é salva automaticamente no fim de cada encontro, no Acampamento e a cada compra ou troca na Preparação (spec §11, Seção 18).

### Entre runs (meta-progressão)

**Estado:** Parcial (MVP)

A meta é atualizada **uma vez, no fim da run** (morte, vitória ou abandono), por `recordRunEnd` em `src/game/meta/meta.ts`. Chamá-la de novo com a mesma run não duplica nada, e uma run encerrada que ficou salva é finalizada no próximo boot (`docs/ANALISE.md` §5).

- **Coleção de jutsus (Enciclopédia)** [F1A] — implementada: todo jutsu aprendido em qualquer run fica "Desbloqueado" para sempre.
- **Maestria máxima por jutsu** — implementada: os jutsus que chegaram ao +5 em alguma run ficam registrados (selo na Enciclopédia e títulos de domínio elemental). A maestria em si recomeça a cada run (Seção 8).
- **Títulos** [F1B] — implementados: permanentes, um ativo por run (Seção 14). A **C14** escondeu os dois que o MVP não permite cumprir: Colecionador exige 5 Pergaminhos Raros, 4500 ryo contra os cerca de 1220 que a saga rende, e Novo Chunin exige uma promoção que só existe na F2. Os dois estão nos dados, com condição e buff, marcados como ocultos.
- **Estatísticas vitalícias** — implementadas: runs jogadas, vitórias, inimigos derrotados por grau e chefes derrotados, mostradas no topo do Histórico.
- **Histórico de runs** [F1B] — implementado (Seção 16).
- **Desbloqueio de clãs** [F2]: novos clãs jogáveis liberados por conquistas em runs anteriores.
- **Pontos de Legado** [F2]: moeda persistente ganha no fim de cada run, proporcional ao progresso, gasta em melhorias passivas permanentes. Antes se chamava "Pontos de maestria"; o nome mudou para não colidir com a maestria de jutsu.
- **Cosméticos** [F2]: aparências e efeitos visuais de jutsu.
- **Livro Bingo** [F2] (Seção 14).

Ryo, reputação, rank ninja, equipamento, itens e maestria dos jutsus são **da run** e se perdem no fim dela.

**Fica de fora do MVP (spec §1):** Pontos de Legado, desbloqueio de clãs, cosméticos, Livro Bingo e os títulos Colecionador e Novo Chunin como conquistáveis.

---

## 16. Histórico de Runs

**Estado:** Implementado (MVP)

Uma tela do menu lista as runs anteriores, da mais recente para a mais antiga (`src/ui-dom/screens/HistoryScreen.ts`). No topo ficam os totais vitalícios (runs, vitórias, inimigos derrotados por grau e chefes derrotados). Cada entrada mostra:

- Nome do personagem, resultado (morte, vitória ou abandono) e data.
- Clã, afinidade, nível, reputação e quantidade de encontros vencidos.
- O **texto do fim da run**, gerado por `runEndText` em `src/game/meta/meta.ts`: "Morreu na Saga da Onda, nível 4, para Mercenário da Névoa", "Concluiu a Saga da Onda no nível N" ou "Abandonou a run no encontro 8 de 26".
- Um botão **Detalhes** que abre o retrato da run naquele momento: atributos base finais, jutsus aprendidos com a maestria de cada um, equipamento e as estatísticas principais (dano causado, maior golpe, críticos e turnos). A entrada guarda todas as estatísticas da run, para o Registro de Batalha futuro.

O Histórico é persistido junto com a meta-progressão (Seção 15) e guarda as 50 <!-- fact: BALANCE.history.maxEntries=50 --> runs mais recentes; as mais antigas saem da lista, e os totais vitalícios continuam somando todas. A leitura tolera entradas com campos ausentes ou inválidos, que aparecem como desconhecidos em vez de quebrar a tela. O Histórico é ao mesmo tempo registro pessoal e gancho de rejogabilidade ("dessa vez eu passo do Zabuza").

**Diferenças em relação ao DD v2.** O rank ninja não aparece na entrada, porque todo personagem é Genin no MVP; a saga aparece no texto do fim da run, e não num campo próprio. O DD v2 pedia um snapshot da Ficha inteira; o MVP mostra o resumo acima, e a Ficha completa de uma run passada fica para depois.

**Fica de fora do MVP (spec §1):** rank ninja na entrada (F2) e a Ficha completa de runs passadas.

---

## 17. Modo Online (Futuro)

**Estado:** Futuro (F2/F3)

O modo online continua fora do jogo: o MVP é single player e 100% local no navegador (decisão do usuário, spec §1). No roadmap ele é a **F4** (Seção 21); a linha de estado o agrupa com as outras visões de fase futura. O que o MVP já entrega é o requisito de arquitetura que o DD v2 pedia desde o início: a regra do jogo separada da apresentação e todo sorteio reproduzível por semente.

### O que o online deve ter (visão do DD v2)

- PvP 1x1 ou em equipe, reaproveitando a mesma lógica de combate do single player.
- **Servidor autoritativo:** o servidor valida as ações, não o cliente.
- Matchmaking simples no começo, evoluindo para ranking.
- **Cronômetro por turno** só no PvP: quem não age no tempo perde o turno (ou a partida, por inatividade). Não existe no single player.
- Persistência de personagem e de meta-progressão em nuvem.

### O que o MVP já deixou pronto

- **Motor puro.** `src/game/` não importa Phaser nem DOM e não usa `Math.random` nem `Date.now`. A ação de batalha passa por `applyAction(state, action, rng)` em `src/game/combat/battle.ts`, que devolve o novo estado e a lista de eventos; um servidor pode rodar a mesma função para validar uma jogada.
- **RNG com semente.** O sorteio é o `Rng` de `src/game/Rng.ts` (algoritmo mulberry32), com estado serializável; a semente da run fica salva. Mesma semente e mesmas ações dão a mesma luta, o que viabiliza replay e validação no servidor.
- **Batalha como lista de combatentes** (Seção 9), e não como "jogador contra inimigo", o que já comporta lados com mais de um combatente.
- **Ação inválida lança erro tipado** (`RuleError` em `src/game/errors.ts`, com um `code` estável como `onlyKai`), em vez de ser corrigida em silêncio: o mesmo contrato serve para recusar uma jogada vinda da rede.

**Fica de fora do MVP (spec §1):** online, PvP, servidor, matchmaking, ranking e cronômetro de turno (decisão do usuário: jogo 100% local).

---

## 18. Arquitetura Técnica

**Estado:** Implementado (MVP)

### Engine: Phaser 3 na batalha, HTML/CSS no resto

O DD v2 propôs Phaser 3 para a cena de batalha e HTML/CSS sobre o canvas para as telas cheias de texto, e o MVP seguiu a proposta. Só a arena da batalha é desenhada em Phaser (`src/scenes/BattleScene.ts`, iniciada por `src/scenes/createGame.ts`); menu, criação, mapa, Preparação, Ficha, Enciclopédia, Títulos, Histórico e até os painéis e a barra de ações da batalha são DOM, uma tela por arquivo em `src/ui-dom/screens/`. O `phaser` fica fixo na linha 3.88 (`~3.88.2` em `package.json`).

### Linguagem e ferramentas

TypeScript em modo strict, Vite como bundler e npm como gerenciador de pacotes (o package se chama `ninja-x-rogue`). Vitest roda os testes, Zod valida os dados e o tsx executa o simulador e o verificador de documentos no Node. O `npm run build` checa os tipos e gera um `dist/` estático; o layout é só desktop (1024 px ou mais).

### Camadas

| Camada | Onde | Papel |
|---|---|---|
| Dados | `src/data/` | Clãs, jutsus, efeitos, itens, inimigos, saga, pontos da história e títulos. Adicionar conteúdo é adicionar dados |
| Constantes | `src/game/Balance.ts` | Todo número de balanceamento, num lugar só (`BALANCE`) |
| Motor | `src/game/` | Regras puras: atributos e fórmulas, combate, efeitos, progressão, run, meta, save e simulador |
| Estado da aplicação | `src/store/GameStore.ts` | A única fonte da verdade da interface: recebe as ações, chama o motor, guarda o estado, grava o save e publica os eventos |
| Apresentação | `src/ui-dom/` e `src/scenes/` | Telas DOM e a arena Phaser; só leem o estado e animam os eventos |
| Textos | `src/i18n/pt-BR.ts` | Toda frase de interface por chave (`t('battle.grade')`), mesmo com um idioma só |

**Fluxo de dados.** A interface chama o `GameStore`; ele chama o motor (`battleAction` em `src/game/run/runManager.ts`, que usa `applyAction`), recebe `{ state, events }`, guarda o estado, grava o save quando é ponto de save e entrega os eventos à arena. A arena enfileira as animações (`AnimationQueue` em `src/scenes/animationQueue.ts`) e a entrada fica travada até a fila terminar; a fila libera a entrada mesmo se uma animação falhar. Qualquer exceção no render, no motor ou no animador leva à tela de erro com o botão Recarregar (`src/ui-dom/screens/ErrorScreen.ts`, `docs/ANALISE.md` §5).

**Eventos.** Tudo o que acontece numa luta vira um evento (`GameEvent` em `src/game/events.ts`: dano, esquiva, efeito aplicado, transformação, inimigo derrotado, subida de nível, jutsu aprendido). Os mesmos eventos alimentam a animação, o log de batalha (`src/ui-dom/view/log.ts`) e o rastreador de estatísticas (`src/game/meta/stats.ts`), que por sua vez alimenta títulos e Histórico. O motor não conhece nenhum deles.

### Persistência e salvamento

- **Duas chaves no `localStorage`:** `nxr.run.v1` (a run em andamento) e `nxr.meta.v1` (Enciclopédia, títulos, estatísticas vitalícias e Histórico), em `src/game/save/save.ts`.
- **Versão e migração.** Todo save tem `version` e passa pelas migrações em ordem (`RUN_MIGRATIONS` e `META_MIGRATIONS`) antes de ser validado com Zod.
- **Momentos de save:** fim de cada encontro, Acampamento e cada compra ou troca na Preparação. Dentro da batalha não há save: recarregar volta ao início do encontro, com a mesma semente (`ASSUMIDO` da spec, contra save-scum).
- **Permadeath.** Morte, vitória ou abandono apagam a run e gravam a meta uma vez só (`recordRunEnd` é idempotente). Se a gravação da meta falhar, a run encerrada fica salva para o próximo boot finalizá-la (`docs/ANALISE.md` §5).
- **Quarentena.** `loadRun` e `loadMeta` nunca lançam: um save inválido é copiado para `nxr.run.corrupt.<timestamp>` ou `nxr.meta.corrupt.<timestamp>`, o jogador é avisado e o jogo segue com estado limpo.

### Aleatoriedade com semente

Todo sorteio (variação de dano, crítico, esquiva, ordem de turno, inimigos e elites da run, estoque da loja, escolha 1-de-3) usa o `Rng` com semente guardada na run. Isso dá testes determinísticos, reprodução de bugs e, no futuro, replays e validação em servidor (Seção 17).

### Simulador de balanceamento headless

O motor roda sem interface, e o simulador (`src/game/sim/`, executado por `tools/simulate.ts`) joga runs completas da Saga da Onda com um robô em 8 builds. `npm run sim` joga 3000 runs por build e imprime a tabela do Apêndice A.5; `npm run sim:check` joga 1000 e falha se uma build sair da **sua faixa** (Apêndice A.6). Toda mudança de constante ou de conteúdo deve passar por ele.

### Validação de dados, i18n e verificação de documentos

- Os dados de `src/data/` são validados com Zod no boot (`assertGameData` em `src/data/validate.ts`, chamado pelo `GameStore`); um erro de digitação num requisito ou num id de efeito leva à tela de erro com a mensagem, em vez de um jogo quebrado.
- Os textos da interface vivem em chaves de tradução (`src/i18n/pt-BR.ts`).
- Os documentos do projeto são conferidos contra o código por `npm run docs:check` (`tools/docs-check.ts`): caminhos citados têm de existir, e cada número de balanceamento marcado tem de bater com o `BALANCE`.

### Estratégia de assets

Placeholders: formas coloridas com o nome escrito em cima. Sprites originais ou de fontes livres ficam para depois. **Regra de ouro:** nunca usar arte oficial de Naruto; nomes e descrições seguem a lore, a representação visual é sempre original. Projeto de fã, sem monetização.

### Testes

O Vitest cobre o motor (`tests/`: fórmulas, dano, efeitos, batalha, IA, desbloqueio, progressão, run, loja, meta, estatísticas, save, dados, RNG e simulador) e a interface sobre happy-dom (`tests/ui/`: telas, store, atalhos de teclado, fila de animação, robustez e uma run de ponta a ponta). O simulador é o teste de regressão do balanceamento, e `tests/sim-bands.test.ts` garante que nenhuma faixa de build é mais estreita que a meta de design.

**Fica de fora do MVP (spec §1):** sprites, áudio, layout abaixo de 1024 px, empacotamento para desktop ou mobile e persistência em nuvem.

---

## 19. Estrutura Sugerida do Projeto

**Estado:** Implementado (MVP)

O DD v2 sugeria uma cena Phaser por tela e um arquivo por "sistema" (`CombatSystem.ts`, `EconomySystem.ts`...). A estrutura real é outra: Phaser só na batalha, telas em DOM, e o motor dividido por assunto em pastas. Esta é a árvore dos arquivos versionados em `src/`, `tests/`, `tools/` e `docs/` (`git ls-files`):

```
src/
  main.ts                 entrada: cria o GameStore, a App DOM e o jogo Phaser
  styles.css
  game/                   motor puro (sem Phaser, DOM, Math.random, Date.now)
    Balance.ts            todas as constantes (BALANCE)
    Rng.ts                RNG com semente (mulberry32)
    types.ts              tipos compartilhados (atributos, graus, pontos da história)
    formulas.ts           HP, chakra, regeneração, redução, esquiva, crítico, XP, chances
    attributes.ts         atributo que escala cada categoria de jutsu
    events.ts             GameEvent
    errors.ts             RuleError (erro de regra com código estável)
    combat/               battle.ts, damage.ts, cost.ts, ai.ts, enemyFactory.ts, types.ts
    effects/              EffectSystem.ts (efeitos, transformação, cargas)
    progression/          character.ts, unlock.ts, mastery.ts, loadout.ts, presets.ts
    run/                  runManager.ts, battleSetup.ts, shop.ts, types.ts
    meta/                 meta.ts (meta, títulos, Histórico, Enciclopédia), stats.ts
    save/                 save.ts (versões, migrações, quarentena)
    sim/                  bot.ts, builds.ts, report.ts
  data/                   clans.ts, jutsus.ts, effects.ts, items.ts, enemies.ts,
                          saga.ts, story.ts, titles.ts, validate.ts (Zod)
  store/GameStore.ts      fonte da verdade da interface
  scenes/                 BootScene.ts, BattleScene.ts, createGame.ts, animationQueue.ts
  ui-dom/                 App.ts, dom.ts, types.ts
    screens/              Menu, Create, Map, Prep, Battle, Result, RunEnd, Sheet,
                          Encyclopedia, Titles, History, Error (+ index.ts)
    components/           allocation.ts, radar.ts, runHeader.ts, swap.ts, tabBar.ts
    view/                 derived.ts, format.ts, log.ts (lógica de tela testável)
  i18n/pt-BR.ts
tests/                    testes do motor (*.test.ts) e helpers.ts
  ui/                     testes da interface (happy-dom), memoryStore.ts, appHelpers.ts
tools/
  simulate.ts             npm run sim / sim:check
  docs-lib.ts, docs-specs.ts, docs-check.ts   npm run docs:check
docs/
  DESIGN.md               este documento (DD v3)
  ANALISE.md              análise do DD v2, correções C1–C15, suposições e decisões
  balance-log.md          registro da calibração e das faixas por build
  curso/                  curso de construção do jogo (Alfa 0.1 a 1.0)
  referencia/             DD v2
  superpowers/            spec do MVP e os três planos de implementação
```

Na raiz ficam `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, `README.md` e `.gitignore`. Não há pasta de assets: o MVP não tem arte.

**Por que essa estrutura e não a do DD v2.** Uma pasta por assunto do motor (`combat/`, `run/`, `meta/`...) mantém juntos os arquivos que mudam juntos, e a regra "o motor não importa nada de fora de `src/game/` e `src/data/`" fica fácil de conferir. As telas do DD v2 que eram cenas Phaser (`MainMenuScene`, `ShopScene`, `NinjaSheetScene`) viraram telas DOM; a loja não tem tela própria e vive na Preparação (`src/ui-dom/screens/PrepScreen.ts`). Os "sistemas" do DD v2 se espalharam assim:

| DD v2 | No código |
|---|---|
| `CombatSystem`, `EffectSystem` | `src/game/combat/battle.ts`, `src/game/effects/EffectSystem.ts` |
| `Character`, `AttributeSystem` | `src/game/progression/character.ts`, `src/game/formulas.ts`, `src/game/attributes.ts` |
| `JutsuUnlockSystem`, `JutsuLoadout`, `JutsuMastery` | `src/game/progression/unlock.ts`, `src/game/progression/loadout.ts`, `src/game/progression/mastery.ts` |
| `EconomySystem`, `EquipmentSystem` | `src/game/run/shop.ts` e `finishEncounter` em `src/game/run/runManager.ts` |
| `SagaManager`, `RunManager` | `src/data/saga.ts`, `src/game/run/runManager.ts` |
| `RunHistoryLog`, `RunStatsTracker`, `TitleSystem` | `src/game/meta/meta.ts`, `src/game/meta/stats.ts` |
| `NinjaRankSystem`, `BestiarySystem` | não existem (promoção e Livro Bingo são F2) |

**Fica de fora do MVP (spec §1):** pastas de assets e sprites, cenas de Livro Bingo e de equipamento com silhueta.

---

## 20. Visão de Longo Prazo

**Estado:** Futuro (F2/F3)

A ambição é crescer aos poucos até cobrir a lore de Naruto, e possivelmente Boruto, acrescentando jutsus, mecânicas e sagas de forma gradual. Nada disso faz parte das fases F0 a F4; esta seção existe para que as decisões de hoje (modelo de dados, motor de combate) não bloqueiem o que vem depois.

### Princípio: estabilidade antes de expansão

Cada camada nova só entra quando a anterior está sólida e testada. Adicionar conteúdo (jutsu, saga, inimigo) tem de ser barato; adicionar **mecânica** nova, uma de cada vez. O MVP aplicou o princípio a si mesmo: fechou F0 e F1A inteiros, só uma parte escolhida da F1B, e pôs o simulador e o `docs:check` como travas contra regressão.

### Backlog de longo prazo (sem prazo)

| Ideia | O que a torna possível | Situação no MVP |
|---|---|---|
| **Infusão elemental** (Rasengan + Vento → Rasen Shuriken) | Elemento opcional no jutsu e pré-requisito de jutsu (Seções 7 e 8) | O Rasen Shuriken já está nos dados com pré-requisito Rasengan; o mapa de infusões não existe |
| **Invocações** | Batalha como lista de combatentes e efeitos com duração (Seções 9 e 10) | Kuchiyose no Jutsu só na Enciclopédia |
| **Modo Sábio** e outras formas | Transformação genérica com manutenção por turno (Seção 10) | A transformação já existe (Sharingan) |
| **Kekkei Genkai e naturezas combinadas** | Elemento como dado e roda elemental extensível (Seção 7) | Roda com cinco elementos; Raio oculto até a F2 |
| **Dojutsu evoluídos** (Mangekyou, Rinnegan) | Mecânica de clã com estágios, como o tomoe do Sharingan | O contador de turnos do tomoe já é salvo |
| **Jinchuuriki e modos de Bijuu** | Efeitos sustentados e combatentes especiais | — |
| **Fuinjutsu avançado** | Categoria Fuinjutsu atrelada à Inteligência | Kongou Fuusa jogável; Hakke no Fuuin Shiki (F3) nos dados |
| **Ranks avançados** (ANBU, Kage) | Rank e reputação como dado (Seção 4) | Todo personagem é Genin no MVP |
| **Shippuden e Boruto** | Sagas como dado e saga mínima por jutsu (Seções 8 e 12) | Os pontos da história até a Perseguição a Itachi já estão em `src/data/story.ts` |
| **Títulos de evento** | Títulos como dado, com marca de oculto (Seção 14) | Formato pronto em `src/data/titles.ts` |

**Fica de fora do MVP (spec §1):** todo o backlog acima.

---

## 21. Roadmap por Fases

**Estado:** Parcial (MVP)

O roadmap do DD v2 continua valendo, com a F0, a F1A e parte da F1B entregues pelo MVP. A construção seguiu três planos de implementação (`docs/superpowers/plans/`): o motor (Plano 1), a interface (Plano 2) e documentos e fechamento (Plano 3); o curso em `docs/curso/` conta essa construção versão a versão, da Alfa 0.1 à 1.0.

### Fase 0 — Fatia vertical [F0] — entregue

1. Ambiente (Phaser 3, Vite, TypeScript), RNG com semente e arquivo de constantes.
2. Atributos, XP e níveis (Apêndice A.1).
3. Combate 1x1 completo (Seção 9), efeitos básicos e log de batalha.
4. Criação de personagem e jutsus gerais de F0 (Apêndice B).
5. Loja mínima e save da run.
6. Simulador headless com as metas do Apêndice A.

O DD v2 previa só um clã e os encontros até Zabuza na F0; o MVP foi direto à saga completa com os três caminhos.

### Fase 1A — Núcleo da Saga da Onda [F1A] — entregue

7. Saga completa (26 encontros), Haku, Acampamento, Uchiha e Uzumaki completos, Sem clã compensado.
8. Reputação, ryo, loja e equipamento (Arma e Armadura), 4 slots e maestria.
9. Menu principal e Enciclopédia de Jutsus.

### Fase 1B — Camadas adicionais [F1B] — parcial

10. **Entregue:** Ficha do Ninja (Perfil, Atributos, Jutsus, Equipamento), Títulos com buff, Histórico de Runs, Pergaminho Raro, Henge e Doryuuheki, escolha 1-de-3 ao subir de nível (sem jutsu, C12).
11. **Pendente:** aba Registro de Batalha, tela de equipamento com silhueta e eventos entre encontros (loja ambulante, treino, descanso). A escolha 1-de-3 ainda não passou por playtest humano.

### Fase 2

- Saga do Exame Chunin com a **missão de promoção a Chunin** (1000 de reputação), 6 slots, segunda afinidade, Raio e Chidori; Orochimaru na Floresta da Morte; Gaara na Invasão de Konoha.
- Clãs Hyuuga, Nara, Akimichi e Aburame; Sharingan tomoe 2 e 3.
- Meta-progressão completa (Pontos de Legado, desbloqueio de clãs, cosméticos), novos slots de equipamento, Livro Bingo, rival, jutsus combinados; títulos Colecionador e Novo Chunin visíveis (C14).
- Antes de abrir a F2: rever a distância entre builds que o MVP deixou (Apêndice A.6 e Apêndice D).

### Fase 3

- Busca por Tsunade (Rasengan, Kuchiyose), Recuperação do Sasuke, promoção a Jounin (8 slots), elites e equipamentos de grau mais alto, Hakke no Fuuin Shiki (C15) e balanceamento por simulação dos graus A e S.

### Fase 4 — Online

- Modo Infinito, backend multiplayer, matchmaking e ranking, draft de clã no PvP, replays assíncronos pela semente da run (Seção 17).

### Fases futuras (5+)

Infusão elemental, invocações, Modo Sábio, formas avançadas, Shippuden e Boruto, uma mecânica de cada vez (Seção 20).

**Fica de fora do MVP (spec §1):** tudo da F1B pendente, F2, F3, F4 e fases futuras.

---

> *"A verdadeira força não está apenas no poder dos jutsus, mas na vontade de proteger aqueles que amamos."*

---

## Apêndice A — Tabelas de Balanceamento e Simulação

Os números deste apêndice vêm de `src/game/Balance.ts` e do simulador (`src/game/sim/`, `tools/simulate.ts`); a história da calibração está em `docs/balance-log.md`.

### A.1 Curva de XP e níveis

Do nível L para o L+1 são `24 + 12·L` de XP (base 24 <!-- fact: BALANCE.xp.toNextBase=24 -->, 12 <!-- fact: BALANCE.xp.toNextPerLevel=12 --> por nível; `xpToNext` em `src/game/formulas.ts`). Um comum de nível de história N dá `8 + 4·N` (8 <!-- fact: BALANCE.xp.commonBase=8 --> e 4 <!-- fact: BALANCE.xp.commonPerLevel=4 -->; `xpForCommon`); a elite dá ×1,6 <!-- fact: BALANCE.xp.eliteMult=1.6 --> do comum, arredondado; o chefe de grau C ou B dá ×4 <!-- fact: BALANCE.xp.bossMult.C=4 --> do comum do mesmo nível. Três comuns valem um nível.

| Nível | XP para o próximo | XP acumulado | XP de um comum desse nível de história |
|---|---|---|---|
| 1 | 36 | 0 | 12 |
| 2 | 48 | 36 | 16 |
| 3 | 60 | 84 | 20 |
| 4 | 72 | 144 | 24 |
| 5 | 84 | 216 | 28 (Zabuza: 112) |
| 6 | 96 | 300 | 32 |
| 7 | 108 | 396 | 36 |
| 8 | 120 | 504 | 40 |
| 9 | 132 | 624 | 44 |
| 10 | 144 | 756 | 48 (Haku: 192) |
| 11 | 156 | 900 | — |

No ritmo esperado (só comuns, sem elites), o jogador entra em Zabuza no nível 5 e termina a saga no nível 11.

### A.2 Recompensas por grau

| Grau | Ryo | Reputação |
|---|---|---|
| D (comum) | 30 <!-- fact: BALANCE.rewards.D.ryo=30 --> | 22 <!-- fact: BALANCE.rewards.D.rep=22 --> |
| D+ (elite) | 50 | 38 |
| C (Zabuza) | 200 <!-- fact: BALANCE.rewards.C.ryo=200 --> | 160 <!-- fact: BALANCE.rewards.C.rep=160 --> |
| B (Haku) | 300 <!-- fact: BALANCE.rewards.B.ryo=300 --> | 240 <!-- fact: BALANCE.rewards.B.rep=240 --> |
| A (F2) | 500 <!-- fact: BALANCE.rewards.A.ryo=500 --> | 400 <!-- fact: BALANCE.rewards.A.rep=400 --> |

A saga sem elites rende 1220 ryo e 928 de reputação; com as 3 elites, até 1280 ryo e 976 de reputação (Seções 4 e 11).

### A.3 Graus de inimigo

Pontos de atributo do inimigo = `round(P(N) × razão do grau)`, com `P(N) = 50 + 7·(N − 1)`; o HP máximo leva o multiplicador de HP e os golpes levam o multiplicador de dano (Seção 9, `src/game/combat/enemyFactory.ts`).

| Grau | Razão de pontos | HP | Dano | Inimigos no MVP | Origem do valor |
|---|---|---|---|---|---|
| D | 0,7 | ×0,8 <!-- fact: BALANCE.enemyGrades.D.hpMult=0.8 --> | ×0,65 <!-- fact: BALANCE.enemyGrades.D.damageMult=0.65 --> | Bandido, Ninja Renegado, Mercenário da Névoa | DD v2; dano calibrado de 0,6 para 0,65 (iteração 1) |
| D+ | 0,9 | ×1,0 | ×0,8 | os três Veteranos (elite) | spec (C5); não medido em separado |
| C | 1,1 | ×2,1 <!-- fact: BALANCE.enemyGrades.C.hpMult=2.1 --> | ×0,81 <!-- fact: BALANCE.enemyGrades.C.damageMult=0.81 --> | Zabuza Momochi | calibrado: HP 1,3 → 2,1 e dano 0,72 → 0,81 (iterações 2 e 3) |
| B | 1,2 | ×1,7 <!-- fact: BALANCE.enemyGrades.B.hpMult=1.7 --> | ×0,8 <!-- fact: BALANCE.enemyGrades.B.damageMult=0.8 --> | Haku | C6 pedia 1,5; calibrado para 1,7 (iteração 4) |

Os graus A e S estão no `BALANCE` como estimativa do DD v2, sem simulação (Seção 9).

### A.4 Builds do simulador

O robô distribui cada ponto no atributo mais atrasado em relação aos pesos da build (`src/game/sim/builds.ts`). As seis builds focadas entram nas metas; Semi-equilibrado e Equilibrado são só referência.

| Build | Pesos dos pontos livres | Afinidade | Focada |
|---|---|---|---|
| Ninjutsu (Uchiha, Uzumaki, Sem clã) | Nin 40% · HP 20% · Def 15% · Vel 15% · Crit 5% · Int 5% | Fogo no Uchiha; Vento nos outros (`ASSUMIDO`) | sim |
| Taijutsu (Uchiha, Uzumaki, Sem clã) | Tai 40% · HP 20% · Def 15% · Vel 15% · Crit 5% · Int 5% | idem | sim |
| Semi-equilibrado / Uzumaki | Nin 25% · Tai 20% · HP 15% · Def 15% · Vel 15% · Int 10% (`ASSUMIDO`) | Vento | não |
| Equilibrado / Sem clã | 12,5% em cada atributo | Vento | não |

**O robô** (`src/game/sim/bot.ts`) é simples de propósito: equipa os 4 jutsus de dano mais fortes e ignora buffs e controle; usa o kit médico abaixo de 35% do HP, a pílula de chakra nos chefes abaixo de 30% do chakra e defende abaixo de 25% do HP sem kit, mas nunca em dois turnos seguidos; medita sem chakra para um jutsu; compra na ordem estrita do DD v2 A.5 (colete ninja, kunai, kits, pílula, katana só no Taijutsu, colete reforçado) e, sem ryo para o próximo item, não compra nada; nunca escolhe elite e nunca compra Pergaminho Raro; na escolha 1-de-3, prefere kit, pílula, treino, ryo e reforço, nessa ordem.

### A.5 Resultado final do simulador (3000 runs por build)

Saída de `npm run sim` registrada em `docs/balance-log.md` ("Resultado final (3000 runs/build)"):

| Build | Runs | Chega a Zabuza | Vence Zabuza | Completa | Haku dado Zabuza | Rodadas Z/H/comum | HP fim comum | Maestria do jutsu principal |
|---|---|---|---|---|---|---|---|---|
| Ninjutsu / Uchiha | 3000 | 100% | 41% | 31% | 75% | 10.4 / 9.7 / 2.6 | 82% | +2.3 |
| Ninjutsu / Uzumaki | 3000 | 97% | 73% | 69% | 95% | 11.3 / 9.5 / 2.7 | 80% | +3.1 |
| Ninjutsu / Sem clã | 3000 | 98% | 49% | 44% | 91% | 11.3 / 8.9 / 2.8 | 77% | +3.6 |
| Taijutsu / Uchiha | 3000 | 100% | 51% | 38% | 75% | 9.6 / 10.0 / 2.5 | 84% | +3.5 |
| Taijutsu / Uzumaki | 3000 | 99% | 73% | 69% | 94% | 11.3 / 10.4 / 3.0 | 78% | +4.4 |
| Taijutsu / Sem clã | 3000 | 96% | 45% | 38% | 83% | 11.3 / 10.8 / 3.0 | 74% | +4.0 |
| Semi-equilibrado / Uzumaki | 3000 | 92% | 45% | 35% | 78% | 12.1 / 12.7 / 3.5 | 69% | +3.4 |
| Equilibrado / Sem clã | 3000 | 77% | 0% | 0% | 0% | 9.8 / 0.0 / 4.1 | 49% | +3.6 |

Tempo: 141,1 s (3000 runs × 8 builds), acima da meta de 30 s da spec §12; o `npm run sim:check` (1000 runs por build) leva de 33 a 45 s. "Haku dado Zabuza" é a fração de quem venceu Zabuza que também venceu Haku; a maestria é a do jutsu mais usado da run.

**Como ler.** Comparado ao DD v2 A.5, os chefes ficaram mais longos (cerca de 10 rodadas, contra 7 a 8) porque o HP dos graus C e B subiu, e Haku passou a ser mais difícil que Zabuza para as builds Uchiha (75% de quem vence Zabuza), como a C6 pedia. Três leituras continuam valendo: o Uzumaki é a build mais forte contra chefes (73% vencem Zabuza e 94–95% deles vencem Haku), o Uchiha a mais fraca (41% e 51% vencem Zabuza), e builds espalhadas não passam de Zabuza (Equilibrado 0%), o que motivou os presets da criação (C9).

### A.6 Metas de design × faixa da build

As **metas de design** são as da spec §12, em `TARGETS` de `src/game/sim/report.ts`, aplicadas às builds focadas:

| Métrica | Meta de design |
|---|---|
| HP ao fim de um comum | 75–85% |
| Rodadas por comum | 2–4 |
| Chega a Zabuza | 95–100% |
| Vence Zabuza | 45–75% |
| Completa a saga | 35–70% |
| Haku dado Zabuza | 70–85% |
| Maestria média do jutsu principal | +2 a +4 |

Depois de 4 iterações de calibração, 8 métricas seguiam fora, porque a distância entre a build mais fraca contra chefes (Uchiha) e a mais forte (Uzumaki) é maior que a largura das faixas, e os multiplicadores de grau movem todas as builds juntas. O usuário escolheu **faixas por build** (decisão de 2026-10-12, `docs/balance-log.md`): cada build que mede fora da meta ganha uma faixa própria em `BUILD_BANDS`, nunca mais estreita que a meta. O `npm run sim:check` falha se uma build sair da sua faixa; a distância até a meta de design continua impressa (`designGaps`), só como informação. Nenhum valor do `BALANCE` mudou nessa decisão.

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

Com 3000 runs, todas as builds focadas ficam dentro da sua faixa; Ninjutsu / Uchiha fica perto do piso (vence Zabuza 41%, completa 31%). As faixas protegem contra **regressão**; elas não dizem que a distância entre builds está resolvida (Apêndice D).

### A.7 O que o simulador não mede

- **A escolha 1-de-3 do robô é fixa:** ele pega sempre kit ou pílula primeiro. Por isso as builds com mais acesso a cura (Uzumaki, Sem clã) ficam mais fortes contra chefes no simulador; um jogador que escolhe ryo ou treino joga outra economia. Tirar os consumíveis da escolha 1-de-3, ou reduzir a cura do kit de 40% para 25–30%, é uma das correções de design em aberto.
- **O jogador humano joga melhor ou pior que o robô.** O robô não usa buffs (Bunshin, Kawarimi, Kage Bunshin, Doryuuheki, Henge), controle (Kongou Fuusa, Genjutsu: Sharingan), Pergaminho de Reforço nem o Sharingan como transformação, não escolhe elite e não compra Pergaminho Raro. Um humano que usa essas ferramentas deve se sair melhor; um que espalha pontos ou gasta mal o ryo, pior.
- **Não medidos em separado:** o grau D+ das elites, os títulos (o robô joga sem título), o Pergaminho Raro e o tempo real de uma run.
- **Não simulados de jeito nenhum:** os graus A e S e todo o conteúdo de F2 em diante.

---

## Apêndice B — Catálogo de Jutsus

O catálogo é o de `src/data/jutsus.ts`, lido linha a linha; onde o DD v2 Apêndice B diverge, vale o código (as divergências que mudam regra são C3, C7 e C15). São 43 jutsus de jogador: 14 jogáveis no MVP (fases F0, F1A e F1B) e 29 de fases futuras, que existem só como dados para a Enciclopédia, sem efeito mecânico. Os efeitos dos jogáveis estão na Seção 10 e no campo `description` de cada entrada.

**Legenda:** requisitos são sempre de **atributo base** (Seção 3); "(+ jutsu)" é pré-requisito de jutsu já aprendido; "Herança" é a regra da Seção 8 (o jutsu básico do clã pode ser aprendido desde o início); "Chakra" é o custo base, antes dos descontos de maestria, clã e título; "—" no Poder é jutsu sem dano direto; categoria seguida de elemento indica a natureza de chakra, e sem elemento o jutsu é neutro.

### B.1 Jogáveis no MVP

| `id` | Jutsu | Categoria / elemento | Clã | Requisitos | Saga mínima | Grau | Chakra | Poder | Fase |
|---|---|---|---|---|---|---|---|---|---|
| `henge` | Henge no Jutsu | Ninjutsu | Geral | Nin 5 | Início | D | 6 | — | F1B |
| `bunshin` | Bunshin no Jutsu | Ninjutsu | Geral | Nin 5 | Início | D | 8 | — | F1A |
| `kawarimi` | Kawarimi no Jutsu | Ninjutsu | Geral | Vel 8 | Início | D | 10 | — | F1A |
| `bola_de_fogo` | Bola de Fogo Básica | Ninjutsu / Fogo | Geral | Nin 6 | Início | D | 8 | 26 | F0 |
| `sennen_goroshi` | Sennen Goroshi | Taijutsu | Geral | Tai 6 | Início | D | 8 | 26 | F0 |
| `investida_ninja` | Investida Ninja | Taijutsu | Geral | Tai 12 | Início | C | 14 | 40 | F0 |
| `kai` | Kai | Genjutsu | Geral | Gen 8 | Início | D | 6 | — | F1A |
| `daitoppa` | Fuuton: Daitoppa | Ninjutsu / Vento | Geral | Nin 12 | Saga da Onda | C | 14 | 40 | F1A |
| `doryuuheki` | Doton: Doryuuheki | Ninjutsu / Terra | Geral | Nin 12 | Saga da Onda | C | 14 | — | F1B |
| `suiryuudan` | Suiton: Suiryuudan no Jutsu | Ninjutsu / Água | Geral | Nin 22 | Saga da Onda (após Zabuza) | B | 22 | 60 | F1A |
| `kage_bunshin` | Kage Bunshin no Jutsu | Ninjutsu | Geral | Nin 20 | Saga da Onda | B | 24 | — | F1A |
| `kongou_fuusa` | Kongou Fuusa (Herança) | Fuinjutsu | Uzumaki | Int 14 + Nin 8 | Início | C | 16 | — | F1A |
| `goukakyuu` | Katon: Goukakyuu no Jutsu (Herança) | Ninjutsu / Fogo | Uchiha | Nin 12 | Início | C | 14 | 40 | F1A |
| `genjutsu_sharingan` | Genjutsu: Sharingan (Herança) | Genjutsu | Uchiha | Gen 10 | Início | C | 12 | — | F1A |

### B.2 Fases futuras (só Enciclopédia)

| `id` | Jutsu | Categoria / elemento | Clã | Requisitos | Saga mínima | Grau | Chakra | Poder | Fase |
|---|---|---|---|---|---|---|---|---|---|
| `konoha_senpuu` | Konoha Senpuu | Taijutsu | Geral | Tai 14 | Exame Chunin (início) | C | 14 | 40 | F2 |
| `jubaku_satsu` | Magen: Jubaku Satsu | Genjutsu | Geral | Gen 14 | Exame Chunin (início) | C | 16 | — | F2 |
| `nehan_shouja` | Magen: Nehan Shouja no Jutsu | Genjutsu | Geral | Gen 20 | Exame Chunin (mês de treino) | B | 22 | — | F2 |
| `gogyou_fuuin` | Fuuinjutsu: Gogyou Fuuin | Fuinjutsu | Geral | Int 22 | Exame Chunin (Floresta da Morte) | B | 22 | — | F2 |
| `naruto_rendan` | Uzumaki Naruto Rendan | Taijutsu | Geral | Tai 20 + Nin 12 (+ Kage Bunshin no Jutsu) | Exame Chunin (Preliminares) | B | 24 | 70 | F2 |
| `shishi_rendan` | Shishi Rendan | Taijutsu | Geral | Tai 22 + Vel 14 | Exame Chunin (Finais) | B | 22 | 65 | F2 |
| `chidori` | Chidori | Ninjutsu / Raio | Geral | Nin 30 + Vel 18 | Exame Chunin (mês de treino) | A | 38 | 100 | F2 |
| `rasengan` | Rasengan | Ninjutsu | Geral | Nin 32 + Int 15 (+ Kage Bunshin no Jutsu) | Busca por Tsunade | A | 40 | 100 | F3 |
| `kuchiyose` | Kuchiyose no Jutsu | Ninjutsu | Geral | Nin 25 + Int 20 | Busca por Tsunade | A | 40 | — | Futuro |
| `rasen_shuriken` | Fuuton: Rasen Shuriken | Ninjutsu / Vento | Geral | Nin 45 + Int 30 (+ Rasengan) | Shippuden | S | 70 | 160 | Futuro |
| `omote_renge` | Omote Renge | Taijutsu | Geral | Tai 40 + Vel 30 | Exame Chunin (Preliminares) | S | 60 | 150 | Futuro |
| `hakke_no_fuuin_shiki` | Hakke no Fuuin Shiki | Fuinjutsu | Uzumaki | Int 30 + Nin 20 | Shippuden | A | 36 | — | F3 |
| `ryuuka` | Katon: Ryuuka no Jutsu | Ninjutsu / Fogo | Uchiha | Nin 24 | Exame Chunin (mês de treino) | B | 24 | 65 | F2 |
| `amaterasu` | Amaterasu | Ninjutsu | Uchiha | Gen 40 + Nin 25 | Perseguição a Itachi | S | 50 | 130 | Futuro |
| `tsukuyomi` | Tsukuyomi | Genjutsu | Uchiha | Gen 42 + Nin 20 | Perseguição a Itachi | S | 50 | — | Futuro |
| `jyuuken` | Jyuuken (Herança) | Taijutsu | Hyuuga | Tai 10 | Início | C | 12 | 40 | F2 |
| `hakke_sanjuuni` | Hakke Sanjuuni Shou | Taijutsu | Hyuuga | Tai 18 | Exame Chunin (mês de treino) | B | 22 | 60 | F2 |
| `kaiten` | Kaiten | Taijutsu | Hyuuga | Tai 22 + Vel 12 | Exame Chunin (Preliminares) | B | 22 | — | F2 |
| `hakke_rokujuuyon` | Hakke Rokujuuyon Shou | Taijutsu | Hyuuga | Tai 34 + Vel 20 | Exame Chunin (Finais) | A | 38 | 100 | F2 |
| `kagemane` | Kagemane no Jutsu | Ninjutsu | Nara | Nin 10 + Int 12 | Exame Chunin (Floresta da Morte) | C | 14 | — | F2 |
| `kagenui` | Kagenui no Jutsu | Ninjutsu | Nara | Nin 18 + Int 16 | Exame Chunin (mês de treino) | B | 22 | 45 | F2 |
| `kage_kubishibari` | Kage Kubishibari no Jutsu | Ninjutsu | Nara | Nin 22 + Int 18 | Exame Chunin (Finais) | B | 24 | 50 | F2 |
| `bubun_baika` | Bubun Baika no Jutsu (Herança) | Taijutsu | Akimichi | Tai 10 | Início | C | 12 | 42 | F2 |
| `baika` | Baika no Jutsu | Taijutsu | Akimichi | Tai 16 | Exame Chunin (mês de treino) | B | 20 | — | F2 |
| `nikudan_sensha` | Nikudan Sensha | Taijutsu | Akimichi | Tai 22 (+ Baika no Jutsu) | Exame Chunin (Preliminares) | B | 22 | 70 | F2 |
| `chou_baika` | Chou Baika no Jutsu | Taijutsu | Akimichi | Tai 30 + HP 25 | Recuperação do Sasuke | A | 36 | — | F3 |
| `kikaichuu` | Kikaichuu no Jutsu (Herança) | Ninjutsu | Aburame | Nin 10 + Int 10 | Início | C | 12 | — | F2 |
| `mushi_bunshin` | Mushi Bunshin no Jutsu | Ninjutsu | Aburame | Int 14 | Exame Chunin (mês de treino) | C | 14 | — | F2 |
| `mushidama` | Mushidama | Ninjutsu | Aburame | Nin 30 + Int 20 | Shippuden | A | 36 | 90 | Futuro |

As sagas mínimas dos jutsus que o DD v2 marcava com ◇ (estimativa conservadora) entraram nos dados como estavam e ainda não foram conferidas no anime (Apêndice D). O Omote Renge, que o DD v2 punha em "Exame Chunin (Oito Portões)", usa o ponto "Exame Chunin (Preliminares)", o mais próximo da lista de pontos da história (`src/data/story.ts`).

### B.3 Golpes exclusivos de inimigos

Não aparecem na Enciclopédia (`enemyOnly`). Zabuza também usa o Suiton: Suiryuudan do catálogo geral.

| `id` | Golpe | Categoria / elemento | Quem usa | Grau | Chakra | Poder | Fase |
|---|---|---|---|---|---|---|---|
| `golpe_pesado` | Golpe Pesado | Taijutsu | Bandido e Bandido Veterano | D | 8 | 24 | F0 |
| `kunai_lancada` | Kunai Lançada | Ninjutsu | Ninja Renegado, Mercenário da Névoa e Veteranos | D | 6 | 22 | F0 |
| `kubikiribouchou` | Kubikiribouchou | Taijutsu | Zabuza | C | 0 | 30 | F1A |
| `kirigakure` | Kirigakure no Jutsu (+15% de esquiva por 3 turnos) | Ninjutsu | Zabuza | C | 12 | — | F1A |
| `muon_satsujin` | Muon Satsujin | Taijutsu | Zabuza | C | 18 | 45 | F1A |
| `senbon` | Senbon | Ninjutsu | Haku | C | 0 | 30 | F1A |
| `makyou_hyoushou` | Makyou Hyoushou (+25% de esquiva por 3 turnos) | Ninjutsu / Água | Haku | B | 14 | — | F1A |
| `sensatsu_suishou` | Sensatsu Suishou | Ninjutsu / Água | Haku | B | 20 | 55 | F1A |

O Poder dos golpes de inimigo é o base; o multiplicador de dano do grau (Apêndice A.3) entra na fórmula de dano. O DD v2 A.4 trazia o Poder já multiplicado.

### B.4 Itens canônicos e backlog

Os itens canônicos do DD v2 B.8 (Kibaku Fuda, Shuriken, Pílula de Soldado, pílulas Akimichi) não entraram no MVP; a loja do MVP é a da Seção 11 (`src/data/items.ts`). O backlog canônico do DD v2 B.9 (Oito Portões, Modo Sábio, Kurama, Susanoo, Hiraishin, invocações, Kekkei Genkai como Hyouton e Mokuton) continua como visão: cada um vira **mecânica própria** (Seção 20), e não só um jutsu.

---

## Apêndice C — Glossário

| Termo | Significado neste documento |
|---|---|
| **Rank ninja** | Genin, Chunin, Jounin: o posto do personagem (Seção 4). É o **único** uso da palavra "rank". |
| **Grau** | Escala D, C, B, A, S de jutsus, inimigos e itens. A C11 trocou "rank" por "grau" nos textos de item e de inimigo da interface. O D+ é uma variante do grau D que só existe para inimigos elite. |
| **Nível** | Nível de experiência do personagem; sobe por XP dentro da run (Apêndice A.1). |
| **Nível de história** | Nível esperado de um encontro da saga; define a força do inimigo (Seções 9 e 12). |
| **Run** | Uma tentativa completa: da criação do personagem à morte, à vitória sobre Haku ou ao abandono. |
| **Encontro** | Uma batalha da sequência de uma saga (26 na Saga da Onda). |
| **Elite** | Variante D+ de um comum, opcional, oferecida em 3 bifurcações por run (Seção 12). |
| **Acampamento** | Parada antes de cada chefe: HP e chakra a 100% e ponto de save (Seção 9). |
| **Saga mínima** | Ponto da história a partir do qual um jutsu pode ser aprendido (Seção 8). |
| **Herança** | Marca do jutsu básico de clã que pode ser aprendido desde o início (Seção 8). |
| **Maestria** | Domínio de **um jutsu** por uso, de +1 a +5 (Seção 8). Sempre da run. |
| **Pontos de Legado** | Moeda persistente da meta-progressão, F2 (Seção 15). Antes "Pontos de maestria". |
| **Reputação** | Número que libera a promoção de rank ninja (Seção 4). Da run. |
| **Ryo** | Moeda da loja (Seção 11). Da run. |
| **Atributo base / efetivo** | Base = inicial + pontos + clã + Pergaminhos Raros, e só ele desbloqueia jutsu; efetivo = base + equipamento + efeitos (Seção 3). |
| **Poder Ninja** | Número informativo que resume a força do personagem; não entra em fórmula (Seção 3). |
| **Transformação** | Efeito ligado e desligado pelo jogador, mantido por chakra a cada turno, como o Sharingan (Seção 10). |
| **Carga** | Efeito que se gasta ao ser usado, como o Kawarimi que anula o próximo golpe (Seção 10, C3). |
| **Tenacidade** | Imunidade de 2 turnos a novos controles depois que um controle termina (Seção 10). |
| **Preset** | Distribuição recomendada de pontos (Ninjutsu, Taijutsu, Equilibrado-guiado) oferecida na criação e a cada nível (Seção 5, C9). |
| **RNG com semente** | Gerador de números aleatórios que repete a mesma sequência a partir da mesma semente; todo sorteio do jogo passa por ele (Seção 18). |
| **Simulador headless** | Programa que joga runs completas sem interface, com um robô, para medir o balanceamento (Seção 18, Apêndice A). |
| **Build focada** | Build do simulador que entra nas metas (as seis de Ninjutsu e Taijutsu; Apêndice A.4). |
| **Meta de design** | Faixa que a spec §12 quer para uma métrica do simulador (`TARGETS`); hoje só informativa (Apêndice A.6). |
| **Faixa de regressão (faixa da build)** | Faixa própria de uma build em `BUILD_BANDS`, nunca mais estreita que a meta de design; o `sim:check` falha se a build sair dela (Apêndice A.6). |
| **`ASSUMIDO`** | Marca de uma regra que o DD v2 não define e que a spec ou o código decidiu, com justificativa (`docs/ANALISE.md` §4). |
| **Quarentena de save** | Cópia de um save inválido para uma chave `nxr.*.corrupt.<timestamp>`, para o jogo seguir limpo sem perder o arquivo (Seção 18). |
| **Cn** | Uma das 15 correções do DD v2 feitas pela spec (C1 a C15, `docs/ANALISE.md` §2). |

---

## Apêndice D — Decisões em Aberto

As 12 decisões em aberto do DD v2, uma a uma, e as que o MVP abriu.

| # | Decisão do DD v2 | Situação |
|---|---|---|
| 1 | Conferir no anime os nomes e as sagas mínimas estimadas (◇) | **Segue em aberto.** Os jutsus entraram nos dados com as estimativas do DD v2; os dois ◇ jogáveis (Daitoppa e Doryuuheki, Saga da Onda) não foram conferidos, e os de F2 em diante só aparecem na Enciclopédia |
| 2 | "Selo de Quatro Elementos" trocado por Gogyou Fuuin | **Decidido no MVP (C7):** é o Gogyou Fuuin, Geral e da F2, porque na obra é técnica do Orochimaru; saiu do pool do Uzumaki |
| 3 | Haku mais fácil que Zabuza | **Decidido no MVP (C6):** segunda fase abaixo de 50% do HP e HP do grau B a ×1,7 pela calibração (Apêndice A.3) |
| 4 | Builds recomendadas na criação | **Decidido no MVP (C9):** presets Ninjutsu, Taijutsu e Equilibrado-guiado e o botão "Distribuir pelo preset" |
| 5 | Uchiha abaixo dos outros clãs na Saga da Onda | **Segue em aberto.** Com 3000 runs, Ninjutsu / Uchiha vence Zabuza em 41%; a faixa por build (decisão do usuário) aceita isso como piso de regressão, mas não compensa. Ativar o Sharingan sem gastar o turno (`ASSUMIDO`) foi a única ajuda; rever depois de o usuário jogar |
| 6 | Variação entre runs na F1A ou na F1B | **Decidido no MVP (decisão do usuário, spec §1):** só a escolha 1-de-3 ao subir de nível entrou, sem jutsu (C12); os eventos entre encontros ficam para depois |
| 7 | Queimadura de 4% por 3 turnos sem simulação | **Decidido no MVP:** o valor do DD v2 foi mantido (`src/data/effects.ts`) e entra no simulador pelos jutsus de Fogo que o robô usa (Bola de Fogo e Goukakyuu); não foi medido isoladamente |
| 8 | Tempo de uma run (meta de 25 a 35 minutos) | **Segue em aberto.** Não há playtest humano registrado, e o jogo não mede o tempo de run |
| 9 | F0 até Zabuza ou só até o encontro 6 | **Decidido no MVP (decisão do usuário, spec §1):** o MVP foi além da F0 e entregou a Saga da Onda inteira |
| 10 | Risco de propriedade intelectual | **Segue em aberto** quanto a publicar. O MVP é projeto de fã, local, sem monetização e sem arte oficial; o package se chama `ninja-x-rogue` |
| 11 | Ordem canônica das sagas futuras | **Segue em aberto.** A ordem dos pontos da história está em `src/data/story.ts` e a da Seção 12 segue o DD v2, mas o conteúdo de F2 e F3 não foi analisado (`docs/ANALISE.md` §7) |
| 12 | Espaço para novas definições | Ocupado pelas decisões abertas abaixo |

### Abertas pelo MVP

- **Distância entre builds.** Uzumaki vence Haku em 94–95% de quem vence Zabuza; Uchiha fica no piso. As correções sugeridas pela calibração, fora dos multiplicadores de grau, são tirar os consumíveis da escolha 1-de-3 ou reduzir a cura do kit (40% para 25–30%) e revisar a passiva do Uzumaki. **Segue em aberto**, para depois de o usuário jogar (`docs/balance-log.md`).
- **Métrica de maestria.** O Taijutsu concentra os usos num golpe só e passa de +4; medir pelos dois jutsus mais usados é a alternativa registrada. **Segue em aberto.**
- **Build Equilibrado.** Nunca vence Zabuza (0%). Não é build focada, mas falta decidir se ela deve ser viável. **Segue em aberto.**
- **Desempenho do simulador.** `npm run sim` leva 141,1 s, acima da meta de 30 s. **Segue em aberto.**
- **Títulos por categoria** (linhas de Taijutsu, Genjutsu e Fuinjutsu, Seção 14). **Segue em aberto.**
- **Conferência visual no navegador.** Layout, animações e cores não são cobertos por teste automático. **Segue em aberto.**

---

## Apêndice E — Registro de Mudanças (v3.0)

### Mudanças de forma

- Toda seção abre com uma linha de estado (Implementado, Parcial ou Futuro) e fecha com o que a spec §1 deixou de fora.
- Todo número vem do código: constantes de `src/game/Balance.ts`, marcadas para o `npm run docs:check` conferir, e conteúdo de `src/data/`.
- A Seção 19 descreve a estrutura real do projeto, e não a sugerida; o Apêndice A traz os números finais do simulador, e o Apêndice B, o catálogo lido dos dados.

### Correções do DD v2 (C1–C15)

| # | Problema no DD v2 | Correção no v3 | Seções |
|---|---|---|---|
| C1 | Maestria como `(1 + Maestria)` na fórmula de dano dava +100% por nível | Termo `(1 + 0,03·m)` | 3, 8, 9 |
| C2 | Não dizia onde entram os bônus de dano de título, clã, transformação e buffs | Um termo aditivo único `(1 + Σ bônus %)` | 3, 9 |
| C3 | "Prioridade" do Kawarimi num turno sequencial | Carga que anula o próximo golpe, 2 turnos | 9, 10, Ap. B |
| C4 | Kunai "+2 de Crítico" ambíguo | +2 no atributo Crítico e +2 Velocidade | 11 |
| C5 | Blocos da tabela A.4 fora da própria regra e elite de grau "E" | Inimigos gerados por código; elite D+ | 9, Ap. A |
| C6 | Haku mais fácil que Zabuza | Segunda fase e HP do grau B maior (×1,7 calibrado) | 9, Ap. A |
| C7 | Gogyou Fuuin exclusivo do Uzumaki e geral ao mesmo tempo | Geral e da F2 | 6, Ap. B |
| C8 | Elites levariam a reputação a 1000 na Onda | Não levam (máximo 976); texto corrigido | 4, 12 |
| C9 | Builds espalhadas travam em Zabuza sem orientação | Presets na criação e "Distribuir pelo preset" | 5 |
| C10 | Meditar fora da barra de batalha | Barra com Atacar, Defender, Meditar, Item, Transformar e 4 jutsus | 9, 13 |
| C11 | "rank" para item e inimigo | "grau" | 4, 9, 13, Ap. C |
| C12 | Jutsu como recompensa da escolha 1-de-3 | Jutsu só por condição de status (decisão do usuário) | 8, 15 |
| C13 | Kai inutilizável sob controle | Sob Ilusão, a única ação permitida é Kai | 9, 10 |
| C14 | Colecionador e Novo Chunin impossíveis no MVP | Nos dados, ocultos até a F2 | 14, 15 |
| C15 | Hakke no Fuuin Shiki F2+ e F3 ao mesmo tempo | F3 | 6, Ap. B |

### Decisões tomadas depois da spec (`docs/ANALISE.md` §5)

| Decisão | Efeito no design |
|---|---|
| HP do Haku ×1,7 em vez de ×1,5 | A C6 fixa o objetivo, não o número (Apêndice A.3) |
| Dano dos comuns (grau D) 0,65 | HP no fim dos comuns entra na meta sem derrubar "chega a Zabuza" |
| Métrica de maestria = jutsu principal | O simulador mede o jutsu mais usado da run |
| Robô não defende dois turnos seguidos e compra na ordem do DD v2 A.5 | Evita a espiral de defesa e mantém a referência de compra (Apêndice A.4) |
| Título "Por um Fio" usa o limite dos dados | A condição lê `maxHpPct` em `src/data/titles.ts` |
| `recordRunEnd` idempotente e boot que finaliza run encerrada | A meta nunca conta a mesma run duas vezes (Seção 15) |
| Save que nunca lança | Quarentena do save inválido (Seção 18) |
| Enciclopédia mostra jutsus bloqueados com requisitos | Reforça a coleção e as metas "faltam X para Y" (Seções 2 e 8) |
| Colecionador e Novo Chunin ocultos até a F2 | Aplicação direta da C14 |
| Abandonar a run com a gravação da meta falhando | A run encerrada fica salva para o próximo boot (Seção 18) |
| Erro de render ou de animação nunca prende o jogador | Tela de erro com Recarregar (Seção 18) |
| Versões de dependência | `phaser` fixo na linha 3.88; `happy-dom` e `vitest` atualizados por segurança (Seção 18) |

E uma decisão do Plano 3: **faixas por build** no `sim:check` (decisão do usuário, Apêndice A.6), que troca a proteção "toda build dentro da meta de design" por "nenhuma build pior que hoje", com a distância até a meta ainda impressa.

### Números que mudaram em relação ao DD v2

| Constante | DD v2 | v3 (código) | Motivo |
|---|---|---|---|
| Dano do grau D | ×0,6 | ×0,65 | calibração, iteração 1 |
| HP do grau C | ×1,3 | ×2,1 | calibração, iteração 2 |
| Dano do grau C | ×0,72 | ×0,81 | calibração, iteração 3 |
| HP do grau B | ×1,3 | ×1,7 | C6 (×1,5) e calibração, iteração 4 |
| Pontos do Bandido de nível 1 | 41 | 35 | C5 (gerado pela regra) |
| Grau da elite | "E" | D+ | C5 |
