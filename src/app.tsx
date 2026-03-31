import { PropsWithChildren, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { LucideTaroProvider } from 'lucide-react-taro'
import { Toaster } from '@/components/ui/toast'
import { useUserStore } from '@/stores/user'
import '@/app.css'
import { Preset } from './presets'

const App = ({ children }: PropsWithChildren) => {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)

  // 检查登录状态
  const checkLoginStatus = () => {
    const currentPath = Taro.getCurrentInstance()?.router?.path || ''

    // 白名单页面不需要登录
    const whiteList = ['/pages/login/index']

    if (!isLoggedIn && !whiteList.includes(currentPath)) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }

    // 已登录且在登录页，跳转到首页
    if (isLoggedIn && currentPath === '/pages/login/index') {
      Taro.switchTab({ url: '/pages/customers/index' })
    }
  }

  // 应用启动时检查
  useEffect(() => {
    checkLoginStatus()
  }, [])

  // 每次页面显示时检查
  useDidShow(() => {
    checkLoginStatus()
  })

  return (
    <LucideTaroProvider defaultColor="#000" defaultSize={24}>
      <Preset>{children}</Preset>
      <Toaster />
    </LucideTaroProvider>
  )
}

export default App
