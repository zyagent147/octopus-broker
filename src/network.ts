import Taro from '@tarojs/taro'

// 使用 Taro defineConstants 定义的常量（构建时注入）
// 在 config/index.ts 的 defineConstants 中配置
declare const PROJECT_DOMAIN: string

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  showLoading?: boolean
}

interface UploadFileOptions {
  url: string
  filePath: string
  name: string
  header?: Record<string, string>
  formData?: Record<string, any>
}

interface DownloadFileOptions {
  url: string
  header?: Record<string, string>
}

// 获取存储的 token
const getToken = (): string | null => {
  try {
    const userStorage = Taro.getStorageSync('user-storage')
    if (userStorage) {
      const parsed = JSON.parse(userStorage)
      return parsed?.state?.token || null
    }
    return null
  } catch {
    return null
  }
}

// 获取项目域名
const getProjectDomain = (): string => {
  // 优先使用构建时注入的常量
  if (typeof PROJECT_DOMAIN !== 'undefined' && PROJECT_DOMAIN) {
    return PROJECT_DOMAIN
  }
  return ''
}

// HTTP 请求
const httpRequest = async <T = any>(options: RequestOptions): Promise<T> => {
  const { url, method = 'GET', data, header = {}, showLoading = false } = options

  // 自动添加 token
  const token = getToken()
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  // 构建完整 URL
  const projectDomain = getProjectDomain()
  const fullUrl = url.startsWith('http') ? url : `${projectDomain}${url}`

  // 打印请求信息
  console.log('📤 HTTP Request:', {
    url: fullUrl,
    method,
    data,
    header,
  })

  if (showLoading) {
    Taro.showLoading({ title: '加载中...', mask: true })
  }

  try {
    const response = await Taro.request({
      url: fullUrl,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header,
      },
    })

    if (showLoading) {
      Taro.hideLoading()
    }

    // 打印响应信息
    console.log('📥 HTTP Response:', {
      url: fullUrl,
      status: response.statusCode,
      data: response.data,
    })

    const { statusCode, data: responseData } = response

    // HTTP 错误处理
    if (statusCode >= 400) {
      const errorMsg = (responseData as any)?.msg || `请求失败 (${statusCode})`
      Taro.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
      throw new Error(errorMsg)
    }

    // 业务错误处理
    if (responseData && typeof responseData === 'object') {
      const { code, msg } = responseData as any
      if (code && code !== 200) {
        Taro.showToast({ title: msg || '操作失败', icon: 'none', duration: 2000 })
        throw new Error(msg || '操作失败')
      }
    }

    return responseData as T
  } catch (error: any) {
    if (showLoading) {
      Taro.hideLoading()
    }

    console.error('❌ HTTP Error:', {
      url: fullUrl,
      error: error.message,
    })

    // 网络错误提示
    if (!error.message?.includes('请求失败')) {
      Taro.showToast({
        title: '网络请求失败，请检查网络连接',
        icon: 'none',
        duration: 2000,
      })
    }

    throw error
  }
}

// 网络请求封装
export const Network = {
  /**
   * 发送网络请求
   */
  async request<T = any>(options: RequestOptions): Promise<T> {
    return httpRequest<T>(options)
  },

  /**
   * 上传文件
   */
  async uploadFile(options: UploadFileOptions): Promise<any> {
    const { url, filePath, name, header = {}, formData = {} } = options

    // 自动添加 token
    const token = getToken()
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    // 构建完整 URL
    const projectDomain = getProjectDomain()
    const fullUrl = url.startsWith('http') ? url : `${projectDomain}${url}`

    console.log('📤 Upload File:', {
      url: fullUrl,
      filePath,
      name,
      header,
    })

    try {
      const response = await Taro.uploadFile({
        url: fullUrl,
        filePath,
        name,
        header,
        formData,
      })

      console.log('📥 Upload Response:', {
        url: fullUrl,
        status: response.statusCode,
        data: response.data,
      })

      const { statusCode, data } = response

      if (statusCode >= 400) {
        const errorMsg = JSON.parse(data).msg || `上传失败 (${statusCode})`
        Taro.showToast({ title: errorMsg, icon: 'none' })
        throw new Error(errorMsg)
      }

      const result = JSON.parse(data)
      if (result.code && result.code !== 200) {
        Taro.showToast({ title: result.msg || '上传失败', icon: 'none' })
        throw new Error(result.msg || '上传失败')
      }

      return result
    } catch (error: any) {
      console.error('❌ Upload Error:', error)
      throw error
    }
  },

  /**
   * 下载文件
   */
  async downloadFile(options: DownloadFileOptions): Promise<string> {
    const { url, header = {} } = options

    // 自动添加 token
    const token = getToken()
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }

    // 构建完整 URL
    const projectDomain = getProjectDomain()
    const fullUrl = url.startsWith('http') ? url : `${projectDomain}${url}`

    console.log('📤 Download File:', { url: fullUrl })

    try {
      const response = await Taro.downloadFile({
        url: fullUrl,
        header,
      })

      console.log('📥 Download Response:', {
        url: fullUrl,
        status: response.statusCode,
        tempFilePath: response.tempFilePath,
      })

      if (response.statusCode >= 400) {
        throw new Error(`下载失败 (${response.statusCode})`)
      }

      return response.tempFilePath
    } catch (error: any) {
      console.error('❌ Download Error:', error)
      throw error
    }
  },
}
