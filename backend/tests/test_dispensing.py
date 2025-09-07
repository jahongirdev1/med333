import os
import sys
import asyncio
from sqlalchemy import text
import pytest
from fastapi import HTTPException
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

DB_PATH = "./test_dispense.db"
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH}"

from database import (
    create_tables,
    SessionLocal,
    Branch,
    Patient,
    Employee,
    Medicine,
    MedicalDevice,
    Category,
)
from main import create_dispensing_record
from services.stock import get_available_qty, ItemType

create_tables()
session = SessionLocal()

# seed static data
session.add(Category(id="c_m", name="cat", description="", type="medicine"))
session.add(Category(id="c_d", name="catd", description="", type="medical_device"))
session.add(Branch(id="b1", name="B1", login="b1", password="p"))
session.add(Patient(id="p1", first_name="P", last_name="L", illness="ill", phone="123", address="addr", branch_id="b1"))
session.add(Employee(id="e1", first_name="E", last_name="L", phone="321", address="addr", branch_id="b1"))
session.add(Medicine(id="m1", name="Med", category_id="c_m", purchase_price=0, sell_price=0, quantity=10, branch_id="b1"))
session.add(MedicalDevice(id="d1", name="Dev", category_id="c_d", purchase_price=0, sell_price=0, quantity=5, branch_id="b1"))
session.commit()

@pytest.fixture(autouse=True)
def reset_db():
    session.execute(text("DELETE FROM dispensing_items"))
    session.execute(text("DELETE FROM dispensing_records"))
    session.execute(text("UPDATE medicines SET quantity=10 WHERE id='m1'"))
    session.execute(text("UPDATE medical_devices SET quantity=5 WHERE id='d1'"))
    session.commit()
    yield

def test_new_shape_success():
    payload = {
        "patient_id": "p1",
        "employee_id": "e1",
        "branch_id": "b1",
        "medicines": [{"id": "m1", "quantity": 2}],
        "medical_devices": [{"id": "d1", "quantity": 1}],
    }
    resp = asyncio.run(create_dispensing_record(payload, db=session))
    med_qty, _ = get_available_qty(session, "b1", ItemType.medicine, "m1")
    dev_qty, _ = get_available_qty(session, "b1", ItemType.medical_device, "d1")
    assert resp["branch_id"] == "b1"
    assert med_qty == 8
    assert dev_qty == 4

def test_legacy_shape_success():
    payload = {
        "patient_id": "p1",
        "employee_id": "e1",
        "branch_id": "b1",
        "items": [{"type": "medicine", "item_id": "m1", "quantity": 1}],
    }
    resp = asyncio.run(create_dispensing_record(payload, db=session))
    med_qty, _ = get_available_qty(session, "b1", ItemType.medicine, "m1")
    assert resp["branch_id"] == "b1"
    assert med_qty == 9

def test_insufficient_stock():
    payload = {
        "patient_id": "p1",
        "employee_id": "e1",
        "branch_id": "b1",
        "medicines": [{"id": "m1", "quantity": 100}],
    }
    with pytest.raises(HTTPException) as exc:
        asyncio.run(create_dispensing_record(payload, db=session))
    assert "Not enough stock" in str(exc.value.detail)

def test_zero_quantity():
    payload = {
        "patient_id": "p1",
        "employee_id": "e1",
        "branch_id": "b1",
        "medicines": [{"id": "m1", "quantity": 0}],
    }
    with pytest.raises(HTTPException):
        asyncio.run(create_dispensing_record(payload, db=session))
