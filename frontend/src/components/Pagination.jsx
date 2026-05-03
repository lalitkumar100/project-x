import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Pagination
 * ----------
 * Sticky bottom pagination bar.
 */
export function Pagination({ currentPage, totalPages, totalItems, onChange }) {
  return (
    <div className="sticky bottom-0 bg-theme-100 border-t border-gray-200 p-4">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => onChange((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-2 bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>

        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages} ({totalItems} items)
        </span>

        <Button
          variant="outline"
          onClick={() => onChange((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="flex items-center gap-2 bg-transparent"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}