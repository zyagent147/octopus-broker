export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '客户详情',
    })
  : {
      navigationBarTitleText: '客户详情',
    }
