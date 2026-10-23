/**
 * Conferência visual reproduzível: sobe o jogo (Vite), percorre as telas em
 * três tamanhos de janela, tira screenshots e falha se houver erro no Console,
 * requisição quebrada (arte ausente), rolagem horizontal ou HUD da batalha
 * cobrindo os lutadores.
 *   npm run visual [-- --out screenshots] [--chrome /caminho/do/chrome]
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const OUT = arg('out', 'screenshots');
const CHROME = arg('chrome', process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const PORT = 5199;
const SIZES = [
  [1280, 800],
  [1280, 720],
  [1024, 768],
];
mkdirSync(OUT, { recursive: true });

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const stop = () => vite.kill();
process.on('exit', stop);
const base = `http://localhost:${PORT}`;
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 250));
}

const browser = await chromium.launch({ executablePath: CHROME });
const problems = [];
for (const [w, h] of SIZES) {
  const tag = `${w}x${h}`;
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  p.on('console', (m) => m.type() === 'error' && problems.push(`${tag} console: ${m.text()}`));
  p.on('pageerror', (e) => problems.push(`${tag} erro: ${e}`));
  p.on('requestfailed', (r) => problems.push(`${tag} requisição falhou: ${r.url()}`));
  p.on('response', (r) => r.status() >= 400 && problems.push(`${tag} HTTP ${r.status()}: ${r.url()}`));
  const shot = async (name) => {
    await p.waitForTimeout(350);
    await p.screenshot({ path: `${OUT}/${name}-${tag}.png` });
    const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (sw > 0) problems.push(`${tag} ${name}: rolagem horizontal de ${sw}px`);
  };
  await p.goto(base);
  await shot('01-menu');
  await p.getByRole('button', { name: /Modo História/ }).click();
  await shot('02-criacao');
  await p.getByRole('button', { name: 'Uchiha' }).click();
  await p.getByRole('button', { name: 'Ninjutsu', exact: true }).first().click();
  await p.locator('input[name=name]').fill('Gabriel');
  await p.locator('.has-tip').nth(2).hover();
  await shot('03-criacao-tooltip');
  await p.getByRole('button', { name: /Começar/ }).click();
  await shot('04-mapa');
  await p.getByRole('button', { name: /Preparação/ }).click();
  await shot('05-preparacao');
  await p.getByRole('button', { name: /Voltar/ }).click();
  await p.getByRole('button', { name: /Ficha/ }).click();
  await p.locator('[data-tab=atributos]').click();
  await p.locator('.has-tip').nth(4).hover();
  await shot('06-ficha-atributos');
  await p.getByRole('button', { name: /Voltar/ }).click();
  await p.getByRole('button', { name: 'Lutar' }).click();
  await p.waitForTimeout(2500);
  await shot('07-batalha');
  await p.keyboard.press('3');
  await shot('08-batalha-jutsu');
  const m = await p.evaluate(() => {
    const c = document.querySelector('canvas').getBoundingClientRect();
    const bottom = document.querySelector('.battle-bottom').getBoundingClientRect();
    const top = document.querySelector('.fighters').getBoundingClientRect();
    // Sprites de 240 px centrados em y = 345 da arena lógica de 720 (BattleScene): pés em 465, nome em ~185.
    return { feet: c.top + (c.height * 465) / 720, bottomTop: bottom.top, head: c.top + (c.height * 185) / 720, topBottom: top.bottom };
  });
  if (m.bottomTop < m.feet) problems.push(`${tag} batalha: painel inferior (y=${Math.round(m.bottomTop)}) cobre os lutadores (pés em y=${Math.round(m.feet)})`);
  if (m.topBottom > m.head) problems.push(`${tag} batalha: painéis de cima (até y=${Math.round(m.topBottom)}) cobrem as cabeças (y=${Math.round(m.head)})`);
  // Golpes em andamento: confere sprite animado e efeito (screenshots no meio da animação).
  await p.keyboard.press('Escape');
  await p.keyboard.press('a');
  await p.waitForTimeout(380);
  await shot('09-batalha-ataque');
  await p.getByText('Seu turno').waitFor({ timeout: 8000 });
  await p.keyboard.press('1');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(450);
  await shot('10-batalha-jutsu-em-uso');
  await p.close();
}
await browser.close();
stop();
if (problems.length) {
  console.error(`\n${problems.length} problema(s):\n- ${[...new Set(problems)].join('\n- ')}`);
  process.exit(1);
}
console.log(`ok: ${SIZES.length} tamanhos, screenshots em ${OUT}/`);
