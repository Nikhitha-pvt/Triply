import os
import logging
from dotenv import load_dotenv
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# Load env vars
load_dotenv()

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

def send_email_alert(to_email: str, subject: str, html_content: str) -> bool:
    """
    Sends an email using SendGrid. Falls back to console logger if credentials missing.
    """
    if not SENDGRID_API_KEY:
        logger.info(f"[MOCK EMAIL] To: {to_email} | Subject: {subject} | Content: {html_content[:200]}...")
        return False
        
    try:
        message = Mail(
            from_email='alerts@triply.ai', # Should be verified sender in SendGrid
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"SendGrid response status code: {response.status_code}")
        return response.status_code in [200, 201, 202]
    except Exception as e:
        logger.error(f"SendGrid dispatch failed: {e}")
        return False
