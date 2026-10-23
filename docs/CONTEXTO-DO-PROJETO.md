# NarutoTxGame — Contexto do projeto (para colar na sua IA)

> **Para que serve este arquivo.** É um resumo autocontido do projeto para quem chega agora (pessoa ou IA). Ele explica a ideia, as regras do jogo, a stack, a arquitetura, as decisões importantes, o estado atual e o histórico de versões. Os detalhes completos estão nos documentos citados; quando este resumo e o código divergirem, **vale o código**.
>
> **Atualizado em:** 2026-10-22 · **Branch:** `feat/mvp` (67 commits à frente de `main`) · **Estado:** MVP 1.0 concluído e versão 1.1 de arte e interface no branch (413 testes passando em 39 arquivos). Aguarda a decisão de licença da arte, a conferência manual no navegador e o merge em `main`.

---

## 1. A ideia

**NarutoTxGame** é um **RPG tático por turnos com estrutura roguelike** (no estilo de PokéRogue), para **um jogador**, rodando **100% local no navegador**, ambientado no universo de Naruto.

- Uma **run** é uma tentativa completa: o jogador cria um ninja, atravessa uma saga encontro por encontro e, se morrer, recomeça do zero.
- O que sobrevive entre runs é a **meta-progressão**: Enciclopédia de Jutsus, títulos e Histórico de Runs.
- **Projeto de fã, sem fins comerciais e sem arte oficial.** A arte atual é provisória: lutadores animados, efeitos e cenários gerados por código do próprio repositório (`tools/art/`), mais o kit de interface de um colaborador (ícones, fundos, fontes). Ver a §4 ("Arte") e `docs/LICENCAS-ASSETS.md`. O pacote npm se chama `ninja-x-rogue`.

### Pilares do design
1. **O investimento em atributos define o arsenal.** Os jutsus são aprendidos automaticamente quando o personagem cumpre os requisitos de atributo base, clã, ponto da história e pré-requisito. Nenhuma outra fonte dá jutsu.
2. **O clã dá identidade sem ser obrigatório.** Os jutsus icônicos (Kage Bunshin, Rasengan) são gerais.
3. **Fidelidade à cronologia do anime.** Nenhum jutsu aparece antes do ponto da história em que ele surge na obra.
4. **Informação completa no combate.** Buffs, debuffs e controles ficam sempre visíveis, com os turnos restantes.
5. **Números dirigidos por dados e validados por simulação.** Toda constante está em `src/game/Balance.ts` e passa por um simulador headless.
6. **Estabilidade antes de expansão.** Cada fase precisa estar sólida antes da próxima.

### Escopo do MVP: a Saga da Onda
- **26 encontros**, com **Zabuza** (grau C) no 13º e **Haku** (grau B) no 26º, e um Acampamento (cura total e checkpoint) antes de cada chefe.
- **3 caminhos de clã:** Uchiha, Uzumaki e Sem clã.
- Loja, equipamento (Arma e Armadura), 4 slots de jutsu, maestria de jutsus, títulos com buff, Enciclopédia, Histórico, Ficha do Ninja, escolha 1-de-3 ao subir de nível e Pergaminho Raro.
- **Fora do MVP:** online, PvP, Modo Infinito (aparece no menu como "em breve"), Exame Chunin e sagas seguintes, clãs Hyuuga, Nara, Akimichi e Aburame, elemento Raio, arte final (a atual é provisória), áudio e layout mobile (o mínimo é 1024 px de largura).

### Roadmap (fases)
| Fase | Conteúdo | Situação |
|---|---|---|
| F0 | Fatia vertical: combate, progressão, loja mínima, save | Entregue |
| F1A | Saga da Onda completa, clãs, economia, maestria, Enciclopédia | Entregue |
| F1B | Ficha, títulos, Histórico, 1-de-3, Pergaminho Raro | Parcial (faltam a aba Registro de Batalha, a tela de equipamento com silhueta e os eventos entre encontros) |
| F2 | Exame Chunin, promoção, 6 slots, Raio, Chidori, novos clãs, Sharingan tomoe 2/3 | Futuro |
| F3 | Busca por Tsunade (Rasengan), Recuperação do Sasuke, Jounin | Futuro |
| F4 | Online, Modo Infinito, ranking | Futuro |

---

## 2. Como o jogo funciona (resumo das regras)

