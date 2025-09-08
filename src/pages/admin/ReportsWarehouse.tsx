import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/utils/api';
import { formatDateTimeAlmaty } from '@/utils/datetime';

const ReportsWarehouse: React.FC = () => {
  const [type, setType] = useState<'arrivals' | 'stock' | 'dispatches'>('arrivals');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [detailsRow, setDetailsRow] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    if (!type) {
      toast({ title: 'Выберите тип отчёта', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      if (type === 'stock') {
        const res = await apiService.getWarehouseStock({ date_from: dateFrom, date_to: dateTo });
        setRows(res.data?.data ?? []);
      } else if (type === 'dispatches') {
        const res = await apiService.getWarehouseDispatches({ date_from: dateFrom, date_to: dateTo });
        setRows(res.data ?? []);
      } else {
        const data = await apiService.getWarehouseArrivals({ dateFrom, dateTo });
        setRows(data);
      }
    } catch {
      toast({ title: 'Ошибка получения отчёта', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!type) {
      toast({ title: 'Выберите тип отчёта', variant: 'destructive' });
      return;
    }
    try {
      if (type === 'stock') {
        await apiService.exportWarehouseStockXlsx({ date_from: dateFrom, date_to: dateTo });
      } else if (type === 'dispatches') {
        await apiService.exportWarehouseDispatchesXlsx({ date_from: dateFrom, date_to: dateTo });
      } else {
        await apiService.exportWarehouseArrivalsXlsx({ dateFrom, dateTo });
      }
    } catch {
      toast({ title: 'Ошибка экспорта', variant: 'destructive' });
    }
  };

  const renderTable = () => {
    if (rows.length === 0) return null;
    if (type === 'stock') {
      return (
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Количество</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (type === 'dispatches') {
      return (
        <>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Дата и время</TableHead>
                <TableHead>Отправлено</TableHead>
                <TableHead className="text-center">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDateTimeAlmaty(r.datetime)}</TableCell>
                  <TableCell>
                    {(r.items || []).map((i: any) => `${i.name} — ${i.quantity}`).join('; ')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" onClick={() => setDetailsRow(r)}>
                      Подробнее
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {detailsRow && (
            <Dialog open onOpenChange={() => setDetailsRow(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Состав отправки</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  {(detailsRow.items || []).map((i: any, idx: number) => (
                    <div key={idx}>{i.name} — {i.quantity}</div>
                  ))}
                </div>
                <DialogFooter>
                  <Button onClick={() => setDetailsRow(null)}>Закрыть</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      );
    }

    return (
      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>Дата и время</TableHead>
            <TableHead>Поступило</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>
                {formatDateTimeAlmaty(row.datetime || row.date || row.created_at)}
              </TableCell>
              <TableCell>
                {(row.items || [])
                  .map((i: any) => `${i.name ?? '—'} — ${i.quantity ?? i.qty}`)
                  .join(', ')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Отчёты склада</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label>Тип отчёта</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stock">Остатки</SelectItem>
                <SelectItem value="arrivals">Поступления</SelectItem>
                <SelectItem value="dispatches">Отправки</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Дата с</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>Дата по</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={generateReport} disabled={loading}>Сгенерировать отчёт</Button>
          </div>
        </div>
        {renderTable()}
        <div className="mt-6">
          <Button variant="outline" onClick={handleExport}>Экспорт в Excel</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsWarehouse;
