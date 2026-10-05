# NarutoTxGame — Documento de Design

**Versão 2.0 — revisão de consistência e balanceamento.** Esta versão resolve as inconsistências da versão anterior, fecha a **base numérica** (XP, encontros por nível, HP, chakra, dano, esquiva, crítico, escala de inimigos, economia) calibrada por simulação, e acrescenta um **catálogo de jutsus** (gerais e de clã) com nomes e sagas fiéis ao anime. Os números estão nos Apêndices A e B; as regras estão nas seções 1 a 21. O Apêndice E lista tudo o que mudou.

**Legenda de fases** — cada feature relevante agora é marcada com a fase em que entra:

| Marca | Significado |
|---|---|
| **[F0]** | Fatia vertical: o mínimo jogável (combate + atributos + 1 chefe) |
| **[F1A]** | Protótipo: Saga da Onda completa com o núcleo do jogo |
| **[F1B]** | Protótipo: camadas de conteúdo/meta que podem entrar depois do núcleo |
| **[F2]** a **[F4]** | Fases seguintes do roadmap (Seção 21) |
| **[Futuro]** | Backlog de longo prazo (Seção 20) |

---

## Sumário

1. Visão Geral do Projeto
2. Pilares do Design
3. Sistema de Atributos e Fórmulas de Base
4. Rank Ninja e Reputação
5. Criação de Personagem
6. Sistema de Clãs
7. Sistema de Chakra e Elementos
8. Sistema de Jutsus e Progressão
9. Sistema de Combate e Grau de Inimigos
10. Efeitos, Buffs e Debuffs
11. Economia e Loja
12. Modo História
13. Interface e Experiência do Jogador
14. Ficha do Ninja (Sumário)
15. Progressão do Personagem e Meta-Progressão
16. Histórico de Runs
17. Modo Online (Futuro)
18. Arquitetura Técnica
19. Estrutura Sugerida do Projeto
20. Visão de Longo Prazo
21. Roadmap por Fases

**Apêndices:** A — Tabelas de Balanceamento e Simulação · B — Catálogo de Jutsus · C — Glossário · D — Decisões em Aberto · E — Registro de Mudanças (v2.0)

---

## 1. Visão Geral do Projeto

**NarutoTxGame** é um RPG tático por turnos roguelike, rodando no navegador (nos moldes de PokéRogue), com foco em customização profunda de personagem através de um sistema de atributos e clãs, combate estratégico, uma economia simples (ryo, reputação, loja) e uma campanha (Modo História) fiel à cronologia do anime.

### Objetivos principais

- Sistema de atributos onde as escolhas de investimento do jogador definem literalmente quais técnicas ele consegue usar, não só o quão forte ele é.
- Identidade forte por clã, sem que o clã seja obrigatório para acessar as técnicas mais icônicas do universo (ex: Rasengan é geral, não exclusivo de clã).
- Progressão de poder que **respeita a cronologia do anime** — o jogador não deve ter acesso a técnicas tardias (como o Rasengan) em confrontos que, na obra, acontecem muito antes de elas existirem.
- Combate tático com profundidade real de decisão turno a turno, com buffs e debuffs sempre visíveis para o jogador.
- **Números dirigidos por dados e validados por simulação:** toda constante de balanceamento vive em arquivo de configuração e é testada por um simulador headless antes de virar conteúdo (Seção 18).
- Base de código pensada para crescer por muito tempo: a ambição é cobrir, aos poucos, toda a lore de Naruto e possivelmente chegar até Boruto (Seção 20).

### Escopo por fase

**[F0] Fatia vertical (primeiro marco jogável)**

- Criação de personagem simples: nome + clã (Uchiha, Uzumaki ou Sem clã) + afinidade (Seção 5).
- Combate 1x1 completo com as fórmulas da Seção 3, ordem por Velocidade, chakra, crítico, esquiva e elementos.
- Efeitos básicos (queimadura, buff temporário, controle) e log de batalha.
- Ganho de nível com distribuição de pontos e desbloqueio de jutsu por atributo/saga.
- Primeiros 12 encontros comuns + chefe Zabuza, com loja mínima (kit médico e pílula de chakra) e salvamento da run em andamento.

**[F1A] Protótipo — núcleo da Saga da Onda**

- Saga da Onda completa: 26 encontros, com Zabuza (grau C) e Haku (grau B) como chefes (Seção 12).
- 2 clãs completos (Uchiha, Uzumaki) + o caminho "Sem clã" com compensação real (Seção 6).
- Reputação, ryo, loja e equipamento de 2 slots (Arma e Armadura) com interface simples.
- Slots de jutsu (Genin: 4) e maestria por uso (Seção 8).
- Menu principal: Modo História, Modo Infinito ("Em breve") e Enciclopédia de Jutsus.

**[F1B] Protótipo — camadas adicionais**

- Ficha do Ninja (abas Perfil, Atributos, Jutsus e Equipamento), Pergaminho Raro, Histórico de Runs.
- Registro de Batalha, Títulos com buff e a tela de equipamento com silhueta.
- Os slots de jutsu 6/8 e as promoções existem nos dados, mas só ficam testáveis na Fase 2 (o Chunin chega no Exame Chunin).

---

## 2. Pilares do Design

**Build definida por investimento, não por escolha única.** O clã dá identidade, mas os atributos é que abrem o leque de jutsus.

**Jutsus icônicos são conquistados, não dados.** Rasengan, por exemplo, não pertence a clã nenhum — pertence a quem investiu o suficiente em Ninjutsu e já avançou o suficiente na história.

**Fidelidade à obra.** Nomes, elementos e ordem de aparição de jutsus e personagens seguem o anime sempre que possível; se um jutsu não tem elemento na lore, ele não tem elemento no jogo. A única exceção controlada é a regra de **Herança de clã** (Seção 8), que permite ao personagem aprender cedo técnicas básicas do próprio clã.

**Combate tático por turnos.** Gasto de chakra, elemento, efeitos e ordem de ação (por Velocidade) definem o resultado. O jogador sempre enxerga o que está ativo nele e no inimigo, e por quantos turnos. *(Posicionamento não existe no 1x1 e só entra com batalhas em equipe, Fase 3+.)*

**Interface leve e legível, inspirada em Pokémon** — HP, chakra, atributos e efeitos ativos sempre fáceis de ler.

**Sensação de coleção.** Uma enciclopédia de jutsus mostra tudo o que existe no jogo e o que já foi conquistado.

**Estabilidade antes de expansão.** Cada etapa do projeto precisa estar funcionando de forma sólida antes de se adicionar a próxima camada de conteúdo. É por isso que o escopo é dividido em F0 → F1A → F1B.

**Escalável para online desde o início** — lógica de combate separada da apresentação, com sorteios reprodutíveis por semente (Seção 18).

---

## 3. Sistema de Atributos e Fórmulas de Base

Todo personagem tem 8 atributos primários. Eles crescem por dois caminhos: pontos distribuídos livremente a cada nível (escolha do jogador) e bônus passivo de clã (crescimento extra automático nos dois atributos de destaque do clã).

| Atributo | Efeito |
|---|---|
| HP | +4 de HP máximo por ponto |
| Taijutsu | Multiplica o dano de jutsus de Taijutsu e da ação "Atacar"; controla quais jutsus de Taijutsu podem ser aprendidos |
| Ninjutsu | Multiplica o dano de jutsus de Ninjutsu; controla quais jutsus de Ninjutsu podem ser aprendidos |
| Genjutsu | Aumenta a **chance** de aplicar ilusões/controle e a duração dos debuffs; controla quais jutsus de Genjutsu podem ser aprendidos. Genjutsu quase não causa dano direto |
| Velocidade | Define a ordem de turno e a chance de esquiva (ver fórmulas) |
| Inteligência | +1 de chakra máximo por ponto e +1 de regeneração de chakra a cada 8 pontos; controla jutsus de Fuinjutsu e de suporte. **Não reduz mais o custo de chakra** (ver Registro de Mudanças) |
| Chance de Crítico | Probabilidade de acerto crítico (curva com retornos decrescentes) |
| Defesa | Reduz o dano recebido (curva com retornos decrescentes) |

### Progressão de atributos

- Todos os atributos começam em **5** (total de 40).
- Na criação, o jogador recebe **10 pontos extras** para distribuir (Seção 5).
- A cada nível, o jogador ganha **5 pontos livres**.
- **Clãs:** cada um dos dois atributos de destaque ganha **+1 automático por nível** (+2 pontos por nível no total, sempre nos atributos de destaque).
- **Sem clã:** **+1 ponto livre a mais por nível (6 no total)**, além de bônus de jutsus gerais (Seção 6).
- Chakra máximo não é distribuível: cresce por nível e recebe influência de Inteligência.
- **Pontos totais esperados** de um personagem de clã no nível N: `P(N) = 50 + 7·(N − 1)`. É a régua que define a força dos inimigos (Seção 9) e os requisitos de jutsu.

### Fórmulas de base (valores de referência calibrados por simulação)

| Grandeza | Fórmula |
|---|---|
| HP máximo | `(80 + 4·HP + 6·nível) × multiplicador de clã` |
| Chakra máximo | `30 + 4·nível + Inteligência` |
| Regeneração de chakra | `2 + ⌊Inteligência / 8⌋` por turno em que o combatente age |
| Dano de um golpe | `Poder × (1 + Maestria) × (1 + Atributo/40) × Elemental × (1 + Título) × (1 − Redução) × Crítico × Variação` |
| Poder base por grau do jutsu | D = 26 · C = 40 · B = 60 · A = 90 · S = 130 (ação "Atacar" = 18) |
| Custo de chakra por grau | D = 8 · C = 14 · B = 22 · A = 34 · S = 50 (ajustável por jutsu) |
| Redução de dano (Defesa) | `Redução = mín(60%, Def / (Def + 50))` |
| Chance de esquiva | `Esquiva = clamp(4 + 0,8 × (Vel do alvo − Vel do atacante), 0, 40)%` (bônus somam, **teto total 40%**) |
| Chance de crítico | `Crítico = mín(55%, 50 × C / (C + 60) + bônus fixos)` |
| Dano crítico | ×1,5 |
| Variação de dano | Sorteio entre 0,9 e 1,1 |
| Modificador elemental | Vantagem ×1,3 · Desvantagem ×0,8 · Neutro ×1,0 |
| Ordem de turno | `Velocidade efetiva × (1 + sorteio entre 0 e 0,10)`, recalculada a cada rodada |

Notas:

- A curva de Crítico é assintótica (máx. 50% só com atributo): 5 → 3,8% · 20 → 12,5% · 40 → 20% · 60 → 25%. Bônus fixos (clã, arma, título) somam por cima, com **teto de 55%**.
- A Defesa em 10 dá 16,7% de redução; em 30, 37,5%; em 50, 50%.
- O atributo efetivo (base + equipamento + efeitos temporários) entra nas fórmulas; só o **atributo base** conta para desbloquear jutsus.
- **Retorno por ponto** (calibrado para que nenhum atributo seja "obrigatório"): perto do nível 5, um ponto de HP vale ~2,8% de HP; um de Defesa, ~1,7% de vida efetiva; um de atributo ofensivo, ~1,6% a 1,9% de dano.

### Atributo base × atributo efetivo

- **Atributo base:** pontos de nível + bônus de clã + bônus permanentes (Pergaminhos Raros, Seção 11).
- **Atributo efetivo:** atributo base + bônus de equipamento + efeitos temporários ativos.
- Equipamento e buffs temporários melhoram o combate, mas não abrem jutsus novos — evita "aprender" um jutsu com um buff e perdê-lo em seguida.

### Requisitos de atributo por grau de jutsu

Referência para os requisitos da Seção 8 e do catálogo (Apêndice B). Foram fixados para que um jogador que **especializa** consiga o grau em torno do nível indicado e um jogador de build espalhada chegue mais tarde:

| Grau | Atributo principal mínimo | Segundo atributo | Nível típico de um especialista |
|---|---|---|---|
| D | 5 a 8 | — | 1 |
| C | 12 a 16 | — | 2–4 |
| B | 18 a 26 | opcional (8 a 14) | 5–9 |
| A | 30 a 38 | 15 a 20 | 12–20 |
| S | 40 ou mais | 25 ou mais | 25+ |

### Poder Ninja

Um número único que resume a força do personagem, para comparação rápida. Fórmula de referência (pesos a ajustar): `PN = 2·HP + 3·(maior entre Tai/Nin/Gen) + (soma dos outros dois ofensivos) + 2·Vel + Int + 2·Crit + 2·Def`, calculada sobre atributos efetivos permanentes (base + equipamento, sem buffs). É apenas informativo — não entra em nenhuma fórmula de combate. Aparece no Perfil da Ficha e na tela de batalha, para jogador e inimigo.

### Por que atributo e não só nível

Nível sozinho não diferencia builds. Atrelar o desbloqueio de jutsu ao valor do atributo investido garante que dois jogadores no mesmo nível possam ter arsenais diferentes.

---

## 4. Rank Ninja e Reputação

Todo personagem tem um **rank ninja** (Genin, Chunin, Jounin...), que representa seu reconhecimento oficial na vila, e uma **reputação**, o número que mede o quanto ele já provou seu valor. O rank sobe quando a reputação atinge um limite e o personagem completa a missão de promoção correspondente.

> **Nomenclatura:** "rank" agora designa **somente** o rank ninja. A escala D a S usada por jutsus, inimigos e itens passa a se chamar **grau** (Apêndice C).

### Ranks

| Rank | Reputação necessária | Como é obtido |
|---|---|---|
| **Genin** | — | Rank inicial de todo personagem |
| Chunin | 1000 | Ao atingir a reputação, libera a Missão de Promoção a Chunin; concluí-la promove o personagem |
| Jounin | 4000 | Ao atingir a reputação, libera a Missão de Promoção a Jounin |
| Ranks futuros | — | Reservados para expansões (ex: ANBU, Kage) — Seção 20 |

### Como a reputação é ganha