### Personagem
- 8 atributos (HP, Chakra/Int, Taijutsu, Ninjutsu, Genjutsu, Velocidade, Defesa, Crítico). Todos começam em 5, e a criação dá 10 pontos.
- A cada nível: 5 pontos livres, mais 1 automático em cada atributo de destaque do clã. O Sem clã recebe 6 livres.
- **Presets de distribuição:** Ninjutsu, Taijutsu e Equilibrado-guiado, mais o botão "Distribuir pelo preset". Eles existem porque o simulador mostrou que builds espalhadas não passam de Zabuza.

### Clãs
| Clã | Destaques | Passivas |
|---|---|---|
| Uzumaki | HP, Int | +10% de HP máx; Meditar rende +20%; Kage Bunshin custa −20% |
| Uchiha | Gen, Crit | **Sharingan como transformação** (ativar não gasta o turno, manutenção de 2 de chakra por turno, +crítico, +esquiva, +dano de jutsu); Fogo +15% |
| Sem clã | — | −10% de custo em jutsus gerais; a maestria exige 25% menos usos; ignora a penalidade de afinidade |

### Combate (1x1, por turnos)
- A ordem de ação depende da Velocidade, com uma pequena variação aleatória.
- **Ações:** Atacar, Jutsu (4 slots), Defender (metade do dano), Meditar (recupera chakra), Item e Transformar (só Uchiha).
- **Dano:** `Poder × (1 + 0,03·maestria) × (1 + Atr/40) × Elemento × (1 + Σbônus%) × (1 − Redução) × Crítico × Variação`.
- **Roda elemental:** Fogo → Vento → Raio → Terra → Água → Fogo (×1,3 com vantagem, ×0,8 em desvantagem).
- **Efeitos:** buff, debuff, dano contínuo (queimadura), controle (imobilizado, atordoado, ilusão) e transformação. Depois de um controle, o alvo ganha 2 turnos de Tenacidade (imunidade). Sob Ilusão, a única ação permitida é **Kai**.
- **IA:** inimigos comuns seguem regras gerais. Zabuza e Haku têm padrões próprios e uma **2ª fase abaixo de 50% de HP**.

### Run e economia
- Mapa com 26 nós. Os comuns são sorteados pela semente, e em 3 nós aparece a bifurcação **"Comum ou Elite (D+)"**.
- Ao fim de cada encontro: +25% de HP e +50% de chakra. Recompensas em ryo, reputação e XP.
- **Escolha 1-de-3 ao subir de nível:** kit médico, pílula de chakra, Pergaminho de Reforço, ryo ou treino. **Nunca oferece jutsu.**
- **Loja** na tela de Preparação: consumíveis, 2 equipamentos sorteados e o Pergaminho Raro (+1 em um atributo base).
- **Maestria:** o uso repetido de um jutsu sobe a maestria até +5, com menos custo, mais dano e mais chance de efeito.

### Meta-progressão (persistente)
- **Enciclopédia:** todos os jutsus, inclusive os bloqueados e os de fases futuras, com os requisitos de cada um.
- **Histórico:** cada run com clã, nível, resultado e snapshot da ficha.
- **Títulos:** um ativo por run, com buff passivo. Exemplos: "Demônio da Névoa" (derrotar Zabuza, +3% de esquiva) e "Por um Fio" (vencer um chefe com menos de 10% de HP, +3% de crítico).

---

## 3. Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | **TypeScript** (strict) |
| Build e servidor de desenvolvimento | **Vite** 6 |
| Batalha (arena e animações) | **Phaser** 3.88 (fixo em `~3.88.2`) |
| Demais telas | **HTML/CSS (DOM) puro**, sem framework de UI |
| Validação dos dados do jogo | **Zod** |
| Testes | **Vitest** 5 + **happy-dom** (a interface é testada sem navegador) |
| Conferência visual | **playwright-core** com o Google Chrome instalado (`tools/visual.mjs`) |
| Arte gerada e preparação de assets | **Python 3** + **Pillow** e **numpy** (`tools/art/`, `tools/prepare-assets.py`, `tools/gen-icons.py`) |
| Scripts em Node (simulador, verificador) | **tsx** |
| Persistência | `localStorage` (chaves `nxr.run.v1` e `nxr.meta.v1`) |
| Node | ≥ 22 |
| Idioma da interface | pt-BR (`src/i18n/pt-BR.ts`) |

