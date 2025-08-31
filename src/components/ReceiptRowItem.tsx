import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

export interface ReceiptRow {
  id: string;
  itemType: 'medicine' | 'device';
  itemId: string | null;
  qty: number;
  purchasePrice: number;
  sellPrice: number;
}

interface Item {
  id: string;
  name: string;
  quantity?: number;
}

interface ReceiptRowItemProps {
  row: ReceiptRow;
  medicines: Item[];
  devices: Item[];
  onUpdate: (id: string, field: keyof ReceiptRow, value: unknown) => void;
  onRemove: (id: string) => void;
  getAddedQuantity: (itemType: 'medicine' | 'device', itemId: string) => number;
}

const ReceiptRowItem: React.FC<ReceiptRowItemProps> = ({
  row,
  medicines,
  devices,
  onUpdate,
  onRemove,
  getAddedQuantity,
}) => {
  const items = row.itemType === 'medicine' ? medicines : devices;
  const addedQuantity = row.itemId ? getAddedQuantity(row.itemType, row.itemId) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
      <div>
        <Label>Тип</Label>
        <Select
          value={row.itemType}
          onValueChange={(value) => onUpdate(row.id, 'itemType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="medicine">Лекарство</SelectItem>
            <SelectItem value="device">ИМН</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>{row.itemType === 'medicine' ? 'Лекарство' : 'ИМН'}</Label>
        <Select
          value={row.itemId ?? ''}
          onValueChange={(value) => onUpdate(row.id, 'itemId', value)}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={row.itemType === 'medicine' ? 'Выберите лекарство' : 'Выберите ИМН'}
            />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => {
              const willAdd = getAddedQuantity(row.itemType, item.id);
              return (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} (текущее: {item.quantity || 0}
                  {willAdd > 0 ? ` + ${willAdd}` : ''} шт.)
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {row.itemId && addedQuantity > 0 && (
          <p className="text-xs text-blue-600 mt-1">Добавляется всего: {addedQuantity} шт.</p>
        )}
      </div>
      <div>
        <Label>Количество</Label>
        <Input
          type="number"
          min="1"
          value={row.qty}
          onChange={(e) => onUpdate(row.id, 'qty', Number(e.target.value))}
          placeholder="Количество"
        />
      </div>
      <div>
        <Label>Цена приходная (₸)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={row.purchasePrice}
          onChange={(e) => onUpdate(row.id, 'purchasePrice', Number(e.target.value))}
          placeholder="0.00"
        />
      </div>
      <div>
        <Label>Цена продажная (₸)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={row.sellPrice}
          onChange={(e) => onUpdate(row.id, 'sellPrice', Number(e.target.value))}
          placeholder="0.00"
        />
      </div>
      <div className="flex items-end">
        <Button
          variant="destructive"
          onClick={() => onRemove(row.id)}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Удалить
        </Button>
      </div>
    </div>
  );
};

export default ReceiptRowItem;

