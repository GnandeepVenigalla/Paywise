import { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Receipt, Users, Smartphone, ShieldCheck, ChevronRight, PieChart, Banknote, Zap, Globe, MessageSquare, Mail, Lock } from 'lucide-react';
import logoImg from '../assets/logo.png';
import logoFull from '../assets/logo_full.png';

export default function Landing() {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    // Auto-redirect to dashboard if already logged in
    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-white selection:bg-emerald-100 dark:selection:bg-emerald-950 selection:text-emerald-900">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between transition-all">
                <div className="flex items-center gap-2">
                    <img src={logoImg} alt="Paywise" className="h-8 w-8 object-contain" />
                    <span className="text-[20px] font-black tracking-tight text-slate-900 dark:text-white">Paywise</span>
                </div>
                
                <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 dark:text-slate-400">
                    <button onClick={() => scrollToSection('features')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-none p-0 font-bold">Features</button>
                    <button onClick={() => scrollToSection('how-it-works')} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer bg-transparent border-none p-0 font-bold">How it Works</button>
                    <Link to="/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Security</Link>
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <Link to="/dashboard" className="bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-sm hover:shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="text-slate-600 dark:text-slate-400 font-bold text-sm hover:text-slate-900 dark:text-white transition-colors px-2">Login</Link>
                            <Link to="/register" className="bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-sm hover:shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                                Start for free
                            </Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-gradient-to-b from-emerald-50/30 to-white dark:from-emerald-950/20 dark:to-slate-950">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <Zap className="w-3.5 h-3.5" fill="currentColor" />
                        Smart Bill Splitting & Tracking
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.05] mb-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
                        Split Itemized Bills & <span className="text-emerald-600">Track Shared Expenses</span> Effortlessly.
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700">
                        The smartest way to split bills, track debts, and manage shared group expenses—all in one place. No more manual math or awkward debt conversations.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700">
                        <Link to="/register" className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                            Get Started Free
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                        <button onClick={() => scrollToSection('features')} className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-900 transition-all flex items-center justify-center cursor-pointer">
                            Explore Features
                        </button>
                    </div>

                    {/* App Preview Mockup */}
                    <div className="mt-20 max-w-5xl mx-auto p-4 bg-slate-950 dark:bg-slate-900 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.4)] border-[8px] border-slate-900 dark:border-slate-800 relative">
                        <div className="overflow-hidden rounded-[24px] bg-[#f8fafc] dark:bg-slate-950 border border-slate-800/20">
                           <img src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=1200&h=800" alt="App Dashboard" className="opacity-80 w-full grayscale" />
                           <div className="absolute inset-x-4 inset-y-4 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm rounded-[24px] border border-white/40">
                                <PieChart className="w-16 h-16 text-slate-900 dark:text-white mb-4 animate-bounce" strokeWidth={1} />
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Total Transparency.</h3>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">See every penny, track every spend.</p>
                           </div>
                        </div>
                    </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-20 right-[-10%] w-[50%] h-[50%] bg-emerald-100/30 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/40 blur-[100px] rounded-full -z-10" />
            </section>

            {/* PWA / No App Store Section (Moved to Top) */}
            <section className="py-20 px-6 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-emerald-500/20">
                        <Smartphone className="w-4 h-4" />
                        A Better App Experience
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black mb-8 leading-tight">No App Store Required. <span className="text-emerald-400">No Downloads.</span></h3>
                    <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Paywise is a next-generation Progressive Web App. Skip the search on Play Store or App Store. Simply <span className="text-white font-bold underline decoration-emerald-500 underline-offset-4">add this site to your home screen</span> for a seamless experience.
                    </p>
                    
                    <div className="flex flex-row items-center justify-center gap-3 sm:gap-6 opacity-90">
                        <div className="flex flex-col items-center gap-2">
                             <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-xl sm:text-2xl group hover:border-emerald-500/50 transition-all">
                                <i className="pi pi-google opacity-40 grayscale"></i>
                             </div>
                             <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Play Store</span>
                        </div>
                        
                        <div className="w-4 sm:w-8 h-[1px] bg-slate-800"></div>
                        
                        <div className="flex flex-col items-center gap-2">
                             <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-xl sm:text-2xl group hover:border-emerald-500/50 transition-all">
                                <i className="pi pi-apple opacity-40 grayscale"></i>
                             </div>
                             <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">App Store</span>
                        </div>
                        
                        <div className="w-4 sm:w-8 h-[1px] bg-slate-800"></div>
                        
                        <div className="flex flex-col items-center gap-2">
                             <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-xl sm:text-2xl text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse">
                                <i className="pi pi-check"></i>
                             </div>
                             <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400 font-bold">Direct Install</span>
                        </div>
                    </div>
                </div>
            </section>


            {/* Trusted By Section (Social Proof) */}
            <div className="py-12 border-y border-slate-50 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
                <p className="text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-8">Empowering smart splitters globally</p>
                <div className="flex flex-nowrap items-center gap-12 overflow-x-auto px-6 pb-2 no-scrollbar md:justify-center opacity-40 grayscale">
                    <span className="text-2xl font-bold italic tracking-tighter whitespace-nowrap">Roommates</span>
                    <span className="text-2xl font-bold tracking-tight uppercase whitespace-nowrap">Travelers</span>
                    <span className="text-2xl font-black whitespace-nowrap">Couples</span>
                    <span className="text-2xl font-black tracking-widest whitespace-nowrap">Communities</span>
                    <span className="text-2xl font-serif whitespace-nowrap">Coworkers</span>
                </div>
            </div>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16 px-4">
                    <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">Powerful Features</h2>
                    <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight max-w-2xl mx-auto">
                        Everything you need to manage shared finances.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all group">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Receipt className="w-7 h-7 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Itemized Splitting</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[15px]">
                            Upload receipts and assign individual items to specific people. Perfect for dinners where everyone orders something different.
                        </p>
                    </div>

                    {/* Feature 2: Peer-to-Peer Loans */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Banknote className="w-7 h-7 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">P2P Loans with Interest</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[15px]">
                            Lend money to friends with automated interest tracking. Set a monthly rate and let Paywise handle the compounding math for you.
                        </p>
                    </div>

                    {/* Feature 3: Community Groups */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Users className="w-7 h-7 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Community Splits</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[15px]">
                            Perfect for shared commutes or recurring team lunches. Track turns and cycles to see who is next to pay in your community group.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/10 transition-all group">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Smartphone className="w-7 h-7 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">OCR Receipt Scanning</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[15px]">
                            Our advanced AI scans your printed bills and automatically extracts items, prices, and tax. Just take a photo and split.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 hover:border-slate-800 dark:hover:border-slate-400 hover:shadow-2xl hover:shadow-slate-500/10 transition-all group">
                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <PieChart className="w-7 h-7 text-slate-900 dark:text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Finance Insights</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[15px]">
                            Get visual charts of your monthly spending habits. See who spends the most and where your money is going in every group.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all group">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-7 h-7 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Bank-Grade Security</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[15px]">
                            Your financial data is protected by end-to-end encryption and biometric locks. We keep your splits private and your money secure.
                        </p>
                    </div>

                </div>
            </section>

            {/* Mission / Security Section */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 items-center gap-16 relative z-10">
                    <div>
                        <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-4">Security First</h2>
                        <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-8 leading-tight">
                            Your financial trust is our <span className="text-emerald-400">top priority.</span>
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="mt-1 flex-shrink-0">
                                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[18px] font-bold mb-1">Bank-Level Encryption</p>
                                    <p className="text-slate-400 leading-relaxed">All transaction data is encrypted and stored securely using industry-standard protocols.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 flex-shrink-0">
                                    <Lock className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[18px] font-bold mb-1">Private & Anonymous</p>
                                    <p className="text-slate-400 leading-relaxed">We never sell your data. We only use information to provide and improve Paywise services.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 flex-shrink-0">
                                    <Globe className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[18px] font-bold mb-1">GDPR & Policy Compliant</p>
                                    <p className="text-slate-400 leading-relaxed">We strictly adhere to global privacy standards and are optimized for Google AdSense program policies.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12">
                            <Link to="/register" className="bg-white text-slate-900 dark:text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-50 hover:shadow-emerald-500/20 transition-all flex items-center justify-center sm:inline-flex gap-2">
                                Join Paywise Today
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute -inset-4 bg-emerald-500/10 blur-[100px] rounded-full" />
                        <div className="relative bg-slate-800 p-6 rounded-[40px] border border-slate-700 shadow-2xl">
                             <div className="bg-slate-900 rounded-[28px] p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <i className="pi pi-shield text-slate-100"></i>
                                        </div>
                                        <span className="font-bold text-slate-100">Active Protection</span>
                                    </div>
                                    <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">Secure</div>
                                </div>
                                <p className="text-slate-300 font-medium mb-6 leading-relaxed">Paywise designed its infrastructure to ensure complete isolation of user financial metadata, providing a robust layer against data breaches.</p>
                                <div className="space-y-3">
                                    <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[94%]" />
                                    </div>
                                    <div className="flex justify-between text-[11px] font-black text-slate-500 dark:text-slate-400">
                                        <span>ENCRYPTION STATUS</span>
                                        <span>94.8% OPTIMIZED</span>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            
            {/* Meet the Team */}
            <section className="py-24 bg-white dark:bg-slate-950 px-6 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500 mb-4">From the Founders</h2>
                    <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight max-w-2xl mx-auto mb-8">
                        Built for the community, <br className="hidden md:block"/>by GD Enterprises.
                    </p>
                    <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto mb-16 leading-relaxed">
                        "We are so excited to have you in our Paywise economy! Our goal is to eliminate the awkwardness in sharing finances so you can focus entirely on the experiences that matter most."
                    </p>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-12">
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-emerald-50 dark:border-emerald-900/30 flex items-center justify-center font-bold text-3xl text-emerald-600 dark:text-emerald-400 shadow-xl shadow-emerald-500/10">
                                GV
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Gnandeep Venigalla</h3>
                            <p className="text-emerald-600 dark:text-emerald-500 font-black text-[11px] uppercase tracking-widest mt-1">Founder, GD Enterprises</p>
                        </div>
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-blue-50 dark:border-blue-900/30 flex items-center justify-center font-bold text-3xl text-blue-600 dark:text-blue-400 shadow-xl shadow-blue-500/10">
                                SS
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sai Sujitha</h3>
                            <p className="text-blue-600 dark:text-blue-400 font-black text-[11px] uppercase tracking-widest mt-1">CEO, Paywise App</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works Step-by-Step */}
            <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center mb-20 px-4">
                    <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4">The Process</h2>
                    <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight max-w-2xl mx-auto">
                        Simple steps to debt-free relationships.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                    {/* Decorator line */}
                    <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-slate-100 dark:bg-slate-800 -z-10" />

                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-sm">1</div>
                        <h4 className="text-lg font-bold mb-3">Add Expenses</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Scan a bill or add an expense manually. Assign items or split equally.</p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-sm">2</div>
                        <h4 className="text-lg font-bold mb-3">Notify Friends</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Everyone gets a notification. No manual texts needed. Balances update instantly.</p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black mb-6 shadow-2xl">3</div>
                        <h4 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">Settle Up</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Mark as paid and you're good to go. The easiest way to stay friends.</p>
                    </div>
                </div>

                {/* Additional Public Content for AdSense Approval */}
                <div className="mt-40 grid grid-cols-1 lg:grid-cols-2 gap-20">
                    <div>
                        <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-4">Common Questions</h2>
                        <h3 className="text-3xl font-black tracking-tight mb-8">Frequently Asked <span className="text-emerald-600">Questions.</span></h3>
                        
                        <div className="space-y-6">
                            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                                <p className="font-bold text-slate-900 dark:text-white mb-2">How much does Paywise cost?</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Paywise is completely free for individual users and small groups. We aim to keep our core features free forever, supported by minimal non-intrusive advertisements via Google AdSense.</p>
                            </div>
                            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                                <p className="font-bold text-slate-900 dark:text-white mb-2">Do I need a credit card to join?</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">No. You can sign up with just an email address. We don't handle payments directly—we only track debts and share records between friends.</p>
                            </div>
                            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                                <p className="font-bold text-slate-900 dark:text-white mb-2">Can I use Paywise for business?</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Yes! Many small businesses use our Katha feature to track merchant dues and invoice status effortlessly. Our group tracking is also great for shared business projects.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-8 md:p-12 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-inner">
                        <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-4">Contact Support</h2>
                        <h3 className="text-3xl font-black tracking-tight mb-8">Get in touch with the <span className="text-slate-900 dark:text-white leading-normal border-b-4 border-emerald-400 pb-1">Paywise team.</span></h3>
                        
                        <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">Have a question that's not answered here? Our support team is ready to help you split your way to clarity.</p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-[20px] border border-slate-200 dark:border-slate-800">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Support</p>
                                    <p className="font-bold text-slate-900 dark:text-white">support@paywiseapp.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white p-4 rounded-[20px] border border-slate-200">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">In-App Chat</p>
                                    <p className="font-bold text-slate-900 dark:text-white">Available 24/7 for account users</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                            A GD Enterprises Product
                        </div>
                    </div>
                </div>
            </section>


            {/* Footer */}
            <footer className="bg-slate-50 dark:bg-slate-900 pt-20 pb-12 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 px-6">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <img src={logoImg} alt="Paywise" className="h-8 w-8" />
                            <span className="text-[20px] font-black tracking-tighter text-slate-900 dark:text-white">Paywise</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                            Paywise is a premium social expense-sharing platform designed for transparency and trust. Part of the GD Enterprises family.
                        </p>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:text-white cursor-pointer transition-colors shadow-sm">
                                <i className="pi pi-twitter"></i>
                            </div>
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:text-white cursor-pointer transition-colors shadow-sm">
                                <i className="pi pi-facebook"></i>
                            </div>
                            <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:text-white cursor-pointer transition-colors shadow-sm">
                                <i className="pi pi-instagram"></i>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h5 className="font-bold text-slate-900 dark:text-white mb-6">Features</h5>
                        <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-slate-900 dark:text-white transition-colors bg-transparent border-none p-0 font-medium cursor-pointer">Itemized Split</button></li>
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-slate-900 dark:text-white transition-colors bg-transparent border-none p-0 font-medium cursor-pointer">OCR Scan</button></li>
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-slate-900 dark:text-white transition-colors bg-transparent border-none p-0 font-medium cursor-pointer">Group Tracking</button></li>
                            <li><button onClick={() => scrollToSection('features')} className="hover:text-slate-900 dark:text-white transition-colors bg-transparent border-none p-0 font-medium cursor-pointer">Monthly Insights</button></li>
                        </ul>
                    </div>

                    <div>
                        <h5 className="font-bold text-slate-900 dark:text-white mb-6">Company</h5>
                        <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <li><Link to="/about" className="hover:text-slate-900 dark:text-white transition-colors">About Paywise</Link></li>
                            <li><Link to="/account/help" className="hover:text-slate-900 dark:text-white transition-colors">Support Center</Link></li>
                            <li><Link to="/invite" className="hover:text-slate-900 dark:text-white transition-colors">Refer a Friend</Link></li>
                            <li><Link to="/beta" className="hover:text-slate-900 dark:text-white transition-colors">Beta Program</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h5 className="font-bold text-slate-900 dark:text-white mb-6">Legal</h5>
                        <ul className="space-y-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <li><Link to="/privacy" className="hover:text-slate-900 dark:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-slate-900 dark:text-white transition-colors">Terms of Service</Link></li>
                            <li><a href="/ads.txt" className="hover:text-slate-900 dark:text-white transition-colors">Ads Transparency</a></li>
                            <li className="pt-2">
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border border-emerald-100">PCI Compliant</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-200/60 pt-10 px-6">
                    <p className="text-slate-400 text-xs font-medium">
                        © 2026 Paywise App. All rights reserved. Built with ❤️ for transparency.
                    </p>
                    <div className="flex items-center gap-6 text-xs font-bold text-slate-400 tracking-wide uppercase">
                        <span className="hover:text-slate-900 dark:text-white cursor-pointer transition-colors">English</span>
                        <span className="hover:text-slate-900 dark:text-white cursor-pointer transition-colors">Security</span>
                        <span className="hover:text-slate-900 dark:text-white cursor-pointer transition-colors">GD Enterprises</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
