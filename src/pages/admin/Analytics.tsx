import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/utils/api";
import { CalendarIcon, Download, BarChart3, TrendingUp, Users, Package } from "lucide-react";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const METRICS = [
  { value: 'stock', label: 'Stock' },
  { value: 'arrivals', label: 'Arrivals' },
  { value: 'dispensing', label: 'Dispensing' },
  { value: 'transfers', label: 'Transfers' },
] as const;

const MONTHS = [
  { value: '1', label: 'Янв' },
  { value: '2', label: 'Фев' },
  { value: '3', label: 'Мар' },
  { value: '4', label: 'Апр' },
  { value: '5', label: 'Май' },
  { value: '6', label: 'Июн' },
  { value: '7', label: 'Июл' },
  { value: '8', label: 'Авг' },
  { value: '9', label: 'Сен' },
  { value: '10', label: 'Окт' },
  { value: '11', label: 'Ноя' },
  { value: '12', label: 'Дек' },
];

const YEARS = Array.from({ length: 6 }, (_, i) => {
  const y = new Date().getFullYear() - i;
  return { value: String(y), label: String(y) };
});

const Analytics = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [metric, setMetric] = useState<string>('stock');
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await apiService.getBranches();
      if (response.data) {
        setBranches(response.data);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      const params = {
        type: 'analytics',
        metric,
        branch_id: branchId && branchId !== 'all' ? branchId : undefined,
        date_from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
        date_to: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
        month: parseInt(month),
        year: parseInt(year)
      };

      const response = await apiService.generateReport(params);
      if (response.data) {
        setAnalyticsData(response.data);
        toast({
          title: "Аналитика сгенерирована",
          description: "Данные аналитики успешно получены",
        });
      }
    } catch (error) {
      console.error('Error generating analytics:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать аналитику",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!analyticsData) return;

    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Общая аналитика'],
      ['Параметр', 'Значение'],
      ['Всего отдач', analyticsData.totalDispensings || 0],
      ['Всего пациентов', analyticsData.totalPatients || 0],
      ['Всего лекарств отдано', analyticsData.totalMedicinesDispensed || 0],
      ['Всего ИМН отдано', analyticsData.totalDevicesDispensed || 0],
      ['Период', `${month}/${year}`],
      [
        'Филиал',
        branchId && branchId !== 'all'
          ? branches.find(b => String(b.id) === branchId)?.name || 'Неизвестно'
          : 'Все филиалы'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws, 'Общая аналитика');

    // Dispensings by medicine
    if (analyticsData.byMedicine && analyticsData.byMedicine.length > 0) {
      const medicineData = [
        ['Отдачи по лекарствам'],
        ['Лекарство', 'Количество отдач', 'Общее количество']
      ];
      analyticsData.byMedicine.forEach((item: any) => {
        medicineData.push([item.name, item.dispensings, item.totalQuantity]);
      });
      
      const ws2 = XLSX.utils.aoa_to_sheet(medicineData);
      XLSX.utils.book_append_sheet(wb, ws2, 'По лекарствам');
    }

    // Dispensings by patient
    if (analyticsData.byPatient && analyticsData.byPatient.length > 0) {
      const patientData = [
        ['Отдачи по пациентам'],
        ['Пациент', 'Количество визитов', 'Общее количество препаратов']
      ];
      analyticsData.byPatient.forEach((item: any) => {
        patientData.push([`${item.firstName} ${item.lastName}`, item.visits, item.totalItems]);
      });
      
      const ws3 = XLSX.utils.aoa_to_sheet(patientData);
      XLSX.utils.book_append_sheet(wb, ws3, 'По пациентам');
    }

    const fileName = `analytics_${month}_${year}${
      branchId && branchId !== 'all'
        ? `_${branches.find(b => String(b.id) === branchId)?.name}`
        : ''
    }.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Файл экспортирован",
      description: `Аналитика сохранена в файл ${fileName}`,
    });
  };

  const getBranchName = (id: string) => {
    const branch = branches.find(b => String(b.id) === id);
    return branch ? branch.name : 'Неизвестный филиал';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Аналитика</h1>
        {analyticsData && (
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Экспорт в Excel
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Метрика</label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Метрика" />
                </SelectTrigger>
                <SelectContent>
                  {METRICS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Филиал</label>
              <Select value={branchId ?? undefined} onValueChange={setBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Все филиалы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все филиалы</SelectItem>
                  {branches
                    .filter(b => b?.id)
                    .map(branch => (
                      <SelectItem key={String(branch.id)} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Месяц</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Месяц" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Год</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Год" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={generateAnalytics} disabled={loading} className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                {loading ? 'Генерация...' : 'Сгенерировать'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Дата от</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd.MM.yyyy") : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium">Дата до</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd.MM.yyyy") : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Results */}
      {analyticsData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего отдач</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalDispensings || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего пациентов</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalPatients || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Лекарств отдано</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalMedicinesDispensed || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ИМН отдано</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalDevicesDispensed || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Medicines */}
          {analyticsData.byMedicine && analyticsData.byMedicine.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Топ лекарств по отдачам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.byMedicine.slice(0, 10).map((medicine: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded">
                      <div>
                        <span className="font-medium">{medicine.name}</span>
                        <p className="text-sm text-muted-foreground">
                          {medicine.dispensings} отдач
                        </p>
                      </div>
                      <Badge variant="outline">
                        {medicine.totalQuantity} шт.
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Patients */}
          {analyticsData.byPatient && analyticsData.byPatient.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Топ пациентов по визитам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.byPatient.slice(0, 10).map((patient: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded">
                      <div>
                        <span className="font-medium">{patient.firstName} {patient.lastName}</span>
                        <p className="text-sm text-muted-foreground">
                          {patient.visits} визитов
                        </p>
                      </div>
                      <Badge variant="outline">
                        {patient.totalItems} препаратов
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!analyticsData && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Выберите параметры и нажмите "Сгенерировать"</p>
            <p className="text-sm text-muted-foreground">чтобы увидеть аналитику по отдачам</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;