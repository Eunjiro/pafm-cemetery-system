import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Hash password for all accounts
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create Admin account
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pafm.com' },
    update: {},
    create: {
      email: 'admin@pafm.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN'
    }
  })

  // Create Employee account
  const employee = await prisma.user.upsert({
    where: { email: 'employee@pafm.com' },
    update: {},
    create: {
      email: 'employee@pafm.com',
      password: hashedPassword,
      name: 'Staff Employee',
      role: 'EMPLOYEE'
    }
  })

  // Create a regular user for testing
  const user = await prisma.user.upsert({
    where: { email: 'user@pafm.com' },
    update: {},
    create: {
      email: 'user@pafm.com',
      password: hashedPassword,
      name: 'Regular User',
      role: 'USER'
    }
  })

  console.log('✅ Seed completed successfully!')
  console.log('\nTest Accounts Created:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Admin Account:')
  console.log(`  Email: ${admin.email}`)
  console.log(`  Password: password123`)
  console.log(`  Role: ${admin.role}`)
  console.log('\nEmployee Account:')
  console.log(`  Email: ${employee.email}`)
  console.log(`  Password: password123`)
  console.log(`  Role: ${employee.role}`)
  console.log('\nUser Account:')
  console.log(`  Email: ${user.email}`)
  console.log(`  Password: password123`)
  console.log(`  Role: ${user.role}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
