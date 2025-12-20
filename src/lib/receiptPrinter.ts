import jsPDF from 'jspdf';
import { CartItem } from '@/types';
import { StoreSettings } from '@/types/store';

export interface ReceiptData {
  transactionId: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  cashierName: string;
  date: Date;
  customerPaid?: number;
  change?: number;
}

export function generateReceiptPDF(receipt: ReceiptData, settings: StoreSettings): jsPDF {
  const paperWidth = settings.receiptConfig.paperSize === '58mm' ? 58 : 80;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [paperWidth, 200],
  });

  const margin = 3;
  const contentWidth = paperWidth - margin * 2;
  let y = 10;

  doc.setFont('helvetica');

  // Logo
  if (settings.receiptConfig.showLogo && settings.logo) {
    try {
      doc.addImage(settings.logo, 'PNG', paperWidth / 2 - 10, y, 20, 20);
      y += 22;
    } catch {
      // Skip logo if invalid
    }
  }

  // Store name
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.name, paperWidth / 2, y, { align: 'center' });
  y += 5;

  // Address
  if (settings.receiptConfig.showAddress && settings.address) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(settings.address, contentWidth);
    addressLines.forEach((line: string) => {
      doc.text(line, paperWidth / 2, y, { align: 'center' });
      y += 3;
    });
  }

  // Phone
  if (settings.receiptConfig.showPhone && settings.phone) {
    doc.setFontSize(7);
    doc.text(`Tel: ${settings.phone}`, paperWidth / 2, y, { align: 'center' });
    y += 3;
  }

  y += 3;

  // Divider
  doc.setLineWidth(0.1);
  doc.line(margin, y, paperWidth - margin, y);
  y += 4;

  // Transaction info
  doc.setFontSize(7);
  doc.text(`No: ${receipt.transactionId}`, margin, y);
  y += 3;
  doc.text(`Tanggal: ${formatDate(receipt.date)}`, margin, y);
  y += 3;
  doc.text(`Kasir: ${receipt.cashierName}`, margin, y);
  y += 4;

  // Divider
  doc.line(margin, y, paperWidth - margin, y);
  y += 4;

  // Items header
  doc.setFont('helvetica', 'bold');
  doc.text('Item', margin, y);
  doc.text('Total', paperWidth - margin, y, { align: 'right' });
  y += 4;

  // Items
  doc.setFont('helvetica', 'normal');
  receipt.items.forEach((item) => {
    const itemName = item.product.name.length > 20 
      ? item.product.name.substring(0, 20) + '...'
      : item.product.name;
    doc.text(itemName, margin, y);
    y += 3;
    
    const priceText = `${item.quantity} x Rp ${item.product.price.toLocaleString('id-ID')}`;
    const totalText = `Rp ${(item.product.price * item.quantity).toLocaleString('id-ID')}`;
    doc.text(priceText, margin + 2, y);
    doc.text(totalText, paperWidth - margin, y, { align: 'right' });
    y += 4;
  });

  // Divider
  doc.line(margin, y, paperWidth - margin, y);
  y += 4;

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL', margin, y);
  doc.text(`Rp ${receipt.total.toLocaleString('id-ID')}`, paperWidth - margin, y, { align: 'right' });
  y += 5;

  // Payment info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const paymentLabels = { cash: 'Tunai', card: 'Kartu', qris: 'QRIS' };
  doc.text(`Pembayaran: ${paymentLabels[receipt.paymentMethod]}`, margin, y);
  y += 3;

  if (receipt.paymentMethod === 'cash' && receipt.customerPaid !== undefined) {
    doc.text(`Bayar: Rp ${receipt.customerPaid.toLocaleString('id-ID')}`, margin, y);
    y += 3;
    if (receipt.change !== undefined) {
      doc.text(`Kembali: Rp ${receipt.change.toLocaleString('id-ID')}`, margin, y);
      y += 3;
    }
  }

  y += 3;

  // Divider
  doc.line(margin, y, paperWidth - margin, y);
  y += 5;

  // Footer
  if (settings.receiptConfig.footerMessage) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    const footerLines = doc.splitTextToSize(settings.receiptConfig.footerMessage, contentWidth);
    footerLines.forEach((line: string) => {
      doc.text(line, paperWidth / 2, y, { align: 'center' });
      y += 3;
    });
  }

  return doc;
}

export function printReceipt(receipt: ReceiptData, settings: StoreSettings) {
  const doc = generateReceiptPDF(receipt, settings);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}

export function downloadReceiptPDF(receipt: ReceiptData, settings: StoreSettings) {
  const doc = generateReceiptPDF(receipt, settings);
  doc.save(`struk-${receipt.transactionId}.pdf`);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function generateTransactionId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TRX${dateStr}${random}`;
}
