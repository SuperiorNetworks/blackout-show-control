/* ============================================================
   SimulationTab.tsx — Iron District City Simulation
   Version: 1.1.0
   Purpose: Interactive city-block collapse simulation with
            audio sync, relay triggers, three camera views,
            dual palette, and project save/load/replay/new.
   Design: Industrial Dark Console + Outdoor Sunlight palette
   ============================================================ */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useProject } from "@/contexts/ProjectContext";

// ── Types ─────────────────────────────────────────────────────
type CollapsePhase = "intact" | "shaking" | "cracking" | "falling" | "rubble";
type PaletteMode = "dark" | "sunlight";
type CameraView = "overhead" | "street-front" | "inside";

interface Block {
  id: number;
  name: string;
  relay: number;
  triggerMs: number;
  phase: CollapsePhase;
  row: number;
  col: number;
}

interface SimProject {
  id: string;
  name: string;
  durationMs: number;
  audioUrl: string;
  blocks: Block[];
  createdAt: number;
}

// ── Default city blocks (3×2 grid, 6 blocks) ─────────────────
const DEFAULT_BLOCKS: Omit<Block, "phase">[] = [
  { id: 1, name: "City Hall",   relay: 1,  triggerMs: 8000,  row: 0, col: 0 },
  { id: 2, name: "The Bank",    relay: 2,  triggerMs: 14000, row: 0, col: 1 },
  { id: 3, name: "Hotel Luxe",  relay: 3,  triggerMs: 20000, row: 0, col: 2 },
  { id: 4, name: "Warehouse",   relay: 4,  triggerMs: 27000, row: 1, col: 0 },
  { id: 5, name: "The Station", relay: 5,  triggerMs: 34000, row: 1, col: 1 },
  { id: 6, name: "Iron Works",  relay: 6,  triggerMs: 42000, row: 1, col: 2 },
];

const DURATION_OPTIONS = [60000, 90000, 120000];

function makeDefaultProject(overrides?: Partial<SimProject>): SimProject {
  return {
    id: `proj_${Date.now()}`,
    name: "Iron District — Show 1",
    durationMs: 60000,
    audioUrl: "",
    blocks: DEFAULT_BLOCKS.map(b => ({ ...b, phase: "intact" as CollapsePhase })),
    createdAt: Date.now(),
    ...overrides,
  };
}

// ── Palette tokens ────────────────────────────────────────────
const PALETTE = {
  dark: {
    bg: "bg-[#0d0e10]",
    surface: "bg-[#13151a]",
    surface2: "bg-[#1a1d24]",
    border: "border-[#1e2026]",
    text: "text-[#dde2e8]",
    muted: "text-[#6b7280]",
    accent: "text-amber-400",
    accentBg: "bg-amber-500/20",
    accentBorder: "border-amber-500/40",
    blockIntact: "bg-[#1e2a1e] border-[#2a4a2a] text-[#7ec87e]",
    blockShaking: "bg-amber-900/40 border-amber-500/60 text-amber-300",
    blockCracking: "bg-orange-900/50 border-orange-500/60 text-orange-300",
    blockFalling: "bg-red-900/60 border-red-500/60 text-red-300",
    blockRubble: "bg-[#1a1208] border-[#3a2a10] text-[#6b5a30]",
    relayOn: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
    relayOff: "bg-[#1e2026] border-[#2a2f3a]",
    timeline: "bg-[#13151a]",
    scrubber: "bg-amber-500",
    label: "text-[#9ca3af]",
  },
  sunlight: {
    bg: "bg-[#e8dcc8]",
    surface: "bg-[#f5ede0]",
    surface2: "bg-[#ede0cc]",
    border: "border-[#c8b89a]",
    text: "text-[#2c1a08]",
    muted: "text-[#7a5a38]",
    accent: "text-[#b45309]",
    accentBg: "bg-amber-200/60",
    accentBorder: "border-amber-600/50",
    blockIntact: "bg-[#c8ddb8] border-[#7aaa5a] text-[#2a5a1a]",
    blockShaking: "bg-amber-200 border-amber-500 text-amber-800",
    blockCracking: "bg-orange-200 border-orange-500 text-orange-800",
    blockFalling: "bg-red-200 border-red-500 text-red-800",
    blockRubble: "bg-[#c8b080] border-[#8a6a30] text-[#4a3010]",
    relayOn: "bg-amber-500 shadow-[0_0_8px_rgba(180,83,9,0.6)]",
    relayOff: "bg-[#d4c4a8] border-[#b8a080]",
    timeline: "bg-[#ede0cc]",
    scrubber: "bg-amber-600",
    label: "text-[#5a4020]",
  },
};

