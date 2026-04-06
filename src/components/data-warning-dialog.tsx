/**
 * 数据安全提示组件
 * 在用户首次使用或每次进入关键页面时显示数据存储风险提示
 */

import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { CircleAlert } from 'lucide-react-taro'

const STORAGE_KEY = 'data_warning_acknowledged'

interface DataWarningDialogProps {
  visible: boolean
  onClose: () => void
}

export function DataWarningDialog({ visible, onClose }: DataWarningDialogProps) {
  if (!visible) return null

  return (
    <View className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <View className="bg-white rounded-2xl mx-6 w-full max-w-sm overflow-hidden">
        {/* 标题 */}
        <View className="bg-orange-50 px-6 py-4 flex items-center gap-3">
          <CircleAlert size={24} color="#f59e0b" />
          <Text className="text-lg font-semibold text-orange-800">数据安全提示</Text>
        </View>

        {/* 内容 */}
        <View className="px-6 py-5">
          <Text className="block text-gray-700 text-sm leading-6 mb-4">
            您的数据（客户、房源、租约、账单）目前存储在<Text className="font-bold text-orange-600">本机设备</Text>中。
          </Text>

          <Text className="block text-gray-700 text-sm leading-6 mb-4">
            <Text className="font-bold">风险提醒：</Text>
          </Text>

          <View className="bg-orange-50 rounded-xl px-4 py-3 mb-4">
            <Text className="block text-orange-700 text-sm leading-6">
              • 更换手机或清除缓存将导致数据丢失{'\n'}
              • 删除小程序将导致数据无法恢复{'\n'}
              • 无法跨设备同步数据
            </Text>
          </View>

          <Text className="block text-gray-700 text-sm leading-6 mb-4">
            <Text className="font-bold">建议：</Text>定期导出数据备份到云端或电脑。
          </Text>
        </View>

        {/* 按钮 */}
        <View className="px-6 pb-6 flex gap-3">
          <View
            className="flex-1 h-11 bg-gray-100 rounded-xl flex items-center justify-center"
            onClick={onClose}
          >
            <Text className="text-gray-600 text-sm">知道了</Text>
          </View>
          <View
            className="flex-1 h-11 bg-blue-500 rounded-xl flex items-center justify-center"
            onClick={() => {
              // 跳转到个人中心导出数据
              onClose()
              Taro.switchTab({ url: '/pages/profile/index' })
            }}
          >
            <Text className="text-white text-sm">去备份</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

/**
 * 检查是否需要显示数据警告
 */
export async function checkDataWarning(): Promise<boolean> {
  try {
    const result = await Taro.getStorage({ key: STORAGE_KEY })
    // 如果已经确认过，不再显示
    if (result.data === true) {
      return false
    }
  } catch {
    // 没有存储记录，需要显示
  }
  return true
}

/**
 * 标记用户已确认数据警告
 */
export async function acknowledgeDataWarning() {
  try {
    await Taro.setStorage({
      key: STORAGE_KEY,
      data: true,
    })
  } catch (error) {
    console.error('保存数据警告确认状态失败:', error)
  }
}
