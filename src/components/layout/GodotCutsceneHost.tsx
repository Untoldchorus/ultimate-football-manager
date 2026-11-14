'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, FastForward } from 'lucide-react';
import { CanonicalCutsceneId } from '@/engine/types';
import { CutsceneQuality } from '@/services/cutsceneTriggerService';

interface GodotCutsceneHostProps {
  cutsceneId: CanonicalCutsceneId;
  params: Record<string, unknown>;
  quality: CutsceneQuality;
  onFinished: () => void;
  onSkip: () => void;
}

export function GodotCutsceneHost({
  cutsceneId,
  params,
  quality,
  onFinished,
  onSkip,
}: GodotCutsceneHostProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!ready) {
        onSkip();
      }
    }, 6500);
    return () => window.clearTimeout(timeout);
  }, [ready, onSkip]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string } | null;
      if (!data?.type) return;
      if (data.type === 'GODOT_VIEWER_READY') {
        setReady(true);
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'PLAY_CUTSCENE', cutsceneId, params, quality },
          window.location.origin
        );
      } else if (data.type === 'CUTSCENE_COMPLETE' || data.type === 'CUTSCENE_SKIPPED') {
        onFinished();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [cutsceneId, params, quality, onFinished]);

  useEffect(() => {
    if (ready) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'PLAY_CUTSCENE', cutsceneId, params, quality },
        window.location.origin
      );
    }
  }, [ready, cutsceneId, params, quality]);

  return (
    <div className="relative w-full h-full bg-navy-950 rounded-2xl overflow-hidden">
      {!ready && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-navy-950/95">
          <Loader2 className="w-8 h-8 text-pitch-400 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Loading Godot 3D Cutscene ({cutsceneId})...
          </p>
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5"
          >
            <FastForward className="w-3.5 h-3.5" />
            Skip
          </button>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/godot/match_viewer.html"
        title={`Godot Cutscene: ${cutsceneId}`}
        className="w-full h-full border-0"
      />
    </div>
  );
}
