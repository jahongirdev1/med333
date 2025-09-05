import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '@/utils/storage';
import { apiService } from '@/utils/api';
import { Calendar as CalendarIcon, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface DayDetailItem {
  time: string;
  employee_name: string;
  items: Array<{ type: 'medicine' | 'medical_device'; name: string; quantity: number }>;
}

const Calendar: React.FC = () => {
  const currentUser = storage.getCurrentUser();
  const branchId = currentUser?.branchId;

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('ALL');
  const [visibleMonthISO, setVisibleMonthISO] = useState(() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Almaty' }));
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
  const [highlightedDays, setHighlightedDays] = useState<Set<number>>(new Set());
  const [dayDetail, setDayDetail] = useState<{
    open: boolean;
    dateISO?: string;
    loading: boolean;
    items: DayDetailItem[];
  }>({ open: false, loading: false, items: [] });
  const [loading, setLoading] = useState(true);

  const displayDate = useMemo(() => new Date(`${visibleMonthISO}-01`), [visibleMonthISO]);

  useEffect(() => {
    fetchPatients();
  }, [branchId]);

  useEffect(() => {
    fetchCalendarData();
    setDayDetail((prev) => ({ ...prev, open: false }));
  }, [branchId, visibleMonthISO, selectedPatientId]);

  const fetchPatients = async () => {
    if (!branchId) return;
    try {
      const res = await apiService.getPatients(branchId);
      setPatients(res?.data || []);
    } catch {
      toast({ title: 'Ошибка загрузки данных', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    if (!branchId) return;
    try {
      const params: any = { branch_id: branchId, month: visibleMonthISO };
      if (selectedPatientId !== 'ALL') params.patient_id = selectedPatientId;
      const response = await apiService.getDispensingCalendar(params);
      const daysSet = new Set<number>();

      if (Array.isArray(response?.data)) {
        const [year, month] = visibleMonthISO.split('-').map(Number);
        response.data.forEach((item: any) => {
          const dateStr = item.created_at || item.date || item.time;
          if (!dateStr) return;
          const parsed = new Date(dateStr);
          const local = new Date(parsed.toLocaleString('en-US', { timeZone: 'Asia/Almaty' }));
          if (local.getFullYear() === year && local.getMonth() === month - 1) {
            daysSet.add(local.getDate());
          }
        });
      } else if (response?.data && typeof response.data === 'object') {
        Object.keys(response.data).forEach((key) => {
          const dayNum = Number(key);
          if (!isNaN(dayNum)) daysSet.add(dayNum);
        });
      }

      setHighlightedDays(daysSet);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast({ title: 'Ошибка загрузки календаря', variant: 'destructive' });
    }
  };

  const fetchDayDetails = async (dateISO: string) => {
    if (!branchId || selectedPatientId === 'ALL') return;
    setDayDetail({ open: true, dateISO, loading: true, items: [] });
    try {
      const res = await apiService.getDispensingDayDetails(branchId, selectedPatientId, dateISO);
      setDayDetail({ open: true, dateISO, loading: false, items: res?.data || [] });
    } catch {
      toast({ title: 'Ошибка загрузки данных', variant: 'destructive' });
      setDayDetail({ open: true, dateISO, loading: false, items: [] });
    }
  };

  const getDaysInMonth = () => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [] as Array<number | null>;
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const handleDayClick = (day: number) => {
    if (selectedPatientId === 'ALL') return;
    if (!highlightedDays.has(day)) return;
    const dateISO = `${visibleMonthISO}-${String(day).padStart(2, '0')}`;
    fetchDayDetails(dateISO);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = visibleMonthISO.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    setVisibleMonthISO(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Загрузка календаря...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Календарь выдач</h1>
          <p className="text-muted-foreground">Отслеживание выдач лекарств пациентам</p>
        </div>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Пациенты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPatientId} onValueChange={(v) => setSelectedPatientId(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Все пациенты</SelectItem>
                  {patients.filter((p) => p?.id).map((p) => (
                    <SelectItem key={String(p.id)} value={String(p.id)}>
                      {p.first_name || p.firstName} {p.last_name || p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}
                </CardTitle>
                <div className="flex space-x-1">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth().map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day && (
                      <Button
                        variant="ghost"
                        className={`w-full h-full p-1 text-sm ${
                          highlightedDays.has(day)
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                            : ''
                        }`}
                        onClick={() => handleDayClick(day)}
                        disabled={selectedPatientId === 'ALL' || !highlightedDays.has(day)}
                      >
                        {day}
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-400 dark:bg-green-900/40 rounded"></div>
                    <span>Есть выдачи</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <span>Нет выдач</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dayDetail.open} onOpenChange={(o) => setDayDetail((prev) => ({ ...prev, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dayDetail.dateISO && (() => {
                const d = new Date(`${dayDetail.dateISO}T00:00:00`);
                return `Выдачи ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
              })()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {dayDetail.loading && <div>Загрузка...</div>}
            {!dayDetail.loading && dayDetail.items.length === 0 && (
              <div className="text-sm text-muted-foreground">Нет выдач за выбранный день</div>
            )}
            {!dayDetail.loading &&
              dayDetail.items.map((detail, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="text-sm text-muted-foreground mb-2">
                    Время: {detail.time} | Сотрудник: {detail.employee_name}
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {detail.items.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {item.type === 'medicine' ? 'Medicine' : 'Device'}: {item.name} — {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;

