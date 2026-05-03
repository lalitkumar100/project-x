
// ========================================
//large-table-renderer.jsx
// ========================================
"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { downloadAsExcel } from "@/lib/download-utils"

export function LargeTableRenderer({ data, label, rows, columns }) {
  if (!data || data.length === 0) return null

  const tableColumns = Object.keys(data[0])
  const rowCount = rows || data.length
  const columnCount = columns || tableColumns.length

  // Use label for display and filename, fallback to defaults
  const displayLabel = label || "Large Dataset"
  const fileName = label ? label.toLowerCase().replace(/\s+/g, '-') : "large-table-data"

  return (
    <Card className="overflow-hidden">
      <div className="p-3 bg-primary/5 border-b border-border flex justify-between items-center">
        <span className="text-sm font-medium">
          {displayLabel} ({rowCount} rows × {columnCount} columns)
        </span>
        <Button
          variant="default"
          size="sm"
          className="gap-2"
          onClick={() => downloadAsExcel(data, fileName)}
        >
          <Download className="w-4 h-4" />
          Download Excel
        </Button>
      </div>
      <div className="overflow-auto max-h-[calc(100vh-200px)]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              {tableColumns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-medium text-foreground whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-t border-border hover:bg-muted/30 transition-colors">
                {tableColumns.map((col) => (
                  <td key={col} className="px-4 py-3 text-foreground whitespace-nowrap">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}