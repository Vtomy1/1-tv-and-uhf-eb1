import React from 'react';
import { InterceptedTransmission, ModulationType } from '../types/radio';

interface SignalMetersProps {
  rssi: number; // dBm (-115 to -45)
  snr: number; // dB (0 to 35)
  activeSignal: InterceptedTransmission | null;
  modulation: ModulationType;
  squelch: number; // 0 to 100
}

export const SignalMeters: React.FC<SignalMetersProps> = ({
  rssi,
  snr,
  activeSignal,
  modulation,
  squelch,
}) => {
  // Convert RSSI dBm to S-units:
  // S9 = -73 dBm (VHF/UHF standard)
  // Each S unit below S9 is 6 dB
  // Above S9 is dB over 9 (+10dB, +20dB, +30dB)
  const calculateSUnits = (dbm: number) => {
    if (dbm <= -121) return 0;
    if (dbm >= -43) return 12; // S9 + 30dB
    if (dbm >= -73) {
      // S9 to S9+30dB
      const over = dbm - (-73);
      return 9 + (over / 30) * 3;
    }
    // S0 to S9
    const s = 9 - (-73 - dbm) / 6;
    return Math.max(0, s);
  };

  const sUnit = calculateSUnits(rssi);
  const sUnitPercent = Math.min(100, Math.max(0, (sUnit / 12) * 100));

  // Squelch threshold marker position on meter (0 to 100)
  const squelchDbm = -115 + (squelch / 100) * 65;
  const squelchPosPercent = Math.min(100, Math.max(0, (calculateSUnits(squelchDbm) / 12) * 100));

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-3 text-slate-200">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
        <span className="font-semibold tracking-wide text-slate-300">RECEIVER S-METER / RSSI</span>
        <div className="flex items-center gap-3">
          <span>MODE: <strong className="text-amber-400">{modulation}</strong></span>
          <span>TONE: <strong className="text-emerald-400">{activeSignal?.callsign ? 'PL 100.0' : 'CSQ'}</strong></span>
        </div>
      </div>

      {/* S-Meter Scale Labels */}
      <div className="relative w-full h-4 text-[10px] font-mono text-slate-400 flex justify-between select-none">
        <span>S1</span>
        <span>S3</span>
        <span>S5</span>
        <span>S7</span>
        <span className="font-bold text-amber-300">S9</span>
        <span className="font-bold text-red-400">+10</span>
        <span className="font-bold text-red-400">+20</span>
        <span className="font-bold text-red-500">+30</span>
      </div>

      {/* S-Meter Bar with Squelch Gate Indicator */}
      <div className="relative w-full h-3 bg-slate-900 rounded overflow-hidden border border-slate-700/80 mb-2.5">
        {/* Fill bar */}
        <div
          className={`h-full transition-all duration-75 ${
            sUnit >= 9 ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
          }`}
          style={{ width: `${sUnitPercent}%` }}
        />

        {/* Squelch threshold needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-300 shadow-sm z-10"
          style={{ left: `${squelchPosPercent}%` }}
          title={`Squelch Gate: ${squelchDbm.toFixed(0)} dBm`}
        />
      </div>

      {/* Numeric Telemetry Readouts */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono">
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <div className="text-[10px] text-slate-400">SIGNAL LEVEL</div>
          <div className="text-sm font-semibold tabular-nums text-slate-100">
            {rssi} <span className="text-[10px] text-slate-400 font-normal">dBm</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <div className="text-[10px] text-slate-400">SNR (CARRIER)</div>
          <div className="text-sm font-semibold tabular-nums text-emerald-400">
            +{snr} <span className="text-[10px] text-slate-400 font-normal">dB</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
          <div className="text-[10px] text-slate-400">GATE STATUS</div>
          <div className={`text-sm font-semibold ${rssi >= squelchDbm ? 'text-amber-400' : 'text-slate-500'}`}>
            {rssi >= squelchDbm ? 'OPEN' : 'MUTED'}
          </div>
        </div>
      </div>
    </div>
  );
};
