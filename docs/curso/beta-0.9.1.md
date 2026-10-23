# Beta 0.9.1 — Telas

> Leitor: dev JavaScript sem experiência em jogos. Commits desta versão: `5425a49`, `f015e01`, `a369ca2`, `52d7088` e `e148bb1`, e as correções de revisão `230e841`, `f8eba1e`, `742335d`, `2a4f2a7` e `4e57c67` (use `git log --oneline` para conferir e `git show <sha>` para ver o código como ficou).

## Objetivo

Ao fim desta versão o jogo é jogável no navegador fora da batalha: o `App` monta as camadas da página e redesenha a tela atual a cada mudança do `GameStore`, e existem as telas de menu, erro, criação, mapa, resultado com a escolha 1-de-3, fim de run, preparação, Ficha do Ninja com radar, Enciclopédia, Histórico e Títulos.

## Escopo

### Entra

- A mini-biblioteca de DOM em `src/ui-dom/dom.ts`: `h` (cria um elemento com propriedades e filhos), `append`, `clear`, `button` e `bar` (barra de HP, chakra ou XP com o número em texto).
- Os tipos que toda tela recebe em `src/ui-dom/types.ts` (`ScreenCtx`, `ScreenRenderer`, `KeyHandler`, `ModalHost`, `BattleView`).
- O `App` em `src/ui-dom/App.ts`: cinco camadas (canvas do Phaser, tela, avisos, modal e overlay), estado local por tela, modal e roteamento do teclado.
- O registro de telas em `src/ui-dom/screens/index.ts` (`SCREENS`, `KEYS`, `OVERLAY`).
- As telas em `src/ui-dom/screens/`: `MenuScreen.ts`, `ErrorScreen.ts`, `CreateScreen.ts`, `MapScreen.ts`, `ResultScreen.ts`, `RunEndScreen.ts`, `PrepScreen.ts`, `SheetScreen.ts`, `EncyclopediaScreen.ts`, `HistoryScreen.ts` e `TitlesScreen.ts`.
- Os componentes em `src/ui-dom/components/`: `allocation.ts` (distribuição de pontos com presets), `runHeader.ts` (cabeçalho da run), `tabBar.ts` (abas com marcador textual), `radar.ts` (o gráfico octogonal da Ficha) e `swap.ts` (o diálogo de troca de jutsu).
- A formatação de bônus de equipamento em `src/ui-dom/view/format.ts` (`bonusText`, `compareText`).
- `src/main.ts` deixa de ser provisório: cria o `GameStore` com `localStorage` (ou um `Map` em memória), `Date.now` e uma semente de `crypto.getRandomValues`, e monta o `App`.
- Os testes `tests/ui/dom.test.ts`, `tests/ui/menu.test.ts`, `tests/ui/create.test.ts`, `tests/ui/map-result.test.ts`, `tests/ui/prep-sheet.test.ts` e `tests/ui/meta-screens.test.ts`, com o helper de montagem `tests/ui/appHelpers.ts`.

### Fica de fora

- A tela de batalha, os atalhos de teclado da luta e a arena em Phaser: Beta 0.9.2. Nesta versão a tela `battle` ainda não está registrada, e o `App` mostra "Tela em construção." no lugar dela.
- O tratamento de erro durante o desenho de uma tela (`try/catch` em `App.render`): 1.0 (`bec6a2e`).
- O Modo Infinito: o botão existe no menu, desabilitado e marcado como "Em breve", porque a spec do MVP só cobre a Saga da Onda.
- Layout para celular: o MVP é só desktop (janela de 1024 px ou mais).
- Foco do teclado preservado entre redesenhos e foco preso dentro dos diálogos: ficam como problemas conhecidos (ver o patch log).

## Passo a passo

### Passo 1 — Telas como funções `(ctx) => HTMLElement`, redesenhadas a cada mudança

**O quê**: cada tela é uma função do tipo `ScreenRenderer` (`src/ui-dom/types.ts`), que recebe um `ScreenCtx` e devolve um elemento novo. O `ScreenCtx` traz o `store`, a função `local(chave, init)` para guardar estado só daquela tela (a aba aberta, o rascunho da criação), `rerender()` e o `modal`. O `App` (`src/ui-dom/App.ts`) se inscreve no store com `subscribe` e, a cada mudança, chama `render()`: apaga o conteúdo da camada da tela com `clear`, chama a função da tela atual e anexa o resultado. Quando a tela muda, o `App` zera o estado local (`locals.clear()`) e fecha o modal. O teclado passa por `onKey`: com modal ou overlay aberto, só `Esc` (que fecha o modal) é tratado; com o foco num `INPUT`, `SELECT` ou `TEXTAREA`, a tecla vai para o campo; fora disso, vai para o `KeyHandler` da tela atual, registrado em `KEYS` de `src/ui-dom/screens/index.ts`.

