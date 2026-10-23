# NarutoTxGame — Pipeline de arte

> **Para que serve.** É o guia para produzir e trocar a arte do jogo. Responde a cinco perguntas: (1) que tipos de asset o jogo usa, (2) em que formato e em que caminho cada um entra, (3) como a arte atual foi produzida e como regerá-la, (4) como um artista humano substitui a arte gerada sem mexer no código e (5) como conferir o visual no navegador **antes** de qualquer push.
>
> **Escrito em:** 2026-10-16 · **Atualizado em:** 2026-10-22, depois dos commits `dd57ef5`, `184aab4`, `718db46`, `9ea2c67`, `1950f3d` e `7199a61`. **Base:** o código do branch `feat/mvp` (`src/data/art.ts`, `src/scenes/BootScene.ts`, `src/scenes/BattleScene.ts`, `src/scenes/spriteAnims.ts`, `src/scenes/vfx.ts`, `src/ui-dom/dom.ts`, `src/styles.css`, `tools/prepare-assets.py`, `tools/gen-icons.py`, `tools/art/pack.py`) e o inventário `docs/ASSETS.md`.
>
> **Não repete o inventário.** A lista item a item (que sprite, que ícone, que fundo, com prioridade P0/P1/P2) está em `docs/ASSETS.md`. Este documento diz **como** cada grupo é feito e entregue. O plano de implementação está em `docs/superpowers/plans/2026-10-16-plano-4-arte.md` (com o estado real de cada task no topo). Autoria e licenças: `docs/LICENCAS-ASSETS.md`.

---

## 1. Onde estamos hoje

| O quê | Como está no código | Origem |
|---|---|---|
| **Lutadores animados** | 8 folhas de quadros em public/assets/sprites/<id>/{sheet.png, atlas.json}, carregadas por `load.atlas` no `src/scenes/BootScene.ts` e desenhadas como `Sprite` no `src/scenes/BattleScene.ts` (escala 1,5: quadro de 192 px vira 288 px na tela). Animações `idle` (6 quadros), `attack` (7), `cast` (7), `hit` (4), `death` (7) e `dodge` (4) | Geradas por código: `tools/art/pack.py` (grupo `sprites`), commit `1950f3d` |
| Lutadores estáticos (fallback) | 8 PNG em public/assets/personagens/ (`characterUrl` em `src/data/art.ts`), reduzidos para **240 px de altura** (`SPRITE_HEIGHT`) e espelhados conforme `CHARACTER_FACING` | Origem **não registrada** (`docs/LICENCAS-ASSETS.md`) |
| Fallback final | Sem a folha e sem o PNG, a arena desenha o retângulo de `makeBody` em `src/scenes/BattleScene.ts` | — |
| Animação | Quadros reais por evento (`animForEvent` em `src/scenes/spriteAnims.ts`) + os tweens de antes (avanço, tremor, flash) | — |
| **Efeitos (VFX)** | 48 folhas em public/assets/vfx/<nome>/{sheet.png, atlas.json} + `vfx/manifest.json`; o evento do motor escolhe o efeito em `vfxForEvent` (`src/scenes/vfx.ts`), com os mapas `JUTSU_FX`, `ELEMENT_HIT_FX` e `STATUS_FX` de `src/data/art.ts` | `tools/art/vfx.py` |
| **Cenário da arena** | 5 cenários em 3 camadas (`_ceu`, `_meio`, `_chao`) WebP 1280 × 720 em public/assets/cenarios/batalha/, mais `overlay_nevoa` (512 × 512, repetido e deslizando) e `overlay_espelhos_gelo` (1280 × 720). O cenário é escolhido pelo inimigo (`battleSceneFor` em `src/data/art.ts`). Sem as camadas, volta o chão liso | `tools/art/scenes.py` |
| Tela de carregamento | `#splash` no index.html com public/assets/identidade/loading_screen.webp (1920 × 1080) e barra de progresso; sai no `onReady` do Phaser (`src/main.ts`) | `tools/art/scenes.py` (`loading_screen`) |
| **Ícones** | SVG por tipo de dado em public/assets/icones/<tipo>/<id>.svg (`svgIconUrl`, `ATTR_ICON`, `ITEM_ICON`, `jutsuIconRef`, `UI_ICON` em `src/data/art.ts`); os 20 PNG antigos continuam na raiz de public/assets/icones/ | Entrega do colaborador (2026-10-16), redesenhada em parte por `tools/gen-icons.py` |
| Retratos | `portrait()` em `src/ui-dom/dom.ts` ainda usa o PNG estático do lutador (Criação e Mapa). Os 8 retratos originais (256 × 256) em public/assets/retratos_originais/ **não estão ligados a nenhuma tela** | `tools/art/pack.py` (grupo `retratos`) |
| Interface | CSS com tokens em `src/styles.css`; fontes "NTX Titulo" e "NTX Texto" (Cabin, WOFF2); fundo por tela (9 WebP) aplicado por `src/ui-dom/App.ts` com véu escuro de 22% | Entrega do colaborador |
| Peças de UI da entrega | Publicadas em public/assets/ui/ (HUD, barras, botões, 9-slice, banners, mapa), mas **nenhum arquivo de src/ as referencia** | Entrega do colaborador |
| Pipeline | assets/ (fontes editáveis) → `python3 tools/prepare-assets.py` → public/assets/ (ícones, UI, fundos, fontes, favicon + `manifest.json`). A arte procedural vai direto para public/assets/ por `npm run art:build` | — |

