import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProfitReport } from '@/hooks/useProfitReport';
import { cn, formatCurrency, formatShortCurrency } from '@/lib/utils';
import { format, subMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

type ReportPeriod = 'monthly' | 'yearly';

export default function ProfitReport() {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { data, summary, isLoading, dateRange: calculatedDateRange } = useProfitReport(
    period,
    dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined
  );


  const clearDateFilter = () => {
    setDateRange(undefined);
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
            <h1 className="text-3xl font-bold text-foreground">Laporan Laba Rugi</h1>
            <p className="text-muted-foreground mt-1">
              {format(calculatedDateRange.start, 'dd MMM yyyy', { locale: localeId })} - {format(calculatedDateRange.end, 'dd MMM yyyy', { locale: localeId })}
            </p>
          </div>
        </div>

        {/* Period Filter & Date Picker */}
        <div className="glass rounded-xl p-4 animate-slide-up">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div className="flex gap-2">
                {(['monthly', 'yearly'] as const).map((p) => (
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
                    {p === 'monthly' ? 'Bulanan' : 'Tahunan'}
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
                    defaultMonth={subMonths(new Date(), 1)}
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
          {/* Total Revenue */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Pendapatan</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground mt-1">{summary.totalTransactions} transaksi</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          {/* COGS */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">HPP (Harga Pokok)</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalCogs)}</p>
                <p className="text-sm text-muted-foreground mt-1">{summary.totalItemsSold} item terjual</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Minus className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Laba Kotor</p>
                <p className={cn("text-2xl font-bold", summary.totalGrossProfit >= 0 ? "text-success" : "text-destructive")}>
                  {formatCurrency(summary.totalGrossProfit)}
                </p>
                <p className={cn("text-sm mt-1 flex items-center gap-1", summary.grossProfitMargin >= 0 ? "text-success" : "text-destructive")}>
                  {summary.grossProfitMargin >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {summary.grossProfitMargin.toFixed(1)}% margin
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Laba Bersih</p>
                <p className={cn("text-2xl font-bold", summary.totalNetProfit >= 0 ? "text-success" : "text-destructive")}>
                  {formatCurrency(summary.totalNetProfit)}
                </p>
                <p className={cn("text-sm mt-1 flex items-center gap-1", summary.netProfitMargin >= 0 ? "text-success" : "text-destructive")}>
                  {summary.netProfitMargin >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {summary.netProfitMargin.toFixed(1)}% margin
                </p>
              </div>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", summary.totalNetProfit >= 0 ? "bg-success/10" : "bg-destructive/10")}>
                {summary.totalNetProfit >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-success" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-destructive" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profit Breakdown */}
        <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Rincian Laba Rugi</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-foreground font-medium">Total Pendapatan (Penjualan)</span>
              <span className="text-foreground font-semibold">{formatCurrency(summary.totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Harga Pokok Penjualan (HPP)</span>
              <span className="text-destructive">- {formatCurrency(summary.totalCogs)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border bg-success/5 -mx-6 px-6">
              <span className="text-success font-medium">Laba Kotor</span>
              <span className="text-success font-semibold">{formatCurrency(summary.totalGrossProfit)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="text-muted-foreground">Biaya Operasional</span>
              <span className="text-destructive">- {formatCurrency(summary.totalOperationalExpenses)}</span>
            </div>
            <div className={cn("flex items-center justify-between py-3 -mx-6 px-6", summary.totalNetProfit >= 0 ? "bg-success/10" : "bg-destructive/10")}>
              <span className={cn("font-bold", summary.totalNetProfit >= 0 ? "text-success" : "text-destructive")}>
                Laba Bersih
              </span>
              <span className={cn("font-bold text-lg", summary.totalNetProfit >= 0 ? "text-success" : "text-destructive")}>
                {formatCurrency(summary.totalNetProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs COGS Chart */}
          <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Pendapatan vs HPP</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="period"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={formatShortCurrency}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'revenue' ? 'Pendapatan' : 'HPP'
                    ]}
                  />
                  <Legend 
                    formatter={(value) => value === 'revenue' ? 'Pendapatan' : 'HPP'}
                  />
                  <Bar dataKey="revenue" fill="hsl(185, 70%, 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cogs" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit Trend Chart */}
          <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <h2 className="text-lg font-semibold text-foreground mb-4">Tren Laba</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="period"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={formatShortCurrency}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'grossProfit' ? 'Laba Kotor' : 'Laba Bersih'
                    ]}
                  />
                  <Legend 
                    formatter={(value) => value === 'grossProfit' ? 'Laba Kotor' : 'Laba Bersih'}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="grossProfit" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(142, 76%, 36%)', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netProfit" 
                    stroke="hsl(185, 70%, 50%)" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(185, 70%, 50%)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly/Period Data Table */}
        <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Detail Per Periode</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Periode</th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Pendapatan</th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">HPP</th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Laba Kotor</th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Biaya Op.</th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Laba Bersih</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.period} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">{row.period}</td>
                    <td className="p-3 text-right text-foreground">{formatCurrency(row.revenue)}</td>
                    <td className="p-3 text-right text-muted-foreground">{formatCurrency(row.cogs)}</td>
                    <td className={cn("p-3 text-right font-medium", row.grossProfit >= 0 ? "text-success" : "text-destructive")}>
                      {formatCurrency(row.grossProfit)}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">{formatCurrency(row.operationalExpenses)}</td>
                    <td className={cn("p-3 text-right font-semibold", row.netProfit >= 0 ? "text-success" : "text-destructive")}>
                      {formatCurrency(row.netProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-secondary/30">
                  <td className="p-3 font-bold text-foreground">Total</td>
                  <td className="p-3 text-right font-bold text-foreground">{formatCurrency(summary.totalRevenue)}</td>
                  <td className="p-3 text-right font-bold text-muted-foreground">{formatCurrency(summary.totalCogs)}</td>
                  <td className={cn("p-3 text-right font-bold", summary.totalGrossProfit >= 0 ? "text-success" : "text-destructive")}>
                    {formatCurrency(summary.totalGrossProfit)}
                  </td>
                  <td className="p-3 text-right font-bold text-muted-foreground">{formatCurrency(summary.totalOperationalExpenses)}</td>
                  <td className={cn("p-3 text-right font-bold", summary.totalNetProfit >= 0 ? "text-success" : "text-destructive")}>
                    {formatCurrency(summary.totalNetProfit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
