import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.config import Config


def send_expiry_alert_email(medicines):
    """
    Sends an email alert about near-expiry medicines.
    
    Args:
        medicines (list): List of medicine dictionaries with expiry info.
    """
    if not Config.EMAIL_SENDER or not Config.EMAIL_PASSWORD:
        raise ValueError("Email configuration not set. Skipping email send.")

    # Create email content
    subject = "⚠️ CareWise: Near-Expiry Medicines Alert"
    body = "Dear Team,\n\nHere are the medicines that are near expiry:\n\n"

    for med in medicines:
        body += f"- {med['medicine_name']} (Batch: {med['batch_number']})\n"
        body += f"  - Generic: {med['generic_name']}\n"
        body += f"  - Expiry: {med['expiry_date']}\n"
        body += f"  - Quantity: {med['quantity']}\n\n"

    body += "Please take necessary actions to avoid losses.\n\nBest regards,\nCareWise AI"

    # Create email
    msg = MIMEMultipart()
    msg['From'] = Config.EMAIL_SENDER
    msg['To'] = Config.EMAIL_RECEIVER
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))

    # Send email via SMTP
    try:
        with smtplib.SMTP(Config.EMAIL_SMTP_SERVER, Config.EMAIL_SMTP_PORT) as server:
            server.starttls()
            server.login(Config.EMAIL_SENDER, Config.EMAIL_PASSWORD)
            text = msg.as_string()
            server.sendmail(Config.EMAIL_SENDER, Config.EMAIL_RECEIVER, text)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        raise
