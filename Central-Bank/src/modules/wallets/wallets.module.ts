import { Module } from '@nestjs/common';
import { WalletAccountService } from './wallet-account.service';
import { WalletsController, UsersController } from './wallets.controller';
import { ServiceTokenGuard } from '../../common/service-token.guard';

@Module({
  controllers: [WalletsController, UsersController],
  providers: [WalletAccountService, ServiceTokenGuard],
  exports: [WalletAccountService],
})
export class WalletsModule {}