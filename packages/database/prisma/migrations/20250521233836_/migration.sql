/*
  Warnings:

  - You are about to drop the `_DeviceToGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_DeviceToGroup" DROP CONSTRAINT "_DeviceToGroup_A_fkey";

-- DropForeignKey
ALTER TABLE "_DeviceToGroup" DROP CONSTRAINT "_DeviceToGroup_B_fkey";

-- AlterTable
ALTER TABLE "device" ADD COLUMN     "groupId" TEXT;

-- DropTable
DROP TABLE "_DeviceToGroup";

-- AddForeignKey
ALTER TABLE "device" ADD CONSTRAINT "device_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
