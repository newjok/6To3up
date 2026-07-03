import { useState } from 'react';
import { Download, Copy, FileText } from 'lucide-react';
import type { VpnServer } from '../types';

interface Props {
  server: VpnServer | null;
  t: (k: string) => string;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function ConfigGenerator({ server, t, onToast }: Props) {
  const [copied, setCopied] = useState(false);

  if (!server) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-center">
        <FileText className="w-10 h-10 mb-3 opacity-50" />
        <p>{t('selectServer')}</p>
      </div>
    );
  }

  const config = server.openVpnConfig || `# OpenVPN config for ${server.hostname} (${server.ip})\n# No inline config available from API.\nremote ${server.ip} 1194\nproto udp\ndev tun\nnobind\npersist-key\npersist-tun\ncipher AES-128-CBC\nauth SHA1\nverb 3`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(config);
      setCopied(true);
      onToast(t('copied'), 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Clipboard failed:', err);
      onToast('Clipboard error', 'error');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${server.hostname || server.ip}.ovpn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-100">{server.countryLong}</h3>
          <p className="text-sm text-slate-500">{server.ip} · {server.operator}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:border-cyan-500 transition">
            <Copy className="w-4 h-4" /> {copied ? t('copied') : t('copyConfig')}
          </button>
          <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 transition">
            <Download className="w-4 h-4" /> {t('downloadConfig')}
          </button>
        </div>
      </div>
      <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 overflow-x-auto max-h-[60vh] font-mono leading-relaxed">
{config}
      </pre>
    </div>
  );
}
