import { useState } from 'react';
import { Loader2, Wallet, CreditCard, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PaymentMethod } from '@/types';
import { cn } from '@/lib/utils';

interface PaymentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; paymentMethod: PaymentMethod; notes?: string }) => Promise<void>;
  purchaseId: string;
  remainingAmount: number;
}

const paymentMethods = [
  { id: 'cash', label: 'Tunai', icon: Wallet },
  { id: 'transfer', label: 'Transfer', icon: Building2 },
  { id: 'card', label: 'Kartu', icon: CreditCard },
] as const;

export function PaymentFormDialog({
  isOpen,
  onClose,
  onSubmit,
  purchaseId,
  remainingAmount,
}: PaymentFormDialogProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue).toLocaleString('id-ID');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(formatCurrency(e.target.value));
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toLocaleString('id-ID'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseInt(amount.replace(/\D/g, '')) || 0;
    
    if (numericAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        amount: numericAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      // Reset form
      setAmount('');
      setPaymentMethod('cash');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const numericAmount = parseInt(amount.replace(/\D/g, '')) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Pembayaran</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Remaining Amount Info */}
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-sm text-muted-foreground">Sisa Tagihan</p>
            <p className="text-xl font-bold text-warning">
              Rp {remainingAmount.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah Bayar</Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Masukkan jumlah pembayaran"
              className="text-right font-medium"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickAmount(Math.ceil(remainingAmount / 2))}
              className="px-3 py-2 text-xs bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(remainingAmount)}
              className="px-3 py-2 text-xs bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
            >
              Lunas
            </button>
            <button
              type="button"
              onClick={() => handleQuickAmount(Math.ceil(remainingAmount / 4))}
              className="px-3 py-2 text-xs bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
            >
              25%
            </button>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Metode Pembayaran</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all",
                    paymentMethod === method.id
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-secondary/50 border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <method.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan pembayaran..."
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isSubmitting || numericAmount <= 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Pembayaran'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
