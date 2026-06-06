const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const prisma = require('../utils/prisma');

const POCHI_GREEN = '#00A651';
const POCHI_NAVY = '#1A1A2E';

const getExportData = async (fundraiserId) => {
  return prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
    include: {
      contributors: {
        orderBy: { registered_at: 'asc' },
      },
      transactions: {
        orderBy: { received_at: 'desc' },
        include: { contributor: { select: { full_name: true } } },
      },
      organizer: { select: { full_name: true, phone_number: true } },
    },
  });
};

const generatePdf = async (fundraiserBase) => {
  const fundraiser = await getExportData(fundraiserBase.id);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).fillColor(POCHI_GREEN).text('Pochi', 40, 40);
    doc.fontSize(10).fillColor(POCHI_NAVY).text('Fundraiser Ledger', 40, 65);
    doc.moveDown(0.5);

    doc.fontSize(16).fillColor(POCHI_NAVY).text(fundraiser.title);
    doc.fontSize(10).fillColor('#4B5563');
    if (fundraiser.description) doc.text(fundraiser.description);
    doc.text(`Reference: ${fundraiser.account_reference}`);
    doc.text(`Organizer: ${fundraiser.organizer.full_name} (${fundraiser.organizer.phone_number})`);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}`);
    doc.moveDown(0.5);

    // Summary
    const pct = fundraiser.target_amount > 0
      ? Math.round((fundraiser.total_paid / fundraiser.target_amount) * 100) : 0;
    doc.fontSize(12).fillColor(POCHI_NAVY).text('Summary', { underline: true });
    doc.fontSize(10).fillColor('#1A1A2E');
    doc.text(`Target: KES ${fundraiser.target_amount.toLocaleString()}`);
    doc.text(`Total Raised: KES ${fundraiser.total_paid.toLocaleString()} (${pct}%)`);
    doc.text(`Total Pledged: KES ${fundraiser.total_pledged.toLocaleString()}`);
    doc.text(`Contributors: ${fundraiser.contributors.length}`);
    doc.moveDown(0.5);

    // Contributors table
    doc.fontSize(12).fillColor(POCHI_NAVY).text('Contributors', { underline: true });
    doc.moveDown(0.3);

    const colWidths = [180, 100, 80, 80, 80];
    const headers = ['Name', 'Phone', 'Pledge', 'Paid', 'Status'];
    let x = 40;
    doc.fontSize(9).fillColor('#fff').rect(40, doc.y, 515, 16).fill(POCHI_NAVY).fillColor('#fff');
    const headerY = doc.y - 14;
    headers.forEach((h, i) => {
      doc.text(h, x + 4, headerY + 3, { width: colWidths[i] - 4 });
      x += colWidths[i];
    });
    doc.moveDown(0.5);

    fundraiser.contributors.forEach((c, idx) => {
      const rowY = doc.y;
      if (idx % 2 === 0) {
        doc.rect(40, rowY - 2, 515, 14).fill('#F7F8FA').fillColor('#1A1A2E');
      }
      x = 40;
      const row = [
        c.full_name,
        c.phone_number,
        `KES ${c.pledge_amount.toLocaleString()}`,
        `KES ${c.paid_amount.toLocaleString()}`,
        c.pledge_status,
      ];
      doc.fontSize(8).fillColor('#1A1A2E');
      row.forEach((cell, i) => {
        doc.text(cell, x + 4, rowY - 1, { width: colWidths[i] - 4 });
        x += colWidths[i];
      });
      doc.moveDown(0.3);
    });

    doc.end();
  });
};

const generateExcel = async (fundraiserBase) => {
  const fundraiser = await getExportData(fundraiserBase.id);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Pochi';

  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRow(['Pochi Fundraiser Report']);
  summarySheet.addRow([]);
  summarySheet.addRow(['Fundraiser', fundraiser.title]);
  summarySheet.addRow(['Reference', fundraiser.account_reference]);
  summarySheet.addRow(['Organizer', fundraiser.organizer.full_name]);
  summarySheet.addRow(['Target (KES)', fundraiser.target_amount]);
  summarySheet.addRow(['Total Raised (KES)', fundraiser.total_paid]);
  summarySheet.addRow(['Total Pledged (KES)', fundraiser.total_pledged]);
  summarySheet.addRow(['Contributors', fundraiser.contributors.length]);
  summarySheet.addRow(['Generated', new Date().toISOString()]);

  summarySheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF00A651' } };

  // Contributors sheet
  const contribSheet = workbook.addWorksheet('Contributors');
  contribSheet.columns = [
    { header: 'Full Name', key: 'full_name', width: 25 },
    { header: 'Phone', key: 'phone_number', width: 18 },
    { header: 'WhatsApp Name', key: 'whatsapp_name', width: 22 },
    { header: 'Pledge (KES)', key: 'pledge_amount', width: 15 },
    { header: 'Paid (KES)', key: 'paid_amount', width: 15 },
    { header: 'Balance (KES)', key: 'balance', width: 15 },
    { header: 'Status', key: 'pledge_status', width: 12 },
    { header: 'Registered', key: 'registered_at', width: 20 },
    { header: 'Last Payment', key: 'last_payment_at', width: 20 },
  ];

  contribSheet.getRow(1).font = { bold: true };
  contribSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
  contribSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  fundraiser.contributors.forEach((c) => {
    contribSheet.addRow({
      ...c,
      balance: c.pledge_amount - c.paid_amount,
      registered_at: c.registered_at,
      last_payment_at: c.last_payment_at,
    });
  });

  // Transactions sheet
  const txSheet = workbook.addWorksheet('Transactions');
  txSheet.columns = [
    { header: 'M-Pesa ID', key: 'mpesa_transaction_id', width: 20 },
    { header: 'Date', key: 'received_at', width: 22 },
    { header: 'Amount (KES)', key: 'amount', width: 15 },
    { header: 'Sender Name', key: 'mpesa_sender_name', width: 25 },
    { header: 'Sender Phone', key: 'mpesa_sender_phone', width: 18 },
    { header: 'Matched To', key: 'contributor_name', width: 25 },
    { header: 'Match Status', key: 'match_status', width: 18 },
  ];

  txSheet.getRow(1).font = { bold: true };
  txSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
  txSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  fundraiser.transactions.forEach((t) => {
    txSheet.addRow({
      ...t,
      contributor_name: t.contributor?.full_name || '—',
    });
  });

  return workbook.xlsx.writeBuffer();
};

module.exports = { generatePdf, generateExcel };
