import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BandId, ModulationType, EmergencyChannel, InterceptedTransmission, EasAlertData } from './types/radio';
import { BAND_CONFIGS, INITIAL_EMERGENCY_CHANNELS } from './utils/emergencyPresets';
import { audioEngine } from './utils/audioEngine';
import { createTransmissionForChannel, SIMULATED_INCIDENTS } from './utils/transmissionSimulator';
import { Header } from './components/Header';
import { SpectrumWaterfall } from './components/SpectrumWaterfall';
import { ScannerTuner } from './components/ScannerTuner';
import { SignalMeters } from './components/SignalMeters';
import { ScannerControls } from './components/ScannerControls';
import { EmergencyFeed } from './components/EmergencyFeed';
import { MemoryBank } from './components/MemoryBank';
import { AlertDecoder } from './components/AlertDecoder';
import { Radio, ShieldAlert, Activity, Layers, Sparkles } from 'lucide-react';

const STORAGE_KEY_CHANNELS = 'emergency_scanner_channels_v1';

export default function App() {
  // --- Persistent Channels State ---
  const [channels, setChannels] = useState<EmergencyChannel[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHANNELS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return INITIAL_EMERGENCY_CHANNELS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
    } catch {
      // Ignore
    }
  }, [channels]);

  // --- Radio Scanner State ---
  const [currentBand, setCurrentBand] = useState<BandId>('UHF');
  const [currentFreq, setCurrentFreq] = useState<number>(453.150);
  const [modulation, setModulation] = useState<ModulationType>('NFM');
  const [stepKHz, setStepKHz] = useState<number>(12.5);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMode, setScanMode] = useState<'MEM_SCAN' | 'BAND_SWEEP'>('MEM_SCAN');
  const [scanSpeedMs, setScanSpeedMs] = useState<number>(40); // 25 ch/s
  const [priorityWatch, setPriorityWatch] = useState<boolean>(true);
  const [squelch, setSquelch] = useState<number>(25); // 0 to 100
  const [volume, setVolume] = useState<number>(0.75);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [palette, setPalette] = useState<'amber' | 'cyan' | 'emerald' | 'monochrome'>('amber');
  const [activeView, setActiveView] = useState<'scanner' | 'memory' | 'alerts' | 'log'>('scanner');

  // Signal & Telemetry State
  const [activeSignal, setActiveSignal] = useState<InterceptedTransmission | null>(null);
  const [rssi, setRssi] = useState<number>(-112);
  const [snr, setSnr] = useState<number>(0);
  const [transmissions, setTransmissions] = useState<InterceptedTransmission[]>([]);
  const [currentEasAlert, setCurrentEasAlert] = useState<EasAlertData | null>(null);

  // Scan loop references
  const scanIndexRef = useRef<number>(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const priorityTimerRef = useRef<number>(0);

  // Find channel matching current frequency
  const matchedChannel = channels.find(
    ch => Math.abs(ch.frequency - currentFreq) < 0.005
  );

  // Initialize seed transmissions for demonstration
  useEffect(() => {
    const initialTxs: InterceptedTransmission[] = [
      createTransmissionForChannel(INITIAL_EMERGENCY_CHANNELS[0]),
      createTransmissionForChannel(INITIAL_EMERGENCY_CHANNELS[7]),
      createTransmissionForChannel(INITIAL_EMERGENCY_CHANNELS[13]),
    ];
    setTransmissions(initialTxs);
    if (initialTxs[0].easAlert) {
      setCurrentEasAlert(initialTxs[0].easAlert);
    }
  }, []);

  // Sync Audio Engine Volume & Squelch
  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    audioEngine.setMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    audioEngine.updateSquelchGate(activeSignal !== null, squelch, rssi);
  }, [activeSignal, squelch, rssi]);

  // Handle Band Changes
  const handleBandChange = useCallback((newBand: BandId) => {
    setCurrentBand(newBand);
    const config = BAND_CONFIGS[newBand];
    setModulation(config.defaultModulation);
    setStepKHz(config.defaultStep);

    // Pick first channel in this band or minFreq
    const channelInBand = channels.find(ch => ch.band === newBand && !ch.lockout);
    if (channelInBand) {
      setCurrentFreq(channelInBand.frequency);
    } else {
      setCurrentFreq(config.minFreq);
    }
  }, [channels]);

  // Direct frequency selection (from waterfall or keypad)
  const handleFrequencySelect = useCallback((freq: number) => {
    setCurrentFreq(freq);
    // Find matching channel or auto-switch modulation for TV frequencies
    const match = channels.find(ch => Math.abs(ch.frequency - freq) < 0.01);
    if (match) {
      setModulation(match.modulation);
      if (match.band !== currentBand && currentBand !== 'ALL') {
        setCurrentBand(match.band);
      }
    } else {
      if ((freq >= 54 && freq <= 88) || (freq >= 174 && freq <= 216)) {
        setModulation('WFM');
      } else {
        setModulation('NFM');
      }
    }

    // Trigger signal check on new frequency
    checkSignalAtFrequency(freq);
  }, [channels, currentBand]);

  // Signal detection simulator at frequency
  const checkSignalAtFrequency = useCallback((freq: number) => {
    const matchingCh = channels.find(
      ch => Math.abs(ch.frequency - freq) < 0.015 && !ch.lockout
    );

    if (matchingCh && Math.random() > 0.3) {
      // Generate active transmission
      const newTx = createTransmissionForChannel(matchingCh);
      setActiveSignal(newTx);
      setRssi(newTx.rssi);
      setSnr(newTx.snr);

      setTransmissions(prev => [newTx, ...prev.slice(0, 49)]);

      if (newTx.easAlert) {
        setCurrentEasAlert(newTx.easAlert);
      }

      // Audio notification if unmuted
      if (!isMuted) {
        audioEngine.init();
        if (newTx.alertTone === 'EAS_1050') {
          audioEngine.playEasAlertTone(1.8);
        } else if (newTx.alertTone === 'QUIK_CALL_2') {
          audioEngine.playTwoToneAlert();
        }
      }

      // Hold scan for signal duration (e.g. 5 seconds)
      return newTx.durationSec;
    } else {
      // Noise floor
      const noiseRssi = Math.floor(-118 + Math.random() * 8);
      setRssi(noiseRssi);
      setSnr(Math.floor(Math.random() * 3));
      setActiveSignal(null);
      return 0;
    }
  }, [channels, isMuted]);

  // Main Scanning Loop
  useEffect(() => {
    if (!isScanning) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      return;
    }

    const eligibleChannels = channels.filter(
      ch => (currentBand === 'ALL' || ch.band === currentBand) && !ch.lockout
    );

    const interval = setInterval(() => {
      // 1. Check Priority Channel Watch every ~2.5s
      priorityTimerRef.current += scanSpeedMs;
      if (priorityWatch && priorityTimerRef.current >= 2500) {
        priorityTimerRef.current = 0;
        const priorityCh = channels.find(ch => ch.priority && !ch.lockout);
        if (priorityCh && Math.random() > 0.6) {
          setCurrentFreq(priorityCh.frequency);
          const holdSec = checkSignalAtFrequency(priorityCh.frequency);
          if (holdSec > 0) {
            setIsScanning(false);
            holdTimerRef.current = setTimeout(() => {
              audioEngine.playSquelchTail();
              setActiveSignal(null);
              setIsScanning(true);
            }, holdSec * 1000);
            return;
          }
        }
      }

      // 2. Perform regular Scan Step
      if (scanMode === 'MEM_SCAN') {
        if (eligibleChannels.length === 0) return;
        scanIndexRef.current = (scanIndexRef.current + 1) % eligibleChannels.length;
        const targetCh = eligibleChannels[scanIndexRef.current];
        setCurrentFreq(targetCh.frequency);
        setModulation(targetCh.modulation);

        // Check for carrier activity (simulated intercept)
        // 25% chance of finding carrier on programmed channel
        if (Math.random() < 0.28) {
          const holdSec = checkSignalAtFrequency(targetCh.frequency);
          if (holdSec > 0) {
            // Pause scanner while transmission is active
            setIsScanning(false);
            holdTimerRef.current = setTimeout(() => {
              audioEngine.playSquelchTail();
              setActiveSignal(null);
              setIsScanning(true);
            }, holdSec * 1000);
          }
        } else {
          setActiveSignal(null);
          setRssi(Math.floor(-116 + Math.random() * 6));
          setSnr(Math.floor(Math.random() * 2));
        }
      } else {
        // BAND_SWEEP mode: advance by stepKHz
        const bandConf = BAND_CONFIGS[currentBand];
        const nextFreq = currentFreq + stepKHz / 1000;
        const wrappedFreq = nextFreq > bandConf.maxFreq ? bandConf.minFreq : nextFreq;
        const rounded = Math.round(wrappedFreq * 10000) / 10000;
        setCurrentFreq(rounded);

        // Check if frequency aligns with channel
        const match = channels.find(ch => Math.abs(ch.frequency - rounded) < 0.015);
        if (match && Math.random() < 0.35) {
          const holdSec = checkSignalAtFrequency(match.frequency);
          if (holdSec > 0) {
            setIsScanning(false);
            holdTimerRef.current = setTimeout(() => {
              audioEngine.playSquelchTail();
              setActiveSignal(null);
              setIsScanning(true);
            }, holdSec * 1000);
          }
        } else {
          setActiveSignal(null);
          setRssi(Math.floor(-117 + Math.random() * 5));
          setSnr(0);
        }
      }
    }, scanSpeedMs);

    return () => clearInterval(interval);
  }, [
    isScanning,
    scanMode,
    scanSpeedMs,
    currentBand,
    currentFreq,
    stepKHz,
    channels,
    priorityWatch,
    checkSignalAtFrequency,
  ]);

  // Channel Management handlers
  const handleTogglePriority = (channelId: string) => {
    setChannels(prev =>
      prev.map(ch => (ch.id === channelId ? { ...ch, priority: !ch.priority } : ch))
    );
  };

  const handleToggleLockout = (channelId: string) => {
    setChannels(prev =>
      prev.map(ch => (ch.id === channelId ? { ...ch, lockout: !ch.lockout } : ch))
    );
  };

  const handleAddChannel = (newChannel: EmergencyChannel) => {
    setChannels(prev => [newChannel, ...prev]);
  };

  const handleDeleteChannel = (channelId: string) => {
    setChannels(prev => prev.filter(ch => ch.id !== channelId));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all frequency channels to factory emergency presets?')) {
      setChannels(INITIAL_EMERGENCY_CHANNELS);
      localStorage.removeItem(STORAGE_KEY_CHANNELS);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* Top Bar Header conforming to Top Bar Contract */}
      <Header
        isScanning={isScanning}
        isMuted={isMuted}
        onToggleScan={() => {
          audioEngine.init();
          setIsScanning(!isScanning);
        }}
        onToggleMute={() => {
          audioEngine.init();
          setIsMuted(!isMuted);
        }}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Workspace Layout (Asymmetric Console 1440px baseline) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Top Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              <span>RF RECEIVER ACTIVE</span>
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>CURRENT BAND: <strong className="text-amber-400">{BAND_CONFIGS[currentBand].name}</strong></span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>SCAN STATE: <strong className={isScanning ? 'text-emerald-400' : 'text-slate-400'}>{isScanning ? 'SWEEPING' : 'IDLE'}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px]">PALETTE:</span>
              {(['amber', 'cyan', 'emerald', 'monochrome'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPalette(p)}
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase cursor-pointer ${
                    palette === p ? 'bg-slate-700 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.slice(0, 3)}
                </button>
              ))}
            </div>

            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>UTC {new Date().toISOString().substring(11, 19)}Z</span>
          </div>
        </div>

        {/* 2-Column Main Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Tuner Controls, S-Meter & Scan Management (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Digital VFO Tuner */}
            <ScannerTuner
              currentFreq={currentFreq}
              currentBand={currentBand}
              modulation={modulation}
              stepKHz={stepKHz}
              matchedChannel={matchedChannel}
              onBandChange={handleBandChange}
              onFrequencyChange={handleFrequencySelect}
              onModulationChange={setModulation}
              onStepChange={setStepKHz}
            />

            {/* S-Meter & Precision RSSI / SNR Readouts */}
            <SignalMeters
              rssi={rssi}
              snr={snr}
              activeSignal={activeSignal}
              modulation={modulation}
              squelch={squelch}
            />

            {/* Scanner Controls (Scan Trigger, Squelch, Speed, Volume) */}
            <ScannerControls
              isScanning={isScanning}
              scanMode={scanMode}
              scanSpeedMs={scanSpeedMs}
              priorityWatch={priorityWatch}
              volume={volume}
              isMuted={isMuted}
              squelch={squelch}
              onToggleScan={() => {
                audioEngine.init();
                setIsScanning(!isScanning);
              }}
              onScanModeChange={setScanMode}
              onScanSpeedChange={setScanSpeedMs}
              onTogglePriority={() => setPriorityWatch(!priorityWatch)}
              onVolumeChange={setVolume}
              onToggleMute={() => {
                audioEngine.init();
                setIsMuted(!isMuted);
              }}
              onSquelchChange={setSquelch}
            />
          </div>

          {/* Right Column: Spectrum Waterfall, EAS Decoder & Multi-Band Navigation (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 60fps RF Spectrum & Waterfall Display */}
            <SpectrumWaterfall
              currentFreq={currentFreq}
              currentBand={currentBand}
              modulation={modulation}
              channels={channels}
              activeSignal={activeSignal}
              palette={palette}
              onFrequencySelect={handleFrequencySelect}
            />

            {/* EAS / SAME Alert Decoder & Diagnostic Tone Tester */}
            <AlertDecoder
              currentEasAlert={currentEasAlert}
              onClearAlert={() => setCurrentEasAlert(null)}
            />

            {/* Tabbed View between Dispatch Log and Memory Banks */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveView('scanner')}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded cursor-pointer transition-colors ${
                  activeView === 'scanner' || activeView === 'log'
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Intercepted Dispatch Log
              </button>
              <button
                type="button"
                onClick={() => setActiveView('memory')}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded cursor-pointer transition-colors ${
                  activeView === 'memory'
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Emergency Memory Banks ({channels.length})
              </button>
            </div>

            {/* Render Selected View */}
            {activeView === 'memory' ? (
              <MemoryBank
                channels={channels}
                currentFreq={currentFreq}
                onSelectChannel={(ch) => {
                  handleFrequencySelect(ch.frequency);
                  if (ch.band !== currentBand && currentBand !== 'ALL') {
                    setCurrentBand(ch.band);
                  }
                  setModulation(ch.modulation);
                }}
                onTogglePriority={handleTogglePriority}
                onToggleLockout={handleToggleLockout}
                onAddChannel={handleAddChannel}
                onDeleteChannel={handleDeleteChannel}
                onResetDefaults={handleResetDefaults}
              />
            ) : (
              <EmergencyFeed
                transmissions={transmissions}
                activeSignal={activeSignal}
                onClearTransmissions={() => setTransmissions([])}
                onSelectFrequency={handleFrequencySelect}
              />
            )}
          </div>
        </div>

        {/* Informational Band Guide Strip (Zero-Pill, Unboxed Metadata) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs font-mono text-slate-400">
          <div className="bg-[#0B0F19] border border-slate-800/80 p-3 rounded-lg flex flex-col gap-1">
            <div className="text-slate-200 font-semibold flex items-center justify-between">
              <span>TV1 (VHF-Low): 54 – 88 MHz</span>
              <span className="text-amber-400">CH 2–6</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Monitors broadcast television FM audio carriers (59.75, 65.75, 71.75, 81.75, 87.75 MHz) transmitting regional EAS emergency weather bulletins, flash flood alarms, and 72 MHz roadside emergency callboxes.
            </p>
          </div>

          <div className="bg-[#0B0F19] border border-slate-800/80 p-3 rounded-lg flex flex-col gap-1">
            <div className="text-slate-200 font-semibold flex items-center justify-between">
              <span>TV2 (VHF-High): 174 – 216 MHz</span>
              <span className="text-amber-400">CH 7–13</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Monitors high-band TV audio carriers (179.75 to 215.75 MHz) carrying civil emergency evacuation alerts, EAS network tests, and Broadcast Auxiliary Service (BAS) field news interop links.
            </p>
          </div>

          <div className="bg-[#0B0F19] border border-slate-800/80 p-3 rounded-lg flex flex-col gap-1">
            <div className="text-slate-200 font-semibold flex items-center justify-between">
              <span>UHF Public Safety: 400 – 512 MHz</span>
              <span className="text-cyan-400">INTEROP & EMS</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Monitors National Interoperability (UCALL40 453.150, UTAC41-44), EMS Med-Channels (MED 1–10 463.xxx), Fire Ground Tactical, SWAT, FEMA US&R (408.400), and 406.025 MHz emergency distress beacons.
            </p>
          </div>
        </div>
      </main>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs font-mono text-slate-500">
        <span>TV1 · TV2 · UHF Tactical Radio Band Scanner · Real-Time Public Safety & EAS Audio Monitor</span>
      </footer>
    </div>
  );
}