### Comandos
```bash
npm install         # instala as dependências
npm run dev         # abre o jogo (Vite)
npm run build       # checa os tipos e gera dist/
npm test            # 413 testes em 39 arquivos (motor + interface + arte)
npm run sim         # simulador: 3000 runs × 8 builds (~141 s)
npm run sim:check   # falha se alguma build regredir da sua faixa
npm run docs:check  # confere os documentos contra o código
npm run visual      # screenshots em 3 tamanhos de janela; falha com erro de Console, arte ausente ou HUD sobre os lutadores
npm run art:build   # regera sprites, VFX, cenários, retratos e tela de carregamento (tools/art)
python3 tools/prepare-assets.py   # publica ícones, UI, fundos, fontes e favicon de assets/ em public/assets/
```

---

## 4. Arquitetura

```
src/game/      motor PURO: regras, run, meta, save, simulador (sem Phaser, DOM, Math.random ou Date)
src/data/      conteúdo: jutsus, clãs, itens, inimigos, saga, títulos (validados com Zod no boot)
src/store/     GameStore: única fonte da verdade da interface
src/ui-dom/    telas em HTML/CSS (uma por arquivo) + componentes + lógica de tela (view/)
src/scenes/    Phaser: só desenha a arena e anima os eventos do motor
src/i18n/      textos pt-BR
tools/         simulador (simulate.ts), verificador de documentos (docs-check.ts), conferência visual (visual.mjs),
               preparação de assets (prepare-assets.py), ícones (gen-icons.py) e arte procedural (art/)
assets/        fontes editáveis da arte (fora do bundle); _quarentena/ é ignorada pelo Git
public/assets/ o que o jogo carrega (gerado pelos scripts de tools/)
tests/         Vitest (motor em tests/, interface em tests/ui/)
docs/          design, análise, curso, balanceamento, planos
```

### Princípios
- **Motor puro e determinístico.** Todo sorteio usa um `Rng` com semente (mulberry32): mesma semente e mesmas ações dão o mesmo resultado. Isso permite simular milhares de runs, reproduzir bugs e, no futuro, validar lutas num servidor.
- **Contrato do motor:** `applyAction(state, action, rng) → { state, events }`. A UI nunca altera o estado diretamente, e ação inválida lança um erro tipado (`RuleError`).
- **Eventos** (`damage`, `dodge`, `crit`, `effectApplied`, `defeated`, `levelUp`...) alimentam a animação, o log de batalha, o rastreador de estatísticas e os títulos.
- **Fluxo:** UI → `GameStore` → motor → `{state, events}` → o store salva e publica → o Phaser anima (a entrada fica travada até a animação terminar) → o DOM redesenha.
- **Constantes de balanceamento** ficam em `src/game/Balance.ts`, e o **conteúdo** em `src/data/`.
- **Robustez:** o save nunca derruba o jogo (um save inválido vai para a quarentena `nxr.*.corrupt.<data>`); qualquer erro de render ou animação leva a uma tela de erro com "Recarregar"; o fim de run é idempotente (a mesma run nunca é contada duas vezes).

### Arte (pipeline, comandos e pastas)

Detalhes em `docs/ARTE-PIPELINE.md`; inventário em `docs/ASSETS.md`; autoria e licenças em `docs/LICENCAS-ASSETS.md`.

| Grupo | De onde vem | Onde fica | Como regerar |
|---|---|---|---|
| Lutadores animados (8 folhas, 6 animações, 35 quadros cada) | Gerados por código (`tools/art/characters.py`, `anims.py`, `rig.py`) | public/assets/sprites/<id>/{sheet.png, atlas.json} | `npm run art:build` |
| Efeitos de batalha (48) | `tools/art/vfx.py` | public/assets/vfx/<nome>/ | `npm run art:build` |
| Cenários da arena (5 × 3 camadas + 2 overlays) | `tools/art/scenes.py` | public/assets/cenarios/batalha/ | `npm run art:build` |
| Tela de carregamento e 8 retratos originais | `tools/art/` | public/assets/identidade/, public/assets/retratos_originais/ | `npm run art:build` |
| Ícones SVG (194 + 80 bloqueados), peças de UI, 9 fundos de tela, fontes Cabin, logo e favicon | Entrega do colaborador (2026-10-16); parte dos ícones redesenhada por `tools/gen-icons.py` | assets/ → public/assets/ | `python3 tools/gen-icons.py` e depois `python3 tools/prepare-assets.py` |
| 8 PNG de personagens e 20 PNG de ícones antigos | Origem **não registrada** | assets/personagens/, assets/icones_originais/ → public/assets/ | `python3 tools/prepare-assets.py` |

