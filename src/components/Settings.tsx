import { Languages } from 'lucide-react';
import type { Lang } from '../types';

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
}

export function Settings({ lang, setLang, t }: Props) {
  return (
    <div className="max-w-md space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{t('settings')}</h3>
        <label className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="flex items-center gap-3 text-slate-200">
            <Languages className="w-5 h-5 text-cyan-400" />
            {t('language')}
          </span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-400 leading-relaxed">
        <p className="font-medium text-slate-200 mb-2">6To3</p>
        <p>{t('realServers')}</p>
        <p className="mt-2 text-cyan-400/80">{t('filtered')}</p>
      </div>
    </div>
  );
}
