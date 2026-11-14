import crypto from 'crypto';
import { NextResponse } from 'next/server';

const CLAIMED_AD_NONCES = new Set<string>();

function getServerAdSecret(): string {
  return process.env.FM_REWARD_AD_SECRET || 'fm27-rewarded-ad-ssv-secret-key-2026';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      accountId,
      adNonce,
      rewardChoice = 'recovery',
      isMatchInProgress = false,
      adsWatchedToday = 0,
      maxAdsPerDay = 5,
    } = body as {
      accountId?: string;
      adNonce?: string;
      rewardChoice?: 'recovery' | 'training' | 'soft_coins';
      isMatchInProgress?: boolean;
      adsWatchedToday?: number;
      maxAdsPerDay?: number;
    };

    if (!accountId || !adNonce) {
      return NextResponse.json(
        {
          verified: false,
          error: 'Missing accountId or adNonce for rewarded advertisement verification.',
        },
        { status: 400 }
      );
    }

    if (isMatchInProgress) {
      return NextResponse.json(
        {
          verified: false,
          error: 'Advertisements are strictly prohibited during active matches.',
        },
        { status: 403 }
      );
    }

    if (adsWatchedToday >= maxAdsPerDay) {
      return NextResponse.json(
        {
          verified: false,
          error: `Daily rewarded advertisement limit reached (${maxAdsPerDay}/${maxAdsPerDay}).`,
        },
        { status: 429 }
      );
    }

    const nonceKey = `${accountId}:${adNonce}`;
    if (CLAIMED_AD_NONCES.has(nonceKey)) {
      return NextResponse.json(
        {
          verified: false,
          error: 'Duplicate reward claim blocked: this ad completion nonce was already redeemed.',
        },
        { status: 409 }
      );
    }

    CLAIMED_AD_NONCES.add(nonceKey);

    const hmac = crypto
      .createHmac('sha256', getServerAdSecret())
      .update(`${accountId}:${adNonce}:${rewardChoice}`)
      .digest('hex')
      .slice(0, 28);

    return NextResponse.json({
      verified: true,
      adNonce,
      rewardChoice,
      providerSignature: `verified_ad_${hmac}`,
      verifiedAtIso: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        verified: false,
        error: err instanceof Error ? err.message : 'Rewarded ad provider verification error.',
      },
      { status: 500 }
    );
  }
}
