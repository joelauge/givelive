import { useState } from 'react';
import { Settings, Key, Link2, AlertCircle, Info, ExternalLink, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { api } from '../../api';

interface IntegrationNodeEditorProps {
    data: any;
    onUpdate: (data: any) => void;
}

export default function IntegrationNodeEditor({ data, onUpdate }: IntegrationNodeEditorProps) {
    const config = data.config || {};
    const [showKey, setShowKey] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const helpLinks: Record<string, string> = {
        fub: 'https://help.followupboss.com/hc/en-us/articles/202220464-API-Keys',
        salesforce: 'https://help.salesforce.com/s/articleView?id=sf.remoteaccess_authenticate_overview.htm',
        hubspot: 'https://knowledge.hubspot.com/integrations/how-do-i-get-my-hubspot-api-key',
        constant_contact: 'https://developer.constantcontact.com/api_guide/getting_started.html',
        mailchimp: 'https://mailchimp.com/help/about-api-keys/',
        brevo: 'https://help.brevo.com/hc/en-us/articles/209467485-What-s-my-API-key-',
        zapier: 'https://zapier.com/help/create/basics/create-zaps-with-webhooks',
        make: 'https://www.make.com/en/help/tools/webhooks',
        n8n: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/'
    };

    const handleChange = (key: string, value: any) => {
        setTestResult(null); // Clear result on change
        onUpdate({
            ...data,
            config: {
                ...config,
                [key]: value
            }
        });
    };

    const handleTestConnection = async () => {
        if (!config.apiKey) return;

        setTesting(true);
        setTestResult(null);

        try {
            const result = await api.testConnection({
                type: data.type,
                config: config
            });
            setTestResult(result);
        } catch (error: any) {
            setTestResult({
                success: false,
                message: error.response?.data?.message || 'Connection test failed. Please check your network.'
            });
        } finally {
            setTesting(false);
        }
    };

    const typeLabel = (data.type || '').split('_').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-6 space-y-8">
                {/* Header Information */}
                <div>
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <Settings size={18} />
                        <h3 className="font-bold text-lg">Connection Settings</h3>
                    </div>
                    <p className="text-sm text-gray-500">
                        Configure how GiveLive sends lead data to <strong>{data.label || typeLabel}</strong>.
                    </p>
                </div>

                {/* API Auth Section / Webhook URL */}
                <div className="space-y-4">
                    {data.type === 'shopify' && (
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                <Link2 size={12} />
                                Shop URL
                            </label>
                            <input
                                type="text"
                                value={config.shopUrl || ''}
                                onChange={(e) => handleChange('shopUrl', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                placeholder="my-store.myshopify.com"
                            />
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            {['zapier', 'make', 'n8n'].includes(data.type) ? (
                                <>
                                    <Link2 size={12} />
                                    Webhook URL
                                </>
                            ) : (
                                <>
                                    <Key size={12} />
                                    API Key / Access Token
                                </>
                            )}
                        </label>
                        {!['zapier', 'make', 'n8n'].includes(data.type) && (
                            <button
                                onClick={() => setShowKey(!showKey)}
                                className="text-[10px] text-primary hover:underline font-medium"
                            >
                                {showKey ? 'Hide' : 'Show'}
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        {['zapier', 'make', 'n8n'].includes(data.type) ? (
                            <input
                                type="text"
                                value={config.webhookUrl || ''}
                                onChange={(e) => handleChange('webhookUrl', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                placeholder="Paste your webhook URL here..."
                            />
                        ) : (
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={config.apiKey || ''}
                                onChange={(e) => handleChange('apiKey', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                placeholder="Enter your API Key..."
                            />
                        )}
                    </div>
                    {helpLinks[data.type] && (
                        <a
                            href={helpLinks[data.type]}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-primary transition-colors mt-2"
                        >
                            <Info size={12} />
                            {['zapier', 'make', 'n8n'].includes(data.type) ? 'How do I get my webhook URL?' : 'Where do I find my API key?'}
                            <ExternalLink size={10} />
                        </a>
                    )}

                    <div className="pt-2">
                        <button
                            onClick={handleTestConnection}
                            disabled={testing || (!config.apiKey && !config.webhookUrl)}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${testResult?.success
                                ? 'bg-green-50 text-green-600 border border-green-100'
                                : testResult?.success === false
                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                    : 'bg-primary/5 text-primary hover:bg-primary/10 border border-primary/10'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {testing ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Validating...
                                </>
                            ) : testResult?.success ? (
                                <>
                                    <CheckCircle2 size={14} />
                                    {['zapier', 'make', 'n8n'].includes(data.type) ? 'URL Validated' : 'Connection Verified'}
                                </>
                            ) : (
                                <>
                                    <Sparkles size={14} />
                                    {['zapier', 'make', 'n8n'].includes(data.type) ? 'Validate URL' : 'Test Connection'}
                                </>
                            )}
                        </button>

                        {testResult && (
                            <p className={`text-[10px] mt-2 px-1 ${testResult.success ? 'text-green-500' : 'text-red-500'} font-medium`}>
                                {testResult.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Secondary Config */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Link2 size={12} />
                        {(data.type === 'mailchimp' || data.type === 'constant_contact') ? 'Audience / List ID' : 'Lead Source / Campaign'}
                    </label>
                    <input
                        type="text"
                        value={config.listId || ''}
                        onChange={(e) => handleChange('listId', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        placeholder={(data.type === 'mailchimp' || data.type === 'constant_contact') ? "e.g. 5a2b3c4d" : "e.g. GiveLive Inbound"}
                    />
                </div>

                {/* Mapping Section (Coming Soon Visual) */}
                <div className="pt-4 mt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-400 mb-3 grayscale">
                        <AlertCircle size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Field Mapping</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
                        <p className="text-[11px] text-gray-400 leading-relaxed italic">
                            Email, Phone, and Name collected in previous steps will be automatically synced. Advanced custom mapping is coming soon.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-auto p-6 bg-gray-50/50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 max-w-[240px] mx-auto leading-normal">
                    Lead data is synced securely using 256-bit encryption. Ensure your API key has "Write" permissions.
                </p>
            </div>
        </div>
    );
}
