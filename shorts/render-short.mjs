// Short vertical avec mascotte EZIO synchronisée sur une voix.
// Usage : node shorts/render-short.mjs shorts/s01-avis-negatif.json [voix.wav|m4a|mp3] [--preview] [--cuts t1,t2,…] [--words mots.json] [--music piste]
//   - avec un fichier audio : la bouche suit l'énergie de la voix, les segments du script
//     sont calés sur les pauses détectées (marquer ~0,5 s de pause entre chaque phrase) ;
//   - sans audio : aperçu muet, durées estimées et bouche simulée.
// Sortie : out/shorts/<id>.mp4 (1080×1920, 30 i/s, H.264 + AAC) et <id>-cover.jpg.
import { chromium } from 'playwright-core'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const A = (f) => 'file://' + path.join(ROOT, 'assets', f)
const FPS = 30, W = 1080, H = 1920
const args = process.argv.slice(2)
const spec = JSON.parse(fs.readFileSync(args[0], 'utf8'))
const audio = args.find((a, i) => i > 0 && !a.startsWith('--') && args[i - 1] !== '--music' && args[i - 1] !== '--cuts' && args[i - 1] !== '--words') || spec.audio || null
// --cuts 5.06,9.56,… : frontières de phrases connues (milieu de chaque pause), quand la détection automatique hésite
const ci = args.indexOf('--cuts'), cuts = ci > 0 ? args[ci + 1].split(',').map(Number) : null
// --words fichier.json : instant de chaque mot, phrase par phrase (écrit par tts-voice.py), pour des sous-titres calés sur la voix
const wi = args.indexOf('--words'), words = wi > 0 ? JSON.parse(fs.readFileSync(args[wi + 1], 'utf8')) : null
const preview = args.includes('--preview')

// ---------- 1. Énergie de la voix, image par image ----------
function envelopeFromAudio(file) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], { maxBuffer: 1 << 30 })
  const pcm = new Int16Array(raw.buffer, raw.byteOffset, raw.length / 2)
  const per = 16000 / FPS, n = Math.floor(pcm.length / per), env = new Float32Array(n)
  for (let f = 0; f < n; f++) { const a = Math.floor(f * per), b = Math.floor((f + 1) * per); let s = 0; for (let i = a; i < b; i++) s += pcm[i] * pcm[i]; env[f] = Math.sqrt(s / (b - a)) }
  const sorted = [...env].sort((a, b) => a - b), ref = sorted[Math.floor(n * 0.95)] || 1
  return { env: env.map((v) => Math.min(1, v / ref)), duration: pcm.length / 16000 }
}

// Pauses (≥ 0,35 s sous le seuil) → frontières de segments les plus proches des proportions attendues
function segmentTimes(env, duration, segs) {
  const thr = 0.12, minGap = Math.round(0.35 * FPS), gaps = []
  let run = 0
  for (let f = 0; f <= env.length; f++) {
    if (f < env.length && env[f] < thr) run++
    else { if (run >= minGap) gaps.push({ start: (f - run) / FPS, end: f / FPS, mid: (f - run / 2) / FPS }); run = 0 }
  }
  const speechStart = gaps.length && gaps[0].start === 0 ? gaps.shift().end : 0
  const speechEnd = gaps.length && gaps.at(-1).end >= duration - 0.05 ? gaps.pop().start : duration
  const w = segs.map((s) => s.text.length), tot = w.reduce((a, b) => a + b, 0)
  const bounds = [speechStart]; let acc = 0, used = -1
  for (let i = 0; i < segs.length - 1; i++) {
    acc += w[i]; const target = speechStart + (speechEnd - speechStart) * acc / tot
    let best = null
    for (let g = used + 1; g < gaps.length - (segs.length - 2 - i); g++) if (!best || Math.abs(gaps[g].mid - target) < Math.abs(gaps[best].mid - target)) best = g
    if (best == null) { bounds.push(target); continue }
    used = best; bounds.push(gaps[best].mid)
  }
  bounds.push(speechEnd)
  return segs.map((s, i) => ({ start: bounds[i], end: bounds[i + 1] }))
}

function cutTimes(env, duration, cuts, segs) {
  if (cuts.length !== segs.length - 1) throw new Error(`--cuts : ${segs.length - 1} frontières attendues, ${cuts.length} reçues`)
  const thr = 0.12, on = (f) => env[f] >= thr
  let a = 0; while (a < env.length && !on(a)) a++
  let b = env.length - 1; while (b > 0 && !on(b)) b--
  const bounds = [a / FPS, ...cuts, Math.min(duration, (b + 1) / FPS)]
  return segs.map((s, i) => ({ start: bounds[i], end: bounds[i + 1] }))
}

