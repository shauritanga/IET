import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { UserEntity } from '../modules/user/entities/user.entity';
import {
  EngineeringDiscipline,
  MembershipClass,
  MembershipStatus,
  Title,
  UserRole,
} from '../common/enums';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
    await this.provisionAdminTwoFactor();
  }

  private async seedAdmin() {
    const email = this.configService.get<string>(
      'ADMIN_EMAIL',
      'shauritangaathanas@gmail.com',
    );
    const password = this.configService.get<string>(
      'ADMIN_PASSWORD',
      'Athanas@2015',
    );
    const firstName = this.configService.get<string>('ADMIN_FIRST_NAME', 'Athanas');
    const lastName = this.configService.get<string>('ADMIN_LAST_NAME', 'Shauritanga');
    const phoneNumber = this.configService.get<string>(
      'ADMIN_PHONE_NUMBER',
      '255655591660',
    );

    const hashed = await bcrypt.hash(password, 10);
    const existing = await this.userRepository.findOneBy({ email });

    if (existing) {
      await this.userRepository.save(
        this.userRepository.merge(existing, {
          email,
          password: hashed,
          firstName,
          lastName,
          phoneNumber,
          role: UserRole.SUPER_ADMIN,
          membershipStatus: MembershipStatus.ACTIVE,
          emailVerified: true,
          isActive: true,
        }),
      );
      this.logger.log(`Super admin user updated from seed: ${email}`);
      return;
    }

    const admin = this.userRepository.create({
      email,
      password: hashed,
      firstName,
      lastName,
      phoneNumber,
      role: UserRole.SUPER_ADMIN,
      membershipStatus: MembershipStatus.ACTIVE,
      emailVerified: true,
      isActive: true,
    });

    await this.userRepository.save(admin);
    this.logger.log(`Super admin user seeded: ${email}`);
  }

  private async provisionAdminTwoFactor() {
    const adminUsers = await this.userRepository.find({
      where: {
        role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
      },
    });

    for (const user of adminUsers) {
      if (user.enable2FA && user.twoFASecret) {
        continue;
      }

      const secret = speakeasy.generateSecret({
        name: `IET Admin Portal (${user.email})`,
        issuer: 'Institution of Engineers Tanzania',
      });

      user.enable2FA = true;
      user.twoFASecret = this.encryptionService.encrypt(secret.base32);
      await this.userRepository.save(user);

      this.logger.log(`Admin 2FA provisioned for: ${user.email}`);
      if (this.configService.get<string>('NODE_ENV') !== 'production') {
        this.logger.warn(
          `Admin 2FA secret for ${user.email}: ${secret.base32}`,
        );
      }
    }
  }

}
