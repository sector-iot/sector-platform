import { PrismaClient } from "../generated/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Replace type declaration with a runtime-compatible const
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "../generated/client";