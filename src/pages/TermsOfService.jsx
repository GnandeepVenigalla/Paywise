import { ChevronLeft, Info, FileText, Scale, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white pb-24 font-sans text-gray-800">
            <header className="pt-6 pb-4 px-5 bg-white sticky top-0 z-10 flex items-center justify-between shadow-sm border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-[17px] font-semibold text-gray-800 absolute left-1/2 -translate-x-1/2">Terms of Service</h1>
                <div className="w-6"></div>
            </header>

            <main className="max-w-3xl mx-auto px-5 pt-8">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                        <Scale className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Terms of Use</h2>
                    <p className="text-gray-500 text-[15px] font-medium leading-relaxed">
                        Please read these terms carefully before using Paywise. By accessing the site, you agree to these conditions.
                    </p>
                </div>

                <div className="space-y-10">
                    <section>
                        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-emerald-600" />
                            1. Acceptance of Terms
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-[15px]">
                            Paywise provides its service to you subject to the following Terms of Service ("TOS"), which may be updated by us from time to time without notice to you. By using the service, you agree to be bound by these terms.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            2. Description of Service
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-[15px]">
                            Paywise is a social expense-sharing platform. We provide users with tools to track shared expenses, split bills, and manage casual loans between individuals. Paywise is not a financial institution or money transmitter.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-600" />
                            3. User Accounts and Conduct
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-[15px]">
                            You are responsible for maintaining the confidentiality of your password and account. You agree to notify Paywise immediately of any unauthorized use of your account. You agree not to use the service for any illegal or unauthorized purpose.
                        </p>
                    </section>
                    
                    <section>
                        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                            <Scale className="w-5 h-5 text-emerald-600" />
                            4. Limitation of Liability
                        </h3>
                        <p className="text-gray-600 leading-relaxed text-[15px]">
                            Paywise shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or the inability to use the service or for cost of procurement of substitute goods and services.
                        </p>
                    </section>

                    <section className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Governing Law</h3>
                        <p className="text-[14px] text-gray-500 italic">
                            These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which GD Enterprises operates, without regard to its conflict of law provisions.
                        </p>
                    </section>
                </div>

                <div className="text-center text-[11px] text-gray-400 font-black mt-16 uppercase tracking-[0.2em] pb-12">
                    Copyright © 2026 Paywise · A GD Enterprises Product
                </div>
            </main>
        </div>
    );
}