// ── Block SVG Buildings ───────────────────────────────────────
function BuildingIcon({ phase, palette }: { phase: CollapsePhase; palette: typeof PALETTE.dark }) {
  if (phase === "rubble") {
    return (
      <svg viewBox="0 0 48 32" className="w-full h-full">
        <polygon points="2,30 8,18 14,24 20,14 26,22 32,12 38,20 44,16 46,30" fill="currentColor" opacity="0.6" />
        <rect x="4" y="26" width="6" height="4" fill="currentColor" opacity="0.4" />
        <rect x="18" y="22" width="8" height="8" fill="currentColor" opacity="0.4" />
        <rect x="34" y="24" width="10" height="6" fill="currentColor" opacity="0.4" />
      </svg>
    );
  }
  if (phase === "falling") {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" style={{ transform: "rotate(15deg)", transformOrigin: "bottom center" }}>
        <rect x="10" y="8" width="28" height="36" rx="1" fill="currentColor" opacity="0.7" />
        <rect x="14" y="12" width="6" height="6" fill="black" opacity="0.3" />
        <rect x="24" y="12" width="6" height="6" fill="black" opacity="0.3" />
        <rect x="14" y="22" width="6" height="6" fill="black" opacity="0.3" />
        <rect x="24" y="22" width="6" height="6" fill="black" opacity="0.3" />
      </svg>
    );
  }
  if (phase === "cracking") {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect x="10" y="6" width="28" height="38" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="14" y="10" width="6" height="6" fill="black" opacity="0.3" />
        <rect x="24" y="10" width="6" height="6" fill="black" opacity="0.3" />
        <rect x="14" y="20" width="6" height="6" fill="black" opacity="0.3" />
        <rect x="24" y="20" width="6" height="6" fill="black" opacity="0.3" />
        <line x1="20" y1="6" x2="16" y2="44" stroke="black" strokeWidth="1.5" opacity="0.5" />
        <line x1="30" y1="6" x2="34" y2="44" stroke="black" strokeWidth="1" opacity="0.4" />
      </svg>
    );
  }
  // intact or shaking
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <rect x="10" y="6" width="28" height="38" rx="1" fill="currentColor" opacity="0.9" />
      <rect x="14" y="10" width="6" height="6" fill="black" opacity="0.25" />
      <rect x="24" y="10" width="6" height="6" fill="black" opacity="0.25" />
      <rect x="14" y="20" width="6" height="6" fill="black" opacity="0.25" />
      <rect x="24" y="20" width="6" height="6" fill="black" opacity="0.25" />
      <rect x="14" y="30" width="6" height="6" fill="black" opacity="0.25" />
      <rect x="24" y="30" width="6" height="6" fill="black" opacity="0.25" />
      <rect x="20" y="36" width="8" height="8" fill="black" opacity="0.2" />
    </svg>
  );
}