**Por quê**: a tela é uma **função do estado**: dado o mesmo `store.state`, ela desenha sempre a mesma coisa. Não existe estado escondido no DOM que possa discordar do store, e quem quer saber o que a tela mostra só precisa olhar o estado. É o mesmo princípio da fonte única da verdade da Beta 0.9.0, aplicado à interface. O estado local (`local`) existe para o que não é regra do jogo (qual aba está aberta, o rascunho de pontos antes de confirmar) e por isso não vai para o store nem para o save. Num jogo por turnos isso basta: o estado muda poucas vezes por segundo, e redesenhar uma tela inteira de algumas dezenas de elementos é imperceptível.

**Alternativas**: um framework de componentes (React, Vue, Svelte) compararia a árvore nova com a antiga e só mexeria no que mudou, preservando o foco e a posição de rolagem; o preço é uma dependência a mais, um passo de compilação próprio e um vocabulário (hooks, ciclo de vida) para um jogo com uma tela por vez, que já carrega o Phaser. Atualizar o DOM à mão, elemento por elemento, evita redesenhar, mas espalha a lógica "quando o HP muda, atualize este texto" por todo o código, e basta esquecer uma atualização para a tela mentir. O comentário no topo de `src/ui-dom/dom.ts` registra a escolha: um helper de 60 linhas basta.

**Riscos e armadilhas**: redesenhar do zero **perde o foco do teclado**. O elemento que tinha o foco é destruído e o navegador devolve o foco ao `body`; quem navega com `Tab` volta ao começo da página a cada clique. A tela de criação contorna isso no único lugar em que seria grave: digitar o nome não chama `rerender()`. O evento `input` atualiza o rascunho e chama `refreshStart`, que só liga ou desliga o botão "Começar" e reescreve o motivo (correção `230e841`, com o comentário "redesenhar a tela a cada tecla tiraria o foco do campo"). Os botões `+`/`−` da distribuição de pontos continuam redesenhando e perdendo o foco. A outra armadilha é o estado local: ele vive enquanto a **tela** não muda, não enquanto a **oferta** não muda, e isso causou um bug real na tela de resultado (Passo 4).

### Passo 2 — Texto sempre como nó de texto, nunca `innerHTML`

**O quê**: `h(tag, props, ...filhos)` cria o elemento com `document.createElement` e `append` converte todo filho que é `string` ou `number` em `document.createTextNode`. Nenhuma tela usa `innerHTML`, `outerHTML` ou `insertAdjacentHTML`. Atributos passam por `setAttribute` e eventos por `addEventListener`, nunca por atributos `on...` em texto. O radar da Ficha (`src/ui-dom/components/radar.ts`) segue a mesma regra com `createElementNS` e `textContent`.

**Por quê**: o jogador escolhe o nome do personagem, e esse nome aparece no menu ("Continuar a run de..."), na Ficha, no fim de run e no Histórico. Se o nome entrasse como HTML, um nome como `<img src=x onerror=alert(1)>` criaria uma imagem quebrada que executa código: isso é **XSS** (injeção de script). Num jogo local o risco parece pequeno, mas o Histórico guarda o nome no `localStorage` e o mostra em toda visita, e um save editado à mão ou importado poderia carregar qualquer coisa. Como nó de texto, o nome aparece literal, com os sinais `<` e `>` visíveis, e nada executa. É o Review Focus 5 do Plano 2.

**Alternativas**: montar HTML em string e escapar os caracteres especiais antes de usar `innerHTML` funciona, mas depende de nunca esquecer o escape em nenhum lugar; criar nós de texto é seguro por construção. Uma biblioteca de sanitização (como DOMPurify) remove o perigoso de um HTML que você *precisa* aceitar, o que não é o caso: nenhuma tela do jogo mostra HTML vindo do jogador.

