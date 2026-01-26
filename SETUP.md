# PAFM Setup Instructions

## Database Setup

1. **Create PostgreSQL Database**:
   - Open PGAdmin
   - Create a new database named `pafm`
   - Update the `.env` file with your PostgreSQL credentials:
     ```
     DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/pafm"
     ```

2. **Run Prisma Migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

## Running the Application

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:3000`

## Features Implemented

### Authentication
- ✅ User registration with role selection (USER, EMPLOYEE, ADMIN)
- ✅ Login with email and password
- ✅ Session management with NextAuth
- ✅ Password hashing with bcryptjs

### Pages
- ✅ Landing page with service cards
- ✅ Login page
- ✅ Register page
- ✅ Dashboard (protected route)

### Design
- ✅ Green color scheme
- ✅ Responsive navbar with logo
- ✅ Hero section
- ✅ Service cards for 5 modules:
  1. Cemetery and Burial Management
  2. Water Supply and Drainage Requests
  3. Assets Inventory Tracker
  4. Parks and Recreation Scheduling
  5. Facility Management

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  EMPLOYEE
  ADMIN
}
```

## Next Steps

1. Set up your PostgreSQL database in PGAdmin
2. Update the `.env` file with your database credentials
3. Run the migrations
4. Start the development server
5. Register a new account and test the login

## Environment Variables

Make sure to update these in your `.env` file:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Change to a secure random string in production
- `NEXTAUTH_URL`: Your application URL

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety
