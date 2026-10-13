# NarutoTxGame — MVP (Saga da Onda)

Roguelite de ninjas por turnos, para um jogador e 100% local no navegador. Este MVP cobre a Saga da Onda (Zabuza e Haku), com três caminhos de clã (Uchiha, Uzumaki e Sem clã), loja, maestria de jutsus, títulos, Enciclopédia de Jutsus e Histórico de Runs.

O package npm se chama `ninja-x-rogue`.

Projeto de fã, sem fins comerciais. Não usa arte oficial: personagens e cenário são placeholders (formas e nomes).

## Requisitos

- Node 22 e npm

## Comandos

```bash
npm install         # instala as dependências
npm run dev         # servidor de desenvolvimento (Vite)
npm run build       # checa os tipos e gera dist/ estático
npm test            # testes (motor e interface)
npm run sim         # simulador de balanceamento: imprime a tabela de builds
npm run sim:check   # falha se alguma build sair da sua faixa de regressão
npm run docs:check  # confere os documentos (títulos, caminhos, números do código)
```

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
tools/         simulador de linha de comando
tests/         Vitest (motor em tests/, interface em tests/ui/)
docs/          registro de balanceamento, especificação e planos
```

## O que ficou de fora do MVP

- Conteúdo de fases futuras (F2 e F3): só a Saga da Onda está jogável. Os clãs Hyuuga, Nara, Akimichi e Aburame existem apenas como esboço de dados.
- Raio e arte oficial: o elemento Raio não está disponível, e todo o visual é placeholder.
- Verificação visual no navegador: a interface foi verificada por testes automatizados (happy-dom), build e requisições HTTP; falta olhar o jogo num navegador real (roteiro em `docs/CONFERENCIA-VISUAL.md`).
- Tempo de run na Ficha: não é exibido.
- Modo Infinito: aparece no menu como "em breve".

## Problemas conhecidos

- Em 5 das 6 builds focadas, alguma métrica fica fora da meta de design da spec §12; o `sim:check` as cobre com faixas de regressão por build (ver `docs/balance-log.md`). Uchiha fica no limite e Uzumaki vence o Haku em cerca de 95% das vezes.
- `npm run sim` (3000 runs por build) leva cerca de 141 s.

## Documentação

- `docs/ANALISE.md`: inconsistências do DD v2, correções, suposições (`ASSUMIDO`) e decisões do MVP.
- `docs/DESIGN.md`: Documento de Design v3, com os números finais do simulador.
- `docs/curso/README.md`: curso em 12 versões (Alfa 0.1 a 1.0), escrito a partir do código real.
- `docs/balance-log.md`: calibração, resultado final do simulador e a decisão das faixas por build.
- `docs/CONFERENCIA-VISUAL.md`: roteiro para olhar o jogo num navegador real.
