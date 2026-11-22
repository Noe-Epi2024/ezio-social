# EZIO — Playbook Instagram et SEO (lu par chaque tâche planifiée)

Ce fichier est la source de vérité des tâches hebdomadaires. Le compte est **@ezio.seo**, piloté via le connecteur Windsor (`instagram`, compte `17841422600250273`). La charte complète vit dans le design system « EZIO Instagram » ; ce fichier en garde l'essentiel.

## Règles non négociables

1. **Rien ne se publie sans l'accord explicite de Noé, contenu par contenu.** L'accord se donne dans la conversation de la tâche hebdomadaire. Un rappel planifié ne publie que le contenu **exactement** approuvé, au créneau approuvé ; tout changement après accord = nouvel accord.
2. **Pas de chiffre inventé.** Toute grille, tout chiffre qui n'est pas une mesure réelle porte « Exemple illustratif » dans le visuel (champ `note`) et « entreprise fictive / données fictives » dans la légende. Aucun nom de client sans accord écrit.
3. **Neutralité fournisseur.** On ne nomme jamais de fournisseur d'IA pour désigner ce qui fait tourner EZIO (« l'IA », « le moteur »). Exception : les assistants **mesurés** (ChatGPT, Gemini, Perplexity) dans la rubrique Visibilité IA, parce qu'ils sont le média du client.
4. **5 hashtags maximum** par post, en fin de légende.
5. **Pas d'automatisation interdite par Instagram** : aucun follow, like ou DM automatisé. La croissance vient du contenu, de la régularité et des réponses aux commentaires (toujours validées).
6. **Vouvoiement**, ton direct et concret, aucune promesse de résultat en jours.

## Rythme hebdomadaire (heures de Paris)

| Jour | Contenu | Créneau Paris |
| --- | --- | --- |
| Lundi | Story | 12 h 00 |
| Lundi | Reel Scout | 18 h 00 |
| Mardi | Post (carrousel de préférence) | 12 h 00 |
| Mercredi | Reel Scout | 18 h 00 |
| Jeudi | Post | 12 h 00 |
| Vendredi | Story | 12 h 00 |
| Vendredi | Reel Scout | 18 h 00 |
| Samedi | Post | 10 h 00 |

Décidé avec Noé le 22/11/2026 : 2 à 3 Reels Scout par semaine **en plus** des 3 posts et 2 stories. La story du vendredi passe de 18 h à 12 h pour laisser 18 h au Reel. Si Noé n'enregistre que deux voix, on garde lundi et mercredi.

Paris est à UTC+1 en hiver, UTC+2 en été ; Melbourne à UTC+11 en été austral, UTC+10 sinon. Calculer chaque créneau en UTC au moment de planifier.

## Les 5 rubriques (rotation)

| Rubrique | Eyebrow | Thème | Contenu type |
| --- | --- | --- | --- |
| Le Radar | `Le radar` | Nuit | Grille heatmap commentée, où l'on gagne et où l'on perd |
| Geste SEO local | `Geste SEO local` | **Jour** | Un conseil actionnable sur la fiche Google, les avis, les attributs |
| Boucle fermée | `Auto-healing` | Nuit | Détecter → corriger → re-mesurer, avant/après |
| Visibilité IA | `Visibilité IA` | Nuit | Qui les assistants recommandent, comment être cité |
| Sous le capot | `En coulisses` | Nuit | Une fonction livrée cette semaine (lire les PR fusionnées du repo EZIO), une décision produit |

Une semaine type : 1 Geste SEO local (thème Jour, pour rythmer la grille du profil) + 2 rubriques Nuit différentes. Ne pas répéter une rubrique deux semaines de suite au même créneau. Les sujets déjà publiés sont dans `state.json` : ne jamais refaire un sujet.

## Sources d'inspiration, par ordre de priorité

