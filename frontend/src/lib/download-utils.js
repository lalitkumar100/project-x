// lib/download-utils.js
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

/**
 * EXCEL DOWNLOAD
 * Best for: Data tables and structured arrays
 */
export const downloadAsExcel = (data, fileName = "table-data") => {
  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Excel Export Error:", error);
  }
};

/**
 * PDF DOWNLOAD
 * Best for: Non-editable reports. 
 * Includes logic to wrap text and handle page overflow.
 */
export const downloadAsPDF = (content, fileName = "document") => {
  try {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth - margin * 2;
    
    // Split text into lines that fit the page width
    const lines = doc.splitTextToSize(content, maxLineWidth);
    
    let cursorY = margin + 10;

    lines.forEach((line) => {
      // Check if we need a new page
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin + 10;
      }
      doc.text(line, margin, cursorY);
      cursorY += 7; // Line height
    });

    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("PDF Export Error:", error);
  }
};

/**
 * DOCX DOWNLOAD
 * Best for: Editable text content.
 * Splits content into proper paragraphs for Word.
 */
export const downloadAsDocx = async (content, fileName = "document") => {
  try {
    // Split by newlines to create separate Word paragraphs
    const contentLines = content.split(/\r?\n/);
    
    const paragraphs = contentLines.map(line => {
      return new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 24, // 12pt font
            font: "Calibri"
          })
        ],
        spacing: {
          after: 200, // Space after paragraph
        }
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
  } catch (error) {
    console.error("DOCX Export Error:", error);
  }
};