// ── Camera View Overlay ───────────────────────────────────────
function CameraOverlay({ view, blocks, palette }: {
  view: CameraView;
  blocks: Block[];
  palette: typeof PALETTE.dark;
}) {
  const p = palette;
  const activeBlock = blocks.find(b => b.phase === "shaking" || b.phase === "cracking" || b.phase === "falling");

  return (
    <div className={cn("relative w-full h-full rounded border overflow-hidden", p.surface, p.border)}>
      {/* Camera label */}
      <div className={cn("absolute top-2 left-2 z-10 px-2 py-0.5 rounded-sm text-xs font-mono font-bold", p.accentBg, p.accent, p.accentBorder, "border")}>
        {view === "overhead" ? "CAM-1 OVERHEAD" : view === "street-front" ? "CAM-2 STREET" : "CAM-3 INTERIOR"}
      </div>

      {/* REC indicator */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 text-xs font-mono">REC</span>
      </div>

      {/* Camera view content */}
      {view === "overhead" && (
        <div className="w-full h-full flex items-center justify-center p-4">
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
            {blocks.map(b => (
              <div
                key={b.id}
                className={cn(
                  "aspect-square rounded-sm border flex items-center justify-center transition-all duration-300",
                  b.phase === "intact" ? p.blockIntact :
                  b.phase === "shaking" ? p.blockShaking :
                  b.phase === "cracking" ? p.blockCracking :
                  b.phase === "falling" ? p.blockFalling : p.blockRubble
                )}
                style={b.phase === "shaking" ? { animation: "shake 0.15s infinite" } : undefined}
              >
                <div className="w-3/4 h-3/4">
                  <BuildingIcon phase={b.phase} palette={palette} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "street-front" && (
        <div className="w-full h-full flex items-end justify-center pb-4 px-4 gap-2">
          {blocks.filter(b => b.row === 0).map(b => (
            <div
              key={b.id}
              className={cn(
                "flex-1 border rounded-t transition-all duration-300",
                b.phase === "intact" ? p.blockIntact :
                b.phase === "shaking" ? p.blockShaking :
                b.phase === "cracking" ? p.blockCracking :
                b.phase === "falling" ? p.blockFalling : p.blockRubble
              )}
              style={{
                height: b.phase === "rubble" ? "24px" : b.phase === "falling" ? "40%" : "65%",
                transition: "height 0.8s ease-in",
                ...(b.phase === "shaking" ? { animation: "shake 0.15s infinite" } : {}),
              }}
            >
              <div className="w-full h-full p-1">
                <BuildingIcon phase={b.phase} palette={palette} />
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "inside" && (
        <div className="w-full h-full flex items-center justify-center">
          {activeBlock ? (
            <div className="text-center">
              <div className={cn("text-2xl font-mono font-bold mb-2", p.accent)}>
                {activeBlock.phase === "shaking" ? "⚠ VIBRATION DETECTED" :
                 activeBlock.phase === "cracking" ? "⚠ STRUCTURAL FAILURE" :
                 "⚠ COLLAPSE IN PROGRESS"}
              </div>
              <div className={cn("text-sm font-mono", p.muted)}>{activeBlock.name}</div>
              <div className={cn("mt-4 text-xs font-mono", p.label)}>R{activeBlock.relay} — TRIGGERED</div>
            </div>
          ) : (
            <div className={cn("text-center font-mono", p.muted)}>
              <div className="text-4xl mb-2">🏢</div>
              <div className="text-sm">Interior view — all clear</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Relay Grid ────────────────────────────────────────────────
function RelayGrid({ relayStates, palette }: { relayStates: boolean[]; palette: typeof PALETTE.dark }) {
  const p = palette;
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {relayStates.map((on, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <div className={cn(
            "w-5 h-5 rounded-full border transition-all duration-150",
            on ? p.relayOn : cn(p.relayOff, "border")
          )} />
          <span className={cn("text-[9px] font-mono", p.muted)}>R{i + 1}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main SimulationTab ────────────────────────────────────────
export default function SimulationTab() {
  const { addLog } = useProject();

  // ── Palette ──
  const [paletteMode, setPaletteMode] = useState<PaletteMode>("dark");
  const p = PALETTE[paletteMode];

  // ── Camera ──
  const [cameraView, setCameraView] = useState<CameraView>("overhead");

  // ── Project management ──
  const [savedProjects, setSavedProjects] = useState<SimProject[]>(() => {
    try {
      const raw = localStorage.getItem("irondistrict_sim_projects");
      return raw ? JSON.parse(raw) : [makeDefaultProject()];
    } catch { return [makeDefaultProject()]; }
  });
  const [currentProjectId, setCurrentProjectId] = useState<string>(savedProjects[0]?.id ?? "");
  const [simProject, setSimProject] = useState<SimProject>(
    savedProjects.find(p => p.id === currentProjectId) ?? makeDefaultProject()
  );

  // ── Playback ──
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [relayStates, setRelayStates] = useState<boolean[]>(Array(16).fill(false));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const startWallRef = useRef<number>(0);
  const startSimRef = useRef<number>(0);

  // ── Editing ──
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);

  // ── Persist projects ──
  const persistProjects = useCallback((projects: SimProject[]) => {
    localStorage.setItem("irondistrict_sim_projects", JSON.stringify(projects));
    setSavedProjects(projects);
  }, []);

  // ── Sync simProject to savedProjects on change ──
  const updateSimProject = useCallback((updater: (prev: SimProject) => SimProject) => {
    setSimProject(prev => {
      const next = updater(prev);
      setSavedProjects(all => {
        const updated = all.map(p => p.id === next.id ? next : p);
        localStorage.setItem("irondistrict_sim_projects", JSON.stringify(updated));
        return updated;
      });
      return next;
    });
  }, []);

  // ── Reset block phases ──
  const resetBlocks = useCallback(() => {
    updateSimProject(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => ({ ...b, phase: "intact" as CollapsePhase })),
    }));
    setRelayStates(Array(16).fill(false));
    setCurrentMs(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [updateSimProject]);

  // ── Playback loop ──
  const tick = useCallback(() => {
    const elapsed = (performance.now() - startWallRef.current) + startSimRef.current;
    const clamped = Math.min(elapsed, simProject.durationMs);
    setCurrentMs(clamped);

    // Fire relay triggers
    setSimProject(prev => {
      let changed = false;
      const nextBlocks = prev.blocks.map(b => {
        if (b.phase !== "intact") return b;
        if (elapsed >= b.triggerMs) {
          changed = true;
          addLog("event", `R${b.relay} FIRED — ${b.name} collapse sequence initiated`);
          return { ...b, phase: "shaking" as CollapsePhase };
        }
        return b;
      });
      if (!changed) return prev;
      return { ...prev, blocks: nextBlocks };
    });

    // Update relay states
    setRelayStates(prev => {
      const next = [...prev];
      simProject.blocks.forEach(b => {
        if (elapsed >= b.triggerMs && elapsed < b.triggerMs + 500) {
          next[b.relay - 1] = true;
        }
      });
      return next;
    });

    if (clamped < simProject.durationMs) {
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      setIsPlaying(false);
      addLog("info", "Simulation complete — all sequences executed");
    }
  }, [simProject.durationMs, simProject.blocks, addLog]);

  // ── Phase progression ──
  useEffect(() => {
    if (!isPlaying) return;
    const intervals: ReturnType<typeof setInterval>[] = [];
    simProject.blocks.forEach(b => {
      const delay = b.triggerMs - currentMs;
      if (delay < 0) return;
      // shaking → cracking after 1.5s
      const t1 = setTimeout(() => {
        updateSimProject(prev => ({
          ...prev,
          blocks: prev.blocks.map(bl => bl.id === b.id && bl.phase === "shaking" ? { ...bl, phase: "cracking" } : bl),
        }));
      }, delay + 1500);
      // cracking → falling after 3s
      const t2 = setTimeout(() => {
        updateSimProject(prev => ({
          ...prev,
          blocks: prev.blocks.map(bl => bl.id === b.id && bl.phase === "cracking" ? { ...bl, phase: "falling" } : bl),
        }));
      }, delay + 3000);
      // falling → rubble after 5s
      const t3 = setTimeout(() => {
        updateSimProject(prev => ({
          ...prev,
          blocks: prev.blocks.map(bl => bl.id === b.id && bl.phase === "falling" ? { ...bl, phase: "rubble" } : bl),
        }));
        setRelayStates(prev => {
          const next = [...prev];
          next[b.relay - 1] = false;
          return next;
        });
      }, delay + 5000);
      intervals.push(t1 as unknown as ReturnType<typeof setInterval>);
      intervals.push(t2 as unknown as ReturnType<typeof setInterval>);
      intervals.push(t3 as unknown as ReturnType<typeof setInterval>);
    });
    return () => intervals.forEach(t => clearTimeout(t as unknown as ReturnType<typeof setTimeout>));
  }, [isPlaying, simProject.blocks, currentMs, updateSimProject]);

  // ── Play / Pause ──
  const handlePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
      audioRef.current?.pause();
      return;
    }
    startWallRef.current = performance.now();
    startSimRef.current = currentMs;
    setIsPlaying(true);
    animFrameRef.current = requestAnimationFrame(tick);
    if (audioRef.current && simProject.audioUrl) {
      audioRef.current.currentTime = currentMs / 1000;
      audioRef.current.play().catch(() => {});
    }
    addLog("info", "Simulation started");
  }, [isPlaying, currentMs, tick, simProject.audioUrl, addLog]);

  // ── Replay ──
  const handleReplay = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setIsPlaying(false);
    resetBlocks();
    setTimeout(() => {
      startWallRef.current = performance.now();
      startSimRef.current = 0;
      setIsPlaying(true);
      animFrameRef.current = requestAnimationFrame(tick);
      if (audioRef.current && simProject.audioUrl) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      addLog("info", "Simulation replayed from start");
    }, 100);
  }, [resetBlocks, tick, simProject.audioUrl, addLog]);

  // ── Scrubber seek ──
  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = Number(e.target.value);
    setCurrentMs(ms);
    if (audioRef.current) audioRef.current.currentTime = ms / 1000;
    // Update block phases based on scrub position
    updateSimProject(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => {
        if (ms < b.triggerMs) return { ...b, phase: "intact" };
        if (ms < b.triggerMs + 1500) return { ...b, phase: "shaking" };
        if (ms < b.triggerMs + 3000) return { ...b, phase: "cracking" };
        if (ms < b.triggerMs + 5000) return { ...b, phase: "falling" };
        return { ...b, phase: "rubble" };
      }),
    }));
  }, [updateSimProject]);

  // ── Project management ──
  const handleNewProject = useCallback(() => {
    const proj = makeDefaultProject();
    persistProjects([...savedProjects, proj]);
    setSimProject(proj);
    setCurrentProjectId(proj.id);
    resetBlocks();
    addLog("info", `New project created: ${proj.name}`);
  }, [savedProjects, persistProjects, resetBlocks, addLog]);

  const handleLoadProject = useCallback((id: string) => {
    const proj = savedProjects.find(p => p.id === id);
    if (!proj) return;
    setSimProject(proj);
    setCurrentProjectId(id);
    resetBlocks();
    addLog("info", `Loaded project: ${proj.name}`);
  }, [savedProjects, resetBlocks, addLog]);

  const handleSaveProject = useCallback(() => {
    const updated = savedProjects.map(p => p.id === simProject.id ? simProject : p);
    persistProjects(updated);
    addLog("info", `Project saved: ${simProject.name}`);
  }, [savedProjects, simProject, persistProjects, addLog]);

  const handleDeleteProject = useCallback((id: string) => {
    if (savedProjects.length <= 1) return;
    const updated = savedProjects.filter(p => p.id !== id);
    persistProjects(updated);
    if (id === currentProjectId) {
      setSimProject(updated[0]);
      setCurrentProjectId(updated[0].id);
    }
    addLog("info", "Project deleted");
  }, [savedProjects, currentProjectId, persistProjects, addLog]);

  // ── Format time ──
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}.${String(Math.floor((ms % 1000) / 100))}`;
  };

  const pct = (simProject.durationMs > 0) ? (currentMs / simProject.durationMs) * 100 : 0;

  return (
    <div className={cn("flex flex-col h-full overflow-hidden font-mono", p.bg, p.text)}>
      {/* ── Shake keyframe ── */}
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-3px) rotate(-1deg); }
          75% { transform: translateX(3px) rotate(1deg); }
        }
      `}</style>

      {/* ── Top toolbar ── */}
      <div className={cn("flex items-center gap-3 px-4 py-2 border-b shrink-0 flex-wrap", p.surface, p.border)}>
        {/* Project selector */}
        <select
          value={currentProjectId}
          onChange={e => handleLoadProject(e.target.value)}
          className={cn("text-xs font-mono px-2 py-1 rounded border bg-transparent", p.border, p.text)}
        >
          {savedProjects.map(proj => (
            <option key={proj.id} value={proj.id} className="bg-[#13151a] text-[#dde2e8]">
              {proj.name}
            </option>
          ))}
        </select>

        <button onClick={handleNewProject} className={cn("px-2 py-1 text-xs rounded border", p.border, p.muted, "hover:text-white hover:border-white/30")}>
          + NEW
        </button>
        <button onClick={handleSaveProject} className={cn("px-2 py-1 text-xs rounded border", p.accentBorder, p.accent, p.accentBg)}>
          SAVE
        </button>
        <button
          onClick={() => { if (savedProjects.length > 1) handleDeleteProject(currentProjectId); }}
          className="px-2 py-1 text-xs rounded border border-red-800/60 text-red-400 hover:bg-red-900/30"
        >
          DELETE
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Project name edit */}
        <input
          value={simProject.name}
          onChange={e => updateSimProject(prev => ({ ...prev, name: e.target.value }))}
          className={cn("text-xs font-mono px-2 py-1 rounded border bg-transparent w-40", p.border, p.text)}
          placeholder="Project name"
        />

        {/* Duration selector */}
        <select
          value={simProject.durationMs}
          onChange={e => updateSimProject(prev => ({ ...prev, durationMs: Number(e.target.value) }))}
          className={cn("text-xs font-mono px-2 py-1 rounded border bg-transparent", p.border, p.text)}
        >
          {DURATION_OPTIONS.map(d => (
            <option key={d} value={d} className="bg-[#13151a] text-[#dde2e8]">{d / 1000}s</option>
          ))}
        </select>

        {/* Audio URL */}
        <input
          value={simProject.audioUrl}
          onChange={e => {
            updateSimProject(prev => ({ ...prev, audioUrl: e.target.value }));
            if (audioRef.current) audioRef.current.src = e.target.value;
          }}
          className={cn("text-xs font-mono px-2 py-1 rounded border bg-transparent w-48", p.border, p.text)}
          placeholder="Audio MP3 URL…"
        />

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Palette toggle */}
        <button
          onClick={() => setPaletteMode(m => m === "dark" ? "sunlight" : "dark")}
          className={cn("px-2 py-1 text-xs rounded border", p.border, p.muted, "hover:text-white")}
        >
          {paletteMode === "dark" ? "☀ SUNLIGHT" : "🌙 DARK"}
        </button>

        {/* Camera selector */}
        <div className="flex gap-1">
          {(["overhead", "street-front", "inside"] as CameraView[]).map(v => (
            <button
              key={v}
              onClick={() => setCameraView(v)}
              className={cn(
                "px-2 py-1 text-xs rounded border",
                cameraView === v ? cn(p.accentBg, p.accent, p.accentBorder) : cn(p.border, p.muted)
              )}
            >
              {v === "overhead" ? "OVERHEAD" : v === "street-front" ? "STREET" : "INTERIOR"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden gap-0">

        {/* ── Left: City Grid ── */}
        <div className={cn("flex flex-col w-1/2 border-r p-4 gap-4 overflow-y-auto", p.border)}>
          <div className={cn("text-xs font-bold tracking-widest", p.accent)}>IRON DISTRICT — CITY GRID</div>

          <div className="grid grid-cols-3 gap-3">
            {simProject.blocks.map(block => (
              <div
                key={block.id}
                className={cn(
                  "relative border rounded p-2 cursor-pointer transition-all duration-300 select-none",
                  block.phase === "intact" ? p.blockIntact :
                  block.phase === "shaking" ? p.blockShaking :
                  block.phase === "cracking" ? p.blockCracking :
                  block.phase === "falling" ? p.blockFalling : p.blockRubble
                )}
                style={block.phase === "shaking" ? { animation: "shake 0.15s infinite" } : undefined}
                onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
              >
                <div className="h-16">
                  <BuildingIcon phase={block.phase} palette={p} />
                </div>
                <div className="text-center mt-1">
                  <div className="text-xs font-bold truncate">{block.name}</div>
                  <div className={cn("text-[10px]", p.muted)}>R{block.relay} · {formatTime(block.triggerMs)}</div>
                  <div className={cn("text-[9px] uppercase tracking-wider mt-0.5", p.muted)}>{block.phase}</div>
                </div>

                {/* Edit panel */}
                {editingBlockId === block.id && (
                  <div
                    className={cn("absolute z-20 top-full left-0 mt-1 w-52 rounded border p-3 shadow-xl", p.surface2, p.border)}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className={cn("text-xs font-bold mb-2", p.accent)}>EDIT BLOCK</div>
                    <label className={cn("text-[10px] block mb-1", p.muted)}>Name</label>
                    <input
                      value={block.name}
                      onChange={e => updateSimProject(prev => ({
                        ...prev,
                        blocks: prev.blocks.map(b => b.id === block.id ? { ...b, name: e.target.value } : b),
                      }))}
                      className={cn("w-full text-xs font-mono px-2 py-1 rounded border bg-transparent mb-2", p.border, p.text)}
                    />
                    <label className={cn("text-[10px] block mb-1", p.muted)}>Relay (1–16)</label>
                    <input
                      type="number" min={1} max={16}
                      value={block.relay}
                      onChange={e => updateSimProject(prev => ({
                        ...prev,
                        blocks: prev.blocks.map(b => b.id === block.id ? { ...b, relay: Number(e.target.value) } : b),
                      }))}
                      className={cn("w-full text-xs font-mono px-2 py-1 rounded border bg-transparent mb-2", p.border, p.text)}
                    />
                    <label className={cn("text-[10px] block mb-1", p.muted)}>Trigger (seconds)</label>
                    <input
                      type="number" min={0} max={simProject.durationMs / 1000} step={0.5}
                      value={block.triggerMs / 1000}
                      onChange={e => updateSimProject(prev => ({
                        ...prev,
                        blocks: prev.blocks.map(b => b.id === block.id ? { ...b, triggerMs: Number(e.target.value) * 1000 } : b),
                      }))}
                      className={cn("w-full text-xs font-mono px-2 py-1 rounded border bg-transparent", p.border, p.text)}
                    />
                    <button
                      onClick={() => setEditingBlockId(null)}
                      className={cn("mt-2 w-full text-xs py-1 rounded border", p.accentBorder, p.accent, p.accentBg)}
                    >
                      DONE
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Phase legend */}
          <div className={cn("text-[10px] font-mono mt-2", p.muted)}>
            Click any block to edit name, relay, and trigger time.
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
            {(["intact","shaking","cracking","falling","rubble"] as CollapsePhase[]).map(ph => (
              <span key={ph} className={cn("px-2 py-0.5 rounded border",
                ph === "intact" ? p.blockIntact :
                ph === "shaking" ? p.blockShaking :
                ph === "cracking" ? p.blockCracking :
                ph === "falling" ? p.blockFalling : p.blockRubble
              )}>{ph}</span>
            ))}
          </div>
        </div>

        {/* ── Right: Camera + Relay + Timeline ── */}
        <div className="flex flex-col w-1/2 p-4 gap-4 overflow-y-auto">

          {/* Camera view */}
          <div className="h-48 shrink-0">
            <CameraOverlay view={cameraView} blocks={simProject.blocks} palette={p} />
          </div>

          {/* Relay grid */}
          <div className={cn("rounded border p-3", p.surface, p.border)}>
            <div className={cn("text-xs font-bold tracking-widest mb-2", p.accent)}>RELAY STATUS</div>
            <RelayGrid relayStates={relayStates} palette={p} />
          </div>

          {/* Timeline scrubber */}
          <div className={cn("rounded border p-3", p.surface, p.border)}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-xs font-bold tracking-widest", p.accent)}>TIMELINE</span>
              <span className={cn("text-xs font-mono tabular-nums", p.muted)}>
                {formatTime(currentMs)} / {formatTime(simProject.durationMs)}
              </span>
            </div>

            {/* Scrubber */}
            <div className="relative mb-3">
              <input
                type="range"
                min={0}
                max={simProject.durationMs}
                value={currentMs}
                onChange={handleScrub}
                className="w-full h-1.5 rounded appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, ${paletteMode === "dark" ? "#f59e0b" : "#b45309"} ${pct}%, ${paletteMode === "dark" ? "#1e2026" : "#c8b89a"} ${pct}%)` }}
              />
              {/* Trigger markers */}
              {simProject.blocks.map(b => (
                <div
                  key={b.id}
                  className="absolute top-0 w-0.5 h-3 -mt-0.5 bg-red-500/70"
                  style={{ left: `${(b.triggerMs / simProject.durationMs) * 100}%` }}
                  title={`${b.name} — R${b.relay}`}
                />
              ))}
            </div>

            {/* Trigger list */}
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {[...simProject.blocks].sort((a, b) => a.triggerMs - b.triggerMs).map(b => (
                <div key={b.id} className="flex items-center gap-2 text-[10px] font-mono">
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", relayStates[b.relay - 1] ? "bg-amber-400" : "bg-gray-600")} />
                  <span className={cn("w-12 tabular-nums", p.muted)}>{formatTime(b.triggerMs)}</span>
                  <span className={cn("flex-1 truncate", p.text)}>{b.name}</span>
                  <span className={cn(p.muted)}>R{b.relay}</span>
                  <span className={cn("uppercase text-[9px]",
                    b.phase === "intact" ? "text-green-500" :
                    b.phase === "shaking" ? "text-amber-400" :
                    b.phase === "cracking" ? "text-orange-400" :
                    b.phase === "falling" ? "text-red-400" : "text-gray-500"
                  )}>{b.phase}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlay}
              className={cn(
                "flex-1 py-2 text-xs font-mono font-bold tracking-widest rounded border transition-all active:scale-95",
                isPlaying
                  ? "bg-amber-500/20 border-amber-500/60 text-amber-400"
                  : cn(p.accentBg, p.accentBorder, p.accent)
              )}
            >
              {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
            </button>
            <button
              onClick={handleReplay}
              className={cn("px-4 py-2 text-xs font-mono rounded border", p.border, p.muted, "hover:text-white")}
            >
              ↺ REPLAY
            </button>
            <button
              onClick={resetBlocks}
              className="px-4 py-2 text-xs font-mono rounded border border-red-800/60 text-red-400 hover:bg-red-900/30"
            >
              ■ RESET
            </button>
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      {simProject.audioUrl && (
        <audio ref={audioRef} src={simProject.audioUrl} preload="auto" />
      )}
    </div>
  );
}
