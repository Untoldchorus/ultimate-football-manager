import React, { useEffect } from 'react';
import { FastForward, Sparkles, Trophy, X } from 'lucide-react';
import { CutsceneType } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';

function CinematicSceneStage({
  type,
  primaryColor,
  secondaryColor,
  clubName,
}: {
  type: CutsceneType;
  primaryColor: string;
  secondaryColor: string;
  clubName: string;
}) {
  const isTrophy = type === 'trophyPresentation' || type === 'leagueChampionship';
  const isGoal = type === 'goalCelebration';
  const isSigning = type === 'playerSigning';
  const isTunnel = type === 'tunnelWalkout';
  const isTalk = type === 'preMatchTalk' || type === 'halfTimeTalk';
  const isUnveiling = type === 'managerIntro';

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-white/15 bg-navy-950 shadow-inner">
      <svg viewBox="0 0 800 320" className="w-full h-full block select-none">
        <defs>
          <linearGradient id="stageSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#020617" />
            <stop offset="65%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <radialGradient id="spotLeft" cx="20%" cy="0%" r="85%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.55" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="spotRight" cx="80%" cy="0%" r="85%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Backdrop */}
        <rect width="800" height="320" fill="url(#stageSky)" />
        <rect width="800" height="320" fill="url(#spotLeft)" />
        <rect width="800" height="320" fill="url(#spotRight)" />

        {/* Sweeping Floodlight Beams */}
        <polygon points="110,0 20,320 280,320" fill="rgba(255,255,255,0.06)" />
        <polygon points="690,0 520,320 780,320" fill="rgba(251,191,36,0.07)" />
        <polygon points="400,0 260,320 540,320" fill="rgba(16,185,129,0.08)" />

        {/* Stadium Tiered Stands Silhouette */}
        <path
          d="M 0 215 L 140 155 L 660 155 L 800 215 L 800 250 L 0 250 Z"
          fill="#0f172a"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1.5"
        />

        {/* Pitch / Stage Floor */}
        <polygon points="0,245 800,245 800,320 0,320" fill="#065f46" />
        <line x1="0" y1="245" x2="800" y2="245" stroke="#10b981" strokeWidth="2" />
        <ellipse cx="400" cy="285" rx="220" ry="26" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />

        {/* Scene-Specific Centerpiece */}
        {(isUnveiling || isSigning) && (
          <g>
            {/* Press Backdrop Wall */}
            <rect
              x="210"
              y="55"
              width="380"
              height="165"
              rx="12"
              fill="#0f172a"
              stroke={primaryColor}
              strokeWidth="3"
            />
            {/* Sponsor & Club Crest Repeat */}
            <text
              x="400"
              y="92"
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="14"
              fontWeight="900"
              letterSpacing="3"
            >
              OFFICIAL CLUB PRESENTATION
            </text>
            <text
              x="400"
              y="115"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="18"
              fontWeight="900"
            >
              {clubName.toUpperCase()}
            </text>

            {/* Held Up Club Jersey */}
            <g transform="translate(400, 185)">
              <path
                d="M -48 -42 L -24 -54 L 24 -54 L 48 -42 L 62 -12 L 40 -4 L 34 -24 L 34 45 L -34 45 L -34 -24 L -40 -4 L -62 -12 Z"
                fill={primaryColor}
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <text
                x="0"
                y="-5"
                textAnchor="middle"
                fill={secondaryColor}
                fontSize="24"
                fontWeight="900"
              >
                {isSigning ? '9' : '1'}
              </text>
              <text
                x="0"
                y="22"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
              >
                {isSigning ? 'NEW SIGNING' : 'MANAGER'}
              </text>
            </g>

            {/* Photographer Flashbulbs */}
            <circle cx="145" cy="240" r="18" fill="rgba(255,255,255,0.75)" className="animate-ping" />
            <circle cx="655" cy="230" r="14" fill="rgba(255,255,255,0.7)" className="animate-ping" />
          </g>
        )}

        {isTunnel && (
          <g>
            {/* Stadium Tunnel Archway */}
            <path
              d="M 270 250 L 270 75 Q 400 35 530 75 L 530 250 Z"
              fill="#020617"
              stroke="#475569"
              strokeWidth="8"
            />
            <rect x="330" y="42" width="140" height="26" rx="6" fill={primaryColor} />
            <text x="400" y="59" textAnchor="middle" fill={secondaryColor} fontSize="11" fontWeight="900">
              THIS IS OUR FORTRESS
            </text>

            {/* Players Walking Out Silhouette */}
            {[-75, -38, 0, 38, 75].map((offset, idx) => (
              <g key={idx} transform={`translate(${400 + offset}, ${195 + (idx % 2) * 12})`}>
                <circle cx="0" cy="-32" r="10" fill="#f8d5b8" />
                <rect
                  x="-12"
                  y="-20"
                  width="24"
                  height="34"
                  rx="5"
                  fill={idx % 2 === 0 ? primaryColor : '#ffffff'}
                />
                <rect x="-10" y="14" width="8" height="22" fill="#0f172a" />
                <rect x="2" y="14" width="8" height="22" fill="#0f172a" />
              </g>
            ))}
          </g>
        )}

        {isTalk && (
          <g>
            {/* Tactical Whiteboard in Dressing Room */}
            <rect
              x="220"
              y="55"
              width="360"
              height="175"
              rx="12"
              fill="#064e3b"
              stroke="#ffffff"
              strokeWidth="4"
            />
            <line x1="400" y1="55" x2="400" y2="230" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
            <circle cx="400" cy="142" r="34" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
            {/* Tactical magnets & arrows */}
            <circle cx="310" cy="142" r="9" fill={primaryColor} stroke="#fff" strokeWidth="2" />
            <circle cx="365" cy="105" r="9" fill={primaryColor} stroke="#fff" strokeWidth="2" />
            <circle cx="365" cy="180" r="9" fill={primaryColor} stroke="#fff" strokeWidth="2" />
            <circle cx="445" cy="135" r="9" fill={primaryColor} stroke="#fff" strokeWidth="2" />
            <path
              d="M 375 105 Q 430 95 485 120"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
              strokeDasharray="6 4"
            />
          </g>
        )}

        {(isGoal || isTrophy || type === 'fullTime') && (
          <g>
            {/* Podium & Trophy / Celebrating Players */}
            <rect
              x="250"
              y="225"
              width="300"
              height="32"
              rx="8"
              fill="#1e293b"
              stroke="#fbbf24"
              strokeWidth="2.5"
            />
            <text x="400" y="246" textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="900" letterSpacing="2">
              {isTrophy ? 'CHAMPIONS PODIUM' : isGoal ? 'GOAL CELEBRATION!' : 'FULL-TIME WHISTLE'}
            </text>

            {/* Golden Trophy Cup in Center */}
            {isTrophy && (
              <g transform="translate(400, 145)">
                <path
                  d="M -28 -45 L 28 -45 L 22 5 Q 0 28 -22 5 Z"
                  fill="#fbbf24"
                  stroke="#fef08a"
                  strokeWidth="2.5"
                />
                <path
                  d="M -28 -35 Q -46 -35 -42 -10 Q -38 8 -22 2"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="5"
                />
                <path
                  d="M 28 -35 Q 46 -35 42 -10 Q 38 8 22 2"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="5"
                />
                <rect x="-8" y="15" width="16" height="24" fill="#d97706" />
                <rect x="-24" y="38" width="48" height="14" rx="3" fill="#0f172a" stroke="#fbbf24" strokeWidth="2" />
              </g>
            )}

            {/* Celebrating Squad Figures with Raised Arms */}
            {[-120, -65, 65, 120].map((xOff, i) => (
              <g key={i} transform={`translate(${400 + xOff}, 185)`}>
                <circle cx="0" cy="-34" r="11" fill="#eec199" />
                <rect x="-13" y="-21" width="26" height="34" rx="5" fill={primaryColor} stroke="#fff" strokeWidth="1.5" />
                {/* Raised Arms */}
                <line x1="-13" y1="-16" x2="-26" y2="-40" stroke={primaryColor} strokeWidth="6" strokeLinecap="round" />
                <line x1="13" y1="-16" x2="26" y2="-40" stroke={primaryColor} strokeWidth="6" strokeLinecap="round" />
                <rect x="-11" y="13" width="9" height="24" fill="#0f172a" />
                <rect x="2" y="13" width="9" height="24" fill="#0f172a" />
              </g>
            ))}

            {/* Confetti Particles */}
            {Array.from({ length: 28 }).map((_, i) => {
              const cx = ((i * 97) % 740) + 30;
              const cy = ((i * 53) % 210) + 20;
              const colors = ['#fbbf24', '#10b981', '#ffffff', primaryColor, '#38bdf8'];
              return (
                <rect
                  key={i}
                  x={cx}
                  y={cy}
                  width="8"
                  height="5"
                  rx="1"
                  fill={colors[i % colors.length]}
                  transform={`rotate(${(i * 37) % 360} ${cx} ${cy})`}
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* Top Overlay Badge */}
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-navy-950/90 border border-gold-400/50 text-[10px] font-black uppercase tracking-widest text-gold-400 flex items-center gap-1.5">
        {isTrophy ? <Trophy className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
        <span>Live Broadcast Cutscene &bull; {type}</span>
      </div>
    </div>
  );
}

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
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="max-w-2xl w-full bg-gradient-to-b from-navy-900 to-navy-950 border-2 border-gold-400/80 rounded-3xl p-6 md:p-8 text-center space-y-5 shadow-2xl relative">
        <button
          type="button"
          data-testid="skip-cutscene-btn"
          onClick={() => triggerCutscene(null)}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-navy-800 hover:bg-navy-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1"
          aria-label="Skip Cutscene"
        >
          <FastForward className="w-3.5 h-3.5 text-gold-400" />
          <span>Skip</span>
          <X className="w-3.5 h-3.5 ml-0.5" />
        </button>

        {/* Animated Cinematic Stage */}
        <CinematicSceneStage
          type={activeCutscene.type}
          primaryColor={activeCutscene.primaryColor ?? '#10b981'}
          secondaryColor={activeCutscene.secondaryColor ?? '#ffffff'}
          clubName={activeCutscene.clubName ?? 'Football Club'}
        />

        <div className="space-y-2">
          <div className="text-xs font-extrabold uppercase tracking-widest text-gold-400">
            {activeCutscene.clubName ? `${activeCutscene.clubName} • ` : ''}
            {activeCutscene.type}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white">{activeCutscene.title}</h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            {activeCutscene.subtitle}
          </p>
        </div>

        <button
          type="button"
          data-testid="continue-cutscene-btn"
          onClick={() => triggerCutscene(null)}
          className="w-full py-3.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-pitch-600/30 transition"
        >
          Continue Career
        </button>
      </div>
    </div>
  );
}
