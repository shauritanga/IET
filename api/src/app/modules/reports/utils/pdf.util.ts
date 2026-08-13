import PDFDocument from 'pdfkit';

/** Renders a simple title + generated-at + tabular grid as a landscape A4 PDF. */
export function generateReportPdf(options: {
  title: string;
  headers: string[];
  rows: string[][];
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pageOptions = { margin: 30, size: 'A4' as const, layout: 'landscape' as const };
    const doc = new PDFDocument(pageOptions);
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(14).fillColor('#111111').text(options.title);
    doc
      .fontSize(8)
      .fillColor('#666666')
      .text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    const startX = doc.page.margins.left;
    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = usableWidth / Math.max(options.headers.length, 1);
    const rowHeight = 18;

    const drawRow = (y: number, cells: string[], isHeader: boolean) => {
      if (isHeader) {
        doc.rect(startX, y, usableWidth, rowHeight).fill('#3a3a3a');
      }
      doc.fontSize(7).fillColor(isHeader ? '#ffffff' : '#111111');
      cells.forEach((cell, i) => {
        doc.text(String(cell ?? ''), startX + i * colWidth + 4, y + 5, {
          width: colWidth - 8,
          height: rowHeight,
          ellipsis: true,
        });
      });
    };

    let y = doc.y;
    drawRow(y, options.headers, true);
    y += rowHeight;

    for (const row of options.rows) {
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage(pageOptions);
        y = doc.page.margins.top;
        drawRow(y, options.headers, true);
        y += rowHeight;
      }
      drawRow(y, row, false);
      y += rowHeight;
    }

    doc.end();
  });
}
