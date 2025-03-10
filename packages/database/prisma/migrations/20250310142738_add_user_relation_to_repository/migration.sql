/*
  Warnings:

  - Added the required column `userId` to the `Repository` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
