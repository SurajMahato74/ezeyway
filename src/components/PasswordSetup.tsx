import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { googleAuthService } from '@/services/googleAuth';

interface PasswordSetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function PasswordSetup({ onComplete, onSkip }: PasswordSetupProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetupPassword = async () => {
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await googleAuthService.setupPassword(password);
      
      if (result.success) {
        onComplete();
      } else {
        setError(result.error || 'Failed to setup password');
      }
    } catch (error) {
      setError('Failed to setup password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Set Up Password (Optional)
          </h2>
          <p className="text-sm text-gray-600">
            You can set up a password to login with email and password in the future.
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 6 characters)"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
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

          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
          />

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
              onClick={handleSetupPassword}
              disabled={!password || !confirmPassword || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Setting up...' : 'Set Password'}
            </Button>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          You can always set up a password later from your profile settings.
        </div>
      </div>
    </div>
  );
}