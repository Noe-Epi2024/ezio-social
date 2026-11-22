# Voix de synthèse d'un Reel Scout, phrase par phrase.
# Usage : GEMINI_API_KEY=… python3 shorts/tts-voice.py shorts/<spec>.json out/voix/<id>.wav [--voice Charon]
# - génère chaque phrase du script séparément (modèle de synthèse vocale de Google, voix « Charon » choisie par Noé le 22/11/2026) ;
# - les assemble avec 0,25 s en tête et 0,65 s de pause entre phrases, puis met le tout à -16 LUFS / -1,5 dBTP ;
# - écrit <sortie.wav>.cuts : les frontières de phrases, à passer à render-short.mjs --cuts.
# La clé ne s'écrit jamais dans le dépôt. Domaine à autoriser : generativelanguage.googleapis.com.
import base64, json, os, subprocess, sys, time, urllib.request
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

def say(text, voice, key, tries=6):
    body = {"contents": [{"parts": [{"text": f"{STYLE}\n{text}"}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    for t in range(tries):
        try:
            req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                                         data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": key})
            part = json.load(urllib.request.urlopen(req, timeout=120))["candidates"][0]["content"]["parts"][0]["inlineData"]
            pcm = np.frombuffer(base64.b64decode(part["data"]), np.int16).astype(np.float32)
            # retire les blancs de début et de fin (seuil à -45 dBFS)
            hop = SR // 50; e = np.array([np.sqrt(np.mean(pcm[i:i + hop] ** 2)) for i in range(0, len(pcm) - hop, hop)])
            on = np.where(20 * np.log10(e / 32768 + 1e-9) > -45)[0]
            a, b = (on[0] * hop, (on[-1] + 1) * hop) if len(on) else (0, len(pcm))
            return pcm[max(0, a - SR // 50):min(len(pcm), b + SR // 20)]
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
    parts, t, cuts = [sil(0.25)], 0.25, []
    cache = out + '.parts'; os.makedirs(cache, exist_ok=True)
    for i, s in enumerate(spec['segments']):
        # ≈ 15 caractères par seconde. La synthèse varie d'une prise à l'autre : une prise trop longue a souvent répété
        # un morceau ou lu autre chose (vu en S48 : 9,8 s pour 6,4 s attendues). On garde la première prise dans
        # [0,75 ; 1,3] × l'attendu, sinon la plus proche après 5 prises, refusée hors de [0,6 ; 1,45].
        expect = len(s['text']) / 15; f = os.path.join(cache, f'{i:02d}-{voice}.npy')
        ok = lambda x, lo=0.75, hi=1.3: lo * expect <= len(x) / SR <= hi * expect
        a = np.load(f) if os.path.exists(f) else None
        if a is None or not ok(a):
            takes = []
            for k in range(5):
                x = say(s['text'], voice, key); takes.append(x); time.sleep(6)
                if ok(x): break
                print(f"  phrase {i + 1} : prise de {len(x) / SR:.2f} s pour ≈ {expect:.1f} s attendues, nouvelle prise")
            a = min(takes, key=lambda x: abs(len(x) / SR - expect))
            if not ok(a, 0.6, 1.45): sys.exit(f'phrase {i + 1} : aucune prise de durée plausible')
        np.save(f, a); parts.append(a); t += len(a) / SR
        print(f"  phrase {i + 1} : {len(a) / SR:.2f} s (≈ {expect:.1f} s attendues)")
        if i < len(spec['segments']) - 1: cuts.append(round(t + 0.325, 2)); parts.append(sil(0.65)); t += 0.65
    parts.append(sil(0.5))
    raw = np.concatenate(parts).clip(-32768, 32767).astype(np.int16).tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7', '-ar', '48000', '-c:a', 'pcm_s16le', out], input=raw, check=True)
    open(out + '.cuts', 'w').write(','.join(map(str, cuts)))
    print('→', out, 'cuts', cuts)

if __name__ == '__main__':
    main()
