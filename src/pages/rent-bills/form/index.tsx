import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { User, Phone, DollarSign, Bell, Calendar } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRentBillStore, calculateNextDueDate } from '@/stores/rentBill'
import { useReminderStore } from '@/stores/reminder'
import { usePropertyStore } from '@/stores/property'

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

const paymentCycleOptions = [
  { value: 'monthly', label: '月付' },
  { value: 'quarterly', label: '季付' },
  { value: 'custom', label: '自定义' },
]

const billDateOptions = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `每月${i + 1}号`,
}))

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
  
  // 提醒存储
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

  const handleDateChange = (e: any) => {
    const index = e.detail.value
    const selected = billDateOptions[index]
    if (selected) {
      console.log('选择账单日:', selected.value)
      handleInputChange('bill_date', selected.value)
    }
  }

  const handlePaymentCycleChange = (e: any) => {
    const index = e.detail.value
    const selected = paymentCycleOptions[index]
    if (selected) {
      console.log('选择付款周期:', selected.value)
      handleInputChange('payment_cycle', selected.value as 'monthly' | 'quarterly' | 'custom')
    }
  }

  const handleSubmit = async () => {
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

    try {
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
        
        // 计算下次收款日期
        const nextDueDate = calculateNextDueDate(
          parseInt(form.bill_date, 10),
          form.payment_cycle,
          form.payment_cycle === 'custom' ? parseInt(form.custom_days, 10) : null
        )
        
        console.log('创建提醒:', {
          billId: savedBillId,
          propertyName,
          nextDueDate,
          reminderDays
        })
        
        addBillReminder(
          savedBillId,
          propertyName,
          nextDueDate,
          reminderDays
        )
      }
      
      setTimeout(() => {
        console.log('返回上一页')
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      <ScrollView scrollY className="flex-1 p-4">
        <View className="space-y-4">
          {/* 关联房源信息 */}
          {property && (
            <Card>
              <CardContent className="p-4">
                <View className="flex items-center gap-2">
                  <Calendar size={18} color="#3b82f6" />
                  <Text className="text-sm text-gray-500">关联房源：</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {property.community}{property.building ? ` ${property.building}` : ''}
                  </Text>
                </View>
              </CardContent>
            </Card>
          )}

          {/* 租客信息 */}
          <Card>
            <CardHeader>
              <CardTitle>租客信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="block text-sm text-gray-600 mb-2">租客姓名</Text>
                <View className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                  <User size={18} color="#999" />
                  <Input
                    className="flex-1 bg-transparent"
                    placeholder="请输入租客姓名"
                    value={form.tenant_name}
                    onInput={(e) => handleInputChange('tenant_name', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">联系电话</Text>
                <View className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                  <Phone size={18} color="#999" />
                  <Input
                    type="number"
                    className="flex-1 bg-transparent"
                    placeholder="请输入联系电话"
                    value={form.tenant_phone}
                    onInput={(e) => handleInputChange('tenant_phone', e.detail.value)}
                  />
                </View>
              </View>
            </CardContent>
          </Card>

          {/* 账单设置 */}
          <Card>
            <CardHeader>
              <CardTitle>账单设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="block text-sm text-gray-600 mb-2">应收金额 (元) *</Text>
                <View className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                  <DollarSign size={18} color="#999" />
                  <Input
                    type="digit"
                    className="flex-1 bg-transparent"
                    placeholder="请输入应收金额"
                    value={form.amount}
                    onInput={(e) => handleInputChange('amount', e.detail.value)}
                  />
                </View>
              </View>

              <View>
                <Text className="block text-sm text-gray-600 mb-2">付款周期 *</Text>
                <Picker
                  mode="selector"
                  range={paymentCycleOptions}
                  rangeKey="label"
                  value={Math.max(0, paymentCycleOptions.findIndex(o => o.value === form.payment_cycle))}
                  onChange={handlePaymentCycleChange}
                >
                  <View className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <Text className="text-gray-900">
                      {paymentCycleOptions.find(o => o.value === form.payment_cycle)?.label || '请选择'}
                    </Text>
                    <Text className="text-gray-400">{'>'}</Text>
                  </View>
                </Picker>
              </View>

              {form.payment_cycle === 'custom' && (
                <View>
                  <Text className="block text-sm text-gray-600 mb-2">自定义天数 *</Text>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Input
                      type="number"
                      className="w-full bg-transparent"
                      placeholder="请输入天数"
                      value={form.custom_days}
                      onInput={(e) => handleInputChange('custom_days', e.detail.value)}
                    />
                  </View>
                </View>
              )}

              <View>
                <Text className="block text-sm text-gray-600 mb-2">账单日 *</Text>
                <Picker
                  mode="selector"
                  range={billDateOptions}
                  rangeKey="label"
                  value={Math.max(0, parseInt(form.bill_date, 10) - 1)}
                  onChange={handleDateChange}
                >
                  <View className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <Text className="text-gray-900">
                      {billDateOptions.find(o => o.value === form.bill_date)?.label || '请选择'}
                    </Text>
                    <Text className="text-gray-400">{'>'}</Text>
                  </View>
                </Picker>
              </View>
            </CardContent>
          </Card>

          {/* 提醒设置 */}
          <Card>
            <CardHeader>
              <View className="flex items-center gap-2">
                <Bell size={18} color="#3b82f6" />
                <CardTitle>提醒设置</CardTitle>
              </View>
            </CardHeader>
            <CardContent className="space-y-4">
              <View>
                <Text className="block text-sm text-gray-600 mb-2">提前提醒天数</Text>
                <View className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                  <Input
                    type="number"
                    className="flex-1 bg-transparent"
                    placeholder="请输入提前提醒天数"
                    value={form.reminder_days}
                    onInput={(e) => handleInputChange('reminder_days', e.detail.value)}
                  />
                  <Text className="text-sm text-gray-500">天</Text>
                </View>
                <Text className="block text-xs text-gray-400 mt-2">
                  将在账单日前指定天数提醒您收租
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* 提交按钮 */}
          <View className="pb-6">
            <Button
              className="w-full h-12 bg-sky-500 rounded-xl"
              onClick={handleSubmit}
              disabled={submitting}
            >
              <Text className="text-white text-base font-medium">
                {submitting ? '保存中...' : '保存'}
              </Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
