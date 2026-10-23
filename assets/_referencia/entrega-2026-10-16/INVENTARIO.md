# Inventário de entrega — NarutoTxGame GUI

Total de **555 arquivos de asset** individualmente cadastrados (SVG/PNG/WebP/WOFF2), mais documentação e prévias. **4 arquivos parciais**, todos retratos derivados de prancha; os demais entregues e verificados no nível de arquivo. **0 problemas** de validação.

| Formato | Arquivos |
|---|---:|
| PNG | 136 |
| SVG | 407 |
| WEBP | 9 |
| WOFF2 | 3 |

## Escopo realizado
- Ícones SVG individuais: 51 jutsus (14 jogáveis, 8 inimigos e 29 futuros), versões bloqueadas; itens, atributos, elementos, status, categorias, graus, clãs, títulos e navegação.
- HUD: molduras, 4 barras com frame/fill/ghost independentes, botões e seus 4 estados, abas, painéis, mapa e banners.
- Telas DOM: 9 fundos WebP procedurais de 1920×1080; identidade em SVG, favicon PNG; prévias compostas a partir dos componentes independentes.
- Fontes WOFF2 de licença identificada.

## Status parc​​iais e pendentes
- **sprites de lutadores animados** — P0: Fora do escopo GUI; não produzidos.
- **VFX de batalha/atlas de jutsu** — P0: Fora do escopo GUI; não produzidos.
- **fundo de batalha 3 camadas parallax** — P0: Prancha é composição, faltam camadas originais separadas.
- **retratos com fundo interno removido** — P0: Recortes IA preservam o fundo original dentro da moldura; revisão artística necessária.
- **atualização de src/data/art.ts** — P0: Sem repositório; não alterar código nesta tarefa.
- **telas restantes de modos F2 não definidos** — P2: Dados e layout insuficientes no ASSETS.md.
- **animações Sharingan 2/3 tomoe** — P2: Apenas descritas como futuras; sem fotogramas definidos.
- **equipamento visível no sprite** — P2: Requer especificação de layers e slots de sprite.
- **HUD mobile compacto** — P2: Requer layout mobile definido no projeto.
- **ícones para cosméticos e pontos de legado** — P2: Sistema futuro sem inventário de nomes/IDs.

## Lista de todos os arquivos
Consulte **INVENTARIO.csv**: um registro para cada arquivo físico, com ID, prioridade, caminho, formato, dimensões, estado e status. Não é um substituto de `ASSETS.md`.

**Limites de verificação:** o projeto/repositório real (`src/data/art.ts`) não foi fornecido para teste, portanto não há confirmação de integração. Os SVGs dos ícones foram reconstruídos com motivos vetoriais autorais coerentes com a referência, e não convertidos de recortes da prancha. PNGs da GUI são exportações reais @2x dos vetores, com canal alfa.
