import { View, Text } from '@tarojs/components'

export default function UserAgreementPage() {
  return (
    <View style={{ padding: '20px', backgroundColor: '#fff', minHeight: '100vh' }}>
      <Text style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
        用户服务协议
      </Text>
      
      <Text style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '20px', textAlign: 'center' }}>
        更新日期：2024年01月01日
      </Text>

      <View style={{ fontSize: '14px', lineHeight: '24px', color: '#4b5563' }}>
        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          一、协议的接受与修改
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          1.1 本协议是您与"章鱼经纪人"小程序（以下简称"本平台"）之间关于使用本平台服务所订立的协议。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          1.2 您通过网络页面点击确认或以其他方式选择接受本协议，即表示您与本平台已达成协议并同意接受本协议的全部约定内容。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          1.3 本平台有权在必要时修改本协议条款，您可以在相关服务页面查阅最新版本的协议条款。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          二、服务内容
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          2.1 本平台为房产经纪人提供客户管理、房源管理、租约管理、账单管理等办公工具服务。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          2.2 您理解并同意，本平台有权随时更改、中断或终止部分或全部的服务。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          三、用户账号
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          3.1 您需要通过微信授权登录使用本平台服务。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          3.2 您应妥善保管账号信息，因账号保管不当造成的损失由您自行承担。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          四、用户行为规范
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          4.1 您承诺在使用本平台服务时遵守相关法律法规。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          4.2 您不得利用本平台发布违法、虚假或侵权信息。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          4.3 您不得干扰本平台的正常运行。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          五、知识产权
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          5.1 本平台的所有内容，包括但不限于文字、图片、软件等的知识产权归本平台所有。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          5.2 未经本平台许可，您不得擅自使用、修改、传播上述内容。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          六、隐私保护
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          6.1 本平台重视用户隐私保护，具体内容请参见《隐私政策》。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          七、免责声明
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          7.1 本平台不保证服务不会中断，对服务的及时性、安全性不作担保。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          7.2 因不可抗力或第三方原因导致的服务中断，本平台不承担责任。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          八、法律适用与争议解决
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          8.1 本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律。
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          8.2 如双方就本协议内容或其执行发生任何争议，双方应尽力友好协商解决。
        </Text>

        <Text style={{ display: 'block', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
          九、联系我们
        </Text>
        <Text style={{ display: 'block', marginBottom: '8px' }}>
          如您对本协议有任何疑问，请通过小程序内的反馈功能联系我们。
        </Text>
      </View>
    </View>
  )
}
