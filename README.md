# Balance Sheet

A standalone React + Vite app that connects to the same Supabase database as the Finance Dashboard, deployed on a separate Vercel URL.

## Database Tables (shared with Finance Dashboard)

### income
| Column   | Type   |
|----------|--------|
| id       | int    |
| date     | text   |
| flat_no  | text   |
| category | text   |
| amount   | number |

### expenditure
| Column   | Type   |
|----------|--------|
| id       | int    |
| date     | text   |
| category | text   |
| amount   | number |

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Fill in your Supabase credentials in .env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 4. Run locally
npm run dev
```

## Deploy to Vercel

1. Push this `balancesheet` folder to a **new GitHub repository**
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import the new repo
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
5. Framework preset: **Vite**
6. Click **Deploy** ✅

This will give you a separate Vercel URL (e.g. `balancesheet.vercel.app`) pointing to the same Supabase database.

## Features

- **Overview tab** — KPI cards (Income, Expense, Balance, Savings Rate) + 6-month trend line + bar + donut charts
- **Income tab** — Full income table with search and month filter + running total
- **Expenses tab** — Full expense table with search and month filter + running total
