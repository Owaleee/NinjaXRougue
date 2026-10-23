# NarutoTxGame — Inventário de assets visuais

> **O que é.** A lista de **tudo o que é visual** no jogo, levantada a partir do código (`src/data/`, `src/ui-dom/`, `src/scenes/`, `src/styles.css`) e do `docs/DESIGN.md`. Hoje o jogo usa só **placeholders**: retângulos coloridos na arena, texto e emojis nas telas. Este documento lista o que substitui cada um deles.
>
> **Atualizado em:** 2026-10-15 · **Escopo:** MVP (Saga da Onda) + o que já aparece no jogo de fases futuras (por exemplo, jutsus visíveis na Enciclopédia) + uma visão de F2 em diante no fim.
>
> **Estado em 2026-10-22:** a frase "o jogo usa só placeholders" descreve 2026-10-15. O que já existe, grupo a grupo, está na §13 ("Estado da entrega, 2026-10-22"). As listas e prioridades abaixo continuam valendo como pedido.
>
> **Não inclui:** áudio (não é visual) nem arte de divulgação externa (loja, redes sociais). Os dois podem virar listas próprias depois.

---

## 0. Como ler

### Prioridades
| Código | Significado |
|---|---|
| **P0** | Necessário para o MVP deixar de parecer protótipo. Substitui um placeholder que o jogador vê o tempo todo |
| **P1** | Polimento do MVP. Aparece no jogo, mas o placeholder atual se sustenta |
| **P2** | Fases futuras (F2+), ou algo que só faz sentido quando a funcionalidade existir |

### Medidas de referência
- O Phaser roda numa resolução lógica de **1280 × 720** e escala com `Scale.FIT` (`src/scenes/createGame.ts`).
- Os lutadores placeholder hoje medem **110 × 170 px**, ficam em x = 400 (jogador) e x = 880 (inimigo) e y = 430, e a faixa do chão tem 240 px de altura (`src/scenes/BattleScene.ts`).
- As telas DOM têm no máximo **1280 px** de largura, e a largura mínima é **1024 px** (`src/styles.css`).
- **Regra de entrega:** tudo em **@2x** (o dobro do tamanho de exibição) para telas retina. Ícones de interface, de preferência em **SVG**.

### Regras que valem para todo asset
1. **Nunca arte oficial.** É um projeto de fã: personagens canônicos (Zabuza, Haku) e símbolos de clã precisam ser **desenhos originais inspirados**, nunca cópias de frames, mangá ou logos oficiais (DD v2, decisão em aberto nº 10 sobre propriedade intelectual).
2. **Nenhuma informação só por cor** (spec §10). Elemento, grau, efeito, estado e resultado sempre têm **forma, ícone ou texto** junto com a cor.
3. **Legível em fundo escuro.** A interface usa os tokens de `src/styles.css` (fundo `#12141a`, painel `#1c1f28`, acento `#f08a24`). Os assets precisam funcionar sobre eles.
4. **Os nomes dos arquivos usam os `id`s dos dados** (ver §12). Assim o código encontra o asset sem um mapa manual.

---

## 1. Direção de arte (decidir antes de produzir)

| Decisão | Opções | Recomendação |
|---|---|---|
| Estilo | (a) **Pixel art 2D**, como PokéRogue · (b) ilustração 2D vetorial/flat · (c) pintura digital | **(a) Pixel art.** É a inspiração declarada do projeto, tem custo de animação mais baixo e se afasta visualmente da arte oficial do anime, o que reduz o risco de propriedade intelectual |
| Proporção dos personagens | Chibi (cabeça grande) · proporção real | Chibi ou semi-chibi: lê bem em ~170 px de altura e combina com pixel art |
| Grade do pixel art | 64 × 64 · 96 × 96 · 128 × 128 por quadro | **96 × 96**, escalado 2× para ~192 px na arena |
| Paleta | Livre · paleta fixa (ex.: 32 cores) | Paleta fixa, que deixa o conjunto coeso. Reservar matizes fixos para os 5 elementos |
| Cores dos elementos | As do código hoje | Fogo `#e4572e`, Vento `#9bd17b`, Raio `#f2d04b`, Terra `#a47148`, Água `#3f88c5`, neutro `#8a8f9c` (`ELEMENT_COLOR` em `src/scenes/BattleScene.ts`) |
| Tipografia | Fonte do sistema (atual) · uma fonte de título + uma de texto | Uma fonte de título com cara de pincel ou carimbo para logo e banners, e uma fonte de texto bem legível para o resto (Google Fonts, licença livre) |
| Ponto de vista da arena | Lateral (frente a frente) · ¾ como Pokémon | **Lateral**, como já está: jogador à esquerda, inimigo à direita |

---

## 2. Resumo (quantidades)

| Grupo | Itens | Prioridade |
|---|---|---|
| Personagens jogáveis (3 clãs) | 3 sprites animados + 3 retratos + 1 variação Sharingan | P0 |
| Inimigos do MVP | 6 comuns e elites (3 bases + 3 Veteranos) + 2 chefes, com animações e retratos | P0 |
| Cenários de batalha | 5 fundos + 2 camadas de efeito (névoa, espelhos de gelo) | P0/P1 |
| Fundos de tela (fora da batalha) | 8 | P1 |
| Efeitos visuais de batalha | ~45 (genéricos + por jutsu + por status) | P0/P1 |
| Ícones de jutsu | 14 jogáveis + 8 de inimigos + 29 de fases futuras (visíveis na Enciclopédia) | P0/P1 |
| Ícones de item | 8 | P0 |
| Ícones de efeito/status | 14 | P0 |
| Ícones de atributo, elemento, categoria, grau, clã | 8 + 5 + 4 + 7 + 7 | P0/P1 |
| Ícones de título | 7 títulos + 4 elementos × 3 níveis (Raio fica oculto) | P1 |
| Ícones de interface e de ação | ~40 | P0 |
| Componentes de interface | ~25 (molduras, barras, botões, cartões, abas…) | P0/P1 |
| Logo, favicon, telas de abertura | 5 | P0/P1 |

---

## 3. Personagens jogáveis

O jogador **não escolhe aparência**: a criação pede só o nome, o clã e a afinidade. Por isso o visual muda **por clã**. A pergunta em aberto é se haverá escolha de gênero ou de aparência na criação. Se houver, cada linha abaixo multiplica pelo número de variações.

### 3.1 Sprites de batalha (P0)
Exibição de ~170–190 px de altura; com a grade recomendada, quadros de 96 × 96 a 2×. Virado para a **direita**.

