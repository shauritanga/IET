import { Module, Global } from '@nestjs/common';
import { HashService } from './services/hash.service';
import { SmsService } from './services/sms.service';
import { EmailService } from './services/email.service';
import { PaymentGatewayService } from './services/payment-gateway.service';
import { StorageService } from './services/storage.service';
import { CommonModule } from '../../common/common.module';
import { UploadController } from './controllers/upload.controller';

@Global()
@Module({
  imports: [CommonModule],
  controllers: [UploadController],
  providers: [
    HashService,
    SmsService,
    EmailService,
    PaymentGatewayService,
    StorageService,
  ],
  exports: [
    HashService,
    SmsService,
    EmailService,
    PaymentGatewayService,
    StorageService,
    CommonModule,
  ],
})
export class SharedModule {}
