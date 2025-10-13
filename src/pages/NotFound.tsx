import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-emerald-600 to-blue-600 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Particles Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl animate-float top-10 left-10" />
        <div className="absolute w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-float-delayed bottom-20 right-20" />
      </div>

      {/* Main Content */}
      <div className="relative bg-white/10 backdrop-blur-xl w-full max-w-sm rounded-2xl p-10 text-center shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-1000">
        {/* Logo Container */}
        <div className="relative w-28 h-28 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-xl transform transition-all duration-700 hover:scale-110 hover:rotate-3">
          <span className="text-6xl drop-shadow-lg animate-pulse-subtle">🛒</span>
        </div>

        {/* Title and Tagline */}
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 to-emerald-100 tracking-tight mb-3">
          KathSnap
        </h1>
        <p className="text-white/90 text-lg font-medium tracking-wide leading-relaxed">
          Swift Shopping, Delivered to Your Door
        </p>
      </div>

      {/* Loading Indicator */}
      <div className="absolute bottom-16 flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-t-transparent border-white/95 rounded-full animate-spin mb-4 shadow-lg" />
        <p className="text-white/85 text-sm font-medium tracking-wide animate-pulse-subtle">
          Preparing Your Shopping Journey...
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(20px) translateX(-10px); }
        }
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.03); opacity: 0.9; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};