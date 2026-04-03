import { View, Text } from '@tarojs/components'

export default function PrivacyPolicyPage() {
  return (
    <View style={{ padding: '20px', backgroundColor: '#fff', minHeight: '100vh' }}>
      <Text style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
        隐私政策
      </Text>
      
      <Text style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '20px', textAlign: 'center' }}>
        更新日期：2024年01月01日
      </Text>

      <View style={{ fontSize: '14px', lineHeight: '24px', color: '#4b5563' }}>
        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          引言
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          "章鱼经纪人"小程序（以下简称"我们"）非常重视用户隐私和个人信息保护。本隐私政策将向您说明我们如何收集、使用、存储、共享和保护您的个人信息。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          一、我们收集的信息
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          1.1 您授权我们收集的信息：
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px', marginLeft: '16px' }}>
          • 微信账号信息：包括微信昵称、头像等公开信息
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px', marginLeft: '16px' }}>
          • 您主动填写的信息：包括客户信息、房源信息、租约信息等
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          1.2 我们在您使用服务时收集的信息：
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px', marginLeft: '16px' }}>
          • 设备信息：设备型号、操作系统版本等
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px', marginLeft: '16px' }}>
          • 日志信息：操作日志、访问时间、页面浏览记录等
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          二、我们如何使用收集的信息
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          2.1 为您提供、维护、改进我们的服务
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          2.2 用于身份验证、安全防范、诈骗监测等
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          2.3 经您同意的其他用途
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          三、信息的存储
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          3.1 我们将在中华人民共和国境内收集和产生的个人信息存储在境内。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          3.2 我们会采取加密等安全措施存储您的个人信息。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          四、信息的共享、转让、公开披露
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          4.1 我们不会向第三方共享、转让您的个人信息，除非：
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px', marginLeft: '16px' }}>
          • 获得您的明确同意
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px', marginLeft: '16px' }}>
          • 根据法律法规要求
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px', marginLeft: '16px' }}>
          • 应政府部门要求
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          五、您的权利
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          5.1 访问权：您有权访问您的个人信息
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          5.2 更正权：您有权更正不准确的信息
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          5.3 删除权：您有权要求删除您的个人信息
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          5.4 撤回同意权：您有权撤回之前给予的同意
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          六、信息安全
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          6.1 我们采用业界领先的技术保护措施，包括但不限于防火墙、加密、去标识化等。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          6.2 我们建立了专门的管理制度、流程和组织保障信息安全。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          七、未成年人保护
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          7.1 我们非常重视对未成年人个人信息的保护。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          7.2 如您为未成年人，请在监护人指导下使用本服务。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          八、本政策的更新
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          8.1 我们可能适时修订本政策内容。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          8.2 如本政策更新，我们会在小程序内通过弹窗、公告等形式通知您。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          九、联系我们
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          如您对本隐私政策有任何疑问、意见或建议，请通过小程序内的反馈功能联系我们。
        </Text>
      </View>
    </View>
  )
}
