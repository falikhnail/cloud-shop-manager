import { useState, useEffect } from 'react';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { OperationalExpense } from '@/types';
import { cn, formatNumberInput, parseFormattedNumber } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const expenseSchema = z.object({
  description: z.string().trim().min(1, 'Deskripsi wajib diisi').max(200, 'Deskripsi terlalu panjang'),
  amount: z.coerce.number().min(1, 'Jumlah harus lebih dari 0'),
  expenseDate: z.date(),
  category: z.string().min(1, 'Kategori wajib dipilih'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const categories = [
  'Gaji',
  'Sewa',
  'Listrik',
  'Air',
  'Internet',
  'Transportasi',
  'Marketing',
  'Lainnya',
];

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; amount: number; expenseDate: Date; category: string }) => Promise<void>;
  expense?: OperationalExpense | null;
}

export function ExpenseFormDialog({
  isOpen,
  onClose,
  onSubmit,
  expense,
}: ExpenseFormDialogProps) {
  const [values, setValues] = useState<ExpenseFormValues>({
    description: '',
    amount: 0,
    expenseDate: new Date(),
    category: 'Lainnya',
  });
  const [displayAmount, setDisplayAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const newValues = {
      description: expense?.description ?? '',
      amount: expense?.amount ?? 0,
      expenseDate: expense?.expenseDate ?? new Date(),
      category: expense?.category ?? 'Lainnya',
    };
    
    setValues(newValues);
    setDisplayAmount(newValues.amount > 0 ? formatNumberInput(String(newValues.amount)) : '');
  }, [isOpen, expense]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberInput(e.target.value);
    setDisplayAmount(formatted);
    setValues((p) => ({ ...p, amount: parseFormattedNumber(e.target.value) }));
  };

  const submit = async () => {
    const parsed = expenseSchema.safeParse(values);
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
      description: parsed.data.description,
      amount: parsed.data.amount,
      expenseDate: parsed.data.expenseDate,
      category: parsed.data.category,
    });
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Biaya' : 'Tambah Biaya'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Deskripsi</label>
            <Input
              value={values.description}
              onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
              placeholder="Contoh: Gaji karyawan bulan Desember"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Jumlah</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                <Input
                  inputMode="numeric"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Kategori</label>
              <Select value={values.category} onValueChange={(v) => setValues((p) => ({ ...p, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tanggal</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !values.expenseDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {values.expenseDate ? format(values.expenseDate, 'PPP', { locale: localeId }) : <span>Pilih tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={values.expenseDate}
                  onSelect={(date) => date && setValues((p) => ({ ...p, expenseDate: date }))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
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