| Asset | Descrição sugerida |
|---|---|
| `player_uchiha` | Ninja genin com roupa escura de gola alta, e o símbolo do leque (desenho original) nas costas ou no ombro |
| `player_uzumaki` | Ninja genin com roupa de cores quentes e o símbolo de espiral (original) |
| `player_semcla` | Ninja genin neutro, com bandana da Folha genérica (original) |

**Animações de cada sprite** (os eventos do motor que disparam cada uma estão em `src/game/events.ts`):

| Animação | Quadros (sugestão) | Disparada por |
|---|---|---|
| `idle` (respirando) | 4–6, em loop | Sempre |
| `attack` (golpe corpo a corpo) | 5–6 | Atacar, jutsus de Taijutsu (`actionChosen`) |
| `cast` (selos de mão) | 5–6 | Jutsus de Ninjutsu, Genjutsu e Fuinjutsu (`jutsuUsed`) |
| `throw` (arremesso) | 4 | Opcional: kunai e senbon dos inimigos |
| `hurt` (recebe dano) | 2–3 | `damage`, `dot` |
| `dodge` (desvia) | 3–4 | `dodge`, `miss` |
| `defend` (guarda) | 2, segurando | `defend` |
| `meditate` (concentrando chakra) | 4, em loop curto | `meditate` |
| `item` (usa item) | 3 | `itemUsed` |
| `controlled` (preso ou atordoado) | 2–4, em loop | `controlledSkip` |
| `victory` (pose de vitória) | 4–6 | `battleEnd` com vitória |
| `defeated` (cai) | 4–6 | `defeated` |

### 3.2 Variação: Sharingan (P0, só Uchiha)
- Hoje há uma **aura vermelha** e um contorno vermelho enquanto a transformação está ativa (`setAura`).
- Pedido: overlay de aura animada (loop), olhos vermelhos no sprite (troca de paleta ou camada dos olhos), um flash de **ativação** (`transformOn`) e um apagar de **desativação** (`transformOff`).

### 3.3 Retratos (P0)
| Asset | Tamanho | Onde aparece |
|---|---|---|
| `portrait_<clã>` (×3) | 256 × 256 (exibição 96–128) | Painel do jogador no HUD da batalha, aba Perfil da Ficha, prévia na Criação, Histórico de Runs |
| `portrait_<clã>_sharingan` | 256 × 256 | HUD com a transformação ativa (opcional, P1) |

### 3.4 Ilustração de clã para a Criação (P1)
| Asset | Tamanho | Onde |
|---|---|---|
| `clan_card_uchiha`, `clan_card_uzumaki`, `clan_card_semcla` | 400 × 560 | Cartões de escolha de clã na tela de Criação (`src/ui-dom/screens/CreateScreen.ts`) |

---

## 4. Inimigos

Os dados estão em `src/data/enemies.ts`. Sprites **virados para a esquerda**, com o mesmo tamanho e o mesmo conjunto de animações do jogador (idle, attack, cast/throw, hurt, dodge, defeated). Os inimigos não usam defend, meditate nem item.

### 4.1 Comuns (grau D) — P0
| `id` | Nome | Arquétipo | Golpe próprio | Aparece nos nós | Descrição sugerida |
|---|---|---|---|---|---|
| `bandido` | Bandido | Bruto | Golpe Pesado | 1–12 | Grandalhão com porrete ou facão, roupa rasgada |
| `ninja_renegado` | Ninja Renegado | Ninja | Kunai Lançada | 1–25 | Ninja de máscara com bandana riscada |
| `mercenario_nevoa` | Mercenário da Névoa | Ninja | Kunai Lançada | 14–25 | Mercenário com capa e tons de azul e cinza da Névoa |

### 4.2 Elites (grau D+) — P0
Aparecem na bifurcação "Comum ou Elite". Podem ser **variações** dos comuns (cor mais escura, cicatriz, acessório, contorno dourado) em vez de sprites novos.

| `id` | Nome | Base |
|---|---|---|
| `bandido_veterano` | Bandido Veterano | `bandido` |
| `renegado_veterano` | Renegado Veterano | `ninja_renegado` |
| `mercenario_veterano` | Mercenário Veterano | `mercenario_nevoa` |

### 4.3 Chefes — P0
Sprites **maiores** (~1,2× o jogador) e com mais animações, porque cada um é o clímax de metade da saga.

| `id` | Nome | Grau / elemento | Animações extras | Observação |
|---|---|---|---|---|
| `zabuza` | Zabuza Momochi | C / Água | `slash_big` (espada gigante, Kubikiribouchou); `vanish` / `reappear` (Kirigakure e Muon Satsujin); `cast_water` (Suiryuudan); **troca de fase** (< 50% de HP: pose mais agressiva) | Desenho original inspirado: espadachim com espada larga, sem cópia do visual canônico |
| `haku` | Haku | B / Água | `throw_senbon`; `cast_ice` (Makyou Hyoushou); `mirror_dash` (Sensatsu Suishou); **troca de fase** | Desenho original inspirado: ninja ágil com máscara |

### 4.4 Retratos de inimigos (P1)
`portrait_<id>` em 256 × 256 para os 8 inimigos. Aparecem no painel do inimigo no HUD, no mapa (próximo encontro) e no texto de morte do Histórico ("morreu para …").

---

## 5. Cenários

### 5.1 Fundos de batalha (Phaser, 1280 × 720 @2x) — P0
Hoje o fundo é uma cor lisa (`#12141a`) com uma faixa de chão (`#1d2a20`). A saga pede variar o cenário por trecho (DESIGN §12).

| Asset | Usado em | Descrição sugerida |
|---|---|---|
| `bg_estrada_floresta` | Nós 1–12 (Bandido, Renegado) | Estrada de terra entre árvores, de dia |
| `bg_costa_nevoa` | Nós 14–25 (Mercenário, Renegado) | Costa rochosa com névoa leve |
| `bg_lago_nevoa` | Nó 13 (Zabuza) | Margem de lago enevoado |
| `bg_ponte` | Nó 26 (Haku) | Ponte em construção sobre o mar |
| `bg_acampamento` | Tela de Acampamento (antes dos chefes) | Fogueira no meio da floresta, à noite (pode ser só tela, não arena) |

Cada fundo deve ter **3 camadas** (céu, meio e chão), para permitir um parallax leve. O chão precisa de uma linha clara de onde os pés pisam.

### 5.2 Camadas de efeito de cenário (P1)
| Asset | Quando | Descrição |
|---|---|---|
| `overlay_nevoa` | Efeito `nevoa` ativo (Kirigakure do Zabuza) | Névoa animada em loop, semitransparente |
| `overlay_espelhos_gelo` | Efeito `makyou` ativo (Haku) | Cúpula de espelhos de gelo ao redor do jogador |

