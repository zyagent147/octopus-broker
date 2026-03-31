import { useState, useEffect, useMemo } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { User, Phone, DollarSign, Bell, Calendar, Info } from 'lucide-react-taro'
import { useRentBillStore, calculateNextDueDate, getPaymentCycleText } from '@/stores/rentBill'
import { useReminderStore } from '@/stores/reminder'
import { usePropertyStore } from '@/stores/property'
import { Input } from '@/components/ui/input'

interface RentBillForm {
  tenant_name: string
  tenant_phone: string
  amount: string
  payment_cycle: 'monthly' | 'quarterly' | 'custom'
  custom_days: string
  start_date: string // 账单开始日期
  bill_date: string
  reminder_days: string
  remark: string
}

const initialForm: RentBillForm = {
  tenant_name: '',
  tenant_phone: '',
  amount: '',
  payment_cycle: 'monthly',
  custom_days: '',
  start_date: new Date().toISOString().split('T')[0], // 默认今天
  bill_date: '1',
  reminder_days: '3',
  remark: '',
}

const paymentCycleOptions = ['月付', '季付', '自定义']
const paymentCycleValues = ['monthly', 'quarterly', 'custom'] as const

const billDateLabels = Array.from({ length: 31 }, (_, i) => `每月${i + 1}号`)

