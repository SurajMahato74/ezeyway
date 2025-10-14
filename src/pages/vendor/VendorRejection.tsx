import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface RejectionState {
  rejectionReason: string | null;
  rejectionDate: string | null;
}

export default function VendorRejection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { rejectionReason, rejectionDate } = location.state as RejectionState || {};

  const handleUpdateApplication = () => {
    navigate('/vendor/onboarding', { state: { isUpdate: true } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Application Rejected
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your vendor application has been rejected. Please review the feedback below and update your application.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Rejection Details</h3>
          
          {rejectionDate && (
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-500">Rejected on: </span>
              <span className="text-sm text-gray-900">
                {new Date(rejectionDate).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="mb-6">
            <span className="text-sm font-medium text-gray-500">Reason for rejection:</span>
            <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                {rejectionReason || 'No specific reason provided. Please contact support for more details.'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  What's next?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Please review the rejection reason above and update your application accordingly. 
                    You can modify your business information, upload new documents, or make any other 
                    necessary changes before resubmitting.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleUpdateApplication}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Update Application
            </Button>
            <Button
              onClick={() => navigate('/vendor/login')}
              variant="outline"
              className="flex-1"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}