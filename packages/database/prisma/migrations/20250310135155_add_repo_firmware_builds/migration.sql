-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('BUILDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "device" ADD COLUMN     "repositoryId" TEXT;

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirmwareBuilds" (
    "id" TEXT NOT NULL,
    "version" DOUBLE PRECISION NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "status" "BuildStatus" NOT NULL DEFAULT 'BUILDING',

    CONSTRAINT "FirmwareBuilds_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareBuilds" ADD CONSTRAINT "FirmwareBuilds_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