- A cada inimigo derrotado, o jogador ganha reputação proporcional ao **grau do inimigo** (tabela na Seção 11).
- **Valores calibrados:** inimigo comum grau D = **22**, elite = **38**, chefe C = **160**, chefe B = **240**, chefe A = **400**.
- Com esses valores, quem completa a Saga da Onda (24 comuns + Zabuza + Haku) chega a cerca de **930 de reputação**; com 2 a 3 elites derrotados no caminho passa de **1000**. Quem ficar abaixo completa 1 "missão de grau D" opcional (3 encontros, ~70 de reputação) antes da promoção — sem grind obrigatório.
- O contador de reputação fica sempre visível, com uma barra de progresso até o próximo rank.

### Missão de promoção

Um encontro especial — um chefe ou uma sequência de encontros — que só fica disponível quando a reputação mínima é atingida. No Modo História, a Missão de Promoção a Chunin corresponde à entrada da saga do Exame Chunin (Seção 12).

### Benefícios de cada promoção

- Bônus fixo de pontos de atributo (à escolha do jogador): **+10 pontos ao virar Chunin, +15 ao virar Jounin**.
- Mais slots de jutsu: Genin 4 → Chunin 6 → Jounin 8 (Seção 8).
- A loja passa a oferecer itens de grau mais alto (Seção 11).
- Reconhecimento visual na interface (badge de rank ao lado do nome).

### O rank ninja não trava jutsus

O rank ninja é reconhecimento, bônus e acesso à loja, **não** é o que trava jutsus fortes — isso evita uma inconsistência com o anime, já que no próprio Naruto o protagonista aprende técnicas avançadas (como o Rasengan) ainda como Genin. Quem controla quando um jutsu pode ser aprendido é a combinação de atributo + saga da história (Seção 8).

### Escopo por run

Rank, reputação e ryo são da **run atual**: toda nova run começa como Genin, com reputação e ryo zerados. O que persiste entre runs está na Seção 15.

## 5. Criação de Personagem

### Versão do protótipo [F0/F1A]

| Campo | Descrição |
|---|---|
| Nome | Escolhido livremente |
| Clã | Uchiha, Uzumaki ou "Sem clã" (build livre, com a compensação da Seção 6) |
| Afinidade elemental | Ver regras abaixo |
| Distribuição inicial | **10 pontos extras** para distribuir entre os 8 atributos, além do bônus automático do clã |
| Título inicial [F1B] | Opcional: um título já desbloqueado em runs anteriores, que concede um pequeno buff durante a run (Seção 14) |

Todo personagem começa como **Genin** (Seção 4), no nível 1, com os atributos em 5 antes da distribuição.

### Regras de afinidade elemental

A afinidade define de qual natureza de chakra o personagem é "nativo". Ela existe para gerar escolhas reais sem trancar o jogador:

- **Escolha:** Fogo, Água, Vento ou Terra na Fase 1. O **Raio** entra na Fase 2, junto com o Chidori (não há jutsu de Raio disponível antes do Exame Chunin).
- **Uchiha:** afinidade **Fogo** fixa (herança do clã, ver Seção 6). Uzumaki e Sem clã escolhem livremente.
- **Jutsus elementais da afinidade:** custo normal e maestria até +5.
- **Jutsus elementais de outro elemento:** custo de chakra **+25%** e maestria máxima **+3**. Continuam aprendíveis (cumprindo os requisitos de atributo/saga), só ficam menos eficientes.
- **Sem clã ignora essa penalidade** (parte da compensação do caminho livre).
- **Jutsus neutros** (Kage Bunshin, Rasengan, Kawarimi, a maior parte de Taijutsu/Genjutsu/Fuinjutsu) não são afetados.
- **Segunda afinidade [F2]:** ao ser promovido a Chunin, o jogador escolhe uma segunda natureza (sem penalidade nela).
- **Naturezas combinadas (Kekkei Genkai) [Futuro]:** modelo previsto na Seção 7.

### Versão completa [F2+]

| Campo | Descrição |
|---|---|
| Aparência | Corpo, rosto, cabelo, cores (cosmético) |
| Clã | Define bônus de atributo inicial, passiva e pool de jutsus exclusivos |
| Natureza de Chakra | Fogo, Água, Vento, Raio, Terra, e combinações avançadas (Kekkei Genkai) |
| Vila | Cosmético/lore, sem impacto mecânico direto no protótipo |

---

## 6. Sistema de Clãs

Cada clã tem: uma **passiva** sempre ativa (ou sustentada), **dois atributos de destaque** (+1 automático por nível em cada um) e um **pool de 3 a 5 jutsus exclusivos**, com nomes fiéis ao anime (lista completa no Apêndice B).

Os valores marcados como **(simulado)** foram testados no simulador do Apêndice A. Os demais são estimativas a validar quando o clã entrar em jogo.

### Uzumaki [F1A]

- **Passiva (simulado):** +10% de HP máximo; "Meditar" recupera +20% a mais de chakra; Kage Bunshin no Jutsu custa −20% de chakra (afinidade natural, mas o jutsu continua geral).
- **Atributos de destaque:** HP, Inteligência.
- **Jutsus exclusivos:** Kongou Fuusa (Correntes de Chakra Adamantinas), Fuuinjutsu: Gogyou Fuuin (Selo dos Cinco Elementos, substitui o "Selo de Quatro Elementos" da versão anterior) e Hakke no Fuuin Shiki (Selo dos Oito Trigramas, jutsu de assinatura [F2+]).

### Uchiha [F1A]

- **Passiva sustentada — Sharingan (simulado, tomoe 1):** custa **2 chakra por turno** enquanto ativo; concede **+14% de Chance de Crítico, +10% de esquiva e +15% de dano de jutsus**. Acumula tomoe conforme o tempo ativo: **tomoe 2 [F2]** (após 40 turnos ativos na run) e **tomoe 3 [F2]** (após 120) aumentam os bônus e liberam a cópia parcial de jutsu inimigo.
- **Afinidade Katon:** afinidade Fogo fixa e **+15% de dano em jutsus de Fogo** (cumulativo com o Sharingan).
- **Atributos de destaque:** Genjutsu, Chance de Crítico.
- **Jutsus exclusivos:** Katon: Goukakyuu no Jutsu, Genjutsu: Sharingan, Katon: Ryuuka no Jutsu, Amaterasu, Tsukuyomi.
- **Ponto de atenção de balanceamento:** na Saga da Onda o Uchiha rende ~10 a 15 pontos percentuais abaixo dos outros clãs, porque os dois chefes são de Água (desvantagem para Fogo) e o simulador não mede o Genjutsu. Deixado assim de propósito: o clã cresce ao longo da campanha (mais inimigos sem Água) e deve ser revisto na Fase 2.

### Hyuuga [F2 — não simulado]

- **Passiva:** Byakugan sempre ativo, sem custo: +8% de Chance de Crítico e ignora 25% da Defesa do alvo.
- **Atributos de destaque:** Taijutsu, Chance de Crítico.
- **Jutsus exclusivos:** Jyuuken, Hakke Sanjuuni Shou, Kaiten, Hakke Rokujuuyon Shou.

### Nara [F2 — não simulado]

- **Passiva:** jutsus de sombra aplicam Controle (chance base 60%, 1 a 2 turnos), sempre sujeitos à Resistência ao Controle (Seção 10).
- **Atributos de destaque:** Inteligência, Velocidade.
- **Jutsus exclusivos:** Kagemane no Jutsu, Kagenui no Jutsu, Kage Kubishibari no Jutsu.

### Akimichi [F2 — não simulado]

- **Passiva:** +15% de HP máximo e −25% de dano de efeitos contínuos (queimadura/sangramento).
- **Atributos de destaque:** HP, Defesa.
- **Jutsus exclusivos:** Bubun Baika no Jutsu, Baika no Jutsu, Nikudan Sensha, Chou Baika no Jutsu.

### Aburame [F2 — não simulado]

- **Passiva:** a cada jutsu de Ninjutsu ou Taijutsu que acerta, os insetos drenam 4% do chakra máximo do inimigo e devolvem metade ao usuário.
- **Atributos de destaque:** Ninjutsu, Inteligência.
- **Jutsus exclusivos:** Kikaichuu no Jutsu, Mushi Bunshin no Jutsu, Mushidama.

### Sem clã [F0/F1A] — compensação definida

O caminho livre agora tem vantagens próprias (antes era estritamente pior que qualquer clã, pois os clãs também acessavam todos os jutsus gerais):

- **+1 ponto livre a mais por nível** (6 no total, em vez de 5 mais o bônus fixo de clã).
- **Sem penalidade de afinidade:** jutsus de qualquer elemento custam o normal.
- **Jutsus gerais custam −10% de chakra.**
- **A maestria de jutsus gerais sobe 25% mais rápido** (usos necessários × 0,75, arredondado para cima).
- Sem passiva e sem jutsus exclusivos de clã.

---

## 7. Sistema de Chakra e Elementos

### Chakra

Recurso compartilhado por todas as ações especiais.

- **Máximo:** `30 + 4·nível + Inteligência`.
- **Regeneração:** `2 + ⌊Inteligência/8⌋` por turno em que o personagem age.
- **Meditar:** passa o turno e recupera **25% do chakra máximo**.
- **Defender:** reduz em 50% o dano recebido até o próximo turno do personagem e recupera **10% do chakra máximo**. (As duas ações agora têm papéis distintos: Defender protege, Meditar recarrega.)
- **Entre encontros:** recupera 50% do chakra máximo. No Acampamento (antes de chefes), 100%.

### Roda de vantagem elemental

    Fogo → Vento → Raio → Terra → Água → Fogo

O elemento do atacante vence o do defensor: **dano ×1,3**. O contrário: **dano ×0,8**. Elementos não adjacentes são neutros (×1,0).

Implicações já conhecidas: os dois primeiros chefes (Zabuza e Haku) usam Água e, portanto, **Terra** é vantajosa contra eles e **Fogo** é desvantajoso. O gelo de Haku (Hyouton, Kekkei Genkai) conta como Água na Fase 1.

### Elemento é opcional — só existe quando existe na lore

Elemento é um campo opcional de cada jutsu. Um jutsu só tem elemento se, na obra, ele tem natureza de chakra:

- **Com elemento:** Katon: Goukakyuu no Jutsu e Bola de Fogo (Fogo), Suiton: Suiryuudan (Água), Fuuton: Daitoppa (Vento), Chidori (Raio), Doton: Doryuuheki (Terra).
- **Sem elemento (neutros):** Kage Bunshin no Jutsu, Bunshin no Jutsu, Kawarimi no Jutsu, Rasengan, e a maior parte de Taijutsu, Genjutsu e Fuinjutsu.

Jutsus neutros não participam da roda (modificador fixo em 1,0).

### Infusão elemental [Futuro]

Um jutsu neutro poderá, mais adiante, receber um elemento e se transformar em outro jutsu — o exemplo principal é o Rasengan com natureza Vento se tornando o Rasen Shuriken. O modelo de dados já prevê: cada jutsu tem elemento (pode ser nulo) e um campo opcional de infusões (elemento → jutsu resultante). Ver Seção 18 e Seção 20.

---

## 8. Sistema de Jutsus e Progressão

### Categorias

| Categoria | Atributo relacionado | Descrição |
|---|---|---|
| Ninjutsu | Ninjutsu | Dano à distância; pode ou não ter elemento |
| Taijutsu | Taijutsu | Combate corpo a corpo |
| Genjutsu | Genjutsu | Controle/debuff; quase sem dano direto |
| Fuinjutsu | Inteligência | Selos e suporte |

### Regra de desbloqueio

Todo jutsu tem até quatro possíveis requisitos, e precisa cumprir todos os que se aplicam a ele:

1. **Atributo mínimo** (atributo base) na categoria correspondente — alguns jutsus exigem dois atributos. Os valores seguem a tabela por grau da Seção 3.
2. **Clã** (apenas jutsus exclusivos de clã).
3. **Saga mínima** do Modo História — o ponto da campanha a partir do qual o jutsu passa a existir narrativamente. É isso que garante a fidelidade cronológica: um jutsu que só aparece no anime depois de determinado arco não pode ser aprendido antes, mesmo com o atributo alto. Por isso o Rasengan (saga mínima: Busca por Tsunade) não pode aparecer num confronto com Zabuza.
4. **Pré-requisito de jutsu** (opcional): ter aprendido outro jutsu antes. Exemplo: **Rasengan exige Kage Bunshin no Jutsu**, como na obra.

O nível do personagem não desbloqueia jutsu diretamente.

### Regra de Herança de clã

Jutsus básicos de clã podem receber a marca **Herança**: o personagem os aprende já a partir da Saga da Onda, ainda que na obra o portador canônico só os mostre mais tarde, porque o jogador cresce dentro da família. Vale só para técnicas básicas do clã (ex: Katon: Goukakyuu para o Uchiha, Kongou Fuusa para o Uzumaki, Jyuuken para o Hyuuga). **Jutsus de assinatura** (Amaterasu, Kaiten, Rokujuuyon Shou, Chou Baika etc.) seguem a cronologia do anime sem exceção.

### Descrição de cada jutsu

Todo jutsu tem uma descrição curta e fiel ao anime, exibida antes de o jogador escolher equipá-lo (tela de progressão e Enciclopédia). Ela cobre: o que faz mecanicamente, uma frase de contexto e o grau do jutsu.

### Requisitos e catálogo completo

A tabela completa de jutsus — com clã, requisitos, saga mínima, grau, custo de chakra, poder e efeito — está no **Apêndice B**. Exemplos icônicos (resumo):

| Jutsu | Categoria | Elemento | Clã | Requisito | Saga mínima | Grau |
|---|---|---|---|---|---|---|
| Bunshin no Jutsu | Ninjutsu | — | — | Nin 5 | Início | D |
| Kawarimi no Jutsu | Ninjutsu | — | — | Vel 8 | Início | D |
| Bola de Fogo Básica | Ninjutsu | Fogo | — | Nin 6 | Início | D |
| Katon: Goukakyuu no Jutsu | Ninjutsu | Fogo | Uchiha | Nin 12 | Início (Herança) | C |
| Kage Bunshin no Jutsu | Ninjutsu | — | — | Nin 20 | Onda | B |
| Chidori | Ninjutsu | Raio | — | Nin 30 + Vel 18 | Exame Chunin (treino) | A |
| Rasengan | Ninjutsu | — | — | Nin 32 + Int 15 (+ Kage Bunshin) | Busca por Tsunade | A |
| Amaterasu | Ninjutsu | — | Uchiha | Gen 40 + Nin 25 | Perseguição a Itachi | S |

