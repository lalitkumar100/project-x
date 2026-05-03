"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { downloadAsExcel } from "@/lib/download-utils"

export function SmallTableRenderer({ data, label }) {
  if (!data || data.length === 0) return null

  const columns = Object.keys(data[0])
  const rowCount = data.length

  // Use label for display and filename, fallback to "table-data"
  const displayLabel = label || "Results"
  const fileName = label ? label.toLowerCase().replace(/\s+/g, '-') : "table-data"

  return (
    <Card className="overflow-hidden">
      <div className="p-2 bg-primary/5 border-b border-border flex justify-between items-center">
        <span className="text-sm font-medium">{displayLabel} ({rowCount} rows)</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2" 
          onClick={() => downloadAsExcel(data, fileName)}
        >
          <Download className="w-3 h-3" />
          Excel
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left font-medium text-foreground">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-t border-border hover:bg-muted/30 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 text-foreground">
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