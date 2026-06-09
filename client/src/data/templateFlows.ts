import { MarkerType } from 'reactflow';
import type { TemplateMetadata } from './templateLibrary';

type FlowNode = {
    id: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
    type: string;
};

type FlowEdge = {
    id: string;
    source: string;
    target: string;
    markerEnd: { type: typeof MarkerType.ArrowClosed };
};

export type TemplateFlowResult = {
    nodes: FlowNode[];
    edges: FlowEdge[];
};

function linearEdges(startNodeId: string, nodeIds: string[]): FlowEdge[] {
    const chain = [startNodeId, ...nodeIds];
    return chain.slice(0, -1).map((source, i) => ({
        id: `e${source}-${chain[i + 1]}`,
        source,
        target: chain[i + 1],
        markerEnd: { type: MarkerType.ArrowClosed },
    }));
}

function pageNode(
    id: string,
    y: number,
    label: string,
    sections: Record<string, unknown>[]
): FlowNode {
    return {
        id,
        position: { x: 250, y },
        data: { label, type: 'page', sections },
        type: 'default',
    };
}

function smsNode(id: string, y: number, label: string, smsMessage: string): FlowNode {
    return {
        id,
        position: { x: 250, y },
        data: { label, type: 'sms', messageType: 'sms', smsMessage },
        type: 'default',
    };
}

/** Fallback flow when a template id has metadata but no dedicated builder yet. */
export function buildDefaultTemplateFlow(
    template: TemplateMetadata,
    startNodeId: string,
    baseId: number
): TemplateFlowResult {
    const nodes: FlowNode[] = [];
    const nodeIds: string[] = [];

    const headerSection = {
        id: 's1',
        type: 'header',
        content: { title: template.name, paddingTop: 40, paddingBottom: 20, textAlign: 'center' },
    };
    const textSection = {
        id: 's2',
        type: 'text',
        content: {
            text: template.description,
            paddingTop: 20,
            paddingBottom: 20,
            textAlign: 'center',
            fontSize: 16,
        },
    };

    if (template.category === 'Fundraising') {
        const pageId = `${baseId}`;
        nodes.push(
            pageNode(pageId, 150, template.name, [
                headerSection,
                textSection,
                {
                    id: 's3',
                    type: 'payment',
                    content: {
                        frequencies: ['one-time'],
                        defaultAmount: 25,
                        buttonText: 'Give Now',
                        buttonColor: '#059669',
                    },
                },
            ])
        );
        nodeIds.push(pageId);

        const smsId = `${baseId + 1}`;
        nodes.push(smsNode(smsId, 350, 'Thank You SMS', 'Thank you for your support!'));
        nodeIds.push(smsId);
    } else if (template.category === 'Quiz Games') {
        const signupId = `${baseId}`;
        nodes.push(
            pageNode(signupId, 150, 'Join the Game', [
                headerSection,
                textSection,
                {
                    id: 's3',
                    type: 'form',
                    content: { fields: ['name', 'email'], buttonText: 'Start', buttonColor: '#eab308' },
                },
            ])
        );
        nodeIds.push(signupId);

        const questionId = `${baseId + 1}`;
        nodes.push(
            pageNode(questionId, 300, 'Question 1', [
                {
                    id: 's1',
                    type: 'text',
                    content: {
                        text: 'Pick your answer below:',
                        paddingTop: 20,
                        paddingBottom: 20,
                        textAlign: 'center',
                        fontSize: 18,
                    },
                },
                {
                    id: 's2',
                    type: 'choice',
                    content: {
                        choices: [{ label: 'Option A' }, { label: 'Option B' }, { label: 'Option C' }],
                    },
                },
            ])
        );
        nodeIds.push(questionId);

        const thanksId = `${baseId + 2}`;
        nodes.push(
            pageNode(thanksId, 450, 'Results', [
                {
                    id: 's1',
                    type: 'header',
                    content: { title: 'Great job!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' },
                },
                {
                    id: 's2',
                    type: 'text',
                    content: {
                        text: 'Thanks for playing. Customize this page with your quiz results.',
                        paddingTop: 20,
                        paddingBottom: 40,
                        textAlign: 'center',
                    },
                },
            ])
        );
        nodeIds.push(thanksId);
    } else {
        const pageId = `${baseId}`;
        nodes.push(
            pageNode(pageId, 150, template.name, [
                headerSection,
                textSection,
                {
                    id: 's3',
                    type: 'form',
                    content: { fields: ['name', 'email'], buttonText: 'Continue', buttonColor: '#2563eb' },
                },
            ])
        );
        nodeIds.push(pageId);

        const smsId = `${baseId + 1}`;
        nodes.push(
            smsNode(smsId, 350, 'Follow-up', `Thanks for using our ${template.name} flow!`)
        );
        nodeIds.push(smsId);
    }

    return {
        nodes,
        edges: linearEdges(startNodeId, nodeIds),
    };
}
