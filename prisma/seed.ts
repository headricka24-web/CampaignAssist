import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const outlet = await prisma.outlet.upsert({
    where: { id: 'seed-outlet-1' },
    update: {},
    create: {
      id: 'seed-outlet-1',
      name: 'Local News Daily',
      type: 'News',
      reach: '50000',
    },
  })

  const candidate = await prisma.candidate.upsert({
    where: { id: 'seed-candidate-1' },
    update: {},
    create: {
      id: 'seed-candidate-1',
      name: 'Jane Smith',
      race: 'Senate District 12',
      state: 'TX',
      party: 'Democrat',
      incumbent: false,
    },
  })

  console.log('Seeded:', { outlet: outlet.name, candidate: candidate.name })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
