export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '添加客户',
    })
  : {
      navigationBarTitleText: '添加客户',
    }
