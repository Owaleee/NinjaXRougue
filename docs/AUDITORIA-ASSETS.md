# Auditoria da entrega de arte — `assets/NarutoTxGame_Assets`

> **O que é.** Conferência da pasta entregue pelo colaborador de arte contra o que foi pedido em `docs/ASSETS.md` (inventário P0/P1/P2) e `docs/ARTE-PIPELINE.md` (formatos, tamanhos, nomes), à luz do plano `docs/superpowers/plans/2026-10-16-plano-4-arte.md`.
>
> **Feita em:** 2026-10-16, no branch `feat/mvp`. Só leitura: nenhum asset ou código foi movido, apagado ou editado. As medições foram feitas com `file`, Python 3 + Pillow 11.3.0, `md5` e `qlmanage` (miniaturas de SVG). O ImageMagick (`identify`) e o fontTools não estão instalados, por isso os metadados internos das fontes **não foram lidos**.

---

## 0. Veredito

**Bate parcialmente.** É um bom **kit de interface** (ícones SVG, HUD, mapa, botões, banners, fontes, 9-slice), com os ids certos em quase tudo. **Não é** a entrega do inventário inteiro: faltam todos os itens P0 de batalha (sprites animados, VFX, cenários de batalha em camadas). E a parte entregue tem três problemas sérios:

1. **Risco de PI nos retratos.** Os 4 retratos são recortes de uma imagem gerada por IA e mostram, de forma reconhecível, **Naruto Uzumaki** (cabelo loiro espetado, marcas no rosto) e **Sasuke Uchiha** (com e sem Sharingan). Três deles usam a **bandana com o símbolo oficial da Folha**. Isso viola a regra nº 1 do `docs/ASSETS.md` §0. Também não combinam com os lutadores atuais (o `player_uzumaki` do jogo é ruivo).
2. **Muitos ícones e peças repetidos.** Os 194 ícones "normais" têm só **73 desenhos diferentes**, e os 51 jutsus têm **23**. Vários nomes de interface recebem um desenho sem relação com o nome (por exemplo, `icon_back`, `icon_home`, `icon_menu`, `icon_profile` e `icon_up` são o mesmo escudo com X de `tenacity`). Os 9 fundos de tela DOM são **praticamente a mesma imagem** (diferença ≤ 1,1 % dos pixels). Os 12 botões se resumem a 3 cores, sem o ícone próprio de cada ação.
3. **A paleta e os detalhes técnicos não seguem o plano.** Dos 44 tons dos SVG de ícone, só 2 estão na paleta que o teste da Task 8 exige. Os selos de grau têm todos a mesma forma, e a letra deles é `<text>` com uma fonte do sistema. Os ids de gradiente (`metal`, `night`…) se repetem em todos os SVG.

---

## 1. O que a entrega declara (documentos lidos por inteiro)

| Arquivo | O que diz |
|---|---|
| `GUIA_DE_USO.md` | "Biblioteca de arte, não integração." Caminhos `public/assets/gui/…` e `public/assets/icones/<categoria>/<id>/`; 9-slice e WOFF2 em `src/assets/`. Admite a divergência entre o ASSETS.md e o ARTE-PIPELINE.md e diz que "a correspondência exata com `src/data/art.ts` precisa ser revisada", porque o repositório não foi fornecido. Avisa: **não há atlas de lutadores**, os retratos são **PARCIAIS** (com fundo ilustrado) e os cenários DOM são estáticos, sem parallax. |
| `INVENTARIO.md` | 555 arquivos de asset: 136 PNG, 407 SVG, 9 WebP e 3 WOFF2. São 4 parciais (retratos), com "0 problemas". Lista como **pendentes**: sprites animados (P0), VFX (P0), fundo de batalha em 3 camadas (P0), retratos sem fundo (P0) e `art.ts` (P0), além de itens P2. |
| `INVENTARIO.csv` | 555 linhas (`asset, categoria, prioridade, caminho, formato, dimensoes, estado, status, origem`). Origens: 539 "SVG autoral reconstruído", 9 "Procedural autoral pixel art" (os WebP), 4 "Imagem IA aprovada: atlas_de_sprites_ninja_em_pixel_art.png; fundo interno presente" e 3 fontes. |
| `VALIDACAO.json` | `total_arquivos: 555`, `erros: []`, transparência "validada" em 407 SVG e 136 PNG, `png_nitidos: true`. Não procura duplicatas nem compara com os ids. |
| `public/assets/CREDITOS.md` | SVG e fundos são uma "reconstrução original criada com scripts", com "referência visual" numa **prancha de GUI gerada por IA** (`wide_detailed_pixel_art_game_ui_concept_sheet_in.png`, não incluída). Retratos são recortes de `atlas_de_sprites_ninja_em_pixel_art.png`, **gerado por IA** ("autoria e direitos de terceiros devem ser avaliados antes de publicar"). Fontes: Cabin (OFL 1.1) e DejaVu Sans Mono Bold (Bitstream Vera). Recomenda "revisão humana final de semelhança". |
| src/assets/fontes/LICENCA_CABIN.txt, LICENCA_DEJAVU.txt (caminhos dentro da entrega; hoje em assets/fontes/) | São os arquivos `copyright` de pacote Debian (`fonts-cabin`, `fonts-dejavu-core`), com o texto integral da OFL 1.1 e da licença Bitstream Vera. Cabin tem "Reserved Font Name Cabin". |

**Contagem real:** 595 arquivos = 555 assets + 9 previews + 7 documentos + **26 `.DS_Store`** (lixo do macOS; o `.gitignore` já ignora). O número de 145 PNG inclui os 9 previews. Os números declarados conferem.

---

## 2. Cobertura por grupo (pedido × entregue)

Ids reais conferidos em `src/data/{jutsus,items,effects,enemies,titles,clans}.ts`, `src/game/types.ts` (`GRADES`, `ELEMENTS`), `src/game/progression/presets.ts` (`PRESET_IDS`) e `src/i18n/pt-BR.ts` (`style.*`).

