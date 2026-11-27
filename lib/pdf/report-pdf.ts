import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

import { displayName, formatDateTime, formatDay, formatMoney } from "@/lib/formats";
import type { ReportDetails } from "@/lib/queries/report-details";

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TOP = PAGE_H - 48;
const BOTTOM = 64; // keeps content clear of the footer

const SLATE = rgb(0.059, 0.09, 0.165);
const SLATE_MID = rgb(0.2, 0.255, 0.333);
const MUTED = rgb(0.392, 0.455, 0.545);
const AMBER = rgb(0.984, 0.749, 0.141);
const LINE = rgb(0.886, 0.91, 0.941);
const PANEL = rgb(0.973, 0.98, 0.988);
const WHITE = rgb(1, 1, 1);

type Col = { header: string; width: number; align?: "left" | "right" };

// Builds the PDF of one report as bytes. This function does NOT check who may see the
// report: the caller must already have done that (see the route handler).
export async function generateReportPdf(report: ReportDetails): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // The standard fonts can't draw every character, and drawing one they can't throws.
  // Anything unsupported (other scripts, emoji) becomes "?" instead of failing the download.
  const supported = new Set(regular.getCharacterSet());
  const clean = (s: string) =>
    Array.from(s.replace(/\r/g, "").replace(/[\t\u00A0\u2007\u2009\u202F]/g, " "))
      .map((ch) => (ch === "\n" || supported.has(ch.codePointAt(0)!) ? ch : "?"))
      .join("");

  // Splits text into lines that fit the width, keeping the writer's own line breaks.
  const wrap = (input: string, font: PDFFont, size: number, maxW: number): string[] => {
    const out: string[] = [];
    for (const raw of clean(input).split("\n")) {
      if (!raw.trim()) {
        out.push("");
        continue;
      }
      let line = "";
      for (const word of raw.split(" ")) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) <= maxW) {
          line = test;
          continue;
        }
        if (line) {
          out.push(line);
          line = "";
        }
        // A single word wider than the line is broken by characters.
        let chunk = "";
        for (const ch of word) {
          if (chunk && font.widthOfTextAtSize(chunk + ch, size) > maxW) {
            out.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        line = chunk;
      }
      out.push(line);
    }
    return out;
  };

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = TOP;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = TOP;
  };
  const ensure = (height: number) => {
    if (y - height < BOTTOM) newPage();
  };
  const text = (s: string, x: number, yy: number, size: number, font: PDFFont, color = SLATE_MID) =>
    page.drawText(clean(s), { x, y: yy, size, font, color });
  const textRight = (s: string, xRight: number, yy: number, size: number, font: PDFFont, color = SLATE_MID) => {
    const c = clean(s);
    page.drawText(c, { x: xRight - font.widthOfTextAtSize(c, size), y: yy, size, font, color });
  };

  const section = (title: string, sub?: string) => {
    ensure(70); // never leave a heading alone at the bottom of a page
    text(title, MARGIN, y, 12, bold, SLATE);
    if (sub) textRight(sub, PAGE_W - MARGIN, y, 9, regular, MUTED);
    y -= 7;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.75,
      color: LINE,
    });
    y -= 16;
  };

  const table = (cols: Col[], rows: string[][], footer?: string[]) => {
    const PADX = 8;
    const PADY = 6;
    const LH = 12.5;
    const xs: number[] = [];
    cols.forEach((c, i) => xs.push(i === 0 ? MARGIN : xs[i - 1] + cols[i - 1].width));

    const drawHeader = () => {
      ensure(52); // the header and at least one row
      page.drawRectangle({ x: MARGIN, y: y - 22, width: CONTENT_W, height: 22, color: SLATE });
      cols.forEach((c, i) => {
        const s = clean(c.header.toUpperCase());
        const x =
          c.align === "right"
            ? xs[i] + c.width - PADX - bold.widthOfTextAtSize(s, 8)
            : xs[i] + PADX;
        page.drawText(s, { x, y: y - 14, size: 8, font: bold, color: WHITE });
      });
      y -= 22;
    };

    const drawRow = (cells: string[], zebra: boolean, strong = false) => {
      const font = strong ? bold : regular;
      const wrapped = cells.map((c, i) => wrap(c, font, 9.5, cols[i].width - PADX * 2));
      const h = Math.max(...wrapped.map((l) => l.length)) * LH + PADY * 2;

      if (y - h < BOTTOM) {
        newPage();
        drawHeader(); // repeat the header on every page
      }
      if (zebra) {
        page.drawRectangle({ x: MARGIN, y: y - h, width: CONTENT_W, height: h, color: PANEL });
      }
      if (strong) {
        page.drawLine({
          start: { x: MARGIN, y },
          end: { x: PAGE_W - MARGIN, y },
          thickness: 1,
          color: SLATE_MID,
        });
      }
      wrapped.forEach((lines, i) => {
        lines.forEach((ln, j) => {
          const yy = y - PADY - 9 - j * LH;
          if (cols[i].align === "right") {
            textRight(ln, xs[i] + cols[i].width - PADX, yy, 9.5, font, strong ? SLATE : SLATE_MID);
          } else {
            text(ln, xs[i] + PADX, yy, 9.5, font, strong ? SLATE : SLATE_MID);
          }
        });
      });
      page.drawLine({
        start: { x: MARGIN, y: y - h },
        end: { x: PAGE_W - MARGIN, y: y - h },
        thickness: 0.5,
        color: LINE,
      });
      y -= h;
    };

    drawHeader();
    rows.forEach((r, i) => drawRow(r, i % 2 === 1));
    if (footer) drawRow(footer, false, true);
  };

  // ---------- Title ----------
  page.drawRectangle({ x: MARGIN, y: y - 3, width: 36, height: 3, color: AMBER });
  y -= 32;
  text("Daily report", MARGIN, y, 22, bold, SLATE);

  y -= 26;
  for (const line of wrap(report.siteName, bold, 14, CONTENT_W)) {
    text(line, MARGIN, y, 14, bold, SLATE);
    y -= 18;
  }
  text(`Report date: ${formatDay(report.createdAt)}`, MARGIN, y, 10, regular, MUTED);
  y -= 26;

  // ---------- Summary panel ----------
  const machineCount = report.machineries.reduce((n, m) => n + m.number, 0);
  const fields: [string, string][] = [
    ["Created by", displayName({ firstName: report.creatorFirstName, lastName: report.creatorLastName })],
    ["Report date", formatDay(report.createdAt)],
    // A report is submitted the moment it is created, so there is one timestamp.
    ["Submitted", formatDateTime(report.createdAt)],
    ["Workers on duty", String(report.workers.length)],
    ["Machines in operation", String(machineCount)],
    ["Materials cost", formatMoney(report.materialsTotal)],
  ];

  const PAD = 14;
  const COLS = 3;
  const colW = (CONTENT_W - PAD * 2) / COLS;
  const cells = fields.map(([label, value]) => ({
    label,
    lines: wrap(value, regular, 10, colW - 10),
  }));
  const gridRows: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += COLS) gridRows.push(cells.slice(i, i + COLS));
  const rowHeights = gridRows.map((r) => 13 + Math.max(...r.map((c) => c.lines.length)) * 13 + 12);
  const panelH = PAD * 2 + rowHeights.reduce((a, b) => a + b, 0) - 12;

  ensure(panelH + 10);
  page.drawRectangle({
    x: MARGIN,
    y: y - panelH,
    width: CONTENT_W,
    height: panelH,
    color: PANEL,
    borderColor: LINE,
    borderWidth: 0.75,
  });
  let rowTop = y - PAD;
  gridRows.forEach((r, ri) => {
    r.forEach((c, ci) => {
      const x = MARGIN + PAD + ci * colW;
      text(c.label.toUpperCase(), x, rowTop - 8, 7.5, bold, MUTED);
      c.lines.forEach((ln, li) => text(ln, x, rowTop - 22 - li * 13, 10, regular, SLATE));
    });
    rowTop -= rowHeights[ri];
  });
  y -= panelH + 26;

  // ---------- Notes ----------
  section("Notes");
  if (report.notes?.trim()) {
    for (const line of wrap(report.notes, regular, 10, CONTENT_W)) {
      ensure(16);
      if (line) text(line, MARGIN, y, 10, regular, SLATE_MID);
      y -= 14;
    }
  } else {
    text("No notes.", MARGIN, y, 10, regular, MUTED);
    y -= 14;
  }
  y -= 16;

  // ---------- Workers ----------
  const workerHours = report.workers.reduce((n, w) => n + Number(w.hours), 0);
  section("Workers on duty", `${report.workers.length} ${report.workers.length === 1 ? "worker" : "workers"}`);
  if (report.workers.length === 0) {
    text("No workers were recorded in this report.", MARGIN, y, 10, regular, MUTED);
    y -= 14;
  } else {
    table(
      [
        { header: "Name", width: CONTENT_W - 285 },
        { header: "Trade", width: 95 },
        { header: "Phone", width: 105 },
        { header: "Hours worked", width: 85, align: "right" },
      ],
      report.workers.map((w) => [displayName(w), w.trade, w.phone || "-", String(w.hours)]),
      ["Total", "", "", workerHours.toFixed(2)],
    );
  }
  y -= 22;

  // ---------- Machineries ----------
  section("Machineries", `${report.machineries.length} ${report.machineries.length === 1 ? "category" : "categories"}`);
  if (report.machineries.length === 0) {
    text("No machinery was recorded in this report.", MARGIN, y, 10, regular, MUTED);
    y -= 14;
  } else {
    table(
      [
        { header: "Category", width: CONTENT_W - 230 },
        { header: "Number in operation", width: 120, align: "right" },
        { header: "Hours worked", width: 110, align: "right" },
      ],
      report.machineries.map((m) => [m.category, String(m.number), String(m.hours)]),
    );
  }
  y -= 22;

  // ---------- Materials ----------
  section("Materials", `${report.materials.length} ${report.materials.length === 1 ? "line" : "lines"}`);
  if (report.materials.length === 0) {
    text("No materials were recorded in this report.", MARGIN, y, 10, regular, MUTED);
    y -= 14;
  } else {
    table(
      [
        { header: "Material", width: CONTENT_W - 320 },
        { header: "Quantity", width: 65, align: "right" },
        { header: "Unit", width: 55 },
        { header: "Unit cost", width: 90, align: "right" },
        { header: "Cost", width: 110, align: "right" },
      ],
      report.materials.map((m) => [
        m.name,
        String(m.quantity),
        m.unit,
        formatMoney(m.unitCost),
        formatMoney(m.lineCost),
      ]),
      ["Total", "", "", "", formatMoney(report.materialsTotal)],
    );
  }

  // ---------- Footer on every page ----------
  const generated = `Generated ${formatDateTime(new Date())}`;
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: MARGIN, y: 44 },
      end: { x: PAGE_W - MARGIN, y: 44 },
      thickness: 0.75,
      color: LINE,
    });
    p.drawText(clean(`Construction Site Management System  |  ${generated}`), {
      x: MARGIN,
      y: 30,
      size: 8,
      font: regular,
      color: MUTED,
    });
    const label = `Page ${i + 1} of ${pages.length}`;
    p.drawText(label, {
      x: PAGE_W - MARGIN - regular.widthOfTextAtSize(label, 8),
      y: 30,
      size: 8,
      font: regular,
      color: MUTED,
    });
  });

  doc.setTitle(clean(`Daily report - ${report.siteName} - ${formatDay(report.createdAt)}`));
  doc.setCreator("Construction Site Management System");

  return doc.save();
}