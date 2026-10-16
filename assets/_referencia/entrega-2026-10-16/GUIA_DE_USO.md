# Uso dos assets gráficos — NarutoTxGame

**Este pacote é uma biblioteca de arte, não uma integração de jogo.** Nenhum arquivo de código do projeto foi alterado.

## Convenção de caminhos
- Os SVGs e PNGs de exibição estão em `public/assets/gui/` e os ícones em `public/assets/icones/<categoria>/<id>/`.
- Os arquivos de moldura 9-slice ficam em `src/assets/ui/` e os WOFF2 ficam em `src/assets/fontes/` para o Vite resolver `url()` relativo durante o build (conforme `ARTE-PIPELINE.md`).
- O inventário `ASSETS.md` e `ARTE-PIPELINE.md` divergem nos nomes/rotas. Esta entrega conserva os IDs listados no inventário dentro das subpastas e usa a estrutura portuguesa priorizada pelo pipeline. **A correspondência exata com `src/data/art.ts` precisa ser revisada no repositório**, não fornecido nesta tarefa.

## Interface DOM (Vite)
Use como `background-image: url(...)` ou `<img>`, preservando os campos dinâmicos (nome, HP, teclas etc.) como HTML acessível. Ex.: `background-image: url('/assets/gui/botoes/btn_primary/normal.png')`. As versões PNG estão em **@2x**: um botão 260×74 em CSS usa o arquivo 520×148. Para ícones, SVG direto: `<img src="/assets/icones/jutsu/bola_de_fogo/bola_de_fogo.svg" alt="Bola de Fogo">`.

Para as molduras em `src/assets/ui/`, importe os SVG na folha CSS como URL relativa e use `border-image` com fatia 16: `border-image: url('../assets/ui/ui_frame_gold.svg') 16 fill / 16px / 0 stretch;` (ajuste o caminho conforme o local do CSS).

## Phaser
`this.load.svg('bola_de_fogo', 'assets/icones/jutsu/bola_de_fogo/bola_de_fogo.svg')` ou, para PNG: `this.load.image('bar_hp_frame', 'assets/gui/barras/bar_hp/frame.png')`. O preenchimento e o fantasma da barra são imagens separadas; dimensione ou masque o preenchimento conforme o valor da variável de jogo, não grave os números na imagem.

**Importante:** estas artes da interface não incluem atlases de lutadores; PNGs de retratos são **PARCIAIS** pela presença de fundo ilustrado dentro do recorte. Os cenários DOM aqui são imagens estáticas e não os fundos parallax da batalha.

## Estados
Botões possuem `normal`, `hover`, `selected`, `disabled`; abas possuem estados ativo/inativo; jutsus, títulos e clãs possuem ícone `_locked.svg`; cada nó de mapa possui símbolos de estado.

## Verificação
`VALIDACAO.json` registra arquivos inspecionados, formatos, transparência e erros. `INVENTARIO.csv` contém um registro por arquivo e estado. O pacote foi validado isoladamente, não executado no Vite/Phaser real.
