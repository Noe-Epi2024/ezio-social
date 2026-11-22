// Scènes visuelles des Reels Scout (inséré tel quel dans la page de render-short.mjs).
// Chaque scène : html(c) donne le décor, anim(el, lt, D, c) l'anime ; lt = secondes depuis le début de la phrase,
// D = durée de la phrase. Tout est une fonction pure du temps : une image donnée se rend toujours pareil.
// Données d'exemple : entreprise fictive « Plomberie Durand », le pied de page porte « Exemple illustratif ».

const C = { bg: '#0a0a0b', ink: '#f8fafc', indigo: '#6366f1', indigoL: '#a5b4fc', brand: '#4f46e5', red: '#ef4444', amber: '#fbbf24', green: '#34d399', muted: '#a4adbd', card: '#16161a', line: '#26262d' }
const clamp = (x) => Math.min(1, Math.max(0, x))
const eo = (x) => 1 - Math.pow(1 - clamp(x), 3)
const spr = (x) => { x = clamp(x); return 1 - Math.exp(-6 * x) * Math.cos(10 * x) }
const pop = (el, k, from = 0.4) => { if (!el) return; el.style.opacity = clamp(k * 3); el.style.transform = (el.dataset.base || '') + ` scale(${from + (1 - from) * spr(k)})` }
const q = (el, s) => el.querySelector(s)
const qa = (el, s) => [...el.querySelectorAll(s)]
const BIZ = 'Plomberie Durand'

// ---------- briques ----------
const sticker = (txt, color = C.red, rot = -6, x = 60, y = 40, size = 64) =>
  `<div class="stk" data-base="rotate(${rot}deg)" style="left:${x}px;top:${y}px;background:${color};font-size:${size}px;transform:rotate(${rot}deg)">${txt}</div>`
const stars = (n, size = 34) => `<span style="font-size:${size}px;letter-spacing:2px;color:${C.amber}">${'★'.repeat(n)}<span style="color:#d4d4d8">${'★'.repeat(5 - n)}</span></span>`
const phone = (inner, x = 250, y = 70, w = 580, h = 900) =>
  `<div class="phone" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><div class="notch"></div><div class="screen">${inner}</div></div>`
const gHeader = (rating = '4,6', count = 128) => `<div class="gh"><div class="gname">${BIZ}</div>
  <div class="grow"><b class="grate">${rating}</b> ${stars(5, 30)} <span class="gcount">(${count})</span></div><div class="gsub">Plombier · Lyon 3e · Ouvert</div>
  <div class="gtabs"><span>Présentation</span><span class="on">Avis</span><span>Photos</span></div></div>`
const review = (n, body, meta, cls = '') => `<div class="rv ${cls}"><div class="rvh"><div class="av">M</div><div><b>Marc L.</b><div class="rvm">${meta}</div></div></div>
  <div>${stars(n, 34)}</div><div class="rvb">${body}</div></div>`
const oldReviews = () => review(5, 'Intervention rapide, travail propre. Je recommande.', 'il y a 3 jours', 'old') + review(5, 'Très pro, devis clair et respecté.', 'il y a 1 semaine', 'old')

