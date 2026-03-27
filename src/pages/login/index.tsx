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

  const handleLogin = async () => {
    if (loading) return

    setLoading(true)

    try {
      // 检测运行环境
      const env = Taro.getEnv()
      console.log('当前运行环境:', env)

      // 如果是H5环境，使用开发模式登录
      if (env === Taro.ENV_TYPE.WEB) {
        console.log('H5环境，使用开发模式登录')
        await handleDevLogin()
        return
      }

      // 微信小程序环境，使用真实登录
      const { code } = await Taro.login()

      if (!code) {
        Taro.showToast({ title: '微信登录失败', icon: 'none' })
        return
      }

      console.log('获取到微信code:', code)

      // 调用后端登录接口
      const result = await Network.request<{ code: number; msg: string; data: { token: string; user: any } }>({
        url: '/api/auth/login',
        method: 'POST',
        data: { code },
      })

      console.log('登录响应:', result.data)

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
      // 调用后端开发模式登录接口
      const res = await Network.request({
        url: '/api/auth/dev-login',
        method: 'POST',
        data: { devCode: 'DEV2024' },
      })

      if (res.data.code === 200) {
        const { token, user } = res.data.data
        
        // 保存登录信息
        login(user, token)

        Taro.showToast({ title: '开发模式登录成功', icon: 'success' })

        // 延迟跳转
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/customers/index' })
        }, 1000)
      } else {
        Taro.showToast({ title: res.data.msg || '登录失败', icon: 'none' })
      }
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
      <View className="w-full max-w-sm">
        <Button
          className="w-full h-12 bg-blue-500 rounded-xl flex items-center justify-center"
          onClick={handleLogin}
          disabled={loading}
        >
          <Text className="text-white text-lg font-medium">
            {loading ? '登录中...' : '微信一键登录'}
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
