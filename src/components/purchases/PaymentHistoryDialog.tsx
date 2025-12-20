import { Wallet, CreditCard, Building2, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SupplierPayment, PaymentMethod, Purchase } from '@/types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';

interface PaymentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
  onDeletePayment: (paymentId: string) => Promise<void>;
}

const methodIcons: Record<PaymentMethod, typeof Wallet> = {
  cash: Wallet,
  transfer: Building2,
  card: CreditCard,
};

const methodLabels: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  transfer: 'Transfer',
  card: 'Kartu',
};

export function PaymentHistoryDialog({
  isOpen,
  onClose,
  purchase,
  onDeletePayment,
}: PaymentHistoryDialogProps) {
  if (!purchase) return null;

  const remaining = purchase.total - purchase.paidAmount;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Riwayat Pembayaran - {purchase.purchaseId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-bold text-foreground">
                {formatCurrency(purchase.total)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <p className="text-xs text-muted-foreground">Terbayar</p>
              <p className="text-sm font-bold text-success">
                {formatCurrency(purchase.paidAmount)}
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg",
              remaining > 0 ? "bg-warning/10" : "bg-success/10"
            )}>
              <p className="text-xs text-muted-foreground">Sisa</p>
              <p className={cn(
                "text-sm font-bold",
                remaining > 0 ? "text-warning" : "text-success"
              )}>
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>

          {/* Payment List */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Daftar Pembayaran</p>
            
            {purchase.payments.length === 0 ? (
              <div className="p-6 text-center bg-secondary/30 rounded-lg">
                <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada pembayaran</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {purchase.payments.map((payment) => {
                  const Icon = methodIcons[payment.paymentMethod];
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {formatCurrency(payment.amount)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(payment.paymentDate, 'dd MMM yyyy', { locale: localeId })}
                            </span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{methodLabels[payment.paymentMethod]}</span>
                          </div>
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {payment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeletePayment(payment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Close Button */}
          <Button variant="outline" onClick={onClose} className="w-full">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
