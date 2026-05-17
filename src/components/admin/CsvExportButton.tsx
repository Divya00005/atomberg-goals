'use client';

import { useState } from 'react';
import { exportCsvData } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

export default function CsvExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const res = await exportCsvData();
      
      if (!res.success || !res.data) {
        setError(res.error || 'Failed to generate export data.');
        setIsExporting(false);
        return;
      }

      // Convert JSON array to CSV string
      const csv = Papa.unparse(res.data);

      // Create Blob and trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `goal_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      setError('An unexpected error occurred during export.');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {error && (
        <span className="text-red-400 text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </span>
      )}
      <Button
        onClick={handleExport}
        disabled={isExporting}
        size="sm"
        className="bg-violet-600 hover:bg-violet-500 text-white gap-2 rounded-lg shadow-lg shadow-violet-500/20 border-0"
      >
        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Export CSV Report
      </Button>
    </div>
  );
}
