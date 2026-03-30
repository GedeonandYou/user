#!/usr/bin/env python3
"""
GEDEON Interface Utilisateur - Lecture Seule
Serveur minimal pour consultation de la base (pas d'écriture sauf inscription)
"""

from flask import Flask, request, jsonify, send_from_directory, session, redirect
from flask_cors import CORS
from functools import wraps
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import re
import math
import json
import time
import base64
from datetime import datetime, timedelta, date
from urllib.parse import urlparse
from werkzeug.security import generate_password_hash, check_password_hash

# Module d'authentification email
try:
    from auth_email import (
        generate_confirmation_token,
        send_confirmation_email,
        send_password_reset_email,
        is_valid_email,
        is_token_expired,
        TOKEN_EXPIRY_HOURS
    )
    AUTH_EMAIL_AVAILABLE = True
    print("✅ Module auth_email disponible")
except ImportError:
    AUTH_EMAIL_AVAILABLE = False
    print("⚠️ Module auth_email non disponible")

# ============================================================================
# CONFIGURATION
# ============================================================================

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['JSON_SORT_KEYS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'gedeon-user-secret-key-change-in-prod')
CORS(app, supports_credentials=True)

# PostgreSQL
database_url = os.environ.get('DATABASE_URL_RENDER') or os.environ.get('DATABASE_URL')

if database_url:
    url = urlparse(database_url)
    DB_CONFIG = {
        'host': url.hostname,
        'port': url.port or 5432,
        'database': url.path[1:],
        'user': url.username,
        'password': url.password,
    }
    print(f"✅ Database configured: {url.hostname}/{url.path[1:]}")
else:
    DB_CONFIG = None
    print("⚠️ DATABASE_URL not set")


def get_db_connection():
    """Crée une connexion à la base PostgreSQL."""
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)


# ============================================================================
# CONSTANTES & GLOBALS
# ============================================================================

RADIUS_KM_DEFAULT = 21
DAYS_AHEAD_DEFAULT = 10

CINEMAS_ALLOCINE_DATA = []
FILMS_CACHE = {}
FILMS_CACHE_TTL = 3600  # 1 heure

SALONS_DATA = []

# Mots-clés par centre d'intérêt pour le scoring de pertinence
INTEREST_KEYWORDS = {
    'sport': ['sport', 'sportif', 'marathon', 'course', 'football', 'basketball',
              'tennis', 'rugby', 'natation', 'cyclisme', 'athlétisme', 'tournoi', 'compétition'],
    'musique': ['concert', 'musique', 'musical', 'festival', 'orchestre', 'jazz',
                'rock', 'pop', 'electro', 'chanson', 'chorale', 'opéra', 'récital'],
    'arts': ['art', 'exposition', 'théâtre', 'musée', 'danse', 'peinture',
             'sculpture', 'galerie', 'spectacle', 'cirque'],
    'festivals': ['festival', 'fête', 'célébration', 'carnaval', 'foire'],
    'gastro': ['gastronomie', 'dégustation', 'marché', 'culinaire', 'cuisine',
               'vin', 'bière', 'food', 'chocolat'],
    'nature': ['nature', 'randonnée', 'environnement', 'jardins', 'écologie',
               'plein air', 'forêt', 'parc'],
    'business': ['salon', 'conférence', 'professionnel', 'forum', 'networking',
                 'entrepreneuriat', 'startup', 'business'],
    'famille': ['famille', 'enfant', 'kid', 'jeunesse', 'parents', 'scolaire'],
    'bienetre': ['bien-être', 'yoga', 'méditation', 'santé', 'spa', 'relaxation'],
    'tech': ['technologie', 'numérique', 'innovation', 'informatique', 'digital',
             'intelligence artificielle', 'tech', 'hackathon'],
    'mode': ['mode', 'fashion', 'design', 'couture', 'styliste', 'défilé'],
    'nightlife': ['soirée', 'club', 'nuit', 'discothèque', 'bal'],
    'patrimoine': ['patrimoine', 'histoire', 'monument', 'historique', 'château',
                   'abbaye', 'cathédrale'],
    'cinema': ['cinéma', 'film', 'cinématographique'],
    'communaute': ['communauté', 'bénévolat', 'solidarité', 'association'],
    'education': ['conférence', 'formation', 'atelier', 'workshop', 'séminaire', 'cours'],
    'religion': ['religion', 'spiritualité', 'foi', 'église', 'mosquée', 'temple'],
}

# Source préférée par intérêt
INTEREST_SOURCES = {
    'cinema': ['Allocine'],
    'business': ['EventsEye'],
}

# Correspondance préférence distance → rayon km
DISTANCE_TO_KM = {
    '5km': 5,
    '20km': 20,
    '100km': 100,
    'national': 200,
    'international': 500,
}


# ============================================================================
# FONCTIONS UTILITAIRES (géo, data loading)
# ============================================================================

