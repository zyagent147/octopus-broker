/**
 * 数据安全提示组件
 * 在用户首次使用或每次进入关键页面时显示数据存储说明
 */

import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Cloud } from 'lucide-react-taro'

const STORAGE_KEY = 'data_warning_acknowledged'

interface DataWarningDialogProps {
  visible: boolean
  onClose: () => void
}

export function DataWarningDialog({ visible, onClose }: DataWarningDialogProps) {
  if (!visible) return null

  return (
    <View 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <View className="bg-white rounded-2xl mx-6 w-full max-w-sm overflow-hidden">
        {/* 标题 */}
        <View className="bg-blue-50 px-6 py-4 flex items-center gap-3">
          <Cloud size={24} color="#1890ff" />
          <Text className="text-lg font-semibold text-blue-800">数据同步说明</Text>
        </View>

        {/* 内容 */}
        <View className="px-6 py-5">
          <Text className="block text-gray-700 text-sm leading-6 mb-4">
            您的数据已采用分层存储策略：
          </Text>

          {/* 云端存储 */}
          <View className="bg-green-50 rounded-xl px-4 py-3 mb-3">
            <View className="flex items-center gap-2 mb-2">
              <View className="w-2 h-2 rounded-full bg-green-500" />
              <Text className="font-bold text-green-700">已同步到云端</Text>
            </View>
            <Text className="block text-green-700 text-sm leading-5">
              • 用户资料{'\n'}
              • 客户信息{'\n'}
              • 客户跟进记录
            </Text>
          </View>

          {/* 本地存储 */}
          <View className="bg-orange-50 rounded-xl px-4 py-3 mb-4">
            <View className="flex items-center gap-2 mb-2">
              <View className="w-2 h-2 rounded-full bg-orange-500" />
              <Text className="font-bold text-orange-700">仅存储在本地</Text>
            </View>
            <Text className="block text-orange-700 text-sm leading-5">
              • 房源信息{'\n'}
              • 租约信息{'\n'}
              • 账单记录{'\n'}
              • 提醒设置
            </Text>
          </View>

          <Text className="block text-gray-700 text-sm leading-6">
            <Text className="font-bold">提示：</Text>可前往「我的」→「导出本地数据」备份本地数据。
          </Text>
        </View>

        {/* 按钮 */}
        <View className="px-6 pb-6">
          <View
            className="h-11 bg-blue-500 rounded-xl flex items-center justify-center"
            onClick={onClose}
          >
            <Text className="text-white text-sm font-medium">我知道了</Text>
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
