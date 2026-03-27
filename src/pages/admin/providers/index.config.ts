export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '服务商管理',
    })
  : {
      navigationBarTitleText: '服务商管理',
    }
