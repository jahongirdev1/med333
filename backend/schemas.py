
from pydantic import BaseModel, ConfigDict, Field, model_validator, PrivateAttr
from typing import Optional, List, Literal
from datetime import datetime
from uuid import UUID

# User schemas
class UserBase(BaseModel):
    login: str
    role: str
    branch_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    login: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    branch_name: Optional[str] = None

class User(UserBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    login: str
    password: str

class LoginResponse(BaseModel):
    user: User
    token: str

# Branch schemas
class BranchBase(BaseModel):
    name: str
    login: str
    password: str

class BranchCreate(BranchBase):
    pass

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    login: Optional[str] = None
    password: Optional[str] = None

class Branch(BranchBase):
    id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Medicine schemas
class MedicineBase(BaseModel):
    name: str
    category_id: str
    purchase_price: float
    sell_price: float
    quantity: int
    branch_id: Optional[str] = None

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    purchase_price: Optional[float] = None
    sell_price: Optional[float] = None
    quantity: Optional[int] = None
    branch_id: Optional[str] = None

class Medicine(MedicineBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

# Employee schemas
class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    phone: str
    address: str
    branch_id: Optional[str] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    branch_id: Optional[str] = None

class Employee(EmployeeBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

# Patient schemas - ИСПРАВЛЕНО: branch_id теперь Optional
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    illness: str
    phone: str
    address: str
    branch_id: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    illness: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    branch_id: Optional[str] = None

class Patient(PatientBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

# Transfer schemas
class TransferBase(BaseModel):
    medicine_id: str
    medicine_name: str
    quantity: int
    from_branch_id: Optional[str] = None
    to_branch_id: str

class TransferCreate(TransferBase):
    pass

class Transfer(TransferBase):
    id: str
    date: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Dispensing schemas
class DispensingBase(BaseModel):
    medicine_id: str
    medicine_name: str
    quantity: int
    patient_id: str
    patient_name: str
    employee_id: str
    employee_name: str
    branch_id: str

class DispensingCreate(DispensingBase):
    pass

class Dispensing(DispensingBase):
    id: str
    date: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Arrival schemas
class ArrivalBase(BaseModel):
    item_type: str        # 'medicine' or 'medical_device'
    item_id: str
    item_name: str
    quantity: int

class ArrivalCreate(ArrivalBase):
    pass

class Arrival(ArrivalBase):
    id: str
    date: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Batch operations
class BatchTransferCreate(BaseModel):
    transfers: List[TransferCreate]

class BatchDispensingCreate(BaseModel):
    dispensings: List[DispensingCreate]

class BatchArrivalCreate(BaseModel):
    arrivals: List[ArrivalCreate]


# New dispensing payload models supporting legacy and new shapes
class DispenseLine(BaseModel):
    item_id: str = Field(..., alias="id")
    quantity: int = Field(..., ge=0)
    item_type: Literal["medicine", "medical_device"] = Field(..., alias="type")

    model_config = ConfigDict(populate_by_name=True, extra="ignore")


class MedicineLine(BaseModel):
    id: str
    name: Optional[str] = None
    quantity: int = Field(..., ge=0)


class DeviceLine(BaseModel):
    id: str
    name: Optional[str] = None
    quantity: int = Field(..., ge=0)


class DispensePayload(BaseModel):
    patient_id: str
    employee_id: str
    branch_id: str

    # legacy shape
    items: List[DispenseLine] = []

    # new shape
    medicines: List[MedicineLine] = []
    medical_devices: List[DeviceLine] = []

    # optional display fields
    patient_name: Optional[str] = None
    employee_name: Optional[str] = None


    _normalized_items: List[DispenseLine] = PrivateAttr(default_factory=list)

    @model_validator(mode="after")
    def normalize(self):
        normalized: List[DispenseLine] = []
        for line in self.items:
            if line.quantity > 0:
                normalized.append(line)
        for m in self.medicines:
            if m.quantity > 0:
                normalized.append(
                    DispenseLine(item_id=m.id, quantity=m.quantity, item_type="medicine")
                )
        for d in self.medical_devices:
            if d.quantity > 0:
                normalized.append(
                    DispenseLine(item_id=d.id, quantity=d.quantity, item_type="medical_device")
                )
        self._normalized_items = normalized
        return self

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

# Medical Device Category schemas
class MedicalDeviceCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class MedicalDeviceCategoryCreate(MedicalDeviceCategoryBase):
    pass

class MedicalDeviceCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class MedicalDeviceCategory(MedicalDeviceCategoryBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

# Medical Device schemas
class MedicalDeviceBase(BaseModel):
    name: str
    category_id: str
    purchase_price: float
    sell_price: float
    quantity: int
    branch_id: Optional[str] = None

class MedicalDeviceCreate(MedicalDeviceBase):
    pass

class MedicalDeviceUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    purchase_price: Optional[float] = None
    sell_price: Optional[float] = None
    quantity: Optional[int] = None
    branch_id: Optional[str] = None

class MedicalDevice(MedicalDeviceBase):
    id: str
    
    model_config = ConfigDict(from_attributes=True)

# Shipment schemas
class ShipmentMedicineItem(BaseModel):
    medicine_id: str
    quantity: int

class ShipmentDeviceItem(BaseModel):
    device_id: str
    quantity: int

class ShipmentBase(BaseModel):
    to_branch_id: str
    medicines: Optional[List[ShipmentMedicineItem]] = []
    medical_devices: Optional[List[ShipmentDeviceItem]] = []

class ShipmentCreate(ShipmentBase):
    pass

class Shipment(BaseModel):
    id: str
    to_branch_id: str
    status: str
    rejection_reason: Optional[str] = None
    created_at: str
    medicines: Optional[List[dict]] = []
    medical_devices: Optional[List[dict]] = []
    
    model_config = ConfigDict(from_attributes=True)

class ShipmentRejection(BaseModel):
    reason: str

# Report schemas
class ReportRequest(BaseModel):
    type: str
    branch_id: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
