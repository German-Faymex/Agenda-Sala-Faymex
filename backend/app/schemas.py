from pydantic import BaseModel, EmailStr
from datetime import datetime


# --- Employee ---
class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    position: str
    department: str
    hierarchy_level: int


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeOut(EmployeeBase):
    id: int
    active: bool

    model_config = {"from_attributes": True}


# --- Reservation ---
class ReservationCreate(BaseModel):
    employee_id: int
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    subject: str | None = None


class ReservationOut(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    employee_position: str
    employee_department: str
    employee_hierarchy: int
    date: str
    start_time: str
    end_time: str
    subject: str | None
    created_at: datetime
    cancelled: bool

    model_config = {"from_attributes": True}


class OverrideInfo(BaseModel):
    overridden: bool
    displaced_employees: list[str] = []
    message: str


class ReservationResponse(BaseModel):
    reservation: ReservationOut
    override_info: OverrideInfo


# --- Admin ---
class AdminLogin(BaseModel):
    password: str


class BulkUploadResult(BaseModel):
    created: int
    errors: list[str]
