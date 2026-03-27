export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '添加跟进记录',
    })
  : {
      navigationBarTitleText: '添加跟进记录',
    }
