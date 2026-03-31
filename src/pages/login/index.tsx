import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { useUserStore } from '@/stores/user'

// Logo 图片
// @ts-ignore
import logoImage from '@/assets/章鱼经纪人.jpeg'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const login = useUserStore((state) => state.login)

  const handleLogin = async () => {
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
          console.log('步骤4: 跳转到首页')
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
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px 32px',
        backgroundColor: '#f0f9ff',
        height: '100%'
      }}
    >
      {/* Logo */}
      <View style={{ marginBottom: '48px' }}>
        <Image 
          src={logoImage}
          style={{ 
            width: '96px', 
            height: '96px', 
            borderRadius: '24px' 
          }}
          mode="aspectFill"
        />
      </View>

      {/* 标题 */}
      <Text style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>章鱼经纪人</Text>
      <Text style={{ fontSize: '14px', marginBottom: '40px', color: '#6b7280' }}>轻量高效的房产经纪人办公工具</Text>

      {/* 登录按钮 */}
      <View 
        style={{ 
          width: '100%', 
          maxWidth: '320px',
          height: '48px',
          backgroundColor: loading ? '#9ca3af' : '#3b82f6',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={handleLogin}
      >
        <Text style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500' }}>
          {loading ? '登录中...' : '微信一键登录'}
        </Text>
      </View>

      {/* 说明 */}
      <View style={{ marginTop: '32px' }}>
        <Text style={{ fontSize: '12px', textAlign: 'center', color: '#9ca3af' }}>
          登录即代表同意《用户协议》和《隐私政策》
        </Text>
      </View>
    </View>
  )
}
