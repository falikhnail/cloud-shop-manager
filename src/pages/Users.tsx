import { useState } from 'react';
import { Search, Plus, User as UserIcon, Edit2, Trash2, Shield, ShoppingCart, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';
import { useUsers } from '@/hooks/useUsers';
import { User, UserRole } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Users() {
  const { users, isLoading, addUser, updateUser, deleteUser } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data: { name: string; email: string; role: UserRole; password?: string }) => {
    setIsSubmitting(true);
    
    if (selectedUser) {
      // Update user
      const result = await updateUser(selectedUser.id, data);
      if (result.success) {
        toast({
          title: "User Diperbarui",
          description: `${data.name} berhasil diperbarui`,
        });
        setIsFormOpen(false);
        setSelectedUser(null);
      } else {
        toast({
          title: "Gagal Memperbarui",
          description: result.error,
          variant: "destructive"
        });
      }
    } else {
      // Add new user
      if (!data.password) {
        toast({
          title: "Password Diperlukan",
          description: "Password harus diisi untuk user baru",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      const result = await addUser({ ...data, password: data.password });
      if (result.success) {
        toast({
          title: "User Ditambahkan",
          description: `${data.name} berhasil ditambahkan. Username: ${data.name}`,
        });
        setIsFormOpen(false);
        setSelectedUser(null);
      } else {
        toast({
          title: "Gagal Menambahkan",
          description: result.error,
          variant: "destructive"
        });
      }
    }
    
    setIsSubmitting(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser) {
      setIsSubmitting(true);
      const result = await deleteUser(selectedUser.id);
      
      if (result.success) {
        toast({
          title: "User Dihapus",
          description: `${selectedUser.name} berhasil dihapus`,
        });
      } else {
        toast({
          title: "Gagal Menghapus",
          description: result.error,
          variant: "destructive"
        });
      }
      setIsSubmitting(false);
    }
    setIsDeleteOpen(false);
    setSelectedUser(null);
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const kasirCount = users.filter(u => u.role === 'kasir').length;

  if (isLoading) {
    return (
      <MainLayout requireRole="admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout requireRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manajemen User</h1>
            <p className="text-muted-foreground mt-1">Kelola admin dan kasir</p>
          </div>
          <Button onClick={handleAddUser}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total User</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{adminCount}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kasirCount}</p>
                <p className="text-xs text-muted-foreground">Kasir</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{filteredUsers.length}</p>
                <p className="text-xs text-muted-foreground">Ditampilkan</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'admin', 'kasir'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                    filterRole === role
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {role === 'all' ? 'Semua' : role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="glass rounded-xl p-4 bg-primary/5 border border-primary/20 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Info:</strong> Untuk login, user menggunakan <strong>Nama</strong> sebagai username dan password yang telah ditentukan.
          </p>
        </div>

        {/* Users Table */}
        <div className="glass rounded-xl overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">User (Username)</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Email</th>
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Role</th>
                  <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">Username untuk login</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium capitalize",
                        user.role === 'admin' 
                          ? "bg-warning/10 text-warning" 
                          : "bg-success/10 text-success"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(user)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                          disabled={user.role === 'admin' && adminCount <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Tidak ada user ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <UserFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        title={selectedUser ? 'Edit User' : 'Tambah User Baru'}
        isSubmitting={isSubmitting}
      />

      <DeleteUserDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteConfirm}
        user={selectedUser}
      />
    </MainLayout>
  );
}
