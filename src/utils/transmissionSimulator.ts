import { InterceptedTransmission, EmergencyChannel } from '../types/radio';

export const SIMULATED_INCIDENTS: Array<{
  channelId: string;
  callsign: string;
  transcript: string;
  alertTone?: 'EAS_1050' | 'QUIK_CALL_2' | 'ROGER_BEEP' | 'NONE';
  easEventCode?: string;
  easEventName?: string;
  urgency?: 'Immediate' | 'Expected' | 'Future';
  severity?: 'Extreme' | 'Severe' | 'Moderate';
}> = [
  // UHF - Fire / Rescue
  {
    channelId: 'uhf-fire-ground',
    callsign: 'BATTALION-3',
    transcript: 'Battalion 3 to Dispatch. Arrived on scene at 440 Industrial Parkway. Two-story commercial structure with heavy black smoke showing from Bravo side. Engine 4 laying 5-inch supply line. Truck 2 initiating primary search and roof ventilation. Command established.',
    alertTone: 'QUIK_CALL_2',
  },
  {
    channelId: 'uhf-fire-ground',
    callsign: 'ENGINE-4-INTERIOR',
    transcript: 'Command from Interior Attack Engine 4. We have knocked down the main body of fire in unit B. Secondary search is underway, all clear so far. Requesting utility shutoff on Alpha side.',
    alertTone: 'ROGER_BEEP',
  },
  // UHF - Interoperability UTAC41 & UCALL40
  {
    channelId: 'uhf-ucall40',
    callsign: 'STATE-COMMS-5',
    transcript: 'UCALL40 hailing Metro Fire and County Sheriff on UHF Interop. Multi-vehicle incident with hazmat tanker spill on Interstate 80 Mile Marker 142. All responding agencies switch to UTAC41 for tactical command.',
    alertTone: 'ROGER_BEEP',
  },
  {
    channelId: 'uhf-utac41',
    callsign: 'HAZMAT-1',
    transcript: 'Hazmat 1 on UTAC41. Tanker carrying class 3 flammable liquid. Perimeter is established at 500 feet. Foaming operations beginning. Air monitoring reading negative at outer perimeter.',
    alertTone: 'ROGER_BEEP',
  },
  // UHF - EMS Med-Channels
  {
    channelId: 'uhf-med2',
    callsign: 'MEDIC-12',
    transcript: 'Medic 12 to Metro General ER on MED-2. Inbound with a 54-year-old male presenting with acute chest pain, STEMI positive on 12-lead. Vitals: BP 142/88, pulse 92, O2 98% on 2 liters. IV established, Aspirin and Nitro administered. ETA 6 minutes. Activate cath lab.',
    alertTone: 'ROGER_BEEP',
  },
  {
    channelId: 'uhf-med4',
    callsign: 'MEDEVAC-AIR-1',
    transcript: 'LifeFlight 1 to County Medical Control. Airborne from wilderness trauma scene with one critical patient. Intubated and stabilized. Inbound to Level 1 helipad in 11 minutes. Request trauma team on standby.',
    alertTone: 'ROGER_BEEP',
  },
  {
    channelId: 'uhf-med9',
    callsign: 'EMS-DISPATCH',
    transcript: 'All units on MED-9. Multiple casualty protocol terminated at sector south. All 8 patients transported and accounted for. Hospital resource capacity returning to normal status.',
    alertTone: 'ROGER_BEEP',
  },
  // UHF - Law Enforcement Tactical & Sheriff
  {
    channelId: 'uhf-sheriff-tac',
    callsign: 'CAR-204',
    transcript: 'Car 204 to Sheriff Dispatch. Vehicle stopped at Highway 12 junction matching description of armed robbery suspect. Additional units 208 and 212 on scene. Felony stop in progress.',
    alertTone: 'ROGER_BEEP',
  },
  {
    channelId: 'uhf-police-dispatch',
    callsign: 'DISPATCH-WEST',
    transcript: 'Attention all West sector units. Priority 1 call for 10-33 alarm at 2200 Grand Avenue. Units 14 and 22 respond code 3.',
    alertTone: 'ROGER_BEEP',
  },
  // UHF - SAR 406 MHz & FEMA
  {
    channelId: 'uhf-cospas-sar',
    callsign: 'SARSAT-MCC',
    transcript: 'COSPAS-SARSAT Mission Control Center alert. Distress beacon activated at coordinates 37 degrees 44 minutes North, 119 degrees 35 minutes West. Elevation 8,200 feet. National Park SAR dispatch notified.',
    alertTone: 'ROGER_BEEP',
  },
  {
    channelId: 'uhf-fema-sar',
    callsign: 'USAR-TASKFORCE-1',
    transcript: 'Task Force 1 Search Sector Echo. K9 team has indicated a positive live scent in quadrant 3 rubble pile. Technical acoustic listening gear deployed. Deploying shoring team immediately.',
    alertTone: 'ROGER_BEEP',
  },

  // TV1 BAND - EAS Emergency Broadcasts & Ch 2-6 Audio Carriers
  {
    channelId: 'tv1-ch2',
    callsign: 'EAS-PRIMARY-RELAY',
    transcript: 'The Emergency Alert System has been activated. The National Weather Service has issued a Tornado Warning for Northern Jefferson and Southern Clarke Counties until 8:45 PM. Take immediate shelter in an interior room or basement.',
    alertTone: 'EAS_1050',
    easEventCode: 'TOR',
    easEventName: 'Tornado Warning',
    urgency: 'Immediate',
    severity: 'Extreme',
  },
  {
    channelId: 'tv1-ch4',
    callsign: 'WEATHER-EAS-NET',
    transcript: 'Severe Thunderstorm Warning broadcast on TV Ch 4 audio carrier. Damaging winds exceeding 70 miles per hour and ping-pong ball size hail observed radar indicated. Stay away from windows.',
    alertTone: 'EAS_1050',
    easEventCode: 'SVR',
    easEventName: 'Severe Thunderstorm Warning',
    urgency: 'Immediate',
    severity: 'Severe',
  },
  {
    channelId: 'tv1-ch6',
    callsign: 'CH6-FRANKEN-EAS',
    transcript: 'Emergency broadcast on 87.75 MHz Ch 6 audio. Flash Flood Emergency for valley drainage basins. Evacuation ordered for low-lying residential sectors along River Road. Emergency shelter opened at Civic Center.',
    alertTone: 'EAS_1050',
    easEventCode: 'FFW',
    easEventName: 'Flash Flood Emergency',
    urgency: 'Immediate',
    severity: 'Extreme',
  },
  {
    channelId: 'tv1-patrol-link',
    callsign: 'PATROL-BASE-72',
    transcript: 'Highway Patrol Base to Milepost 88 Callbox. Assist unit 109 is on route to disabled motorcoach. Left lane blocked, temporary flare pattern deployed.',
    alertTone: 'ROGER_BEEP',
  },

  // TV2 BAND - EAS Emergency Broadcasts & Ch 7-13 Audio Carriers
  {
    channelId: 'tv2-ch7',
    callsign: 'STATE-EAS-CH7',
    transcript: 'Civil Emergency Message issued by State Office of Emergency Management. Evacuation Route Bravo designated one-way southbound due to wildfire progression. Comply with law enforcement traffic directions.',
    alertTone: 'EAS_1050',
    easEventCode: 'CEM',
    easEventName: 'Civil Emergency Evacuation',
    urgency: 'Immediate',
    severity: 'Extreme',
  },
  {
    channelId: 'tv2-ch9',
    callsign: 'CH9-BROADCAST-EAS',
    transcript: 'Public Safety Directive broadcast over TV Channel 9 audio. Water boil advisory in effect for western municipal grid due to main pressure drop. Distribution stations opening at 0800 hours.',
    alertTone: 'EAS_1050',
    easEventCode: 'BOH',
    easEventName: 'Boil Water Advisory',
    urgency: 'Expected',
    severity: 'Moderate',
  },
  {
    channelId: 'tv2-eng-aux',
    callsign: 'ENG-NEWS-COMMAND',
    transcript: 'Broadcast Auxiliary live news helicopter coordinating with incident public information officer. Staging media perimeter at 3,000 feet AGL outside of firefighting air tanker drop zone.',
    alertTone: 'ROGER_BEEP',
  },
  {
    channelId: 'tv2-ch13',
    callsign: 'METRO-EAS-13',
    transcript: 'Required Weekly Test of the Emergency Alert System for the regional broadcast operational area. If this had been an actual emergency, official information would have followed the tone.',
    alertTone: 'EAS_1050',
    easEventCode: 'RWT',
    easEventName: 'Required Weekly Test',
    urgency: 'Future',
    severity: 'Moderate',
  },
];