### Filtragem de jutsus por combinação da run

A tela de progressão dentro de uma run mostra apenas os requisitos dos jutsus relevantes para aquele personagem: os jutsus gerais mais os exclusivos do clã escolhido. O jogador nunca vê, durante a run, requisitos de jutsus de outros clãs — isso fica reservado à Enciclopédia (Seção 13), o único lugar onde o pool completo aparece.

### Slots de jutsu

Só os jutsus **equipados** podem ser usados em batalha. O número de slots depende do rank ninja:

| Rank ninja | Slots de jutsu |
|---|---|
| Genin | 4 |
| Chunin | 6 |
| Jounin | 8 |

- Os jutsus aprendidos ficam no repertório (sem limite); só os equipados aparecem no menu de batalha.
- Ao aprender um jutsu novo com todos os slots ocupados, o jogo pergunta qual jutsu equipado será substituído (ou se o novo fica só no repertório).
- A troca de jutsus equipados é feita fora de batalha, para que montar o conjunto antes da luta seja uma decisão tática.
- A maestria é guardada por jutsu: se ele sai do slot e volta depois, o progresso continua.
- Ao ser promovido, os novos slots ficam livres para equipar.
- A ação básica "Atacar" não ocupa slot.

### Maestria de jutsu

Cada jutsu evolui com o uso, de +1 a +5, ficando mais barato, mais forte e mais confiável.

**Tabela recalibrada** (a anterior exigia 90 usos para o +5, o que era inalcançável em uma run da Saga da Onda):

| Maestria | Usos para subir | Usos acumulados |
|---|---|---|
| +1 | 6 | 6 |
| +2 | 9 | 15 |
| +3 | 12 | 27 |
| +4 | 15 | 42 |
| +5 (máxima) | 18 | 60 |

Efeito de cada nível (valores de referência):

- **Custo de chakra:** −5% por nível (−25% no +5).
- **Dano:** +3% por nível (+15% no +5).
- **Chance de efeito** (queimadura, imobilização etc.): +8% relativo por nível — no +5, uma chance base de 20% vira 28%. Jutsus sem efeito só ganham custo e dano.

Regras:

- Cada conjuração conta como um uso (acertando ou não), no máximo uma vez por turno.
- A maestria pertence à run: cada nova run recomeça no +0. O que persiste entre runs é o registro de "maestria máxima alcançada" de cada jutsu (Enciclopédia e títulos de domínio elemental, Seção 14).
- **Expectativa medida em simulação (Saga da Onda completa):** o jutsu mais usado chega, em média, a **+2 a +4**. O **+5** exige concentrar o uso em um jutsu ao longo de uma run inteira, o que o torna uma conquista e não um efeito colateral.
- Maestria não é o mesmo que grau do jutsu: o grau (D a S) é o nível de poder da técnica; a maestria é o quanto o jogador a dominou. Para evitar confusão com a moeda persistente, os "Pontos de maestria" da meta-progressão foram renomeados para **Pontos de Legado** (Seção 15).
- Os parâmetros (usos por nível, bônus por nível) ficam em dados de configuração, para calibrar sem mexer no código.


---

## 9. Sistema de Combate e Grau de Inimigos

### Formato

1x1 no protótipo; 3x3 anotado como possibilidade futura. Mesmo em 1x1, o motor trata a batalha como uma **lista de combatentes** (lados aliado e inimigo), e não como "um jogador contra um inimigo" fixo — isso deixa o caminho aberto para invocações e batalhas em equipe (Seções 18 e 20).

### Ordem de turno

Cada rodada, todo combatente age uma vez, do mais rápido para o mais lento. A ordem usa a **Velocidade efetiva com uma variação aleatória de até +10%**, recalculada a cada rodada — assim, uma pequena vantagem de Velocidade não garante iniciativa em todo turno, e a Velocidade deixa de ser "obrigatória". Alguns jutsus e itens têm **prioridade** e ignoram essa ordem.

### Ações por turno

| Ação | Descrição | Custo |
|---|---|---|
| Atacar | Golpe básico de Taijutsu, Poder 18, modificado pela arma equipada | 0 |
| Usar Jutsu | Jutsu equipado em um dos slots (Seção 8), dano escalado pelo atributo correspondente | Chakra |
| Defender | Reduz em **50%** o dano recebido até o próximo turno e recupera **10%** do chakra máximo | — |
| Meditar | Passa o turno e recupera **25%** do chakra máximo; não reduz dano | — |
| Usar Item | Consumíveis (pergaminho de reforço, pílula de chakra, kit médico etc.) | Nenhum (o item é gasto) |
| Trocar personagem | Apenas em modo equipe [Futuro] | 0 |

### Fórmula de dano (calibrada)

    Dano = Poder × (1 + Maestria) × (1 + Atributo/40) × Elemental × (1 + Título) × (1 − Redução) × Crítico × Variação

Todos os termos e constantes estão na tabela de fórmulas da Seção 3. Resumo dos pontos que mudaram: divisor do atributo passou de **100 para 40** (atributo ofensivo agora pesa de verdade), Redução passou de `Def/(Def+100)` para `Def/(Def+50)` com teto de 60%, o modificador elemental é **×1,3 / ×0,8**, e o Poder base é definido por grau (D 26, C 40, B 60, A 90, S 130).

### Chance de acerto

Não existe teste de precisão separado: um golpe **sempre tenta acertar**, e o defensor pode **esquivar** (fórmula na Seção 3, teto de 40%). Efeitos de "névoa" (ex: Kirigakure no Jutsu) somam bônus de esquiva ao usuário, sempre sob o mesmo teto.

### Recuperação entre encontros e Acampamento

| Momento | Recupera |
|---|---|
| Fim de cada encontro | 25% do HP máximo e 50% do chakra máximo |
| Subir de nível | +25% do HP máximo (extra) |
| **Acampamento** (antes de cada chefe) | HP e chakra 100% |
| Kit médico / pílula de chakra | +40% de HP / +50% de chakra (Seção 11) |

O Acampamento é o ponto de **checkpoint** da run: a run é salva automaticamente ali e a cada encontro concluído (Seção 18).

### Grau de inimigos

Todo inimigo — comum ou chefe — exibe um **grau de dificuldade/raridade**, usando a mesma escala D a S dos jutsus e itens.

| Grau | Tipo de inimigo | Exemplo |
|---|---|---|
| D | Bandidos e ninjas renegados sem clã (encontros comuns) | Bandido, Ninja Renegado, Mercenário da Névoa |
| D+ (Elite) | Variante de um comum, mais rara e mais recompensadora | Bandido Veterano |
| C | Primeiro chefe de saga | Zabuza Momochi |
| B | Chefe intermediário/segunda fase de saga | Haku |
| A | Chefe de arco maior | Gaara (Invasão de Konoha), Orochimaru |
| S | Chefe raro/final de fase avançada | Reservado para fases futuras |

### Escala de força dos inimigos (calibrada)

A força de um inimigo **não depende do nível real do jogador**, e sim do **nível de história do encontro** (a tabela do Apêndice A): assim, quem está com menos nível do que o esperado sente o risco, e quem está com mais é recompensado.

1. **Pontos totais de atributo** = `P(N) × razão do grau`, onde `P(N) = 50 + 7·(N−1)` (Seção 3).

| Grau | Razão | Multiplicador de HP máximo | Multiplicador de dano | Status |
|---|---|---|---|---|
| D | 0,70 | ×0,8 | ×0,60 | simulado |
| D+ (Elite) | 0,90 | ×1,0 | ×0,80 | não simulado (2 a 3 por saga, opcionais) |
| C | 1,10 | ×1,3 | ×0,72 | simulado |
| B | 1,20 | ×1,3 | ×0,80 | simulado |
| A | 1,35 | ×1,5 | ×0,90 | **não simulado** (estimativa) |
| S | 1,50 | ×1,7 | ×1,00 | **não simulado** (estimativa) |

2. Os pontos são distribuídos pelo **arquétipo** do inimigo (pesos no Apêndice A). Todos usam as mesmas fórmulas de HP, chakra, esquiva e crítico do jogador.
3. O "multiplicador de dano" é aplicado sobre o Poder dos golpes inimigos, e é o que faz um bandido comum tirar cerca de 20% a 25% do HP do jogador por luta, não mais.
4. Os blocos de status prontos da Saga da Onda estão no Apêndice A.

### IA de inimigos (protótipo)

1. Calcula o jutsu de maior dano esperado disponível (considerando chakra restante) e o usa, salvo exceções abaixo.
2. Se HP abaixo de 25%, prioriza um jutsu defensivo/de cura, se disponível.
3. Se o próprio elemento tem vantagem sobre o do jogador, prioriza jutsu elemental mesmo que não seja o de maior dano bruto.
4. Sem chakra para qualquer jutsu, ataca (recuperando chakra normalmente).
5. Chefes têm regras próprias: **Zabuza** abre com Kirigakure no Jutsu; **Haku** abre com Makyou Hyoushou; ambos mudam de padrão abaixo de 50% de HP (detalhado por chefe).

---

## 10. Efeitos, Buffs e Debuffs

Tudo que altera temporariamente o estado de um combatente — buff, debuff, controle, dano contínuo, técnica sustentada — é um **efeito**, tratado por um único sistema genérico. Isso vale para jutsus, itens, passivas de clã e ações de inimigos.

### Estrutura de um efeito

| Campo | Descrição |
|---|---|
| Nome e ícone | Como aparece na interface |
| Tipo | Buff, debuff ou controle |
| Alvo e fonte | Em quem está aplicado e o que o causou (jutsu, item, inimigo) |
| Modificadores | O que altera (ex: +10% Ninjutsu, −Velocidade, dano por turno, ação bloqueada) |
| Duração | Em turnos, até o fim da batalha, ou sustentado (ver abaixo) |
| Regra de acúmulo | Renova a duração, soma intensidade (com limite) ou não acumula |

### Tipos de duração

- **Por turnos:** expira após N turnos (ex: pergaminho de reforço por 5 turnos, queimadura por 3).
- **Até o fim da batalha:** dura enquanto a luta durar.
- **Sustentado:** permanece ativo enquanto o jogador continuar pagando o custo (ex: Sharingan, 2 chakra por turno); mostrado como "ativo" em vez de contagem de turnos.
- **Passivo da run:** dura a run inteira, sem contagem de turnos (ex: o buff do título ativo e as passivas de clã).

### Regras de balanceamento de efeitos (novas)

**Controle (Imobilizado, Atordoado, Paralisado, Ilusão) é o efeito mais perigoso do jogo**, porque, em 1x1, ficar sem agir é quase derrota. Por isso:

- **Duração máxima do controle:** 2 turnos em inimigos comuns e **1 turno em chefes**.
- **Tenacidade:** depois que um controle termina, o alvo fica **imune a novos controles por 2 turnos**. Isso impede "stun-lock" sem eliminar a estratégia.
- **Resistência de chefe:** a chance de aplicar controle em um chefe é **multiplicada por 0,5**.
- **Chance de aplicar controle** = `chance base do jutsu × (1 + Genjutsu/100 para ilusões) × (1 + bônus de maestria)`, limitada a **85%** (nunca garantido).
- **Um controle por vez:** aplicar outro controle enquanto há um ativo apenas renova o menor.
- **Dano contínuo (queimadura, sangramento):** 4% do HP máximo do alvo por turno, por 3 turnos, sem acumular intensidade (renova duração). *(Valor a calibrar: ainda não entrou no simulador.)*

### Exemplos

| Efeito | Tipo | Fonte | Duração (referência) |
|---|---|---|---|
| Reforço de Ninjutsu (+10%) | Buff | Pergaminho de Reforço | 5 turnos |
| Sharingan ativo | Buff | Passiva/ativa Uchiha | Sustentado (2 chakra por turno) |
| Névoa (+15% esquiva) | Buff | Kirigakure no Jutsu | 3 turnos |
| Queimadura | Debuff | Jutsus de Fogo | 3 turnos |
| Imobilizado | Controle | Kagemane no Jutsu, Kongou Fuusa, Genjutsu | 1 a 2 turnos (1 em chefes) |

### Exibição na interface

- Abaixo das barras de HP e Chakra de **cada lado** fica uma fileira de ícones com os efeitos ativos, com o **número de turnos restantes** (ou o símbolo de sustentado/duração de batalha).
- Ao tocar/passar o mouse, abre uma descrição curta do efeito e sua fonte.
- Buffs e debuffs têm cores/bordas distintas; **controle tem um ícone próprio** com o tempo de imunidade (Tenacidade) visível depois.
- Passivas de clã e o buff do título ativo aparecem em uma área separada, já que não expiram.

### Pensado para crescer

Esse sistema é a base de mecânicas futuras mais complexas: **Modo Sábio**, **invocações**, formas avançadas e técnicas sustentadas. Nenhuma delas entra na Fase 1, mas o sistema de efeitos deve ser escrito de forma genérica para recebê-las (Seção 20).

---

## 11. Economia e Loja

### Moeda: ryo

O ryo é a moeda do jogo. **Reputação** promove o personagem (Seção 4); **ryo** compra itens na loja.

### Recompensas por encontro (calibradas)

| Encontro | Ryo | Reputação | XP |
|---|---|---|---|
| Inimigo comum (grau D) | 30 | 22 | `8 + 4·N` |
| Inimigo elite (D+) | 50 | 38 | 1,6× o XP de um comum |
| Chefe grau C (ex: Zabuza) | 200 | 160 | 4× o XP de um comum |
| Chefe grau B (ex: Haku) | 300 | 240 | 4× o XP de um comum |
| Chefe grau A | 500 | 400 | 6× o XP de um comum *(estimativa)* |

(N = nível de história do encontro.) Ao final da Saga da Onda o jogador acumulou cerca de **1220 ryo** só com os encontros obrigatórios, mais o que vier de elites e missões opcionais.

