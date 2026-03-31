import { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { User, Phone, DollarSign, Bell, House, Info } from 'lucide-react-taro'
import { useLeaseStore } from '@/stores/lease'
import { useMonthlyBillStore } from '@/stores/monthlyBill'
import { usePropertyStore } from '@/stores/property'
import { useReminderStore } from '@/stores/reminder'
import { Input } from '@/components/ui/input'

interface LeaseForm {
  // 业主信息
  landlord_name: string
  landlord_phone: string
  // 租客信息
  tenant_name: string
  tenant_phone: string
  // 租约规则
  monthly_rent: string
  payment_day: string
  start_date: string
  end_date: string
  // 提醒设置
  reminder_days: string
}

const initialForm: LeaseForm = {
  landlord_name: '',
  landlord_phone: '',
  tenant_name: '',
  tenant_phone: '',
  monthly_rent: '',
  payment_day: '5',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
  reminder_days: '3',
}

const paymentDayLabels = Array.from({ length: 28 }, (_, i) => `每月${i + 1}号`)

export default function LeaseFormPage() {
  const router = useRouter()
  const { propertyId, id } = router.params
  const isEdit = Boolean(id)
  
  const [form, setForm] = useState<LeaseForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)

  // 从 store 获取原始数据
  const properties = usePropertyStore(state => state.properties)
  const leases = useLeaseStore(state => state.leases)
  const addLease = useLeaseStore(state => state.addLease)
  const updateLease = useLeaseStore(state => state.updateLease)
  const generateBillsForLease = useMonthlyBillStore(state => state.generateBillsForLease)
  const addRentReminder = useReminderStore(state => state.addRentReminder)

  // 使用 useMemo 缓存计算结果
  const property = useMemo(() => {
    return properties.find(p => p.id === propertyId)
  }, [properties, propertyId])

  const existingLease = useMemo(() => {
    return leases.find(l => l.id === id)
  }, [leases, id])

  // 计算租约时长（月）
  const leaseDuration = useMemo(() => {
    if (!form.start_date || !form.end_date) return 0
    const start = new Date(form.start_date)
    const end = new Date(form.end_date)
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
    return Math.max(0, months)
  }, [form.start_date, form.end_date])

  useEffect(() => {
    console.log('=== 租约表单初始化 ===')
    console.log('propertyId:', propertyId)
    console.log('id:', id)
    
    if (existingLease) {
      loadLease()
    }
  }, [existingLease])

  const loadLease = () => {
    if (existingLease) {
      setForm({
        landlord_name: existingLease.landlord_name || '',
        landlord_phone: existingLease.landlord_phone || '',
        tenant_name: existingLease.tenant_name || '',
        tenant_phone: existingLease.tenant_phone || '',
        monthly_rent: existingLease.monthly_rent?.toString() || '',
        payment_day: existingLease.payment_day?.toString() || '5',
        start_date: existingLease.start_date || new Date().toISOString().split('T')[0],
        end_date: existingLease.end_date || '',
        reminder_days: existingLease.reminder_days?.toString() || '3',
      })
    }
  }

  const handleInputChange = (field: keyof LeaseForm, value: string) => {
    console.log(`输入 ${field}:`, value)
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handlePaymentDayChange = (e: any) => {
    const index = e.detail.value
    const value = String(index + 1)
    console.log('选择交租日:', value)
    handleInputChange('payment_day', value)
  }

  const handleStartDateChange = (e: any) => {
    const value = e.detail.value
    console.log('选择开始日期:', value)
    handleInputChange('start_date', value)
  }

  const handleEndDateChange = (e: any) => {
    const value = e.detail.value
    console.log('选择结束日期:', value)
    handleInputChange('end_date', value)
  }

  const handleSubmit = () => {
    console.log('=== 提交租约 ===')
    console.log('表单数据:', form)
    
    // 表单验证
    if (!form.landlord_name.trim()) {
      Taro.showToast({ title: '请输入业主姓名', icon: 'none' })
      return
    }
    if (!form.landlord_phone.trim()) {
      Taro.showToast({ title: '请输入业主联系电话', icon: 'none' })
      return
    }
    if (!form.tenant_name.trim()) {
      Taro.showToast({ title: '请输入租客姓名', icon: 'none' })
      return
    }
    if (!form.tenant_phone.trim()) {
      Taro.showToast({ title: '请输入租客联系电话', icon: 'none' })
      return
    }
    if (!form.monthly_rent || parseFloat(form.monthly_rent) <= 0) {
      Taro.showToast({ title: '请输入正确的月租金', icon: 'none' })
      return
    }
    if (!form.start_date) {
      Taro.showToast({ title: '请选择租约开始时间', icon: 'none' })
      return
    }
    if (!form.end_date) {
      Taro.showToast({ title: '请选择租约结束时间', icon: 'none' })
      return
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      Taro.showToast({ title: '租约结束时间必须晚于开始时间', icon: 'none' })
      return
    }

    if (!propertyId) {
      Taro.showToast({ title: '房源ID缺失', icon: 'none' })
      return
    }

    setSubmitting(true)
    
    const leaseData = {
      property_id: propertyId,
      landlord_name: form.landlord_name.trim(),
      landlord_phone: form.landlord_phone.trim(),
      tenant_name: form.tenant_name.trim(),
      tenant_phone: form.tenant_phone.trim(),
      monthly_rent: parseFloat(form.monthly_rent),
      payment_day: parseInt(form.payment_day, 10),
      start_date: form.start_date,
      end_date: form.end_date,
      reminder_days: parseInt(form.reminder_days, 10) || 3,
    }

    console.log('准备保存租约数据:', leaseData)

    if (isEdit) {
      updateLease(id!, leaseData)
      console.log('更新租约成功:', id)
      Taro.showToast({ title: '更新成功', icon: 'success' })
    } else {
      const newLease = addLease(leaseData)
      console.log('创建租约成功:', newLease)
      
      // 自动生成月度账单
      const bills = generateBillsForLease(newLease)
      console.log('自动生成账单:', bills.length, '条')
      
      // 创建收租提醒（为最近一次账单创建）
      const propertyName = property 
        ? `${property.community}${property.building ? ' ' + property.building : ''}` 
        : '房源'
      
      const reminderDays = parseInt(form.reminder_days, 10) || 3
      if (reminderDays > 0 && bills.length > 0) {
        // 为每个即将到来的账单创建提醒
        const today = new Date().toISOString().split('T')[0]
        const upcomingBills = bills.filter(b => b.due_date >= today)
        
        if (upcomingBills.length > 0) {
          const nearestBill = upcomingBills[0]
          addRentReminder(
            propertyId,
            propertyName,
            nearestBill.due_date,
            parseInt(form.payment_day, 10),
            reminderDays
          )
          console.log('创建收租提醒成功')
        }
      }
      
      Taro.showToast({ title: '创建成功', icon: 'success' })
    }
    
    setSubmitting(false)
    setTimeout(() => Taro.navigateBack(), 1500)
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      <ScrollView scrollY className="flex-1 p-4">
        <View className="space-y-4">
          {/* 关联房源信息 */}
          {property && (
            <View className="bg-white rounded-xl p-4">
              <View className="flex items-center gap-2">
                <House size={18} color="#3b82f6" />
                <Text className="text-sm text-gray-500">关联房源：</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {property.community}{property.building ? ` ${property.building}` : ''}
                </Text>
              </View>
            </View>
          )}

          {/* 业主信息 */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-base font-bold text-gray-800 mb-4">业主信息</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">业主姓名 *</Text>
              <View className="flex items-center gap-2">
                <User size={18} color="#999" />
                <View className="flex-1">
                  <Input
                    placeholder="请输入业主姓名"
                    value={form.landlord_name}
                    onInput={(e) => handleInputChange('landlord_name', e.detail.value)}
                  />
                </View>
              </View>
            </View>

            <View>
              <Text className="text-sm text-gray-600 mb-2">联系电话 *</Text>
              <View className="flex items-center gap-2">
                <Phone size={18} color="#999" />
                <View className="flex-1">
                  <Input
                    type="number"
                    placeholder="请输入联系电话"
                    value={form.landlord_phone}
                    onInput={(e) => handleInputChange('landlord_phone', e.detail.value)}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 租客信息 */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-base font-bold text-gray-800 mb-4">租客信息</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">租客姓名 *</Text>
              <View className="flex items-center gap-2">
                <User size={18} color="#999" />
                <View className="flex-1">
                  <Input
                    placeholder="请输入租客姓名"
                    value={form.tenant_name}
                    onInput={(e) => handleInputChange('tenant_name', e.detail.value)}
                  />
                </View>
              </View>
            </View>

            <View>
              <Text className="text-sm text-gray-600 mb-2">联系电话 *</Text>
              <View className="flex items-center gap-2">
                <Phone size={18} color="#999" />
                <View className="flex-1">
                  <Input
                    type="number"
                    placeholder="请输入联系电话"
                    value={form.tenant_phone}
                    onInput={(e) => handleInputChange('tenant_phone', e.detail.value)}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 租约规则 */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-base font-bold text-gray-800 mb-4">租约规则</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">月租金金额 (元) *</Text>
              <View className="flex items-center gap-2">
                <DollarSign size={18} color="#999" />
                <View className="flex-1">
                  <Input
                    type="digit"
                    placeholder="请输入月租金金额"
                    value={form.monthly_rent}
                    onInput={(e) => handleInputChange('monthly_rent', e.detail.value)}
                  />
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">每月固定交租日 *</Text>
              <Picker
                mode="selector"
                range={paymentDayLabels}
                value={parseInt(form.payment_day, 10) - 1}
                onChange={handlePaymentDayChange}
              >
                <View className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-3">
                  <Text className="text-sm">
                    {paymentDayLabels[parseInt(form.payment_day, 10) - 1] || '请选择'}
                  </Text>
                  <Text className="text-gray-400">{'>'}</Text>
                </View>
              </Picker>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">租约开始时间 *</Text>
              <Picker
                mode="date"
                value={form.start_date}
                start="2020-01-01"
                end="2030-12-31"
                onChange={handleStartDateChange}
              >
                <View className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-3">
                  <Text className="text-sm">{form.start_date || '请选择日期'}</Text>
                  <Text className="text-gray-400">{'>'}</Text>
                </View>
              </Picker>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">租约结束时间 *</Text>
              <Picker
                mode="date"
                value={form.end_date}
                start="2020-01-01"
                end="2050-12-31"
                onChange={handleEndDateChange}
              >
                <View className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-3">
                  <Text className="text-sm">{form.end_date || '请选择日期'}</Text>
                  <Text className="text-gray-400">{'>'}</Text>
                </View>
              </Picker>
            </View>

            {/* 租约时长预览 */}
            {leaseDuration > 0 && (
              <View className="bg-sky-50 rounded-lg p-3 mt-2">
                <View className="flex items-center gap-2 mb-1">
                  <Info size={14} color="#3b82f6" />
                  <Text className="text-xs text-sky-600">租约时长</Text>
                </View>
                <Text className="text-sm font-medium text-sky-700">
                  共 {leaseDuration} 个月
                </Text>
              </View>
            )}
          </View>

          {/* 提醒设置 */}
          <View className="bg-white rounded-xl p-4">
            <View className="flex items-center gap-2 mb-4">
              <Bell size={18} color="#3b82f6" />
              <Text className="text-base font-bold text-gray-800">提醒设置</Text>
            </View>
            
            <View>
              <Text className="text-sm text-gray-600 mb-2">收租提醒提前天数</Text>
              <View className="flex items-center gap-2">
                <View className="flex-1">
                  <Input
                    type="number"
                    placeholder="请输入提前提醒天数"
                    value={form.reminder_days}
                    onInput={(e) => handleInputChange('reminder_days', e.detail.value)}
                  />
                </View>
                <Text className="text-sm text-gray-500">天</Text>
              </View>
              <Text className="text-xs text-gray-400 mt-2">
                支持设置 1-15 天，默认提前 3 天提醒，将在交租日前提醒您收租
              </Text>
            </View>
          </View>

          {/* 提交按钮 */}
          <View className="pb-6">
            <View 
              className={`h-12 rounded-lg flex items-center justify-center ${submitting ? 'bg-gray-300' : 'bg-sky-500'}`}
              onClick={submitting ? undefined : handleSubmit}
            >
              <Text className="text-white text-base font-medium">
                {submitting ? '保存中...' : isEdit ? '保存修改' : '创建租约'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
