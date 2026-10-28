import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BandId, ModulationType, InterceptedTransmission, EmergencyChannel } from '../types/radio';
import { BAND_CONFIGS } from '../utils/emergencyPresets';

interface SpectrumWaterfallProps {
  currentFreq: number;
  currentBand: BandId;
  modulation: ModulationType;
  channels: EmergencyChannel[];
  activeSignal: InterceptedTransmission | null;
  palette: 'amber' | 'cyan' | 'emerald' | 'monochrome';
  onFrequencySelect: (freqMHz: number) => void;
}

export const SpectrumWaterfall: React.FC<SpectrumWaterfallProps> = ({
  currentFreq,
  currentBand,
  modulation,
  channels,
  activeSignal,
  palette,
  onFrequencySelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterfallHistoryRef = useRef<Uint8Array[]>([]);
  const animFrameIdRef = useRef<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverFreq, setHoverFreq] = useState<number | null>(null);

  const bandConfig = BAND_CONFIGS[currentBand] || BAND_CONFIGS.UHF;
  const minFreq = bandConfig.minFreq;
  const maxFreq = bandConfig.maxFreq;
  const freqSpan = maxFreq - minFreq;

  // Convert MHz to Canvas X position
  const freqToX = useCallback((freq: number, width: number) => {
    return ((freq - minFreq) / freqSpan) * width;
  }, [minFreq, freqSpan]);

  // Convert Canvas X position to MHz
  const xToFreq = useCallback((x: number, width: number) => {
    const raw = minFreq + (x / width) * freqSpan;
    // Round to 3 decimal places (kHz precision)
    return Math.round(raw * 1000) / 1000;
  }, [minFreq, freqSpan]);

  // Color lookup table for waterfall
  const getColor = useCallback((intensity: number, mode: 'amber' | 'cyan' | 'emerald' | 'monochrome') => {
    const norm = Math.max(0, Math.min(1, intensity / 255));
    if (mode === 'amber') {
      if (norm < 0.2) {
        return `rgb(${Math.floor(norm * 50)}, ${Math.floor(norm * 25)}, 0)`;
      } else if (norm < 0.6) {
        return `rgb(${Math.floor(100 + norm * 155)}, ${Math.floor(50 + norm * 130)}, 0)`;
      } else {
        return `rgb(255, ${Math.floor(180 + norm * 75)}, ${Math.floor(norm * 180)})`;
      }
    } else if (mode === 'cyan') {
      if (norm < 0.2) {
        return `rgb(0, ${Math.floor(norm * 40)}, ${Math.floor(norm * 70)})`;
      } else if (norm < 0.6) {
        return `rgb(0, ${Math.floor(80 + norm * 175)}, ${Math.floor(140 + norm * 115)})`;
      } else {
        return `rgb(${Math.floor(norm * 180)}, 255, 255)`;
      }
    } else if (mode === 'emerald') {
      if (norm < 0.2) {
        return `rgb(0, ${Math.floor(norm * 60)}, ${Math.floor(norm * 20)})`;
      } else if (norm < 0.6) {
        return `rgb(${Math.floor(norm * 60)}, ${Math.floor(120 + norm * 135)}, ${Math.floor(norm * 50)})`;
      } else {
        return `rgb(${Math.floor(160 + norm * 95)}, 255, ${Math.floor(180 + norm * 75)})`;
      }
    } else {
      // Monochrome high-contrast
      const v = Math.floor(norm * 255);
      return `rgb(${v}, ${v}, ${v})`;
    }
  }, []);

  // Main 60fps render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const NUM_BINS = 256;
    const WATERFALL_DEPTH = 120;

    // Initialize history buffer if needed
    if (waterfallHistoryRef.current.length === 0) {
      for (let i = 0; i < WATERFALL_DEPTH; i++) {
        const row = new Uint8Array(NUM_BINS);
        for (let j = 0; j < NUM_BINS; j++) {
          row[j] = Math.floor(10 + Math.random() * 20);
        }
        waterfallHistoryRef.current.push(row);
      }
    }

    const render = () => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;
      const spectrumHeight = Math.floor(height * 0.42);
      const waterfallHeight = height - spectrumHeight;

      // 1. Generate current FFT slice
      const currentRow = new Uint8Array(NUM_BINS);
      for (let i = 0; i < NUM_BINS; i++) {
        const binFreq = minFreq + (i / NUM_BINS) * freqSpan;

        // Baseline RF noise floor with slight undulating curve
        let power = 25 + Math.random() * 18 + Math.sin(i * 0.05) * 5;

        // Check if any programmed emergency channel sits near this bin
        for (const ch of channels) {
          if (ch.band === currentBand || currentBand === 'ALL') {
            const freqDiff = Math.abs(ch.frequency - binFreq);
            const bandwidth = ch.modulation === 'WFM' ? 0.25 : 0.05; // Bandwidth in MHz
            if (freqDiff < bandwidth) {
              const proximity = 1 - freqDiff / bandwidth;
              const isBroadcasting = activeSignal && Math.abs(activeSignal.frequency - ch.frequency) < 0.02;
              const peakStrength = isBroadcasting ? 190 + Math.random() * 45 : 70 + Math.random() * 25;
              power += peakStrength * proximity;
            }
          }
        }

        // Tuned carrier pulse
        if (Math.abs(currentFreq - binFreq) < (modulation === 'WFM' ? 0.15 : 0.03)) {
          if (activeSignal && Math.abs(activeSignal.frequency - currentFreq) < 0.05) {
            power = Math.max(power, 210 + Math.random() * 40);
          }
        }

        currentRow[i] = Math.min(255, Math.floor(power));
      }

      // Shift waterfall history
      waterfallHistoryRef.current.unshift(currentRow);
      if (waterfallHistoryRef.current.length > WATERFALL_DEPTH) {
        waterfallHistoryRef.current.pop();
      }

      // 2. Clear canvas with dark obsidian slate
      ctx.fillStyle = '#06080D';
      ctx.fillRect(0, 0, width, height);

      // 3. Draw Spectrum Grid Lines & Decibel Marks
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      const numDbLines = 5;
      for (let i = 1; i <= numDbLines; i++) {
        const y = Math.floor((spectrumHeight / numDbLines) * i);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // dBm label
        const dbm = -40 - Math.floor((i / numDbLines) * 70);
        ctx.fillStyle = '#475569';
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.fillText(`${dbm} dBm`, 6, y - 3);
      }

      // 4. Draw Channel Markers along Spectrum
      channels.forEach(ch => {
        if (ch.band === currentBand || currentBand === 'ALL') {
          if (ch.frequency >= minFreq && ch.frequency <= maxFreq) {
            const cx = freqToX(ch.frequency, width);
            ctx.strokeStyle = ch.priority ? '#EF444455' : '#334155';
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, spectrumHeight);
            ctx.stroke();
            ctx.setLineDash([]);

            // Marker label
            ctx.fillStyle = ch.priority ? '#F87171' : '#64748B';
            ctx.font = '9px "IBM Plex Mono", monospace';
            ctx.fillText(ch.channelName.substring(0, 8), cx + 2, 12);
          }
        }
      });

      // 5. Draw RF Spectrum Line & Area Fill
      ctx.beginPath();
      for (let i = 0; i < NUM_BINS; i++) {
        const x = (i / (NUM_BINS - 1)) * width;
        const normalized = currentRow[i] / 255;
        const y = spectrumHeight - normalized * (spectrumHeight - 15);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // Gradient stroke based on palette
      let primaryColor = '#F59E0B'; // Amber default
      if (palette === 'cyan') primaryColor = '#06B6D4';
      if (palette === 'emerald') primaryColor = '#10B981';
      if (palette === 'monochrome') primaryColor = '#E2E8F0';

      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Area fill underneath spectrum curve
      ctx.lineTo(width, spectrumHeight);
      ctx.lineTo(0, spectrumHeight);
      ctx.closePath();
      const fillGradient = ctx.createLinearGradient(0, 0, 0, spectrumHeight);
      fillGradient.addColorStop(0, `${primaryColor}33`);
      fillGradient.addColorStop(1, '#06080D00');
      ctx.fillStyle = fillGradient;
      ctx.fill();

      // 6. Draw Tuned Frequency Passband Cursor & Center Needle
      const tunedX = freqToX(currentFreq, width);
      const pbHalfWidth = modulation === 'WFM' ? freqToX(minFreq + 0.1, width) : freqToX(minFreq + 0.015, width);

      // Passband filter box
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fillRect(tunedX - pbHalfWidth, 0, pbHalfWidth * 2, spectrumHeight);

      // Center carrier hairline
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tunedX, 0);
      ctx.lineTo(tunedX, spectrumHeight);
      ctx.stroke();

      // Active carrier indicator triangle
      ctx.fillStyle = activeSignal ? '#EF4444' : '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(tunedX, 0);
      ctx.lineTo(tunedX - 5, 8);
      ctx.lineTo(tunedX + 5, 8);
      ctx.closePath();
      ctx.fill();

      // 7. Divider between Spectrum and Waterfall
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, spectrumHeight, width, 2);

      // 8. Draw Waterfall Display
      const historyRows = waterfallHistoryRef.current;
      const rowHeight = waterfallHeight / historyRows.length;

      for (let r = 0; r < historyRows.length; r++) {
        const row = historyRows[r];
        const y = spectrumHeight + 2 + r * rowHeight;
        const binWidth = width / NUM_BINS;

        for (let b = 0; b < NUM_BINS; b++) {
          const val = row[b];
          ctx.fillStyle = getColor(val, palette);
          ctx.fillRect(b * binWidth, y, Math.ceil(binWidth), Math.ceil(rowHeight));
        }
      }

      // Waterfall tuned frequency hairline
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tunedX, spectrumHeight + 2);
      ctx.lineTo(tunedX, height);
      ctx.stroke();

      // 9. Frequency Scale Overlay at Bottom of Spectrum
      const numScaleTicks = 8;
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, spectrumHeight - 16, width, 16);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, spectrumHeight - 16);
      ctx.lineTo(width, spectrumHeight - 16);
      ctx.stroke();

      for (let t = 0; t <= numScaleTicks; t++) {
        const tickFreq = minFreq + (t / numScaleTicks) * freqSpan;
        const tx = (t / numScaleTicks) * width;

        ctx.strokeStyle = '#475569';
        ctx.beginPath();
        ctx.moveTo(tx, spectrumHeight - 16);
        ctx.lineTo(tx, spectrumHeight - 10);
        ctx.stroke();

        ctx.fillStyle = '#94A3B8';
        ctx.font = '10px "IBM Plex Mono", monospace';
        const label = tickFreq.toFixed(currentBand === 'UHF' ? 2 : 1) + 'M';
        const textWidth = ctx.measureText(label).width;
        const labelX = Math.min(width - textWidth - 2, Math.max(2, tx - textWidth / 2));
        ctx.fillText(label, labelX, spectrumHeight - 4);
      }

      // 10. Hover Frequency Cursor if mouse is over canvas
      if (hoverFreq !== null && hoverFreq >= minFreq && hoverFreq <= maxFreq) {
        const hx = freqToX(hoverFreq, width);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hx, 0);
        ctx.lineTo(hx, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Hover tooltip pill
        const tipText = `${hoverFreq.toFixed(3)} MHz`;
        ctx.font = '10px "IBM Plex Mono", monospace';
        const tw = ctx.measureText(tipText).width;
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(hx + 4, 20, tw + 8, 18);
        ctx.strokeStyle = '#475569';
        ctx.strokeRect(hx + 4, 20, tw + 8, 18);
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText(tipText, hx + 8, 33);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    currentFreq,
    currentBand,
    modulation,
    channels,
    activeSignal,
    palette,
    minFreq,
    maxFreq,
    freqSpan,
    freqToX,
    getColor,
    hoverFreq,
  ]);

  // Handle Canvas clicks to tune immediately
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const tunedFreq = xToFreq(x, canvas.width);
    onFrequencySelect(tunedFreq);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const f = xToFreq(x, canvas.width);
    setHoverFreq(f);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setHoverFreq(null);
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-slate-800 bg-[#06080D]">
      {/* Top Overlay Badge Bar */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 pointer-events-none">
        <span className="text-[11px] font-mono font-medium text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700/60 backdrop-blur-sm">
          {bandConfig.name}
        </span>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
          SPAN: {freqSpan.toFixed(1)} MHz
        </span>
      </div>

      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 pointer-events-none">
        {activeSignal && (
          <span className="text-[11px] font-mono font-semibold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/80 animate-pulse">
            CARRIER LOCKED · {activeSignal.frequency.toFixed(3)} MHz
          </span>
        )}
      </div>

      {/* Main High-DPI Canvas */}
      <canvas
        ref={canvasRef}
        width={960}
        height={320}
        className="w-full h-64 md:h-72 cursor-crosshair block"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={handleMouseLeave}
      />

      {/* Bottom Hint */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#090D16] border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
        <span>Click or drag canvas anywhere to retune frequency</span>
        <span>Passband: {modulation} ({modulation === 'WFM' ? '±100 kHz' : '±12.5 kHz'})</span>
      </div>
    </div>
  );
};
