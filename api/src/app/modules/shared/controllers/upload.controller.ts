import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { StorageService } from '../services/storage.service';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@ApiTags('Uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_SIZE_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an image or document' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Image (JPG, PNG, WEBP, GIF) or Document (PDF, DOC, DOCX) — max 10MB' },
        folder: { type: 'string', description: 'Optional folder name (e.g. avatars, documents, certificates)', example: 'documents' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File uploaded successfully',
    schema: {
      example: {
        success: true,
        data: {
          url: 'https://eit-bucket.sfo3.digitaloceanspaces.com/documents/uuid.pdf',
          key: 'documents/uuid.pdf',
          originalName: 'cv.pdf',
          mimeType: 'application/pdf',
          size: 204800,
          fileType: 'DOCUMENT',
        },
        message: 'File uploaded successfully',
      },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
    const isDoc = ALLOWED_DOC_TYPES.includes(file.mimetype);

    if (!isImage && !isDoc) {
      throw new BadRequestException(
        'Invalid file type. Allowed: JPG, PNG, WEBP, GIF, PDF, DOC, DOCX',
      );
    }

    const defaultFolder = isImage ? 'images' : 'documents';
    const uploadFolder = folder?.trim() || defaultFolder;

    const result = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      uploadFolder,
    );

    return {
      success: true,
      data: {
        url: result.url,
        key: result.key,
        originalName: result.originalName,
        mimeType: result.mimeType,
        size: result.size,
        fileType: isImage ? 'IMAGE' : 'DOCUMENT',
      },
      message: 'File uploaded successfully',
    };
  }
}
