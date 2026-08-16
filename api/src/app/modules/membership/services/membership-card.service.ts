import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MembershipCardEntity } from '../entities/membership-card.entity';
import { UserEntity } from '../../user/entities/user.entity';
import {
  MembershipCardStatus,
  MembershipClass,
  MembershipStatus,
} from '../../../common/enums';
import { generateMembershipCardPdf } from '../utils/membership-card-pdf';
import { MessagingQueueService } from '../../queues/messaging-queue.service';

const CLASS_LABELS: Record<string, string> = {
  [MembershipClass.GRADUATE]: 'Graduate',
  [MembershipClass.ASSOCIATE]: 'Associate',
  [MembershipClass.MEMBER]: 'Member',
  [MembershipClass.CORPORATE]: 'Corporate',
  [MembershipClass.SENIOR]: 'Senior Member',
  [MembershipClass.FELLOW]: 'Fellow',
  [MembershipClass.HONORARY]: 'Honorary',
};

@Injectable()
export class MembershipCardService {
  private readonly logger = new Logger(MembershipCardService.name);

  constructor(
    @InjectRepository(MembershipCardEntity)
    private readonly cardRepository: Repository<MembershipCardEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly messagingQueue: MessagingQueueService,
  ) {}

  async getCardForUser(userId: string) {
    const card = await this.cardRepository.findOne({ where: { userId } });
    if (!card) {
      return { issued: false as const, card: null };
    }
    return { issued: true as const, card: this.toSummary(card) };
  }

  async issueCard(memberId: string, actorId: string, notes?: string) {
    const user = await this.requireEligibleMember(memberId);
    const snapshot = this.buildSnapshot(user);

    let card = await this.cardRepository.findOne({ where: { userId: memberId } });
    if (!card) {
      card = this.cardRepository.create({ userId: memberId });
    }

    Object.assign(card, snapshot);
    card.status = MembershipCardStatus.ISSUED;
    card.issuedAt = new Date();
    card.issuedById = actorId;
    card.readyForCollectionAt = null;
    card.collectedAt = null;
    card.collectedById = null;
    card.notes = notes ?? card.notes ?? null;

    const saved = await this.cardRepository.save(card);

    void this.notifyIssued(user, saved).catch((error: Error) => {
      this.logger.warn(
        `Membership card email/SMS failed for ${user.email}: ${error.message}`,
      );
    });

    return this.toSummary(saved);
  }

  async markReadyForCollection(memberId: string) {
    const card = await this.requireCard(memberId);
    if (card.status === MembershipCardStatus.COLLECTED) {
      throw new BadRequestException('Card is already marked as collected');
    }
    card.status = MembershipCardStatus.READY_FOR_COLLECTION;
    card.readyForCollectionAt = new Date();
    const saved = await this.cardRepository.save(card);

    const user = await this.userRepository.findOneBy({ id: memberId });
    if (user?.phoneNumber) {
      void this.messagingQueue
        .enqueueSms({
          to: user.phoneNumber,
          message: `IET: Your membership card is ready for collection at the IET office. Membership No. ${card.membershipNumber}.`,
        })
        .catch((error: Error) =>
          this.logger.warn(`Collection SMS failed: ${error.message}`),
        );
    }

    return this.toSummary(saved);
  }

  async markCollected(memberId: string, actorId: string) {
    const card = await this.requireCard(memberId);
    card.status = MembershipCardStatus.COLLECTED;
    card.collectedAt = new Date();
    card.collectedById = actorId;
    if (!card.readyForCollectionAt) {
      card.readyForCollectionAt = new Date();
    }
    const saved = await this.cardRepository.save(card);
    return this.toSummary(saved);
  }

  async generatePdfForMember(memberId: string): Promise<{
    buffer: Buffer;
    filename: string;
  }> {
    const card = await this.requireCard(memberId);
    const buffer = await generateMembershipCardPdf({
      memberName: card.memberName,
      membershipCategory: card.membershipCategory,
      membershipNumber: card.membershipNumber,
      specialization: card.specialization,
      validUntil: card.validUntil,
      photoUrl: card.photoUrl,
      verifyUrl: this.buildVerifyUrl(card.membershipNumber),
    });

    const safeName = card.memberName.replace(/[^\w\- ]+/g, '').trim() || 'member';
    return {
      buffer,
      filename: `IET-Membership-Card-${safeName}.pdf`,
    };
  }

