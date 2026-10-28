import React, { useState } from 'react';
import { BandId, ModulationType, EmergencyChannel } from '../types/radio';
import { BAND_CONFIGS } from '../utils/emergencyPresets';
import { ChevronLeft, ChevronRight, Hash, Radio, RotateCcw } from 'lucide-react';

interface ScannerTunerProps {
  currentFreq: number;
  currentBand: BandId;
  modulation: ModulationType;
  stepKHz: number;
  matchedChannel: EmergencyChannel | undefined;
  onBandChange: (band: BandId) => void;
  onFrequencyChange: (freq: number) => void;
  onModulationChange: (mod: ModulationType) => void;
  onStepChange: (step: number) => void;
}

export const ScannerTuner: React.FC<ScannerTunerProps> = ({
  currentFreq,
  currentBand,
  modulation,
  stepKHz,
  matchedChannel,
  onBandChange,
  onFrequencyChange,
  onModulationChange,
  onStepChange,
}) => {
  const [directInputOpen, setDirectInputOpen] = useState(false);
  const [customInputVal, setCustomInputVal] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const bandConfig = BAND_CONFIGS[currentBand];

  const handleStep = (direction: 'up' | 'down', stepMultiplier = 1) => {
    const deltaMHz = (stepKHz / 1000) * stepMultiplier;
    const newFreq = direction === 'up' ? currentFreq + deltaMHz : currentFreq - deltaMHz;
    const boundedFreq = Math.max(bandConfig.minFreq, Math.min(bandConfig.maxFreq, newFreq));
    onFrequencyChange(Math.round(boundedFreq * 10000) / 10000);
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customInputVal.trim());
    if (isNaN(val)) {
      setInputError('Invalid numeric frequency');
      return;
    }
    if (val < 50.0 || val > 520.0) {
      setInputError('Frequency must be between 50.0 and 520.0 MHz');
      return;
    }

    // Auto-detect band based on frequency
    let targetBand: BandId = currentBand;
    if (val >= 54 && val <= 88) targetBand = 'TV1';
    else if (val >= 174 && val <= 216) targetBand = 'TV2';
    else if (val >= 400 && val <= 512) targetBand = 'UHF';

    if (targetBand !== currentBand && currentBand !== 'ALL') {
      onBandChange(targetBand);
    }

    onFrequencyChange(Math.round(val * 10000) / 10000);
    setDirectInputOpen(false);
    setCustomInputVal('');
    setInputError(null);
  };

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
      {/* 1. Band Selector Segmented Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <span className="text-xs font-mono font-medium text-slate-400">BAND SELECT</span>
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {(['TV1', 'TV2', 'UHF', 'ALL'] as BandId[]).map((band) => (
            <button
              key={band}
              type="button"
              onClick={() => onBandChange(band)}
              className={`px-3 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                currentBand === band
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {band === 'ALL' ? 'ALL-BAND' : band}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Frequency Display LCD Panel */}
      <div className="relative bg-[#05070B] border border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center shadow-inner">
        {/* Top Channel Alpha Tag */}
        <div className="w-full flex items-center justify-between text-xs font-mono mb-1 text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-slate-300">
              {matchedChannel ? matchedChannel.channelName : 'MANUAL VFO TUNING'}
            </span>
          </div>
          <span>
            {matchedChannel ? matchedChannel.agency : `${bandConfig.minFreq} - ${bandConfig.maxFreq} MHz`}
          </span>
        </div>

        {/* Large Tabular Frequency Numbers */}
        <div className="flex items-baseline gap-1 my-1">
          <span className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-amber-400 tabular-nums select-all">
            {currentFreq.toFixed(4)}
          </span>
          <span className="text-sm font-mono uppercase text-slate-400">MHz</span>
        </div>

        {/* Channel Details / Modulation row */}
        <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
          <div className="flex items-center gap-2">
            <span>MOD: <strong className="text-slate-200">{modulation}</strong></span>
            <span>·</span>
            <span>STEP: <strong className="text-slate-200">{stepKHz} kHz</strong></span>
          </div>

          <button
            type="button"
            onClick={() => setDirectInputOpen(!directInputOpen)}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <Hash className="w-3 h-3" />
            <span>Direct Entry</span>
          </button>
        </div>

        {/* Direct Frequency Keypad Dialog */}
        {directInputOpen && (
          <form onSubmit={handleDirectSubmit} className="mt-3 w-full bg-slate-900/90 border border-slate-700 p-2.5 rounded flex flex-col gap-2">
            <div className="text-xs font-mono text-slate-300">Enter Exact Frequency (MHz):</div>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.001"
                placeholder="e.g. 87.750 or 453.150"
                value={customInputVal}
                onChange={(e) => setCustomInputVal(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 text-amber-300 font-mono text-sm px-2.5 py-1.5 rounded focus:outline-none focus:border-amber-400"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-semibold text-xs rounded cursor-pointer whitespace-nowrap"
              >
                Tune
              </button>
              <button
                type="button"
                onClick={() => setDirectInputOpen(false)}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded cursor-pointer"
              >
                Cancel
              </button>
            </div>
            {inputError && <div className="text-xs font-mono text-red-400">{inputError}</div>}
          </form>
        )}
      </div>

      {/* 3. Fine & Coarse Frequency Step Stepper Bar */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => handleStep('down', 40)}
          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded border border-slate-800 transition-colors cursor-pointer"
          title="-1 MHz Coarse"
        >
          <ChevronLeft className="w-3 h-3" />
          <span>-1.0M</span>
        </button>

        <button
          type="button"
          onClick={() => handleStep('down', 1)}
          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded border border-slate-800 transition-colors cursor-pointer"
          title="Step Down"
        >
          <ChevronLeft className="w-3 h-3" />
          <span>-{stepKHz}k</span>
        </button>

        <button
          type="button"
          onClick={() => handleStep('up', 1)}
          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded border border-slate-800 transition-colors cursor-pointer"
          title="Step Up"
        >
          <span>+{stepKHz}k</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => handleStep('up', 40)}
          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded border border-slate-800 transition-colors cursor-pointer"
          title="+1 MHz Coarse"
        >
          <span>+1.0M</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 4. Sub-Controls: Modulation & Step Size */}
      <div className="flex items-center justify-between text-xs font-mono pt-1 text-slate-400">
        <div className="flex items-center gap-1">
          <span className="text-[11px] mr-1">DEMOD:</span>
          {(['WFM', 'NFM', 'AM'] as ModulationType[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModulationChange(m)}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                modulation === m
                  ? 'bg-slate-700 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] mr-1">STEP:</span>
          {[12.5, 25, 50, 100].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStepChange(s)}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                stepKHz === s
                  ? 'bg-slate-700 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}k
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
