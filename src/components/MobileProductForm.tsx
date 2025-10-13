import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Package,
  Tag,
  Camera,
  FileText,
  Settings,
  Eye
} from 'lucide-react';

interface MobileProductFormProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  onPreview: () => void;
  onSave: () => void;
  onPublish: () => void;
}

const steps = [
  { id: 1, title: 'Basic Info', icon: Package, description: 'Product name and category' },
  { id: 2, title: 'Details', icon: Tag, description: 'Category-specific fields' },
  { id: 3, title: 'Pricing', icon: Settings, description: 'Price and inventory' },
  { id: 4, title: 'Images', icon: Camera, description: 'Product photos' },
  { id: 5, title: 'Description', icon: FileText, description: 'Rich text content' },
  { id: 6, title: 'Final', icon: Check, description: 'Review and publish' }
];

const MobileProductForm: React.FC<MobileProductFormProps> = ({
  children,
  currentStep,
  totalSteps,
  onStepChange,
  onPreview,
  onSave,
  onPublish
}) => {
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  
  const progress = (currentStep / totalSteps) * 100;
  const currentStepInfo = steps.find(step => step.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Add Product</h1>
              <p className="text-sm text-gray-500">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Step Indicator - Mobile */}
      <div className="bg-white border-b p-4 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentStepInfo && (
              <>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <currentStepInfo.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">{currentStepInfo.title}</h3>
                  <p className="text-sm text-gray-500">{currentStepInfo.description}</p>
                </div>
              </>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsStepperOpen(!isStepperOpen)}
          >
            {currentStep}/{totalSteps}
          </Button>
        </div>
        
        {/* Expandable Step List */}
        {isStepperOpen && (
          <div className="mt-4 space-y-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  step.id === currentStep 
                    ? 'bg-blue-50 border border-blue-200' 
                    : step.id < currentStep 
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                }`}
                onClick={() => onStepChange(step.id)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.id === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : step.id < currentStep 
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                }`}>
                  {step.id < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {step.id < currentStep && (
                  <Badge variant="secondary" className="text-xs">
                    Complete
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden md:block bg-white border-b">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-3 cursor-pointer ${
                    step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                  onClick={() => onStepChange(step.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step.id === currentStep 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : step.id < currentStep 
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 text-gray-400'
                  }`}>
                    {step.id < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="hidden lg:block">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    step.id < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="bg-white border-t p-4 sticky bottom-0 md:hidden">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button 
              variant="outline" 
              onClick={() => onStepChange(currentStep - 1)}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button 
              onClick={() => onStepChange(currentStep + 1)}
              className="flex-1"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex gap-2 flex-1">
              <Button variant="outline" onClick={onSave} className="flex-1">
                Save Draft
              </Button>
              <Button onClick={onPublish} className="flex-1">
                Publish
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Action Bar */}
      <div className="hidden md:block bg-white border-t">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => onStepChange(currentStep - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" onClick={onSave}>
                Save Draft
              </Button>
              
              {currentStep < totalSteps ? (
                <Button onClick={() => onStepChange(currentStep + 1)}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={onPublish}>
                  <Check className="h-4 w-4 mr-2" />
                  Publish Product
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileProductForm;