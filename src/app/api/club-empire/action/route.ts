import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, careerType, projectId, remainingMs, adToken } = body ?? {};

    if (careerType !== 'original_team') {
      return NextResponse.json(
        { authorized: false, error: 'Club Empire is exclusive to Original Team Career Mode.' },
        { status: 403 }
      );
    }

    const serverTimestampMs = Date.now();

    if (action === 'verify_ad_reduction') {
      if (!adToken || typeof adToken !== 'string' || !adToken.startsWith('verified_ad_')) {
        return NextResponse.json(
          { authorized: false, error: 'Invalid or missing rewarded advertisement verification token.' },
          { status: 400 }
        );
      }
      const rem = Math.max(0, Number(remainingMs ?? 0));
      const maxCapMs = 30 * 60 * 1000;
      const reductionMs = Math.min(maxCapMs, Math.round(rem * 0.1));
      return NextResponse.json({
        authorized: true,
        projectId,
        reductionMs,
        serverTimestampMs,
      });
    }

    return NextResponse.json({
      authorized: true,
      action: action ?? 'sync',
      serverTimestampMs,
    });
  } catch {
    return NextResponse.json(
      { authorized: false, error: 'Malformed Club Empire request payload.' },
      { status: 400 }
    );
  }
}