O peso medido de public/assets/ é **9,7 MB** (`du -sh`), dentro do orçamento de ~15 MB da §2.1. Os maiores grupos: vfx 3,6 MB, personagens 2,2 MB, ícones 1,5 MB, sprites 1,1 MB.

---

## 2. Tabela de formatos: tipo de asset → arquivo → tamanho → onde o código usa

Medidas de referência: o Phaser roda em **1280 × 720** lógicos com `Scale.FIT` (`src/scenes/createGame.ts`); as telas DOM vão até 1280 px de largura, mínimo 1024 px (`src/styles.css`). A coluna "Hoje" é o que existe; "Alvo" é o teto combinado.

| Tipo de asset | Formato | Hoje (medido) | Alvo por arquivo | Onde entra no código |
|---|---|---|---|---|
| **Lutador animado** | sheet.png (PNG de 8 bits com paleta) + atlas.json (**JSON Array** do Phaser, §2.2), uma linha por animação | Quadros de 192 × 192 (Haku 224, Zabuza 256); folhas de até 1792 × 1536; 68–110 KB por folha | Folha ≤ 2048 × 2048 | `BootScene` (`load.atlas` + `load.json` do mesmo atlas, para ler `meta`); `makeBody` no `BattleScene` |
| Lutador estático | PNG com transparência | ≤ 480 px de altura | ≤ 300 KB | Fallback do lutador animado e `portrait()` |
| **Efeito de batalha** | sheet.png + atlas.json com uma animação `play` | Quadros de 128 ou 192 px; folhas de até 1920 px de lado; 16 dos 48 em loop; 6–182 KB por folha (média 60 KB) | ≤ 60 KB (meta original da §2; 15 MB no total) | `playVfx` no `BattleScene`; fps lido de `vfx/manifest.json` |
| Números e textos flutuantes | Texto do Phaser com a fonte do sistema | — | — | `float()` em `src/scenes/BattleScene.ts` |
| **Cenário de batalha** | WebP com perda em 3 camadas (`_ceu`, `_meio`, `_chao`) | 1280 × 720; 5–61 KB por camada; o script baixa a qualidade até caber em 240 KB | ≤ 400 KB somando as 3 | `buildScenery` no `BattleScene` |
| Overlays de cenário | WebP com alfa | `overlay_nevoa` 512 × 512 (tile), `overlay_espelhos_gelo` 1280 × 720 | ≤ 150 KB | `buildScenery` (por inimigo, não pelo efeito ativo) |
| Fundos de tela DOM | WebP | 1920 × 1080, 13–15 KB | ≤ 250 KB | `screenBgUrl` + `src/ui-dom/App.ts` |
| Tela de carregamento | WebP | 1920 × 1080, 17 KB | ≤ 250 KB | `#splash` em `src/styles.css` |
| **Retrato** | PNG com transparência | 256 × 256, 6–9 KB (retratos originais) | ≤ 60 KB | Ainda não ligado (§1) |
| **Ícone de conteúdo e de interface** | SVG, viewBox 0 0 64 64, com o quadro dourado da entrega | 2–4 KB | ≤ 4 KB (teste em `tests/icons.test.ts`) | `icon()` em `src/ui-dom/dom.ts` via os mapas de `src/data/art.ts` |
| Peças de UI (molduras, barras, botões, banners) | SVG | ≤ 10 KB (aviso de `tools/prepare-assets.py`) | ≤ 10 KB | Ainda não usadas |
| **Fontes** | WOFF2 em public/assets/fontes/ | `titulo` 23 KB e `texto` 24 KB (Cabin); `numeros` 145 KB (DejaVu Sans Mono Bold, não usada) | ≤ 100 KB por peso | `@font-face` em `src/styles.css` |
| Logo | SVG | public/assets/identidade/logo.svg (não usado em tela) | ≤ 20 KB | — |
| Favicon | SVG + PNG 32 + PNG 180 | public/favicon.svg, favicon-32.png, apple-touch-icon.png | ≤ 10 KB | index.html |

### 2.1 Por que PNG, WebP ou SVG

- **PNG** para **folhas de quadros**. É sem perda; compressão com perda borra o contorno. O `tools/art/pack.py` grava os lutadores com paleta de 96 cores e os VFX com paleta ou RGBA, o que deixa as folhas leves.
- **WebP** para **pinturas grandes** (cenários, fundos de tela, carregamento). Com perda e qualidade ~80, aceita transparência e o Pillow salva direto. **Não** usar WebP com perda em pixel art.
- **SVG** para **ícones e peças de interface**: vetor, nítido em qualquer tamanho, poucos KB e editável como texto. No Phaser, SVG vira bitmap na carga; dentro da arena, prefira PNG.
- **Peso no bundle.** Arquivos em public/ não entram no JavaScript: o Vite só os copia para o dist/. Pesam no **download** e na **memória de textura**, que depende da área em pixels: uma folha de 4096 × 4096 ocupa 64 MB de GPU mesmo com 2 MB de arquivo. **Teto prático: folhas de até 2048 × 2048.** Orçamento: até ~15 MB em public/assets/.

