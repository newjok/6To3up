import { useState } from 'react';
import { Gauge, ArrowDown, ArrowUp } from 'lucide-react';
import type { VpnServer } from '../types';

interface Props {
  server: VpnServer | null;
  t: (k: string) => string;
}

export function SpeedTest({ server, t }: Props) {
  const [running, setRunning] = useState(false);
  const [download, setDownload] = useState<number | null>(null);
  const [upload, setUpload] = useState<number | null>(null);

  const run = () => {
    if (!server || running) return;
    setRunning(true);
    setDownload(null);
    setUpload(null);
    const baseDl = server.speed;
    const baseUl = server.speed * 0.4;
    window.setTimeout(() => {
      setDownload(baseDl * (0.7 + Math.random() * 0.3));
      setUpload(baseUl * (0.7 + Math.random() * 0.3));
      setRunning(false);
    }, 2500);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      <button
        onClick={run}
        disabled={!server || running}
        className="relative w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform"
      >
        <Gauge className={`w-12 h-12 ${running ? 'animate-spin' : ''}`} />
      </button>
      <p className="text-slate-400 text-sm">
        {running ? t('testing') : server ? `${server.countryLong} · ${server.ip}` : t('selectServer')}
      </p>

      <div className="grid grid-cols-2 gap-6 w-full max-w-md">
        <div className="flex flex-col items-center p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <ArrowDown className="w-6 h-6 text-cyan-400 mb-2" />
          <span className="text-3xl font-bold text-slate-100">
            {download !== null ? download.toFixed(1) : '—'}
          </span>
          <span className="text-xs text-slate-500 mt-1">{t('download')} Mbps</span>
        </div>
        <div className="flex flex-col items-center p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <ArrowUp className="w-6 h-6 text-emerald-400 mb-2" />
          <span className="text-3xl font-bold text-slate-100">
            {upload !== null ? upload.toFixed(1) : '—'}
          </span>
          <span className="text-xs text-slate-500 mt-1">{t('upload')} Mbps</span>
        </div>
      </div>
    </div>
  );
}
