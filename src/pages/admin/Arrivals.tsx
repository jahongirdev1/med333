import React, { useEffect, useState } from 'react';
import { Package, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import ReceiptRowItem, { ReceiptRow } from '@/components/ReceiptRowItem';
import { apiService } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import { uid } from '@/shared/utils/uid';

export type ItemType = 'medicine' | 'medical_device';

const AdminArrivals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ItemType>('medicine');
  const [arrivals, setArrivals] = useState<any[]>([]);
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);

  const visibleRows = rows.filter((r) => r.itemType === activeTab);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  useEffect(() => {
    fetchArrivals();
  }, [activeTab]);

  const fetchCatalogs = async () => {
    const [medRes, devRes] = await Promise.all([
      apiService.getMedicines(),
      apiService.getMedicalDevices(),
    ]);
    if (medRes.data) setMedicines(medRes.data);
    if (devRes.data) setDevices(devRes.data);
  };

  const fetchArrivals = async () => {
    const res = await apiService.getArrivals(activeTab);
    setArrivals(res.data);
  };

  const addRow = (type: ItemType) => {
    setRows([
      ...rows,
      {
        id: uid(),
        itemType: type,
        itemId: null,
        itemName: '',
        qty: 1,
      },
    ]);
  };

  const updateRow = (id: string, field: keyof ReceiptRow, value: unknown) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const getAddedQuantity = (itemType: ItemType, itemId: string) =>
    rows
      .filter((r) => r.itemType === itemType && r.itemId === itemId)
      .reduce((sum, r) => sum + r.qty, 0);

  const validateRows = () => {
    for (const r of rows) {
      if (!r.itemId) {
        toast({ title: 'Ошибка', description: 'Выберите товар для всех строк', variant: 'destructive' });
        return false;
      }
      if (r.qty <= 0) {
        toast({ title: 'Ошибка', description: 'Количество должно быть больше 0', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const saveRows = async () => {
    if (!validateRows()) return;
    const res = await apiService.createArrivals(
      rows.map((r) => ({
        item_type: r.itemType,
        item_id: r.itemId!,
        item_name: r.itemName,
        quantity: r.qty,
      }))
    );
    if (!res.error) {
      setRows([]);
      fetchArrivals();
    } else {
      toast({ title: 'Ошибка', description: res.error, variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="mb-4">
        <ToggleGroup type="single" value={activeTab} onValueChange={(v) => v && setActiveTab(v as ItemType)}>
          <ToggleGroupItem value="medicine">Лекарства</ToggleGroupItem>
          <ToggleGroupItem value="medical_device">ИМН</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <h2>Arrivals</h2>
      <ul>
        {(arrivals ?? []).map((a) => (
          <li key={a.id}>
            {a.item_name} - {a.quantity}
          </li>
        ))}
      </ul>

      <h2>Добавить поступление</h2>
      {visibleRows.length > 0 ? (
        <div className="space-y-4 mb-6">
          {visibleRows.map((row) => (
            <ReceiptRowItem
              key={row.id}
              row={row}
              medicines={medicines}
              devices={devices}
              onUpdate={updateRow}
              onRemove={removeRow}
              getAddedQuantity={getAddedQuantity}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p>Нажмите "Добавить поступление" чтобы начать</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button onClick={() => addRow(activeTab)} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Добавить поступление
        </Button>
        <Button onClick={saveRows} disabled={rows.length === 0} className="flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Сохранить поступления
        </Button>
      </div>
    </div>
  );
};

export default AdminArrivals;
