"""Seed the database with initial Faymex employees."""
from sqlalchemy import select
from app.models import Employee


INITIAL_EMPLOYEES = [
    # Nivel 1: Gerente General + Director Ejecutivo
    {"name": "Gerente General", "email": "gg@faymex.cl", "position": "Gerente General", "department": "Dirección", "hierarchy_level": 1},
    {"name": "Director Ejecutivo", "email": "de@faymex.cl", "position": "Director Ejecutivo", "department": "Dirección", "hierarchy_level": 1},
    # Nivel 2: Gerentes
    {"name": "Gerente Adm. y Finanzas", "email": "gaf@faymex.cl", "position": "Gerente de Administración y Finanzas", "department": "Administración y Finanzas", "hierarchy_level": 2},
    {"name": "Gerente de Operaciones", "email": "gop@faymex.cl", "position": "Gerente de Operaciones", "department": "Operaciones", "hierarchy_level": 2},
    # Nivel 3: Jefaturas
    {"name": "Jefe Inteligencia de Negocios", "email": "jin@faymex.cl", "position": "Jefe de Inteligencia de Negocios", "department": "Inteligencia de Negocios", "hierarchy_level": 3},
    {"name": "Jefe RRHH", "email": "jrh@faymex.cl", "position": "Jefe de Recursos Humanos", "department": "Recursos Humanos", "hierarchy_level": 3},
    {"name": "Jefe Adquisiciones", "email": "jadq@faymex.cl", "position": "Jefe de Adquisiciones", "department": "Adquisiciones", "hierarchy_level": 3},
    {"name": "Jefe Bodega", "email": "jbod@faymex.cl", "position": "Jefe de Bodega", "department": "Bodega", "hierarchy_level": 3},
    {"name": "Jefe Contabilidad", "email": "jcont@faymex.cl", "position": "Jefe de Contabilidad", "department": "Contabilidad", "hierarchy_level": 3},
    {"name": "Jefe Estudio Propuestas", "email": "jep@faymex.cl", "position": "Jefe de Estudio de Propuestas", "department": "Estudio de Propuestas", "hierarchy_level": 3},
    {"name": "Jefe Prevención y SIG", "email": "jprev@faymex.cl", "position": "Jefe de Prevención de Riesgos y SIG", "department": "Prevención de Riesgos y SIG", "hierarchy_level": 3},
    {"name": "Jefe Oficina Técnica", "email": "jot@faymex.cl", "position": "Jefe de Oficina Técnica", "department": "Oficina Técnica", "hierarchy_level": 3},
    {"name": "Jefe Taller", "email": "jtall@faymex.cl", "position": "Jefe de Taller", "department": "Taller", "hierarchy_level": 3},
    {"name": "Jefe Serv. Esp. Mecánicos", "email": "jsem@faymex.cl", "position": "Jefe de Servicios Especializados Mecánicos", "department": "Servicios Especializados Mecánicos", "hierarchy_level": 3},
    {"name": "Jefe Serv. Esp. Eléctricos", "email": "jsee@faymex.cl", "position": "Jefe de Servicios Especializados Eléctricos", "department": "Servicios Especializados Eléctricos", "hierarchy_level": 3},
]


async def seed_employees(db):
    """Insert initial employees if table is empty."""
    result = await db.execute(select(Employee).limit(1))
    if result.scalar_one_or_none() is not None:
        return  # Already seeded

    for emp_data in INITIAL_EMPLOYEES:
        db.add(Employee(**emp_data))
    await db.commit()
