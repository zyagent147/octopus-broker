import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { useUserStore } from '@/stores/user'

// Logo 图片 - 使用 import 导入
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

        Taro.showToast({ title: '登录成功', icon: 'success' })

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
          backgroundColor: '#3b82f6',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px'
        }}
        onClick={handleLogin}
      >
        <Text style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500' }}>
          {loading ? '登录中...' : '微信一键登录'}
        </Text>
      </View>

      {/* 体验模式按钮 */}
      <View 
        style={{ 
          width: '100%', 
          maxWidth: '320px',
          height: '48px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e5e7eb'
        }}
        onClick={handleDevLogin}
      >
        <Text style={{ color: '#3b82f6', fontSize: '16px', fontWeight: '500' }}>
          体验模式
        </Text>
      </View>

      {/* 说明 */}
      <View style={{ marginTop: '32px' }}>
        <Text style={{ fontSize: '12px', textAlign: 'center', color: '#9ca3af' }}>
          登录即代表同意《用户协议》和《隐私政策》
        </Text>
      </View>

      {/* 提示 */}
      <View style={{ marginTop: '16px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', maxWidth: '320px' }}>
        <Text style={{ fontSize: '11px', textAlign: 'center', color: '#3b82f6' }}>
          💡 点击「体验模式」可直接进入，无需微信授权
        </Text>
      </View>
    </View>
  )
}
