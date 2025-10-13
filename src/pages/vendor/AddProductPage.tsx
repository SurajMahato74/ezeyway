import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  Package,
  Tag,
  Info,
  Camera,
  Save,
  Eye
} from 'lucide-react';
import ProductPreview from '@/components/ProductPreview';
import { categoryConfigs, getAllCategories, getUnitByCategory, type CategoryField } from '@/config/categoryConfig';
import { useNavigate } from 'react-router-dom';
import { productApi } from '@/lib/productApi';
import { toast } from 'sonner';
import SuccessNotification from '@/components/SuccessNotification';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  cost_price: z.number().nullable().optional().transform(val => val === undefined ? null : val),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  quantity: z.number().min(0, 'Quantity must be positive'),
  low_stock_threshold: z.number().min(0).optional(),
  description: z.string().min(1, 'Description is required'),
  short_description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  image_files: z.array(z.any()).min(1, 'At least one image is required'),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  featured: z.boolean().default(false),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  dynamic_fields: z.record(z.any()).default({})
});

type ProductFormData = z.infer<typeof productSchema>;

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [vendorCategories, setVendorCategories] = useState<string[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      price: '',
      cost_price: null,
      quantity: '',
      description: '',
      tags: [],
      image_files: [],
      status: 'active',
      featured: false,
      dynamic_fields: {}
    }
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = form;
  const watchedCategory = watch('category');

  useEffect(() => {
    setSelectedCategory(watchedCategory);
  }, [watchedCategory]);

  // Fetch vendor profile and set default category
  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const { apiRequest } = await import('@/utils/apiUtils');
        const { response, data } = await apiRequest('/api/vendor-profiles/');
        console.log('Vendor profile response:', { response: response.ok, data });
        
        if (response.ok && data && data.results && data.results.length > 0) {
          const vendorProfile = data.results[0];
          const categories = vendorProfile.categories || [];
          console.log('Vendor categories:', categories);
          setVendorCategories(categories);
          
          // Map vendor category names to config keys
          const categoryMapping: Record<string, string> = {
            'Clothing': 'clothing',
            'Electronics': 'electronics',
            'Food': 'food',
            'Baby': 'baby',
            'Grocery': 'grocery',
            'Meat': 'meat',
            'Medicine': 'medicine'
          };
          
          // Auto-select first category if available
          if (categories.length > 0) {
            const mappedCategory = categoryMapping[categories[0]] || categories[0].toLowerCase();
            console.log('Mapped category:', categories[0], '->', mappedCategory);
            setValue('category', mappedCategory);
            setSelectedCategory(mappedCategory);
          }
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
      const fileArray = Array.from(files);
      const imageUrls = fileArray.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...fileArray]);
      setImagePreviews(prev => [...prev, ...imageUrls]);
      setValue('image_files', [...images, ...fileArray]);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
    setValue('image_files', newImages);
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

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Remove cost_price if it's null or undefined to avoid backend validation error
      const processedData = { ...data };
      if (processedData.cost_price === null || processedData.cost_price === undefined) {
        delete processedData.cost_price;
      }
      
      await productApi.createProduct(processedData);
      
      // Show custom centered success notification
      setSuccessMessage('Product created successfully!');
      setShowSuccess(true);
      
      // Reset form and state
      form.reset();
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImages([]);
      setImagePreviews([]);
      setTags([]);
      
      // Re-set the vendor's category after reset
      if (vendorCategories.length > 0) {
        const categoryMapping: Record<string, string> = {
          'Clothing': 'clothing',
          'Electronics': 'electronics',
          'Food': 'food',
          'Baby': 'baby',
          'Grocery': 'grocery',
          'Meat': 'meat',
          'Medicine': 'medicine'
        };
        const mappedCategory = categoryMapping[vendorCategories[0]] || vendorCategories[0].toLowerCase();
        setValue('category', mappedCategory);
        setSelectedCategory(mappedCategory);
      }
    } catch (error) {
      toast.error('Failed to create product. Please try again.');
      console.error('Error creating product:', error);
    }
  };

  const renderDynamicField = (field: CategoryField) => {
    const fieldName = `dynamic_fields.${field.name}`;
    
    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-1">
            <Label htmlFor={field.name} className="text-xs font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField }) => (
                <Input {...formField} placeholder={field.placeholder} className="h-8 text-xs" />
              )}
            />
          </div>
        );
      
      case 'number':
        return (
          <div key={field.name} className="space-y-1">
            <Label htmlFor={field.name} className="text-xs font-medium text-gray-700">
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
                  placeholder={field.placeholder}
                  className="h-8 text-xs"
                  onChange={(e) => formField.onChange(Number(e.target.value))}
                />
              )}
            />
          </div>
        );
      
      case 'select':
        return (
          <div key={field.name} className="space-y-1">
            <Label htmlFor={field.name} className="text-xs font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField }) => (
                <Select onValueChange={formField.onChange} value={formField.value}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option: string) => (
                      <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        );
      
      case 'multiselect':
        return (
          <div key={field.name} className="space-y-1">
            <Label htmlFor={field.name} className="text-xs font-medium text-gray-700">
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
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option: string) => (
                          <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1">
                      {selectedValues.map((value: string) => (
                        <Badge key={value} variant="secondary" className="text-xs flex items-center gap-1">
                          {value}
                          <X 
                            className="h-2 w-2 cursor-pointer" 
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
          <div key={field.name} className="space-y-1">
            <Label htmlFor={field.name} className="text-xs font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField }) => (
                <Textarea {...formField} placeholder={field.placeholder} className="text-xs" rows={2} />
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
            <Label htmlFor={field.name} className="text-xs font-medium text-gray-700">{field.label}</Label>
          </div>
        );
      
      case 'date':
        return (
          <div key={field.name} className="space-y-1">
            <Label htmlFor={field.name} className="text-xs font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Controller
              name={fieldName}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField }) => (
                <Input {...formField} type="date" className="h-8 text-xs" />
              )}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setPreviewMode(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold">Product Preview</h1>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPreviewMode(false)}
            >
              Edit
            </Button>
          </div>
        </div>
        <ProductPreview productData={watch()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/vendor/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Add New Product</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setPreviewMode(true)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="name" className="text-xs font-medium text-gray-700">Product Name <span className="text-red-500">*</span></Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Enter product name" className="h-8 text-xs" />
                  )}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="category" className="text-xs font-medium text-gray-700">Category <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md h-8">
                  {selectedCategory ? (
                    (() => {
                      const selectedCat = getAllCategories().find(cat => cat.value === selectedCategory);
                      return selectedCat ? (
                        <>
                          <span>{selectedCat.icon}</span>
                          <span className="text-xs font-medium">{selectedCat.label}</span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">Category: {selectedCategory}</span>
                      );
                    })()
                  ) : (
                    <span className="text-xs text-gray-500">Loading...</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Auto-selected from your vendor profile</p>
                {/* Hidden input to maintain form data */}
                <input type="hidden" {...form.register('category')} value={selectedCategory} />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Unit</Label>
                <Input 
                  value={selectedCategory ? getUnitByCategory(selectedCategory) : 'piece'} 
                  disabled 
                  className="h-8 text-xs bg-gray-50" 
                />
              </div>
            </div>
          </div>

          {/* Category-Specific Fields */}
          {selectedCategory && categoryConfigs[selectedCategory] && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-green-600" />
                <span className="mr-1">{categoryConfigs[selectedCategory].icon}</span>
                <h3 className="text-sm font-semibold text-gray-900">{categoryConfigs[selectedCategory].name} Details</h3>
              </div>
              
              {categoryConfigs[selectedCategory].subcategories && (
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">Subcategory</Label>
                  <Controller
                    name="subcategory"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryConfigs[selectedCategory].subcategories?.map((sub) => (
                            <SelectItem key={sub} value={sub} className="text-xs">{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                {categoryConfigs[selectedCategory].fields.map(renderDynamicField)}
              </div>
            </div>
          )}

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Pricing & Inventory</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="price" className="text-xs font-medium text-gray-700">Selling Price <span className="text-red-500">*</span></Label>
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      className="h-8 text-xs"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="cost_price" className="text-xs font-medium text-gray-700">Cost Price</Label>
                <Controller
                  name="cost_price"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      className="h-8 text-xs"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? Number(value) : null);
                      }}
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="quantity" className="text-xs font-medium text-gray-700">Quantity <span className="text-red-500">*</span></Label>
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    <Input 
                      type="number"
                      placeholder="0"
                      className="h-8 text-xs flex-1"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                    />
                    <span className="text-xs text-gray-500 flex items-center px-2">
                      {selectedCategory ? getUnitByCategory(selectedCategory) : 'piece'}
                    </span>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">Product Images</h3>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-600">Click to upload images</p>
              </label>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {imagePreviews.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={imageUrl} 
                      alt={`Product ${index + 1}`} 
                      className="w-full h-12 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {index === 0 && (
                      <Badge className="absolute bottom-0 left-0 text-xs px-1 py-0">Main</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-900">Product Description</h3>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs font-medium text-gray-700">Description <span className="text-red-500">*</span></Label>
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
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                      ],
                    }}
                    style={{ minHeight: '120px', fontSize: '12px' }}
                  />
                )}
              />
              {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Product Tags</h3>
            
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                className="h-8 text-xs"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-2 w-2 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 sticky bottom-4 bg-white p-3 border border-gray-200 rounded-lg">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-9 text-xs"
              onClick={() => {
                setValue('status', 'draft');
                handleSubmit(onSubmit)();
              }}
            >
              Save as Draft
            </Button>
            <Button type="submit" className="flex-1 h-9 text-xs">
              <Save className="h-3 w-3 mr-1" />
              Publish Product
            </Button>
          </div>
        </form>
      </div>
      
      {/* Success Notification */}
      <SuccessNotification
        message={successMessage}
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
        duration={3000}
      />
    </div>
  );
};

export default AddProductPage;