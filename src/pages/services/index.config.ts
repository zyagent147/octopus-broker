export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '生活服务',
      enablePullDownRefresh: true,
    })
  : {
      navigationBarTitleText: '生活服务',
      enablePullDownRefresh: true,
    }
