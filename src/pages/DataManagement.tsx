import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/context/StoreContext';
import {
  Database,
  Download,
  Upload,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Wallet,
  Truck,
  FileJson,
  Clock,
  HardDrive,
  History,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface DataSummary {
  products: number;
  transactions: number;
  transactionItems: number;
  purchases: number;
  purchaseItems: number;
  supplierPayments: number;
  suppliers: number;
  expenses: number;
  profiles: number;
}

interface BackupData {
  version: string;
  exportedAt: string;
  storeName: string;
  summary: DataSummary;
  data: {
    products: any[];
    transactions: any[];
    transaction_items: any[];
    purchases: any[];
    purchase_items: any[];
    supplier_payments: any[];
    suppliers: any[];
    operational_expenses: any[];
    profiles: any[];
  };
}

interface SyncStatus {
  lastSync: Date | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
}

interface BackupHistoryItem {
  id: string;
  file_name: string;
  file_size: number;
  backup_type: string;
  total_records: number;
  summary: any;
  created_at: string;
}

export default function DataManagement() {
  const { settings } = useStore();
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<BackupData | null>(null);
  const [backupHistory, setBackupHistory] = useState<BackupHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    status: 'idle'
  });

  // Fetch data summary
  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const [
        productsRes,
        transactionsRes,
        transactionItemsRes,
        purchasesRes,
        purchaseItemsRes,
        supplierPaymentsRes,
        suppliersRes,
        expensesRes,
        profilesRes
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('id', { count: 'exact', head: true }),
        supabase.from('transaction_items').select('id', { count: 'exact', head: true }),
        supabase.from('purchases').select('id', { count: 'exact', head: true }),
        supabase.from('purchase_items').select('id', { count: 'exact', head: true }),
        supabase.from('supplier_payments').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('operational_expenses').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      setSummary({
        products: productsRes.count || 0,
        transactions: transactionsRes.count || 0,
        transactionItems: transactionItemsRes.count || 0,
        purchases: purchasesRes.count || 0,
        purchaseItems: purchaseItemsRes.count || 0,
        supplierPayments: supplierPaymentsRes.count || 0,
        suppliers: suppliersRes.count || 0,
        expenses: expensesRes.count || 0,
        profiles: profilesRes.count || 0,
      });

      // Update sync status
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        status: 'success'
      }));
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast({ title: 'Gagal', description: 'Gagal mengambil ringkasan data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch backup history
  const fetchBackupHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('backup_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBackupHistory(data || []);
    } catch (error) {
      console.error('Error fetching backup history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchBackupHistory();
  }, []);

  // Export all data to JSON
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const [
        productsRes,
        transactionsRes,
        transactionItemsRes,
        purchasesRes,
        purchaseItemsRes,
        supplierPaymentsRes,
        suppliersRes,
        expensesRes,
        profilesRes
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('transaction_items').select('*'),
        supabase.from('purchases').select('*'),
        supabase.from('purchase_items').select('*'),
        supabase.from('supplier_payments').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('operational_expenses').select('*'),
        supabase.from('profiles').select('*'),
      ]);

      const backupData: BackupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        storeName: settings.name,
        summary: {
          products: productsRes.data?.length || 0,
          transactions: transactionsRes.data?.length || 0,
          transactionItems: transactionItemsRes.data?.length || 0,
          purchases: purchasesRes.data?.length || 0,
          purchaseItems: purchaseItemsRes.data?.length || 0,
          supplierPayments: supplierPaymentsRes.data?.length || 0,
          suppliers: suppliersRes.data?.length || 0,
          expenses: expensesRes.data?.length || 0,
          profiles: profilesRes.data?.length || 0,
        },
        data: {
          products: productsRes.data || [],
          transactions: transactionsRes.data || [],
          transaction_items: transactionItemsRes.data || [],
          purchases: purchasesRes.data || [],
          purchase_items: purchaseItemsRes.data || [],
          supplier_payments: supplierPaymentsRes.data || [],
          suppliers: suppliersRes.data || [],
          operational_expenses: expensesRes.data || [],
          profiles: profilesRes.data || [],
        }
      };

      // Create and download file
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const fileName = `backup_${settings.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Get current user profile for created_by
      const { data: { user } } = await supabase.auth.getUser();
      let createdBy: string | null = null;
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) createdBy = profile.id;
      }

      // Save backup history to database
      const totalRecords = Object.values(backupData.summary).reduce((a, b) => a + b, 0);
      await supabase.from('backup_history').insert([{
        file_name: fileName,
        file_size: blob.size,
        backup_type: 'manual',
        total_records: totalRecords,
        summary: backupData.summary as any,
        created_by: createdBy,
      }]);

      // Refresh history
      fetchBackupHistory();

      toast({ 
        title: 'Backup Berhasil', 
        description: `Data berhasil di-export (${totalRecords} records)` 
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Gagal', description: 'Gagal mengekspor data', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file selection for import
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({ title: 'Format Salah', description: 'File harus berformat JSON', variant: 'destructive' });
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;

      // Validate backup structure
      if (!data.version || !data.data || !data.summary) {
        toast({ title: 'Format Salah', description: 'File bukan backup yang valid', variant: 'destructive' });
        return;
      }

      setImportFile(file);
      setImportPreview(data);
      setShowImportDialog(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal membaca file backup', variant: 'destructive' });
    }

    // Reset input
    e.target.value = '';
  };

  // Import data from backup
  const handleImportBackup = async () => {
    if (!importPreview) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const totalSteps = 9;
      let currentStep = 0;

      const updateProgress = () => {
        currentStep++;
        setImportProgress(Math.round((currentStep / totalSteps) * 100));
      };

      // Import suppliers first (foreign key dependency)
      if (importPreview.data.suppliers?.length > 0) {
        const { error } = await supabase
          .from('suppliers')
          .upsert(importPreview.data.suppliers, { onConflict: 'id' });
        if (error) throw new Error(`Suppliers: ${error.message}`);
      }
      updateProgress();

      // Import profiles
      if (importPreview.data.profiles?.length > 0) {
        const { error } = await supabase
          .from('profiles')
          .upsert(importPreview.data.profiles, { onConflict: 'id' });
        if (error) throw new Error(`Profiles: ${error.message}`);
      }
      updateProgress();

      // Import products
      if (importPreview.data.products?.length > 0) {
        const { error } = await supabase
          .from('products')
          .upsert(importPreview.data.products, { onConflict: 'id' });
        if (error) throw new Error(`Products: ${error.message}`);
      }
      updateProgress();

      // Import transactions
      if (importPreview.data.transactions?.length > 0) {
        const { error } = await supabase
          .from('transactions')
          .upsert(importPreview.data.transactions, { onConflict: 'id' });
        if (error) throw new Error(`Transactions: ${error.message}`);
      }
      updateProgress();

      // Import transaction items
      if (importPreview.data.transaction_items?.length > 0) {
        const { error } = await supabase
          .from('transaction_items')
          .upsert(importPreview.data.transaction_items, { onConflict: 'id' });
        if (error) throw new Error(`Transaction Items: ${error.message}`);
      }
      updateProgress();

      // Import purchases
      if (importPreview.data.purchases?.length > 0) {
        const { error } = await supabase
          .from('purchases')
          .upsert(importPreview.data.purchases, { onConflict: 'id' });
        if (error) throw new Error(`Purchases: ${error.message}`);
      }
      updateProgress();

      // Import purchase items
      if (importPreview.data.purchase_items?.length > 0) {
        const { error } = await supabase
          .from('purchase_items')
          .upsert(importPreview.data.purchase_items, { onConflict: 'id' });
        if (error) throw new Error(`Purchase Items: ${error.message}`);
      }
      updateProgress();

      // Import supplier payments
      if (importPreview.data.supplier_payments?.length > 0) {
        const { error } = await supabase
          .from('supplier_payments')
          .upsert(importPreview.data.supplier_payments, { onConflict: 'id' });
        if (error) throw new Error(`Supplier Payments: ${error.message}`);
      }
      updateProgress();

      // Import expenses
      if (importPreview.data.operational_expenses?.length > 0) {
        const { error } = await supabase
          .from('operational_expenses')
          .upsert(importPreview.data.operational_expenses, { onConflict: 'id' });
        if (error) throw new Error(`Expenses: ${error.message}`);
      }
      updateProgress();

      toast({ 
        title: 'Import Berhasil', 
        description: `${Object.values(importPreview.summary).reduce((a, b) => a + b, 0)} records berhasil diimport` 
      });

      setShowImportDialog(false);
      setImportFile(null);
      setImportPreview(null);
      
      // Refresh summary
      fetchSummary();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({ title: 'Import Gagal', description: error.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Push data to cloud (refresh/sync current data)
  const handlePushToCloud = async () => {
    setIsPushing(true);
    setSyncStatus({ lastSync: null, status: 'syncing', message: 'Mengirim data ke cloud...' });

    try {
      // Since we're using Supabase, data is already in cloud
      // This action essentially verifies connectivity and refreshes the summary
      await fetchSummary();

      setSyncStatus({
        lastSync: new Date(),
        status: 'success',
        message: 'Data berhasil disinkronkan'
      });

      toast({ 
        title: 'Sinkronisasi Berhasil', 
        description: 'Semua data sudah tersimpan di cloud' 
      });
    } catch (error) {
      setSyncStatus({
        lastSync: null,
        status: 'error',
        message: 'Gagal menyinkronkan data'
      });
      toast({ title: 'Gagal', description: 'Gagal menyinkronkan ke cloud', variant: 'destructive' });
    } finally {
      setIsPushing(false);
    }
  };

  // Pull data from cloud (refresh local view)
  const handlePullFromCloud = async () => {
    setIsPulling(true);
    setSyncStatus({ lastSync: null, status: 'syncing', message: 'Mengambil data dari cloud...' });

    try {
      await fetchSummary();

      setSyncStatus({
        lastSync: new Date(),
        status: 'success',
        message: 'Data berhasil diperbarui dari cloud'
      });

      toast({ 
        title: 'Data Diperbarui', 
        description: 'Data terbaru berhasil diambil dari cloud' 
      });
    } catch (error) {
      setSyncStatus({
        lastSync: null,
        status: 'error',
        message: 'Gagal mengambil data'
      });
      toast({ title: 'Gagal', description: 'Gagal mengambil data dari cloud', variant: 'destructive' });
    } finally {
      setIsPulling(false);
    }
  };

  const totalRecords = summary 
    ? Object.values(summary).reduce((a, b) => a + b, 0) 
    : 0;

  const summaryCards = summary ? [
    { label: 'Produk', value: summary.products, icon: Package, color: 'text-primary' },
    { label: 'Transaksi', value: summary.transactions, icon: ShoppingCart, color: 'text-success' },
    { label: 'Item Transaksi', value: summary.transactionItems, icon: Receipt, color: 'text-muted-foreground' },
    { label: 'Pembelian', value: summary.purchases, icon: Truck, color: 'text-warning' },
    { label: 'Item Pembelian', value: summary.purchaseItems, icon: Package, color: 'text-muted-foreground' },
    { label: 'Pembayaran Supplier', value: summary.supplierPayments, icon: Wallet, color: 'text-primary' },
    { label: 'Supplier', value: summary.suppliers, icon: Truck, color: 'text-success' },
    { label: 'Biaya Operasional', value: summary.expenses, icon: Wallet, color: 'text-destructive' },
    { label: 'Pengguna', value: summary.profiles, icon: Users, color: 'text-primary' },
  ] : [];

  return (
    <MainLayout requireRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manajemen Data</h1>
            <p className="text-muted-foreground mt-1">Backup, import, dan sinkronisasi data sistem</p>
          </div>
          <Button variant="outline" onClick={fetchSummary} disabled={isLoading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Sync Status Card */}
        <div className="rounded-lg border border-border bg-card p-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                syncStatus.status === 'success' && "bg-success/10",
                syncStatus.status === 'error' && "bg-destructive/10",
                syncStatus.status === 'syncing' && "bg-primary/10",
                syncStatus.status === 'idle' && "bg-secondary"
              )}>
                {syncStatus.status === 'syncing' ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : syncStatus.status === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-success" />
                ) : syncStatus.status === 'error' ? (
                  <AlertCircle className="w-6 h-6 text-destructive" />
                ) : (
                  <Cloud className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Status Cloud</h3>
                <p className="text-sm text-muted-foreground">
                  {syncStatus.message || (syncStatus.lastSync 
                    ? `Terakhir sinkronisasi: ${format(syncStatus.lastSync, 'dd MMM yyyy HH:mm', { locale: localeId })}`
                    : 'Belum ada sinkronisasi'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HardDrive className="w-4 h-4" />
              <span>{totalRecords.toLocaleString('id-ID')} total records</span>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {/* Backup/Export */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Backup Data</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Export semua data ke file JSON
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={handleExportBackup} 
                disabled={isExporting || isLoading}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileJson className="w-4 h-4 mr-2" />
                )}
                Export Backup
              </Button>
            </div>
          </div>

          {/* Import */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center">
                <Upload className="w-7 h-7 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Import Data</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Restore data dari file backup
                </p>
              </div>
              <label className="w-full">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isImporting}
                />
                <Button 
                  variant="outline" 
                  className="w-full cursor-pointer" 
                  asChild
                  disabled={isImporting}
                >
                  <span>
                    <FileJson className="w-4 h-4 mr-2" />
                    Pilih File
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Push to Cloud */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-warning/10 flex items-center justify-center">
                <CloudUpload className="w-7 h-7 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Kirim ke Cloud</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Sinkronisasi data ke server
                </p>
              </div>
              <Button 
                variant="outline"
                className="w-full" 
                onClick={handlePushToCloud} 
                disabled={isPushing}
              >
                {isPushing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CloudUpload className="w-4 h-4 mr-2" />
                )}
                Kirim Data
              </Button>
            </div>
          </div>

          {/* Pull from Cloud */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                <CloudDownload className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Tarik dari Cloud</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ambil data terbaru dari server
                </p>
              </div>
              <Button 
                variant="outline"
                className="w-full" 
                onClick={handlePullFromCloud} 
                disabled={isPulling}
              >
                {isPulling ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CloudDownload className="w-4 h-4 mr-2" />
                )}
                Tarik Data
              </Button>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="rounded-lg border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Ringkasan Data</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-lg bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <card.icon className={cn("w-4 h-4", card.color)} />
                    <span className="text-sm text-muted-foreground">{card.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {card.value.toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Backup History */}
        <div className="rounded-lg border border-border bg-card p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Riwayat Backup</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchBackupHistory} disabled={isLoadingHistory}>
              <RefreshCw className={cn("w-4 h-4", isLoadingHistory && "animate-spin")} />
            </Button>
          </div>

          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-foreground" />
            </div>
          ) : backupHistory.length === 0 ? (
            <div className="text-center py-8">
              <FileJson className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Belum ada riwayat backup</p>
              <p className="text-sm text-muted-foreground mt-1">Klik "Export Backup" untuk membuat backup pertama</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Nama File</th>
                    <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Tanggal</th>
                    <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Ukuran</th>
                    <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Records</th>
                    <th className="text-center p-3 text-sm font-semibold text-muted-foreground">Tipe</th>
                  </tr>
                </thead>
                <tbody>
                  {backupHistory.map((backup) => (
                    <tr key={backup.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-foreground text-sm font-medium truncate max-w-[200px]">
                            {backup.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-foreground text-sm">
                          {format(new Date(backup.created_at), 'dd MMM yyyy', { locale: localeId })}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {format(new Date(backup.created_at), 'HH:mm')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-muted-foreground text-sm">
                          {(backup.file_size / 1024).toFixed(1)} KB
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-medium text-foreground text-sm">
                          {backup.total_records.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          backup.backup_type === 'manual' 
                            ? "bg-primary/10 text-primary"
                            : "bg-success/10 text-success"
                        )}>
                          {backup.backup_type === 'manual' ? 'Manual' : 'Otomatis'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Tentang Sinkronisasi Cloud</h3>
              <p className="text-sm text-muted-foreground">
                Data Anda sudah tersimpan secara otomatis di cloud. Fitur "Kirim ke Cloud" dan "Tarik dari Cloud" 
                digunakan untuk memverifikasi koneksi dan memperbarui tampilan data terbaru. 
                Gunakan fitur Backup untuk menyimpan salinan data ke komputer Anda.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Preview Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Import Data</DialogTitle>
            <DialogDescription>
              Data dari backup akan ditambahkan ke database. Data yang sudah ada akan diperbarui.
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileJson className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{importFile?.name}</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Toko: {importPreview.storeName}</p>
                  <p>Dibuat: {format(new Date(importPreview.exportedAt), 'dd MMM yyyy HH:mm', { locale: localeId })}</p>
                  <p>Versi: {importPreview.version}</p>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium text-foreground mb-3">Data yang akan diimport:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produk:</span>
                    <span className="font-medium">{importPreview.summary.products}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaksi:</span>
                    <span className="font-medium">{importPreview.summary.transactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pembelian:</span>
                    <span className="font-medium">{importPreview.summary.purchases}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier:</span>
                    <span className="font-medium">{importPreview.summary.suppliers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Biaya:</span>
                    <span className="font-medium">{importPreview.summary.expenses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pengguna:</span>
                    <span className="font-medium">{importPreview.summary.profiles}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between font-medium">
                  <span>Total Records:</span>
                  <span>{Object.values(importPreview.summary).reduce((a, b) => a + b, 0)}</span>
                </div>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Mengimport data... {importProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowImportDialog(false)}
              disabled={isImporting}
            >
              Batal
            </Button>
            <Button 
              onClick={handleImportBackup} 
              disabled={isImporting}
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Import Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
