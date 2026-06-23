/** Shared Excel (.xlsx) generation utility using ExcelJS. */
import ExcelJS from "exceljs";

const BRAND_COBALT = "3366FF";
const BRAND_DEEP_INK = "0E1428";
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: BRAND_COBALT },
};
const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFF" },
  size: 11,
};

interface SheetDefinition {
  name: string;
  columns: { header: string; key: string; width?: number }[];
  rows: Record<string, unknown>[];
}

/** Build a branded workbook from one or more sheet definitions. */
export async function buildWorkbook(
  title: string,
  sheets: SheetDefinition[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Bright.Experience";
  wb.created = new Date();

  // Title sheet
  const cover = wb.addWorksheet("Cover");
  cover.getCell("B2").value = "Bright.Experience";
  cover.getCell("B2").font = { bold: true, size: 18, color: { argb: BRAND_DEEP_INK } };
  cover.getCell("B3").value = title;
  cover.getCell("B3").font = { size: 14, color: { argb: "666666" } };
  cover.getCell("B4").value = `Generated ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}`;
  cover.getCell("B4").font = { size: 10, color: { argb: "999999" } };
  cover.getColumn("B").width = 50;

  for (const def of sheets) {
    const ws = wb.addWorksheet(def.name);
    ws.columns = def.columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 18,
    }));

    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });
    headerRow.height = 28;

    for (const row of def.rows) {
      ws.addRow(row);
    }

    // Auto-fit: set a reasonable min-width based on data
    ws.columns.forEach((col) => {
      if (!col.width || col.width < 12) col.width = 12;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await wb.xlsx.writeBuffer() as any;
}

/** Create a downloadable Excel Response for API routes. */
export async function excelResponse(
  sheets: SheetDefinition[],
  title: string,
  filename = "export.xlsx",
): Promise<Response> {
  const buf = await buildWorkbook(title, sheets);
  return new Response(buf as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