// carte de ville stylisée : îlots + rues, générés de façon déterministe
function cityMap(w, h, seed = 3) {
  let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647
  let blocks = ''
  for (let y = 0; y < h; y += 90) for (let x = 0; x < w; x += 110) {
    const bw = 70 + r() * 25, bh = 55 + r() * 20
    blocks += `<rect x="${x + 12}" y="${y + 12}" width="${bw}" height="${bh}" rx="8" fill="${r() < 0.12 ? '#14301f' : '#1a1a22'}"/>`
  }
  return `<svg class="map" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#101015"/>${blocks}
    <path d="M0 ${h * 0.55} C ${w * 0.3} ${h * 0.45}, ${w * 0.6} ${h * 0.7}, ${w} ${h * 0.6}" stroke="#2b3a67" stroke-width="26" fill="none"/>
    <path d="M${w * 0.35} 0 L ${w * 0.42} ${h}" stroke="#3a3a46" stroke-width="16" fill="none"/></svg>`
}
const RANK = (r) => r == null || r > 20 ? ['#64748b', '20+'] : r <= 1 ? ['#34d399', r] : r <= 3 ? ['#6ee7b7', r] : r <= 7 ? ['#bef264', r] : r <= 10 ? ['#fbbf24', r] : r <= 15 ? ['#fb923c', r] : ['#f87171', r]
// moyenne de cette grille = 4,4 (20+ compté 20) : cohérent avec « position moyenne, quatre »
const GRID = [[1, 1, 1, 2, 3], [1, 1, 1, 2, 4], [1, 1, 1, 2, 5], [2, 2, 3, 5, null], [2, 3, 5, null, null]]
function dots(cell = 150, ox = 90, oy = 120) {
  return GRID.flatMap((row, y) => row.map((v, x) => { const [bg, lab] = RANK(v)
    return `<div class="dot" data-x="${x}" data-y="${y}" data-v="${v ?? 99}" style="left:${ox + x * cell}px;top:${oy + y * cell}px;background:${bg}">${lab}</div>` })).join('')
}
const browser = (inner, x = 70, y = 90, w = 940, h = 820) => `<div class="br" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
  <div class="brbar"><i></i><i></i><i></i><div class="url">plomberie-durand.fr/blog/fuite-sous-evier</div></div><div class="brin">${inner}</div></div>`

