import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { NotificationsService } from '../services/notifications.service';
import { NotificationQueryDto, UpdatePreferencesDto } from '../dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            type: 'PAYMENT_REMINDER',
            title: 'Membership Fee Due Soon',
            message: 'Your 2025 membership fee is due on July 10, 2025',
            isRead: false,
            createdAt: '2025-01-27T10:00:00Z',
            actionUrl: '/memberships/fees',
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 12,
          totalPages: 1,
          unreadCount: 5,
        },
      },
    },
  })
  async getNotifications(
    @GetUser() user: UserEntity,
    @Query() query: NotificationQueryDto,
  ) {
    const result = await this.notificationsService.getUserNotifications(
      user.id,
      query,
    );
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
        unreadCount: result.unreadCount,
      },
    };
  }

  @Patch(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'notificationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read',
  })
  async markAsRead(
    @GetUser() user: UserEntity,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ) {
    await this.notificationsService.markAsRead(notificationId, user.id);
    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read',
    schema: {
      example: {
        success: true,
        data: { markedCount: 5 },
        message: 'All notifications marked as read',
      },
    },
  })
  async markAllAsRead(@GetUser() user: UserEntity) {
    const result = await this.notificationsService.markAllAsRead(user.id);
    return {
      success: true,
      data: result,
      message: 'All notifications marked as read',
    };
  }

  @Delete(':notificationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'notificationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification deleted',
  })
  async deleteNotification(
    @GetUser() user: UserEntity,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ) {
    await this.notificationsService.deleteNotification(notificationId, user.id);
    return {
      success: true,
      message: 'Notification deleted',
    };
  }

  // ============================================
  // PREFERENCES
  // ============================================

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferences retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          email: {
            eventReminders: true,
            paymentReminders: true,
            newsletters: false,
            applicationUpdates: true,
          },
          sms: {
            eventReminders: true,
            paymentReminders: true,
          },
          push: {
            eventReminders: true,
            paymentReminders: true,
            generalAnnouncements: false,
          },
        },
      },
    },
  })
  async getPreferences(@GetUser() user: UserEntity) {
    const result = await this.notificationsService.getPreferences(user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferences updated successfully',
  })
  async updatePreferences(
    @GetUser() user: UserEntity,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const result = await this.notificationsService.updatePreferences(
      user.id,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Preferences updated successfully',
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread count retrieved',
    schema: {
      example: {
        success: true,
        data: { count: 5 },
      },
    },
  })
  async getUnreadCount(@GetUser() user: UserEntity) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return {
      success: true,
      data: { count },
    };
  }
}
