import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly wizlo: WizloService) {}

  createCategory(dto: CreateCategoryDto) {
    return this.wizlo.request('/admins/products/categories', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  listCategories(page?: number, limit?: number, search?: string) {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    if (search) params.set('search', search);
    const qs = params.toString();
    return this.wizlo.request(`/admins/products/categories${qs ? `?${qs}` : ''}`);
  }

  getCategory(id: string) {
    return this.wizlo.request(`/admins/products/categories/${id}`);
  }

  updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.wizlo.request(`/admins/products/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  deleteCategory(id: string) {
    return this.wizlo.request(`/admins/products/categories/${id}`, {
      method: 'DELETE',
    });
  }

  createSubcategory(dto: CreateSubcategoryDto) {
    return this.wizlo.request('/admins/products/subcategories', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  listSubcategories(categoryId?: string, page?: number, limit?: number) {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (page) params.set('page', String(page));
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return this.wizlo.request(`/admins/products/subcategories${qs ? `?${qs}` : ''}`);
  }

  getSubcategory(id: string) {
    return this.wizlo.request(`/admins/products/subcategories/${id}`);
  }

  updateSubcategory(id: string, dto: UpdateSubcategoryDto) {
    return this.wizlo.request(`/admins/products/subcategories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  deleteSubcategory(id: string) {
    return this.wizlo.request(`/admins/products/subcategories/${id}`, {
      method: 'DELETE',
    });
  }
}
