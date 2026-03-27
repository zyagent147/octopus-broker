export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '添加服务商',
    })
  : {
      navigationBarTitleText: '添加服务商',
    }
