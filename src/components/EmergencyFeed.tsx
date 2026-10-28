import React, { useState } from 'react';
import { InterceptedTransmission, BandId, EmergencyServiceCategory } from '../types/radio';
import { SERVICE_COLORS } from '../utils/emergencyPresets';
import { Volume2, Radio, Trash2, ArrowDownCircle, AlertTriangle } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

interface EmergencyFeedProps {
  transmissions: InterceptedTransmission[];
  activeSignal: InterceptedTransmission | null;
  onClearTransmissions: () => void;
  onSelectFrequency: (freq: number) => void;
}

export const EmergencyFeed: React.FC<EmergencyFeedProps> = ({
  transmissions,
  activeSignal,
  onClearTransmissions,
  onSelectFrequency,
}) => {
  const [bandFilter, setBandFilter] = useState<'ALL' | BandId>('ALL');
  const [serviceFilter, setServiceFilter] = useState<'ALL' | EmergencyServiceCategory>('ALL');
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);

  const filteredTransmissions = transmissions.filter(t => {
    if (bandFilter !== 'ALL' && t.band !== bandFilter) return false;
    if (serviceFilter !== 'ALL' && t.service !== serviceFilter) return false;
    return true;
  });

  const handlePlayVoice = (tx: InterceptedTransmission) => {
    setIsPlayingId(tx.id);
    audioEngine.init();
    if (tx.alertTone === 'EAS_1050') {
      audioEngine.playEasAlertTone(2.0);
    } else if (tx.alertTone === 'QUIK_CALL_2') {
      audioEngine.playTwoToneAlert();
    }
    audioEngine.speakTransmission(tx.transcript, () => {
      setIsPlayingId(null);
    });
  };

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-100 font-mono tracking-wide">
            INTERCEPTED DISPATCH LOG ({transmissions.length})
          </h3>
        </div>

        {/* Clear Log Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearTransmissions}
            className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Filter Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* Band Filter */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800">
          {(['ALL', 'TV1', 'TV2', 'UHF'] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBandFilter(b)}
              className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                bandFilter === b
                  ? 'bg-slate-800 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Service Type Filter */}
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[11px]">SERVICE:</span>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value as 'ALL' | EmergencyServiceCategory)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 cursor-pointer focus:outline-none"
          >
            <option value="ALL">All Services</option>
            <option value="EAS_BROADCAST">EAS / Broadcast</option>
            <option value="FIRE_RESCUE">Fire & Rescue</option>
            <option value="EMS_PARAMEDIC">EMS & Trauma</option>
            <option value="LAW_ENFORCEMENT">Law Enforcement</option>
            <option value="SEARCH_RESCUE">Search & Rescue</option>
            <option value="INTEROP_TACTICAL">Mutual Aid Tactical</option>
            <option value="CIVIL_DEFENSE">Civil Defense</option>
          </select>
        </div>
      </div>

      {/* Active Transmission Highlight Banner */}
      {activeSignal && (
        <div className="bg-red-950/30 border border-red-700/60 rounded-lg p-3 flex items-start gap-3">
          <div className="p-2 bg-red-900/50 rounded text-red-300 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-red-300 mb-1">
              <span className="font-bold uppercase tracking-wide">LIVE TRANSMISSION DETECTED</span>
              <span aria-hidden="true">·</span>
              <span className="text-white font-semibold">{activeSignal.frequency.toFixed(4)} MHz ({activeSignal.band})</span>
              <span aria-hidden="true">·</span>
              <span className="text-red-200">{activeSignal.channelName}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-400">RSSI {activeSignal.rssi} dBm</span>
            </div>
            <p className="text-xs text-slate-200 font-mono leading-relaxed line-clamp-2">
              <strong className="text-amber-400">{activeSignal.callsign}: </strong>
              {activeSignal.transcript}
            </p>
          </div>
        </div>
      )}

      {/* Transmissions List */}
      <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
        {filteredTransmissions.length === 0 ? (
          <div className="py-10 text-center text-xs font-mono text-slate-400">
            No transmissions recorded matching filters. Start the scanner or tune to active frequencies.
          </div>
        ) : (
          filteredTransmissions.map((tx) => {
            const serviceMeta = SERVICE_COLORS[tx.service] || {
              label: 'General',
              text: 'text-slate-300',
              bg: 'bg-slate-900',
              border: 'border-slate-800',
            };

            const isCurrentActive = activeSignal?.id === tx.id;

            return (
              <div
                key={tx.id}
                className={`pt-2.5 pb-2 transition-colors ${
                  isCurrentActive ? 'bg-amber-950/20 px-2 rounded' : ''
                }`}
              >
                {/* Clean Unboxed Metadata Header (Zero-Pill Rule) */}
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-400">{tx.timestamp}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={() => onSelectFrequency(tx.frequency)}
                      className="font-bold text-amber-400 hover:underline cursor-pointer"
                    >
                      {tx.frequency.toFixed(4)} MHz
                    </button>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-300 font-medium">{tx.band}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className={serviceMeta.text}>{serviceMeta.label}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400">{tx.channelName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="tabular-nums">{tx.rssi} dBm</span>
                    <button
                      type="button"
                      onClick={() => handlePlayVoice(tx)}
                      disabled={isPlayingId === tx.id}
                      className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                      title="Replay radio voice broadcast"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${isPlayingId === tx.id ? 'animate-pulse text-emerald-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Call Transcript */}
                <div className="text-xs font-mono text-slate-200 pl-1 leading-relaxed">
                  <span className="font-semibold text-amber-300">{tx.callsign}: </span>
                  <span>{tx.transcript}</span>
                </div>

                {/* EAS Alert Banner if present */}
                {tx.easAlert && (
                  <div className="mt-1.5 p-2 bg-amber-950/40 border border-amber-700/60 rounded flex items-center gap-2 text-[11px] font-mono text-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-300">{tx.easAlert.eventName}</span>
                      <span className="text-slate-400 ml-2">SAME: {tx.easAlert.sameCode}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
