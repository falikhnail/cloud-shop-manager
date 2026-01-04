import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface TransactionItem {
  id: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

interface TransactionData {
  id: string;
  transactionId: string;
  cashierName: string;
  paymentMethod: string;
  total: number;
  customerPaid?: number | null;
  change?: number | null;
  createdAt: Date;
  items: TransactionItem[];
}

interface TransactionExportData {
  storeName: string;
  period: string;
  dateRange: { start?: Date; end?: Date };
  summary: {
    totalSales: number;
    totalTransactions: number;
    avgTransaction: number;
    totalItems: number;
    paymentBreakdown: {
      cash: number;
      card: number;
      qris: number;
    };
  };
  transactions: TransactionData[];
}

const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
const formatDate = (date: Date) => format(date, 'dd MMM yyyy', { locale: localeId });

export const exportTransactionsToPDF = (data: TransactionExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.storeName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Transaksi', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Periode: ${data.period}`, pageWidth / 2, yPos, { align: 'center' });

  // Summary Box
  yPos += 15;
  doc.setDrawColor(200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, yPos, pageWidth - 28, 45, 3, 3, 'F');

  yPos += 10;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan', 20, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  const summaryCol1X = 20;
  const summaryCol2X = pageWidth / 2 + 10;

  doc.text(`Total Penjualan: ${formatCurrency(data.summary.totalSales)}`, summaryCol1X, yPos);
  doc.text(`Total Transaksi: ${data.summary.totalTransactions}`, summaryCol2X, yPos);

  yPos += 6;
  doc.text(`Rata-rata Transaksi: ${formatCurrency(data.summary.avgTransaction)}`, summaryCol1X, yPos);
  doc.text(`Total Item Terjual: ${data.summary.totalItems}`, summaryCol2X, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Metode Pembayaran:', summaryCol1X, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 6;
  doc.text(`Cash: ${formatCurrency(data.summary.paymentBreakdown.cash)}`, summaryCol1X, yPos);
  doc.text(`Card: ${formatCurrency(data.summary.paymentBreakdown.card)}`, summaryCol1X + 50, yPos);
  doc.text(`QRIS: ${formatCurrency(data.summary.paymentBreakdown.qris)}`, summaryCol2X, yPos);

  // Transactions Table
  yPos += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detail Transaksi', 14, yPos);

  yPos += 5;
  autoTable(doc, {
    startY: yPos,
    head: [['No. Transaksi', 'Tanggal', 'Kasir', 'Items', 'Metode', 'Total']],
    body: data.transactions.map(t => [
      t.transactionId,
      format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm'),
      t.cashierName,
      t.items.map(i => `${i.productName} (${i.quantity})`).join(', '),
      t.paymentMethod.toUpperCase(),
      formatCurrency(t.total)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [0, 150, 136] },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 28 },
      2: { cellWidth: 25 },
      3: { cellWidth: 55 },
      4: { cellWidth: 18 },
      5: { cellWidth: 25 },
    },
    styles: { fontSize: 8 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Dicetak: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: localeId })} | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const fileName = `Laporan_Transaksi_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

export const exportTransactionsToExcel = (data: TransactionExportData) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['LAPORAN TRANSAKSI'],
    [data.storeName],
    [''],
    ['Periode:', data.period],
    [''],
    ['RINGKASAN'],
    ['Total Penjualan', data.summary.totalSales],
    ['Total Transaksi', data.summary.totalTransactions],
    ['Rata-rata Transaksi', data.summary.avgTransaction],
    ['Total Item Terjual', data.summary.totalItems],
    [''],
    ['METODE PEMBAYARAN'],
    ['Cash', data.summary.paymentBreakdown.cash],
    ['Card', data.summary.paymentBreakdown.card],
    ['QRIS', data.summary.paymentBreakdown.qris],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

  // Transactions Detail Sheet
  const transHeader = ['No. Transaksi', 'Tanggal', 'Kasir', 'Item', 'Qty', 'Harga', 'Subtotal', 'Metode', 'Total', 'Bayar', 'Kembali'];
  const transData: any[][] = [];
  
  data.transactions.forEach(t => {
    t.items.forEach((item, idx) => {
      transData.push([
        idx === 0 ? t.transactionId : '',
        idx === 0 ? format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm') : '',
        idx === 0 ? t.cashierName : '',
        item.productName,
        item.quantity,
        item.productPrice,
        item.subtotal,
        idx === 0 ? t.paymentMethod.toUpperCase() : '',
        idx === 0 ? t.total : '',
        idx === 0 ? (t.customerPaid || '') : '',
        idx === 0 ? (t.change || '') : '',
      ]);
    });
  });

  const transSheet = XLSX.utils.aoa_to_sheet([transHeader, ...transData]);
  transSheet['!cols'] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 25 },
    { wch: 6 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, transSheet, 'Detail Transaksi');

  // Summary per Transaction
  const summaryHeader = ['No. Transaksi', 'Tanggal', 'Kasir', 'Jumlah Item', 'Metode', 'Total'];
  const summaryTrans = data.transactions.map(t => [
    t.transactionId,
    format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm'),
    t.cashierName,
    t.items.reduce((sum, i) => sum + i.quantity, 0),
    t.paymentMethod.toUpperCase(),
    t.total
  ]);
  const transSummarySheet = XLSX.utils.aoa_to_sheet([summaryHeader, ...summaryTrans]);
  transSummarySheet['!cols'] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, transSummarySheet, 'Ringkasan Transaksi');

  const fileName = `Laporan_Transaksi_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  
  return fileName;
};