### 5.3 Fundos de tela fora da batalha (DOM, 1920 × 1080, escuros e discretos) — P1
| Asset | Tela | Arquivo da tela |
|---|---|---|
| `bg_menu` | Menu principal | `MenuScreen.ts` |
| `bg_criacao` | Criação de personagem | `CreateScreen.ts` |
| `bg_mapa` | Mapa da saga (ilustração do País da Onda, ou papel de pergaminho) | `MapScreen.ts` |
| `bg_preparacao` | Preparação: loja, jutsus, equipamento | `PrepScreen.ts` |
| `bg_resultado` | Resultado da batalha | `ResultScreen.ts` |
| `bg_fim_vitoria` / `bg_fim_morte` | Fim da run | `RunEndScreen.ts` |
| `bg_biblioteca` | Enciclopédia, Histórico, Títulos (estantes, pergaminhos) | `EncyclopediaScreen.ts`, `HistoryScreen.ts`, `TitlesScreen.ts` |
| `bg_erro` | Tela de erro (ilustração leve, ex.: pergaminho rasgado) | `ErrorScreen.ts` |

---

## 6. Efeitos visuais de batalha (VFX)

O motor emite eventos e o Phaser anima cada um (`src/scenes/BattleScene.ts`, durações em `src/scenes/animationQueue.ts`). Hoje tudo é tremor, flash de cor e texto flutuante.

### 6.1 Genéricos — P0
| Asset | Evento | Hoje | Pedido |
|---|---|---|---|
| `fx_hit` | `damage` sem jutsu (Atacar) | Flash branco + tremor | Faísca ou estrela de impacto (3–5 quadros) |
| `fx_hit_<elemento>` (×5 + neutro) | `damage` de jutsu elemental | Flash na cor do elemento | Impacto colorido por elemento: chama, corte de vento, faísca elétrica, estilhaço de pedra, respingo |
| `fx_crit` | `damage` crítico | Texto "CRÍTICO!" amarelo | Explosão maior + banner `fx_text_crit` |
| `fx_dodge` | `dodge` | Texto "ESQUIVOU" | Rastro de imagem (afterimage) + `fx_text_dodge` |
| `fx_miss` | `miss` (Henge) | Texto | Fumaça "puff" + `fx_text_miss` |
| `fx_negated_log` | `negated` por Kawarimi | Texto | Fumaça + **tronco de madeira** no lugar do personagem |
| `fx_negated_clone` | `negated` por clone (Kage Bunshin) | Texto | Clone que some numa fumaça |
| `fx_heal` | `heal` (kit médico) | Número verde | Brilho verde subindo |
| `fx_chakra` | `heal` (pílula), `meditate`, `chakraRegen` | Nenhum | Brilho azul (aura de chakra) |
| `fx_defend` | `defend` | Nenhum | Escudo ou postura de guarda translúcida |
| `fx_item` | `itemUsed` | Nenhum | Ícone do item subindo e sumindo |
| `fx_effect_applied` | `effectApplied` | Nome do efeito em roxo | Ícone do efeito (§8.3) pulsando sobre o alvo |
| `fx_effect_resisted` | `effectResisted` (Tenacidade) | Nenhum | Escudo quebrando + texto "RESISTIU" |
| `fx_defeated` | `defeated` | Personagem fica translúcido | Queda + nuvem de fumaça |
| `fx_battle_start` | `battleStart` | Nenhum | Banner de entrada ("Lute!") + entrada dos lutadores |
| `fx_battle_end_win` / `_lose` | `battleEnd` | Nenhum | Banner "VITÓRIA" / "DERROTA" |
| `fx_turn_marker` | `turnStart` | Texto no HUD | Seta ou brilho sob o lutador da vez |

### 6.2 Números e textos flutuantes — P0
Hoje usam a fonte do sistema com contorno preto. Pedido: uma **fonte bitmap** ou de jogo, com estilos distintos.

| Estilo | Cor atual | Uso |
|---|---|---|
| Dano | `#ff5a4f` | `damage` |
| Dano crítico | `#ffd23f`, maior | `damage` crítico |
| Dano contínuo | `#ff8c42` | `dot` |
| Cura | `#59c98a` | `heal` |
| Texto de estado | `#cfd8dc` / `#b98ce8` | ESQUIVOU, ERROU, ANULADO, nome do efeito |

### 6.3 Por jutsu do jogador — P0 (dano) / P1 (suporte)
| `id` do jutsu | Nome | VFX sugerido |
|---|---|---|
| `bola_de_fogo` | Bola de Fogo Básica | Bola de fogo pequena atravessando a tela |
| `goukakyuu` | Katon: Goukakyuu | Grande bola de fogo saindo da boca (Uchiha) |
| `daitoppa` | Fuuton: Daitoppa | Rajada de vento horizontal com folhas |
| `suiryuudan` | Suiton: Suiryuudan | Dragão de água em arco |
| `sennen_goroshi` | Sennen Goroshi | Golpe rápido por trás + estrela cômica (desenho original) |
| `investida_ninja` | Investida Ninja | Dash com rastro de velocidade |
| `henge` | Henge no Jutsu | Fumaça + silhueta trocada por um instante |
| `bunshin` | Bunshin no Jutsu | 2 clones translúcidos ao redor do jogador |
| `kawarimi` | Kawarimi no Jutsu | Tronco aparecendo (a carga fica visível como ícone) |
| `kage_bunshin` | Kage Bunshin no Jutsu | Fumaça + 2 clones sólidos atrás do jogador enquanto o efeito dura |
| `doryuuheki` | Doton: Doryuuheki | Muralha de lama subindo à frente do jogador (persiste 3 turnos) |
| `kai` | Kai | Onda que quebra uma ilusão como vidro |
| `kongou_fuusa` | Kongou Fuusa (Uzumaki) | Correntes de chakra douradas saindo das costas e prendendo o alvo |
| `genjutsu_sharingan` | Genjutsu: Sharingan (Uchiha) | Olho vermelho em close + espiral no alvo |

### 6.4 Golpes de inimigos — P0
| `id` | Nome | VFX sugerido |
|---|---|---|
| `golpe_pesado` | Golpe Pesado | Pancada com impacto no chão |
| `kunai_lancada` | Kunai Lançada | Kunai em voo (projétil) |
| `kubikiribouchou` | Kubikiribouchou | Corte largo em arco com a espada gigante |
| `kirigakure` | Kirigakure no Jutsu | A névoa toma a arena (liga `overlay_nevoa`) |
| `muon_satsujin` | Muon Satsujin | Zabuza some e reaparece atrás do alvo |
| `senbon` | Senbon | Várias agulhas finas em leque |
| `makyou_hyoushou` | Makyou Hyoushou | Espelhos de gelo surgindo (liga `overlay_espelhos_gelo`) |
| `sensatsu_suishou` | Sensatsu Suishou | Chuva de agulhas de água ou gelo convergindo |

