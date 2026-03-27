import { View, Text, ScrollView, Picker } from '@tarojs/components'
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { Network } from '@/network'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface FormData {
  name: string
  phone: string
  budget: string
  contract_type: 'rent' | 'buy' | ''
  contract_end_date: string
  birthday: string
  requirements: string
  status: 'pending' | 'following' | 'completed' | 'abandoned'
  reminder_days_contract: string
  reminder_days_birthday: string
}

const initialFormData: FormData = {
  name: '',
  phone: '',
  budget: '',
  contract_type: '',
  contract_end_date: '',
  birthday: '',
  requirements: '',
  status: 'pending',
  reminder_days_contract: '3',
  reminder_days_birthday: '3',
}

const CustomerFormPage: FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const router = useRouter()
  const customerId = router.params.id

  useEffect(() => {
    if (customerId) {
      setIsEdit(true)
      loadCustomer()
    }
  }, [customerId])

  const loadCustomer = async () => {
    try {
      const result = await Network.request<{ data: any }>({
        url: `/api/customers/${customerId}`,
        method: 'GET',
      })
      const customer = result.data
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        budget: customer.budget || '',
        contract_type: customer.contract_type || '',
        contract_end_date: customer.contract_end_date || '',
        birthday: customer.birthday || '',
        requirements: customer.requirements || '',
        status: customer.status || 'pending',
        reminder_days_contract: String(customer.reminder_days_contract || 3),
        reminder_days_birthday: String(customer.reminder_days_birthday || 3),
      })
    } catch (error) {
      console.error('加载客户信息失败', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      Taro.showToast({ title: '请输入客户姓名', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const submitData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        budget: formData.budget.trim() || null,
        contract_type: formData.contract_type || null,
        contract_end_date: formData.contract_end_date || null,
        birthday: formData.birthday || null,
        requirements: formData.requirements.trim() || null,
        status: formData.status,
        reminder_days_contract: parseInt(formData.reminder_days_contract) || 3,
        reminder_days_birthday: parseInt(formData.reminder_days_birthday) || 3,
      }

      if (isEdit) {
        await Network.request({
          url: `/api/customers/${customerId}`,
          method: 'PUT',
          data: submitData,
        })
        Taro.showToast({ title: '更新成功', icon: 'success' })
      } else {
        await Network.request({
          url: '/api/customers',
          method: 'POST',
          data: submitData,
        })
        Taro.showToast({ title: '添加成功', icon: 'success' })
      }

      setTimeout(() => {
        Taro.navigateBack()
      }, 1000)
    } catch (error) {
      console.error('保存失败', error)
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { label: '待跟进', value: 'pending' },
    { label: '跟进中', value: 'following' },
    { label: '已成交', value: 'completed' },
    { label: '已放弃', value: 'abandoned' },
  ]

  const contractTypeOptions = [
    { label: '请选择', value: '' },
    { label: '租房', value: 'rent' },
    { label: '购房', value: 'buy' },
  ]

  return (
    <ScrollView className="min-h-screen bg-gray-50" scrollY>
      <View className="px-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isEdit ? '编辑客户' : '添加客户'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 基本信息 */}
            <View>
              <Label className="text-sm text-gray-600 mb-1">
                客户姓名 <Text className="text-red-500">*</Text>
              </Label>
              <Input
                className="h-10 mt-1"
                placeholder="请输入客户姓名"
                value={formData.name}
                onInput={(e) => setFormData({ ...formData, name: e.detail.value })}
              />
            </View>

            <View>
              <Label className="text-sm text-gray-600 mb-1">联系电话</Label>
              <Input
                className="h-10 mt-1"
                type="number"
                placeholder="请输入联系电话"
                value={formData.phone}
                onInput={(e) => setFormData({ ...formData, phone: e.detail.value })}
              />
            </View>

            <View>
              <Label className="text-sm text-gray-600 mb-1">预算范围</Label>
              <Input
                className="h-10 mt-1"
                placeholder="如：2000-3000元/月"
                value={formData.budget}
                onInput={(e) => setFormData({ ...formData, budget: e.detail.value })}
              />
            </View>

            <View>
              <Label className="text-sm text-gray-600 mb-1">合约类型</Label>
              <Picker
                mode="selector"
                range={contractTypeOptions}
                rangeKey="label"
                value={contractTypeOptions.findIndex(
                  (o) => o.value === formData.contract_type
                )}
                onChange={(e) => {
                  const index = parseInt((e as any).detail.value)
                  setFormData({
                    ...formData,
                    contract_type: contractTypeOptions[index].value as any,
                  })
                }}
              >
                <View className="h-10 mt-1 bg-white border border-gray-200 rounded-lg px-3 flex items-center">
                  <Text
                    className={
                      formData.contract_type ? 'text-gray-800' : 'text-gray-400'
                    }
                  >
                    {contractTypeOptions.find((o) => o.value === formData.contract_type)
                      ?.label || '请选择'}
                  </Text>
                </View>
              </Picker>
            </View>

            <View>
              <Label className="text-sm text-gray-600 mb-1">合约到期时间</Label>
              <Picker
                mode="date"
                value={formData.contract_end_date}
                onChange={(e) =>
                  setFormData({ ...formData, contract_end_date: e.detail.value })
                }
              >
                <View className="h-10 mt-1 bg-white border border-gray-200 rounded-lg px-3 flex items-center">
                  <Text
                    className={
                      formData.contract_end_date ? 'text-gray-800' : 'text-gray-400'
                    }
                  >
                    {formData.contract_end_date || '请选择日期'}
                  </Text>
                </View>
              </Picker>
            </View>

            <View>
              <Label className="text-sm text-gray-600 mb-1">生日</Label>
              <Picker
                mode="date"
                value={formData.birthday}
                onChange={(e) =>
                  setFormData({ ...formData, birthday: e.detail.value })
                }
              >
                <View className="h-10 mt-1 bg-white border border-gray-200 rounded-lg px-3 flex items-center">
                  <Text className={formData.birthday ? 'text-gray-800' : 'text-gray-400'}>
                    {formData.birthday || '请选择日期'}
                  </Text>
                </View>
              </Picker>
            </View>

            <View>
              <Label className="text-sm text-gray-600 mb-1">客户需求</Label>
              <Textarea
                className="mt-1 min-h-20"
                placeholder="请输入客户需求，如户型、位置偏好等"
                value={formData.requirements}
                onInput={(e) =>
                  setFormData({ ...formData, requirements: e.detail.value })
                }
              />
            </View>

            <View>
              <Label className="text-sm text-gray-600 mb-1">跟进状态</Label>
              <Picker
                mode="selector"
                range={statusOptions}
                rangeKey="label"
                value={statusOptions.findIndex((o) => o.value === formData.status)}
                onChange={(e) => {
                  const index = parseInt((e as any).detail.value)
                  setFormData({ ...formData, status: statusOptions[index].value as any })
                }}
              >
                <View className="h-10 mt-1 bg-white border border-gray-200 rounded-lg px-3 flex items-center">
                  <Text className="text-gray-800">
                    {statusOptions.find((o) => o.value === formData.status)?.label}
                  </Text>
                </View>
              </Picker>
            </View>
          </CardContent>
        </Card>

        {/* 提醒设置 */}
        <Card className="mt-3">
          <CardHeader>
            <CardTitle className="text-base">提醒设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <View>
              <Label className="text-sm text-gray-600 mb-1">
                合约到期提前提醒天数
              </Label>
              <Input
                className="h-10 mt-1"
                type="number"
                placeholder="1-15天"
                value={formData.reminder_days_contract}
                onInput={(e) =>
                  setFormData({ ...formData, reminder_days_contract: e.detail.value })
                }
              />
            </View>

            <View>
              <Label className="text-sm text-gray-600 mb-1">
                生日提前提醒天数
              </Label>
              <Input
                className="h-10 mt-1"
                type="number"
                placeholder="1-15天"
                value={formData.reminder_days_birthday}
                onInput={(e) =>
                  setFormData({ ...formData, reminder_days_birthday: e.detail.value })
                }
              />
            </View>
          </CardContent>
        </Card>

        {/* 提交按钮 */}
        <View className="mt-6 mb-4">
          <Button
            className="w-full h-11 bg-blue-500"
            onClick={handleSubmit}
            
            disabled={loading}
          >
            <Text className="text-white text-base font-medium">
              {loading ? '保存中...' : '保存'}
            </Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  )
}

export default CustomerFormPage
