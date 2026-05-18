import React from 'react';
import { 
  Package, 
  Brain, 
  ShieldCheck, 
  FileText, 
  Globe, 
  MessageSquare, 
  Star, 
  Key,
  ChevronRight,
  Play,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  Network
} from 'lucide-react';

export default function DashboardPage() {
  const features = [
    { icon: <Package className="w-6 h-6 text-[#22c55e]" />, title: "Inventory Management", desc: "Smart tracking of goods with automated low-stock alerts." },
    { icon: <Brain className="w-6 h-6 text-[#4ade80]" />, title: "AI Demand Prediction", desc: "Forecast future demand accurately using Random Forest ML models." },
    { icon: <ShieldCheck className="w-6 h-6 text-[#22c55e]" />, title: "Blockchain Security", desc: "Immutable and verifiable transactions powered by Ethereum." },
    { icon: <FileText className="w-6 h-6 text-[#4ade80]" />, title: "Billing & Transactions", desc: "Seamless financial operations and wholesale invoice management." },
    { icon: <Globe className="w-6 h-6 text-[#22c55e]" />, title: "Supply Chain Monitoring", desc: "End-to-end visibility across your entire distribution network." },
    { icon: <MessageSquare className="w-6 h-6 text-[#4ade80]" />, title: "Real-Time Messaging", desc: "Instant communication with partners via Socket.io." },
    { icon: <Star className="w-6 h-6 text-[#22c55e]" />, title: "Customer Feedback", desc: "Collect and analyze client satisfaction directly on-platform." },
    { icon: <Key className="w-6 h-6 text-[#4ade80]" />, title: "Secure Authentication", desc: "Role-based access controls to safeguard sensitive business data." }
  ];

  const techStack = [
    "React.js", "Node.js", "Express.js", "PostgreSQL", 
    "Python", "Random Forest ML", "Ethereum", "Socket.io", "Electron.js"
  ];

  const aboutCards = [
    { title: "Inventory", icon: <Layers className="w-8 h-8 mb-4 text-[#22c55e]" />, desc: "Automated ERP control." },
    { title: "AI Core", icon: <Cpu className="w-8 h-8 mb-4 text-[#22c55e]" />, desc: "Smart predictive models." },
    { title: "Blockchain", icon: <Database className="w-8 h-8 mb-4 text-[#22c55e]" />, desc: "Decentralized verification." },
    { title: "Network", icon: <Network className="w-8 h-8 mb-4 text-[#22c55e]" />, desc: "Real-time communication." }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-poppins overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif; }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 10px 40px -10px rgba(34, 197, 94, 0.08);
        }
        
        .glass-card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -10px rgba(34, 197, 94, 0.15);
          border-color: rgba(74, 222, 128, 0.4);
        }

        .float-animation { animation: float 6s ease-in-out infinite; }
        .float-delayed { animation: float 6s ease-in-out 3s infinite; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .blob {
          position: absolute;
          filter: blur(100px);
          z-index: 0;
          opacity: 0.5;
        }

        /* Custom Scrollbar for smooth look */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #86efac; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #4ade80; }
      `}</style>

      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="blob bg-[#dcfce7] w-[600px] h-[600px] rounded-full top-[-10%] left-[-10%]" />
        <div className="blob bg-[#f0fdf4] w-[700px] h-[700px] rounded-full bottom-[-20%] right-[-10%]" />
        <div className="blob bg-[#86efac] opacity-20 w-[500px] h-[500px] rounded-full top-[30%] left-[50%]" />
      </div>

      <div className="relative z-10">
        
        {/* 1. Hero Section */}
        <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white glass-card text-[#22c55e] font-medium mb-6 border border-[#86efac]">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              Welcome to the Future of ERP
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-slate-800 leading-tight">
              Business Logic,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] to-[#4ade80]">Reimagined.</span>
            </h1>
            
            <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              TradeCore is an intelligent business ecosystem platform combining Inventory Management, AI Demand Prediction, and Ethereum Blockchain Security in one unified hub.
            </p>
            

          </div>

          <div className="flex-1 relative w-full h-[500px] flex items-center justify-center mt-10 lg:mt-0">
            {/* Main Logo */}
            <div className="absolute float-animation z-20">
              <div className="w-72 h-72 bg-white/80 backdrop-blur-md rounded-[40px] shadow-2xl p-10 flex items-center justify-center border border-white relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#86efac]/20 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                <img src="/assets/log1.png" alt="TradeCore Logo" className="w-full h-full object-contain relative z-10 drop-shadow-xl" />
              </div>
            </div>
            
            {/* TCG Server Logo */}
            <div className="absolute float-delayed z-30 bottom-12 right-4 lg:-right-4">
              <div className="w-44 h-44 glass-card rounded-[32px] p-6 flex flex-col items-center justify-center border border-white">
                <img src="/PROJECT-X/TCG_logo.png" alt="TradeChainGuardian Logo" className="w-16 h-16 object-contain mb-3 drop-shadow-md" />
                <span className="text-[11px] font-bold text-center text-slate-600 leading-tight">TradeChain<br/>Guardian</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. About Platform Section */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Core Infrastructure</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">A seamless blend of modern web technologies, machine learning, and decentralized verification.</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {aboutCards.map((card, idx) => (
              <div key={idx} className="glass-card rounded-[24px] p-8 text-center glass-card-hover transition-all duration-300">
                <div className="flex justify-center">{card.icon}</div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">{card.title}</h3>
                <p className="text-sm text-slate-500">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Features Section */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Powerful Features</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Everything you need to run, monitor, and scale your trading and supply operations.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#22c55e]/10 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-[#f0fdf4] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Technology Stack Section */}
        <section className="py-24 px-6 max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-10">Built with Modern Tech</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {techStack.map((tech, idx) => (
              <div 
                key={idx}
                className="px-6 py-3 bg-white border border-[#bbf7d0] rounded-full text-slate-700 font-medium shadow-sm hover:bg-[#22c55e] hover:text-white hover:border-[#22c55e] transition-colors cursor-default"
              >
                {tech}
              </div>
            ))}
          </div>
        </section>

        {/* 5. Mission Section */}
        <section className="py-32 px-6 my-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#dcfce7] to-[#f0fdf4] opacity-70" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-[#166534] mb-8">Our Mission</h2>
            <p className="text-xl lg:text-2xl text-slate-700 leading-relaxed font-light">
              "To empower global supply chains by providing a single, unified ecosystem where predictive artificial intelligence meets the uncompromising security of decentralized blockchain verification."
            </p>
          </div>
        </section>

      </div>

      {/* 6. Footer */}
      <footer className="relative z-10 glass-card border-t border-white/50 py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/assets/log1.png" alt="TradeCore" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold text-slate-800">TradeCore</span>
          </div>
          
          <div className="text-sm text-slate-500 font-medium px-4 py-2 bg-[#f0fdf4] rounded-full">
            Powered by AI & Blockchain
          </div>
          
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} TradeCore Ecosystem. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}