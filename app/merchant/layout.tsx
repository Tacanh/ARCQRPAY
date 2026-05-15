'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, Receipt, Settings, LogOut, QrCode } from "lucide-react";

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [merchantName, setMerchantName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem('arc_merchant');
    if (stored) {
      try {
        const { name } = JSON.parse(stored);
        setMerchantName(name);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
      isActive 
        ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold" 
        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
    }`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row font-sans text-zinc-900 dark:text-zinc-50">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">Merchant</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/merchant" className={getLinkClass("/merchant")}>
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link href="/merchant/pos" className={getLinkClass("/merchant/pos")}>
            <Store className="w-5 h-5" />
            <span>Point of Sale</span>
          </Link>
          <Link href="/merchant/transactions" className={getLinkClass("/merchant/transactions")}>
            <Receipt className="w-5 h-5" />
            <span>Transactions</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-8 shrink-0 hidden md:flex">
          <h1 className="text-lg font-semibold">
            {pathname === '/merchant' ? 'Store Overview' : 
             pathname === '/merchant/pos' ? 'Point of Sale' : 
             pathname === '/merchant/transactions' ? 'Transactions' : 'Store'}
          </h1>
          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-bold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              {merchantName ? merchantName.charAt(0).toUpperCase() : 'M'}
            </button>
            
            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 top-10 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{merchantName}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">Store Administrator</p>
                  </div>
                  <div className="py-1">
                    <Link 
                      href="#" 
                      className="flex items-center px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Link>
                    <Link 
                      href="/" 
                      className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>
        <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
