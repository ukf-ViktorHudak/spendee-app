import React from 'react';
import { LayoutDashboard, CreditCard, PieChart, Settings, LogOut, Wallet, FileText } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onLogout }) => {
  return (
    <aside className="w-64 bg-card border-r border-gray-800 hidden lg:flex flex-col h-full flex-shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-gray-800/50">
        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
          <Wallet className="text-white w-6 h-6" />
        </div>
        <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">
                Spendee
            </h1>
            <span className="text-xs text-blue-400 font-medium">PC Edition</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3 mt-2">
            Main Menu
        </div>
        <NavItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={currentView === AppView.DASHBOARD} 
            onClick={() => onNavigate(AppView.DASHBOARD)}
        />
        <NavItem 
            icon={<FileText />} 
            label="Statements" 
            active={currentView === AppView.STATEMENTS}
            onClick={() => onNavigate(AppView.STATEMENTS)}
        />
        <NavItem 
            icon={<CreditCard />} 
            label="Transactions" 
            active={currentView === AppView.TRANSACTIONS}
            onClick={() => onNavigate(AppView.TRANSACTIONS)}
        />
        <NavItem 
            icon={<PieChart />} 
            label="Analytics" 
            active={currentView === AppView.ANALYTICS}
            onClick={() => onNavigate(AppView.ANALYTICS)}
        />
        
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3 mt-6">
            Settings
        </div>
        <NavItem 
            icon={<Settings />} 
            label="Preferences" 
            active={currentView === AppView.SETTINGS}
            onClick={() => onNavigate(AppView.SETTINGS)}
        />
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-900/10 rounded-xl transition-colors"
        >
            <LogOut className="w-5 h-5" />
            Sign Out
        </button>
      </div>
    </aside>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`
        flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-xl transition-all
        ${active 
            ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-sm' 
            : 'text-gray-400 hover:text-white hover:bg-[#27272a]'
        }
    `}>
        {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })
            : icon
        }
        {label}
    </button>
);