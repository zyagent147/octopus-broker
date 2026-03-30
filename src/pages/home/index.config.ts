export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '章鱼经纪人',
      enableShareAppMessage: false,
      enableShareTimeline: false,
    })
  : {
      navigationBarTitleText: '章鱼经纪人',
      enableShareAppMessage: false,
      enableShareTimeline: false,
    }