// ---------- scènes ----------
const SCENES = {
  // un avis à une étoile tombe sur la fiche
  'phone-review': {
    html: (c) => phone(gHeader() + `<div class="notif">🔔 Nouvel avis · ${'★'.repeat(c.stars)}</div><div class="list">${review(c.stars, c.body, c.meta, 'new')}${oldReviews()}</div>`),
    anim(el, lt) {
      const ph = q(el, '.phone'); ph.style.transform = `translateY(${(1 - spr(lt / 0.7)) * 500}px) rotate(${Math.sin(lt * 40) * 2 * clamp(1 - Math.abs(lt - 1.6) / 0.25)}deg)`
      const n = q(el, '.notif'); n.style.transform = `translateY(${-140 + 160 * spr((lt - 0.5) / 0.5) - 160 * eo((lt - 1.4) / 0.4)}px)`
      const nr = q(el, '.rv.new'); nr.style.maxHeight = 420 * eo((lt - 1.1) / 0.5) + 'px'; nr.style.opacity = clamp((lt - 1.2) / 0.3)
      nr.style.background = `rgba(239,68,68,${0.16 * clamp((lt - 1.2) / 0.3)})`
      q(el, '.grate').textContent = lt > 1.7 ? '4,5' : '4,6'; q(el, '.grate').style.color = lt > 1.7 ? C.red : ''
    }
  },
  // N petites bulles qui apparaissent : « trois phrases, pas une de plus »
  'bubbles': {
    html: (c) => `<div class="bubbles">${Array.from({ length: c.n }, (_, i) => `<div class="bub"><b>${i + 1}</b><i style="width:${[78, 62, 70][i % 3]}%"></i></div>`).join('')}</div>
      ${sticker(c.sticker, C.brand, -5, 50, 40, 54)}<div class="crossed" style="opacity:0">+1</div>`,
    anim(el, lt, D) {
      qa(el, '.bub').forEach((b, i) => { b.style.opacity = clamp((lt - 0.3 - i * 0.35) / 0.2); b.style.transform = `translateX(${(1 - spr((lt - 0.3 - i * 0.35) / 0.6)) * -600}px)` })
      pop(q(el, '.stk'), (lt - 0.1) / 0.6)
      const x = q(el, '.crossed'); const k = (lt - D * 0.6) / 0.5; x.style.opacity = clamp(k * 3); x.style.transform = `scale(${0.5 + 0.5 * spr(k)}) rotate(-8deg)`
    }
  },
  // le propriétaire répond : la réponse s'écrit sous l'avis, l'étape s'affiche en autocollant
  'phone-reply': {
    html: (c) => phone(gHeader('4,5', 129) + `<div class="list">${review(1, c.review || 'Trois jours pour avoir un devis. Je ne recommande pas.', 'il y a 1 h', 'new')}
      <div class="reply"><div class="rph">Réponse du propriétaire</div><div class="rpt"><span class="done"></span><span class="cur">|</span></div></div></div>`, 290, 110, 560, 860)
      + sticker(`${c.n} · ${c.title}`, c.n === '3' ? C.green : C.brand, -4, 40, 20, 54),
    anim(el, lt, D, c) {
      q(el, '.phone').style.transform = `translateX(${(1 - spr(lt / 0.6)) * 500}px)`
      pop(q(el, '.stk'), (lt - 0.15) / 0.6)
      const prev = (c.prev || []).join(' '), full = (prev ? prev + ' ' : '') + c.quote
      const typed = Math.round(prev.length + (c.quote.length) * clamp((lt - 0.8) / Math.max(1, D * 0.75 - 0.8)))
      q(el, '.done').textContent = full.slice(0, typed); q(el, '.cur').style.opacity = Math.floor(lt * 3) % 2 ? 1 : 0
      const up = `translateY(${-Math.max(0, typed - 90) * 1.3}px)`; q(el, '.list').style.transform = up
    }
  },
  // la réponse est lue par une foule de futurs clients
  'readers': {
    html: (c) => `<div class="rcard"><div class="rph">Réponse du propriétaire</div><div class="rpt2">${c.reply}</div></div>
      <div class="crowd">${Array.from({ length: 28 }, (_, i) => `<div class="fa" style="background:hsl(${(i * 47) % 360} 45% 62%)">👁</div>`).join('')}</div>${sticker(c.sticker, C.brand, -5, 50, 20, 54)}`,
    anim(el, lt) {
      pop(q(el, '.rcard'), lt / 0.6, 0.7)
      qa(el, '.fa').forEach((f, i) => { const k = (lt - 0.6 - ((i * 7) % 28) * 0.06) / 0.4; f.style.opacity = clamp(k * 2); f.style.transform = `scale(${spr(k)})` })
      pop(q(el, '.stk'), (lt - 1.2) / 0.6)
    }
  },
  // carte de ville + grille de positions, plusieurs modes
  'map': {
    html: (c) => `<div class="mapwrap">${cityMap(940, 860, 7)}<div class="pin">📍</div>${dots()}<div class="avg">Moyenne<b>4</b></div><div class="hole"></div></div>
      <div class="acts">${['Fiche', 'Post', 'Article'].map((t) => `<div class="act">${t}</div>`).join('')}</div>${c.sticker ? sticker(c.sticker, c.color || C.red, -6, 40, 10, 66) : ''}`,
    anim(el, lt, D, c) {
      const w = q(el, '.mapwrap'), m = c.mode
      const zoom = m === 'grid' ? 1.18 - 0.18 * eo(lt / D) : m === 'hole' ? 1 + 0.25 * eo((lt - 0.2) / 1.2) : 1 + 0.05 * lt / D
      const pan = m === 'hole' ? `translate(${-120 * eo((lt - 0.2) / 1.2)}px,${-110 * eo((lt - 0.2) / 1.2)}px)` : ''
      w.style.transform = `${pan} scale(${zoom})`
      pop(q(el, '.stk'), (lt - 0.2) / 0.6)
      const avg = q(el, '.avg'), hole = q(el, '.hole'), acts = q(el, '.acts')
      avg.style.opacity = 0; hole.style.opacity = 0; acts.style.opacity = 0
      qa(el, '.dot').forEach((d) => {
        const x = +d.dataset.x, y = +d.dataset.y, v = +d.dataset.v, order = x + y
        let k = (lt - 0.3 - order * 0.12) / 0.4
        if (m === 'average') { k = (lt - 0.2 - order * 0.06) / 0.3; const gather = eo((lt - 1.6) / 0.6); d.style.opacity = clamp(k * 2) * (1 - gather); d.style.transform = `translate(${(2 - x) * 150 * gather}px,${(2 - y) * 150 * gather}px) scale(${spr(k) * (1 - 0.6 * gather)})` }
        else if (m === 'spread') { const hi = v <= 1 || v > 20; d.style.opacity = clamp(k * 2) * (hi ? 1 : 0.25); d.style.transform = `scale(${spr(k) * (hi ? 1 + 0.15 * Math.sin(lt * 6) : 0.85)})` }
        else if (m === 'hole') { const out = v > 10; d.style.opacity = out ? 1 : 0.35; d.style.transform = `scale(${out ? 1 + 0.12 * Math.sin(lt * 7) : 0.9})` }
        else { d.style.opacity = clamp(k * 2); d.style.transform = `scale(${spr(k)})` }
      })
      if (m === 'average') { const k = (lt - 1.9) / 0.6; avg.style.opacity = clamp(k * 3); avg.style.transform = `translate(-50%,-50%) scale(${spr(k)})` }
      if (m === 'hole') { hole.style.opacity = clamp((lt - 0.8) / 0.3); hole.style.transform = `scale(${1 + 0.08 * Math.sin(lt * 5)})`
        acts.style.opacity = 1; qa(el, '.act').forEach((a, i) => pop(a, (lt - D * 0.45 - i * 0.35) / 0.5)) }
    }
  },
  // le pack local : trois fiches visibles, la vôtre n'y est pas
  'pack': {
    html: (c) => phone(`<div class="search">🔍 plombier près de moi</div><div class="mini">${cityMap(560, 300, 11)}<div class="mp" style="left:120px;top:120px">1</div><div class="mp" style="left:300px;top:70px">2</div><div class="mp" style="left:420px;top:190px">3</div></div>
      ${['Plomberie Morel', 'Allo Plombier 69', 'SOS Dépannage Lyon'].map((n, i) => `<div class="res"><b>${n}</b><div>${stars(5 - (i === 2 ? 1 : 0), 26)} <span class="gcount">4,${8 - i} · ${300 + i * 90} m</span></div></div>`).join('')}
      <div class="res you"><b>${BIZ}</b><div class="gcount">absent de ces 3 résultats</div></div>`, 250, 60, 580, 900) + sticker(c.sticker, C.red, -5, 40, 30, 62),
    anim(el, lt) {
      q(el, '.phone').style.transform = `translateY(${(1 - spr(lt / 0.6)) * 500}px)`
      qa(el, '.res').forEach((r, i) => { const k = (lt - 0.6 - i * 0.3) / 0.4; r.style.opacity = clamp(k * 2); r.style.transform = `translateX(${(1 - eo(k)) * 200}px)` })
      const you = q(el, '.res.you'); you.style.opacity = clamp((lt - 2.1) / 0.3) * 0.9
      pop(q(el, '.stk'), (lt - 0.3) / 0.6)
    }
  },
  // un article de blog : une promesse inventée est barrée
  'article-fake': {
    html: (c) => browser(`<h1>Fuite sous l'évier : que faire ?</h1><p class="ln"></p><p class="ln s"></p>
      <div class="promise">${c.promise}<div class="strike"></div></div><p class="ln"></p><p class="ln s"></p><p class="ln"></p>`) + `<div class="stamp">${c.stamp}</div>`,
    anim(el, lt) {
      q(el, '.br').style.transform = `translateY(${(1 - spr(lt / 0.6)) * 400}px)`
      const p = q(el, '.promise'); p.style.background = `rgba(251,191,36,${0.35 * clamp((lt - 0.8) / 0.4)})`
      q(el, '.strike').style.width = 100 * eo((lt - 1.6) / 0.4) + '%'
      const s = q(el, '.stamp'), k = (lt - 2.0) / 0.4; s.style.opacity = clamp(k * 3); s.style.transform = `rotate(-14deg) scale(${2.4 - 1.4 * eo(k)})`
    }
  },
  // la fiche Google alimente l'article : la seule source
  'source': {
    html: (c) => `<div class="gcard">${gHeader()}<div class="facts">${c.facts.map((f) => `<div class="fact">✓ ${f}</div>`).join('')}</div></div>
      <div class="flow">${Array.from({ length: 6 }, () => '<i></i>').join('')}</div>
      <div class="doc"><div class="doch">Article</div>${c.facts.map((f) => `<div class="dl"><span>${f}</span></div>`).join('')}<div class="ln"></div><div class="ln s"></div></div>${sticker(c.sticker, C.brand, -5, 50, 60, 54)}`,
    anim(el, lt) {
      pop(q(el, '.gcard'), lt / 0.6, 0.8); pop(q(el, '.doc'), (lt - 0.5) / 0.6, 0.8)
      qa(el, '.flow i').forEach((d, i) => { const p = ((lt * 0.9 + i / 6) % 1); d.style.left = 20 + p * 160 + 'px'; d.style.opacity = lt > 0.8 ? Math.sin(p * Math.PI) : 0 })
      qa(el, '.dl span').forEach((s, i) => { s.style.opacity = clamp((lt - 1.0 - i * 0.4) / 0.3) })
      pop(q(el, '.stk'), (lt - 1.4) / 0.6)
    }
  },
  // les trois règles de rédaction, montrées sur l'article
  'rule': {
    html: (c) => {
      const body = c.variant === 'contact'
        ? `<h1>Fuite sous l'évier : que faire ?</h1><p class="ln"></p><p class="ln s"></p><div class="ctaold">Contactez-nous via notre page contact →</div><div class="ctanew">Appelez <b>${BIZ}</b>.</div><p class="ln"></p>`
        : c.variant === 'compare'
          ? `<h2>Pourquoi nous choisir ?</h2><table class="tb">${['Devis écrit avant travaux', 'Artisan certifié RGE', 'Garantie 10 ans', 'Intervention en 30 min'].map((r, i) => `<tr class="${i < 2 ? 'real' : 'fake'}"><td>${r}</td><td>${i < 2 ? '✓ sur la fiche' : '? inventé'}</td></tr>`).join('')}</table>`
          : `<h2>Bien choisir son plombier</h2><div class="opts"><div class="opt"><b>Grande enseigne</b><span class="neutral">Réseau national, délais selon le planning.</span><span class="mean">« Des amateurs qui bâclent »</span></div><div class="opt us"><b>${BIZ}</b><span class="neutral">Artisan du quartier, devis écrit.</span></div></div>`
      return browser(body, 70, 150, 940, 760) + sticker(`${c.n} · ${c.title}`, c.n === '3' ? C.green : C.brand, -4, 40, 30, 54)
    },
    anim(el, lt, D, c) {
      q(el, '.br').style.transform = `translateX(${(1 - spr(lt / 0.6)) * 600}px)`
      pop(q(el, '.stk'), (lt - 0.15) / 0.6)
      const k = (lt - D * 0.35) / 0.5
      if (c.variant === 'contact') { const o = q(el, '.ctaold'), n = q(el, '.ctanew'); o.style.textDecorationColor = k > 0 ? C.red : 'transparent'; o.style.opacity = 1 - 0.6 * eo(k); o.style.maxHeight = 200 * (1 - eo((lt - D * 0.55) / 0.4)) + 'px'; n.style.opacity = clamp((lt - D * 0.6) / 0.3); n.style.transform = `scale(${0.8 + 0.2 * spr((lt - D * 0.6) / 0.5)})` }
      if (c.variant === 'compare') qa(el, 'tr.fake').forEach((r, i) => { const kk = (lt - D * 0.35 - i * 0.3) / 0.4; r.style.background = `rgba(239,68,68,${0.35 * clamp(kk * 3)})`; r.style.opacity = 1 - eo((kk - 1) / 1); r.style.transform = `translateX(${eo((kk - 1) / 1) * 300}px)` })
      if (c.variant === 'neutral') { const m = q(el, '.mean'); m.style.opacity = 1 - eo(k); m.style.transform = `translateY(${eo(k) * 40}px)`; m.style.textDecorationColor = k > -0.3 ? C.red : 'transparent'; q(el, '.neutral').style.opacity = 0.3 + 0.7 * eo(k) }
    }
  },
  // l'appel à l'action : le rapport d'audit sur téléphone
  'cta': {
    html: (c) => phone(`<div class="audit"><div class="auh">Audit EZIO</div><div class="aus">${BIZ}</div><div class="minigrid">${GRID.flat().map((v) => `<i style="background:${RANK(v)[0]}"></i>`).join('')}</div>
      <div class="aul"><span>Zones perdues</span><b style="color:${C.red}">3</b></div></div>`, 270, 0, 540, 745)
      + `<div class="ctab">${c.title}<span>${c.label}</span></div>`,
    anim(el, lt) {
      q(el, '.phone').style.transform = `translateY(${(1 - spr(lt / 0.6)) * 500}px) rotate(${-3 + 3 * eo(lt / 1)}deg)`
      qa(el, '.minigrid i').forEach((d, i) => { const k = (lt - 0.5 - i * 0.04) / 0.3; d.style.transform = `scale(${spr(k)})` })
      qa(el, '.aul').forEach((a, i) => { a.style.opacity = clamp((lt - 1.2 - i * 0.25) / 0.3) })
      const b = q(el, '.ctab'), k = (lt - 0.8) / 0.6; b.style.opacity = clamp(k * 3); b.style.transform = `translateX(-50%) scale(${(0.6 + 0.4 * spr(k)) * (1 + 0.04 * Math.sin(lt * 6))})`
    }
  },
}

