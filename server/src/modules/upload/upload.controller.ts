import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UploadService } from './upload.service'

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件')
    }

    // 获取文件内容 - 支持小程序端 file.path 和 H5 端 file.buffer
    let fileContent: Buffer
    if (file.buffer) {
      // H5 端：直接使用 buffer
      fileContent = file.buffer
    } else if (file.path) {
      // 小程序端：读取临时文件
      const fs = require('fs')
      fileContent = fs.readFileSync(file.path)
    } else {
      throw new BadRequestException('无法读取文件内容')
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = file.originalname.split('.').pop() || 'jpg'
    const fileName = `properties/${timestamp}_${randomStr}.${ext}`

    // 上传文件
    const result = await this.uploadService.uploadFile(
      fileContent,
      fileName,
      file.mimetype || 'image/jpeg',
    )

    return {
      code: 200,
      msg: '上传成功',
      data: {
        key: result.key,
        url: result.url,
      },
    }
  }
}
