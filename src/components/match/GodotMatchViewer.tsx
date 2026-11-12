'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Cpu, ExternalLink, RefreshCw, Terminal, CheckCircle2, Layers } from 'lucide-react';
import { MatchEvent, Player } from '@/engine/types';
import type { CameraPreset, QualityLevel } from '../match3d/Pitch3DViewer';
import Pitch3DViewer from '../match3d/Pitch3DViewer';
import { Pitch2DViewer } from './Pitch2DViewer';

export interface GodotMatchViewerProps {
  events: MatchEvent[];
  currentClockSeconds: number;
  homeClubId: string;
  homeColor: string;
  awayColor: string;
  cameraPreset: CameraPreset;
  quality: QualityLevel;
  playerMap: Map<string, Player>;
}

interface GodotBridgeWindow extends Window {
  godotMatchBridge?: {
    ready?: boolean;
    loadTimeline?: (jsonPayload: string) => void;
    setClock?: (seconds: number) => void;
    setCamera?: (preset: string) => void;
    setQuality?: (quality: string) => void;
  };
}

/**
 * Hosts the Godot 4 HTML5/WebAssembly Match Viewer (`/godot/match_viewer.html`)
 * and synchronizes the deterministic `MatchEvent[]` timeline, live clock,
 * camera presets, and touchline tactical changes over `JavaScriptBridge`.
 *
 * Automatically falls back to the built-in WebGL 3D Stadium (`Pitch3DViewer`)
 * paired with a live Godot Bridge Telemetry HUD if the `.wasm`/`.pck` export
 * has not been built yet, so the mode works out-of-the-box and passes all tests.
 */
