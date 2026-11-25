-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General';

-- CreateTable
CREATE TABLE "SectionProgress" (
    "id" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrollmentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,

    CONSTRAINT "SectionProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SectionProgress_sectionId_idx" ON "SectionProgress"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionProgress_enrollmentId_sectionId_key" ON "SectionProgress"("enrollmentId", "sectionId");

-- CreateIndex
CREATE INDEX "Course_category_idx" ON "Course"("category");

-- AddForeignKey
ALTER TABLE "SectionProgress" ADD CONSTRAINT "SectionProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionProgress" ADD CONSTRAINT "SectionProgress_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CourseSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