| Grupo (ASSETS.md) | Prior. | Entregue | Falta | Sobra | Nome fora do padrão |
|---|---|---|---|---|---|
| Sprites de batalha dos 3 clãs + animações (§3.1) | P0 | — | **Tudo** (0 de 3) | — | — |
| Variação Sharingan (aura, olhos, flash) (§3.2) | P0 | — | **Tudo** | — | — |
| Retratos dos clãs (§3.3) | P0/P1 | 4 PNG 256×256 (`portrait_semcla`, `_uchiha`, `_uchiha_sharingan`, `_uzumaki`) | Recorte limpo, sem fundo e sem borda do quadro vizinho | — | O código usa `player_semclan`; a entrega usa `semcla` (o `ClanId`). **Bloqueados por PI (§5)** |
| Cartões de clã 400×560 (§3.4) | P1 | — | 3 | — | — |
| Inimigos (6 comuns e elites + 2 chefes) com animações (§4) | P0 | — | **Tudo** | — | — |
| Retratos de inimigos (§4.4) | P1 | — | 8 | — | — |
| Fundos de batalha em 3 camadas (§5.1) | P0 | Só `previews/referencia_cenario_batalha.png` (uma imagem RGB 1280×720, sem camadas) | `estrada_floresta`, `costa_nevoa`, `lago_nevoa`, `ponte`, `acampamento`, em `_ceu/_meio/_chao` | — | — |
| Overlays névoa e espelhos (§5.2) | P1 | — | 2 | — | — |
| Fundos de tela DOM (§5.3) | P1 | 9 WebP 1920×1080 (~14 KB), com todos os nomes certos | Variedade: as 9 são a mesma floresta noturna com lua, mudando ≤ 1,1 % dos pixels. O mapa não é "País da Onda/pergaminho" e a biblioteca não tem estantes | — | Pasta extra por id (`cenarios/bg_menu/bg_menu.webp`) |
| VFX genéricos, por jutsu e por status (§6.1, 6.3–6.5) | P0 | — | **Tudo** (~45) | — | — |
| Números flutuantes (§6.2) | P0 | Fonte `numeros.woff2` (DejaVu Sans Mono Bold) | — | — | — |
| Ícones de jutsu (§7.1–7.3) | P0/P1 | 51 + 51 `_locked`; **todos os 51 ids batem** com `jutsus.ts` | Desenho próprio: só 23 desenhos únicos. Ex.: `bola_de_fogo` = `goukakyuu` = `amaterasu` = `ryuuka` = `burn` = elemento `fogo`; `kunai_lancada` = `senbon` = `kubikiribouchou` = `rasen_shuriken` = itens `kunai` e `katana` | — | Pasta extra por id |
| Itens + recompensas (§7.4) | P0 | 8 + `reward_ryo`, `reward_treino`; **todos batem** com `items.ts` | Diferenciar: `kunai` = `katana`; `colete_ninja` = `colete_reforcado` = `wall`; `pergaminho_raro` = `pergaminho_reforco`, sem o destaque pedido | — | — |
| Efeitos e status (§7.5) | P0 | Os 15 `icon` de `effects.ts` + `tenacity` + `sustained_infinity` + `scroll_{tai,nin,gen,vel,def}` | `clones` = `shadow-clones` (os dois buffs ficam iguais) | — | `sustained_infinity` (o inventário fala só em "selo sustentado"). Aceitável |
| Molduras de efeito por tipo (§7.5) | P0 | 5 em `gui/molduras/status_*` (buff, debuff, controle, dano contínuo, transformação) | — | — | Em pt-BR, enquanto os tipos no código são `buff/debuff/control/dot/transform` |
| Atributos (§7.6) | P0 | 8; os ids batem | `vel` = `crit` (mesmo raio, que também é o do elemento `raio` e o de `chidori`) | — | — |
| Elementos + roda (§7.7) | P0/P1 | 5 + `element_wheel` | — | — | — |
| Categorias (§7.8) | P0 | 4; os ids batem | São cópias de `attr/nin`, `attr/tai` e `attr/gen` | — | — |
| Graus (§7.9) | P0 | 7 | **Forma própria por grau** (todos usam a mesma moldura, mudando a cor e a letra). Letra em `<text font-family="DejaVu Sans Mono">`: dentro de `<img>`, o SVG não enxerga a webfont e cai na fonte do sistema | — | Pastas `grade/D/`, `grade/D+/`, `grade/Raro/` (maiúsculas e `+`) com arquivos `d.svg`, `d_plus.svg`, `raro.svg` |
| Clãs (§7.10) | P0/P2 | 7 + 7 `_locked`; os ids batem | — | — | O emblema `uchiha` (leque vermelho e branco com cabo) está próximo do símbolo oficial: revisar |
| Títulos (§7.11) | P1 | 22 + 22 `_locked`: os 7 fixos e os 15 por elemento (`iniciante/adepto/mestre_<el>`), ids batem com `titles.ts` | `cacador_de_bandidos` = `mirrors` = `icon_power` = `icon_attack`; `demonio_da_nevoa` = `agua` = `mist` | — | — |
| Identidade (§8.1) | P0 | `logo.svg` (1200×400, sem `<text>`), `logo_compacto` (SVG + PNG 256), favicon 16/32/48/180 + 64 + SVG | **`loading_screen`** | `favicon.png` 64 | Pasta `identidade/` em vez de `ui/` |
| HUD da batalha (§8.2) | P0 | Todas as peças: `frame_fighter_*`, `badge_boss`, 4 barras (frame/fill/ghost), `turn_indicator`, `frame_log`, `action_bar`, `btn_action_*`, `btn_jutsu_slot`, `keycap`, `panel_items`, `panel_jutsu_desc`, `dialog_reforco_attr`, `btn_ficha` | **Ícone próprio em cada `btn_action_*`** (os 5 são retângulos lisos: attack = transform = `btn_enfrentar_elite`; defend = secondary = `btn_disabled` = `btn_ficha`; item = primary = `btn_lutar` = `btn_descansar`). Estado *disabled* idêntico nos 12. Barras: o `frame` e o `ghost` são iguais nas 4 | — | — |
| Mapa (§8.3) | P0 | `node_comum`, `node_elite`, `node_chefe_zabuza/haku`, `node_acampamento`, `estado_no/{vencido,atual,futuro,bloqueado}`, `map_path`, `map_marker_player`, 3 botões | **Elite diferente do comum** (`node_elite` = `node_comum`, sem a bifurcação pedida) | Os 3 botões duplicados (`gui/mapa/btn_*` e `gui/botoes/btn_*`) | — |
| Componentes gerais (§8.4) | P0/P1 | Botões, painel, cartão, abas, diálogo, overlay, toasts, badge, todos os `icon_*` listados, `seal_mastery_5`, `radar_bg`, presets, estilos | `cursor` (P1, opcional) | `frame_character_small`, `frame_portrait(_boss)`, `panel_attributes/equipment/jutsus` (os 3 iguais), `tooltip`; abas em dobro (`tab_active`/`tab_inactive` e `tabs/active`/`inactive`) | **Estilos:** o código usa as chaves `ninjutsu, taijutsu, genjutsu, estrategista, muralha, agil, equilibrado`; a entrega usa `especialista_ninjutsu, lutador_taijutsu, ilusionista, …`. **Presets:** o código usa `equilibrado`; a entrega, `equilibrado_guiado` |
| Banners (§8.5) | P1 | Os 7 + `card_reward_choice` | Diferenciar: `banner_boss_defeated` = `banner_death`; `level_up` = `jutsu_learned` = `title_unlocked` = `victory_saga`. Sem texto nem símbolo (só a faixa) | — | — |
| Menu (§8.6) | P0 | Os 7 `menu_*` | `menu_story` = `menu_history` = `kawarimi` = pergaminho | — | — |
| Ícones de interface extras | — | — | — | 28 nomes que o inventário não pede (`icon_back, cancel, confirm, down, up, filter, help, home, inventory, menu, mini_map, new, next, pause, profile, radar, retry, search, settings, tab, equipped, ficha, attack, defend, meditate, item, transform, sustained`). Quase todos reaproveitam outro desenho sem ligação com o nome | — |
| Fontes (§1, pipeline §2) | P0 | `titulo.woff2` (Cabin Bold, 23 KB), `texto.woff2` (Cabin Regular, 24 KB), `numeros.woff2` (DejaVu Sans Mono Bold, **145 KB**) | Fonte de título "com cara de pincel ou carimbo": Cabin é uma sem-serifa comum. `numeros` passa do teto de 100 KB por peso (e dos 60 KB da §2): não foi feito subconjunto | — | Os nomes batem com a Task 9 |
| 9-slice (pipeline §2) | P0 | `ui_frame_{gold,steel,boss,selected}.svg`, 48×48 | — | — | A Task 9 espera `moldura_painel.svg` |
| Créditos | — | `public/assets/CREDITOS.md` | Ver §5 | — | O local bate com o pipeline |
| Previews | — | 8 pranchas + 1 referência de cenário | — | Não vão para o jogo | — |

