// Rendu des visuels Instagram EZIO à la charte (design system « EZIO Instagram »).
// Usage : node render.mjs specs/2026-w47.json   → out/<id>/<n>.jpg (JPEG, ≤ 8 Mo)
// Format « post » : 1080×1350 (4:5) · format « story » : 1080×1920 (9:16).
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const A = (f) => 'file://' + path.join(ROOT, 'assets', f)

const T = {
  nuit:  { ground: '#0a0a0b', surface: '#16161a', line: '#26262d', ink: '#f8fafc', text: '#d8dde5', muted: '#a4adbd', hl: '#a5b4fc' },
  jour:  { ground: '#f8fafc', surface: '#ffffff', line: '#e2e8f0', ink: '#0f172a', text: '#334155', muted: '#4b5563', hl: '#4338ca' },
  brand: { ground: '#4f46e5', surface: '#4338ca', line: '#6366f1', ink: '#ffffff', text: '#ffffff', muted: '#e0e7ff', hl: '#ffffff' },
}
const HEAT = (r) => r == null || r > 20 ? ['#64748b', '#ffffff', '20+'] : r <= 1 ? ['#34d399', '#0a0a0b', r] : r <= 3 ? ['#6ee7b7', '#0a0a0b', r] : r <= 7 ? ['#bef264', '#0a0a0b', r] : r <= 10 ? ['#fbbf24', '#0a0a0b', r] : r <= 15 ? ['#fb923c', '#0a0a0b', r] : ['#f87171', '#0a0a0b', r]
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// *mot* → mot surligné (brand-text) ; un seul groupe par titre (règle de la charte)
const hl = (s = '', t) => esc(s).replace(/\*(.+?)\*/g, `<span style="color:${t.hl}">$1</span>`)

function grid(rows, cell, t) {
  const cols = rows[0].length
  const cells = rows.flat().map((r) => { const [bg, fg, label] = HEAT(r); return `<div style="width:${cell}px;height:${cell}px;border-radius:14px;background:${bg};color:${fg};display:flex;align-items:center;justify-content:center;font-family:'Geist Mono';font-weight:600;font-size:${Math.round(cell * 0.3)}px">${label}</div>` }).join('')
  return `<div style="display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:12px">${cells}</div>`
}

function slideHtml(s, W, H) {
  const t = T[s.theme || (s.kind === 'cta' ? 'brand' : 'nuit')]
  const story = H > 1400
  const padTop = s.kind === 'hook' && !s.grid ? (story ? 620 : 380) : (story ? 260 : 96)
  const eyebrow = s.eyebrow ? `<div style="font-family:'Geist Mono';font-size:26px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:${t.muted}">${esc(s.eyebrow)}${s.page ? ' · ' + esc(s.page) : ''}</div>` : ''
  const big = s.kind === 'hook' || s.kind === 'cta'
  const title = s.title ? `<h1 style="margin:24px 0 0;font-size:${big ? 116 : 80}px;line-height:${big ? .95 : 1};letter-spacing:${big ? '-.045em' : '-.035em'};font-weight:700;color:${t.ink}">${hl(s.title, t)}</h1>` : ''
  const body = s.body ? `<p style="margin:40px 0 0;font-size:${s.kind === 'cta' ? 42 : 36}px;line-height:1.35;color:${t.text};max-width:880px">${hl(s.body, t)}</p>` : ''
  const bullets = s.bullets ? `<div style="margin-top:48px;display:flex;flex-direction:column">${s.bullets.map((b, i) => `<div style="display:flex;gap:32px;padding:22px 0;border-top:2px solid ${t.line};align-items:baseline"><div style="font-family:'Geist Mono';font-size:26px;color:${t.muted};width:44px;flex-shrink:0">${String(i + 1).padStart(2, '0')}</div><div style="font-size:36px;line-height:1.3;color:${t.text}">${hl(b, t)}</div></div>`).join('')}</div>` : ''
  const proof = s.numeral ? `<div style="margin-top:64px;background:${t.surface};border:2px solid ${t.line};border-radius:28px;padding:64px"><div style="font-family:'Geist Mono';font-size:180px;font-weight:600;letter-spacing:-.04em;line-height:.9;color:${t.ink}">${esc(s.numeral)}</div>${s.numeralNote ? `<p style="font-size:32px;line-height:1.4;margin:32px 0 0;color:${t.text}">${esc(s.numeralNote)}</p>` : ''}</div>` : ''
  const gridBlock = s.grid ? (s.kind === 'hook'
    ? `<div style="position:absolute;left:330px;top:${story ? 1000 : 700}px;transform:rotate(-8deg)">${grid(s.grid, 104, t)}</div>`
    : `<div style="margin-top:56px">${grid(s.grid, s.grid[0].length > 5 ? 88 : 120, t)}</div>`) : ''
  const button = s.kind === 'cta' ? `<div style="margin-top:72px;display:inline-block;background:#fff;color:#0a0a0b;font-family:'Geist Mono';font-weight:600;font-size:34px;padding:30px 52px;border-radius:999px">${esc(s.button || 'Lien en bio ↗')}</div>` : ''
  const mark = s.kind === 'cta' ? `<img src="${A('lockup-white.svg')}" style="height:150px;margin-left:-30px">` : `<img src="${A('mark-white.svg')}" style="height:56px;${t === T.jour ? 'filter:invert(1)' : ''}">`
  const footer = s.kind === 'hook' ? `<div style="position:absolute;right:96px;bottom:${story ? 300 : 80}px;width:104px;height:104px;border-radius:999px;background:${t.ground};color:${t.ink};font-size:56px;display:flex;align-items:center;justify-content:center">→</div>`
    : `<div style="position:absolute;left:96px;right:96px;bottom:${story ? 300 : 72}px;display:flex;justify-content:space-between;align-items:center;font-family:'Geist Mono';font-size:22px;color:${t.muted}">${mark}<span>${esc(s.note || '@ezio.seo')}</span></div>`
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Geist;src:url(${A('Geist-Variable.woff2')});font-weight:100 900}
@font-face{font-family:'Geist Mono';src:url(${A('GeistMono-Variable.woff2')});font-weight:100 900}
html,body{margin:0}</style></head><body>
<div style="position:relative;width:${W}px;height:${H}px;box-sizing:border-box;padding:${padTop}px 96px 96px;background:${t.ground};font-family:Geist;overflow:hidden">
${eyebrow}${title}${body}${bullets}${proof}${gridBlock}${button}${footer}</div></body></html>`
}

const specPath = process.argv[2]
if (!specPath) { console.error('usage: node render.mjs <spec.json>'); process.exit(1) }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] })
for (const item of spec.items) {
  const [W, H] = item.format === 'story' ? [1080, 1920] : [1080, 1350]
  const dir = path.join(ROOT, 'out', item.id); fs.mkdirSync(dir, { recursive: true })
  const page = await browser.newPage({ viewport: { width: W, height: H } })
  for (const [i, s] of item.slides.entries()) {
    const html = path.join(dir, `_${i + 1}.html`)
    fs.writeFileSync(html, slideHtml(s, W, H))
    await page.goto('file://' + html); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(150)
    const file = path.join(dir, `${i + 1}.jpg`)
    await page.screenshot({ path: file, type: 'jpeg', quality: 90 })
    fs.rmSync(html)
    const kb = Math.round(fs.statSync(file).size / 1024); if (kb > 8000) throw new Error(`${file} dépasse 8 Mo`)
    console.log(`${item.id}/${i + 1}.jpg  ${W}×${H}  ${kb} Ko`)
  }
  await page.close()
}
await browser.close()
