import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyAuthentication, fixAuthenticationIssues } from '@/utils/authVerification';

export function AuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runVerification = async () => {
    setLoading(true);
    try {
      const result = await verifyAuthentication();
      setDebugInfo(result);
    } catch (error) {
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fixAuth = async () => {
    setLoading(true);
    try {
      const fixed = await fixAuthenticationIssues();
      console.log('Fix result:', fixed);
      // Re-run verification after fix
      await runVerification();
    } catch (error) {
      console.error('Fix failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runVerification} disabled={loading}>
            {loading ? 'Checking...' : 'Verify Auth'}
          </Button>
          <Button onClick={fixAuth} disabled={loading} variant="outline">
            Fix Auth Issues
          </Button>
        </div>
        
        {debugInfo && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}