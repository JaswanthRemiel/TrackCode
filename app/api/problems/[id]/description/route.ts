import { NextResponse } from 'next/server';
import { getProblemDescription } from '@/lib/server/leetcode';
import { hasProblem } from '@/lib/server/problems';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasProblem(id)) return NextResponse.json({ error: 'Unknown problem' }, { status: 404 });

  try {
    const description = await getProblemDescription(id);
    if (!description) return NextResponse.json({ error: 'Not found on LeetCode' }, { status: 404 });
    return NextResponse.json(description, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    });
  } catch (e) {
    console.error('LeetCode description fetch failed', e instanceof Error ? e.message : e);
    return NextResponse.json({ error: 'Could not load the description from LeetCode right now.' }, { status: 502 });
  }
}
