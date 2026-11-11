import { NextResponse } from 'next/server';
import { listModels } from '@/lib/ai/providers';
import { parseRemielRequest, providerErrorResponse } from '@/lib/server/remiel-request';

export const runtime = 'nodejs';

/** Lists the models the caller's own key can use, straight from the provider. */
export async function POST(request: Request) {
  const parsed = await parseRemielRequest(request, { requireModel: false });
  if (!parsed.ok) return parsed.response;
  const { provider, apiKey, baseUrl } = parsed.provider;
  try {
    const models = await listModels({ provider, apiKey, baseUrl }, AbortSignal.any([request.signal, AbortSignal.timeout(10000)]));
    return NextResponse.json({ models }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return providerErrorResponse(e);
  }
}
