import axios from 'axios';

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

export interface TikTokTokenResponse {
    access_token: string;
    expires_in: number;
    open_id: string;
    refresh_expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
}

export interface TikTokUserInfo {
    open_id: string;
    union_id?: string;
    avatar_url?: string;
    display_name?: string;
}

export class TikTokService {
    static async exchangeCodeForToken(code: string, redirectUri: string) {
        const params = new URLSearchParams();
        params.append('client_key', process.env.TIKTOK_CLIENT_KEY || '');
        params.append('client_secret', process.env.TIKTOK_CLIENT_SECRET || '');
        params.append('code', code);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', redirectUri);

        const response = await axios.post<TikTokTokenResponse>(`${TIKTOK_API_BASE}/oauth/token/`, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return response.data;
    }

    static async getUserInfo(accessToken: string) {
        const response = await axios.get(`${TIKTOK_API_BASE}/user/info/`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                fields: 'open_id,union_id,avatar_url,display_name',
            },
        });
        return response.data.data.user as TikTokUserInfo;
    }

    static async sendReply(commentId: string, accessToken: string, messageText: string) {
        // TikTok Business API V1.3+ Comment Reply
        const response = await axios.post(`${TIKTOK_API_BASE}/business/comment/reply/`, {
            comment_id: commentId,
            content: messageText,
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    }
}
