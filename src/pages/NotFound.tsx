import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/ezeywaylogo.png";

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center">
        <img 
          src={logo} 
          alt="ezeyway" 
          className="w-20 h-20 mx-auto mb-4"
        />
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-6">Redirecting to home...</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}