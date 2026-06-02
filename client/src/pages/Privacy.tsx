import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500 transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <Logo size="small" />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                <div className="prose prose-gray max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            GiveLive ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Personal Information</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We may collect personal information that you voluntarily provide to us when you:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li>Register for an account</li>
                            <li>Make a donation or payment</li>
                            <li>Contact us for support</li>
                            <li>Subscribe to our newsletter</li>
                            <li>Participate in surveys or promotions</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            This information may include: name, email address, phone number, payment information, and any other information you choose to provide.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Automatically Collected Information</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            When you access our platform, we automatically collect certain information about your device, including:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li>IP address</li>
                            <li>Browser type and version</li>
                            <li>Operating system</li>
                            <li>Access times and pages viewed</li>
                            <li>Device identifiers</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li>Provide, operate, and maintain our services</li>
                            <li>Process transactions and send related information</li>
                            <li>Send administrative information, updates, and security alerts</li>
                            <li>Respond to your comments, questions, and requests</li>
                            <li>Analyze usage trends and improve our platform</li>
                            <li>Prevent fraud and enhance security</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Information Sharing and Disclosure</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We do not sell your personal information. We may share your information with:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li><strong>Service Providers:</strong> Third-party companies that perform services on our behalf (payment processing, analytics, email delivery)</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                            <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We implement appropriate technical and organizational security measures to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Depending on your location, you may have certain rights regarding your personal information:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li>Access and receive a copy of your personal data</li>
                            <li>Rectify inaccurate or incomplete information</li>
                            <li>Request deletion of your personal data</li>
                            <li>Object to or restrict processing of your data</li>
                            <li>Withdraw consent where processing is based on consent</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking Technologies</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            Email: privacy@givelive.app<br />
                            Address: [Your Business Address]
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
