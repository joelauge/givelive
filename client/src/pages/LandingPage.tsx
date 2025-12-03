import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import NodeRenderer from '../components/NodeRenderer';

export default function LandingPage() {
    const { eventId } = useParams();
    const [event, setEvent] = useState<any>(null);
    const [currentNode, setCurrentNode] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (eventId) {
            loadEventAndJourney();
        }
    }, [eventId]);

    const loadEventAndJourney = async () => {
        try {
            setLoading(true);
            // 1. Get Event
            const eventData = await api.getEvent(eventId!);
            setEvent(eventData);

            // 2. Start Journey (or resume)
            // For MVP we just start a new one every time or we could store user_id in localStorage
            const { progress } = await api.startJourney(eventId!);

            // 3. Get Node Details
            // We need an endpoint to get a single node, but for now let's fetch all and find it
            // Optimization: Add api.getNode(nodeId)
            const nodes = await api.getNode(eventId!);
            const node = nodes.find((n: any) => n.id === progress.current_node_id);
            setCurrentNode(node);

        } catch (err) {
            console.error(err);
            setError('Failed to load event');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async (action?: string) => {
        // Logic to move to next node
        // For MVP, just alert
        alert(`Action: ${action}. Moving to next node... (Not implemented yet)`);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
    if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            {currentNode ? (
                <NodeRenderer node={currentNode} onNext={handleNext} />
            ) : (
                <div>No content available</div>
            )}
        </div>
    );
}