---

## 3. Formatos e tamanhos medidos

| Tipo | Medido | Pedido | Situação |
|---|---|---|---|
| **Lutadores** | Nenhum arquivo: nem estático, nem spritesheet, nem atlas. Não há quadros, tamanho de quadro, orientação nem JSON | Atlas PNG + JSON Hash, quadros 96×96 (pixel) ou ~280 px (HD), olhando para a direita | **Não entregue** |
| Retratos | PNG RGBA 256×256, 61–72 KB. Canto transparente, mas só 11–15 % do quadro é transparente: o fundo ilustrado continua lá. O topo traz uma faixa escura com linha laranja do quadro vizinho da prancha, e o `uchiha_sharingan` tem uma tira branca à esquerda | 256×256, ≤ 60 KB, fundo transparente | Tamanho ok; peso um pouco acima; **recorte ruim** |
| Fundos DOM | WebP com perda (VP8), RGB sem alfa, 1920×1080, 13–15 KB | WebP 1920×1080, ≤ 250 KB | Formato ok; conteúdo repetido |
| Cenário de batalha | Só a referência PNG RGB 1280×720 (9 KB), uma camada | WebP 1280×720 em 3 camadas | **Não entregue** |
| Ícones SVG | 274 arquivos, **todos com `viewBox="0 0 64 64"`**, 2,4–2,7 KB, sem `<script>`, sem `<image>`/base64, sem link externo. Cada ícone já traz a moldura dourada desenhada dentro | viewBox 64, ≤ 4 KB, uma cor + contorno, recolorível | Técnico ok. Estilo diferente do pedido: gradientes, 44 tons fora dos tokens (só 2 de 44 estão na `PALETTE` de `tests/icons.test.ts` da Task 8), e a moldura embutida não é recolorível por CSS |
| SVG de UI | 126 arquivos (80 únicos); maior: `element_wheel.svg`, 8,5 KB. Todos com viewBox | ≤ 10 KB | Ok |
| PNG de UI | 136 PNG RGBA @2x, **cantos com alfa 0** (transparência real), exceto `modal_overlay` (alfa 189 uniforme, como deve ser) | @2x, alfa | Ok, mas redundante: são rasterizações dos SVG (CairoSVG) e o HUD é DOM, que usa o SVG direto |
| Ids de gradiente | Todos os SVG declaram `id="metal"`, `"night"`, `"steel"`, `"ember"`, `"scarlet"`, `"chroma"` | — | Funciona em `<img>`/`url()`. **Colide** se dois SVG forem embutidos inline na mesma página |
| Fontes | WOFF2 válidos (2 CFF, 1 TrueType) | WOFF2, subconjunto latino, ≤ 100 KB | `numeros` com 145 KB; nomes internos não verificados (sem fontTools) |
| Peso total | 4,1 MB na pasta (os SVG e PNG de UI pesam pouco; os previews somam ~0,8 MB) | Orçamento de ~15 MB | Ok |

**Amostra vista** (ferramenta de imagem): os 4 retratos, 4 fundos (menu, mapa, biblioteca, fim_morte), 10 ícones renderizados (`icon_back`, `icon_power`, `icon_xp`, `icon_filter`, `icon_help`, `uchiha`, `iniciante_fogo`, `mestre_fogo`, `icon_lock`, `tenacity`) e os previews `preview_icones`, `preview_hud`, `preview_menu`, `preview_mapa`, `preview_botoes`, `preview_componentes`, `preview_enciclopedia` e `referencia_cenario_batalha`. O `preview_barras` não foi aberto. **No `preview_hud`, o painel do inimigo usa o retrato de Sasuke.**

---

## 4. Duplicatas (por md5)

A entrega promete "ícones individuais", mas muitos arquivos são cópia exata de outro. Os grupos mais relevantes:

