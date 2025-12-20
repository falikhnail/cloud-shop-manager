import { useState, useMemo } from 'react';
import { Plus, Search, Wallet, Loader2, Trash2, Pencil } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useExpenses } from '@/hooks/useExpenses';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { OperationalExpense } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const expenseCategories = [
  'All',
  'Gaji',
  'Sewa',
  'Listrik',
  'Air',
  'Internet',
  'Transportasi',
  'Marketing',
  'Lainnya',
];

export default function Expenses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<OperationalExpense | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  
  const { expenses, isLoading, createExpense, updateExpense, deleteExpense } = useExpenses();

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const openCreate = () => {
    setSelectedExpense(null);
    setIsFormOpen(true);
  };

  const openEdit = (expense: OperationalExpense) => {
    setSelectedExpense(expense);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: { description: string; amount: number; expenseDate: Date; category: string }) => {
    const result = selectedExpense
      ? await updateExpense(selectedExpense.id, data)
      : await createExpense(data);

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: selectedExpense ? 'Biaya diperbarui' : 'Biaya ditambahkan',
      });
      setIsFormOpen(false);
      setSelectedExpense(null);
    } else {
      toast({
        title: 'Gagal',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteExpenseId) return;
    
    const result = await deleteExpense(deleteExpenseId);
    if (result.success) {
      toast({ title: 'Berhasil', description: 'Biaya dihapus' });
    } else {
      toast({ title: 'Gagal', description: result.error, variant: 'destructive' });
    }
    setDeleteExpenseId(null);
  };

  return (
    <MainLayout requireRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Biaya Operasional</h1>
            <p className="text-muted-foreground mt-1">Kelola biaya operasional untuk laporan laba bersih</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Biaya
          </Button>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-border bg-card p-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Biaya (Filter Aktif)</p>
              <p className="text-2xl font-bold text-foreground">
                Rp {totalExpenses.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-border bg-card p-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Cari biaya..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {expenseCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-foreground" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Deskripsi</th>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Kategori</th>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Tanggal</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Jumlah</th>
                    <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <p className="font-medium text-foreground">{expense.description}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md bg-secondary text-foreground text-xs font-medium">
                          {expense.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-muted-foreground">
                          {format(expense.expenseDate, 'dd MMM yyyy', { locale: localeId })}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-medium text-destructive">
                          - Rp {expense.amount.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(expense)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteExpenseId(expense.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && filteredExpenses.length === 0 && (
            <div className="p-8 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada biaya ditemukan</p>
            </div>
          )}
        </div>
      </div>

      <ExpenseFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedExpense(null);
        }}
        onSubmit={handleSubmit}
        expense={selectedExpense}
      />

      <AlertDialog open={!!deleteExpenseId} onOpenChange={() => setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Biaya?</AlertDialogTitle>
            <AlertDialogDescription>
              Biaya ini akan dihapus secara permanen dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
