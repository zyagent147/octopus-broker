import { Injectable } from '@nestjs/common'
import { S3Storage } from 'coze-coding-dev-sdk'

@Injectable()
export class UploadService {
  private storage: S3Storage

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    })
  }

  /**
   * 上传文件
   * @param fileContent 文件内容 Buffer
   * @param fileName 文件名
   * @param contentType 文件类型
   * @returns 返回文件 key 和签名 URL
   */
  async uploadFile(
    fileContent: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<{ key: string; url: string }> {
    // 上传文件，获取实际的 key
    const key = await this.storage.uploadFile({
      fileContent,
      fileName,
      contentType,
    })

    // 生成签名 URL（有效期 30 天）
    const url = await this.storage.generatePresignedUrl({
      key,
      expireTime: 2592000, // 30 天
    })

    return { key, url }
  }

  /**
   * 删除文件
   * @param key 文件 key
   */
  async deleteFile(key: string): Promise<boolean> {
    return this.storage.deleteFile({ fileKey: key })
  }

  /**
   * 获取文件访问 URL
   * @param key 文件 key
   * @param expireTime 有效期（秒）
   */
  async getFileUrl(key: string, expireTime: number = 2592000): Promise<string> {
    return this.storage.generatePresignedUrl({ key, expireTime })
  }
}