- **Ícones normais:** 194 arquivos, 73 desenhos. **Bloqueados:** 80 arquivos, 34 desenhos. **Jutsus:** 51 ids, 23 desenhos.
- **9 arquivos iguais:** `tenacity` = `makyou_hyoushou` = `muon_satsujin` = `sensatsu_suishou` = `icon_back` = `icon_home` = `icon_menu` = `icon_profile` = `icon_up`.
- **9 arquivos iguais:** `attr/tai` = `category/taijutsu` = `sennen_goroshi` = `naruto_rendan` = `omote_renge` = `sustained_infinity` = `icon_sustained` = `icon_preset_taijutsu` = `icon_fighting_style_lutador_taijutsu`.
- **9 arquivos iguais:** `hakke_rokujuuyon` = `kuchiyose` = `por_um_fio` = `icon_xp` = `icon_settings` = `icon_transform` = `icon_radar` = `icon_fighting_style_equilibrado` = `icon_fighting_style_muralha`.
- **11 arquivos iguais (pergaminho):** `log` = `scroll` = `scroll_{def,nin,tai}` = `pergaminho_raro` = `pergaminho_reforco` = `kawarimi` = `icon_story_point` = `menu_story` = `menu_history`.
- **UI:** 126 SVG, 80 desenhos (botões, banners, barras, painéis e nós de mapa, ver §2).

Repetir desenho em ícones de fases futuras é aceitável (o próprio ASSETS.md §7.3 sugere "um ícone genérico por categoria e elemento"). O que **não** é aceitável é a repetição nos itens P0: ações da barra, `kunai`/`katana`, `clones`/`shadow-clones`, nó comum/elite, banners de morte/chefe derrotado, e ícones de navegação com nomes trocados.

---

## 5. Licença e origem

**O que está escrito:**
- SVG, PNG de UI e WebP: "reconstrução original criada com scripts", tendo como referência uma **prancha de GUI gerada por IA**. A prancha não foi incluída.
- Retratos: recortes de uma **imagem gerada por IA** "em conversa anterior". O próprio colaborador escreve que "autoria e direitos de terceiros devem ser avaliados antes de publicar" e que "a licença das imagens de IA não é equivalente a CC0".
- Fontes: Cabin (OFL 1.1, Reserved Font Name "Cabin") e DejaVu Sans Mono (Bitstream Vera, que permite redistribuir e embutir). Textos de licença completos incluídos.

**O que NÃO está escrito:**
- **Licença dos SVG, PNG e WebP "autorais".** Não diz se é CC0, se a autoria é cedida ao Gabriel nem se o uso comercial é permitido.
- **Autor**: nome da pessoa ou ferramenta que gerou os scripts. Os scripts também não vieram.
- **Ferramenta de IA**, data, prompts e termos de uso, tanto da prancha de GUI quanto do atlas dos retratos (o ARTE-PIPELINE.md §5, Rota E, exige ferramenta, data e prompt no CREDITOS.md).
- **Arquivos-fonte de IA**: nem `atlas_de_sprites_ninja_em_pixel_art.png` nem a prancha de GUI vieram junto.
- Se as fontes foram modificadas (subconjunto). A OFL proíbe usar o nome reservado "Cabin" numa versão modificada. O nome do arquivo (`titulo.woff2`) não é problema; o problema seria o nome interno da família, que não pôde ser lido.
- Uma linha por arquivo no CREDITOS.md (o pipeline pede `arquivo — autor/ferramenta — licença — link — data`).

**Risco de PI:**

| Item | Risco | Por quê |
|---|---|---|
| `portrait_uzumaki` | **Alto** | Reproduz Naruto Uzumaki (cabelo, olhos, marcas no rosto, roupa) + símbolo oficial da Folha na bandana |
| `portrait_uchiha`, `portrait_uchiha_sharingan` | **Alto** | Reproduzem Sasuke Uchiha (inclusive o Sharingan canônico) |
| `portrait_semcla` | **Médio/alto** | Personagem genérico, mas com o símbolo oficial da Folha (o pedido era uma "bandana da Folha genérica (original)") |
| Emblema `clan/uchiha` | Médio | Leque vermelho e branco com cabo, muito perto do símbolo oficial |
| Emblema `clan/uzumaki`, logo (espiral laranja) | Baixo/médio | A espiral é genérica, mas a espiral laranja no círculo lembra a da série. Revisão humana |
| Demais ícones, UI, fundos | Baixo | Formas geométricas simples, sem traço oficial evidente |
| Nome "NarutoTxGame" no logo | Fora do escopo da arte | Marca registrada no nome do projeto; é uma questão do projeto (decisão em aberto nº 10 do DD v2), não desta entrega |

**Conclusão:** os 4 retratos **não podem entrar no jogo**. O resto pode entrar depois que o colaborador declarar a licença por escrito.

---

## 6. Decisão 1 do plano de arte (animar por movimento × pixel art com quadros)

A entrega **não traz nenhum quadro de animação** (nem sprite, nem atlas, nem PNG solto por animação) e declara isso como fora do escopo. A única arte de personagem são os retratos tirados de um atlas de IA que não veio junto e que mostra personagens canônicos. Na prática:

- **(a) Ilustração atual + movimento procedural (tween)** continua sendo a **única opção executável agora**. Ela usa os 8 PNGs que já estão em `assets/personagens/` e não depende de nada desta entrega.
- **(b) Pixel art 96×96 com quadros** continua sem nenhum insumo. O piloto `player_semclan` (Task 11) precisa ser desenhado do zero.
- **(c) Quadros por IA a partir de uma imagem**: a entrega mostra justamente o risco previsto no pipeline (Rota E). A IA devolveu personagens oficiais. Se o atlas-fonte aparecer, ele **não** deve servir de base para os lutadores.

**Situação:** a Decisão 1 não muda. A recomendação continua (a) agora e piloto de (b) depois. O kit de interface entregue é neutro quanto a essa escolha: as molduras douradas e os ícones chapados combinam tanto com a ilustração "pixel em alta resolução" atual quanto com um pixel art 96×96.

---

## 7. Mapeamento proposto

### 7.1 Organização ideal

