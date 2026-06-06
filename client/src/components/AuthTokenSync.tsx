import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from '../api/authHeaders';

/** Keeps the API client supplied with the current Clerk session token. */
export default function AuthTokenSync() {
    const { getToken, isLoaded } = useAuth();

    useEffect(() => {
        if (!isLoaded) return;
        setAuthTokenGetter(() => getToken());
    }, [getToken, isLoaded]);

    return null;
}
