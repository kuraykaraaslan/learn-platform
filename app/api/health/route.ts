// GET /api/health — no auth, no rate limiting. Always returns 200.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
