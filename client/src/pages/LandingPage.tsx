import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import NodeRenderer from '../components/NodeRenderer';
import type { Event, JourneyNode } from '../types';

export default function LandingPage() {
    const { eventId } = useParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [currentNode, setCurrentNode] = useState<JourneyNode | null>(null);
    const [allNodes, setAllNodes] = useState<JourneyNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStep, setLoadingStep] = useState('Initializing...');
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState('');

    const [userPhone, setUserPhone] = useState<string>('');

    useEffect(() => {
        const loadEventAndJourney = async () => {
            try {
                setLoading(true);

                // 1. Get Event
                setLoadingStep('Loading Event...');
                const eventData = await api.getEvent(eventId!);
                setEvent(eventData);

                // 2. Start Journey (or resume)
                setLoadingStep('Starting Journey...');
                const startRes = await api.startJourney(eventId!);
                const { progress } = startRes;

                // 3. Get Node Details
                setLoadingStep('Loading Node Content...');
                const nodes = await api.getNode(eventId!);

                if (!Array.isArray(nodes)) {
                    throw new Error('Invalid nodes response');
                }
                setAllNodes(nodes);

                // Match node types since ID might be string vs number issue (though we migrated to text)
                const dbNode = nodes.find((n: JourneyNode) => String(n.id) === String(progress.current_node_id));

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
                    setDebugInfo(`Node not found. Current: ${progress.current_node_id}, Available: ${nodes.map(n => n.id).join(', ')}`);
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
        const nextNode = allNodes.find(n => String(n.id) === String(nextNodeId));

        if (!nextNode) {
            console.error("Next node not found in allNodes", nextNodeId);
            return;
        }

        // Categorize nodes
        const inboundTypes = ['page', 'donation'];
        const outboundTypes = ['sms', 'email'];

        // Helper to get true type
        const getNodeType = (n: JourneyNode) => n.config?.type || n.type;

        const currentType = getNodeType(currentNode);
        const nextType = getNodeType(nextNode);

        const currentIsInbound = inboundTypes.includes(currentType);
        const nextIsOutbound = outboundTypes.includes(nextType);

        // Execute outbound actions (SMS, Email, etc.)
        if (nextIsOutbound) {
            if (nextType === 'sms') {
                try {
                    const phoneToUse = formData?.phone || userPhone;
                    if (phoneToUse) {
                        // Get SMS message from config (supports both single message and array)
                        let smsMessage = nextNode.config?.smsMessages?.[0] || nextNode.config?.smsMessage || 'Thanks for signing up!';

                        // Replace personalization tags with actual data
                        if (formData) {
                            Object.keys(formData).forEach(key => {
                                const tag = `{{${key}}}`;
                                smsMessage = smsMessage.replace(new RegExp(tag, 'g'), formData[key]);
                            });
                        }

                        console.log('[SMS] Sending to:', phoneToUse);
                        console.log('[SMS] Message:', smsMessage);

                        const response = await fetch('/api/sms/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: phoneToUse,
                                body: smsMessage
                            })
                        });

                        const result = await response.json();
                        console.log('[SMS] Result:', result);

                        if (!response.ok) {
                            throw new Error(result.error || 'Failed to send SMS');
                        }

                        // Show success toast instead of navigating
                        alert('Message sent! Check your phone.');
                    } else {
                        console.warn('[SMS] No phone number available');
                        alert('No phone number provided - cannot send SMS');
                    }
                } catch (err: any) {
                    console.error('Failed to send SMS:', err);
                    alert(`Failed to send SMS: ${err.message}`);
                }
            } else if (nextType === 'email') {
                // TODO: Implement email sending with personalization
                alert('Email sent!');
            }

            // If current is inbound and next is outbound, stay on current page
            // Don't navigate away - just show confirmation
            if (currentIsInbound) {
                return;
            }
        }

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
            const timer = setTimeout(() => {
                handleNext();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentNode, allNodes, handleNext]); // Added handleNext to dependencies

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
        <div className="min-h-screen bg-background">
            {currentNode ? (
                <NodeRenderer node={currentNode} onNext={handleNext} />
            ) : (
                <div className="flex items-center justify-center min-h-screen p-8">
                    <div className="text-center">
                        <p className="text-gray-500 mb-2">No content available for this step.</p>
                        {debugInfo && <p className="text-xs text-red-400">{debugInfo}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
