export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '房源详情',
    })
  : {
      navigationBarTitleText: '房源详情',
    }
