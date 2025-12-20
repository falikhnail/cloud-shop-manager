import { useState, useMemo } from 'react';
import { Plus, Search, ShoppingBag, Loader2, Truck, CheckCircle, Clock, Wallet, History } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePurchases } from '@/hooks/usePurchases';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { useSupplierPayments } from '@/hooks/useSupplierPayments';
import { PurchaseFormDialog } from '@/components/purchases/PurchaseFormDialog';
import { SupplierFormDialog } from '@/components/purchases/SupplierFormDialog';
import { PaymentFormDialog } from '@/components/purchases/PaymentFormDialog';
import { PaymentHistoryDialog } from '@/components/purchases/PaymentHistoryDialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { PaymentStatus, Purchase, PaymentMethod } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusConfig: Record<PaymentStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Belum Bayar', color: 'text-warning bg-warning/10', icon: Clock },
  partial: { label: 'Sebagian', color: 'text-primary bg-primary/10', icon: Wallet },
  paid: { label: 'Lunas', color: 'text-success bg-success/10', icon: CheckCircle },
};

export default function Purchases() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  
  const { purchases, isLoading, createPurchase, updatePaymentStatus, refetch } = usePurchases();
  const { suppliers, createSupplier } = useSuppliers();
  const { products } = useProducts();
  const { createPayment, deletePayment } = useSupplierPayments();

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const matchesSearch = 
        purchase.purchaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (purchase.supplier?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || purchase.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchases, searchQuery, statusFilter]);

  const handleCreatePurchase = async (data: {
    supplierId?: string;
    items: { productId?: string; productName: string; quantity: number; unitPrice: number }[];
    paymentStatus: PaymentStatus;
    notes?: string;
    purchaseDate?: Date;
  }) => {
    const result = await createPurchase(data);
    if (result.success) {
      toast({ title: 'Berhasil', description: `Pembelian ${result.purchaseId} berhasil dibuat` });
      setIsPurchaseFormOpen(false);
    } else {
      toast({ title: 'Gagal', description: result.error, variant: 'destructive' });
    }
  };

  const handleCreateSupplier = async (data: { name: string; phone?: string; address?: string }) => {
    const result = await createSupplier(data);
    if (result.success) {
      toast({ title: 'Berhasil', description: 'Supplier berhasil ditambahkan' });
      setIsSupplierFormOpen(false);
    } else {
      toast({ title: 'Gagal', description: result.error, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (purchaseId: string, status: PaymentStatus) => {
    const result = await updatePaymentStatus(purchaseId, status);
    if (result.success) {
      toast({ title: 'Berhasil', description: 'Status pembayaran diperbarui' });
    } else {
      toast({ title: 'Gagal', description: result.error, variant: 'destructive' });
    }
  };

  const handleOpenPaymentForm = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsPaymentFormOpen(true);
  };

  const handleOpenHistory = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsHistoryOpen(true);
  };

  const handleCreatePayment = async (data: { amount: number; paymentMethod: PaymentMethod; notes?: string }) => {
    if (!selectedPurchase) return;
    
    const result = await createPayment({
      purchaseId: selectedPurchase.id,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    });

    if (result.success) {
      toast({ title: 'Berhasil', description: 'Pembayaran berhasil dicatat' });
      setIsPaymentFormOpen(false);
      refetch();
    } else {
      toast({ title: 'Gagal', description: result.error, variant: 'destructive' });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    const result = await deletePayment(paymentId);
    if (result.success) {
      toast({ title: 'Berhasil', description: 'Pembayaran berhasil dihapus' });
      refetch();
    } else {
      toast({ title: 'Gagal', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <MainLayout requireRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pembelian</h1>
            <p className="text-muted-foreground mt-1">Kelola pembelian dan stok masuk</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSupplierFormOpen(true)}>
              <Truck className="w-4 h-4 mr-2" />
              Tambah Supplier
            </Button>
            <Button onClick={() => setIsPurchaseFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Pembelian Baru
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-border bg-card p-4 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Cari no. pembelian atau supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PaymentStatus | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Belum Bayar</SelectItem>
                <SelectItem value="partial">Sebagian</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-foreground" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">No. Pembelian</th>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Supplier</th>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Tanggal</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Total</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Terbayar</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Sisa</th>
                    <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => {
                    const status = statusConfig[purchase.paymentStatus];
                    const StatusIcon = status.icon;
                    const remaining = purchase.total - purchase.paidAmount;
                    
                    return (
                      <tr
                        key={purchase.id}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{purchase.purchaseId}</p>
                              <p className="text-xs text-muted-foreground">{purchase.items.length} item</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-foreground">
                            {purchase.supplier?.name || '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-muted-foreground">
                            {format(purchase.purchaseDate, 'dd MMM yyyy', { locale: localeId })}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-medium text-foreground">
                            Rp {purchase.total.toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-medium text-success">
                            Rp {purchase.paidAmount.toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={cn(
                            "font-medium",
                            remaining > 0 ? "text-warning" : "text-success"
                          )}>
                            Rp {remaining.toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', status.color)}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-1">
                            {remaining > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => handleOpenPaymentForm(purchase)}
                              >
                                <Wallet className="w-3 h-3 mr-1" />
                                Bayar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleOpenHistory(purchase)}
                            >
                              <History className="w-3 h-3 mr-1" />
                              Riwayat
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && filteredPurchases.length === 0 && (
            <div className="p-8 text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada pembelian ditemukan</p>
            </div>
          )}
        </div>
      </div>

      <PurchaseFormDialog
        isOpen={isPurchaseFormOpen}
        onClose={() => setIsPurchaseFormOpen(false)}
        onSubmit={handleCreatePurchase}
        suppliers={suppliers}
        products={products}
      />

      <SupplierFormDialog
        isOpen={isSupplierFormOpen}
        onClose={() => setIsSupplierFormOpen(false)}
        onSubmit={handleCreateSupplier}
      />

      <PaymentFormDialog
        isOpen={isPaymentFormOpen}
        onClose={() => {
          setIsPaymentFormOpen(false);
          setSelectedPurchase(null);
        }}
        onSubmit={handleCreatePayment}
        purchaseId={selectedPurchase?.purchaseId || ''}
        remainingAmount={selectedPurchase ? selectedPurchase.total - selectedPurchase.paidAmount : 0}
      />

      <PaymentHistoryDialog
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedPurchase(null);
        }}
        purchase={selectedPurchase}
        onDeletePayment={handleDeletePayment}
      />
    </MainLayout>
  );
}
