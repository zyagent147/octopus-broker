import { Injectable, Logger } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)

  /**
   * 生成小红书推广文案
   */
  async generateXiaohongshuCopy(userId: string, propertyId: string) {
    const client = getSupabaseClient()

    // 获取房源信息
    const { data: property, error } = await client
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !property) {
      throw new Error('房源不存在')
    }

    // 构建房源描述
    const propertyInfo = this.buildPropertyInfo(property)

    // 调用LLM生成文案
    const prompt = this.buildPrompt(propertyInfo)
    const copy = await this.callLLM(prompt)

    return { copy }
  }

  private buildPropertyInfo(property: any): string {
    const parts: string[] = []
    
    parts.push(`房源名称：${property.name}`)
    parts.push(`地址：${property.address}`)
    
    if (property.property_type) {
      const typeMap: Record<string, string> = {
        apartment: '公寓',
        house: '住宅',
        villa: '别墅',
        shop: '商铺',
      }
      parts.push(`类型：${typeMap[property.property_type] || property.property_type}`)
    }
    
    if (property.area) parts.push(`面积：${property.area}㎡`)
    if (property.price) parts.push(`租金：${property.price}元/月`)
    if (property.layout) parts.push(`户型：${property.layout}`)
    if (property.floor) parts.push(`楼层：${property.floor}`)
    if (property.orientation) parts.push(`朝向：${property.orientation}`)
    if (property.decoration) parts.push(`装修：${property.decoration}`)
    if (property.description) parts.push(`描述：${property.description}`)
    if (property.tags && property.tags.length > 0) {
      parts.push(`标签：${property.tags.join('、')}`)
    }

    return parts.join('\n')
  }

  private buildPrompt(propertyInfo: string): string {
    return `你是一位专业的小红书房产博主，擅长用生动吸引人的文案推广房源。请根据以下房源信息，生成一篇适合小红书平台的推广文案。

房源信息：
${propertyInfo}

要求：
1. 标题要有吸引力，可以使用emoji和数字
2. 内容要有情感共鸣，突出房源亮点
3. 使用小红书常见的表情符号和排版风格
4. 文案要真实可信，避免过度夸张
5. 结尾加上相关话题标签

请直接输出文案内容：`
  }

  private async callLLM(prompt: string): Promise<string> {
    try {
      // 这里应该调用真实的LLM API
      // 由于没有实际的API密钥，返回一个模板文案
      // 实际项目中应该使用 Coze LLM 集成或其他大模型服务
      
      this.logger.log('调用LLM生成文案...')
      
      // 模拟LLM响应
      const copy = `🏠 房源推荐｜超值好房等你来

✨ 房源亮点
📍 位置优越，交通便利
💎 精装修，拎包入住
🌿 采光通风，南北通透
💰 性价比高，房东好说话

🏠 房源详情
这套房子真的太让人心动了！位置绝佳，周边配套齐全，出行超级方便～

房间布局合理，空间利用率高，完全不会有压抑感。装修风格现代简约，干净整洁，直接拎包入住就能享受舒适生活！

最让人惊喜的是采光特别好，阳光洒满整个房间，每天都能感受到满满的正能量💪

性价比超高，错过真的会后悔哦～

感兴趣的宝子们快来私信我吧！

#租房 #好房推荐 #精装房 #拎包入住 #性价比房源`

      return copy
    } catch (error) {
      this.logger.error(`调用LLM失败: ${error.message}`)
      throw new Error('生成文案失败')
    }
  }
}