function fakeTimeline(segs) {
  let t = 0.4; const times = [], env = []
  for (const s of segs) { const d = s.text.split(/\s+/).length / 2.7; times.push({ start: t, end: t + d }); t += d + 0.5 }
  const duration = t + 1.2, n = Math.ceil(duration * FPS)
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let f = 0; f < n; f++) {
    const tt = f / FPS, on = times.some((x) => tt >= x.start && tt < x.end)
    env.push(on ? Math.max(0, Math.sin(tt * Math.PI * 9.5 + rnd() * 0.8)) * (0.55 + rnd() * 0.45) : 0)
  }
  return { env, duration, times }
}

let env, duration, times
if (audio) { ({ env, duration } = envelopeFromAudio(audio)); times = cuts ? cutTimes(env, duration, cuts, spec.segments) : segmentTimes(env, duration, spec.segments); duration += 0.6 }
else ({ env, duration, times } = fakeTimeline(spec.segments))
const nFrames = Math.ceil(duration * FPS)
// lissage léger (attaque rapide, relâche douce) pour une bouche qui ne tremble pas
const mouth = []; let m = 0
for (let f = 0; f < nFrames; f++) { const v = env[f] || 0; m = v > m ? m + (v - m) * 0.75 : m + (v - m) * 0.4; mouth.push(+m.toFixed(3)) }
console.log(`${spec.id} : ${duration.toFixed(1)} s, ${nFrames} images, ${audio ? 'voix ' + path.basename(audio) : 'aperçu muet'}`)
times.forEach((t, i) => console.log(`  segment ${i + 1} : ${t.start.toFixed(2)} → ${t.end.toFixed(2)} s`))

