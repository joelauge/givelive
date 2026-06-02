import axios from 'axios';

const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface FacebookTokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
}

export interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
    tasks: string[];
    instagram_business_account?: {
        id: string;
        username: string;
    };
}

export class MetaService {
    static async exchangeCodeForToken(code: string, redirectUri: string) {
        const response = await axios.get<FacebookTokenResponse>(`${GRAPH_API_BASE}/oauth/access_token`, {
            params: {
                client_id: process.env.FACEBOOK_APP_ID,
                client_secret: process.env.FACEBOOK_APP_SECRET,
                redirect_uri: redirectUri,
                code: code,
            },
        });
        return response.data;
    }

    static async getLongLivedToken(shortLivedToken: string) {
        const response = await axios.get<FacebookTokenResponse>(`${GRAPH_API_BASE}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: process.env.FACEBOOK_APP_ID,
                client_secret: process.env.FACEBOOK_APP_SECRET,
                fb_exchange_token: shortLivedToken,
            },
        });
        return response.data;
    }

    static async getUserPages(userAccessToken: string) {
        const response = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
            params: {
                access_token: userAccessToken,
                fields: 'id,name,access_token,tasks,instagram_business_account{id,username}',
            },
        });
        return response.data.data as FacebookPage[];
    }

    static async subscribeToWebhooks(pageId: string, pageAccessToken: string) {
        const response = await axios.post(`${GRAPH_API_BASE}/${pageId}/subscribed_apps`, {
            subscribed_fields: ['messages', 'messaging_postbacks', 'comments'],
        }, {
            params: {
                access_token: pageAccessToken,
            },
        });
        return response.data;
    }

    static async sendIGMessage(recipientId: string, pageAccessToken: string, messageText: string) {
        const response = await axios.post(`${GRAPH_API_BASE}/me/messages`, {
            recipient: { id: recipientId },
            message: { text: messageText },
        }, {
            params: {
                access_token: pageAccessToken,
            },
        });
        return response.data;
    }

    static async sendFBMessage(recipientId: string, pageAccessToken: string, messageText: string) {
        // Facebook Messenger uses the same /me/messages endpoint but traditionally with Page Access Token
        return this.sendIGMessage(recipientId, pageAccessToken, messageText);
    }
}
