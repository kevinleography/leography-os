const N8N_URL = process.env.N8N_URL || 'https://n8n.leography.fr';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

export async function n8nApi(path: string, options: RequestInit = {}) {
  const res = await fetch(`${N8N_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': N8N_API_KEY,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function triggerWebhook(webhookPath: string, data: Record<string, any>) {
  const res = await fetch(`${N8N_URL}/webhook/${webhookPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
