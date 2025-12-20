import { useState, useMemo } from 'react';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Supplier, Product, PaymentStatus } from '@/types';
import { formatNumberInput, parseFormattedNumber, formatCurrency } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PurchaseItem {
  id: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  displayPrice: string;
}

interface PurchaseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    supplierId?: string;
    items: { productId?: string; productName: string; quantity: number; unitPrice: number }[];
    paymentStatus: PaymentStatus;
    notes?: string;
    purchaseDate?: Date;
  }) => Promise<void>;
  suppliers: Supplier[];
  products: Product[];
}

export function PurchaseFormDialog({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
  products,
}: PurchaseFormDialogProps) {
  const [supplierId, setSupplierId] = useState<string>('');
  const [items, setItems] = useState<PurchaseItem[]>([
    { id: '1', productId: '', productName: '', quantity: 1, unitPrice: 0, displayPrice: '' },
  ]);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [items]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setSupplierId('');
    setItems([{ id: '1', productId: '', productName: '', quantity: 1, unitPrice: 0, displayPrice: '' }]);
    setPaymentStatus('pending');
    setNotes('');
  };

  const addItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      productId: '', 
      productName: '', 
      quantity: 1, 
      unitPrice: 0,
      displayPrice: ''
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof PurchaseItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      
      if (field === 'productId') {
        const selectedProduct = products.find(p => p.id === value);
        const price = selectedProduct?.price ?? 0;
        return {
          ...item,
          productId: value as string,
          productName: selectedProduct?.name ?? '',
          unitPrice: price,
          displayPrice: price > 0 ? formatNumberInput(String(price)) : '',
        };
      }
      
      return { ...item, [field]: value };
    }));
  };

  const handlePriceChange = (id: string, rawValue: string) => {
    const formatted = formatNumberInput(rawValue);
    const numericValue = parseFormattedNumber(rawValue);
    
    setItems(items.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        unitPrice: numericValue,
        displayPrice: formatted,
      };
    }));
  };

  const submit = async () => {
    // Validate items
    const validItems = items.filter(item => item.productName && item.quantity > 0 && item.unitPrice >= 0);
    
    if (validItems.length === 0) {
      toast({
        title: 'Data belum valid',
        description: 'Tambahkan minimal 1 item pembelian',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    await onSubmit({
      supplierId: supplierId || undefined,
      items: validItems.map(item => ({
        productId: item.productId || undefined,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      paymentStatus,
      notes: notes || undefined,
      purchaseDate: new Date(),
    });
    setIsSubmitting(false);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pembelian Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Supplier Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Supplier (Opsional)</label>
            <Select value={supplierId || '_none'} onValueChange={(v) => setSupplierId(v === '_none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih supplier..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Tanpa Supplier</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Item Pembelian</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Tambah Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-start p-3 rounded-lg bg-secondary/30">
                  <div className="flex-1 space-y-2">
                    <Select 
                      value={item.productId || '_custom'} 
                      onValueChange={(v) => updateItem(item.id, 'productId', v === '_custom' ? '' : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih produk..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_custom">Produk Custom</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {!item.productId && (
                      <Input
                        value={item.productName}
                        onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                        placeholder="Nama produk custom"
                      />
                    )}
                  </div>
                  
                  <div className="w-20">
                    <Input
                      type="number"
                      value={String(item.quantity)}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      placeholder="Qty"
                      min={1}
                    />
                  </div>
                  
                  <div className="w-32">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">Rp</span>
                      <Input
                        inputMode="numeric"
                        value={item.displayPrice}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        placeholder="0"
                        className="pl-7"
                      />
                    </div>
                  </div>
                  
                  <div className="w-28 text-right pt-2">
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end pt-2 border-t border-border">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status Pembayaran</label>
            <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Belum Bayar</SelectItem>
                <SelectItem value="partial">Sebagian</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Catatan (Opsional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Pembelian'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}