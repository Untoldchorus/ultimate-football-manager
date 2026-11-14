import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { DEFAULT_BALANCE_CONFIG } from '@/engine/balanceConfig';
import { BOOSTER_CATALOG, SERVER_STORE_OFFERS } from '@/engine/boosterEconomy';

/**
 * Server-side in-memory ledger for processed transaction IDs and Starter Pack account locks
 * within the serverless runtime instance, complemented by cryptographic HMAC signatures
 * and persistent client/Supabase state verification.
 */
const PROCESSED_TRANSACTION_IDS = new Set<string>();
const STARTER_PACK_OWNED_ACCOUNTS = new Set<string>();

function getServerPaymentSecret(): string {
  // Never exposed to the game client
  return process.env.FM_ECONOMY_HMAC_SECRET || 'fm27-server-authoritative-economy-secret-key-2026';
}

function generateServerSignature(
  accountId: string,
  offerId: string,
  transactionId: string,
  status: string
): string {
  const hmac = crypto
    .createHmac('sha256', getServerPaymentSecret())
    .update(`${accountId}:${offerId}:${transactionId}:${status}`)
    .digest('hex')
    .slice(0, 32);
  return `srv_sig_${hmac}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      accountId,
      offerId,
      transactionId,
      currencyType = 'soft',
      simulateOutcome = 'verified',
      alreadyOwnedOnClient = false,
    } = body as {
      accountId?: string;
      offerId?: string;
      transactionId?: string;
      currencyType?: 'soft' | 'premium' | 'real_money';
      simulateOutcome?: 'verified' | 'failed' | 'cancelled' | 'restored';
      alreadyOwnedOnClient?: boolean;
    };

    if (!accountId || !offerId || !transactionId) {
      return NextResponse.json(
        {
          verified: false,
          error: 'Missing required fields: accountId, offerId, or transactionId.',
        },
        { status: 400 }
      );
    }

    // Handle simulated failed or cancelled payment BEFORE locking transaction or starter pack eligibility
    if (simulateOutcome === 'failed' || simulateOutcome === 'cancelled') {
      return NextResponse.json({
        verified: false,
        status: simulateOutcome,
        transactionId,
        offerId,
        verificationSignature: `unverified_${simulateOutcome}_${Date.now()}`,
        message:
          simulateOutcome === 'cancelled'
            ? 'Transaction cancelled by user. Eligibility preserved.'
            : 'Payment provider declined transaction. Eligibility preserved.',
      });
    }

    // Starter Pack specific rules
    if (offerId === 'offer-starter-pack-onetime') {
      if (simulateOutcome === 'restored') {
        const wasOwned =
          STARTER_PACK_OWNED_ACCOUNTS.has(accountId) || Boolean(alreadyOwnedOnClient);
        if (!wasOwned) {
          return NextResponse.json(
            {
              verified: false,
              status: 'failed',
              error: 'No prior Starter Pack entitlement found for this account to restore.',
            },
            { status: 404 }
          );
        }
        const sig = generateServerSignature(accountId, offerId, transactionId, 'restored');
        return NextResponse.json({
          verified: true,
          status: 'restored',
          transactionId,
          offerId,
          verificationSignature: sig,
        });
      }

      if (STARTER_PACK_OWNED_ACCOUNTS.has(accountId) || alreadyOwnedOnClient) {
        return NextResponse.json(
          {
            verified: false,
            status: 'failed',
            error:
              'Starter Pack is a permanent one-time purchase per account and has already been claimed.',
          },
          { status: 409 }
        );
      }

      if (PROCESSED_TRANSACTION_IDS.has(transactionId)) {
        return NextResponse.json(
          {
            verified: false,
            status: 'failed',
            error: 'Duplicate transaction ID rejected by server ledger.',
          },
          { status: 409 }
        );
      }

      PROCESSED_TRANSACTION_IDS.add(transactionId);
      STARTER_PACK_OWNED_ACCOUNTS.add(accountId);
      const sig = generateServerSignature(accountId, offerId, transactionId, 'verified');

      return NextResponse.json({
        verified: true,
        status: 'verified',
        transactionId,
        offerId,
        verificationSignature: sig,
        priceUsd: DEFAULT_BALANCE_CONFIG.starterPackPriceUsd,
      });
    }

    // Standard Booster or Store Bundle purchase
    if (PROCESSED_TRANSACTION_IDS.has(transactionId)) {
      return NextResponse.json(
        {
          verified: false,
          status: 'failed',
          error: 'Duplicate transaction ID rejected by server ledger.',
        },
        { status: 409 }
      );
    }

    // Resolve either a catalog booster item (`booster:<itemId>:<currencyType>`) or a store bundle (`offerId`)
    const specialOffer = SERVER_STORE_OFFERS.find((o) => o.offerId === offerId);
    const boosterDef = BOOSTER_CATALOG.find((b) => b.itemId === offerId);

    if (!specialOffer && !boosterDef) {
      return NextResponse.json(
        {
          verified: false,
          status: 'failed',
          error: `Unrecognized store offer or booster ID: ${offerId}`,
        },
        { status: 404 }
      );
    }

    let resolvedOffer: {
      offerId: string;
      offerName: string;
      currencyType: 'soft' | 'premium' | 'real_money';
      costAmount: number;
      priceDisplay: string;
      itemsGranted: { itemId: string; quantity: number }[];
      softCoinsGranted: number;
      premiumCoinsGranted: number;
    };

    if (specialOffer) {
      resolvedOffer = {
        offerId: specialOffer.offerId,
        offerName: specialOffer.offerName,
        currencyType: specialOffer.currencyType,
        costAmount: specialOffer.costAmount,
        priceDisplay: specialOffer.priceDisplay,
        itemsGranted: specialOffer.itemsGranted,
        softCoinsGranted: specialOffer.softCoinsGranted ?? 0,
        premiumCoinsGranted: specialOffer.premiumCoinsGranted ?? 0,
      };
    } else {
      const b = boosterDef!;
      const usePremium = currencyType === 'premium' || b.softCurrencyPrice === undefined;
      const costAmount = usePremium
        ? (b.premiumCurrencyPrice ?? 100)
        : (b.softCurrencyPrice ?? 500);
      resolvedOffer = {
        offerId: b.itemId,
        offerName: b.name,
        currencyType: usePremium ? 'premium' : 'soft',
        costAmount,
        priceDisplay: usePremium ? `${costAmount} Premium Coins` : `${costAmount} Club Coins`,
        itemsGranted: [{ itemId: b.itemId, quantity: 1 }],
        softCoinsGranted: 0,
        premiumCoinsGranted: 0,
      };
    }

    PROCESSED_TRANSACTION_IDS.add(transactionId);
    const sig = generateServerSignature(accountId, offerId, transactionId, 'verified');

    return NextResponse.json({
      verified: true,
      status: 'verified',
      transactionId,
      verificationSignature: sig,
      offer: resolvedOffer,
    });
  } catch (err) {
    return NextResponse.json(
      {
        verified: false,
        error: err instanceof Error ? err.message : 'Internal payment verification error.',
      },
      { status: 500 }
    );
  }
}
