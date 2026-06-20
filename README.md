# Protine Admin Panel

Admin dashboard for Protine Web — Next.js 16 + React 19 + MUI v9.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Pages
| Route | Page |
|---|---|
| `/login` | Admin Login |
| `/` | Dashboard |
| `/products` | Products CRUD |
| `/categories` | Categories CRUD |
| `/orders` | Orders + status updates |
| `/users` | User management |
| `/invoices` | Invoices |
| `/delivery` | Delivery tracking |
| `/support` | Support tickets |
| `/analytics` | Analytics |
| `/settings` | Settings |

## Env
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=https://api.protineweb.com/v1
```
