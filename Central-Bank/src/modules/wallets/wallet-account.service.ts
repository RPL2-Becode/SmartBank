import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async getPrimaryWallet(userId: string) {
    return this.prisma.walletAccount.findFirstOrThrow({
      where: { userId, accountType: { in: ['USER_WALLET', 'MERCHANT_WALLET'] } },
    });
  }

  /**
   * Lookup wallet + counterparty info by account number (10 digit).
   * Used by Wallet when filling a transfer form: user types account number,
   * we resolve it to walletId before submitting to settlement engine.
   *
   * Returns minimal info (account number, holder name, walletId).
   * Does NOT return balance to prevent enumeration attacks.
   */
  async getWalletByAccountNumber(accountNumber: string) {
    const user = await this.prisma.user.findUnique({
      where: { accountNumber },
      select: {
        id: true,
        name: true,
        status: true,
        wallets: {
          where: { accountType: 'USER_WALLET' },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!user || user.wallets.length === 0) {
      throw new NotFoundException(`Nomor rekening ${accountNumber} tidak ditemukan`);
    }
    if (user.status === 'SUSPENDED') {
      throw new NotFoundException(`Rekening ${accountNumber} tidak aktif`);
    }
    return {
      user_id: user.id,
      account_number: accountNumber,
      holder_name: user.name,
      wallet_id: user.wallets[0].id,
    };
  }

  async getBalance(userId: string) {
    const wallet = await this.getPrimaryWallet(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accountNumber: true, name: true },
    });
    return {
      wallet_id: wallet.id,
      account_number: user?.accountNumber ?? null,
      holder_name: user?.name ?? null,
      currency: wallet.currency,
      available_balance: wallet.availableBalance,
      hold_balance: wallet.holdBalance,
    };
  }

  async getTransactions(userId: string) {
    const wallet = await this.getPrimaryWallet(userId);
    const transactions = await this.prisma.transaction.findMany({
      where: { OR: [{ payerWalletId: wallet.id }, { payeeWalletId: wallet.id }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return transactions.map((transaction) => ({
      transaction_id: transaction.id,
      transaction_type: transaction.transactionType,
      status: transaction.status,
      source_app: transaction.sourceApp,
      gross_amount: transaction.grossAmount,
      total_debit: transaction.totalDebit,
      fee_total: transaction.feeTotal,
      tax_total: transaction.taxTotal,
      created_at: transaction.createdAt,
      settled_at: transaction.settledAt,
      direction: transaction.payerWalletId === wallet.id ? 'OUT' : 'IN',
    }));
  }
}
