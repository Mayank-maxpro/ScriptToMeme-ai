import React, { useMemo, useState } from "react";
import {
  AlertCircle, BrainCircuit, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Clapperboard, Clock, Copy, FileText, Film, Gauge, Hash, Loader2, Palette,
  Search, Settings2, Sparkles, Target, Type, Users, Youtube
} from "lucide-react";

const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || "";

const API = {
  analyze: "/api/analyze",
  metadata: "/api/metadata"
};

async function postJSON(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

async function fetchGifs(query) {
  if (!GIPHY_KEY) return [];

  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", GIPHY_KEY);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("rating", "pg-13");
  url.searchParams.set("lang", "en");

  const response = await fetch(url);
  if (!response.ok) throw new Error("GIPHY search failed.");

  const data = await response.json();
  return (data.data || [])
    .map(item => ({
      url: item.images?.fixed_width?.url || item.images?.original?.url,
      title: item.title || query,
      id: item.id
    }))
    .filter(item => item.url);
}

function App() {
  const [script, setScript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [storyboard, setStoryboard] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [audience, setAudience] = useState("18-25 Gen-Z / Young Adults");
  const [pacing, setPacing] = useState("Hyper-fast (Retention editing, fast cuts)");
  const [visualStyle, setVisualStyle] = useState("High-energy internet culture & Twitch memes");
  const [customNotes, setCustomNotes] = useState("");
  const [activeTab, setActiveTab] = useState("storyboard");

  const brief = useMemo(() => ({ audience, pacing, visualStyle, customNotes }), [
    audience, pacing, visualStyle, customNotes
  ]);

  const handleAnalyze = async () => {
    if (!script.trim()) return setError("Please enter a script first.");
    setIsAnalyzing(true);
    setError("");
    setMetadata(null);
    setActiveTab("storyboard");
    try {
      const { storyboard: result } = await postJSON(API.analyze, { script, ...brief });
      const initial = result.map(item => ({
        ...item, gifs: [], currentGifIndex: 0, isLoadingGifs: true, gifError: false
      }));
      setStoryboard(initial);

      for (let i = 0; i < initial.length; i++) {
        try {
          if (i > 0) await new Promise(r => setTimeout(r, 350));
          const gifs = await fetchGifs(initial[i].search_query);
          setStoryboard(prev => prev.map((item, index) =>
            index === i ? { ...item, gifs, isLoadingGifs: false, gifError: !gifs.length } : item
          ));
        } catch {
          setStoryboard(prev => prev.map((item, index) =>
            index === i ? { ...item, isLoadingGifs: false, gifError: true } : item
          ));
        }
      }
    } catch (e) {
      setError(e.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMetadata = async () => {
    if (!script.trim()) return setError("Please enter a script first.");
    setIsGeneratingMetadata(true);
    setError("");
    setActiveTab("metadata");
    try {
      const { metadata: result } = await postJSON(API.metadata, { script });
      setMetadata(result);
    } catch (e) {
      setError(e.message || "Metadata generation failed. Please try again.");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  const copyStoryboard = async () => {
    const text = storyboard.map((item, i) =>
      `[Clip ${i + 1}]\nScript: "${item.phrase}"\nVisual: ${item.visual_concept}\nWhy: ${item.reasoning}\nSearch: ${item.search_query}\nGIF: ${item.gifs?.[item.currentGifIndex]?.url || "No GIF found"}`
    ).join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard access was blocked by the browser.");
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] text-slate-200 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
              <Clapperboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Precision Storyboard AI</h1>
              <p className="text-sm text-slate-400">Turn a script into an editor-ready visual plan.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <section className="xl:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <button onClick={() => setShowSettings(v => !v)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50">
                <span className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-400" />
                  <span className="text-lg font-semibold text-white">Director's Brief</span>
                </span>
                <ChevronDown className={`w-5 h-5 text-slate-500 ${showSettings ? "rotate-180" : ""}`} />
              </button>

              {showSettings && <div className="p-5 border-t border-slate-800 space-y-4">
                <Field label="Target Audience" icon={<Users className="w-3.5 h-3.5" />}>
                  <select value={audience} onChange={e => setAudience(e.target.value)} className="input">
                    <option>18-25 Gen-Z / Young Adults</option>
                    <option>Millennials / Young Professionals</option>
                    <option>Tech & Developer Audience</option>
                    <option>Broad / Family Friendly</option>
                  </select>
                </Field>
                <Field label="Pacing" icon={<Gauge className="w-3.5 h-3.5" />}>
                  <select value={pacing} onChange={e => setPacing(e.target.value)} className="input">
                    <option>Hyper-fast (Retention editing, fast cuts)</option>
                    <option>Moderate (Balanced pacing, punchy jokes)</option>
                    <option>Slow & Deliberate (Documentary style)</option>
                  </select>
                </Field>
                <Field label="Visual Style" icon={<Palette className="w-3.5 h-3.5" />}>
                  <select value={visualStyle} onChange={e => setVisualStyle(e.target.value)} className="input">
                    <option>High-energy internet culture & Twitch memes</option>
                    <option>Sarcastic pop-culture (The Office, classic movies)</option>
                    <option>Clean, corporate, and educational (Minimal memes)</option>
                    <option>Chaotic / Deep-fried Gen-Z humor</option>
                  </select>
                </Field>
                <Field label="Custom Notes">
                  <input value={customNotes} maxLength={1000} onChange={e => setCustomNotes(e.target.value)}
                    placeholder="Optional editing direction..." className="input" />
                </Field>
              </div>}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Film className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Your Script</h2>
              </div>
              <textarea value={script} maxLength={30000} onChange={e => setScript(e.target.value)}
                placeholder="Paste your video script here..."
                className="input min-h-[280px] resize-y leading-relaxed" />
              <div className="flex justify-between mt-2 text-xs text-slate-600">
                <span>Maximum 30,000 characters</span><span>{script.length}/30,000</span>
              </div>
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button onClick={handleAnalyze} disabled={isAnalyzing || !script.trim()} className="btn-primary">
                  {isAnalyzing ? <><Loader2 className="w-5 h-5 spin" /> Analyzing...</> : <><BrainCircuit className="w-5 h-5" /> Analyze Script</>}
                </button>
                <button onClick={handleMetadata} disabled={isGeneratingMetadata || !script.trim()} className="btn-secondary">
                  {isGeneratingMetadata ? <Loader2 className="w-5 h-5 spin" /> : <Youtube className="w-5 h-5 text-red-400" />}
                  Auto-Metadata
                </button>
              </div>
              {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-2 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <p>{error}</p>
              </div>}
            </div>
          </section>

          <section className="xl:col-span-8 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 min-h-[calc(100vh-12rem)]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
              <div className="flex gap-5">
                <Tab active={activeTab === "storyboard"} onClick={() => setActiveTab("storyboard")} icon={<Clapperboard className="w-5 h-5" />}>Visual Timeline</Tab>
                <Tab active={activeTab === "metadata"} onClick={() => setActiveTab("metadata")} icon={<Youtube className="w-5 h-5" />}>SEO & Metadata</Tab>
              </div>
              {activeTab === "storyboard" && storyboard.length > 0 &&
                <button onClick={copyStoryboard} className="btn-secondary !py-2 !px-4 text-sm">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Plan"}
                </button>}
            </div>

            {activeTab === "storyboard" ? (
              isAnalyzing ? <Loading label="Director AI is building your storyboard..." /> :
              storyboard.length === 0 ? <Empty icon={<Sparkles className="w-12 h-12" />} text="Your visual storyboard will appear here." /> :
              <div className="space-y-6">
                {storyboard.map((item, idx) => <StoryboardCard key={`${item.phrase}-${idx}`} item={item} index={idx} setStoryboard={setStoryboard} storyboard={storyboard} />)}
              </div>
            ) : (
              isGeneratingMetadata ? <Loading label="Strategist AI is crafting your metadata..." /> :
              !metadata ? <Empty icon={<Youtube className="w-12 h-12" />} text="Generate metadata from your script to see titles, description, tags and chapters." /> :
              <MetadataView metadata={metadata} />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, icon, children }) {
  return <label className="block space-y-1.5">
    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">{icon}{label}</span>
    {children}
  </label>;
}

function Tab({ active, onClick, icon, children }) {
  return <button onClick={onClick} className={`flex items-center gap-2 text-lg font-semibold ${active ? "text-white" : "text-slate-500 hover:text-slate-300"}`}>{icon}{children}</button>;
}

function Loading({ label }) {
  return <div className="min-h-[500px] flex flex-col items-center justify-center text-indigo-400 gap-4">
    <BrainCircuit className="w-12 h-12 animate-pulse" />
    <p className="font-medium">{label}</p>
  </div>;
}

function Empty({ icon, text }) {
  return <div className="min-h-[500px] flex flex-col items-center justify-center text-slate-500 gap-4 text-center">{icon}<p>{text}</p></div>;
}

function StoryboardCard({ item, index, storyboard, setStoryboard }) {
  const gifs = item.gifs || [];
  const current = gifs[item.currentGifIndex];
  const changeGif = delta => setStoryboard(prev => prev.map((x, i) => i === index
    ? { ...x, currentGifIndex: (x.currentGifIndex + delta + gifs.length) % gifs.length } : x));

  return <article className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row gap-6">
    <div className="flex-1 space-y-4">
      <span className="inline-flex px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase">Clip {index + 1}</span>
      <div>
        <h3 className="text-slate-400 text-sm font-semibold mb-1">Script</h3>
        <p className="text-white text-lg font-medium italic border-l-4 border-slate-700 pl-4">"{item.phrase}"</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Info title="Winning Concept" icon={<Palette className="w-3.5 h-3.5" />}>{item.visual_concept}</Info>
        <Info title="Why" icon={<Target className="w-3.5 h-3.5" />}>{item.reasoning}</Info>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Search className="w-4 h-4" /> Search query:
        <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-1 rounded">{item.search_query}</span>
      </div>
    </div>

    <div className="w-full lg:w-[320px] shrink-0 flex flex-col bg-black/40 rounded-xl border border-slate-800 overflow-hidden">
      {item.isLoadingGifs ? <div className="min-h-[240px] flex items-center justify-center gap-2 text-slate-500"><Loader2 className="w-6 h-6 spin text-indigo-500" /> Searching GIFs...</div> :
       !GIPHY_KEY ? <div className="min-h-[240px] p-5 flex flex-col items-center justify-center text-center text-slate-500"><AlertCircle className="w-8 h-8 mb-2" /><p className="text-sm">Add a GIPHY production key to enable GIF previews.</p></div> :
       !current ? <div className="min-h-[240px] p-5 flex flex-col items-center justify-center text-center text-slate-500"><AlertCircle className="w-8 h-8 mb-2" /><p className="text-sm">No GIF found for this query.</p></div> :
       <>
         <div className="h-[240px] bg-slate-950 flex items-center justify-center overflow-hidden"><img src={current.url} alt={current.title} className="w-full h-full object-contain" loading="lazy" /></div>
         <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
           <button onClick={() => changeGif(-1)} className="icon-btn" aria-label="Previous GIF"><ChevronLeft className="w-4 h-4" /></button>
           <span className="text-xs text-slate-400">{item.currentGifIndex + 1} / {gifs.length}</span>
           <button onClick={() => changeGif(1)} className="icon-btn" aria-label="Next GIF"><ChevronRight className="w-4 h-4" /></button>
         </div>
         <div className="px-3 pb-3 text-center text-[10px] text-slate-500">Powered by GIPHY</div>
       </>}
    </div>
  </article>;
}

function Info({ title, icon, children }) {
  return <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
    <h3 className="text-slate-400 text-xs font-semibold uppercase mb-2 flex items-center gap-1.5">{icon}{title}</h3>
    <p className="text-slate-300 text-sm leading-relaxed">{children}</p>
  </div>;
}

function MetadataView({ metadata }) {
  return <div className="space-y-6">
    <div className="panel"><h3 className="panel-title"><Type className="w-5 h-5 text-blue-400" /> Title Ideas</h3>
      <ul className="space-y-3">{metadata.titles.map((x, i) => <li key={i} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50"><span className="text-blue-400 font-bold mr-3">{i + 1}.</span>{x}</li>)}</ul>
    </div>
    <div className="panel"><h3 className="panel-title"><FileText className="w-5 h-5 text-emerald-400" /> Description</h3>
      <div className="bg-slate-950/50 p-4 rounded-xl text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{metadata.description}</div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="panel"><h3 className="panel-title"><Clock className="w-5 h-5 text-amber-400" /> Chapters</h3>
        <ul className="space-y-2">{metadata.chapters.map((x, i) => <li key={i} className="flex gap-3 p-2"><span className="text-amber-400 font-mono text-xs bg-amber-500/10 px-2 py-1 rounded">{x.timestamp}</span><span className="text-sm">{x.title}</span></li>)}</ul>
      </div>
      <div className="panel"><h3 className="panel-title"><Hash className="w-5 h-5 text-pink-400" /> SEO Tags</h3>
        <div className="flex flex-wrap gap-2">{metadata.tags.map((x, i) => <span key={i} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-full text-xs">{x}</span>)}</div>
      </div>
    </div>
  </div>;
}

export default App;
