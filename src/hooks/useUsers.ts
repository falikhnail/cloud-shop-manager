import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';
import { toast } from '@/hooks/use-toast';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, user_id')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      toast({
        title: 'Error',
        description: 'Gagal memuat data user',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Fetch roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Build role lookup
    const roleMap = new Map<string, UserRole>();
    (roles ?? []).forEach((r) => {
      if (r.user_id) {
        roleMap.set(r.user_id, r.role as UserRole);
      }
    });

    setUsers(
      (profiles ?? []).map((profile) => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: roleMap.get(profile.user_id ?? '') || 'kasir',
      }))
    );
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async (data: { name: string; email: string; role: UserRole; password: string }) => {
    try {
      // Sign up via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: data.name,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      const userId = authData.user?.id;
      if (!userId) {
        return { success: false, error: 'User tidak terbuat' };
      }

      // Wait for trigger to create profile
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // If role is admin, update user_roles
      if (data.role === 'admin') {
        await supabase.from('user_roles').delete().eq('user_id', userId);
        await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
      }

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateUser = async (id: string, data: { name?: string; email?: string; role?: UserRole }) => {
    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        email: data.email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // Update role if provided
    if (data.role) {
      // Get user_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', id)
        .single();

      if (profile?.user_id) {
        // Remove existing roles and insert new
        await supabase.from('user_roles').delete().eq('user_id', profile.user_id);
        await supabase.from('user_roles').insert({ user_id: profile.user_id, role: data.role });
      }
    }

    await fetchUsers();
    return { success: true };
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchUsers();
    return { success: true };
  };

  return {
    users,
    isLoading,
    addUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers,
  };
}
