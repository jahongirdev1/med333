import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';
import { apiService } from '@/utils/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const AdminCalendar: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string | undefined>(undefined); // undefined = All branches
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [highlightedDates, setHighlightedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayRecords, setDayRecords] = useState<any[]>([]);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [detailsData, setDetailsData] = useState<any | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load branches on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.getBranches();
        setBranches(res.data || []);
      } catch {
        toast({ title: 'Ошибка загрузки филиалов', variant: 'destructive' });
      }
    })();
  }, []);

  // Fetch month summary when month or branch changes
  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingMonth(true);
      try {
        const start = format(currentMonth, 'yyyy-MM-01');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
        const res = await apiService.getCalendarDispensingSummary({ start, end, branch_id: branchId });
        const setData = new Set<string>();
        res.data?.forEach((d: any) => setData.add(d.date));
        setHighlightedDates(setData);
      } catch {
        toast({ title: 'Ошибка загрузки календаря', variant: 'destructive' });
        setHighlightedDates(new Set());
      } finally {
        setLoadingMonth(false);
        setSelectedDate(null);
        setDayRecords([]);
        setDetailsId(null);
      }
    };
    fetchSummary();
  }, [currentMonth, branchId]);

  // Fetch details when detailsId changes
  useEffect(() => {
    if (!detailsId) return;
    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const res = await apiService.getDispensingRecord(detailsId);
        setDetailsData(res.data || null);
      } catch {
        toast({ title: 'Ошибка загрузки данных', variant: 'destructive' });
        setDetailsData(null);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [detailsId]);

  const navigateMonth = (delta: number) => {
    setCurrentMonth(addMonths(currentMonth, delta));
  };

  const getDaysInMonth = () => {
    const firstDay = currentMonth.getDay();
    const daysInMonth = endOfMonth(currentMonth).getDate();
    const days: Array<number | null> = [];
    const leading = (firstDay + 6) % 7; // start week on Monday
    for (let i = 0; i < leading; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const handleDayClick = (day: number) => {
    const iso = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
    setSelectedDate(iso);
    fetchDayRecords(iso);
  };

  const fetchDayRecords = async (iso: string) => {
    setLoadingDay(true);
    try {
      const res = await apiService.getDispensingByDate({ date: iso, branch_id: branchId });
      setDayRecords(res.data || []);
    } catch {
      toast({ title: 'Ошибка загрузки данных', variant: 'destructive' });
      setDayRecords([]);
    } finally {
      setLoadingDay(false);
    }
  };

  const days = getDaysInMonth();
  const monthLabel = format(currentMonth, 'LLLL yyyy', { locale: undefined });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Календарь выдач</h1>
          <p className="text-muted-foreground">Календарь выдач лекарств пациентам</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{monthLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={branchId ?? 'all'}
            onValueChange={(v) => setBranchId(v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Все филиалы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все филиалы</SelectItem>
              {branches.filter((b) => b?.id).map((b) => (
                <SelectItem key={String(b.id)} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-medium p-2 text-sm text-muted-foreground">
            {day}
          </div>
        ))}

        {loadingMonth ? (
          <div className="col-span-7 text-center py-4">Загрузка...</div>
        ) : (
          days.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const iso = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
            const isHighlighted = highlightedDates.has(iso);
            const isSelected = selectedDate === iso;
            return (
              <Button
                key={idx}
                variant={isSelected ? 'default' : 'ghost'}
                className={cn(
                  'h-10 w-10 p-0',
                  isHighlighted && 'bg-green-100 text-green-800 ring-2 ring-green-500 rounded-full'
                )}
                onClick={() => handleDayClick(day)}
              >
                {day}
              </Button>
            );
          })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate
              ? `Выдачи на ${new Date(selectedDate).toLocaleDateString('ru-RU')}`
              : 'Выдачи'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDay ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : selectedDate && dayRecords.length === 0 ? (
            <div className="text-center py-8">Выдачи не найдены</div>
          ) : (
            <div className="space-y-4">
              {dayRecords.map((r) => (
                <div key={r.id} className="p-4 border rounded-lg">
                  <p className="text-sm">Пациент: {r.patient_name}</p>
                  <p className="text-sm">Сотрудник: {r.employee_name}</p>
                  <p className="text-sm">Филиал: {r.branch_name}</p>
                  <p className="text-sm mb-2">Время: {r.time}</p>
                  <Button size="sm" onClick={() => setDetailsId(r.id)}>
                    Подробнее
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!detailsId}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsId(null);
            setDetailsData(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Детали выдачи</DialogTitle>
          </DialogHeader>
          {loadingDetails ? (
            <div className="text-center py-4">Загрузка...</div>
          ) : detailsData ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Лекарства</h4>
                {detailsData.items.filter((i: any) => i.type === 'medicine').length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {detailsData.items
                      .filter((i: any) => i.type === 'medicine')
                      .map((i: any, idx: number) => (
                        <li key={idx}>{i.name} — {i.quantity}</li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Нет</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-2">ИМН</h4>
                {detailsData.items.filter((i: any) => i.type === 'medical_device').length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {detailsData.items
                      .filter((i: any) => i.type === 'medical_device')
                      .map((i: any, idx: number) => (
                        <li key={idx}>{i.name} — {i.quantity}</li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Нет</p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCalendar;