### 2.2 Atlas "JSON Array" com `meta.animations` e `meta.anchor`

É o formato que `tools/art/pack.py` escreve e que o jogo lê (o Phaser aceita "JSON Array" em `load.atlas`). Trecho real de public/assets/sprites/player_semclan/atlas.json, encurtado:

```json
{
  "frames": [
    { "filename": "idle_00", "frame": { "x": 0, "y": 0, "w": 192, "h": 192 }, "rotated": false, "trimmed": false,
      "spriteSourceSize": { "x": 0, "y": 0, "w": 192, "h": 192 }, "sourceSize": { "w": 192, "h": 192 } },
    { "filename": "idle_01", "frame": { "x": 192, "y": 0, "w": 192, "h": 192 }, "...": "..." }
  ],
  "meta": {
    "app": "tools/art/pack.py (procedural, determinístico)", "image": "sheet.png",
    "size": { "w": 1344, "h": 1152 }, "frameSize": { "w": 192, "h": 192 },
    "animations": {
      "idle":   { "frames": ["idle_00", "idle_01", "idle_02", "idle_03", "idle_04", "idle_05"], "fps": 6, "loop": true },
      "attack": { "frames": ["attack_00", "...", "attack_06"], "fps": 12, "loop": false }
    },
    "anchor": { "x": 0.4167, "y": 0.9271 },
    "facing": "right", "character": "player_semclan"
  }
}
```

O que o jogo exige (`parseSpriteMeta` e `hasAnimations` em `src/scenes/spriteAnims.ts`):

- `meta.animations` com **`idle`, `attack`, `cast`, `hit` e `death`** (`REQUIRED_ANIMS`), cada uma com `frames` não vazio e `fps` > 0. `loop` é opcional (falso se faltar). Se uma delas faltar ou o JSON for inválido, a arena usa a imagem estática: nunca quebra.
- `dodge` existe nas folhas, mas a arena ainda não a toca.
- `meta.anchor` é o ponto dos pés, em fração do quadro (0 a 1). Sem ele, vale `DEFAULT_ANCHOR` = { x: 0,4167, y: 0,9271 } de `src/scenes/BattleScene.ts`. O inimigo é espelhado, e a âncora em x também (`1 − x`).
- Os quadros são desenhados **olhando para a direita**.

Os VFX usam o mesmo formato, com uma animação só, `play` (quadros `play_00`, `play_01`…), e campos extras em `meta` (`effect`, `blend`, `prioridade`, `evento`). A arena ordena os nomes dos quadros e lê o fps de `vfx/manifest.json`.

### 2.3 Manifestos gerados

| Arquivo | Quem gera | Conteúdo |
|---|---|---|
| public/assets/manifest.json | `tools/prepare-assets.py` | Lista dos SVG, WebP e WOFF2 publicados, por pasta |
| public/assets/sprites/manifest.json | `tools/art/pack.py` | Por personagem: bytes, tamanho do quadro, número de quadros por animação e âncora |
| public/assets/vfx/manifest.json | `tools/art/pack.py` | Por efeito: bytes, tamanho do quadro, quadros, `loop` e `fps` (o `BattleScene` lê o fps daqui) |
| public/assets/cenarios/batalha/manifest.json | `tools/art/pack.py` | Por cenário: camadas, bytes e `chao_y` (465); overlays com o tamanho |

---

## 3. Convenção de nomes e pastas

**Regra geral:** minúsculas, `snake_case`, sem acento. Lutadores, VFX e cenários usam **ids de arte**, e o mapa id-do-dado → id-de-arte fica em `src/data/art.ts` (testado em `tests/art.test.ts`). Ícones usam o **id do dado**, separados por tipo.

```
assets/                                   fontes editáveis, fora do bundle
  personagens/  icones_originais/         PNG antigos (origem não registrada)
  icones/<tipo>/<id>.svg  e  <id>_locked.svg     tipo ∈ jutsu, item, effect, attr, element, category,
                                                 grade, clan, title, ui, menu, style, preset
  ui/<grupo>/<peça>[_<estado>].svg        grupo ∈ 9slice, abas, banners, barras, botoes, hud,
                                          identidade, mapa, molduras_status, paineis
  cenarios/tela/<tela>.webp               9 fundos DOM
  fontes/<papel>.woff2 + LICENCA_*.txt
  identidade/                             logo, logo compacto, favicons
  _referencia/entrega-2026-10-16/         previews, guia, inventário, PNG rasterizados (não vão ao jogo)
  _quarentena/retratos/                   ignorado pelo Git; nunca entra em script
public/assets/                            o que o jogo carrega
  personagens/<arte>.png                  estático (prepare-assets.py)
  icones/<nome>.png  e  icones/<tipo>/<id>.svg   (prepare-assets.py)
  ui/, cenarios/tela/, fontes/, identidade/      (prepare-assets.py)
  sprites/<arte>/{sheet.png, atlas.json}  + sprites/manifest.json      (tools/art)
  vfx/<nome>/{sheet.png, atlas.json}      + vfx/manifest.json          (tools/art)
  cenarios/batalha/<cenario>_{ceu,meio,chao}.webp, overlay_*.webp + manifest.json   (tools/art)
  identidade/loading_screen.webp          (tools/art)
  retratos_originais/portrait_<arte>.png  (tools/art)
```

