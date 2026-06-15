/** Shared CSV generation utility. */

interface CsvOptions {
  filename?: string;
  headers?: string[];
}

/** Convert an array of objects to a CSV string. */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  options: CsvOptions = {},
): string {
  if (rows.length === 0) return "";

  const headers = options.headers ?? Object.keys(rows[0]);
  const escape = (val: unknown): string => {
    const str = val == null ? "" : String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const headerRow = headers.map(escape).join(",");
  const dataRows = rows.map((row) =>
    headers.map((h) => escape(row[h])).join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}

/** Create a downloadable CSV Response for API routes. */
export function csvResponse(
  csv: string,
  filename = "export.csv",
): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
