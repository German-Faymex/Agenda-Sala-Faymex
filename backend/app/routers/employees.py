from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Employee
from app.schemas import EmployeeOut

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("", response_model=list[EmployeeOut])
async def list_employees(db: AsyncSession = Depends(get_db)):
    """List all active employees, ordered by hierarchy then name."""
    result = await db.execute(
        select(Employee)
        .where(Employee.active == True)
        .order_by(Employee.hierarchy_level, Employee.name)
    )
    return result.scalars().all()