**Fontes e caminhos.** As fontes ficam em public/assets/fontes/ e o `@font-face` de `src/styles.css` usa `url('/assets/fontes/…')`. No `npm run build`, o Vite reescreve esse caminho para relativo (conferido no CSS de dist/: `url(../assets/fontes/titulo.woff2)`), então o dist/ abre de qualquer pasta. O que o JavaScript carrega por caminho usa `ART_BASE` (`assets/`, relativo ao index.html).

> **Divergência com `docs/ASSETS.md` §12.** O inventário propunha pastas em inglês (characters/, icons/) e o `id` dos dados em tudo. O código usa pastas em português e ids de arte para lutadores (`player_semclan`, `inimigo_ninjaagua`), com mapa testado; as elites usam a arte do comum. Esta seção é a convenção vigente.

| Coisa | Padrão do nome | Exemplos |
|---|---|---|
| Id de arte do lutador | `player_<clã>`, `inimigo_<nome>`, `chefe_<nome>` | `player_uchiha`, `inimigo_bandido`, `chefe_haku` |
| Quadro no atlas | `<animação>_<NN>`, NN com 2 dígitos a partir de 00 | `idle_00` … `idle_05`, `attack_00` … `attack_06` |
| Nomes de animação | `idle`, `attack`, `cast`, `hit`, `death`, `dodge` | `docs/ASSETS.md` §3.1 chama `hit` de *hurt* e `death` de *defeated*; no código vale `hit` e `death` |
| Efeito | `fx_<nome>` (golpes e genéricos), `st_<efeito>` (marca de status) | `fx_hit`, `fx_hit_fogo`, `fx_goukakyuu`, `st_queimadura` |
| Cenário | `<lugar>_<camada>` | `estrada_floresta_ceu.webp`, `ponte_chao.webp` |
| Ícone | `<tipo>/<id do dado>.svg`; o efeito usa o campo `icon` de `src/data/effects.ts` | `jutsu/kai.svg`, `effect/shadow-clones.svg`, `grade/d_plus.svg` |
| Retrato | `portrait_<id de arte>.png` | `portrait_player_semclan.png` |

---

## 4. Ferramentas gratuitas (confirmadas em 2026-10-16)