### Preços de referência (Fase 1)

| Item | Grau | Efeito | Preço |
|---|---|---|---|
| Kit médico | D | Restaura 40% do HP máximo | 80 |
| Pílula de chakra | D | Restaura 50% do chakra máximo | 70 |
| Pergaminho de Reforço | D | +10% em um atributo por 5 turnos | 60 |
| Kunai | D | +2 Velocidade e +2 de Crítico (arma) | 250 |
| Colete ninja | D | +3 Defesa (armadura) | 300 |
| Katana | C | +4 Taijutsu (arma) | 600 |
| Colete reforçado | C | +5 Defesa e +3 HP (armadura) | 700 |
| Pergaminho Raro | Raro | +1 ponto permanente em um atributo (até +2 conforme o estoque) | 900 |

O orçamento de ~1220 ryo permite, por exemplo, colete + kunai + alguns consumíveis, **mas não** tudo: o jogador precisa escolher. O Pergaminho Raro (900) só cabe se ele abrir mão de quase todo o resto. *(A loja foi incluída no simulador só em forma simplificada: compra de colete, kunai, katana, kits e pílulas; o resto é estimativa.)*

### A loja

- Acessível **entre encontros**, a partir da tela de resultado de cada batalha.
- O estoque se renova a cada chefe e a cada saga; parte do estoque é sorteada por run.
- O **rank ninja do jogador define a qualidade do estoque**: Genin vê itens de grau D/C; Chunin passa a ver grau B; Jounin, grau A. Itens S só aparecem como recompensa rara.

### Categorias de itens

**1. Equipamentos** — bônus passivos leves, equipados em slots.

- **Protótipo: dois slots — Arma e Armadura** [F1A]. Novos slots entram depois (Seção 13, Tela de equipamento [F1B]).
- Armas: kunai (mais rápida, pequeno bônus de crítico) e espada/katana (mais pesada, bônus de Taijutsu). A arma equipada também modifica a ação básica "Atacar".
- Armaduras: colete ninja (Defesa) e variações mais resistentes em graus maiores (Defesa e um pouco de HP).
- Cada equipamento tem grau (D a S), que define em qual estoque da loja ele aparece.
- A troca de equipamento é feita fora de batalha.

**2. Consumíveis** — Pergaminho de Reforço (buff temporário), Pílula de chakra e Kit médico.

**3. Pergaminho Raro** — aumenta **permanentemente** e de forma leve um atributo (+1 ou +2 pontos).

- Estoque de **1 por loja**; também pode cair de chefes.
- Limite de **5 por run**, para o ganho permanente nunca ficar exponencial.
- Conta como atributo base, ou seja, **ajuda a desbloquear jutsus** (Seção 3).

### Princípio de balanceamento

Equipamentos e pergaminhos são um complemento, não a fonte principal de poder: a soma dos bônus de itens deve ficar em até cerca de **15% do total de pontos de atributo** do personagem (nível 9: ~16 pontos). O buff do título ativo é pequeno e único (Seção 14).

### Ao morrer

Ryo e reputação da run se perdem junto com a run. O que persiste entre runs está na Seção 15.

---

## 12. Modo História

O Modo História é o modo principal do jogo e segue a cronologia do anime, saga por saga. **A história avança por encontros, não por nível**: cada saga é uma sequência fixa de encontros, e o nível esperado de cada um vem da tabela do Apêndice A. (A regra antiga "chefe a cada 5 níveis" foi removida: ela conflitava com Haku no nível 9.)

### Estrutura de saga

- Cada saga define: uma lista ordenada de encontros (comuns aleatorizados dentro de um pool, chefes fixos), o nível de história de cada um, os chefes, e a lista de jutsus cuja "saga mínima" é aquele ponto da história.
- A saga também determina o cenário/tema visual (nome e paleta de cor já podem refletir o arco, mesmo com placeholders).
- **Duração-alvo:** a Saga da Onda tem **26 encontros** (cerca de 25 a 35 minutos por run).

### Saga da Onda — estrutura calibrada [F1A]

| Encontros | Nível esperado | Conteúdo | Chefe |
|---|---|---|---|
| 1 a 3 | 1 | Bandidos e ninjas renegados (grau D) | — |
| 4 a 6 | 2 | idem | — |
| 7 a 9 | 3 | idem | — |
| 10 a 12 | 4 | idem | — |
| **13** | 5 | Acampamento antes da luta (vencer leva o jogador ao nível 6) | **Zabuza Momochi (C)** |
| 14 a 16 | 6 | Mercenários da Névoa (grau D) | — |
| 17 a 19 | 7 | idem | — |
| 20 a 22 | 8 | idem | — |
| 23 a 25 | 9 | idem | — |
| **26** | 10 (sobe ao nível 11 ao vencer) | Acampamento antes da luta | **Haku (B)** |

Regra de ritmo: **três encontros comuns equivalem a um nível**. Elites (opcionais, 2 a 3 por saga, no lugar de um comum) e missões de grau D dão XP e reputação extras.

### Variação entre runs (proposta [F1B])

Para a saga não ser sempre idêntica, os comuns são sorteados de um pool e, após cada subida de nível, o jogador **escolhe 1 entre 3 recompensas** (um jutsu elegível novo, um Pergaminho de Reforço ou um kit). Entre encontros pode surgir um **evento** (loja ambulante, treino, descanso). Chefes ficam sempre fixos. *(Não simulado — é a principal alavanca de rejogabilidade, a validar em playtest.)*

### Sagas futuras (referência de planejamento, ordem canônica corrigida)

| Saga | Chefe/Marco de referência | Observação |
|---|---|---|
| Exame Chunin — Floresta da Morte e Preliminares | Orochimaru (aparição, não chefe obrigatório) | **Missão de Promoção a Chunin** (1000 de reputação); Chidori (treino de Kakashi) |
| Exame Chunin — Finais e Invasão de Konoha | **Gaara** (grau A) | Corrigido: na obra, Gaara é chefe aqui, e não na Recuperação do Kazekage |
| Busca por Tsunade | Kabuto (menor) e Orochimaru | Rasengan e Kuchiyose no Jutsu |
| Recuperação do Sasuke | Chefes do Som (grau B/A) | Fim da Parte I |
| Shippuden — Recuperação do Kazekage | Sasori e Deidara | Passa a existir a Parte II; Gaara é o resgatado |
| Shippuden — Perseguição a Itachi | Itachi | Amaterasu e Tsukuyomi |

A regra de ouro se mantém: **nenhum inimigo ou jutsu aparece antes do ponto da história em que ele existe na obra** (com a exceção controlada da Herança de clã, Seção 8).

### Modo Infinito (placeholder / WIP)

Um modo sem fim, sem amarras de cronologia — inimigos e jutsus de qualquer saga podem aparecer misturados, com dificuldade escalando indefinidamente. **Fora do escopo atual**; existe apenas como entrada de menu reservada (Seção 13).

---

## 13. Interface e Experiência do Jogador

> **Escopo por fase:** [F1A] menu principal, tela de batalha (com log), resultado e loja, Enciclopédia de Jutsus. [F1B] tela de equipamento com silhueta, Registro de Batalha completo. [F2] Livro Bingo. Recomendação técnica: telas de texto/tabela (Ficha, loja, Enciclopédia, histórico) em **HTML/CSS sobre o canvas**, e o Phaser só para a batalha (Seção 18).


### Menu principal (antes da criação de personagem)

| Opção                      | Função                                                                                                                                                                                                                                                                    |
|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Modo História**          | Leva à criação de personagem e início da campanha                                                                                                                                                                                                                         |
| **Modo Infinito**          | Exibido como "Em breve" — sem funcionalidade na Fase 1                                                                                                                                                                                                                    |
| **Jutsus (Enciclopédia)**  | Lista completa de todos os jutsus do jogo, com descrição, categoria, grau, requisitos de desbloqueio, e um marcador visual de "Desbloqueado" ou "Bloqueado" — gera uma sensação de coleção, como uma Pokédex de técnicas; jutsus já levados à maestria +5 recebem um selo |
| **Histórico de Runs**      | Ver Seção 16                                                                                                                                                                                                                                                              |
| **Livro Bingo** *(Fase 2)* | Registro permanente de todos os inimigos já encontrados, com página própria e silhueta "???" para os ainda não vistos (Seção 14)                                                                                                                                          |

A Enciclopédia é a única tela que mostra o pool completo de jutsus do jogo, independentemente do clã da run atual; o status "desbloqueado" é permanente (contabiliza qualquer jutsu que o jogador já tenha aprendido em qualquer run anterior).

### Tela de batalha

Layout inspirado em uma tela de referência de jogo de ninja em navegador, adaptado às regras deste jogo. Jogador à esquerda e inimigo à direita, frente a frente:

- **Retrato/sprite** de cada lado (placeholders na Fase 1).
- **Sob cada retrato:** nome, clã (ou tipo do inimigo) e título, nível, **Poder Ninja** (Seção 3) e as barras de **HP** e **Chakra**, sempre visíveis. O inimigo mostra também o **badge de grau D a S**.
- **Acima de cada retrato:** botão de atributos (abre a Ficha em modo consulta, Seção 14) e a **fileira de efeitos ativos**, com os turnos restantes em cada ícone e a descrição ao tocar/passar o mouse (Seção 10).
- **Indicadores rápidos** de cada lado: **Chance de Crítico** e **Redução de dano** atuais (valores efetivos, já com equipamento, título e buffs).
- **Centro:** indicador de turno ("Seu turno" / "Turno do inimigo") e o **log de batalha**, uma lista rolável do que aconteceu a cada turno (quem usou o quê, dano causado e recebido, crítico, esquiva, efeitos aplicados), com cores distintas para jogador, inimigo, dano, cura e efeitos.
- **Barra inferior:** ações básicas (**Atacar**, **Defender**, **Item**) e a fileira dos **jutsus equipados** (4, 6 ou 8 slots), cada um com ícone, custo de chakra e nível de maestria. Jutsu sem chakra suficiente aparece apagado, e selecionar um jutsu mostra a descrição curta antes de confirmar. **Trocar** só aparece em batalhas em equipe.
- **Sem cronômetro de turno** no single-player; um limite de tempo por turno só faz sentido no PvP futuro (Seção 17).

### Tela de resultado da batalha

Mostra ryo e reputação ganhos, experiência, eventual subida de nível (com distribuição de pontos) e o botão para visitar a **loja** antes do próximo encontro.

### Ficha do Ninja (status e atributos)

A tela de status é a aba **Atributos** da Ficha do Ninja (Seção 14), que também reúne perfil, jutsus, equipamento, registro de batalha e títulos. Pode ser aberta a qualquer momento pelo menu, inclusive durante a batalha (somente leitura, sem gastar turno).

### Tela de loja

Lista os itens do estoque atual por categoria (equipamentos, consumíveis, pergaminho raro), com preço em ryo, descrição e o efeito que causam. Itens de rank acima do que o jogador enxerga não aparecem.

### Tela de equipamento

Um inventário **só de equipamentos** (consumíveis ficam na ação "Item"), inspirado em uma tela de referência com a silhueta do personagem no centro:

- **Silhueta do ninja** no centro, com os **slots ao redor**, ligados por linhas a etiquetas com o nome do item equipado.
- **Fase 1:** dois slots — **Arma** e **Armadura**.
- **Slots planejados** para fases futuras, conforme o jogo avança: Bandana, Luvas, Calça, Botas e Pergaminho. Slots que ainda não existem não aparecem; os existentes e vazios aparecem escurecidos, com o contorno do tipo de item.
- Ao selecionar um slot, mostra o item equipado (nome, grau D a S, bônus e descrição) e a lista de equipamentos do mesmo tipo que o jogador possui, com a **comparação de bônus** (verde para melhora, vermelho para piora) antes de trocar.
- A troca é feita fora de batalha.
- Os bônus do que está equipado entram no atributo efetivo (Seção 3) e no Poder Ninja.
- Esta tela é também a aba **Equipamento** da Ficha do Ninja (Seção 14).

### Tela de jutsus da run (progressão)

Mostra apenas os jutsus relevantes à combinação clã + atributos da run atual (Seção 8), cada um com sua descrição, antes de o jogador escolher equipá-lo.

### Tela de slots de jutsu

Mostra os slots do rank atual (4, 6 ou 8) com os jutsus equipados e o repertório de jutsus aprendidos, cada um com nível de maestria e barra de progresso. É aqui que o jogador troca os jutsus equipados, e ela abre automaticamente quando ele aprende um jutsu novo com todos os slots ocupados (Seção 8). O menu de jutsus da batalha lista apenas os equipados, também com a maestria.

### Tela de criação de personagem

Preview 2D/3D simples, atualizado conforme escolha de clã e afinidade elemental.

### HUD fora de batalha

Mapa da run, inventário, árvore de habilidades do clã, tela de atributos.

---

## 14. Ficha do Ninja (Sumário)

> **Escopo por fase:** [F1B] abas Perfil, Atributos, Jutsus e Equipamento. As abas de **Registro de Batalha** e **Títulos** também são [F1B]. Títulos de maestria devem usar os limiares recalibrados da Seção 8 (o +5 exige concentrar uma run inteira em um jutsu).


Tela de consulta inspirada no Sumário do Pokémon: reúne tudo sobre o personagem em **abas**, com leitura rápida e visual. Pode ser aberta fora de batalha e, durante a batalha, em modo somente leitura (não gasta turno).

### Aba 1 — Perfil

- Nome, retrato, clã, afinidade elemental, nível e experiência até o próximo nível.
- **Poder Ninja** (Seção 3).
- Rank ninja e **barra de reputação** até o próximo rank (Seção 4).
- Título ativo (aba de Títulos), ryo, saga e nível atual da campanha, tempo de run.
- **Estilo de luta**: um rótulo calculado automaticamente a partir da distribuição de atributos (ex: "Especialista em Ninjutsu", "Lutador de Taijutsu", "Estrategista", "Equilibrado"). É só informativo.

### Aba 2 — Atributos

