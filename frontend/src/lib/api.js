import { useCallback } from 'react';
import { useSession } from './auth';

const API_BASE = '/api';

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

export const apiFetch = async (path, { token, method = 'GET', body } = {}) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data = null;
    try {
        data = await response.json();
    }
    catch {
        // non-JSON body — fall through with a status-based message
    }
    if (!response.ok || data?.success === false) {
        throw new ApiError(data?.message || `Request failed (${response.status}).`, response.status);
    }
    // A 200 with a non-JSON body means the API isn't mounted (SPA fallback answered instead).
    if (data === null) throw new ApiError('API is unavailable right now. Try again in a minute.', 503);
    return data;
};

/** Returns an `api(path, opts)` function that attaches the Clerk session token. */
export const useApi = () => {
    const { getToken } = useSession();
    return useCallback(async (path, opts = {}) => {
        const token = await getToken();
        return apiFetch(path, { ...opts, token });
    }, [getToken]);
};
