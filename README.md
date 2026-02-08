# GEDEON - Interface Utilisateur (Lecture Seule)

Interface web de consultation de la base PostgreSQL GEDEON.
Inscription par email, accès en lecture seule uniquement.

## Déploiement Render

### Configuration

- **Type** : Web Service
- **Environment** : Python
- **Build Command** : `pip install -r requirements.txt`
- **Start Command** : `gunicorn app:app`

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion PostgreSQL (Internal) |
| `DATABASE_URL_RENDER` | URL de connexion PostgreSQL (External) |
| `SECRET_KEY` | Clé secrète Flask pour les sessions |
| `SENDGRID_API_KEY` | Clé API SendGrid |
| `SENDGRID_FROM_EMAIL` | Adresse email expéditeur |
| `APP_URL` | URL publique de l'instance |

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
