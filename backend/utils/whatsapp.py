import os
import logging
from dotenv import load_dotenv
from twilio.rest import Client

# Load env variables
load_dotenv()

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886") # Twilio Sandbox default

def send_whatsapp_alert(to_phone: str, body: str) -> bool:
    """
    Sends a WhatsApp message using Twilio. Falls back to console log if credentials missing.
    """
    # Normalize phone format for Twilio (requires whatsapp:+prefix)
    target_phone = to_phone
    if not target_phone.startswith("whatsapp:"):
        # If it doesn't have country prefix, add India default (+91)
        if not target_phone.startswith("+"):
            target_phone = f"+91{target_phone}"
        target_phone = f"whatsapp:{target_phone}"
        
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.info(f"[MOCK WHATSAPP] To: {target_phone} | Sender: {TWILIO_WHATSAPP_FROM} | Message: {body}")
        return False
        
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            from_=TWILIO_WHATSAPP_FROM,
            body=body,
            to=target_phone
        )
        logger.info(f"Twilio WhatsApp message sent. SID: {message.sid}")
        return message.sid is not None
    except Exception as e:
        logger.error(f"Twilio WhatsApp dispatch failed: {e}")
        return False
