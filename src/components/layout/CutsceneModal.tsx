import React, { useEffect } from 'react';
import { Trophy, Sparkles, X } from 'lucide-react';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';

export function CutsceneModal() {
  const { activeCutscene, triggerCutscene } = useGameStore();

  useEffect(() => {
    if (!activeCutscene) return;
    if (
      activeCutscene.type === 'goalCelebration' ||
      activeCutscene.type === 'trophyPresentation' ||
      activeCutscene.type === 'leagueChampionship'
    ) {
      soundManager.playGoalCheer();
    } else {
      soundManager.playUiClick();
    }
  }, [activeCutscene]);

  if (!activeCutscene) return null;

  return (
    <div
      data-testid="cutscene-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="max-w-lg w-full bg-navy-900 border-2 border-gold-400 rounded-3xl p-8 text-center space-y-5 shadow-2xl relative">
        <button
          type="button"
          data-testid="skip-cutscene-btn"
          onClick={() => triggerCutscene(null)}
          className="absolute top-4 right-4 p-2 rounded-full bg-navy-800 hover:bg-navy-700 text-slate-300"
          aria-label="Skip Cutscene"
        >
          <X className="w-4 h-4" />
        </button>

        <div
          className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-xl border-2 border-white/20"
          style={{
            backgroundColor: activeCutscene.primaryColor ?? '#10b981',
            color: activeCutscene.secondaryColor ?? '#ffffff',
          }}
        >
          {activeCutscene.type === 'trophyPresentation' ||
          activeCutscene.type === 'leagueChampionship' ? (
            <Trophy className="w-10 h-10" />
          ) : (
            <Sparkles className="w-10 h-10" />
          )}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-extrabold uppercase tracking-widest text-gold-400">
            Cinematic Moment &bull; {activeCutscene.type}
          </div>
          <h2 className="text-2xl font-black text-white">{activeCutscene.title}</h2>
          <p className="text-sm text-slate-300">{activeCutscene.subtitle}</p>
        </div>

        <button
          type="button"
          data-testid="continue-cutscene-btn"
          onClick={() => triggerCutscene(null)}
          className="w-full py-3 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white font-extrabold uppercase tracking-wider text-xs transition"
        >
          Continue Career
        </button>
      </div>
    </div>
  );
}
