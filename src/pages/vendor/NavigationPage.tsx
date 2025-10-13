import React from 'react';
import ReactDOM from 'react-dom';

const NavigationPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<string>('home');
  
  // Sample notification count for the Messages tab
  const notificationCount = 3;

  return (
    <div className="bg-gray-100 min-h-screen p-4 text-gray-800">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-orange-600">Navigation Page</h1>
        <p className="text-sm mt-2">Active Tab: <span className="font-semibold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span></p>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-lg p-3 flex justify-around items-center border-t border-gray-200">
        <button
          className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
            activeTab === 'home' ? 'text-orange-600 scale-110' : 'text-gray-600 hover:text-orange-500'
          }`}
          onClick={() => setActiveTab('home')}
        >
          <span className="material-icons text-2xl">home</span>
          <span className="text-xs font-medium">Home</span>
        </button>
        <button
          className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
            activeTab === 'tools' ? 'text-orange-600 scale-110' : 'text-gray-600 hover:text-orange-500'
          }`}
          onClick={() => setActiveTab('tools')}
        >
          <span className="material-icons text-2xl">build</span>
          <span className="text-xs font-medium">Tools</span>
        </button>
        <button
          className={`flex flex-col items-center space-y-1 relative transition-all duration-300 ${
            activeTab === 'messages' ? 'text-orange-600 scale-110' : 'text-gray-600 hover:text-orange-500'
          }`}
          onClick={() => setActiveTab('messages')}
        >
          <span className="material-icons text-2xl">chat</span>
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
          <span className="text-xs font-medium">Messages</span>
        </button>
        <button
          className={`flex flex-col items-center space-y-1 transition-all duration-300 ${
            activeTab === 'me' ? 'text-orange-600 scale-110' : 'text-gray-600 hover:text-orange-500'
          }`}
          onClick={() => setActiveTab('me')}
        >
          <span className="material-icons text-2xl">person</span>
          <span className="text-xs font-medium">Me</span>
        </button>
      </nav>
    </div>
  );
};

ReactDOM.render(<NavigationPage />, document.getElementById('root'));