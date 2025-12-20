import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CalendarIcon, 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  Search, 
  Download,
  Building2,
  Wallet
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useStore } from '@/context/StoreContext';
import { PaymentMethod } from '@/types';

interface SupplierPaymentData {
  id: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  notes: string | null;
  purchaseId: string;
  purchaseNo: string;
  supplierName: string;
}

type DatePreset = 'today' | 'this-week' | 'this-month' | 'last-month' | 'custom';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  card: 'Kartu',
};

export default function SupplierPaymentReport() {
  const { settings } = useStore();
  const [payments, setPayments] = useState<SupplierPaymentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  
  const [datePreset, setDatePreset] = useState<DatePreset>('this-month');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  // Fetch suppliers for filter
  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data } = await supabase.from('suppliers').select('id, name').order('name');
      if (data) setSuppliers(data);
    };
    fetchSuppliers();
  }, []);

  // Handle date preset change
  useEffect(() => {
    const today = new Date();
    switch (datePreset) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'this-week':
        setStartDate(startOfWeek(today, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case 'this-month':
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case 'last-month':
        const lastMonth = subMonths(today, 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
    }
  }, [datePreset]);

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);

      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('supplier_payments')
        .select(`
          id,
          amount,
          payment_date,
          payment_method,
          notes,
          purchase_id,
          purchases!inner (
            purchase_id,
            supplier_id,
            suppliers (name)
          )
        `)
        .gte('payment_date', startOfDay.toISOString())
        .lte('payment_date', endOfDay.toISOString())
        .order('payment_date', { ascending: false });

      if (error) {
        toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
      } else if (data) {
        const mapped: SupplierPaymentData[] = data.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          paymentDate: new Date(p.payment_date),
          paymentMethod: p.payment_method as PaymentMethod,
          notes: p.notes,
          purchaseId: p.purchase_id,
          purchaseNo: p.purchases?.purchase_id || '',
          supplierName: p.purchases?.suppliers?.name || 'Tidak diketahui',
        }));
        setPayments(mapped);
      }
      setIsLoading(false);
    };

    fetchPayments();
  }, [startDate, endDate]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch = 
        payment.purchaseNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSupplier = supplierFilter === 'all' || payment.supplierName === suppliers.find(s => s.id === supplierFilter)?.name;
      const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
      return matchesSearch && matchesSupplier && matchesMethod;
    });
  }, [payments, searchQuery, supplierFilter, methodFilter, suppliers]);

  // Calculate summary
  const summary = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const byMethod = filteredPayments.reduce((acc, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount;
      return acc;
    }, {} as Record<PaymentMethod, number>);
    return { total, byMethod, count: filteredPayments.length };
  }, [filteredPayments]);

  // Export to PDF
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.name, pageWidth / 2, yPos, { align: 'center' });

      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Laporan Pembayaran Supplier', pageWidth / 2, yPos, { align: 'center' });

      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Periode: ${format(startDate, 'dd MMM yyyy', { locale: localeId })} - ${format(endDate, 'dd MMM yyyy', { locale: localeId })}`,
        pageWidth / 2,
        yPos,
        { align: 'center' }
      );

      // Summary
      yPos += 15;
      doc.setDrawColor(200);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, yPos, pageWidth - 28, 25, 3, 3, 'F');

      yPos += 10;
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text('Ringkasan', 20, yPos);

      yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Pembayaran: Rp ${summary.total.toLocaleString('id-ID')}`, 20, yPos);
      doc.text(`Jumlah Transaksi: ${summary.count}`, pageWidth / 2 + 10, yPos);

      // Table
      yPos += 15;
      autoTable(doc, {
        startY: yPos,
        head: [['Tanggal', 'No. Pembelian', 'Supplier', 'Metode', 'Jumlah']],
        body: filteredPayments.map((p) => [
          format(p.paymentDate, 'dd/MM/yyyy'),
          p.purchaseNo,
          p.supplierName,
          paymentMethodLabels[p.paymentMethod],
          `Rp ${p.amount.toLocaleString('id-ID')}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [0, 150, 136] },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Dicetak: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: localeId })} | Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      const fileName = `Laporan_Pembayaran_Supplier_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
      doc.save(fileName);
      toast({ title: 'Export Berhasil', description: `File ${fileName} berhasil diunduh` });
    } catch (error) {
      toast({ title: 'Export Gagal', description: 'Terjadi kesalahan saat export PDF', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['LAPORAN PEMBAYARAN SUPPLIER'],
        [settings.name],
        [''],
        ['Periode:', `${format(startDate, 'dd MMM yyyy', { locale: localeId })} - ${format(endDate, 'dd MMM yyyy', { locale: localeId })}`],
        [''],
        ['RINGKASAN'],
        ['Total Pembayaran', summary.total],
        ['Jumlah Transaksi', summary.count],
        [''],
        ['PEMBAYARAN PER METODE'],
        ...Object.entries(summary.byMethod).map(([method, amount]) => [
          paymentMethodLabels[method as PaymentMethod],
          amount,
        ]),
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

      // Detail sheet
      const detailHeader = ['Tanggal', 'No. Pembelian', 'Supplier', 'Metode', 'Jumlah', 'Catatan'];
      const detailData = filteredPayments.map((p) => [
        format(p.paymentDate, 'dd/MM/yyyy HH:mm'),
        p.purchaseNo,
        p.supplierName,
        paymentMethodLabels[p.paymentMethod],
        p.amount,
        p.notes || '',
      ]);
      const detailSheet = XLSX.utils.aoa_to_sheet([detailHeader, ...detailData]);
      detailSheet['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detail Pembayaran');

      const fileName = `Laporan_Pembayaran_Supplier_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast({ title: 'Export Berhasil', description: `File ${fileName} berhasil diunduh` });
    } catch (error) {
      toast({ title: 'Export Gagal', description: 'Terjadi kesalahan saat export Excel', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout requireRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Laporan Pembayaran Supplier</h1>
            <p className="text-muted-foreground mt-1">Rekap pembayaran ke supplier berdasarkan periode</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel} disabled={isExporting || filteredPayments.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={isExporting || filteredPayments.length === 0}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-border bg-card p-4 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date preset */}
            <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
              <SelectTrigger>
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="this-week">Minggu Ini</SelectItem>
                <SelectItem value="this-month">Bulan Ini</SelectItem>
                <SelectItem value="last-month">Bulan Lalu</SelectItem>
                <SelectItem value="custom">Kustom</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom date pickers */}
            {datePreset === 'custom' && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, 'dd MMM yyyy', { locale: localeId })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, 'dd MMM yyyy', { locale: localeId })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}

            {/* Supplier filter */}
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Supplier</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Method filter */}
            <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as PaymentMethod | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Metode</SelectItem>
                <SelectItem value="cash">Tunai</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="card">Kartu</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                <p className="text-xl font-bold text-foreground">
                  Rp {summary.total.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jumlah Transaksi</p>
                <p className="text-xl font-bold text-foreground">{summary.count}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tunai</p>
                <p className="text-xl font-bold text-foreground">
                  Rp {(summary.byMethod.cash || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transfer</p>
                <p className="text-xl font-bold text-foreground">
                  Rp {(summary.byMethod.transfer || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-foreground" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Tanggal</th>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">No. Pembelian</th>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Supplier</th>
                    <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Metode</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Jumlah</th>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <span className="text-foreground">
                          {format(payment.paymentDate, 'dd MMM yyyy', { locale: localeId })}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {format(payment.paymentDate, 'HH:mm')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-foreground">{payment.purchaseNo}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-foreground">{payment.supplierName}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                          payment.paymentMethod === 'cash' && "bg-success/10 text-success",
                          payment.paymentMethod === 'transfer' && "bg-primary/10 text-primary",
                          payment.paymentMethod === 'card' && "bg-warning/10 text-warning"
                        )}>
                          {paymentMethodLabels[payment.paymentMethod]}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-semibold text-foreground">
                          Rp {payment.amount.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
                          {payment.notes || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && filteredPayments.length === 0 && (
            <div className="p-8 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada pembayaran ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