- **Fallback na arena:** folha animada → PNG estático → retângulo. Arquivo ausente nunca derruba a batalha.
- **Reprodutível:** em 2026-10-22, `tools/art/pack.py` rodado numa cópia limpa gerou os 141 arquivos iguais byte a byte aos commitados (Pillow 11.3.0, numpy 2.0.2).
- **Sem IA generativa:** os scripts de `tools/art/` só importam Pillow, numpy e a biblioteca padrão do Python.
- **Quarentena:** os 4 retratos da entrega com semelhança a personagens oficiais ficam em assets/_quarentena/, que o `.gitignore` exclui; não estão no histórico do Git nem no build.
- **Antes de commitar arte:** `npm test`, `npm run build`, `npm run docs:check` e `npm run visual`.

---

## 5. Documentos do repositório (onde está cada coisa)

| Arquivo | Conteúdo |
|---|---|
| `docs/referencia/NarutoTxGame_Documento_de_Design_v2.md` | Documento de design **original** (DD v2), a fonte da ideia |
| `docs/superpowers/specs/2026-10-04-narutotxgame-mvp-design.md` | Spec do MVP: o que entra, as correções C1–C15 e as suposições |
| `docs/superpowers/plans/` | Os 4 planos de implementação (motor, interface, documentos, arte); o plano 4 tem o estado real de cada task no topo |
| `docs/DESIGN.md` | **Design v3**: o jogo como foi implementado, com os números finais (o documento mais completo) |
| `docs/ANALISE.md` | Inconsistências do DD v2, correções, suposições e decisões |
| `docs/balance-log.md` | Calibração do balanceamento, iteração por iteração |
| `docs/DECISOES-DE-EXECUCAO.md` | Decisões tomadas durante a execução e pequenas pendências adiadas |
| `docs/curso/` | Curso em 12 versões (Alfa 0.1 → 1.0), que reconstrói o projeto commit a commit |
| `docs/CONFERENCIA-VISUAL.md` | Roteiro para testar o jogo num navegador real |
| `docs/ASSETS.md` | Inventário de tudo o que é visual, com prioridades P0/P1/P2 e o estado em 2026-10-22 (§13) |
| `docs/ARTE-PIPELINE.md` | Formatos, caminhos, convenção de nomes, como regerar a arte e como substituí-la |
| `docs/AUDITORIA-ASSETS.md` | Auditoria da entrega do colaborador (2026-10-16) e o estado após as correções (§9) |
| `docs/LICENCAS-ASSETS.md` | O que está comprovado sobre autoria e licença de cada grupo de assets |
| `docs/SOLICITACAO-COLABORADOR.md` | Pedido pronto para o colaborador de arte (licença, autoria, IA, correções) |
| `README.md` | Como rodar, controles, saves e o que ficou de fora |

---

## 6. Decisões importantes (e por quê)

### Escopo e produto
- **100% local, single player.** O online fica para a F4. O motor determinístico já deixa o caminho preparado.
- **Phaser só na batalha; o resto em DOM.** Telas de menu, loja e ficha são mais simples e acessíveis em HTML.
- **Jutsu só por condição de status (C12).** A escolha 1-de-3 do DD v2 oferecia jutsu; isso foi removido para manter o pilar "o investimento define o arsenal".
- **Sharingan como transformação genérica.** O mesmo mecanismo servirá para o Modo Sábio, a Bijuu e outras transformações. Ativá-lo não gasta o turno, para compensar o Uchiha, que rende menos na Onda.
- **Variação entre runs só pela escolha 1-de-3.** Os eventos entre encontros ficaram para depois.