1. **Les articles publiés sur ezioseo.com** (API publique `https://api.ezioseo.com/api/public/v1/articles/titles`, ou le blog) : un article = un carrousel qui en reprend l'idée et renvoie vers lui.
2. **Les requêtes Search Console** d'ezioseo.com (connecteur Windsor `searchconsole`, compte `sc-domain:ezioseo.com`, champs `query, page, clicks, impressions, ctr, position`) : les questions que les gens tapent sont des sujets de carrousel.
3. **Les PR fusionnées du repo EZIO** de la semaine : rubrique « Sous le capot ».
4. `backlog.md`.

## Production

- Écrire la spec de la semaine dans `specs/AAAA-wNN.json` (format : voir `specs/test.json`), puis `node render.mjs specs/AAAA-wNN.json`.
- Types de slide : `hook` (accroche, 8 à 10 mots max, `*mot*` surligné, un seul), `text` (titre + `bullets` ou `body`), `grid` (heatmap, `note: "Exemple illustratif"` obligatoire si fictive), `proof` via `numeral` + `numeralNote`, `cta` (fond indigo, une seule action : l'audit gratuit, lien en bio).
- Carrousel : 4 à 6 slides, la première est un `hook`, la dernière un `cta`. Post simple : 1 slide `grid`, `text` ou `hook`.
- Stories : format `story`, 1 slide, souvent `cta` ou `text` ; pas de légende possible via l'API.
- Regarder chaque JPEG rendu avant de le proposer : texte qui déborde, chevauchement avec le pied de slide, faute.
- Copier les JPEG dans `public/AAAA-wNN/<id>/<n>.jpg`, commit, push sur `main`. URL publique : `https://raw.githubusercontent.com/Noe-Epi2024/ezio-social/main/public/...` — vérifier avec `curl -sI` (200, `content-type: image/jpeg`) **avant** de proposer la publication.
- **Vidéos (Reels)** : raw.githubusercontent sert les `.mp4` en `application/octet-stream` (vérifié le 14/11). Tenter l'URL raw ; si Windsor/Instagram la refuse, utiliser l'URL GitHub Pages `https://noe-epi2024.github.io/ezio-social/public/...` (à condition que Noé ait activé Pages : Settings → Pages → branche `main`, dossier `/`), sinon prévenir Noé. Ne jamais inventer une autre forme d'hébergement.

## Reels Scout (voix de Noé)

Scout, la mascotte (design system « EZIO Instagram », § 10 et 11), présente chaque Reel avec la voix de Noé.

1. **Dimanche, dans la session hebdomadaire** : en plus du lot, rédiger 2 à 3 scripts de 30 à 50 s (une phrase par carte, 7 cartes au plus, la dernière = audit gratuit, lien en bio). Une spec par Reel : `shorts/AAAA-wNN-<id>.json` (format de `shorts/s01-avis-negatif.json` : texte, carte, expression et geste de chaque phrase). Envoyer à Noé le texte à lire, phrase par phrase, avec la consigne : une demi-seconde de silence entre chaque phrase, pièce calme.
2. **Rotation** : les Reels suivent les 5 rubriques comme les posts, sans reprendre un sujet de `state.json` ni le sujet d'un post de la même semaine. Le short « avis négatif » (`shorts/s01-avis-negatif.json`) attend sa voix : le placer en premier.
3. **Voix de synthèse (décidé avec Noé le 22/11/2026)** : Noé n'enregistre plus. La voix de Scout est la voix « Charon » de la synthèse vocale de Google (`gemini-3.8-flash-tts`), générée phrase par phrase :
   `GEMINI_API_KEY=… python3 shorts/tts-voice.py shorts/<spec>.json out/voix/<id>.wav`, puis le montage avec `--cuts` ci-dessous.
   - Prérequis : `generativelanguage.googleapis.com` autorisé dans les domaines de Claude, et une clé AI Studio fournie par Noé pour la session. La clé ne s'écrit jamais dans le dépôt ; sans clé, prévenir Noé et ne pas publier de Reel.
   - L'offre gratuite limite à quelques requêtes par minute : générer les Reels l'un après l'autre (le script attend sur un 429).
   - Une prise trop longue a répété un morceau : le script garde la prise de durée plausible. Si une phrase échoue toujours, la reformuler (S48 : « Votre carte, rue par rue » bouclait sur « rue par rue »).
   - Chaque légende de Reel finit par « Voix de synthèse. » avant les hashtags (l'API ne permet pas de cocher « Infos IA »).
   - Envoyer à Noé la vidéo finale : il valide la voix à l'écoute, Claude ne peut pas écouter.
4. **Montage** d'un audio fourni par Noé (ancienne méthode, si jamais il enregistre de nouveau) :
   - D'abord le nettoyage : `python3 shorts/clean-voice.py <audio> out/voix/<id>.wav [début-fin]`. Il resserre les pauses à 0,65 s, atténue le ton de pièce, réduit le souffle et met la voix à -16 LUFS. Il écrit aussi `<id>.wav.cuts`, les frontières de phrases. Une prise ratée se retire en donnant son intervalle (S48, Reel 03 : `31.0-36.0`) ; pour la repérer, comparer les durées des blocs aux phrases du script.
   - Puis le montage : `node shorts/render-short.mjs shorts/<spec>.json out/voix/<id>.wav --cuts $(cat out/voix/<id>.wav.cuts) [--music assets/music/<piste>]`. Toujours passer `--cuts` : sans lui, la détection automatique a pris une pause interne pour une fin de phrase sur 2 Reels sur 3 en S48 (cartes décalées d'une seconde).
   - Regarder 6 images extraites du MP4 avant de soumettre : la carte doit correspondre au sous-titre.
5. **Musique** : une nappe libre de droits très basse sous la voix (`--music`), uniquement depuis `assets/music/`, des pistes fournies par Noé avec leur licence notée dans `assets/music/LICENCES.md`. Aucune musique sans licence écrite. Pas de piste disponible : voix seule.
6. **Hébergement** : copier le MP4 et sa couverture dans `public/AAAA-wNN/<id>/`, push, vérifier les URL (200). Le MP4 sort en `application/octet-stream` sur raw.githubusercontent, ce qu'Instagram a accepté le 17/11 (Reel 01).
7. **Soumission et publication** : comme les posts (règle 1 non négociable) : vidéo, couverture et légende complète envoyées à Noé, accord explicite, puis rappel `send_later` au créneau avec l'appel exact `create_video_post` (`video_url`, `cover_url`, `caption`, `share_to_feed: true`).

## Légendes

- Ligne 1 = l'accroche, 125 caractères max (ce qui s'affiche avant « plus »).
- 3 à 6 lignes courtes, puis l'appel à l'action vers le **lien en bio** (audit gratuit).
- Fin : 5 hashtags max. Socle : `#seolocal #googlebusinessprofile #googlemaps #referencementlocal #commercelocal` ; en remplacer un ou deux selon le sujet (`#geo`, `#avisclients`, `#artisan`…).

## Publication (Windsor `execute_action`)

- Carrousel : `create_carousel_post` `{image_urls:[…], caption}` (2 à 10 images JPEG, 4:5 à 1,91:1).
- Post simple : `create_image_post` `{image_url, caption}`.
- Story : `create_story` `{image_url}`.
- Reel : `create_video_post` `{video_url, caption, cover_url, share_to_feed:true}`.
- Après chaque publication réussie : ajouter l'entrée dans `state.json` (date, id, rubrique, sujet, media_id si renvoyé), commit, push.
- En cas d'échec : ne pas réessayer en boucle (une seule nouvelle tentative), prévenir Noé avec le message d'erreur.

## Commentaires

Chaque semaine, lire les commentaires récents (connecteur Windsor `instagram`, champs comment). Proposer une réponse pour chacun qui en mérite une ; ne publier une réponse (`reply_to_comment`) qu'après accord. Ne jamais masquer ni supprimer un commentaire sans accord, sauf spam évident signalé à Noé.

## Windsor

L'essai Windsor se termine vers le **13 décembre 2026**. Au-delà, vérifier que la publication reste disponible sur le plan gratuit (un premier appel en échec le dira) et prévenir Noé avant la fin de l'essai.
