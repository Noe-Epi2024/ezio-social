// Scout v2 : plus de relief (lumière principale, occlusion, liseré indigo, joints métalliques)
// et plus de détails techniques (panneaux, vis, voyants, articulations segmentées).
// Trois silhouettes à comparer : 'capsule', 'casque', 'facettes'.
// scoutSvg({ variant, expr, mouth, blink, look, loupe, count, wave, tilt, bob, glow, markHref, id, size })

const LED = '#c7d2fe', LED2 = '#818cf8'

function defs(p) {
  return `<defs>
  <linearGradient id="${p}shell" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#eeedf8"/><stop offset="1" stop-color="#b3afd6"/></linearGradient>
  <linearGradient id="${p}shell2" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#e9e7f6"/><stop offset="1" stop-color="#9e99c9"/></linearGradient>
  <linearGradient id="${p}indigo" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#818cf8"/><stop offset=".5" stop-color="#4f46e5"/><stop offset="1" stop-color="#2e2a7a"/></linearGradient>
  <linearGradient id="${p}metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0e7ff"/><stop offset=".35" stop-color="#8b8fb8"/><stop offset=".7" stop-color="#4b4f73"/><stop offset="1" stop-color="#9aa0c8"/></linearGradient>
  <linearGradient id="${p}visor" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#26225e"/><stop offset=".55" stop-color="#0b0a1f"/><stop offset="1" stop-color="#17143d"/></linearGradient>
  <radialGradient id="${p}ao" cx="60%" cy="95%" r="70%"><stop offset="0" stop-color="#3b3577" stop-opacity=".55"/><stop offset="1" stop-color="#3b3577" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}key" cx="30%" cy="18%" r="45%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}halo"><stop offset="0" stop-color="#818cf8" stop-opacity=".9"/><stop offset=".5" stop-color="#6366f1" stop-opacity=".35"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></radialGradient>
  <radialGradient id="${p}lens" cx="38%" cy="32%" r="78%"><stop offset="0" stop-color="#818cf8" stop-opacity=".8"/><stop offset=".6" stop-color="#3730a3" stop-opacity=".9"/><stop offset="1" stop-color="#1e1b4b"/></radialGradient>
  <radialGradient id="${p}screw" cx="35%" cy="30%"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#a5a8c8"/><stop offset="1" stop-color="#5b5f85"/></radialGradient>
  <filter id="${p}glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="${p}blur8"><feGaussianBlur stdDeviation="8"/></filter>
  <filter id="${p}blur3"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="${p}drop" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0a0820" flood-opacity=".45"/></filter>
</defs>`
}

