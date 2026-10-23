# Autoria e licenças dos assets

> **Regra deste documento:** só entra o que está comprovado por um arquivo do repositório ou pela própria entrega do colaborador. O que não está comprovado aparece como **não declarado**. Nada aqui é uma afirmação jurídica.
>
> **Atualizado em:** 2026-10-22 · **Fontes:** `assets/_referencia/entrega-2026-10-16/public/assets/CREDITOS.md` (texto do colaborador), `assets/fontes/LICENCA_CABIN.txt`, `assets/fontes/LICENCA_DEJAVU.txt`, `docs/AUDITORIA-ASSETS.md`.

## 1. Resumo por grupo

| Grupo | Origem comprovada | Licença comprovada | Pode ir a público? |
|---|---|---|---|
| Fonte Cabin (`assets/fontes/titulo.woff2`, `texto.woff2`) | Pablo Impallari e Igino Marini, segundo `LICENCA_CABIN.txt` | SIL Open Font License 1.1 | Sim, mantendo o texto da licença. A OFL proíbe usar o nome reservado "Cabin" em versão modificada; o nome interno da família nos arquivos não foi verificado |
| Fonte DejaVu Sans Mono Bold (`assets/fontes/numeros.woff2`) | Equipe DejaVu / Bitstream, segundo `LICENCA_DEJAVU.txt` | Bitstream Vera License | Sim, mantendo o texto da licença |
| Ícones SVG, peças de HUD, mapa, banners, molduras, fundos de tela (WebP), logo e favicon da entrega | O colaborador escreve: "reconstrução original criada com scripts", com uma prancha de GUI gerada por IA como referência visual | **Não declarada** | **Não**, até o colaborador declarar licença, autor e ferramentas (ver `docs/SOLICITACAO-COLABORADOR.md`) |
| Retratos da entrega (4 PNG) | O colaborador escreve: recortes de uma imagem gerada por IA | **Não declarada**; o próprio colaborador diz que a licença de imagens de IA "não é equivalente a CC0" | **Não.** Rejeitados por semelhança com personagens oficiais; ficam em `assets/_quarentena/` (ignorado pelo Git) |
| 8 PNG de personagens (`assets/personagens/`) e 20 PNG de ícones (`assets/icones_originais/`) | **Não registrada no repositório** | **Não declarada** | **Não**, até o Gabriel informar a origem |
| Arte gerada neste repositório (ícones redesenhados, sprites animados, VFX, cenários de batalha, tela de carregamento, retratos originais) | Gerada por código (`tools/gen-icons.py`, `tools/art/`) escrito pelo Claude (modelo de IA da Anthropic) durante sessões de trabalho do Gabriel, em outubro de 2026 | **Decisão pendente do Gabriel**, titular do projeto | Depende da decisão do Gabriel sobre a licença do projeto |

## 2. O que o colaborador escreveu (transcrição fiel dos pontos relevantes)

- Componentes SVG, ícones e ilustrações de fundo: "reconstrução original criada com scripts para este pedido, tomando como referência visual a prancha gerada anteriormente. Não são artes oficiais de Naruto nem logotipos de clãs oficiais."
- Texturas PNG: "rasterizações dos SVG originais com CairoSVG."
- Retratos: "recortes ajustados do arquivo `atlas_de_sprites_ninja_em_pixel_art.png`, gerado por IA em conversa anterior. Uso de IA; autoria e direitos de terceiros devem ser avaliados antes de publicar."
- "A licença das imagens de IA não é equivalente a CC0."
- "Revisão humana final de semelhança recomendada."

## 3. O que falta (e quem pode responder)

Nenhum destes dados existe no repositório. Eles não podem ser deduzidos nem preenchidos por inferência.

| Dado faltante | Quem sabe |
|---|---|
| Nome do autor ou da ferramenta que gerou os scripts de SVG | Colaborador |
| Licença ou cessão dos SVG, PNG e WebP "autorais" | Colaborador e Gabriel |
| Ferramenta de IA, data, prompt e termos de uso da prancha de GUI e do atlas dos retratos | Colaborador |
| Os arquivos-fonte de IA e os scripts geradores | Colaborador |
| Se as fontes foram modificadas (subconjunto) e o nome interno da família | Colaborador |
| Origem e licença dos 8 PNG de personagens e dos 20 PNG de ícones antigos | Gabriel |
| Licença do projeto e permissão de uso do nome "Naruto" no título | Gabriel |

## 4. Fora do escopo

Projeto de fã, sem fins comerciais. O nome "NarutoTxGame" e os nomes de personagens canônicos (Zabuza, Haku) são uma questão de propriedade intelectual do projeto inteiro (decisão em aberto nº 10 do DD v2), não só da arte.
