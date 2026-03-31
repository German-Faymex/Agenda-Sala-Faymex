import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./agenda_sala.db")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

# SMTP config
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

# App config
APP_NAME = "Agenda Sala Faymex"
TIMEZONE = "America/Santiago"
BOOKING_START_HOUR = 8
BOOKING_END_HOUR = 17
BOOKING_END_MINUTE = 30
SLOT_MINUTES = 30
MAX_ADVANCE_DAYS = 14
