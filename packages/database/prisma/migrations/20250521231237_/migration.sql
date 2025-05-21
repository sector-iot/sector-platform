/*
  Warnings:

  - You are about to drop the `GroupDevice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RepositoryGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GroupDevice" DROP CONSTRAINT "GroupDevice_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "GroupDevice" DROP CONSTRAINT "GroupDevice_groupId_fkey";

-- DropForeignKey
ALTER TABLE "RepositoryGroup" DROP CONSTRAINT "RepositoryGroup_groupId_fkey";

-- DropForeignKey
ALTER TABLE "RepositoryGroup" DROP CONSTRAINT "RepositoryGroup_repositoryId_fkey";

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "repositoryId" TEXT;

-- DropTable
DROP TABLE "GroupDevice";

-- DropTable
DROP TABLE "RepositoryGroup";

-- CreateTable
CREATE TABLE "_DeviceToGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DeviceToGroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DeviceToGroup_B_index" ON "_DeviceToGroup"("B");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeviceToGroup" ADD CONSTRAINT "_DeviceToGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeviceToGroup" ADD CONSTRAINT "_DeviceToGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
