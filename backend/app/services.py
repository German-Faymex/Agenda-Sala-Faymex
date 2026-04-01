from datetime import datetime, date, timedelta, timezone
from zoneinfo import ZoneInfo
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Employee, Reservation
from app.config import (
    BOOKING_START_HOUR, BOOKING_END_HOUR, BOOKING_END_MINUTE,
    SLOT_MINUTES, MAX_ADVANCE_DAYS, TIMEZONE
)

CHILE_TZ = ZoneInfo(TIMEZONE)


def now_chile() -> datetime:
    return datetime.now(CHILE_TZ)


def today_chile() -> date:
    return now_chile().date()
from app.email_service import send_confirmation_email, send_cancellation_email


def get_all_slots() -> list[str]:
    """Generate all 30-min slot start times from 08:00 to 17:00."""
    slots = []
    hour = BOOKING_START_HOUR
    minute = 0
    end_minutes = BOOKING_END_HOUR * 60 + BOOKING_END_MINUTE
    while hour * 60 + minute < end_minutes:
        slots.append(f"{hour:02d}:{minute:02d}")
        minute += SLOT_MINUTES
        if minute >= 60:
            hour += 1
            minute = 0
    return slots


def validate_time_range(start_time: str, end_time: str) -> str | None:
    """Validate that start/end times are valid slots. Returns error message or None."""
    all_slots = get_all_slots()
    last_slot = all_slots[-1]
    # end_time must be a valid end (slot + 30min) or 17:30
    h, m = map(int, last_slot.split(":"))
    m += SLOT_MINUTES
    if m >= 60:
        h += 1
        m -= 60
    max_end = f"{h:02d}:{m:02d}"

    if start_time not in all_slots:
        return f"Hora de inicio inválida: {start_time}"

    # Validate end_time is on a 30-min boundary
    eh, em = map(int, end_time.split(":"))
    if em % SLOT_MINUTES != 0:
        return f"Hora de fin inválida: {end_time}"

    if end_time <= start_time:
        return "La hora de fin debe ser posterior a la de inicio"

    if end_time > max_end:
        return f"La hora máxima de fin es {max_end}"

    return None


def validate_date_and_time(date_str: str, start_time: str) -> str | None:
    """Validate date is a weekday within the allowed range and time is not in the past."""
    try:
        d = date.fromisoformat(date_str)
    except ValueError:
        return "Fecha inválida"

    today = today_chile()
    if d < today:
        return "No se puede reservar en fechas pasadas"
    if d > today + timedelta(days=MAX_ADVANCE_DAYS):
        return f"Solo se puede reservar hasta {MAX_ADVANCE_DAYS} días en adelante"
    if d.weekday() >= 5:  # Saturday=5, Sunday=6
        return "Solo se puede reservar de lunes a viernes"

    # If booking for today, check that the start time hasn't already passed
    if d == today:
        now = now_chile()
        sh, sm = map(int, start_time.split(":"))
        if (sh < now.hour) or (sh == now.hour and sm <= now.minute):
            return "No se puede reservar en horarios que ya pasaron"

    return None


async def get_conflicting_reservations(
    db: AsyncSession, date_str: str, start_time: str, end_time: str,
    exclude_id: int | None = None
) -> list[Reservation]:
    """Find active reservations that overlap with the given time range."""
    query = (
        select(Reservation)
        .options(selectinload(Reservation.employee))
        .where(
            and_(
                Reservation.date == date_str,
                Reservation.cancelled == False,
                Reservation.start_time < end_time,
                Reservation.end_time > start_time,
            )
        )
    )
    if exclude_id:
        query = query.where(Reservation.id != exclude_id)

    result = await db.execute(query)
    return list(result.scalars().all())


