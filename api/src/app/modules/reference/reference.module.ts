import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryEntity } from './entities/country.entity';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';

@Module({
  imports: [TypeOrmModule.forFeature([CountryEntity])],
  controllers: [ReferenceController],
  providers: [ReferenceService],
  exports: [ReferenceService],
})
export class ReferenceModule {}
