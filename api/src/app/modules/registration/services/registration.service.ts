import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RegistrationEntity,
  ApplicationStageHistoryEntity,
  EducationEntity,
  ProfessionalExperienceEntity,
  DocumentEntity,
  ReferenceEntity,
} from '../entities';
import { UserEntity } from '../../user/entities/user.entity';
import { EmailService } from '../../shared/services/email.service';
import { StorageService } from '../../shared/services/storage.service';
import { EngineeringInstitutionEntity } from '../../admin/entities/engineering-institution.entity';
import { CreateRegistrationDto } from '../dto/create-registration.dto';
import { UpdatePersonalDetailsDto } from '../dto/update-registration.dto';
import {
  RegistrationDetailsDto,
  AddEducationDto,
  AddExperienceDto,
  RefereeDto,
  DeclarationDto,
  VerifyRegistrationEmailDto,
  ExperienceEducationDto,
} from '../dto/registration-steps.dto';
import {
  ApplicationStatus,
  ApplicationReviewStage,
  RegistrationStep,
  ReferenceType,
  DocumentStatus,
} from '../../../common/enums';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    @InjectRepository(RegistrationEntity)
    private registrationRepository: Repository<RegistrationEntity>,
    @InjectRepository(ApplicationStageHistoryEntity)
    private stageHistoryRepository: Repository<ApplicationStageHistoryEntity>,
    @InjectRepository(EducationEntity)
    private educationRepository: Repository<EducationEntity>,
    @InjectRepository(ProfessionalExperienceEntity)
    private experienceRepository: Repository<ProfessionalExperienceEntity>,
    @InjectRepository(DocumentEntity)
    private documentRepository: Repository<DocumentEntity>,
    @InjectRepository(ReferenceEntity)
    private referenceRepository: Repository<ReferenceEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(EngineeringInstitutionEntity)
    private engineeringInstitutionRepository: Repository<EngineeringInstitutionEntity>,
    private emailService: EmailService,
    private storageService: StorageService,
  ) {}

  private getFileNameFromUrl(url: string, fallback: string): string {
    try {
      const pathname = new URL(url).pathname;
      const fileName = pathname.split('/').filter(Boolean).pop();
      return fileName ? decodeURIComponent(fileName) : fallback;
    } catch {
      const fileName = url.split('/').filter(Boolean).pop();
      return fileName ? decodeURIComponent(fileName) : fallback;
    }
  }

  private buildUnifiedDocuments(registration: RegistrationEntity) {
    const documents: any[] = (registration.documents ?? []).map((document) => ({
      id: document.id,
      documentType: document.documentType,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      description: document.description ?? null,
      status: document.status,
      uploadedAt: document.createdAt,
      verifiedAt: document.verifiedAt ?? null,
      source: 'registration_documents',
    }));

    if (registration.supportingDocumentUrl) {
      documents.push({
        id: `${registration.id}:supporting-document`,
        documentType: 'STATUTORY_BOARD',
        fileName: this.getFileNameFromUrl(
          registration.supportingDocumentUrl,
          'Supporting document',
        ),
        fileUrl: registration.supportingDocumentUrl,
        fileSize: 0,
        mimeType: '',
        description: 'Statutory board supporting document',
        status: DocumentStatus.PENDING,
        uploadedAt: registration.updatedAt,
        verifiedAt: null,
        source: 'supportingDocumentUrl',
      });
    }

    if (registration.cvAttachment) {
      documents.push({
        id: `${registration.id}:cv`,
        documentType: 'CV',
        fileName: this.getFileNameFromUrl(registration.cvAttachment, 'CV'),
        fileUrl: registration.cvAttachment,
        fileSize: 0,
        mimeType: '',
        description: 'Curriculum vitae',
        status: DocumentStatus.PENDING,
        uploadedAt: registration.updatedAt,
        verifiedAt: null,
        source: 'cvAttachment',
      });
    }

    for (const education of registration.educations ?? []) {
      if (!education.attachmentUrl) continue;
      documents.push({
        id: `${education.id}:education-attachment`,
        documentType: 'EDUCATION_CERTIFICATE',
        fileName: this.getFileNameFromUrl(
          education.attachmentUrl,
          `${education.qualification || education.institutionName || 'Education'} certificate`,
        ),
        fileUrl: education.attachmentUrl,
        fileSize: 0,
        mimeType: '',
        description: education.institutionName
          ? `Education certificate - ${education.institutionName}`
          : 'Education certificate',
        status: DocumentStatus.PENDING,
        uploadedAt: education.updatedAt,
        verifiedAt: null,
        source: 'education.attachmentUrl',
      });
    }

    return documents;
  }

  private toApplicationResponse(registration: RegistrationEntity) {
    const documents = this.buildUnifiedDocuments(registration);

    return {
      ...registration,
      personalDetails: {
        title: registration.user?.title,
        firstName: registration.user?.firstName,
        middleName: registration.user?.middleName,
        lastName: registration.user?.lastName,
        gender: registration.user?.gender,
        dateOfBirth: registration.user?.dateOfBirth,
        nationality: registration.user?.nationality,
        phoneNumber: registration.user?.phoneNumber,
        email: registration.user?.email,
        employer: registration.user?.employer,
        position: registration.user?.position,
        profilePhotoUrl: registration.user?.profilePhotoUrl,
      },
      registrationDetails: {
        engineeringDiscipline: registration.engineeringDiscipline,
        applicationType: registration.applicationType,
        existingMembershipNumber: registration.existingMembershipNumber,
        registrationCategory: registration.registrationCategory,
        appliedMembershipClass: registration.appliedMembershipClass,
        registeredWithStatutoryBoards:
          registration.registeredWithStatutoryBoards,
        memberOfOtherInstitutions: registration.memberOfOtherInstitutions,
        supportingDocument: registration.supportingDocumentUrl ?? null,
        supportingDocumentUrl: registration.supportingDocumentUrl ?? null,
        institutions: registration.otherInstitutions ?? [],
      },
      supportingDocumentUrl: registration.supportingDocumentUrl ?? null,
      cvAttachment: registration.cvAttachment ?? null,
      educations: (registration.educations ?? []).map((education) => ({
        ...education,
        attachment: education.attachmentUrl ?? null,
        institution: education.institution ?? null,
      })),
      documents,
    };
  }

  /**
   * Create a new registration application (Step 1: Personal Details)
   */
  async createRegistration(dto: CreateRegistrationDto, userId: string): Promise<{
    applicationId: string;
    userId: string;
    currentStep: RegistrationStep;
    completedSteps: RegistrationStep[];
    nextStep: RegistrationStep;
  }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check user doesn't already have an active registration
    const existing = await this.registrationRepository.findOneBy({ userId });
    if (existing) {
      throw new BadRequestException('Registration application already exists');
    }

    try {
      // Update user profile with the provided details
      await this.userRepository.update(userId, {
        title: dto.title,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        gender: dto.gender,
        phoneNumber: dto.phoneNumber,
        dateOfBirth: new Date(dto.dateOfBirth),
        nationality: dto.nationality,
        employer: dto.employer,
        position: dto.position,
        ...(dto.profilePhotoUrl && { profilePhotoUrl: dto.profilePhotoUrl }),
      });

      // Create registration
      const registration = new RegistrationEntity();
      registration.userId = userId;
      registration.status = ApplicationStatus.DRAFT;
      registration.currentStep = RegistrationStep.PERSONAL_DETAILS;
      registration.completedSteps = [RegistrationStep.PERSONAL_DETAILS];
      registration.createdBy = userId;

      const savedRegistration = await this.registrationRepository.save(registration);

      this.logger.log(`Registration created for user ${user.email}`);

      return {
        applicationId: savedRegistration.id,
        userId,
        currentStep: RegistrationStep.PERSONAL_DETAILS,
        completedSteps: [RegistrationStep.PERSONAL_DETAILS],
        nextStep: RegistrationStep.REGISTRATION_DETAILS,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to create registration: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create registration: ${error.message}`,
      );
    }
  }

  /**
   * Update personal details (Step 1)
   */
  async updatePersonalDetails(
    applicationId: string,
    userId: string,
    dto: UpdatePersonalDetailsDto,
  ): Promise<{
    applicationId: string;
    userId: string;
    currentStep: RegistrationStep;
    completedSteps: RegistrationStep[];
    nextStep: RegistrationStep;
  }> {
    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );

    this.validateCanUpdate(registration);

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.userRepository.update(userId, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
      ...(dto.middleName !== undefined ? { middleName: dto.middleName } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
      ...(dto.phoneNumber !== undefined ? { phoneNumber: dto.phoneNumber } : {}),
      ...(dto.dateOfBirth !== undefined
        ? { dateOfBirth: new Date(dto.dateOfBirth) }
        : {}),
      ...(dto.nationality !== undefined ? { nationality: dto.nationality } : {}),
      ...(dto.employer !== undefined ? { employer: dto.employer } : {}),
      ...(dto.position !== undefined ? { position: dto.position } : {}),
    });

    if (!registration.completedSteps.includes(RegistrationStep.PERSONAL_DETAILS)) {
      registration.completedSteps.push(RegistrationStep.PERSONAL_DETAILS);
    }
    registration.currentStep = RegistrationStep.PERSONAL_DETAILS;
    await this.registrationRepository.save(registration);

    return {
      applicationId: registration.id,
      userId,
      currentStep: RegistrationStep.PERSONAL_DETAILS,
      completedSteps: registration.completedSteps,
      nextStep: RegistrationStep.REGISTRATION_DETAILS,
    };
  }

  /**
   * Update registration details (Step 2)
   */
  async updateRegistrationDetails(
    applicationId: string,
    userId: string,
    dto: RegistrationDetailsDto,
  ): Promise<{
    applicationId: string;
    currentStep: RegistrationStep;
    completedSteps: RegistrationStep[];
    nextStep: RegistrationStep;
  }> {
    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );

    // Validate application status
    if (
      registration.status !== ApplicationStatus.DRAFT &&
      registration.status !== ApplicationStatus.CHANGES_REQUESTED
    ) {
      throw new BadRequestException(
        'Cannot update registration after submission',
      );
    }

    // Update registration
    registration.engineeringDiscipline = dto.engineeringDiscipline;
    registration.appliedMembershipClass = dto.appliedMembershipType as any;
    registration.registeredWithStatutoryBoards = dto.registeredWithStatutoryBoard;
    registration.memberOfOtherInstitutions = dto.memberOfOtherInstitutions;
    registration.otherInstitutions = dto.institutions || [];
    if (dto.supportingDocument) {
      registration.supportingDocumentUrl = dto.supportingDocument;
    }
    registration.currentStep = RegistrationStep.REGISTRATION_DETAILS;

    // Add to completed steps if not already there
    if (
      !registration.completedSteps.includes(
        RegistrationStep.REGISTRATION_DETAILS,
      )
    ) {
      registration.completedSteps.push(RegistrationStep.REGISTRATION_DETAILS);
    }

    await this.registrationRepository.save(registration);

    return {
      applicationId: registration.id,
      currentStep: RegistrationStep.REGISTRATION_DETAILS,
      completedSteps: registration.completedSteps,
      nextStep: RegistrationStep.EDUCATION_EXPERIENCE,
    };
  }

  /**
   * Save education & experience in one step (Step 3 combined)
   */
  async saveExperienceEducation(
    applicationId: string,
    userId: string,
    dto: ExperienceEducationDto,
  ): Promise<{ applicationId: string; currentStep: RegistrationStep; completedSteps: RegistrationStep[]; nextStep: RegistrationStep }> {
    const registration = await this.getRegistrationForUser(applicationId, userId);
    this.validateCanUpdate(registration);

    // Clear existing education and experience for this registration
    await this.educationRepository.delete({ registrationId: registration.id });
    await this.experienceRepository.delete({ registrationId: registration.id });

    // Save education entries
    for (let i = 0; i < dto.education.length; i++) {
      const ed = dto.education[i];
      let selectedInstitution: EngineeringInstitutionEntity | null = null;
      if (ed.institutionId) {
        selectedInstitution = await this.engineeringInstitutionRepository.findOne({
          where: { id: ed.institutionId, isActive: true },
        });
        if (!selectedInstitution) {
          throw new BadRequestException('Selected institution is not available');
        }
      }
      const education = new EducationEntity();
      education.registrationId = registration.id;
      education.institutionId = selectedInstitution?.id ?? null;
      education.institutionName = selectedInstitution?.name ?? ed.institutionName;
      education.qualification = ed.courseName;
      education.location = selectedInstitution?.country ?? ed.country;
      education.startDate = new Date(ed.startDate);
      education.endDate = new Date(ed.endDate);
      education.sortOrder = i;
      if (ed.attachment) education.attachmentUrl = ed.attachment;
      await this.educationRepository.save(education);
    }

    // Save work experience entries
    for (let i = 0; i < dto.workExperience.length; i++) {
      const exp = dto.workExperience[i];
      const experience = new ProfessionalExperienceEntity();
      experience.registrationId = registration.id;
      experience.employerName = exp.employer;
      experience.position = exp.position;
      experience.startDate = new Date(exp.startDate);
      experience.endDate = new Date(exp.endDate);
      experience.sortOrder = i;
      await this.experienceRepository.save(experience);
    }

    // Store CV attachment on registration if provided
    if (dto.cvAttachment) {
      registration.cvAttachment = dto.cvAttachment;
    }

    await this.updateStepProgress(registration, RegistrationStep.EDUCATION_EXPERIENCE);

    this.logger.log(`Education & experience saved for registration ${registration.id} — ${dto.education.length} education, ${dto.workExperience.length} experience entries`);

    return {
      applicationId: registration.id,
      currentStep: RegistrationStep.EDUCATION_EXPERIENCE,
      completedSteps: registration.completedSteps,
      nextStep: RegistrationStep.REFERENCES,
    };
  }

  /**
   * Add education entry (Step 3)
   */
  async addEducation(
    applicationId: string,
    userId: string,
    dto: AddEducationDto,
  ): Promise<EducationEntity> {
    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );
    this.validateCanUpdate(registration);

    const education = new EducationEntity();
    education.registrationId = registration.id;
    education.institutionName = dto.institutionName;
    education.qualification = dto.qualification;
    education.fieldOfStudy = dto.fieldOfStudy;
    education.startDate = new Date(dto.startDate);
    education.endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    education.grade = dto.grade;
    education.location = dto.location;

    // Get sort order
    const count = await this.educationRepository.count({
      where: { registrationId: registration.id },
    });
    education.sortOrder = count;

    const savedEducation = await this.educationRepository.save(education);

    // Update registration step
    await this.updateStepProgress(
      registration,
      RegistrationStep.EDUCATION_EXPERIENCE,
    );

    return savedEducation;
  }

  /**
   * Update education entry
   */
  async updateEducation(
    applicationId: string,
    userId: string,
    educationId: string,
    dto: AddEducationDto,
  ): Promise<EducationEntity> {
    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );
    this.validateCanUpdate(registration);

    const education = await this.educationRepository.findOne({
      where: { id: educationId, registrationId: registration.id },
    });

    if (!education) {
      throw new NotFoundException('Education record not found');
    }

    Object.assign(education, {
      institutionName: dto.institutionName,
      qualification: dto.qualification,
      fieldOfStudy: dto.fieldOfStudy,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      grade: dto.grade,
      location: dto.location,
    });

    return this.educationRepository.save(education);
  }

  /**
   * Delete education entry
   */
  async deleteEducation(
    applicationId: string,
    userId: string,
    educationId: string,
  ): Promise<void> {
    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );
    this.validateCanUpdate(registration);

    const result = await this.educationRepository.delete({
      id: educationId,
      registrationId: registration.id,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Education record not found');
    }
  }

  /**
   * Add professional experience entry (Step 3)
   */
  async addExperience(
    applicationId: string,
    userId: string,
    dto: AddExperienceDto,
  ): Promise<ProfessionalExperienceEntity> {
    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );
    this.validateCanUpdate(registration);

    const experience = new ProfessionalExperienceEntity();
    experience.registrationId = registration.id;
    experience.employerName = dto.employerName;
    experience.position = dto.position;
    experience.startDate = new Date(dto.startDate);
    experience.endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    experience.isCurrent = dto.isCurrent || false;
    experience.responsibilities = dto.responsibilities;
    experience.location = dto.location;
    experience.department = dto.department;

    // Get sort order
    const count = await this.experienceRepository.count({
      where: { registrationId: registration.id },
    });
    experience.sortOrder = count;

    const savedExperience = await this.experienceRepository.save(experience);

    // Update registration step
    await this.updateStepProgress(
      registration,
      RegistrationStep.EDUCATION_EXPERIENCE,
    );

    return savedExperience;
  }

  /**
   * Update experience entry
   */
  async updateExperience(
    applicationId: string,
    userId: string,
    experienceId: string,
    dto: AddExperienceDto,
  ): Promise<ProfessionalExperienceEntity> {
    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );
    this.validateCanUpdate(registration);

    const experience = await this.experienceRepository.findOne({
      where: { id: experienceId, registrationId: registration.id },
    });

    if (!experience) {
      throw new NotFoundException('Experience record not found');
    }

    Object.assign(experience, {
      employerName: dto.employerName,
      position: dto.position,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isCurrent: dto.isCurrent || false,
      responsibilities: dto.responsibilities,
      location: dto.location,
      department: dto.department,
    });

    return this.experienceRepository.save(experience);
  }

  /**
   * Delete experience entry
   */
  async deleteExperience(
    applicationId: string,
    userId: string,
    experienceId: string,
  ): Promise<void> {
    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );
    this.validateCanUpdate(registration);

    const result = await this.experienceRepository.delete({
      id: experienceId,
      registrationId: registration.id,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Experience record not found');
    }
  }

  /**
   * Add both references at once (Step 4)
   */
  async addReferences(
    applicationId: string,
    userId: string,
    proposer: RefereeDto,
    supporter: RefereeDto,
  ): Promise<{ proposer: ReferenceEntity; supporter: ReferenceEntity }> {
    const registration = await this.getRegistrationForUser(applicationId, userId);
    this.validateCanUpdate(registration);

    // Delete existing references
    await this.referenceRepository.delete({ registrationId: registration.id });

    // Create proposer
    const proposerRef = new ReferenceEntity();
    proposerRef.registrationId = registration.id;
    proposerRef.referenceType = ReferenceType.PROPOSER;
    proposerRef.fullName = proposer.fullName;
    proposerRef.membershipCategory = proposer.membershipCategory as any;
    proposerRef.membershipNumber = proposer.membershipNumber;
    proposerRef.organisation = proposer.organisation;
    proposerRef.email = proposer.email;
    proposerRef.phoneNumber = proposer.phoneNumber;
    proposerRef.relationship = proposer.relationship;

    // Create supporter
    const supporterRef = new ReferenceEntity();
    supporterRef.registrationId = registration.id;
    supporterRef.referenceType = ReferenceType.SUPPORTER;
    supporterRef.fullName = supporter.fullName;
    supporterRef.membershipCategory = supporter.membershipCategory as any;
    supporterRef.membershipNumber = supporter.membershipNumber;
    supporterRef.organisation = supporter.organisation;
    supporterRef.email = supporter.email;
    supporterRef.phoneNumber = supporter.phoneNumber;
    supporterRef.relationship = supporter.relationship;

    const savedProposer = await this.referenceRepository.save(proposerRef);
    const savedSupporter = await this.referenceRepository.save(supporterRef);

    await this.updateStepProgress(registration, RegistrationStep.REFERENCES);

    this.logger.log(`References saved for registration ${registration.id}`);

    return { proposer: savedProposer, supporter: savedSupporter };
  }

  /**
   * Verify email for registration (Step 5)
   */
  async verifyRegistrationEmail(
    applicationId: string,
    userId: string,
    dto: VerifyRegistrationEmailDto,
  ): Promise<{
    emailVerified: boolean;
    completedSteps: RegistrationStep[];
    nextStep: RegistrationStep;
  }> {
    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );
    this.validateCanUpdate(registration);

    // Verify through user service
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      // Already verified
      registration.emailVerified = true;
      if (
        !registration.completedSteps.includes(
          RegistrationStep.EMAIL_VERIFICATION,
        )
      ) {
        registration.completedSteps.push(RegistrationStep.EMAIL_VERIFICATION);
      }
      registration.currentStep = RegistrationStep.EMAIL_VERIFICATION;
      await this.registrationRepository.save(registration);

      return {
        emailVerified: true,
        completedSteps: registration.completedSteps,
        nextStep: RegistrationStep.PAYMENT,
      };
    }

    // Validate verification code
    if (user.emailVerificationCode !== dto.verificationCode) {
      throw new BadRequestException('Invalid verification code');
    }

    if (
      user.emailVerificationExpiry &&
      new Date() > user.emailVerificationExpiry
    ) {
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    // Update user
    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpiry = null;
    await this.userRepository.save(user);

    // Update registration
    registration.emailVerified = true;
    if (
      !registration.completedSteps.includes(RegistrationStep.EMAIL_VERIFICATION)
    ) {
      registration.completedSteps.push(RegistrationStep.EMAIL_VERIFICATION);
    }
    registration.currentStep = RegistrationStep.EMAIL_VERIFICATION;
    await this.registrationRepository.save(registration);

    return {
      emailVerified: true,
      completedSteps: registration.completedSteps,
      nextStep: RegistrationStep.PAYMENT,
    };
  }

  /**
   * Submit declaration and application (Step 7)
   */
  async submitDeclaration(
    applicationId: string,
    userId: string,
    dto: DeclarationDto,
  ): Promise<{
    applicationId: string;
    status: ApplicationStatus;
    submittedAt: Date;
    referenceNumber: string;
  }> {
    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );

    // Validate all steps are completed
    const requiredSteps = [
      RegistrationStep.PERSONAL_DETAILS,
      RegistrationStep.REGISTRATION_DETAILS,
      RegistrationStep.EDUCATION_EXPERIENCE,
      RegistrationStep.REFERENCES,
    ];

    const missingSteps = requiredSteps.filter(
      (step) => !registration.completedSteps.includes(step),
    );
    if (missingSteps.length > 0) {
      throw new BadRequestException(
        `Please complete the following steps before submitting: ${missingSteps.join(', ')}`,
      );
    }

    if (!dto.declarationAgreed) {
      throw new BadRequestException(
        'You must agree to the declaration to submit your application',
      );
    }

    if (!registration.paymentCompleted) {
      throw new BadRequestException(
        'Please complete the application fee payment before submitting your application',
      );
    }

    const wasChangesRequested =
      registration.status === ApplicationStatus.CHANGES_REQUESTED;
    const previousStage = registration.reviewStage;

    // Generate reference number once and preserve it on resubmission
    const referenceNumber =
      registration.referenceNumber ?? (await this.generateReferenceNumber());

    // Update registration
    registration.declarationAgreed = dto.declarationAgreed;
    registration.declarationDate = new Date(dto.declarationDate);
    registration.status = ApplicationStatus.IN_REVIEW;
    registration.reviewStage = ApplicationReviewStage.SECRETARIAT_REVIEW;
    registration.assignedEvaluatorId = null;
    registration.assignedAt = null;
    registration.submittedAt = new Date();
    registration.stageUpdatedAt = registration.submittedAt;
    registration.referenceNumber = referenceNumber;
    registration.currentStep = RegistrationStep.DECLARATION;
    registration.updatedBy = userId;

    if (!registration.completedSteps.includes(RegistrationStep.DECLARATION)) {
      registration.completedSteps.push(RegistrationStep.DECLARATION);
    }

    await this.registrationRepository.save(registration);
    await this.recordStageHistory(registration, {
      fromStage: wasChangesRequested ? previousStage : undefined,
      toStage: ApplicationReviewStage.SECRETARIAT_REVIEW,
      action: wasChangesRequested ? 'RESUBMITTED' : 'SUBMITTED',
      actedByUserId: userId,
    });

    // Send submission confirmation email (fire-and-forget)
    const submittedUser = await this.userRepository.findOneBy({ id: userId });
    if (submittedUser) {
      this.emailService
        .sendApplicationSubmittedEmail(
          submittedUser.email,
          submittedUser.firstName,
          referenceNumber,
        )
        .catch((err) =>
          this.logger.error(`Failed to send submission email: ${err.message}`),
        );
    }

    this.logger.log(
      `Application ${referenceNumber} submitted by user ${userId}`,
    );

    return {
      applicationId: registration.id,
      status: ApplicationStatus.IN_REVIEW,
      submittedAt: registration.submittedAt,
      referenceNumber,
    };
  }

  /**
   * Get registration by ID for user
   */
  async getRegistration(
    applicationId: string,
    userId: string,
  ): Promise<any> {
    const registration = await this.registrationRepository.findOne({
      where: { id: applicationId, userId },
      relations: [
        'user',
        'educations',
        'educations.institution',
        'experiences',
        'documents',
        'references',
        'stageHistory',
      ],
      order: {
        stageHistory: {
          createdAt: 'ASC',
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return this.toApplicationResponse(registration);
  }

  /**
   * Get all registrations for a user
   */
  async getUserRegistrations(userId: string): Promise<any[]> {
    const registrations = await this.registrationRepository.find({
      where: { userId },
      relations: ['user', 'educations', 'educations.institution', 'experiences', 'documents', 'references', 'stageHistory'],
      order: { createdAt: 'DESC' },
    });

    return registrations.map((registration) =>
      this.toApplicationResponse(registration),
    );
  }

  async getActiveEngineeringInstitutions(search?: string): Promise<EngineeringInstitutionEntity[]> {
    const queryBuilder = this.engineeringInstitutionRepository
      .createQueryBuilder('institution')
      .where('institution.isActive = true')
      .orderBy('institution.name', 'ASC')
      .take(100);

    if (search?.trim()) {
      queryBuilder.andWhere(
        '(institution.name ILIKE :search OR institution.country ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    return queryBuilder.getMany();
  }

  /**
   * Resend email verification code (Step 5)
   */
  async resendVerificationCode(
    applicationId: string,
    userId: string,
  ): Promise<{ sent: boolean }> {
    await this.getRegistrationForUser(applicationId, userId);

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified)
      throw new BadRequestException('Email already verified');

    const code =
      'IET-' + Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = code;
    user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.userRepository.save(user);

    this.emailService
      .sendVerificationEmail(user.email, user.firstName, code)
      .catch((err) =>
        this.logger.error(
          `Failed to resend verification email: ${err.message}`,
        ),
      );

    return { sent: true };
  }

  // ============================================
  // DOCUMENT UPLOAD / DELETE
  // ============================================

  /**
   * Upload a document for registration (Step 3b)
   */
  async uploadDocument(
    applicationId: string,
    userId: string,
    file: Express.Multer.File,
    documentType: string,
    description?: string,
  ): Promise<DocumentEntity> {
    if (!file) throw new BadRequestException('No file provided');

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX',
      );
    }

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );
    this.validateCanUpdate(registration);

    const uploaded = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      `registrations/${applicationId}/documents`,
    );

    const document = new DocumentEntity();
    document.registrationId = registration.id;
    document.documentType = documentType as any;
    document.fileName = file.originalname;
    document.fileUrl = uploaded.url;
    document.fileSize = file.size;
    document.mimeType = file.mimetype;
    document.description = description;
    document.status = DocumentStatus.PENDING;

    return this.documentRepository.save(document);
  }

  /**
   * Delete a registration document
   */
  async deleteDocument(
    applicationId: string,
    userId: string,
    documentId: string,
  ): Promise<void> {
    const registration = await this.getRegistrationForUser(
      applicationId,
      userId,
    );
    this.validateCanUpdate(registration);

    const document = await this.documentRepository.findOne({
      where: { id: documentId, registrationId: registration.id },
    });
    if (!document) throw new NotFoundException('Document not found');

    // Delete from S3
    const key = this.storageService.extractKeyFromUrl(document.fileUrl);
    if (key) await this.storageService.deleteFile(key);

    await this.documentRepository.delete(documentId);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async getRegistrationForUser(
    applicationId: string,
    userId: string,
  ): Promise<RegistrationEntity> {
    const registration = await this.registrationRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }

  private validateCanUpdate(registration: RegistrationEntity): void {
    if (
      registration.status !== ApplicationStatus.DRAFT &&
      registration.status !== ApplicationStatus.CHANGES_REQUESTED
    ) {
      throw new ForbiddenException(
        'Cannot update registration after submission',
      );
    }
  }

  private async updateStepProgress(
    registration: RegistrationEntity,
    step: RegistrationStep,
  ): Promise<void> {
    if (!registration.completedSteps.includes(step)) {
      registration.completedSteps.push(step);
    }
    registration.currentStep = step;
    await this.registrationRepository.save(registration);
  }

  private async generateReferenceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await this.registrationRepository
      .createQueryBuilder('reg')
      .select(
        'MAX(CAST(SUBSTRING(reg.referenceNumber, 14) AS INTEGER))',
        'maxNum',
      )
      .where('reg.referenceNumber LIKE :pattern', {
        pattern: `IET/APP/${year}/%`,
      })
      .getRawOne();

    const nextNumber = (result?.maxNum || 0) + 1;
    return `IET/APP/${year}/${nextNumber.toString().padStart(4, '0')}`;
  }

  private async recordStageHistory(
    registration: RegistrationEntity,
    params: {
      fromStage?: ApplicationReviewStage;
      toStage: ApplicationReviewStage;
      action: ApplicationStageHistoryEntity['action'];
      actedByUserId: string;
      comments?: string;
      assignedEvaluatorId?: string | null;
    },
  ): Promise<void> {
    const history = new ApplicationStageHistoryEntity();
    history.registrationId = registration.id;
    history.fromStage = params.fromStage;
    history.toStage = params.toStage;
    history.action = params.action;
    history.comments = params.comments;
    history.assignedEvaluatorId = params.assignedEvaluatorId ?? undefined;
    history.createdBy = params.actedByUserId;
    history.updatedBy = params.actedByUserId;
    await this.stageHistoryRepository.save(history);
  }
}
