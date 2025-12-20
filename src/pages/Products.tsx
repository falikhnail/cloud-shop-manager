import { useMemo, useState } from 'react';
import { Search, Plus, Package, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { toast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { products, isLoading, createProduct, updateProduct } = useProducts();

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
    return ['All', ...unique];
  }, [products]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openCreate = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: { name: string; category: string; price: number; sellingPrice: number; stock: number; image?: string | null }) => {
    setIsSubmitting(true);

    const result = selectedProduct
      ? await updateProduct(selectedProduct.id, data)
      : await createProduct(data);

    if (result.success) {
      toast({
        title: 'Berhasil',
        description: selectedProduct ? 'Produk diperbarui' : 'Produk ditambahkan',
      });
      setIsFormOpen(false);
      setSelectedProduct(null);
    } else {
      toast({
        title: 'Gagal menyimpan produk',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  return (
    <MainLayout requireRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produk</h1>
            <p className="text-muted-foreground mt-1">Kelola inventaris produk Anda</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Button>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-border bg-card p-4 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
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

        {/* Products Table */}
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
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Produk</th>
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Kategori</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Harga Beli</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Harga Jual</th>
                    <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Stok</th>
                    <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md bg-secondary text-foreground text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-medium text-muted-foreground">
                          Rp {product.price.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-medium text-foreground">
                          Rp {product.sellingPrice.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={cn(
                            'font-medium',
                            product.stock === 0 && 'text-destructive',
                            product.stock <= 5 && product.stock > 0 && 'text-warning',
                            product.stock > 5 && 'text-foreground'
                          )}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && filteredProducts.length === 0 && (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
            </div>
          )}
        </div>
      </div>

      <ProductFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleSubmit}
        product={selectedProduct}
        title={selectedProduct ? 'Edit Produk' : 'Tambah Produk'}
        isSubmitting={isSubmitting}
      />
    </MainLayout>
  );
}