Princípios: **um arquivo por id**, sem a pasta extra com o mesmo nome (`jutsu/kai/kai.svg` vira `jutsu/kai.svg`); subpasta = **tipo de dado** (a mesma chave usada no TypeScript); nomes em minúsculas ASCII `snake_case` (com hífen só onde o dado já usa, como `def-down`); estado como sufixo (`_locked`, `_hover`…). `assets/` guarda as fontes e `public/assets/` ou `src/assets/` guardam o que o jogo carrega, gerado por script. Assim, `assets/` é a única pasta que um humano ou agente edita.

```
assets/
  personagens/  icones_originais/            (já existem; não mudam)
  icones/<tipo>/<id>.svg  e  <id>_locked.svg tipo ∈ jutsu, item, effect, attr, element,
                                             category, grade, clan, title, ui, menu, style, preset
  ui/<grupo>/<peça>[_<estado>].svg           grupo ∈ hud, barras, botoes, abas, paineis, mapa,
                                             banners, molduras_status, identidade
  ui/9slice/moldura_<nome>.svg
  cenarios/tela/<tela>.webp                  menu, criacao, mapa, preparacao, resultado,
                                             fim_vitoria, fim_morte, biblioteca, erro
  fontes/<papel>.woff2 + LICENCA_*.txt
  identidade/logo.svg, logo_compacto.svg, favicon.svg, favicon_<n>.png
  _quarentena/retratos/<arquivo>.png         fora de qualquer script (risco de PI)
  _referencia/entrega-2026-10-16/            previews, GUIA_DE_USO.md, INVENTARIO.*, VALIDACAO.json, CREDITOS.md
```

### 7.2 Tabela arquivo entregue → assets/ → destino do jogo

Origem relativa a `assets/NarutoTxGame_Assets/`; `<id>` = id do dado.

| # | Entregue | Qtde | Destino em `assets/` | Destino gerado | Regra / exceção |
|---|---|---:|---|---|---|
| 1 | `public/assets/icones/jutsu/<id>/<id>.svg` | 51 | `icones/jutsu/<id>.svg` | `public/assets/icones/jutsu/<id>.svg` | `<id>` = `JutsuDef.id` (51 conferidos) |
| 2 | `…/icones/jutsu/<id>/<id>_locked.svg` | 51 | `icones/jutsu/<id>_locked.svg` | idem, `_locked` | Opcional: o pipeline prefere o bloqueio por CSS (grayscale + cadeado). Se for por CSS, fica só em `assets/` |
| 3 | `…/icones/item/<id>/<id>.svg` | 10 | `icones/item/<id>.svg` | `public/assets/icones/item/<id>.svg` | 8 itens + `reward_ryo`, `reward_treino` |
| 4 | `…/icones/effect/<icon>/<icon>.svg` | 22 | `icones/effect/<icon>.svg` | `public/assets/icones/effect/<icon>.svg` | Chave = campo `icon` de `effects.ts`; `scroll_<attr>` para `reforco_<attr>`; `tenacity`; `sustained_infinity` → `sustained.svg` |
| 5 | `…/icones/attr/<k>/<k>.svg` | 8 | `icones/attr/<k>.svg` | `public/assets/icones/attr/<k>.svg` | `AttrKey` |
| 6 | `…/icones/element/<el>/<el>.svg` | 5 | `icones/element/<el>.svg` | `public/assets/icones/element/<el>.svg` | Inclui `raio` |
| 7 | `…/icones/category/<c>/<c>.svg` | 4 | `icones/category/<c>.svg` | idem | — |
| 8 | `…/icones/grade/D/d.svg`, `D+/d_plus.svg`, `C/c.svg`, `B/b.svg`, `A/a.svg`, `S/s.svg`, `Raro/raro.svg` | 7 | `icones/grade/{d,d_plus,c,b,a,s,raro}.svg` | `public/assets/icones/grade/…` | **Renomear as pastas** (tirar maiúsculas e `+`); `gradeArtId('D+') = 'd_plus'`. Antes, trocar `<text>` por curvas |
| 9 | `…/icones/clan/<id>/<id>(_locked).svg` | 14 | `icones/clan/<id>(_locked).svg` | idem | `ClanId` (`semcla`, não `semclan`) |
| 10 | `…/icones/title/<id>/<id>(_locked).svg` | 44 | `icones/title/<id>(_locked).svg` | idem | `TitleDef.id` (22) |
| 11 | `…/icones/ui/icon_<nome>/icon_<nome>.svg` (exceto estilos e presets) | 41 | `icones/ui/<nome>.svg` (sem o prefixo `icon_`) | `public/assets/icones/ui/<nome>.svg` | Publicar só os pedidos no ASSETS.md §8; os 28 extras ficam em `assets/` até ganharem desenho próprio |
| 12 | `…/icones/ui/menu_<op>/menu_<op>.svg` | 7 | `icones/menu/<op>.svg` | `public/assets/icones/menu/<op>.svg` | `continue, story, infinite, encyclopedia, history, titles, bingo` |
| 13 | `…/icones/ui/icon_fighting_style_<x>/…svg` | 7 | `icones/style/<chave>.svg` | `public/assets/icones/style/<chave>.svg` | **Renomear:** `especialista_ninjutsu→ninjutsu`, `lutador_taijutsu→taijutsu`, `ilusionista→genjutsu`; `estrategista`, `muralha`, `agil`, `equilibrado` ficam como estão |
| 14 | `…/icones/ui/icon_preset_<x>/…svg` | 3 | `icones/preset/<id>.svg` | `public/assets/icones/preset/<id>.svg` | **Renomear** `equilibrado_guiado→equilibrado` (`PRESET_IDS`) |
| 15 | `public/assets/gui/<grupo>/<peça>/<peça>.svg` | 58 | `ui/<grupo>/<peça>.svg` | `src/assets/ui/<grupo>/<peça>.svg` (referenciado por `url()` relativo no CSS) | `gui/identidade/banner_*` → `ui/banners/`; `gui/identidade/{badge,keycap,element_wheel,seal_mastery_5,icon_title_locked,card_reward_choice}` → `ui/identidade/`; `gui/molduras/status_<tipo>` → `ui/molduras_status/<tipo do código>.svg` (`buff, debuff, control, dot, transform`) |
| 16 | `public/assets/gui/<grupo>/<peça>/<estado>.svg` (botões, barras, abas, `estado_no`) | 68 | `ui/<grupo>/<peça>_<estado>.svg` | `src/assets/ui/<grupo>/<peça>_<estado>.svg` | Descartar as duplicatas: `gui/mapa/btn_*` (usar `botoes/`), `gui/hud/btn_ficha` (ou `botoes/btn_ficha`, escolher um), `abas/tab_active`, `tab_inactive` (usar `abas/tabs_*`) |
| 17 | `public/assets/gui/**/*.png` | 126 | não migrar | — | São rasterizações dos SVG; o HUD é DOM. Gerar PNG só se um dia o Phaser precisar |
| 18 | `src/assets/ui/ui_frame_<x>.svg` | 4 | `ui/9slice/moldura_<x>.svg` | `src/assets/ui/moldura_{painel,inimigo,chefe,selecionada}.svg` | `gold→painel` (nome da Task 9), `steel→inimigo`, `boss→chefe`, `selected→selecionada` |
| 19 | `public/assets/cenarios/bg_<t>/bg_<t>.webp` | 9 | `cenarios/tela/<t>.webp` | `public/assets/cenarios/tela/<t>.webp` | Tirar o prefixo `bg_`; copiar sem recodificar |
| 20 | `src/assets/fontes/{titulo,texto,numeros}.woff2` + `LICENCA_*.txt` | 5 | `fontes/` | `src/assets/fontes/` (mesmos nomes) | `numeros`: refazer como subconjunto (≤ 60 KB) |
| 21 | `public/assets/identidade/logo/logo.svg`, `logo_compacto/logo_compacto.svg` | 2 | `identidade/` | `public/assets/identidade/logo.svg`, `logo_compacto.svg` | O PNG do logo compacto não é necessário |
| 22 | `public/assets/identidade/favicon/favicon.svg`, `favicon_{16,32,48,180}.png` | 5 | `identidade/` | `public/favicon.svg`, `public/favicon-32.png`, `public/apple-touch-icon.png` (180) | `index.html` hoje não declara favicon; `favicon.png` 64 e o de 48 são dispensáveis |
| 23 | `public/assets/retratos/portrait_*/*.png` | 4 | `_quarentena/retratos/` | **nenhum** | Bloqueado por PI (§5) |
| 24 | `previews/*`, `GUIA_DE_USO.md`, `INVENTARIO.*`, `VALIDACAO.json` | 13 | `_referencia/entrega-2026-10-16/` | nenhum | Não vai para o bundle |
| 25 | `public/assets/CREDITOS.md` | 1 | `_referencia/…` | conteúdo fundido em `public/assets/CREDITOS.md` (Task 10), já com a licença que falta | — |
| 26 | `**/.DS_Store` | 26 | apagar | — | Já estão no `.gitignore` |

