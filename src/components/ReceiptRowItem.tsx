import React, { useEffect, useState } from 'react';
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

  // --- Qty input UX: keep string state; clamp on blur only
  const [qtyText, setQtyText] = useState<string>(String(row.qty ?? 1));
  useEffect(() => {
    setQtyText(String(row.qty ?? 1));
  }, [row.qty]);

  const handleSelect = (val: string) => {
    const item = options.find((i) => i.id === val);
    onUpdate(row.id, 'itemId', val);
    onUpdate(row.id, 'itemName', item?.name ?? '');
  };

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    // allow only digits and empty string while typing
    if (/^\d*$/.test(v)) setQtyText(v);
  };

  const handleQtyBlur = () => {
    let n = parseInt(qtyText || '0', 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    onUpdate(row.id, 'qty', n);
    setQtyText(String(n));
  };

  return (
    // Responsive grid: stacked on mobile, 12-col on desktop
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center">
      {/* Select */}
      <div className="md:col-span-5 min-w-0">
        <div className="text-sm font-medium mb-1">{label}</div>
        <Select value={row.itemId ?? ''} onValueChange={handleSelect}>
          <SelectTrigger className="w-full">
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

      {/* Quantity */}
      <div className="md:col-span-3">
        <div className="text-sm font-medium mb-1">Количество</div>
        <Input
          className="w-full"
          // mobile keyboard
          inputMode="numeric"
          pattern="[0-9]*"
          // controlled string value so user can freely edit
          value={qtyText}
          onChange={handleQtyChange}
          onBlur={handleQtyBlur}
          placeholder="1"
        />
      </div>

      {/* Remove button */}
      <div className="md:col-span-4 flex md:justify-end md:items-end">
        <Button
          variant="destructive"
          className="w-full md:w-auto"
          onClick={() => onRemove(row.id)}
        >
          Удалить
        </Button>
      </div>
    </div>
  );
};

export default ReceiptRowItem;

