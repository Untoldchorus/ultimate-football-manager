import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { DEFAULT_BALANCE_CONFIG } from '@/engine/balanceConfig';
import { BOOSTER_CATALOG } from '@/engine/boosterEconomy';

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

export interface StoreOfferCatalogItem {
  offerId: string;
  offerName: string;
  category: 'starter_pack' | 'bundle' | 'currency_pack' | 'booster';
  currencyType: 'soft' | 'premium' | 'real_money';
  costAmount: number;
  priceDisplay: string;
  badgeText?: string;
  description: string;
  itemsGranted: { itemId: string; quantity: number }[];
  softCoinsGranted?: number;
  premiumCoinsGranted?: number;
}

export const SERVER_STORE_OFFERS: StoreOfferCatalogItem[] = [
  {
    offerId: 'offer-bundle-matchday-prep',
    offerName: 'Matchday Tactical & Fitness Bundle',
    category: 'bundle',
    currencyType: 'premium',
    costAmount: 145,
    priceDisplay: '145 Premium Coins',
    badgeText: 'POPULAR BUNDLE',
    description:
      'Includes 1x Opposition & Tactical Preparation Dossier (Rare), 2x Cryo Recovery Packs (Common), and 1x Squad Communication Workshop (Common).',
    itemsGranted: [
      { itemId: 'bst-syn-tac-rare', quantity: 1 },
      { itemId: 'bst-rec-pack-common', quantity: 2 },
      { itemId: 'bst-chem-train-common', quantity: 1 },
    ],
  },
  {
    offerId: 'offer-bundle-champions-cohesion',
    offerName: 'Champions Cohesion & Synergy Crate',
    category: 'bundle',
    currencyType: 'premium',
    costAmount: 310,
    priceDisplay: '310 Premium Coins',
    badgeText: 'EVENT SPECIAL',
    description:
      'High-tier tactical & dressing room crate: 1x Pre-Match Retreat & Team Bonding (Epic), 1x Synchronized Unit Coordination Camp (Epic), and 1x Dressing Room Gala (Rare).',
    itemsGranted: [
      { itemId: 'bst-chem-bonding-epic', quantity: 1 },
      { itemId: 'bst-syn-unit-epic', quantity: 1 },
      { itemId: 'bst-mor-team-rare', quantity: 1 },
    ],
  },
  {
    offerId: 'offer-bundle-academy-breakthrough',
    offerName: 'Elite Academy Development Pack',
    category: 'bundle',
    currencyType: 'soft',
    costAmount: 1650,
    priceDisplay: '1,650 Club Coins',
    badgeText: 'SOFT CURRENCY VALUE',
    description:
      'Accelerate player development within fair-play caps: 2x Standard Training XP Drills (Common) and 1x Precision Technical Masterclass (Rare).',
    itemsGranted: [
      { itemId: 'bst-train-xp-common', quantity: 2 },
      { itemId: 'bst-train-tech-rare', quantity: 1 },
    ],
  },
  {
    offerId: 'offer-coins-board-stipend',
    offerName: 'Club Board Treasury Exchange (2,500 Club Coins)',
    category: 'currency_pack',
    currencyType: 'premium',
    costAmount: 110,
    priceDisplay: '110 Premium Coins',
    description: 'Convert 110 Premium Coins into 2,500 Soft Club Coins for regular consumables.',
    itemsGranted: [],
    softCoinsGranted: 2500,
  },
  {
    offerId: 'offer-premium-pouch-500',
    offerName: 'Manager Treasury Pouch (500 Premium Coins)',
    category: 'currency_pack',
    currencyType: 'real_money',
    costAmount: 4.99,
    priceDisplay: '$4.99',
    badgeText: 'TREASURY PACK',
    description: '500 verified Premium Coins for specialist tactical dossiers and seasonal crates.',
    itemsGranted: [],
    premiumCoinsGranted: 500,
  },
  {
    offerId: 'offer-premium-vault-1200',
    offerName: 'Champions Boardroom Vault (1,200 Premium Coins)',
    category: 'currency_pack',
    currencyType: 'real_money',
    costAmount: 9.99,
    priceDisplay: '$9.99',
    badgeText: '+20% BONUS COINS',
    description: '1,200 verified Premium Coins + 1x Bonus Precision Technical Masterclass (Rare).',
    itemsGranted: [{ itemId: 'bst-train-tech-rare', quantity: 1 }],
    premiumCoinsGranted: 1200,
  },
];

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
