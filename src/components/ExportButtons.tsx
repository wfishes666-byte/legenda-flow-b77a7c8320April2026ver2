import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { exportToCSV, exportToPDF, type ExportColumn } from '@/lib/exportUtils';

export interface ExportButtonsProps<T> {
  filename: string;
  title: string;
  subtitle?: string;
  columns: ExportColumn<T>[];
  rows: T[];
  /** Defaults to 'portrait' */
  orientation?: 'portrait' | 'landscape';
  /** Optional: hide individual buttons */
  hideCsv?: boolean;
  hidePdf?: boolean;
  /** Optional: extra UI between buttons (e.g. selectors) */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButtons<T>({
  filename, title, subtitle, columns, rows, orientation, hideCsv, hidePdf, size = 'sm',
}: ExportButtonsProps<T>) {
  const handleCsv = () => exportToCSV(filename, columns, rows);
  const handlePdf = () => exportToPDF({ filename, title, subtitle, columns, rows, orientation });
  const disabled = rows.length === 0;
  return (
    <div className="flex gap-2">
      {!hideCsv && (
        <Button variant="outline" size={size} onClick={handleCsv} disabled={disabled}>
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      )}
      {!hidePdf && (
        <Button variant="outline" size={size} onClick={handlePdf} disabled={disabled}>
          <FileText className="w-4 h-4 mr-1" /> PDF
        </Button>
      )}
    </div>
  );
}
