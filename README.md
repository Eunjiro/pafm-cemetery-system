# PAFM - Public Affairs Management System

A comprehensive death registration and permit management system built with Next.js, TypeScript, and PostgreSQL.

## 🚀 Features

### Core Services
- **Death Registration** - Digital submission and verification of death certificates
- **Burial Permits** - Application and approval workflow for burial permits
- **Cemetery Integration** - Automated plot assignment via PAFM-C cemetery system
- **Cremation Permits** - Processing of cremation requests
- **Exhumation Permits** - Management of exhumation applications
- **Death Certificate Requests** - Issuance of official death certificates

### System Features
- Role-based access control (Admin, Employee, Citizen)
- Online payment integration
- Document upload and verification
- Audit logging
- Email notifications
- RESTful API for external integrations

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your application URL
- `CEMETERY_API_BASE_URL` - PAFM-C cemetery system URL (optional)
- `CEMETERY_API_KEY` - API key from PAFM-C admin (optional)

### 3. Setup Database

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed initial data (optional)
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 📚 Documentation

- **[Setup Guide](./SETUP.md)** - Detailed installation instructions
- **[Cemetery Integration](./CEMETERY_INTEGRATION_GUIDE.md)** - PAFM-C integration guide
- **[Payment Integration](./README_PAYMENT_INTEGRATION.md)** - Payment gateway setup
- **[API Documentation](./docs/)** - API endpoints and usage

## 🏗️ Project Structure

```
pafm-final/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # Shared components
│   ├── dashboard/         # User dashboard
│   ├── services/          # Service-specific pages
│   │   └── cemetery/      # Cemetery integration UI
│   └── ...
├── lib/                   # Utility libraries
│   ├── cemetery-api.ts    # PAFM-C API client
│   ├── payment.ts         # Payment processing
│   └── prisma.ts          # Database client
├── prisma/                # Database schema and migrations
│   ├── schema.prisma
│   └── migrations/
└── docs/                  # Additional documentation
```

## 🔐 Default Credentials

After running seed data:

**Admin Account:**
- Email: admin@pafm.gov
- Password: admin123

**Employee Account:**
- Email: employee@pafm.gov
- Password: employee123

⚠️ **Change these in production!**

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Update these for production:
- Set `NODE_ENV=production`
- Use production database URL
- Configure production `NEXTAUTH_URL`
- Enable proper logging

See [deployment guide](./docs/DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Add your license here]

## 📞 Support

For technical support or questions:
- Check documentation in `/docs`
- Review troubleshooting guides
- Contact system administrator

---

Built with ❤️ using [Next.js](https://nextjs.org) and [Prisma](https://prisma.io)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
