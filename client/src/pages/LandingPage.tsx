import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import NodeRenderer from '../components/NodeRenderer';
import GiveLiveScannerShell, { type EmbedMode } from '../components/GiveLiveScannerShell';
import type { Event, JourneyNode } from '../types';
import { applyPageSeo, eventMetaDescription, SITE } from '../lib/seo';

export default function LandingPage() {
    const { eventId } = useParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [currentNode, setCurrentNode] = useState<JourneyNode | null>(null);
    const [allNodes, setAllNodes] = useState<JourneyNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState('Initializing...');
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState('');
    const [userId, setUserId] = useState<string>('');

    const [userPhone, setUserPhone] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    const [sendingProgress, setSendingProgress] = useState('');
    const [showWatermark, setShowWatermark] = useState(false);
    const [embeddedUrl, setEmbeddedUrl] = useState<string | null>(null);
    const [embedMode, setEmbedMode] = useState<EmbedMode>('iframe');

    useEffect(() => {
        const loadEventAndJourney = async () => {
            try {
                setLoading(true);

                // Check for nodeId in URL query params
                const urlParams = new URLSearchParams(window.location.search);
                const urlNodeId = urlParams.get('nodeId');

                // 1. Get Event
                setLoadingStep('Loading Event...');
                const eventData = await api.getEvent(eventId!);
                setEvent(eventData);
                setShowWatermark(Boolean(eventData.showWatermark));

                // 2. Start Journey (or resume)
                setLoadingStep('Starting Journey...');
                const startRes = await api.startJourney(eventId!);
                const { progress } = startRes;

                // Store user ID for payment processing
                if (progress.user_id) {
                    setUserId(progress.user_id);
                }

                // 3. Get Node Details
                setLoadingStep('Loading Node Content...');
                const nodes = await api.getNode(eventId!);

                if (!Array.isArray(nodes)) {
                    throw new Error('Invalid nodes response');
                }
                setAllNodes(nodes);

                // Determine which node to load: URL param takes priority
                const targetNodeId = urlNodeId || progress.current_node_id;
                console.log('[LandingPage] Target node ID:', targetNodeId);

                // Match node types since ID might be string vs number issue (though we migrated to text)
                const dbNode = nodes.find((n: JourneyNode) => String(n.id) === String(targetNodeId));

                if (dbNode) {
                    // Map DB config to data for NodeRenderer
                    const nodeForRender = {
                        ...dbNode,
                        data: {
                            ...(dbNode.config || {}),
                            type: dbNode.config?.type || dbNode.type
                        }
                    };
                    setCurrentNode(nodeForRender as any);
                } else {
                    setCurrentNode(null);
                    setDebugInfo(`Node not found. Target: ${targetNodeId}, Available: ${nodes.map(n => n.id).join(', ')}`);
                }

            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to load event');
                setDebugInfo(JSON.stringify(err));
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            loadEventAndJourney();
        }
    }, [eventId]);

    useEffect(() => {
        if (!event || !allNodes.length) return;

        const startNode = allNodes.find(n => n.type === 'start' || n.config?.type === 'start');
        const campaignImage = startNode?.config?.campaignImage || (startNode as any)?.data?.campaignImage;

        applyPageSeo({
            title: event.name || 'GiveLive',
            description: eventMetaDescription(event.name),
            ogImage: campaignImage || SITE.defaultOgImage,
            rawTitle: true,
            omitUrl: true,
        });
    }, [event, allNodes]);

    const handleNext = async (formData?: any) => {
        if (!currentNode || !currentNode.next_nodes || currentNode.next_nodes.length === 0) {
            console.warn("No next nodes found for current node", currentNode?.id);
            return;
        }

        // Track user profile if form data was submitted
        if (formData && Object.keys(formData).length > 0) {
            try {
                await fetch('/api/users/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_id: eventId,
                        form_data: formData,
                        node_id: currentNode.id,
                        session_id: localStorage.getItem('givelive_session_id') || Math.random().toString(36)
                    })
                });
            } catch (err) {
                console.error('Failed to track user profile:', err);
            }
        }

        // Store phone number if provided
        if (formData?.phone) {
            setUserPhone(formData.phone);
        }

        // Get next node
        let nextNodeId = currentNode.next_nodes[0];
        // Handle object format (new schema with handles)
        if (nextNodeId && typeof nextNodeId === 'object' && 'nodeId' in nextNodeId) {
            nextNodeId = (nextNodeId as any).nodeId;
        }

        const nextNode = allNodes.find(n => String(n.id) === String(nextNodeId));

        if (!nextNode) {
            console.error("Next node not found in allNodes", nextNodeId);
            return;
        }

        // Categorize nodes
        const inboundTypes = ['page', 'donation'];
        const outboundTypes = ['sms', 'email', 'message'];

        // Helper to get true type
        const getNodeType = (n: JourneyNode) => n.config?.type || n.type;

        const currentType = getNodeType(currentNode);
        const nextType = getNodeType(nextNode);

        const currentIsInbound = inboundTypes.includes(currentType);
        const nextIsOutbound = outboundTypes.includes(nextType);

        // Execute outbound actions (SMS, Email, etc.)
        if (nextIsOutbound) {
            const isSms = nextType === 'sms' || (nextType === 'message' && (nextNode.config?.messageType === 'sms' || nextNode.config?.messageType === 'both'));
            const isEmail = nextType === 'email' || (nextType === 'message' && (nextNode.config?.messageType === 'email' || nextNode.config?.messageType === 'both'));

            if (isSms) {
                try {
                    setIsSending(true);
                    setSendingProgress('Preparing messages...');
                    const phoneToUse = formData?.phone || userPhone;
                    if (phoneToUse) {
                        // Helper to format phone number to E.164
                        const formatPhoneNumber = (phone: string) => {
                            // Remove all non-digit characters
                            const digits = phone.replace(/\D/g, '');

                            // Check if it's potentially valid (at least 10 digits)
                            if (digits.length < 10) return phone; // Return original if too short, let API fail or validate elsewhere

                            // Add country code if missing (assuming US/Canada +1 for now)
                            if (digits.length === 10) {
                                return `+1${digits}`;
                            } else if (digits.length === 11 && digits.startsWith('1')) {
                                return `+${digits}`;
                            }

                            // If it has more digits, assume it includes country code but needs the +
                            return `+${digits}`;
                        };

                        const formattedPhone = formatPhoneNumber(phoneToUse);

                        // Prepare Sequence
                        let sequence = nextNode.config?.messageSequence;

                        // Fallback for legacy data
                        if (!sequence) {
                            const legacyMessages = nextNode.config?.smsMessages || (nextNode.config?.smsMessage ? [nextNode.config.smsMessage] : ['Thanks for signing up!']);
                            sequence = legacyMessages.map((msg: string) => ({ type: 'text', content: msg }));
                        }

                        console.log('[SMS] Processing sequence:', sequence);

                        for (const [index, item] of sequence.entries()) {
                            setSendingProgress(`Step ${index + 1} of ${sequence.length}...`);
                            if (item.type === 'delay') {
                                setSendingProgress(`Waiting ${item.duration} seconds...`);
                                console.log(`[SMS] Delaying for ${item.duration} seconds...`);
                                await new Promise(resolve => setTimeout(resolve, item.duration * 1000));
                                continue;
                            }

                            if (item.type === 'text') {
                                let smsMessage = item.content;

                                // Replace personalization tags with actual data
                                if (formData) {
                                    Object.keys(formData).forEach(key => {
                                        const tag = `{{${key}}}`;
                                        smsMessage = smsMessage.replace(new RegExp(tag, 'g'), formData[key]);
                                    });
                                }

                                // Replace {{Link:NodeLabel}} placeholders with actual URLs
                                if (smsMessage.includes('{{Link:')) {
                                    try {
                                        const nodesResponse = await fetch(`/api/events/${eventId}/nodes`);
                                        if (nodesResponse.ok) {
                                            const allNodes = await nodesResponse.json();
                                            console.log('[SMS] Found', allNodes.length, 'nodes for link replacement');

                                            smsMessage = smsMessage.replace(/\{\{Link:([^?\}]+)[^}]*\}\}/g, (match: string, labelOrId: string) => {
                                                console.log('[SMS] Attempting to resolve link:', labelOrId);

                                                // Try exact ID match
                                                let target = allNodes.find((n: any) => n.id === labelOrId);

                                                // Try normalized label match
                                                if (!target) {
                                                    target = allNodes.find((n: any) => {
                                                        const nLabel = n.config?.label || n.data?.label || '';
                                                        const normalized = nLabel.replace(/\s+/g, '');
                                                        console.log('[SMS] Comparing', labelOrId, 'with', normalized, 'from label:', nLabel);
                                                        return normalized === labelOrId;
                                                    });
                                                }

                                                if (target) {
                                                    const url = `${window.location.origin}/event/${eventId}?nodeId=${target.id}`;
                                                    console.log('[SMS] Resolved to:', url);
                                                    return url;
                                                }

                                                console.warn('[SMS] Could not resolve link:', labelOrId);
                                                return match;
                                            });
                                        }
                                    } catch (err) {
                                        console.error('[SMS] Failed to fetch nodes for link replacement:', err);
                                    }
                                }

                                console.log('[SMS] Sending to:', formattedPhone);
                                console.log('[SMS] Message:', smsMessage);

                                const response = await fetch('/api/sms/send', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        to: formattedPhone,
                                        body: smsMessage,
                                        nodeId: nextNode.id,
                                        eventId: eventId
                                    })
                                });

                                if (!response.ok) {
                                    console.error('[SMS] Failed to send message:', await response.text());
                                }
                            }
                        }

                        // Sequence completed


                        // Show success toast instead of navigating
                        alert('Message sent! Check your phone.');
                    } else {
                        console.warn('[SMS] No phone number available');
                        alert('No phone number provided - cannot send SMS');
                    }
                } catch (err: any) {
                    console.error('Failed to send SMS:', err);
                    alert(`Failed to send SMS: ${err.message}`);
                } finally {
                    setIsSending(false);
                }
            }
            if (isEmail) {
                // TODO: Implement email sending with personalization
                alert('Email sent!');
            }

            // If current is inbound and next is outbound, stay on current page
            // Don't navigate away - just show confirmation
            if (currentIsInbound) {
                return;
            }
        }

        // --- NEW: Handle Integration Nodes ---
        const integrationTypes = [
            'hubspot', 'salesforce', 'fub', 'mailchimp', 'constant_contact', 'brevo',
            'zapier', 'make', 'n8n',
        ];
        if (integrationTypes.includes(nextType)) {
            try {
                console.log(`[Journey] Executing integration: ${nextType}`);
                setIsSending(true);
                setSendingProgress(`Syncing with ${nextType.charAt(0).toUpperCase() + nextType.slice(1)}...`);

                await api.syncLead({
                    userId: userId,
                    nodeId: nextNode.id
                });

                // Once synced, automatically find the NEXT node after this integration node
                // and advance to it (recursive call)
                setIsSending(false);

                if (nextNode.next_nodes && nextNode.next_nodes.length > 0) {
                    let nextAfterId = nextNode.next_nodes[0];
                    if (nextAfterId && typeof nextAfterId === 'object' && 'nodeId' in nextAfterId) {
                        nextAfterId = (nextAfterId as any).nodeId;
                    }

                    const nextAfterNode = allNodes.find(n => String(n.id) === String(nextAfterId));
                    if (nextAfterNode) {
                        console.log(`[Journey] Integration complete, advancing to: ${nextAfterNode.type}`);

                        // We need to wait a tiny bit to avoid state update cycles, or just perform the navigation
                        // For simplicity, we just set the nextAfterNode as currentNode
                        const nodeForRender = {
                            ...nextAfterNode,
                            data: nextAfterNode.config || {}
                        };
                        setCurrentNode(nodeForRender as any);
                        return;
                    }
                }
            } catch (err) {
                console.error(`[Journey] Integration failed: ${nextType}`, err);
                // Even on failure, we might want to continue the journey
                // For now, let's just proceed to next step
            } finally {
                setIsSending(false);
            }
        }
        // --- END: Handle Integration Nodes ---

        // For instruction nodes or inbound→inbound, navigate
        const nodeForRender = {
            ...nextNode,
            data: nextNode.config || {}
        };
        setCurrentNode(nodeForRender as any);
    };

    // Auto-advance Start Node
    useEffect(() => {
        if (currentNode && currentNode.type === 'start') {
            // Check for auto-forward URL
            const autoForwardUrl = currentNode.config?.autoForwardUrl || (currentNode as any).data?.autoForwardUrl;
            if (autoForwardUrl) {
                const url = autoForwardUrl.startsWith('http') ? autoForwardUrl : `https://${autoForwardUrl}`;
                console.log('[LandingPage] Auto-forwarding to:', url);

                if (showWatermark) {
                    void (async () => {
                        try {
                            const { embeddable } = await api.checkEmbeddable(url);
                            setEmbedMode(embeddable ? 'iframe' : 'redirect-only');
                        } catch {
                            setEmbedMode('redirect-only');
                        }
                        setEmbeddedUrl(url);
                    })();
                } else {
                    window.location.replace(url);
                }
                return;
            }

            const timer = setTimeout(() => {
                handleNext();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentNode, allNodes, handleNext, showWatermark]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500">{loadingStep}</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
            <div className="text-red-500 mb-2 font-bold">Error</div>
            <p className="text-gray-700 mb-4">{error}</p>
            {debugInfo && <pre className="text-xs text-gray-400 bg-gray-50 p-2 rounded max-w-full overflow-auto">{debugInfo}</pre>}
            <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm"
            >
                Retry
            </button>
        </div>
    );

    if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

    return (
        <GiveLiveScannerShell
            showBanner={showWatermark}
            eventId={eventId}
            embedUrl={embeddedUrl}
            embedMode={embedMode}
            overlay={
                isSending ? (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm mx-4 animate-in zoom-in-95 duration-200">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Just a moment</h3>
                            <p className="text-gray-500 text-sm">{sendingProgress || 'Processing your request...'}</p>
                        </div>
                    </div>
                ) : null
            }
        >
            {currentNode ? (
                <NodeRenderer
                    node={currentNode}
                    onNext={handleNext}
                    isSubmitting={isSending}
                    eventId={eventId}
                    userId={userId}
                    showWatermark={false}
                />
            ) : (
                <div className="flex items-center justify-center min-h-screen p-8">
                    <div className="text-center">
                        <p className="text-gray-500 mb-2">No content available for this step.</p>
                        {debugInfo && <p className="text-xs text-red-400">{debugInfo}</p>}
                    </div>
                </div>
            )}
        </GiveLiveScannerShell>
    );
}
