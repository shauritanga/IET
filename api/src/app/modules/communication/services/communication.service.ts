import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { MembershipCategoryEntity } from '../../admin/entities/membership-category.entity';
import { EmailService } from '../../shared/services/email.service';
import { SmsService } from '../../shared/services/sms.service';
import {
  CommunicationMessageEntity,
  CommunicationTemplateEntity,
  CommunicationDeliveryEntity,
} from '../entities';
import {
  COMMUNICATION_TYPES,
  COMMUNICATION_TARGETS,
  CommunicationHistoryQueryDto,
  CommunicationTemplateQueryDto,
  CreateCommunicationTemplateDto,
  SendCommunicationDto,
  UpdateCommunicationTemplateDto,
} from '../dto';
import { UserRole } from '../../../common/enums';

type Recipient = Pick<
  UserEntity,
  'id' | 'email' | 'phoneNumber' | 'title' | 'firstName' | 'middleName' | 'lastName'
>;

type MessageListItem = {
  id: string;
  type: string;
  target: string;
  groupId: string | null;
  groupName: string | null;
  subject: string | null;
  message: string;
  status: string;
  recipientCount: number;
  successfulCount: number;
  failedCount: number;
  createdAt: Date;
  sentAt: Date | null;
};

type TemplateListItem = {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  body: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);
  private readonly chunkSize = 25;

  constructor(
    @InjectRepository(CommunicationMessageEntity)
    private messageRepository: Repository<CommunicationMessageEntity>,
    @InjectRepository(CommunicationTemplateEntity)
    private templateRepository: Repository<CommunicationTemplateEntity>,
    @InjectRepository(CommunicationDeliveryEntity)
    private deliveryRepository: Repository<CommunicationDeliveryEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(MembershipCategoryEntity)
    private categoryRepository: Repository<MembershipCategoryEntity>,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async sendMessage(
    adminId: string,
    dto: SendCommunicationDto,
  ): Promise<{ message: MessageListItem; deliverySummary: { total: number; successful: number; failed: number } }> {
    if (!COMMUNICATION_TYPES.includes(dto.type)) {
      throw new BadRequestException('Invalid communication type');
    }
    if (!COMMUNICATION_TARGETS.includes(dto.recipients)) {
      throw new BadRequestException('Invalid recipient target');
    }
    if (dto.type === 'EMAIL' && !dto.subject?.trim()) {
      throw new BadRequestException('Subject is required for email messages');
    }
    if (dto.recipients === 'GROUP' && !dto.groupId) {
      throw new BadRequestException('groupId is required for group messages');
    }

    const group =
      dto.recipients === 'GROUP'
        ? await this.categoryRepository.findOne({ where: { id: dto.groupId } })
        : null;

    if (dto.recipients === 'GROUP' && !group) {
      throw new NotFoundException('Selected membership category was not found');
    }

    const recipients = await this.resolveRecipients(dto);
    const message = await this.messageRepository.save(
      this.messageRepository.create({
        createdById: adminId,
        type: dto.type,
        target: dto.recipients,
        groupId: group?.id ?? null,
        subject: dto.subject?.trim() || null,
        message: dto.message.trim(),
        status: 'PENDING',
        recipientCount: recipients.length,
        successfulCount: 0,
        failedCount: 0,
        sentAt: null,
        errorSummary: null,
      }),
    );

    if (recipients.length === 0) {
      message.status = 'FAILED';
      message.errorSummary = 'No recipients matched the selected criteria';
      message.sentAt = new Date();
      await this.messageRepository.save(message);
      return {
        message: this.mapMessage(message, group?.name ?? null),
        deliverySummary: { total: 0, successful: 0, failed: 0 },
      };
    }

    let successful = 0;
    let failed = 0;

    for (const chunk of this.chunk(recipients, this.chunkSize)) {
      const deliveryRows = await Promise.all(
        chunk.map(async (recipient) => {
          const result = await this.sendToRecipient(dto, recipient);
          if (result.success) successful += 1;
          else failed += 1;

          const delivery = this.deliveryRepository.create({
            messageId: message.id,
            userId: recipient.id,
            recipient: result.recipient,
            channel: dto.type,
            status: result.success ? 'SENT' : 'FAILED',
            error: result.error ?? null,
            sentAt: new Date(),
          });
          return delivery;
        }),
      );

      await this.deliveryRepository.save(deliveryRows);
    }

    message.status = failed === 0 ? 'SENT' : successful > 0 ? 'SENT' : 'FAILED';
    message.successfulCount = successful;
    message.failedCount = failed;
    message.sentAt = new Date();
    message.errorSummary = failed > 0 ? `${failed} recipient(s) failed delivery` : null;
    await this.messageRepository.save(message);

    this.logger.log(
      `Communication message ${message.id} sent by admin ${adminId}: ${successful} success, ${failed} failed`,
    );

    return {
      message: this.mapMessage(message, group?.name ?? null),
      deliverySummary: { total: recipients.length, successful, failed },
    };
  }

  async listHistory(
    query: CommunicationHistoryQueryDto,
  ): Promise<{
    items: MessageListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 10;
    const skip = (page - 1) * limit;

    const qb = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.group', 'group');

    if (query.type) {
      qb.andWhere('message.type = :type', { type: query.type });
    }
    if (query.target) {
      qb.andWhere('message.target = :target', { target: query.target });
    }
    if (query.status) {
      qb.andWhere('message.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere(
        '(message.subject ILIKE :search OR message.message ILIKE :search OR group.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await qb
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map((item) => this.mapMessage(item, item.group?.name ?? null)),
      total,
      page,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async listTemplates(
    query: CommunicationTemplateQueryDto,
  ): Promise<{
    items: TemplateListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 10;
    const skip = (page - 1) * limit;

    const qb = this.templateRepository.createQueryBuilder('template');
    if (query.type) {
      qb.andWhere('template.type = :type', { type: query.type });
    }

    const [items, total] = await qb
      .orderBy('template.updatedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map((template) => this.mapTemplate(template)),
      total,
      page,
      pageSize: limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async createTemplate(dto: CreateCommunicationTemplateDto): Promise<TemplateListItem> {
    await this.ensureTemplateTypeValid(dto.type, dto.subject);
    const existing = await this.templateRepository.findOne({
      where: { name: dto.name.trim() },
    });
    if (existing) {
      throw new BadRequestException('A template with that name already exists');
    }

    const template = await this.templateRepository.save(
      this.templateRepository.create({
        name: dto.name.trim(),
        type: dto.type,
        subject: dto.subject?.trim() || null,
        body: dto.body.trim(),
        isActive: dto.isActive ?? true,
      }),
    );

    return this.mapTemplate(template);
  }

  async updateTemplate(
    id: string,
    dto: UpdateCommunicationTemplateDto,
  ): Promise<TemplateListItem> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const nextType = dto.type ?? template.type;
    const nextSubject = dto.subject ?? template.subject ?? null;
    await this.ensureTemplateTypeValid(nextType, nextSubject);

    if (dto.name) {
      const existing = await this.templateRepository.findOne({
        where: { name: dto.name.trim() },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('A template with that name already exists');
      }
      template.name = dto.name.trim();
    }

    if (dto.type) template.type = dto.type;
    if (dto.subject !== undefined) template.subject = dto.subject?.trim() || null;
    if (dto.body !== undefined) template.body = dto.body.trim();
    if (dto.isActive !== undefined) template.isActive = dto.isActive;

    const saved = await this.templateRepository.save(template);
    return this.mapTemplate(saved);
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    await this.templateRepository.remove(template);
  }

  private async ensureTemplateTypeValid(type: string, subject?: string | null) {
    if (!COMMUNICATION_TYPES.includes(type as (typeof COMMUNICATION_TYPES)[number])) {
      throw new BadRequestException('Invalid template type');
    }
    if (type === 'EMAIL' && !subject?.trim()) {
      throw new BadRequestException('Email templates require a subject');
    }
  }

  private async resolveRecipients(
    dto: SendCommunicationDto,
  ): Promise<Recipient[]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.MEMBER });

    if (dto.recipients === 'GROUP') {
      qb.andWhere('user.membershipCategoryId = :groupId', {
        groupId: dto.groupId,
      });
    }

    const users = await qb
      .orderBy('user.createdAt', 'ASC')
      .select([
        'user.id',
        'user.email',
        'user.phoneNumber',
        'user.title',
        'user.firstName',
        'user.middleName',
        'user.lastName',
      ])
      .getMany();

    return users;
  }

  private async sendToRecipient(
    dto: SendCommunicationDto,
    recipient: Recipient,
  ): Promise<{ success: boolean; recipient: string; error?: string }> {
    if (dto.type === 'EMAIL') {
      if (!recipient.email) {
          return {
            success: false,
            recipient: recipient.email ?? this.formatRecipientName(recipient) ?? recipient.id,
            error: 'Recipient does not have an email address',
          };
        }

      try {
        const result = await this.emailService.send({
          to: recipient.email,
          subject: dto.subject!.trim(),
          html: this.renderEmailBody(dto.message),
          text: dto.message,
        });
        return {
          success: result.success,
        recipient: recipient.email,
          error: result.success ? undefined : result.error ?? 'Email delivery failed',
        };
      } catch (error: any) {
        return {
          success: false,
          recipient: recipient.email,
          error: error?.message ?? 'Email delivery failed',
        };
      }
    }

    if (!recipient.phoneNumber) {
      return {
        success: false,
        recipient: recipient.phoneNumber ?? this.formatRecipientName(recipient) ?? recipient.id,
        error: 'Recipient does not have a phone number',
      };
    }

    try {
      const result = await this.smsService.send({
        to: recipient.phoneNumber,
        message: dto.message,
      });
      return {
        success: result.success,
      recipient: recipient.phoneNumber,
        error: result.success ? undefined : result.error ?? 'SMS delivery failed',
      };
    } catch (error: any) {
      return {
        success: false,
        recipient: recipient.phoneNumber,
        error: error?.message ?? 'SMS delivery failed',
      };
    }
  }

  private formatRecipientName(recipient: Recipient): string | null {
    const parts = [
      recipient.title,
      recipient.firstName,
      recipient.middleName,
      recipient.lastName,
    ].filter(Boolean);
    return parts.length ? parts.join(' ') : null;
  }

  private renderEmailBody(message: string): string {
    const safe = message
      .split('\n')
      .map((line) => line.trim() ? line.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '&nbsp;')
      .join('<br />');
    return `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.7; color: #1f2937;">${safe}</div>`;
  }

  private mapMessage(
    message: CommunicationMessageEntity,
    groupName: string | null,
  ): MessageListItem {
    return {
      id: message.id,
      type: message.type,
      target: message.target,
      groupId: message.groupId ?? null,
      groupName,
      subject: message.subject ?? null,
      message: message.message,
      status: message.status,
      recipientCount: message.recipientCount,
      successfulCount: message.successfulCount,
      failedCount: message.failedCount,
      createdAt: message.createdAt,
      sentAt: message.sentAt ?? null,
    };
  }

  private mapTemplate(template: CommunicationTemplateEntity): TemplateListItem {
    return {
      id: template.id,
      name: template.name,
      type: template.type,
      subject: template.subject ?? null,
      body: template.body,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  }
}
