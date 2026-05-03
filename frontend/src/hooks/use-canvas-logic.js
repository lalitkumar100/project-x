import { useMemo } from "react"

export function useCanvasLogic(response) {
  return useMemo(() => {
    if (!response) {
      return {
        shouldOpenCanvas: false,
        canvasContent: null,
        canvasContentType: "text",
        tableData: null,
        showTableInMain: false,
      }
    }

    const { ai_text, from_database, canvas } = response

    // Rule 1: Forced Canvas Content (to_canvas overrides everything)
    if (ai_text?.to_canvas !== null && ai_text?.to_canvas !== undefined) {
      return {
        shouldOpenCanvas: true,
        canvasContent: ai_text.to_canvas,
        canvasContentType: "text",
        tableData: null,
        showTableInMain: false,
      }
    }

    // Rule 2: Database Table Placement
    if (from_database) {
      const { rows, columns, data } = from_database
      const isSmallTable = rows <= 10 && columns <= 5

      if (isSmallTable) {
        return {
          shouldOpenCanvas: false,
          canvasContent: null,
          canvasContentType: "table",
          tableData: from_database,
          showTableInMain: true,
        }
      } else {
        return {
          shouldOpenCanvas: true,
          canvasContent: from_database,
          canvasContentType: "table",
          tableData: from_database,
          showTableInMain: false,
        }
      }
    }

    // Rule 3: Canvas Boolean Flag
    if (canvas === true) {
      return {
        shouldOpenCanvas: true,
        canvasContent: ai_text?.before_database || ai_text?.after_database || "",
        canvasContentType: "text",
        tableData: null,
        showTableInMain: false,
      }
    }

    // Default: No canvas
    return {
      shouldOpenCanvas: false,
      canvasContent: null,
      canvasContentType: "text",
      tableData: null,
      showTableInMain: false,
    }
  }, [response])
}

