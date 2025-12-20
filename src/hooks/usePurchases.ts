import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Purchase, PurchaseItem, PaymentStatus, SupplierPayment, PaymentMethod } from '@/types';

type PurchaseItemInput = {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
};

type PurchaseCreate = {
  supplierId?: string;
  items: PurchaseItemInput[];
  paymentStatus: PaymentStatus;
  notes?: string;
  purchaseDate?: Date;
};

function generatePurchaseId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PO-${dateStr}-${random}`;
}

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data: purchasesData, error: purchasesError } = await supabase
      .from('purchases')
      .select(`
        *,
        suppliers (id, name, phone, address)
      `)
      .order('purchase_date', { ascending: false });

    if (purchasesError) {
      setError(purchasesError.message);
      setIsLoading(false);
      return;
    }

    // Fetch items for all purchases
    const purchaseIds = (purchasesData ?? []).map(p => p.id);
    
    const [itemsResult, paymentsResult] = await Promise.all([
      supabase
        .from('purchase_items')
        .select('*')
        .in('purchase_id', purchaseIds),
      supabase
        .from('supplier_payments')
        .select('*')
        .in('purchase_id', purchaseIds)
        .order('payment_date', { ascending: false })
    ]);

    if (itemsResult.error) {
      setError(itemsResult.error.message);
      setIsLoading(false);
      return;
    }

    const itemsByPurchase = (itemsResult.data ?? []).reduce((acc, item) => {
      if (!acc[item.purchase_id]) acc[item.purchase_id] = [];
      acc[item.purchase_id].push({
        id: item.id,
        purchaseId: item.purchase_id,
        productId: item.product_id || undefined,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
      });
      return acc;
    }, {} as Record<string, PurchaseItem[]>);

    const paymentsByPurchase = (paymentsResult.data ?? []).reduce((acc, payment) => {
      if (!acc[payment.purchase_id]) acc[payment.purchase_id] = [];
      acc[payment.purchase_id].push({
        id: payment.id,
        purchaseId: payment.purchase_id,
        amount: payment.amount,
        paymentDate: new Date(payment.payment_date),
        paymentMethod: payment.payment_method as PaymentMethod,
        notes: payment.notes || undefined,
        createdBy: payment.created_by || undefined,
        createdAt: new Date(payment.created_at),
      } as SupplierPayment);
      return acc;
    }, {} as Record<string, SupplierPayment[]>);

    setPurchases(
      (purchasesData ?? []).map((p) => ({
        id: p.id,
        purchaseId: p.purchase_id,
        supplierId: p.supplier_id || undefined,
        supplier: p.suppliers ? {
          id: p.suppliers.id,
          name: p.suppliers.name,
          phone: p.suppliers.phone || undefined,
          address: p.suppliers.address || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        } : undefined,
        total: p.total,
        paidAmount: p.paid_amount,
        paymentStatus: p.payment_status as PaymentStatus,
        notes: p.notes || undefined,
        purchaseDate: new Date(p.purchase_date),
        createdBy: p.created_by || undefined,
        items: itemsByPurchase[p.id] || [],
        payments: paymentsByPurchase[p.id] || [],
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      }))
    );
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const createPurchase = async (input: PurchaseCreate) => {
    const total = input.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const purchaseId = generatePurchaseId();

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

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        purchase_id: purchaseId,
        supplier_id: input.supplierId ?? null,
        total,
        payment_status: input.paymentStatus,
        notes: input.notes ?? null,
        purchase_date: (input.purchaseDate ?? new Date()).toISOString(),
        created_by: createdBy,
      })
      .select()
      .single();

    if (purchaseError) return { success: false as const, error: purchaseError.message };

    // Insert items
    const itemsToInsert = input.items.map(item => ({
      purchase_id: purchase.id,
      product_id: item.productId ?? null,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
    }));

    const { error: itemsError } = await supabase
      .from('purchase_items')
      .insert(itemsToInsert);

    if (itemsError) return { success: false as const, error: itemsError.message };

    // Update product stock
    for (const item of input.items) {
      if (item.productId) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.productId)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock + item.quantity })
            .eq('id', item.productId);
        }
      }
    }

    await fetchPurchases();
    return { success: true as const, purchaseId };
  };

  const updatePaymentStatus = async (id: string, status: PaymentStatus) => {
    const { error } = await supabase
      .from('purchases')
      .update({ payment_status: status })
      .eq('id', id);

    if (error) return { success: false as const, error: error.message };

    await fetchPurchases();
    return { success: true as const };
  };

  return {
    purchases,
    isLoading,
    error,
    refetch: fetchPurchases,
    createPurchase,
    updatePaymentStatus,
  };
}
