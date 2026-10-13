# Registro de balanceamento

Cada linha = UMA mudança em `src/game/Balance.ts`, seguida de `npm run sim:check` (1000 runs/build).
Metas (spec §12): HP fim comum 75–85% · rodadas comum 2–4 · chega a Zabuza ≥ 95% · vence Zabuza 45–75% · completa 35–70% · Haku dado Zabuza 70–85% · maestria do jutsu principal +2 a +4.
As metas valem só para as 6 builds focadas (Ninjutsu/Taijutsu × Uchiha/Uzumaki/Sem clã); Semi-equilibrado e Equilibrado são referência.

## Medição inicial (sem mudanças)

Commit 6b09742, `npm run sim:check`, tempo total 44,3 s.

```
| Build | Runs | Chega a Zabuza | Vence Zabuza | Completa | Haku dado Zabuza | Rodadas Z/H/comum | HP fim comum | Maestria do jutsu principal |
|---|---|---|---|---|---|---|---|---|
| Ninjutsu / Uchiha | 1000 | 100% | 97% | 82% | 85% | 6.8 / 8.9 / 2.5 | 86% | +2.7 |
| Ninjutsu / Uzumaki | 1000 | 99% | 98% | 96% | 98% | 6.7 / 8.5 / 2.6 | 84% | +3.1 |
| Ninjutsu / Sem clã | 1000 | 100% | 98% | 92% | 94% | 7.2 / 8.3 / 2.6 | 83% | +4.0 |
| Taijutsu / Uchiha | 1000 | 100% | 98% | 84% | 86% | 5.8 / 9.2 / 2.4 | 87% | +4.4 |
| Taijutsu / Uzumaki | 1000 | 100% | 99% | 95% | 97% | 6.8 / 9.6 / 3.0 | 82% | +5.0 |
| Taijutsu / Sem clã | 1000 | 99% | 95% | 86% | 90% | 7.2 / 9.9 / 3.0 | 80% | +4.9 |
| Semi-equilibrado / Uzumaki | 1000 | 97% | 96% | 90% | 94% | 7.4 / 10.7 / 3.3 | 76% | +3.9 |
| Equilibrado / Sem clã | 1000 | 93% | 39% | 15% | 38% | 11.1 / 12.1 / 4.0 | 59% | +4.3 |

Tempo: 44.3 s (1000 runs × 8 builds)

23 meta(s) fora da faixa:
- Ninjutsu / Uchiha: hpEndCommon = 0.863 (meta 0.75–0.85)
- Ninjutsu / Uchiha: beatZabuza = 0.967 (meta 0.45–0.75)
- Ninjutsu / Uchiha: completed = 0.818 (meta 0.35–0.7)
- Ninjutsu / Uzumaki: beatZabuza = 0.982 (meta 0.45–0.75)
- Ninjutsu / Uzumaki: completed = 0.959 (meta 0.35–0.7)
- Ninjutsu / Uzumaki: hakuGivenZabuza = 0.977 (meta 0.7–0.85)
- Ninjutsu / Sem clã: beatZabuza = 0.975 (meta 0.45–0.75)
- Ninjutsu / Sem clã: completed = 0.916 (meta 0.35–0.7)
- Ninjutsu / Sem clã: hakuGivenZabuza = 0.939 (meta 0.7–0.85)
- Ninjutsu / Sem clã: mainJutsuMastery = 4.001 (meta 2–4)
- Taijutsu / Uchiha: hpEndCommon = 0.872 (meta 0.75–0.85)
- Taijutsu / Uchiha: beatZabuza = 0.977 (meta 0.45–0.75)
- Taijutsu / Uchiha: completed = 0.840 (meta 0.35–0.7)
- Taijutsu / Uchiha: hakuGivenZabuza = 0.860 (meta 0.7–0.85)
- Taijutsu / Uchiha: mainJutsuMastery = 4.443 (meta 2–4)
- Taijutsu / Uzumaki: beatZabuza = 0.986 (meta 0.45–0.75)
- Taijutsu / Uzumaki: completed = 0.952 (meta 0.35–0.7)
- Taijutsu / Uzumaki: hakuGivenZabuza = 0.966 (meta 0.7–0.85)
- Taijutsu / Uzumaki: mainJutsuMastery = 4.967 (meta 2–4)
- Taijutsu / Sem clã: beatZabuza = 0.954 (meta 0.45–0.75)
- Taijutsu / Sem clã: completed = 0.862 (meta 0.35–0.7)
- Taijutsu / Sem clã: hakuGivenZabuza = 0.904 (meta 0.7–0.85)
- Taijutsu / Sem clã: mainJutsuMastery = 4.910 (meta 2–4)
```