**Riscos e armadilhas**: a regra só vale se for absoluta. Um único `innerHTML` "só para este negrito" reabre a falha. Por isso a regra está escrita no topo de `src/ui-dom/dom.ts` e há um teste por tela que mostra o nome: `texto com HTML vira texto literal (Review Focus 5)` em `tests/ui/dom.test.ts`, o teste do menu em `tests/ui/menu.test.ts`, `um nome com tags aparece como texto literal, sem criar elemento` em `tests/ui/create.test.ts`, `nome do personagem com HTML aparece como texto literal` em `tests/ui/meta-screens.test.ts` e o teste da Ficha que a correção `2a4f2a7` acrescentou (`nome com HTML aparece literal e não cria elemento`, em `tests/ui/prep-sheet.test.ts`). Os testes não olham só o texto: conferem que nenhum elemento `img` ou `b` foi criado.

### Passo 3 — Acessibilidade mínima: nada só pela cor

**O quê**: a spec §10 pede que nenhuma informação dependa só da cor. Cada estado visual tem também um marcador em texto ou um atributo para leitor de tela. A aba ativa (`src/ui-dom/components/tabBar.ts`) leva `✓` antes do nome e `aria-selected="true"`. O clã escolhido na criação leva `✓` e `aria-pressed="true"`. O nó do mapa mostra `✓ vencido` ou `▶ atual` e o atual tem `aria-current="step"`. O Treino selecionado no resultado leva `✓` e `aria-pressed`. O botão "Detalhes" do Histórico mostra `▸` fechado e `▾` aberto, com `aria-expanded`. Botão desabilitado mostra o motivo em texto ao lado: na criação, "Distribua os 3 pontos restantes." (em `role="status"`); na loja, "Ryo insuficiente."; no resultado, por que o "Continuar" está bloqueado. As barras de `bar()` mostram "HP: 80/114" em texto e expõem `role="progressbar"` com `aria-valuenow` e `aria-valuemax`. Os avisos ficam numa camada `aria-live="polite"`, com `role="alert"` para erro.

**Por quê**: perto de 8% dos homens têm alguma deficiência na visão de cores; um botão "apagado" em cinza claro e um botão ativo em laranja podem parecer iguais. Leitores de tela não veem cor nenhuma. E o motivo em texto ajuda todo jogador: um botão "Começar" desabilitado sem explicação faz o jogador procurar o que falta, enquanto "Dê um nome ao seu ninja." resolve na hora. Em jogo, esse retorno imediato do porquê de uma ação estar bloqueada é parte do design, não só de acessibilidade.

**Alternativas**: depender de `title` (a dica que aparece ao passar o mouse) não serve: não aparece no teclado nem no toque, e leitores de tela nem sempre o leem. Ícones sem texto exigiriam uma legenda separada. Uma auditoria completa de acessibilidade (WCAG AA) ficou fora do MVP; o mínimo da spec §10 é o que está coberto.

**Riscos e armadilhas**: é fácil escrever primeiro só a classe CSS (`active`, `selected`, `primary`) e esquecer o texto, e foi o que aconteceu: três correções da revisão pegaram estado só pela cor. O `230e841` acrescentou ao clã selecionado o marcador `✓` e o `aria-pressed`, e ao botão "Começar" o motivo visível (antes ele só ficava desabilitado). O `2a4f2a7` criou o `tabBar`, porque as abas da Preparação e da Ficha só mudavam de classe; o teste agora confere o texto exato `✓ Jutsus` e que nenhuma outra aba tem `✓`. O `4e57c67` pôs o marcador `▸`/`▾` no botão "Detalhes" do Histórico. Outro cuidado: `aria-pressed` só vale para botão que alterna. O `f8eba1e` tirou o atributo dos cartões de recompensa que resolvem na hora (Kit, Ryo...) e o deixou só no Treino (teste `cartões que resolvem na hora não levam aria-pressed`).

### Passo 4 — As telas, uma a uma

