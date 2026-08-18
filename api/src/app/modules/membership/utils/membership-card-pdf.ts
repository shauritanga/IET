import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

export type MembershipCardPdfInput = {
  memberName: string;
  membershipCategory: string;
  membershipNumber: string;
  specialization?: string | null;
  validUntil: Date | string;
  photoUrl?: string | null;
  verifyUrl: string;
};

const RED = '#E31E24';
const DARK = '#1a1a1a';
const MUTED = '#3a3a3a';
const BLUE_BAR = '#3810E0';
const PHOTO_BORDER = '#F5DEDE';

const F_OSWALD_BOLD = 'Oswald-Bold';
const F_OSWALD_SEMIBOLD = 'Oswald-SemiBold';
const F_BODY = 'OpenSans-Regular';
const F_BODY_BOLD = 'OpenSans-Bold';

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
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(urlOrPath, { signal: controller.signal });
        if (!response.ok) return null;
        return Buffer.from(await response.arrayBuffer());
      } finally {
        clearTimeout(timer);
      }
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

function readAssetIfExists(...parts: string[]): Buffer | null {
  const p = assetPath(...parts);
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
}

function registerFonts(doc: PDFKit.PDFDocument) {
  const fonts: Array<[string, string]> = [
    [F_OSWALD_BOLD, 'fonts/Oswald-Bold.ttf'],
    [F_OSWALD_SEMIBOLD, 'fonts/Oswald-SemiBold.ttf'],
    [F_BODY, 'fonts/OpenSans-Regular.ttf'],
    [F_BODY_BOLD, 'fonts/OpenSans-Bold.ttf'],
  ];
  for (const [name, relPath] of fonts) {
    const full = assetPath(...relPath.split('/'));
    if (fs.existsSync(full)) {
      doc.registerFont(name, full);
    }
  }
}

/** Largest font size (<= maxSize) at which `text` fits within `maxWidth` on one line. */
function fitFontSize(
  doc: PDFKit.PDFDocument,
  font: string,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize = 6,
): number {
  doc.font(font);
  let size = maxSize;
  while (size > minSize) {
    doc.fontSize(size);
    if (doc.widthOfString(text) <= maxWidth) return size;
    size -= 0.5;
  }
  return minSize;
}

function drawWatermark(
  doc: PDFKit.PDFDocument,
  seal: Buffer | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (!seal) return;
  doc.save();
  doc.opacity(0.07);
  const size = Math.min(w, h) * 0.85;
  doc.image(seal, x + (w - size) / 2, y + (h - size) / 2, {
    width: size,
    height: size,
    fit: [size, size],
  });
  doc.restore();
}

/** Renders "Label: Value" as one inline run with mixed fonts/colors. */
function labelValueLine(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  label: string,
  value: string,
  opts: {
    labelFont?: string;
    valueFont?: string;
    fontSize: number;
    labelColor?: string;
    valueColor?: string;
    gap?: number;
  },
) {
  const labelFont = opts.labelFont ?? F_BODY;
  const valueFont = opts.valueFont ?? F_BODY_BOLD;
  const labelColor = opts.labelColor ?? MUTED;
  const valueColor = opts.valueColor ?? DARK;
  doc
    .font(labelFont)
    .fontSize(opts.fontSize)
    .fillColor(labelColor)
    .text(`${label} `, x, y, { continued: true, lineBreak: false });
  doc
    .font(valueFont)
    .fillColor(valueColor)
    .text(value, { continued: false, lineBreak: false });
}

