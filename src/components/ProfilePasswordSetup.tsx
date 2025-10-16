import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { googleAuthService } from '@/services/googleAuth';

export function ProfilePasswordSetup() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [hasGoogleAccount, setHasGoogleAccount] = useState(false);

  useEffect(() => {
    checkPasswordSetupStatus();
  }, []);

  const checkPasswordSetupStatus = async () => {
    // Skip password setup check - component will be hidden by default
    setNeedsPasswordSetup(false);
    setHasGoogleAccount(false);
  };

  const handleSetupPassword = async () => {
    setError('');
    setSuccess('');
    
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
        setSuccess('Password set successfully! You can now login with email and password.');
        setNeedsPasswordSetup(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Failed to setup password');
      }
    } catch (error) {
      setError('Failed to setup password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!needsPasswordSetup || !hasGoogleAccount) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Set Up Password for Traditional Login
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            You signed up with Google. Set up a password to also login with email and password.
          </p>
          
          <div className="space-y-3">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                className="pr-10 bg-white"
                size="sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="bg-white"
              size="sm"
            />

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            
            {success && (
              <p className="text-green-600 text-sm">{success}</p>
            )}

            <Button
              onClick={handleSetupPassword}
              disabled={!password || !confirmPassword || isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Setting up...' : 'Set Password'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}