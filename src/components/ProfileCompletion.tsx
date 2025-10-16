import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/utils/apiUtils';
import { googleAuthService } from '@/services/googleAuth';
import { useApp } from '@/contexts/AppContext';

interface ProfileCompletionProps {
  user: any;
  onComplete: () => void;
  onSkip: () => void;
}

export function ProfileCompletion({ user, onComplete, onSkip }: ProfileCompletionProps) {
  const { updateUser } = useApp();
  const [formData, setFormData] = useState({
    phone_number: user.phone_number || '',
    address: user.address || '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Profile info, 2: Password setup

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async () => {
    setError('');
    
    if (!formData.phone_number) {
      setError('Phone number is required');
      return;
    }

    if (formData.phone_number.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      const { response, data } = await apiRequest('/profile/update/', {
        method: 'PUT',
        body: JSON.stringify({
          phone_number: formData.phone_number,
          address: formData.address
        }),
      });

      if (response.ok) {
        // Update user in context
        await updateUser({
          ...user,
          phone_number: formData.phone_number,
          address: formData.address
        });
        
        // Move to password setup step
        setStep(2);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSetup = async () => {
    setError('');
    
    if (formData.password) {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (formData.password) {
        const result = await googleAuthService.setupPassword(formData.password);
        
        if (!result.success) {
          setError(result.error || 'Failed to setup password');
          setIsLoading(false);
          return;
        }
      }
      
      onComplete();
    } catch (error) {
      setError('Failed to setup password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipPassword = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {step === 1 ? (
          // Profile Information Step
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Complete Your Profile
              </h2>
              <p className="text-sm text-gray-600">
                Please provide some additional information to complete your account setup.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <Input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address (Optional)
                </label>
                <Input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={onSkip}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Skip for now
                </Button>
                <Button
                  onClick={handleProfileUpdate}
                  disabled={!formData.phone_number || isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Saving...' : 'Continue'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Password Setup Step
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Set Up Password (Optional)
              </h2>
              <p className="text-sm text-gray-600">
                Create a password to login with email and password in the future.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password (Optional)
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password (min 6 characters)"
                  className="pr-10 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 mt-6"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </>
                    )}
                  </svg>
                </button>
              </div>

              {formData.password && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={handleSkipPassword}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Skip password
                </Button>
                <Button
                  onClick={handlePasswordSetup}
                  disabled={isLoading || (formData.password && !formData.confirmPassword)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Setting up...' : 'Complete Setup'}
                </Button>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              You can always set up a password later from your profile settings.
            </div>
          </>
        )}
      </div>
    </div>
  );
}