Os PNGs atuais (`public/assets/icones/*.png`, `public/assets/personagens/*.png`) **não mudam**: as subpastas novas não colidem com os arquivos que já estão na raiz de `icones/`.

### 7.3 Mudanças em `tools/prepare-assets.py` (propostas, não aplicadas)

1. **Novo tipo de job: "copiar e sanear SVG"** de `assets/icones/**` e `assets/ui/**` para os destinos da tabela, sem Pillow. O job:
   - prefixa os ids internos com o nome do arquivo (`id="metal"` → `id="kai-metal"`, e o mesmo nos `url(#…)`), para o SVG poder ser embutido inline sem colisão;
   - recusa o arquivo (falha com mensagem) se faltar `viewBox`, se ele passar de 4 KB (ícone) ou 10 KB (UI), ou se tiver `<script>`, `on*=`, `href="http` ou `<image>`;
   - avisa quando encontrar `<text>` (os graus), porque o texto depende da fonte do sistema.
2. **Job "copiar binário"** para WebP (`cenarios/tela`), WOFF2 (`fontes` → `src/assets/fontes`) e favicons, sem recodificar.
3. **Filtrar extensões**: hoje `glob('*.png')` já ignora o `.DS_Store`, mas os novos jobs devem listar as extensões aceitas e ignorar `assets/_quarentena/` e `assets/_referencia/`.
4. **Tabela de renomeação explícita** no próprio script, para graus, estilos, presets, molduras 9-slice, `sustained_infinity` e o prefixo `icon_`/`menu_`/`bg_`. Sem ela, o resultado depende de a entrega ser renomeada à mão.
5. **Gerar um manifesto** `public/assets/manifest.json` (`{ "icones": { "jutsu": ["bola_de_fogo", …], … }, "cenarios": { "tela": [...] } }`) a partir do que foi copiado. Os testes e o `art.ts` passam a saber o que existe sem listar arquivo por arquivo.
6. **Ser idempotente e limpar o destino** das subpastas que gera (sem tocar em `personagens/` e nos PNG da raiz de `icones/`), para que um id removido em `assets/` também suma de `public/`.
7. Mensagens e docstring em pt-BR, como hoje.

### 7.4 Mudanças em `src/data/art.ts` (propostas, não aplicadas)

1. **Ícones SVG por tipo**: `type IconKind = 'jutsu' | 'item' | 'effect' | 'attr' | 'element' | 'category' | 'grade' | 'clan' | 'title' | 'ui' | 'menu' | 'style' | 'preset'` e `svgIconUrl(kind, id, locked = false)` → `${ART_BASE}icones/${kind}/${id}${locked ? '_locked' : ''}.svg`. O `iconUrl(IconArt)` atual fica para os 20 PNG.
2. **Mapas id → arquivo** só onde o id do dado não é o nome do arquivo:
   - `GRADE_ICON: Record<Grade | 'raro', string>` = `{ D:'d', 'D+':'d_plus', C:'c', B:'b', A:'a', S:'s', raro:'raro' }`, com `raro` escolhido pelo `kind: 'rareScroll'` do item (o grau dele é `S` só para ordenar);
   - `EFFECT_ICON`: a chave é `EffectDef.icon`; os `reforco_<attr>` usam `scroll_<attr>`;
   - `STYLE_ICON` e `PRESET_ICON` (identidade, depois de renomear os arquivos).
