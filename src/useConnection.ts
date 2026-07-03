import { useCallback, useEffect, useRef, useState } from 'react';
import type { VpnServer } from './types';

const SESSION_MS = 30 * 60 * 1000;

export type ConnState = 'disconnected' | 'connecting' | 'connected';

export function useConnection() {
  const [state, setState] = useState<ConnState>('disconnected');
  const [active, setActive] = useState<VpnServer | null>(null);
  const [timeLeft, setTimeLeft] = useState(SESSION_MS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const connect = useCallback(
    (server: VpnServer) => {
      clearTimer();
      setActive(server);
      setState('connecting');
      setTimeLeft(SESSION_MS);
      window.setTimeout(() => setState('connected'), 1200);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1000) {
            clearTimer();
            setState('disconnected');
            setActive(null);
            return 0;
          }
          return t - 1000;
        });
      }, 1000);
    },
    [clearTimer]
  );

  const disconnect = useCallback(() => {
    clearTimer();
    setState('disconnected');
    setActive(null);
    setTimeLeft(SESSION_MS);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return { state, active, timeLeft, connect, disconnect };
}
