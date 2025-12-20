import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export interface TransactionItem {
  id: string;
  productId: string | null;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

export interface TransactionData {
  id: string;
  transactionId: string;
  total: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  cashierId: string | null;
  cashierName: string;
  createdAt: Date;
  customerPaid?: number;
  change?: number;
  items: TransactionItem[];
}

export function useFetchTransactions() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_id,
          total,
          payment_method,
          cashier_id,
          cashier_name,
          created_at,
          customer_paid,
          change_amount,
          transaction_items (
            id,
            product_id,
            product_name,
            product_price,
            quantity,
            subtotal
          )
        `)
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      const mappedTransactions: TransactionData[] = (data ?? []).map(t => ({
        id: t.id,
        transactionId: t.transaction_id,
        total: t.total,
        paymentMethod: t.payment_method as 'cash' | 'card' | 'qris',
        cashierId: t.cashier_id,
        cashierName: t.cashier_name,
        createdAt: new Date(t.created_at),
        customerPaid: t.customer_paid ?? undefined,
        change: t.change_amount ?? undefined,
        items: (t.transaction_items ?? []).map(item => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          productPrice: item.product_price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      }));

      setTransactions(mappedTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}

// Helper functions for reports
export const getTransactionsByDateRange = (
  transactions: TransactionData[],
  startDate: Date,
  endDate: Date
): TransactionData[] => {
  return transactions.filter(t => {
    const date = new Date(t.createdAt);
    return date >= startDate && date <= endDate;
  });
};

export const getDailySalesData = (transactions: TransactionData[], days: number = 7) => {
  const data: { date: string; sales: number; transactions: number }[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayTransactions = transactions.filter(t => {
      const tDate = new Date(t.createdAt);
      return tDate >= dayStart && tDate <= dayEnd;
    });
    
    data.push({
      date: format(date, 'EEE d', { locale: localeId }),
      sales: dayTransactions.reduce((sum, t) => sum + t.total, 0),
      transactions: dayTransactions.length,
    });
  }
  
  return data;
};

export const getWeeklySalesData = (transactions: TransactionData[], weeks: number = 4) => {
  const data: { week: string; sales: number; transactions: number }[] = [];
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = subDays(new Date(), i * 7);
    const weekStart = subDays(weekEnd, 6);
    
    const weekTransactions = transactions.filter(t => {
      const tDate = new Date(t.createdAt);
      return tDate >= startOfDay(weekStart) && tDate <= weekEnd;
    });
    
    data.push({
      week: `Minggu ${weeks - i}`,
      sales: weekTransactions.reduce((sum, t) => sum + t.total, 0),
      transactions: weekTransactions.length,
    });
  }
  
  return data;
};

export const getMonthlySalesData = (transactions: TransactionData[]) => {
  const data: { month: string; sales: number; transactions: number }[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const currentMonth = new Date().getMonth();
  
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const year = new Date().getFullYear() - (currentMonth - i < 0 ? 1 : 0);
    
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.createdAt);
      return tDate.getMonth() === monthIndex && tDate.getFullYear() === year;
    });
    
    data.push({
      month: months[monthIndex],
      sales: monthTransactions.reduce((sum, t) => sum + t.total, 0),
      transactions: monthTransactions.length,
    });
  }
  
  return data;
};

export const getPaymentMethodStats = (transactions: TransactionData[]) => {
  const stats = {
    cash: { count: 0, total: 0 },
    card: { count: 0, total: 0 },
    qris: { count: 0, total: 0 },
  };
  
  transactions.forEach(t => {
    stats[t.paymentMethod].count++;
    stats[t.paymentMethod].total += t.total;
  });
  
  return [
    { name: 'Cash', value: stats.cash.total, count: stats.cash.count },
    { name: 'Card', value: stats.card.total, count: stats.card.count },
    { name: 'QRIS', value: stats.qris.total, count: stats.qris.count },
  ];
};

export const getTopProducts = (transactions: TransactionData[], limit: number = 5) => {
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  
  transactions.forEach(t => {
    t.items.forEach(item => {
      const key = item.productId || item.productName;
      if (!productSales[key]) {
        productSales[key] = {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[key].quantity += item.quantity;
      productSales[key].revenue += item.subtotal;
    });
  });
  
  return Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

export const getCashierPerformance = (transactions: TransactionData[]) => {
  const performance: Record<string, { name: string; transactions: number; revenue: number }> = {};
  
  transactions.forEach(t => {
    const key = t.cashierId || t.cashierName;
    if (!performance[key]) {
      performance[key] = {
        name: t.cashierName,
        transactions: 0,
        revenue: 0,
      };
    }
    performance[key].transactions++;
    performance[key].revenue += t.total;
  });
  
  return Object.values(performance).sort((a, b) => b.revenue - a.revenue);
};