const SCENE_CSS = `
#stage{position:absolute;left:0;top:170px;width:1080px;height:980px}
.scene{position:absolute;inset:0;will-change:transform,opacity,filter}
.stk{position:absolute;z-index:5;color:#fff;font-weight:800;letter-spacing:-.02em;padding:14px 30px;border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.55);white-space:nowrap;text-transform:uppercase;font-family:Geist}
.phone{position:absolute;border-radius:72px;background:#0c0c10;border:10px solid #2a2a33;box-shadow:0 40px 120px rgba(79,70,229,.35),0 0 0 2px #3f3f46;overflow:hidden}
.notch{position:absolute;left:50%;top:14px;width:150px;height:34px;margin-left:-75px;border-radius:20px;background:#0c0c10;z-index:4}
.screen{position:absolute;inset:0;background:#f8fafc;color:#0f172a;font-family:Geist;overflow:hidden;padding-top:70px}
.gh{position:relative;z-index:2;background:#f8fafc;padding:16px 32px 0;border-bottom:2px solid #e2e8f0}.gname{font-size:42px;font-weight:700;letter-spacing:-.02em}
.grow{font-size:30px;margin-top:6px;display:flex;align-items:center;gap:10px}.grate{font-size:32px}.gcount{color:#64748b;font-size:26px}
.gsub{color:#475569;font-size:26px;margin-top:4px}.gtabs{display:flex;gap:34px;font-size:26px;color:#64748b;margin-top:18px}
.gtabs span{padding-bottom:14px}.gtabs .on{color:#4338ca;border-bottom:5px solid #4338ca;font-weight:600}
.list{padding:10px 26px}.rv{padding:18px 10px;border-bottom:2px solid #e2e8f0;overflow:hidden;border-radius:16px}
.rvh{display:flex;gap:14px;align-items:center;font-size:28px}.av{width:56px;height:56px;border-radius:99px;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
.rvm{color:#64748b;font-size:22px}.rvb{font-size:30px;line-height:1.3;margin-top:6px}
.notif{position:absolute;left:24px;right:24px;top:0;z-index:3;background:#111827;color:#fff;font-size:30px;font-weight:600;padding:22px 26px;border-radius:26px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
.reply{margin:14px 10px;background:#eef2ff;border-radius:20px;padding:20px 24px;min-height:200px}
.rph{font-size:24px;font-weight:700;color:#4338ca;text-transform:uppercase;letter-spacing:.06em}.rpt{font-size:28px;line-height:1.32;margin-top:10px}
.bubbles{position:absolute;left:120px;right:120px;top:190px;display:flex;flex-direction:column;gap:40px}
.bub{display:flex;align-items:center;gap:30px;background:#eef2ff;border-radius:40px 40px 40px 10px;padding:40px 44px;box-shadow:0 20px 60px rgba(79,70,229,.3)}
.bub b{display:flex;width:90px;height:90px;flex:none;border-radius:99px;background:#4f46e5;color:#fff;align-items:center;justify-content:center;font-size:50px}
.bub i{display:block;height:28px;border-radius:14px;background:#c7d2fe}
.crossed{position:absolute;right:120px;bottom:40px;font-size:150px;font-weight:900;color:#ef4444;text-decoration:line-through;text-decoration-thickness:14px}
.rcard{position:absolute;left:140px;right:140px;top:330px;z-index:2;background:#eef2ff;color:#0f172a;border-radius:30px;padding:36px 40px;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.rpt2{font-size:36px;line-height:1.35;margin-top:10px}
.crowd{position:absolute;left:60px;right:60px;top:120px;display:grid;grid-template-columns:repeat(7,1fr);gap:26px 0;justify-items:center}
.fa{width:104px;height:104px;border-radius:99px;display:flex;align-items:center;justify-content:center;font-size:44px;border:5px solid #0a0a0b}
.mapwrap{position:absolute;left:70px;top:90px;width:940px;height:860px;border-radius:40px;overflow:hidden;box-shadow:0 30px 100px rgba(79,70,229,.3);transform-origin:70% 65%}
.map{position:absolute;inset:0}.pin{position:absolute;left:375px;top:345px;font-size:70px}
.dot{position:absolute;width:104px;height:104px;border-radius:99px;display:flex;align-items:center;justify-content:center;font-family:'Geist Mono';font-weight:700;font-size:38px;color:#0a0a0b;box-shadow:0 0 0 6px rgba(10,10,11,.5)}
.avg{position:absolute;left:50%;top:50%;background:#fff;color:#0a0a0b;border-radius:40px;padding:30px 60px;text-align:center;font-size:40px;font-weight:700;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.avg b{display:block;font-size:220px;line-height:.9;color:#4f46e5}
.hole{position:absolute;left:520px;top:470px;width:380px;height:380px;border-radius:999px;border:10px solid #ef4444;box-shadow:0 0 60px #ef4444,inset 0 0 60px rgba(239,68,68,.4)}
.acts{position:absolute;left:0;right:0;bottom:-10px;z-index:6;display:flex;justify-content:center;gap:24px}
.act{background:#4f46e5;color:#fff;font-size:44px;font-weight:700;padding:22px 40px;border-radius:24px;box-shadow:0 14px 40px rgba(0,0,0,.5)}
.search{margin:6px 24px 12px;background:#fff;border-radius:40px;padding:20px 28px;font-size:30px;box-shadow:0 4px 18px rgba(0,0,0,.12)}
.mini{position:relative;height:300px;overflow:hidden}.mini .map{position:absolute;inset:0}
.mp{position:absolute;width:64px;height:64px;border-radius:99px 99px 99px 0;transform:rotate(-45deg);background:#ef4444;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:30px}
.res{padding:20px 30px;border-bottom:2px solid #e2e8f0;font-size:32px}.res.you{background:#fee2e2;color:#991b1b}
.br{position:absolute;background:#f8fafc;color:#0f172a;border-radius:30px;overflow:hidden;box-shadow:0 30px 100px rgba(0,0,0,.6)}
.brbar{height:76px;background:#e2e8f0;display:flex;align-items:center;gap:12px;padding:0 26px}.brbar i{width:22px;height:22px;border-radius:99px;background:#cbd5e1}
.url{margin-left:20px;flex:1;background:#fff;border-radius:30px;padding:10px 24px;font-size:24px;color:#475569;font-family:'Geist Mono'}
.brin{padding:40px 54px;font-family:Geist}.brin h1{font-size:54px;letter-spacing:-.02em;margin:0 0 30px}.brin h2{font-size:50px;margin:0 0 34px}
.ln{height:24px;border-radius:12px;background:#e2e8f0;margin:22px 0}.ln.s{width:70%}
.promise{position:relative;font-size:44px;font-weight:700;padding:16px 20px;border-radius:14px;margin:20px -20px}
.strike{position:absolute;left:0;top:50%;height:10px;background:#ef4444;border-radius:5px}
.stamp{position:absolute;right:90px;top:560px;border:14px solid #ef4444;color:#ef4444;font-size:150px;font-weight:900;padding:6px 40px;border-radius:24px;letter-spacing:.04em;background:rgba(10,10,11,.2)}
.gcard{position:absolute;left:50px;top:220px;width:480px;background:#f8fafc;color:#0f172a;border-radius:34px;overflow:hidden;padding-top:20px;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.gcard .gtabs{display:none}.facts{padding:20px 32px 30px}.fact{font-size:30px;margin:12px 0;color:#065f46;font-weight:600}
.flow{position:absolute;left:520px;top:520px;width:200px;height:20px}.flow i{position:absolute;top:0;width:26px;height:26px;border-radius:99px;background:#a5b4fc;box-shadow:0 0 20px #6366f1}
.doc{position:absolute;right:50px;top:330px;width:340px;background:#fff;color:#0f172a;border-radius:26px;padding:30px;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.doch{font-size:34px;font-weight:800;margin-bottom:12px}.dl{background:#eef2ff;border-radius:12px;padding:10px 14px;margin:12px 0;font-size:24px;min-height:30px}
.ctaold{font-size:40px;color:#4338ca;font-weight:700;text-decoration:line-through;text-decoration-thickness:6px;overflow:hidden;margin:20px 0}
.ctanew{font-size:46px;font-weight:700;background:#dcfce7;border-radius:16px;padding:18px 24px;margin:20px 0}
.tb{width:100%;border-collapse:collapse;font-size:34px}.tb td{padding:22px 14px;border-bottom:2px solid #e2e8f0}.tb td:last-child{text-align:right;color:#64748b;font-family:'Geist Mono';font-size:26px}
.tb tr.real td:last-child{color:#059669}
.opts{display:flex;gap:30px}.opt{flex:1;background:#f1f5f9;border-radius:24px;padding:30px;display:flex;flex-direction:column;gap:20px;font-size:30px}.opt b{font-size:38px}.opt.us{background:#eef2ff}
.mean{color:#b91c1c;font-weight:700;text-decoration:line-through;text-decoration-thickness:5px}
.audit{padding:16px 34px}.auh{font-size:48px;font-weight:800;color:#4338ca}.aus{font-size:30px;color:#475569}
.minigrid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:22px 30px}.minigrid i{display:block;aspect-ratio:1;border-radius:99px}
.aul{display:flex;justify-content:space-between;font-size:34px;padding:16px 0;border-bottom:2px solid #e2e8f0}
.ctab{position:absolute;left:50%;bottom:30px;z-index:5;background:#4f46e5;color:#fff;font-size:78px;font-weight:800;letter-spacing:-.03em;padding:26px 56px;border-radius:36px;box-shadow:0 20px 70px rgba(79,70,229,.7);white-space:nowrap;text-align:center}
.ctab span{display:block;font-family:'Geist Mono';font-size:36px;font-weight:600;margin-top:6px;color:#e0e7ff}
`
