import { useMemo, useState } from 'react';
import { Search, RefreshCw, Zap, Activity, Clock, Users } from 'lucide-react';
import type { VpnServer } from '../types';

type SortKey = 'speedDesc' | 'pingAsc' | 'scoreDesc' | 'uptimeDesc';

interface Props {
  servers: VpnServer[];
  loading: boolean;
  error: string | null;
  activeId: string | null;
  t: (k: string) => string;
  onRefresh: () => void;
  onSelect: (s: VpnServer) => void;
}

function flagEmoji(cc: string): string {
  if (!cc || cc.length !== 2) return '🌐';
  const A = 0x1f1e6;
  return String.fromCodePoint(A + cc.toUpperCase().charCodeAt(0) - 65) + String.fromCodePoint(A + cc.toUpperCase().charCodeAt(1) - 65);
}

export function ServerList({ servers, loading, error, activeId, t, onRefresh, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [minSpeed, setMinSpeed] = useState(20);
  const [maxPing, setMaxPing] = useState(500);
  const [sort, setSort] = useState<SortKey>('speedDesc');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = servers.filter(
      (s) => s.speed >= minSpeed && s.ping <= maxPing &&
        (!q || s.countryLong.toLowerCase().includes(q) || s.ip.includes(q))
    );
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'pingAsc': return a.ping - b.ping;
        case 'scoreDesc': return b.score - a.score;
        case 'uptimeDesc': return b.uptimeDays - a.uptimeDays;
        default: return b.speed - a.speed;
      }
    });
    return list;
  }, [servers, query, minSpeed, maxPing, sort]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-3" />
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-rose-400 mb-4">{t(error)}</p>
        <button onClick={onRefresh} className="px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 transition">
          {t('refresh')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <Zap className="w-4 h-4 text-cyan-400" />
          <input type="number" value={minSpeed} min={20} onChange={(e) => setMinSpeed(Number(e.target.value))}
            className="w-20 px-2 py-1.5 rounded bg-slate-800/60 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <Activity className="w-4 h-4 text-emerald-400" />
          <input type="number" value={maxPing} onChange={(e) => setMaxPing(Number(e.target.value))}
            className="w-20 px-2 py-1.5 rounded bg-slate-800/60 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500" />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500">
          <option value="speedDesc">{t('speedDesc')}</option>
          <option value="pingAsc">{t('pingAsc')}</option>
          <option value="scoreDesc">{t('scoreDesc')}</option>
          <option value="uptimeDesc">{t('uptimeDesc')}</option>
        </select>
        <button onClick={onRefresh} className="p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-slate-400">
        {filtered.length} {t('totalServers')} · {t('filtered')}
      </p>

      {filtered.length === 0 ? (
        <p className="text-center py-16 text-slate-500">{t('noServers')}</p>
      ) : (
        <div className="grid gap-2">
          {filtered.slice(0, 200).map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`flex items-center gap-4 p-3 rounded-xl border text-left transition hover:border-cyan-500/60 hover:bg-slate-800/40 ${
                activeId === s.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <span className="text-2xl">{flagEmoji(s.countryShort)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-100 truncate">{s.countryLong}</p>
                <p className="text-xs text-slate-500 truncate">{s.ip} · {s.operator}</p>
              </div>
              <div className="flex items-center gap-5 text-sm">
                <span className="flex items-center gap-1 text-cyan-400" title={t('speed')}>
                  <Zap className="w-3.5 h-3.5" />{s.speed.toFixed(0)}
                </span>
                <span className="flex items-center gap-1 text-emerald-400" title={t('ping')}>
                  <Activity className="w-3.5 h-3.5" />{s.ping}
                </span>
                <span className="hidden sm:flex items-center gap-1 text-amber-400" title={t('uptime')}>
                  <Clock className="w-3.5 h-3.5" />{s.uptimeDays}{t('days')}
                </span>
                <span className="hidden md:flex items-center gap-1 text-slate-400" title={t('sessions')}>
                  <Users className="w-3.5 h-3.5" />{s.sessions}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
