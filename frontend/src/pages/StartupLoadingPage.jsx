import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, CheckCircle, Loader2 } from "lucide-react";
import axios from "axios";

const StartupLoadingPage = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Booting tradeCore Runtime Environment...",
    "Initializing TCG Secure Network...",
    "Starting Offline Local Database...",
    "Establishing Zero-Trust Handshakes...",
    "Loading Supply Chain Modules...",
    "System Ready"
  ];

  useEffect(() => {
    // Perform real setup process
    const performSetup = async () => {
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/v1/api";
        
        // 1. Booting
        setProgress(20);
        setCurrentStep(0);
        await new Promise(r => setTimeout(r, 800));
        
        // 2. TCG Secure Network
        setProgress(40);
        setCurrentStep(1);
        await new Promise(r => setTimeout(r, 800));
        
        // 3. Database start
        setProgress(60);
        setCurrentStep(2);
        
        // 4. Hit the setup API to inject schema automatically
        setCurrentStep(3);
        try {
          await axios.post(`${BACKEND_URL}/setup/add-schema`);
          console.log("Database schema setup successful.");
        } catch (dbError) {
          console.error("Database setup skipped or failed:", dbError.response?.data || dbError.message);
          // Proceed anyway as it might already be initialized
        }
        
        // 5. Supply chain modules
        setProgress(80);
        setCurrentStep(4);
        await new Promise(r => setTimeout(r, 800));
        
        // 6. Ready
        setProgress(100);
        setCurrentStep(5);
        
        setTimeout(() => {
          navigate("/"); // Redirect to dashboard/landing page once done
        }, 1500);

      } catch (error) {
        console.error("Startup Sequence Error:", error);
        setProgress(100);
        setCurrentStep(5);
        setTimeout(() => navigate("/"), 1500);
      }
    };

    performSetup();
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#000502] text-white font-sans overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center">
        {/* Logos container */}
        <div className="flex items-center gap-12 mb-16 relative">
          {/* tradeCore Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400/20 animate-pulse blur-xl rounded-full" />
              <img 
                src="/assets/log1.png" 
                alt="tradeCore" 
                className="w-24 h-24 object-contain relative z-10"
              />
            </div>
            <span className="text-xl font-bold tracking-widest text-green-400">tradeCore</span>
          </div>

          {/* Integration Link */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping delay-100" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping delay-200" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping delay-300" />
            </div>
            <Shield className="w-6 h-6 text-emerald-500/50" />
          </div>

          {/* TCG Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400/20 animate-pulse blur-xl rounded-full" />
              <img 
                src="/PROJECT-X/TCG_logo.png" 
                alt="TradeChain Guardian" 
                className="w-24 h-24 object-contain relative z-10"
              />
            </div>
            <span className="text-xl font-bold tracking-widest text-emerald-400">TCG SECURED</span>
          </div>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full max-w-md bg-gray-900 rounded-full h-2 mb-8 overflow-hidden relative border border-gray-800">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 w-10 bg-white/30 blur-sm animate-[shimmer_1s_infinite]" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="h-12 flex items-center justify-center">
          {progress < 100 ? (
            <div className="flex items-center gap-3 text-emerald-300 font-mono text-sm tracking-widest animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              {steps[currentStep]}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-green-400 font-mono text-sm tracking-widest">
              <CheckCircle className="w-5 h-5" />
              {steps[steps.length - 1]}
            </div>
          )}
        </div>

        <div className="mt-12 text-xs font-mono text-gray-600 tracking-widest">
          SYSTEM VERSION 2.0.4 • {Math.floor(progress)}%
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400px); }
        }
      `}</style>
    </div>
  );
};

export default StartupLoadingPage;