### Correções ao design original (C1–C15, resumo)
- **C1:** a maestria entra como `(1 + 0,03·m)`. No DD v2 ela dava +100% de dano por nível.
- **C2:** todos os bônus de dano (título, clã, transformação, buff) somam num único termo.
- **C5:** os inimigos são gerados por código a partir de regras, e a elite é de grau D+.
- **C6:** o Haku ficou mais difícil que o Zabuza, com 2ª fase e mais HP.
- **C9:** presets de distribuição, porque builds espalhadas travam no Zabuza.
- **C13:** sob Ilusão, a única ação permitida é Kai.
- **C14:** os títulos impossíveis no MVP (Colecionador, Novo Chunin) ficam ocultos até a F2.
- As outras estão em `docs/ANALISE.md` §2.

### Balanceamento
- **Calibração por simulador.** Um robô joga milhares de runs com 8 builds e compara o resultado com as metas da spec (ex.: vence Zabuza em 45–75%, Haku dado Zabuza em 70–85%).
- **Valores que mudaram em relação ao DD v2:**
  - dano dos comuns (grau D): ×0,6 → ×0,65;
  - HP do Zabuza (grau C): ×1,3 → ×2,1;
  - dano do Zabuza: ×0,72 → ×0,81;
  - HP do Haku (grau B): ×1,3 → ×1,7.
- **Faixas por build (decisão do Gabriel, 2026-10-12).** Depois de 4 iterações, 8 métricas continuavam fora da meta por um motivo estrutural: a diferença entre Uchiha (mais fraco) e Uzumaki (mais forte) é maior que a largura das faixas. Por isso o `sim:check` passou a proteger contra **regressão** (cada build tem a sua faixa), e a distância até a meta de design continua impressa só como informação.

### Técnica
- **Save versionado com migração** e proteção contra *save-scum*: dentro da batalha não há save, e recarregar volta ao início do encontro com a mesma semente.
- **Documentos verificáveis.** O `docs:check` confere que os caminhos citados existem e que os números marcados nos documentos batem com `Balance.ts`.
- **Divergências DD v2 × código:** o código vale, e o DESIGN v3 registra cada uma.

---

## 7. Estado atual

**Pronto:**
- Run completa jogável de ponta a ponta nos 3 clãs, provada por teste e2e pela interface.
- Verificado em 2026-10-22: `npm test` com 413 testes passando em 39 arquivos; `npx tsc --noEmit` sem erro; `npm run build` concluído; `npm run docs:check` verde; `npm run visual` com "ok: 3 tamanhos" (1280 × 800, 1280 × 720 e 1024 × 768). O `sim:check` não foi rodado de novo nesta data (a versão 1.1 não mexe em `src/game/`).
- Arena com lutadores animados, efeitos por evento, cenário em camadas por inimigo e tela de carregamento; telas DOM com ícones SVG, fundos, fontes e favicon.
- Documentação: design v3, análise, curso, balanceamento e os documentos de arte (§5).

**Problemas conhecidos e decisões em aberto:**
1. **Distância entre builds.** O Uzumaki vence o Haku em ~95% das vezes em que derrota Zabuza (fácil demais), e o Uchiha vence o Zabuza em ~41–45% (no limite). As correções sugeridas são tirar os kits da escolha 1-de-3 ou reduzir a cura do kit (40% → 25–30%) e revisar a passiva do Uzumaki. **Adiado para depois de alguém jogar.**
2. **Simulador lento:** ~141 s para o relatório completo, contra uma meta de 30 s.
3. **Conferência manual no navegador:** o `npm run visual` roda o jogo num Chrome de verdade e tira screenshots, mas o roteiro manual de `docs/CONFERENCIA-VISUAL.md` não tem registro de execução (não verificado).
4. A build "Equilibrado" nunca vence o Zabuza (0%); falta decidir se ela deve ser viável.
5. O tempo de uma run não é medido (a meta é de 25 a 35 minutos).
6. Pequenas pendências cosméticas e de cobertura de testes estão em `docs/DECISOES-DE-EXECUCAO.md`.
7. **Licenças da arte:** a entrega do colaborador não declarou licença nem autoria; a origem dos 8 PNG de personagens e dos 20 ícones antigos não está registrada; a licença da arte gerada no repositório é decisão pendente do Gabriel (`docs/LICENCAS-ASSETS.md`). **Nada disso pode ir a público antes de resolver.**
8. Os problemas de arte da versão 1.1 estão na §8 (Patch notes 1.1, "Problemas conhecidos").