- Os 8 atributos com barras, mostrando **valor base e valor efetivo** lado a lado (Seção 3). Ao selecionar um atributo, aparece de onde vem cada bônus: clã, pergaminhos raros, equipamento e efeitos ativos.
- **Gráfico octogonal** (radar de 8 pontas) com o formato da build — o equivalente ao hexágono de status do Pokémon.
- HP e chakra atual/máximo, e valores derivados em porcentagem: chance de crítico, chance de esquiva e redução de dano pela Defesa.
- Pontos disponíveis para distribuir, com **pré-visualização** do resultado antes de confirmar.
- Lista de jutsus "quase desbloqueados" (faltando X pontos no atributo correspondente).

### Aba 3 — Jutsus

- Slots do rank atual (ex: 4/4) com os jutsus equipados e o repertório de jutsus aprendidos; a troca de jutsus equipados é feita aqui, fora de batalha.
- Cada jutsu mostra grau, descrição, custo de chakra (já com o desconto da maestria), elemento (se houver) e o **nível de maestria com barra de progresso** (Seção 8).
- Registro no estilo "local de encontro" do Pokémon: **onde e quando foi aprendido** (ex: "Aprendido no nível 7 — Saga da Onda"), quantas vezes foi usado e dano total causado.

### Aba 4 — Equipamento e Efeitos

- Silhueta com os equipamentos atuais (Arma e Armadura na Fase 1), como na Tela de equipamento (Seção 13), e os consumíveis no inventário.
- Pergaminhos raros aplicados (ex: 2/5) e os bônus permanentes que eles deram.
- Efeitos ativos de longa duração, quando houver (Seção 10).

### Aba 5 — Registro de Batalha

Estatísticas da run, com um alternador **"Esta run / Total"** (o total soma todas as runs):

- Inimigos derrotados (total e por grau D a S), inimigos elite e **chefes derrotados** (lista com marcador de conquistado).
- **Lista de inimigos derrotados** nesta run, agrupada por tipo, com contagem e o último derrotado.
- Dano total causado e sofrido, maior dano em um único golpe, número de críticos, jutsu mais usado.
- Turnos jogados, chakra gasto, ryo ganho e gasto, itens usados.
- Vitórias sem sofrer dano.

### Aba 6 — Títulos

Títulos são conquistas permanentes que também concedem um **pequeno buff** durante a run.

**Como funciona**

- Cada título tem uma condição de conquista. Ao cumpri-la, ele fica desbloqueado **para sempre** (persiste entre runs).
- Antes de começar uma run (na criação de personagem), o jogador **escolhe um título já desbloqueado** para usar naquela run — apenas um por vez, e pode trocar a cada nova run.
- O título escolhido aparece ao lado do nome e aplica seu buff durante a run inteira, como um efeito passivo (Seção 10).
- Títulos ainda não conquistados aparecem como "???" com a dica da condição, reforçando a sensação de coleção.

**Regras de balanceamento**

- Buffs pequenos (referência: 2% a 6%) e um único título ativo, sem acúmulo.
- O buff de título **nunca altera atributo base** — só modificadores de combate e economia (dano por tipo de jutsu, custo de chakra, esquiva, ryo, reputação etc.). Assim ele não abre jutsus novos (Seção 3).
- Como títulos persistem entre runs, são uma forma leve de meta-progressão (Seção 15).

**Títulos que evoluem (maestria elemental)**

Os títulos de maestria têm níveis. Cada vez que o jogador leva um jutsu **diferente** do mesmo elemento à maestria +5, em qualquer run, o título sobe de nível e o buff aumenta. Exemplo com a linha do Fogo (nomes e valores de referência):

| Nível | Título            | Condição                                   | Buff                          |
|-------|-------------------|--------------------------------------------|-------------------------------|
| 1     | Iniciante do Fogo | Maestria +5 em 1 jutsu de Fogo             | +2% de dano em jutsus de Fogo |
| 2     | Adepto do Fogo    | Maestria +5 em 2 jutsus de Fogo diferentes | +4% de dano em jutsus de Fogo |
| 3     | Mestre do Fogo    | Maestria +5 em 3 jutsus de Fogo diferentes | +6% de dano em jutsus de Fogo |

A mesma estrutura vale para Água, Vento, Raio e Terra. Linhas por categoria (Taijutsu, Genjutsu, Fuinjutsu) também são possíveis (a confirmar).

**Títulos de feito**

| Título              | Condição                                 | Buff (referência)               |
|---------------------|------------------------------------------|---------------------------------|
| Demônio da Névoa    | Derrotar Zabuza Momochi                  | +3% de chance de esquiva        |
| Caçador de Bandidos | Derrotar 30 inimigos de grau D           | +5% de ryo recebido             |
| Sem um Arranhão     | Vencer um chefe sem sofrer dano          | +2% de redução de dano recebido |
| Por um Fio          | Vencer um chefe com menos de 10% de HP   | +3% de Chance de Crítico        |
| Colecionador        | Aplicar 5 pergaminhos raros na mesma run | −5% de preço na loja            |
| Mestre de Jutsus    | Ter 10 jutsus aprendidos na mesma run    | −3% de custo de chakra          |
| Novo Chunin         | Ser promovido a Chunin                   | +5% de reputação recebida       |

**Títulos exclusivos (futuro)**

O sistema deve permitir títulos de outros tipos: exclusivos de eventos criados pelo desenvolvedor, conquistas raras e afins. Por isso cada título é só **dado** (id, nome, condição, níveis e buff, e um marcador de "exclusivo/evento"), e adicionar um novo não exige código novo (Seção 18).

### Livro Bingo (registro permanente de inimigos — Fase 2)

Enquanto a aba de Registro de Batalha mostra os inimigos derrotados **nesta run**, o Livro Bingo é o registro **permanente**, de todas as runs, inspirado no Livro Bingo da série. Fica no menu principal, como a Enciclopédia de Jutsus.

- Uma página por inimigo já encontrado: nome, rank, saga, elemento, jutsus que usa, quantas vezes foi derrotado e quantas vezes derrotou o jogador, e a recompensa em ryo.
- Inimigos ainda não encontrados aparecem como silhueta "???", reforçando a sensação de coleção.
- Apenas o **nome** faz referência à série; toda a arte continua original (regra de ouro da Seção 18).

### Ideias adicionais (a confirmar)

- **Linha do tempo da run**: marcos em ordem (primeira vitória, subida de nível, promoção, chefes derrotados, pergaminhos raros).
- **Informação do inimigo que se revela aos poucos**: o Livro Bingo preenche mais detalhes conforme o inimigo é derrotado mais vezes; Byakugan, Sharingan ou Inteligência alta poderiam revelar mais durante a batalha.
- **Aba de rival**: quando o sistema de rival existir (Fase 2), um histórico de confrontos com ele.
- **Cartão do Ninja exportável**: a ficha como imagem para compartilhar (fase posterior).

### Como funciona por baixo

Nada disso exige que o motor de combate conheça a interface: o motor emite **eventos** (inimigo derrotado, dano causado, jutsu usado, chefe vencido etc.) e um rastreador de estatísticas os contabiliza. A ficha, os títulos e o Livro Bingo só leem esses números (Seção 18).


---

## 15. Progressão do Personagem e Meta-Progressão

### Dentro da run

- Nível aumenta por experiência de batalha (curva do Apêndice A); cada nível concede **5 pontos de atributo livres** (6 no Sem clã) e +2 automáticos nos atributos de destaque do clã.
- Jutsus são desbloqueados automaticamente ao cumprir os requisitos de atributo base, clã, saga e pré-requisito (Seção 8).
- Reputação aumenta a cada inimigo derrotado; ao atingir o limite, libera a missão de promoção de rank (Seção 4).
- Ryo é acumulado e gasto na loja (Seção 11).
- A run é salva automaticamente a cada encontro concluído e no Acampamento (Seção 18).

### Entre runs (meta-progressão)

- **Desbloqueios permanentes de clã** [F2]: novos clãs jogáveis são liberados por conquistas em runs anteriores.
- **Pontos de Legado** [F2]: moeda persistente ganha ao final de cada run (proporcional ao progresso), gasta em upgrades passivos permanentes. *(Antes chamada "Pontos de maestria"; renomeada para não colidir com a maestria de jutsu.)*
- **Cosméticos** [F2]: aparências e efeitos visuais de jutsu desbloqueados permanentemente.
- **Coleção de jutsus (Enciclopédia)** [F1A]: todo jutsu já aprendido em qualquer run fica marcado como "Desbloqueado" para sempre.
- **Histórico de runs** [F1B] (Seção 16).
- **Títulos, estatísticas vitalícias e Livro Bingo** [F1B/F2]: permanentes; o **título ativo** é escolhido a cada nova run e concede um pequeno buff (Seção 14).
- **Maestria máxima por jutsu**: o registro dos jutsus que já chegaram ao +5 é permanente (Enciclopédia e títulos de domínio); a maestria em si recomeça a cada run (Seção 8).

Ryo, reputação, rank ninja, equipamentos, itens e maestria dos jutsus são **da run** e se perdem ao final dela.


---

## 16. Histórico de Runs

> **[F1B]**

Uma tela de menu dedicada, listando as runs anteriores do jogador, cada uma com:

- Data da run.
- Clã escolhido.
- Nível, rank ninja e reputação alcançados.
- **Saga e ponto exato onde o personagem morreu** (ex: "Morreu na Saga da Onda, nível 4, para um Mercenário da Névoa" ou "Morreu para Zabuza Momochi").
- Quantidade de encontros vencidos antes da morte.
- Um **snapshot da Ficha do Ninja** daquela run (atributos finais, jutsus, estatísticas), que pode ser aberto a partir da entrada do histórico.

Esse histórico é persistido junto com a meta-progressão (Seção 15) e serve tanto como registro pessoal quanto como gancho de replayability ("dessa vez eu passo do Zabuza").


---

## 17. Modo Online (Futuro)

> **[F4]** Requisito já previsto na arquitetura: sorteios reprodutíveis por semente (Seção 18), que permitem replays e validação no servidor.

Fora do escopo do protótipo, mas considerado na arquitetura desde o início.

- PvP 1x1 ou em equipe, reaproveitando a mesma lógica de combate do single-player.
- Sincronização de turnos via servidor autoritativo (o servidor valida ações, não o cliente).
- Matchmaking simples inicialmente, evoluindo para ranking.
- **Cronômetro por turno** no PvP: quem não age dentro do tempo perde o turno (ou a partida, por inatividade). Não existe no single-player.
- Persistência de personagem em nuvem — necessária mesmo antes do online, para salvar progresso entre sessões.

### Recomendação de arquitetura

Separar desde o início a **lógica de combate (regras do jogo)** da **camada de apresentação (interface)**, para que o mesmo motor sirva tanto o modo local quanto o futuro modo online.


---

## 18. Arquitetura Técnica

### Engine: Phaser 3 (batalha) + HTML/CSS (telas de menu)

Phaser 3 roda 100% no navegador e é bom para a cena de batalha. Já as telas cheias de texto e tabelas (Ficha com abas, loja, Enciclopédia, histórico de runs) são bem mais rápidas de construir e manter em **HTML/CSS sobre o canvas** do que em objetos do Phaser. Isso reduz muito o escopo de F1B. O mesmo código pode depois ser empacotado para desktop/mobile (Electron/Capacitor).

### Linguagem: TypeScript · Bundler: Vite · Pacotes: pnpm ou npm

Tipagem ajuda num projeto com muitas entidades: clãs, jutsus, atributos, sagas, efeitos, itens.

### Persistência e salvamento

- **Meta-progressão** (enciclopédia, histórico, títulos, Legado): localStorage no início; conta em nuvem quando o online entrar.
- **Run em andamento (novo):** **salvamento automático** a cada encontro concluído e no Acampamento, com opção "Continuar run" no menu. Fechar a aba não perde a run. Morte apaga o save da run (permadeath), mas grava o Histórico.
- Todos os dados salvos têm **número de versão** e funções de migração, para que novas features não quebrem saves antigos.

### Aleatoriedade com semente (novo)

Todo sorteio (variação de dano, crítico, esquiva, ordem de turno, escolha de inimigos, estoque da loja) usa um **gerador pseudoaleatório com semente**, guardada na run. Isso dá: testes automatizados determinísticos, reprodução de bugs, replays e validação em servidor no futuro.

### Simulador de balanceamento headless (novo)

O motor de regras roda sem interface, então existe um **simulador** que joga milhares de runs automáticas por combinação de clã e build e reporta taxa de vitória, HP ao fim de cada luta e duração dos combates. **Toda mudança de constante ou de conteúdo deve ser conferida contra ele** antes de entrar. As metas e os resultados de referência estão no Apêndice A.

### Validação de dados e i18n (novo)

- Todo arquivo de dados (jutsus, itens, inimigos, sagas) é validado por **esquema** (ex: Zod/JSON Schema) ao carregar; erro de digitação em requisito ou custo falha cedo.
- Textos (nomes, descrições, log) vivem em **chaves de tradução**, não fixos no código, mesmo que só exista PT-BR agora.

### Estratégia de assets (sem arte própria por enquanto)

**Fase 1 — placeholders**: formas coloridas com o nome escrito em cima. **Fase 2 — sprites** originais ou de fontes livres/licenciadas (Kenney.nl, OpenGameArt.org, itch.io, Piskel).

**Regra de ouro:** nunca usar sprites/artes oficiais de Naruto. Nomes e descrições seguem a lore; a representação visual é sempre original. **Projeto de fã, sem monetização** (nem doações ligadas ao jogo). Nomes, personagens e a marca também são protegidos por direitos autorais, então uma divulgação pública deve considerar esse risco (Apêndice D).

### Arquitetura de código

1. **Dados (JSON/TS)** — clãs, jutsus (requisitos de atributo/clã/saga/pré-requisito, descrição, `elemento` opcional, infusões), atributos, efeitos, itens, títulos, sagas, inimigos e graus, **e o arquivo de constantes de balanceamento** (todas as fórmulas do Apêndice A). Regra prática: adicionar jutsu, item ou inimigo é só adicionar dados.
2. **Motor de regras** — testável sem interface, como máquina de estados.
    - Combate sobre uma **lista de combatentes**.
    - Efeitos por um **sistema genérico** (Seção 10), com Tenacidade e resistência de chefe.
    - Recompensas e economia em módulo próprio.
    - Estatísticas, títulos e Livro Bingo alimentados por **eventos** do motor.
    - Slots de jutsu e maestria em módulos próprios.
