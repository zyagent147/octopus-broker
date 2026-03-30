/**
 * 微信云托管配置
 * 
 * 使用说明：
 * 1. 在微信云托管控制台创建服务
 * 2. 将环境ID填入 env
 * 3. 将服务名填入 service
 * 4. 部署后端服务到云托管
 * 
 * 如果云托管服务暂未部署，可设置 enabled: false 使用模拟数据模式
 */

// 微信云托管环境配置
export const WX_CLOUD_CONFIG = {
  // 云托管环境ID（从微信云托管控制台获取）
  env: 'prod-9gchot580b331407',
  
  // 云托管服务名（在云托管控制台创建的服务名称）
  service: 'express-xhvf',
  
  // 是否启用云托管
  // true: 使用云托管调用
  // false: 使用传统 HTTP 请求（适合 H5 开发或服务未部署时）
  enabled: true,
  
  // 云托管调用失败时是否回退到 HTTP 请求
  fallbackToHttp: true,
}

/**
 * 获取云托管请求头
 */
export const getCloudContainerHeaders = (): Record<string, string> => ({
  'X-WX-SERVICE': WX_CLOUD_CONFIG.service,
  'Content-Type': 'application/json',
})

/**
 * 检查云托管是否可用
 */
export const isCloudContainerAvailable = (): boolean => {
  // 只在微信小程序环境且启用云托管时返回 true
  return WX_CLOUD_CONFIG.enabled
}