**Fora do Git (não rastreado) em 2026-10-22:** a pasta `sockeye/` (cópia antiga dos documentos do Plano 1), screenshots/ (saída do `npm run visual`), v_final.jpeg e os documentos de arte ainda não commitados (`docs/ARTE-PIPELINE.md`, `docs/ASSETS.md`, `docs/AUDITORIA-ASSETS.md`, `docs/LICENCAS-ASSETS.md`, `docs/SOLICITACAO-COLABORADOR.md`, este arquivo e o plano 4). O bloco `allowScripts` do `package.json` (scripts de instalação do `fsevents` e do `esbuild`) **já foi commitado**, junto com o commit `718db46`.

---

## 8. Patch notes

> O formato segue o curso em `docs/curso/`: cada versão corresponde a commits reais (`git show <sha>`). Datas: spec e Plano 1 em 2026-10-04; implementação em 2026-10-12; fechamento em 2026-10-13; arte e interface de 2026-10-16 a 2026-10-22.

### v0.0 — Planejamento (2026-10-04)
- **Adicionado:** Documento de Design v2, a spec do MVP com as correções C1–C15 e o Plano 1 (motor e simulador).

### Alfa 0.1 — Projeto e RNG com semente
- **Adicionado:** estrutura do projeto (Vite + TS) e `Rng` determinístico com estado serializável.

### Alfa 0.2 — Tipos, constantes e fórmulas
- **Adicionado:** tipos de domínio, `Balance.ts` (fonte única dos números) e fórmulas de HP, chakra, dano, esquiva, crítico e XP.

### Alfa 0.3 — Dados do jogo
- **Adicionado:** jutsus, clãs, itens, inimigos, a Saga da Onda e os títulos, validados com Zod.

### Alfa 0.4 — Personagem e progressão
- **Adicionado:** níveis, distribuição de pontos, maestria, custo de chakra e desbloqueio de jutsu por status.

### Alfa 0.5 — Efeitos e resolução de golpe
- **Adicionado:** sistema genérico de efeitos (buff, debuff, controle, Tenacidade, transformação), resolução de golpe com esquiva, crítico, elemento e cargas.

### Alfa 0.6 — Batalha e IA
- **Adicionado:** batalha por turnos com todas as ações, transformação livre, controle e Kai; IA dos inimigos comuns, de Zabuza e de Haku (com 2ª fase); geração de inimigos por nível da história.

### Alfa 0.7 — Loja, run e meta
- **Adicionado:** loja com estoque sorteado, equipamento e Pergaminho Raro; rastreador de estatísticas por eventos; ciclo da run (mapa, elites, Acampamento, recompensas, 1-de-3); histórico, títulos e enciclopédia.

### Alfa 0.8 — Save e simulador
- **Adicionado:** save versionado com migração, backup de save inválido e proteção anti *save-scum*; simulador headless com o robô e as metas automatizadas.
- **Alterado:** primeira calibração do balanceamento (graus C e B mais resistentes, dano dos comuns ajustado).
- **Corrigido:** a leitura do save nunca lança; o robô não entra mais em "espiral de defesa"; fechamento de run idempotente.

### Beta 0.9.0 — Casca da interface e GameStore
- **Adicionado:** app com Vite + Phaser + i18n pt-BR; formatação do log de batalha; presets e valores derivados de tela (Poder Ninja, prévias, HUD); `GameStore` com boot, navegação, persistência, fim de run e trava de animação.

### Beta 0.9.1 — Telas
- **Adicionado:** menu, tela de erro, criação com presets e prévia, mapa da saga, tela de resultado com 1-de-3, fim de run, Preparação (loja, jutsus, equipamento, atributos), Ficha com gráfico radar, troca de jutsu, Enciclopédia, Histórico e Títulos.
- **Corrigido:** motivo visível no botão "Começar"; textos movidos para o i18n; marcadores textuais (não só cor) para acessibilidade; o histórico tolera runs malformadas.

### Beta 0.9.2 — Batalha em Phaser
- **Adicionado:** batalha com HUD em DOM, atalhos de teclado (1–4, Enter, A, D, M, I, T, Esc) e animações em Phaser.
- **Corrigido:** os atalhos respeitam o estado dos botões e ignoram tecla segurada.

### 1.0 — Robustez, calibração e entrega (2026-10-12 a 13)
- **Adicionado:**
  - teste e2e de uma run completa pela interface nos 3 clãs, com vitória provada em cada um;
  - verificador de documentos (`docs:check`);
  - faixas de regressão por build no `sim:check`;
  - documentação final: `ANALISE.md`, o curso (12 versões), o `DESIGN.md` v3, o roteiro de conferência visual, o README final e o arquivo de decisões de execução.
