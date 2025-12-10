# Deployment Guide (Vercel)

## Prerequisites
- A Vercel account.
- A PostgreSQL database (e.g., Vercel Postgres, Neon, Supabase, or AWS RDS).

## Configuration Status
- **Vercel Config**: `vercel.json` is set up to handle API routes (Serverless) and Client-side routing.
- **Build Scripts**: Root `package.json` builds the client and installs server dependencies.
- **API Entry**: `api/index.ts` adapters the Fastify server for Vercel.

## ⚠️ Important Limitations
- **File Uploads**: The current local file upload implementation (`/api/upload` storing to `server/uploads`) **will not work** on Vercel because the file system is ephemeral. You must refactor this to use Vercel Blob, AWS S3, or Cloudinary for production.

## Environment Variables
Set the following variables in your Vercel Project Settings:

- `DATABASE_URL`: Connection string to your production PostgreSQL database.
- `givelive_POSTGRES_URL`: (Optional) Alternate connection string if using matching local setups.
- `VITE_API_URL`: `/api` (Optional, defaults correctly).
- Any other service keys (Twilio, SendGrid/Nodemailer, etc.) used in your `.env`.

## Database Migration
Run the migration script locally against your production database to create the schema.

```bash
# Export the prod URL in your terminal
export DATABASE_URL="postgres://user:pass@host:port/dbname?sslmode=require"

# Run the migration
cd server
npx ts-node src/db/migrate.ts
```

## Deployment Steps
1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy Preview**:
   ```bash
   vercel
   ```
   Follow the prompts. Set the build settings to default (it should auto-detect or use `package.json`).
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Deploy to Production**:
   ```bash
   vercel --prod
   ```
