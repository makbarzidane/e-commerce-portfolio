# Zimeira Hijab Store

Zimeira Hijab Store is a demo full-stack ecommerce website for a local hijab brand. The project is built as a portfolio-ready foundation with customer shopping flows, admin CMS flows, database models, authentication, checkout, payment/shipping adapters, and integration placeholders for production services.

## Live Demo

Production URL:

https://ecommerce-hijab-iota.vercel.app

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui-style components
- Prisma ORM
- PostgreSQL
- Auth.js / NextAuth
- Vercel deployment

## Main Features

- Customer storefront with home, catalog, product detail, cart, checkout, account, order status, tracking, help, about, and contact pages.
- Product catalog with categories, search, filters, wishlist, product variants, stock, labels, discounts, and placeholder images.
- Cart and checkout backed by database records when PostgreSQL is configured.
- Checkout supports shipping address, courier service selection, voucher discount, stock validation, order creation, and payment records.
- Payment adapter supports demo/manual payment and is prepared for Midtrans Snap.
- Shipping adapter supports demo fallback and is prepared for RajaOngkir or Biteship.
- Customer order detail includes payment continuation, order status, tracking number, invoice page, return request, and review flow.
- Admin panel with dashboard, products, categories, variants, orders, customers, vouchers, banners, store settings, reports, inventory logs, audit logs, and returns.
- Admin can update order status, payment status, shipping data, tracking number, stock, and CMS data.
- Sales report page supports weekly, monthly, and yearly summaries plus CSV export.
- Product image upload route is prepared for Cloudinary.
- Email notification helper is prepared for Resend.
- Phone verification helper is prepared for WhatsApp/SMS providers such as Fonnte.
- Prisma seed includes demo categories, products, variants, orders, and users.

## Demo Accounts

After running the database seed:

- Admin: `admin@zimeirahijab.test` / `password123`
- Customer: `customer@zimeirahijab.test` / `password123`

Do not use these credentials in production. Create a real admin account and replace the demo password before a public launch.

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the environment template:

```bash
copy .env.example .env
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Push the database schema:

```bash
npm run db:push
```

Seed demo data:

```bash
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Required for a real production deployment:

```env
DATABASE_URL=""
NEXTAUTH_SECRET=""
NEXTAUTH_URL=""
```

Optional integrations:

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION="false"
RAJAONGKIR_API_KEY=""
BITESHIP_API_KEY=""
SHIPPING_ORIGIN_CITY=""
SHIPPING_ORIGIN_POSTAL_CODE=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
RESEND_API_KEY=""
RESEND_FROM_EMAIL=""
FONNTE_API_KEY=""
```

## Local Database

This project expects PostgreSQL. For local development, you can use any PostgreSQL instance and set `DATABASE_URL` in `.env`.

Example local connection:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zimeira_hijab_store?schema=public"
```

If you use the existing local Docker container from this workspace:

```bash
docker start zimeira-postgres
```

## Important Folders

- `src/app` contains App Router routes for storefront, admin, and API endpoints.
- `src/components` contains UI, layout, product, checkout, admin, and auth components.
- `src/lib` contains data access, auth config, Prisma client, formatting helpers, integrations, reports, notifications, and rate limits.
- `src/lib/integrations` contains payment, shipping, and upload adapters.
- `prisma/schema.prisma` contains the database schema.
- `prisma/seed.js` contains demo seed data.
- `public/images/products` contains placeholder product images.
- `docs/QA_CHECKLIST.md` contains the end-to-end QA checklist.
- `docs/OPERATIONS.md` contains operational notes for backup, email, OTP, and integrations.

## Deployment Notes

The project is deployed to Vercel. Before using production features, configure these variables in the Vercel dashboard:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `FONNTE_API_KEY`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `RAJAONGKIR_API_KEY` or `BITESHIP_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

For portfolio mode, the public pages can render with demo fallback data, but authentication, checkout, admin CMS, and order management need a real PostgreSQL database.

## Production Roadmap

- Connect a hosted PostgreSQL database and seed safe demo data.
- Configure Google OAuth with verified email login.
- Verify a Resend sender domain and replace the default sender.
- Integrate Midtrans Snap payment and test webhook success, failed, expired, and refund events.
- Integrate RajaOngkir or Biteship for real shipping rates and package tracking.
- Configure Cloudinary and test real product image uploads from the admin panel.
- Replace demo phone OTP with a real WhatsApp/SMS provider.
- Add stronger production rate limits and monitoring.
- Run the full checklist in `docs/QA_CHECKLIST.md` before sharing the portfolio publicly.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run db:push
npm run db:seed
npm run db:backup
```

## License

This is a demo ecommerce project for portfolio and development purposes.
