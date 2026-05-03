// components/download-dialog.jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, FileCode, Type } from "lucide-react"
import { downloadAsPDF, downloadAsDocx } from "@/lib/download-utils"

export function DownloadDialog({ isOpen, onClose, content }) {
  const fileName = "canvas-content";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Content</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button 
            variant="outline" 
            className="flex flex-col items-center gap-2 h-24"
            onClick={() => {
              downloadAsPDF(content, fileName);
              onClose();
            }}
          >
            <FileText className="w-8 h-8 text-red-500" />
            PDF Document
          </Button>
          
          <Button 
            variant="outline" 
            className="flex flex-col items-center gap-2 h-24"
            onClick={() => {
              downloadAsDocx(content, fileName);
              onClose();
            }}
          >
            <Type className="w-8 h-8 text-blue-500" />
            Word (.docx)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}