- **Alterado:** `happy-dom` (21.0.1) e `vitest` (5.0.4) atualizados por alertas de segurança (só em devDependencies); `engines: node >= 22` no `package.json`.
- **Corrigido:**
  - erro de render ou de animação não trava mais o jogo, e a tela de erro não é sobrescrita pela batalha;
  - a navegação respeita a trava de animação;
  - log com "1 turno" no singular;
  - o verificador não confunde "todo" (pt-BR) nem "deveria definir" com marcadores de pendência.
- **Problemas conhecidos:** distância entre builds (Uzumaki forte, Uchiha no limite), simulador lento e jogo ainda não conferido num navegador real.

### 1.1 — Arte e interface (2026-10-22)
> Trabalho de 2026-10-16 a 2026-10-22. Commits `61352a2`, `dd57ef5`, `184aab4`, `718db46`, `9ea2c67`, `1950f3d` e `7199a61`. O `package.json` continua em `"version": "0.0.1"`; "1.1" é o nome desta etapa no histórico, não a versão do pacote.

- **Adicionado:**
  - tooltip nos atributos da Criação, da Preparação e da Ficha (`61352a2`);
  - integração da entrega do colaborador: ícones SVG por tipo (jutsu, item, atributo, ações da batalha, recompensas), 9 fundos de tela, fontes Cabin ("NTX Titulo" e "NTX Texto") e favicon; `tools/prepare-assets.py` copia e saneia os SVG, copia WebP e WOFF2 e gera public/assets/manifest.json (`dd57ef5`);
  - entrega reorganizada em assets/{icones, ui, cenarios/tela, fontes, identidade}, com `_referencia/` (previews, guia, inventário, duplicatas, PNG rasterizados) e `_quarentena/retratos` fora do Git (`184aab4`);
  - `npm run visual` (`tools/visual.mjs`): screenshots em 1280 × 800, 1280 × 720 e 1024 × 768 e falha com erro de Console, requisição quebrada, rolagem horizontal ou HUD cobrindo os lutadores (`718db46`);
  - ícones redesenhados por `tools/gen-icons.py`: de 73 para 174 desenhos diferentes nos 194 ícones; Meditar e Ninjutsu novos; os 7 graus com forma própria e letra em `<path>`; `tests/icons.test.ts` (`9ea2c67`);
  - arte gerada por código em `tools/art/` (`npm run art:build`, determinística, só Pillow e numpy): 8 lutadores com quadros reais (`idle` 6, `attack` 7, `cast` 7, `hit` 4, `death` 7, `dodge` 4; atlas JSON Array com `meta.animations` e `meta.anchor`), 48 VFX, 5 cenários em 3 camadas + overlays de névoa e espelhos de gelo, tela de carregamento 1920 × 1080 e 8 retratos de desenho próprio (`1950f3d`);
  - arena com folha animada (cai na imagem estática se faltar), pés ancorados no chão, VFX por evento (`src/scenes/vfx.ts`), cenário em camadas por inimigo (`battleSceneFor`), aura animada do Sharingan e tela de carregamento (`#splash`) que sai quando o Phaser termina de carregar; testes `tests/sprites.test.ts`, `tests/sprite-anims.test.ts` e `tests/vfx.test.ts` (`1950f3d`, `7199a61`).
- **Alterado:**
  - durações da fila de animação: `actionChosen` 250 → 450 ms, `jutsuUsed` 350 → 600, `damage` 450 → 500, `defeated` 600 → 800 (`src/scenes/animationQueue.ts`, `7199a61`);
  - lutador estático na arena com 240 px de altura (antes 280) e linha dos lutadores mais alta (`FIGHTER_Y` 370 → 345); véu escuro sobre os fundos de tela reduzido de 72% para 22% (fundos mais claros), com placas locais atrás dos títulos (`718db46`);
  - `package.json`: scripts `visual` e `art:build`, devDependency `playwright-core` e o bloco `allowScripts`.
- **Corrigido:**
  - HUD da batalha compacto: a descrição do jutsu vai para uma faixa baixa e os painéis laterais encolheram, sem cobrir os lutadores (validado pelo `npm run visual` nos 3 tamanhos);
  - ícones maiores; radar da Ficha sem rótulos cortados;
  - os 4 retratos da entrega com risco de PI ficaram fora do jogo, do build e do histórico do Git.
