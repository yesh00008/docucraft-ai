import jsPDF from 'jspdf';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, Footer, PageNumber, TableOfContents, Header, BorderStyle,
} from 'docx';
import pptxgen from 'pptxgenjs';
import { saveAs } from 'file-saver';
import type { Chapter } from '../store/useAppStore';
import type { DocumentTheme } from './themes';
import type { CitationStyle, Source } from './citations';
import { formatReference } from './citations';

const stripMd = (s: string) =>
  s.replace(/[*_`#>]+/g, '').replace(/\n{3,}/g, '\n\n').trim();

// ---------- PDF ----------
export const exportPDF = async (
  title: string,
  chapters: Chapter[],
  theme: DocumentTheme,
  sources: Source[],
  style: CitationStyle,
  filename: string,
) => {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const margin = 64;
  const contentW = W - margin * 2;
  const lineH = 16;
  let y = margin;

  const useBorder = !!theme.showBorderFrame;
  const drawFrame = () => {
    if (!useBorder) return;
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.6);
    pdf.rect(margin / 2, margin / 2, W - margin, H - margin);
  };

  const newPage = () => {
    pdf.addPage();
    drawFrame();
    y = margin;
  };

  const ensure = (h: number) => { if (y + h > H - margin) newPage(); };

  const writePageNumber = (n: number, total: number) => {
    pdf.setPage(n);
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text(`${n} / ${total}`, W / 2, H - 24, { align: 'center' });
  };

  // Cover
  drawFrame();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(20);
  pdf.text(title, W / 2, H / 2 - 40, { align: 'center', maxWidth: contentW });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(100);
  pdf.text(new Date().toLocaleDateString(), W / 2, H / 2 + 10, { align: 'center' });

  // TOC
  newPage();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(20);
  pdf.text('Table of Contents', margin, y);
  y += 32;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  chapters.forEach((c, i) => {
    ensure(lineH + 4);
    const label = `${i + 1}. ${c.heading}`;
    pdf.text(label.length > 80 ? label.slice(0, 80) + '…' : label, margin, y);
    y += lineH + 4;
  });

  // Body
  for (const c of chapters) {
    newPage();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(20);
    const headLines = pdf.splitTextToSize(c.heading, contentW);
    pdf.text(headLines, margin, y);
    y += headLines.length * 22 + 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(40);
    const body = stripMd(c.content || c.synopsis || '');
    const paragraphs = body.split(/\n{2,}/);
    for (const p of paragraphs) {
      const lines = pdf.splitTextToSize(p, contentW);
      for (const line of lines) {
        ensure(lineH);
        pdf.text(line, margin, y);
        y += lineH;
      }
      y += 8;
    }
  }

  // References
  if (sources.length) {
    newPage();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('References', margin, y);
    y += 28;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    sources.forEach((s, i) => {
      const ref = `${i + 1}. ${formatReference(s, style)}`;
      const lines = pdf.splitTextToSize(ref, contentW);
      for (const line of lines) {
        ensure(lineH);
        pdf.text(line, margin, y);
        y += lineH;
      }
      y += 4;
    });
  }

  const total = pdf.getNumberOfPages();
  for (let i = 2; i <= total; i++) writePageNumber(i, total);

  pdf.save(filename);
};

// ---------- DOCX ----------
export const exportDOCX = async (
  title: string,
  chapters: Chapter[],
  _theme: DocumentTheme,
  sources: Source[],
  style: CitationStyle,
  filename: string,
) => {
  const headingStyle = { run: { font: 'Calibri', bold: true } };

  const titleP = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 4000, after: 200 },
    children: [new TextRun({ text: title, bold: true, size: 48, font: 'Calibri' })],
  });
  const dateP = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: new Date().toLocaleDateString(), color: '666666', size: 22 })],
  });
  const tocTitle = new Paragraph({
    pageBreakBefore: true,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Table of Contents', bold: true, size: 32 })],
  });
  const toc = new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-2' });

  const body: Paragraph[] = [];
  chapters.forEach((c) => {
    body.push(new Paragraph({
      pageBreakBefore: true,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
      children: [new TextRun({ text: c.heading, bold: true, size: 32 })],
    }));
    const text = stripMd(c.content || c.synopsis || '');
    text.split(/\n{2,}/).forEach((p) => {
      body.push(new Paragraph({
        spacing: { after: 160, line: 320 },
        children: [new TextRun({ text: p, size: 22, font: 'Calibri' })],
      }));
    });
  });

  if (sources.length) {
    body.push(new Paragraph({
      pageBreakBefore: true,
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'References', bold: true, size: 32 })],
    }));
    sources.forEach((s, i) => {
      body.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: `${i + 1}. ${formatReference(s, style)}`, size: 20 })],
      }));
    });
  }

  const footer = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], size: 18, color: '888888' }),
      ],
    })],
  });

  const doc = new Document({
    styles: { paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { ...headingStyle.run, size: 32 },
        paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
    ]},
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      footers: { default: footer },
      children: [titleP, dateP, tocTitle, new Paragraph({ children: [toc] }), ...body],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};

// ---------- PPTX from outline/chapters ----------
export const exportPPTXFromChapters = async (
  title: string,
  chapters: Chapter[],
  theme: DocumentTheme,
  filename: string,
) => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  const bgHex = theme.bg.replace('#', '');
  const textHex = theme.text.replace('#', '');
  const accentHex = theme.accent.replace('#', '');

  // Title slide
  const t = pres.addSlide();
  t.background = { color: bgHex };
  t.addText(title, { x: 0.6, y: 2.0, w: 12.0, h: 1.4, fontSize: 44, bold: true, color: textHex, align: 'center' });
  t.addText(new Date().toLocaleDateString(), { x: 0.6, y: 3.6, w: 12.0, h: 0.5, fontSize: 18, color: accentHex, align: 'center' });

  // TOC slide
  const toc = pres.addSlide();
  toc.background = { color: bgHex };
  toc.addText('Contents', { x: 0.6, y: 0.4, w: 12, h: 0.7, fontSize: 30, bold: true, color: textHex });
  const tocLines = chapters.map((c, i) => ({
    text: `${i + 1}. ${c.heading}`,
    options: { bullet: false, color: textHex, fontSize: 16, breakLine: true },
  }));
  toc.addText(tocLines, { x: 0.6, y: 1.2, w: 12, h: 6, fontSize: 16, color: textHex, valign: 'top' });

  // Chapter slides
  chapters.forEach((c, idx) => {
    const s = pres.addSlide();
    s.background = { color: bgHex };
    s.addText(`Chapter ${idx + 1}`, { x: 0.6, y: 0.35, w: 12, h: 0.4, fontSize: 13, color: accentHex, bold: true });
    s.addText(c.heading, { x: 0.6, y: 0.75, w: 12, h: 0.9, fontSize: 30, bold: true, color: textHex });
    const bullets = (c.subpoints && c.subpoints.length
      ? c.subpoints
      : stripMd(c.synopsis || c.content || '').split(/\n+/).filter(Boolean).slice(0, 5)
    ).slice(0, 6);
    s.addText(
      bullets.map(b => ({ text: b, options: { bullet: true, color: textHex, fontSize: 16, breakLine: true } })),
      { x: 0.6, y: 1.8, w: 12, h: 4.8, color: textHex, valign: 'top' },
    );
    s.addText(`${idx + 2} / ${chapters.length + 2}`, {
      x: 11.0, y: 6.9, w: 1.8, h: 0.3, fontSize: 10, color: accentHex, align: 'right',
    });
  });

  await pres.writeFile({ fileName: filename });
};
