export interface ReceiptPdfData {
  planName: string;
  planMetaLine: string;
  amountDisplay: string;
  currency: string;
  basePriceDisplay?: string | null;
  planDiscountDisplay?: string | null;
  promoLabel?: string | null;
  promoDiscountDisplay?: string | null;
  gatewayFeeDisplay?: string | null;
  totalSavingsDisplay?: string | null;
  invoiceNumber?: string | null;
  trxId?: string | null;
  paymentMethod?: string | null;
  payerMobileNo?: string | null;
  gatewayLabel: string;
  paidAtDisplay?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
}

export interface BarcodeBar {
  x: number;
  w: number;
}

/**
 * Generate a deterministic 1D receipt barcode pattern in a 0..200 coordinate space.
 */
export function generateBarcodeBars(seed: string): BarcodeBar[] {
  const input = seed.trim() || "GENMETA-RECEIPT";
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const nextUint = () => {
    hash ^= hash << 13;
    hash ^= hash >>> 17;
    hash ^= hash << 5;
    return hash >>> 0;
  };

  const bars: BarcodeBar[] = [
    { x: 2, w: 2 },
    { x: 6, w: 1.5 },
  ];

  let cursor = 11;
  while (cursor < 188) {
    const r = nextUint();
    const barW = [1, 1.5, 2, 3][r % 4];
    const gap = [1.5, 2, 2.5, 3.5][(r >>> 3) % 4];
    if (cursor + barW > 189) break;
    bars.push({ x: cursor, w: barW });
    cursor += barW + gap;
  }

  bars.push({ x: 192.5, w: 1.5 }, { x: 196, w: 2 });
  return bars;
}

const SANS_FONT =
  '"Geist", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const MONO_FONT =
  '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Segoe UI", monospace';

function truncateToFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = "…";
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const candidate = `${text.slice(0, mid)}${ellipsis}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return `${text.slice(0, Math.max(1, low))}${ellipsis}`;
}

function drawTrackedCenterText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  tracking: number
) {
  const chars = Array.from(text);
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalWidth =
    widths.reduce((sum, w) => sum + w, 0) +
    Math.max(0, chars.length - 1) * tracking;

  const prevAlign = ctx.textAlign;
  ctx.textAlign = "left";
  let x = centerX - totalWidth / 2;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x, y);
    x += widths[i] + tracking;
  }
  ctx.textAlign = prevAlign;
}

function drawDashedRule(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number
) {
  ctx.save();
  ctx.strokeStyle = "#d4d4d4";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function renderReceiptCanvas(data: ReceiptPdfData): HTMLCanvasElement {
  const SCALE = 3;
  const LOGICAL_W = 380;
  const OUTER_MARGIN = 14;
  const SLIP_X = OUTER_MARGIN;
  const SLIP_W = LOGICAL_W - OUTER_MARGIN * 2; // 352
  const INNER_PAD = 24;
  const CONTENT_LEFT = SLIP_X + INNER_PAD;
  const CONTENT_RIGHT = SLIP_X + SLIP_W - INNER_PAD;
  const CONTENT_W = CONTENT_RIGHT - CONTENT_LEFT; // 304
  const CENTER_X = SLIP_X + SLIP_W / 2;
  const TOOTH_W = 11;
  const TOOTH_H = 7;

  const methodText = data.paymentMethod
    ? data.payerMobileNo
      ? `${data.paymentMethod} (${data.payerMobileNo})`
      : data.paymentMethod
    : data.payerMobileNo || data.gatewayLabel;

  const billedLines = [data.customerName, data.customerEmail]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v));

  const metaRows: { label: string; values: string[] }[] = [];
  if (data.paidAtDisplay) {
    metaRows.push({ label: "DATE", values: [data.paidAtDisplay] });
  }
  if (data.invoiceNumber) {
    metaRows.push({ label: "RECEIPT #", values: [data.invoiceNumber] });
  }
  if (data.trxId) {
    metaRows.push({ label: "TRX ID", values: [data.trxId] });
  }
  if (billedLines.length > 0) {
    metaRows.push({ label: "BILLED TO", values: billedLines.slice(0, 2) });
  }
  metaRows.push({ label: "METHOD", values: [methodText] });

  const extraChargeRows: { label: string; amount: string }[] = [];
  if (data.planDiscountDisplay) {
    extraChargeRows.push({
      label: "Plan discount",
      amount: `-${data.planDiscountDisplay}`,
    });
  }
  if (data.promoDiscountDisplay) {
    extraChargeRows.push({
      label: data.promoLabel || "Promo discount",
      amount: `-${data.promoDiscountDisplay}`,
    });
  }
  if (data.gatewayFeeDisplay) {
    extraChargeRows.push({
      label: "Gateway charge",
      amount: `+${data.gatewayFeeDisplay}`,
    });
  }

  // First compute exact height dynamically
  let y = OUTER_MARGIN + 28; // top padding inside slip
  y += 18; // GENMETA
  y += 18; // genmeta.app · support@genmeta.app
  y += 12; // dashed rule
  y += 22; // PAYMENT RECEIPT + PAID
  y += 14; // dashed rule
  y += 18; // gap before meta rows
  for (const row of metaRows) {
    y += row.values.length > 1 ? 32 : 19;
  }
  y += 8; // dashed rule
  y += 18; // DESCRIPTION / AMOUNT header
  y += 20; // planName + base/total price
  y += 16; // planMetaLine
  if (extraChargeRows.length > 0) {
    y += 4;
    y += extraChargeRows.length * 19;
  }
  y += 8; // dashed rule
  y += 24; // TOTAL PAID
  if (data.totalSavingsDisplay) {
    y += 16;
  }
  y += 16; // dashed rule
  y += 16 + 34 + 16; // barcode + gap
  y += 18; // barcode seed label
  y += 14; // VERIFIED VIA ...
  y += 22; // Thank you line
  const slipBottomY = y;
  const LOGICAL_H = slipBottomY + TOOTH_H + OUTER_MARGIN;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(LOGICAL_W * SCALE);
  canvas.height = Math.round(LOGICAL_H * SCALE);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable");
  }

  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "middle";

  // Quiet outer page margin
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Paper slip with serrated bottom tear edge
  ctx.beginPath();
  ctx.moveTo(SLIP_X, OUTER_MARGIN);
  ctx.lineTo(SLIP_X + SLIP_W, OUTER_MARGIN);
  ctx.lineTo(SLIP_X + SLIP_W, slipBottomY);
  const teethCount = Math.floor(SLIP_W / TOOTH_W);
  for (let i = teethCount; i > 0; i--) {
    const rightEdge = SLIP_X + i * TOOTH_W;
    const midEdge = rightEdge - TOOTH_W / 2;
    const leftEdge = rightEdge - TOOTH_W;
    ctx.lineTo(midEdge, slipBottomY + TOOTH_H);
    ctx.lineTo(leftEdge, slipBottomY);
  }
  ctx.closePath();

  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#d4d4d4";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw content top-to-bottom
  let cy = OUTER_MARGIN + 28;

  // Brand header
  ctx.fillStyle = "#111111";
  ctx.font = `700 15px ${SANS_FONT}`;
  drawTrackedCenterText(ctx, "GENMETA", CENTER_X, cy, 3.5);
  cy += 18;

  ctx.fillStyle = "#525252";
  ctx.font = `400 10px ${MONO_FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("genmeta.app · support@genmeta.app", CENTER_X, cy);
  cy += 16;

  drawDashedRule(ctx, CONTENT_LEFT, CONTENT_RIGHT, cy);
  cy += 18;

  // Receipt strip + PAID stamp
  ctx.fillStyle = "#111111";
  ctx.font = `700 10px ${MONO_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("PAYMENT RECEIPT", CONTENT_LEFT, cy);

  const stampText = "PAID";
  ctx.font = `700 9.5px ${MONO_FONT}`;
  const stampW = ctx.measureText(stampText).width + 14;
  const stampH = 18;
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 1;
  ctx.strokeRect(CONTENT_RIGHT - stampW, cy - stampH / 2, stampW, stampH);
  ctx.textAlign = "center";
  ctx.fillText(stampText, CONTENT_RIGHT - stampW / 2, cy + 0.5);
  cy += 18;

  drawDashedRule(ctx, CONTENT_LEFT, CONTENT_RIGHT, cy);
  cy += 18;

  // Metadata rows
  for (const row of metaRows) {
    ctx.fillStyle = "#525252";
    ctx.font = `400 10px ${MONO_FONT}`;
    ctx.textAlign = "left";
    ctx.fillText(row.label, CONTENT_LEFT, cy);

    const labelWidth = ctx.measureText(row.label).width + 14;
    const maxValWidth = CONTENT_W - labelWidth;

    ctx.textAlign = "right";
    ctx.fillStyle = "#111111";
    ctx.font = `600 10.5px ${MONO_FONT}`;
    ctx.fillText(
      truncateToFit(ctx, row.values[0], maxValWidth),
      CONTENT_RIGHT,
      cy
    );

    if (row.values.length > 1) {
      cy += 13;
      ctx.fillStyle = "#525252";
      ctx.font = `400 10px ${MONO_FONT}`;
      ctx.fillText(
        truncateToFit(ctx, row.values[1], maxValWidth),
        CONTENT_RIGHT,
        cy
      );
      cy += 19;
    } else {
      cy += 19;
    }
  }

  cy += 4;
  drawDashedRule(ctx, CONTENT_LEFT, CONTENT_RIGHT, cy);
  cy += 18;

  // Itemized section header
  ctx.fillStyle = "#525252";
  ctx.font = `700 9.5px ${MONO_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("DESCRIPTION", CONTENT_LEFT, cy);
  ctx.textAlign = "right";
  ctx.fillText("AMOUNT", CONTENT_RIGHT, cy);
  cy += 20;

  // Plan line item
  const itemPriceText = data.basePriceDisplay || data.amountDisplay;
  ctx.font = `600 11.5px ${MONO_FONT}`;
  const priceColW = ctx.measureText(itemPriceText).width + 12;

  ctx.fillStyle = "#111111";
  ctx.font = `600 12px ${SANS_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(
    truncateToFit(ctx, data.planName, CONTENT_W - priceColW),
    CONTENT_LEFT,
    cy
  );

  ctx.font = `600 11.5px ${MONO_FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(itemPriceText, CONTENT_RIGHT, cy);
  cy += 15;

  ctx.fillStyle = "#525252";
  ctx.font = `400 10px ${SANS_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(truncateToFit(ctx, data.planMetaLine, CONTENT_W), CONTENT_LEFT, cy);
  cy += 17;

  if (extraChargeRows.length > 0) {
    cy += 4;
    for (const row of extraChargeRows) {
      ctx.font = `500 10.5px ${MONO_FONT}`;
      const amtW = ctx.measureText(row.amount).width + 12;
      ctx.fillStyle = "#525252";
      ctx.font = `400 10.5px ${SANS_FONT}`;
      ctx.textAlign = "left";
      ctx.fillText(
        truncateToFit(ctx, row.label, CONTENT_W - amtW),
        CONTENT_LEFT,
        cy
      );

      ctx.fillStyle = "#111111";
      ctx.font = `500 10.5px ${MONO_FONT}`;
      ctx.textAlign = "right";
      ctx.fillText(row.amount, CONTENT_RIGHT, cy);
      cy += 19;
    }
  }

  cy += 4;
  drawDashedRule(ctx, CONTENT_LEFT, CONTENT_RIGHT, cy);
  cy += 22;

  // Total Paid row
  ctx.fillStyle = "#111111";
  ctx.font = `700 11px ${MONO_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("TOTAL PAID", CONTENT_LEFT, cy);

  ctx.font = `700 16px ${MONO_FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(`${data.amountDisplay} ${data.currency}`, CONTENT_RIGHT, cy);

  if (data.totalSavingsDisplay) {
    cy += 17;
    ctx.fillStyle = "#525252";
    ctx.font = `400 9.5px ${MONO_FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(`Total savings: ${data.totalSavingsDisplay}`, CONTENT_RIGHT, cy);
  }

  cy += 16;
  drawDashedRule(ctx, CONTENT_LEFT, CONTENT_RIGHT, cy);
  cy += 16;

  // Deterministic 1D Barcode
  const barcodeSeed = data.invoiceNumber || data.trxId || data.planName;
  const bars = generateBarcodeBars(barcodeSeed);
  const barcodeW = 200;
  const barcodeH = 34;
  const barcodeX = CENTER_X - barcodeW / 2;

  ctx.fillStyle = "#111111";
  for (const bar of bars) {
    ctx.fillRect(barcodeX + bar.x, cy, bar.w, barcodeH);
  }
  cy += barcodeH + 14;

  ctx.fillStyle = "#525252";
  ctx.font = `400 9.5px ${MONO_FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(
    truncateToFit(
      ctx,
      data.invoiceNumber || data.trxId || "GENMETA-VERIFIED",
      CONTENT_W
    ),
    CENTER_X,
    cy
  );
  cy += 17;

  ctx.fillStyle = "#111111";
  ctx.font = `700 9.5px ${MONO_FONT}`;
  ctx.fillText(`VERIFIED VIA ${data.gatewayLabel.toUpperCase()}`, CENTER_X, cy);
  cy += 15;

  ctx.fillStyle = "#525252";
  ctx.font = `400 10px ${SANS_FONT}`;
  ctx.fillText("Thank you for choosing GenMeta.", CENTER_X, cy);

  return canvas;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function buildSingleImagePdf(
  jpegBytes: Uint8Array,
  widthPx: number,
  heightPx: number
): Uint8Array {
  const encoder = new TextEncoder();
  const pdfWidthPt = Math.round(106 * 2.83464567 * 100) / 100; // ~106mm receipt slip
  const pdfHeightPt =
    Math.round(((pdfWidthPt * heightPx) / widthPx) * 100) / 100;

  const chunks: Uint8Array[] = [];
  let offset = 0;

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };
  const pushStr = (str: string) => {
    pushBytes(encoder.encode(str));
  };

  // PDF 1.4 header + binary marker comment
  pushStr("%PDF-1.4\n%");
  pushBytes(new Uint8Array([0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const offsets: number[] = [0]; // index 0 unused

  // 1: Catalog
  offsets.push(offset);
  pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // 2: Pages
  offsets.push(offset);
  pushStr("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // 3: Page
  offsets.push(offset);
  pushStr(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidthPt} ${pdfHeightPt}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // 4: JPEG Image XObject
  offsets.push(offset);
  pushStr(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushStr("\nendstream\nendobj\n");

  // 5: Content Stream
  const contentStream = `q\n${pdfWidthPt} 0 0 ${pdfHeightPt} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBytes = encoder.encode(contentStream);
  offsets.push(offset);
  pushStr(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
  pushBytes(contentBytes);
  pushStr("endstream\nendobj\n");

  // Cross-reference table
  const xrefOffset = offset;
  pushStr(`xref\n0 ${offsets.length}\n`);
  pushStr("0000000000 65535 f \n");
  for (let i = 1; i < offsets.length; i++) {
    pushStr(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }

  pushStr(
    `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
  );

  const result = new Uint8Array(offset);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
}

function getSafeFileIdentifier(invoiceNumber?: string | null): string {
  const cleaned = (invoiceNumber || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned || "Payment";
}

export async function downloadReceiptPdf(data: ReceiptPdfData): Promise<void> {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => setTimeout(resolve, 400)),
    ]);
  }

  const canvas = renderReceiptCanvas(data);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.96);
  const base64 = dataUrl.split(",")[1];
  if (!base64) {
    throw new Error("Failed to encode receipt image");
  }

  const jpegBytes = base64ToUint8Array(base64);
  const pdfBytes = buildSingleImagePdf(jpegBytes, canvas.width, canvas.height);

  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `GenMeta-Receipt-${getSafeFileIdentifier(data.invoiceNumber)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

export function printReceiptWithTitle(invoiceNumber?: string | null): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const originalTitle = document.title;
  const targetTitle = `GenMeta-Receipt-${getSafeFileIdentifier(invoiceNumber)}`;
  document.title = targetTitle;

  let restored = false;
  const restoreTitle = () => {
    if (restored) return;
    restored = true;
    document.title = originalTitle;
    window.removeEventListener("afterprint", restoreTitle);
  };

  window.addEventListener("afterprint", restoreTitle);
  setTimeout(restoreTitle, 3000);
  window.print();
}
