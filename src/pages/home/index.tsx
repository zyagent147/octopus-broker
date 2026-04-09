import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/stores/user'
import PrivacyDialog from '@/components/PrivacyDialog'

// Logo 图片
// @ts-ignore
import logoImage from '@/assets/章鱼经纪人.jpeg'

// 存储键名
const PRIVACY_AGREED_KEY = 'privacy_agreed'
const VISITED_KEY = 'has_visited'

export default function HomePage() {
  const [loading, setLoading] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)
  const isLoggedIn = useUserStore(state => state.isLoggedIn)

  // 检查是否首次访问
  useEffect(() => {
    const checkFirstVisit = async () => {
      try {
        const visited = await Taro.getStorage({ key: VISITED_KEY })
        // 如果已经访问过，不再显示隐私弹窗
        if (visited.data === true) {
          setShowPrivacyDialog(false)
        }
      } catch (error) {
        // 首次访问，显示隐私弹窗
        setShowPrivacyDialog(true)
      }
    }
    checkFirstVisit()
  }, [])

  // 如果已登录，直接跳转到客户页面
  useEffect(() => {
    if (isLoggedIn) {
      Taro.switchTab({ url: '/pages/customers/index' })
    }
  }, [isLoggedIn])

  // 同意隐私政策并标记已访问
  const handleAgreePrivacy = async () => {
    try {
      await Taro.setStorage({ key: PRIVACY_AGREED_KEY, data: true })
      await Taro.setStorage({ key: VISITED_KEY, data: true })
      setShowPrivacyDialog(false)
    } catch (error) {
      console.error('保存状态失败:', error)
    }
  }

  // 不同意隐私政策
  const handleDisagreePrivacy = () => {
    Taro.showModal({
      title: '提示',
      content: '您需要同意用户协议和隐私政策才能继续使用',
      showCancel: false,
      confirmText: '我已知晓',
    })
  }

  // 游客模式进入
  const handleGuestEnter = async () => {
    try {
      await Taro.setStorage({ key: VISITED_KEY, data: true })
    } catch (error) {
      console.error('保存访问状态失败:', error)
    }
    Taro.switchTab({ url: '/pages/customers/index' })
  }

  // 登录
  const handleLogin = async () => {
    // 先检查是否已同意隐私政策
    try {
      const agreed = await Taro.getStorage({ key: PRIVACY_AGREED_KEY })
      if (!agreed.data) {
        setShowPrivacyDialog(true)
        return
      }
    } catch (error) {
      setShowPrivacyDialog(true)
      return
    }

    if (loading) return
    setLoading(true)

    try {
      const env = Taro.getEnv()

      if (env === Taro.ENV_TYPE.WEAPP) {
        // 微信小程序环境
        const loginResult = await Taro.login()
        const { code } = loginResult

        if (!code) {
          Taro.showToast({ title: '获取微信授权失败', icon: 'none' })
          return
        }

        const { Network } = await import('@/network')
        const result = await Network.request<{ code: number; data: { token: string; user: any } }>({
          url: '/api/auth/login',
          method: 'POST',
          data: { code },
        })

        if (result && result.data) {
          const { token, user } = result.data
          useUserStore.getState().login(user, token)
          Taro.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/customers/index' })
          }, 1000)
        }
      } else {
        // H5环境，开发模式登录
        const { Network } = await import('@/network')
        const result = await Network.request<{ code: number; data: { token: string; user: any } }>({
          url: '/api/auth/dev-login',
          method: 'POST',
          data: { devCode: 'DEV2024' },
        })

        if (result && result.data) {
          const { token, user } = result.data
          useUserStore.getState().login(user, token)
          Taro.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/customers/index' })
          }, 1000)
        }
      }
    } catch (error: any) {
      console.error('登录失败:', error)
      Taro.showToast({ title: error.message || '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Logo 区域 */}
      <View className="flex-1 flex flex-col items-center justify-center px-6 pt-12">
        <View className="mb-6">
          <Image
            src={logoImage}
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
            }}
            mode="aspectFill"
          />
        </View>

        <Text className="text-2xl font-bold text-gray-800 mb-2">章鱼经纪人</Text>
        <Text className="text-sm text-gray-500 mb-10">轻量高效的房产经纪人办公工具</Text>

        {/* 功能介绍卡片 */}
        <View className="w-full max-w-sm space-y-3">
          <Card>
            <CardContent className="py-4 px-4">
              <View className="flex items-center">
                <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Text className="text-xl">👥</Text>
                </View>
                <View>
                  <Text className="block text-sm font-medium text-gray-800">客户管理</Text>
                  <Text className="block text-xs text-gray-500">轻松管理客户信息与跟进记录</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4 px-4">
              <View className="flex items-center">
                <View className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Text className="text-xl">🏠</Text>
                </View>
                <View>
                  <Text className="block text-sm font-medium text-gray-800">房源管理</Text>
                  <Text className="block text-xs text-gray-500">便捷管理房源信息与状态</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4 px-4">
              <View className="flex items-center">
                <View className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Text className="text-xl">🎉</Text>
                </View>
                <View>
                  <Text className="block text-sm font-medium text-gray-800">生活服务</Text>
                  <Text className="block text-xs text-gray-500">家政、维修等生活服务预约</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-4 px-4">
              <View className="flex items-center">
                <View className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Text className="text-xl">📋</Text>
                </View>
                <View>
                  <Text className="block text-sm font-medium text-gray-800">租约账单</Text>
                  <Text className="block text-xs text-gray-500">自动生成账单，到期提醒</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>
      </View>

      {/* 底部按钮 */}
      <View className="px-6 pb-10 pt-4">
        {/* 登录按钮 */}
        <Button
          className="w-full h-11 bg-blue-500 text-white rounded-xl mb-3"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? '登录中...' : '微信一键登录'}
        </Button>

        {/* 游客模式 */}
        <View className="w-full text-center" onClick={handleGuestEnter}>
          <Text className="text-sm text-gray-500">先看看功能</Text>
          <Text className="block text-xs text-blue-500 mt-1">登录后可同步数据到云端</Text>
        </View>
      </View>

      {/* 隐私政策弹窗 */}
      <PrivacyDialog
        visible={showPrivacyDialog}
        onAgree={handleAgreePrivacy}
        onDisagree={handleDisagreePrivacy}
      />
    </View>
  )
}
