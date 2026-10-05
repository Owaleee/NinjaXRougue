# NarutoTxGame — Spec do MVP (Saga da Onda)

- **Data:** 2026-10-04
- **Fonte da verdade:** `docs/referencia/NarutoTxGame_Documento_de_Design_v2.md` (doravante "DD v2"). Esta spec só registra **o que muda, o que foi decidido e o que foi assumido**; tudo o que não é citado aqui segue o DD v2.
- **Status:** aprovado em brainstorming (seções 1–5), aguardando revisão do arquivo.
- **Marcação:** `ASSUMIDO` = o DD v2 não define; decisão tomada aqui, com justificativa.

---

## 1. Objetivo e escopo

Um MVP **single player, 100% local no navegador**, que cubra a Saga da Onda completa com o núcleo do jogo e parte das camadas de meta. Qualquer modo online, multiplayer ou servidor está **fora** (decisão do usuário; o DD v2 Seção 17 vira apenas nota de futuro).

### Entra no MVP

| Bloco | Conteúdo | Origem no DD v2 |
|---|---|---|
| F0 | Combate 1x1 completo, fórmulas, efeitos básicos, log, XP/nível/pontos, desbloqueio de jutsu, loja mínima, save da run | §1, §3, §9, §10 |
| F1A | Saga da Onda com 26 encontros, Zabuza (C) e Haku (B), Acampamento, Uchiha + Uzumaki + Sem clã, ryo/reputação, loja, equipamento Arma/Armadura, 4 slots, maestria, menu principal, Enciclopédia | §1, §6, §8, §11, §12, §13 |
| F1B (parcial) | Histórico de Runs; escolha 1-de-3 ao subir de nível; Títulos com buff; Ficha do Ninja (Perfil, Atributos, Jutsus, Equipamento); Pergaminho Raro; Henge e Doryuuheki | §12, §14, §16, Ap. B |
| Infra | Rng com semente, constantes em `Balance.ts`, validação Zod, i18n PT-BR, save versionado, **simulador headless** com metas automatizadas, testes Vitest | §18 |

### Fica de fora (e por quê)

| Item | Motivo |
|---|---|
| Online, PvP, servidor, cronômetro de turno | Decisão do usuário: jogo 100% local |
| Modo Infinito | DD v2 já o define como "Em breve"; entra só como entrada de menu desabilitada |
| Promoção a Chunin/Jounin, slots 6/8, 2ª afinidade, Raio, Chidori | Dependem da Saga do Exame Chunin (F2) |
| Clãs Hyuuga, Nara, Akimichi, Aburame; Sharingan tomoe 2/3 | F2 e não simulados; o contador de turnos de tomoe já é salvo |
| Livro Bingo, rival, Pontos de Legado, cosméticos, desbloqueio de clãs | F2 (meta-progressão completa) |
| Eventos entre encontros (loja ambulante, treino, descanso) | Usuário escolheu só a escolha 1-de-3 dentre a variação da F1B |
| Aba Registro de Batalha e tela de equipamento com silhueta | F1B não selecionados; as estatísticas são coletadas e exibidas de forma simples no Histórico |
| Sprites, áudio, mobile (< 1024px) | Regra de ouro (sem arte oficial) e foco no núcleo; placeholders + layout desktop |

---

## 2. Stack e arquitetura

- **Vite + TypeScript (strict) + Phaser 3**, com npm. Phaser só na batalha; todas as outras telas em **HTML/CSS (DOM) sobre o canvas** (DD v2 §18).
- **Vitest** (testes do motor), **Zod** (validação dos dados), **tsx** (rodar o simulador no Node).

### Camadas

```
src/
  game/          motor puro: zero imports de Phaser/DOM; nunca usa Math.random nem Date
    Rng.ts       mulberry32 com semente; estado serializável
    Balance.ts   todas as constantes numéricas (fonte única)
    types.ts
    formulas.ts
    combat/      Battle (lista de combatentes), turnOrder, actions, ai
    effects/     EffectSystem genérico (inclui Transformação)
    progression/ xp, pontos, jutsuUnlock, mastery, loadout
    run/         RunManager, encontros, recompensas, loja, escolha 1-de-3
    meta/        StatsTracker (por eventos), títulos, histórico, enciclopédia
    save/        serialização versionada + migrações
  data/          jutsus, clãs, inimigos, arquétipos, itens, títulos, saga da Onda
  i18n/pt-BR.ts
  store/GameStore.ts   única fonte da verdade da aplicação
  scenes/        BootScene, BattleScene (apenas anima eventos)
  ui-dom/        uma tela por arquivo + componentes
tools/simulate.ts
tests/
```

