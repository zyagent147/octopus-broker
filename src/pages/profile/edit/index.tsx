import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { useUserStore } from '@/stores/user'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Camera } from 'lucide-react-taro'

// 默认头像
// @ts-ignore
import defaultAvatar from '@/assets/章鱼经纪人.jpeg'

const EditProfilePage: FC = () => {
  const { user, updateUser } = useUserStore()
  
  const [nickname, setNickname] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '')
      setPhone(user.phone || '')
      setAvatar(user.avatar || '')
    }
  }, [user])

  // 处理头像选择
  const handleChooseAvatar = () => {
    if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) {
      Taro.showToast({ title: '仅支持小程序端', icon: 'none' })
      return
    }
    
    Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0]?.tempFilePath
        if (tempFilePath) {
          setAvatar(tempFilePath)
          Taro.showToast({ title: '头像已选择', icon: 'success' })
        }
      },
      fail: () => {
        Taro.showToast({ title: '选择失败', icon: 'none' })
      },
    })
  }

  // 处理保存
  const handleSave = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    setIsSubmitting(true)
    try {
      // 更新用户信息
      updateUser({
        nickname: nickname.trim(),
        phone: phone.trim() || undefined,
        avatar: avatar || undefined,
      })
      
      Taro.showToast({ title: '保存成功', icon: 'success' })
      
      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-6">
      {/* 头像区域 */}
      <View className="bg-white px-4 py-6 flex flex-col items-center">
        <View 
          className="relative"
          onClick={handleChooseAvatar}
        >
          <View className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
            <Image
              src={avatar || defaultAvatar}
              className="w-full h-full"
              mode="aspectFill"
            />
          </View>
          <View className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
            <Camera size={16} color="#ffffff" />
          </View>
        </View>
        <Text className="block text-sm text-gray-500 mt-3">点击更换头像</Text>
      </View>

      {/* 表单区域 */}
      <View className="px-4 mt-4">
        <Card>
          <CardContent className="py-4">
            {/* 昵称 */}
            <View className="mb-4">
              <Text className="block text-sm text-gray-600 mb-2">昵称</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="请输入昵称"
                  value={nickname}
                  onInput={(e) => setNickname(e.detail.value)}
                  maxlength={20}
                />
              </View>
            </View>

            {/* 手机号 */}
            <View>
              <Text className="block text-sm text-gray-600 mb-2">手机号</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="请输入手机号（选填）"
                  value={phone}
                  onInput={(e) => setPhone(e.detail.value)}
                  type="number"
                  maxlength={11}
                />
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 保存按钮 */}
      <View className="px-4 mt-6">
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? '保存中...' : '保存'}
        </Button>
      </View>

      {/* 提示 */}
      <View className="px-4 mt-4">
        <View className="bg-gray-100 rounded-xl p-4">
          <Text className="block text-sm text-gray-500">
            💡 提示：您的数据存储在本地设备，换设备后数据不会自动同步。建议定期使用「导出本地数据」功能备份重要数据。
          </Text>
        </View>
      </View>
    </View>
  )
}

export default EditProfilePage
