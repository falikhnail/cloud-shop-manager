import { Printer, Download, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore } from '@/context/StoreContext';
import { ReceiptData, printReceipt, downloadReceiptPDF } from '@/lib/receiptPrinter';
import { formatCurrency } from '@/lib/utils';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptData | null;
}

export function ReceiptDialog({ open, onOpenChange, receipt }: ReceiptDialogProps) {
  const { settings } = useStore();

  if (!receipt) return null;

  const handlePrint = () => {
    printReceipt(receipt, settings);
  };

  const handleDownload = () => {
    downloadReceiptPDF(receipt, settings);
  };

  const paymentLabels = { cash: 'Tunai', card: 'Kartu', qris: 'QRIS' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Transaksi Berhasil!</DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="bg-white text-black rounded-lg p-4 text-sm font-mono">
          {/* Header */}
          <div className="text-center mb-3">
            {settings.receiptConfig.showLogo && settings.logo && (
              <img src={settings.logo} alt="Logo" className="w-12 h-12 mx-auto mb-2 object-contain" />
            )}
            <p className="font-bold text-base">{settings.name}</p>
            {settings.receiptConfig.showAddress && (
              <p className="text-xs text-gray-600">{settings.address}</p>
            )}
            {settings.receiptConfig.showPhone && (
              <p className="text-xs text-gray-600">Tel: {settings.phone}</p>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Transaction Info */}
          <div className="text-xs mb-2">
            <p>No: {receipt.transactionId}</p>
            <p>Tanggal: {formatDate(receipt.date)}</p>
            <p>Kasir: {receipt.cashierName}</p>
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Items */}
          <div className="space-y-1">
            {receipt.items.map((item, idx) => (
              <div key={idx}>
                <p className="truncate">{item.product.name}</p>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{item.quantity} x {formatCurrency(item.product.price)}</span>
                  <span>{formatCurrency(item.product.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Total */}
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>

          {/* Payment Info */}
          <div className="text-xs mt-2">
            <p>Pembayaran: {paymentLabels[receipt.paymentMethod]}</p>
            {receipt.paymentMethod === 'cash' && receipt.customerPaid !== undefined && (
              <>
                <p>Bayar: {formatCurrency(receipt.customerPaid)}</p>
                {receipt.change !== undefined && (
                  <p>Kembali: {formatCurrency(receipt.change)}</p>
                )}
              </>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300 my-2" />

          {/* Footer */}
          {settings.receiptConfig.footerMessage && (
            <p className="text-xs text-center text-gray-600 italic">
              {settings.receiptConfig.footerMessage}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          <Button onClick={handlePrint} className="flex-1" variant="default">
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
          <Button onClick={handleDownload} className="flex-1" variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>

        <Button onClick={() => onOpenChange(false)} variant="ghost" className="w-full">
          <X className="w-4 h-4 mr-2" />
          Tutup
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
