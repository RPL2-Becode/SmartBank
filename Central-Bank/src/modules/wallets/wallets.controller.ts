import { Controller, Get, Param, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../../common/current-user.decorator';
import { ServiceTokenGuard } from '../../common/service-token.guard';
import { WalletAccountService } from './wallet-account.service';
import { Roles } from '../../common/roles.decorator';
import { Public } from '../../common/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('wallets/me')
@Roles(UserRole.WALLET_USER)
export class WalletsController {
  constructor(private readonly wallets: WalletAccountService) {}

  @Get('balance')
  balance(@CurrentUser() user: RequestUser) {
    return this.wallets.getBalance(user.sub);
  }

  @Get('transactions')
  transactions(@CurrentUser() user: RequestUser) {
    return this.wallets.getTransactions(user.sub);
  }
}

// Endpoint terpisah untuk service-to-service lookup wallet by userId.
// Dipakai oleh Wallet saat login (untuk menyertakan walletId dalam JWT).
// Diamankan dengan shared SERVICE_TOKEN, bukan JWT user.
// Public decorator agar OptionalAuthGuard & RolesGuard tidak reject (token
// service bukan JWT user). ServiceTokenGuard yang memvalidasi akses.
@Controller('users')
export class UsersController {
  constructor(private readonly wallets: WalletAccountService) {}

  @Public()
  @UseGuards(ServiceTokenGuard)
  @Get(':id/wallet')
  async getWalletByUserId(@Param('id') id: string) {
    try {
      const wallet = await this.wallets.getPrimaryWallet(id);
      return {
        user_id: id,
        wallet_id: wallet.id,
        currency: wallet.currency,
        available_balance: wallet.availableBalance,
        hold_balance: wallet.holdBalance,
      };
    } catch (err) {
      // findFirstOrThrow throws when nothing matches; map to 404 cleanly.
      throw new NotFoundException(`Wallet untuk user ${id} tidak ditemukan di Central-Bank`);
    }
  }

  /**
   * Public-to-authenticated-users endpoint: resolve account number to walletId.
   * Used by Wallet's transfer flow: user types account number, this resolves it.
   * JWT required (any authenticated user can lookup any valid account number).
   * Returns minimal info (account_number, holder_name, wallet_id) — no balance.
   *
   * Catatan: hanya validasi 10 digit, TIDAK enforce Luhn checksum. Luhn
   * dijaga saat generate (lihat generateAccountNumber) untuk akun baru
   * sebagai typo-prevention. Akun existing dari backfill migration
   * (20260618150000_add_account_number) tidak selalu Luhn-valid, jadi
   * lookup harus accept raw 10 digit agar transfer ke akun lama tetap jalan.
   */
  @Get('by-account/:accountNumber')
  async getUserByAccountNumber(@Param('accountNumber') accountNumber: string) {
    const sanitized = (accountNumber || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(sanitized)) {
      throw new BadRequestException('Nomor rekening tidak valid (harus 10 digit)');
    }
    try {
      return await this.wallets.getWalletByAccountNumber(sanitized);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw new NotFoundException(`Nomor rekening ${sanitized} tidak ditemukan atau tidak aktif`);
      }
      throw err;
    }
  }
}