3. **Trocar** `ATTR_ICON`, `ELEMENT_ICON` (agora com `raio`) e `ITEM_ICON` para o SVG, mantendo o PNG como fallback enquanto a conferência visual não aprovar.
4. **Fundos de tela**: `type ScreenBg = 'menu' | 'criacao' | 'mapa' | 'preparacao' | 'resultado' | 'fim_vitoria' | 'fim_morte' | 'biblioteca' | 'erro'` e `screenBgUrl(bg)`. O CSS de cada tela usa o fundo; como está em `public/`, o caminho vem do JS (`style.backgroundImage`), não do `url()` do CSS.
5. **Retratos**: **não** criar `portraitUrl` para os arquivos entregues. Quando houver retratos aprovados, nomear pelo id de arte (`player_semclan`, não `semcla`).
6. **Testes** (`tests/art.test.ts` e o `tests/icons.test.ts` da Task 8): todo id de `JUTSUS`, `ITEMS`, `EFFECTS.icon`, `GRADES`, `ELEMENTS`, `CLANS`, `TITLES`, `PRESET_IDS` e estilos tem arquivo. A `PALETTE` da Task 8 **precisa ser revista**: ou os SVG são recoloridos para os tokens, ou a paleta da entrega vira a oficial (decisão do Gabriel).

### 7.5 Impacto no plano 4

- **Task 8 (ícones SVG)** e parte da **Task 9 (fontes, 9-slice)** passam a ser "integrar a entrega" em vez de "desenhar". Nomes como `cadeado`, `check` e `grau_c` devem ser trocados pelos da entrega (`ui/lock`, `ui/check`, `grade/c`), e o `docs/ARTE-PIPELINE.md` §3 atualizado (ícone nomeado pelo id do dado, por tipo).
- **Tasks 3–7 e 11** (atlas, animação, partículas, cenários de batalha, piloto) **não andam nada** com esta entrega.

---

## 8. O que bloqueia a integração

| # | Bloqueio | Bloqueia o quê | Saída |
|---|---|---|---|
| 1 | **Retratos com personagens e símbolo oficiais** | Retratos (e qualquer uso do atlas de IA) | Descartar; pedir retratos originais ou recortar os PNG atuais com Pillow (pipeline §6) |
| 2 | **Licença das peças "autorais" não declarada** e scripts/prancha de IA não entregues | Publicar qualquer SVG, PNG ou WebP da entrega | Pedir ao colaborador uma declaração por escrito (licença ou cessão, autor, ferramentas de IA usadas, data) e os scripts geradores |
| 3 | **Itens P0 de batalha ausentes** (sprites, VFX, cenários em 3 camadas, `loading_screen`) | Tasks 3–7 e 11 do plano 4 | Seguir as rotas B e D do pipeline (procedural + piloto), ou abrir um novo pedido ao colaborador |
| 4 | Desenhos repetidos e nomes sem sentido nos ícones P0 (ações, `kunai`/`katana`, clones, nó elite, banners, navegação) | Qualidade da integração, não a parte técnica | Lista de correção para o colaborador (§2 e §4) |
| 5 | Graus com a mesma forma e `<text>` com fonte do sistema | Regra "nada só por cor" e a renderização estável | Pedir forma própria por grau e texto em curvas |
| 6 | Paleta fora dos tokens e do teste da Task 8 | Teste `icons.test.ts` como está escrito | Decisão do Gabriel: adotar a paleta da entrega ou exigir recoloração |

Os itens 1 e 2 bloqueiam qualquer publicação. Os itens 3 a 6 permitem integrar a interface por etapas: tecnicamente, os ícones de dados (jutsu, item, efeito, atributo, elemento, categoria, clã, título) e as peças de HUD e mapa entram hoje, só com renomeação e saneamento.

---

## 9. Estado após as correções (2026-10-22)

> **Acréscimo.** O veredito e as seções 0 a 8 acima continuam como foram escritos em 2026-10-16. Esta seção só registra o que mudou depois, com a evidência de cada item. Conferido no branch `feat/mvp`, depois dos commits `61352a2`, `dd57ef5`, `184aab4`, `718db46`, `9ea2c67`, `1950f3d` e `7199a61`. Números medidos nesta data: `npm test` com 413 testes em 39 arquivos, `npx tsc --noEmit` sem erro, `npm run build` concluído, `npm run docs:check` verde e `npm run visual` com "ok: 3 tamanhos".
>
> Legenda: **resolvido** (não precisa de mais nada do nosso lado), **parcial** (melhorou, mas falta algo), **aberto** (nada mudou).

### 9.1 Achados do veredito (§0)

O §0 não numera os achados. Aqui eles recebem números A1 a A5, na ordem em que aparecem.

| # | Achado | Estado | Evidência |
|---|---|---|---|
| A1 | Faltam todos os P0 de batalha (sprites animados, VFX, cenários em camadas) | **Parcial** | Não vieram do colaborador; foram **gerados por código** em `tools/art/pack.py` (commit `1950f3d`): 8 folhas animadas em public/assets/sprites/, 48 VFX em public/assets/vfx/, 5 cenários em 3 camadas e 2 overlays em public/assets/cenarios/batalha/. Ligados à arena no commit `7199a61` (`src/scenes/BootScene.ts`, `src/scenes/BattleScene.ts`, `src/scenes/vfx.ts`). Testes: `tests/sprites.test.ts`, `tests/sprite-anims.test.ts`, `tests/vfx.test.ts`. Falta: o estilo é um boneco chibi simples, a licença dessa arte é decisão pendente do Gabriel (ver `docs/LICENCAS-ASSETS.md`) e parte do inventário continua sem arte (§9.3) |
| A2 | Risco de PI nos 4 retratos | **Resolvido** (para o jogo) | Os 4 PNG estão em assets/_quarentena/retratos/, pasta ignorada pelo `.gitignore` (linha `assets/_quarentena/`). Conferido: nenhum commit do histórico contém essa pasta nem os nomes `portrait_semcla`, `portrait_uchiha`, `portrait_uchiha_sharingan`, `portrait_uzumaki`; o dist/ gerado não tem esses arquivos. O pedido de retratos originais ao colaborador está em `docs/SOLICITACAO-COLABORADOR.md` |
| A3 | Ícones e peças repetidos (194 ícones com 73 desenhos; 51 jutsus com 23) | **Parcial** | `tools/gen-icons.py` (commit `9ea2c67`) redesenhou os ícones. Medido hoje em assets/icones/: 194 ícones normais com **174 desenhos diferentes** (md5) e 51 jutsus com **51**. O teste `tests/icons.test.ts` proíbe dois ids **do mesmo tipo** com o mesmo desenho. As 20 repetições que sobram são entre tipos e, na maioria, intencionais (o jutsu e o efeito que ele cria, por exemplo `jutsu/kawarimi` = `effect/log`; `attr/tai` = `category/taijutsu` = `preset/taijutsu` = `style/taijutsu`). As **peças de UI** não foram redesenhadas: 124 SVG em assets/ui/ com 79 desenhos; `node_elite` = `node_comum`; `banner_death` = `banner_boss_defeated`; os `btn_action_*` continuam sem ícone próprio (no jogo, os botões de ação usam os ícones `ui/attack`, `ui/defend`, `ui/meditate`, `ui/item`, `ui/transform`, ver `src/ui-dom/screens/BattleScreen.ts`) |
| A4 | Os 9 fundos de tela DOM são quase a mesma imagem | **Aberto** | Os arquivos de assets/cenarios/tela/ não mudaram desde `184aab4`. O jogo aplica um véu escuro de 22% por cima (`src/ui-dom/App.ts`, commit `718db46`), o que não muda o conteúdo. Pedido ao colaborador em `docs/SOLICITACAO-COLABORADOR.md` |
| A5 | Paleta fora dos tokens; graus com a mesma forma e letra em `<text>`; ids de gradiente repetidos | **Parcial** | Graus: cada um tem forma própria e a letra virou `<path>` (`9ea2c67`); o teste "os 7 graus têm silhuetas diferentes" e "nenhum ícone usa `<text>`" estão em `tests/icons.test.ts`, e hoje nenhum SVG de assets/icones/ tem `<text>`. Ids de gradiente: `tools/prepare-assets.py` prefixa os ids com o nome do arquivo ao publicar. Paleta: `tools/gen-icons.py` adotou a paleta da entrega (bloco "paleta da entrega"); não existe teste de paleta e a escolha não foi registrada como decisão do Gabriel |

