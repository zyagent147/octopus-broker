import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Taro from '@tarojs/taro'
import { Network } from '@/network'

interface User {
  id: string
  openid: string
  nickname?: string
  avatar?: string
  phone?: string
  role?: string
}

interface UserState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  isLoading: boolean
  
  // 云端操作
  fetchUserFromCloud: () => Promise<void>
  updateUserToCloud: (data: Partial<User>) => Promise<boolean>
  
  // 本地操作
  setUserInfo: (user: User) => void
  setToken: (token: string) => void
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      isLoading: false,

      // 从云端获取用户信息
      fetchUserFromCloud: async () => {
        const token = get().token
        if (!token) return
        
        set({ isLoading: true })
        try {
          const res = await Network.request<{ data: User }>({
            url: '/api/auth/me',
            method: 'GET',
            showLoading: false,
          })
          
          if (res?.data) {
            set((state) => ({
              user: { ...state.user, ...res.data },
              isLoading: false,
            }))
            console.log('[用户Store] 从云端同步用户信息成功')
          }
        } catch (error) {
          console.error('[用户Store] 从云端获取用户信息失败:', error)
          set({ isLoading: false })
        }
      },

      // 更新用户信息到云端
      updateUserToCloud: async (data) => {
        const token = get().token
        if (!token) return false
        
        try {
          const res = await Network.request<{ data: User }>({
            url: '/api/auth/update-info',
            method: 'POST',
            data,
            showLoading: false,
          })
          
          if (res?.data) {
            // 更新本地数据
            set((state) => ({
              user: { ...state.user, ...res.data },
            }))
            console.log('[用户Store] 用户信息同步到云端成功')
            return true
          }
        } catch (error) {
          console.error('[用户Store] 更新用户信息到云端失败:', error)
        }
        return false
      },

      setUserInfo: (user) => set({ user, isLoggedIn: true }),
      setToken: (token) => set({ token }),
      
      login: (user, token) => set({ user, token, isLoggedIn: true }),
      
      logout: () => {
        set({ user: null, token: null, isLoggedIn: false })
        // 清除本地存储
        Taro.removeStorageSync('user-storage')
      },
      
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return Taro.getStorageSync(name)
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          try {
            Taro.setStorageSync(name, value)
          } catch (e) {
            console.error('存储失败', e)
          }
        },
        removeItem: (name) => {
          try {
            Taro.removeStorageSync(name)
          } catch (e) {
            console.error('删除存储失败', e)
          }
        },
      })),
    }
  )
)