## Iterações

Passos em múltiplos do passo indicado no brief (decisão do controlador). Antes de cada iteração houve sondagens não registradas (ver seção seguinte).

| # | Mudança (constante: antes → depois) | Metas fora após a mudança | Observação |
|---|---|---|---|
| 1 | `enemyGrades.D.damageMult`: 0,6 → 0,65 (+1 passo) | 21 | Botão 1. HP fim comum de Nin/Uchiha entra (85%); Tai/Uchiha cai só de 87% para 86%. O passo seguinte (0,7) ou `D.hpMult` 0,85 colocariam Tai/Uchiha na faixa, mas derrubavam "chega a Zabuza" para 89–94% em Uzumaki/Sem clã (sondagens); trade-off: ficamos com 0,65. |
| 2 | `enemyGrades.C.hpMult`: 1,3 → 2,1 (+16 passos) | 10 | Botão 2. Vence Zabuza cai de 93–98% para 67–87%; Uzumaki continua acima de 75%. Efeito do HP é fraco até ~1,6 e forte depois. Tai/Uchiha entra na faixa de HP fim comum (85%). |
| 3 | `enemyGrades.C.damageMult`: 0,72 → 0,81 (+3 passos) | 9 | Botão 2. Vence Zabuza 45–74% (Nin/Uchiha 44,7%, no limite). A diferença entre a build mais fraca (Nin/Uchiha) e a mais forte (Tai/Uzumaki) fica em ~30 pontos, igual à largura da faixa: nenhum valor coloca todas dentro com folga. Completa entra na faixa em quase todas. |
| 4 | `enemyGrades.B.hpMult`: 1,5 → 1,7 (+2 passos) | 8 | Botão 3. Haku dado Zabuza: Tai/Sem clã 86% → 83% (entra); Uchiha 80–82% → 75–76%. Builds de Ninjutsu quase não reagem ao HP do Haku (Nin/Uzumaki 95%, Nin/Sem clã 92%); trade-off: Nin/Uchiha "completa" cai para 33,8%. |

Parei em 4 iterações registradas (limite 8): nas sondagens, todos os botões restantes pioraram ou mantiveram a contagem (ver abaixo). As metas que sobram vêm da distância entre builds, maior que a largura das faixas, e não de um nível geral de dificuldade.

### Sondagens não registradas (estado após cada iteração, só uma constante diferente)

| Estado base | Constante sondada | Runs | Resultado |
|---|---|---|---|
| após #0 | `D.damageMult` 0,7 | 200 | Tai/Uchiha HP fim 85%, mas chega a Zabuza 89% (Nin/Uzumaki, Tai/Sem clã). Rejeitado. |
| após #1 | `D.hpMult` 0,85 / 0,9 | 200 | HP fim todas 75–82%, mas chega a Zabuza 86–94% em 3 builds. Rejeitado. |
| após #1 | `C.hpMult` 1,6 / 2,3 / 2,4 / 2,5 | 200 | Vence Zabuza 87–95% / 51–84% / 46–81% / 41–74%. |
| após #1 | `C.hpMult`+`C.damageMult` (2,0/0,81; 2,2/0,78; 2,1/0,81; 2,1/0,78) | 200 | Spread entre builds sempre ~30 pontos. Escolhido 2,1 / 0,81. |
| após #2 | `C.damageMult` 0,78 | 1000 | Vence Zabuza 52–79% (Uzumaki acima). Escolhido 0,81. |
| após #3 | `B.hpMult` 1,8 | 1000 | Uchiha Haku 71–74%, Nin/Uzumaki 95%: Ninjutsu insensível ao HP do Haku. |
| após #3 | `B.damageMult` 0,89 | 1000 | Uchiha Haku 63–65% (fora), Uzumaki 88–89% (fora), completa Uchiha 29–31%. Pior. |
| após #3 | `B.hpMult` 1,7 + `B.damageMult` 0,83 | 1000 | Uchiha 65–66% (fora), Uzumaki 91–93% (fora). Pior. |
| após #4 | `mastery.stepUses` ×1,1 → [7, 10, 13, 17, 20] | 1000 | 8 metas: Tai/Uzumaki 4,33 (fora), Nin/Uchiha cai para 1,98 (fora) e vence Zabuza 43,6%. Sem ganho. |
| após #4 | `mastery.stepUses` ×1,21 → [7, 11, 15, 18, 22] | 1000 | 9 metas (Nin/Uchiha maestria 1,7). Pior. |
| após #4 | `D.damageMult` 0,6 (volta) | 1000 | 10 metas (Tai/Uchiha HP fim 85,7%, Tai/Uzumaki vence 75,2%). Pior. |
| após #4 | `B.hpMult` 1,6 | 1000 | 9 metas (Tai/Sem clã Haku 85,4%). Pior. |

