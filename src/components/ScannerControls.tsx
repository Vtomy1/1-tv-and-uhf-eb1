import React from 'react';
import { Play, Square, Volume2, VolumeX, ShieldAlert, Sliders, Zap } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface ScannerControlsProps {
  isScanning: boolean;
  scanMode: 'MEM_SCAN' | 'BAND_SWEEP';
  scanSpeedMs: number;
  priorityWatch: boolean;
  volume: number;
  isMuted: boolean;
  squelch: number;
  onToggleScan: () => void;
  onScanModeChange: (mode: 'MEM_SCAN' | 'BAND_SWEEP') => void;
  onScanSpeedChange: (speedMs: number) => void;
  onTogglePriority: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onSquelchChange: (sq: number) => void;
}

export const ScannerControls: React.FC<ScannerControlsProps> = ({
  isScanning,
  scanMode,
  scanSpeedMs,
  priorityWatch,
  volume,
  isMuted,
  squelch,
  onToggleScan,
  onScanModeChange,
  onScanSpeedChange,
  onTogglePriority,
  onVolumeChange,
  onToggleMute,
  onSquelchChange,
}) => {
  const handleTriggerTestTone = () => {
    audioEngine.init();
    audioEngine.playEasAlertTone(1.8);
  };

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-4 flex flex-col gap-4 text-slate-200">
      {/* 1. Main Scan Trigger & Scan Mode */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggleScan}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-mono font-semibold text-sm transition-all shadow-md cursor-pointer ${
            isScanning
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isScanning ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>PAUSE SCAN</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>START SCANNER</span>
            </>
          )}
        </button>

        {/* Scan Mode Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => onScanModeChange('MEM_SCAN')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              scanMode === 'MEM_SCAN'
                ? 'bg-slate-750 text-amber-300 font-semibold bg-slate-800 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MEMORY SCAN
          </button>
          <button
            type="button"
            onClick={() => onScanModeChange('BAND_SWEEP')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              scanMode === 'BAND_SWEEP'
                ? 'bg-slate-750 text-amber-300 font-semibold bg-slate-800 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            BAND SWEEP
          </button>
        </div>

        {/* Priority Watch Toggle */}
        <button
          type="button"
          onClick={onTogglePriority}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
            priorityWatch
              ? 'bg-red-950/70 border-red-700 text-red-300 font-semibold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Interrupts scan every 2 seconds to check designated Priority Channel"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>PRIORITY: {priorityWatch ? 'ACTIVE' : 'OFF'}</span>
        </button>
      </div>

      {/* 2. Squelch & Speed Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
        {/* Squelch Control */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>RF SQUELCH THRESHOLD</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-200 font-semibold tabular-nums">{squelch}%</span>
              <button
                type="button"
                onClick={() => onSquelchChange(25)}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                Auto (25%)
              </button>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={squelch}
            onChange={(e) => onSquelchChange(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0% (Open Static)</span>
            <span>50% (Normal)</span>
            <span>100% (Tight)</span>
          </div>
        </div>

        {/* Scan Speed Control */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>SCAN RATE (CH/SEC)</span>
            </span>
            <span className="text-slate-200 font-semibold font-mono">
              {Math.round(1000 / scanSpeedMs)} ch/s
            </span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {[
              { label: '10 ch/s', ms: 100 },
              { label: '25 ch/s', ms: 40 },
              { label: '50 ch/s', ms: 20 },
              { label: '100 ch/s', ms: 10 },
            ].map((sp) => (
              <button
                key={sp.label}
                type="button"
                onClick={() => onScanSpeedChange(sp.ms)}
                className={`flex-1 py-1 text-xs font-mono rounded cursor-pointer transition-colors ${
                  scanSpeedMs === sp.ms
                    ? 'bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 font-semibold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Audio Volume, Mute & Tone Generator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onToggleMute}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-red-950/60 border-red-800 text-red-400'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 flex-1 sm:w-48">
            <span className="text-xs font-mono text-slate-400">VOL</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg"
            />
            <span className="text-xs font-mono text-slate-300 tabular-nums w-8">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        </div>

        {/* Tone Generator Test Button */}
        <button
          type="button"
          onClick={handleTriggerTestTone}
          className="w-full sm:w-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-900/60 rounded-lg text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Play standard EAS 1050 Hz warning attention siren"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>TEST EAS 1050Hz SIREN</span>
        </button>
      </div>
    </div>
  );
};
