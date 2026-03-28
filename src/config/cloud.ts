/**
 * 微信云托管配置
 * 
 * 使用说明：
 * 1. 在微信云托管控制台创建服务
 * 2. 将服务名填入 WX_CONTAINER_SERVICE
 * 3. 将环境ID填入 WX_CONTAINER_ENV
 * 4. 部署后端服务到云托管
 */

// 微信云托管环境配置
export const WX_CLOUD_CONFIG = {
  // 云托管环境ID（从微信云托管控制台获取）
  env: 'prod-9gchot580b331407',
  
  // 云托管服务名（在云托管控制台创建的服务名称）
  service: 'express-xhvf',
  
  // 是否启用云托管（小程序端自动检测）
  enabled: true,
}

/**
 * 获取云托管请求头
 */
export const getCloudContainerHeaders = (): Record<string, string> => ({
  'X-WX-SERVICE': WX_CLOUD_CONFIG.service,
})
