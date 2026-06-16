import logging
from celery import Celery
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Celery app
celery_app = Celery("triply_tasks", broker=REDIS_URL, backend=REDIS_URL)

@celery_app.task
def send_price_drop_notification(
    email: str,
    phone: str,
    segment_name: str,
    target_price: float,
    current_price: float,
    booking_link: str
):
    """
    Sends the price drop alert notification via Twilio (WhatsApp) and SendGrid (Email).
    """
    logger.info(f"Sending price drop notification to {email} and {phone}...")
    
    # 1. Dispatch Email (SendGrid)
    try:
        from backend.utils.email import send_email_alert
        subject = f"🚨 Price Drop Alert: {segment_name} is now ₹{current_price}!"
        body = f"""
        <html>
            <body>
                <h2>Good News from Triply AI!</h2>
                <p>The price of <strong>{segment_name}</strong> has dropped below your target price of ₹{target_price:.2f}.</p>
                <p>Current Price: <strong>₹{current_price:.2f}</strong></p>
                <p>You can book it right away here:</p>
                <a href="{booking_link}" style="display:inline-block;background-color:#1D4ED8;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Book Now</a>
                <br/><br/>
                <p>Happy Journey,<br/>Team Triply AI</p>
            </body>
        </html>
        """
        email_sent = send_email_alert(email, subject, body)
        if email_sent:
            logger.info(f"Price alert email sent to {email}")
        else:
            logger.warning("Email send failed or credentials inactive.")
    except Exception as e:
        logger.error(f"Failed to send email alert: {e}")

    # 2. Dispatch WhatsApp (Twilio)
    try:
        from backend.utils.whatsapp import send_whatsapp_alert
        message_body = (
            f"🚨 *Triply AI Price Drop Alert!*\n\n"
            f"The price for *{segment_name}* has dropped!\n"
            f"• Target Price: ₹{target_price:.2f}\n"
            f"• *Current Price: ₹{current_price:.2f}*\n\n"
            f"👉 Book immediately here: {booking_link}"
        )
        whatsapp_sent = send_whatsapp_alert(phone, message_body)
        if whatsapp_sent:
            logger.info(f"Price alert WhatsApp sent to {phone}")
        else:
            logger.warning("WhatsApp send failed or credentials inactive.")
    except Exception as e:
        logger.error(f"Failed to send WhatsApp alert: {e}")
