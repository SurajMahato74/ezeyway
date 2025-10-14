import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

import { 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  Minus,
  Package,
  Tag,
  Info,
  Camera,
  Save,
  Eye
} from 'lucide-react';
import ProductPreview from '@/components/ProductPreview';
import { categoryConfigs, getAllCategories, type CategoryField } from '@/config/categoryConfig';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/utils/apiUtils';



const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  comparePrice: z.number().optional(),
  costPrice: z.number().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  trackQuantity: z.boolean().default(true),
  quantity: z.number().min(0, 'Quantity must be positive'),
  lowStockThreshold: z.number().min(0).optional(),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  featured: z.boolean().default(false),
  freeDelivery: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  dynamicFields: z.record(z.any()).default({})
});

type ProductFormData = z.infer<typeof productSchema>;

const AddProduct: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isFullPage, setIsFullPage] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [vendorCategories, setVendorCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      price: 0,
      quantity: 0,
      description: '',
      tags: [],
      images: [],
      status: 'active',
      featured: false,
      freeDelivery: false,
      trackQuantity: true,
      dynamicFields: {}
    }
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = form;
  const watchedCategory = watch('category');

  useEffect(() => {
    setSelectedCategory(watchedCategory);
    // Update available subcategories when category changes
    if (watchedCategory && categoryConfigs[watchedCategory]?.subcategories) {
      setAvailableSubcategories(categoryConfigs[watchedCategory].subcategories);
    } else {
      setAvailableSubcategories([]);
    }
    // Clear subcategory when category changes
    setValue('subcategory', '');
  }, [watchedCategory, setValue]);

  // Fetch vendor profile and set default category
  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const { response, data } = await apiRequest('/vendor-profiles/');
        if (response.ok && data && data.length > 0) {
          const vendorProfile = data[0];
          const categories = vendorProfile.categories || [];
          setVendorCategories(categories);
          
          // Don't auto-select category, let user choose
        }
      } catch (error) {
        console.error('Error fetching vendor profile:', error);
      }
    };
    
    fetchVendorProfile();
  }, [setValue]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages]);
      setValue('images', [...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setValue('images', newImages);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setValue('tags', updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    setValue('tags', updatedTags);
  };

  const onSubmit = (data: ProductFormData) => {
    console.log('Product Data:', data);
    // Handle form submission
  };

  const renderDynamicField = (field: CategoryField) => {
    const fieldName = `dynamicFields.${field.name}`;
    
    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField }) => (
                <Input {...formField} placeholder={`Enter ${field.label.toLowerCase()}`} />
              )}
            />
          </div>
        );
      
      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField }) => (
                <Input 
                  {...formField} 
                  type="number" 
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  onChange={(e) => formField.onChange(Number(e.target.value))}
                />
              )}
            />
          </div>
        );
      
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField }) => (
                <Select onValueChange={formField.onChange} value={formField.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option: string) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        );
      
      case 'multiselect':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField }) => {
                const selectedValues = formField.value || [];
                return (
                  <div className="space-y-2">
                    <Select onValueChange={(value) => {
                      if (!selectedValues.includes(value)) {
                        formField.onChange([...selectedValues, value]);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option: string) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2">
                      {selectedValues.map((value: string) => (
                        <Badge key={value} variant="secondary" className="flex items-center gap-1">
                          {value}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => {
                              formField.onChange(selectedValues.filter((v: string) => v !== value));
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField }) => (
                <Textarea {...formField} placeholder={`Enter ${field.label.toLowerCase()}`} />
              )}
            />
          </div>
        );
      
      case 'boolean':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Controller
              name={fieldName}
              control={control}
              render={({ field: formField }) => (
                <Switch 
                  checked={formField.value} 
                  onCheckedChange={formField.onChange}
                />
              )}
            />
            <Label htmlFor={field.name}>{field.label}</Label>
          </div>
        );
      
      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField }) => (
                <Input {...formField} type="date" />
              )}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  const FormContent = () => {
    if (previewMode) {
      return <ProductPreview productData={watch()} />;
    }
    
    return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name <span className="text-red-500">*</span></Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter product name" />
                )}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorCategories.map((categoryValue) => {
                        const category = getAllCategories().find(cat => cat.value === categoryValue);
                        return category ? (
                          <SelectItem key={categoryValue} value={categoryValue}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ) : null;
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
            </div>
            
            {/* Subcategory Selection */}
            {availableSubcategories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Controller
                  name="subcategory"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubcategories.map((subcategory) => (
                          <SelectItem key={subcategory} value={subcategory}>
                            {subcategory}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Controller
              name="shortDescription"
              control={control}
              render={({ field }) => (
                <Textarea {...field} placeholder="Brief product description" rows={2} />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category-Specific Fields */}
      {selectedCategory && categoryConfigs[selectedCategory] && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <span className="mr-2">{categoryConfigs[selectedCategory].icon}</span>
              {categoryConfigs[selectedCategory].name} Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryConfigs[selectedCategory].fields.map(renderDynamicField)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing & Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing & Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price <span className="text-red-500">*</span></Label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <Input 
                    {...field} 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comparePrice">Compare Price</Label>
              <Controller
                name="comparePrice"
                control={control}
                render={({ field }) => (
                  <Input 
                    {...field} 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Controller
                name="costPrice"
                control={control}
                render={({ field }) => (
                  <Input 
                    {...field} 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <Controller
              name="trackQuantity"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label>Track Quantity</Label>
          </div>

          {watch('trackQuantity') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity <span className="text-red-500">*</span></Label>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      type="number"
                      placeholder="0"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
                <Controller
                  name="lowStockThreshold"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      type="number"
                      placeholder="5"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Click to upload images or drag and drop</p>
              <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
            </label>
          </div>
          
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={image} 
                    alt={`Product ${index + 1}`} 
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && (
                    <Badge className="absolute bottom-1 left-1 text-xs">Main</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Product Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <ReactQuill
                  theme="snow"
                  value={field.value}
                  onChange={field.onChange}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'color': [] }, { 'background': [] }],
                      ['link', 'image'],
                      ['clean']
                    ],
                  }}
                  style={{ minHeight: '200px' }}
                />
              )}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Product Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO & Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SEO & Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Product SKU" />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Controller
                name="barcode"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Product barcode" />
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Controller
                name="seoTitle"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="SEO optimized title" />
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Controller
                name="seoDescription"
                control={control}
                render={({ field }) => (
                  <Textarea {...field} placeholder="SEO meta description" rows={3} />
                )}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Controller
                name="featured"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label>Featured Product</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Controller
                name="freeDelivery"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label>Free Delivery</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 sticky bottom-4 bg-white p-4 border-t">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1"
          onClick={() => setPreviewMode(!previewMode)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {previewMode ? 'Edit' : 'Preview'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1"
          onClick={() => {
            setValue('status', 'draft');
            handleSubmit(onSubmit)();
          }}
        >
          Save as Draft
        </Button>
        <Button type="submit" className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Publish Product
        </Button>
      </div>
    </form>
    );
  };

  if (isFullPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsFullPage(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Add New Product</h1>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto p-6">
          <ScrollArea className="h-[calc(100vh-80px)]">
            <FormContent />
          </ScrollArea>
        </div>
      </div>
    );
  }

  const navigate = useNavigate();
  
  return (
    <button
      className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 border-4 border-white"
      aria-label="Add Product"
      onClick={() => navigate('/vendor/add-product')}
    >
      <Plus className="h-7 w-7" />
    </button>
  );
};

export default AddProduct;