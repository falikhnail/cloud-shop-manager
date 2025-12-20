export interface StoreSettings {
  name: string;
  logo: string | null;
  address: string;
  phone: string;
  receiptConfig: {
    showLogo: boolean;
    showAddress: boolean;
    showPhone: boolean;
    footerMessage: string;
    paperSize: '58mm' | '80mm';
  };
}

export const defaultStoreSettings: StoreSettings = {
  name: 'VapeStore',
  logo: null,
  address: 'Jl. Vape Raya No. 123, Jakarta',
  phone: '021-12345678',
  receiptConfig: {
    showLogo: true,
    showAddress: true,
    showPhone: true,
    footerMessage: 'Terima kasih atas kunjungan Anda!',
    paperSize: '58mm',
  },
};
