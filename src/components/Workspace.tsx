import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, FileText, FileDown, Loader2, Send, Undo2, Redo2,
  Palette, BookOpen, Presentation, MessagesSquare, Plus, Trash2,
  Pencil, Wand2, Download, StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  downloadPDF, downloadDOCX, docToText, type StructuredDoc,
} from "@/lib/documentExport";
import { THEMES, THEME_LIST, type ThemeId } from "@/lib/documentThemes";
import { parsePlainDoc, pageEstimate, wordCount } from "@/lib/parseDocument";
import { streamDocChat, type ChatMsg } from "@/lib/streamChat";
import { fetchOutline, fetchChapter, mergeChapter, type Outline } from "@/lib/longform";
import { downloadPPTX, type Deck, type SlideThemeId } from "@/lib/slidesExport";

const SUGGESTIONS = [
  "A 1-page business proposal for a sustainable coffee subscription service",
  "Project status report for a mobile app launch (Q3 update)",
  "Employee onboarding handbook for a remote-first design studio",
  "Research brief on the impact of AI on small business productivity",
];

/* ---------------- Document Workspace (Chat + Live Doc) ---------------- */

function DocumentWorkspace() {
  const [doc, setDoc] = useState<StructuredDoc | null>(null);
  const [history, setHistory] = useState<StructuredDoc[]>([]);
  const [redoStack, setRedoStack] = useState<StructuredDoc[]>([]);
  const [theme, setTheme] = useState<ThemeId>("midnight");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamMode, setStreamMode] = useState<"DOC" | "CHAT" | null>(null);
  const [streamBuffer, setStreamBuffer] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const docScrollRef = useRef<HTMLDivElement>(null);

  const themeObj = THEMES[theme];
  const pages = doc ? pageEstimate(doc) : 0;
  const words = doc ? wordCount(doc) : 0;

  useEffect(() => {
    if (streamMode === "DOC" && docScrollRef.current) {
      docScrollRef.current.scrollTop = docScrollRef.current.scrollHeight;
    }
  }, [streamBuffer, streamMode]);

  function commitDoc(next: StructuredDoc) {
    setHistory((h) => (doc ? [...h, doc].slice(-50) : h));
    setRedoStack([]);
    setDoc(next);
  }

  function undo() {
    setHistory((h) => {
      if (!h.length || !doc) return h;
      const prev = h[h.length - 1];
      setRedoStack((r) => [...r, doc]);
      setDoc(prev);
      return h.slice(0, -1);
    });
  }
  function redo() {
    setRedoStack((r) => {
      if (!r.length || !doc) return r;
      const next = r[r.length - 1];
      setHistory((h) => [...h, doc]);
      setDoc(next);
      return r.slice(0, -1);
    });
  }

  async function send() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    const userMsg: ChatMsg = { role: "user", content: text };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setStreamBuffer("");
    setStreamMode(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let buf = "";
    let mode: "DOC" | "CHAT" | null = null;
    try {
      await streamDocChat({
        messages: nextMsgs,
        document: doc ? docToText(doc) : "",
        signal: controller.signal,
        onMode: (m) => { mode = m; setStreamMode(m); },
        onDelta: (chunk) => {
          buf += chunk;
          setStreamBuffer(buf);
        },
        onDone: () => {},
      });

      if (mode === "DOC") {
        const parsed = parsePlainDoc(buf, doc?.title || "Untitled Document");
        commitDoc(parsed);
        setMessages((m) => [...m, { role: "assistant", content: "Document updated." }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: buf || "(no reply)" }]);
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error(e.message || "Streaming failed");
      }
    } finally {
      setIsStreaming(false);
      setStreamBuffer("");
      setStreamMode(null);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function generateFresh(prompt: string) {
    if (!prompt.trim()) return;
    setIsStreaming(true);
    try {
      const { data, error } = await supabase.functions.invoke("document-ai", {
        body: { prompt },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const next = { title: data.title, sections: data.sections } as StructuredDoc;
      commitDoc(next);
      setMessages([
        { role: "user", content: prompt },
        { role: "assistant", content: "Initial draft created. Tell me what to refine." },
      ]);
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setIsStreaming(false);
    }
  }

  /* ----- Editing inline ----- */
  function updateTitle(v: string) {
    if (!doc) return;
    commitDoc({ ...doc, title: v });
  }
  function updateHeading(idx: number, v: string) {
    if (!doc) return;
    const sections = doc.sections.map((s, i) => i === idx ? { ...s, heading: v } : s);
    commitDoc({ ...doc, sections });
  }
  function updatePara(si: number, pi: number, v: string) {
    if (!doc) return;
    const sections = doc.sections.map((s, i) =>
      i === si ? { ...s, paragraphs: s.paragraphs.map((p, j) => j === pi ? v : p) } : s,
    );
    commitDoc({ ...doc, sections });
  }
  function addSection() {
    if (!doc) return;
    commitDoc({ ...doc, sections: [...doc.sections, { heading: "New Section", paragraphs: ["Write here…"] }] });
  }
  function removeSection(i: number) {
    if (!doc) return;
    commitDoc({ ...doc, sections: doc.sections.filter((_, j) => j !== i) });
  }

  /* ----- Render ----- */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[calc(100vh-180px)]">
      {/* CHAT PANE */}
      <div className="flex flex-col rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden shadow-elevated">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <MessagesSquare className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold">AI Co-writer</span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={undo} disabled={!history.length} title="Undo">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={redo} disabled={!redoStack.length} title="Redo">
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-3">
          <AnimatePresence initial={false}>
            {messages.length === 0 && !isStreaming && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground space-y-3">
                <p>Describe the document you need. I'll draft it, then we can refine together.</p>
                <div className="space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => generateFresh(s)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-primary/60 hover:bg-primary/5 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-3 text-sm rounded-xl px-3 py-2 ${
                  m.role === "user" ? "bg-primary/15 border border-primary/30" : "bg-muted/40 border border-border"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  {m.role === "user" ? "You" : "AI"}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </motion.div>
            ))}
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-3 text-sm rounded-xl px-3 py-2 bg-muted/40 border border-border"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> AI {streamMode === "DOC" ? "rewriting document…" : "thinking…"}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {streamMode === "CHAT" ? streamBuffer : streamMode === "DOC" ? "Streaming changes into the document on the right →" : "…"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        <div className="p-3 border-t border-border">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder={doc ? "Ask AI to rewrite, expand, restructure…" : "Describe the document to create…"}
              className="min-h-[60px] max-h-[140px] resize-none bg-background/60"
            />
            {isStreaming ? (
              <Button size="icon" variant="destructive" onClick={stop}><StopCircle className="h-4 w-4" /></Button>
            ) : (
              <Button size="icon" onClick={() => doc ? send() : generateFresh(input)} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* DOCUMENT PANE */}
      <div className="flex flex-col rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden shadow-elevated">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-display font-semibold truncate">{doc?.title || "No document yet"}</span>
            {doc && (
              <span className="text-xs text-muted-foreground font-mono-ui flex-shrink-0">
                ~{pages} pg · {words} w
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Palette className="h-4 w-4 mr-2" />{themeObj.label}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Document theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {THEME_LIST.map((t) => (
                  <DropdownMenuItem key={t.id} onClick={() => setTheme(t.id)}>
                    <div className="flex flex-col">
                      <span className="text-sm">{t.label}</span>
                      <span className="text-xs text-muted-foreground">{t.description}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={!doc}><Download className="h-4 w-4 mr-2" />Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => doc && downloadPDF(doc, theme)}>PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => doc && downloadDOCX(doc, theme)}>Word (.docx)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div
          ref={docScrollRef}
          className="flex-1 overflow-y-auto"
          style={{
            background: themeObj.pageBg,
            color: themeObj.pageText,
            fontFamily: themeObj.bodyFont,
          }}
        >
          <div className="max-w-3xl mx-auto px-10 py-12 min-h-full">
            {!doc && !isStreaming && (
              <div className="text-center text-muted-foreground py-32">
                <Sparkles className="h-10 w-10 mx-auto mb-4 opacity-60" />
                <p>Your document will appear here as the AI writes it.</p>
              </div>
            )}

            {streamMode === "DOC" && isStreaming && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose-mimic">
                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{streamBuffer || "…"}</pre>
              </motion.div>
            )}

            {doc && !(streamMode === "DOC" && isStreaming) && (
              <motion.article
                key={doc.title + doc.sections.length}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Input
                  value={doc.title}
                  onChange={(e) => updateTitle(e.target.value)}
                  className="text-3xl md:text-4xl font-bold border-0 bg-transparent px-0 mb-6 h-auto"
                  style={{ fontFamily: themeObj.titleFont, color: themeObj.pageText }}
                />
                <div className="h-px mb-8" style={{ background: themeObj.accent, opacity: 0.5 }} />

                {doc.sections.map((s, si) => (
                  <section key={si} className="mb-8 group">
                    <div className="flex items-center gap-2">
                      <Input
                        value={s.heading}
                        onChange={(e) => updateHeading(si, e.target.value)}
                        className="text-xl font-semibold border-0 bg-transparent px-0 h-auto mb-3"
                        style={{ fontFamily: themeObj.titleFont, color: themeObj.accent }}
                      />
                      <Button
                        size="icon" variant="ghost"
                        className="opacity-0 group-hover:opacity-100 h-7 w-7"
                        onClick={() => removeSection(si)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {s.paragraphs.map((p, pi) => (
                      <Textarea
                        key={pi}
                        value={p}
                        onChange={(e) => updatePara(si, pi, e.target.value)}
                        className="border-0 bg-transparent px-0 py-1 mb-3 text-base leading-relaxed resize-none min-h-[60px]"
                        style={{ fontFamily: themeObj.bodyFont, color: themeObj.pageText }}
                      />
                    ))}
                  </section>
                ))}

                <Button variant="outline" size="sm" onClick={addSection} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" /> Add section
                </Button>
              </motion.article>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Long-Form Studio (outline → chapters) ---------------- */

function LongFormStudio() {
  const [topic, setTopic] = useState("");
  const [pages, setPages] = useState(50);
  const [audience, setAudience] = useState("general professional readers");
  const [outline, setOutline] = useState<Outline | null>(null);
  const [doc, setDoc] = useState<StructuredDoc | null>(null);
  const [theme, setTheme] = useState<ThemeId>("editorial");
  const [outlining, setOutlining] = useState(false);
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentChapter, setCurrentChapter] = useState<string>("");
  const cancelRef = useRef(false);

  const themeObj = THEMES[theme];
  const wordsPerChapter = useMemo(() => {
    if (!outline) return 600;
    return Math.max(400, Math.min(1400, Math.round((pages * 300) / outline.chapters.length)));
  }, [outline, pages]);

  async function planOutline() {
    if (!topic.trim()) return;
    setOutlining(true);
    setOutline(null);
    setDoc(null);
    try {
      const o = await fetchOutline(topic, pages, audience);
      setOutline(o);
    } catch (e: any) {
      toast.error(e.message || "Outline failed");
    } finally {
      setOutlining(false);
    }
  }

  async function buildAll() {
    if (!outline) return;
    setBuilding(true);
    cancelRef.current = false;
    let working: StructuredDoc = { title: outline.title, sections: [] };
    setDoc(working);
    let priorContext = "";
    for (let i = 0; i < outline.chapters.length; i++) {
      if (cancelRef.current) break;
      const ch = outline.chapters[i];
      setCurrentChapter(`Chapter ${i + 1}: ${ch.heading}`);
      try {
        const text = await fetchChapter(outline.title, ch, wordsPerChapter, priorContext);
        working = mergeChapter(working, text);
        setDoc({ ...working });
        priorContext = `Last chapter recap: ${ch.heading} — ${ch.synopsis}`.slice(0, 500);
      } catch (e: any) {
        toast.error(`Ch ${i + 1} failed: ${e.message}`);
        break;
      }
      setProgress(((i + 1) / outline.chapters.length) * 100);
    }
    setBuilding(false);
    setCurrentChapter("");
  }

  function cancel() { cancelRef.current = true; }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4 h-[calc(100vh-180px)]">
      <div className="flex flex-col rounded-2xl border border-border bg-card/60 overflow-hidden shadow-elevated">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold">Long-form Builder</span>
        </div>
        <ScrollArea className="flex-1 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Topic / brief</label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. A practical guide to building resilient SaaS infrastructure on AWS, covering architecture, observability, security, and incident response."
              className="min-h-[120px] bg-background/60"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Target pages: <span className="font-mono-ui text-foreground">{pages}</span></label>
            <Slider value={[pages]} onValueChange={(v) => setPages(v[0])} min={5} max={200} step={5} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Audience</label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} className="bg-background/60" />
          </div>

          <Button onClick={planOutline} disabled={outlining || building || !topic.trim()} className="w-full">
            {outlining ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Planning…</> : <><Wand2 className="h-4 w-4 mr-2" />Plan outline</>}
          </Button>

          {outline && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{outline.chapters.length} chapters · ~{wordsPerChapter} w each</span>
                {!building ? (
                  <Button size="sm" onClick={buildAll}>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Build all
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={cancel}>Cancel</Button>
                )}
              </div>
              {building && (
                <div className="text-xs">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-muted-foreground mt-1.5">{currentChapter}</div>
                </div>
              )}
              <div className="space-y-1 mt-2">
                {outline.chapters.map((c, i) => (
                  <div key={i} className="text-xs px-2 py-1.5 rounded border border-border bg-background/40">
                    <div className="font-medium">{i + 1}. {c.heading}</div>
                    <div className="text-muted-foreground line-clamp-2">{c.synopsis}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex flex-col rounded-2xl border border-border bg-card/60 overflow-hidden shadow-elevated">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold truncate">{doc?.title || outline?.title || "Outline & document"}</span>
            {doc && <span className="text-xs text-muted-foreground font-mono-ui">~{pageEstimate(doc)} pg · {wordCount(doc)} w</span>}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Palette className="h-4 w-4 mr-2" />{themeObj.label}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {THEME_LIST.map((t) => (
                  <DropdownMenuItem key={t.id} onClick={() => setTheme(t.id)}>{t.label}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={!doc}><Download className="h-4 w-4 mr-2" />Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => doc && downloadPDF(doc, theme)}>PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => doc && downloadDOCX(doc, theme)}>Word (.docx)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ background: themeObj.pageBg, color: themeObj.pageText, fontFamily: themeObj.bodyFont }}>
          <div className="max-w-3xl mx-auto px-10 py-12">
            {!doc && (
              <div className="text-center text-muted-foreground py-32">
                <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-60" />
                <p>Plan an outline, then build all chapters. Pages stream in as they're written.</p>
              </div>
            )}
            {doc && (
              <article>
                <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: themeObj.titleFont }}>{doc.title}</h1>
                <div className="h-px mb-8" style={{ background: themeObj.accent, opacity: 0.5 }} />
                {doc.sections.map((s, i) => (
                  <section key={i} className="mb-6">
                    <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: themeObj.titleFont, color: themeObj.accent }}>{s.heading}</h2>
                    {s.paragraphs.map((p, j) => (
                      <p key={j} className="mb-3 leading-relaxed">{p}</p>
                    ))}
                  </section>
                ))}
              </article>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Slides Studio ---------------- */

function SlidesStudio() {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(12);
  const [audience, setAudience] = useState("executives");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [theme, setTheme] = useState<SlideThemeId>("midnight");
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("slides-ai", {
        body: { topic, slideCount: count, audience },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setDeck(data as Deck);
    } catch (e: any) {
      toast.error(e.message || "Slides failed");
    } finally {
      setBusy(false);
    }
  }

  function updateSlide(i: number, patch: Partial<Deck["slides"][number]>) {
    if (!deck) return;
    const slides = deck.slides.map((s, j) => j === i ? { ...s, ...patch } : s);
    setDeck({ ...deck, slides });
  }
  function updateBullet(si: number, bi: number, v: string) {
    if (!deck) return;
    const slides = deck.slides.map((s, j) => j === si ? { ...s, bullets: s.bullets.map((b, k) => k === bi ? v : b) } : s);
    setDeck({ ...deck, slides });
  }

  const slideThemes: { id: SlideThemeId; label: string; bg: string; fg: string; accent: string }[] = [
    { id: "midnight", label: "Midnight", bg: "#0F1028", fg: "#F0F2FF", accent: "#7C83FF" },
    { id: "editorial", label: "Editorial", bg: "#FAF7F2", fg: "#1A1612", accent: "#B85042" },
    { id: "minimal", label: "Minimal", bg: "#FFFFFF", fg: "#111111", accent: "#111111" },
    { id: "corporate", label: "Corporate", bg: "#F4F6FA", fg: "#0F1B3D", accent: "#1E3A5F" },
  ];
  const t = slideThemes.find((s) => s.id === theme)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 h-[calc(100vh-180px)]">
      <div className="flex flex-col rounded-2xl border border-border bg-card/60 overflow-hidden shadow-elevated">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Presentation className="h-4 w-4 text-primary" />
          <span className="font-display font-semibold">Slides Studio</span>
        </div>
        <ScrollArea className="flex-1 p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Deck topic</label>
            <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Q4 product strategy review for the leadership team" className="min-h-[100px] bg-background/60" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Slides: <span className="font-mono-ui text-foreground">{count}</span></label>
            <Slider value={[count]} onValueChange={(v) => setCount(v[0])} min={5} max={40} step={1} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Audience</label>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} className="bg-background/60" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {slideThemes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setTheme(s.id)}
                  className={`text-left rounded-lg border p-2 transition ${theme === s.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"}`}
                  style={{ background: s.bg, color: s.fg }}
                >
                  <div className="text-xs font-semibold">{s.label}</div>
                  <div className="h-1 mt-1.5 rounded" style={{ background: s.accent }} />
                </button>
              ))}
            </div>
          </div>
          <Button onClick={generate} disabled={busy || !topic.trim()} className="w-full">
            {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4 mr-2" />Generate deck</>}
          </Button>
          {deck && (
            <Button variant="outline" onClick={() => downloadPPTX(deck, theme)} className="w-full">
              <Download className="h-4 w-4 mr-2" /> Download .pptx
            </Button>
          )}
        </ScrollArea>
      </div>

      <div className="flex flex-col rounded-2xl border border-border bg-card/60 overflow-hidden shadow-elevated">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="font-display font-semibold truncate">{deck?.title || "Deck preview"}</span>
          {deck && <span className="text-xs text-muted-foreground">{deck.slides.length} slides</span>}
        </div>
        <ScrollArea className="flex-1 p-6">
          {!deck && (
            <div className="text-center text-muted-foreground py-32">
              <Presentation className="h-10 w-10 mx-auto mb-4 opacity-60" />
              <p>Generate a deck to preview slides here. Edit titles and bullets, then export to .pptx.</p>
            </div>
          )}
          {deck && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="aspect-video rounded-xl p-6 flex flex-col justify-center shadow-glow"
                style={{ background: t.bg, color: t.fg }}
              >
                <div className="text-2xl font-bold leading-tight">{deck.title}</div>
                <div className="text-sm mt-2 opacity-80">{deck.subtitle}</div>
                <div className="h-0.5 mt-4 w-16" style={{ background: t.accent }} />
              </motion.div>
              {deck.slides.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="aspect-video rounded-xl p-5 flex flex-col shadow-elevated overflow-hidden"
                  style={{ background: t.bg, color: t.fg }}
                >
                  <Input
                    value={s.title}
                    onChange={(e) => updateSlide(i, { title: e.target.value })}
                    className="border-0 bg-transparent px-0 h-auto text-base font-bold mb-2"
                    style={{ color: t.fg }}
                  />
                  <div className="h-0.5 w-10 mb-2" style={{ background: t.accent }} />
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {s.bullets.map((b, bi) => (
                      <div key={bi} className="flex gap-1.5 text-xs items-start">
                        <span style={{ color: t.accent }}>•</span>
                        <Input
                          value={b}
                          onChange={(e) => updateBullet(i, bi, e.target.value)}
                          className="border-0 bg-transparent px-0 h-auto text-xs flex-1"
                          style={{ color: t.fg }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] opacity-60 mt-2 line-clamp-2">📝 {s.notes}</div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

/* ---------------- Root ---------------- */

export default function Workspace() {
  return (
    <div className="min-h-screen bg-background bg-aurora">
      <header className="px-6 py-5 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">Loom</div>
            <div className="text-xs text-muted-foreground">AI document studio</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground hidden md:block">
          Powered by Lovable AI · free models
        </div>
      </header>

      <Tabs defaultValue="document" className="px-6 pt-4">
        <TabsList className="bg-card/60 border border-border">
          <TabsTrigger value="document"><MessagesSquare className="h-3.5 w-3.5 mr-1.5" />Document + Chat</TabsTrigger>
          <TabsTrigger value="longform"><BookOpen className="h-3.5 w-3.5 mr-1.5" />Long-form (up to 200 pg)</TabsTrigger>
          <TabsTrigger value="slides"><Presentation className="h-3.5 w-3.5 mr-1.5" />Slides</TabsTrigger>
        </TabsList>
        <TabsContent value="document" className="mt-4"><DocumentWorkspace /></TabsContent>
        <TabsContent value="longform" className="mt-4"><LongFormStudio /></TabsContent>
        <TabsContent value="slides" className="mt-4"><SlidesStudio /></TabsContent>
      </Tabs>
    </div>
  );
}