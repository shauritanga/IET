/// <reference types="multer" />
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseUUIDPipe,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserEntity } from '../entities/user.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { StorageService } from '../../shared/services/storage.service';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User has been successfully created',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Returns all users',
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.userService.findAll(paginationDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current user profile',
  })
  async getProfile(@GetUser() user: UserEntity) {
    return this.userService.getProfileWithRegistrationStatus(user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User has been successfully updated',
  })
  updateProfile(
    @GetUser() user: UserEntity,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(user.id, updateUserDto);
  }

  @Post('profile/photo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile photo' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { photo: { type: 'string', format: 'binary' } },
      required: ['photo'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile photo updated successfully',
  })
  async uploadProfilePhoto(
    @GetUser() user: UserEntity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (
      !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
        file.mimetype,
      )
    ) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPG, PNG, WEBP',
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Delete old photo if exists
    if (user.profilePhotoUrl) {
      const oldKey = this.storageService.extractKeyFromUrl(
        user.profilePhotoUrl,
      );
      if (oldKey) await this.storageService.deleteFile(oldKey);
    }

    const uploaded = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      `avatars/${user.id}`,
    );

    await this.userService.updateProfilePhoto(user.id, uploaded.url);
    return {
      success: true,
      data: { profilePhotoUrl: uploaded.url },
      message: 'Profile photo updated successfully',
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user with the specified ID',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User has been successfully updated',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({
    status: 200,
    description: 'User has been successfully deleted',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }
}
