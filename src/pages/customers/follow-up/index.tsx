import { View, Text, Picker } from '@tarojs/components'
import type { FC } from 'react'
import { useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const FollowUpPage: FC = () => {
  const [content, setContent] = useState('')
  const [followTime, setFollowTime] = useState(
    new Date().toISOString().slice(0, 16).replace('T', ' ')
  )
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const customerId = router.params.customerId

  const handleSubmit = async () => {
    if (!content.trim()) {
      Taro.showToast({ title: '请输入跟进内容', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      await Network.request({
        url: `/api/customers/${customerId}/follow-ups`,
        method: 'POST',
        data: {
          content: content.trim(),
          follow_time: followTime,
        },
      })

      Taro.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch (error) {
      console.error('添加跟进记录失败', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 px-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">添加跟进记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <View>
            <Label className="text-sm text-gray-600 mb-1">
              跟进时间 <Text className="text-red-500">*</Text>
            </Label>
            <Picker
              mode="date"
              value={followTime.split(' ')[0]}
              onChange={(e) => {
                const time = followTime.split(' ')[1] || '00:00'
                setFollowTime(`${e.detail.value} ${time}`)
              }}
            >
              <View className="h-10 mt-1 bg-white border border-gray-200 rounded-lg px-3 flex items-center">
                <Text className="text-gray-800">{followTime.split(' ')[0]}</Text>
              </View>
            </Picker>
          </View>

          <View>
            <Label className="text-sm text-gray-600 mb-1">
              跟进内容 <Text className="text-red-500">*</Text>
            </Label>
            <Textarea
              className="mt-1 min-h-32"
              placeholder="请输入跟进内容，记录与客户的沟通情况..."
              value={content}
              onInput={(e) => setContent(e.detail.value)}
            />
          </View>
        </CardContent>
      </Card>

      <View className="mt-6">
        <Button
          className="w-full h-11 bg-blue-500"
          onClick={handleSubmit}
          
          disabled={loading}
        >
          <Text className="text-white text-base font-medium">
            {loading ? '保存中...' : '保存'}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default FollowUpPage
