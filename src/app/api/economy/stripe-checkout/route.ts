import { NextResponse } from 'next/server';
import { SERVER_STORE_OFFERS } from '@/engine/boosterEconomy';

export async function POST(request: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured on the server.' },
        { status: 503 }
      );
    }

    const body = (await request.json()) as {
      offerId?: string;
      accountId?: string;
      origin?: string;
    };

    if (!body.offerId || !body.accountId) {
      return NextResponse.json(
        { error: 'Missing offerId or accountId.' },
        { status: 400 }
      );
    }

    const offer = SERVER_STORE_OFFERS.find((o) => o.offerId === body.offerId);
    if (!offer) {
      return NextResponse.json({ error: 'Unknown store offer.' }, { status: 404 });
    }

    const rawOffer = offer as unknown as Record<string, unknown>;
    const priceUsd = typeof rawOffer.priceUsd === 'number' ? rawOffer.priceUsd : 1.99;
    const productName =
      typeof rawOffer.title === 'string'
        ? rawOffer.title
        : typeof rawOffer.name === 'string'
          ? rawOffer.name
          : offer.offerId;
    const unitAmountCents = Math.max(50, Math.round(priceUsd * 100));
    const origin = body.origin || 'https://ultimate-football-manager-taupe.vercel.app';

    const params = new URLSearchParams({
      mode: 'payment',
      'success_url': `${origin}/?purchase=success&offerId=${encodeURIComponent(offer.offerId)}`,
      'cancel_url': `${origin}/?purchase=cancelled`,
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(unitAmountCents),
      'line_items[0][price_data][product_data][name]': productName,
      'line_items[0][quantity]': '1',
      'metadata[accountId]': body.accountId,
      'metadata[offerId]': offer.offerId,
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = (await stripeRes.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!stripeRes.ok || !data.url) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to create Stripe Checkout session.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      sessionId: data.id,
      checkoutUrl: data.url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Stripe checkout error.' },
      { status: 500 }
    );
  }
}
