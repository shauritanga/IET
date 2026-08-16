import { Controller, Get, Post, Body, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { ReportsService } from '../services/reports.service';
import { ReportPreviewDto, ReportExportDto } from '../dto/report-query.dto';

@ApiTags('Reports')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, AdminGuard, PermissionsGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('bases')
  listBases() {
    return this.reportsService.listBases();
  }

  @Post('preview')
  preview(@Body() dto: ReportPreviewDto) {
    return this.reportsService.preview(dto);
  }

  @Post('export')
  async export(@Body() dto: ReportExportDto, @Res() res: Response) {
    const { buffer, contentType, filename } = await this.reportsService.export(dto);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
