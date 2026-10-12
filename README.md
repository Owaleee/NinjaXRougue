# NinjaXRogue — MVP (Saga da Onda)

Roguelite de ninjas por turnos, para um jogador e 100% local no navegador. Este MVP cobre a Saga da Onda (Zabuza e Haku), com três caminhos de clã (Uchiha, Uzumaki e Sem clã), loja, maestria de jutsus, títulos, Enciclopédia de Jutsus e Histórico de Runs.

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
npm run sim:check   # falha se alguma meta de balanceamento estiver fora da faixa
```

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
- Verificação visual no navegador: a interface foi verificada apenas por testes automatizados (happy-dom), sem roteiro manual em navegador real.
- Tempo de run na Ficha: não é exibido.
- Modo Infinito: aparece no menu como "em breve".

## Problemas conhecidos

- 8 metas de balanceamento ainda estão fora da faixa; veja `docs/balance-log.md`.
- `npm run sim` (3000 runs por build) leva cerca de 141 s.
