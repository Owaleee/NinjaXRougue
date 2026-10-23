# Conferência visual no navegador

Até aqui o jogo foi verificado por testes automatizados (motor, interface em happy-dom, uma run completa pela interface com os três clãs), por `npm run build` e por requisições HTTP ao servidor de desenvolvimento. Ninguém abriu o jogo num navegador de verdade. Este roteiro é para você fazer isso uma vez, em ordem, e anotar o que encontrar.

## Como abrir

1. `npm install`
2. `npm run dev`
3. Abra no navegador a URL que o Vite imprime no terminal (normalmente `http://localhost:5173`).
4. Use uma janela com **pelo menos 1024 px de largura** (o layout é só desktop). Abra o DevTools (Console) para ver erros, mas não é preciso mexer nele.

## Roteiro

Cada item diz o que deve acontecer. Se algo for diferente, anote (veja "O que anotar").

1. **Criação.** Menu → Nova Saga → escolha Uchiha, preset Ninjutsu. Com o nome vazio ou com pontos sobrando, o botão "Começar" fica desativado e o motivo aparece em texto ao lado. Preencha o nome e distribua todos os pontos: o botão libera.
2. **Primeira entrada numa batalha.** O canvas aparece com o tamanho certo. O Phaser é criado escondido e o `ScaleManager` recalcula depois de acordar; pode piscar por até uns 500 ms. Anote se o canvas ficar com o tamanho errado ou em branco.
3. **Painel sobre a arena, em 1024×768.** Os painéis de HP e chakra e a barra de ações não cobrem os lutadores. HP e chakra aparecem como números (`x/y`), não só como barras.
4. **Atalhos.** `1`–`4` seleciona o jutsu (mostra a descrição) e `Enter` usa; `A`, `D`, `M`, `I` e `T` agem direto. Apertar `A` três vezes rápido faz uma ação só. Segurar uma tecla não repete a ação.
5. **Transformar (Uchiha).** `T` liga o Sharingan sem gastar o turno: aparecem a aura e o contorno, e o painel mostra o efeito em texto. Apertar `T` de novo no mesmo turno é ignorado, sem aviso de erro.
6. **Morrer de propósito.** Deixe o personagem morrer. A animação termina, a tela de Fim de run aparece e o Histórico mostra a run. Repita e **recarregue a aba durante a animação da morte**: a run já deve estar no Histórico e o save da run apagado.
7. **Subir de nível com vários jutsus novos.** Quando um encontro dá mais de um nível, a tela de troca de jutsu aparece e as escolhas 1-de-3 continuam na ordem, uma por nível ganho.
8. **Só teclado (Tab e Enter) na Criação e na Preparação.** Anote em que ponto o foco some depois de um clique (a tela é redesenhada a cada mudança e o foco volta ao início).
9. **`localStorage` bloqueado ou cheio.** No Safari em modo privado (ou bloqueando dados do site), o jogo abre e aparece o aviso "Não foi possível salvar"; a run segue em memória.
10. **Nome com HTML.** Crie um personagem chamado `<b>x</b>`. Ele aparece como texto literal na Ficha e no Histórico, sem negrito e sem elemento novo.

## O que anotar

Para cada coisa errada, uma linha com: o número do item do roteiro, a tela em que estava, o que apareceu e o que você esperava, e qualquer mensagem do Console. Se o jogo travar (nada responde), anote o último passo e recarregue com F5: a run deve voltar do último save.