### Contrato do motor

```ts
applyAction(state: BattleState, action: Action, rng: Rng): { state: BattleState; events: GameEvent[] }
```

- Pura do ponto de vista da UI: a UI nunca altera estado diretamente.
- Ação inválida → lança `ActionError` tipado (sem chakra, jutsu não equipado, controlado etc.).
- **Eventos** (`damage`, `dodge`, `crit`, `effectApplied`, `effectExpired`, `transformOn/Off`, `defeated`, `jutsuUsed`, `itemUsed`, `levelUp`, `jutsuLearned`, `bossDefeated`...) alimentam: animação da `BattleScene`, o log, o `StatsTracker` e os títulos.

### Fluxo de dados

UI → `GameStore.dispatch(action)` → motor → `{state, events}` → store guarda o estado, persiste se for ponto de save, publica os eventos → `BattleScene` enfileira as animações (a entrada fica travada até a fila terminar) → DOM re-renderiza.

---

## 3. Correções ao DD v2

| # | Problema no DD v2 | Correção | O que foi mantido |
|---|---|---|---|
| C1 | Fórmula de dano usa `(1 + Maestria)`, o que daria +100% por nível | `(1 + 0,03·m)`, `m` = 0..5 (coerente com §8: +3% por nível) | Restante da fórmula |
| C2 | `(1 + Título)` não diz onde entram Sharingan, Afinidade Katon, Kage Bunshin etc. | Um único termo **`(1 + Σ bônus % de dano)`**, aditivo, que soma título + clã + transformação + buffs | Valores de cada bônus |
| C3 | Kawarimi tem "Prioridade", que não tem efeito com turno sequencial | "Prioridade" removida no MVP; o jutsu já funciona como carga preventiva | Efeito (anula o próximo golpe, 1 carga, 2 turnos) |
| C4 | Kunai "+2 de Crítico": atributo ou %? | +2 no **atributo** Chance de Crítico | Preço e slot |
| C5 | Tabela A.4: Bandido nível 1 com 41 pontos (a regra `P(N)×razão` dá 35) e Bandido nível 4 com 53 (dá 49,7); elite com grau "E" | Os blocos de inimigo são **gerados por código**: `pontos = round(P(N) × razão)`, distribuídos pelos pesos do arquétipo com arredondamento por maior resto e **mínimo de 1 por atributo**. A elite tem grau **D+** | Arquétipos, pesos, razões e multiplicadores |
| C6 | Haku mais fácil que Zabuza (A.5, Ap. D item 3) | HP do grau B: **×1,3 → ×1,5**, e Haku ganha padrão de 2ª fase abaixo de 50% de HP (§7 desta spec). Meta: de quem vence Zabuza, 70% a 85% vencem Haku | Grau B, dano ×0,80 |
| C7 | Gogyou Fuuin é exclusivo do Uzumaki na §6 e Geral no Ap. B.1 | **Geral, F2** (na obra é técnica do Orochimaru). O pool do Uzumaki fica com Kongou Fuusa (F1A) e Hakke no Fuuin Shiki (F3) | Saga mínima e efeito |
| C8 | §4 diz que "2 a 3 elites passam de 1000 de reputação"; como a elite substitui um comum, soma só +16 cada (928 + 48 = 976) | Texto corrigido; a missão de grau D opcional continua sendo o caminho até 1000 (F2) | Valores de reputação |
| C9 | Builds espalhadas travam em Zabuza (A.5) | Presets na criação (Ninjutsu, Taijutsu, Equilibrado-guiado) e um botão "Distribuir pelo preset" no level-up | Liberdade total de distribuição |
| C10 | §13 omite Meditar da barra de batalha | Barra: Atacar, Defender, Meditar, Item, Transformar (Uchiha) + 4 jutsus | — |
| C11 | §13 e §14 usam "rank" para item e inimigo, contra o glossário | "grau" em todo texto de item e inimigo | — |
| C12 | §12 coloca "um jutsu elegível novo" na escolha 1-de-3, o que contradiz o desbloqueio automático por status (§15) | **Regra fixa (decisão do usuário):** jutsus só por condições de status (§5). A escolha 1-de-3 não oferece jutsus | Escolha 1-de-3 como alavanca de rejogabilidade |
| C13 | Kai "remove controle de si mesmo", mas quem está controlado não age | Sob controle do tipo **Ilusão**, a única ação permitida é **Kai** (remove a Ilusão e inicia a Tenacidade). Outros controles (Imobilizado, Atordoado) fazem perder o turno | Custo e requisito |
| C14 | Título "Colecionador" (5 Pergaminhos Raros = 4500 ryo, contra ~1220 de renda na saga) e "Novo Chunin" são impossíveis no MVP | Existem nos dados, mas ficam **ocultos** até F2 | Condições e buffs |
| C15 | Hakke no Fuuin Shiki está [F2+] na §6 e F3 no Ap. B | F3 (Ap. B prevalece por ser mais específico) | — |

