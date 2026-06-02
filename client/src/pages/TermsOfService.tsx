import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';

export default function TermsOfService() {
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
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
                <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                <div className="prose prose-gray max-w-none">
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            By accessing or using GiveLive ("Service," "Platform," "we," "us," or "our"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you do not have permission to access the Service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Use of Service</h2>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Eligibility</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You must be at least 18 years old to use our Service. By using the Service, you represent and warrant that you meet this age requirement.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Registration</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding your account credentials and for all activities that occur under your account.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Acceptable Use</h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You agree not to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li>Use the Service for any illegal purpose or in violation of any laws</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Transmit viruses, malware, or other harmful code</li>
                            <li>Attempt to gain unauthorized access to the Service</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Collect or harvest user information without consent</li>
                            <li>Use the Service to distribute spam or unsolicited messages</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Donations and Payments</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            All donations made through our Platform are processed securely through third-party payment processors. By making a donation, you agree to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                            <li>Provide accurate payment information</li>
                            <li>Authorize us to charge your selected payment method</li>
                            <li>Understand that donations are typically non-refundable unless required by law</li>
                            <li>Review and comply with the terms of our payment processors</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            The Service and its original content, features, and functionality are owned by GiveLive and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                        </p>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of our material without prior written consent.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">User Content</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You retain ownership of any content you submit, post, or display on or through the Service ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in connection with operating and promoting the Service.
                        </p>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You represent and warrant that you own or have the necessary rights to all User Content you submit and that such content does not violate any third-party rights.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.
                        </p>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Upon termination, your right to use the Service will immediately cease. All provisions of these Terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimer of Warranties</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            IN NO EVENT SHALL GIVELIVE, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Indemnification</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            You agree to indemnify and hold harmless GiveLive and its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorneys' fees) arising out of your use of the Service or violation of these Terms.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. Continued use of the Service after changes become effective constitutes acceptance of the revised Terms.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            If you have any questions about these Terms, please contact us at:
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            Email: legal@givelive.app<br />
                            Address: [Your Business Address]
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
