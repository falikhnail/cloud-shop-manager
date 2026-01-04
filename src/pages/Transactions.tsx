import { useState, useMemo } from 'react';
import { Search, Calendar, Download, Receipt, Loader2, X, DollarSign, ShoppingCart, TrendingUp, Package, FileText, FileSpreadsheet } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useFetchTransactions } from '@/hooks/useFetchTransactions';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useStore } from '@/context/StoreContext';
import { toast } from '@/hooks/use-toast';
import { exportTransactionsToPDF, exportTransactionsToExcel } from '@/lib/exportTransactions';

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isExporting, setIsExporting] = useState(false);
  const { transactions, isLoading } = useFetchTransactions();
  const { settings } = useStore();

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Search filter
      const matchesSearch = 
        transaction.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.cashierName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Date filter
      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const txDate = new Date(transaction.createdAt);
        if (dateRange.from && dateRange.to) {
          matchesDate = isWithinInterval(txDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to),
          });
        } else if (dateRange.from) {
          matchesDate = txDate >= startOfDay(dateRange.from);
        } else if (dateRange.to) {
          matchesDate = txDate <= endOfDay(dateRange.to);
        }
      }
      
      return matchesSearch && matchesDate;
    });
  }, [transactions, searchQuery, dateRange]);

  // Summary statistics
  const summary = useMemo(() => {
    const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalItems = filteredTransactions.reduce((sum, t) => 
      sum + t.items.reduce((s, i) => s + i.quantity, 0), 0
    );
    const avgTransaction = filteredTransactions.length > 0 
      ? Math.round(totalSales / filteredTransactions.length) 
      : 0;
    
    // Payment method breakdown
    const paymentBreakdown = {
      cash: filteredTransactions.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + t.total, 0),
      card: filteredTransactions.filter(t => t.paymentMethod === 'card').reduce((sum, t) => sum + t.total, 0),
      qris: filteredTransactions.filter(t => t.paymentMethod === 'qris').reduce((sum, t) => sum + t.total, 0),
    };

    return { totalSales, totalItems, avgTransaction, paymentBreakdown };
  }, [filteredTransactions]);

  const clearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const getExportData = () => {
    const periodStr = dateRange.from && dateRange.to
      ? `${format(dateRange.from, 'dd MMM yyyy', { locale: id })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: id })}`
      : 'Semua Waktu';

    return {
      storeName: settings.name,
      period: periodStr,
      dateRange: {
        start: dateRange.from,
        end: dateRange.to,
      },
      summary: {
        totalSales: summary.totalSales,
        totalTransactions: filteredTransactions.length,
        avgTransaction: summary.avgTransaction,
        totalItems: summary.totalItems,
        paymentBreakdown: summary.paymentBreakdown,
      },
      transactions: filteredTransactions.map(t => ({
        id: t.id,
        transactionId: t.transactionId,
        cashierName: t.cashierName,
        paymentMethod: t.paymentMethod,
        total: t.total,
        customerPaid: t.customerPaid,
        change: t.change,
        createdAt: t.createdAt,
        items: t.items.map(item => ({
          id: item.id,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      })),
    };
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const fileName = exportTransactionsToPDF(getExportData());
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
      const fileName = exportTransactionsToExcel(getExportData());
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
            <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>
            <p className="text-muted-foreground mt-1">
              Riwayat semua transaksi ({filteredTransactions.length} dari {transactions.length})
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting || filteredTransactions.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
            
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "gap-2 min-w-[240px] justify-start text-left font-normal",
                    (dateRange.from || dateRange.to) && "text-foreground"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd MMM', { locale: id })} -{' '}
                        {format(dateRange.to, 'dd MMM yyyy', { locale: id })}
                      </>
                    ) : (
                      format(dateRange.from, 'dd MMM yyyy', { locale: id })
                    )
                  ) : (
                    <span className="text-muted-foreground">Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  className="p-3 pointer-events-auto"
                  locale={id}
                />
              </PopoverContent>
            </Popover>

            {/* Clear Date Filter */}
            {(dateRange.from || dateRange.to) && (
              <Button variant="ghost" size="icon" onClick={clearDateFilter}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {(dateRange.from || dateRange.to) && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter aktif:</span>
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                <Calendar className="w-3 h-3" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd MMM yyyy', { locale: id })} - {format(dateRange.to, 'dd MMM yyyy', { locale: id })}
                  </>
                ) : dateRange.from ? (
                  <>Dari {format(dateRange.from, 'dd MMM yyyy', { locale: id })}</>
                ) : (
                  <>Sampai {format(dateRange.to!, 'dd MMM yyyy', { locale: id })}</>
                )}
                <button onClick={clearDateFilter} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Penjualan</p>
                <p className="text-2xl font-bold text-foreground">Rp {summary.totalSales.toLocaleString('id-ID')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {dateRange.from || dateRange.to ? 'Periode terpilih' : 'Semua waktu'}
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
                <p className="text-2xl font-bold text-foreground">{filteredTransactions.length}</p>
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
                <p className="text-2xl font-bold text-foreground">Rp {summary.avgTransaction.toLocaleString('id-ID')}</p>
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
                <p className="text-sm text-muted-foreground mb-1">Item Terjual</p>
                <p className="text-2xl font-bold text-foreground">{summary.totalItems}</p>
                <p className="text-sm text-muted-foreground mt-1">item produk</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        {filteredTransactions.length > 0 && (
          <div className="glass rounded-xl p-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <p className="text-sm font-medium text-foreground mb-3">Ringkasan Metode Pembayaran</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-secondary/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Cash</p>
                <p className="font-semibold text-foreground">Rp {summary.paymentBreakdown.cash.toLocaleString('id-ID')}</p>
              </div>
              <div className="text-center p-3 bg-secondary/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Card</p>
                <p className="font-semibold text-foreground">Rp {summary.paymentBreakdown.card.toLocaleString('id-ID')}</p>
              </div>
              <div className="text-center p-3 bg-secondary/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">QRIS</p>
                <p className="font-semibold text-foreground">Rp {summary.paymentBreakdown.qris.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        <div className="space-y-4">
          {filteredTransactions.map((transaction, index) => (
            <div 
              key={transaction.id} 
              className="glass rounded-xl p-6 animate-slide-up"
              style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-lg">{transaction.transactionId}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(transaction.createdAt, 'dd MMMM yyyy, HH:mm', { locale: id })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    Rp {transaction.total.toLocaleString('id-ID')}
                  </p>
                  <span className="inline-block px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground uppercase mt-1">
                    {transaction.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">
                    Kasir: <span className="text-foreground">{transaction.cashierName}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.items.length} item
                  </p>
                </div>
                
                <div className="space-y-2">
                  {transaction.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.productName} × {item.quantity}
                      </span>
                      <span className="text-foreground">
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                {transaction.paymentMethod === 'cash' && transaction.customerPaid && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Bayar: Rp {transaction.customerPaid.toLocaleString('id-ID')}
                    </span>
                    <span className="text-success">
                      Kembalian: Rp {transaction.change?.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="glass rounded-xl p-12 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada transaksi ditemukan</p>
              {(dateRange.from || dateRange.to || searchQuery) && (
                <Button variant="link" onClick={() => { clearDateFilter(); setSearchQuery(''); }} className="mt-2">
                  Hapus semua filter
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}