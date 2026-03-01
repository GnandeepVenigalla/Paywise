import { ChevronLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacySecurity() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-800">
            <header className="pt-6 pb-4 px-5 bg-white sticky top-0 z-10 flex items-center justify-between shadow-sm border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition">
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-[17px] font-semibold text-gray-800 absolute left-1/2 -translate-x-1/2">Privacy & Security</h1>
                <div className="w-6"></div> {/* Spacer to center title */}
            </header>

            <main className="max-w-3xl mx-auto px-5 pt-8">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                        <Shield className="w-8 h-8 text-slate-900" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">How we protect your data</h2>
                    <p className="text-gray-500 text-[15px] max-w-lg mx-auto leading-relaxed">
                        At Paywise, we take your privacy and security as seriously as the world's leading e-commerce companies. Here is how we collect, use, and protect your personal information.
                    </p>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-slate-900" />
                        1. Information We Collect
                    </h3>
                    <div className="space-y-4 text-[15px] text-gray-600 leading-relaxed">
                        <p>
                            We collect personal information to provide and continually improve our products and services. The types of personal information we collect include:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-gray-800 font-semibold">Information You Give Us:</strong> We receive and store any information you provide in relation to Paywise services, such as your name, email, phone number, and transaction history among friends.</li>
                            <li><strong className="text-gray-800 font-semibold">Automatic Information:</strong> Like many websites, we use "cookies" and other unique identifiers, and we obtain certain types of information when your web browser or device accesses Paywise.</li>
                            <li><strong className="text-gray-800 font-semibold">Information from Other Sources:</strong> We might receive information about you from other sources, such as updated delivery and address information from our carriers, which we use to correct our records.</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-slate-900" />
                        2. How We Secure Your Information
                    </h3>
                    <div className="space-y-4 text-[15px] text-gray-600 leading-relaxed">
                        <p>
                            We design our systems with your security and privacy in mind, utilizing industry-standard practices.
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>We work to protect the security of your personal information during transmission by using encryption protocols and software.</li>
                            <li>We follow the Payment Card Industry Data Security Standard (PCI DSS) when handling credit card data, ensuring the highest level of payment integrity.</li>
                            <li>We maintain physical, electronic, and procedural safeguards in connection with the collection, storage, and disclosure of customer personal information.</li>
                            <li>Our security procedures mean that we may occasionally request proof of identity before we disclose personal information to you.</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-900" />
                        3. Does Paywise Share Your Information?
                    </h3>
                    <div className="space-y-4 text-[15px] text-gray-600 leading-relaxed">
                        <p>
                            Information about our customers is an important part of our business, and we are not in the business of selling our customers' personal information to others.
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-gray-800 font-semibold">Third-Party Service Providers:</strong> We employ other companies and individuals to perform functions on our behalf. Examples include sending email, analyzing data, providing marketing assistance, providing search results, and processing payments. They have access to personal information needed to perform their functions, but may not use it for other purposes.</li>
                            <li><strong className="text-gray-800 font-semibold">Business Transfers:</strong> As we continue to develop our business, we might sell or buy other businesses or services. In such transactions, customer information generally is one of the transferred business assets but remains subject to the promises made in any pre-existing Privacy Notice.</li>
                            <li><strong className="text-gray-800 font-semibold">Protection of Paywise and Others:</strong> We release account and other personal information when we believe release is appropriate to comply with the law; enforce or apply our Terms of Use and other agreements; or protect the rights, property, or safety of Paywise, our users, or others.</li>
                        </ul>
                    </div>
                </div>

                <div className="text-center text-[13px] text-gray-400 font-medium pb-8 uppercase tracking-widest">
                    Last updated: February 2026
                </div>
            </main>
        </div>
    );
}