| Ferramenta | Licença / preço | Para quê aqui | Fonte |
|---|---|---|---|
| **Piskel** (no navegador, piskelapp.com) | Gratuito, código aberto, **Apache-2.0** | Pixel art e animação quadro a quadro sem instalar nada; exporta PNG (quadros e folha) e GIF | [GitHub piskelapp/piskel](https://github.com/piskelapp/piskel) |
| **LibreSprite** | Gratuito, **GPLv2** (fork do Aseprite de antes de 2016) | Mesmo fluxo do Aseprite (camadas, timeline, onion skin) | [README do LibreSprite](https://cdn.jsdelivr.net/gh/libresprite/libresprite@master/README.md) |
| **Pixelorama** | Gratuito, **MIT**, feito em Godot | Pixel art com timeline; exporta PNG, folha (spritesheet) e GIF | [GitHub orama-interactive/pixelorama](https://github.com/orama-interactive/pixelorama) |
| **Krita** | Gratuito, **GPL-3.0** | Pintura (cenários, retratos ilustrados) e animação quadro a quadro; exporta sequência de imagens. Folha de sprites só com o plugin comunitário kritaSpritesheetManager | [Wikipedia: Krita](https://en.wikipedia.org/wiki/Krita); [kritaSpritesheetManager](https://github.com/imikado/kritaSpritesheetManager) |
| **Figma / Penpot / Excalidraw** (conectados ao Claude) | Já disponíveis para o Gabriel | Layout de telas, molduras, ícones vetoriais, mockups de HUD; exportam SVG e PNG | — |
| **Claude** | Já disponível | Escreve SVG, CSS, scripts Python/Pillow | — |
| **Python 3 + Pillow + numpy** | Gratuitos (na máquina: Pillow 11.3.0, numpy 2.0.2) | Toda a arte procedural de `tools/art/` e o `tools/prepare-assets.py` | — |
| **playwright-core** + Google Chrome instalado | Gratuito, Apache-2.0 | `npm run visual` (§7) | — |
| Aseprite | **Pago** (código-fonte disponível, não é open source) | Não usar como dependência do fluxo | [Comentários no HN sobre LibreSprite](https://hn.nuxt.dev/item/47272799) (não verificado em fonte oficial) |

### Bancos de assets

| Fonte | Licença | Cuidado | Fonte |
|---|---|---|---|
| **Kenney** (kenney.nl) | **CC0**: uso livre, inclusive comercial, sem crédito obrigatório | Não usar o logo da Kenney; conferir o arquivo de licença de cada pacote | [kenney.nl/support](https://kenney.nl/support) |
| **OpenGameArt** | Por asset: CC0, OGA-BY, CC-BY, CC-BY-SA, GPL | Filtrar por **CC0** (ou CC-BY/OGA-BY com crédito). Evitar CC-BY-SA e GPL para arte, que obrigam a licenciar derivados igual | [Fórum OGA sobre atribuição](https://opengameart.org/node/87141) (comunidade, não é o texto oficial) |
| **itch.io** (assets) | Varia por pacote | Ler a licença de cada página; "free" não quer dizer CC0 | — |
| **game-icons.net** | **CC BY 3.0** (alguns autores CC0): exige crédito ao autor | Ótimo para ícones SVG; o crédito vai no CREDITOS.md e numa tela de créditos | [game-icons.net/about](https://game-icons.net/about.html) |

### Geração por IA (o que dá e o que não dá para garantir)

| Ferramenta | Plano grátis (fontes secundárias) | Situação |
|---|---|---|
| **Higgsfield** (conectado ao Claude) | Plano Free com **0 créditos** e no máximo 1 geração, sem uso comercial; o primeiro plano pago (Starter) custa **US$ 19/mês** por 270 créditos ([Creatify, 2026](https://creatify.ai/blog/is-higgsfield-free-free-plan-trials-and-promo-codes-explained-(2026)); [Recurdash, verificado em 2026-09-17](https://recurdash.com/subscription-pricing/higgsfield)). Uma terceira fonte fala em ~300 créditos grátis, mas destoa das outras | **Não verificado** na página oficial. **Não foi usado** em nenhum asset do repositório: os scripts de `tools/art/` só importam Pillow, numpy e a biblioteca padrão do Python |
| **PixelLab** (pixel art e animação por IA) | Teste de ~40 gerações ou "5 lentas por dia", depois US$ 12–50/mês ([comparativos de 2026](https://www.spritecook.ai/compare/pixellab); [Cinevva, set. 2026](https://app.cinevva.com/guides/ai-pixel-art-generators)) | **Não verificado** na página oficial |
| Sprite Flow, Sloyd, Sorceress, Pixa (geradores de folha de sprites) | Anunciam consistência de personagem entre quadros; free tier confirmado só no Sprite Flow, segundo um agregador | **Não verificado**: material de marketing |

**Conclusão sobre IA:** não há, confirmado, um gerador gratuito e confiável de folhas de sprite com estilo consistente. Use IA como **rascunho ou referência**, nunca como pipeline principal.

---

## 5. As rotas de produção, por custo-benefício e risco

> **Rota adotada em 2026-10-22.** Sprites, VFX, cenários de batalha, tela de carregamento e retratos originais saíram da **Rota B (procedural)**, levada além do previsto: em vez de só animar os PNG estáticos por tween, `tools/art/` desenha bonecos originais por esqueleto e gera quadros reais (§10). Os ícones seguiram a **Rota A** sobre a entrega do colaborador (`tools/gen-icons.py`). As rotas C, D e E não foram usadas até aqui.

### Rota A — Claude gera SVG e CSS (custo 0, risco baixo) ★ primeira

**Serve para:** ícones de conteúdo e de interface, selos de grau, emblemas de clã **originais** (formas geométricas), nós e trilha do mapa, molduras 9-slice, barras, botões, abas, badges, logo tipográfico, roda elemental, fundo do radar.

- **Prós:** de graça e imediato; cada ícone sai em poucos KB; consistência alta, porque segue uma folha de estilo escrita; editável como texto; versão "bloqueada" pode sair por CSS, sem desenhar duas vezes.
- **Contras:** o resultado é *flat* e geométrico, e não combina sozinho com personagens ilustrados; personagem e cenário não saem bons assim.
- **Risco de consistência:** baixo, **desde que** exista a folha de estilo. No `tools/gen-icons.py`, ela é o quadro da entrega (moldura dourada 64 × 64, fundo noturno) e a paleta da entrega.
- **Risco de PI:** baixo. Símbolos de clã devem ser **formas novas**, nunca o traçado oficial.

### Rota B — Geração procedural por código (custo 0, risco baixo) ★ adotada

**Serve para:** bonecos animados por esqueleto, efeitos por partículas e formas, camadas de cenário (céu em gradiente, silhuetas, chão), overlays, tela de carregamento e retratos derivados do mesmo boneco.

- **Prós:** de graça, reprodutível (mesmo resultado a cada execução), sem rede, nunca destoa da paleta e muda tudo de uma vez se a direção de arte mudar.
- **Contras:** o traço é simples (boneco chibi *flat*), bem abaixo de uma ilustração ou de um pixel art feito à mão; cada pose nova custa código.
- **Risco de consistência:** baixo. **Risco de PI:** nenhum, se o desenho continuar sem símbolos oficiais (as bandanas dos bonecos têm placas lisas ou marcas inventadas, segundo `tools/art/characters.py`).

### Rota C — Packs CC0 (custo 0, risco médio de estilo)

**Serve para:** folhas de efeitos (impacto, fumaça, explosão), texturas de céu e chão, ícones de reserva (game-icons.net, com crédito), molduras de UI.

- **Prós:** qualidade profissional, de graça, na hora.
- **Contras:** cada pack tem um estilo. Misturar dois packs com os personagens atuais é o jeito mais rápido de o jogo parecer colcha de retalhos.
- **Risco de consistência:** **médio a alto.** Mitigação: **um** pack por grupo, recolorido para a paleta.
- **Risco de PI:** baixo com CC0. Com CC-BY é obrigatório registrar o crédito. Conferir a licença **de cada asset**.

### Rota D — Pixel art ou desenho manual (custo 0 em dinheiro, alto em tempo)

**Serve para:** substituir os lutadores, efeitos e cenários gerados por arte feita à mão, mantendo os nomes de arquivo e de quadro (§10.3).

- **Ferramentas:** Piskel, LibreSprite, Pixelorama ou Krita.
- **Prós:** controle total, estilo único e **zero risco de PI**, se o desenho for original.
- **Contras:** a rota mais cara em horas. São 35 quadros por personagem × 8 personagens = 280 quadros, sem contar efeitos. A estimativa de horas **não foi medida** (o piloto da Task 11 do plano 4 não foi feito).
- **Risco de consistência:** médio; mitigado por paleta fixa, grade fixa e um personagem-modelo aprovado antes dos outros.

### Rota E — IA (Higgsfield e similares) (custo incerto, risco alto)

**Serve para:** conceitos e referências (pose, paleta, figurino) e fundos de tela fora da batalha.

- **Contras:** (1) **não é gratuito de forma confiável** (§4); (2) a consistência entre quadros é o ponto fraco conhecido; (3) vídeo vira dezenas de quadros pesados, com borda borrada no recorte.
- **Risco de PI:** **o mais alto das cinco rotas.** A entrega de 2026-10-16 mostrou isso: os retratos gerados por IA reproduziam personagens oficiais e foram para a quarentena (`docs/AUDITORIA-ASSETS.md` §5). Nos EUA, o resultado gerado só por IA não tem proteção de direito autoral sem contribuição humana significativa ([resumo do relatório do U.S. Copyright Office, parte 2, jan. 2025](https://copyrightalliance.org/ai-report-part-2-copyrightability/)). Os termos de uso do Higgsfield sobre propriedade do resultado **não foram verificados**.
- **Regra se usar:** prompts descrevem **o figurino original**, nunca nomes de personagens ou da obra; toda imagem gerada é registrada com ferramenta, data e prompt; revisão humana para descartar qualquer semelhança com personagem oficial.

### Resumo das rotas

| Rota | Custo | Tempo | Consistência de estilo | Risco de PI | Uso no projeto |
|---|---|---|---|---|---|
| A — Claude SVG/CSS | 0 | Baixo | Alta (com folha de estilo) | Baixo | Ícones (`tools/gen-icons.py`) |
| B — Procedural | 0 | Baixo | Alta | Nenhum | Sprites, VFX, cenários, carregamento, retratos (`tools/art/`) |
| C — Packs CC0 | 0 | Baixo | Média/baixa | Baixo (com licença conferida) | Não usada |
| D — Manual | 0 (tempo alto) | Alto | Média/alta | Nenhum (se original) | Não usada; é a rota para substituir a arte gerada |
| E — IA | Incerto | Médio | **Baixa entre quadros** | **Alto** | Não usada no repositório (só na entrega do colaborador, ver `docs/LICENCAS-ASSETS.md`) |

---

## 6. Recomendação por tipo de asset

| Tipo | Hoje | Próximo passo recomendado | Por quê |
|---|---|---|---|
| Lutadores | **B**: 8 folhas procedurais com 6 animações | **D** quando houver artista: substituir folha a folha mantendo nomes e âncora (§10.3) | A arena já lê o formato; trocar a arte não mexe no código |
| Efeitos de batalha | **B**: 48 VFX em folhas | Ligar os 7 VFX sem evento (§10.4); depois **D** ou **C** para os principais | O formato é o mesmo dos lutadores |
| Cenários de batalha | **B**: 5 cenários em 3 camadas | Pintura em Krita (D) com os mesmos nomes de arquivo | As camadas funcionam com qualquer arte |
| Overlays (névoa, gelo) | **B** | Ligar ao efeito ativo (`nevoa`, `makyou`) em vez do inimigo | Hoje aparecem sempre que o inimigo é o mesmo |
| Fundos de tela DOM | Entrega do colaborador (quase iguais entre si) | Pedido ao colaborador (`docs/SOLICITACAO-COLABORADOR.md`) ou **A** | Ficam atrás de texto: discreto vale mais que detalhado |
| Retratos | Retratos originais gerados (sem uso) | Ligar `portrait()` aos retratos originais (decisão do Gabriel) | Elimina o uso dos PNG de origem não registrada nas telas |
| Ícones | Entrega + `tools/gen-icons.py` | Redesenhar os fracos a 28 px (lista no Patch notes 1.1 de `docs/CONTEXTO-DO-PROJETO.md`) | Vetor, leve, consistente |
| Componentes de UI | CSS; peças da entrega não usadas | Decidir se as peças SVG entram (9-slice, barras) | — |
| Fontes | Cabin (OFL 1.1) da entrega | Subconjunto da fonte de números, se for usada | `numeros.woff2` tem 145 KB |

---

## 7. Como validar o visual no navegador antes do push

Três camadas, da mais rápida à mais completa. Nenhuma delas faz push.

1. **Testes que protegem a arte** (segundos): `npm test`. `tests/art.test.ts` falha se um arquivo mapeado em `src/data/art.ts` não existir; `tests/sprites.test.ts` confere folhas, atlas, VFX, cenários, retratos e a tela de carregamento (formato, limites e que quadros vizinhos têm pixels diferentes); `tests/icons.test.ts` confere os SVG; `tests/sprite-anims.test.ts` e `tests/vfx.test.ts` conferem evento → animação e evento → efeito.
2. **Conferência visual automática** (~1 minuto): `npm run visual` (`tools/visual.mjs`). Sobe o Vite na porta 5199, abre o **Google Chrome instalado** pelo `playwright-core` (caminho padrão do macOS; troque com `--chrome <caminho>` ou `CHROME_PATH`) em **1280 × 800, 1280 × 720 e 1024 × 768**, joga Menu → Criação (Uchiha, preset Ninjutsu, tooltip) → Mapa → Preparação → Ficha (aba Atributos, tooltip) → Batalha (descrição do jutsu, um ataque e um jutsu em andamento) e grava 10 PNG por tamanho em screenshots/ (troque com `--out`). **Falha** com erro de Console, erro de página, requisição que falhou ou respondeu ≥ 400, rolagem horizontal, painel inferior cobrindo os pés dos lutadores ou painéis de cima cobrindo as cabeças. Não tem modo para o dist/; a pasta screenshots/ não está no `.gitignore`.
3. **Olho humano** (5 a 10 minutos): abrir as screenshots e seguir `docs/CONFERENCIA-VISUAL.md`. Para o build final, `npm run build` seguido de `npm run preview`.

**Checklist antes do push:**
- [ ] `npm test`, `npm run build` e `npm run docs:check` verdes.
- [ ] `npm run visual` termina com "ok: 3 tamanhos".
- [ ] Screenshots revistas: nada cobre os lutadores em 1024 × 768; texto legível sobre o cenário; nenhum estado transmitido só por cor.
- [ ] Todo asset novo de terceiros ou de IA registrado em `docs/LICENCAS-ASSETS.md`.
- [ ] public/assets/ dentro do orçamento (`du -sh public/assets`).

---

## 8. As decisões que o Gabriel precisa tomar

1. **Estilo dos lutadores.** A arte em uso é o boneco procedural de `tools/art/` (§10). Opções: (a) manter e refinar por código; (b) substituir por pixel art ou desenho manual (Rota D), mantendo o formato da §2.2; (c) contratar ou pedir ao colaborador. **Decisão pendente do Gabriel.**
2. **Origem e licença da arte antiga.** De onde vieram os 8 PNG de personagens e os 20 PNG de ícones? Enquanto não houver resposta, eles não podem ir a público (`docs/LICENCAS-ASSETS.md`). Ligar `portrait()` aos retratos originais tira esses PNG das telas DOM, mas não da arena (fallback).
3. **Licença da arte gerada no repositório** (`tools/gen-icons.py`, `tools/art/`). **Decisão pendente do Gabriel**, titular do projeto.
4. **Orçamento de IA.** Nenhum script do repositório chama serviço de IA (os de `tools/art/` só importam Pillow, numpy e a biblioteca padrão). **Recomendação:** continuar sem pagar até haver motivo.

---

## 9. O que ficou não verificado

- Plano e cota reais do Higgsfield do Gabriel, e os termos de propriedade das imagens geradas.
- Preços oficiais do PixelLab e dos geradores de folha de sprite (só fontes secundárias).
- Se o LibreSprite e o Piskel exportam o JSON do atlas direto (o formato da §2.2 pode ser escrito por um script).
- Nome interno da família das fontes WOFF2 (sem fontTools na máquina).
- `npm run visual` contra o build de produção (o script não tem esse modo).
- A reprodutibilidade de `npm run art:build` em outra máquina ou com outras versões de Pillow e numpy (§10.1).

---

## 10. Arte gerada por código (tools/art)

### 10.1 Como regenerar

```bash
npm run art:build                               # = python3 tools/art/pack.py: tudo
python3 tools/art/pack.py sprites vfx           # só alguns grupos
python3 tools/art/pack.py --preview /tmp/arte   # também GIFs e folhas de contato (fora do repositório)
```

Grupos: `sprites`, `retratos`, `vfx`, `cenarios`, `loading`. Requer Python 3 com Pillow e numpy; sem rede. As sementes são fixas. **Conferido em 2026-10-22:** rodar o `pack.py` numa cópia limpa de `tools/art/` gerou os 141 arquivos de saída **byte a byte iguais** aos commitados (Pillow 11.3.0, numpy 2.0.2, macOS). Os 141 arquivos: 8 × 2 de sprites + manifesto; 8 retratos; 48 × 2 de VFX + manifesto; 15 camadas, 2 overlays e o manifesto de cenários; 1 tela de carregamento.

Os ícones têm outro fluxo: `python3 tools/gen-icons.py` reescreve os SVG de assets/icones/ e, depois, `python3 tools/prepare-assets.py` publica em public/assets/.

### 10.2 Como funciona

| Arquivo | Papel |
|---|---|
| `tools/art/rig.py` | Esqueleto 2D com cinemática inversa; desenho com Pillow em supersampling. Quadro de referência de 192 px, pés em y = 178, personagem olhando para a direita |
| `tools/art/characters.py` | Os 8 lutadores: proporções, paletas, cabelo, roupa, arma. Desenhos originais, sem símbolo oficial |
| `tools/art/anims.py` | Poses-chave por arquétipo de luta (`kunai`, `kunai_rev`, `fist`, `brute`, `greatsword`, `needles`), com fps (`idle` 6, `attack` 12, `cast` 10, `hit` 10, `death` 9, `dodge` 12) e loop (só `idle`) |
| `tools/art/vfx.py` | Os 48 efeitos por partículas e formas, com semente fixa por efeito; cores dos elementos = `ELEMENT_COLOR` de `src/scenes/BattleScene.ts` |
| `tools/art/scenes.py` | Cenários em 3 camadas (numpy + Pillow), overlays e tela de carregamento; chão em y = 465 (`FLOOR_Y`) |
| `tools/art/pack.py` | Junta tudo, empacota as folhas (§2.2), grava WebP e os manifestos (§2.3) |

A âncora de cada folha é calculada a partir do personagem: x = fração da base (80/192 ≈ 0,4167; Zabuza 0,4) e y = (quadro − 14) / quadro.

### 10.3 Como um artista humano substitui a arte gerada

O jogo não sabe quem desenhou: basta entregar arquivos com os **mesmos caminhos e nomes**. Regras:

1. **Lutador:** public/assets/sprites/<id de arte>/sheet.png + atlas.json no formato da §2.2. Os nomes de quadro seguem `<animação>_<NN>`, e `meta.animations` precisa ter pelo menos `idle`, `attack`, `cast`, `hit` e `death` (de preferência também `dodge`). O desenho olha **para a direita**. O quadro pode ter outro tamanho (os chefes já usam 224 e 256), mas a escala na arena é fixa (`SHEET_SCALE` = 1,5 em `src/scenes/BattleScene.ts`): um quadro de 192 px aparece com 288 px.
2. **Âncora:** `meta.anchor` = posição dos **pés** em fração do quadro, igual em todos os quadros. Se a arte nova pisar em outra altura, ajuste a âncora; não mova o desenho para "caber". Sem âncora, vale { 0,4167; 0,9271 }.
3. **Folha:** até 2048 × 2048 px; PNG.
4. **VFX:** public/assets/vfx/<nome>/sheet.png + atlas.json, animação `play`, quadros `play_NN`; atualize `fps` e `loop` em `vfx/manifest.json`.
5. **Cenário:** substitua os WebP de public/assets/cenarios/batalha/ com o mesmo nome e 1280 × 720; os pés ficam em y = 465.
6. **Não rode `npm run art:build` depois de trocar à mão**: ele sobrescreve o grupo inteiro. Rode só os grupos que continuam procedurais (por exemplo `python3 tools/art/pack.py vfx cenarios`). Hoje os grupos não podem ser divididos por personagem.
7. Rode `npm test` (o `tests/sprites.test.ts` confere formato e quadros) e `npm run visual`, e registre autoria e licença em `docs/LICENCAS-ASSETS.md`.

### 10.4 Limitações conhecidas

- **Estilo:** boneco chibi *flat*, bem mais simples que as ilustrações PNG de assets/personagens/. A arena mistura os dois só se uma folha faltar (fallback).
- **Animações:** só as 6 básicas. Não existem `throw`, `defend`, `meditate`, `victory`, `controlled`, `item` nem as extras dos chefes (`docs/ASSETS.md` §3.1 e §4.3). A `dodge` existe na folha, mas `animForEvent` não a toca.
- **Sharingan:** há a aura animada `fx_aura_sharingan`; não há olho vermelho sobreposto nem retrato com Sharingan.
- **VFX sem evento:** `fx_slash`, `fx_fumaca`, `fx_tronco`, `fx_turn_marker`, `fx_explosao`, `fx_onda_agua` e `st_tenacidade` são gerados e carregados, mas nenhum evento os dispara.
- **Cenário por inimigo:** `battleSceneFor` põe Zabuza na `ponte` e Haku no `lago_nevoa`, ao contrário da sugestão de `docs/ASSETS.md` §5.1 (lago para Zabuza, ponte para Haku). O `acampamento` é gerado, mas nenhum inimigo o usa. Não há parallax: as camadas ficam paradas e só a névoa desliza.
- **Retratos originais** gerados, mas não ligados a nenhuma tela.
- **Números flutuantes** continuam em texto com a fonte do sistema.
- **Peso:** o carregamento busca 8 folhas, 48 VFX e 17 imagens de cenário antes da arena (o `#splash` cobre esse tempo).
