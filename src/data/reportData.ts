import { Transaction } from '@/types';
import { mockProducts } from './mockData';
import { subDays, subHours, startOfDay, addHours } from 'date-fns';

// Generate more realistic transaction data for reports
const generateTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const paymentMethods: ('cash' | 'card' | 'qris')[] = ['cash', 'card', 'qris'];
  const cashiers = [
    { id: '2', name: 'Kasir 1' },
    { id: '3', name: 'Budi Santoso' },
    { id: '4', name: 'Siti Rahayu' },
  ];

  // Generate transactions for the last 30 days
  for (let day = 0; day < 30; day++) {
    const baseDate = startOfDay(subDays(new Date(), day));
    // Random number of transactions per day (5-15)
    const transactionsPerDay = Math.floor(Math.random() * 11) + 5;

    for (let t = 0; t < transactionsPerDay; t++) {
      const hour = Math.floor(Math.random() * 12) + 9; // 9 AM to 9 PM
      const transactionDate = addHours(baseDate, hour);
      
      // Random items (1-4 items per transaction)
      const numItems = Math.floor(Math.random() * 4) + 1;
      const items: Transaction['items'] = [];
      let total = 0;

      for (let i = 0; i < numItems; i++) {
        const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        items.push({ product, quantity });
        total += product.price * quantity;
      }

      const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      const transaction: Transaction = {
        id: `TRX-${String(day).padStart(2, '0')}${String(t).padStart(3, '0')}`,
        items,
        total,
        paymentMethod,
        cashierId: cashier.id,
        cashierName: cashier.name,
        createdAt: transactionDate,
      };

      if (paymentMethod === 'cash') {
        const roundedTotal = Math.ceil(total / 10000) * 10000;
        transaction.customerPaid = roundedTotal;
        transaction.change = roundedTotal - total;
      }

      transactions.push(transaction);
    }
  }

  return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const reportTransactions = generateTransactions();

// Helper functions for reports
export const getTransactionsByDateRange = (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] => {
  return transactions.filter(t => {
    const date = new Date(t.createdAt);
    return date >= startDate && date <= endDate;
  });
};

export const getDailySalesData = (transactions: Transaction[], days: number = 7) => {
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
      date: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
      sales: dayTransactions.reduce((sum, t) => sum + t.total, 0),
      transactions: dayTransactions.length,
    });
  }
  
  return data;
};

export const getWeeklySalesData = (transactions: Transaction[], weeks: number = 4) => {
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

export const getMonthlySalesData = (transactions: Transaction[]) => {
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

export const getPaymentMethodStats = (transactions: Transaction[]) => {
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

export const getTopProducts = (transactions: Transaction[], limit: number = 5) => {
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  
  transactions.forEach(t => {
    t.items.forEach(item => {
      if (!productSales[item.product.id]) {
        productSales[item.product.id] = {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[item.product.id].quantity += item.quantity;
      productSales[item.product.id].revenue += item.product.price * item.quantity;
    });
  });
  
  return Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
};

export const getCashierPerformance = (transactions: Transaction[]) => {
  const performance: Record<string, { name: string; transactions: number; revenue: number }> = {};
  
  transactions.forEach(t => {
    if (!performance[t.cashierId]) {
      performance[t.cashierId] = {
        name: t.cashierName,
        transactions: 0,
        revenue: 0,
      };
    }
    performance[t.cashierId].transactions++;
    performance[t.cashierId].revenue += t.total;
  });
  
  return Object.values(performance).sort((a, b) => b.revenue - a.revenue);
};
