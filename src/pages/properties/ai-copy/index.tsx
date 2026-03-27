import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Sparkles, Copy, RefreshCw, Check } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Property {
  id: string
  name: string
  address: string
  area?: number
  price?: number
  layout?: string
  decoration?: string
  tags?: string[]
}

export default function AICopyPage() {
  const router = useRouter()
  const { id } = router.params
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedCopy, setGeneratedCopy] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProperty()
    }
  }, [id])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/properties/${id}`,
        method: 'GET',
      })
      
      setProperty(res.data.data)
    } catch (error) {
      console.error('获取房源详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!property) return
    
    try {
      setGenerating(true)
      const res = await Network.request({
        url: `/api/ai/generate-copy`,
        method: 'POST',
        data: {
          property_id: id,
          platform: 'xiaohongshu',
        },
      })
      
      if (res.data.code === 200) {
        setGeneratedCopy(res.data.data.copy)
        Taro.showToast({ title: '生成成功', icon: 'success' })
      } else {
        Taro.showToast({ title: res.data.msg || '生成失败', icon: 'none' })
      }
    } catch (error) {
      console.error('生成文案失败:', error)
      Taro.showToast({ title: '生成失败', icon: 'none' })
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedCopy) return
    
    try {
      await Taro.setClipboardData({ data: generatedCopy })
      setCopied(true)
      Taro.showToast({ title: '已复制', icon: 'success' })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      Taro.showToast({ title: '复制失败', icon: 'none' })
    }
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      <ScrollView scrollY className="flex-1 p-4">
        <View className="space-y-4">
          {/* 房源信息 */}
          {property && (
            <Card>
              <CardHeader>
                <CardTitle>房源信息</CardTitle>
              </CardHeader>
              <CardContent>
                <Text className="block font-semibold text-gray-900 mb-2">{property.name}</Text>
                <Text className="block text-sm text-gray-500 mb-2">{property.address}</Text>
                <View className="flex gap-3 text-sm text-gray-600">
                  {property.price && <Text className="text-sky-500 font-semibold">¥{property.price}/月</Text>}
                  {property.area && <Text>{property.area}㎡</Text>}
                  {property.layout && <Text>{property.layout}</Text>}
                </View>
                {property.tags && property.tags.length > 0 && (
                  <View className="flex flex-wrap gap-2 mt-2">
                    {property.tags.map((tag, i) => (
                      <View key={i} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                        {tag}
                      </View>
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>
          )}

          {/* 生成按钮 */}
          <Card>
            <CardContent className="p-4">
              <Button 
                className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl" 
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <RefreshCw size={18} color="#fff" className="mr-2 animate-spin" />
                    <Text className="text-white">生成中...</Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} color="#fff" className="mr-2" />
                    <Text className="text-white">生成小红书文案</Text>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 生成的文案 */}
          {generatedCopy && (
            <Card>
              <CardHeader>
                <View className="flex items-center justify-between">
                  <CardTitle>生成的文案</CardTitle>
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <Check size={14} color="#10b981" className="mr-1" />
                        <Text className="text-green-600">已复制</Text>
                      </>
                    ) : (
                      <>
                        <Copy size={14} color="#666" className="mr-1" />
                        <Text>复制</Text>
                      </>
                    )}
                  </Button>
                </View>
              </CardHeader>
              <CardContent>
                <Text className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {generatedCopy}
                </Text>
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
