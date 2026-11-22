# Nettoyage d'une voix de Reel Scout, avant montage.
# Usage : python3 shorts/clean-voice.py <voix.m4a> <sortie.wav> [debut-fin à retirer, en s, ex. 31.0-36.0]
# - découpe la voix en phrases (silences >= 0,9 s), retire les prises ratées indiquées,
#   ramène chaque pause à 0,65 s de ton de pièce atténué (-9 dB), 0,25 s en tête ;
# - coupe-bas 80 Hz, réduction du souffle, présence, compression douce, -16 LUFS / -1,5 dBTP ;
# - écrit <sortie.wav>.cuts : les frontières de phrases, à passer à render-short.mjs --cuts.
import sys,wave,subprocess,numpy as np
src,out,drop=sys.argv[1],sys.argv[2],[tuple(map(float,d.split('-'))) for d in sys.argv[3:]]
sr=48000
raw=subprocess.run(['ffmpeg','-v','error','-i',src,'-ac','1','-ar',str(sr),'-f','s16le','-'],capture_output=True).stdout
x=np.frombuffer(raw,np.int16).astype(np.float32)
hop=int(.02*sr);n=len(x)//hop
db=20*np.log10(np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2))+1 for i in range(n)])/32768)
p10,p95=np.percentile(db,[10,95]);thr=p10+0.35*(p95-p10)
sp=db>thr
# blocs de parole séparés par des silences >= 0,9 s (frontières de phrases)
blocks=[];start=None;run=0
for i,v in enumerate(sp):
  if v:
    if start is None: start=i
    run=0;last=i
  elif start is not None:
    run+=1
    if run*0.02>=0.9: blocks.append((start*.02,(last+1)*.02));start=None;run=0
if start is not None: blocks.append((start*.02,(last+1)*.02))
blocks=[(a,b) for a,b in blocks if not any(a>=d0-0.05 and b<=d1+0.05 for d0,d1 in drop)]
print(src,'phrases:',len(blocks),' '.join(f'{a:.2f}-{b:.2f}' for a,b in blocks))
# ton de pièce réel pour les pauses (pas de silence numérique), pris dans le silence le plus calme
quiet=np.argsort(db)[:40];tone_i=int(np.median(quiet))
def room(d):
  k=int(d*sr);seg=[]
  while sum(map(len,seg))<k:
    i=np.random.choice(quiet);seg.append(x[i*hop:(i+1)*hop])
  r=np.concatenate(seg)[:k]*0.35;return r
parts=[room(0.25)];t=0.25;cuts=[]
for j,(a,b) in enumerate(blocks):
  s=x[int(max(0,a-0.12)*sr):int(min(len(x)/sr,b+0.18)*sr)].copy()
  f=int(.01*sr);s[:f]*=np.linspace(0,1,f);s[-f:]*=np.linspace(1,0,f)
  parts.append(s);t+=len(s)/sr
  if j<len(blocks)-1: cuts.append(round(t+0.325,2))
  parts.append(room(0.65 if j<len(blocks)-1 else 0.5));t+=0.65 if j<len(blocks)-1 else 0.5
open(out+'.cuts','w').write(','.join(map(str,cuts)));print('cuts',cuts)
y=np.concatenate(parts).clip(-32768,32767).astype(np.int16)
tmp=out+'.raw.wav'
w=wave.open(tmp,'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(y.tobytes());w.close()
# nettoyage : coupe-bas, réduction du souffle, présence, compression douce, niveau -16 LUFS / -1,5 dBTP
af='highpass=f=80,afftdn=nr=14:nf=-44:tn=1,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=4000:t=q:w=1.5:g=2,acompressor=threshold=-24dB:ratio=2.5:attack=8:release=120:makeup=2,loudnorm=I=-16:TP=-1.5:LRA=7'
subprocess.run(['ffmpeg','-v','error','-y','-i',tmp,'-af',af,'-ar','48000','-c:a','pcm_s16le',out],check=True)
