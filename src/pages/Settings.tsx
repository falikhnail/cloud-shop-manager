import { useState, useRef } from 'react';
import { 
  Store, 
  Upload, 
  Save, 
  Receipt, 
  Image as ImageIcon, 
  MapPin, 
  Phone,
  FileText,
  Printer,
  RotateCcw,
  X
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/context/StoreContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { settings, updateSettings, updateReceiptConfig } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: settings.name,
    address: settings.address,
    phone: settings.phone,
  });
  
  const [receiptForm, setReceiptForm] = useState({
    showLogo: settings.receiptConfig.showLogo,
    showAddress: settings.receiptConfig.showAddress,
    showPhone: settings.receiptConfig.showPhone,
    footerMessage: settings.receiptConfig.footerMessage,
    paperSize: settings.receiptConfig.paperSize,
  });

  const [previewLogo, setPreviewLogo] = useState<string | null>(settings.logo);
  const [hasChanges, setHasChanges] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File Terlalu Besar",
          description: "Ukuran logo maksimal 2MB",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setPreviewLogo(null);
    setHasChanges(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleReceiptChange = (field: string, value: boolean | string) => {
    setReceiptForm(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveStore = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Nama toko tidak boleh kosong",
        variant: "destructive"
      });
      return;
    }
    
    updateSettings({
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      logo: previewLogo,
    });
    
    toast({
      title: "Berhasil",
      description: "Pengaturan toko berhasil disimpan",
    });
    setHasChanges(false);
  };

  const handleSaveReceipt = () => {
    updateReceiptConfig(receiptForm);
    
    toast({
      title: "Berhasil",
      description: "Konfigurasi struk berhasil disimpan",
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData({
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
    });
    setReceiptForm({
      showLogo: settings.receiptConfig.showLogo,
      showAddress: settings.receiptConfig.showAddress,
      showPhone: settings.receiptConfig.showPhone,
      footerMessage: settings.receiptConfig.footerMessage,
      paperSize: settings.receiptConfig.paperSize,
    });
    setPreviewLogo(settings.logo);
    setHasChanges(false);
  };

  return (
    <MainLayout requireRole="admin">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pengaturan</h1>
            <p className="text-muted-foreground mt-1">Kelola pengaturan toko dan struk</p>
          </div>
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {/* Store Settings */}
        <div className="glass rounded-xl p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Informasi Toko</h2>
              <p className="text-sm text-muted-foreground">Pengaturan dasar toko</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Logo Toko</label>
              <div className="flex items-start gap-4">
                <div className="relative w-24 h-24 rounded-xl bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center overflow-hidden group">
                  {previewLogo ? (
                    <>
                      <img src={previewLogo} alt="Logo" className="w-full h-full object-contain" />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Format: JPG, PNG. Maks: 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Store Name */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Nama Toko</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Masukkan nama toko"
                  className="pl-10 bg-secondary/50 border-border"
                  maxLength={50}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Alamat</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Masukkan alamat toko"
                  className="pl-10 bg-secondary/50 border-border"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Telepon</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Masukkan nomor telepon"
                  className="pl-10 bg-secondary/50 border-border"
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Button onClick={handleSaveStore}>
              <Save className="w-4 h-4 mr-2" />
              Simpan Informasi Toko
            </Button>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Konfigurasi Struk</h2>
              <p className="text-sm text-muted-foreground">Atur tampilan struk pembayaran</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Toggle Options */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">Tampilkan pada Struk</p>
              
              {[
                { key: 'showLogo', label: 'Logo Toko', icon: ImageIcon },
                { key: 'showAddress', label: 'Alamat', icon: MapPin },
                { key: 'showPhone', label: 'Telepon', icon: Phone },
              ].map((item) => (
                <div 
                  key={item.key} 
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <Switch
                    checked={receiptForm[item.key as keyof typeof receiptForm] as boolean}
                    onCheckedChange={(checked) => handleReceiptChange(item.key, checked)}
                  />
                </div>
              ))}
            </div>

            {/* Paper Size */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">Ukuran Kertas</p>
              <div className="grid grid-cols-2 gap-3">
                {(['58mm', '80mm'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleReceiptChange('paperSize', size)}
                    className={cn(
                      "flex items-center justify-center gap-2 p-4 rounded-lg transition-all",
                      receiptForm.paperSize === size
                        ? "bg-primary/20 border border-primary text-primary"
                        : "bg-secondary/50 border border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Printer className="w-4 h-4" />
                    <span className="font-medium">{size}</span>
                  </button>
                ))}
              </div>

              {/* Footer Message */}
              <div className="space-y-3 pt-4">
                <label className="text-sm font-medium text-foreground">Pesan Footer</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <textarea
                    value={receiptForm.footerMessage}
                    onChange={(e) => handleReceiptChange('footerMessage', e.target.value)}
                    placeholder="Pesan di bagian bawah struk"
                    className="w-full pl-10 pr-4 py-3 bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none h-24"
                    maxLength={100}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {receiptForm.footerMessage.length}/100
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Button onClick={handleSaveReceipt}>
              <Save className="w-4 h-4 mr-2" />
              Simpan Konfigurasi Struk
            </Button>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Preview Struk</h2>
              <p className="text-sm text-muted-foreground">Tampilan struk pembayaran</p>
            </div>
          </div>

          <div className="flex justify-center">
            <div 
              className={cn(
                "bg-foreground text-background p-4 rounded-lg font-mono text-xs",
                receiptForm.paperSize === '58mm' ? "w-48" : "w-64"
              )}
            >
              {/* Header */}
              <div className="text-center border-b border-dashed border-background/30 pb-3 mb-3">
                {receiptForm.showLogo && previewLogo && (
                  <img src={previewLogo} alt="Logo" className="w-12 h-12 mx-auto mb-2 object-contain" />
                )}
                <p className="font-bold text-sm">{formData.name || 'Nama Toko'}</p>
                {receiptForm.showAddress && formData.address && (
                  <p className="text-[10px] opacity-80 mt-1">{formData.address}</p>
                )}
                {receiptForm.showPhone && formData.phone && (
                  <p className="text-[10px] opacity-80">Tel: {formData.phone}</p>
                )}
              </div>

              {/* Items */}
              <div className="border-b border-dashed border-background/30 pb-3 mb-3 space-y-1">
                <div className="flex justify-between">
                  <span>Caliburn G2</span>
                  <span>350.000</span>
                </div>
                <div className="flex justify-between">
                  <span>Saltnic 30ml x2</span>
                  <span>170.000</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-b border-dashed border-background/30 pb-3 mb-3">
                <div className="flex justify-between font-bold">
                  <span>TOTAL</span>
                  <span>520.000</span>
                </div>
                <div className="flex justify-between text-[10px] opacity-80 mt-1">
                  <span>Tunai</span>
                  <span>550.000</span>
                </div>
                <div className="flex justify-between text-[10px] opacity-80">
                  <span>Kembalian</span>
                  <span>30.000</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center">
                <p className="text-[10px] opacity-80">
                  {new Date().toLocaleString('id-ID')}
                </p>
                {receiptForm.footerMessage && (
                  <p className="text-[10px] opacity-80 mt-2">{receiptForm.footerMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
