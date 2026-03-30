import Taro from '@tarojs/taro'
import { WX_CLOUD_CONFIG, getCloudContainerHeaders } from '@/config/cloud'

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

interface CloudContainerResponse {
  statusCode: number
  data: string
  header: Record<string, string>
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

// 检测是否为微信小程序环境且启用云托管
const shouldUseCloudContainer = (): boolean => {
  if (!WX_CLOUD_CONFIG.enabled) {
    return false
  }
  
  // 只在微信小程序环境使用云托管
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
  return isWeapp
}

// 微信云托管请求（带回退机制）
const cloudContainerRequest = async <T = any>(options: RequestOptions): Promise<T> => {
  const { url, method = 'GET', data, header = {}, showLoading = false } = options

  // 自动添加 token
  const token = getToken()
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }
  
  // 添加云托管服务标识
  Object.assign(header, getCloudContainerHeaders())

  // 打印请求信息
  console.log('📤 Cloud Container Request:', {
    env: WX_CLOUD_CONFIG.env,
    service: WX_CLOUD_CONFIG.service,
    path: url,
    method,
    data,
    header,
  })

  if (showLoading) {
    Taro.showLoading({ title: '加载中...', mask: true })
  }

  try {
    // 调用微信云托管容器
    const response = await Taro.cloud.callContainer({
      config: {
        env: WX_CLOUD_CONFIG.env,
      },
      path: url,
      header: {
        'Content-Type': 'application/json',
        ...header,
      },
      method,
      data,
    }) as unknown as CloudContainerResponse

    if (showLoading) {
      Taro.hideLoading()
    }

    // 解析响应数据
    let responseData: any
    try {
      responseData = JSON.parse(response.data)
    } catch {
      responseData = response.data
    }

    // 打印响应信息
    console.log('📥 Cloud Container Response:', {
      path: url,
      status: response.statusCode,
      data: responseData,
    })

    // HTTP 错误处理
    if (response.statusCode >= 400) {
      const errorMsg = responseData?.msg || `请求失败 (${response.statusCode})`
      Taro.showToast({ title: errorMsg, icon: 'none', duration: 2000 })
      throw new Error(errorMsg)
    }

    // 业务错误处理
    if (responseData && typeof responseData === 'object') {
      const { code, msg } = responseData
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

    console.error('❌ Cloud Container Error:', {
      path: url,
      error: error.message || error,
      errCode: error.errCode,
    })

    // 检查是否需要回退到 HTTP 请求
    if (WX_CLOUD_CONFIG.fallbackToHttp) {
      const domain = getProjectDomain()
      if (domain) {
        console.log('🔄 Fallback to HTTP request...')
        try {
          return await httpRequest<T>(options)
        } catch (fallbackError) {
          console.error('❌ HTTP Fallback Error:', fallbackError)
          throw fallbackError
        }
      }
    }

    // 网络错误提示
    const errorMessage = error.errCode === -1 
      ? '云托管服务未部署，请联系管理员' 
      : error.message || '请求失败'
    
    Taro.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 2000,
    })

    throw error
  }
}

// 传统 HTTP 请求（H5 或未启用云托管时使用）
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
   * - 小程序环境：使用微信云托管 wx.cloud.callContainer
   * - H5 环境：使用传统 HTTP 请求
   */
  async request<T = any>(options: RequestOptions): Promise<T> {
    // 判断是否使用云托管
    if (shouldUseCloudContainer()) {
      return cloudContainerRequest<T>(options)
    }
    return httpRequest<T>(options)
  },

  /**
   * 上传文件
   * 注意：云托管暂不支持文件上传，需要单独处理
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
