import os
import asyncio

# Configure database to use SQLite for tests
os.environ['DATABASE_URL'] = 'sqlite:///./test.db'

from database import SessionLocal, create_tables, Medicine as DBMedicine, MedicalDevice as DBMedicalDevice, Category as DBCategory
from main import create_arrivals, get_arrivals
from schemas import ArrivalCreate, BatchArrivalCreate

# Ensure tables are created
create_tables()

def setup_items():
    db = SessionLocal()
    med_cat = DBCategory(id='cat_med', name='medcat', description='', type='medicine')
    dev_cat = DBCategory(id='cat_dev', name='devcat', description='', type='medical_device')
    db.add_all([med_cat, dev_cat])
    med = DBMedicine(id='med1', name='Med', category_id='cat_med', purchase_price=0, sell_price=0, quantity=0)
    dev = DBMedicalDevice(id='dev1', name='Dev', category_id='cat_dev', purchase_price=0, sell_price=0, quantity=0)
    db.add_all([med, dev])
    db.commit()
    db.close()

def test_arrivals_flow():
    setup_items()
    db = SessionLocal()
    payload = BatchArrivalCreate(arrivals=[
        ArrivalCreate(item_type='medicine', item_id='med1', item_name='Med', quantity=5, purchase_price=10.0, sell_price=12.0),
        ArrivalCreate(item_type='medical_device', item_id='dev1', item_name='Dev', quantity=3, purchase_price=20.0, sell_price=25.0),
    ])
    asyncio.run(create_arrivals(payload, db))
    db.close()

    db2 = SessionLocal()
    med = db2.query(DBMedicine).get('med1')
    dev = db2.query(DBMedicalDevice).get('dev1')
    assert med.quantity == 5
    assert dev.quantity == 3

    # test get_arrivals
    arrivals = asyncio.run(get_arrivals(db2))
    assert len(arrivals['data']) == 2
    types = {a.item_type for a in arrivals['data']}
    assert 'medicine' in types and 'medical_device' in types
    db2.close()

if __name__ == '__main__':
    test_arrivals_flow()
    print('tests passed')