def haversine_km(lat1, lon1, lat2, lon2):
    """Distance en km entre deux points GPS."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def load_cinemas_allocine():
    """Charge la base complète des cinémas Allociné avec GPS."""
    global CINEMAS_ALLOCINE_DATA

    def fix_encoding(text):
        if not isinstance(text, str):
            return text
        try:
            return text.encode('latin-1').decode('utf-8')
        except (UnicodeDecodeError, UnicodeEncodeError):
            return text

    try:
        allocine_file = os.path.join(os.path.dirname(__file__), 'cinemas_france_data.json')
        if os.path.exists(allocine_file):
            with open(allocine_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            for cinema in data:
                if 'name' in cinema:
                    cinema['name'] = fix_encoding(cinema['name'])
                if 'address' in cinema:
                    cinema['address'] = fix_encoding(cinema['address'])
            CINEMAS_ALLOCINE_DATA = data
            print(f"✅ Cinémas Allociné chargés: {len(CINEMAS_ALLOCINE_DATA)}")
        else:
            print("⚠️ Fichier cinemas_france_data.json non trouvé")
    except Exception as e:
        print(f"❌ Erreur chargement cinémas: {e}")


def load_salons_data():
    """Charge les données des salons depuis le fichier JSON."""
    global SALONS_DATA
    try:
        salons_file = os.path.join(os.path.dirname(__file__), 'salons_france.json')
        if os.path.exists(salons_file):
            with open(salons_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if isinstance(data, list):
                SALONS_DATA = data
            elif isinstance(data, dict) and 'events' in data:
                SALONS_DATA = data['events']
            else:
                SALONS_DATA = []
            if SALONS_DATA and not isinstance(SALONS_DATA[0], dict):
                SALONS_DATA = []
            else:
                print(f"✅ Salons chargés: {len(SALONS_DATA)}")
        else:
            print("⚠️ Fichier salons_france.json non trouvé")
    except Exception as e:
        print(f"❌ Erreur chargement salons: {e}")


def parse_salon_date(date_str):
    """Parse une date de salon (formats: DD/MM/YYYY ou 'mois YYYY')."""
    if not date_str:
        return None
    try:
        if '/' in date_str:
            return datetime.strptime(date_str, '%d/%m/%Y').date()

        MOIS = {
            'janv': 1, 'janvier': 1,
            'fév': 2, 'fevr': 2, 'février': 2, 'fevrier': 2,
            'mars': 3,
            'avril': 4, 'avr': 4,
            'mai': 5,
            'juin': 6,
            'juil': 7, 'juillet': 7,
            'août': 8, 'aout': 8,
            'sept': 9, 'septembre': 9,
            'oct': 10, 'octobre': 10,
            'nov': 11, 'novembre': 11,
            'déc': 12, 'dec': 12, 'décembre': 12, 'decembre': 12
        }

        date_lower = date_str.lower().replace('.', '').strip()
        for mois_str, mois_num in MOIS.items():
            if mois_str in date_lower:
                year_match = re.search(r'(\d{4})', date_str)
                if year_match:
                    year = int(year_match.group(1))
                    return datetime(year, mois_num, 1).date()
        return None
    except Exception:
        return None


def score_event(event, preferences):
    """Score de pertinence d'un événement selon les préférences utilisateur (0-10)."""
    if not preferences:
        return 0
    interests = preferences.get('interests') or []
    if not interests:
        return 0

    score = 0
    title = (event.get('title') or '').lower()
    description = (event.get('description') or '').lower()
    text = title + ' ' + description
    source = event.get('source', '')

    for interest in interests:
        for kw in INTEREST_KEYWORDS.get(interest, []):
            if kw in text:
                score += 2
                break
        if source in INTEREST_SOURCES.get(interest, []):
            score += 2

    return min(score, 10)


def get_user_preferences():
    """Récupère les préférences de l'utilisateur connecté depuis la session."""
    return session.get('user_preferences') or {}


def get_default_radius_from_prefs(preferences):
    """Rayon par défaut selon la préférence distance de l'utilisateur."""
    if not preferences:
        return RADIUS_KM_DEFAULT
    dist_pref = preferences.get('distance')
    return DISTANCE_TO_KM.get(dist_pref, RADIUS_KM_DEFAULT)


def fetch_datatourisme_events(center_lat, center_lon, radius_km, days_ahead):
    """Récupère les événements DATAtourisme depuis PostgreSQL."""
    try:
        start_time = time.time()
        conn = get_db_connection()
        cur = conn.cursor()

        date_limite = datetime.now().date() + timedelta(days=days_ahead)

        query = """
            WITH nearby_events AS (
                SELECT uri, nom, description, date_debut, date_fin,
                       latitude, longitude, adresse, commune, code_postal, contacts, geom
                FROM evenements
                WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
                  AND (
                      (date_fin IS NOT NULL AND date_fin >= CURRENT_DATE AND date_debut <= %s)
                      OR
                      (date_fin IS NULL AND date_debut >= CURRENT_DATE AND date_debut <= %s)
                  )
                LIMIT 500
            )
            SELECT uri as uid, nom as title, description,
                   date_debut as begin, date_fin as end,
                   latitude, longitude, adresse as address, commune as city,
                   code_postal as zipcode, contacts,
                   ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography) / 1000 as "distanceKm"
            FROM nearby_events
            ORDER BY "distanceKm", date_debut
        """

        cur.execute(query, (center_lon, center_lat, radius_km * 1000, date_limite, date_limite, center_lon, center_lat))
        rows = cur.fetchall()

        events = []
        for row in rows:
            event = dict(row)
            if event.get('begin'):
                event['begin'] = event['begin'].isoformat()
            if event.get('end'):
                event['end'] = event['end'].isoformat()
            if event.get('distanceKm'):
                event['distanceKm'] = round(event['distanceKm'], 1)
            event['locationName'] = event.get('city', '')
            event['source'] = 'DATAtourisme'
            event['agendaTitle'] = 'DATAtourisme'
            contacts = event.get('contacts', '')
            event['openagendaUrl'] = ''
            if contacts and '#' in contacts:
                for part in contacts.split('#'):
                    if part.startswith('http'):
                        event['openagendaUrl'] = part
                        break
            events.append(event)

        cur.close()
        conn.close()
        print(f"   ⚡ DATAtourisme: {len(events)} événements en {time.time()-start_time:.3f}s")
        return events
    except Exception as e:
        print(f"   ❌ Erreur DATAtourisme: {e}")
        return []


