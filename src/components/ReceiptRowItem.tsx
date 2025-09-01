import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { ItemType, CatalogItem } from '@/pages/admin/Arrivals';

export interface ReceiptRow {
  id: string;
  itemType: ItemType;        // 'medicine' | 'medical_device' (derived, not editable)
  itemId: string | null;
  itemName: string;
  qty: number;
}

type Props = {
  row: ReceiptRow;
  medicines: CatalogItem[];
  devices: CatalogItem[];
  activeTab: ItemType;
  onUpdate: (id: string, field: keyof ReceiptRow, value: unknown) => void;
  onRemove: (id: string) => void;
};

const ReceiptRowItem: React.FC<Props> = ({
  row,
  medicines,
  devices,
  activeTab,
  onUpdate,
  onRemove,
}) => {
  const options = row.itemType === 'medicine' ? medicines : devices;
  const placeholder = activeTab === 'medicine' ? 'Выберите лекарство' : 'Выберите ИМН';
  const label = activeTab === 'medicine' ? 'Лекарство' : 'ИМН';

  const handleSelect = (val: string) => {
    const item = options.find((i) => i.id === val);
    onUpdate(row.id, 'itemId', val);
    onUpdate(row.id, 'itemName', item?.name ?? '');
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-center">
      <div className="col-span-5">
        <div className="text-sm font-medium mb-1">{label}</div>
        <Select value={row.itemId ?? ''} onValueChange={handleSelect}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}{` (текущее: ${o.quantity ?? 0} шт.)`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-3">
        <div className="text-sm font-medium mb-1">Количество</div>
        <Input
          type="number"
          min={1}
          value={row.qty}
          onChange={(e) =>
            onUpdate(row.id, 'qty', Math.max(1, Number(e.target.value) || 0))
          }
        />
      </div>

      <div className="col-span-4 flex justify-end items-end">
        <Button variant="destructive" onClick={() => onRemove(row.id)}>
          Удалить
        </Button>
      </div>
    </div>
  );
};

export default ReceiptRowItem;

