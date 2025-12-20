import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Calendar,
  Users,
  Package,
  CreditCard,
  FileText,
  FileSpreadsheet,
  Loader2,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  useFetchTransactions,
  getDailySalesData,
  getWeeklySalesData,
  getMonthlySalesData,
  getPaymentMethodStats,
  getTopProducts,
  getCashierPerformance,
  getTransactionsByDateRange
} from '@/hooks/useFetchTransactions';
import { useStore } from '@/context/StoreContext';
import { exportToPDF, exportToExcel } from '@/lib/exportReport';
import { cn, formatCurrency, formatShortCurrency } from '@/lib/utils';
import { subDays, startOfDay, format, isWithinInterval, endOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

const COLORS = ['hsl(185, 70%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(270, 70%, 50%)'];

export default function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const { settings } = useStore();
  const { transactions, isLoading } = useFetchTransactions();

  // Get date range based on period or custom selection
  const calculatedDateRange = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) };
    }
    
    const end = new Date();
    let start: Date;
    
    switch (period) {
      case 'daily':
        start = subDays(end, 7);
        break;
      case 'weekly':
        start = subDays(end, 28);
        break;
      case 'monthly':
        start = subDays(end, 180);
        break;
    }
    
    return { start: startOfDay(start), end };
  }, [period, dateRange]);

  // Get filtered transactions
  const filteredTransactions = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return transactions.filter(t => 
        isWithinInterval(new Date(t.createdAt), {
          start: startOfDay(dateRange.from!),
          end: endOfDay(dateRange.to!)
        })
      );
    }
    return getTransactionsByDateRange(transactions, calculatedDateRange.start, calculatedDateRange.end);
  }, [transactions, calculatedDateRange, dateRange]);

  const clearDateFilter = () => {
    setDateRange(undefined);
  };

  // Get chart data based on period
  const chartData = useMemo(() => {
    switch (period) {
      case 'daily':
        return getDailySalesData(transactions, 7);
      case 'weekly':
        return getWeeklySalesData(transactions, 4);
      case 'monthly':
        return getMonthlySalesData(transactions);
    }
  }, [transactions, period]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = filteredTransactions.length;
    const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // Compare with previous period
    const prevEnd = calculatedDateRange.start;
    const prevStart = subDays(prevEnd, Math.ceil((calculatedDateRange.end.getTime() - calculatedDateRange.start.getTime()) / (1000 * 60 * 60 * 24)));
    const prevTransactions = getTransactionsByDateRange(transactions, prevStart, prevEnd);
    const prevSales = prevTransactions.reduce((sum, t) => sum + t.total, 0);
    
    const salesGrowth = prevSales > 0 ? ((totalSales - prevSales) / prevSales) * 100 : 0;
    
    return { totalSales, totalTransactions, avgTransaction: Math.round(avgTransaction), salesGrowth };
  }, [filteredTransactions, transactions, calculatedDateRange]);

  const paymentStats = useMemo(() => getPaymentMethodStats(filteredTransactions), [filteredTransactions]);
  const topProducts = useMemo(() => getTopProducts(filteredTransactions, 5), [filteredTransactions]);
  const cashierPerformance = useMemo(() => getCashierPerformance(filteredTransactions), [filteredTransactions]);

  

  const periodLabels = {
    daily: '7 Hari Terakhir',
    weekly: '4 Minggu Terakhir',
    monthly: '6 Bulan Terakhir',
  };

  // Prepare export data - convert to format expected by export functions
  const getExportData = () => {
    const exportTransactions = filteredTransactions.map(t => ({
      id: t.transactionId,
      items: t.items.map(item => ({
        product: {
          id: item.productId || '',
          name: item.productName,
          price: item.productPrice,
          sellingPrice: item.productPrice,
          category: '',
          stock: 0,
        },
        quantity: item.quantity,
      })),
      total: t.total,
      paymentMethod: t.paymentMethod,
      cashierId: t.cashierId || '',
      cashierName: t.cashierName,
      createdAt: t.createdAt,
      customerPaid: t.customerPaid,
      change: t.change,
    }));

    return {
      storeName: settings.name,
      period: dateRange?.from ? `${format(dateRange.from, 'dd MMM yyyy', { locale: localeId })} - ${format(dateRange.to!, 'dd MMM yyyy', { locale: localeId })}` : periodLabels[period],
      dateRange: calculatedDateRange,
      summary: summaryStats,
      chartData: chartData.map(item => ({
        label: (item as any).date || (item as any).week || (item as any).month,
        sales: item.sales,
        transactions: item.transactions,
      })),
      paymentStats,
      topProducts,
      cashierPerformance,
      transactions: exportTransactions,
    };
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const fileName = exportToPDF(getExportData());
      toast({
        title: "Export Berhasil",
        description: `File ${fileName} berhasil diunduh`,
      });
    } catch (error) {
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat export PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const fileName = exportToExcel(getExportData());
      toast({
        title: "Export Berhasil",
        description: `File ${fileName} berhasil diunduh`,
      });
    } catch (error) {
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat export Excel",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout requireRole="admin">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout requireRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Laporan Penjualan</h1>
            <p className="text-muted-foreground mt-1">
              {dateRange?.from 
                ? `${format(dateRange.from, 'dd MMM yyyy', { locale: localeId })} - ${format(dateRange.to!, 'dd MMM yyyy', { locale: localeId })}`
                : periodLabels[period]
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Period Filter & Date Picker */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                      setDateRange(undefined);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      period === p && !dateRange
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : 'Bulanan'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      dateRange?.from && "text-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd MMM yyyy", { locale: localeId })} -{" "}
                          {format(dateRange.to, "dd MMM yyyy", { locale: localeId })}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: localeId })
                      )
                    ) : (
                      <span className="text-muted-foreground">Pilih Rentang Tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={subDays(new Date(), 7)}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              {dateRange?.from && (
                <Button variant="ghost" size="icon" onClick={clearDateFilter}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Penjualan</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(summaryStats.totalSales)}</p>
                <p className={cn(
                  "text-sm mt-1",
                  summaryStats.salesGrowth >= 0 ? "text-success" : "text-destructive"
                )}>
                  {summaryStats.salesGrowth >= 0 ? '+' : ''}{summaryStats.salesGrowth.toFixed(1)}% dari periode sebelumnya
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Transaksi</p>
                <p className="text-2xl font-bold text-foreground">{summaryStats.totalTransactions}</p>
                <p className="text-sm text-muted-foreground mt-1">transaksi</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rata-rata Transaksi</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(summaryStats.avgTransaction)}</p>
                <p className="text-sm text-muted-foreground mt-1">per transaksi</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Produk Terjual</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredTransactions.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">item</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="lg:col-span-2 glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Grafik Penjualan</h2>
                  <p className="text-sm text-muted-foreground">{periodLabels[period]}</p>
                </div>
              </div>
            </div>
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey={period === 'daily' ? 'date' : period === 'weekly' ? 'week' : 'month'} 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(0)}jt` : value >= 1000 ? `${(value / 1000).toFixed(0)}rb` : value}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Penjualan']}
                  />
                  <Bar 
                    dataKey="sales" 
                    fill="hsl(185, 70%, 50%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Metode Pembayaran</h2>
                <p className="text-sm text-muted-foreground">Distribusi pembayaran</p>
              </div>
            </div>
            
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Total']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-4">
              {paymentStats.map((stat, index) => (
                <div key={stat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-muted-foreground">{stat.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{stat.count} trx</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Produk Terlaris</h2>
                <p className="text-sm text-muted-foreground">Berdasarkan pendapatan</p>
              </div>
            </div>

            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Belum ada data penjualan</p>
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.quantity} terjual</p>
                    </div>
                    <p className="font-semibold text-primary text-sm">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cashier Performance */}
          <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Performa Kasir</h2>
                <p className="text-sm text-muted-foreground">Berdasarkan pendapatan</p>
              </div>
            </div>

            <div className="space-y-4">
              {cashierPerformance.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Belum ada data</p>
              ) : (
                cashierPerformance.map((cashier, index) => {
                  const maxRevenue = cashierPerformance[0]?.revenue || 1;
                  const percentage = (cashier.revenue / maxRevenue) * 100;
                  
                  return (
                    <div key={cashier.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {cashier.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{cashier.name}</p>
                            <p className="text-xs text-muted-foreground">{cashier.transactions} transaksi</p>
                          </div>
                        </div>
                        <p className="font-semibold text-primary text-sm">
                          {formatCurrency(cashier.revenue)}
                        </p>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}