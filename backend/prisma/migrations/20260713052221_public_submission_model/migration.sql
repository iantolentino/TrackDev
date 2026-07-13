-- DropForeignKey
ALTER TABLE `activitylog` DROP FOREIGN KEY `ActivityLog_actorId_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `Ticket_createdById_fkey`;

-- AlterTable
ALTER TABLE `activitylog` MODIFY `actorId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `requesterEmail` VARCHAR(191) NULL,
    ADD COLUMN `requesterName` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'BACKLOG', 'TODO', 'IN_PROGRESS', 'AWAITING_INFO', 'COMPLETE', 'CANCELLED') NOT NULL DEFAULT 'TODO',
    MODIFY `createdById` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `BlockedEmail` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `blockedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BlockedEmail_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BlockedEmail` ADD CONSTRAINT `BlockedEmail_blockedById_fkey` FOREIGN KEY (`blockedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