---

## 4. Regras de combate (consolidadas)

### Turno

- Ordem por rodada: `Vel efetiva × (1 + rng[0, 0,10])`, recalculada a cada rodada.
- Cada combatente escolhe a ação **na sua vez** (sequencial). `ASSUMIDO`: corresponde ao "Seu turno / Turno do inimigo" da §13.
- **Início do turno de um combatente**, nesta ordem:
  1. Regenera chakra (`2 + ⌊Int/8⌋`).
  2. Cobra a manutenção da transformação; sem chakra suficiente, ela termina.
  3. Aplica o dano contínuo.
  4. Se estiver controlado, perde a ação (exceto Kai sob Ilusão).
  5. Desconta 1 da duração dos efeitos por turnos.
- **Fim:** HP do inimigo chega a 0 → vitória; HP do jogador chega a 0 → derrota (fim da run). Quem chega a 0 primeiro perde.

### Fórmulas (todas em `Balance.ts`)

| Grandeza | Fórmula |
|---|---|
| HP máx | `(80 + 4·HP + 6·nível) × mult. clã` (Uzumaki 1,10) |
| Chakra máx | `30 + 4·nível + Int` |
| Dano | `Poder × (1 + 0,03·m) × (1 + Atr/40) × Elem × (1 + Σbônus%) × (1 − Red) × Crit × Var` |
| Poder por grau | D 26 · C 40 · B 60 · A 90 · S 130 · Atacar 18 |
| Redução | `Red = mín(60%, Def/(Def+50))`; buffs de redução somam por cima com teto total de **75%** (`ASSUMIDO`, para Doryuuheki ter efeito). Defender multiplica o dano final por 0,5, à parte |
| Esquiva | `clamp(4 + 0,8·(Vel alvo − Vel atacante), 0, 40)% + bônus`, teto total de 40% |
| Crítico | `mín(55%, 50·C/(C+60) + bônus fixos)`; dano ×1,5 |
| Variação | rng[0,9, 1,1] |
| Elemental | Atacante vence defensor ×1,3; perde ×0,8; neutro ×1,0. **Elemento do defensor = sua afinidade** (inimigos sem elemento são neutros) — `ASSUMIDO` |
| Inimigo | Poder do golpe × multiplicador de dano do grau |

- Roda elemental: Fogo → Vento → Raio → Terra → Água → Fogo.
- Atributo usado no dano: Taijutsu (Atacar e jutsus de Taijutsu), Ninjutsu (Ninjutsu), Genjutsu (Genjutsu), Inteligência (Fuinjutsu).

### Custo de chakra de jutsu

`round(custo base × Π modificadores)`, mínimo 1. Modificadores multiplicativos (`ASSUMIDO` multiplicativo):

| Modificador | Valor |
|---|---|
| Maestria | −5% por nível |
| Elemento fora da afinidade (exceto Sem clã) | +25% |
| Sem clã em jutsu geral | −10% |
| Uzumaki em Kage Bunshin | −20% |