### Medição após a iteração 4 (`npm run sim:check`, 33,3 s)

```
| Build | Runs | Chega a Zabuza | Vence Zabuza | Completa | Haku dado Zabuza | Rodadas Z/H/comum | HP fim comum | Maestria do jutsu principal |
|---|---|---|---|---|---|---|---|---|
| Ninjutsu / Uchiha | 1000 | 100% | 45% | 34% | 76% | 10.7 / 9.7 / 2.6 | 82% | +2.3 |
| Ninjutsu / Uzumaki | 1000 | 97% | 71% | 68% | 95% | 11.2 / 9.4 / 2.7 | 80% | +3.1 |
| Ninjutsu / Sem clã | 1000 | 98% | 49% | 45% | 92% | 11.4 / 8.8 / 2.8 | 77% | +3.6 |
| Taijutsu / Uchiha | 1000 | 100% | 50% | 37% | 75% | 9.4 / 9.9 / 2.5 | 84% | +3.5 |
| Taijutsu / Uzumaki | 1000 | 99% | 74% | 69% | 94% | 11.3 / 10.3 / 3.0 | 78% | +4.4 |
| Taijutsu / Sem clã | 1000 | 97% | 47% | 39% | 83% | 11.4 / 10.7 / 3.0 | 75% | +4.0 |
| Semi-equilibrado / Uzumaki | 1000 | 92% | 45% | 34% | 75% | 12.1 / 12.8 / 3.5 | 69% | +3.4 |
| Equilibrado / Sem clã | 1000 | 75% | 0% | 0% | 0% | 9.7 / 0.0 / 4.1 | 49% | +3.5 |

Tempo: 33.3 s (1000 runs × 8 builds)

8 meta(s) fora da faixa:
- Ninjutsu / Uchiha: beatZabuza = 0.447 (meta 0.45–0.75)
- Ninjutsu / Uchiha: completed = 0.338 (meta 0.35–0.7)
- Ninjutsu / Uzumaki: hakuGivenZabuza = 0.954 (meta 0.7–0.85)
- Ninjutsu / Sem clã: hakuGivenZabuza = 0.924 (meta 0.7–0.85)
- Taijutsu / Uzumaki: hakuGivenZabuza = 0.939 (meta 0.7–0.85)
- Taijutsu / Uzumaki: mainJutsuMastery = 4.448 (meta 2–4)
- Taijutsu / Sem clã: hpEndCommon = 0.745 (meta 0.75–0.85)
- Taijutsu / Sem clã: mainJutsuMastery = 4.040 (meta 2–4)
```

### Metas que continuam fora e recomendação

- **Haku dado Zabuza alto em Nin/Uzumaki (95%), Nin/Sem clã (92%), Tai/Uzumaki (94%).** O HP do Haku pesa pouco no Ninjutsu, e o dano do Haku derruba o Uchiha antes de baixar o Uzumaki. Os botões de grau B mexem em todas as builds juntas; a distância entre elas (~20 pontos) é maior que a faixa (15).
- **Nin/Uchiha no limite inferior (vence Zabuza 44,7%, completa 33,8%).** É a build mais fraca contra chefes; qualquer endurecimento de C/B a tira da faixa primeiro.
- **Maestria do jutsu principal acima de +4 em Tai/Uzumaki (4,45) e Tai/Sem clã (4,04).** O Taijutsu usa um único golpe o tempo todo e o Ninjutsu distribui os usos; com ×1,1, Nin/Uchiha cai abaixo de +2. A diferença entre builds (~2,1) supera a faixa (2).
- **HP fim comum de Tai/Sem clã 74,5%.** Diferença entre Uchiha (84%) e Tai/Sem clã (~75%) no limite da faixa de 10 pontos.

Recomendação (decisões de design, fora dos botões): (1) tirar consumíveis da escolha 1-de-3 ou reduzir a cura do kit (40% → 25–30%); isso derruba o acesso a cura, que é o que mais infla Uzumaki/Sem clã contra chefes; (2) revisar a passiva do Uzumaki (HP/regeneração), que separa essa build das demais em 20–30 pontos; (3) aceitar faixas por build, ou medir maestria pelos dois jutsus mais usados, já que o Taijutsu concentra os usos num golpe só. A Equilibrado/Sem clã nunca vence Zabuza (0%) com os valores atuais; não é build focada, mas vale olhar se ela deve ser viável.

## Resultado final (3000 runs/build)

`npm run sim`:

