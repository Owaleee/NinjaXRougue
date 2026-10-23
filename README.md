# NarutoTxGame — MVP (Saga da Onda)

Roguelite de ninjas por turnos, para um jogador e 100% local no navegador. Este MVP cobre a Saga da Onda (Zabuza e Haku), com três caminhos de clã (Uchiha, Uzumaki e Sem clã), loja, maestria de jutsus, títulos, Enciclopédia de Jutsus e Histórico de Runs.

O package npm se chama `ninja-x-rogue`.

Projeto de fã, sem fins comerciais. Não usa arte oficial. A arte atual é provisória: lutadores animados, efeitos e cenários gerados por código do próprio repositório, mais o kit de interface de um colaborador (ver "Arte e licenças").

## Requisitos

- Node 22 e npm
- Para regerar a arte: Python 3 com Pillow e numpy
- Para `npm run visual`: Google Chrome instalado (o script usa `playwright-core` com o Chrome da máquina)

## Comandos

```bash
npm install         # instala as dependências
npm run dev         # servidor de desenvolvimento (Vite)
npm run build       # checa os tipos e gera dist/ estático
npm test            # testes (motor e interface)
npm run sim         # simulador de balanceamento: imprime a tabela de builds
npm run sim:check   # falha se alguma build sair da sua faixa de regressão
npm run docs:check  # confere os documentos (títulos, caminhos, números do código)
npm run visual      # screenshots em 1280×800, 1280×720 e 1024×768; falha com erro de Console, arte ausente ou HUD sobre os lutadores
npm run art:build   # regera sprites, VFX, cenários de batalha, retratos e tela de carregamento (tools/art)
python3 tools/prepare-assets.py   # publica ícones, peças de UI, fundos, fontes e favicon de assets/ em public/assets/
```

O `npm run visual` grava as imagens em screenshots/ (troque com `-- --out <pasta>`; outro Chrome com `-- --chrome <caminho>`).

`npm run sim:check` passa com **faixas por build**: as metas de design da spec §12 continuam impressas como distância, e o que o check protege é a regressão de cada build contra a sua própria faixa (ver `docs/balance-log.md`). O `npm run sim` completo (3000 runs por build) leva cerca de 141 s.

Use uma janela com 1024 px de largura ou mais (o layout é só desktop).

## Controles na batalha

| Tecla | Ação |
|---|---|
| `1`–`4` | Seleciona o jutsu do slot (mostra a descrição) |
| `Enter` | Usa o jutsu selecionado |
| `A` | Atacar |
| `D` | Defender |
| `M` | Meditar |
| `I` | Abre/fecha os itens |
| `T` | Transformar (Sharingan, Uchiha) |
| `Esc` | Fecha a descrição ou o painel de itens (não sai da batalha) |

Tecla segurada não repete a ação, e atalho de botão desabilitado é ignorado.

## Onde ficam os saves

No `localStorage` do navegador:

- `nxr.run.v1`: a run em andamento.
- `nxr.meta.v1`: Enciclopédia, títulos, estatísticas e Histórico.

Save inválido é copiado para `nxr.run.corrupt.<data>` / `nxr.meta.corrupt.<data>` e o jogo segue limpo. Para recomeçar do zero, apague as chaves `nxr.*` no DevTools (Application, Local Storage).

## Estrutura de pastas

```
src/game/      motor puro (regras, run, meta, save, simulador), sem Phaser nem DOM
src/data/      jutsus, clãs, itens, inimigos, saga, títulos (validados com Zod no boot)
src/store/     GameStore, a fonte da verdade da interface
src/ui-dom/    telas em HTML/CSS (uma por arquivo) e lógica de tela em view/
src/scenes/    Phaser: desenha a arena e anima os eventos do motor
src/i18n/      textos de interface (pt-BR)
tools/         simulador, verificador de documentos, conferência visual e scripts de arte (art/, gen-icons.py, prepare-assets.py)
assets/        fontes editáveis da arte (fora do bundle)
public/assets/ arte que o jogo carrega (gerada pelos scripts de tools/)
tests/         Vitest (motor em tests/, interface em tests/ui/)
docs/          design, análise, curso, balanceamento, arte, especificação e planos
```

