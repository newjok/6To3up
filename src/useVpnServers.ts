import { useCallback, useEffect, useRef, useState } from 'react';
import type { VpnServer } from './types';

// Server list is fetched through our own Netlify Function, which fetches
// https://www.vpngate.net/api/iphone/ on the server side. This avoids
// browser CORS restrictions entirely (no third-party CORS proxies needed).
const VPNGATE_ENDPOINT = '/.netlify/functions/vpngate';

const MIN_SPEED = 20;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800;

function parseCsv(text: string): VpnServer[] {
  const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
  const rows = lines.filter((l) => l && !l.startsWith('*') && !l.startsWith('#'));
  const out: VpnServer[] = [];
  for (const line of rows) {
    const cols = line.split(',');
    if (cols.length < 15) continue;
    // Actual VPN Gate CSV column order:
    // 0 HostName, 1 IP, 2 Score, 3 Ping(ms), 4 Speed(bps),
    // 5 CountryLong, 6 CountryShort, 7 NumVpnSessions, 8 Uptime(ms),
    // 9 TotalUsers, 10 TotalTraffic, 11 LogType, 12 Operator, 13 Message,
    // 14 OpenVPN_ConfigData_Base64
    const ip = cols[1];
    const pingMs = Number(cols[3]);
    const speedBps = Number(cols[4]);
    const speedMbps = Number.isFinite(speedBps) ? speedBps / 1_000_000 : 0;
    if (!ip || !Number.isFinite(speedMbps) || speedMbps <= MIN_SPEED) continue;
    const uptimeMs = Number(cols[8]) || 0;
    out.push({
      hostname: cols[0],
      ip,
      score: Number(cols[2]) || 0,
      speed: speedMbps,
      ping: Number.isFinite(pingMs) ? pingMs : 9999,
      countryLong: cols[5] || 'Unknown',
      countryShort: cols[6] || '--',
      sessions: Number(cols[7]) || 0,
      uptimeDays: Math.round(uptimeMs / 86_400_000),
      operator: cols[12] || 'Unknown',
      openVpnConfig: cols[14] || '',
      id: `${ip}-${cols[0]}`,
    });
  }
  return out;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchServerListWithRetry(): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(VPNGATE_ENDPOINT, REQUEST_TIMEOUT_MS);

      if (!res.ok) {
        // Try to read a JSON error message from our function, if present.
        let message = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // response wasn't JSON, ignore
        }
        throw new Error(message);
      }

      const text = await res.text();
      if (!text || !text.includes('HostName')) {
        throw new Error('Invalid server list format received');
      }

      return text;
    } catch (err) {
      lastError = err;
      if (import.meta.env.DEV) console.error(`Attempt ${attempt} failed:`, err);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('fetchError');
}

export function useVpnServers() {
  const [servers, setServers] = useState<VpnServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await fetchServerListWithRetry();
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        throw new Error('No servers found in response');
      }
      if (mounted.current) {
        setServers(parsed);
        setLoading(false);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'fetchError');
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void fetchServers();
    return () => {
      mounted.current = false;
    };
  }, [fetchServers]);

  return { servers, loading, error, refresh: fetchServers };
}
