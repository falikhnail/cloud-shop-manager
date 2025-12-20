import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/types';

interface SaveTransactionParams {
  transactionId: string;
  cashierName: string;
  cashierId?: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  customerPaid?: number;
  change?: number;
}

export function useTransactions(onSuccess?: () => void) {
  const saveTransaction = async (params: SaveTransactionParams) => {
    // Insert transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        transaction_id: params.transactionId,
        cashier_id: params.cashierId,
        cashier_name: params.cashierName,
        total: params.total,
        payment_method: params.paymentMethod,
        customer_paid: params.customerPaid,
        change_amount: params.change,
      })
      .select()
      .single();

    if (txError) {
      console.error('Error saving transaction:', txError);
      throw txError;
    }

    // Insert transaction items
    const items = params.items.map(item => ({
      transaction_id: transaction.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_price: item.product.sellingPrice, // Harga jual, bukan harga beli
      quantity: item.quantity,
      subtotal: item.product.sellingPrice * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(items);

    if (itemsError) {
      console.error('Error saving transaction items:', itemsError);
      throw itemsError;
    }

    // Update product stock using security definer function
    for (const item of params.items) {
      const { error: stockError } = await supabase
        .rpc('decrement_product_stock', {
          product_id: item.product.id,
          qty: item.quantity
        });

      if (stockError) {
        console.error('Error updating stock:', stockError);
        throw stockError;
      }
    }

    // Call onSuccess callback to refresh product list
    if (onSuccess) {
      onSuccess();
    }

    return transaction;
  };

  return { saveTransaction };
}
