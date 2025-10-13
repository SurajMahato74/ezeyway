export interface CategoryField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'boolean' | 'date' | 'color' | 'range';
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
}

export interface CategoryConfig {
  name: string;
  description: string;
  icon: string;
  fields: CategoryField[];
  subcategories?: string[];
}

export const categoryConfigs: Record<string, CategoryConfig> = {
  electronics: {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    icon: '📱',
    fields: [
      { 
        name: 'brand', 
        label: 'Brand', 
        type: 'text',
        placeholder: 'e.g., Samsung, Apple'
      },
      { 
        name: 'model', 
        label: 'Model', 
        type: 'text',
        placeholder: 'e.g., Galaxy S24'
      },
      { 
        name: 'warranty', 
        label: 'Warranty', 
        type: 'select',
        options: ['No Warranty', '6 months', '1 year', '2 years']
      }
    ]
  },
  
  clothing: {
    name: 'Clothing & Fashion',
    description: 'Apparel and fashion accessories',
    icon: '👕',
    fields: [
      { 
        name: 'brand', 
        label: 'Brand', 
        type: 'text',
        placeholder: 'Brand name'
      },
      { 
        name: 'size', 
        label: 'Sizes', 
        type: 'multiselect',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      },
      { 
        name: 'color', 
        label: 'Colors', 
        type: 'multiselect',
        options: ['Black', 'White', 'Red', 'Blue', 'Green', 'Gray', 'Brown']
      },
      { 
        name: 'material', 
        label: 'Material', 
        type: 'text',
        placeholder: 'e.g., Cotton, Polyester'
      }
    ]
  },
  
  food: {
    name: 'Food & Beverages',
    description: 'Fresh food and beverages',
    icon: '🍕',
    fields: [
      { 
        name: 'cuisine', 
        label: 'Cuisine', 
        type: 'select',
        options: ['Nepali', 'Indian', 'Chinese', 'Continental', 'Italian', 'Other']
      },
      { 
        name: 'spiceLevel', 
        label: 'Spice Level', 
        type: 'select',
        options: ['Mild', 'Medium', 'Hot']
      },
      { 
        name: 'dietaryInfo', 
        label: 'Dietary', 
        type: 'multiselect',
        options: ['Vegetarian', 'Vegan', 'Gluten-Free']
      },
      { 
        name: 'servingSize', 
        label: 'Serving Size', 
        type: 'text',
        placeholder: 'e.g., 1 plate, 250ml'
      }
    ]
  },
  
  baby: {
    name: 'Baby & Kids',
    description: 'Products for babies and children',
    icon: '👶',
    fields: [
      { 
        name: 'ageGroup', 
        label: 'Age Group', 
        type: 'select',
        options: ['0-6 months', '6-12 months', '1-2 years', '2-4 years', '4+ years']
      },
      { 
        name: 'safetyFeatures', 
        label: 'Safety', 
        type: 'multiselect',
        options: ['BPA Free', 'Non-Toxic', 'Organic']
      }
    ]
  },
  
  grocery: {
    name: 'Grocery & Household',
    description: 'Daily essentials and household items',
    icon: '🛒',
    fields: [
      { 
        name: 'weight', 
        label: 'Weight/Volume', 
        type: 'text',
        placeholder: 'e.g., 1kg, 500ml'
      },
      { 
        name: 'expiryDate', 
        label: 'Expiry Date', 
        type: 'date'
      },
      { 
        name: 'organic', 
        label: 'Organic', 
        type: 'boolean'
      }
    ]
  },
  
  meat: {
    name: 'Meat & Seafood',
    description: 'Fresh meat and seafood',
    icon: '🥩',
    fields: [
      { 
        name: 'cut', 
        label: 'Cut Type', 
        type: 'select',
        options: ['Whole', 'Pieces', 'Minced', 'Fillet']
      },
      { 
        name: 'freshness', 
        label: 'Freshness', 
        type: 'select',
        options: ['Fresh', 'Frozen']
      }
    ]
  },
  
  medicine: {
    name: 'Medicine & Health',
    description: 'Medicines and health products',
    icon: '💊',
    fields: [
      { 
        name: 'dosage', 
        label: 'Dosage', 
        type: 'text',
        placeholder: 'e.g., 500mg, 10ml'
      },
      { 
        name: 'form', 
        label: 'Form', 
        type: 'select',
        options: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops']
      },
      { 
        name: 'prescription', 
        label: 'Prescription Required', 
        type: 'boolean'
      }
    ]
  }
};

export const getFieldsByCategory = (category: string): CategoryField[] => {
  return categoryConfigs[category]?.fields || [];
};

export const getCategoryName = (category: string): string => {
  return categoryConfigs[category]?.name || category;
};

export const getAllCategories = () => {
  return Object.entries(categoryConfigs).map(([key, config]) => ({
    value: key,
    label: config.name,
    description: config.description,
    icon: config.icon
  }));
};

export const getUnitByCategory = (category: string): string => {
  const units: Record<string, string> = {
    meat: 'kg',
    grocery: 'piece',
    medicine: 'unit',
    food: 'plate',
    electronics: 'piece',
    clothing: 'piece',
    baby: 'piece'
  };
  return units[category] || 'piece';
};