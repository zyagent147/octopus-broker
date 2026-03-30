import { Injectable } from '@nestjs/common'
import { S3Storage } from 'coze-coding-dev-sdk'
import * as COS from 'cos-nodejs-sdk-v5'

@Injectable()
export class UploadService {
  private storage: S3Storage | null = null
  private cos: COS | null = null
  private bucketName: string
  private region: string
  private useCustomCOS: boolean

  constructor() {
    // 检查是否在微信云托管环境中（通过 KUBERNETES_SERVICE_HOST 环境变量判断）
    const isInWeChatCloud = !!process.env.KUBERNETES_SERVICE_HOST
    const hasCOSCredentials = !!(process.env.COS_SECRET_ID && process.env.COS_SECRET_KEY)

    // 只在微信云托管环境中且配置了 COS 凭证时使用腾讯云 COS
    this.useCustomCOS = isInWeChatCloud && hasCOSCredentials
    this.bucketName = process.env.COS_BUCKET_NAME || '7072-prod-9gchot580b331407-1416950024'
    this.region = process.env.COS_REGION || 'ap-shanghai'

    if (this.useCustomCOS) {
      // 使用腾讯云 COS SDK
      this.cos = new COS({
        SecretId: process.env.COS_SECRET_ID!,
        SecretKey: process.env.COS_SECRET_KEY!,
      })
      console.log('📦 使用腾讯云 COS 存储:', this.bucketName)
    } else {
      // 使用 Coze 内置存储
      this.storage = new S3Storage({
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: '',
        secretKey: '',
        bucketName: process.env.COZE_BUCKET_NAME,
        region: 'cn-beijing',
      })
      console.log('📦 使用 Coze 内置存储')
    }
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
    // 生成文件 key
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 10)
    const ext = fileName.split('.').pop() || 'bin'
    const key = `properties/${timestamp}_${randomStr}.${ext}`

    if (this.useCustomCOS && this.cos) {
      // 使用腾讯云 COS SDK 上传
      await new Promise<void>((resolve, reject) => {
        this.cos!.putObject(
          {
            Bucket: this.bucketName,
            Region: this.region,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
          },
          (err, data) => {
            if (err) {
              console.error('上传到 COS 失败:', err)
              reject(err)
            } else {
              console.log('📤 文件已上传到 COS:', key)
              resolve()
            }
          },
        )
      })

      // 生成签名 URL（有效期 7 天）
      const url = await this.getFileUrl(key, 7 * 24 * 60 * 60)
      return { key, url }
    } else if (this.storage) {
      // 使用 Coze 内置存储
      const uploadedKey = await this.storage.uploadFile({
        fileContent,
        fileName,
        contentType,
      })

      // 生成签名 URL（有效期 30 天）
      const url = await this.storage.generatePresignedUrl({
        key: uploadedKey,
        expireTime: 2592000,
      })

      return { key: uploadedKey, url }
    }

    throw new Error('没有可用的存储服务')
  }

  /**
   * 删除文件
   * @param key 文件 key
   */
  async deleteFile(key: string): Promise<boolean> {
    if (this.useCustomCOS && this.cos) {
      return new Promise((resolve) => {
        this.cos!.deleteObject(
          {
            Bucket: this.bucketName,
            Region: this.region,
            Key: key,
          },
          (err, data) => {
            if (err) {
              console.error('删除文件失败:', err)
              resolve(false)
            } else {
              resolve(true)
            }
          },
        )
      })
    } else if (this.storage) {
      return this.storage.deleteFile({ fileKey: key })
    }

    return false
  }

  /**
   * 获取文件访问 URL
   * @param key 文件 key
   * @param expireTime 有效期（秒）
   */
  async getFileUrl(key: string, expireTime: number = 7 * 24 * 60 * 60): Promise<string> {
    if (this.useCustomCOS && this.cos) {
      return new Promise((resolve, reject) => {
        this.cos!.getObjectUrl(
          {
            Bucket: this.bucketName,
            Region: this.region,
            Key: key,
            Sign: true,
            Expires: expireTime,
          },
          (err, data) => {
            if (err) {
              console.error('获取签名 URL 失败:', err)
              reject(err)
            } else {
              resolve(data.Url)
            }
          },
        )
      })
    } else if (this.storage) {
      return this.storage.generatePresignedUrl({ key, expireTime })
    }

    return ''
  }
}
