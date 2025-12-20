import { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Supplier } from '@/types';

const supplierSchema = z.object({
  name: z.string().trim().min(1, 'Nama supplier wajib diisi').max(100, 'Nama terlalu panjang'),
  phone: z.string().trim().max(20, 'No. telepon terlalu panjang').optional(),
  address: z.string().trim().max(255, 'Alamat terlalu panjang').optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone?: string; address?: string }) => Promise<void>;
  supplier?: Supplier | null;
}

export function SupplierFormDialog({
  isOpen,
  onClose,
  onSubmit,
  supplier,
}: SupplierFormDialogProps) {
  const [values, setValues] = useState<SupplierFormValues>({
    name: supplier?.name ?? '',
    phone: supplier?.phone ?? '',
    address: supplier?.address ?? '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setValues({ name: '', phone: '', address: '' });
    }
  };

  const submit = async () => {
    const parsed = supplierSchema.safeParse(values);
    if (!parsed.success) {
      toast({
        title: 'Data belum valid',
        description: parsed.error.issues[0]?.message ?? 'Periksa kembali input',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    await onSubmit({
      name: parsed.data.name,
      phone: parsed.data.phone || undefined,
      address: parsed.data.address || undefined,
    });
    setIsSubmitting(false);
    setValues({ name: '', phone: '', address: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Edit Supplier' : 'Tambah Supplier'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nama Supplier</label>
            <Input
              value={values.name}
              onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
              placeholder="Contoh: PT Vape Indonesia"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">No. Telepon</label>
            <Input
              value={values.phone ?? ''}
              onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))}
              placeholder="08123456789"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Alamat</label>
            <Textarea
              value={values.address ?? ''}
              onChange={(e) => setValues((p) => ({ ...p, address: e.target.value }))}
              placeholder="Alamat lengkap supplier"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
