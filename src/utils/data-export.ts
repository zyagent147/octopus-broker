/**
 * 数据导出工具
 * 用于将本地数据导出为 JSON 文件，便于用户备份
 */

import Taro from '@tarojs/taro'
import { useCustomerStore } from '@/stores/customer'
import { usePropertyStore } from '@/stores/property'
import { useLeaseStore } from '@/stores/lease'
import { useBillStore } from '@/stores/bill'

/**
 * 格式化日期为 YYYYMMDD_HHmmss
 */
function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

interface BackupData {
  version: string
  exportTime: string
  appName: string
  data: {
    customers: any[]
    properties: any[]
    leases: any[]
    bills: any[]
  }
}

/**
 * 获取所有本地数据
 */
function getLocalData() {
  const customers = useCustomerStore.getState().customers
  const properties = usePropertyStore.getState().properties
  const leases = useLeaseStore.getState().leases
  const bills = useBillStore.getState().bills

  return { customers, properties, leases, bills }
}

/**
 * 导出数据到文件
 * 将所有本地数据导出为 JSON 文件并保存到用户设备
 */
export async function exportDataToFile(): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const { customers, properties, leases, bills } = getLocalData()

    // 构建导出数据
    const backupData: BackupData = {
      version: '1.0.0',
      exportTime: new Date().toISOString(),
      appName: '章鱼经纪人',
      data: {
        customers,
        properties,
        leases,
        bills,
      },
    }

    // 转换为 JSON 字符串
    const jsonString = JSON.stringify(backupData, null, 2)
    const fileName = `zhangyu_backup_${formatDate(new Date())}.json`

    // 使用 Taro.saveFile 保存文件到临时目录
    const fs = Taro.getFileSystemManager()
    
    // 生成临时文件路径
    const tempFilePath = `${Taro.env.USER_DATA_PATH}/${fileName}`

    // 写入文件
    await new Promise<void>((resolve, reject) => {
      fs.writeFile({
        filePath: tempFilePath,
        data: jsonString,
        encoding: 'utf8',
        success: () => resolve(),
        fail: (err) => reject(err),
      })
    })

    // 保存到用户相册/文件目录
    const savedFilePath = await new Promise<string>((resolve, reject) => {
      Taro.saveFile({
        tempFilePath,
        success: (res) => resolve(res.savedFilePath),
        fail: (err) => reject(err),
      })
    })

    return {
      success: true,
      filePath: savedFilePath,
    }
  } catch (error: any) {
    console.error('导出数据失败:', error)
    return {
      success: false,
      error: error.message || '导出失败',
    }
  }
}

/**
 * 获取数据统计信息
 */
export function getDataStats() {
  const { customers, properties, leases, bills } = getLocalData()

  return {
    customers: customers.length,
    properties: properties.length,
    leases: leases.length,
    bills: bills.length,
    totalItems: customers.length + properties.length + leases.length + bills.length,
  }
}

/**
 * 显示数据导出成功提示
 */
export async function handleExportData() {
  const stats = getDataStats()

  if (stats.totalItems === 0) {
    Taro.showToast({
      title: '暂无数据可导出',
      icon: 'none',
    })
    return
  }

  Taro.showLoading({ title: '正在导出...' })

  const result = await exportDataToFile()

  Taro.hideLoading()

  if (result.success) {
    Taro.showModal({
      title: '导出成功',
      content: `已导出 ${stats.totalItems} 条数据到文件。\n\n文件路径：${result.filePath}\n\n建议：将文件保存到云端或电脑进行备份，换手机后可导入恢复数据。`,
      showCancel: false,
      confirmText: '知道了',
    })
  } else {
    Taro.showModal({
      title: '导出失败',
      content: result.error || '请重试',
      showCancel: false,
    })
  }
}
