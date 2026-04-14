import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../modules/user/entities/user.entity';
import {
  EngineeringDiscipline,
  MembershipClass,
  MembershipStatus,
  Title,
  UserRole,
} from '../common/enums';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedAdmin();
    await this.seedEngineerPortalUser();
  }

  private async seedAdmin() {
    const email = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@iet.or.tz',
    );
    const password = this.configService.get<string>(
      'ADMIN_PASSWORD',
      'Admin@123!',
    );

    const existing = await this.userRepository.findOneBy({ email });
    if (existing) {
      this.logger.log(`Admin user already exists: ${email}`);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = this.userRepository.create({
      email,
      password: hashed,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      membershipStatus: MembershipStatus.ACTIVE,
      emailVerified: true,
      isActive: true,
    });

    await this.userRepository.save(admin);
    this.logger.log(`Admin user seeded: ${email}`);
  }

  private async seedEngineerPortalUser() {
    const email = this.configService.get<string>(
      'ENGINEER_PORTAL_EMAIL',
      'daudiramadhani79@rgmail.com',
    );
    const password = this.configService.get<string>(
      'ENGINEER_PORTAL_PASSWORD',
      'mpando@20002',
    );

    const existing = await this.userRepository.findOneBy({ email });
    if (existing) {
      this.logger.log(`Engineer portal user already exists: ${email}`);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    const engineerUser = this.userRepository.create({
      email,
      password: hashed,
      title: Title.ENG,
      firstName: 'Daudi',
      lastName: 'Ramadhani',
      role: UserRole.MEMBER,
      membershipId: 'IET-ENG-2023-001',
      membershipClass: MembershipClass.MEMBER,
      membershipStatus: MembershipStatus.ACTIVE,
      engineeringDiscipline: EngineeringDiscipline.CIVIL,
      emailVerified: true,
      isActive: true,
    });

    await this.userRepository.save(engineerUser);
    this.logger.log(`Engineer portal user seeded: ${email}`);
  }
}
