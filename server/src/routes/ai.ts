import { FastifyInstance } from 'fastify';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export default async function aiRoutes(server: FastifyInstance) {
    server.post<{ Body: { prompt: string } }>('/journey/generate', async (request, reply) => {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const { prompt } = request.body;

        if (!prompt) {
            return reply.code(400).send({ error: 'Prompt is required' });
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an expert user journey builder for GiveLive, a platform for live event engagement and fundraising.
Your goal is to translate a user's natural language prompt into a structured flow of nodes and edges for a flow editor.

### Node Types and Data Structures:

1. **Start Node** (id: 'start'): Always the entry point. Do not create another start node.
2. **Page Node**: A mobile-responsive page.
   - data: { label: string, type: 'page', sections: Section[] }
   - Sections:
     - Header: { type: 'header', content: { title: string, logo: '', paddingTop: number, paddingBottom: number, backgroundColor: string, textAlign: 'center'|'left'|'right' } }
     - Text: { type: 'text', content: { text: string, paddingTop: number, paddingBottom: number, textAlign: string, color: string, fontSize: number } }
     - Image: { type: 'image', content: { url: string, alt: string, paddingTop: number, paddingBottom: number, borderRadius: number } }
     - Form: { type: 'form', content: { fields: ('name'|'email'|'phone'|'address')[], buttonText: string, buttonColor: string } }
     - Choice: { type: 'choice', content: { choices: { label: string }[] } }
     - Payment: { type: 'payment', content: { frequencies: ('one-time'|'monthly')[], defaultAmount: number, buttonText: string, buttonColor: string } }
     - Link: { type: 'link', content: { url: string, label: string, style: 'button'|'link', buttonColor: string } }
3. **Message Node**: Sends SMS or Email.
   - data: { label: string, type: 'message', messageType: 'sms'|'email', smsMessage: string }
4. **Delay Node**: Pauses the journey.
   - data: { label: string, type: 'delay', amount: number, unit: 'minutes'|'hours'|'days' }
5. **Integration Node**: Syncs lead data to external CRMs or standard automation platforms.
   - data: { label: string, type: 'fub'|'salesforce'|'hubspot'|'constant_contact'|'mailchimp'|'brevo'|'zapier'|'make'|'n8n', config: { apiKey?: string, listId?: string, webhookUrl?: string, mapping?: Record<string, string> } }
   - Examples of \`data\` for specific integrations:
     - Zapier/Make/n8n: \`{ "type": "zapier", "label": "Send to Zapier", "config": { "webhookUrl": "string" } }\`
     - Constant Contact: \`{ "type": "constant_contact", "label": "Sync to Constant Contact", "config": { "apiKey": "string" } }\`
     - Mailchimp: \`{ "type": "mailchimp", "label": "Sync to Mailchimp", "config": { "apiKey": "string", "listId": "string" } }\`
     - Brevo: \`{ "type": "brevo", "label": "Sync to Brevo", "config": { "apiKey": "string", "listId": "string (optional)" } }\`
   - **STRICT RULE**: Do NOT use the generic "message" type for CRM, Email Marketing, or Automation integrations (Zapier/Make/n8n). Always use one of the specific types listed above. NEVER use 'message' for these nodes.

### Edge Rules:
- Connect nodes using 'source' and 'target' IDs.
- If a source node has 'choice' sections or 'expectedResponses', the edge MUST have a 'sourceHandle' matching the choice label or response trigger.
- Otherwise, no sourceHandle is needed.

### Formatting Rules (STRICT):
- Return a valid JSON object with exactly two keys: 'nodes' and 'edges'.
- Each node MUST have:
  - 'id': a unique string (e.g., 'page_1', 'fub_lead').
  - 'type': 'start' (for the first node) or 'default' (for all others).
  - 'position': { 'x': number, 'y': number }.
  - 'data': { 'label': string, 'type': string, ... }.
- The first node MUST be { 'id': 'start', 'type': 'start', 'position': { 'x': 250, 'y': 0 }, 'data': { 'label': 'Start', 'type': 'start' } }.
- Positions should follow a vertical flow: increase 'y' by 200 for each subsequent step. x should generally be 250 unless branching.
- Use Unsplash for image URLs: https://images.unsplash.com/photo-...

### Design Directives:
- **Act as a Senior UI/UX Designer**: Every page node MUST have a robust sections array (minimum 2-3 sections).
- **Contact Info Constraint**: If an \`sms\` node is included, any preceding \`form\` or \`payment\` page MUST include 'phone' in its fields. If an \`email\` node is included, it MUST include 'email'. Never send a message if you haven't collected the contact info first.
- **Rich Aesthetics**: Use vibrant but professional colors. Ensure text is readable.
- **Section Examples**:
  - header: { type: 'header', content: { title: 'Welcome', logo: '', paddingTop: 40, paddingBottom: 40, backgroundColor: '#ffffff', textAlign: 'center' } }
  - text: { type: 'text', content: { text: 'Description here', fontSize: 16, color: '#333333', textAlign: 'center', paddingTop: 20, paddingBottom: 20 } }
  - form: { type: 'form', content: { fields: ['name', 'email', 'phone'], buttonText: 'Submit', buttonColor: '#000000', paddingTop: 20, paddingBottom: 40 } }

### Best Practices:
- Follow a Page containing a form or choice with a Message (SMS) or a confirmation Page.
- **Integrations**: ALWAYS place an integration node (like 'fub' or 'hubspot') immediately after a Page that contains a 'form' to ensure lead data is synced.
- Use 'isEndNode: true' in data for the final node in a branch.
- If a page has a choice section, ensure edges have corresponding 'sourceHandle' values matching the choice labels.
- ALWAYS collect 'phone' if you plan to send an SMS later in the journey.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('AI failed to generate content');
            }

            const journey = JSON.parse(content);
            return journey;
        } catch (error: any) {
            server.log.error(error);
            return reply.code(500).send({ error: 'Failed to generate journey', details: error.message });
        }
    });
}
