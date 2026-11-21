// Scout, la mascotte d'EZIO : petit robot génie technique, coque blanc nacré, visière LED indigo,
// grosse tête, petit corps, flotte sur un halo, tient une loupe au logo EZIO.
// scoutSvg(opts) renvoie un <svg> autonome. Toutes les poses/expressions sont des paramètres,
// pour que render-short.mjs puisse l'animer image par image.
//
// opts : { expr: 'neutral'|'happy'|'worried'|'explain'|'think'|'wow', mouth: 0..1, blink: 0..1 (1 = ouvert),
//          look: [-1..1, -1..1], loupe: 'hold'|'raise'|'inspect', wave: 0..1, count: 0|1|2|3 (doigts levés main gauche),
//          tilt: degrés, bob: px, glow: 0..1, markHref: url du logo blanc, id: préfixe unique }
export function scoutSvg(o = {}) {
  const p = o.id || 's'
  const expr = o.expr || 'neutral', mouth = o.mouth ?? 0, blink = o.blink ?? 1
  const [lx, ly] = o.look || [0, 0], tilt = o.tilt || 0, bob = o.bob || 0, glow = o.glow ?? 0.6
  const LED = '#c7d2fe', LED2 = '#818cf8'

  // ---- visage LED ----
  const ex = lx * 10, ey = ly * 8
  let eyes = '', brows = '', mouthSvg = ''
  const eyeH = Math.max(6, 70 * blink)
  const eye = (cx) => `<rect x="${cx - 24 + ex}" y="${-118 - eyeH / 2 + ey}" width="48" height="${eyeH}" rx="22" fill="${LED}"/>`
  const arcEye = (cx) => `<path d="M${cx - 28 + ex} ${-104 + ey} Q${cx + ex} ${-146 + ey} ${cx + 28 + ex} ${-104 + ey}" stroke="${LED}" stroke-width="16" stroke-linecap="round" fill="none"/>`
  if (expr === 'happy') eyes = arcEye(-62) + arcEye(62)
  else if (expr === 'wow') eyes = `<circle cx="${-62 + ex}" cy="${-118 + ey}" r="${30 * Math.max(.2, blink)}" fill="none" stroke="${LED}" stroke-width="14"/><circle cx="${62 + ex}" cy="${-118 + ey}" r="${30 * Math.max(.2, blink)}" fill="none" stroke="${LED}" stroke-width="14"/>`
  else if (expr === 'think') eyes = eye(-62) + `<rect x="${38 + ex}" y="${-122 + ey}" width="48" height="${Math.max(6, 22 * blink)}" rx="10" fill="${LED}"/>`
  else eyes = eye(-62) + eye(62)
  if (expr === 'worried') brows = `<path d="M-92 -170 L-40 -184" stroke="${LED2}" stroke-width="12" stroke-linecap="round"/><path d="M40 -184 L92 -170" stroke="${LED2}" stroke-width="12" stroke-linecap="round"/>`
  if (expr === 'explain' || expr === 'think') brows = `<path d="M-90 -178 Q-62 -190 -36 -180" stroke="${LED2}" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M36 ${expr === 'think' ? -194 : -186} Q62 ${expr === 'think' ? -206 : -196} 90 ${expr === 'think' ? -192 : -184}" stroke="${LED2}" stroke-width="11" stroke-linecap="round" fill="none"/>`
  const smile = { happy: 16, explain: 6, neutral: 4, worried: -10, think: -2, wow: 0 }[expr] ?? 4
  const mo = mouth * 46
  if (mo < 5) mouthSvg = `<path d="M-34 -42 Q0 ${-42 + smile} 34 -42" stroke="${LED}" stroke-width="12" stroke-linecap="round" fill="none"/>`
  else {
    const w = 40 - mouth * 8
    mouthSvg = `<rect x="${-w}" y="${-58 + Math.min(0, -smile / 3)}" width="${w * 2}" height="${mo}" rx="${Math.min(w, mo / 2 + 6)}" fill="${LED}"/>` +
      `<rect x="${-w + 10}" y="${-58 + mo * 0.55}" width="${(w - 10) * 2}" height="${mo * 0.3}" rx="6" fill="${LED2}" opacity=".7"/>`
  }

  // ---- bras gauche (compte sur les doigts / fait coucou) et bras droit (loupe) ----
  const count = o.count || 0, wave = o.wave || 0
  const lArm = count || wave
    ? { sh: [-92, 70], el: [-170, 30], ha: [-190, -40 - wave * 20], rot: -10 + Math.sin(wave * Math.PI * 4) * 14 * (wave ? 1 : 0) }
    : { sh: [-92, 70], el: [-150, 130], ha: [-150, 190], rot: 10 }
  const loupe = o.loupe || 'hold'
  const rArm = loupe === 'raise' ? { sh: [92, 70], el: [185, 40], ha: [195, -20], rot: 28 }
    : loupe === 'inspect' ? { sh: [92, 70], el: [160, 60], ha: [110, -10], rot: -55 }
      : { sh: [92, 70], el: [160, 130], ha: [175, 175], rot: 20 }
  const arm = (a, side) => `<path d="M${a.sh[0]} ${a.sh[1]} Q${a.el[0]} ${a.el[1]} ${a.ha[0]} ${a.ha[1]}" stroke="url(#${p}arm)" stroke-width="30" stroke-linecap="round" fill="none"/>` +
    `<circle cx="${a.sh[0]}" cy="${a.sh[1]}" r="20" fill="#4f46e5"/><circle cx="${a.sh[0]}" cy="${a.sh[1]}" r="9" fill="#a5b4fc"/>`
  const fingers = (n) => [0, 1, 2].map((i) => {
    const up = i < n, ang = -30 + i * 30
    return `<rect x="-9" y="${up ? -66 : -40}" width="18" height="${up ? 44 : 22}" rx="9" fill="url(#${p}shell)" transform="rotate(${ang})"/>`
  }).join('')
  const hand = (a, n, flip) => `<g transform="translate(${a.ha[0]} ${a.ha[1]}) rotate(${a.rot}) scale(${flip ? -1 : 1} 1)">${fingers(n)}<circle r="30" fill="url(#${p}shell)"/><circle r="30" fill="url(#${p}shade)"/></g>`

  // loupe : manche + bague indigo + verre teinté, logo EZIO au centre
  const L = rArm.ha
  const loupeSvg = `<g transform="translate(${L[0]} ${L[1]}) rotate(${rArm.rot})">
    <rect x="-13" y="-10" width="26" height="110" rx="13" fill="url(#${p}handle)"/>
    <rect x="-13" y="-10" width="26" height="22" rx="8" fill="#a5b4fc"/>
    <g transform="translate(0 -95)">
      <circle r="82" fill="url(#${p}lens)"/>
      <circle r="82" fill="none" stroke="url(#${p}ring)" stroke-width="20"/>
      <circle r="82" fill="none" stroke="#e0e7ff" stroke-width="3" opacity=".6"/>
      ${o.markHref ? `<image href="${o.markHref}" x="-46" y="-46" width="92" height="92" opacity=".95"/>` : ''}
      <path d="M-52 -36 Q-40 -58 -12 -66" stroke="#fff" stroke-width="10" stroke-linecap="round" fill="none" opacity=".55"/>
    </g></g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-350 -380 700 760" width="${o.size || 640}" height="${(o.size || 640) * 760 / 700}">
<defs>
  <radialGradient id="${p}shell" cx="32%" cy="26%" r="85%"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#f1f0fb"/><stop offset=".8" stop-color="#cfcce6"/><stop offset="1" stop-color="#9f9bc7"/></radialGradient>
  <radialGradient id="${p}shade" cx="70%" cy="80%" r="60%"><stop offset="0" stop-color="#6d68a8" stop-opacity=".35"/><stop offset="1" stop-color="#6d68a8" stop-opacity="0"/></radialGradient>
  <linearGradient id="${p}arm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c4c0e0"/></linearGradient>
  <linearGradient id="${p}visor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset=".6" stop-color="#0b0a1f"/><stop offset="1" stop-color="#151236"/></linearGradient>
  <linearGradient id="${p}handle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#312e81"/><stop offset=".45" stop-color="#6366f1"/><stop offset="1" stop-color="#312e81"/></linearGradient>
  <linearGradient id="${p}ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a5b4fc"/><stop offset=".5" stop-color="#4f46e5"/><stop offset="1" stop-color="#312e81"/></linearGradient>
  <radialGradient id="${p}lens" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#6366f1" stop-opacity=".85"/><stop offset="1" stop-color="#1e1b4b" stop-opacity=".95"/></radialGradient>
  <radialGradient id="${p}halo"><stop offset="0" stop-color="#818cf8" stop-opacity=".9"/><stop offset=".5" stop-color="#6366f1" stop-opacity=".35"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></radialGradient>
  <filter id="${p}glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="${p}soft"><feGaussianBlur stdDeviation="10"/></filter>
</defs>
<ellipse cx="0" cy="330" rx="${130 - bob}" ry="22" fill="url(#${p}halo)" opacity="${0.5 + glow * 0.5}"/>
<g transform="translate(0 ${bob}) rotate(${tilt} 0 80)">
  <!-- réacteur -->
  <ellipse cx="0" cy="262" rx="${46 + glow * 10}" ry="${26 + glow * 22}" fill="url(#${p}halo)" filter="url(#${p}soft)"/>
  <path d="M-34 228 L34 228 L22 256 L-22 256Z" fill="#4f46e5"/><ellipse cx="0" cy="256" rx="22" ry="7" fill="#c7d2fe" filter="url(#${p}glow)"/>
  <!-- bras arrière (gauche) -->
  ${arm(lArm)}
  <!-- corps -->
  <path d="M-100 80 C-104 30 104 30 100 80 C110 170 60 236 0 236 C-60 236 -110 170 -100 80Z" fill="url(#${p}shell)"/>
  <path d="M-100 80 C-104 30 104 30 100 80 C110 170 60 236 0 236 C-60 236 -110 170 -100 80Z" fill="url(#${p}shade)"/>
  <rect x="-52" y="110" width="104" height="70" rx="26" fill="url(#${p}visor)"/>
  <g filter="url(#${p}glow)"><rect x="-34" y="136" width="${68 * (0.35 + glow * 0.65)}" height="12" rx="6" fill="#818cf8"/><circle cx="26" cy="162" r="6" fill="#a5b4fc"/></g>
  <!-- cou -->
  <rect x="-40" y="22" width="80" height="34" rx="14" fill="#4f46e5"/><rect x="-40" y="28" width="80" height="6" fill="#818cf8" opacity=".6"/>
  <!-- tête -->
  <g transform="rotate(${tilt * 0.6} 0 20)">
    <line x1="0" y1="-280" x2="0" y2="-340" stroke="#c4c0e0" stroke-width="10" stroke-linecap="round"/>
    <circle cx="0" cy="-344" r="${16 + glow * 3}" fill="#818cf8" filter="url(#${p}glow)"/><circle cx="-5" cy="-349" r="5" fill="#fff" opacity=".8"/>
    <circle cx="-198" cy="-110" r="34" fill="url(#${p}shell)"/><circle cx="-198" cy="-110" r="18" fill="#4f46e5"/><circle cx="-198" cy="-110" r="8" fill="#a5b4fc" filter="url(#${p}glow)"/>
    <circle cx="198" cy="-110" r="34" fill="url(#${p}shell)"/><circle cx="198" cy="-110" r="18" fill="#4f46e5"/><circle cx="198" cy="-110" r="8" fill="#a5b4fc" filter="url(#${p}glow)"/>
    <rect x="-185" y="-282" width="370" height="300" rx="120" fill="url(#${p}shell)"/>
    <rect x="-185" y="-282" width="370" height="300" rx="120" fill="url(#${p}shade)"/>
    <path d="M-120 -262 Q-40 -282 40 -268" stroke="#fff" stroke-width="16" stroke-linecap="round" fill="none" opacity=".9"/>
    <rect x="-148" y="-230" width="296" height="210" rx="92" fill="url(#${p}visor)"/>
    <rect x="-148" y="-230" width="296" height="210" rx="92" fill="none" stroke="#4f46e5" stroke-width="5" opacity=".7"/>
    <g filter="url(#${p}glow)">${brows}${eyes}${mouthSvg}</g>
    <path d="M-118 -196 Q-80 -222 -30 -224" stroke="#fff" stroke-width="10" stroke-linecap="round" fill="none" opacity=".22"/>
  </g>
  <!-- bras avant (droit) + loupe -->
  ${arm(rArm)}
  ${loupeSvg}
  ${hand(rArm, 0, true)}
  ${hand(lArm, count, false)}
</g></svg>`
}
