import { NextResponse } from 'next/server';
import { SERVER_STORE_OFFERS } from '@/engine/boosterEconomy';

export async function POST(request: Request) {
  try {
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) {
      return NextResponse.json(
        { error: 'Paystack is not configured on the server.' },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      offerId?: string;
      accountId?: string;
      email?: string;
      origin?: string;
      currency?: 'NGN' | 'USD';
    };

    if (!body.offerId || !body.accountId || !body.email) {
      return NextResponse.json(
        { error: 'Missing offerId, accountId, or email.' },
        { status: 400 }
      );
    }

    const offer = SERVER_STORE_OFFERS.find((o) => o.offerId === body.offerId);
    if (!offer) {
      return NextResponse.json({ error: 'Unknown store offer.' }, { status: 404 });
    }

    const rawOffer = offer as unknown as Record<string, unknown>;
    const priceUsd = typeof rawOffer.priceUsd === 'number' ? rawOffer.priceUsd : 1.99;
    const currency = body.currency === 'USD' ? 'USD' : 'NGN';
    // Convert USD to NGN kobo (approx 1600 NGN/USD) or USD cents
    const amountMinorUnits =
      currency === 'USD'
        ? Math.max(50, Math.round(priceUsd * 100))
        : Math.max(10000, Math.round(priceUsd * 1600 * 100));

    const origin = body.origin || 'https://ultimate-football-manager-taupe.vercel.app';

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        amount: amountMinorUnits,
        currency,
        callback_url: `${origin}/?purchase=success&offerId=${encodeURIComponent(offer.offerId)}`,
        metadata: {
          accountId: body.accountId,
          offerId: offer.offerId,
        },
      }),
    });

    const data = (await paystackRes.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; reference?: string };
    };

    if (!paystackRes.ok || !data.status || !data.data?.authorization_url) {
      return NextResponse.json(
        { error: data.message || 'Failed to initialize Paystack transaction.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reference: data.data.reference,
      checkoutUrl: data.data.authorization_url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Paystack checkout error.' },
      { status: 500 }
    );
  }
}