### 6.5 Status persistentes no lutador — P0
Loops pequenos que ficam sobre o personagem enquanto o efeito dura (`src/data/effects.ts`).

| Efeito | VFX em loop |
|---|---|
| `queimadura` | Chamas pequenas nos pés + tique a cada turno |
| `imobilizado` | Correntes ao redor do corpo |
| `atordoado` | Estrelas ou espirais girando sobre a cabeça |
| `ilusao` | Distorção ondulada + olho translúcido |
| `lentidao` | Rastro azulado lento / ícone de caracol |
| `defesa_reduzida` | Rachadura no escudo |
| `bunshin`, `kage_bunshin` | Clones (ver §6.3) |
| `doryuuheki` | Muralha (ver §6.3) |
| `nevoa`, `makyou` | Overlays de cenário (§5.2) |
| `sharingan` | Aura vermelha (§3.2) |
| `reforco_*` | Brilho leve da cor do atributo |
| Tenacidade (imunidade) | Contorno prateado breve |

---

## 7. Ícones de conteúdo

Formato: **SVG** ou PNG de 128 × 128, exibidos a 32–64 px. Todos precisam funcionar em versão **bloqueada** (silhueta escura com cadeado), porque a Enciclopédia mostra itens não desbloqueados.

### 7.1 Jutsus jogáveis no MVP (14) — P0
Aparecem na barra de ações, na Preparação (aba Jutsus), na Ficha, no Resultado (jutsu aprendido) e na Enciclopédia.

| `id` | Nome | Categoria | Elemento | Clã |
|---|---|---|---|---|
| `henge` | Henge no Jutsu | Ninjutsu | — | — |
| `bunshin` | Bunshin no Jutsu | Ninjutsu | — | — |
| `kawarimi` | Kawarimi no Jutsu | Ninjutsu | — | — |
| `bola_de_fogo` | Bola de Fogo Básica | Ninjutsu | Fogo | — |
| `sennen_goroshi` | Sennen Goroshi | Taijutsu | — | — |
| `investida_ninja` | Investida Ninja | Taijutsu | — | — |
| `kai` | Kai | Genjutsu | — | — |
| `daitoppa` | Fuuton: Daitoppa | Ninjutsu | Vento | — |
| `doryuuheki` | Doton: Doryuuheki | Ninjutsu | Terra | — |
| `suiryuudan` | Suiton: Suiryuudan | Ninjutsu | Água | — |
| `kage_bunshin` | Kage Bunshin no Jutsu | Ninjutsu | — | — |
| `kongou_fuusa` | Kongou Fuusa | Fuinjutsu | — | Uzumaki |
| `goukakyuu` | Katon: Goukakyuu | Ninjutsu | Fogo | Uchiha |
| `genjutsu_sharingan` | Genjutsu: Sharingan | Genjutsu | — | Uchiha |

### 7.2 Golpes de inimigos (8) — P1
Aparecem no log e, no futuro, no Livro Bingo: `golpe_pesado`, `kunai_lancada`, `kubikiribouchou`, `kirigakure`, `muon_satsujin`, `senbon`, `makyou_hyoushou`, `sensatsu_suishou`.

### 7.3 Jutsus de fases futuras (29) — P1
**Já aparecem na Enciclopédia** (bloqueados, com requisitos), por isso precisam de ícone no MVP. Alternativa barata: um ícone genérico por categoria e elemento até a fase deles chegar.

| Grupo | `id`s |
|---|---|
| Gerais | `konoha_senpuu`, `jubaku_satsu`, `nehan_shouja`, `gogyou_fuuin`, `naruto_rendan`, `shishi_rendan`, `chidori`, `rasengan`, `kuchiyose`, `rasen_shuriken`, `omote_renge` |
| Uzumaki | `hakke_no_fuuin_shiki` |
| Uchiha | `ryuuka`, `amaterasu`, `tsukuyomi` |
| Hyuuga | `jyuuken`, `hakke_sanjuuni`, `kaiten`, `hakke_rokujuuyon` |
| Nara | `kagemane`, `kagenui`, `kage_kubishibari` |
| Akimichi | `bubun_baika`, `baika`, `nikudan_sensha`, `chou_baika` |
| Aburame | `kikaichuu`, `mushi_bunshin`, `mushidama` |

### 7.4 Itens (8) — P0
Os dados estão em `src/data/items.ts`. Aparecem na loja, no inventário da batalha (tecla `I`), na escolha 1-de-3, na Ficha (aba Equipamento) e na Preparação.

| `id` | Nome | Tipo |
|---|---|---|
| `kit_medico` | Kit médico | Consumível |
| `pilula_chakra` | Pílula de chakra | Consumível |
| `pergaminho_reforco` | Pergaminho de Reforço | Consumível |
| `kunai` | Kunai | Arma |
| `katana` | Katana | Arma |
| `colete_ninja` | Colete ninja | Armadura |
| `colete_reforcado` | Colete reforçado | Armadura |
| `pergaminho_raro` | Pergaminho Raro | Raro (precisa de destaque: brilho ou moldura especial) |

**Também (P0):** ícones das **opções da escolha 1-de-3** que não são itens: `reward_ryo` (bolsa de ryo) e `reward_treino` (treino / boneco de madeira).

### 7.5 Efeitos e status (14) — P0
O campo `icon` já existe nos dados (`src/data/effects.ts`). Hoje aparecem como "chips" de texto no HUD.

| `icon` | Efeito(s) | Tipo |
|---|---|---|
| `burn` | Queimadura | Dano contínuo |
| `def-down` | Defesa Reduzida | Debuff |
| `slow` | Lentidão | Debuff |
| `chains` | Imobilizado | Controle |
| `stun` | Atordoado | Controle |
| `eye` | Ilusão | Controle |
| `mask` | Henge | Buff (carga) |
| `clones` | Clones Ilusórios (Bunshin) | Buff |
| `log` | Substituição (Kawarimi) | Buff (carga) |
| `wall` | Muralha de Lama | Buff |
| `shadow-clones` | Clones das Sombras | Buff (carga) |
| `mist` | Névoa | Buff (inimigo) |
| `mirrors` | Espelhos de Gelo | Buff (inimigo) |
| `sharingan` | Sharingan | Transformação |
| `scroll` | Reforço de Taijutsu/Ninjutsu/Genjutsu/Velocidade/Defesa | Buff (5 variações: ícone base + mini-ícone do atributo) |

**Também:** `tenacity` (imunidade a controle por 2 turnos) e um selo de **"sustentado" (∞)** para a transformação.

