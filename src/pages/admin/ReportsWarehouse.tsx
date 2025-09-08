import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiService } from '@/utils/api';
import { formatDateTimeAlmaty } from '@/utils/datetime';

const REPORT_TYPES = [
  { value: 'arrivals',   label: 'Поступления' },
  { value: 'stock',      label: 'Остатки' },
  { value: 'dispatches', label: 'Отправки' },
] as const;

type ReportType = typeof REPORT_TYPES[number]['value'];

function ReportsWarehouse() {
  const [type, setType] = useState<ReportType>('arrivals');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsRow, setDetailsRow] = useState<any | null>(null);

  useEffect(() => {
    setRows([]);
    setDetailsRow(null);
  }, [type]);

  const safeRows = Array.isArray(rows) ? rows : [];

  async function generateReport(e?: React.MouseEvent | React.FormEvent) {
    if (e) { e.preventDefault?.(); (e as any).stopPropagation?.(); }

    setLoading(true);
    try {
      if (type === 'arrivals') {
        const res = await apiService.getWarehouseArrivals({ date_from: dateFrom, date_to: dateTo });
        setRows(res.data ?? []);
      } else if (type === 'stock') {
        const res = await apiService.getWarehouseStock({ date_from: dateFrom, date_to: dateTo });
        setRows(res.data ?? []);
      } else if (type === 'dispatches') {
        const res = await apiService.getWarehouseDispatches({ date_from: dateFrom, date_to: dateTo });
        setRows(res.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(e?: React.MouseEvent) {
    if (e) { e.preventDefault?.(); e.stopPropagation?.(); }
    if (!safeRows.length) return;

    if (type === 'arrivals')    return apiService.exportWarehouseArrivalsXlsx({ date_from: dateFrom, date_to: dateTo });
    if (type === 'stock')       return apiService.exportWarehouseStockXlsx({ date_from: dateFrom, date_to: dateTo });
    if (type === 'dispatches')  return apiService.exportWarehouseDispatchesXlsx({ date_from: dateFrom, date_to: dateTo });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Отчёты склада</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <Label>Тип отчёта</Label>
            <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Дата с</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>Дата по</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={generateReport} disabled={loading}>
              Сгенерировать отчёт
            </Button>
          </div>
        </div>

        {type === 'stock' && safeRows.length > 0 && (
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-2">Название</th>
                <th className="text-left py-2">Категория</th>
                <th className="text-left py-2">Количество</th>
              </tr>
            </thead>
            <tbody>
              {safeRows.map((r, idx) => (
                <tr key={idx}>
                  <td className="py-2">{r.name}</td>
                  <td className="py-2">{r.category}</td>
                  <td className="py-2">{r.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {type === 'arrivals' && safeRows.length > 0 && (
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-2">Дата и время</th>
                <th className="text-left py-2">Поступило</th>
              </tr>
            </thead>
            <tbody>
              {safeRows.map((r, idx) => (
                <tr key={idx}>
                  <td className="py-2">{formatDateTimeAlmaty(r.datetime || r.date || r.created_at)}</td>
                  <td className="py-2">
                    {(r.items || [])
                      .map((i: any) => `${i.name ?? '—'} — ${i.quantity ?? i.qty}`)
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {type === 'dispatches' && (
          <>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2">Дата и время</th>
                  <th className="text-left py-2">Отправлено</th>
                  <th className="py-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {safeRows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2">{formatDateTimeAlmaty?.(r.datetime) ?? r.datetime}</td>
                    <td className="py-2">
                      {(r.items || []).map((i: any) => `${i.name} — ${i.quantity}`).join('; ')}
                    </td>
                    <td className="py-2">
                      <Button type="button" variant="outline" onClick={() => setDetailsRow(r)}>
                        Подробнее
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
                    <Button type="button" onClick={() => setDetailsRow(null)}>Закрыть</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}

        {safeRows.length > 0 && (
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={!safeRows.length || loading}
            >
              Экспорт в Excel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReportsWarehouse;

