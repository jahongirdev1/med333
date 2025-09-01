import React, { useEffect, useMemo, useState } from 'react';
import { Package, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import ReceiptRowItem, { ReceiptRow } from '@/components/ReceiptRowItem';
import { apiService } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import { uid } from '@/shared/utils/uid';

export type ItemType = 'medicine' | 'medical_device';

export interface CatalogItem {
  id: string;
  name: string;
  quantity?: number;
  branch_id?: string | null;
}

const AdminArrivals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ItemType>('medicine');
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [medicines, setMedicines] = useState<CatalogItem[]>([]);
  const [devices, setDevices] = useState<CatalogItem[]>([]);

  useEffect(() => {
    void fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const med = await apiService.getMedicines();
      setMedicines(
        Array.isArray(med?.data)
          ? med.data.filter((i: CatalogItem) => !i.branch_id)
          : Array.isArray(med)
          ? (med as CatalogItem[]).filter((i) => !i.branch_id)
          : []
      );

      const dev = await apiService.getMedicalDevices();
      setDevices(
        Array.isArray(dev?.data)
          ? dev.data.filter((i: CatalogItem) => !i.branch_id)
          : Array.isArray(dev)
          ? (dev as CatalogItem[]).filter((i) => !i.branch_id)
          : []
      );
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить справочники',
        variant: 'destructive',
      });
    }
  };

  const visibleRows = useMemo(
    () => rows.filter((r) => r.itemType === activeTab),
    [rows, activeTab]
  );

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: uid(),
        itemType: activeTab, // derive from tab
        itemId: null,
        itemName: '',
        qty: 1,
      },
    ]);
  };

  const updateRow = (id: string, field: keyof ReceiptRow, value: unknown) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const validateRows = () => {
    for (const r of visibleRows) {
      if (!r.itemId) {
        toast({ title: 'Ошибка', description: 'Выберите товар в каждой строке', variant: 'destructive' });
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

    const payload = rows.map((r) => ({
      item_type: r.itemType,
      item_id: r.itemId!,
      item_name: r.itemName,
      quantity: r.qty,
    }));

    const res = await apiService.createArrivals(payload);
    if (!('error' in res) || !res.error) {
      setRows([]);
      toast({ title: 'Успех', description: 'Поступления сохранены' });
    } else {
      toast({ title: 'Ошибка', description: String(res.error), variant: 'destructive' });
    }
  };

  const isSaveDisabled =
    visibleRows.length === 0 ||
    visibleRows.some((r) => !r.itemId || !r.itemName || r.qty <= 0);

  return (
    <div>
      <div className="mb-6">
        <ToggleGroup
          type="single"
          value={activeTab}
          onValueChange={(v) => v && setActiveTab(v as ItemType)}
        >
          <ToggleGroupItem value="medicine">Лекарства</ToggleGroupItem>
          <ToggleGroupItem value="medical_device">ИМН</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <h2 className="text-xl font-semibold mb-3">Добавить поступление</h2>

      {visibleRows.length > 0 ? (
        <div className="space-y-4 mb-6">
          {visibleRows.map((row) => (
            <ReceiptRowItem
              key={row.id}
              row={row}
              medicines={medicines}
              devices={devices}
              activeTab={activeTab}
              onUpdate={updateRow}
              onRemove={removeRow}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p>Нажмите «Добавить поступление», чтобы начать</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button onClick={addRow} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Добавить поступление
        </Button>
        <Button onClick={saveRows} disabled={isSaveDisabled} className="flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Сохранить поступления
        </Button>
      </div>
    </div>
  );
};

export default AdminArrivals;