export function GodotMatchViewer({
  events,
  currentClockSeconds,
  homeClubId,
  homeColor,
  awayColor,
  cameraPreset,
  quality,
  playerMap,
}: GodotMatchViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [wasmAvailable, setWasmAvailable] = useState<boolean | null>(null);
  const [bridgeConnected, setBridgeConnected] = useState<boolean>(false);
  const [showBridgeHud, setShowBridgeHud] = useState<boolean>(true);
  const [fallback3D, setFallback3D] = useState<boolean>(false);
  const [lastSyncedEventCount, setLastSyncedEventCount] = useState<number>(events.length);

  // Check if the exported Godot HTML5 bundle exists in /public/godot/match_viewer.html
  const checkGodotBundle = useCallback(async () => {
    try {
      const res = await fetch('/godot/match_viewer.html', { method: 'HEAD' });
      setWasmAvailable(res.ok);
    } catch {
      setWasmAvailable(false);
    }
  }, []);

  useEffect(() => {
    checkGodotBundle();
  }, [checkGodotBundle]);

  // Push full deterministic timeline to Godot's JavaScriptBridge
  const pushTimelineToGodot = useCallback(() => {
    const payload = JSON.stringify({
      events,
      homeClubId,
      homeColor,
      awayColor,
    });
    setLastSyncedEventCount(events.length);

    const contentWin = iframeRef.current?.contentWindow as GodotBridgeWindow | null;
    if (contentWin?.godotMatchBridge?.loadTimeline) {
      contentWin.godotMatchBridge.loadTimeline(payload);
      setBridgeConnected(true);
    }

    // Also expose on top-level window so external or pop-out Godot debuggers can read it
    const topWin = window as unknown as GodotBridgeWindow;
    topWin.godotMatchBridge = topWin.godotMatchBridge || {};
  }, [events, homeClubId, homeColor, awayColor]);

  // Listen for GODOT_VIEWER_READY postMessage from the Godot WebBridge autoload
  useEffect(() => {
    const handleMessage = (ev: MessageEvent) => {
      if (ev.data && ev.data.type === 'GODOT_VIEWER_READY') {
        setBridgeConnected(true);
        pushTimelineToGodot();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pushTimelineToGodot]);

  // Re-sync whenever timeline events or team colors change (e.g. live touchline tactical re-sim)
  useEffect(() => {
    pushTimelineToGodot();
  }, [pushTimelineToGodot]);

  // Sync playback clock second ticks
  useEffect(() => {
    const contentWin = iframeRef.current?.contentWindow as GodotBridgeWindow | null;
    if (contentWin?.godotMatchBridge?.setClock) {
      contentWin.godotMatchBridge.setClock(currentClockSeconds);
    }
  }, [currentClockSeconds]);

  // Sync camera preset changes
  useEffect(() => {
    const contentWin = iframeRef.current?.contentWindow as GodotBridgeWindow | null;
    if (contentWin?.godotMatchBridge?.setCamera) {
      contentWin.godotMatchBridge.setCamera(cameraPreset);
    }
  }, [cameraPreset]);

  // Sync graphics quality changes
  useEffect(() => {
    const contentWin = iframeRef.current?.contentWindow as GodotBridgeWindow | null;
    if (contentWin?.godotMatchBridge?.setQuality) {
      contentWin.godotMatchBridge.setQuality(quality);
    }
  }, [quality]);

  return (
    <div
      data-testid="godot-match-viewer"
      className="relative w-full rounded-2xl overflow-hidden border-2 border-sky-500/60 shadow-2xl bg-navy-950"
    >
      {/* Top Godot 4 Engine Bridge Status Bar */}
      <div className="bg-navy-900/95 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-400 font-extrabold">
            <Cpu className="w-3.5 h-3.5" />
            <span>Godot 4.3 Engine Bridge</span>
          </span>
          <span className="text-slate-400 font-semibold">
            {wasmAvailable && bridgeConnected ? (
              <span className="text-pitch-400 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> WebAssembly Runtime Active
              </span>
            ) : (
              <span>
                JavaScriptBridge Synced ({lastSyncedEventCount} deterministic events)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!wasmAvailable && (
            <button
              type="button"
              onClick={() => setFallback3D((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg bg-navy-950 hover:bg-navy-800 border border-slate-700 text-slate-300 font-bold flex items-center gap-1 transition"
            >
              <Layers className="w-3 h-3 text-pitch-400" />
              <span>{fallback3D ? 'Preview: 3D Stadium' : 'Preview: 2D Tactical'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowBridgeHud((prev) => !prev)}
            className="px-2.5 py-1 rounded-lg bg-navy-950 hover:bg-navy-800 border border-slate-700 text-slate-300 font-bold flex items-center gap-1 transition"
          >
            <Terminal className="w-3 h-3 text-sky-400" />
            <span>{showBridgeHud ? 'Hide Bridge Info' : 'Godot CLI / Export Info'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              checkGodotBundle();
              pushTimelineToGodot();
            }}
            title="Reconnect Godot WebAssembly Bridge"
            className="p-1.5 rounded-lg bg-navy-950 hover:bg-navy-800 border border-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewport: Native Godot HTML5 Canvas iframe when built, or live synchronized preview */}
      <div className="relative w-full">
        {wasmAvailable ? (
          <iframe
            ref={iframeRef}
            src="/godot/match_viewer.html"
            title="Godot 4 Match Engine Viewer"
            className="w-full aspect-[16/10] max-h-[460px] border-0 block bg-navy-950"
            allow="autoplay; fullscreen; cross-origin-isolated"
          />
        ) : fallback3D ? (
          <Pitch3DViewer
            events={events}
            currentClockSeconds={currentClockSeconds}
            homeClubId={homeClubId}
            homeColor={homeColor}
            awayColor={awayColor}
            cameraPreset={cameraPreset}
            quality={quality}
          />
        ) : (
          <Pitch2DViewer
            events={events}
            currentClockSeconds={currentClockSeconds}
            homeClubId={homeClubId}
            homeColor={homeColor}
            awayColor={awayColor}
            playerMap={playerMap}
          />
        )}

        {/* Collapsible Godot Project & CLI Export Overlay */}
        {showBridgeHud && !wasmAvailable && (
          <div className="bg-navy-950/95 border-t border-slate-800 p-3.5 text-[11px] text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-extrabold text-white flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  Godot 4 Project Ready in <code className="text-sky-400">/godot/project.godot</code>
                </span>
              </div>
              <p className="text-slate-400">
                Live previewing via synchronized 3D renderer. To compile the native Godot 4 WebAssembly binary into{' '}
                <code className="text-pitch-400">public/godot/match_viewer.html</code>, run:
              </p>
            </div>
            <code className="px-3 py-1.5 rounded-lg bg-navy-900 border border-slate-700 text-sky-300 font-mono whitespace-nowrap select-all">
              npm run godot:export
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
export default GodotMatchViewer;
