# Voix de synthèse d'un Reel Scout, phrase par phrase.
# Usage : GEMINI_API_KEY=… python3 shorts/tts-voice.py shorts/<spec>.json out/voix/<id>.wav [--voice Charon]
# - génère chaque phrase du script séparément (modèle de synthèse vocale de Google, voix « Charon » choisie par Noé le 22/11/2026) ;
# - les assemble avec 0,25 s en tête et 0,65 s de pause entre phrases, puis met le tout à -16 LUFS / -1,5 dBTP ;
# - écrit <sortie.wav>.cuts (frontières de phrases, pour render-short.mjs --cuts) et <sortie.wav>.words.json
#   (instant de chaque mot, pour --words : les sous-titres suivent la voix).
# La clé ne s'écrit jamais dans le dépôt. Domaine à autoriser : generativelanguage.googleapis.com.
import base64, json, os, re, subprocess, sys, time, urllib.request
import numpy as np

MODEL = 'gemini-3.8-flash-tts'
STYLE = """# AUDIO PROFILE: Scout
Petit robot mascotte d'une marque française de référencement local. Il présente des Reels Instagram courts à des artisans et commerçants.
### DIRECTOR'S NOTES
Style: chaleureux, dynamique, complice, un sourire dans la voix. Jamais robotique.
Pacing: débit naturel et fluide de créateur de contenu, sans précipitation.
Accent: français de France, standard.
Ne lis que la transcription ci-dessous, jamais ces notes.
## TRANSCRIPT"""
SR = 24000

