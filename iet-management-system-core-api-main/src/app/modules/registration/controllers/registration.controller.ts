import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { RegistrationService } from '../services/registration.service';
import { CreateRegistrationDto } from '../dto/create-registration.dto';
import {
  RegistrationDetailsDto,
  AddEducationDto,
  AddExperienceDto,
  ReferencesDto,
  DeclarationDto,
  VerifyRegistrationEmailDto,
  ExperienceEducationDto,
} from '../dto/registration-steps.dto';
import { UpdatePersonalDetailsDto } from '../dto/update-registration.dto';
import { PaymentsService } from '../../payments/services/payments.service';
import { InitiateApplicationPaymentDto } from '../../payments/dto';

@ApiTags('Registrations')
@Controller('registrations')
export class RegistrationController {
  constructor(
    private registrationService: RegistrationService,
    private paymentsService: PaymentsService,
  ) {}

  // ============================================
  // STEP 1: CREATE REGISTRATION (Personal Details)
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new registration application (Step 1: Personal Details)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration created successfully',
    schema: {
      example: {
        success: true,
        data: {
          applicationId: '550e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440001',
          currentStep: 'PERSONAL_DETAILS',
          completedSteps: ['PERSONAL_DETAILS'],
          nextStep: 'REGISTRATION_DETAILS',
        },
        message: 'Personal details saved successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  async createRegistration(
    @GetUser() user: UserEntity,
    @Body() dto: CreateRegistrationDto,
  ) {
    const result = await this.registrationService.createRegistration(dto, user.id);
    return {
      success: true,
      data: result,
      message: 'Personal details saved successfully',
    };
  }

  @Patch(':applicationId/steps/personal-details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update personal details (Step 1)' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Personal details saved successfully',
    schema: {
      example: {
        success: true,
        data: {
          applicationId: '550e8400-e29b-41d4-a716-446655440000',
          userId: '550e8400-e29b-41d4-a716-446655440001',
          currentStep: 'PERSONAL_DETAILS',
          completedSteps: ['PERSONAL_DETAILS'],
          nextStep: 'REGISTRATION_DETAILS',
        },
        message: 'Personal details saved successfully',
      },
    },
  })
  async updatePersonalDetails(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: UpdatePersonalDetailsDto,
  ) {
    const result = await this.registrationService.updatePersonalDetails(
      applicationId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Personal details saved successfully',
    };
  }

  // ============================================
  // STEP 2: REGISTRATION DETAILS
  // ============================================

