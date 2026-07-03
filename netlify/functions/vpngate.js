// netlify/functions/vpngate.js
// Server-side proxy for the VPN Gate public server list.
// Avoids browser CORS restrictions entirely by fetching from the Netlify
// function runtime (Node.js), not from the client.

const VPNGATE_URL = 'https://www.vpngate.net/api/iphone/';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const CACHE_CONTROL = 'public, max-age=300, s-maxage=300'; // 5 minutes

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonError(statusCode, message) {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ error: message }),
  };
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; 6To3-VPNGate-Client/1.0)',
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchVpnGateCsv() {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(VPNGATE_URL, REQUEST_TIMEOUT_MS);

      if (!res.ok) {
        lastError = new Error(`Upstream HTTP ${res.status}`);
        continue;
      }

      const text = await res.text();

      // Validate that the response actually looks like the VPN Gate CSV
      // (it must contain the HostName column header).
      if (!text || !text.includes('HostName')) {
        lastError = new Error('Upstream response missing HostName column — unexpected format');
        continue;
      }

      return text;
    } catch (err) {
      lastError = err;
      // brief backoff before retrying
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }

  throw lastError || new Error('Unknown error fetching VPN Gate list');
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return jsonError(405, 'Method not allowed');
  }

  try {
    const csv = await fetchVpnGateCsv();

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': CACHE_CONTROL,
      },
      body: csv,
    };
  } catch (err) {
    const message =
      err && err.name === 'AbortError'
        ? 'Request to VPN Gate timed out'
        : (err && err.message) || 'Failed to fetch VPN Gate server list';

    return jsonError(502, message);
  }
};
