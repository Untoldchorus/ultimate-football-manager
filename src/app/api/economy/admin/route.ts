import { NextResponse } from 'next/server';
import {
  DEFAULT_BALANCE_CONFIG,
  validateAndApplyBalanceConfigUpdate,
} from '@/engine/balanceConfig';
import { BalanceConfiguration } from '@/engine/types';

function getAdminAccessCode(): string {
  return process.env.FM_ADMIN_PASSCODE || 'ADMIN-FM27';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      adminPasscode,
      adminId = 'admin-director',
      currentConfig = DEFAULT_BALANCE_CONFIG,
      patch,
    } = body as {
      adminPasscode?: string;
      adminId?: string;
      currentConfig?: BalanceConfiguration;
      patch?: Partial<BalanceConfiguration>;
    };

    if (!adminPasscode || adminPasscode !== getAdminAccessCode()) {
      return NextResponse.json(
        {
          authorized: false,
          error: 'Unauthorized: invalid Administrator Balancing Passcode.',
        },
        { status: 401 }
      );
    }

    if (!patch || typeof patch !== 'object') {
      return NextResponse.json(
        {
          authorized: true,
          updatedConfig: currentConfig,
          auditEntries: [],
        },
        { status: 200 }
      );
    }

    const result = validateAndApplyBalanceConfigUpdate(currentConfig, patch, adminId);

    return NextResponse.json({
      authorized: true,
      updatedConfig: result.updatedConfig,
      auditEntry: result.auditEntry,
      auditEntries: [result.auditEntry],
    });
  } catch (err) {
    return NextResponse.json(
      {
        authorized: false,
        error: err instanceof Error ? err.message : 'Administrator configuration error.',
      },
      { status: 500 }
    );
  }
}
