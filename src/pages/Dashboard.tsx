import { DollarSign, ShoppingCart, Package, TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DueBillsAlert } from '@/components/dashboard/DueBillsAlert';
import { useProducts } from '@/hooks/useProducts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, format } from 'date-fns';

interface TransactionData {
  id: string;
  transaction_id: string;
  total: number;
  payment_method: string;
  cashier_name: string;
  created_at: string;
  items_count?: number;
}

export default function Dashboard() {
  const { products, isLoading: productsLoading } = useProducts();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTodayTransactions = async () => {
      const today = new Date();
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_id,
          total,
          payment_method,
          cashier_name,
          created_at,
          transaction_items (id)
        `)
        .gte('created_at', startOfDay(today).toISOString())
        .lte('created_at', endOfDay(today).toISOString())
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(data.map(t => ({
          ...t,
          items_count: t.transaction_items?.length || 0,
        })));
      }
      setIsLoading(false);
    };

    fetchTodayTransactions();
  }, []);

  const todaySales = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = transactions.length;
  const lowStockProducts = products.filter(p => p.stock <= 5).length;
  const avgTransaction = totalTransactions > 0 ? Math.round(todaySales / totalTransactions) : 0;

  const recentTransactions = transactions.slice(0, 5);

  if (isLoading || productsLoading) {
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
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Data hari ini - {format(new Date(), 'dd MMMM yyyy')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Penjualan Hari Ini"
            value={`Rp ${todaySales.toLocaleString('id-ID')}`}
            change={`${totalTransactions} transaksi`}
            changeType="positive"
            icon={DollarSign}
            delay={0}
          />
          <StatCard
            title="Total Transaksi"
            value={totalTransactions.toString()}
            change="Hari ini"
            changeType="positive"
            icon={ShoppingCart}
            delay={100}
          />
          <StatCard
            title="Stok Menipis"
            value={lowStockProducts.toString()}
            change={lowStockProducts > 0 ? "Perlu restok" : "Stok aman"}
            changeType={lowStockProducts > 0 ? "negative" : "positive"}
            icon={Package}
            delay={200}
          />
          <StatCard
            title="Rata-rata Transaksi"
            value={`Rp ${avgTransaction.toLocaleString('id-ID')}`}
            change="Per transaksi"
            changeType="positive"
            icon={TrendingUp}
            delay={300}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Transaksi Terbaru</h2>
            </div>
            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada transaksi hari ini</p>
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.transaction_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.items_count} item • {transaction.cashier_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        Rp {transaction.total.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">{transaction.payment_method}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Products by Stock */}
          <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
            <h2 className="text-lg font-semibold text-foreground mb-6">Produk Terlaris</h2>
            <div className="space-y-4">
              {products.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                  <div className="flex items-center gap-1 text-success text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Stok: {product.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Due Bills Alert */}
        <DueBillsAlert />

        {/* Low Stock Alert */}
        {lowStockProducts > 0 && (
          <div className="glass rounded-xl p-6 border border-warning/30 animate-slide-up" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Peringatan Stok</h3>
                <p className="text-sm text-muted-foreground">{lowStockProducts} produk memiliki stok rendah</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {products.filter(p => p.stock <= 5).slice(0, 4).map((product) => (
                <div key={product.id} className="bg-secondary/30 rounded-lg p-3">
                  <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                  <p className="text-xs text-warning">Stok: {product.stock}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}