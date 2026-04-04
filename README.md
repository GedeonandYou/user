# GEDEON — Explorer autour de toi

Interface web de consultation de la base PostgreSQL GEDEON. Les utilisateurs s'inscrivent avec email/pseudo/mot de passe, confirment leur compte par email, puis consultent les événements à proximité, les séances de cinéma et les salons sur une carte interactive.

---

## Lancer en local

```bash
pip install -r requirements.txt
python app.py
```

Frontend React (`/new`) en dev :

```bash
cd gedeon-explorer-ui-light-dark
npm install
npm run dev   # proxy /api → http://localhost:5000
```

Python 3.11.4 requis. Variables d'environnement à définir :

| Variable | Description |
| --- | --- |
| `DATABASE_URL` ou `DATABASE_URL_RENDER` | Chaîne de connexion PostgreSQL |
| `SECRET_KEY` | Secret Flask pour les sessions |
| `SMTP_USER` | Adresse Gmail pour l'envoi d'emails |
| `SMTP_PASSWORD` | Mot de passe d'application Gmail |
| `SMTP_FROM_EMAIL` | Expéditeur (défaut : SMTP_USER) |
| `SMTP_HOST` / `SMTP_PORT` | Serveur SMTP (défaut : smtp.gmail.com / 587) |
| `APP_URL` | URL publique utilisée dans les liens de confirmation |

---

## Déploiement Render

- **Type** : Web Service Python
- **Build Command** :

  ```bash
  pip install -r requirements.txt && cd gedeon-explorer-ui-light-dark && npm install && npm run build
  ```

- **Start Command** : `gunicorn app:app`

Le build Vite génère `explorer_dist/` (ignoré par git, reconstruit à chaque deploy).
Lors d'un déploiement, incrémenter la version du cache service worker dans [sw.js](sw.js) (`CACHE_NAME = 'gedeon-cache-vX.Y'`) pour forcer le rechargement dans les navigateurs.

### Variables d'environnement sur Render

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion PostgreSQL (Internal) |
| `DATABASE_URL_RENDER` | URL de connexion PostgreSQL (External) |
| `SECRET_KEY` | Clé secrète Flask pour les sessions |
| `SMTP_USER` | Adresse Gmail |
| `SMTP_PASSWORD` | Mot de passe d'application Gmail |
| `SMTP_FROM_EMAIL` | Expéditeur |
| `APP_URL` | URL publique de l'instance |

---

## Architecture

### Backend ([app.py](app.py))

Application Flask dans un seul fichier. Toutes les routes API y sont définies — pas de blueprints.

- **BDD** : psycopg2 avec `RealDictCursor`, pas d'ORM. PostGIS est utilisé pour les requêtes de proximité (`ST_DWithin`, `ST_Distance`) sur la table `evenements`.
- **Auth** : sessions Flask (cookie). Les tokens de confirmation email et de réinitialisation de mot de passe sont stockés dans la table `users` avec un champ `token_created_at`. [auth_email.py](auth_email.py) gère l'envoi SMTP.
- **Décorateur `require_auth`** : appliqué à tous les endpoints de données ; retourne 401 si non connecté ou email non confirmé.
- **Format pseudo** : stocké sous la forme `pseudo + '#' + numéro` (ex. `Alice#4521`). Le numéro est attribué à l'inscription via `COUNT(*) + 1` parmi les pseudos identiques existants.

### Sources de données

Trois sources indépendantes sont fusionnées dans la vue carte du frontend :

1. **DATAtourisme** — interrogé en direct depuis PostgreSQL (table `evenements` avec géométrie PostGIS). Filtré par proximité et fenêtre de dates.
2. **Cinémas Allociné** — `cinemas_france_data.json` chargé en mémoire au démarrage (`CINEMAS_ALLOCINE_DATA`). Les séances sont récupérées en direct via le package pip `allocine-seances`. [department_mapping.py](department_mapping.py) fait la correspondance entre les résultats de géocodage Nominatim / codes postaux et les IDs de département Allociné.
3. **Salons et foires** — `salons_france.json` chargé en mémoire au démarrage (`SALONS_DATA`). Filtré par distance GPS via la formule de Haversine (pas de requête BDD).

### Frontend classique

HTML + JS vanilla pur, pas d'étape de build. Chargé depuis CDN : Tailwind CSS, Leaflet.js + MarkerCluster pour la carte.

Pages principales : [index.html](index.html) (carte), [onboarding.html](onboarding.html), [reset-password.html](reset-password.html), [confirmation-success.html](confirmation-success.html), [confirmation-error.html](confirmation-error.html).

Flask sert tous les fichiers statiques depuis la racine du dépôt (`static_folder='.'`).

PWA : [manifest.json](manifest.json) + [sw.js](sw.js). Le service worker utilise la stratégie Network First ; les routes `/api/` contournent toujours le cache.

### Frontend React — `/new` ([gedeon-explorer-ui-light-dark/](gedeon-explorer-ui-light-dark/))

React 19 + TypeScript + Vite + Tailwind CSS v4. Servi par Flask depuis `explorer_dist/` (généré par `npm run build`).

- Route Flask : `/new` → `explorer_dist/index.html`
- Assets : `/explorer/<path>` → `explorer_dist/<path>`
- Vite base : `/explorer/`
- Dev proxy : `/api` → `http://localhost:5000`

### Modules clés

- **[auth_email.py](auth_email.py)** : envoi d'emails SMTP (confirmation + réinitialisation mot de passe). Expiration des tokens : 24h pour la confirmation, 1h pour le reset.
- **[department_mapping.py](department_mapping.py)** : correspondance statique noms de lieux Nominatim / codes postaux → IDs département Allociné. Fournit aussi `ADJACENT_DEPARTMENTS` pour élargir le rayon de recherche et `IDF_DEPARTMENTS` pour le cas multi-département en Île-de-France.

---

## Endpoints API

### Authentification

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/check` | Vérification session |
| POST | `/api/auth/resend-confirmation` | Renvoi email confirmation |
| GET | `/confirm?token=...` | Confirmation email |
| POST | `/api/auth/forgot-password` | Demande reset mot de passe |
| POST | `/api/auth/reset-password` | Reset mot de passe |

### Lecture seule (authentifié)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/events/nearby` | Événements DATAtourisme à proximité |
| GET | `/api/cinema/nearby` | Cinémas et séances Allociné |
| GET | `/api/salons/nearby` | Salons et foires à proximité |
| GET | `/api/scanned` | Événements scannés publics |
| GET | `/api/scanned/<id>/image` | Image d'un événement |
| GET | `/api/users` | Liste des utilisateurs |
| GET | `/api/stats` | Statistiques |
| GET | `/health` | Health check |
