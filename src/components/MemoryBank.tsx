import React, { useState } from 'react';
import { EmergencyChannel, BandId, EmergencyServiceCategory, ModulationType } from '../types/radio';
import { SERVICE_COLORS } from '../utils/emergencyPresets';
import { Radio, Star, Lock, Plus, Search, Download, Upload, Trash2 } from 'lucide-react';

interface MemoryBankProps {
  channels: EmergencyChannel[];
  currentFreq: number;
  onSelectChannel: (channel: EmergencyChannel) => void;
  onTogglePriority: (channelId: string) => void;
  onToggleLockout: (channelId: string) => void;
  onAddChannel: (channel: EmergencyChannel) => void;
  onDeleteChannel: (channelId: string) => void;
  onResetDefaults: () => void;
}

export const MemoryBank: React.FC<MemoryBankProps> = ({
  channels,
  currentFreq,
  onSelectChannel,
  onTogglePriority,
  onToggleLockout,
  onAddChannel,
  onDeleteChannel,
  onResetDefaults,
}) => {
  const [selectedBandTab, setSelectedBandTab] = useState<'ALL' | BandId>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Channel form state
  const [newFreq, setNewFreq] = useState('');
  const [newName, setNewName] = useState('');
  const [newAgency, setNewAgency] = useState('');
  const [newBand, setNewBand] = useState<BandId>('UHF');
  const [newService, setNewService] = useState<EmergencyServiceCategory>('FIRE_RESCUE');
  const [newModulation, setNewModulation] = useState<ModulationType>('NFM');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredChannels = channels.filter((ch) => {
    if (selectedBandTab !== 'ALL' && ch.band !== selectedBandTab) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesName = ch.channelName.toLowerCase().includes(q);
      const matchesAgency = ch.agency.toLowerCase().includes(q);
      const matchesFreq = ch.frequency.toFixed(4).includes(q);
      if (!matchesName && !matchesAgency && !matchesFreq) return false;
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const freqNum = parseFloat(newFreq);
    if (isNaN(freqNum) || freqNum < 50 || freqNum > 600) {
      setFormError('Please enter a valid frequency between 50 and 600 MHz');
      return;
    }
    if (!newName.trim()) {
      setFormError('Channel name is required');
      return;
    }

    const newChannel: EmergencyChannel = {
      id: `custom-${Date.now()}`,
      frequency: Math.round(freqNum * 10000) / 10000,
      band: newBand,
      channelName: newName.trim(),
      agency: newAgency.trim() || 'Custom User Channel',
      service: newService,
      modulation: newModulation,
      priority: false,
      lockout: false,
    };

    onAddChannel(newChannel);
    setShowAddModal(false);
    setNewFreq('');
    setNewName('');
    setNewAgency('');
    setFormError(null);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(channels, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'scanner-emergency-channels.json');
    dlAnchor.click();
  };

  return (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
      {/* Header with Title and Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-100 font-mono tracking-wide">
            EMERGENCY MEMORY BANKS ({channels.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-semibold rounded cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Channel</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="Export Channels JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onResetDefaults}
            className="text-xs font-mono text-slate-500 hover:text-slate-300 ml-1 cursor-pointer"
            title="Reset to factory preset frequencies"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800">
          {(['ALL', 'TV1', 'TV2', 'UHF'] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setSelectedBandTab(b)}
              className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                selectedBandTab === b
                  ? 'bg-slate-800 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {b === 'ALL' ? 'All Banks' : b}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Filter channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-slate-700 w-full sm:w-48"
          />
        </div>
      </div>

      {/* Channel Table / Cards List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 pr-1">
        {filteredChannels.length === 0 ? (
          <div className="py-10 text-center text-xs font-mono text-slate-500">
            No memory channels found. Try adjusting filters or click "Add Channel".
          </div>
        ) : (
          filteredChannels.map((ch) => {
            const isTuned = Math.abs(ch.frequency - currentFreq) < 0.005;
            const serviceMeta = SERVICE_COLORS[ch.service] || {
              label: 'General',
              text: 'text-slate-300',
              bg: 'bg-slate-900',
              border: 'border-slate-800',
            };

            return (
              <div
                key={ch.id}
                className={`py-2 px-2 flex items-center justify-between gap-3 transition-colors rounded ${
                  isTuned ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-slate-900/50'
                } ${ch.lockout ? 'opacity-50' : ''}`}
              >
                {/* Left Info: Frequency & Channel Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <button
                      type="button"
                      onClick={() => onSelectChannel(ch)}
                      className="font-mono font-bold text-amber-400 hover:underline cursor-pointer text-sm"
                    >
                      {ch.frequency.toFixed(4)} MHz
                    </button>
                    <span className="text-[11px] font-mono text-slate-500">[{ch.band}]</span>
                    <span className={`text-[11px] font-mono ${serviceMeta.text}`}>{serviceMeta.label}</span>
                    <span className="text-[11px] font-mono text-slate-400">· {ch.modulation}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-300 truncate">
                    <span className="font-semibold text-slate-200">{ch.channelName}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 truncate">{ch.agency}</span>
                  </div>
                </div>

                {/* Right Action Icons: Priority, Lockout, Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onTogglePriority(ch.id)}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      ch.priority
                        ? 'text-amber-400 bg-amber-950/60'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={ch.priority ? 'Priority Channel (Active)' : 'Set as Priority'}
                  >
                    <Star className={`w-3.5 h-3.5 ${ch.priority ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleLockout(ch.id)}
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      ch.lockout
                        ? 'text-red-400 bg-red-950/60'
                        : 'text-slate-600 hover:text-slate-400'
                    }`}
                    title={ch.lockout ? 'Channel Locked Out (Skipped)' : 'Lockout from Scan'}
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectChannel(ch)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded cursor-pointer transition-colors"
                  >
                    Tune
                  </button>

                  {ch.id.startsWith('custom-') && (
                    <button
                      type="button"
                      onClick={() => onDeleteChannel(ch.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                      title="Delete channel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-[#0B0F19] border border-slate-700 rounded-lg p-5 max-w-md w-full flex flex-col gap-3 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-semibold font-mono text-slate-100">
                ADD EMERGENCY FREQUENCY
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2 bg-red-950/70 border border-red-800 text-red-300 text-xs font-mono rounded">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Frequency (MHz) *
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="e.g. 460.500"
                value={newFreq}
                onChange={(e) => {
                  setNewFreq(e.target.value);
                  const f = parseFloat(e.target.value);
                  if (f >= 54 && f <= 88) setNewBand('TV1');
                  else if (f >= 174 && f <= 216) setNewBand('TV2');
                  else if (f >= 400 && f <= 512) setNewBand('UHF');
                }}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Channel Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Metro Fire Dispatch Tac"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Agency / Service Description
              </label>
              <input
                type="text"
                placeholder="e.g. Regional Public Safety"
                value={newAgency}
                onChange={(e) => setNewAgency(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono px-3 py-2 rounded focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Band</label>
                <select
                  value={newBand}
                  onChange={(e) => setNewBand(e.target.value as BandId)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono px-2 py-2 rounded"
                >
                  <option value="TV1">TV1 (54-88 MHz)</option>
                  <option value="TV2">TV2 (174-216 MHz)</option>
                  <option value="UHF">UHF (400-512 MHz)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Modulation</label>
                <select
                  value={newModulation}
                  onChange={(e) => setNewModulation(e.target.value as ModulationType)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono px-2 py-2 rounded"
                >
                  <option value="NFM">NFM (Narrow FM)</option>
                  <option value="WFM">WFM (Wide FM / TV)</option>
                  <option value="AM">AM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Service Category</label>
              <select
                value={newService}
                onChange={(e) => setNewService(e.target.value as EmergencyServiceCategory)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono px-2 py-2 rounded"
              >
                <option value="FIRE_RESCUE">Fire & Rescue</option>
                <option value="EMS_PARAMEDIC">EMS & Trauma</option>
                <option value="LAW_ENFORCEMENT">Law Enforcement</option>
                <option value="SEARCH_RESCUE">Search & Rescue</option>
                <option value="EAS_BROADCAST">EAS / Broadcast</option>
                <option value="INTEROP_TACTICAL">Mutual Aid Tactical</option>
                <option value="CIVIL_DEFENSE">Civil Defense</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-semibold text-xs rounded cursor-pointer"
              >
                Save Channel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
