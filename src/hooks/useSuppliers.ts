import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Supplier } from '@/types';

type SupplierUpsert = {
  name: string;
  phone?: string;
  address?: string;
};

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) {
      setError(error.message);
    } else {
      setSuppliers(
        (data ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          phone: s.phone || undefined,
          address: s.address || undefined,
          createdAt: new Date(s.created_at),
          updatedAt: new Date(s.updated_at),
        }))
      );
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const createSupplier = async (input: SupplierUpsert) => {
    const { data, error } = await supabase.from('suppliers').insert({
      name: input.name,
      phone: input.phone ?? null,
      address: input.address ?? null,
    }).select().single();

    if (error) return { success: false as const, error: error.message };

    await fetchSuppliers();
    return { success: true as const, data };
  };

  const updateSupplier = async (id: string, input: SupplierUpsert) => {
    const { error } = await supabase
      .from('suppliers')
      .update({
        name: input.name,
        phone: input.phone ?? null,
        address: input.address ?? null,
      })
      .eq('id', id);

    if (error) return { success: false as const, error: error.message };

    await fetchSuppliers();
    return { success: true as const };
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) return { success: false as const, error: error.message };

    await fetchSuppliers();
    return { success: true as const };
  };

  return {
    suppliers,
    isLoading,
    error,
    refetch: fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
