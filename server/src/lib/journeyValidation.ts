export type FlowNode = {
    id: string;
    type?: string;
    data?: Record<string, unknown>;
};

export type FlowEdge = {
    source: string;
    target: string;
    sourceHandle?: string | null;
};

export type PublishValidationOptions = {
    nodes: FlowNode[];
    edges: FlowEdge[];
    /** When false (release default), social and Shopify start triggers cannot be published. */
    socialTriggersEnabled?: boolean;
};

export function getStartNode(nodes: FlowNode[]): FlowNode | undefined {
    return nodes.find((n) => n.type === 'start' || n.data?.type === 'start');
}

export function getTriggerType(startNode: FlowNode | undefined): string {
    const raw = startNode?.data?.triggerType;
    return typeof raw === 'string' && raw.length > 0 ? raw : 'qr';
}

export function isQrTriggerType(triggerType: string | undefined, socialTriggersEnabled: boolean): boolean {
    if (!socialTriggersEnabled) {
        return triggerType !== 'social' && triggerType !== 'shopify';
    }
    return !triggerType || triggerType === 'qr';
}

export function getDisallowedTriggerError(
    triggerType: string,
    socialTriggersEnabled: boolean
): string | null {
    if (socialTriggersEnabled) return null;
    if (triggerType === 'social') {
        return '❌ Social triggers are not available in this release. Open the Start node and switch to QR / Link before publishing.';
    }
    if (triggerType === 'shopify') {
        return '❌ Shopify triggers are not available in this release. Open the Start node and switch to QR / Link before publishing.';
    }
    return null;
}

export function buildEventUrl(origin: string, eventId: string): string {
    const base = origin.replace(/\/$/, '');
    return `${base}/event/${eventId}`;
}

export function validatePublishFlow(options: PublishValidationOptions): string[] {
    const { nodes, edges } = options;
    const socialTriggersEnabled = options.socialTriggersEnabled ?? false;
    const errors: string[] = [];

    if (nodes.length === 0) {
        errors.push('❌ Your flow is empty. Add at least one node to publish.');
        return errors;
    }

    const startNode = getStartNode(nodes);
    if (!startNode) {
        errors.push('❌ No Start node found. Every flow needs a Start node (QR code).');
        return errors;
    }

    const triggerType = getTriggerType(startNode);
    const disallowedTrigger = getDisallowedTriggerError(triggerType, socialTriggersEnabled);
    if (disallowedTrigger) {
        errors.push(disallowedTrigger);
    }

    const startConnections = edges.filter((e) => e.source === startNode.id);
    const isEndNode = Boolean(startNode.data?.isEndNode);
    if (startConnections.length === 0 && !isEndNode) {
        errors.push('❌ Start node is not connected. Connect the Start node to your first page.');
    }

    const orphanedNodes = nodes.filter((n) => {
        if (n.type === 'start' || n.data?.type === 'start') return false;
        return !edges.some((e) => e.target === n.id);
    });

    if (orphanedNodes.length > 0 && !isEndNode) {
        const labels = orphanedNodes
            .map((n) => (typeof n.data?.label === 'string' ? n.data.label : n.id))
            .join(', ');
        errors.push(
            `⚠️ ${orphanedNodes.length} disconnected node(s) found: ${labels}. Connect them or delete them.`
        );
    }

    const nodesWithIssues = nodes.filter((n) => {
        const type = (n.data?.type as string | undefined) || n.type;

        if (type === 'sms' || type === 'message') {
            const smsMessage = n.data?.smsMessage;
            const smsMessages = n.data?.smsMessages as unknown[] | undefined;
            if (!smsMessage && (!smsMessages || smsMessages.length === 0)) {
                return true;
            }
        }

        if (type === 'page' || type === 'donation') {
            const sections = n.data?.sections as unknown[] | undefined;
            if (!sections || sections.length === 0) {
                return true;
            }
        }

        return false;
    });

    if (nodesWithIssues.length > 0) {
        errors.push(
            '⚠️ Some nodes are incomplete:\n' +
                nodesWithIssues
                    .map((n) => {
                        const label =
                            typeof n.data?.label === 'string' ? n.data.label : n.id;
                        return `  • ${label}: Add content or configuration`;
                    })
                    .join('\n')
        );
    }

    const deadEnds = nodes.filter((n) => {
        const type = (n.data?.type as string | undefined) || n.type;
        if (type === 'end') return false;
        if (n.data?.isEndNode) return false;
        return !edges.some((e) => e.source === n.id);
    });

    if (deadEnds.length > 0) {
        const labels = deadEnds
            .map((n) => (typeof n.data?.label === 'string' ? n.data.label : n.id))
            .join(', ');
        errors.push(
            `⚠️ ${deadEnds.length} node(s) have no next step: ${labels}. Connect them to another node, add an End node, or mark them as "End Journey".`
        );
    }

    return errors;
}
