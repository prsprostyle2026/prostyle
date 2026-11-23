// CSV downloads for staff reports.

// CSV cell: quote everything, double any quotes, and neutralise spreadsheet formulas.
function cell(v: string | number) {
  let s = String(v);
  if (/^[=+\-@]/.test(s) && typeof v === "string") s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export const toCsv = (rows: (string | number)[][]) => rows.map((r) => r.map(cell).join(",")).join("\r\n");

// A CSV file download. Leading BOM so Excel opens it as UTF-8.
export function csvResponse(rows: (string | number)[][], fileName: string) {
  return new Response("﻿" + toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
