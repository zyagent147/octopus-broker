export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '添加服务',
    })
  : {
      navigationBarTitleText: '添加服务',
    }
