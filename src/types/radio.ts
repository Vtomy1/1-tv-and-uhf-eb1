export type BandId = 'TV1' | 'TV2' | 'UHF' | 'ALL';

export type ModulationType = 'WFM' | 'NFM' | 'AM';

export type EmergencyServiceCategory = 
  | 'EAS_BROADCAST' 
  | 'FIRE_RESCUE' 
  | 'EMS_PARAMEDIC' 
  | 'LAW_ENFORCEMENT' 
  | 'SEARCH_RESCUE' 
  | 'CIVIL_DEFENSE' 
  | 'INTEROP_TACTICAL';

export interface RadioBandConfig {
  id: BandId;
  name: string;
  tagline: string;
  minFreq: number; // in MHz
  maxFreq: number; // in MHz
  defaultStep: number; // in kHz
  defaultModulation: ModulationType;
  description: string;
}

export interface EmergencyChannel {
  id: string;
  frequency: number; // in MHz (e.g. 87.750, 453.150)
  band: BandId;
  channelName: string;
  agency: string;
  service: EmergencyServiceCategory;
  modulation: ModulationType;
  ctcssTone?: number; // e.g. 100.0 Hz or DCS code
  priority: boolean;
  lockout: boolean;
  notes?: string;
}

export interface InterceptedTransmission {
  id: string;
  timestamp: string;
  frequency: number;
  band: BandId;
  channelName: string;
  agency: string;
  service: EmergencyServiceCategory;
  rssi: number; // in dBm (-115 to -45)
  snr: number; // in dB (3 to 35)
  durationSec: number;
  callsign: string;
  transcript: string;
  alertTone?: 'EAS_1050' | 'QUIK_CALL_2' | 'ROGER_BEEP' | 'NONE';
  easAlert?: EasAlertData;
}

export interface EasAlertData {
  eventCode: string; // e.g. TOR (Tornado), CEM (Civil Emergency), EVI (Evacuation)
  eventName: string;
  urgency: 'Immediate' | 'Expected' | 'Future';
  severity: 'Extreme' | 'Severe' | 'Moderate';
  issuer: string;
  sameCode: string;
  expiresInMinutes: number;
}

export interface ScannerState {
  currentFreq: number; // in MHz
  currentBand: BandId;
  modulation: ModulationType;
  isScanning: boolean;
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
  squelch: number; // 0 to 100
  stepKHz: number; // 12.5, 25, 50, 100
  scanSpeedMs: number; // 40, 100, 250
  priorityWatch: boolean;
  delayHoldSec: number;
  activeSignal: InterceptedTransmission | null;
  rssi: number;
  snr: number;
  waterfallPalette: 'amber' | 'cyan' | 'emerald' | 'monochrome';
}
