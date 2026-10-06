import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/app-download — public endpoint, returns active app downloads (for login screen)
export async function GET() {
  const apps = await db.appDownload.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    apps: apps.map((a) => ({
      id: a.id,
      platform: a.platform,
      version: a.version,
      fileName: a.fileName,
      filePath: a.filePath,
      fileSize: a.fileSize,
      createdAt: a.createdAt.toISOString(),
    })),
  })
}
