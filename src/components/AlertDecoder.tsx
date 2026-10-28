import React, { useState } from 'react';
import { EasAlertData } from '../types/radio';
import { AlertTriangle, Bell, Radio, CheckCircle, Volume2 } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface AlertDecoderProps {
  currentEasAlert: EasAlertData | null;
  onClearAlert: () => void;
}

export const AlertDecoder: React.FC<AlertDecoderProps> = ({
  currentEasAlert,
  onClearAlert,
}) => {
  const [testPlaying, setTestPlaying] = useState<string | null>(null);

  const playTone = (type: 'eas' | '1050' | 'twotone' | 'roger') => {
    setTestPlaying(type);
    audioEngine.init();

    if (type === 'eas') {
      audioEngine.playEasAlertTone(3.0);
    } else if (type === '1050') {
      audioEngine.playEasAlertTone(2.0);
    } else if (type === 'twotone') {
      audioEngine.playTwoToneAlert(645.7, 855.5);
    } else if (type === 'roger') {
      audioEngine.playRogerBeep();
    }

    setTimeout(() => {
      setTestPlaying(null);
    }, 2500);
  };

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100 font-mono tracking-wide">
            EAS / SAME ALERT DECODER & TONE TELEMETRY
          </h3>
        </div>
        {currentEasAlert && (
          <button
            type="button"
            onClick={onClearAlert}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Acknowledge & Clear
          </button>
        )}
      </div>

      {/* Active EAS Alert Box or Standby Banner */}
      {currentEasAlert ? (
        <div className="p-3 bg-red-950/40 border border-red-700/80 rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-red-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              CRITICAL EMERGENCY BROADCAST DECODED
            </span>
            <span className="text-[11px] font-mono text-red-300 font-semibold bg-red-900/60 px-2 py-0.5 rounded border border-red-700">
              {currentEasAlert.urgency}
            </span>
          </div>

          <div className="text-base font-bold text-white font-mono">
            {currentEasAlert.eventName} ({currentEasAlert.eventCode})
          </div>

          {/* SAME Raw Header Code */}
          <div className="p-2 bg-slate-950/80 rounded border border-slate-800 font-mono text-[11px] text-amber-300 break-all select-all">
            {currentEasAlert.sameCode}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-red-900/40">
            <span>ISSUER: {currentEasAlert.issuer}</span>
            <span>EXPIRES IN: ~{currentEasAlert.expiresInMinutes} MIN</span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>NO ACTIVE EAS WARNINGS CURRENTLY INTERCEPTED</span>
          </div>
          <span className="text-slate-500">STANDBY MONITORED</span>
        </div>
      )}

      {/* Diagnostic Tone Generators Bar */}
      <div className="pt-2">
        <div className="text-xs font-mono text-slate-400 mb-2">DIAGNOSTIC ALERT TONE SYNTHESIZER:</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => playTone('eas')}
            disabled={testPlaying !== null}
            className={`py-2 px-2 rounded border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              testPlaying === 'eas'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>EAS Dual Tone</span>
          </button>

          <button
            type="button"
            onClick={() => playTone('1050')}
            disabled={testPlaying !== null}
            className={`py-2 px-2 rounded border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              testPlaying === '1050'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>1050 Hz Siren</span>
          </button>

          <button
            type="button"
            onClick={() => playTone('twotone')}
            disabled={testPlaying !== null}
            className={`py-2 px-2 rounded border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              testPlaying === 'twotone'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-emerald-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Quik-Call II</span>
          </button>

          <button
            type="button"
            onClick={() => playTone('roger')}
            disabled={testPlaying !== null}
            className={`py-2 px-2 rounded border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              testPlaying === 'roger'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Roger Beep</span>
          </button>
        </div>
      </div>
    </div>
  );
};
