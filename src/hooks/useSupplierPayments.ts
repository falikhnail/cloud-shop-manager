import { supabase } from '@/integrations/supabase/client';
import { SupplierPayment, PaymentMethod } from '@/types';

type PaymentCreate = {
  purchaseId: string;
  amount: number;
  paymentDate?: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
};

export function useSupplierPayments() {
  const createPayment = async (input: PaymentCreate) => {
    // Get current user profile
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

    const { data, error } = await supabase
      .from('supplier_payments')
      .insert({
        purchase_id: input.purchaseId,
        amount: input.amount,
        payment_date: (input.paymentDate ?? new Date()).toISOString(),
        payment_method: input.paymentMethod,
        notes: input.notes ?? null,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) return { success: false as const, error: error.message };

    return { success: true as const, payment: data };
  };

  const deletePayment = async (id: string) => {
    const { error } = await supabase
      .from('supplier_payments')
      .delete()
      .eq('id', id);

    if (error) return { success: false as const, error: error.message };

    return { success: true as const };
  };

  return {
    createPayment,
    deletePayment,
  };
}

export function mapSupplierPayment(row: {
  id: string;
  purchase_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}): SupplierPayment {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    amount: row.amount,
    paymentDate: new Date(row.payment_date),
    paymentMethod: row.payment_method as PaymentMethod,
    notes: row.notes || undefined,
    createdBy: row.created_by || undefined,
    createdAt: new Date(row.created_at),
  };
}
