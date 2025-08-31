import React, { useEffect, useState } from 'react';
import { apiService } from '@/utils/api';

type Tab = 'medicine' | 'medical_device';

interface ArrivalRow {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  purchasePrice: number;
  sellPrice: number;
}

const AdminArrivals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('medicine');
  const [arrivals, setArrivals] = useState<any[]>([]);
  const [rows, setRows] = useState<ArrivalRow[]>([]);

  useEffect(() => {
    fetchArrivals();
  }, [activeTab]);

  const fetchArrivals = async () => {
    const res = await apiService.getArrivals(activeTab);
    if (res.data) {
      setArrivals(res.data);
    }
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        itemId: '',
        itemName: '',
        quantity: 0,
        purchasePrice: 0,
        sellPrice: 0,
      },
    ]);
  };

  const updateRow = (id: string, field: keyof ArrivalRow, value: string | number) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const saveRows = async () => {
    const payload = rows.map((r) => ({
      item_type: activeTab,
      item_id: r.itemId,
      item_name: r.itemName,
      quantity: r.quantity,
      purchase_price: r.purchasePrice,
      sell_price: r.sellPrice,
    }));
    const res = await apiService.createArrivals(payload);
    if (!res.error) {
      setRows([]);
      fetchArrivals();
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('medicine')} disabled={activeTab === 'medicine'}>
          Medicines
        </button>
        <button onClick={() => setActiveTab('medical_device')} disabled={activeTab === 'medical_device'}>
          Medical Devices
        </button>
      </div>

      <h2>Arrivals</h2>
      <ul>
        {arrivals.map((a) => (
          <li key={a.id}>
            {a.item_name} - {a.quantity}
          </li>
        ))}
      </ul>

      <h2>Add Arrivals</h2>
      {rows.map((row) => (
        <div key={row.id} style={{ marginBottom: '0.5rem' }}>
          <input
            placeholder="Item ID"
            value={row.itemId}
            onChange={(e) => updateRow(row.id, 'itemId', e.target.value)}
          />
          <input
            placeholder="Item Name"
            value={row.itemName}
            onChange={(e) => updateRow(row.id, 'itemName', e.target.value)}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={row.quantity}
            onChange={(e) => updateRow(row.id, 'quantity', Number(e.target.value))}
          />
          <input
            type="number"
            placeholder="Purchase Price"
            value={row.purchasePrice}
            onChange={(e) => updateRow(row.id, 'purchasePrice', Number(e.target.value))}
          />
          <input
            type="number"
            placeholder="Sell Price"
            value={row.sellPrice}
            onChange={(e) => updateRow(row.id, 'sellPrice', Number(e.target.value))}
          />
          <button onClick={() => removeRow(row.id)}>Remove</button>
        </div>
      ))}

      <button onClick={addRow}>Add Row</button>
      <button onClick={saveRows} disabled={rows.length === 0} style={{ marginLeft: '0.5rem' }}>
        Save
      </button>
    </div>
  );
};

export default AdminArrivals;