Os ícones de efeito precisam de **molduras por tipo** (buff, debuff, controle, dano contínuo, transformação), com forma diferente para cada tipo, não só cor, e de um espaço para o **contador de turnos**.

### 7.6 Atributos (8) — P0
`hp`, `nin`, `tai`, `gen`, `int`, `vel`, `crit`, `def`. Aparecem na distribuição de pontos (Criação, Resultado), na Ficha (incluindo o radar de 8 pontas), nos requisitos de jutsu e no Pergaminho Raro.

### 7.7 Elementos (5) — P0
`fogo`, `vento`, `raio` (só F2), `terra`, `agua`. Cada um com forma própria (chama, espiral, raio, rocha, gota). Também uma **roda elemental** (Fogo → Vento → Raio → Terra → Água → Fogo) para a Criação e para uma tela de ajuda (P1).

### 7.8 Categorias de jutsu (4) — P0
`ninjutsu`, `taijutsu`, `genjutsu`, `fuinjutsu`. Usadas nos filtros da Enciclopédia e nos cartões de jutsu.

### 7.9 Graus (7) — P0
Selos para `D`, `D+`, `C`, `B`, `A`, `S` e **Raro**. Usados nos itens, inimigos e jutsus. Cada grau com forma ou moldura própria, além da cor.

### 7.10 Clãs (7) — P0 para 3, P2 para 4
Emblemas **originais** (nunca o símbolo oficial copiado): `uchiha`, `uzumaki`, `semcla` (P0); `hyuuga`, `nara`, `akimichi`, `aburame` (P2, hoje só existem como dados).

### 7.11 Títulos — P1
Os dados estão em `src/data/titles.ts`. Aparecem na tela de Títulos, na Criação (título inicial), na Ficha (Perfil) e no Fim da run (títulos conquistados).

| `id` | Nome | Visível no MVP |
|---|---|---|
| `demonio_da_nevoa` | Demônio da Névoa | sim |
| `cacador_de_bandidos` | Caçador de Bandidos | sim |
| `sem_um_arranhao` | Sem um Arranhão | sim |
| `por_um_fio` | Por um Fio | sim |
| `mestre_de_jutsus` | Mestre de Jutsus | sim |
| `colecionador` | Colecionador | oculto (F2) |
| `novo_chunin` | Novo Chunin | oculto (F2) |
| `iniciante_*`, `adepto_*`, `mestre_*` | Linha por elemento (Fogo, Vento, Terra, Água) | sim (12); Raio oculto (3) |

Para a linha por elemento: **1 medalha base × 3 níveis** (bronze, prata, ouro, com marcação I/II/III) combinada com o ícone do elemento. Assim não são 15 desenhos únicos. Também um ícone de **título bloqueado**.

---

## 8. Interface (HUD e telas)

### 8.1 Identidade — P0
| Asset | Tamanho | Uso |
|---|---|---|
| `logo` | 1200 × 400 (SVG) | Menu principal, tela de carregamento |
| `logo_compacto` | 256 × 256 | Cabeçalhos |
| `favicon` | 16/32/48 + 180 (apple-touch) | Aba do navegador (`index.html`) |
| `loading_screen` | 1280 × 720 | Enquanto o Phaser carrega e os dados são validados (`BootScene`) |

### 8.2 HUD da batalha — P0
Arquivo: `src/ui-dom/screens/BattleScreen.ts`. O layout atual é painel do jogador | centro | painel do inimigo, com o log embaixo e a barra de ações.

| Asset | Descrição |
|---|---|
| `frame_fighter_player` / `frame_fighter_enemy` | Moldura dos painéis laterais (nome, nível, Poder Ninja, barras, indicadores, efeitos) |
| `frame_fighter_boss` | Variação para chefe, mais ornamentada |
| `badge_boss` | Selo "Chefe" |
| `bar_hp`, `bar_chakra` | Barras com moldura, preenchimento e animação de perda (o "fantasma" que encolhe atrás). Cores atuais: HP `#d6453d`, chakra `#3a7bd5` |
| `bar_xp` | Barra de XP (Resultado, Ficha) |
| `bar_mastery` | Barra de progresso de maestria (Preparação, Ficha) |
| `icon_power` | Ícone de **Poder Ninja** |
| `icon_crit`, `icon_reduction`, `icon_dodge` | Indicadores do painel (crítico %, redução %, esquiva %) |
| `turn_indicator` | Faixa "Seu turno" / "Turno do inimigo" / "Resolvendo..." / aviso de Ilusão |
| `frame_log` | Moldura do log de batalha |
| `action_bar` | Fundo da barra de ações |
| `btn_action_<ação>` (×5) | Botões **Atacar**, **Defender**, **Meditar**, **Item**, **Transformar**, cada um com ícone próprio e estados normal, hover, apagado e selecionado |
| `btn_jutsu_slot` (×4) | Botão de jutsu com espaço para: ícone, número do atalho (1–4), custo de chakra, nível de maestria e motivo quando apagado |
| `keycap` | Ícone de tecla (para os atalhos A, D, M, I, T, 1–4, Enter, Esc) |
| `panel_items` | Painel da lista de itens (tecla `I`) |
| `panel_jutsu_desc` | Caixa de descrição do jutsu com o botão Usar |
| `dialog_reforco_attr` | Escolha do atributo do Pergaminho de Reforço |
| `btn_ficha` | Botão da Ficha (somente leitura) no painel do jogador |

### 8.3 Mapa da saga — P0
Arquivo: `src/ui-dom/screens/MapScreen.ts`. Hoje é uma grade de 13 × 2 com texto e bordas.

| Asset | Descrição |
|---|---|
| `node_comum` | Nó de encontro comum |
| `node_elite` | Nó com bifurcação **Comum ou Elite** (dois caminhos) |
| `node_chefe_zabuza`, `node_chefe_haku` | Nós de chefe (ou um `node_chefe` com o retrato do chefe) |
| `node_acampamento` | Acampamento (hoje é o emoji ⛺) |
| Estados de nó | **Vencido** (apagado + check), **atual** (destaque + pulso), **futuro** (neutro), **bloqueado** |
| `map_path` | Trilha ligando os nós (com bifurcação nas elites) |
| `map_marker_player` | Marcador "você está aqui" |
| `btn_descansar`, `btn_enfrentar_elite`, `btn_lutar` | Botões principais do mapa |

