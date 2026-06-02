import { describe, it, expect } from 'vitest';
import {
    buildEventUrl,
    getDisallowedTriggerError,
    getStartNode,
    getTriggerType,
    isQrTriggerType,
    validatePublishFlow,
} from './journeyValidation';

const start = (overrides: Record<string, unknown> = {}): { id: string; type: string; data: Record<string, unknown> } => ({
    id: 'start',
    type: 'start',
    data: { label: 'Start', type: 'start', triggerType: 'qr', ...overrides },
});

const page = (id: string, label = 'Page'): { id: string; type: string; data: Record<string, unknown> } => ({
    id,
    type: 'default',
    data: {
        label,
        type: 'page',
        sections: [{ id: 's1', type: 'header', content: { title: 'Hello' } }],
    },
});

const message = (id: string, withContent = true): { id: string; type: string; data: Record<string, unknown> } => ({
    id,
    type: 'default',
    data: {
        label: 'SMS',
        type: 'message',
        ...(withContent ? { smsMessage: 'Thanks for scanning!' } : {}),
    },
});

const edge = (source: string, target: string) => ({ source, target });

describe('trigger helpers', () => {
    it('defaults missing triggerType to qr', () => {
        const node = start({ triggerType: undefined });
        delete node.data.triggerType;
        expect(getTriggerType(node)).toBe('qr');
    });

    it('blocks social publish when social triggers are disabled', () => {
        expect(getDisallowedTriggerError('social', false)).toMatch(/Social triggers/);
        expect(getDisallowedTriggerError('social', true)).toBeNull();
    });

    it('blocks shopify publish when social triggers are disabled', () => {
        expect(getDisallowedTriggerError('shopify', false)).toMatch(/Shopify triggers/);
    });

    it('allows qr trigger when social triggers are disabled', () => {
        expect(getDisallowedTriggerError('qr', false)).toBeNull();
        expect(isQrTriggerType('qr', false)).toBe(true);
        expect(isQrTriggerType(undefined, false)).toBe(true);
    });

    it('builds event URLs for QR entry', () => {
        expect(buildEventUrl('https://givelive.app', 'evt-1')).toBe(
            'https://givelive.app/event/evt-1'
        );
        expect(buildEventUrl('https://givelive.app/', 'evt-1')).toBe(
            'https://givelive.app/event/evt-1'
        );
    });
});

describe('validatePublishFlow — QR flows', () => {
    it('rejects empty flows', () => {
        const errors = validatePublishFlow({ nodes: [], edges: [] });
        expect(errors[0]).toMatch(/empty/);
    });

    it('rejects flows without a start node', () => {
        const errors = validatePublishFlow({
            nodes: [page('p1')],
            edges: [],
        });
        expect(errors[0]).toMatch(/No Start node/);
    });

    it('rejects social-trigger flows when social triggers are disabled', () => {
        const errors = validatePublishFlow({
            nodes: [start({ triggerType: 'social' }), page('p1')],
            edges: [edge('start', 'p1')],
            socialTriggersEnabled: false,
        });
        expect(errors.some((e) => e.includes('Social triggers'))).toBe(true);
    });

    it('rejects shopify-trigger flows when social triggers are disabled', () => {
        const errors = validatePublishFlow({
            nodes: [start({ triggerType: 'shopify' }), page('p1')],
            edges: [edge('start', 'p1')],
            socialTriggersEnabled: false,
        });
        expect(errors.some((e) => e.includes('Shopify triggers'))).toBe(true);
    });

    it('allows a minimal connected QR flow ending on a page', () => {
        const errors = validatePublishFlow({
            nodes: [
                start(),
                {
                    ...page('p1', 'Landing'),
                    data: { ...page('p1', 'Landing').data, isEndNode: true },
                },
            ],
            edges: [edge('start', 'p1')],
            socialTriggersEnabled: false,
        });
        expect(errors).toEqual([]);
    });

    it('allows QR start with auto-forward end node and no children', () => {
        const errors = validatePublishFlow({
            nodes: [
                start({
                    triggerType: 'qr',
                    isEndNode: true,
                    autoForwardUrl: 'https://example.com',
                }),
            ],
            edges: [],
            socialTriggersEnabled: false,
        });
        expect(errors).toEqual([]);
    });

    it('requires start to be connected for standard QR flows', () => {
        const errors = validatePublishFlow({
            nodes: [start(), page('p1')],
            edges: [],
            socialTriggersEnabled: false,
        });
        expect(errors.some((e) => e.includes('Start node is not connected'))).toBe(true);
    });

    it('flags orphaned nodes in QR flows', () => {
        const errors = validatePublishFlow({
            nodes: [start(), page('p1'), page('p2', 'Orphan')],
            edges: [edge('start', 'p1')],
            socialTriggersEnabled: false,
        });
        expect(errors.some((e) => e.includes('disconnected node'))).toBe(true);
    });

    it('flags incomplete page nodes', () => {
        const errors = validatePublishFlow({
            nodes: [
                start(),
                { id: 'p1', type: 'default', data: { label: 'Empty', type: 'page', sections: [] } },
            ],
            edges: [edge('start', 'p1')],
            socialTriggersEnabled: false,
        });
        expect(errors.some((e) => e.includes('incomplete'))).toBe(true);
    });

    it('flags incomplete message nodes', () => {
        const errors = validatePublishFlow({
            nodes: [start(), message('m1', false)],
            edges: [edge('start', 'm1')],
            socialTriggersEnabled: false,
        });
        expect(errors.some((e) => e.includes('incomplete'))).toBe(true);
    });

    it('accepts QR flow with page then SMS message', () => {
        const errors = validatePublishFlow({
            nodes: [
                start(),
                page('p1'),
                {
                    ...message('m1'),
                    data: { ...message('m1').data, isEndNode: true },
                },
            ],
            edges: [edge('start', 'p1'), edge('p1', 'm1')],
            socialTriggersEnabled: false,
        });
        expect(errors).toEqual([]);
    });

    it('flags dead-end nodes without end journey marker', () => {
        const errors = validatePublishFlow({
            nodes: [start(), page('p1'), message('m1')],
            edges: [edge('start', 'p1')],
            socialTriggersEnabled: false,
        });
        expect(errors.some((e) => e.includes('no next step'))).toBe(true);
    });

    it('allows page marked as end journey without outgoing edges', () => {
        const errors = validatePublishFlow({
            nodes: [
                start(),
                {
                    id: 'p1',
                    type: 'default',
                    data: {
                        label: 'Thanks',
                        type: 'page',
                        isEndNode: true,
                        sections: [{ id: 's1', type: 'text', content: { text: 'Done' } }],
                    },
                },
            ],
            edges: [edge('start', 'p1')],
            socialTriggersEnabled: false,
        });
        expect(errors.filter((e) => e.includes('no next step'))).toHaveLength(0);
    });
});

describe('validatePublishFlow — social triggers enabled', () => {
    it('allows social trigger type when feature flag is on', () => {
        const errors = validatePublishFlow({
            nodes: [start({ triggerType: 'social' }), message('m1')],
            edges: [edge('start', 'm1')],
            socialTriggersEnabled: true,
        });
        expect(errors.filter((e) => e.includes('Social triggers'))).toHaveLength(0);
    });
});

describe('getStartNode', () => {
    it('finds start by type or data.type', () => {
        expect(getStartNode([{ id: 'a', type: 'start', data: {} }])?.id).toBe('a');
        expect(getStartNode([{ id: 'b', data: { type: 'start' } }])?.id).toBe('b');
    });
});
