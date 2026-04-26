import pptxgen from "pptxgenjs";
import { saveAs } from "file-saver";

export type Slide = { title: string; bullets: string[]; notes: string };
export type Deck = { title: string; subtitle: string; slides: Slide[] };

export type SlideThemeId = "midnight" | "editorial" | "minimal" | "corporate";

type SlideTheme = {
  bg: string;
  title: string;
  body: string;
  accent: string;
  titleFont: string;
  bodyFont: string;
};

const SLIDE_THEMES: Record<SlideThemeId, SlideTheme> = {
  midnight: { bg: "0F1028", title: "F0F2FF", body: "C9CDEB", accent: "7C83FF", titleFont: "Calibri", bodyFont: "Calibri" },
  editorial: { bg: "FAF7F2", title: "1A1612", body: "2D2A26", accent: "B85042", titleFont: "Georgia", bodyFont: "Georgia" },
  minimal: { bg: "FFFFFF", title: "111111", body: "333333", accent: "111111", titleFont: "Calibri", bodyFont: "Calibri" },
  corporate: { bg: "F4F6FA", title: "0F1B3D", body: "1E2337", accent: "1E3A5F", titleFont: "Calibri", bodyFont: "Calibri" },
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "slides";

export async function downloadPPTX(deck: Deck, themeId: SlideThemeId = "midnight") {
  const t = SLIDE_THEMES[themeId];
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in

  // Title slide
  const title = pres.addSlide();
  title.background = { color: t.bg };
  title.addShape(pres.ShapeType.rect, { x: 0, y: 7.0, w: 13.33, h: 0.08, fill: { color: t.accent } });
  title.addText(deck.title, {
    x: 0.7, y: 2.6, w: 12, h: 1.6, fontSize: 44, bold: true,
    color: t.title, fontFace: t.titleFont, valign: "middle",
  });
  if (deck.subtitle) {
    title.addText(deck.subtitle, {
      x: 0.7, y: 4.2, w: 12, h: 0.8, fontSize: 20,
      color: t.body, fontFace: t.bodyFont, valign: "top",
    });
  }

  // Content slides
  for (const s of deck.slides) {
    const slide = pres.addSlide();
    slide.background = { color: t.bg };
    slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 0.6, w: 0.08, h: 0.6, fill: { color: t.accent } });
    slide.addText(s.title, {
      x: 0.8, y: 0.5, w: 12, h: 0.8, fontSize: 28, bold: true,
      color: t.title, fontFace: t.titleFont,
    });
    const bullets = (s.bullets || []).map((b) => ({ text: b, options: { bullet: true } }));
    slide.addText(bullets as any, {
      x: 0.8, y: 1.5, w: 12, h: 5.5, fontSize: 18,
      color: t.body, fontFace: t.bodyFont, paraSpaceAfter: 8, valign: "top",
    });
    slide.addText(`${s.title}`, {
      x: 0.5, y: 7.05, w: 12.3, h: 0.3, fontSize: 9,
      color: t.accent, fontFace: t.bodyFont, align: "right",
    });
    if (s.notes) slide.addNotes(s.notes);
  }

  const blob = (await pres.write({ outputType: "blob" })) as Blob;
  saveAs(blob, `${slug(deck.title)}.pptx`);
}