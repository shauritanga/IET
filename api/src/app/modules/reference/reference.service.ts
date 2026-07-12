import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CountryEntity } from './entities/country.entity';

@Injectable()
export class ReferenceService {
  constructor(
    @InjectRepository(CountryEntity)
    private readonly countryRepository: Repository<CountryEntity>,
  ) {}

  async getCountries() {
    return this.countryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
      select: { id: true, iso2: true, name: true },
    });
  }
}