async def create_reservation(
    db: AsyncSession, employee_id: int, date_str: str,
    start_time: str, end_time: str, subject: str | None
) -> dict:
    """
    Create a reservation with priority override logic.
    Returns dict with reservation, overridden flag, and displaced employees.
    """
    # Get the requesting employee
    employee = await db.get(Employee, employee_id)
    if not employee:
        raise ValueError("Empleado no encontrado")
    if not employee.active:
        raise ValueError("Empleado inactivo")

    # Validate inputs
    date_error = validate_date_and_time(date_str, start_time)
    if date_error:
        raise ValueError(date_error)

    time_error = validate_time_range(start_time, end_time)
    if time_error:
        raise ValueError(time_error)

    # Check conflicts
    conflicts = await get_conflicting_reservations(db, date_str, start_time, end_time)

    displaced = []
    if conflicts:
        # Check if we can override all conflicts
        for conflict in conflicts:
            if conflict.employee.hierarchy_level < employee.hierarchy_level:
                # Conflict has higher priority (lower number = higher)
                raise ValueError(
                    f"La sala está reservada por {conflict.employee.name} "
                    f"({conflict.employee.position}) quien tiene mayor jerarquía"
                )
            elif conflict.employee.hierarchy_level == employee.hierarchy_level:
                # Same level — first come first served
                raise ValueError(
                    f"La sala está reservada por {conflict.employee.name} "
                    f"({conflict.employee.position}) quien tiene el mismo nivel "
                    f"y reservó primero"
                )
            # else: we have higher priority, can override

        # Cancel all conflicting reservations
        for conflict in conflicts:
            conflict.cancelled = True
            conflict.cancelled_reason = (
                f"Anulada por reserva prioritaria de {employee.name} ({employee.position})"
            )
            displaced.append({
                "name": conflict.employee.name,
                "email": conflict.employee.email,
                "start_time": conflict.start_time,
                "end_time": conflict.end_time,
            })

    # Create the new reservation
    reservation = Reservation(
        employee_id=employee_id,
        date=date_str,
        start_time=start_time,
        end_time=end_time,
        subject=subject,
    )
    db.add(reservation)
    await db.commit()
    await db.refresh(reservation)

    # Send emails (fire and forget — don't fail the reservation if email fails)
    try:
        await send_confirmation_email(
            employee.name, employee.email, date_str, start_time, end_time, subject
        )
    except Exception:
        pass

    for d in displaced:
        try:
            await send_cancellation_email(
                d["name"], d["email"], date_str,
                d["start_time"], d["end_time"],
                employee.name, employee.position
            )
        except Exception:
            pass

    return {
        "reservation": reservation,
        "employee": employee,
        "overridden": len(displaced) > 0,
        "displaced": displaced,
    }


async def get_reservations_for_date(db: AsyncSession, date_str: str) -> list[Reservation]:
    """Get all active reservations for a specific date."""
    result = await db.execute(
        select(Reservation)
        .options(selectinload(Reservation.employee))
        .where(
            and_(
                Reservation.date == date_str,
                Reservation.cancelled == False,
            )
        )
        .order_by(Reservation.start_time)
    )
    return list(result.scalars().all())


async def get_reservations_for_week(db: AsyncSession, start_date: str) -> list[Reservation]:
    """Get all active reservations for a week starting from start_date."""
    start = date.fromisoformat(start_date)
    end = start + timedelta(days=5)  # Mon-Fri
    result = await db.execute(
        select(Reservation)
        .options(selectinload(Reservation.employee))
        .where(
            and_(
                Reservation.date >= start_date,
                Reservation.date < end.isoformat(),
                Reservation.cancelled == False,
            )
        )
        .order_by(Reservation.date, Reservation.start_time)
    )
    return list(result.scalars().all())


async def cancel_reservation(db: AsyncSession, reservation_id: int, employee_id: int) -> Reservation:
    """Cancel a reservation. Only the owner can cancel."""
    reservation = await db.get(Reservation, reservation_id)
    if not reservation:
        raise ValueError("Reserva no encontrada")
    if reservation.cancelled:
        raise ValueError("La reserva ya está cancelada")
    if reservation.employee_id != employee_id:
        raise ValueError("Solo puedes cancelar tus propias reservas")

    reservation.cancelled = True
    reservation.cancelled_reason = "Cancelada por el usuario"
    await db.commit()
    return reservation
