import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OperationalExpense } from '@/types';

type ExpenseUpsert = {
  description: string;
  amount: number;
  expenseDate: Date;
  category: string;
};

export function useExpenses() {
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('operational_expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setExpenses(
        (data ?? []).map((e) => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          expenseDate: new Date(e.expense_date),
          category: e.category,
          createdBy: e.created_by || undefined,
          createdAt: new Date(e.created_at),
          updatedAt: new Date(e.updated_at),
        }))
      );
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const createExpense = async (input: ExpenseUpsert) => {
    const { data: { user } } = await supabase.auth.getUser();
    let createdBy: string | null = null;
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profile) createdBy = profile.id;
    }

    const { error } = await supabase.from('operational_expenses').insert({
      description: input.description,
      amount: input.amount,
      expense_date: input.expenseDate.toISOString().split('T')[0],
      category: input.category,
      created_by: createdBy,
    });

    if (error) return { success: false as const, error: error.message };

    await fetchExpenses();
    return { success: true as const };
  };

  const updateExpense = async (id: string, input: ExpenseUpsert) => {
    const { error } = await supabase
      .from('operational_expenses')
      .update({
        description: input.description,
        amount: input.amount,
        expense_date: input.expenseDate.toISOString().split('T')[0],
        category: input.category,
      })
      .eq('id', id);

    if (error) return { success: false as const, error: error.message };

    await fetchExpenses();
    return { success: true as const };
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('operational_expenses').delete().eq('id', id);
    if (error) return { success: false as const, error: error.message };

    await fetchExpenses();
    return { success: true as const };
  };

  return {
    expenses,
    isLoading,
    error,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