3. **Apresentação** — cenas do Phaser (batalha) e telas HTML/CSS, apenas renderizando o estado do motor.

### Testes

O motor deve ter testes automatizados (dano, efeitos, desbloqueio, recompensas, economia), e o simulador acima funciona como teste de regressão de balanceamento.


---

## 19. Estrutura Sugerida do Projeto

> Acrescentar: `src/game/Rng.ts` (sorteio com semente), `src/game/Balance.ts` (constantes), `tools/simulate.ts` (simulador headless) e `src/ui-dom/` (telas em HTML/CSS).

    narutoTXgame/
    ├── src/
    │   ├── scenes/
    │   │   ├── BootScene.ts
    │   │   ├── MainMenuScene.ts
    │   │   ├── EncyclopediaScene.ts
    │   │   ├── RunHistoryScene.ts
    │   │   ├── BestiaryScene.ts      # Livro Bingo (Fase 2)
    │   │   ├── CharacterCreateScene.ts
    │   │   ├── NinjaSheetScene.ts    # Ficha do Ninja (abas)
    │   │   ├── ShopScene.ts
    │   │   ├── EquipmentScene.ts     # tela de equipamento (silhueta + slots)
    │   │   ├── BattleResultScene.ts
    │   │   └── BattleScene.ts
    │   ├── data/
    │   │   ├── clans/
    │   │   ├── jutsus/          # requisitos de atributo/clã/saga, descrição, elemento opcional, infusões
    │   │   ├── effects/         # buffs, debuffs e controles
    │   │   ├── titles/          # títulos e condições de conquista
    │   │   ├── items/           # equipamentos, consumíveis, pergaminhos
    │   │   ├── attributes/
    │   │   ├── elements/
    │   │   ├── sagas/           # inimigos, chefes e graus por saga
    │   │   └── ...
    │   ├── game/
    │   │   ├── CombatSystem.ts
    │   │   ├── EffectSystem.ts
    │   │   ├── Character.ts
    │   │   ├── AttributeSystem.ts
    │   │   ├── JutsuUnlockSystem.ts
    │   │   ├── JutsuLoadout.ts      # slots por rank
    │   │   ├── JutsuMastery.ts      # maestria por uso
    │   │   ├── NinjaRankSystem.ts   # rank + reputação + missões de promoção
    │   │   ├── EconomySystem.ts     # ryo, recompensas, loja
    │   │   ├── EquipmentSystem.ts   # slots e bônus de equipamento
    │   │   ├── Clans.ts
    │   │   ├── SagaManager.ts
    │   │   ├── RunManager.ts
    │   │   ├── RunHistoryLog.ts
    │   │   ├── RunStatsTracker.ts   # estatísticas da run e vitalícias
    │   │   ├── TitleSystem.ts
    │   │   ├── BestiarySystem.ts    # Livro Bingo (Fase 2)
    │   │   └── ...
    │   ├── ui/
    │   └── index.ts
    ├── assets/
    │   ├── placeholders/
    │   ├── sprites/
    │   └── effects/
    ├── docs/
    │   └── DESIGN.md
    ├── public/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── .gitignore
    └── README.md


---

## 20. Visão de Longo Prazo

A ambição do projeto é ir crescendo aos poucos até cobrir toda a lore de Naruto — e possivelmente chegar até Boruto — acrescentando jutsus, mecânicas e sagas de forma gradual. Nada disso faz parte das Fases 1 a 4; este capítulo existe para que as decisões de hoje (modelo de dados, motor de combate) não bloqueiem o que vem depois.

### Princípio: estabilidade antes de expansão

Cada camada nova só entra quando a anterior está funcionando de forma sólida e testada. Adicionar conteúdo (jutsus, sagas, inimigos) deve ser barato; adicionar **mecânicas** novas deve ser feito uma de cada vez.

### Backlog de longo prazo (sem prazo definido)

| Ideia                                                         | O que a torna possível (já previsto na arquitetura)                              |
|---------------------------------------------------------------|----------------------------------------------------------------------------------|
| **Infusão elemental** (ex: Rasengan + Vento → Rasen Shuriken) | Campo `elemento` opcional e mapa de infusões nos dados do jutsu (Seção 7)        |
| **Invocações**                                                | Combate baseado em lista de combatentes + efeitos com duração (Seções 9 e 10)    |
| **Modo Sábio** e outras formas/modos especiais                | Sistema de efeitos genérico com estados de duração/condição própria (Seção 10)   |
| **Kekkei Genkai avançados e naturezas combinadas**            | Elemento como dado, roda elemental extensível (Seção 7)                          |
| **Dojutsu evoluídos** (Mangekyou, Rinnegan etc.)              | Mecânica ativa de clã com evolução por estágios, como o Sharingan/tomoe          |
| **Jinchuuriki e modos de Bijuu**                              | Efeitos sustentados + combatentes especiais                                      |
| **Fuinjutsu avançado**                                        | Categoria Fuinjutsu já existente e atrelada a Inteligência                       |
| **Ranks ninja avançados** (ex: ANBU, Kage)                    | Sistema de rank/reputação em tabela de dados (Seção 4)                           |
| **Novas partes da história**: Shippuden e, depois, Boruto     | Estrutura de sagas em dados + requisito de saga mínima por jutsu (Seções 8 e 12) |
| **Títulos exclusivos de evento**                              | Títulos como dados, com marcador de exclusivo/evento (Seção 14)                  |


---

## 21. Roadmap por Fases

### Fase 0 — Fatia vertical [F0]

1. Ambiente (Phaser 3 + Vite + TypeScript), Rng com semente e arquivo de constantes.
2. Atributos, XP e níveis (Apêndice A), rank/reputação em dados.
3. Motor de combate 1x1 completo (Seção 9) + efeitos básicos + log de batalha.
4. Criação simples, 1 clã + Sem clã, jutsus gerais de Fase 1 (Apêndice B).
5. Encontros 1 a 13 (até Zabuza), loja mínima, salvamento da run.
6. **Simulador headless** rodando as metas do Apêndice A.

### Fase 1A — Núcleo da Saga da Onda [F1A]

7. Saga completa (26 encontros), Haku, Acampamento, Uchiha e Uzumaki completos, Sem clã compensado.
8. Reputação, ryo, loja e equipamento (Arma e Armadura), slots (4) e maestria.
9. Menu principal e Enciclopédia de Jutsus.

### Fase 1B — Camadas adicionais [F1B]

10. Ficha do Ninja, Registro de Batalha, Títulos com buff, Histórico de Runs, Pergaminho Raro, tela de equipamento.
11. Variação entre runs (escolha de 1 entre 3 recompensas e eventos) validada em playtest.

### Fase 2

- Saga do Exame Chunin com **Missão de Promoção a Chunin** (1000 de reputação), 6 slots, segunda afinidade, Raio e Chidori; Orochimaru na Floresta da Morte; Gaara na Invasão.
- Clãs Hyuuga, Nara, Akimichi e Aburame; Sharingan tomoe 2 e 3.
- Meta-progressão completa (Pontos de Legado, clãs), novos slots de equipamento, Livro Bingo, rival, jutsus combinados.

### Fase 3

- Busca por Tsunade (Rasengan, Kuchiyose), Recuperação do Sasuke, promoção a Jounin (8 slots), elites e equipamentos de grau mais alto, balanceamento completo por simulação (graus A e S).

### Fase 4 — Online

- Modo Infinito, backend multiplayer, matchmaking e ranking, draft de clã no PvP, replays assíncronos (usando a semente da run).

### Fases futuras (5+)

Infusão elemental, invocações, Modo Sábio, formas avançadas, Shippuden e Boruto — uma mecânica de cada vez, só depois da anterior estar estável (Seção 20).

---

> *"A verdadeira força não está apenas no poder dos jutsus, mas na vontade de proteger aqueles que amamos."*


---

## Apêndice A — Tabelas de Balanceamento e Simulação

### A.1 Curva de XP e níveis

`XP para subir do nível N para N+1 = 24 + 12·N` · `XP de um comum de nível N = 8 + 4·N` · `elite = 1,6×` · `chefe = 4×` · **3 comuns = 1 nível**.

| Nível | XP p/ próximo | XP acumulado | Pontos totais esperados P(N) | HP (ref.) | Chakra (ref.) |
|---|---|---|---|---|---|
| 1 | 36 | 0 | 50 | 114 | 40 |
| 2 | 48 | 36 | 57 | 124 | 44 |
| 3 | 60 | 84 | 64 | 134 | 48 |
| 4 | 72 | 144 | 71 | 144 | 52 |
| 5 | 84 | 216 | 78 | 154 | 57 |
| 6 | 96 | 300 | 85 | 164 | 61 |
| 7 | 108 | 396 | 92 | 174 | 65 |
| 8 | 120 | 504 | 99 | 184 | 69 |
| 9 | 132 | 624 | 106 | 194 | 74 |
| 10 | 144 | 756 | 113 | 204 | 78 |
| 11 | 156 | 900 | 120 | 214 | 82 |
| 12 | 168 | 1056 | 127 | 224 | 86 |
| 15 | 204 | 1596 | 148 | 254 | 99 |
| 20 | 264 | 2736 | 183 | 304 | 120 |
| 25 | 324 | 4176 | 218 | 354 | 142 |
| 30 | 384 | 5916 | 253 | 404 | 163 |

HP e chakra de referência usam a build "Especialista em Ninjutsu" (abaixo). Para o Uzumaki, multiplicar o HP por 1,10.

### A.2 Build de referência (Especialista em Ninjutsu, clã Uchiha)

Distribuição dos pontos livres: **Ninjutsu 40% · HP 20% · Defesa 15% · Velocidade 15% · Crítico 5% · Inteligência 5%**, mais +1 Genjutsu e +1 Crítico por nível (destaques do clã).

| Nível | HP | Tai | Nin | Gen | Vel | Int | Crit | Def | Soma | Crítico % | Redução % |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 7 | 5 | 9 | 5 | 7 | 6 | 5 | 6 | 50 | 3.8 | 10.7 |
| 3 | 9 | 5 | 13 | 7 | 8 | 6 | 8 | 8 | 64 | 5.9 | 13.8 |
| 5 | 11 | 5 | 17 | 9 | 10 | 7 | 10 | 9 | 78 | 7.1 | 15.3 |
| 7 | 13 | 5 | 21 | 11 | 11 | 7 | 13 | 11 | 92 | 8.9 | 18.0 |
| 9 | 15 | 5 | 25 | 13 | 13 | 8 | 15 | 12 | 106 | 10.0 | 19.4 |
| 12 | 18 | 5 | 31 | 16 | 15 | 8 | 19 | 15 | 127 | 12.0 | 23.1 |
| 15 | 21 | 5 | 37 | 19 | 17 | 9 | 23 | 17 | 148 | 13.9 | 25.4 |
| 20 | 26 | 5 | 47 | 24 | 21 | 10 | 29 | 21 | 183 | 16.3 | 29.6 |

(Os valores de Crítico % e Redução % não incluem bônus fixos de clã ou equipamento.)

### A.3 Cronograma da Saga da Onda (encontros, nível de história e recompensas acumuladas)

| Enc. | Tipo | Nível do inimigo | XP ganho | Nível do jogador ao fim | Reputação acum. | Ryo acum. |
|---|---|---|---|---|---|---|
| 1 | Comum (D) | 1 | 12 | 1 | 22 | 30 |
| 2 | Comum (D) | 1 | 12 | 1 | 44 | 60 |
| 3 | Comum (D) | 1 | 12 | 2 | 66 | 90 |
| 4 | Comum (D) | 2 | 16 | 2 | 88 | 120 |
| 5 | Comum (D) | 2 | 16 | 2 | 110 | 150 |
| 6 | Comum (D) | 2 | 16 | 3 | 132 | 180 |
| 7 | Comum (D) | 3 | 20 | 3 | 154 | 210 |
| 8 | Comum (D) | 3 | 20 | 3 | 176 | 240 |
| 9 | Comum (D) | 3 | 20 | 4 | 198 | 270 |
| 10 | Comum (D) | 4 | 24 | 4 | 220 | 300 |
| 11 | Comum (D) | 4 | 24 | 4 | 242 | 330 |
| 12 | Comum (D) | 4 | 24 | 5 | 264 | 360 |
| 13 | **Zabuza (C)** | 5 | 112 | 6 | 424 | 560 |
| 14 | Comum (D) | 6 | 32 | 6 | 446 | 590 |
| 15 | Comum (D) | 6 | 32 | 6 | 468 | 620 |
| 16 | Comum (D) | 6 | 32 | 7 | 490 | 650 |
| 17 | Comum (D) | 7 | 36 | 7 | 512 | 680 |
| 18 | Comum (D) | 7 | 36 | 7 | 534 | 710 |
| 19 | Comum (D) | 7 | 36 | 8 | 556 | 740 |
| 20 | Comum (D) | 8 | 40 | 8 | 578 | 770 |
| 21 | Comum (D) | 8 | 40 | 8 | 600 | 800 |
| 22 | Comum (D) | 8 | 40 | 9 | 622 | 830 |
| 23 | Comum (D) | 9 | 44 | 9 | 644 | 860 |
| 24 | Comum (D) | 9 | 44 | 9 | 666 | 890 |
| 25 | Comum (D) | 9 | 44 | 10 | 688 | 920 |
| 26 | **Haku (B)** | 10 | 192 | 11 | 928 | 1220 |

Nível de história = nível do jogador **ao entrar** no encontro, no ritmo esperado (só comuns, sem elites). Reputação final: 928. Ryo final: 1220.

### A.4 Arquétipos e blocos de inimigos da Saga da Onda

Pesos dos pontos totais por arquétipo (soma 100%):

