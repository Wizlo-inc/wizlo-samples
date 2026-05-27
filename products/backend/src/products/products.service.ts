import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly wizlo: WizloService) {}

  create(dto: CreateProductDto) {
    const body: Record<string, unknown> = {
      name: dto.name,
      sku: dto.sku,
      productId: dto.productId,
      unitPrice: dto.unitPrice,
      pharmacyId: dto.pharmacyId,
      clinicIds: dto.clinicIds,
      categoryId: dto.categoryId,
      isEncounterRequired: dto.isEncounterRequired ?? false,
      requiresLabs: dto.requiresLabs ?? false,
    };
    if (dto.displayName) body.displayName = dto.displayName;
    if (dto.description) body.description = dto.description;
    if (dto.subcategoryId) body.subcategoryId = dto.subcategoryId;
    if (dto.encounterMode) body.encounterMode = dto.encounterMode;
    if (dto.productEncounterType) body.productEncounterType = dto.productEncounterType;
    if (dto.imageUrl) body.imageUrl = dto.imageUrl;
    if (dto.productRx) body.productRx = dto.productRx;
    return this.wizlo.request('/tenants/products', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  list(page?: number, limit?: number, search?: string, categoryId?: string) {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (categoryId) params.set('categoryId', categoryId);
    const qs = params.toString();
    return this.wizlo.request(`/tenants/products${qs ? `?${qs}` : ''}`);
  }

  get(id: string) {
    return this.wizlo.request(`/tenants/products/${id}`);
  }

  update(id: string, dto: UpdateProductDto) {
    return this.wizlo.request(`/tenants/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  remove(id: string) {
    return this.wizlo.request(`/tenants/products/${id}`, {
      method: 'DELETE',
    });
  }
}