### 8.4 Telas e componentes gerais — P0/P1
| Asset | Onde | Prioridade |
|---|---|---|
| `btn_primary`, `btn_secondary`, `btn_disabled` | Todas as telas (hoje em CSS) | P0 |
| `panel`, `card`, `card_selected` | Todas as telas | P0 |
| `tabs` (ativa/inativa, com marcador textual) | Preparação, Ficha, Enciclopédia | P0 |
| `dialog_frame` + `modal_overlay` | Confirmações, troca de jutsu, abandono de run | P0 |
| `toast_info`, `toast_error` | Avisos (`#toast-layer`) | P1 |
| `badge` (genérico) | Grau, chefe, "Equipado", "Novo" | P0 |
| `icon_lock` | Jutsu ou título bloqueado, botão indisponível | P0 |
| `icon_check` | Nó vencido, item equipado, título conquistado | P0 |
| `seal_mastery_5` | Selo **"★ Maestria +5"** (Enciclopédia, Ficha) | P1 |
| `icon_ryo` | Moeda (loja, recompensa, Perfil) | P0 |
| `icon_reputacao` | Reputação | P0 |
| `icon_xp`, `icon_level_up` | Resultado, Perfil | P0 |
| `icon_close` (×) | Fechar diálogos (hoje é o caractere "×") | P0 |
| `radar_bg` | Fundo do gráfico octogonal de 8 atributos (Ficha → Atributos) | P1 |
| `icon_preset_<id>` | Presets Ninjutsu, Taijutsu, Equilibrado-guiado (Criação, Resultado) | P1 |
| `icon_fighting_style_<estilo>` | Rótulos de estilo de luta (Especialista em Ninjutsu, Lutador de Taijutsu, Ilusionista, Estrategista, Muralha, Ágil, Equilibrado) | P1 |
| `icon_swap` | Diálogo de troca de jutsu ao aprender com os slots cheios | P1 |
| `icon_story_point` | Ponto da história na Ficha (Início, Saga da Onda, após Zabuza) | P1 |
| `cursor` (normal / clicável) | Opcional | P1 |

### 8.5 Banners e momentos — P1
| Asset | Quando |
|---|---|
| `banner_level_up` | Subiu de nível (Resultado) |
| `banner_jutsu_learned` | Aprendeu jutsu (Resultado, Preparação) |
| `banner_boss_defeated` | Derrotou Zabuza ou Haku |
| `banner_title_unlocked` | Título conquistado (Fim da run) |
| `banner_victory_saga` | Saga concluída (Fim da run) |
| `banner_death` | Morte (Fim da run) |
| `banner_abandoned` | Run abandonada (Fim da run, Histórico) |
| `card_reward_choice` | Moldura das 3 cartas da escolha 1-de-3 |

### 8.6 Menu principal — P0
Arquivo: `src/ui-dom/screens/MenuScreen.ts`. Ícones para cada opção:

| Opção | Ícone |
|---|---|
| Continuar run | `menu_continue` |
| Modo História | `menu_story` |
| Modo Infinito ("Em breve") | `menu_infinite` + selo "Em breve" |
| Enciclopédia de Jutsus | `menu_encyclopedia` |
| Histórico de Runs | `menu_history` |
| Títulos | `menu_titles` |
| Livro Bingo [F2] | `menu_bingo` (P2) |

---

## 9. Inventário por tela (para conferência)

| Tela | Arquivo | Assets usados |
|---|---|---|
| Carregamento | `BootScene.ts` | logo, `loading_screen` |
| Menu | `MenuScreen.ts` | `bg_menu`, logo, ícones do menu, botões |
| Criação | `CreateScreen.ts` | `bg_criacao`, `clan_card_*`, emblemas de clã, ícones de elemento e roda elemental, ícones de atributo, presets, ícones de título, ícones de jutsu (lista "jutsus que esta build libera"), retrato do clã na prévia |
| Mapa | `MapScreen.ts` | `bg_mapa`, nós e estados, trilha, marcador, retratos dos inimigos, selos de grau, Acampamento, botões |
| Batalha | `BattleScreen.ts` + `BattleScene.ts` | fundo da arena, sprites e animações, VFX, números flutuantes, HUD completo (§8.2), ícones de jutsu, item, efeito e elemento |
| Resultado | `ResultScreen.ts` | `bg_resultado`, ícones de XP, ryo e reputação, `banner_level_up`, `banner_jutsu_learned`, ícones de atributo, cartas 1-de-3 com ícones de recompensa, metas "faltam X" com ícone de jutsu |
| Troca de jutsu | `components/swap.ts` | `dialog_frame`, `icon_swap`, ícones de jutsu |
| Preparação | `PrepScreen.ts` | `bg_preparacao`, abas, ícones de item com preço e ryo, ícones de jutsu com barra de maestria, equipamento, atributos |
| Ficha do Ninja | `SheetScreen.ts` | retrato, abas, Poder Ninja, estilo de luta, radar, ícones de atributo, jutsu, item, título e grau |
| Enciclopédia | `EncyclopediaScreen.ts` | `bg_biblioteca`, ícones dos jutsus (todos, com versão bloqueada), categoria, elemento, grau, clã, `seal_mastery_5`, filtros |
| Histórico | `HistoryScreen.ts` | `bg_biblioteca`, retrato do clã, retrato do inimigo que matou, selos de resultado (vitória, morte, abandono) |
| Títulos | `TitlesScreen.ts` | `bg_biblioteca`, ícones dos títulos (conquistado ou bloqueado) |
| Fim da run | `RunEndScreen.ts` | `bg_fim_*`, banners, ícones de título conquistado, estatísticas com ícones |
| Erro | `ErrorScreen.ts` | `bg_erro`, botão Recarregar |

---

## 10. Fases futuras (P2): o que já dá para prever

- **Clãs novos:** sprite, retrato, cartão e emblema de **Hyuuga, Nara, Akimichi, Aburame**, além das transformações e VFX próprias (Byakugan, sombras, expansão, insetos).
- **Sharingan tomoe 2 e 3:** variações da aura e dos olhos.
- **Raio e Chidori:** ícone e VFX do elemento Raio.
- **Saga do Exame Chunin:** inimigos novos (Orochimaru, Gaara e outros), cenários (Floresta da Morte, arena do exame), nós de mapa e banners de promoção.
- **Rank ninja:** selos Genin, Chunin, Jounin, barra de reputação e bandana por rank.
- **Tela de equipamento com silhueta:** silhueta do ninja + slots Bandana, Luvas, Calça, Botas, Pergaminho, Arma, Armadura, com ícones de slot vazio.
- **Equipamento visível no sprite:** camadas de arma e armadura sobre o personagem.
- **Livro Bingo:** cartões de inimigo, retratos e selo de "derrotado".
- **Registro de Batalha** (aba da Ficha): ícones de estatística.
- **Modo Infinito**, cosméticos, Pontos de Legado.
- **Layout mobile** (< 1024 px): versões compactas do HUD.

