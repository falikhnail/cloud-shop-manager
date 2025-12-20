import { Receipt } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { mockTransactions } from '@/data/mockData';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';

export default function History() {
  const { user } = useAuth();
  
  // Filter transactions by current cashier
  const myTransactions = mockTransactions.filter(t => t.cashierId === user?.id);

  return (
    <MainLayout requireRole="kasir">
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Riwayat Transaksi</h1>
          <p className="text-muted-foreground mt-1">Transaksi yang Anda proses hari ini</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 animate-slide-up">
          <div className="glass rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Transaksi</p>
            <p className="text-3xl font-bold text-foreground">{myTransactions.length}</p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Penjualan</p>
            <p className="text-3xl font-bold text-primary">
              Rp {myTransactions.reduce((sum, t) => sum + t.total, 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {myTransactions.map((transaction, index) => (
            <div 
              key={transaction.id} 
              className="glass rounded-xl p-5 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{transaction.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(transaction.createdAt, 'HH:mm', { locale: id })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    Rp {transaction.total.toLocaleString('id-ID')}
                  </p>
                  <span className="text-xs text-muted-foreground uppercase">
                    {transaction.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {transaction.items.map((item, idx) => (
                  <span key={idx}>
                    {item.product.name} ({item.quantity})
                    {idx < transaction.items.length - 1 && ', '}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {myTransactions.length === 0 && (
            <div className="glass rounded-xl p-12 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Belum ada transaksi hari ini</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