## O que ficou de fora do MVP

- Conteúdo de fases futuras (F2 e F3): só a Saga da Onda está jogável. Os clãs Hyuuga, Nara, Akimichi e Aburame existem apenas como esboço de dados.
- Raio e arte final: o elemento Raio não está disponível, e a arte é provisória (ver "Arte e licenças").
- Conferência manual no navegador: o `npm run visual` abre o jogo num Chrome e tira screenshots, mas o roteiro manual de `docs/CONFERENCIA-VISUAL.md` ainda não tem registro de execução.
- Tempo de run na Ficha: não é exibido.
- Modo Infinito: aparece no menu como "em breve".

## Arte e licenças

- **Arena:** 8 lutadores com quadros reais (`idle`, `attack`, `cast`, `hit`, `death`, `dodge`), 48 efeitos visuais, 5 cenários em 3 camadas e a tela de carregamento, todos gerados por `tools/art/pack.py` (`npm run art:build`), sem rede e de forma reprodutível. Se uma folha faltar, a arena usa a imagem estática e, depois, um retângulo.
- **Telas:** ícones SVG, fundos de tela, fontes Cabin e favicon vieram de um colaborador (2026-10-16) e parte dos ícones foi redesenhada por `tools/gen-icons.py`.
- **Licenças:** a entrega do colaborador não declarou licença; a origem dos PNG antigos de personagens e ícones não está registrada; a licença da arte gerada aqui é decisão pendente. **Nada disso deve ir a público antes de resolver.** O que está comprovado fica em `docs/LICENCAS-ASSETS.md`.
- **Como produzir, regerar ou substituir a arte** (formatos, nomes de quadro, âncora dos pés): `docs/ARTE-PIPELINE.md`.

## Problemas conhecidos

- Em 5 das 6 builds focadas, alguma métrica fica fora da meta de design da spec §12; o `sim:check` as cobre com faixas de regressão por build (ver `docs/balance-log.md`). Uchiha fica no limite e Uzumaki vence o Haku em cerca de 95% das vezes.
- `npm run sim` (3000 runs por build) leva cerca de 141 s.
- Arte: estilo simples dos lutadores gerados, retratos originais ainda sem uso nas telas, alguns ícones pouco legíveis a 28 px. Lista completa no Patch notes 1.1 de `docs/CONTEXTO-DO-PROJETO.md`.

## Documentação

- `docs/ANALISE.md`: inconsistências do DD v2, correções, suposições (`ASSUMIDO`) e decisões do MVP.
- `docs/DESIGN.md`: Documento de Design v3, com os números finais do simulador.
- `docs/curso/README.md`: curso em 12 versões (Alfa 0.1 a 1.0), escrito a partir do código real.
- `docs/balance-log.md`: calibração, resultado final do simulador e a decisão das faixas por build.
- `docs/CONFERENCIA-VISUAL.md`: roteiro para olhar o jogo num navegador real.
- `docs/CONTEXTO-DO-PROJETO.md`: resumo autocontido do projeto, estado atual e Patch notes.
- `docs/ASSETS.md`: inventário de tudo o que é visual (P0/P1/P2) e o estado em 2026-10-22.
- `docs/ARTE-PIPELINE.md`: formatos, caminhos, convenção de nomes, como regerar e como substituir a arte.
- `docs/AUDITORIA-ASSETS.md`: auditoria da entrega do colaborador e o estado após as correções.
- `docs/LICENCAS-ASSETS.md`: autoria e licença comprovadas de cada grupo de assets.
- `docs/SOLICITACAO-COLABORADOR.md`: pedido pronto para o colaborador de arte.
- `docs/DECISOES-DE-EXECUCAO.md`: decisões e pendências menores da execução dos Planos 1 a 3.