def fetch_movies_for_cinema(cinema_info, today_str, tomorrow_str=None):
    """Récupère les films d'un cinéma via Allociné."""
    try:
        from allocineAPI.allocineAPI import allocineAPI
        api = allocineAPI()
        cinema_id = cinema_info['id']
        all_movies = {}

        for date_str in [today_str, tomorrow_str] if tomorrow_str else [today_str]:
            try:
                showtimes = api.get_showtime(cinema_id, date_str)
                if showtimes:
                    is_today = (date_str == today_str)
                    date_label = "Auj" if is_today else "Dem"

                    for show in showtimes:
                        title = show.get('title', 'Film')
                        show_times = show.get('showtimes', [])

                        if show_times:
                            vf_times = []
                            vo_times = []
                            for st in show_times:
                                starts_at = st.get('startsAt', '')
                                version = st.get('diffusionVersion', '')
                                time_part = starts_at.split('T')[1][:5] if 'T' in starts_at else starts_at
                                if version == 'LOCAL':
                                    vf_times.append(time_part)
                                else:
                                    vo_times.append(time_part)
                            versions = []
                            if vf_times:
                                versions.append(f"VF {date_label}: {', '.join(vf_times[:3])}")
                            if vo_times:
                                versions.append(f"VO {date_label}: {', '.join(vo_times[:3])}")
                            showtimes_str = " | ".join(versions) if versions else ""
                        else:
                            vf = show.get('VF', [])
                            vo = show.get('VO', [])
                            vost = show.get('VOST', [])
                            versions = []
                            if vf:
                                versions.append(f"VF {date_label}: {', '.join(vf[:3])}")
                            if vo:
                                versions.append(f"VO {date_label}: {', '.join(vo[:3])}")
                            if vost:
                                versions.append(f"VOST {date_label}: {', '.join(vost[:3])}")
                            showtimes_str = " | ".join(versions) if versions else ""

                        if title in all_movies:
                            if showtimes_str:
                                existing = all_movies[title]['showtimes_str']
                                if existing:
                                    all_movies[title]['showtimes_str'] = existing + " | " + showtimes_str
                                else:
                                    all_movies[title]['showtimes_str'] = showtimes_str
                        else:
                            all_movies[title] = {
                                'title': title,
                                'runtime': 0,
                                'genres': [],
                                'showtimes_str': showtimes_str,
                                'duration': show.get('duration', ''),
                            }
            except Exception as e:
                if date_str == today_str:
                    print(f"      ⚠️ get_showtime({cinema_id}, {date_str}) failed: {e}")

        if all_movies:
            return cinema_info, list(all_movies.values())

        try:
            movies = api.get_movies(cinema_id, today_str)
            if movies:
                return cinema_info, movies
        except Exception:
            pass

        return cinema_info, []
    except Exception as e:
        print(f"      ❌ Erreur cinéma {cinema_info.get('name')}: {e}")
        return cinema_info, []


# ============================================================================
# AUTHENTIFICATION - Session utilisateur
# ============================================================================

def check_auth():
    """Vérifie si l'utilisateur est authentifié."""
    return session.get('user_logged_in', False)


def require_auth(f):
    """Décorateur pour protéger les routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not check_auth():
            return jsonify({"status": "error", "message": "Non autorisé"}), 401
        return f(*args, **kwargs)
    return decorated


def validate_pseudo(pseudo):
    """Valide un pseudo (2-20 chars, lettres uniquement)"""
    if not pseudo or len(pseudo) < 2 or len(pseudo) > 20:
        return False, "Le pseudo doit faire entre 2 et 20 caractères"
    if not re.match(r'^[a-zA-Z]+$', pseudo):
        return False, "Le pseudo ne peut contenir que des lettres (a-z)"
    return True, None


# ============================================================================
# INITIALISATION TABLE USERS
# ============================================================================

def init_user_tables():
    """Crée la table users si elle n'existe pas."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                pseudo VARCHAR(25) NOT NULL,
                pseudo_number INT NOT NULL DEFAULT 1,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                email_confirmed BOOLEAN DEFAULT FALSE,
                confirmation_token VARCHAR(64),
                confirmation_sent_at TIMESTAMP,
                reset_token VARCHAR(64),
                reset_sent_at TIMESTAMP,
                device_id VARCHAR(64),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(pseudo, pseudo_number)
            )
        """)

        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email') THEN
                    ALTER TABLE users ADD COLUMN email VARCHAR(255);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_confirmed') THEN
                    ALTER TABLE users ADD COLUMN email_confirmed BOOLEAN DEFAULT FALSE;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='confirmation_token') THEN
                    ALTER TABLE users ADD COLUMN confirmation_token VARCHAR(64);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='confirmation_sent_at') THEN
                    ALTER TABLE users ADD COLUMN confirmation_sent_at TIMESTAMP;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token') THEN
                    ALTER TABLE users ADD COLUMN reset_token VARCHAR(64);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_sent_at') THEN
                    ALTER TABLE users ADD COLUMN reset_sent_at TIMESTAMP;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
                    ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
                END IF;
                -- Migration: ajouter pseudo_number et ajuster les contraintes
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pseudo_number') THEN
                    ALTER TABLE users ADD COLUMN pseudo_number INT NOT NULL DEFAULT 1;
                    -- Supprimer l'ancienne contrainte UNIQUE sur pseudo seul si elle existe
                    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='users' AND constraint_type='UNIQUE' AND constraint_name='users_pseudo_key') THEN
                        ALTER TABLE users DROP CONSTRAINT users_pseudo_key;
                    END IF;
                    -- Ajouter la contrainte UNIQUE composite (pseudo, pseudo_number)
                    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='users' AND constraint_name='users_pseudo_pseudo_number_key') THEN
                        ALTER TABLE users ADD CONSTRAINT users_pseudo_pseudo_number_key UNIQUE (pseudo, pseudo_number);
                    END IF;
                END IF;
                -- Ajouter colonne preferences JSONB si elle n'existe pas
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='preferences') THEN
                    ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
                END IF;
                -- Agrandir pseudo si nécessaire
                ALTER TABLE users ALTER COLUMN pseudo TYPE VARCHAR(25);
            END $$;
        """)

        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_pseudo ON users(pseudo)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_users_confirmation_token ON users(confirmation_token)")

        conn.commit()
        cur.close()
        conn.close()
        print("✅ Tables users initialisées")
        return True

    except Exception as e:
        print(f"❌ Erreur init tables: {e}")
        return False