  @Patch(':applicationId/steps/registration-details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update registration details (Step 2)' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration details saved successfully',
    schema: {
      example: {
        success: true,
        data: {
          applicationId: '550e8400-e29b-41d4-a716-446655440000',
          currentStep: 'REGISTRATION_DETAILS',
          completedSteps: ['PERSONAL_DETAILS', 'REGISTRATION_DETAILS'],
          nextStep: 'EDUCATION_EXPERIENCE',
        },
      },
    },
  })
  async updateRegistrationDetails(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: RegistrationDetailsDto,
  ) {
    const result = await this.registrationService.updateRegistrationDetails(
      applicationId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // STEP 3: EDUCATION & PROFESSIONAL EXPERIENCE (combined)
  // ============================================

  @Patch(':applicationId/steps/experience-education')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save education & work experience (Step 3)' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Education and experience saved successfully',
    schema: {
      example: {
        success: true,
        data: {
          applicationId: '550e8400-e29b-41d4-a716-446655440000',
          currentStep: 'EDUCATION_EXPERIENCE',
          completedSteps: ['PERSONAL_DETAILS', 'REGISTRATION_DETAILS', 'EDUCATION_EXPERIENCE'],
          nextStep: 'REFERENCES',
        },
        message: 'Education and experience saved successfully',
      },
    },
  })
  async saveExperienceEducation(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: ExperienceEducationDto,
  ) {
    const result = await this.registrationService.saveExperienceEducation(
      applicationId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Education and experience saved successfully',
    };
  }

  @Post(':applicationId/education')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add education entry (Step 3)' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Education added successfully',
  })
  async addEducation(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: AddEducationDto,
  ) {
    const result = await this.registrationService.addEducation(
      applicationId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Education added successfully',
    };
  }

  @Patch(':applicationId/education/:educationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update education entry' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'educationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Education updated successfully',
  })
  async updateEducation(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('educationId', ParseUUIDPipe) educationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: AddEducationDto,
  ) {
    const result = await this.registrationService.updateEducation(
      applicationId,
      user.id,
      educationId,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Education updated successfully',
    };
  }

  @Delete(':applicationId/education/:educationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete education entry' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'educationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Education deleted successfully',
  })
  async deleteEducation(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('educationId', ParseUUIDPipe) educationId: string,
    @GetUser() user: UserEntity,
  ) {
    await this.registrationService.deleteEducation(
      applicationId,
      user.id,
      educationId,
    );
    return {
      success: true,
      message: 'Education deleted successfully',
    };
  }

  @Post(':applicationId/experience')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add professional experience entry (Step 3)' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Experience added successfully',
  })
  async addExperience(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: AddExperienceDto,
  ) {
    const result = await this.registrationService.addExperience(
      applicationId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Experience added successfully',
    };
  }

  @Patch(':applicationId/experience/:experienceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update professional experience entry' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'experienceId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Experience updated successfully',
  })
  async updateExperience(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('experienceId', ParseUUIDPipe) experienceId: string,
    @GetUser() user: UserEntity,
    @Body() dto: AddExperienceDto,
  ) {
    const result = await this.registrationService.updateExperience(
      applicationId,
      user.id,
      experienceId,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Experience updated successfully',
    };
  }

  @Delete(':applicationId/experience/:experienceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete professional experience entry' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'experienceId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Experience deleted successfully',
  })
  async deleteExperience(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('experienceId', ParseUUIDPipe) experienceId: string,
    @GetUser() user: UserEntity,
  ) {
    await this.registrationService.deleteExperience(
      applicationId,
      user.id,
      experienceId,
    );
    return {
      success: true,
      message: 'Experience deleted successfully',
    };
  }

  // ============================================
  // STEP 4: REFERENCES
  // ============================================

  @Post(':applicationId/references')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add references (Step 4)' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'References added successfully',
    schema: {
      example: {
        success: true,
        data: {
          proposer: {
            id: '...',
            fullName: 'Eng. Emmanuel Ole Kambainei',
            membershipNumber: 'IET/ENG/0123',
          },
          supporter: {
            id: '...',
            fullName: 'Eng. John Doe',
            membershipNumber: 'IET/ENG/0456',
          },
        },
      },
    },
  })
  async addReferences(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: ReferencesDto,
  ) {
    const result = await this.registrationService.addReferences(
      applicationId,
      user.id,
      dto.proposer,
      dto.supporter,
    );
    return {
      success: true,
      data: result,
      message: 'References added successfully',
    };
  }

  // ============================================
  // STEP 3b: DOCUMENT UPLOAD
  // ============================================

  @Post(':applicationId/documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a document for the registration application',
  })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: {
          type: 'string',
          enum: [
            'CV',
            'DEGREE_CERTIFICATE',
            'TRANSCRIPT',
            'PROFESSIONAL_CERTIFICATE',
            'ID_DOCUMENT',
            'PASSPORT_PHOTO',
            'OTHER',
          ],
          description: 'Type of document',
        },
        description: { type: 'string', description: 'Optional description' },
      },
      required: ['file', 'documentType'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document uploaded successfully',
  })
  async uploadDocument(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Body('description') description?: string,
  ) {
    const result = await this.registrationService.uploadDocument(
      applicationId,
      user.id,
      file,
      documentType,
      description,
    );
    return {
      success: true,
      data: result,
      message: 'Document uploaded successfully',
    };
  }

  @Delete(':applicationId/documents/:documentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a registration document' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'documentId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document deleted successfully',
  })
  async deleteDocument(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @GetUser() user: UserEntity,
  ) {
    await this.registrationService.deleteDocument(
      applicationId,
      user.id,
      documentId,
    );
    return { success: true, message: 'Document deleted successfully' };
  }

  // ============================================
  // STEP 5: EMAIL VERIFICATION
  // ============================================

  @Post(':applicationId/verify-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email for registration (Step 5)' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
    schema: {
      example: {
        success: true,
        data: {
          emailVerified: true,
          completedSteps: [
            'PERSONAL_DETAILS',
            'REGISTRATION_DETAILS',
            'EDUCATION_EXPERIENCE',
            'REFERENCES',
            'EMAIL_VERIFICATION',
          ],
          nextStep: 'PAYMENT',
        },
      },
    },
  })
  async verifyEmail(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: VerifyRegistrationEmailDto,
  ) {
    const result = await this.registrationService.verifyRegistrationEmail(
      applicationId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Email verified successfully',
    };
  }

  @Post(':applicationId/resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification code (Step 5)' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification code resent successfully',
    schema: {
      example: {
        success: true,
        data: { sent: true },
        message: 'Verification code resent successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email already verified',
  })
  async resendVerificationCode(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
  ) {
    const result = await this.registrationService.resendVerificationCode(
      applicationId,
      user.id,
    );
    return {
      success: true,
      data: result,
      message: 'Verification code resent successfully',
    };
  }

  // ============================================
  // STEP 6: PAYMENT
  // ============================================

  @Post(':applicationId/payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate application fee payment' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  async initiateApplicationPayment(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: InitiateApplicationPaymentDto,
  ) {
    const result = await this.paymentsService.initiateApplicationPayment(
      user.id,
      applicationId,
      dto,
    );

    return {
      success: true,
      data: result,
      message: 'Application payment initiated successfully',
    };
  }

  @Get(':applicationId/payment-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get application payment status' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  async getApplicationPaymentStatus(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
  ) {
    const result = await this.paymentsService.getApplicationPaymentStatus(
      user.id,
      applicationId,
    );

    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // STEP 7: DECLARATION & SUBMISSION
  // ============================================

  @Post(':applicationId/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit declaration and application (Step 7)' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application submitted successfully',
    schema: {
      example: {
        success: true,
        data: {
          applicationId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'IN_REVIEW',
          submittedAt: '2025-01-27T10:00:00Z',
          referenceNumber: 'IET/APP/2025/0001',
        },
        message: 'Application submitted successfully',
      },
    },
  })
  async submitApplication(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: DeclarationDto,
  ) {
    const result = await this.registrationService.submitDeclaration(
      applicationId,
      user.id,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Application submitted successfully',
    };
  }

  // ============================================
  // GET REGISTRATION STATUS
  // ============================================

  @Get(':applicationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get registration application details' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration details retrieved successfully',
  })
  async getRegistration(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() user: UserEntity,
  ) {
    const result = await this.registrationService.getRegistration(
      applicationId,
      user.id,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all registrations for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User registrations retrieved successfully',
  })
  async getUserRegistrations(@GetUser() user: UserEntity) {
    const result = await this.registrationService.getUserRegistrations(user.id);
    return {
      success: true,
      data: result,
    };
  }
}