/**
 * Generate a randomized realistic transmission for a channel
 */
export function createTransmissionForChannel(channel: EmergencyChannel): InterceptedTransmission {
  const matches = SIMULATED_INCIDENTS.filter(i => i.channelId === channel.id);
  const template = matches.length > 0 
    ? matches[Math.floor(Math.random() * matches.length)]
    : SIMULATED_INCIDENTS[Math.floor(Math.random() * SIMULATED_INCIDENTS.length)];

  // Random realistic RSSI between -105 dBm (distant) and -55 dBm (strong local repeater)
  const rssi = Math.floor(-105 + Math.random() * 52);
  const snr = Math.max(4, Math.floor((rssi + 115) * 0.5 + Math.random() * 6));

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + '.' + String(Math.floor(now.getMilliseconds() / 100));

  let easAlert = undefined;
  if (template.easEventCode && template.easEventName) {
    easAlert = {
      eventCode: template.easEventCode,
      eventName: template.easEventName,
      urgency: template.urgency || 'Immediate',
      severity: template.severity || 'Severe',
      issuer: 'National Weather Service / EAS Relay',
      sameCode: `ZCZC-WXR-${template.easEventCode}-012034+0045-${Math.floor(now.getTime() / 60000)}-KEMG/NWS-`,
      expiresInMinutes: 45,
    };
  }

  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: timeStr,
    frequency: channel.frequency,
    band: channel.band,
    channelName: channel.channelName,
    agency: channel.agency,
    service: channel.service,
    rssi,
    snr,
    durationSec: Math.floor(4 + Math.random() * 12),
    callsign: template.callsign,
    transcript: template.transcript,
    alertTone: template.alertTone || 'ROGER_BEEP',
    easAlert,
  };
}
