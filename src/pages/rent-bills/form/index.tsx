import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { User, Phone, DollarSign, Bell, Calendar } from 'lucide-react-taro'
import { useRentBillStore, calculateNextDueDate } from '@/stores/rentBill'
import { useReminderStore } from '@/stores/reminder'
import { usePropertyStore } from '@/stores/property'
import { Input } from '@/components/ui/input'

interface RentBillForm {
  tenant_name: string
  tenant_phone: string
  amount: string
  payment_cycle: 'monthly' | 'quarterly' | 'custom'
  custom_days: string
  bill_date: string
  reminder_days: string
}

const initialForm: RentBillForm = {
  tenant_name: '',
  tenant_phone: '',
  amount: '',
  payment_cycle: 'monthly',
  custom_days: '',
  bill_date: '1',
  reminder_days: '3',
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

  // 本地存储
  const getBill = useRentBillStore(state => state.getBill)
  const addBill = useRentBillStore(state => state.addBill)
  const updateBill = useRentBillStore(state => state.updateBill)
  const getProperty = usePropertyStore(state => state.getProperty)
  const updateProperty = usePropertyStore(state => state.updateProperty)
  const addBillReminder = useReminderStore(state => state.addBillReminder)

  // 获取房源信息
  const property = propertyId ? getProperty(propertyId) : null

  useEffect(() => {
    console.log('=== 应收账单表单初始化 ===')
    console.log('propertyId:', propertyId)
    console.log('id:', id)
    console.log('isEdit:', isEdit)
    
    if (id) {
      loadBill()
    }
  }, [id])

  const loadBill = () => {
    const bill = getBill(id!)
    if (bill) {
      setForm({
        tenant_name: bill.tenant_name || '',
        tenant_phone: bill.tenant_phone || '',
        amount: bill.amount?.toString() || '',
        payment_cycle: bill.payment_cycle || 'monthly',
        custom_days: bill.custom_days?.toString() || '',
        bill_date: bill.bill_date?.toString() || '1',
        reminder_days: '3',
      })
    } else {
      Taro.showToast({ title: '账单不存在', icon: 'none' })
      setTimeout(() => Taro.navigateBack(), 1500)
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
      bill_date: parseInt(form.bill_date, 10),
      custom_days: form.payment_cycle === 'custom' ? parseInt(form.custom_days, 10) : null,
      status: 'pending' as const,
      paid_at: null,
      remark: null,
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
      
      const nextDueDate = calculateNextDueDate(
        parseInt(form.bill_date, 10),
        form.payment_cycle,
        form.payment_cycle === 'custom' ? parseInt(form.custom_days, 10) : null
      )
      
      console.log('创建提醒:', { billId: savedBillId, propertyName, nextDueDate, reminderDays })
      
      addBillReminder(savedBillId, propertyName, nextDueDate, reminderDays)
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

            <View>
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

          {/* 提交按钮 */}
          <View className="pb-6">
            <View 
              className={`h-12 rounded-lg flex items-center justify-center ${submitting ? 'bg-gray-300' : 'bg-sky-500'}`}
              onClick={submitting ? undefined : handleSubmit}
            >
              <Text className="text-white text-base font-medium">
                {submitting ? '保存中...' : '保存'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
