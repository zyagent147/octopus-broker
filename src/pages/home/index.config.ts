export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '章鱼经纪人',
      navigationStyle: 'custom',
    })
  : {
      navigationBarTitleText: '章鱼经纪人',
      navigationStyle: 'custom',
    }
