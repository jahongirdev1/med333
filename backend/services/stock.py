from __future__ import annotations

from enum import Enum
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from database import Medicine, MedicalDevice


class ItemType(str, Enum):
    medicine = "medicine"
    medical_device = "medical_device"


def get_available_qty(
    db: Session, branch_id: str, item_type: ItemType, item_id: str
) -> Tuple[int, Optional[str]]:
    """Return available quantity and item name for given branch and item."""
    if item_type == ItemType.medicine:
        stock = (
            db.query(Medicine)
            .filter(Medicine.id == item_id, Medicine.branch_id == branch_id)
            .first()
        )
    else:
        stock = (
            db.query(MedicalDevice)
            .filter(MedicalDevice.id == item_id, MedicalDevice.branch_id == branch_id)
            .first()
        )
    if not stock:
        return 0, None
    return stock.quantity, stock.name


def decrement_stock(
    db: Session, branch_id: str, item_type: ItemType, item_id: str, qty: int
) -> None:
    """Decrement stock atomically; raise ValueError if insufficient."""
    if qty <= 0:
        return
    if item_type == ItemType.medicine:
        stock = (
            db.query(Medicine)
            .filter(Medicine.id == item_id, Medicine.branch_id == branch_id)
            .with_for_update()
            .first()
        )
    else:
        stock = (
            db.query(MedicalDevice)
            .filter(MedicalDevice.id == item_id, MedicalDevice.branch_id == branch_id)
            .with_for_update()
            .first()
        )
    if not stock or stock.quantity < qty:
        raise ValueError(
            f"Not enough stock for {item_type}:{item_id} (available {stock.quantity if stock else 0}, requested {qty})"
        )
    stock.quantity -= qty
