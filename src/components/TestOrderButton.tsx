import { Button } from '@/components/ui/button';

export function TestOrderButton() {
  const testPendingOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Testing with token:', token);
      
      const response = await fetch('${API_BASE}/orders/vendor/pending/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const orders = await response.json();
        console.log('Pending orders:', orders);
      } else {
        const error = await response.text();
        console.error('Error response:', error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  return (
    <Button onClick={testPendingOrders} className="mb-4">
      Test Pending Orders API
    </Button>
  );
}