---

## 11. Ordem sugerida de produção

1. **Direção de arte** (§1): estilo, paleta, grade de pixel e fontes. Fechar com 1 personagem e 1 fundo de teste antes de produzir em série.
2. **Batalha completa de um encontro:** `player_semcla` + `bandido` + `bg_estrada_floresta` + VFX genéricos (§6.1) + números (§6.2) + HUD (§8.2). É o que o jogador mais vê.
3. **Os outros 2 clãs** + Sharingan + os outros inimigos comuns e elites.
4. **Chefes** (Zabuza, Haku), com fundos, overlays e VFX dos golpes.
5. **Ícones de conteúdo** (§7): jutsus jogáveis, itens, efeitos, atributos, elementos, graus e clãs.
6. **Mapa, menu, logo, favicon.**
7. **P1:** fundos de tela, retratos de inimigos, banners, títulos, ícones dos jutsus futuros.

---

## 12. Convenção de arquivos

> **Superada em 2026-10-22.** O código adotou outra convenção (pastas em português, ids de arte para lutadores, `<tipo>/<id>.svg` para ícones). A convenção vigente está em `docs/ARTE-PIPELINE.md` §3; a lista abaixo fica como registro do pedido original. Os créditos estão em `docs/LICENCAS-ASSETS.md` (não existe CREDITS.md).

- **Pasta:** `public/assets/` (o Vite serve `public/` direto na raiz do site).
- **Estrutura:**
  ```
  public/assets/
    characters/  player_<clã>.png + .json (spritesheet/atlas), portrait_<id>.png
    enemies/     <id>.png + .json, portrait_<id>.png
    backgrounds/ bg_<nome>.png (camadas: bg_<nome>_sky/_mid/_ground.png)
    fx/          fx_<nome>.png + .json
    icons/       jutsu/<id>.svg, item/<id>.svg, effect/<icon>.svg, attr/<key>.svg,
                 element/<id>.svg, category/<id>.svg, grade/<grau>.svg, clan/<id>.svg,
                 title/<id>.svg, ui/<nome>.svg
    ui/          frames, barras, botões, banners
    fonts/
  ```
- **Nomes:** minúsculas, `snake_case`, usando **exatamente os `id`s dos dados** (`kit_medico`, `goukakyuu`, `demonio_da_nevoa`…). Os ícones de efeito usam o campo `icon` (`burn`, `chains`, `shadow-clones`…).
- **Spritesheets:** atlas do Phaser (PNG + JSON, ex.: exportado do Aseprite ou TexturePacker), com as animações nomeadas como em §3.1 (`idle`, `attack`, `cast`…).
- **Formatos:** PNG para pixel art e fundos; SVG para ícones de interface; WOFF2 para fontes.
- **Licença:** registrar a origem e a licença de cada asset de terceiros num `public/assets/CREDITS.md`.

---

## 13. Estado da entrega, 2026-10-22

> **Acréscimo.** Contagens feitas nesta data com a lista de arquivos de assets/ e public/assets/. **Entrega** = veio do colaborador em 2026-10-16 (`docs/AUDITORIA-ASSETS.md`). **tools** = gerado por código do repositório: `tools/art/pack.py` (`npm run art:build`) ou `tools/gen-icons.py`. **Em uso** = algum arquivo de src/ carrega o asset. Autoria e licença de cada origem: `docs/LICENCAS-ASSETS.md` (a da entrega não foi declarada; a da arte gerada é decisão pendente do Gabriel).

### 13.1 Personagens jogáveis (§3)

| Item | Coberto pela entrega | Gerado por tools | Ainda falta |
|---|---|---|---|
| §3.1 Sprites dos 3 clãs | — | 3 folhas (`player_semclan`, `player_uchiha`, `player_uzumaki`) em public/assets/sprites/, cada uma com 6 animações e 35 quadros (`idle` 6, `attack` 7, `cast` 7, `hit` 4, `death` 7, `dodge` 4). **Em uso** na arena | `throw`, `defend`, `meditate`, `item`, `controlled`, `victory`. A `dodge` existe, mas a arena não a toca |
| §3.2 Sharingan | — | `fx_aura_sharingan` (aura em loop) e `fx_transform_on` (ativação). **Em uso** | Olhos vermelhos no sprite e o apagar da desativação |
| §3.3 Retratos | 4 PNG, **rejeitados** por PI e guardados em assets/_quarentena/ (fora do Git e do build) | 3 retratos 256 × 256 (`portrait_player_*`) em public/assets/retratos_originais/. **Sem uso**: as telas usam o PNG estático | Ligar às telas; `portrait_<clã>_sharingan` |
| §3.4 Cartões de clã | — | — | Os 3 |

### 13.2 Inimigos (§4)

| Item | Coberto pela entrega | Gerado por tools | Ainda falta |
|---|---|---|---|
| §4.1 e §4.2 Comuns e elites | — | 3 folhas (`inimigo_bandido`, `inimigo_renegado`, `inimigo_ninjaagua`), 6 animações cada. As 3 elites usam a folha do comum (`ENEMY_ART` em `src/data/art.ts`). **Em uso** | Variação visual das elites |
| §4.3 Chefes | — | 2 folhas: `chefe_zabuza` (quadro de 256 px) e `chefe_haku` (224 px), com as 6 animações básicas. **Em uso** | As animações extras (`slash_big`, `vanish`/`reappear`, `cast_water`, `throw_senbon`, `cast_ice`, `mirror_dash`) e a pose da 2ª fase |
| §4.4 Retratos de inimigos | — | 5 retratos (um por arte de inimigo; as elites dividem com o comum). **Sem uso** | Ligar às telas |

### 13.3 Cenários (§5)

| Item | Coberto pela entrega | Gerado por tools | Ainda falta |
|---|---|---|---|
| §5.1 Fundos de batalha | Só uma imagem de referência, sem camadas (em assets/_referencia/) | 15 camadas WebP 1280 × 720: `estrada_floresta`, `costa_nevoa`, `lago_nevoa`, `ponte` e `acampamento`, cada um em `_ceu`, `_meio` e `_chao` (sem o prefixo `bg_`). **Em uso**, escolhidos pelo inimigo | Parallax; o `acampamento` não é usado por nenhum inimigo; Zabuza luta na `ponte` e Haku no `lago_nevoa`, o contrário da tabela da §5.1 (`battleSceneFor` em `src/data/art.ts`) |
| §5.2 Overlays | — | 2: `overlay_nevoa` (512 × 512, repetível) e `overlay_espelhos_gelo` (1280 × 720). **Em uso**, ligados ao inimigo | Ligar ao efeito `nevoa` ou `makyou` ativo em vez do inimigo |
| §5.3 Fundos de tela DOM | 9 WebP 1920 × 1080 com os nomes certos (assets/cenarios/tela/). **Em uso**, com véu escuro de 22% | — | Cenas realmente diferentes: as 9 continuam quase iguais (`docs/AUDITORIA-ASSETS.md` §2) |