// ---------- 2. Page HTML : toute l'image est une fonction pure de t ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const SCOUT_SRC = fs.readFileSync(path.join(ROOT, 'shorts', 'scout2.mjs'), 'utf8').replace(/^export /gm, '') // inséré tel quel dans la page
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Geist;src:url(${A('Geist-Variable.woff2')});font-weight:100 900}
@font-face{font-family:'Geist Mono';src:url(${A('GeistMono-Variable.woff2')});font-weight:100 900}
html,body{margin:0;background:#0a0a0b}
#s{position:relative;width:${W}px;height:${H}px;overflow:hidden;font-family:Geist;color:#f8fafc;
  background:radial-gradient(1200px 900px at 50% 62%,#1e1b4b 0%,#0a0a0b 62%)}
.eyebrow{position:absolute;left:84px;top:150px;font-family:'Geist Mono';font-size:28px;letter-spacing:.14em;text-transform:uppercase;color:#a4adbd}
.card{position:absolute;left:84px;right:84px;top:250px;background:#16161a;border:2px solid #26262d;border-radius:36px;padding:52px;box-sizing:border-box;will-change:transform,opacity}
.stars{font-size:64px;letter-spacing:6px;color:#fbbf24}.stars i{color:#3f3f46;font-style:normal}
.meta{font-family:'Geist Mono';font-size:26px;color:#a4adbd;margin-top:14px}
.rev{font-size:52px;line-height:1.25;margin-top:28px;color:#d8dde5}
.big{font-size:230px;font-weight:700;letter-spacing:-.05em;line-height:.9;color:#a5b4fc}
.lab{font-size:60px;font-weight:600;line-height:1.1;margin-top:18px;letter-spacing:-.02em}
.n{display:inline-flex;width:96px;height:96px;border-radius:999px;background:#4f46e5;align-items:center;justify-content:center;font-family:'Geist Mono';font-weight:700;font-size:52px}
.st{font-size:66px;font-weight:700;letter-spacing:-.03em;line-height:1.05;margin-top:30px}
.q{font-size:48px;line-height:1.3;margin-top:28px;color:#c7d2fe;border-left:6px solid #6366f1;padding-left:28px}
.cta{background:#4f46e5;border-color:#6366f1}
.btn{display:inline-block;margin-top:34px;background:#fff;color:#0a0a0b;font-family:'Geist Mono';font-weight:600;font-size:40px;padding:26px 48px;border-radius:999px}
#mascot{position:absolute;left:50%;top:730px;width:800px;margin-left:-400px}
.cap{position:absolute;left:70px;right:70px;bottom:230px;text-align:center;font-size:64px;font-weight:800;line-height:1.12;letter-spacing:-.02em;text-shadow:0 4px 24px rgba(0,0,0,.8)}
.cap span{opacity:.45}.cap span.on{opacity:1;color:#fff}.cap span.now{color:#a5b4fc;opacity:1}
.foot{position:absolute;left:84px;right:84px;bottom:110px;display:flex;justify-content:space-between;align-items:center;font-family:'Geist Mono';font-size:24px;color:#a4adbd}
.bar{position:absolute;left:0;top:0;height:10px;background:#6366f1}
</style></head><body><div id="s">
<div class="bar" id="bar"></div>
<div class="eyebrow">${esc(spec.eyebrow)}</div>
<div id="cards"></div>
<div id="mascot"></div>
<div class="cap" id="cap"></div>
<div class="foot"><img src="${A('mark-white.svg')}" style="height:52px"><span>${esc(spec.note || '@ezio.seo')}</span></div>
</div>
<script>${SCOUT_SRC}</script><script>
const MARK='${A('mark-white.svg')}';
const WORDS=${JSON.stringify(words)}, SEG=${JSON.stringify(spec.segments)}, TIMES=${JSON.stringify(times)}, MOUTH=${JSON.stringify(mouth)}, FPS=${FPS}, DUR=${duration};
const $=id=>document.getElementById(id);
const ease=x=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3);
const spring=x=>{x=Math.min(1,Math.max(0,x));return 1-Math.exp(-6*x)*Math.cos(10*x)};
function cardHtml(c){
  if(c.kind==='review') return '<div class="stars">'+'★'.repeat(c.stars)+'<i>'+'★'.repeat(5-c.stars)+'</i></div><div class="meta">'+c.meta+'</div><div class="rev">« '+c.body+' »</div>';
  if(c.kind==='big') return '<div class="big">'+c.big+'</div><div class="lab">'+c.label+'</div>';
  if(c.kind==='step') return '<div class="n">'+c.n+'</div><div class="st">'+c.title+'</div><div class="q">« '+c.quote+' »</div>';
  if(c.kind==='cta') return '<div class="big" style="color:#fff;font-size:120px;letter-spacing:-.04em">'+c.title+'</div><div class="btn">'+c.label+'</div>';
}
$('cards').innerHTML=SEG.map((s,i)=>'<div class="card'+(s.card.kind==='cta'?' cta':'')+'" id="c'+i+'" style="opacity:0">'+cardHtml(s.card)+'</div>').join('');
// découpage des sous-titres : groupes de ~5 mots, mots répartis au prorata des lettres
const CAP=SEG.map((s,i)=>{const words=s.text.replace(/[«»]/g,'').split(/\\s+/).filter(Boolean);const T=TIMES[i];const tot=words.reduce((a,w)=>a+w.length+1,0);let acc=0;
  const W=WORDS&&WORDS[i]&&WORDS[i].length===words.length?WORDS[i]:null;
  const ws=words.map((w,k)=>{const a=T.start+(T.end-T.start)*acc/tot;acc+=w.length+1;return{w,t:W?W[k]:a}});const groups=[];
  for(let k=0;k<ws.length;){let g=[ws[k++]];while(k<ws.length&&g.length<5&&!/[.:?!]$/.test(g.at(-1).w))g.push(ws[k++]);groups.push(g)}return groups});
window.render=function(f){
  const t=f/FPS; $('bar').style.width=(100*t/DUR)+'%';
  let si=TIMES.findIndex((x,i)=>t<(TIMES[i+1]?TIMES[i+1].start:1e9)); if(si<0)si=TIMES.length-1;
  if(t<TIMES[0].start) si=0;
  // cartes : entrée en ressort, sortie en glissé
  SEG.forEach((s,i)=>{const el=$('c'+i),a=TIMES[i].start-0.15,b=TIMES[i+1]?TIMES[i+1].start-0.15:1e9;
    if(t<a-0.01||t>b+0.35){el.style.opacity=0;return}
    const kin=spring((t-a)/0.55),kout=t>b?ease((t-b)/0.3):0;
    el.style.opacity=Math.min(1,(t-a)/0.15)*(1-kout);
    el.style.transform='translateY('+((1-kin)*120-kout*80)+'px) scale('+(0.92+0.08*kin)+') rotate('+((1-kin)*-3)+'deg)'});
  // mascotte Scout : expression + gestes du segment, bouche sur la voix, flottement, clignement
  const v=MOUTH[Math.min(f,MOUTH.length-1)]||0, S=SEG[si], pose=S.pose||{}, talk=v>0.08;
  const segIn=spring((t-TIMES[si].start)/0.5);
  const bob=Math.sin(t*2.2)*10+(talk?Math.sin(t*13)*3*v:0)-(1-segIn)*14*(t>TIMES[si].start?1:0);
  const tilt=Math.sin(t*1.3)*2.5+(talk?Math.sin(t*4.7)*1.8:0);
  const bt=(t+0.7)%3.4, blink=bt<0.14?Math.abs(Math.cos(bt/0.14*Math.PI)):1;
  const wave=pose.rpose==='wave'?((t*0.9)%1):0;
  $('mascot').innerHTML=scoutSvg({id:'m',variant:'casque',expr:S.expr==='calm'?'neutral':S.expr,mouth:Math.min(1,v*1.1),blink,
    look:[Math.sin(t*0.7)*0.4,(pose.rpose==='point'?-0.5:-0.2)+Math.sin(t*0.9)*0.15],count:pose.count||0,rpose:pose.rpose||'rest',wave,
    tilt,bob,glow:0.55+v*0.45,size:800});
  // sous-titres
  const groups=CAP[si];let gi=0;for(let k=0;k<groups.length;k++)if(t>=groups[k][0].t-0.05)gi=k;
  const g=groups[gi], show=t>=TIMES[si].start-0.1&&t<=TIMES[si].end+0.4;
  $('cap').innerHTML=show?g.map(x=>'<span class="'+(t>=x.t?(t<x.t+0.35?'now':'on'):'')+'">'+x.w+'</span>').join(' '):'';
};
</script></body></html>`

// ---------- 3. Rendu image par image, puis encodage ----------
const outDir = path.join(ROOT, 'out', 'shorts', spec.id); fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true })
const htmlPath = path.join(outDir, 'page.html'); fs.writeFileSync(htmlPath, html)
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--allow-file-access-from-files'] })
const page = await browser.newPage({ viewport: { width: W, height: H } })
await page.goto('file://' + htmlPath); await page.evaluate(() => document.fonts.ready)
const step = preview ? 2 : 1
for (let f = 0; f < nFrames; f += step) {
  await page.evaluate((f) => window.render(f), f)
  await page.screenshot({ path: path.join(outDir, `f${String(f / step | 0).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 })
  if (f % 150 === 0) process.stdout.write(`  ${Math.round(100 * f / nFrames)} %\r`)
}
await page.evaluate((f) => window.render(f), Math.round(nFrames * 0.12))
await page.screenshot({ path: path.join(ROOT, 'out', 'shorts', `${spec.id}-cover.jpg`), type: 'jpeg', quality: 90 })
await browser.close()
const mp4 = path.join(ROOT, 'out', 'shorts', `${spec.id}${audio ? '' : '-apercu'}.mp4`)
const ff = ['-v', 'error', '-y', '-framerate', String(FPS / step), '-i', path.join(outDir, 'f%05d.jpg')]
const mi = args.indexOf('--music'), music = mi > 0 ? args[mi + 1] : spec.music || null
if (audio && music) {
  // nappe musicale très basse sous la voix, fondue en entrée et en sortie, coupée à la durée de la vidéo
  ff.push('-i', audio, '-stream_loop', '-1', '-i', music, '-filter_complex',
    `[1:a]apad=pad_dur=0.6[v];[2:a]volume=0.07,afade=t=in:d=1,afade=t=out:st=${(duration - 1.5).toFixed(2)}:d=1.5,atrim=0:${duration.toFixed(2)}[m];[v][m]amix=inputs=2:duration=first:normalize=0[a]`,
    '-map', '0:v', '-map', '[a]', '-c:a', 'aac', '-b:a', '160k')
} else if (audio) ff.push('-i', audio, '-c:a', 'aac', '-b:a', '160k', '-af', 'apad=pad_dur=0.6')
ff.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-crf', '20', '-movflags', '+faststart', '-shortest', mp4)
execFileSync('ffmpeg', ff)
fs.rmSync(outDir, { recursive: true, force: true })
console.log('→ ' + path.relative(ROOT, mp4))
