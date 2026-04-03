import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

interface PrivacyDialogProps {
  visible: boolean
  onAgree: () => void
  onDisagree: () => void
}

export default function PrivacyDialog({ visible, onAgree, onDisagree }: PrivacyDialogProps) {
  const [checked, setChecked] = useState(false)

  // 打开用户协议页面
  const openUserAgreement = () => {
    Taro.navigateTo({
      url: '/pages/agreement/user-agreement/index'
    })
  }

  // 打开隐私政策页面
  const openPrivacyPolicy = () => {
    Taro.navigateTo({
      url: '/pages/agreement/privacy-policy/index'
    })
  }

  // 处理同意
  const handleAgree = () => {
    if (!checked) {
      Taro.showToast({
        title: '请先阅读并同意协议',
        icon: 'none'
      })
      return
    }
    onAgree()
  }

  if (!visible) return null

  return (
    <View 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <View 
        style={{
          width: '85%',
          maxWidth: '320px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px 20px'
        }}
      >
        {/* 标题 */}
        <Text style={{
          display: 'block',
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '20px',
          color: '#1f2937'
        }}>
          服务协议和隐私政策
        </Text>

        {/* 协议内容 */}
        <View style={{
          fontSize: '14px',
          lineHeight: '24px',
          color: '#6b7280',
          marginBottom: '20px'
        }}>
          <Text style={{ display: 'block', marginBottom: '8px' }}>
            请您仔细阅读以下协议：
          </Text>
          <View style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Text 
              style={{ color: '#3b82f6', textDecoration: 'underline' }}
              onClick={openUserAgreement}
            >
              《用户服务协议》
            </Text>
            <Text 
              style={{ color: '#3b82f6', textDecoration: 'underline' }}
              onClick={openPrivacyPolicy}
            >
              《隐私政策》
            </Text>
          </View>
        </View>

        {/* 勾选框 */}
        <View 
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '20px',
            gap: '8px'
          }}
          onClick={() => setChecked(!checked)}
        >
          <View style={{
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            border: `2px solid ${checked ? '#3b82f6' : '#d1d5db'}`,
            backgroundColor: checked ? '#3b82f6' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {checked && (
              <Text style={{ color: '#fff', fontSize: '12px', lineHeight: '18px' }}>✓</Text>
            )}
          </View>
          <Text style={{
            flex: 1,
            fontSize: '13px',
            color: '#6b7280',
            lineHeight: '20px'
          }}>
            我已阅读并同意《用户服务协议》和《隐私政策》
          </Text>
        </View>

        {/* 按钮组 */}
        <View style={{ display: 'flex', gap: '12px' }}>
          <View
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={onDisagree}
          >
            <Text style={{ fontSize: '15px', color: '#6b7280' }}>不同意</Text>
          </View>
          <View
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '8px',
              backgroundColor: checked ? '#3b82f6' : '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={handleAgree}
          >
            <Text style={{ fontSize: '15px', color: '#fff' }}>同意并继续</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