### 9.2 Bloqueios (§8)

| # | Bloqueio | Estado | Evidência |
|---|---|---|---|
| 1 | Retratos com personagens e símbolo oficiais | **Parcial** | Os 4 retratos estão em quarentena (ver A2). Há 8 retratos de desenho próprio, gerados por `tools/art/pack.py` (grupo `retratos`), em public/assets/retratos_originais/ (256 × 256). **Eles ainda não aparecem em nenhuma tela**: a Criação e o Mapa usam `portrait()` de `src/ui-dom/dom.ts`, que aponta para public/assets/personagens/ (os PNG de origem não registrada) |
| 2 | Licença das peças "autorais" não declarada; scripts e prancha de IA não entregues | **Aberto** | Nada novo do colaborador. O pedido está pronto em `docs/SOLICITACAO-COLABORADOR.md`; o resumo do que está e do que não está comprovado fica em `docs/LICENCAS-ASSETS.md`. As peças da entrega já estão integradas ao jogo (`dd57ef5`), mas a publicação continua bloqueada |
| 3 | Itens P0 de batalha ausentes (sprites, VFX, cenários em 3 camadas, `loading_screen`) | **Parcial** | Gerados pela rota procedural (ver A1). A tela de carregamento 1920 × 1080 existe em public/assets/identidade/loading_screen.webp e aparece no `#splash` do index.html (CSS em `src/styles.css`), que sai no `onReady` do `BootScene` (`src/main.ts`). Fica parcial pelo estilo, pelos itens que faltam (§9.3) e pela licença |
| 4 | Desenhos repetidos e nomes sem sentido nos ícones P0 | **Parcial** | Ícones: ver A3 (`kunai` ≠ `katana`, `clones` ≠ `shadow-clones`, ícones de navegação com desenho próprio). Peças de UI (botões de ação, nó elite, banners): abertas |
| 5 | Graus com a mesma forma e `<text>` | **Resolvido** | `9ea2c67`; testes em `tests/icons.test.ts` (ver A5) |
| 6 | Paleta fora dos tokens e do teste da Task 8 | **Parcial** | Na prática a paleta da entrega foi adotada (`tools/gen-icons.py`) e o teste de paleta da Task 8 não foi escrito. Decisão formal: **decisão pendente do Gabriel** |

### 9.3 O que continua sem arte (comprovado pela lista de arquivos)

- Animações opcionais do inventário (`throw`, `defend`, `meditate`, `victory`, `controlled`, `item`) e as extras dos chefes (`docs/ASSETS.md` §3.1 e §4.3). As folhas têm só `idle`, `attack`, `cast`, `hit`, `death` e `dodge`; a arena **não toca** a `dodge` (`animForEvent` em `src/scenes/spriteAnims.ts` não a devolve).
- Olhos vermelhos sobrepostos no Uchiha e retrato com Sharingan (§3.2 e §3.3). Existe a aura animada `fx_aura_sharingan`.
- Cartões de clã (§3.4), banners com texto ou símbolo (§8.5), números flutuantes desenhados (§6.2: a arena usa texto do sistema em `float()` de `src/scenes/BattleScene.ts`), fundos de tela diferentes entre si (§5.3).
- 7 dos 48 VFX gerados não estão ligados a nenhum evento: `fx_slash`, `fx_fumaca`, `fx_tronco`, `fx_turn_marker`, `fx_explosao`, `fx_onda_agua` e `st_tenacidade` (só aparecem na lista `VFX_NAMES` de `src/data/art.ts`).
- Peças de UI publicadas em public/assets/ui/ (molduras de HUD, 9-slice, barras, banners, nós do mapa) não são usadas por nenhum arquivo de src/ (busca por `assets/ui` sem resultado). Ícones dos tipos `grade`, `effect`, `clan`, `title`, `menu`, `style`, `preset` e `category` também não aparecem em tela; `ELEMENT_ICON` existe e é testado em `tests/art.test.ts`, mas nenhuma tela o usa.

### 9.4 Tarefas do plano 4 afetadas

O estado detalhado de cada task está no topo de `docs/superpowers/plans/2026-10-16-plano-4-arte.md` ("Estado de execução"). Resumo: as Tasks 3, 6 e 11 foram **substituídas** pela geração procedural de `tools/art/`; as Tasks 1, 2, 5, 8, 9 e 10 estão **parciais**; as Tasks 4 e 7 estão **feitas** com outra organização de arquivos; as Tasks 0 e 12 **não foram feitas**.
