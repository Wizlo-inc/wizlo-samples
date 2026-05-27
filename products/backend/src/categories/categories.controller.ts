import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  @Get('categories')
  listCategories(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.categoriesService.listCategories(page, limit, search);
  }

  @Get('categories/:id')
  getCategory(@Param('id') id: string) {
    return this.categoriesService.getCategory(id);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }

  @Post('subcategories')
  createSubcategory(@Body() dto: CreateSubcategoryDto) {
    return this.categoriesService.createSubcategory(dto);
  }

  @Get('subcategories')
  listSubcategories(
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.categoriesService.listSubcategories(categoryId, page, limit);
  }

  @Get('subcategories/:id')
  getSubcategory(@Param('id') id: string) {
    return this.categoriesService.getSubcategory(id);
  }

  @Put('subcategories/:id')
  updateSubcategory(@Param('id') id: string, @Body() dto: UpdateSubcategoryDto) {
    return this.categoriesService.updateSubcategory(id, dto);
  }

  @Delete('subcategories/:id')
  deleteSubcategory(@Param('id') id: string) {
    return this.categoriesService.deleteSubcategory(id);
  }
}
