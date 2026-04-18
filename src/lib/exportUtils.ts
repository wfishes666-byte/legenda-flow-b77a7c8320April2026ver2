import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export type ExportColumn<T> = {
  header: string;
  /** Field key OR a function returning the cell value */
  accessor: keyof T | ((row: T) => string | number | null | undefined);
};

const csvEscape = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

const getCell = <T>(row: T, accessor: ExportColumn<T>['accessor']) => {
  if (typeof accessor === 'function') return accessor(row);
  return (row as any)[accessor];
};

/** Trigger browser download of a CSV file built from rows + column defs. */
export function exportToCSV<T>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const headerLine = columns.map((c) => csvEscape(c.header)).join(',');
  const bodyLines = rows.map((row) =>
    columns.map((c) => csvEscape(getCell(row, c.accessor))).join(','),
  );
  // BOM so Excel (Indonesia / Windows) opens UTF-8 correctly
  const blob = new Blob(['\uFEFF' + [headerLine, ...bodyLines].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/** Build & download a PDF table report. */
export function exportToPDF<T>(opts: {
  filename: string;
  title: string;
  subtitle?: string;
  columns: ExportColumn<T>[];
  rows: T[];
  orientation?: 'portrait' | 'landscape';
}) {
  const { filename, title, subtitle, columns, rows, orientation = 'portrait' } = opts;
  const doc = new jsPDF({ orientation });
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(120);
  const meta = `Dicetak: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;
  doc.text(subtitle ? `${subtitle}  ·  ${meta}` : meta, 14, 25);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 30,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) =>
      columns.map((c) => {
        const v = getCell(row, c.accessor);
        return v === null || v === undefined ? '' : String(v);
      }),
    ),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 30, 30], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const formatRpExport = (v: number | null | undefined) =>
  `Rp ${(Number(v) || 0).toLocaleString('id-ID')}`;

export { triggerDownload };