### Ações

| Ação | Regra |
|---|---|
| Atacar | Poder 18, Taijutsu, neutro; a arma altera via atributo |
| Jutsu | Um dos 4 equipados; conta uso de maestria (no máximo 1 vez por turno, acertando ou não) |
| Defender | ×0,5 de dano até o próximo turno próprio; +10% de chakra máx |
| Meditar | +25% de chakra máx (Uzumaki +20% relativo → 30%) |
| Item | Consome a ação do turno (`ASSUMIDO`) |
| Transformar | Ver §4.1 |

### 4.1 Transformação (decisão do usuário: Sharingan é transformação)

Nova categoria no `EffectSystem`, genérica para Modo Sábio, Bijuu e outras no futuro.

- **Campos de dados:** `activationCost`, `activationCostsTurn`, `upkeepPerTurn`, `modifiers`, `visual`.
- Uma transformação ativa por vez. Termina por falta de chakra, ao desativar ou no fim da batalha.
- O motor conta os turnos ativos na run (`transformTurns`); isso é a base de tomoe 2/3 em F2.
- **Sharingan (tomoe 1):** ativação 0 chakra, **não gasta o turno** (`ASSUMIDO`: o Uchiha já rende abaixo na Saga da Onda), manutenção de 2 por turno, +14% de crítico, +10% de esquiva, +15% de dano de jutsus. Ligar ou desligar é permitido 1 vez por turno.
- **Visual:** aura e tingimento vermelho no placeholder; ícone "sustentado" (∞) no HUD.

### 4.2 Efeitos

Estrutura do DD v2 §10, com os tipos `buff`, `debuff`, `control` (`immobilized`, `stunned`, `illusion`), `dot` e `transformation`.

- **Controle:**
  - Duração máxima de 2 turnos em comuns e 1 em chefes.
  - Tenacidade: 2 turnos de imunidade após o fim do controle.
  - Chance em chefes ×0,5.
  - `chance = base × (1 + Gen/100 se ilusão) × (1 + 0,08·m)`, teto de 85%.
  - Um controle por vez (aplicar outro só renova o de menor duração).
- **Dano contínuo:** queimadura de 4% do HP máx por turno, 3 turnos, renova sem acumular intensidade (valor do DD v2, agora medido pelo simulador).

### 4.3 Efeitos dos jutsus do MVP (detalhes `ASSUMIDO` onde o Ap. B é vago)

| Jutsu | Efeito implementado |
|---|---|
| Henge no Jutsu | Rolagem **independente** de 30% de o próximo golpe inimigo errar (1 turno); fora do teto de esquiva |
| Bunshin no Jutsu | +12% de esquiva, 2 turnos, não acumula |
| Kawarimi no Jutsu | 1 carga que anula o próximo golpe recebido; dura 2 turnos |
| Bola de Fogo Básica / Goukakyuu | Dano; 15% / 25% de Queimadura |
| Sennen Goroshi | Dano; −5% de Defesa do alvo por 2 turnos |
| Investida Ninja | Dano |
| Kai | Remove Ilusão ou debuff de Genjutsu de si mesmo |
| Fuuton: Daitoppa | Dano; 25% de aplicar −20% de Velocidade por 2 turnos |
| Doton: Doryuuheki | +25% de redução de dano por 3 turnos |
| Suiton: Suiryuudan | Dano (Água) |
| Kage Bunshin no Jutsu | +25% de dano de jutsus por 3 turnos + 1 carga de absorção de golpe |
| Kongou Fuusa (Uzumaki) | Controle `immobilized` 55% (1–2 turnos; chefe 1 e ×0,5) |
| Genjutsu: Sharingan (Uchiha) | Controle `illusion` 40% (1 turno; chefe ×0,5) |

Os demais jutsus do Ap. B entram **como dados** (para a Enciclopédia) com `phase` > F1B e nunca ficam aprendíveis no MVP, porque a saga mínima deles é posterior.

---

## 5. Desbloqueio de jutsu — regra fixa

