import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import aiosmtplib
from jinja2 import Template

from app.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, APP_NAME

logger = logging.getLogger(__name__)

CONFIRMATION_TEMPLATE = Template("""
<html>
<body style="font-family: Arial, sans-serif; color: #1C2226;">
  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #D82A34; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0;">{{ app_name }}</h1>
    </div>
    <div style="padding: 24px;">
      <h2>Reserva Confirmada</h2>
      <p>Hola <strong>{{ employee_name }}</strong>,</p>
      <p>Tu reserva de la sala de reuniones ha sido confirmada:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #eee;">{{ date }}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Horario</td><td style="padding: 8px; border-bottom: 1px solid #eee;">{{ start_time }} - {{ end_time }}</td></tr>
        {% if subject %}<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Asunto</td><td style="padding: 8px; border-bottom: 1px solid #eee;">{{ subject }}</td></tr>{% endif %}
      </table>
      <p style="color: #666; font-size: 12px;">Este es un correo automático, no responder.</p>
    </div>
  </div>
</body>
</html>
""")

CANCELLATION_TEMPLATE = Template("""
<html>
<body style="font-family: Arial, sans-serif; color: #1C2226;">
  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #D82A34; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0;">{{ app_name }}</h1>
    </div>
    <div style="padding: 24px;">
      <h2>Reserva Anulada por Prioridad</h2>
      <p>Hola <strong>{{ employee_name }}</strong>,</p>
      <p>Tu reserva de la sala de reuniones ha sido <strong>anulada</strong> porque una persona de mayor jerarquía necesita la sala:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #eee;">{{ date }}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Horario</td><td style="padding: 8px; border-bottom: 1px solid #eee;">{{ start_time }} - {{ end_time }}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Reservada por</td><td style="padding: 8px; border-bottom: 1px solid #eee;">{{ overrider_name }} ({{ overrider_position }})</td></tr>
      </table>
      <p>Te recomendamos buscar otro horario disponible.</p>
      <p style="color: #666; font-size: 12px;">Este es un correo automático, no responder.</p>
    </div>
  </div>
</body>
</html>
""")


async def send_email(to: str, subject: str, html_body: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP not configured, skipping email to %s", to)
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info("Email sent to %s", to)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        return False


async def send_confirmation_email(employee_name: str, email: str, date: str,
                                   start_time: str, end_time: str, subject: str | None):
    html = CONFIRMATION_TEMPLATE.render(
        app_name=APP_NAME, employee_name=employee_name,
        date=date, start_time=start_time, end_time=end_time, subject=subject
    )
    await send_email(email, f"Reserva Confirmada - {date} {start_time}", html)


async def send_cancellation_email(employee_name: str, email: str, date: str,
                                   start_time: str, end_time: str,
                                   overrider_name: str, overrider_position: str):
    html = CANCELLATION_TEMPLATE.render(
        app_name=APP_NAME, employee_name=employee_name,
        date=date, start_time=start_time, end_time=end_time,
        overrider_name=overrider_name, overrider_position=overrider_position
    )
    await send_email(email, f"Reserva Anulada - {date} {start_time}", html)
