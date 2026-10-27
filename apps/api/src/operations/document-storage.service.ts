import { Injectable, InternalServerErrorException, NotFoundException, OnModuleInit } from '@nestjs/common'
import { createHash, randomUUID } from 'crypto'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { join, resolve } from 'path'

export interface StoredDocument { storageKey: string; size: number }

/**
 * Binary storage stays outside PostgreSQL. Additional production providers
 * (for example S3-compatible object storage) implement this contract instead
 * of changing the document metadata/workflow layer.
 */
export interface DocumentStorageProvider {
  store(companyId: string, originalName: string, data: Buffer): Promise<StoredDocument>
  read(storageKey: string): Promise<Buffer>
}

@Injectable()
export class DocumentStorageService implements DocumentStorageProvider, OnModuleInit {
  private readonly root = resolve(process.env.DOCUMENT_STORAGE_DIR ?? join(process.cwd(), 'storage', 'documents'))

  onModuleInit() {
    const isProduction = process.env.NODE_ENV === 'production'
    const provider = process.env.DOCUMENT_STORAGE_PROVIDER ?? (isProduction ? '' : 'local')

    // A serverless/container release must opt in explicitly to local storage;
    // otherwise an unavailable object-storage configuration cannot masquerade
    // as a successful document service.
    if (isProduction && provider !== 'local') {
      throw new Error('Production document storage is not configured. Set DOCUMENT_STORAGE_PROVIDER to a supported provider.')
    }
    if (isProduction && process.env.ALLOW_LOCAL_DOCUMENT_STORAGE !== 'true') {
      throw new Error('Local document storage is disabled in production. Configure an object-storage provider or explicitly set ALLOW_LOCAL_DOCUMENT_STORAGE=true for a persistent-volume deployment.')
    }
  }

  async store(companyId: string, originalName: string, data: Buffer): Promise<StoredDocument> {
    const digest = createHash('sha256').update(data).digest('hex').slice(0, 16)
    const storageKey = join(companyId, `${Date.now()}-${randomUUID()}-${digest}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
    const target = resolve(this.root, storageKey)
    if (!target.startsWith(this.root)) throw new InternalServerErrorException('Invalid document storage path')
    await mkdir(join(target, '..'), { recursive: true })
    await writeFile(target, data)
    return { storageKey: storageKey.replaceAll('\\', '/'), size: data.byteLength }
  }

  async read(storageKey: string) {
    const target = resolve(this.root, storageKey)
    if (!target.startsWith(this.root)) throw new NotFoundException('Document file not found')
    try { return await readFile(target) } catch { throw new NotFoundException('Document file not found') }
  }
}
