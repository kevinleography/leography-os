import { NextResponse } from 'next/server';
import { listTemplates } from '@/lib/docuseal/client';

export async function GET() {
  try {
    const templates = await listTemplates();
    return NextResponse.json(templates);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
