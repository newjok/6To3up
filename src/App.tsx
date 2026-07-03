import { useEffect, useMemo, useState } from 'react';
import { Shield, Server, FileText, Gauge, Settings as SettingsIcon, Power, Wifi, X } from 'lucide-react';
import type { Lang, Tab, VpnServer } from './types';
import { makeT } from './i18n';
import { useVpnServers } from './useVpnServers';
import { useConnection } from './useConnection';
import { useToasts } from './useToasts';
import { ServerList } from './components/ServerList';
import { ConfigGenerator } from './components/ConfigGenerator';
import { SpeedTest } from './components/SpeedTest';
import { Settings } from './components/Settings';

const LANG_KEY = '6to3-lang';
const TAB_KEY = '6to3-tab';

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) as Lang) || 'ar');
  const [tab, setTab] = useState<Tab>(() => (localStorage.getItem(TAB_KEY) as Tab) || 'servers');
  const [selected, setSelected] = useState<VpnServer | null>(null);

  const t = useMemo(() => makeT(lang), [lang]);
  const { servers, loading, error, refresh } = useVpnServers();
  const { state, active, timeLeft, connect, disconnect } = useConnection();
  const { toasts, push, remove } = useToasts();

  useEffect(() => localStorage.setItem(LANG_KEY, lang), [lang]);
  useEffect(() => localStorage.setItem(TAB_KEY, tab), [tab]);

  const handleSelect = (s: VpnServer) => {
    setSelected(s);
    setTab('config');
  };

  const handleConnect = () => {
    if (!selected) {
      push(t('selectServer'), 'error');
      return;
    }
    if (state === 'disconnected') {
      connect(selected);
      push(`${t('connecting')} ${selected.countryLong}`, 'info');
    } else {
      disconnect();
    }
  };

  const isRtl = lang === 'ar';
  const tabs: { id: Tab; label: string; icon: typeof Server }[] = [
    { id: 'servers', label: t('servers'), icon: Server },
    { id: 'config', label: t('config'), icon: FileText },
    { id: 'speedtest', label: t('speedTest'), icon: Gauge },
    { id: 'settings', label: t('settings'), icon: SettingsIcon },
  ];

  const statusColor =
    state === 'connected' ? 'text-emerald-400' : state === 'connecting' ? 'text-amber-400' : 'text-slate-500';
  const statusDot =
    state === 'connected' ? 'bg-emerald-400' : state === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">6To3</h1>
              <p className="text-xs text-slate-500">{t('tagline')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${statusDot}`} />
            <span className={statusColor}>{t(state)}</span>
          </div>
        </header>

        {/* Connection card */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/40 border border-slate-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition ${
                state === 'connected' ? 'border-emerald-400 bg-emerald-400/10' :
                state === 'connecting' ? 'border-amber-400 bg-amber-400/10' : 'border-slate-700 bg-slate-800/50'
              }`}>
                <Wifi className={`w-6 h-6 ${statusColor}`} />
              </div>
              <div>
                <p className="font-medium text-slate-100">
                  {active ? active.countryLong : t('disconnected')}
                </p>
                <p className="text-xs text-slate-500">
                  {state === 'connected' ? `${t('timeLeft')}: ${formatTime(timeLeft)}` :
                   active ? active.ip : t('realServers')}
                </p>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={!selected && state === 'disconnected'}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                state === 'disconnected'
                  ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                  : 'bg-rose-500/90 text-white hover:bg-rose-500'
              }`}
            >
              <Power className="w-4 h-4" />
              {state === 'disconnected' ? t('connect') : t('disconnect')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 mb-6 p-1 rounded-xl bg-slate-900/60 border border-slate-800 overflow-x-auto">
          {tabs.map((tb) => {
            const Icon = tb.icon;
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  tab === tb.id ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tb.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <main className="pb-12">
          {tab === 'servers' && (
            <ServerList
              servers={servers}
              loading={loading}
              error={error}
              activeId={active?.id ?? null}
              t={t}
              onRefresh={refresh}
              onSelect={handleSelect}
            />
          )}
          {tab === 'config' && <ConfigGenerator server={selected} t={t} onToast={push} />}
          {tab === 'speedtest' && <SpeedTest server={selected} t={t} />}
          {tab === 'settings' && <Settings lang={lang} setLang={setLang} t={t} />}
        </main>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2 ${
              toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-100' :
              toast.type === 'error' ? 'bg-rose-500/20 border-rose-500/40 text-rose-100' :
              'bg-slate-800/90 border-slate-700 text-slate-100'
            }`}
          >
            <span className="text-sm">{toast.message}</span>
            <button onClick={() => remove(toast.id)} className="opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
