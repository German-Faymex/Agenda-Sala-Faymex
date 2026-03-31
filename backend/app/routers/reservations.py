from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import ReservationCreate, ReservationOut, ReservationResponse, OverrideInfo
from app.services import (
    create_reservation, get_reservations_for_date,
    get_reservations_for_week, cancel_reservation, get_all_slots
)

router = APIRouter(prefix="/api/reservations", tags=["reservations"])


def reservation_to_out(r) -> ReservationOut:
    return ReservationOut(
        id=r.id,
        employee_id=r.employee_id,
        employee_name=r.employee.name,
        employee_position=r.employee.position,
        employee_department=r.employee.department,
        employee_hierarchy=r.employee.hierarchy_level,
        date=r.date,
        start_time=r.start_time,
        end_time=r.end_time,
        subject=r.subject,
        created_at=r.created_at,
        cancelled=r.cancelled,
    )


@router.get("/slots")
async def list_slots():
    """Return all available time slots."""
    return get_all_slots()


@router.get("/date/{date_str}", response_model=list[ReservationOut])
async def get_by_date(date_str: str, db: AsyncSession = Depends(get_db)):
    """Get all reservations for a specific date."""
    reservations = await get_reservations_for_date(db, date_str)
    return [reservation_to_out(r) for r in reservations]


@router.get("/week", response_model=list[ReservationOut])
async def get_by_week(
    start_date: str = Query(description="Monday date YYYY-MM-DD"),
    db: AsyncSession = Depends(get_db)
):
    """Get all reservations for a week."""
    reservations = await get_reservations_for_week(db, start_date)
    return [reservation_to_out(r) for r in reservations]


@router.post("", response_model=ReservationResponse)
async def create(data: ReservationCreate, db: AsyncSession = Depends(get_db)):
    """Create a new reservation with priority override logic."""
    try:
        result = await create_reservation(
            db, data.employee_id, data.date,
            data.start_time, data.end_time, data.subject
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return ReservationResponse(
        reservation=ReservationOut(
            id=result["reservation"].id,
            employee_id=result["reservation"].employee_id,
            employee_name=result["employee"].name,
            employee_position=result["employee"].position,
            employee_department=result["employee"].department,
            employee_hierarchy=result["employee"].hierarchy_level,
            date=result["reservation"].date,
            start_time=result["reservation"].start_time,
            end_time=result["reservation"].end_time,
            subject=result["reservation"].subject,
            created_at=result["reservation"].created_at,
            cancelled=result["reservation"].cancelled,
        ),
        override_info=OverrideInfo(
            overridden=result["overridden"],
            displaced_employees=[d["name"] for d in result["displaced"]],
            message=(
                f"Reserva creada. Se desplazó a: {', '.join(d['name'] for d in result['displaced'])}"
                if result["overridden"]
                else "Reserva creada exitosamente"
            ),
        ),
    )


@router.delete("/{reservation_id}")
async def cancel(
    reservation_id: int,
    employee_id: int = Query(description="ID del empleado que cancela"),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a reservation."""
    try:
        await cancel_reservation(db, reservation_id, employee_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Reserva cancelada"}
