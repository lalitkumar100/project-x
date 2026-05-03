// ========================================
// FILE 1: canvas-panel.jsx
// ========================================
"use client"

import { Download, X, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AITextRenderer } from "./ai-text-renderer"
import { LargeTableRenderer } from "./large-table-renderer"
import { useState } from "react"
import { DownloadDialog } from "@/components/download-dialog"

export function CanvasPanel({ isOpen, content, contentType, isMobile, onClose }) {
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isOpen) return null

  const panelClasses = isMobile
    ? "fixed inset-0 z-[60] bg-background"
    : isExpanded
      ? "fixed left-0 top-0 h-screen w-[100%] bg-background border-r border-border shadow-2xl z-400"
      : "fixed right-0 top-0 h-screen w-[40%] bg-background border-r border-border shadow-2xl z-400"

  return (
    <>
      <div className={`${panelClasses} flex flex-col animate-in slide-in-from-left duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
          <h2 className="text-lg font-semibold">Canvas View</h2>
          <div className="flex gap-2">
            {!isMobile && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    Expand
                  </>
                )}
              </Button>
            )}
            {contentType === "text" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                onClick={() => setShowDownloadDialog(true)}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {contentType === "text" ? (
            <Card className="p-6">
              <AITextRenderer content={content} />
            </Card>
          ) : (
            // Render multiple tables if content is an array
            <div className="space-y-6">
              {Array.isArray(content) ? (
                content.map((table, idx) => (
                  <LargeTableRenderer 
                    key={idx} 
                    data={table.data} 
                    label={table.label}
                    rows={table.rows}
                    columns={table.columns}
                  />
                ))
              ) : (
                // Fallback for single table (backward compatibility)
                <LargeTableRenderer 
                  data={content.data} 
                  label={content.label}
                  rows={content.rows}
                  columns={content.columns}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <DownloadDialog isOpen={showDownloadDialog} onClose={() => setShowDownloadDialog(false)} content={content} />
    </>
  )
}

