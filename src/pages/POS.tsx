import { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductCard } from '@/components/products/ProductCard';
import { CartPanel } from '@/components/pos/CartPanel';
import { Input } from '@/components/ui/input';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

export default function POS() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const { addItem } = useCart();
  const { products, isLoading } = useProducts();

  // Get unique categories from actual products
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return ['Semua', ...uniqueCategories.sort()];
  }, [products]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <MainLayout requireRole="kasir">
      <div className="h-[calc(100vh-4rem)] flex gap-6">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header & Search */}
          <div className="mb-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground mb-4">Kasir</h1>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-slide-up">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addItem}
                    showStock={true}
                    delay={index * 50}
                  />
                ))}
              </div>
            )}
            
            {!isLoading && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Tidak ada produk ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Panel */}
        <div className="w-80 flex-shrink-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CartPanel />
        </div>
      </div>
    </MainLayout>
  );
}
