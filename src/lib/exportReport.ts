import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ReportData {
  storeName: string;
  period: string;
  dateRange: { start: Date; end: Date };
  summary: {
    totalSales: number;
    totalTransactions: number;
    avgTransaction: number;
    salesGrowth: number;
  };
  chartData: { label: string; sales: number; transactions: number }[];
  paymentStats: { name: string; value: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  cashierPerformance: { name: string; transactions: number; revenue: number }[];
  transactions: Transaction[];
}

const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
const formatDate = (date: Date) => format(date, 'dd MMM yyyy', { locale: id });

export const exportToPDF = (data: ReportData) => {
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
  doc.text('Laporan Penjualan', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Periode: ${data.period}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(
    `${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  // Summary Box
  yPos += 15;
  doc.setDrawColor(200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, yPos, pageWidth - 28, 35, 3, 3, 'F');

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
  doc.text(`Pertumbuhan: ${data.summary.salesGrowth >= 0 ? '+' : ''}${data.summary.salesGrowth.toFixed(1)}%`, summaryCol2X, yPos);

  // Sales by Period Table
  yPos += 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Penjualan per Periode', 14, yPos);

  yPos += 5;
  autoTable(doc, {
    startY: yPos,
    head: [['Periode', 'Penjualan', 'Transaksi']],
    body: data.chartData.map(item => [
      item.label,
      formatCurrency(item.sales),
      item.transactions.toString()
    ]),
    theme: 'striped',
    headStyles: { fillColor: [0, 150, 136] },
    margin: { left: 14, right: 14 },
  });

  // Payment Methods Table
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Metode Pembayaran', 14, yPos);

  yPos += 5;
  autoTable(doc, {
    startY: yPos,
    head: [['Metode', 'Total', 'Jumlah Transaksi']],
    body: data.paymentStats.map(item => [
      item.name,
      formatCurrency(item.value),
      item.count.toString()
    ]),
    theme: 'striped',
    headStyles: { fillColor: [0, 150, 136] },
    margin: { left: 14, right: 14 },
  });

  // Top Products Table
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (yPos > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Produk Terlaris', 14, yPos);

  yPos += 5;
  autoTable(doc, {
    startY: yPos,
    head: [['Produk', 'Qty Terjual', 'Pendapatan']],
    body: data.topProducts.map(item => [
      item.name,
      item.quantity.toString(),
      formatCurrency(item.revenue)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [0, 150, 136] },
    margin: { left: 14, right: 14 },
  });

  // Cashier Performance Table
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  if (yPos > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Performa Kasir', 14, yPos);

  yPos += 5;
  autoTable(doc, {
    startY: yPos,
    head: [['Kasir', 'Transaksi', 'Pendapatan']],
    body: data.cashierPerformance.map(item => [
      item.name,
      item.transactions.toString(),
      formatCurrency(item.revenue)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [0, 150, 136] },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Dicetak: ${format(new Date(), 'dd MMM yyyy HH:mm', { locale: id })} | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `Laporan_Penjualan_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

export const exportToExcel = (data: ReportData) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['LAPORAN PENJUALAN'],
    [data.storeName],
    [''],
    ['Periode:', data.period],
    ['Tanggal:', `${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}`],
    [''],
    ['RINGKASAN'],
    ['Total Penjualan', data.summary.totalSales],
    ['Total Transaksi', data.summary.totalTransactions],
    ['Rata-rata Transaksi', data.summary.avgTransaction],
    ['Pertumbuhan (%)', data.summary.salesGrowth],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

  // Sales by Period Sheet
  const salesHeader = ['Periode', 'Penjualan', 'Transaksi'];
  const salesData = data.chartData.map(item => [item.label, item.sales, item.transactions]);
  const salesSheet = XLSX.utils.aoa_to_sheet([salesHeader, ...salesData]);
  salesSheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, salesSheet, 'Penjualan');

  // Payment Methods Sheet
  const paymentHeader = ['Metode', 'Total', 'Jumlah Transaksi'];
  const paymentData = data.paymentStats.map(item => [item.name, item.value, item.count]);
  const paymentSheet = XLSX.utils.aoa_to_sheet([paymentHeader, ...paymentData]);
  paymentSheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Metode Pembayaran');

  // Top Products Sheet
  const productsHeader = ['Produk', 'Qty Terjual', 'Pendapatan'];
  const productsData = data.topProducts.map(item => [item.name, item.quantity, item.revenue]);
  const productsSheet = XLSX.utils.aoa_to_sheet([productsHeader, ...productsData]);
  productsSheet['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Produk Terlaris');

  // Cashier Performance Sheet
  const cashierHeader = ['Kasir', 'Transaksi', 'Pendapatan'];
  const cashierData = data.cashierPerformance.map(item => [item.name, item.transactions, item.revenue]);
  const cashierSheet = XLSX.utils.aoa_to_sheet([cashierHeader, ...cashierData]);
  cashierSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, cashierSheet, 'Performa Kasir');

  // Transactions Detail Sheet
  const transHeader = ['ID', 'Tanggal', 'Kasir', 'Items', 'Metode', 'Total'];
  const transData = data.transactions.map(t => [
    t.id,
    format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm'),
    t.cashierName,
    t.items.map(i => `${i.product.name} (${i.quantity})`).join(', '),
    t.paymentMethod.toUpperCase(),
    t.total
  ]);
  const transSheet = XLSX.utils.aoa_to_sheet([transHeader, ...transData]);
  transSheet['!cols'] = [
    { wch: 12 },
    { wch: 18 },
    { wch: 15 },
    { wch: 40 },
    { wch: 10 },
    { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(workbook, transSheet, 'Detail Transaksi');

  // Save the Excel file
  const fileName = `Laporan_Penjualan_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  
  return fileName;
};
