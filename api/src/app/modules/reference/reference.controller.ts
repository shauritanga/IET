import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReferenceService } from './reference.service';

@ApiTags('Reference')
@Controller('reference')
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get('countries')
  @ApiOperation({ summary: 'List active countries for reference dropdowns' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Countries retrieved successfully',
  })
  async getCountries() {
    const countries = await this.referenceService.getCountries();

    return {
      success: true,
      data: countries,
    };
  }
}
