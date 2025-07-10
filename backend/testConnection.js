import prisma from './lib/prisma.js'

async function main() {
  const users = await prisma.user.findMany()
  console.log('Users:', users)
}

main()
  .catch((e) => {
    console.error('❌ Error connecting to database:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })