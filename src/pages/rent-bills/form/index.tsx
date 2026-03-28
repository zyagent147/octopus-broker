import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Calendar, User, Phone, DollarSign } from 'lucide-react-taro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RentBillForm {
  tenant_name: string
  tenant_phone: string
  amount: string
  payment_cycle: 'monthly' | 'quarterly' | 'custom'
  custom_days: string
  bill_date: string
  next_due_date: string
}

const initialForm: RentBillForm = {
  tenant_name: '',
  tenant_phone: '',
  amount: '',
  payment_cycle: 'monthly',
  custom_days: '',
  bill_date: '1',
  next_due_date: '',
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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 设置默认下次应收日期为下个月账单日
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const defaultDueDate = nextMonth.toISOString().split('T')[0]
    setForm(prev => ({ ...prev, next_due_date: defaultDueDate }))

    if (id) {
      fetchBill()
    }
  }, [id])

  const fetchBill = async () => {
    try {
      setLoading(true)
      const res = await Network.request({
        url: `/api/rent-bills/${id}`,
        method: 'GET',
      })
      
      const data = res.data.data
      setForm({
        tenant_name: data.tenant_name || '',
        tenant_phone: data.tenant_phone || '',
        amount: data.amount?.toString() || '',
        payment_cycle: data.payment_cycle || 'monthly',
        custom_days: data.custom_days?.toString() || '',
        bill_date: data.bill_date?.toString() || '1',
        next_due_date: data.next_due_date || '',
      })
    } catch (error) {
      console.error('获取账单详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof RentBillForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (e: any) => {
    const index = e.detail.value
    const selected = billDateOptions[index]
    if (selected) {
      handleInputChange('bill_date', selected.value)
    }
  }

  const handlePaymentCycleChange = (e: any) => {
    const index = e.detail.value
    const selected = paymentCycleOptions[index]
    if (selected) {
      handleInputChange('payment_cycle', selected.value as 'monthly' | 'quarterly' | 'custom')
    }
  }

  const handleDueDateChange = (e: any) => {
    handleInputChange('next_due_date', e.detail.value)
  }

  const handleSubmit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      Taro.showToast({ title: '请输入正确的金额', icon: 'none' })
      return
    }

    if (form.payment_cycle === 'custom' && (!form.custom_days || parseInt(form.custom_days) <= 0)) {
      Taro.showToast({ title: '请输入自定义天数', icon: 'none' })
      return
    }

    if (!form.next_due_date) {
      Taro.showToast({ title: '请选择下次应收日期', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)
      
      const data: Record<string, unknown> = {
        property_id: propertyId,
        tenant_name: form.tenant_name || null,
        tenant_phone: form.tenant_phone || null,
        amount: parseFloat(form.amount),
        payment_cycle: form.payment_cycle,
        bill_date: parseInt(form.bill_date, 10),
        next_due_date: form.next_due_date,
      }

      if (form.payment_cycle === 'custom') {
        data.custom_days = parseInt(form.custom_days, 10)
      }

      const url = isEdit ? `/api/rent-bills/${id}` : '/api/rent-bills'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await Network.request({ url, method, data })
      
      if (res.data.code === 200) {
        Taro.showToast({ title: isEdit ? '更新成功' : '创建成功', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 1500)
      } else {
        Taro.showToast({ title: res.data.msg || '操作失败', icon: 'none' })
      }
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-full">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col h-full bg-gray-50">
      <ScrollView scrollY className="flex-1 p-4">
        <View className="space-y-4">
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
                  value={paymentCycleOptions.findIndex(o => o.value === form.payment_cycle)}
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
                  value={parseInt(form.bill_date, 10) - 1}
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

          {/* 下次应收 */}
          <Card>
            <CardHeader>
              <CardTitle>下次应收</CardTitle>
            </CardHeader>
            <CardContent>
              <View>
                <Text className="block text-sm text-gray-600 mb-2">应收日期 *</Text>
                <Picker mode="date" value={form.next_due_date} onChange={handleDueDateChange}>
                  <View className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <View className="flex items-center gap-2">
                      <Calendar size={18} color="#999" />
                      <Text className={form.next_due_date ? 'text-gray-900' : 'text-gray-400'}>
                        {form.next_due_date || '请选择日期'}
                      </Text>
                    </View>
                    <Text className="text-gray-400">{'>'}</Text>
                  </View>
                </Picker>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      {/* 底部提交按钮 */}
      <View 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          backgroundColor: '#fff',
          borderTop: '1px solid #e5e7eb',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        }}
      >
        <Button 
          className="w-full bg-sky-500 text-white rounded-xl" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Text className="text-white">{submitting ? '提交中...' : (isEdit ? '保存修改' : '创建账单')}</Text>
        </Button>
      </View>
    </View>
  )
}
