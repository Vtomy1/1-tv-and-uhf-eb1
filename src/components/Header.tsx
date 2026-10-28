import React from 'react';
import { Volume2, VolumeX, Play, Square } from 'lucide-react';

interface HeaderProps {
  isScanning: boolean;
  isMuted: boolean;
  onToggleScan: () => void;
  onToggleMute: () => void;
  activeView: 'scanner' | 'memory' | 'alerts' | 'log';
  setActiveView: (view: 'scanner' | 'memory' | 'alerts' | 'log') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isScanning,
  isMuted,
  onToggleScan,
  onToggleMute,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-[#07090E] sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#top"
        className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 font-mono flex items-center gap-2"
      >
        <span className="text-amber-400">TV·UHF</span>
        <span>SCANNER</span>
      </a>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400 font-mono">
        <button
          type="button"
          onClick={() => setActiveView('scanner')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeView === 'scanner' ? 'text-amber-400 border-b border-amber-400 pb-0.5' : ''
          }`}
        >
          Spectrum
        </button>
        <button
          type="button"
          onClick={() => setActiveView('memory')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeView === 'memory' ? 'text-amber-400 border-b border-amber-400 pb-0.5' : ''
          }`}
        >
          Channels
        </button>
        <button
          type="button"
          onClick={() => setActiveView('alerts')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeView === 'alerts' ? 'text-amber-400 border-b border-amber-400 pb-0.5' : ''
          }`}
        >
          Alerts
        </button>
        <button
          type="button"
          onClick={() => setActiveView('log')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeView === 'log' ? 'text-amber-400 border-b border-amber-400 pb-0.5' : ''
          }`}
        >
          Dispatches
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMute}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            isMuted
              ? 'bg-red-950/60 border-red-800 text-red-400'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
          }`}
          title={isMuted ? 'Unmute Audio Static' : 'Mute Audio Static'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          type="button"
          onClick={onToggleScan}
          className={`px-4 py-2 text-xs font-mono font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
            isScanning
              ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          {isScanning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Halt Scan</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Engage Scanner</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