// une pièce en volume : base + lumière principale + occlusion + liseré indigo (lumière de contre-jour)
let uid = 0
function vol(p, d, fill = 'shell', o = {}) {
  const c = `${p}c${uid++}`
  return `<clipPath id="${c}"><path d="${d}"/></clipPath>
  <g filter="${o.drop === false ? '' : `url(#${p}drop)`}"><path d="${d}" fill="url(#${p}${fill})"/></g>
  <g clip-path="url(#${c})">
    <path d="${d}" fill="url(#${p}ao)"/>
    <path d="${d}" fill="url(#${p}key)" opacity="${o.key ?? .8}"/>
    <path d="${d}" fill="none" stroke="#a5b4fc" stroke-width="${o.rim ?? 14}" opacity=".55" transform="translate(-6 -8)" filter="url(#${p}blur3)"/>
    <path d="${d}" fill="none" stroke="#ffffff" stroke-width="10" opacity=".7" transform="translate(5 7)" filter="url(#${p}blur3)"/>
  </g>
  <path d="${d}" fill="none" stroke="#6b66a6" stroke-width="2.5" opacity=".55"/>`
}
const screw = (p, x, y, r = 7) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}screw)"/><path d="M${x - r * .6} ${y} L${x + r * .6} ${y}" stroke="#4b4f73" stroke-width="2"/>`
const seam = (d) => `<path d="${d}" fill="none" stroke="#8f8ab9" stroke-width="3" opacity=".7"/><path d="${d}" fill="none" stroke="#fff" stroke-width="2" opacity=".8" transform="translate(0 3)"/>`
const led = (p, x, y, c = '#818cf8', r = 6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" filter="url(#${p}glow)"/>`

function face(o) {
  const expr = o.expr || 'neutral', mouth = o.mouth ?? 0, blink = o.blink ?? 1
  const [lx, ly] = o.look || [0, 0], ex = lx * 12, ey = ly * 8, cy = o.faceY ?? -118
  const eyeH = Math.max(6, 74 * blink)
  const eye = (cx) => `<rect x="${cx - 26 + ex}" y="${cy - eyeH / 2 + ey}" width="52" height="${eyeH}" rx="24" fill="${LED}"/>` +
    (blink > .5 ? `<rect x="${cx - 14 + ex}" y="${cy - eyeH / 2 + 10 + ey}" width="14" height="${eyeH * .28}" rx="7" fill="#fff" opacity=".85"/>` : '')
  const arc = (cx) => `<path d="M${cx - 30 + ex} ${cy + 14 + ey} Q${cx + ex} ${cy - 30 + ey} ${cx + 30 + ex} ${cy + 14 + ey}" stroke="${LED}" stroke-width="17" stroke-linecap="round" fill="none"/>`
  let eyes
  if (expr === 'happy') eyes = arc(-64) + arc(64)
  else if (expr === 'wow') eyes = [-64, 64].map((x) => `<circle cx="${x + ex}" cy="${cy + ey}" r="31" fill="none" stroke="${LED}" stroke-width="15"/>`).join('')
  else if (expr === 'think') eyes = eye(-64) + `<rect x="${38 + ex}" y="${cy - 6 + ey}" width="52" height="${Math.max(6, 22 * blink)}" rx="10" fill="${LED}"/>`
  else eyes = eye(-64) + eye(64)
  const B = { worried: ['M-96 -172 L-42 -186', 'M42 -186 L96 -172'], explain: ['M-94 -180 Q-64 -194 -38 -184', 'M38 -188 Q64 -200 94 -186'], think: ['M-94 -180 Q-64 -190 -38 -182', 'M38 -198 Q64 -210 94 -194'] }[expr]
  const brows = B ? B.map((d) => `<path d="${d}" transform="translate(0 ${cy + 118})" stroke="${LED2}" stroke-width="12" stroke-linecap="round" fill="none"/>`).join('') : ''
  const smile = { happy: 18, explain: 6, neutral: 4, worried: -10, think: -2, wow: 0 }[expr] ?? 4
  const my = cy + 76, mo = mouth * 46
  const m = mo < 5 ? `<path d="M-36 ${my} Q0 ${my + smile} 36 ${my}" stroke="${LED}" stroke-width="12" stroke-linecap="round" fill="none"/>`
    : `<rect x="${-(42 - mouth * 8)}" y="${my - 16}" width="${(42 - mouth * 8) * 2}" height="${mo}" rx="${Math.min(42, mo / 2 + 6)}" fill="${LED}"/><rect x="${-(30 - mouth * 6)}" y="${my - 16 + mo * .55}" width="${(30 - mouth * 6) * 2}" height="${mo * .3}" rx="6" fill="${LED2}"/>`
  // trame de pixels discrète sur l'écran
  return `<g filter="url(#${o.p}glow)">${brows}${eyes}${m}</g>`
}

function arms(p, o) {
  const count = o.count || 0, wave = o.wave || 0, loupe = o.loupe || 'none'
  const L = count || wave ? { s: [-98, 66], e: [-196, 70], h: [-244, -4 - wave * 14], r: -14 + (wave ? Math.sin(wave * Math.PI * 4) * 14 : 0) } : { s: [-98, 66], e: [-158, 120], h: [-160, 190], r: 12 }
  // bras droit : 'rest' (au repos), 'point' (montre vers le haut, vers la carte), 'wave' (coucou) ; la loupe n'est plus dessinée par défaut
  const rp = o.rpose || 'rest'
  const R = loupe === 'raise' ? { s: [98, 66], e: [182, 40], h: [196, -22], r: 28 } : loupe === 'inspect' ? { s: [98, 66], e: [164, 64], h: [112, -8], r: -55 }
    : rp === 'point' ? { s: [98, 66], e: [196, 70], h: [246, -10], r: 18 } : rp === 'wave' ? { s: [98, 66], e: [196, 70], h: [244, -4 - wave * 14], r: 14 - Math.sin(wave * Math.PI * 4) * 14 }
    : { s: [98, 66], e: [158, 120], h: [160, 190], r: -12 }
  const seg = (a, b, w) => { const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI
    return `<g transform="translate(${a[0]} ${a[1]}) rotate(${ang})">${vol(p, `M0 ${-w / 2} L${len} ${-w * .42} A${w * .42} ${w * .42} 0 0 1 ${len} ${w * .42} L0 ${w / 2} A${w / 2} ${w / 2} 0 0 1 0 ${-w / 2}Z`, 'shell', { drop: false, rim: 8 })}<path d="M${len * .3} ${-w / 2 + 3} L${len * .3} ${w / 2 - 3}" stroke="#8f8ab9" stroke-width="2.5" opacity=".7"/></g>` }
  const joint = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${p}metal)"/><circle cx="${x}" cy="${y}" r="${r * .45}" fill="url(#${p}indigo)"/><circle cx="${x - r * .3}" cy="${y - r * .35}" r="${r * .22}" fill="#fff" opacity=".7"/>`
  const fingers = (n) => [0, 1, 2].map((i) => { const up = i < n, a = -28 + i * 28
    return `<g transform="rotate(${a})"><rect x="-10" y="${up ? -72 : -44}" width="20" height="${up ? 48 : 24}" rx="10" fill="url(#${p}shell2)"/>${up ? `<rect x="-10" y="-50" width="20" height="4" fill="#8f8ab9" opacity=".7"/>` : ''}</g>` }).join('')
  const hand = (a, n, flip) => `<g transform="translate(${a.h[0]} ${a.h[1]}) rotate(${a.r}) scale(${flip ? -1 : 1} 1)">${fingers(n)}<rect x="-30" y="-30" width="60" height="58" rx="24" fill="url(#${p}shell)"/><rect x="-30" y="-30" width="60" height="58" rx="24" fill="url(#${p}ao)"/><rect x="-30" y="12" width="60" height="10" fill="url(#${p}indigo)" opacity=".9"/><g transform="rotate(-60) translate(0 -26)"><rect x="-9" y="-26" width="18" height="30" rx="9" fill="url(#${p}shell2)"/></g></g>`
  const loupeSvg = `<g transform="translate(${R.h[0]} ${R.h[1]}) rotate(${R.r})">
    <rect x="-14" y="-6" width="28" height="118" rx="14" fill="url(#${p}indigo)"/>
    ${[18, 40, 62, 84].map((y) => `<rect x="-14" y="${y}" width="28" height="5" fill="#2e2a7a" opacity=".8"/>`).join('')}
    <rect x="-17" y="-16" width="34" height="22" rx="6" fill="url(#${p}metal)"/>
    <g transform="translate(0 -100)">
      <circle r="86" fill="url(#${p}lens)"/>
      ${o.markHref ? `<image href="${o.markHref}" x="-50" y="-50" width="100" height="100" opacity=".95"/>` : ''}
      <circle r="86" fill="none" stroke="url(#${p}metal)" stroke-width="22"/>
      <circle r="86" fill="none" stroke="url(#${p}indigo)" stroke-width="10"/>
      ${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a + 45})">${screw(p, 0, -86, 6)}</g>`).join('')}
      <path d="M-56 -36 Q-44 -62 -14 -70" stroke="#fff" stroke-width="11" stroke-linecap="round" fill="none" opacity=".6"/>
      <path d="M40 54 Q52 42 58 26" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".3"/>
    </g></g>`
  return {
    back: seg(L.s, L.e, 34) + seg(L.e, L.h, 30) + joint(...L.e, 18) + joint(...L.s, 22),
    front: seg(R.s, R.e, 34) + seg(R.e, R.h, 30) + joint(...R.e, 18) + joint(...R.s, 22) + (loupe === 'none' ? '' : loupeSvg) + hand(R, loupe === 'none' && rp === 'point' ? 1 : 0, true),
    backHand: hand(L, count, false),
  }
}

const HEADS = {
  capsule: (p, o) => {
    const d = 'M-190 -150 C-190 -250 -130 -290 0 -290 C130 -290 190 -250 190 -150 L190 -40 C190 10 150 22 0 22 C-150 22 -190 10 -190 -40Z'
    return `
    <g transform="translate(-206 -118)">${vol(p, 'M-26 -46 L18 -40 L18 40 L-26 46 C-40 30 -40 -30 -26 -46Z', 'indigo', { key: .4, rim: 6 })}${[-24, 0, 24].map((y) => `<rect x="-30" y="${y - 3}" width="40" height="5" rx="2" fill="#1e1b4b" opacity=".6"/>`).join('')}</g>
    <g transform="translate(206 -118) scale(-1 1)">${vol(p, 'M-26 -46 L18 -40 L18 40 L-26 46 C-40 30 -40 -30 -26 -46Z', 'indigo', { key: .4, rim: 6 })}${[-24, 0, 24].map((y) => `<rect x="-30" y="${y - 3}" width="40" height="5" rx="2" fill="#1e1b4b" opacity=".6"/>`).join('')}</g>
    ${vol(p, d)}
    ${seam('M-120 -278 Q0 -300 120 -278')}${seam('M-188 -60 L-150 -60')}${seam('M188 -60 L150 -60')}
    ${screw(p, -168, -200)}${screw(p, 168, -200)}${screw(p, -168, -20)}${screw(p, 168, -20)}
    <rect x="-156" y="-238" width="312" height="226" rx="96" fill="#d6d3ec"/>
    <rect x="-150" y="-232" width="300" height="214" rx="92" fill="url(#${p}visor)"/>
    <path d="M-120 -200 Q-80 -226 -20 -228 L-60 -150 Q-110 -150 -132 -128Z" fill="#fff" opacity=".08"/>
    ${face({ ...o, p })}
    <rect x="-38" y="-312" width="76" height="26" rx="10" fill="url(#${p}metal)"/>${led(p, -18, -299, '#a5b4fc', 4)}${led(p, 0, -299, '#818cf8', 4)}${led(p, 18, -299, '#34d399', 4)}
    <path d="M24 -312 L24 -360" stroke="#9aa0c8" stroke-width="9" stroke-linecap="round"/><circle cx="24" cy="-366" r="15" fill="#818cf8" filter="url(#${p}glow)"/><circle cx="19" cy="-371" r="5" fill="#fff" opacity=".8"/>`
  },
  casque: (p, o) => {
    const d = 'M-200 -110 C-200 -250 -110 -305 0 -305 C110 -305 200 -250 200 -110 C200 -30 170 20 120 30 L-120 30 C-170 20 -200 -30 -200 -110Z'
    return `
    ${[-1, 1].map((s) => `<g transform="translate(${s * 206} -110) scale(${s} 1)"><circle r="52" fill="url(#${p}metal)"/>${vol(p, 'M-40 0 A40 40 0 1 1 40 0 A40 40 0 1 1 -40 0Z', 'shell', { drop: false, rim: 6 })}<circle r="22" fill="url(#${p}indigo)"/>${led(p, 0, 0, '#a5b4fc', 7)}<path d="M20 -48 L44 -96" stroke="url(#${p}metal)" stroke-width="8" stroke-linecap="round"/><circle cx="46" cy="-100" r="8" fill="#818cf8" filter="url(#${p}glow)"/></g>`).join('')}
    ${vol(p, d)}
    ${seam('M-200 -110 Q0 -150 200 -110')}${seam('M0 -305 L0 -248')}
    ${screw(p, -120, -258)}${screw(p, 120, -258)}
    <path d="M-170 -196 C-170 -230 -120 -244 0 -244 C120 -244 170 -230 170 -196 L170 -60 C170 -10 120 0 0 0 C-120 0 -170 -10 -170 -60Z" fill="#d6d3ec"/>
    <path d="M-162 -190 C-162 -224 -116 -236 0 -236 C116 -236 162 -224 162 -190 L162 -62 C162 -18 116 -8 0 -8 C-116 -8 -162 -18 -162 -62Z" fill="url(#${p}visor)"/>
    <path d="M-140 -200 Q-60 -232 40 -228 L-20 -160 Q-110 -150 -146 -120Z" fill="#fff" opacity=".08"/>
    ${face({ ...o, p, faceY: -128 })}
    <rect x="-70" y="12" width="140" height="22" rx="10" fill="url(#${p}indigo)"/>${led(p, -40, 23, '#a5b4fc', 4)}${led(p, 40, 23, '#a5b4fc', 4)}`
  },
  facettes: (p, o) => {
    const d = 'M-130 -290 L130 -290 L196 -224 L196 -20 L150 24 L-150 24 L-196 -20 L-196 -224Z'
    return `
    ${[-1, 1].map((s) => `<g transform="translate(${s * 208} -128) scale(${s} 1)">${vol(p, 'M-14 -62 L22 -44 L22 44 L-14 62Z', 'indigo', { key: .35, rim: 5 })}${led(p, 6, 0, '#a5b4fc', 6)}</g>`).join('')}
    ${vol(p, d)}
    ${seam('M-130 -290 L-100 -250 L100 -250 L130 -290')}${seam('M-196 -224 L-160 -200')}${seam('M196 -224 L160 -200')}${seam('M-150 24 L-120 -4 L120 -4 L150 24')}
    ${screw(p, -150, -250)}${screw(p, 150, -250)}${screw(p, -176, -40)}${screw(p, 176, -40)}
    <path d="M-150 -236 L150 -236 L168 -210 L168 -48 L140 -14 L-140 -14 L-168 -48 L-168 -210Z" fill="#d6d3ec"/>
    <path d="M-144 -230 L144 -230 L162 -206 L162 -50 L136 -20 L-136 -20 L-162 -50 L-162 -206Z" fill="url(#${p}visor)"/>
    <path d="M-140 -222 L20 -222 L-60 -150 L-156 -150Z" fill="#fff" opacity=".07"/>
    ${face({ ...o, p, faceY: -130 })}
    <path d="M-30 -290 L-30 -320 L30 -320 L30 -290Z" fill="url(#${p}metal)"/>${led(p, 0, -305, '#818cf8', 6)}
    <path d="M0 -320 L0 -358" stroke="#9aa0c8" stroke-width="8"/><path d="M-14 -358 L14 -358 L0 -382Z" fill="#818cf8" filter="url(#${p}glow)"/>`
  },
}

const BODIES = {
  capsule: (p) => {
    const d = 'M-104 72 C-108 30 108 30 104 72 C114 164 64 232 0 232 C-64 232 -114 164 -104 72Z'
    return `${vol(p, d)}${seam('M-100 150 Q0 172 100 150')}
    <path d="M-62 92 L62 92 L54 136 L-54 136Z" fill="url(#${p}indigo)"/><path d="M-50 100 L50 100 L44 128 L-44 128Z" fill="url(#${p}visor)"/>
    ${[-28, -8, 12].map((x, i) => `<rect x="${x}" y="108" width="14" height="${10 + i * 2}" rx="3" fill="#818cf8" filter="url(#${p}glow)" opacity="${.6 + i * .15}"/>`).join('')}${led(p, 36, 114, '#34d399', 5)}
    ${screw(p, -78, 100, 6)}${screw(p, 78, 100, 6)}
    <rect x="-46" y="14" width="92" height="40" rx="14" fill="url(#${p}metal)"/>${[24, 34, 44].map((y) => `<rect x="-46" y="${y}" width="92" height="3" fill="#4b4f73" opacity=".6"/>`).join('')}`
  },
  casque: (p) => {
    const d = 'M-96 70 C-96 40 96 40 96 70 L90 150 C86 176 60 186 0 186 C-60 186 -86 176 -90 150Z'
    const hip = 'M-60 196 C-60 186 60 186 60 196 C60 236 30 250 0 250 C-30 250 -60 236 -60 196Z'
    return `${vol(p, hip, 'shell2')}<rect x="-74" y="176" width="148" height="18" rx="9" fill="url(#${p}metal)"/>${vol(p, d)}
    <circle cx="0" cy="116" r="40" fill="url(#${p}metal)"/><circle cx="0" cy="116" r="30" fill="url(#${p}visor)"/>
    <circle cx="0" cy="116" r="18" fill="none" stroke="#818cf8" stroke-width="6" filter="url(#${p}glow)"/>${led(p, 0, 116, '#c7d2fe', 6)}
    ${seam('M-92 90 L-52 90')}${seam('M92 90 L52 90')}${screw(p, -70, 150, 6)}${screw(p, 70, 150, 6)}
    <rect x="-44" y="18" width="88" height="34" rx="12" fill="url(#${p}metal)"/>`
  },
  facettes: (p) => {
    const d = 'M-100 52 L100 52 L112 96 L82 206 L40 236 L-40 236 L-82 206 L-112 96Z'
    return `${vol(p, d)}${seam('M-112 96 L112 96')}${seam('M-82 206 L82 206')}
    <path d="M-56 110 L56 110 L46 176 L-46 176Z" fill="url(#${p}indigo)"/><path d="M-44 118 L44 118 L36 168 L-36 168Z" fill="url(#${p}visor)"/>
    <path d="M-30 150 L-14 136 L0 146 L14 128 L30 140" stroke="#818cf8" stroke-width="5" fill="none" filter="url(#${p}glow)"/>
    ${screw(p, -88, 70, 6)}${screw(p, 88, 70, 6)}${screw(p, 0, 222, 6)}
    <path d="M-44 14 L44 14 L52 50 L-52 50Z" fill="url(#${p}metal)"/>`
  },
}

export function scoutSvg(o = {}) {
  const p = o.id || 's', v = o.variant || 'capsule'
  const tilt = o.tilt || 0, bob = o.bob || 0, glow = o.glow ?? .7
  const a = arms(p, o)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-360 -400 720 800" width="${o.size || 640}" height="${(o.size || 640) * 800 / 720}">${defs(p)}
<ellipse cx="0" cy="350" rx="${140 - bob}" ry="22" fill="url(#${p}halo)" opacity="${.5 + glow * .5}"/>
<g transform="translate(0 ${bob}) rotate(${tilt} 0 80)">
  <ellipse cx="0" cy="${v === 'casque' ? 272 : 258}" rx="${50 + glow * 10}" ry="${28 + glow * 24}" fill="url(#${p}halo)" filter="url(#${p}blur8)"/>
  <path d="M-30 ${v === 'casque' ? 246 : 228} L30 ${v === 'casque' ? 246 : 228} L20 ${v === 'casque' ? 272 : 256} L-20 ${v === 'casque' ? 272 : 256}Z" fill="url(#${p}metal)"/>
  <ellipse cx="0" cy="${v === 'casque' ? 272 : 256}" rx="20" ry="7" fill="#c7d2fe" filter="url(#${p}glow)"/>
  ${a.back}
  ${BODIES[v](p)}
  <g transform="rotate(${tilt * .6} 0 20)">${HEADS[v](p, o)}</g>
  ${a.front}
  ${a.backHand}
</g></svg>`
}
