import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('General')
@Controller()
export class RootController {
  @Get()
  @ApiOperation({ summary: 'API welcome message' })
  @ApiResponse({ status: 200, description: 'Welcome message' })
  welcome() {
    return {
      name: 'IET Tanzania Management System API',
      version: 'v1',
      description:
        'Official API for the Institution of Engineers Tanzania (IET) membership and registration management system.',
      status: 'operational',
      timestamp: new Date().toISOString(),
      endpoints: {
        docs: '/api/docs',
        health: '/health',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        registrations: '/api/v1/registrations',
        admin: '/api/v1/admin',
        uploads: '/api/v1/uploads',
      },
      contact: {
        organization: 'Institution of Engineers Tanzania',
        website: 'https://iet.or.tz',
        email: 'info@iet.or.tz',
      },
    };
  }
}
