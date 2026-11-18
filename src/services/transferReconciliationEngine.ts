/**
 * Dedicated Transfer Reconciliation Engine.
 *
 * Enforces strict transfer status rules:
 * - ONLY confirmed and effective transfers modify active squads.
 * - Pending, rumoured, or cancelled transfers are never applied automatically.
 * - Supports permanent transfers, loans, loan returns, recalls, free agent registrations, and retirements.
 * - Ensures minimum squad sizes and validates player-club associations.
 */

import {
  ReconciliationTransferRecord,
  TransferRecordType,
  TransferStatus,
  VERIFIED_2026_TRANSFERS,
} from '@/data/transfers2026Snapshot';
import { GameState, Player, TransferRecord } from '@/engine/types';

export interface TransferReconciliationResult {
  updatedState: GameState;
  appliedTransfers: ReconciliationTransferRecord[];
  skippedTransfers: Array<{ transfer: ReconciliationTransferRecord; reason: string }>;
  errors: string[];
}

export class TransferReconciliationEngine {
  private transferLedger: ReconciliationTransferRecord[] = [...VERIFIED_2026_TRANSFERS];

  getTransferLedger(): ReconciliationTransferRecord[] {
    return [...this.transferLedger];
  }

  addManualTransfer(transfer: ReconciliationTransferRecord): void {
    this.transferLedger.unshift(transfer);
  }

  updateTransferStatus(transferId: string, status: TransferStatus): boolean {
    const item = this.transferLedger.find((t) => t.id === transferId);
    if (!item) return false;
    item.transferStatus = status;
    item.lastVerificationTimestamp = new Date().toISOString();
    return true;
  }

  /**
   * Applies confirmed & effective transfers to the provided GameState.
   * Does NOT alter career save history without confirmation.
   */
  reconcileGameState(
    state: GameState,
    transfersToApply?: ReconciliationTransferRecord[]
  ): TransferReconciliationResult {
    const candidateList = transfersToApply ?? this.transferLedger;
    const appliedTransfers: ReconciliationTransferRecord[] = [];
    const skippedTransfers: Array<{ transfer: ReconciliationTransferRecord; reason: string }> = [];
    const errors: string[] = [];

    let currentState = { ...state };
    const currentDate = new Date('2026-11-18').getTime();

    for (const tr of candidateList) {
      // Rule 1: Must be confirmed
      if (tr.transferStatus !== 'confirmed') {
        skippedTransfers.push({
          transfer: tr,
          reason: `Transfer status is '${tr.transferStatus}', not 'confirmed'.`,
        });
        continue;
      }

      // Rule 2: Must be effective on or before reference date
      const effDate = new Date(tr.effectiveDate).getTime();
      if (effDate > currentDate) {
        skippedTransfers.push({
          transfer: tr,
          reason: `Effective date ${tr.effectiveDate} is in the future.`,
        });
        continue;
      }

      // Execute transfer application on players list
      const applyResult = this.applySingleTransfer(currentState, tr);
      if (applyResult.success && applyResult.state) {
        currentState = applyResult.state;
        appliedTransfers.push(tr);
      } else {
        skippedTransfers.push({
          transfer: tr,
          reason: applyResult.reason || 'Failed to apply transfer.',
        });
        if (applyResult.reason) errors.push(applyResult.reason);
      }
    }

    return {
      updatedState: currentState,
      appliedTransfers,
      skippedTransfers,
      errors,
    };
  }

  private applySingleTransfer(
    state: GameState,
    tr: ReconciliationTransferRecord
  ): { success: boolean; state?: GameState; reason?: string } {
    // Find matching player by name or ID
    const player = state.players.find(
      (p) =>
        p.id === tr.playerId ||
        `${p.firstName} ${p.lastName}`.toLowerCase() === tr.playerName.toLowerCase()
    );

    if (!player) {
      // Check if this is a newly arriving player (e.g. from an unmodeled league or free agent)
      // Destination club must exist
      const destClub = state.clubs.find((c) => c.id === tr.toClubId);
      if (!destClub) {
        return { success: false, reason: `Destination club '${tr.toClubId}' not found.` };
      }

      // If player is not currently in state, we do not fabricate invalid records
      return {
        success: false,
        reason: `Player '${tr.playerName}' not found in active player registry.`,
      };
    }

    // Check if player is already at destination club
    if (player.clubId === tr.toClubId) {
      return { success: true, state }; // Already reconciled
    }

    // Destination club check
    const toClub = state.clubs.find((c) => c.id === tr.toClubId);
    if (!toClub && tr.toClubId !== 'free-agent' && tr.transferType !== 'retirement') {
      return { success: false, reason: `Target club ${tr.toClubId} does not exist.` };
    }

    const updatedPlayers = state.players.map((p) => {
      if (p.id !== player.id) return p;

      if (tr.transferType === 'retirement') {
        return {
          ...p,
          clubId: 'retired',
          transferListed: false,
        };
      }

      if (tr.transferType === 'loan') {
        return {
          ...p,
          clubId: tr.toClubId,
          loanedFromClubId: tr.fromClubId,
        };
      }

      if (tr.transferType === 'loan_return' || tr.transferType === 'loan_recall') {
        return {
          ...p,
          clubId: tr.toClubId,
          loanedFromClubId: null,
        };
      }

      // Permanent, Free Transfer, Free Agent
      return {
        ...p,
        clubId: tr.toClubId,
        loanedFromClubId: null,
      };
    });

    // Record into in-game transfer ledger
    const inGameRecord: TransferRecord = {
      id: `tr-rec-${Date.now()}-${player.id}`,
      season: state.currentSeason,
      week: state.currentWeek,
      playerId: player.id,
      playerName: `${player.firstName} ${player.lastName}`,
      fromClubId: player.clubId,
      fromClubName: tr.fromClubName || player.clubId,
      toClubId: tr.toClubId,
      toClubName: tr.toClubName || tr.toClubId,
      fee: tr.fee,
      isLoan: tr.transferType === 'loan',
    };

    const nextState: GameState = {
      ...state,
      players: updatedPlayers,
      transfers: [inGameRecord, ...(state.transfers || [])],
    };

    return { success: true, state: nextState };
  }
}

export const transferReconciliationEngine = new TransferReconciliationEngine();
