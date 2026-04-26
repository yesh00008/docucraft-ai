import jsPDF from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";

export type DocSection = { heading: string; paragraphs: string[] };
export type StructuredDoc = { title: string; sections: DocSection[] };

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "document";

export function downloadPDF(doc: StructuredDoc) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 56;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  const titleLines = pdf.splitTextToSize(doc.title, maxW);
  ensureSpace(titleLines.length * 26);
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 26 + 18;

  pdf.setDrawColor(180);
  pdf.line(margin, y, pageW - margin, y);
  y += 22;

  for (const sec of doc.sections) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    const hLines = pdf.splitTextToSize(sec.heading, maxW);
    ensureSpace(hLines.length * 18 + 8);
    pdf.text(hLines, margin, y);
    y += hLines.length * 18 + 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    for (const para of sec.paragraphs) {
      const lines = pdf.splitTextToSize(para, maxW);
      for (const line of lines) {
        ensureSpace(16);
        pdf.text(line, margin, y);
        y += 16;
      }
      y += 8;
    }
    y += 6;
  }

  pdf.save(`${slug(doc.title)}.pdf`);
}

export async function downloadDOCX(doc: StructuredDoc) {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: doc.title, bold: true, size: 44 })],
    }),
    new Paragraph({ children: [new TextRun("")] }),
  ];

  for (const sec of doc.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: sec.heading, bold: true, size: 28 })],
      }),
    );
    for (const para of sec.paragraphs) {
      children.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [new TextRun({ text: para, size: 22 })],
        }),
      );
    }
  }

  const wordDoc = new Document({
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(wordDoc);
  saveAs(blob, `${slug(doc.title)}.docx`);
}

export function docToText(doc: StructuredDoc): string {
  const parts = [doc.title, ""];
  for (const s of doc.sections) {
    parts.push(s.heading);
    for (const p of s.paragraphs) parts.push(p);
    parts.push("");
  }
  return parts.join("\n");
}