const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY!;
const DOCUSEAL_API_URL = 'https://api.docuseal.com';

async function docusealFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${DOCUSEAL_API_URL}${path}`, {
    ...options,
    headers: {
      'X-Auth-Token': DOCUSEAL_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DocuSeal API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function listTemplates() {
  return docusealFetch('/templates');
}

export async function getTemplate(id: number) {
  return docusealFetch(`/templates/${id}`);
}

export async function createSubmission(params: {
  template_id: number;
  send_email?: boolean;
  submitters: { email: string; role?: string; name?: string }[];
}) {
  return docusealFetch('/submissions', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getSubmission(id: number) {
  return docusealFetch(`/submissions/${id}`);
}
