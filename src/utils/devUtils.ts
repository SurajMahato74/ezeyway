// Development utilities
export const isDevelopment = () => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

export const checkBackendHealth = async (): Promise<boolean> => {
  if (!isDevelopment()) return true; // Skip check in production
  
  try {
    const response = await fetch('http://localhost:8000/api/health/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
};

export const showBackendWarning = () => {
  if (!isDevelopment()) return;
  
  const warningDiv = document.createElement('div');
  warningDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f59e0b;
      color: white;
      padding: 8px 16px;
      text-align: center;
      z-index: 9999;
      font-size: 14px;
      font-weight: 500;
    ">
      ⚠️ Backend server not running on localhost:8000. Please start your Django server.
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: none;
        border: none;
        color: white;
        margin-left: 16px;
        cursor: pointer;
        font-size: 16px;
      ">×</button>
    </div>
  `;
  document.body.appendChild(warningDiv);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (warningDiv.parentElement) {
      warningDiv.remove();
    }
  }, 10000);
};