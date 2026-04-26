import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  FileDown,
  Wand2,
  Loader2,
  Pencil,
  Check,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  downloadPDF,
  downloadDOCX,
  docToText,
  type StructuredDoc,
} from "@/lib/documentExport";

const SUGGESTIONS = [
  "A 1-page business proposal for a sustainable coffee subscription service",
  "Project status report for a mobile app launch (Q3 update)",
  "Employee onboarding handbook for a remote-first design studio",
  "Research brief on the impact of AI on small business productivity",
];

export default function DocumentGenerator() {
  const [prompt, setPrompt] = useState("");
  const [doc, setDoc] = useState<StructuredDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [refineInstr, setRefineInstr] = useState(
    "Improve clarity, fix grammar, and tighten the tone.",
  );

  const callFn = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("document-ai", {
      body,
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as StructuredDoc & { raw: string };
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Enter a topic first");
      return;
    }
    setLoading(true);
    try {
      const result = await callFn({ mode: "generate", prompt });
      setDoc({ title: result.title, sections: result.sections });
      toast.success("Document ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!doc) return;
    setRefining(true);
    try {
      const result = await callFn({
        mode: "refine",
        document: docToText(doc),
        instruction: refineInstr,
      });
      setDoc({ title: result.title, sections: result.sections });
      toast.success("Document refined");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refine failed");
    } finally {
      setRefining(false);
    }
  };

  const updateSectionHeading = (i: number, v: string) => {
    if (!doc) return;
    const next = { ...doc, sections: doc.sections.map((s, idx) => (idx === i ? { ...s, heading: v } : s)) };
    setDoc(next);
  };
  const updateParagraph = (si: number, pi: number, v: string) => {
    if (!doc) return;
    const next = {
      ...doc,
      sections: doc.sections.map((s, idx) =>
        idx === si
          ? { ...s, paragraphs: s.paragraphs.map((p, j) => (j === pi ? v : p)) }
          : s,
      ),
    };
    setDoc(next);
  };

  return (
    <div className="min-h-screen bg-background bg-aurora">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-xl bg-background/40 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display text-base font-semibold tracking-tight">
                Loom
              </div>
              <div className="text-[11px] text-muted-foreground font-mono-ui uppercase tracking-widest">
                AI Document Studio
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono-ui">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            powered by Lovable AI
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        {!doc && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur text-xs text-muted-foreground font-mono-ui mb-8">
              <Sparkles className="h-3 w-3 text-primary" />
              From topic to polished document in seconds
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Write the document.
              <br />
              <span className="text-gradient">We&apos;ll do the writing.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Generate structured, professional documents with AI. Edit inline, refine the tone, and export to PDF or Word.
            </p>

            <div className="relative max-w-2xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-primary opacity-20 blur-2xl rounded-3xl" />
              <div className="relative bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-3 shadow-elevated">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the document you need…"
                  className="min-h-[120px] resize-none bg-transparent border-0 focus-visible:ring-0 text-base placeholder:text-muted-foreground/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
                  }}
                />
                <div className="flex items-center justify-between pt-2 px-1">
                  <span className="text-xs text-muted-foreground font-mono-ui">
                    ⌘ + Enter to generate
                  </span>
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    size="lg"
                    className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow rounded-xl"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Drafting…
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="text-xs text-muted-foreground font-mono-ui uppercase tracking-widest mb-4">
                Try a starter
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="text-xs px-3 py-2 rounded-full border border-border/60 bg-card/40 hover:bg-card hover:border-primary/40 transition text-muted-foreground hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        <AnimatePresence>
          {doc && (
            <motion.section
              key="doc"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="grid lg:grid-cols-[1fr_320px] gap-8"
            >
              {/* Document */}
              <article className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 md:p-12 shadow-elevated">
                <div className="mb-8 pb-6 border-b border-border/60">
                  {editingTitle ? (
                    <div className="flex gap-2">
                      <Input
                        value={doc.title}
                        onChange={(e) =>
                          setDoc({ ...doc, title: e.target.value })
                        }
                        className="font-display text-3xl md:text-4xl font-bold h-auto py-2 bg-transparent"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingTitle(false)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingTitle(true)}
                      className="group flex items-start gap-3 text-left"
                    >
                      <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                        {doc.title}
                      </h2>
                      <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 mt-2 transition" />
                    </button>
                  )}
                </div>

                <div className="space-y-8">
                  {doc.sections.map((sec, si) => (
                    <div key={si}>
                      <Input
                        value={sec.heading}
                        onChange={(e) =>
                          updateSectionHeading(si, e.target.value)
                        }
                        className="font-display text-xl font-semibold h-auto py-2 mb-3 bg-transparent border-0 border-b border-transparent hover:border-border focus-visible:border-primary focus-visible:ring-0 px-0 rounded-none"
                      />
                      <div className="space-y-3">
                        {sec.paragraphs.map((p, pi) => (
                          <Textarea
                            key={pi}
                            value={p}
                            onChange={(e) =>
                              updateParagraph(si, pi, e.target.value)
                            }
                            className="bg-transparent border-0 resize-none focus-visible:ring-0 px-0 text-[15px] leading-relaxed text-foreground/90 hover:bg-muted/30 rounded-lg transition"
                            rows={Math.max(2, Math.ceil(p.length / 90))}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              {/* Sidebar */}
              <aside className="space-y-4 lg:sticky lg:top-24 self-start">
                <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-elevated">
                  <div className="text-xs font-mono-ui uppercase tracking-widest text-muted-foreground mb-3">
                    Export
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => downloadPDF(doc)}
                      className="w-full justify-start bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-xl"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      onClick={() => downloadDOCX(doc)}
                      variant="outline"
                      className="w-full justify-start rounded-xl border-border bg-secondary/40 hover:bg-secondary"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download DOCX
                    </Button>
                  </div>
                </div>

                <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-elevated">
                  <div className="text-xs font-mono-ui uppercase tracking-widest text-muted-foreground mb-3">
                    Refine with AI
                  </div>
                  <Textarea
                    value={refineInstr}
                    onChange={(e) => setRefineInstr(e.target.value)}
                    rows={3}
                    className="resize-none bg-background/50 text-sm mb-2"
                    placeholder="e.g. Make it more concise"
                  />
                  <Button
                    onClick={handleRefine}
                    disabled={refining}
                    variant="secondary"
                    className="w-full rounded-xl"
                  >
                    {refining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Refining…
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Refine document
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setDoc(null);
                    setPrompt("");
                  }}
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start a new document
                </Button>
              </aside>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}