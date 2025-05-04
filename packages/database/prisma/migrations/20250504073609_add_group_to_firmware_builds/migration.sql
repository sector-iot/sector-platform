-- AlterTable
ALTER TABLE "FirmwareBuilds" ADD COLUMN     "groupId" TEXT;

-- AddForeignKey
ALTER TABLE "FirmwareBuilds" ADD CONSTRAINT "FirmwareBuilds_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
