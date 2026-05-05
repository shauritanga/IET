import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { CommunicationService } from '../services/communication.service';
import {
  CommunicationHistoryQueryDto,
  CommunicationTemplateQueryDto,
  CreateCommunicationTemplateDto,
  SendCommunicationDto,
  UpdateCommunicationTemplateDto,
} from '../dto';

@ApiTags('Communication')
@Controller('communication')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class CommunicationController {
  constructor(private communicationService: CommunicationService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a bulk message to members' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk message sent',
  })
  async sendMessage(@GetUser() admin: UserEntity, @Body() dto: SendCommunicationDto) {
    const result = await this.communicationService.sendMessage(admin.id, dto);
    return {
      success: true,
      data: result.message,
      meta: result.deliverySummary,
      message:
        result.message.status === 'FAILED'
          ? 'Message completed with failures'
          : 'Message sent successfully',
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'List sent communication messages' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'target', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listHistory(@Query() query: CommunicationHistoryQueryDto) {
    const result = await this.communicationService.listHistory(query);
    return {
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        limit: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      },
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'List communication templates' })
  async listTemplates(@Query() query: CommunicationTemplateQueryDto) {
    const result = await this.communicationService.listTemplates(query);
    return {
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        limit: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      },
    };
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a communication template' })
  async createTemplate(@Body() dto: CreateCommunicationTemplateDto) {
    return {
      success: true,
      data: await this.communicationService.createTemplate(dto),
      message: 'Template created successfully',
    };
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update a communication template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommunicationTemplateDto,
  ) {
    return {
      success: true,
      data: await this.communicationService.updateTemplate(id, dto),
      message: 'Template updated successfully',
    };
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a communication template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async deleteTemplate(@Param('id', ParseUUIDPipe) id: string) {
    await this.communicationService.deleteTemplate(id);
    return {
      success: true,
      message: 'Template deleted successfully',
    };
  }
}
