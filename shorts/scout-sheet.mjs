// Planche de personnage de Scout : node shorts/scout-sheet.mjs → out/shorts/scout-sheet.png
import { chromium } from 'playwright-core'
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
import { scoutSvg } from './scout.mjs'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const A = (f) => 'file://' + path.join(ROOT, 'assets', f)
const mark = A('mark-white.svg')
const poses = [
  ['Neutre', { expr: 'neutral', loupe: 'hold' }],
  ['Explique · 2', { expr: 'explain', count: 2, loupe: 'hold', mouth: .6 }],
  ['Inspecte', { expr: 'think', loupe: 'inspect', look: [1, .2] }],
  ['Inquiet', { expr: 'worried', loupe: 'hold', mouth: .3, tilt: -4 }],
  ['Content', { expr: 'happy', loupe: 'raise', wave: .5, mouth: .45 }],
  ['Waouh', { expr: 'wow', loupe: 'raise', mouth: .8 }],
]
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Geist;src:url(${A('Geist-Variable.woff2')});font-weight:100 900}
@font-face{font-family:'Geist Mono';src:url(${A('GeistMono-Variable.woff2')});font-weight:100 900}
body{margin:0;width:2400px;height:1500px;background:radial-gradient(1400px 900px at 30% 60%,#1e1b4b,#0a0a0b 70%);font-family:Geist;color:#f8fafc;position:relative;overflow:hidden}
.t{position:absolute;left:90px;top:70px}.t h1{font-size:110px;margin:0;letter-spacing:-.04em}.t p{font-family:'Geist Mono';font-size:26px;color:#a4adbd;letter-spacing:.12em;text-transform:uppercase;margin:10px 0 0}
.hero{position:absolute;left:60px;top:250px}
.grid{position:absolute;left:840px;top:90px;display:grid;grid-template-columns:repeat(3,500px);gap:30px 20px}
.c{background:#16161a99;border:2px solid #26262d;border-radius:28px;height:640px;display:flex;flex-direction:column;align-items:center}
.c span{font-family:'Geist Mono';font-size:24px;color:#a4adbd;margin-top:16px;letter-spacing:.1em;text-transform:uppercase}
</style></head><body>
<div class="t"><h1>Scout</h1><p>Mascotte EZIO · v1</p></div>
<div class="hero">${scoutSvg({ id: 'h', expr: 'explain', loupe: 'raise', mouth: .35, markHref: mark, size: 720, glow: .9 })}</div>
<div class="grid">${poses.map(([n, o], i) => `<div class="c">${scoutSvg({ ...o, id: 'p' + i, markHref: mark, size: 480 })}<span>${n}</span></div>`).join('')}</div>
</body></html>`
const out = path.join(ROOT, 'out', 'shorts'); fs.mkdirSync(out, { recursive: true })
const hp = path.join(out, 'sheet.html'); fs.writeFileSync(hp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] })
const pg = await b.newPage({ viewport: { width: 2400, height: 1500 } })
await pg.goto('file://' + hp); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(200)
await pg.screenshot({ path: path.join(out, 'scout-sheet.png') }); await b.close(); fs.rmSync(hp)
console.log('out/shorts/scout-sheet.png')
