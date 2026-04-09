import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { useUserStore } from '@/stores/user'
import PrivacyDialog from '@/components/PrivacyDialog'
import { Card, CardContent } from '@/components/ui/card'

// Logo 图片
// @ts-ignore
import logoImage from '@/assets/章鱼经纪人.jpeg'

// 存储键名
const PRIVACY_AGREED_KEY = 'privacy_agreed'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)
  const login = useUserStore((state) => state.login)
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)

  // 如果已登录，直接跳转
  useEffect(() => {
    if (isLoggedIn) {
      Taro.switchTab({ url: '/pages/customers/index' })
    }
  }, [isLoggedIn])

  // 检查是否已同意隐私政策
  useEffect(() => {
    const checkPrivacyAgreed = async () => {
      try {
        const agreed = await Taro.getStorage({ key: PRIVACY_AGREED_KEY })
        if (agreed.data === true) {
          setShowPrivacyDialog(false)
        } else {
          setShowPrivacyDialog(true)
        }
      } catch (error) {
        setShowPrivacyDialog(true)
      }
    }
    checkPrivacyAgreed()
  }, [])

  // 返回首页
  const handleBackToHome = () => {
    Taro.redirectTo({ url: '/pages/home/index' })
  }

  // 同意隐私政策
  const handleAgreePrivacy = async () => {
    try {
      await Taro.setStorage({
        key: PRIVACY_AGREED_KEY,
        data: true
      })
      setShowPrivacyDialog(false)
    } catch (error) {
      console.error('保存隐私同意状态失败:', error)
    }
  }

  // 不同意隐私政策
  const handleDisagreePrivacy = () => {
    Taro.showModal({
      title: '提示',
      content: '您需要同意用户协议和隐私政策才能使用本小程序',
      showCancel: false,
      confirmText: '重新阅读',
      success: () => {
        setShowPrivacyDialog(true)
      }
    })
  }

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
      // 检测运行环境
      const env = Taro.getEnv()
      console.log('=== 登录开始 ===')
      console.log('当前运行环境:', env)

      // 微信小程序环境，使用微信登录
      if (env === Taro.ENV_TYPE.WEAPP) {
        // 1. 获取微信登录code
        console.log('步骤1: 调用 Taro.login() 获取code...')
        const loginResult = await Taro.login()
        const { code } = loginResult

        if (!code) {
          console.error('获取code失败:', loginResult)
          Taro.showToast({ title: '获取微信授权失败', icon: 'none' })
          return
        }

        console.log('步骤1完成: 获取到code:', code)

        // 2. 调用后端登录接口
        console.log('步骤2: 调用后端登录接口 /api/auth/login...')
        const result = await Network.request<{ code: number; msg: string; data: { token: string; user: any } }>({
          url: '/api/auth/login',
          method: 'POST',
          data: { code },
        })

        console.log('步骤2完成: 后端响应:', JSON.stringify(result))

        // 3. 检查响应数据
        if (!result || !result.data) {
          console.error('响应数据格式错误:', result)
          Taro.showToast({ title: '登录失败：响应数据异常', icon: 'none' })
          return
        }

        const { token, user } = result.data

        if (!token || !user) {
          console.error('缺少token或user:', result.data)
          Taro.showToast({ title: '登录失败：数据不完整', icon: 'none' })
          return
        }

        // 4. 保存登录信息
        console.log('步骤3: 保存登录信息...')
        login(user, token)
        console.log('步骤3完成: 登录信息已保存')

        // 5. 显示成功提示
        Taro.showToast({ title: '登录成功', icon: 'success' })

        // 6. 跳转到首页
        setTimeout(() => {
          console.log('步骤4: 跳转到客户页面')
          Taro.switchTab({ url: '/pages/customers/index' })
        }, 1000)
      } else {
        // H5或其他环境，使用开发模式登录
        console.log('H5环境，调用开发模式登录接口...')
        const result = await Network.request<{ code: number; msg: string; data: { token: string; user: any } }>({
          url: '/api/auth/dev-login',
          method: 'POST',
          data: { devCode: 'DEV2024' },
        })

        console.log('登录响应:', JSON.stringify(result))

        if (result && result.data) {
          const { token, user } = result.data
          login(user, token)
          Taro.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/customers/index' })
          }, 1000)
        }
      }
    } catch (error: any) {
      console.error('=== 登录失败 ===')
      console.error('错误类型:', typeof error)
      console.error('错误信息:', error.message)
      console.error('错误堆栈:', error.stack)
      console.error('完整错误对象:', JSON.stringify(error, Object.getOwnPropertyNames(error)))

      Taro.showModal({
        title: '登录失败',
        content: error.message || '未知错误，请查看控制台日志',
        showCancel: false,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View
      className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col"
    >
      {/* 顶部导航 */}
      <View className="pt-12 px-4 pb-4">
        <View
          className="w-10 h-10 flex items-center justify-center"
          onClick={handleBackToHome}
        >
          <Text className="text-xl">←</Text>
        </View>
      </View>

      {/* Logo 区域 */}
      <View className="flex-1 flex flex-col items-center justify-center px-6">
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
        <Text className="text-sm text-gray-500 mb-8">登录后即可同步数据到云端</Text>

        {/* 登录方式说明 */}
        <Card className="w-full max-w-sm mb-6">
          <CardContent className="py-4 px-4">
            <Text className="block text-sm text-gray-700 font-medium mb-2">登录即表示您同意：</Text>
            <View className="space-y-2">
              <Text className="block text-xs text-gray-500">• 《用户协议》</Text>
              <Text className="block text-xs text-gray-500">• 《隐私政策》</Text>
              <Text className="block text-xs text-gray-400 mt-2">
                我们将获取您的微信头像和昵称，用于账号识别
              </Text>
            </View>
          </CardContent>
        </Card>

        {/* 登录按钮 */}
        <View
          className="w-full max-w-sm h-11 bg-blue-500 rounded-xl flex items-center justify-center"
          onClick={handleLogin}
        >
          <Text className="text-white text-base font-medium">
            {loading ? '登录中...' : '微信一键登录'}
          </Text>
        </View>

        {/* 提示 */}
        <View className="mt-6 text-center">
          <Text className="text-xs text-gray-400">
            登录后您的客户、房源等数据将自动备份到云端
          </Text>
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
