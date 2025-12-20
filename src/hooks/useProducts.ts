import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';

type ProductUpsert = {
  name: string;
  category: string;
  price: number;
  sellingPrice: number;
  stock: number;
  image?: string | null;
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      setError(error.message);
    } else {
      setProducts(
        (data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          sellingPrice: p.selling_price,
          stock: p.stock,
          category: p.category,
          image: p.image || undefined,
        }))
      );
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (input: ProductUpsert) => {
    const { error } = await supabase.from('products').insert({
      name: input.name,
      category: input.category,
      price: input.price,
      selling_price: input.sellingPrice,
      stock: input.stock,
      image: input.image ?? null,
    });

    if (error) return { success: false as const, error: error.message };

    await fetchProducts();
    return { success: true as const };
  };

  const updateProduct = async (id: string, input: ProductUpsert) => {
    const { error } = await supabase
      .from('products')
      .update({
        name: input.name,
        category: input.category,
        price: input.price,
        selling_price: input.sellingPrice,
        stock: input.stock,
        image: input.image ?? null,
      })
      .eq('id', id);

    if (error) return { success: false as const, error: error.message };

    await fetchProducts();
    return { success: true as const };
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return { success: false as const, error: error.message };

    await fetchProducts();
    return { success: true as const };
  };

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