def pcm_from(raw):
    # Le service renvoie parfois un WAV complet (en-tête RIFF + bloc LIST après les données) au lieu de PCM brut.
    # Lu comme des échantillons, cet en-tête donnait un claquement en tête de chaque phrase et un grésillement à la fin
    # (S48, signalé par Noé : « un bruit étrange après la première phrase »). On ne garde que le bloc « data ».
    if raw[:4] == b'RIFF':
        i = 12
        while i + 8 <= len(raw):
            cid, size = raw[i:i + 4], int.from_bytes(raw[i + 4:i + 8], 'little')
            if cid == b'data': raw = raw[i + 8:i + 8 + size]; break
            i += 8 + size + (size & 1)
    raw = raw[:len(raw) // 2 * 2]
    return np.frombuffer(raw, np.int16).astype(np.float32)

def trim(pcm):
    # retire les blancs de début et de fin (seuil à -45 dBFS), avec un fondu de 15 ms pour éviter tout clic
    hop = SR // 50; e = np.array([np.sqrt(np.mean(pcm[i:i + hop] ** 2)) for i in range(0, len(pcm) - hop, hop)])
    on = np.where(20 * np.log10(e / 32768 + 1e-9) > -45)[0]
    a, b = (on[0] * hop, (on[-1] + 1) * hop) if len(on) else (0, len(pcm))
    x = pcm[max(0, a - SR // 50):min(len(pcm), b + SR // 20)].copy()
    f = int(0.015 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    return x

def word_times(pcm, text):
    """Instant de début de chaque mot (en s, depuis le début de la phrase), mêmes mots que les sous-titres du rendu.
    Les pauses de la voix tombent sur la ponctuation : chaque groupe de mots entre deux ponctuations est calé sur la
    pause la plus proche de sa position attendue, puis ses mots sont répartis selon leur longueur."""
    ws = re.sub('[«»]', '', text).split()
    hop = SR // 100; db = np.array([20 * np.log10(np.sqrt(np.mean(pcm[i:i + hop] ** 2)) / 32768 + 1e-9) for i in range(0, len(pcm) - hop, hop)])
    on = db > -40; idx = np.where(on)[0]
    if not len(idx): return [0.0] * len(ws)
    s0, s1 = idx[0] / 100, (idx[-1] + 1) / 100
    gaps, run = [], 0
    for k in range(idx[0], idx[-1] + 1):
        if not on[k]: run += 1
        else:
            if run >= 12: gaps.append(((k - run) / 100, k / 100))
            run = 0
    # groupes : on coupe après un mot qui finit par une ponctuation (ou qui en est une, « : » isolé)
    groups, cur = [], []
    for k, w in enumerate(ws):
        cur.append(k)
        if re.search(r'[,.:;?!]$', w) and k < len(ws) - 1: groups.append(cur); cur = []
    if cur: groups.append(cur)
    L = [sum(len(ws[k]) + 1 for k in g) for g in groups]; tot = sum(L)
    speak = (s1 - s0) - sum(b - a for a, b in gaps)
    # cibles de chaque frontière de groupe (en temps de parole), puis affectation monotone aux pauses par
    # programmation dynamique : coût = écart à la cible, 0,6 s pour une frontière sans pause (elle sera interpolée)
    cum = np.cumsum(L)[:-1] / tot; K, M = len(cum), len(gaps)
    def at(frac):  # instant où l'on a prononcé cette fraction du texte, pauses comprises
        tt, left = s0, speak * frac
        for ga, gb in gaps:
            if ga - tt >= left: break
            left -= ga - tt; tt = gb
        return tt + left
    T = [at(c) for c in cum]; mid = [(ga + gb) / 2 for ga, gb in gaps]
    INF = 1e9; D = [[INF] * (M + 1) for _ in range(K + 1)]; P = [[None] * (M + 1) for _ in range(K + 1)]
    D[0][0] = 0  # D[i][j] : i frontières traitées, pauses < j disponibles
    for i in range(K + 1):
        for j in range(M + 1):
            if D[i][j] >= INF: continue
            if j < M and D[i][j] < D[i][j + 1]: D[i][j + 1], P[i][j + 1] = D[i][j], ('skip', None)
            if i < K:
                c = D[i][j] + 0.6
                if c < D[i + 1][j]: D[i + 1][j], P[i + 1][j] = c, ('none', None)
                if j < M and abs(mid[j] - T[i]) < 1.0:
                    c = D[i][j] + abs(mid[j] - T[i])
                    if c < D[i + 1][j + 1]: D[i + 1][j + 1], P[i + 1][j + 1] = c, ('gap', j)
    i, j, assign = K, min(range(M + 1), key=lambda j: D[K][j]), [None] * K
    while i > 0 or j > 0:
        op, g = P[i][j]
        if op == 'skip': j -= 1
        elif op == 'none': i -= 1
        else: assign[i - 1] = g; i -= 1; j -= 1
    bounds = []
    for i in range(K):
        if assign[i] is not None: bounds.append(gaps[assign[i]]); continue
        # interpolation entre les frontières affectées voisines, au prorata du texte
        lo_i = max([k for k in range(i) if assign[k] is not None], default=None)
        hi_i = min([k for k in range(i + 1, K) if assign[k] is not None], default=None)
        t0, f0 = (gaps[assign[lo_i]][1], cum[lo_i]) if lo_i is not None else (s0, 0.0)
        t1, f1 = (gaps[assign[hi_i]][0], cum[hi_i]) if hi_i is not None else (s1, 1.0)
        x = t0 + (t1 - t0) * (cum[i] - f0) / max(1e-6, f1 - f0); bounds.append((x, x))
    starts = [s0] + [b for a, b in bounds]; ends = [a for a, b in bounds] + [s1]
    out = [0.0] * len(ws)
    for g, (a, b) in enumerate(zip(starts, ends)):
        n = sum(len(ws[k]) + 1 for k in groups[g]); c = 0
        for k in groups[g]: out[k] = a + (b - a) * c / n; c += len(ws[k]) + 1
    return out

def say(text, voice, key, tries=6):
    body = {"contents": [{"parts": [{"text": f"{STYLE}\n{text}"}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    for t in range(tries):
        try:
            req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                                         data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": key})
            part = json.load(urllib.request.urlopen(req, timeout=120))["candidates"][0]["content"]["parts"][0]["inlineData"]
            return trim(pcm_from(base64.b64decode(part["data"])))
        except Exception as err:
            if t == tries - 1: raise
            wait = 35 if getattr(err, 'code', None) == 429 else 5  # offre gratuite : quelques requêtes par minute
            print('  nouvelle tentative :', getattr(err, 'code', err), f'(attente {wait} s)'); time.sleep(wait)

def main():
    args = sys.argv[1:]
    spec, out = json.load(open(args[0])), args[1]
    voice = args[args.index('--voice') + 1] if '--voice' in args else 'Charon'
    key = os.environ.get('GEMINI_API_KEY') or sys.exit('GEMINI_API_KEY manquante')
    sil = lambda d: np.zeros(int(d * SR), np.float32)
    parts, t, cuts, words = [sil(0.25)], 0.25, [], []
    cache = out + '.parts'; os.makedirs(cache, exist_ok=True)
    for i, s in enumerate(spec['segments']):
        # ≈ 18,5 caractères par seconde pour Charon (mesuré en S48, de 13 à 23 selon les pauses). Une prise trop longue
        # a souvent répété un morceau (S48 : 15,6 s pour ≈ 7 s attendues). On garde la première prise dans
        # [0,7 ; 1,45] × l'attendu, sinon la plus proche après 5 prises, refusée hors de [0,55 ; 1,6].
        expect = len(s['text']) / 18.5; f = os.path.join(cache, f'{i:02d}-{voice}.npy')
        ok = lambda x, lo=0.7, hi=1.45: lo * expect <= len(x) / SR <= hi * expect
        a = np.load(f) if os.path.exists(f) else None
        if a is None or not ok(a):
            takes = []
            for k in range(5):
                x = say(s['text'], voice, key); takes.append(x); time.sleep(6)
                if ok(x): break
                print(f"  phrase {i + 1} : prise de {len(x) / SR:.2f} s pour ≈ {expect:.1f} s attendues, nouvelle prise")
            a = min(takes, key=lambda x: abs(len(x) / SR - expect))
            if not ok(a, 0.55, 1.6): sys.exit(f'phrase {i + 1} : aucune prise de durée plausible')
        np.save(f, a); words.append([round(t + w, 3) for w in word_times(a, s['text'])]); parts.append(a); t += len(a) / SR
        print(f"  phrase {i + 1} : {len(a) / SR:.2f} s (≈ {expect:.1f} s attendues)")
        if i < len(spec['segments']) - 1: cuts.append(round(t + 0.325, 2)); parts.append(sil(0.65)); t += 0.65
    parts.append(sil(0.5))
    raw = np.concatenate(parts).clip(-32768, 32767).astype(np.int16).tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7', '-ar', '48000', '-c:a', 'pcm_s16le', out], input=raw, check=True)
    open(out + '.cuts', 'w').write(','.join(map(str, cuts)))
    json.dump(words, open(out + '.words.json', 'w'))
    print('→', out, 'cuts', cuts)

if __name__ == '__main__':
    main()