- **Problemas conhecidos:**
  - a licença da entrega e da arte gerada não está declarada (`docs/LICENCAS-ASSETS.md`); pedido ao colaborador em `docs/SOLICITACAO-COLABORADOR.md`;
  - estilo dos lutadores gerados: boneco chibi *flat*, bem mais simples que as ilustrações PNG de assets/personagens/;
  - os retratos originais não estão ligados a nenhuma tela (Criação e Mapa ainda mostram os PNG de origem não registrada);
  - ícones fracos a 28 px (avaliação visual da sessão, sem teste): `mushi_bunshin`, `naruto_rendan`, `kagenui`, `kage_kubishibari`, `kirigakure`, `scroll_<atributo>`, `ui/radar` e os títulos por elemento;
  - não feitos: animações opcionais (`throw`, `defend`, `meditate`, `victory`, extras de chefe), olho do Sharingan sobreposto, retrato com Sharingan, banners de texto, números flutuantes desenhados, cartões de clã, fundos de tela diferentes entre si;
  - a animação `dodge` existe na folha mas não é tocada; 7 VFX gerados não têm evento; as peças de UI da entrega (HUD, mapa, banners, 9-slice) estão publicadas mas sem uso;
  - `npm run visual` não tem modo para o dist/ e depende do Google Chrome instalado.

---

## 9. Próximos passos sugeridos
1. **Licenças da arte** (bloqueia publicar): enviar `docs/SOLICITACAO-COLABORADOR.md`, informar a origem dos 8 PNG de personagens e dos 20 ícones antigos e decidir a licença da arte gerada (`docs/LICENCAS-ASSETS.md`).
2. **Jogar no navegador** seguindo `docs/CONFERENCIA-VISUAL.md`, com as screenshots do `npm run visual` à mão, e anotar os problemas visuais e de sensação.
3. **Decidir o estilo dos lutadores** (`docs/ARTE-PIPELINE.md` §8): refinar o boneco procedural ou substituir por arte manual mantendo o formato do atlas.
4. **Fechar as pontas da arte:** ligar os retratos originais às telas, tocar a `dodge`, dar evento aos 7 VFX sem uso, redesenhar os ícones fracos a 28 px.
5. **Decidir o balanceamento** com base no que for jogado: kits na 1-de-3, cura do kit, passiva do Uzumaki.
6. **Revisão final do branch** (Task 12 do plano 4) e **integração**: merge ou PR de `feat/mvp` para `main`, depois de decidir o destino de `sockeye/`, screenshots/ (pôr no `.gitignore`?) e v_final.jpeg.
7. Opcional: acelerar o simulador e resolver as pendências menores. Depois, planejar a **F2** (Exame Chunin).

---

## 10. Guia rápido para a IA que for ajudar

- **Idioma:** conversar e escrever documentos em **pt-BR**.
- **Antes de mudar regra ou número:** os números de balanceamento ficam em `src/game/Balance.ts` e o conteúdo em `src/data/`. Depois de mudar, rode `npm test`, `npm run sim:check` e `npm run docs:check`.
- **Nunca** use `Math.random`, `Date`, DOM ou Phaser dentro de `src/game/`; o motor precisa continuar puro e determinístico.
- **A UI não altera o estado diretamente:** tudo passa pelo `GameStore`, que chama o motor.
- **Textos de interface** vão para `src/i18n/pt-BR.ts`, nunca literais nas telas.
- **Fonte da verdade, em ordem:** código > `docs/DESIGN.md` (v3) > spec do MVP > DD v2.
- **Jutsus nunca são dados** por loja, recompensa ou evento; só por condição de status (C12).
- **Arte:** nunca arte oficial nem símbolos oficiais. Arte nova entra com os nomes e o formato de `docs/ARTE-PIPELINE.md` (§2.2 e §10.3) e com autoria e licença registradas em `docs/LICENCAS-ASSETS.md`. Não rode `npm run art:build` por cima de arte substituída à mão.
- O projeto foi construído com planos escritos (`docs/superpowers/plans/`) e execução por tarefas com revisão. Mudanças grandes devem seguir o mesmo fluxo: spec → plano → execução com testes.