| Arquétipo | HP | Tai | Nin | Gen | Vel | Int | Crit | Def |
|---|---|---|---|---|---|---|---|---|
| Bruto (Bandido) | 22% | 25% | 4% | 2% | 12% | 5% | 10% | 20% |
| Ninja (Renegado / Mercenário) | 18% | 18% | 20% | 3% | 14% | 7% | 8% | 12% |
| Espadachim (Zabuza) | 20% | 22% | 18% | 4% | 12% | 6% | 8% | 10% |
| Ágil (Haku) | 12% | 10% | 24% | 4% | 28% | 6% | 10% | 6% |

**Blocos prontos** (pontos = P(N) × razão do grau; HP com multiplicador do grau):

| Inimigo | Nível | Grau | Pontos | HP | Chakra | Atributos (HP/Tai/Nin/Gen/Vel/Int/Crit/Def) | Golpes (Poder efetivo já com multiplicador) |
|---|---|---|---|---|---|---|---|
| Bandido | 1 | D | 41 | 94 | 37 | 8/9/3/3/4/3/4/7 | Atacar (18), Golpe Pesado (24, 8 chakra) × 0,60 |
| Bandido | 4 | D | 53 | 118 | 49 | 11/12/3/3/6/3/5/10 | idem |
| Ninja Renegado | 4 | D | 51 | 112 | 49 | 9/9/10/3/7/3/4/6 | Atacar (18), Kunai Lançada (22, 6 chakra) × 0,60 |
| Mercenário da Névoa | 6 | D | 61 | 128 | 58 | 11/11/12/3/8/4/5/7 | idem |
| Mercenário da Névoa | 9 | D | 74 | 148 | 71 | 13/13/15/3/10/5/6/9 | idem |
| Bandido Veterano (Elite) | 5 | E | 72 | 170 | 54 | 15/18/3/3/8/4/7/14 | como o Bandido × 0,80 |
| **Zabuza Momochi** | 5 | C | 85 | 231 | 55 | 17/19/15/3/10/5/7/9 | Kubikiribouchou (30), Kirigakure (buff +15% esquiva, 3 turnos, 12 chakra), Suiton: Suiryuudan (60, 22, Água), Muon Satsujin (45, 18) × 0,72 |
| **Haku** | 10 | B | 136 | 265 | 78 | 16/14/33/5/38/8/14/8 | Senbon (30), Makyou Hyoushou (buff +25% esquiva, 3 turnos, 14 chakra), Sensatsu Suishou (55, 20, Água) × 0,80 |

### A.5 Resultados da simulação de referência

Simulador headless de runs completas da Saga da Onda (26 encontros), com 3000 runs por linha. O "jogador" é um robô simples: usa o jutsu de maior dano que o chakra permite, medita quando falta chakra, bebe kit médico abaixo de 35% de HP, usa pílula de chakra nos chefes, defende abaixo de 25% de HP sem kit, e compra itens numa ordem fixa (colete, kunai, consumíveis, katana). Não usa controle, buffs, Genjutsu nem escolha de elemento fina. **Um humano deve se sair melhor.**

| Build | Clã | Chega a Zabuza | Vence Zabuza | Completa a saga | Rodadas (Zabuza / Haku / comum) | HP médio ao fim de um comum | Maestria máx. média |
|---|---|---|---|---|---|---|---|
| Especialista em Ninjutsu | Uchiha | 100% | 49% | **39%** | 7.5 / 6.9 / 2.6 | 85% | +2.1 |
| Especialista em Ninjutsu | Uzumaki | 99% | 58% | **51%** | 7.0 / 7.8 / 3.1 | 80% | +2.8 |
| Especialista em Ninjutsu | Sem clã | 100% | 57% | **46%** | 6.8 / 6.3 / 2.7 | 82% | +2.8 |
| Lutador de Taijutsu | Uchiha | 100% | 66% | **57%** | 7.0 / 7.6 / 2.8 | 84% | +3.3 |
| Lutador de Taijutsu | Uzumaki | 100% | 72% | **70%** | 7.5 / 8.5 / 3.3 | 80% | +4.2 |
| Lutador de Taijutsu | Sem clã | 100% | 55% | **45%** | 7.3 / 8.6 / 3.2 | 78% | +3.8 |
| Semi-equilibrado | Uzumaki | 98% | 18% | **16%** | 8.5 / 9.1 / 3.6 | 74% | +3.8 |
| Equilibrado (12,5% em tudo) | Sem clã | 75% | 0% | **0%** | 7.0 / 0.0 / 4.2 | 51% | +3.7 |

**Metas de calibração adotadas e como o resultado se sai:**

| Meta | Resultado |
|---|---|
| Comuns: perda média de ~20% a 25% do HP por luta, 2 a 4 rodadas | Atingida (fim de luta com 78% a 85% de HP; 2,6 a 3,6 rodadas) |
| Especialista chega a Zabuza quase sempre | Atingida (~100%) |
| Zabuza como principal filtro: 50% a 70% para um bom build | Atingida: 49% a 72% (Uchiha ninjutsu na ponta baixa) |
| Saga completa: 40% a 70% para builds focados | Atingida: 39% a 70% |
| Maestria: jutsu principal em +2 a +4, com +5 raro | Atingida (média +2,1 a +4,2) |

**Pontos de atenção:**

1. **Haku está mais fácil que Zabuza no robô:** de quem derrota Zabuza, cerca de 80% a 98% também derrota Haku. Sugestão para a v2.1: subir o multiplicador de HP do grau B de 1,3 para 1,5 ou dar a Haku um segundo padrão abaixo de 50% de HP.
2. **Builds espalhadas não passam de Zabuza:** o "semi-equilibrado" completa 15% e o "equilibrado (12,5% em tudo)" 0%. É intencional (build é decisão), mas para não punir iniciantes a criação de personagem deve oferecer **builds recomendadas** (Ninjutsu, Taijutsu) com os 10 pontos iniciais pré-distribuídos.
3. **Uchiha ~10 a 15 pontos percentuais abaixo do Uzumaki** com Ninjutsu: efeito da desvantagem de Fogo contra a Água e de o simulador não medir Genjutsu. Rever na Fase 2.
4. **Sem clã** ficou entre os dois clãs em Ninjutsu, mas 10 pontos abaixo do Uzumaki em Taijutsu; a maestria mais rápida e o desconto de chakra dele não estão no simulador (só o ponto extra por nível e a ausência de penalidade elemental).
5. **Não simulados:** efeitos contínuos (queimadura), controle e Tenacidade, Genjutsu, buffs de jutsu (Bunshin, Kawarimi, Kage Bunshin), consumíveis de reforço, Pergaminho Raro, elites, eventos e a escolha de recompensa. Toda essa camada precisa ser verificada quando entrar.


---

## Apêndice B — Catálogo de Jutsus

O catálogo abaixo é a **ideia base de conteúdo**, com nomes do anime. Poder e custo seguem os graus da Seção 3 (D 26/8 · C 40/14 · B 60/22 · A 90/34 · S 130/50), com ajustes onde faz sentido de jogo. Só os jutsus marcados **[F0]**, **[F1A]** e **[F1B]** foram considerados na simulação (e mesmo assim só os de dano); os demais são propostas ainda não calibradas.

**Legenda:**
- **◇** = nome canônico, mas a **saga mínima é estimativa conservadora** e precisa ser conferida no anime antes de virar dado.
- **\*** = nome genérico criado para preencher uma lacuna (não canônico).
- **Herança** = regra da Seção 8 (o personagem aprende a técnica básica do clã já na Saga da Onda).
- Elemento "—" = neutro (fora da roda elemental).
- Requisito "Nin 12" = Ninjutsu base 12; requisitos são sempre de **atributo base**.

Todos os requisitos de atributo seguem a tabela por grau da Seção 3 (D 5-8, C 12-16, B 18-26, A 30-38, S 40+).


### B.1 Jutsus gerais (qualquer clã ou Sem clã)

| Jutsu | Categoria | Elem. | Clã | Requisito | Saga mínima | Grau | Chakra | Poder | Efeito | Fase |
|---|---|---|---|---|---|---|---|---|---|---|
| Henge no Jutsu | Ninjutsu | — | Geral | Nin 5 | Início | D | 6 | — | Transformação: 30% de chance de o próximo golpe inimigo errar (1 turno) | F1B |
| Bunshin no Jutsu | Ninjutsu | — | Geral | Nin 5 | Início | D | 8 | — | Clones ilusórios: +12% de esquiva por 2 turnos (não acumula) | F1A |
| Kawarimi no Jutsu | Ninjutsu | — | Geral | Vel 8 | Início | D | 10 | — | Prioridade. Anula o próximo golpe recebido (1 carga, dura 2 turnos) | F1A |
| Bola de Fogo Básica | Ninjutsu | Fogo | Geral | Nin 6 | Início | D | 8 | 26 | Dano; 15% de chance de Queimadura | F0 |
| Sennen Goroshi | Taijutsu | — | Geral | Tai 6 | Início | D | 8 | 26 | Dano; −5% de Defesa do alvo por 2 turnos (o "Mil Anos de Dor" de Kakashi) | F0 |
| Investida Ninja * | Taijutsu | — | Geral | Tai 12 | Início | C | 14 | 40 | Dano. *Nome genérico (técnica de Academia), não canônico* | F0 |
| Kai | Genjutsu | — | Geral | Gen 8 | Início | D | 6 | — | Remove um efeito de Genjutsu/controle de si mesmo | F1A |
| Fuuton: Daitoppa ◇ | Ninjutsu | Vento | Geral | Nin 12 | Onda | C | 14 | 40 | Dano; 25% de reduzir a Velocidade do alvo por 2 turnos | F1A |
| Doton: Doryuuheki ◇ | Ninjutsu | Terra | Geral | Nin 12 | Onda | C | 14 | — | Muralha de lama: +25% de redução de dano por 3 turnos | F1B |
| Suiton: Suiryuudan no Jutsu | Ninjutsu | Água | Geral | Nin 22 | Onda (após Zabuza) | B | 22 | 60 | Dano em linha (o dragão de água usado por Zabuza) | F1A |
| Kage Bunshin no Jutsu | Ninjutsu | — | Geral | Nin 20 | Onda | B | 24 | — | Clones reais: +25% de dano em jutsus por 3 turnos e absorvem 1 golpe. Uzumaki: −20% de custo | F1A |
| Konoha Senpuu | Taijutsu | — | Geral | Tai 14 | Exame Chunin (início) | C | 14 | 40 | Dano; 25% de derrubar (−Velocidade por 2 turnos) | F2 |
| Magen: Jubaku Satsu ◇ | Genjutsu | — | Geral | Gen 14 | Exame Chunin (início) | C | 16 | — | Controle: imobiliza (45% de chance, 1 turno; chefe ×0,5) | F2 |
| Magen: Nehan Shouja no Jutsu ◇ | Genjutsu | — | Geral | Gen 20 | Exame Chunin | B | 22 | — | Sono: Controle de 1 turno (40% de chance) | F2 |
| Fuuinjutsu: Gogyou Fuuin ◇ | Fuinjutsu | — | Geral | Int 22 | Exame Chunin (Floresta da Morte) | B | 22 | — | Sela buffs e passivas do alvo por 3 turnos (ex: Sharingan, Névoa) | F2 |
| Uzumaki Naruto Rendan ◇ | Taijutsu | — | Geral | Tai 20 + Nin 12 (+ Kage Bunshin) | Exame Chunin (Preliminares) | B | 24 | 70 | Combo de clones: 3 golpes a 40% do Poder cada | F2 |
| Shishi Rendan ◇ | Taijutsu | — | Geral | Tai 22 + Vel 14 | Exame Chunin (Finais) | B | 22 | 65 | 2 golpes; o segundo com +15% de crítico | F2 |
| Chidori | Ninjutsu | Raio | Geral | Nin 30 + Vel 18 | Exame Chunin (treino) | A | 38 | 100 | Dano; ignora 20% da Defesa do alvo | F2 |
| Rasengan | Ninjutsu | — | Geral | Nin 32 + Int 15 (+ Kage Bunshin) | Busca por Tsunade | A | 40 | 100 | Dano; 20% de Atordoamento (1 turno). Sem elemento (base da infusão futura) | F3 |
| Kuchiyose no Jutsu | Ninjutsu | — | Geral | Nin 25 + Int 20 | Busca por Tsunade | A | 40 | — | Invoca um aliado (depende do sistema de invocações) | Futuro |
| Fuuton: Rasen Shuriken | Ninjutsu | Vento | Geral | Nin 45 + Int 30 (+ Rasengan) | Shippuden | S | 70 | 160 | Infusão elemental do Rasengan (Seção 7) | Futuro |
| Omote Renge | Taijutsu | — | Geral | Tai 40 + Vel 30 | Exame Chunin (Oito Portões) | S | 60 | 150 | Depende da mecânica dos Oito Portões (fura Defesa, custa HP) | Futuro |

### B.2 Uzumaki

| Jutsu | Categoria | Elem. | Clã | Requisito | Saga mínima | Grau | Chakra | Poder | Efeito | Fase |
|---|---|---|---|---|---|---|---|---|---|---|
| Kongou Fuusa | Fuinjutsu | — | Uzumaki | Int 14 + Nin 8 | Início (Herança) | C | 16 | — | Correntes de chakra: Controle 55% (1 a 2 turnos; chefe 1 turno e ×0,5) | F1A |
| Hakke no Fuuin Shiki ◇ | Fuinjutsu | — | Uzumaki | Int 30 + Nin 20 | Shippuden | A | 36 | — | Sela o chakra: −50% de regeneração e −25% de Ninjutsu do alvo por 4 turnos | F3 |

### B.3 Uchiha

| Jutsu | Categoria | Elem. | Clã | Requisito | Saga mínima | Grau | Chakra | Poder | Efeito | Fase |
|---|---|---|---|---|---|---|---|---|---|---|
| Katon: Goukakyuu no Jutsu | Ninjutsu | Fogo | Uchiha | Nin 12 | Início (Herança) | C | 14 | 40 | Dano; 25% de Queimadura | F1A |
| Genjutsu: Sharingan | Genjutsu | — | Uchiha | Gen 10 | Início (Herança) | C | 12 | — | Ilusão: Controle 40% (1 turno; chefe ×0,5). Distinto da passiva Sharingan | F1A |
| Katon: Ryuuka no Jutsu ◇ | Ninjutsu | Fogo | Uchiha | Nin 24 | Exame Chunin | B | 24 | 65 | Dano; 35% de Queimadura | F2 |
| Amaterasu | Ninjutsu | — | Uchiha | Gen 40 + Nin 25 | Perseguição a Itachi | S | 50 | 130 | Chama negra: Queimadura de 8% do HP máx por 4 turnos, não removível | Futuro |
| Tsukuyomi | Genjutsu | — | Uchiha | Gen 42 + Nin 20 | Perseguição a Itachi | S | 50 | — | Controle 60% (1 turno em chefe) + dano psíquico de 25% do HP atual | Futuro |