> Um jutsu é **aprendido automaticamente** no momento em que o personagem cumpre **todas** as suas condições:
> 1. atributo(s) **base** mínimo(s);
> 2. clã (se exclusivo);
> 3. saga mínima ≤ ponto atual da história;
> 4. jutsu pré-requisito já aprendido.
>
> Nenhuma outra fonte (escolha 1-de-3, loja, chefe, evento) concede jutsus. Equipamento e buffs (atributo efetivo) **não** contam.

- **Pontos da história (ordem):** `inicio` < `onda` < `onda_pos_zabuza` < `exame_chunin_inicio` < ... A run começa em `onda`; vencer Zabuza avança para `onda_pos_zabuza`. "Início" e "Onda" são equivalentes no MVP; a distinção existe para sagas futuras.
- **Verificação** após: distribuir pontos, aplicar Pergaminho Raro, avançar ponto da história e criar o personagem.
- **Aprender com os 4 slots cheios:** abre a tela de troca; o jutsu também pode ficar só no repertório.
- **Afinidade:** jutsus elementais fora da afinidade continuam aprendíveis, com custo +25% e maestria máxima +3 (Sem clã ignora as duas penalidades). Uchiha tem Fogo fixo.

---

## 6. Progressão

- Atributos começam em 5; 10 pontos na criação; 5 livres por nível + 1 automático em cada atributo de destaque do clã; Sem clã: 6 livres por nível.
- **Destaques:** Uzumaki HP/Int; Uchiha Gen/Crit.
- **Passivas:**
  - Uzumaki: +10% de HP máx; Meditar +20%; Kage Bunshin −20% de custo.
  - Uchiha: transformação Sharingan; Afinidade Katon +15% de dano de Fogo.
  - Sem clã: −10% de custo em jutsus gerais; maestria ×0,75 de usos (arredondado para cima).
- **XP:** `24 + 12·N` para subir de N; comum `8 + 4·N`; elite ×1,6; chefe ×4 (N = nível de história).
- **Level-up:** +25% de HP máx (cura extra); distribuição de pontos; escolha 1-de-3 (uma por nível ganho).
- **Maestria:** limiares 6/9/12/15/18; por nível −5% de custo, +3% de dano e +8% relativo na chance de efeito; teto +5 (+3 fora da afinidade). Pertence à run; o máximo atingido por jutsu é persistido na meta.
- **Presets:**
  - Ninjutsu = A.2 (Nin 40% · HP 20% · Def 15% · Vel 15% · Crit 5% · Int 5%).
  - Taijutsu = mesmo perfil com Tai no lugar de Nin.
  - Equilibrado-guiado = Nin 30% · Tai 10% · HP 20% · Def 15% · Vel 15% · Int 10%.

---

## 7. Run, encontros e inimigos

- **Estrutura:** 26 nós conforme DD v2 §12 / A.3. Nós 13 (Zabuza) e 26 (Haku) são precedidos de Acampamento (HP/chakra 100% + checkpoint).
- **Pool de comuns:** nós 1–12: Bandido (Bruto) ou Ninja Renegado (Ninja); nós 14–25: Mercenário da Névoa (Ninja) ou Ninja Renegado. Sorteio por semente.
- **Elites opcionais (`ASSUMIDO`):** em 3 nós comuns sorteados (nunca o nó imediatamente antes de um Acampamento), o mapa mostra uma bifurcação "Comum" ou "Elite (D+)". A elite é a variante Veterano do arquétipo do nó: razão 0,90, HP ×1,0, dano ×0,80. Recompensas de elite: 50 ryo, 38 de reputação, XP ×1,6.
- **Golpes de comuns:** Bandido: Atacar + Golpe Pesado (Poder 24, 8 chakra); Ninja/Mercenário: Atacar + Kunai Lançada (22, 6). Neutros.
- **Recuperação:** fim de encontro +25% HP / +50% chakra; Acampamento 100%.
- **Início da run:** 0 ryo, inventário vazio (`ASSUMIDO`, para não desviar da calibração do A.5).

### IA

Regras gerais do DD v2 §9, mais os padrões de chefe abaixo (`ASSUMIDO` nos detalhes):