**O quê**: cada tela lê o estado do store e chama os comandos dele.
- **Menu** (`src/ui-dom/screens/MenuScreen.ts`): "Continuar" (só com run ativa, com o nome e o encontro atual), "Modo História" (pede confirmação para abandonar a run atual), Enciclopédia, Histórico e Títulos.
- **Erro** (`src/ui-dom/screens/ErrorScreen.ts`): mostra `store.state.fatalError` e o botão "Recarregar o jogo".
- **Criação** (`src/ui-dom/screens/CreateScreen.ts`): nome, clã, afinidade (travada em Fogo no Uchiha; Raio fica de fora até a Fase 2), título conquistado e os 10 pontos de criação (`BALANCE.attributes.creationPoints`) pelo `allocationPanel`; a prévia vem de `creationPreview` (Beta 0.9.0).
- **Mapa** (`src/ui-dom/screens/MapScreen.ts`): os nós de `run.nodes`, o próximo inimigo com o grau, a bifurcação de elite quando o nó tem `eliteEnemyId` e, na fase `camp`, só o botão de descansar.
- **Resultado** (`src/ui-dom/screens/ResultScreen.ts`): recompensas de `run.lastResult`, a escolha 1-de-3 de `run.pendingChoices[0]`, os pontos novos e as metas de `jutsuGoals`; o "Continuar" fica bloqueado enquanto houver escolha pendente.
- **Fim de run** (`src/ui-dom/screens/RunEndScreen.ts`): o texto e as estatísticas de `store.state.runEnd`, já gravados na meta pelo store.
- **Preparação** (`src/ui-dom/screens/PrepScreen.ts`): abas Loja (`run.shop`, preço de `priceOf`), Jutsus (slots de `slotCount`, custo de `costFor`, maestria de `masteryProgress`), Equipamento (comparação com `compareText`) e Atributos (pontos e Pergaminho Raro).
- **Ficha** (`src/ui-dom/screens/SheetScreen.ts`): somente leitura, com Perfil (Poder Ninja, estilo de luta), Atributos (radar base × efetivo de `radarSvg` e a tabela de derivados), Jutsus e Equipamento.
- **Enciclopédia** (`src/ui-dom/screens/EncyclopediaScreen.ts`): todos os jutsus de `encyclopedia(meta)`, com filtros de categoria e situação e os requisitos de cada um.
- **Histórico** (`src/ui-dom/screens/HistoryScreen.ts`): totais vitalícios de `meta.lifetime` e as runs de `meta.history`, com detalhes que abrem e fecham.
- **Títulos** (`src/ui-dom/screens/TitlesScreen.ts`): os títulos de `TITLE_LIST`, os não conquistados como "???" com a dica e os ocultos (C14) fora da lista.
- **Troca de jutsu** (`src/ui-dom/components/swap.ts`): o overlay abre sozinho quando `store.state.swapQueue` tem um jutsu, oferecendo "Substituir" para cada equipado ou "Manter no repertório".

**Por quê**: nenhuma tela calcula regra. Preço, custo de chakra, maestria e desbloqueio vêm das funções do motor; números de tela vêm dos derivados da Beta 0.9.0. A Ficha é somente leitura de propósito: ela pode ser aberta da batalha (Beta 0.9.2) sem gastar turno, então não pode ter botão que mude a run. A **escolha 1-de-3** é um padrão de roguelike: depois de cada vitória o jogo oferece três recompensas e o jogador fica com uma, o que obriga a decidir entre curar agora, ficar mais rico ou treinar um jutsu, em vez de pegar tudo.

**Alternativas**: uma tela única com painéis que aparecem e somem (um "painel lateral" de preparação sobre o mapa) economizaria navegação, mas misturaria estados locais de vários painéis e complicaria o roteamento do teclado. Desenhar o radar num `canvas` em vez de SVG daria o mesmo visual, mas o SVG tem os rótulos como texto (o leitor de tela e o teste podem ler "Nin 15") e escala sem borrar.

**Riscos e armadilhas**: o bug mais instrutivo desta versão foi o **Treino que vazava entre ofertas**. A seleção do Treino (que abre a lista de jutsus para treinar) era guardada no estado local da tela de resultado, que só zera quando a *tela* muda. Com três escolhas pendentes, a tela continua a mesma entre uma oferta e a seguinte: o jogador clicava em Treino, mudava de ideia, clicava em Kit, e a oferta seguinte já aparecia com a lista de treino aberta. O `f8eba1e` zera a seleção ao escolher outra recompensa e só considera o Treino selecionado se a oferta atual tiver Treino (`ui.training && !!offer?.includes('treino')`); o teste `Treino seguido de Kit não vaza a seleção para a próxima oferta` prova isso. Outra armadilha: o Histórico lê entradas que o save valida só como lista, e uma run gravada por uma versão antiga (ou editada à mão) pode não ter clã, afinidade ou snapshot. O `4e57c67` fez toda leitura do Histórico tolerar campo ausente ou inválido e mostrar um traço (`—`) no lugar do valor (teste `clã desconhecido, afinidade inválida e snapshot vazio renderizam sem lançar, com texto neutro`). E as metas "Faltam X para Y" precisam usar o atributo **base**, não o efetivo com bônus de equipamento; o `742335d` reforçou os testes disso e da junção "2 de Ninjutsu e 1 de Velocidade".

## Critérios de conclusão