```
| Build | Runs | Chega a Zabuza | Vence Zabuza | Completa | Haku dado Zabuza | Rodadas Z/H/comum | HP fim comum | Maestria do jutsu principal |
|---|---|---|---|---|---|---|---|---|
| Ninjutsu / Uchiha | 3000 | 100% | 41% | 31% | 75% | 10.4 / 9.7 / 2.6 | 82% | +2.3 |
| Ninjutsu / Uzumaki | 3000 | 97% | 73% | 69% | 95% | 11.3 / 9.5 / 2.7 | 80% | +3.1 |
| Ninjutsu / Sem clã | 3000 | 98% | 49% | 44% | 91% | 11.3 / 8.9 / 2.8 | 77% | +3.6 |
| Taijutsu / Uchiha | 3000 | 100% | 51% | 38% | 75% | 9.6 / 10.0 / 2.5 | 84% | +3.5 |
| Taijutsu / Uzumaki | 3000 | 99% | 73% | 69% | 94% | 11.3 / 10.4 / 3.0 | 78% | +4.4 |
| Taijutsu / Sem clã | 3000 | 96% | 45% | 38% | 83% | 11.3 / 10.8 / 3.0 | 74% | +4.0 |
| Semi-equilibrado / Uzumaki | 3000 | 92% | 45% | 35% | 78% | 12.1 / 12.7 / 3.5 | 69% | +3.4 |
| Equilibrado / Sem clã | 3000 | 77% | 0% | 0% | 0% | 9.8 / 0.0 / 4.1 | 49% | +3.6 |

Tempo: 141.1 s (3000 runs × 8 builds)
```

**Problema conhecido:** o relatório de 3000 runs/build levou 141,1 s, acima do limite de 30 s. O `sim:check` (1000 runs) leva 33–45 s. A otimização fica para o Plano 2, se necessário.

Com 3000 runs, Nin/Uchiha vence Zabuza em 41% e completa 31%, abaixo da medição de 1000 runs: o limite inferior não tem folga.

## Decisão: faixas por build (Plano 3, 2026-10-12)

A spec §13 pede `sim:check` verde para o MVP estar pronto. Depois de 4 iterações de calibração, 8 metas seguiam fora da faixa por uma razão estrutural: a distância entre a build mais fraca (Uchiha) e a mais forte (Uzumaki) é maior que a largura das faixas da spec §12, e os botões de calibração de grau movem todas as builds juntas. O usuário escolheu **faixas por build**: as metas de design da spec continuam impressas como "distância" (`designGaps`), e `sim:check` passa a proteger contra **regressão**: cada build que mede fora da meta ganha uma faixa própria em `src/game/sim/report.ts` (`BUILD_BANDS`), nunca mais estreita que a meta. Nenhum valor de `Balance.ts` mudou.

| Build | Métrica | Medido (1000 runs) | Meta de design | Faixa da build |
|---|---|---|---|---|
| Ninjutsu / Uchiha | vence Zabuza | 44,7% | 45–75% | 40–75% |
| Ninjutsu / Uchiha | completa a saga | 33,8% | 35–70% | 30–70% |
| Ninjutsu / Uzumaki | Haku dado Zabuza | 95,4% | 70–85% | 70–97% |
| Ninjutsu / Sem clã | Haku dado Zabuza | 92,4% | 70–85% | 70–95% |
| Taijutsu / Uzumaki | Haku dado Zabuza | 93,9% | 70–85% | 70–97% |
| Taijutsu / Uzumaki | maestria do jutsu principal | +4,45 | +2 a +4 | +2 a +4,6 |
| Taijutsu / Sem clã | HP no fim dos comuns | 74,5% | 75–85% | 72–85% |
| Taijutsu / Sem clã | maestria do jutsu principal | +4,04 | +2 a +4 | +2 a +4,2 |

**O que isso NÃO resolve:** o jogo continua mais fácil para Uzumaki (Haku quase sempre cai) e no limite para Uchiha (vence Zabuza em ~41% com 3000 runs). Decisões de design que fechariam a diferença de verdade (fora dos botões): tirar kits da escolha 1-de-3 ou reduzir a cura do kit (40% para 25–30%), e revisar a passiva do Uzumaki. Ficam para depois de o usuário jogar.

## Fechamento do MVP (Plano 3)

`sim:check` verde com faixas por build; as metas de design continuam como distância impressa. O que fica em aberto é decisão de design, não de calibração: tirar kits da escolha 1-de-3 ou reduzir a cura do kit, e revisar a passiva do Uzumaki. Reavaliar depois de o usuário jogar (ver `docs/CONFERENCIA-VISUAL.md`).
