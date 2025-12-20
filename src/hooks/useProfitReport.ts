import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format, differenceInMonths, addMonths } from 'date-fns';

interface ProfitReportData {
  period: string;
  revenue: number; // Total penjualan (harga jual)
  cogs: number; // Cost of Goods Sold (harga beli)
  grossProfit: number; // Laba kotor = revenue - cogs
  operationalExpenses: number; // Biaya operasional
  netProfit: number; // Laba bersih = grossProfit - operationalExpenses
  transactionCount: number;
  itemsSold: number;
}

interface ProfitSummary {
  totalRevenue: number;
  totalCogs: number;
  totalGrossProfit: number;
  totalOperationalExpenses: number;
  totalNetProfit: number;
  grossProfitMargin: number;
  netProfitMargin: number;
  totalTransactions: number;
  totalItemsSold: number;
}

type ReportPeriod = 'monthly' | 'yearly';

interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export function useProfitReport(period: ReportPeriod = 'monthly', customDateRange?: DateRangeFilter) {
  const [data, setData] = useState<ProfitReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateRange = useMemo(() => {
    // Use custom date range if provided
    if (customDateRange?.from && customDateRange?.to) {
      return {
        start: startOfMonth(customDateRange.from),
        end: endOfMonth(customDateRange.to),
      };
    }
    
    const now = new Date();
    if (period === 'monthly') {
      // Last 6 months
      return {
        start: startOfMonth(subMonths(now, 5)),
        end: endOfMonth(now),
      };
    } else {
      // Current year
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    }
  }, [period, customDateRange]);

  const fetchProfitData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch transactions with items
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          id,
          total,
          created_at,
          transaction_items (
            quantity,
            product_price,
            subtotal,
            product_id
          )
        `)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: true });

      if (txError) throw txError;

      // Fetch products to get cost prices
      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, price, selling_price');

      if (prodError) throw prodError;

      const productPriceMap = new Map(products?.map(p => [p.id, { cost: p.price, selling: p.selling_price }]) ?? []);

      // Fetch operational expenses
      const { data: expenses, error: expError } = await supabase
        .from('operational_expenses')
        .select('amount, expense_date')
        .gte('expense_date', dateRange.start.toISOString().split('T')[0])
        .lte('expense_date', dateRange.end.toISOString().split('T')[0]);

      if (expError) throw expError;

      // Group data by period
      const groupedData = new Map<string, ProfitReportData>();

      // Initialize periods based on date range
      const monthsDiff = differenceInMonths(dateRange.end, dateRange.start) + 1;
      
      for (let i = 0; i < monthsDiff; i++) {
        const monthDate = addMonths(dateRange.start, i);
        const key = format(monthDate, 'yyyy-MM');
        groupedData.set(key, {
          period: format(monthDate, 'MMM yyyy'),
          revenue: 0,
          cogs: 0,
          grossProfit: 0,
          operationalExpenses: 0,
          netProfit: 0,
          transactionCount: 0,
          itemsSold: 0,
        });
      }

      // Process transactions
      for (const tx of transactions ?? []) {
        const txDate = new Date(tx.created_at);
        const key = format(txDate, 'yyyy-MM');
        const periodData = groupedData.get(key);
        
        if (periodData) {
          periodData.transactionCount++;
          periodData.revenue += tx.total;

          for (const item of tx.transaction_items ?? []) {
            periodData.itemsSold += item.quantity;
            
            // Calculate COGS - if we have product cost, use it; otherwise estimate
            const productPrices = item.product_id ? productPriceMap.get(item.product_id) : null;
            if (productPrices) {
              // Use cost price * quantity
              periodData.cogs += productPrices.cost * item.quantity;
            } else {
              // Fallback: estimate cost as 70% of selling price
              periodData.cogs += Math.round(item.product_price * item.quantity * 0.7);
            }
          }
        }
      }

      // Process expenses
      for (const exp of expenses ?? []) {
        const expDate = new Date(exp.expense_date);
        const key = format(expDate, 'yyyy-MM');
        const periodData = groupedData.get(key);
        
        if (periodData) {
          periodData.operationalExpenses += exp.amount;
        }
      }

      // Calculate profits
      for (const periodData of groupedData.values()) {
        periodData.grossProfit = periodData.revenue - periodData.cogs;
        periodData.netProfit = periodData.grossProfit - periodData.operationalExpenses;
      }

      setData(Array.from(groupedData.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profit data');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, period]);

  useEffect(() => {
    fetchProfitData();
  }, [fetchProfitData]);

  const summary: ProfitSummary = useMemo(() => {
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalCogs = data.reduce((sum, d) => sum + d.cogs, 0);
    const totalGrossProfit = data.reduce((sum, d) => sum + d.grossProfit, 0);
    const totalOperationalExpenses = data.reduce((sum, d) => sum + d.operationalExpenses, 0);
    const totalNetProfit = data.reduce((sum, d) => sum + d.netProfit, 0);
    
    return {
      totalRevenue,
      totalCogs,
      totalGrossProfit,
      totalOperationalExpenses,
      totalNetProfit,
      grossProfitMargin: totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0,
      netProfitMargin: totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0,
      totalTransactions: data.reduce((sum, d) => sum + d.transactionCount, 0),
      totalItemsSold: data.reduce((sum, d) => sum + d.itemsSold, 0),
    };
  }, [data]);

  return {
    data,
    summary,
    isLoading,
    error,
    refetch: fetchProfitData,
    dateRange,
  };
}