export async function generateMembershipCardPdf(
  input: MembershipCardPdfInput,
): Promise<Buffer> {
  const seal = readAssetIfExists('iet-seal-watermark.png');
  const presidentSig = readAssetIfExists('iet-president-signature.png');
  const iconPin = readAssetIfExists('icons', 'icon-pin.png');
  const iconPhone = readAssetIfExists('icons', 'icon-phone.png');
  const iconEnvelope = readAssetIfExists('icons', 'icon-envelope.png');
  const iconGlobe = readAssetIfExists('icons', 'icon-globe.png');
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

    registerFonts(doc);
    const oswaldBold = fs.existsSync(assetPath('fonts/Oswald-Bold.ttf'))
      ? F_OSWALD_BOLD
      : 'Helvetica-Bold';
    const oswaldSemi = fs.existsSync(assetPath('fonts/Oswald-SemiBold.ttf'))
      ? F_OSWALD_SEMIBOLD
      : 'Helvetica-Bold';
    const body = fs.existsSync(assetPath('fonts/OpenSans-Regular.ttf'))
      ? F_BODY
      : 'Helvetica';
    const bodyBold = fs.existsSync(assetPath('fonts/OpenSans-Bold.ttf'))
      ? F_BODY_BOLD
      : 'Helvetica-Bold';

    const pageWidth = doc.page.width;
    const cardWidth = Math.min(500, pageWidth - 72);

    // Front card: source image is 1055x667px.
    const Sf = cardWidth / 1055;
    const cardHeightFront = cardWidth * (667 / 1055);
    const cardX = (pageWidth - cardWidth) / 2;
    const frontY = 42;

    // ── Front ─────────────────────────────────────────────────────
    drawWatermark(doc, seal, cardX, frontY, cardWidth, cardHeightFront);

    const headline1 = 'THE INSTITUTION OF ENGINEERS TANZANIA';
    const headline1Size = fitFontSize(doc, oswaldBold, headline1, 763 * Sf, 41 * Sf * 1.42);
    doc
      .fillColor(RED)
      .font(oswaldBold)
      .fontSize(headline1Size)
      .text(headline1, cardX + 85 * Sf, frontY + 94 * Sf, { lineBreak: false });

    const headline2 = 'MEMBERSHIP CARD';
    const headline2Size = fitFontSize(doc, oswaldBold, headline2, 320 * Sf, 36 * Sf * 1.42);
    doc
      .fillColor(DARK)
      .font(oswaldBold)
      .fontSize(headline2Size)
      .text(headline2, cardX + 305 * Sf, frontY + 155 * Sf, { lineBreak: false });

    if (seal) {
      const sealSize = 160 * Sf;
      doc.image(seal, cardX + 938 * Sf - sealSize / 2, frontY + 128 * Sf - sealSize / 2, {
        width: sealSize,
        height: sealSize,
        fit: [sealSize, sealSize],
      });
    }

    // Photo
    const photoX = cardX + 72 * Sf;
    const photoY = frontY + 241 * Sf;
    const photoW = 230 * Sf;
    const photoH = 268 * Sf;
    doc.rect(photoX - 3, photoY - 3, photoW + 6, photoH + 6).fill(PHOTO_BORDER);
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
        .font(body)
        .fontSize(9)
        .text('No Photo', photoX, photoY + photoH / 2 - 6, {
          width: photoW,
          align: 'center',
        });
    }

    // Blank signature line under photo (no digital signature capture exists)
    const sigY = photoY + photoH + 20 * Sf;
    doc
      .moveTo(photoX + 4, sigY)
      .lineTo(photoX + photoW - 4, sigY)
      .dash(1.5, { space: 2 })
      .stroke('#888888')
      .undash();
    doc
      .fillColor(MUTED)
      .font(body)
      .fontSize(11 * Sf * 1.42)
      .text('Signature', photoX, sigY + 6 * Sf, { width: photoW, align: 'center' });

    // Details
    const detailX = cardX + 328 * Sf;
    const detailFontSize = 24 * Sf * 1.42;
    const rowYs = [255, 318, 385, 448].map((py) => frontY + py * Sf);
    const rows: Array<[string, string]> = [
      ['Name:', input.memberName],
      ['Membership Category:', input.membershipCategory],
      ['Membership No.:', input.membershipNumber],
      ['Specialization:', input.specialization || '—'],
    ];
    rows.forEach(([label, value], i) => {
      labelValueLine(doc, detailX, rowYs[i], label, value, {
        labelFont: body,
        valueFont: bodyBold,
        fontSize: detailFontSize,
        labelColor: DARK,
        valueColor: DARK,
      });
    });

    labelValueLine(
      doc,
      detailX,
      frontY + 558 * Sf,
      'Valid until:',
      formatValidUntil(input.validUntil),
      {
        labelFont: body,
        valueFont: bodyBold,
        fontSize: 24 * Sf * 1.42,
        labelColor: DARK,
        valueColor: RED,
      },
    );

    // ── Back ──────────────────────────────────────────────────────
    const Sb = cardWidth / 1169;
    const cardHeightBack = cardWidth * (732 / 1169);
    const backY = frontY + cardHeightFront + 30;

    drawWatermark(doc, seal, cardX, backY, cardWidth, cardHeightBack);

    const backHeadlineLines = ['THE INSTITUTION OF', 'ENGINEERS TANZANIA (IET)'];
    const backHeadlineSize = Math.min(
      ...backHeadlineLines.map((line) => fitFontSize(doc, oswaldBold, line, 620 * Sb, 31 * Sb * 1.42)),
    );
    const backHeadlineLineHeight = backHeadlineSize * 1.15;
    doc.font(oswaldBold).fontSize(backHeadlineSize).fillColor(RED);
    backHeadlineLines.forEach((line, i) => {
      doc.text(line, cardX + 252 * Sb, backY + 58 * Sb + i * backHeadlineLineHeight, {
        lineBreak: false,
      });
    });
    const backHeadlineBottom = backY + 58 * Sb + backHeadlineLines.length * backHeadlineLineHeight;

    const paraX = cardX + 104 * Sb;
    const paraW = 460 * Sb;
    const paraY = Math.max(backY + 175 * Sb, backHeadlineBottom + 8 * Sb);
    doc
      .fillColor(DARK)
      .font(body)
      .fontSize(15 * Sb * 1.42)
      .text(
        'This Membership Card is the property of The Institution of Engineers Tanzania. it should not be tampered or left in possession of any unauthorized person. Please report lost or stolen cards to the nearest police station. If found, please return to IET office.',
        paraX,
        paraY,
        { width: paraW, align: 'left', lineGap: 5 * Sb },
      );

    // President signature (blank/no digital capture — dotted line + label only,
    // with the extracted physical-card signature graphic shown for visual match)
    if (presidentSig) {
      const sigW = 190 * Sb;
      const sigH = sigW * (74 / 229);
      doc.image(presidentSig, cardX + 148 * Sb, backY + 425 * Sb - sigH, {
        width: sigW,
        height: sigH,
      });
    }
    doc
      .moveTo(cardX + 104 * Sb, backY + 498 * Sb)
      .lineTo(cardX + 355 * Sb, backY + 498 * Sb)
      .dash(1.5, { space: 2 })
      .stroke('#888888')
      .undash();
    doc
      .fillColor(MUTED)
      .font(body)
      .fontSize(14 * Sb * 1.42)
      .text('IET President', cardX + 104 * Sb, backY + 505 * Sb, {
        width: 251 * Sb,
        align: 'center',
      });

    // Vertical red divider
    doc
      .rect(cardX + 562 * Sb, backY + 204 * Sb, 9 * Sb, 228 * Sb)
      .fill(RED);

    // Contact block
    const iconX = cardX + 625 * Sb;
    const iconW = 37 * Sb;
    const textX = cardX + 690 * Sb;
    const textW = (1169 - 690 - 20) * Sb;
    const contactFontSize = 15 * Sb * 1.42;

    if (iconPin) {
      doc.image(iconPin, iconX + 3 * Sb, backY + 188 * Sb, { width: 25 * Sb, height: 35 * Sb });
    }
    doc
      .fillColor(DARK)
      .font(body)
      .fontSize(contactFontSize)
      .text(
        'Office Accommodation Scheme (OAS) building, 6th Floor, CRDB HQ, Azikiwe Street P. O. Box 2938, Dar es Salaam, Tanzania.',
        textX,
        backY + 175 * Sb,
        { width: textW, lineGap: 3 * Sb },
      );

    if (iconPhone) {
      doc.image(iconPhone, iconX, backY + 338 * Sb, { width: iconW, height: 26 * Sb });
    }
    doc
      .fillColor(DARK)
      .font(body)
      .fontSize(contactFontSize)
      .text('+255 745 552 420\n+255 22 212 4265', textX, backY + 335 * Sb, {
        width: textW,
        lineGap: 3 * Sb,
      });

    if (iconEnvelope) {
      doc.image(iconEnvelope, iconX, backY + 420 * Sb, { width: iconW, height: 19 * Sb });
    }
    doc
      .fillColor(DARK)
      .font(body)
      .fontSize(contactFontSize)
      .text('info@iet.or.tz', textX, backY + 418 * Sb, { width: textW });

    if (iconGlobe) {
      doc.image(iconGlobe, iconX, backY + 475 * Sb, { width: iconW, height: 22 * Sb });
    }
    doc
      .fillColor(DARK)
      .font(body)
      .fontSize(contactFontSize)
      .text('www.iet.or.tz', textX, backY + 472 * Sb, { width: textW });

    // QR
    const qrSize = 100 * Sb;
    doc.image(qrPng, cardX + 892 * Sb, backY + 400 * Sb, {
      width: qrSize,
      height: qrSize,
    });

    // Blue footer bar
    doc
      .rect(cardX + 22 * Sb, backY + 538 * Sb, (1063 - 22) * Sb, (671 - 538) * Sb)
      .fill(BLUE_BAR);

    doc.end();
  });
}