export default function RentBillFormPage() {
  const router = useRouter()
  const { propertyId, id } = router.params
  const isEdit = Boolean(id)
  
  const [form, setForm] = useState<RentBillForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)

  // 从 store 获取原始数据（不在 selector 中调用函数）
  const properties = usePropertyStore(state => state.properties)
  const bills = useRentBillStore(state => state.bills)
  const addBill = useRentBillStore(state => state.addBill)
  const updateBill = useRentBillStore(state => state.updateBill)
  const updateProperty = usePropertyStore(state => state.updateProperty)
  const addBillReminder = useReminderStore(state => state.addBillReminder)

  // 使用 useMemo 缓存计算结果
  const property = useMemo(() => {
    return properties.find(p => p.id === propertyId)
  }, [properties, propertyId])

  const existingBill = useMemo(() => {
    return bills.find(b => b.id === id)
  }, [bills, id])

  // 计算预览下次收款日期
  const previewDueDate = useMemo(() => {
    return calculateNextDueDate(
      form.start_date,
      parseInt(form.bill_date, 10) || 1,
      form.payment_cycle,
      form.payment_cycle === 'custom' ? parseInt(form.custom_days, 10) : null
    )
  }, [form.start_date, form.bill_date, form.payment_cycle, form.custom_days])

  useEffect(() => {
    console.log('=== 应收账单表单初始化 ===')
    console.log('propertyId:', propertyId)
    console.log('id:', id)
    console.log('isEdit:', isEdit)
    
    if (existingBill) {
      loadBill()
    }
  }, [existingBill])

  const loadBill = () => {
    if (existingBill) {
      setForm({
        tenant_name: existingBill.tenant_name || '',
        tenant_phone: existingBill.tenant_phone || '',
        amount: existingBill.amount?.toString() || '',
        payment_cycle: existingBill.payment_cycle || 'monthly',
        custom_days: existingBill.custom_days?.toString() || '',
        start_date: existingBill.start_date || new Date().toISOString().split('T')[0],
        bill_date: existingBill.bill_date?.toString() || '1',
        reminder_days: '3',
        remark: existingBill.remark || '',
      })
    }
  }

  const handleInputChange = (field: keyof RentBillForm, value: string) => {
    console.log(`输入 ${field}:`, value)
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handlePaymentCycleChange = (e: any) => {
    const index = e.detail.value
    const value = paymentCycleValues[index]
    console.log('选择付款周期:', value)
    handleInputChange('payment_cycle', value)
  }

  const handleBillDateChange = (e: any) => {
    const index = e.detail.value
    const value = String(index + 1)
    console.log('选择账单日:', value)
    handleInputChange('bill_date', value)
  }

  const handleStartDateChange = (e: any) => {
    const value = e.detail.value
    console.log('选择开始日期:', value)
    handleInputChange('start_date', value)
  }

  const handleSubmit = () => {
    console.log('=== 提交账单 ===')
    console.log('表单数据:', form)
    
    // 表单验证
    if (!form.amount || parseFloat(form.amount) <= 0) {
      Taro.showToast({ title: '请输入正确的金额', icon: 'none' })
      return
    }

    if (form.payment_cycle === 'custom' && (!form.custom_days || parseInt(form.custom_days) <= 0)) {
      Taro.showToast({ title: '请输入自定义天数', icon: 'none' })
      return
    }

    if (!form.start_date) {
      Taro.showToast({ title: '请选择账单开始日期', icon: 'none' })
      return
    }

    if (!propertyId) {
      Taro.showToast({ title: '房源ID缺失', icon: 'none' })
      console.error('propertyId 为空')
      return
    }

    setSubmitting(true)
    
    const billData = {
      property_id: propertyId,
      tenant_name: form.tenant_name.trim() || null,
      tenant_phone: form.tenant_phone.trim() || null,
      amount: parseFloat(form.amount),
      payment_cycle: form.payment_cycle,
      start_date: form.start_date,
      bill_date: parseInt(form.bill_date, 10),
      custom_days: form.payment_cycle === 'custom' ? parseInt(form.custom_days, 10) : null,
      status: 'pending' as const,
      remark: form.remark.trim() || null,
    }

    console.log('准备保存账单数据:', billData)

    let savedBillId = id
    
    if (isEdit) {
      updateBill(id!, billData)
      console.log('更新账单成功:', id)
      Taro.showToast({ title: '更新成功', icon: 'success' })
    } else {
      const newBill = addBill(billData)
      savedBillId = newBill.id
      console.log('创建账单成功:', newBill)
      Taro.showToast({ title: '创建成功', icon: 'success' })
      
      // 如果房源不是已租状态，自动更新为已租
      if (property && property.status !== 'rented') {
        updateProperty(propertyId, { status: 'rented' })
        console.log('已将房源状态更新为已租')
      }
    }

    // 创建账单提醒
    const reminderDays = parseInt(form.reminder_days, 10) || 3
    if (reminderDays > 0 && savedBillId) {
      const propertyName = property 
        ? `${property.community}${property.building ? ' ' + property.building : ''}` 
        : '房源'
      
      console.log('创建提醒:', { billId: savedBillId, propertyName, previewDueDate, reminderDays })
      
      addBillReminder(savedBillId, propertyName, previewDueDate, reminderDays)
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
                <Calendar size={18} color="#3b82f6" />
                <Text className="text-sm text-gray-500">关联房源：</Text>
                <Text className="text-sm font-medium text-gray-900">
                  {property.community}{property.building ? ` ${property.building}` : ''}
                </Text>
              </View>
            </View>
          )}

          {/* 租客信息 */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-base font-bold text-gray-800 mb-4">租客信息</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">租客姓名</Text>
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
              <Text className="text-sm text-gray-600 mb-2">联系电话</Text>
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

          {/* 账单设置 */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-base font-bold text-gray-800 mb-4">账单设置</Text>
            
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">账单开始日期 *</Text>
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
              <Text className="text-xs text-gray-400 mt-1">租约起始日期，用于计算首次收款日期</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">应收金额 (元) *</Text>
              <View className="flex items-center gap-2">
                <DollarSign size={18} color="#999" />
                <View className="flex-1">
                  <Input
                    type="digit"
                    placeholder="请输入应收金额"
                    value={form.amount}
                    onInput={(e) => handleInputChange('amount', e.detail.value)}
                  />
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">付款周期 *</Text>
              <Picker
                mode="selector"
                range={paymentCycleOptions}
                value={paymentCycleValues.indexOf(form.payment_cycle)}
                onChange={handlePaymentCycleChange}
              >
                <View className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-3">
                  <Text className="text-sm">
                    {paymentCycleOptions[paymentCycleValues.indexOf(form.payment_cycle)] || '请选择'}
                  </Text>
                  <Text className="text-gray-400">{'>'}</Text>
                </View>
              </Picker>
            </View>

            {form.payment_cycle === 'custom' && (
              <View className="mb-4">
                <Text className="text-sm text-gray-600 mb-2">自定义天数 *</Text>
                <Input
                  type="number"
                  placeholder="请输入天数"
                  value={form.custom_days}
                  onInput={(e) => handleInputChange('custom_days', e.detail.value)}
                />
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">账单日 *</Text>
              <Picker
                mode="selector"
                range={billDateLabels}
                value={parseInt(form.bill_date, 10) - 1}
                onChange={handleBillDateChange}
              >
                <View className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-3">
                  <Text className="text-sm">
                    {billDateLabels[parseInt(form.bill_date, 10) - 1] || '请选择'}
                  </Text>
                  <Text className="text-gray-400">{'>'}</Text>
                </View>
              </Picker>
            </View>

            {/* 预览下次收款日期 */}
            <View className="bg-sky-50 rounded-lg p-3 mt-2">
              <View className="flex items-center gap-2 mb-1">
                <Info size={14} color="#3b82f6" />
                <Text className="text-xs text-sky-600">下次收款日期预览</Text>
              </View>
              <Text className="text-sm font-medium text-sky-700">
                {previewDueDate}（{getPaymentCycleText(form.payment_cycle, form.payment_cycle === 'custom' ? parseInt(form.custom_days, 10) : null)}）
              </Text>
            </View>
          </View>

          {/* 提醒设置 */}
          <View className="bg-white rounded-xl p-4">
            <View className="flex items-center gap-2 mb-4">
              <Bell size={18} color="#3b82f6" />
              <Text className="text-base font-bold text-gray-800">提醒设置</Text>
            </View>
            
            <View>
              <Text className="text-sm text-gray-600 mb-2">提前提醒天数</Text>
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
                将在账单日前指定天数提醒您收租
              </Text>
            </View>
          </View>

          {/* 备注 */}
          <View className="bg-white rounded-xl p-4">
            <Text className="text-base font-bold text-gray-800 mb-4">备注</Text>
            <Input
              placeholder="添加备注信息（可选）"
              value={form.remark}
              onInput={(e) => handleInputChange('remark', e.detail.value)}
            />
          </View>

          {/* 提交按钮 */}
          <View className="pb-6">
            <View 
              className={`h-12 rounded-lg flex items-center justify-center ${submitting ? 'bg-gray-300' : 'bg-sky-500'}`}
              onClick={submitting ? undefined : handleSubmit}
            >
              <Text className="text-white text-base font-medium">
                {submitting ? '保存中...' : isEdit ? '保存修改' : '创建账单'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
