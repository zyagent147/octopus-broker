/**
 * 微信云托管配置
 * 
 * 注意：如果未在微信云托管控制台部署服务，请将 enabled 设置为 false
 * 系统会自动降级使用 HTTP 请求
 */

// 微信云托管环境配置
export const WX_CLOUD_CONFIG = {
  // 云托管环境ID（从微信云托管控制台获取）
  // 如果未部署云托管服务，请将 enabled 设置为 false
  env: '',
  
  // 云托管服务名（在云托管控制台创建的服务名称）
  service: '',
  
  // 是否启用云托管
  // false: 使用传统 HTTP 请求
  // true: 使用微信云托管 wx.cloud.callContainer
  enabled: false,
}

/**
 * 获取云托管请求头
 */
export const getCloudContainerHeaders = (): Record<string, string> => {
  if (!WX_CLOUD_CONFIG.service) {
    return {}
  }
  return {
    'X-WX-SERVICE': WX_CLOUD_CONFIG.service,
  }
}