| Chefe | Abertura | ≥ 50% HP | < 50% HP (2ª fase) |
|---|---|---|---|
| Zabuza (Água) | Kirigakure | Kubikiribouchou / Suiryuudan pelo maior dano esperado; renova Kirigakure ao expirar | Renova Kirigakure sempre que expira; prioriza Muon Satsujin enquanto Kirigakure está ativo, senão Suiryuudan |
| Haku (Água) | Makyou Hyoushou | Senbon / Sensatsu Suishou | Renova Makyou ao expirar; prioriza Sensatsu Suishou; Senbon quando falta chakra |

---

## 8. Economia

- **Recompensas:** comum 30 ryo / 22 rep; elite 50 / 38; chefe C 200 / 160; chefe B 300 / 240.
- **Itens:**

| Item | Grau | Efeito | Preço |
|---|---|---|---|
| Kit médico | D | +40% HP | 80 |
| Pílula de chakra | D | +50% chakra | 70 |
| Pergaminho de Reforço | D | +10% em Tai/Nin/Gen/Vel/Def, escolhido ao usar (`ASSUMIDO`), 5 turnos | 60 |
| Kunai | D | +2 Vel, +2 Crit | 250 |
| Colete ninja | D | +3 Def | 300 |
| Katana | C | +4 Tai | 600 |
| Colete reforçado | C | +5 Def, +3 HP | 700 |
| Pergaminho Raro | Raro | +1 em atributo base à escolha (`ASSUMIDO` +1; o DD dizia "+1 ou +2") | 900 |

- **Estoque da loja:** consumíveis sempre disponíveis; 2 equipamentos sorteados do pool D/C; 1 Pergaminho Raro. O estoque renova no início da run e após cada chefe. Limite de 5 Pergaminhos Raros por run.
- **Acesso:** a loja fica na tela de Preparação, entre encontros. Troca de equipamento e de jutsus só fora de batalha.

---

## 9. Meta-progressão (persistente)

- **Enciclopédia:** todos os jutsus do Ap. B; "Desbloqueado" = aprendido em qualquer run; selo para quem chegou a +5.
- **Histórico de Runs:** data, clã, afinidade, nível, reputação, encontros vencidos, resultado ("Morreu na Saga da Onda, nível 4, para Mercenário da Névoa" / "Saga concluída") e snapshot da Ficha (atributos, jutsus com maestria, equipamento e estatísticas da run).
- **Estatísticas:** coletadas pelo `StatsTracker` a partir dos eventos, por run e vitalícias (inimigos derrotados por grau, chefes, dano causado/sofrido, maior golpe, críticos, jutsu mais usado, turnos, ryo ganho/gasto, itens).
- **Títulos** (um ativo, escolhido na criação; buff como efeito passivo da run, nunca no atributo base):

| Título | Condição | Buff | MVP |
|---|---|---|---|
| Demônio da Névoa | Derrotar Zabuza | +3% de esquiva | sim |
| Caçador de Bandidos | 30 inimigos grau D (**vitalício**, `ASSUMIDO`) | +5% de ryo | sim |
| Sem um Arranhão | Vencer um chefe sem sofrer dano | +2% de redução | sim |
| Por um Fio | Vencer um chefe com < 10% de HP | +3% de crítico | sim |
| Mestre de Jutsus | 10 jutsus aprendidos na mesma run | −3% de custo de chakra | sim (11 gerais + clã no MVP) |
| Iniciante/Adepto/Mestre de {Fogo, Água, Vento, Terra} | +5 em 1/2/3 jutsus diferentes do elemento | +2/4/6% de dano do elemento | sim |
| Colecionador, Novo Chunin | — | — | oculto (C14) |

---

## 10. Interface

- **Telas DOM:**
  - Menu (Continuar run, Modo História, Modo Infinito "Em breve", Enciclopédia, Histórico, Títulos)
  - Criação (com prévia das fórmulas derivadas e lista "jutsus que esta build libera")
  - Mapa da saga
  - Resultado (recompensas, distribuição de pontos com "faltam X para *jutsu*", 1-de-3)
  - Preparação (Loja / Jutsus / Equipamento)
  - Ficha do Ninja (Perfil, Atributos com radar SVG de 8 pontas e valor base × efetivo, Jutsus, Equipamento), também em modo somente leitura na batalha
  - Enciclopédia, Histórico, Títulos
  - Tela de erro