# ============================================================================
# ROUTES - STATIC FILES
# ============================================================================

@app.route('/')
def index():
    """Sert l'interface utilisateur"""
    return send_from_directory('.', 'index.html')


@app.route('/onboarding/')
@app.route('/onboarding')
def onboarding():
    """Sert l'onboarding React (build Vite)"""
    return send_from_directory('onboarding_dist', 'index.html')


@app.route('/onboarding/<path:filename>')
def onboarding_assets(filename):
    """Sert les assets statiques du build Vite"""
    return send_from_directory('onboarding_dist', filename)


@app.route('/health')
def health():
    """Health check"""
    return jsonify({"status": "ok", "service": "gedeon-user", "mode": "readonly"})


# ============================================================================
# API - INSCRIPTION / CONNEXION / CONFIRMATION
# ============================================================================

@app.route('/api/auth/check-pseudo', methods=['GET'])
def check_pseudo():
    """Retourne le prochain numéro disponible pour un pseudo donné."""
    pseudo = request.args.get('pseudo', '').strip()
    valid, error = validate_pseudo(pseudo)
    if not valid:
        return jsonify({"status": "error", "message": error}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT COALESCE(MAX(pseudo_number), 0) + 1 AS next_number FROM users WHERE LOWER(pseudo) = LOWER(%s)",
            (pseudo,)
        )
        next_number = cur.fetchone()['next_number']
        cur.close()
        conn.close()
        return jsonify({"status": "success", "pseudo": pseudo, "next_number": next_number}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/auth/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur (ne doit pas déjà exister)"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        pseudo = data.get('pseudo', '').strip()
        password = data.get('password', '')
        device_id = data.get('device_id', '').strip()

        # Validation email
        if not email or not is_valid_email(email):
            return jsonify({"status": "error", "message": "Email invalide"}), 400

        # Validation pseudo
        valid, error = validate_pseudo(pseudo)
        if not valid:
            return jsonify({"status": "error", "message": error}), 400

        # Validation mot de passe
        if not password or len(password) < 4:
            return jsonify({"status": "error", "message": "Mot de passe: 4 caractères minimum"}), 400

        if len(password) > 50:
            return jsonify({"status": "error", "message": "Mot de passe trop long (50 max)"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        # Vérifier si l'email existe déjà
        cur.execute("SELECT id, email_confirmed FROM users WHERE email = %s", (email,))
        existing = cur.fetchone()
        if existing:
            cur.close()
            conn.close()
            if not existing['email_confirmed']:
                return jsonify({"status": "error", "message": "Cet email est en attente de confirmation. Vérifiez vos emails."}), 409
            return jsonify({"status": "error", "message": "Cet email est déjà utilisé"}), 409

        # Calculer le prochain numéro pour ce pseudo
        cur.execute(
            "SELECT COALESCE(MAX(pseudo_number), 0) + 1 AS next_number FROM users WHERE LOWER(pseudo) = LOWER(%s)",
            (pseudo,)
        )
        pseudo_number = cur.fetchone()['next_number']

        # Créer l'utilisateur
        confirmation_token = generate_confirmation_token()
        password_hash = generate_password_hash(password)
        cur.execute(
            """INSERT INTO users (email, pseudo, pseudo_number, password_hash, device_id, email_confirmed, confirmation_token, confirmation_sent_at)
               VALUES (%s, %s, %s, %s, %s, FALSE, %s, CURRENT_TIMESTAMP)
               RETURNING id, pseudo, pseudo_number, email""",
            (email, pseudo, pseudo_number, password_hash, device_id or None, confirmation_token)
        )
        new_user = cur.fetchone()
        conn.commit()

        display_name = pseudo + '_' + str(pseudo_number)

        # Envoyer l'email de confirmation
        if AUTH_EMAIL_AVAILABLE:
            success, error_msg = send_confirmation_email(email, display_name, confirmation_token)
            if not success:
                print(f"⚠️ Erreur envoi email: {error_msg}")

        cur.close()
        conn.close()

        print(f"👤 Inscription: {display_name} ({email})")

        return jsonify({
            "status": "success",
            "message": "Compte créé ! Vérifiez votre email pour confirmer."
        }), 201

    except Exception as e:
        print(f"❌ Erreur register: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Connexion utilisateur (email + password)"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({"status": "error", "message": "Email et mot de passe requis"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT id, pseudo, pseudo_number, email, password_hash, email_confirmed, COALESCE(preferences, '{}') as preferences FROM users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()

        if not user:
            cur.close()
            conn.close()
            return jsonify({"status": "error", "message": "Email ou mot de passe incorrect"}), 401

        if not user['password_hash'] or not check_password_hash(user['password_hash'], password):
            cur.close()
            conn.close()
            return jsonify({"status": "error", "message": "Email ou mot de passe incorrect"}), 401

        if not user['email_confirmed']:
            cur.close()
            conn.close()
            return jsonify({
                "status": "error",
                "message": "Email non confirmé. Vérifiez votre boîte mail.",
                "code": "EMAIL_NOT_CONFIRMED"
            }), 403

        # Mise à jour last_seen
        cur.execute("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = %s", (user['id'],))
        conn.commit()
        cur.close()
        conn.close()

        # Session
        display_name = user['pseudo'] + '_' + str(user['pseudo_number'])
        session['user_logged_in'] = True
        session['user_id'] = user['id']
        session['user_pseudo'] = display_name
        session['user_email'] = user['email']
        session['user_preferences'] = user.get('preferences') or {}

        print(f"✅ Login: {display_name} ({email})")

        return jsonify({
            "status": "success",
            "message": "Connexion réussie",
            "username": display_name
        }), 200

    except Exception as e:
        print(f"❌ Erreur login: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Déconnexion"""
    username = session.get('user_pseudo', 'unknown')
    session.clear()
    print(f"👋 Logout: {username}")
    return jsonify({"status": "success", "message": "Déconnexion réussie"}), 200


@app.route('/api/auth/check', methods=['GET'])
def check_login():
    """Vérifie si l'utilisateur est connecté"""
    if check_auth():
        return jsonify({
            "status": "success",
            "logged_in": True,
            "username": session.get('user_pseudo'),
            "preferences": session.get('user_preferences', {})
        }), 200
    else:
        return jsonify({
            "status": "success",
            "logged_in": False
        }), 200


@app.route('/api/auth/preferences', methods=['GET'])
@require_auth
def get_preferences():
    """Récupère les préférences de l'utilisateur connecté."""
    try:
        user_id = session.get('user_id')
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COALESCE(preferences, '{}') as preferences FROM users WHERE id = %s", (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        prefs = row['preferences'] if row else {}
        return jsonify({"status": "success", "preferences": prefs}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/auth/preferences', methods=['POST'])
@require_auth
def save_preferences():
    """Sauvegarde les préférences de l'utilisateur connecté."""
    try:
        user_id = session.get('user_id')
        data = request.get_json()
        preferences = data.get('preferences', {})

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET preferences = %s WHERE id = %s",
            (json.dumps(preferences), user_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        session['user_preferences'] = preferences
        print(f"⚙️ Préférences sauvées: user_id={user_id}, interests={preferences.get('interests', [])}")
        return jsonify({"status": "success", "message": "Préférences sauvegardées"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/auth/resend-confirmation', methods=['POST'])
def resend_confirmation():
    """Renvoie l'email de confirmation"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()

        if not email:
            return jsonify({"status": "error", "message": "Email requis"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT id, pseudo, pseudo_number, email_confirmed FROM users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()

        if not user:
            cur.close()
            conn.close()
            return jsonify({"status": "error", "message": "Email non trouvé"}), 404

        if user['email_confirmed']:
            cur.close()
            conn.close()
            return jsonify({"status": "error", "message": "Email déjà confirmé"}), 400

        new_token = generate_confirmation_token()
        cur.execute(
            "UPDATE users SET confirmation_token = %s, confirmation_sent_at = CURRENT_TIMESTAMP WHERE id = %s",
            (new_token, user['id'])
        )
        conn.commit()

        if AUTH_EMAIL_AVAILABLE:
            display_name = user['pseudo'] + '_' + str(user['pseudo_number'])
            send_confirmation_email(email, display_name, new_token)

        cur.close()
        conn.close()

        return jsonify({"status": "success", "message": "Email de confirmation renvoyé"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/confirm', methods=['GET'])
def confirm_email():
    """Confirme l'email via le lien cliqué"""
    token = request.args.get('token', '').strip()

    if not token:
        return send_from_directory('.', 'confirmation-error.html')

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT id, pseudo, pseudo_number, email_confirmed, confirmation_sent_at FROM users WHERE confirmation_token = %s",
            (token,)
        )
        user = cur.fetchone()

        if not user:
            cur.close()
            conn.close()
            return send_from_directory('.', 'confirmation-error.html')

        if user['email_confirmed']:
            cur.close()
            conn.close()
            return send_from_directory('.', 'confirmation-success.html')

        if is_token_expired(user['confirmation_sent_at']):
            cur.close()
            conn.close()
            return send_from_directory('.', 'confirmation-error.html')

        cur.execute(
            "UPDATE users SET email_confirmed = TRUE, confirmation_token = NULL WHERE id = %s",
            (user['id'],)
        )
        conn.commit()
        cur.close()
        conn.close()

        display_name = user['pseudo'] + '_' + str(user['pseudo_number'])
        print(f"✅ Email confirmé: {display_name}")
        return send_from_directory('.', 'confirmation-success.html')

    except Exception as e:
        print(f"❌ Erreur confirmation: {e}")
        return send_from_directory('.', 'confirmation-error.html')


@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Demande de réinitialisation du mot de passe"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()

        if not email:
            return jsonify({"status": "error", "message": "Email requis"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT id, pseudo, pseudo_number, email_confirmed FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        if not user:
            print(f"⚠️ Forgot-password: email {email} non trouvé en base")
        elif not user['email_confirmed']:
            print(f"⚠️ Forgot-password: {email} non confirmé")

        if user and user['email_confirmed']:
            reset_token = generate_confirmation_token()
            cur.execute(
                "UPDATE users SET reset_token = %s, reset_sent_at = CURRENT_TIMESTAMP WHERE id = %s",
                (reset_token, user['id'])
            )
            conn.commit()

            if AUTH_EMAIL_AVAILABLE:
                display_name = user['pseudo'] + '_' + str(user['pseudo_number'])
                success, error_msg = send_password_reset_email(email, display_name, reset_token)
                if success:
                    print(f"📧 Email reset envoyé à {email} pour {display_name}")
                else:
                    print(f"⚠️ Erreur envoi email reset: {error_msg}")
            else:
                print(f"⚠️ AUTH_EMAIL non disponible, email reset non envoyé")

        cur.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Si cet email existe, vous recevrez un lien de réinitialisation."
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/reset-password', methods=['GET'])
def reset_password_page():
    """Page de réinitialisation du mot de passe"""
    return send_from_directory('.', 'reset-password.html')


@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """Réinitialise le mot de passe avec le token"""
    try:
        data = request.get_json()
        token = data.get('token', '').strip()
        new_password = data.get('password', '')

        if not token:
            return jsonify({"status": "error", "message": "Token requis"}), 400

        if not new_password or len(new_password) < 4:
            return jsonify({"status": "error", "message": "Mot de passe: 4 caractères minimum"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT id, pseudo, pseudo_number, reset_sent_at FROM users WHERE reset_token = %s", (token,))
        user = cur.fetchone()

        if not user:
            cur.close()
            conn.close()
            return jsonify({"status": "error", "message": "Token invalide"}), 400

        if is_token_expired(user['reset_sent_at'], hours=1):
            cur.close()
            conn.close()
            return jsonify({"status": "error", "message": "Token expiré. Refaites une demande."}), 400

        password_hash = generate_password_hash(new_password)
        cur.execute(
            "UPDATE users SET password_hash = %s, reset_token = NULL WHERE id = %s",
            (password_hash, user['id'])
        )
        conn.commit()
        cur.close()
        conn.close()

        display_name = user['pseudo'] + '_' + str(user['pseudo_number'])
        print(f"🔐 Mot de passe réinitialisé: {display_name}")
        return jsonify({"status": "success", "message": "Mot de passe modifié !"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# API - USERS (LECTURE SEULE)
# ============================================================================

@app.route('/api/users', methods=['GET'])
@require_auth
def list_users():
    """Liste tous les utilisateurs avec leur nombre de scans"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT u.id, u.pseudo || '_' || COALESCE(u.pseudo_number, 1) as pseudo, u.created_at, u.last_seen,
                   COUNT(s.id) as scan_count
            FROM users u
            LEFT JOIN scanned_events s ON u.id = s.user_id
            GROUP BY u.id, u.pseudo, u.pseudo_number
            ORDER BY u.pseudo
        """)
        users = cur.fetchall()

        cur.close()
        conn.close()

        for user in users:
            if user.get('created_at'):
                user['created_at'] = user['created_at'].isoformat()
            if user.get('last_seen'):
                user['last_seen'] = user['last_seen'].isoformat()

        return jsonify({"status": "success", "users": users}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# API - SCANNED EVENTS (LECTURE SEULE)
# ============================================================================

@app.route('/api/scanned', methods=['GET'])
@require_auth
def get_scanned_events():
    """Récupère les événements scannés (lecture seule, publics uniquement)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT
                s.id, s.user_id, s.uid, s.title, s.category,
                s.begin_date, s.end_date, s.start_time, s.end_time,
                s.location_name, s.city, s.address, s.latitude, s.longitude,
                s.description, s.organizer, s.artists, s.pricing, s.tags,
                s.is_private, s.created_at, s.website, s.country,
                u.pseudo || '_' || u.pseudo_number as user_pseudo,
                (s.image_data IS NOT NULL OR s.image_path IS NOT NULL) as has_image
            FROM scanned_events s
            JOIN users u ON s.user_id = u.id
            WHERE s.is_private = FALSE
            ORDER BY s.created_at DESC
        """)
        events = cur.fetchall()

        cur.close()
        conn.close()

        for e in events:
            if e.get('begin_date'):
                e['begin_date'] = str(e['begin_date'])
            if e.get('end_date'):
                e['end_date'] = str(e['end_date'])
            if e.get('created_at'):
                e['created_at'] = e['created_at'].isoformat()

        return jsonify({
            "status": "success",
            "events": events,
            "count": len(events)
        }), 200

    except Exception as e:
        print(f"❌ Erreur get scanned: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# API - SCANNED EVENT IMAGE (LECTURE SEULE)
# ============================================================================

@app.route('/api/scanned/<int:event_id>/image', methods=['GET'])
@require_auth
def get_event_image(event_id):
    """Retourne l'image associée à un événement scanné"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT image_data, image_mime, image_path FROM scanned_events WHERE id = %s",
            (event_id,)
        )
        row = cur.fetchone()

        cur.close()
        conn.close()

        if not row:
            return jsonify({"status": "error", "message": "Événement non trouvé"}), 404

        if row.get('image_data'):
            mime = row.get('image_mime') or 'image/jpeg'
            raw = row['image_data']
            if isinstance(raw, str):
                b64 = raw.split(',', 1)[-1] if raw.startswith('data:') else raw
            else:
                b64 = base64.b64encode(bytes(raw)).decode('ascii')
            return jsonify({
                "status": "success",
                "data_url": f"data:{mime};base64,{b64}"
            }), 200

        if row.get('image_path'):
            return jsonify({
                "status": "success",
                "data_url": row['image_path']
            }), 200

        return jsonify({"status": "error", "message": "Aucune image"}), 404

    except Exception as e:
        print(f"❌ Erreur get image: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# API - EVENTS NEARBY (LECTURE SEULE)
# ============================================================================

@app.route('/api/events/nearby', methods=['GET'])
@require_auth
def get_nearby_events():
    """Événements DATAtourisme à proximité."""
    try:
        center_lat = request.args.get('lat', type=float)
        center_lon = request.args.get('lon', type=float)
        prefs = get_user_preferences()
        radius_km = request.args.get('radiusKm', get_default_radius_from_prefs(prefs), type=int)
        days_ahead = request.args.get('days', DAYS_AHEAD_DEFAULT, type=int)

        if center_lat is None or center_lon is None:
            return jsonify({"status": "error", "message": "Paramètres 'lat' et 'lon' requis"}), 400

        events = fetch_datatourisme_events(center_lat, center_lon, radius_km, days_ahead)
        for event in events:
            event['relevanceScore'] = score_event(event, prefs)
        events.sort(key=lambda e: (-e.get('relevanceScore', 0), e.get("distanceKm") or 999, e.get("begin") or ""))

        return jsonify({
            "status": "success",
            "center": {"latitude": center_lat, "longitude": center_lon},
            "radiusKm": radius_km,
            "days": days_ahead,
            "events": events,
            "count": len(events),
            "sources": {"DATAtourisme": len(events)}
        }), 200

    except Exception as e:
        print(f"❌ Erreur events/nearby: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# API - CINEMA NEARBY (LECTURE SEULE)
# ============================================================================

@app.route('/api/cinema/nearby', methods=['GET'])
@require_auth
def get_nearby_cinema():
    """Cinémas à proximité avec séances Allociné."""
    try:
        center_lat = request.args.get('lat', type=float)
        center_lon = request.args.get('lon', type=float)
        prefs = get_user_preferences()
        radius_km = request.args.get('radiusKm', get_default_radius_from_prefs(prefs), type=int)
        batch = request.args.get('batch', 0, type=int)
        batch_size = request.args.get('batchSize', 5, type=int)

        if center_lat is None or center_lon is None:
            return jsonify({"status": "error", "message": "Paramètres 'lat' et 'lon' requis"}), 400

        if not CINEMAS_ALLOCINE_DATA:
            load_cinemas_allocine()

        if not CINEMAS_ALLOCINE_DATA:
            return jsonify({"status": "success", "events": [], "count": 0, "hasMore": False}), 200

        nearby_cinemas = []
        for cinema in CINEMAS_ALLOCINE_DATA:
            lat = cinema.get('lat')
            lon = cinema.get('lon')
            if not lat or not lon:
                continue
            dist = haversine_km(center_lat, center_lon, lat, lon)
            if dist <= radius_km:
                nearby_cinemas.append({
                    'id': cinema['id'],
                    'name': cinema['name'],
                    'address': cinema.get('address', ''),
                    'lat': lat,
                    'lon': lon,
                    'distance': dist
                })

        nearby_cinemas.sort(key=lambda c: c['distance'])
        total_cinemas = len(nearby_cinemas)

        start_idx = batch * batch_size
        end_idx = start_idx + batch_size
        cinemas_batch = nearby_cinemas[start_idx:end_idx]
        has_more = end_idx < total_cinemas and end_idx < 50

        if not cinemas_batch:
            return jsonify({
                "status": "success", "events": [], "count": 0,
                "totalCinemas": total_cinemas, "batch": batch, "hasMore": False
            }), 200

        today_str = date.today().strftime("%Y-%m-%d")
        tomorrow_str = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
        all_events = []
        cache_hits = 0

        for i, cinema in enumerate(cinemas_batch):
            try:
                cinema_id = cinema['id']
                now = time.time()
                from_cache = False
                movies = []

                if cinema_id in FILMS_CACHE:
                    cached = FILMS_CACHE[cinema_id]
                    if now - cached['timestamp'] < FILMS_CACHE_TTL:
                        movies = cached['films']
                        from_cache = True
                        cache_hits += 1

                if not from_cache:
                    cinema_info, movies = fetch_movies_for_cinema(cinema, today_str, tomorrow_str)
                    FILMS_CACHE[cinema_id] = {'films': movies, 'timestamp': now}
                    if i < len(cinemas_batch) - 1:
                        time.sleep(0.5)

                if movies:
                    for movie in movies:
                        runtime = movie.get('runtime', 0)
                        duration_str = movie.get('duration', '')
                        if runtime and isinstance(runtime, int):
                            h, m = runtime // 3600, (runtime % 3600) // 60
                            duration = f"{h}h{m:02d}" if h else f"{m}min"
                        elif duration_str:
                            duration = duration_str
                        else:
                            duration = ""

                        showtimes_str = movie.get('showtimes_str', '')
                        genres = movie.get('genres', [])
                        genres_str = ", ".join(genres[:3]) if genres else ""

                        desc_parts = []
                        if duration:
                            desc_parts.append(duration)
                        if genres_str:
                            desc_parts.append(genres_str)
                        if showtimes_str:
                            desc_parts.append(showtimes_str)

                        movie_date = today_str
                        if showtimes_str and 'Dem:' in showtimes_str and 'Auj:' not in showtimes_str:
                            movie_date = tomorrow_str

                        event = {
                            "uid": f"allocine-{cinema['id']}-{movie.get('title', '')[:20]}",
                            "title": f"🎬 {movie.get('title', 'Film')}",
                            "begin": movie_date,
                            "end": movie_date,
                            "locationName": cinema['name'],
                            "city": "",
                            "address": cinema['address'],
                            "latitude": cinema['lat'],
                            "longitude": cinema['lon'],
                            "distanceKm": round(cinema['distance'], 1),
                            "openagendaUrl": "",
                            "source": "Allocine",
                            "description": " • ".join(desc_parts) if desc_parts else "",
                        }
                        event['relevanceScore'] = score_event(event, prefs)
                        all_events.append(event)
            except Exception as e:
                print(f"      ❌ Erreur {cinema.get('name', '?')[:20]}: {e}")

        all_events.sort(key=lambda e: (-e.get('relevanceScore', 0), e.get('distanceKm') or 999))
        return jsonify({
            "status": "success",
            "center": {"latitude": center_lat, "longitude": center_lon},
            "radiusKm": radius_km,
            "events": all_events,
            "count": len(all_events),
            "totalCinemas": total_cinemas,
            "batch": batch,
            "hasMore": has_more,
            "source": "Allocine"
        }), 200

    except Exception as e:
        print(f"❌ Erreur cinema/nearby: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# API - SALONS NEARBY (LECTURE SEULE)
# ============================================================================

@app.route('/api/salons/nearby', methods=['GET'])
@require_auth
def get_nearby_salons():
    """Salons à proximité."""
    try:
        center_lat = request.args.get('lat', type=float)
        center_lon = request.args.get('lon', type=float)
        prefs = get_user_preferences()
        radius_km = request.args.get('radiusKm', get_default_radius_from_prefs(prefs), type=int)

        if center_lat is None or center_lon is None:
            return jsonify({"status": "error", "message": "Paramètres 'lat' et 'lon' requis"}), 400

        if not SALONS_DATA:
            load_salons_data()

        today = date.today()
        nearby_salons = []

        for salon in SALONS_DATA:
            lat = salon.get('lat')
            lon = salon.get('lon')
            if not lat or not lon:
                continue
            dist = haversine_km(center_lat, center_lon, lat, lon)
            if dist > radius_km:
                continue
            salon_date = parse_salon_date(salon.get('dates', ''))
            if salon_date and salon_date < today:
                continue
            salon_event = {
                "uid": f"salon-{hash(salon['name']) % 100000}",
                "title": salon['name'],
                "begin": salon.get('dates', ''),
                "duration": salon.get('duration', ''),
                "locationName": salon.get('venue', ''),
                "city": salon.get('city', ''),
                "latitude": lat,
                "longitude": lon,
                "distanceKm": round(dist, 1),
                "frequency": salon.get('frequency', ''),
                "openagendaUrl": salon.get('url', ''),
                "source": "EventsEye"
            }
            salon_event['relevanceScore'] = score_event(salon_event, prefs)
            nearby_salons.append(salon_event)

        nearby_salons.sort(key=lambda s: (-s.get('relevanceScore', 0), s['distanceKm']))

        return jsonify({
            "status": "success",
            "center": {"latitude": center_lat, "longitude": center_lon},
            "radiusKm": radius_km,
            "events": nearby_salons,
            "count": len(nearby_salons),
            "source": "EventsEye"
        }), 200

    except Exception as e:
        print(f"❌ Erreur salons/nearby: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# API - STATS (LECTURE SEULE)
# ============================================================================

@app.route('/api/stats', methods=['GET'])
@require_auth
def get_stats():
    """Statistiques pour l'interface"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        stats = {}

        cur.execute("SELECT COUNT(*) as count FROM scanned_events WHERE is_private = FALSE")
        stats['total_events'] = cur.fetchone()['count']

        cur.execute("SELECT COUNT(*) as count FROM users WHERE email_confirmed = TRUE")
        stats['total_users'] = cur.fetchone()['count']

        cur.execute("""
            SELECT COALESCE(category, 'Non défini') as category, COUNT(*) as count
            FROM scanned_events WHERE is_private = FALSE
            GROUP BY category ORDER BY count DESC
        """)
        stats['by_category'] = [dict(row) for row in cur.fetchall()]

        cur.execute("""
            SELECT COALESCE(city, 'Non défini') as city, COUNT(*) as count
            FROM scanned_events WHERE is_private = FALSE
            GROUP BY city ORDER BY count DESC LIMIT 20
        """)
        stats['by_city'] = [dict(row) for row in cur.fetchall()]

        cur.execute("""
            SELECT u.pseudo || '_' || u.pseudo_number as pseudo, COUNT(s.id) as count
            FROM users u LEFT JOIN scanned_events s ON u.id = s.user_id
            WHERE s.is_private = FALSE OR s.id IS NULL
            GROUP BY u.id, u.pseudo, u.pseudo_number ORDER BY count DESC LIMIT 20
        """)
        stats['by_user'] = [dict(row) for row in cur.fetchall()]

        cur.execute("""
            SELECT COUNT(*) as count FROM scanned_events
            WHERE is_private = FALSE AND created_at > NOW() - INTERVAL '7 days'
        """)
        stats['this_week'] = cur.fetchone()['count']

        cur.close()
        conn.close()

        return jsonify({"status": "success", "stats": stats}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================================
# INITIALISATION AU DÉMARRAGE
# ============================================================================

if DB_CONFIG:
    init_user_tables()

# Charger les données statiques au démarrage
load_cinemas_allocine()
load_salons_data()

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 GEDEON Interface Utilisateur - Port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
