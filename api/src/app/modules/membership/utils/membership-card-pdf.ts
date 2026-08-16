import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import axios from 'axios';

export type MembershipCardPdfInput = {
  memberName: string;
  membershipCategory: string;
  membershipNumber: string;
  specialization?: string | null;
  validUntil: Date | string;
  photoUrl?: string | null;
  verifyUrl: string;
};

const RED = '#c41212';
const DARK = '#1a1a1a';
const MUTED = '#4a4a4a';
const BLUE_BAR = '#1e3a8a';
const PHOTO_BORDER = '#e8a0a0';

function assetPath(...parts: string[]) {
  return path.join(process.cwd(), 'src', 'assets', ...parts);
}

function formatValidUntil(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

async function loadImageBuffer(urlOrPath?: string | null): Promise<Buffer | null> {
  if (!urlOrPath) return null;
  try {
    if (/^https?:\/\//i.test(urlOrPath)) {
      const response = await axios.get<ArrayBuffer>(urlOrPath, {
        responseType: 'arraybuffer',
        timeout: 15000,
      });
      return Buffer.from(response.data);
    }
    const local = path.isAbsolute(urlOrPath)
      ? urlOrPath
      : path.join(process.cwd(), urlOrPath);
    if (fs.existsSync(local)) {
      return fs.readFileSync(local);
    }
  } catch {
    return null;
  }
  return null;
}

function drawWatermark(
  doc: PDFKit.PDFDocument,
  logo: Buffer | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (!logo) return;
  doc.save();
  doc.opacity(0.08);
  const size = Math.min(w, h) * 0.72;
  doc.image(logo, x + (w - size) / 2, y + (h - size) / 2 + 8, {
    width: size,
    height: size,
    fit: [size, size],
  });
  doc.restore();
}

/**
 * Generates a printable membership card PDF (front + back),
 * matching the IET sample card layout.
 */
export async function generateMembershipCardPdf(
  input: MembershipCardPdfInput,
): Promise<Buffer> {
  const logoPathJpg = assetPath('iet-logo.jpg');
  const logo = fs.existsSync(logoPathJpg)
    ? fs.readFileSync(logoPathJpg)
    : null;
  const photo = await loadImageBuffer(input.photoUrl);
  const qrPng = await QRCode.toBuffer(input.verifyUrl, {
    type: 'png',
    margin: 1,
    width: 180,
    errorCorrectionLevel: 'M',
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 36,
      info: {
        Title: `IET Membership Card - ${input.memberName}`,
        Author: 'Institution of Engineers Tanzania',
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const cardWidth = Math.min(520, pageWidth - 72);
    const cardHeight = 300;
    const cardX = (pageWidth - cardWidth) / 2;
    const frontY = 48;
    const backY = frontY + cardHeight + 28;

    // ── Front ─────────────────────────────────────────────────────
    doc.roundedRect(cardX, frontY, cardWidth, cardHeight, 10).stroke('#d0d0d0');
    drawWatermark(doc, logo, cardX, frontY, cardWidth, cardHeight);

    // Header
    doc
      .fillColor(RED)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('THE INSTITUTION OF ENGINEERS TANZANIA', cardX + 18, frontY + 16, {
        width: cardWidth - 110,
      });
    doc
      .fillColor(DARK)
      .fontSize(12)
      .text('MEMBERSHIP CARD', cardX + 18, frontY + 36, {
        width: cardWidth - 110,
      });

    if (logo) {
      doc.image(logo, cardX + cardWidth - 78, frontY + 12, {
        width: 58,
        height: 58,
        fit: [58, 58],
      });
    }

    // Photo
    const photoX = cardX + 22;
    const photoY = frontY + 78;
    const photoW = 110;
    const photoH = 130;
    doc.rect(photoX - 2, photoY - 2, photoW + 4, photoH + 4).stroke(PHOTO_BORDER);
    if (photo) {
      doc.image(photo, photoX, photoY, {
        width: photoW,
        height: photoH,
        fit: [photoW, photoH],
        align: 'center',
        valign: 'center',
      });
    } else {
      doc.rect(photoX, photoY, photoW, photoH).fill('#f3f3f3');
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text('No Photo', photoX, photoY + photoH / 2 - 6, {
          width: photoW,
          align: 'center',
        });
    }

    // Signature line under photo
    const sigY = photoY + photoH + 18;
    doc
      .moveTo(photoX + 8, sigY)
      .lineTo(photoX + photoW - 8, sigY)
      .dash(2, { space: 2 })
      .stroke('#888888')
      .undash();
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(8)
      .text('Signature', photoX, sigY + 4, { width: photoW, align: 'center' });

    // Details
    const detailX = photoX + photoW + 28;
    const detailW = cardWidth - (detailX - cardX) - 24;
    let detailY = frontY + 88;
    const rows: Array<[string, string]> = [
      ['Name', input.memberName],
      ['Membership Category', input.membershipCategory],
      ['Membership No.', input.membershipNumber],
      ['Specialization', input.specialization || '—'],
    ];
    for (const [label, value] of rows) {
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text(label, detailX, detailY, { width: detailW });
      doc
        .fillColor(DARK)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(value, detailX, detailY + 12, { width: detailW });
      detailY += 36;
    }

    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(9)
      .text('Valid until:', detailX, frontY + cardHeight - 36);
    doc
      .fillColor(RED)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(formatValidUntil(input.validUntil), detailX + 58, frontY + cardHeight - 37);

    // ── Back ──────────────────────────────────────────────────────
    doc.roundedRect(cardX, backY, cardWidth, cardHeight, 10).stroke('#d0d0d0');
    drawWatermark(doc, logo, cardX, backY, cardWidth, cardHeight);

    doc
      .fillColor(RED)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(
        'THE INSTITUTION OF ENGINEERS TANZANIA (IET)',
        cardX + 18,
        backY + 16,
        { width: cardWidth - 36, align: 'center' },
      );

    const colGap = 18;
    const leftW = cardWidth * 0.52 - colGap;
    const rightX = cardX + leftW + colGap + 10;
    const rightW = cardWidth - leftW - colGap - 28;
    const bodyY = backY + 48;

    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(8.5)
      .text(
        'This Membership Card is the property of The Institution of Engineers Tanzania. It should not be tampered or left in possession of any unauthorized person. Please report lost or stolen cards to the nearest police station. If found, please return to IET office.',
        cardX + 18,
        bodyY,
        { width: leftW, align: 'left', lineGap: 2 },
      );

    const presidentSigY = bodyY + 118;
    doc
      .moveTo(cardX + 28, presidentSigY)
      .lineTo(cardX + leftW - 10, presidentSigY)
      .dash(2, { space: 2 })
      .stroke('#888888')
      .undash();
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(8)
      .text('IET President', cardX + 18, presidentSigY + 5, {
        width: leftW,
        align: 'center',
      });

    // Contact block
    const contacts: string[] = [
      'Office Accommodation Scheme (OAS) building, 6th Floor, CRDB HQ, Azikiwe Street, P. O. Box 2938, Dar es Salaam, Tanzania.',
      '+255 745 552 420  ·  +255 22 212 4265',
      'info@iet.or.tz',
      'www.iet.or.tz',
    ];
    let cy = bodyY;
    for (const line of contacts) {
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(8)
        .text(line, rightX, cy, { width: rightW - 70, lineGap: 1 });
      cy = doc.y + 8;
    }

    // QR
    const qrSize = 64;
    doc.image(qrPng, cardX + cardWidth - qrSize - 22, backY + cardHeight - qrSize - 28, {
      width: qrSize,
      height: qrSize,
    });

    // Blue footer bar
    doc
      .rect(cardX, backY + cardHeight - 14, cardWidth, 14)
      .fill(BLUE_BAR);

    doc.end();
  });
}
