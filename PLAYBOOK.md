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
| Mardi | Post (carrousel de préférence) | 12 h 00 |
| Jeudi | Post | 12 h 00 |
| Vendredi | Story | 18 h 00 |
| Samedi | Post | 10 h 00 |

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
2. **Les requêtes Search Console** d'ezioseo.com (connecteur Windsor `searchconsole`) : les questions que les gens tapent sont des sujets de carrousel.
3. **Les PR fusionnées du repo EZIO** de la semaine : rubrique « Sous le capot ».
4. `backlog.md`.

## Production

- Écrire la spec de la semaine dans `specs/AAAA-wNN.json` (format : voir `specs/test.json`), puis `node render.mjs specs/AAAA-wNN.json`.
- Types de slide : `hook` (accroche, 8 à 10 mots max, `*mot*` surligné, un seul), `text` (titre + `bullets` ou `body`), `grid` (heatmap, `note: "Exemple illustratif"` obligatoire si fictive), `proof` via `numeral` + `numeralNote`, `cta` (fond indigo, une seule action : l'audit gratuit, lien en bio).
- Carrousel : 4 à 6 slides, la première est un `hook`, la dernière un `cta`. Post simple : 1 slide `grid`, `text` ou `hook`.
- Stories : format `story`, 1 slide, souvent `cta` ou `text` ; pas de légende possible via l'API.
- Regarder chaque JPEG rendu avant de le proposer : texte qui déborde, chevauchement avec le pied de slide, faute.
- Copier les JPEG dans `public/AAAA-wNN/<id>/<n>.jpg`, commit, push sur `main`. URL publique : `https://raw.githubusercontent.com/Noe-Epi2024/ezio-social/main/public/...` — vérifier avec `curl -sI` (200, `content-type: image/jpeg`) **avant** de proposer la publication.

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
