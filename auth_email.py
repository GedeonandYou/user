#!/usr/bin/env python3
"""
Module d'authentification GEDEON - Interface Lecture Seule
- Email + Pseudo + Mot de passe
- Confirmation par email via SMTP (Gmail)
"""

import os
import ssl
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

# Configuration SMTP
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL') or SMTP_USER
APP_URL = os.environ.get('APP_URL', 'https://gedeon-readonly.onrender.com')

# Duree de validite du token de confirmation (24h)
TOKEN_EXPIRY_HOURS = 24


def _smtp_available():
    """Verifie si la config SMTP est presente."""
    return bool(SMTP_USER and SMTP_PASSWORD)


def _send_email(to_email, subject, html_content, text_content=None):
    """
    Envoie un email via SMTP.
    Retourne (success, error_message)
    """
    if not _smtp_available():
        print("SMTP_USER ou SMTP_PASSWORD non configure")
        return False, "Configuration email manquante"

    msg = MIMEMultipart('alternative')
    msg['From'] = SMTP_FROM_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject

    if text_content:
        msg.attach(MIMEText(text_content, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, to_email, msg.as_string())

        print(f"Email envoye a {to_email}")
        return True, None

    except Exception as e:
        print(f"SMTP exception: {e}")
        return False, str(e)


def generate_confirmation_token():
    """Genere un token de confirmation unique (32 caracteres hex)"""
    return secrets.token_hex(16)


def send_confirmation_email(email, pseudo, token):
    """
    Envoie l'email de confirmation via SMTP.
    Retourne (success, error_message)
    """
    confirmation_link = f"{APP_URL}/confirm?token={token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; color: #888; font-size: 12px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Bienvenue sur GEDEON !</h1>
            </div>
            <div class="content">
                <p>Bonjour <strong>{pseudo}</strong>,</p>
                <p>Merci de vous etre inscrit sur GEDEON pour consulter les evenements.</p>
                <p>Pour activer votre compte, cliquez sur le bouton ci-dessous :</p>
                <p style="text-align: center;">
                    <a href="{confirmation_link}" class="button">Confirmer mon compte</a>
                </p>
                <p>Ou copiez ce lien dans votre navigateur :</p>
                <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px; font-size: 12px;">
                    {confirmation_link}
                </p>
                <p><strong>Ce lien expire dans 24 heures.</strong></p>
            </div>
            <div class="footer">
                <p>GEDEON - Consultation des evenements</p>
                <p>Si vous n'avez pas cree de compte, ignorez cet email.</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"""
    Bienvenue sur GEDEON, {pseudo} !

    Pour confirmer votre compte, cliquez sur ce lien :
    {confirmation_link}

    Ce lien expire dans 24 heures.

    Si vous n'avez pas cree de compte, ignorez cet email.
    """

    return _send_email(email, 'Confirmez votre compte GEDEON', html_content, text_content)


def send_password_reset_email(email, pseudo, token):
    """
    Envoie l'email de reinitialisation de mot de passe.
    """
    reset_link = f"{APP_URL}/reset-password?token={token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
            .footer {{ text-align: center; color: #888; font-size: 12px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Reinitialisation du mot de passe</h1>
            </div>
            <div class="content">
                <p>Bonjour <strong>{pseudo}</strong>,</p>
                <p>Vous avez demande a reinitialiser votre mot de passe GEDEON.</p>
                <p style="text-align: center;">
                    <a href="{reset_link}" class="button">Changer mon mot de passe</a>
                </p>
                <p><strong>Ce lien expire dans 1 heure.</strong></p>
                <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
            </div>
            <div class="footer">
                <p>GEDEON - Consultation des evenements</p>
            </div>
        </div>
    </body>
    </html>
    """

    return _send_email(email, 'Reinitialisez votre mot de passe GEDEON', html_content)


def is_valid_email(email):
    """Validation basique d'email"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def is_token_expired(created_at, hours=TOKEN_EXPIRY_HOURS):
    """Verifie si un token a expire"""
    if not created_at:
        return True
    expiry = created_at + timedelta(hours=hours)
    return datetime.now() > expiry
