import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface ProfitReportData {
  period: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operationalExpenses: number;
  netProfit: number;
  transactionCount: number;
  itemsSold: number;
}

interface ProfitSummary {
  totalRevenue: number;
  totalCogs: number;
  totalGrossProfit: number;
  totalOperationalExpenses: number;
  totalNetProfit: number;
  totalTransactions: number;
  totalItemsSold: number;
  grossProfitMargin: number;
  netProfitMargin: number;
}

interface ProfitExportData {
  storeName: string;
  periodType: string;
  dateRange: { start: Date; end: Date };
  data: ProfitReportData[];
  summary: ProfitSummary;
}

const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
const formatDate = (date: Date) => format(date, 'dd MMM yyyy', { locale: localeId });

export const exportProfitReportToPDF = (data: ProfitExportData) => {
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
  doc.text('Laporan Laba Rugi', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Periode: ${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  // Summary Box
  yPos += 15;
  doc.setDrawColor(200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, yPos, pageWidth - 28, 55, 3, 3, 'F');

  yPos += 10;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Laba Rugi', 20, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  const col1X = 20;
  const col2X = pageWidth / 2 + 10;

  doc.text(`Total Pendapatan: ${formatCurrency(data.summary.totalRevenue)}`, col1X, yPos);
  doc.text(`Total Transaksi: ${data.summary.totalTransactions}`, col2X, yPos);

  yPos += 6;
  doc.text(`Harga Pokok (HPP): ${formatCurrency(data.summary.totalCogs)}`, col1X, yPos);
  doc.text(`Item Terjual: ${data.summary.totalItemsSold}`, col2X, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 128, 0);
  doc.text(`Laba Kotor: ${formatCurrency(data.summary.totalGrossProfit)} (${data.summary.grossProfitMargin.toFixed(1)}%)`, col1X, yPos);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');

  yPos += 6;
  doc.text(`Biaya Operasional: ${formatCurrency(data.summary.totalOperationalExpenses)}`, col1X, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'bold');
  if (data.summary.totalNetProfit >= 0) {
    doc.setTextColor(0, 128, 0);
  } else {
    doc.setTextColor(200, 0, 0);
  }
  doc.text(`Laba Bersih: ${formatCurrency(data.summary.totalNetProfit)} (${data.summary.netProfitMargin.toFixed(1)}%)`, col1X, yPos);
  doc.setTextColor(0);

  // Profit Breakdown Table
  yPos += 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Rincian Laba Rugi', 14, yPos);

  yPos += 5;
  autoTable(doc, {
    startY: yPos,
    head: [['Keterangan', 'Nilai']],
    body: [
      ['Total Pendapatan (Penjualan)', formatCurrency(data.summary.totalRevenue)],
      ['Harga Pokok Penjualan (HPP)', `- ${formatCurrency(data.summary.totalCogs)}`],
      ['Laba Kotor', formatCurrency(data.summary.totalGrossProfit)],
      ['Biaya Operasional', `- ${formatCurrency(data.summary.totalOperationalExpenses)}`],
      ['Laba Bersih', formatCurrency(data.summary.totalNetProfit)],
    ],
    theme: 'plain',
    headStyles: { fillColor: [0, 150, 136], textColor: 255 },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 60, halign: 'right' },
    },
    bodyStyles: { fontSize: 10 },
    didParseCell: (data) => {
      if (data.row.index === 2 || data.row.index === 4) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Period Detail Table
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  if (yPos > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Detail Per ${data.periodType === 'monthly' ? 'Bulan' : 'Tahun'}`, 14, yPos);

  yPos += 5;
  autoTable(doc, {
    startY: yPos,
    head: [['Periode', 'Pendapatan', 'HPP', 'Laba Kotor', 'Biaya Op.', 'Laba Bersih']],
    body: data.data.map(row => [
      row.period,
      formatCurrency(row.revenue),
      formatCurrency(row.cogs),
      formatCurrency(row.grossProfit),
      formatCurrency(row.operationalExpenses),
      formatCurrency(row.netProfit),
    ]),
    foot: [[
      'TOTAL',
      formatCurrency(data.summary.totalRevenue),
      formatCurrency(data.summary.totalCogs),
      formatCurrency(data.summary.totalGrossProfit),
      formatCurrency(data.summary.totalOperationalExpenses),
      formatCurrency(data.summary.totalNetProfit),
    ]],
    theme: 'striped',
    headStyles: { fillColor: [0, 150, 136] },
    footStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
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

  const fileName = `Laporan_Laba_Rugi_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

export const exportProfitReportToExcel = (data: ProfitExportData) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['LAPORAN LABA RUGI'],
    [data.storeName],
    [''],
    ['Periode:', `${formatDate(data.dateRange.start)} - ${formatDate(data.dateRange.end)}`],
    [''],
    ['RINGKASAN'],
    ['Total Pendapatan', data.summary.totalRevenue],
    ['Harga Pokok Penjualan (HPP)', data.summary.totalCogs],
    ['Laba Kotor', data.summary.totalGrossProfit],
    ['Margin Laba Kotor (%)', data.summary.grossProfitMargin],
    ['Biaya Operasional', data.summary.totalOperationalExpenses],
    ['Laba Bersih', data.summary.totalNetProfit],
    ['Margin Laba Bersih (%)', data.summary.netProfitMargin],
    [''],
    ['STATISTIK'],
    ['Total Transaksi', data.summary.totalTransactions],
    ['Total Item Terjual', data.summary.totalItemsSold],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

  // Profit Breakdown Sheet
  const breakdownData = [
    ['RINCIAN LABA RUGI'],
    [''],
    ['Keterangan', 'Nilai'],
    ['Total Pendapatan (Penjualan)', data.summary.totalRevenue],
    ['Harga Pokok Penjualan (HPP)', -data.summary.totalCogs],
    ['Laba Kotor', data.summary.totalGrossProfit],
    ['Biaya Operasional', -data.summary.totalOperationalExpenses],
    ['Laba Bersih', data.summary.totalNetProfit],
  ];

  const breakdownSheet = XLSX.utils.aoa_to_sheet(breakdownData);
  breakdownSheet['!cols'] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, breakdownSheet, 'Rincian');

  // Period Detail Sheet
  const periodHeader = ['Periode', 'Pendapatan', 'HPP', 'Laba Kotor', 'Biaya Operasional', 'Laba Bersih', 'Transaksi', 'Item Terjual'];
  const periodData = data.data.map(row => [
    row.period,
    row.revenue,
    row.cogs,
    row.grossProfit,
    row.operationalExpenses,
    row.netProfit,
    row.transactionCount,
    row.itemsSold,
  ]);
  
  // Add total row
  periodData.push([
    'TOTAL',
    data.summary.totalRevenue,
    data.summary.totalCogs,
    data.summary.totalGrossProfit,
    data.summary.totalOperationalExpenses,
    data.summary.totalNetProfit,
    data.summary.totalTransactions,
    data.summary.totalItemsSold,
  ]);

  const periodSheet = XLSX.utils.aoa_to_sheet([periodHeader, ...periodData]);
  periodSheet['!cols'] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, periodSheet, 'Detail Periode');

  const fileName = `Laporan_Laba_Rugi_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  
  return fileName;
};
