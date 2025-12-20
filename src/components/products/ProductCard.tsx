import { Package, Plus, AlertTriangle } from 'lucide-react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  showStock?: boolean;
  delay?: number;
}

export function ProductCard({ product, onAddToCart, showStock = true, delay = 0 }: ProductCardProps) {
  const isLowStock = product.stock > 0 && product.stock < 5;
  const isOutOfStock = product.stock === 0;

  return (
    <div 
      className={cn(
        "glass rounded-xl p-4 animate-scale-in hover:shadow-card transition-all duration-300 group relative",
        isOutOfStock && "opacity-60"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Low stock badge */}
      {isLowStock && (
        <Badge 
          variant="destructive" 
          className="absolute top-2 right-2 z-10 bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0.5"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Stok {product.stock}
        </Badge>
      )}
      
      {/* Out of stock badge */}
      {isOutOfStock && (
        <Badge 
          variant="destructive" 
          className="absolute top-2 right-2 z-10 text-[10px] px-1.5 py-0.5"
        >
          Habis
        </Badge>
      )}

      <div className="aspect-square rounded-lg bg-secondary/50 flex items-center justify-center mb-4 overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
      
      <div className="space-y-2">
        <p className="text-xs text-primary font-medium">{product.category}</p>
        <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <p className="text-lg font-bold text-foreground">
          Rp {product.sellingPrice.toLocaleString('id-ID')}
        </p>
        
        {showStock && !isLowStock && !isOutOfStock && (
          <p className="text-xs text-muted-foreground">
            Stok: {product.stock}
          </p>
        )}
        
        {onAddToCart && (
          <Button
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className="w-full mt-2"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            {isOutOfStock ? 'Stok Habis' : 'Tambah'}
          </Button>
        )}
      </div>
    </div>
  );
}
