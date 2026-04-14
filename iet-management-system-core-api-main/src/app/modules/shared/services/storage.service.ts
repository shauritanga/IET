import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  mimeType: string;
  originalName: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl: string;
  private readonly endpoint: string;
  private readonly storageEnabled: boolean;

  constructor(private configService: ConfigService) {
    const key = configService.get<string>('DO_SPACES_KEY');
    const secret = configService.get<string>('DO_SPACES_SECRET');
    const endpoint = configService.get<string>('DO_SPACES_ENDPOINT');
    const region = configService.get<string>('DO_SPACES_REGION', 'us-east-1');

    this.bucket = configService.get<string>('DO_SPACES_BUCKET', '');
    this.cdnUrl = configService.get<string>('DO_SPACES_CDN_URL', '');
    this.endpoint = endpoint;
    this.storageEnabled = !!(key && secret && endpoint && this.bucket);

    if (this.storageEnabled) {
      this.client = new S3Client({
        endpoint,
        region,
        credentials: { accessKeyId: key, secretAccessKey: secret },
        forcePathStyle: false,
      });
      this.logger.log(
        `Storage service initialized with bucket: ${this.bucket}`,
      );
    } else {
      this.logger.warn(
        'Storage service not configured - file uploads will fail',
      );
    }
  }

  /**
   * Upload a file buffer to S3/Spaces
   * @param buffer - file buffer
   * @param originalName - original filename
   * @param mimeType - MIME type
   * @param folder - folder prefix (e.g. 'documents', 'avatars')
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'uploads',
  ): Promise<UploadResult> {
    if (!this.storageEnabled) {
      throw new BadRequestException('File storage is not configured');
    }

    const ext = path.extname(originalName).toLowerCase();
    const key = `${folder}/${uuid()}${ext}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ACL: 'public-read',
        }),
      );

      const url = this.buildUrl(key);

      this.logger.log(`Uploaded file: ${key} (${buffer.length} bytes)`);

      return {
        key,
        url,
        bucket: this.bucket,
        size: buffer.length,
        mimeType,
        originalName,
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack);
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3/Spaces by key
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.storageEnabled) return;

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`Deleted file: ${key}`);
    } catch (error) {
      this.logger.error(`Delete failed for ${key}: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for private file access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.storageEnabled) {
      throw new BadRequestException('File storage is not configured');
    }

    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Extract the S3 key from a full URL
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Remove leading slash and bucket name if in path
      let keyPath = urlObj.pathname.replace(/^\//, '');
      // If using path-style, the first path segment is the bucket name
      if (keyPath.startsWith(this.bucket + '/')) {
        keyPath = keyPath.slice(this.bucket.length + 1);
      }
      return keyPath;
    } catch {
      return null;
    }
  }

  private buildUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl.replace(/\/$/, '')}/${key}`;
    }
    // DigitalOcean Spaces URL format: https://{bucket}.{region}.digitaloceanspaces.com/{key}
    // Parse from endpoint: https://sfo3.digitaloceanspaces.com
    const endpointUrl = new URL(this.endpoint);
    return `https://${this.bucket}.${endpointUrl.host}/${key}`;
  }
}
