import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';
import type { Product } from '@/types';

const productSchema = z.object({
  name: z.string().trim().min(1, 'Nama produk wajib diisi').max(80, 'Nama terlalu panjang'),
  category: z.string().trim().min(1, 'Kategori wajib diisi').max(50, 'Kategori terlalu panjang'),
  price: z.coerce.number().min(0, 'Harga beli tidak boleh minus'),
  sellingPrice: z.coerce.number().min(0, 'Harga jual tidak boleh minus'),
  stock: z.coerce.number().int('Stok harus angka bulat').min(0, 'Stok tidak boleh minus'),
  image: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\//.test(v), 'URL gambar harus diawali http/https'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; category: string; price: number; sellingPrice: number; stock: number; image?: string | null }) => Promise<void>;
  product?: Product | null;
  title: string;
  isSubmitting?: boolean;
}

export function ProductFormDialog({
  isOpen,
  onClose,
  onSubmit,
  product,
  title,
  isSubmitting,
}: ProductFormDialogProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: '',
    category: '',
    price: 0,
    sellingPrice: 0,
    stock: 0,
    image: '',
  });

  // Display values for formatted inputs
  const [displayPrice, setDisplayPrice] = useState('');
  const [displaySellingPrice, setDisplaySellingPrice] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const newValues = {
      name: product?.name ?? '',
      category: product?.category ?? '',
      price: product?.price ?? 0,
      sellingPrice: product?.sellingPrice ?? 0,
      stock: product?.stock ?? 0,
      image: product?.image ?? '',
    };
    
    setValues(newValues);
    setDisplayPrice(newValues.price > 0 ? formatNumberInput(String(newValues.price)) : '');
    setDisplaySellingPrice(newValues.sellingPrice > 0 ? formatNumberInput(String(newValues.sellingPrice)) : '');
  }, [isOpen, product]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberInput(e.target.value);
    setDisplayPrice(formatted);
    setValues((p) => ({ ...p, price: parseFormattedNumber(e.target.value) }));
  };

  const handleSellingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberInput(e.target.value);
    setDisplaySellingPrice(formatted);
    setValues((p) => ({ ...p, sellingPrice: parseFormattedNumber(e.target.value) }));
  };

  const submit = async () => {
    const parsed = productSchema.safeParse(values);
    if (!parsed.success) {
      toast({
        title: 'Data belum valid',
        description: parsed.error.issues[0]?.message ?? 'Periksa kembali input',
        variant: 'destructive',
      });
      return;
    }

    await onSubmit({
      name: parsed.data.name,
      category: parsed.data.category,
      price: parsed.data.price,
      sellingPrice: parsed.data.sellingPrice,
      stock: parsed.data.stock,
      image: parsed.data.image ? parsed.data.image : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nama Produk</label>
            <Input
              value={values.name}
              onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
              placeholder="Contoh: Caliburn G2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Kategori</label>
            <Input
              value={values.category}
              onChange={(e) => setValues((p) => ({ ...p, category: e.target.value }))}
              placeholder="Contoh: Pod System"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Harga Beli</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                <Input
                  inputMode="numeric"
                  value={displayPrice}
                  onChange={handlePriceChange}
                  placeholder="0"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Harga Jual</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                <Input
                  inputMode="numeric"
                  value={displaySellingPrice}
                  onChange={handleSellingPriceChange}
                  placeholder="0"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Stok</label>
            <Input
              type="number"
              inputMode="numeric"
              value={String(values.stock)}
              onChange={(e) => setValues((p) => ({ ...p, stock: Number(e.target.value) }))}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Gambar (opsional)</label>
            <Input
              value={values.image ?? ''}
              onChange={(e) => setValues((p) => ({ ...p, image: e.target.value }))}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">Masukkan URL gambar (http/https).</p>
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