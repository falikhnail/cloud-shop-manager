import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, CreditCard, Wallet, QrCode, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ReceiptDialog } from './ReceiptDialog';
import { ReceiptData, generateTransactionId } from '@/lib/receiptPrinter';
import { useTransactions } from '@/hooks/useTransactions';
import { useProducts } from '@/hooks/useProducts';

export function CartPanel() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const { user } = useAuth();
  const { refetch: refetchProducts } = useProducts();
  const { saveTransaction } = useTransactions(refetchProducts);
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'card' | 'qris'>('cash');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptData | null>(null);
  const [customerPaid, setCustomerPaid] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (selectedPayment !== 'cash') {
      setCustomerPaid('');
    }
  }, [selectedPayment]);

  const paidAmount = parseInt(customerPaid.replace(/\D/g, '')) || 0;
  const change = paidAmount - total;

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue).toLocaleString('id-ID');
  };

  const handlePaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setCustomerPaid(formatted);
  };

  const handleQuickAmount = (amount: number) => {
    setCustomerPaid(amount.toLocaleString('id-ID'));
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: "Keranjang Kosong",
        description: "Tambahkan produk ke keranjang terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    // Validate stock availability
    const outOfStockItems = items.filter(item => item.quantity > item.product.stock);
    if (outOfStockItems.length > 0) {
      toast({
        title: "Stok Tidak Cukup",
        description: `${outOfStockItems.map(i => `${i.product.name} (tersedia: ${i.product.stock})`).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    if (selectedPayment === 'cash' && paidAmount < total) {
      toast({
        title: "Uang Tidak Cukup",
        description: "Jumlah bayar kurang dari total belanja",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    const transactionId = generateTransactionId();

    try {
      await saveTransaction({
        transactionId,
        cashierName: user?.name || 'Kasir',
        cashierId: user?.id,
        items: [...items],
        total,
        paymentMethod: selectedPayment,
        customerPaid: selectedPayment === 'cash' ? paidAmount : undefined,
        change: selectedPayment === 'cash' ? change : undefined,
      });

      const receipt: ReceiptData = {
        transactionId,
        items: [...items],
        total,
        paymentMethod: selectedPayment,
        cashierName: user?.name || 'Kasir',
        date: new Date(),
        customerPaid: selectedPayment === 'cash' ? paidAmount : undefined,
        change: selectedPayment === 'cash' ? change : undefined,
      };

      setCurrentReceipt(receipt);
      setReceiptOpen(true);
      
      toast({
        title: "Transaksi Berhasil!",
        description: `Total: Rp ${total.toLocaleString('id-ID')} - ${selectedPayment.toUpperCase()}`,
      });
      clearCart();
      setCustomerPaid('');
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat menyimpan transaksi",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Wallet },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'qris', label: 'QRIS', icon: QrCode },
  ] as const;

  return (
    <>
      <div className="glass rounded-xl h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Keranjang</h2>
          <p className="text-sm text-muted-foreground">{items.length} item</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Keranjang kosong</p>
              <p className="text-sm">Pilih produk untuk ditambahkan</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="bg-secondary/50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Rp {item.product.sellingPrice.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-md bg-background flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-md bg-background flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="font-semibold text-sm text-foreground">
                    Rp {(item.product.sellingPrice * item.quantity).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Section */}
        <div className="p-4 border-t border-border space-y-4">
          {/* Payment Methods */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Metode Pembayaran</p>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    selectedPayment === method.id
                      ? 'bg-primary/20 border border-primary text-primary'
                      : 'bg-secondary/50 border border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <method.icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Payment Input */}
          {selectedPayment === 'cash' && items.length > 0 && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Jumlah Bayar</p>
                <Input
                  type="text"
                  value={customerPaid}
                  onChange={handlePaidChange}
                  placeholder="Masukkan jumlah uang"
                  className="text-right font-medium"
                />
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  Math.ceil(total / 10000) * 10000,
                  Math.ceil(total / 50000) * 50000,
                  Math.ceil(total / 100000) * 100000,
                  total
                ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmount(amount)}
                    className="px-2 py-1.5 text-xs bg-secondary/50 hover:bg-secondary rounded-md transition-colors"
                  >
                    {amount >= 1000000 
                      ? `${(amount / 1000000).toFixed(1)}jt` 
                      : amount >= 1000 
                        ? `${(amount / 1000)}rb` 
                        : amount}
                  </button>
                ))}
              </div>

              {/* Change Display */}
              {paidAmount > 0 && (
                <div className={`p-3 rounded-lg ${change >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Kembalian</span>
                    <span className={`font-bold ${change >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                      {change >= 0 ? `Rp ${change.toLocaleString('id-ID')}` : 'Uang kurang!'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Total & Checkout */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-primary">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <Button 
              onClick={handleCheckout} 
              className="w-full" 
              size="lg"
              disabled={isProcessing || (selectedPayment === 'cash' && items.length > 0 && paidAmount < total)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Bayar Sekarang'
              )}
            </Button>
          </div>
        </div>
      </div>

      <ReceiptDialog 
        open={receiptOpen} 
        onOpenChange={setReceiptOpen} 
        receipt={currentReceipt} 
      />
    </>
  );
}
