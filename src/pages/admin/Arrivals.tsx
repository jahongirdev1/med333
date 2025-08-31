import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiService } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import { Package, Plus, Save } from 'lucide-react';
import ReceiptRowItem, { ReceiptRow } from '@/components/ReceiptRowItem';

interface Item {
  id: string;
  name: string;
  quantity?: number;
  branch_id?: string;
}

const Arrivals: React.FC = () => {
  const [medicines, setMedicines] = useState<Item[]>([]);
  const [devices, setDevices] = useState<Item[]>([]);
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const [medRes, devRes] = await Promise.all([
        apiService.getMedicines(),
        apiService.getMedicalDevices(),
      ]);
      if (medRes.data && Array.isArray(medRes.data)) {
        setMedicines((medRes.data as Item[]).filter((m) => !m.branch_id));
      } else {
        setMedicines([]);
      }
      if (devRes.data && Array.isArray(devRes.data)) {
        setDevices((devRes.data as Item[]).filter((d) => !d.branch_id));
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить товары', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        itemType: 'medicine',
        itemId: null,
        qty: 1,
        purchasePrice: 0,
        sellPrice: 0,
      },
    ]);
  };

  const updateRow = (id: string, field: keyof ReceiptRow, value: unknown) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated: ReceiptRow = { ...row, [field]: value };
        if (field === 'itemType') {
          updated.itemId = null;
        }
        return updated;
      })
    );
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const getAddedQuantity = (itemType: 'medicine' | 'device', itemId: string) => {
    return rows
      .filter((r) => r.itemType === itemType && r.itemId === itemId)
      .reduce((sum, r) => sum + r.qty, 0);
  };

  const groupRows = (rows: ReceiptRow[]) => {
    const map = new Map<string, ReceiptRow>();
    rows.forEach((row) => {
      if (!row.itemId) return;
      const key = `${row.itemType}-${row.itemId}-${row.purchasePrice}-${row.sellPrice}`;
      const existing = map.get(key);
      if (existing) {
        existing.qty += row.qty;
      } else {
        map.set(key, { ...row });
      }
    });
    return Array.from(map.values());
  };

  const handleSave = async () => {
    if (rows.length === 0) {
      toast({ title: 'Ошибка', description: 'Добавьте поступления', variant: 'destructive' });
      return;
    }

    for (const row of rows) {
      if (!row.itemId || row.qty < 1 || row.purchasePrice < 0 || row.sellPrice < 0) {
        toast({ title: 'Ошибка', description: 'Заполните все поля корректно', variant: 'destructive' });
        return;
      }
    }

    const grouped = groupRows(rows);
    const medicineReceipts = grouped
      .filter((r) => r.itemType === 'medicine')
      .map((r) => {
        const item = medicines.find((m) => m.id === r.itemId);
        return {
          medicine_id: r.itemId,
          medicine_name: item?.name || '',
          quantity: r.qty,
          purchase_price: r.purchasePrice,
          sell_price: r.sellPrice,
        };
      });

    const deviceReceipts = grouped
      .filter((r) => r.itemType === 'device')
      .map((r) => {
        const item = devices.find((d) => d.id === r.itemId);
        return {
          device_id: r.itemId,
          device_name: item?.name || '',
          quantity: r.qty,
          purchase_price: r.purchasePrice,
          sell_price: r.sellPrice,
        };
      });

    let medError = false;
    let devError = false;

    if (medicineReceipts.length > 0) {
      const res = await apiService.createArrivals(medicineReceipts);
      if (res.error) {
        medError = true;
      } else {
        await fetchItems();
      }
    }

    if (deviceReceipts.length > 0) {
      const res = await apiService.createMedicalDeviceArrivals(deviceReceipts);
      if (res.error) {
        devError = true;
      } else {
        await fetchItems();
      }
    }

    if (!medError && !devError) {
      setRows([]);
      toast({
        title: 'Поступления сохранены!',
        description: `Обработано ${grouped.length} уникальных товаров с общим количеством ${grouped.reduce(
          (sum, r) => sum + r.qty,
          0
        )} шт.`,
      });
    } else {
      let remaining = rows;
      if (!medError) {
        remaining = remaining.filter((r) => r.itemType !== 'medicine');
      }
      if (!devError) {
        remaining = remaining.filter((r) => r.itemType !== 'device');
      }
      setRows(remaining);
      toast({
        title: 'Ошибка',
        description: medError && devError
          ? 'Не удалось сохранить поступления'
          : medError
            ? 'Не удалось сохранить поступления лекарств'
            : 'Не удалось сохранить поступления ИМН',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Загрузка...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Поступления на склад</h1>
        <p className="text-gray-600 mt-2">Добавление поступивших товаров на главный склад</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Добавить поступления</h2>
          <Button onClick={addRow} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Добавить поступление
          </Button>
        </div>

        {rows.length > 0 ? (
          <div className="space-y-4 mb-6">
            {rows.map((row) => (
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

        {rows.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Примечание:</strong> Если выбрано одно и то же товар несколько раз,
              количества будут автоматически суммированы при сохранении.
            </p>

            {(() => {
              const grouped = rows.reduce((acc, row) => {
                if (!row.itemId) return acc;
                const items = row.itemType === 'medicine' ? medicines : devices;
                const item = items.find((i) => i.id === row.itemId);
                const key = `${row.itemType}-${row.itemId}`;

                if (item && !acc[key]) {
                  acc[key] = { name: item.name, totalQuantity: 0, count: 0 };
                }

                if (acc[key]) {
                  acc[key].totalQuantity += row.qty;
                  acc[key].count += 1;
                }

                return acc;
              }, {} as Record<string, { name: string; totalQuantity: number; count: number }>);

              const groupedItems = Object.values(grouped).filter((item) => item.totalQuantity > 0);

              if (groupedItems.length > 0) {
                return (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Итого будет добавлено:</p>
                    <div className="space-y-1">
                      {groupedItems.map((item, index) => (
                        <p key={index} className="text-xs text-blue-700">
                          • {item.name}: {item.totalQuantity} шт.
                          {item.count > 1 && ` (из ${item.count} записей)`}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        <Button onClick={handleSave} disabled={rows.length === 0}>
          <Save className="h-4 w-4 mr-2" />
          Сохранить поступления
        </Button>
      </div>
    </div>
  );
};

export default Arrivals;

