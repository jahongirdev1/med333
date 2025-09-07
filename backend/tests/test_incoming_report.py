import os
import sys
import asyncio
from datetime import datetime
from sqlalchemy import text
import pathlib
import importlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

DB_PATH = "./test_incoming_report.db"
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH}"

import database
importlib.reload(database)
from database import create_tables, SessionLocal, Branch, Shipment, ShipmentItem
from main import get_incoming_report

create_tables()
session = SessionLocal()
session.add(Branch(id="b1", name="B1", login="b1", password="p"))
session.commit()


def test_incoming_report():
    session.execute(text("DELETE FROM shipment_items"))
    session.execute(text("DELETE FROM shipments"))
    session.commit()

    session.add(Shipment(id="s1", to_branch_id="b1", status="accepted", created_at=datetime(2024, 1, 10, 12, 0, 0)))
    session.add(ShipmentItem(id="i1", shipment_id="s1", item_type="medicine", item_id="m1", item_name="Тримол", quantity=20))
    session.add(ShipmentItem(id="i2", shipment_id="s1", item_type="medical_device", item_id="d1", item_name="Шприц 100", quantity=15))

    session.add(Shipment(id="s2", to_branch_id="b1", status="accepted", created_at=datetime(2024, 2, 1, 10, 0, 0)))
    session.add(ShipmentItem(id="i3", shipment_id="s2", item_type="medicine", item_id="m1", item_name="Тест", quantity=5))

    session.add(Shipment(id="s3", to_branch_id="b1", status="pending", created_at=datetime(2024, 1, 20, 10, 0, 0)))
    session.add(ShipmentItem(id="i4", shipment_id="s3", item_type="medicine", item_id="m1", item_name="Тест2", quantity=1))

    session.commit()

    resp = asyncio.run(get_incoming_report("b1", "2024-01-01", "2024-01-31", db=session))
    assert len(resp["data"]) == 1
    entry = resp["data"][0]
    assert entry["id"] == "s1"
    assert len(entry["items"]) == 2
    names = {i["name"] for i in entry["items"]}
    assert "Тримол" in names and "Шприц 100" in names