- `npx vitest run tests/ui` passa.
- `npx vitest run tests/ui/dom.test.ts tests/ui/menu.test.ts tests/ui/create.test.ts tests/ui/map-result.test.ts tests/ui/prep-sheet.test.ts tests/ui/meta-screens.test.ts` passa.
- `npm run build` termina sem erros.
- `npm run dev` abre o menu no navegador; criar um personagem leva ao mapa (a batalha ainda mostra "Tela em construção." ao fim desta versão).

## Testes

- `tests/ui/dom.test.ts`: prova que `h()` transforma HTML em texto literal, ignora filhos nulos, que `button` respeita `disabled`, que `bar` limita a largura e expõe o valor, e que o `App` desenha a tela atual, guarda o estado local entre redesenhos e o zera ao trocar de tela, mostra e fecha avisos e não manda teclas para a tela enquanto se digita num campo.
- `tests/ui/menu.test.ts`: prova o "Continuar" desabilitado sem run, o Modo Infinito "Em breve", o nome literal e a confirmação antes de abandonar.
- `tests/ui/create.test.ts`: prova a afinidade travada do Uchiha, Raio fora das opções, os botões `+`/`−`, o preset Ninjutsu, os motivos visíveis do botão "Começar", o clã com `aria-pressed` e marcador, os títulos disponíveis e a afinidade que chega à run.
- `tests/ui/map-result.test.ts`: prova o mapa (próximo encontro, elite, Acampamento, salvar e voltar), o resultado (recompensas, 1-de-3 que libera o "Continuar", Treino como alternância que não vaza, metas pelo atributo base) e o fim de run (morte e vitória com título novo).
- `tests/ui/prep-sheet.test.ts`: prova a loja (compra, falta de ryo com motivo, Pergaminho Raro), a troca de jutsus e de equipamento, o radar, a Ficha (base × efetivo com a katana), a aba ativa com `✓`, o nome literal e o diálogo de troca de jutsu, inclusive que resolver a fila de troca não mexe nas escolhas pendentes.
- `tests/ui/meta-screens.test.ts`: prova a Enciclopédia (selos, filtros, jutsus de fase futura), o Histórico (vazio, detalhes, nome literal, entradas malformadas) e os Títulos ("???" e ocultos fora).

## Patch log

### Adicionado

- A mini-biblioteca de DOM `src/ui-dom/dom.ts`, os tipos de `src/ui-dom/types.ts` e o `App` de `src/ui-dom/App.ts`.
- Onze telas em `src/ui-dom/screens/` e o registro `src/ui-dom/screens/index.ts`.
- Os componentes `allocation.ts`, `runHeader.ts`, `tabBar.ts`, `radar.ts` e `swap.ts` em `src/ui-dom/components/`, e `src/ui-dom/view/format.ts`.
- Os testes de interface listados na seção Testes e o helper `tests/ui/appHelpers.ts`.

### Alterado

- `src/main.ts` passou a montar o `App` e o `GameStore` com as dependências reais (`5425a49`).
- Na 1.0 (`bec6a2e`), `App.render` ganhou o `try/catch` que leva um erro de desenho à tela de erro, o botão de fechar aviso ganhou `aria-label` e os últimos textos montados à mão nas telas (o `✓` do Treino, o separador "nome — texto") foram para `src/i18n/pt-BR.ts`.

### Corrigido

- O botão "Começar" mostra o motivo de estar desabilitado, e o clã selecionado tem `aria-pressed` e o marcador `✓` (`230e841`).
- A seleção do Treino não vaza para a oferta seguinte, e só o Treino leva `aria-pressed` (`f8eba1e`).
- As metas de jutsu têm testes que distinguem atributo base de efetivo (`742335d`).
- A aba ativa tem marcador textual pelo `tabBar`, e o separador `' · '` foi para o dicionário (`2a4f2a7`).
- O Histórico tolera runs malformadas, e o botão "Detalhes" tem marcador de aberto ou fechado (`4e57c67`).

### Removido

Nada nesta versão.

### Problemas conhecidos

- O redesenho completo perde o foco do teclado: depois de clicar num botão (por exemplo, `+` na distribuição de pontos), o foco volta ao começo da página. Só o campo de nome da criação é protegido.
- O overlay de troca de jutsu não prende o foco: com `Tab`, o foco pode ir para os botões da tela por baixo dele (as teclas de atalho, porém, são ignoradas enquanto o overlay está aberto).
- Um erro dentro de uma tela, nesta versão, interrompe o redesenho sem levar à tela de erro; isso só foi tratado na 1.0 (`bec6a2e`).
