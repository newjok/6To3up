export interface VpnServer {
  hostname: string;
  ip: string;
  score: number;
  ping: number;
  speed: number;
  countryLong: string;
  countryShort: string;
  sessions: number;
  uptimeDays: number;
  operator: string;
  openVpnConfig: string;
  id: string;
}

export type Tab = 'servers' | 'config' | 'speedtest' | 'settings';

export type Lang = 'ar' | 'en';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}