### 13.4 Efeitos visuais (§6)

Gerados por tools: **48 efeitos** em public/assets/vfx/ (40 `fx_*` e 8 `st_*`). **41 ligados a eventos** (por `vfxForEvent` em `src/scenes/vfx.ts` ou pela aura do Sharingan); 7 gerados sem evento: `fx_slash`, `fx_fumaca`, `fx_tronco`, `fx_turn_marker`, `fx_explosao`, `fx_onda_agua`, `st_tenacidade`.

| Item | Gerado e em uso | Gerado, sem uso | Ainda falta |
|---|---|---|---|
| §6.1 Genéricos (17 linhas) | `fx_hit`, `fx_hit_<elemento>` (5) + `fx_hit_neutro`, `fx_crit`, `fx_dodge`, `fx_heal`, `fx_chakra`, `fx_defend`, `fx_resisted` (também para `negated`), `fx_defeated`; `fx_effect_applied` é coberto pelas marcas `st_*` | `fx_turn_marker`, `fx_tronco`, `fx_fumaca` | `fx_miss`, `fx_negated_clone`, `fx_item`, `fx_battle_start`, `fx_battle_end_win`/`_lose`, os banners de texto (`fx_text_*`) |
| §6.2 Números flutuantes | — | A fonte `numeros.woff2` da entrega (145 KB) | Estilo desenhado: a arena usa texto com a fonte do sistema |
| §6.3 Jutsus do jogador (14) | 10: `bola_de_fogo`, `goukakyuu`, `daitoppa`, `suiryuudan`, `sennen_goroshi`, `investida_ninja`, `kai`, `doryuuheki`, `kongou_fuusa`, `genjutsu_sharingan` (`JUTSU_FX`) | — | 4: `henge`, `bunshin`, `kawarimi` (existe `fx_tronco`, não ligado), `kage_bunshin` |
| §6.4 Golpes de inimigos (8) | Os 8 (`JUTSU_FX`) | — | — |
| §6.5 Status | 7 efeitos com marca ao serem aplicados: `queimadura`, `imobilizado`, `atordoado`, `ilusao`, `lentidao`, `defesa_reduzida` e os 5 `reforco_*` (um só `st_reforco`) | `st_tenacidade` | O loop **enquanto o efeito dura** (hoje a marca toca uma vez); clones e muralha persistentes |

### 13.5 Ícones de conteúdo (§7)

Todos os ids pedidos têm SVG em assets/icones/ (entrega), e `tools/gen-icons.py` redesenhou os repetidos: hoje são **194 ícones normais com 174 desenhos diferentes** e 80 variantes `_locked` (`tests/icons.test.ts` proíbe dois ids do mesmo tipo com o mesmo desenho).

| Item | Arquivos | Em uso | Ainda falta |
|---|---|---|---|
| §7.1–7.3 Jutsus (14 + 8 + 29 = 51) | 51 + 51 `_locked`, 51 desenhos diferentes | Sim (batalha) | Redesenhar os fracos a 28 px: `mushi_bunshin`, `naruto_rendan`, `kagenui`, `kage_kubishibari`, `kirigakure` |
| §7.4 Itens (8) + recompensas (2) | 10 | Sim (Preparação, batalha, Resultado) | Destaque do `pergaminho_raro` |
| §7.5 Efeitos (os 15 `icon` da tabela + `tenacity` + `sustained` + 5 `scroll_<atributo>`) | 22 | Não (os efeitos aparecem como texto no HUD) | Redesenhar os `scroll_<atributo>` (fracos a 28 px); as molduras por tipo existem em assets/ui/molduras_status/ (5), sem uso |
| §7.6 Atributos (8) | 8 | Sim (Criação, Preparação, Ficha, com tooltip) | — |
| §7.7 Elementos (5) + roda | 5 + `element_wheel` (assets/ui/identidade/) | Não (`ELEMENT_ICON` existe e é testado, sem tela que o use) | — |
| §7.8 Categorias (4) | 4 | Não | — |
| §7.9 Graus (7) | 7, cada um com forma própria e letra em `<path>` | Não (o grau aparece como texto no `.badge`) | — |
| §7.10 Clãs (7) | 7 + 7 `_locked` | Não | Revisão do emblema `uchiha` (`docs/AUDITORIA-ASSETS.md` §5) |
| §7.11 Títulos (22) | 22 + 22 `_locked` | Não | Os títulos por elemento estão fracos a 28 px |

### 13.6 Interface (§8)

| Item | Coberto pela entrega | Gerado por tools | Ainda falta |
|---|---|---|---|
| §8.1 Identidade | `logo`, `logo_compacto`, favicon (SVG, 32, 180). Favicon **em uso** no index.html; o logo não aparece em tela | `loading_screen` 1920 × 1080, **em uso** no `#splash` | — |
| §8.2 HUD da batalha | Todas as peças em assets/ui/hud/ (10), barras (12) e os `btn_action_*`/`btn_jutsu_slot` em assets/ui/botoes/. **Sem uso**: o HUD é CSS | — | Ícone próprio em cada `btn_action_*` (no jogo, os botões usam `ui/attack`, `ui/defend`, `ui/meditate`, `ui/item`, `ui/transform`, que **estão em uso**); decidir se as peças SVG entram |
| §8.3 Mapa | 11 peças em assets/ui/mapa/. **Sem uso** | — | `node_elite` diferente de `node_comum` |
| §8.4 Componentes gerais | 52 SVG de botões, 15 painéis, 2 abas, 41 ícones `ui/` (com `lock`, `check`, `ryo`, `xp`, `close`, `swap`…), presets (3) e estilos (7). Só os ícones de ação e recompensa estão **em uso** | — | `cursor` (opcional); redesenhar `ui/radar` (fraco a 28 px) |
| §8.5 Banners | 7 em assets/ui/banners/ + `card_reward_choice`. **Sem uso** | — | Diferenciar `banner_death` de `banner_boss_defeated` e os 4 banners de conquista; texto ou símbolo |
| §8.6 Menu | 7 ícones em assets/icones/menu/. **Sem uso** | — | — |

**Sugestão de ordem para o que falta** (não é decisão; as prioridades oficiais continuam as das seções acima): primeiro — ligar os retratos originais, estados de controle e loop de status, ícones nas ações e no mapa; depois fundos de tela diferentes, banners, cartões de clã, animações extras dos chefes; licença de tudo antes de publicar.
