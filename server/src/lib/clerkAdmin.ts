import { createClerkClient, type ClerkClient } from '@clerk/backend';

let client: ClerkClient | null = null;

function getClerk(): ClerkClient | null {
    const secretKey = process.env.CLERK_SECRET_KEY?.trim();
    if (!secretKey) return null;
    if (!client) {
        client = createClerkClient({ secretKey });
    }
    return client;
}

export interface ClerkUserSummary {
    id: string;
    email: string | null;
    name: string | null;
    imageUrl: string | null;
    createdAt: number | null;
    lastSignInAt: number | null;
    banned: boolean;
}

function primaryEmail(user: {
    primaryEmailAddressId?: string | null;
    emailAddresses?: { id: string; emailAddress: string }[];
}): string | null {
    const list = user.emailAddresses || [];
    const primary = list.find((e) => e.id === user.primaryEmailAddressId);
    return (primary || list[0])?.emailAddress || null;
}

function fullName(user: { firstName?: string | null; lastName?: string | null }): string | null {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name || null;
}

function normalize(user: any): ClerkUserSummary {
    return {
        id: user.id,
        email: primaryEmail(user),
        name: fullName(user),
        imageUrl: user.imageUrl || null,
        createdAt: typeof user.createdAt === 'number' ? user.createdAt : null,
        lastSignInAt: typeof user.lastSignInAt === 'number' ? user.lastSignInAt : null,
        banned: Boolean(user.banned),
    };
}

export function isClerkAdminConfigured(): boolean {
    return Boolean(getClerk());
}

export async function listClerkUsers(opts: {
    limit: number;
    offset: number;
    query?: string;
}): Promise<{ users: ClerkUserSummary[]; total: number }> {
    const clerk = getClerk();
    if (!clerk) return { users: [], total: 0 };

    const res = await clerk.users.getUserList({
        limit: opts.limit,
        offset: opts.offset,
        query: opts.query || undefined,
        orderBy: '-created_at',
    });

    return {
        users: res.data.map(normalize),
        total: res.totalCount,
    };
}

export async function getClerkUser(userId: string): Promise<ClerkUserSummary | null> {
    const clerk = getClerk();
    if (!clerk) return null;
    try {
        const user = await clerk.users.getUser(userId);
        return normalize(user);
    } catch {
        return null;
    }
}

/** Fetch many users by id, tolerating individual failures. */
export async function getClerkUsersByIds(
    ids: string[]
): Promise<Map<string, ClerkUserSummary>> {
    const map = new Map<string, ClerkUserSummary>();
    const clerk = getClerk();
    if (!clerk || ids.length === 0) return map;

    try {
        const res = await clerk.users.getUserList({ userId: ids, limit: ids.length });
        for (const user of res.data) {
            map.set(user.id, normalize(user));
        }
    } catch {
        // Fall back to no enrichment.
    }
    return map;
}
