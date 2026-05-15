import Link from "next/link";
import { ArrowRight, QrCode, ShieldCheck, Wallet, Store, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
      {/* Navigation */}
      <header className="fixed top-0 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">ArcQRPay</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition">Features</a>
            <a href="#how-it-works" className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition">How it Works</a>
            <div className="flex items-center gap-4">
              <Link href="/merchant" className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
                Merchant Login
              </Link>
              <Link href="/wallet" className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-500/25">
                Open Wallet
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 px-6">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[100px] pointer-events-none"></div>
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 border border-blue-100 dark:border-blue-500/20">
              <SparklesIcon className="w-4 h-4" />
              <span>Web3 Retail POS System</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
              The Future of <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">In-Store Crypto Payments</span>
            </h1>
            
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Seamless, secure, and instant biometric payments. ArcQRPay bridges the gap between Web3 wallets and physical retail with FaceID-secured passkeys.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/wallet" className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-zinc-900 dark:bg-white px-8 text-base font-semibold text-white dark:text-zinc-900 transition-all hover:scale-105 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-white/10">
                Launch Consumer Wallet
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/merchant" className="flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-full border-2 border-zinc-200 dark:border-zinc-800 px-8 text-base font-semibold transition-all hover:border-zinc-900 dark:hover:border-zinc-100">
                <Store className="w-5 h-5" />
                Merchant Dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 bg-zinc-100 dark:bg-zinc-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Modern Commerce</h2>
              <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">Everything you need to accept crypto in your retail store seamlessly and securely.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
                title="Biometric Passkeys"
                description="Passwordless authentication using FaceID and TouchID via the Dynamic SDK and Circle wallets."
              />
              <FeatureCard 
                icon={<Zap className="w-6 h-6 text-amber-500" />}
                title="Instant Settlement"
                description="Lightning-fast local network QR scanning for immediate transaction verification at checkout."
              />
              <FeatureCard 
                icon={<Wallet className="w-6 h-6 text-blue-500" />}
                title="Smart ID Wallets"
                description="Consumer-controlled wallets abstracted behind a simple, intuitive mobile interface."
              />
            </div>
          </div>
        </section>

        {/* Two-Sided Market Section */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16">
            <div className="group p-8 rounded-3xl bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-6">
                <Store className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">For Merchants</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                Transform any device into a powerful Web3 Point of Sale. Generate dynamic QR codes for instant payments, track analytics, and manage settlements in real-time.
              </p>
              <Link href="/merchant" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all">
                Open POS System <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="group p-8 rounded-3xl bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/20 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/50 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-6">
                <Wallet className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4">For Consumers</h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                Pay with a scan. Your self-custodial wallet is secured by your device's biometrics. No seed phrases to remember, no complex transactions to sign manually.
              </p>
              <Link href="/wallet" className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold group-hover:gap-3 transition-all">
                Access Smart Wallet <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-zinc-400" />
            <span className="font-semibold text-zinc-400">ArcQRPay</span>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} ArcQRPay. A Web3 Retail POS System.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
