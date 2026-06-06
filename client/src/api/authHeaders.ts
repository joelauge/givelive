let authTokenGetter: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: () => Promise<string | null>) {
    authTokenGetter = getter;
}

export async function buildAuthHeaders(
    extra: Record<string, string> = {}
): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...extra,
    };

    if (authTokenGetter) {
        const token = await authTokenGetter();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
    }

    return headers;
}
