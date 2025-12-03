# GiveLive — Live Event Smart Fundraising Platform  
**Product Requirements Document (PRD)**  
Version: 1.0

---

## 📌 Overview

GiveLive is a web app + live-event service that turns real-time audience engagement into donations through QR-driven journeys. At a live event, the organizer displays a QR code. Audience members scan it and begin a dynamic storytelling funnel leading to giving.

GiveLive uses a *visual automation tree* (like Mailchimp’s customer journey builder) to create personalized multi-step donor funnels that may include videos, text messages, follow-up content, and final donation asks.

---

## 🎯 Goals

- Convert anonymous live audiences into segmented donors.
- Build real-time storytelling funnels starting from a single QR scan.
- Allow organizers to design a multi-step, branching, personalized donor journey.
- Optimize donor conversion with analytics and per-node tracking.
- Support follow-up after the event via text and dynamic pages.

---

## 🧩 Key Components

### 1. **Live Event QR System**
- Each event generates a unique QR code and URL.
- QR sends users directly to the event’s funnel landing page.
- Track number of scans, conversions, dropoffs.

### 2. **Funnel Page Builder**
- Drag-and-drop page builder for the landing page.
- Content types include:
  - Video (hosted or uploaded)
  - Headline/subtext
  - Description
  - Phone number collection
  - CTA buttons

### 3. **Journey Automation Tree**
A visual “flow builder” with node types:
- **Page Node**
- **SMS Node** (Twilio)
- **Delay Node**
- **Condition Node**
- **Donation Node** (Stripe)
- **End Node**

Each node creates a hosted mini-page with analytics.

### 4. **User Tracking**
- Per-user progress tracking.
- Node completions.
- Branching logic based on:
  - Link clicks
  - Form submissions
  - Video watch %
  - Time-based actions

### 5. **Donation Flow**
- Final “Ask Page”
- Supports:
  - One-time donation
  - Monthly recurring
  - Predefined giving amounts
- Integrated via Stripe

### 6. **Analytics Dashboard**
Metrics include:
- Funnel conversion %
- QR scans
- Donations (total, avg, recurring)
- Per-node dropoff
- SMS open/click rates

---

## 🛠 Tech Stack

### Frontend  
- React + Vite or Next.js  
- TailwindCSS  
- TypeScript  

### Backend  
- Node.js (Fastify or NestJS)  
- Supabase / PostgreSQL  
- Redis for queues + caching  

### Integrations  
- Twilio SMS  
- Stripe Payments  
- Supabase Storage or S3  

### Hosting  
- Vercel for UI  
- Fly.io or Railway for backend  
- Supabase for authentication + DB  

---

## 🗄 Database Models (v1)

### `events`
```
id
org_id
name
date
qr_url
root_node_id
created_at
updated_at
```

### `journey_nodes`
```
id
event_id
type ("page", "sms", "delay", "condition", "donation", "end")
config (JSON)
next_nodes (array)
created_at
```

### `users`
```
id
phone_number
event_id
consent (bool)
created_at
```

### `user_progress`
```
id
user_id
event_id
current_node_id
completed_nodes (array)
updated_at
```

### `donations`
```
id
user_id
event_id
amount
recurring (bool)
stripe_charge_id
created_at
```

---

## 🧭 User Flow

### **1. Organizer creates event**
→ enters event details  
→ receives QR code  
→ edits funnel page  

### **2. Audience scans QR**
→ enters GiveLive funnel  
→ watches story video  
→ enters phone number  

### **3. Automation Tree launches**
→ sends them to next page or SMS  
→ follows conditional logic  
→ may trigger multi-day follow-up  

### **4. Donation Ask**
→ user reaches final ask page  
→ completes Stripe checkout  

### **5. Analytics & Optimization**
→ per-node performance  
→ donations tracked  
→ funnel insights  

---

## 📈 Future Features

- AI-powered journey recommendations  
- A/B testing  
- Personalized video (“thank you <name>”)  
- CRM integrations (HubSpot, Salesforce)  
- Multi-user organization accounts  

---

# 📚 End of PRD