  /** Member self-service download — only after secretariat has issued. */
  async generatePdfForSelf(userId: string) {
    return this.generatePdfForMember(userId);
  }

  private async requireEligibleMember(memberId: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: memberId },
      relations: ['membershipCategory'],
    });
    if (!user) {
      throw new NotFoundException('Member not found');
    }
    if (!user.membershipId) {
      throw new BadRequestException(
        'Member does not have a membership number yet. Complete application approval first.',
      );
    }
    if (
      user.membershipStatus !== MembershipStatus.ACTIVE &&
      user.membershipStatus !== MembershipStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Membership card can only be issued for approved members',
      );
    }
    return user;
  }

  private async requireCard(memberId: string): Promise<MembershipCardEntity> {
    const card = await this.cardRepository.findOne({ where: { userId: memberId } });
    if (!card) {
      throw new NotFoundException(
        'Membership card has not been issued yet. Click Issue first.',
      );
    }
    return card;
  }

  private buildSnapshot(user: UserEntity) {
    const fullName =
      [user.title, user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      user.fullName ||
      user.email;

    const categoryFromClass = user.membershipClass
      ? CLASS_LABELS[user.membershipClass] ?? user.membershipClass
      : null;
    const categoryFromEntity = user.membershipCategory?.name ?? null;

    const validUntil =
      user.membershipExpiryDate ??
      new Date(Date.UTC(new Date().getUTCFullYear(), 11, 31));

    return {
      membershipNumber: user.membershipId!,
      memberName: fullName,
      membershipCategory: categoryFromClass || categoryFromEntity || 'Member',
      specialization: user.engineeringDiscipline
        ? String(user.engineeringDiscipline).replace(/_/g, ' ')
        : null,
      photoUrl: user.profilePhotoUrl ?? null,
      validUntil,
    };
  }

  private buildVerifyUrl(membershipNumber: string): string {
    const base =
      this.configService.get<string>('ENGINEER_PORTAL_URL') ||
      this.configService.get<string>('APP_URL') ||
      'https://member-portal.iet.or.tz';
    return `${base.replace(/\/$/, '')}/verify/membership-card?no=${encodeURIComponent(membershipNumber)}`;
  }

  private async notifyIssued(user: UserEntity, card: MembershipCardEntity) {
    const portal =
      this.configService.get<string>('ENGINEER_PORTAL_URL') ||
      'http://localhost:4000';
    const downloadPath = `${portal.replace(/\/$/, '')}/dashboard/membership-card`;

    await this.messagingQueue.enqueueEmail({
      to: user.email,
      subject: 'Your IET Membership Card is Ready',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a">
          <div style="background:#c41212;color:#fff;padding:18px 22px;text-align:center">
            <h1 style="margin:0;font-size:20px">Membership Card Issued</h1>
          </div>
          <div style="padding:24px;background:#f7fafc">
            <p>Dear ${card.memberName},</p>
            <p>Your IET membership card has been issued by the Secretariat.</p>
            <ul>
              <li><strong>Membership No.:</strong> ${card.membershipNumber}</li>
              <li><strong>Category:</strong> ${card.membershipCategory}</li>
              <li><strong>Valid until:</strong> ${new Date(card.validUntil).toLocaleDateString('en-GB')}</li>
            </ul>
            <p>You can download and print your card from the member portal, or collect a printed copy from the IET office when notified.</p>
            <p style="text-align:center;margin:28px 0">
              <a href="${downloadPath}" style="background:#1a365d;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">View / Print Card</a>
            </p>
          </div>
        </div>
      `,
    });

    if (user.phoneNumber) {
      await this.messagingQueue.enqueueSms({
        to: user.phoneNumber,
        message: `IET: Your membership card (${card.membershipNumber}) has been issued. Download it in the member portal or wait for collection notice.`,
      });
    }
  }

  private toSummary(card: MembershipCardEntity) {
    return {
      id: card.id,
      userId: card.userId,
      status: card.status,
      membershipNumber: card.membershipNumber,
      memberName: card.memberName,
      membershipCategory: card.membershipCategory,
      specialization: card.specialization,
      photoUrl: card.photoUrl,
      validUntil: card.validUntil,
      issuedAt: card.issuedAt,
      readyForCollectionAt: card.readyForCollectionAt,
      collectedAt: card.collectedAt,
      notes: card.notes,
      canDownload: true,
    };
  }
}
