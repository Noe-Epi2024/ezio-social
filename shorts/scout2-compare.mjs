// Compare les 3 silhouettes de Scout v2 : node shorts/scout2-compare.mjs → out/shorts/scout2-silhouettes.png
import { chromium } from 'playwright-core'
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
import { scoutSvg } from './scout2.mjs'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const A = (f) => 'file://' + path.join(ROOT, 'assets', f)
const V = [['A · Capsule', 'capsule', { expr: 'explain', loupe: 'raise', mouth: .3 }], ['B · Casque', 'casque', { expr: 'happy', loupe: 'hold', count: 2 }], ['C · Facettes', 'facettes', { expr: 'think', loupe: 'inspect', look: [1, .2] }]]
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Geist;src:url(${A('Geist-Variable.woff2')});font-weight:100 900}
@font-face{font-family:'Geist Mono';src:url(${A('GeistMono-Variable.woff2')});font-weight:100 900}
body{margin:0;width:2400px;height:1400px;background:radial-gradient(1600px 900px at 50% 65%,#1e1b4b,#0a0a0b 72%);font-family:Geist;color:#f8fafc}
h1{margin:0;padding:60px 90px 0;font-size:80px;letter-spacing:-.04em}p{margin:6px 90px 0;font-family:'Geist Mono';font-size:24px;color:#a4adbd;letter-spacing:.12em;text-transform:uppercase}
.row{display:flex;justify-content:space-around;margin-top:30px}.c{display:flex;flex-direction:column;align-items:center}
.c span{font-family:'Geist Mono';font-size:30px;color:#c7d2fe;letter-spacing:.1em;text-transform:uppercase}
</style></head><body><h1>Scout v2 · silhouettes</h1><p>Plus de relief · plus de détails techniques</p>
<div class="row">${V.map(([n, v, o], i) => `<div class="c">${scoutSvg({ ...o, variant: v, id: 'v' + i, markHref: A('mark-white.svg'), size: 760 })}<span>${n}</span></div>`).join('')}</div></body></html>`
const out = path.join(ROOT, 'out', 'shorts'); fs.mkdirSync(out, { recursive: true })
const hp = path.join(out, 'cmp.html'); fs.writeFileSync(hp, html)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] })
const pg = await b.newPage({ viewport: { width: 2400, height: 1400 } })
await pg.goto('file://' + hp); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(200)
await pg.screenshot({ path: path.join(out, 'scout2-silhouettes.png') }); await b.close(); fs.rmSync(hp)
console.log('out/shorts/scout2-silhouettes.png')
