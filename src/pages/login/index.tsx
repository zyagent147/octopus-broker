import { View, Text } from '@tarojs/components'
import type { FC } from 'react'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { useUserStore } from '@/stores/user'
import { Button } from '@/components/ui/button'

const LoginPage: FC = () => {
  const [loading, setLoading] = useState(false)
  const login = useUserStore((state) => state.login)

  // 检测是否为开发环境
  const isDev = process.env.NODE_ENV === 'development' || !Taro.getEnv()

  const handleLogin = async () => {
    if (loading) return

    setLoading(true)

    try {
      // 获取微信登录 code
      const { code } = await Taro.login()

      if (!code) {
        Taro.showToast({ title: '微信登录失败', icon: 'none' })
        return
      }

      // 调用后端登录接口
      const result = await Network.request<{ code: number; msg: string; data: { token: string; user: any } }>({
        url: '/api/auth/login',
        method: 'POST',
        data: { code },
      })

      const { token, user } = result.data

      // 保存登录信息
      login(user, token)

      Taro.showToast({ title: '登录成功', icon: 'success' })

      // 延迟跳转，让用户看到提示
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/customers/index' })
      }, 1000)
    } catch (error: any) {
      console.error('登录失败', error)
      Taro.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none',
        duration: 2000,
      })
    } finally {
      setLoading(false)
    }
  }

  // 开发模式模拟登录
  const handleDevLogin = async () => {
    if (loading) return

    setLoading(true)

    try {
      // 模拟登录 - 生成随机用户ID
      const mockUserId = 'dev_user_' + Date.now()
      const mockUser = {
        id: mockUserId,
        openid: mockUserId,
        nickname: '测试经纪人',
        avatar: '',
      }
      const mockToken = 'dev_token_' + Date.now()

      // 保存登录信息
      login(mockUser, mockToken)

      Taro.showToast({ title: '开发模式登录成功', icon: 'success' })

      // 延迟跳转
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/customers/index' })
      }, 1000)
    } catch (error: any) {
      console.error('登录失败', error)
      Taro.showToast({
        title: '登录失败，请重试',
        icon: 'none',
        duration: 2000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white px-8">
      {/* Logo */}
      <View className="mb-16">
        <View className="w-24 h-24 bg-blue-500 rounded-3xl flex items-center justify-center shadow-lg">
          <Text className="text-white text-5xl">🐙</Text>
        </View>
      </View>

      {/* 标题 */}
      <Text className="block text-3xl font-bold text-gray-800 mb-3">章鱼经纪人</Text>
      <Text className="block text-base text-gray-500 mb-12">轻量高效的房产经纪人办公工具</Text>

      {/* 登录按钮 */}
      <View className="w-full max-w-sm space-y-3">
        <Button
          className="w-full h-12 bg-blue-500 rounded-xl flex items-center justify-center"
          onClick={handleLogin}
          disabled={loading}
        >
          <Text className="text-white text-lg font-medium">
            {loading ? '登录中...' : '微信一键登录'}
          </Text>
        </Button>

        {/* 开发模式登录按钮 */}
        <Button
          className="w-full h-12 bg-gray-500 rounded-xl flex items-center justify-center"
          onClick={handleDevLogin}
          disabled={loading}
        >
          <Text className="text-white text-base font-medium">
            开发模式登录（无需AppID）
          </Text>
        </Button>
      </View>

      {/* 说明 */}
      <View className="mt-8">
        <Text className="block text-sm text-gray-400 text-center">
          登录即代表同意《用户协议》和《隐私政策》
        </Text>
      </View>
    </View>
  )
}

export default LoginPage