### B.4 Hyuuga

| Jutsu | Categoria | Elem. | Clã | Requisito | Saga mínima | Grau | Chakra | Poder | Efeito | Fase |
|---|---|---|---|---|---|---|---|---|---|---|
| Jyuuken | Taijutsu | — | Hyuuga | Tai 10 | Início (Herança) | C | 12 | 40 | Dano; drena 6% do chakra máximo do alvo | F2 |
| Hakke Sanjuuni Shou ◇ | Taijutsu | — | Hyuuga | Tai 18 | Exame Chunin | B | 22 | 60 | 2 golpes; drena chakra | F2 |
| Kaiten | Taijutsu | — | Hyuuga | Tai 22 + Vel 12 | Exame Chunin (Preliminares) | B | 22 | — | Defesa total por 1 turno e contra-ataque com 40% do Poder | F2 |
| Hakke Rokujuuyon Shou | Taijutsu | — | Hyuuga | Tai 34 + Vel 20 | Exame Chunin (Finais) | A | 38 | 100 | 64 golpes: dano; drena 15% do chakra e −Velocidade | F2 |

### B.5 Nara

| Jutsu | Categoria | Elem. | Clã | Requisito | Saga mínima | Grau | Chakra | Poder | Efeito | Fase |
|---|---|---|---|---|---|---|---|---|---|---|
| Kagemane no Jutsu | Ninjutsu | — | Nara | Nin 10 + Int 12 | Exame Chunin (Floresta da Morte) | C | 14 | — | Controle: imobiliza (60%, 1 a 2 turnos; chefe ×0,5) | F2 |
| Kagenui no Jutsu ◇ | Ninjutsu | — | Nara | Nin 18 + Int 16 | Exame Chunin | B | 22 | 45 | Dano; Controle 40% | F2 |
| Kage Kubishibari no Jutsu ◇ | Ninjutsu | — | Nara | Nin 22 + Int 18 | Exame Chunin (Finais) | B | 24 | 50 | Estrangula: dano + Controle 35% | F2 |

### B.6 Akimichi

| Jutsu | Categoria | Elem. | Clã | Requisito | Saga mínima | Grau | Chakra | Poder | Efeito | Fase |
|---|---|---|---|---|---|---|---|---|---|---|
| Bubun Baika no Jutsu ◇ | Taijutsu | — | Akimichi | Tai 10 | Início (Herança) | C | 12 | 42 | Punho gigante: dano | F2 |
| Baika no Jutsu | Taijutsu | — | Akimichi | Tai 16 | Exame Chunin | B | 20 | — | +40% de HP máx e +20% de Taijutsu por 4 turnos; −10 de Velocidade | F2 |
| Nikudan Sensha | Taijutsu | — | Akimichi | Tai 22 (+ Baika) | Exame Chunin (Preliminares) | B | 22 | 70 | Investida em bola: dano; ignora esquiva do alvo | F2 |
| Chou Baika no Jutsu ◇ | Taijutsu | — | Akimichi | Tai 30 + HP 25 | Recuperação do Sasuke | A | 36 | — | Forma gigante: +60% de HP máx e +35% de Taijutsu por 4 turnos | F3 |

### B.7 Aburame

| Jutsu | Categoria | Elem. | Clã | Requisito | Saga mínima | Grau | Chakra | Poder | Efeito | Fase |
|---|---|---|---|---|---|---|---|---|---|---|
| Kikaichuu no Jutsu | Ninjutsu | — | Aburame | Nin 10 + Int 10 | Início (Herança) | C | 12 | — | Insetos parasitas: drenam 5% do chakra máx do alvo por turno (3 turnos) | F2 |
| Mushi Bunshin no Jutsu ◇ | Ninjutsu | — | Aburame | Int 14 | Exame Chunin | C | 14 | — | Clone de insetos: absorve 1 golpe e drena chakra | F2 |
| Mushidama ◇ | Ninjutsu | — | Aburame | Nin 30 + Int 20 | Shippuden | A | 36 | 90 | Esfera de insetos: dano; drena chakra | Futuro |

### B.8 Itens ninja canônicos (ideias para a loja)

| Item | Grau | Efeito sugerido | Preço | Fase |
|---|---|---|---|---|
| Kibaku Fuda (Tag Explosiva) | D | Dano fixo 45, sem custo de chakra, uso único | 90 | F1B |
| Shuriken (pacote) | D | Golpe extra de 30 de Poder, uso único | 30 | F1B |
| Pílula de Soldado | C | +25% de chakra e −5% de Velocidade por 3 turnos | 150 | F2 |
| Pílulas Akimichi (Hōrengan / Karē Hōrengan / Tōgarashi) | B | Exclusivo Akimichi; potencializa Baika a custo de HP | — | F3 |

### B.9 Backlog canônico (não escrever antes da hora)

Oito Portões (Lee), Modo Sábio, Kurama (chakra da Kyuubi), Susanoo, Byakugan de longo alcance, Tobirama e Hiruzen (Suiton/Shiki Fuujin), Selo de Amaldiçoado/Marca da Maldição, Kekkei Genkai (Hyouton/Haku, Mokuton), Kunai Voador de Minato (Hiraishin), invocações (Gamabunta, Katsuyu, Manda). Cada um vira **mecânica própria** (Seção 20) e não só um jutsu.


---

## Apêndice C — Glossário

| Termo | Significado neste documento |
|---|---|
| **Rank ninja** | Genin, Chunin, Jounin... Reconhecimento oficial do personagem (Seção 4). É o **único** uso da palavra "rank". |
| **Grau** | Escala D, C, B, A, S usada por jutsus, inimigos e itens (nível de poder/raridade). |
| **Nível** | Nível de experiência do personagem, sobe por XP dentro da run (Apêndice A.1). |
| **Nível de história** | Nível esperado de um encontro da saga, que define a força do inimigo (Apêndice A.3). |
| **Saga mínima** | Ponto da história a partir do qual um jutsu existe e pode ser aprendido (Seção 8). |
| **Herança** | Marca de jutsu básico de clã que pode ser aprendido desde a Saga da Onda (Seção 8). |
| **Maestria** | Domínio de **um jutsu** por uso, de +1 a +5 (Seção 8). Sempre da run. |
| **Pontos de Legado** | Moeda persistente da meta-progressão (Seção 15). Antes chamada "Pontos de maestria". |
| **Reputação** | Número que promove o rank ninja (Seção 4). Da run. |
| **Ryo** | Moeda de compra da loja (Seção 11). Da run. |
| **Atributo base / efetivo** | Base = pontos + clã + pergaminhos; efetivo = base + equipamento + efeitos temporários (Seção 3). |
| **Poder Ninja** | Número informativo que resume a força do personagem (Seção 3). |
| **Encontro** | Uma batalha da sequência de uma saga. |
| **Acampamento** | Ponto de descanso antes de chefes: cura total e checkpoint da run (Seção 9). |
| **Tenacidade** | Imunidade de 2 turnos a controle depois que um controle termina (Seção 10). |
| **Simulador headless** | Programa que joga runs completas sem interface para medir balanceamento (Seção 18). |

---

## Apêndice D — Decisões em Aberto

Tudo o que precisa de uma decisão sua antes ou durante a Fase 0/1A:

1. **Nome dos jutsus marcados ◇ e a saga mínima estimada:** conferir cada um no anime antes de virar dado (Apêndice B).
2. **"Selo de Quatro Elementos"** (versão anterior): substituído por **Gogyou Fuuin (Selo dos Cinco Elementos)**. Confirmar se era esse o jutsu pretendido.
3. **Haku mais fácil que Zabuza** no simulador: subir o HP do grau B (1,3 → 1,5) ou dar segundo padrão abaixo de 50% de HP (Apêndice A.5).
4. **Builds recomendadas na criação:** oferecer presets (Ninjutsu, Taijutsu) para não punir jogadores que espalham pontos.
5. **Uchiha na Saga da Onda:** aceitar o desempenho ~10 a 15 pontos abaixo, ou compensar (ex: Sharingan com mais bônus de esquiva). Rever com Genjutsu simulado.
6. **Variação entre runs (escolha de 1 entre 3 recompensas e eventos):** entra em F1B ou já em F1A? É a principal alavanca de rejogabilidade.
7. **Dano contínuo (queimadura 4% por 3 turnos):** valor ainda não simulado.
8. **Tempo de uma run:** a meta atual é 25 a 35 minutos (26 encontros). Confirmar com playtest.
9. **Escopo de F0:** confirmar se F0 vai até Zabuza (encontro 13) ou só até o encontro 6, para validar o combate mais cedo.
10. **Risco de propriedade intelectual:** definir se o projeto ficará privado ou será divulgado. Se público, manter sem monetização e considerar renomear o projeto. (Sem aconselhamento jurídico; consulte fontes sobre regras de jogos de fã.)
11. **Sagas futuras:** conferir a ordem canônica proposta na Seção 12 (Gaara agora é chefe da Invasão de Konoha, e não da Recuperação do Kazekage).
12. **Espaço reservado para as suas próximas definições** (você comentou que tem mais coisas a adicionar).

---

## Apêndice E — Registro de Mudanças (v2.0)

### Inconsistências resolvidas

| # | Problema na versão anterior | Correção |
|---|---|---|
| 1 | Escopo da Fase 1 grande demais | Dividido em **F0 / F1A / F1B**, com marcas em todas as seções (Seção 1 e 21) |
| 2 | "Sem clã" estritamente pior que qualquer clã | +1 ponto livre por nível, sem penalidade de afinidade, −10% de custo em jutsus gerais e maestria 25% mais rápida (Seção 6) |
| 3 | Afinidade elemental sem regra (a Seção 5 apontava para a 7, que não falava dela) | Regras completas na Seção 5; Raio só entra na Fase 2 |
| 4 | Kage Bunshin ao mesmo tempo exclusivo de clã e geral | Geral; o Uzumaki só tem desconto de custo |
| 5 | "Chefe a cada 5 níveis" conflitava com Haku no nível 9 | História avança por **encontros**; tabela de cronograma (Seção 12, Apêndice A.3) |
| 6 | Nível definia a história, sem definição de quantos encontros valem um nível | 3 comuns = 1 nível; XP `24 + 12·N` |
| 7 | Taijutsu e Genjutsu sem jutsus gerais | Adicionados Sennen Goroshi, Investida Ninja, Konoha Senpuu, Kai, Magen: Jubaku Satsu e outros (Apêndice B) |
| 8 | "Posicionamento" nos pilares sem existir mecânica | Removido do pilar; volta na Fase 3+ |
| 9 | Meditar e Defender redundantes | Defender protege (−50% dano, +10% chakra), Meditar recarrega (+25% chakra) |
| 10 | "Rank" com três sentidos (rank ninja, jutsu/inimigo/item) | "Rank" só para rank ninja; D–S vira **grau** |
| 11 | "Maestria" com três sentidos | "Pontos de maestria" renomeado para **Pontos de Legado** |
| 12 | Maestria +5 exigia 90 usos (inalcançável na Fase 1) | Limiares 6/9/12/15/18 (60 usos no total) |
| 13 | Gaara como chefe da Recuperação do Kazekage | Corrigido: chefe da Invasão de Konoha; Sasori e Deidara na Recuperação do Kazekage |
| 14 | Orochimaru como chefe nas Preliminares do Exame | Aparece na Floresta da Morte e na Invasão |
| 15 | Rasengan citado na Saga da Onda sem pré-requisito | Pré-requisito: Kage Bunshin; saga mínima Busca por Tsunade |
| 16 | Nomes questionáveis (Baika/Bubun Baika, Kageyose, Mushi Kui, Konchuu Daikaijuu, "Selo de Quatro Elementos") | Baika corrigido; Kageyose, Mushi Kui e Konchuu Daikaijuu substituídos por técnicas confirmadas; Selo trocado por Gogyou Fuuin |
| 17 | Controle potencialmente infinito (stun-lock) | Duração máxima, Tenacidade e resistência de chefe (Seção 10) |
| 18 | Inteligência fazia coisas demais | Não reduz mais custo de chakra; só chakra máximo, regeneração e Fuinjutsu/suporte |
| 19 | Velocidade "obrigatória" | Ordem com variação de 10%; esquiva com teto de 40% |
| 20 | Promoções Chunin/Jounin inalcançáveis por reputação | Recompensas de reputação recalibradas (~930 ao fim da Saga da Onda) |

### Base numérica que não existia (agora definida)

XP (`24 + 12·N`), encontros por nível (3), HP (`80 + 4·HP + 6·nível`), chakra, regeneração, fórmula de dano com divisor 40, redução de dano, esquiva (com teto 40%), crítico (curva assintótica, teto 55%), escala de inimigos por nível de história (`P(N) × razão`), multiplicadores de HP e dano por grau, recuperação entre encontros, Acampamento, preços, recompensas e metas de simulação.

### Adições

Catálogo de jutsus gerais e de clã (Apêndice B), clãs Hyuuga/Nara/Akimichi/Aburame com passivas e jutsus, blocos de inimigos e resultados de simulação (Apêndice A), regra de Herança de clã, salvamento da run, RNG com semente, simulador headless, esquemas de validação e i18n, glossário e decisões em aberto.

### Mudanças que mexem no equilíbrio (conferir ao jogar)

- Divisor do atributo passou de 100 para **40** (mais dano por ponto).
- Defesa passou de `Def/(Def+100)` para `Def/(Def+50)`.
- Inteligência deixou de reduzir custo de chakra.
- Reputação por inimigo comum passou de 40 para **22** (valor antigo passava de 1500 na Saga da Onda).