- **Batalha:**
  - Phaser desenha a arena e placeholders e anima os eventos (avanço, número de dano, "ESQUIVOU", "CRÍTICO!", tremor, cor do elemento, aura da transformação).
  - HUD em DOM: painéis com nome/nível/grau/Poder Ninja/HP/chakra/efeitos com turnos e tooltip/crítico %/redução %; log colorido; barra de ações.
  - Entrada travada durante as animações; atraso curto no turno do inimigo.
- **Atalhos:** 1–4 jutsus, A Atacar, D Defender, M Meditar, I Item, T Transformar. Nenhuma informação só por cor.
- **Layout:** desktop, mínimo de 1024px; Phaser `Scale.FIT`.
- **Arte:** placeholders (formas e nomes). Nunca arte oficial.

---

## 11. Persistência

- `localStorage`, chaves `nxr.run.v1` (run em andamento) e `nxr.meta.v1` (meta).
- Todo save tem `version`; `migrate()` por versão.
- **Momentos de save:** fim de cada encontro, Acampamento, compra/equipamento na Preparação. Dentro de uma batalha não há save; recarregar no meio da luta volta ao início do encontro (`ASSUMIDO`, evita save-scum de RNG porque a semente do encontro é fixa).
- **Morte:** apaga `nxr.run`, grava o Histórico e atualiza a meta.
- **Save inválido:** copia para `nxr.*.corrupt.<timestamp>`, avisa o jogador e segue com o estado limpo.

---

## 12. Qualidade

- **Testes (Vitest, só no motor):**
  - Fórmulas com os valores do DD v2 (Def 10 → 16,7%; Crit 5 → 3,8%; HP nível 1 = 114; chakra nível 1 = 40; XP; A.3 acumulados).
  - Efeitos (duração, Tenacidade, teto de 85%, um controle por vez, Kai sob Ilusão, transformação).
  - Desbloqueio (cada condição isolada; base × efetivo).
  - Custo de chakra.
  - Economia.
  - Determinismo (mesma semente + mesmas ações ⇒ mesmo estado).
  - Save (ida e volta, migração).
  - Validação Zod dos dados.
- **Simulador (`npm run sim`):** robô do A.5, 3000 runs × 8 builds; imprime a tabela do A.5. `npm run sim:check` falha se uma meta sair da faixa:

| Meta | Faixa |
|---|---|
| HP ao fim de um comum | 75–85% |
| Rodadas por comum | 2–4 |
| Especialista chega a Zabuza | ≥ 95% |
| Vence Zabuza (builds focados) | 45–75% |
| Completa a saga (builds focados) | 35–70% |
| Haku dado Zabuza | 70–85% |
| Maestria média do jutsu principal | +2 a +4 |

  Desempenho alvo: < 30 s.

- **Robustez:** Zod no boot (erro → tela de erro com a mensagem); `ActionError` tipado.

---

## 13. Entregáveis e ordem

1. `docs/ANALISE.md`: inconsistências, correções (§3), o que foi mantido e todas as suposições `ASSUMIDO`.
2. **MVP:** código, testes, simulador, `README.md` (como executar e lista do que ficou de fora com motivo).
3. `docs/curso/`: Alfa 0.1–0.8, Beta 0.9.0–0.9.2, 1.0. Cada versão tem objetivo, escopo (entra/fica de fora), passo a passo com o porquê (alternativas, riscos, armadilhas), critérios de conclusão, testes e patch log (Adicionado / Alterado / Corrigido / Removido / Problemas conhecidos). Linguagem para dev JS sem experiência em jogos. Escrito a partir do código real.
4. `docs/DESIGN.md`: Documento de Design v3, reescrito e incorporando as correções e os números finais do simulador.

**Ordem:** spec → plano de implementação → MVP (testes + `sim:check` verdes) → curso → DESIGN v3.

**Critério de pronto do MVP:**
- `npm install && npm run dev` abre o jogo.
- Uma run completa jogável de ponta a ponta com os 3 caminhos de clã.
- `npm test` e `npm run sim:check` verdes.
- `npm run build` gera `dist/` estático.
