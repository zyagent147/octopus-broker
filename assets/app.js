// app.js - 性能优化版
App({
  globalData: {
    userInfo: null,
    appId: 'wxd244b605ba704aab',
    qclawAppId: '',
    cozeBotId: '7622587335254802478',
    cozeApiKey: ''
  },

  onLaunch() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) this.globalData.userInfo = userInfo;
    // 延迟初始化演示数据，不阻塞启动
    setTimeout(() => this.initDemoData(), 100);
  },

  initDemoData() {
    // 使用同步检查，避免多次读取
    const hasData = wx.getStorageSync('_demoLoaded');
    if (hasData) return;

    const demoClients = [
      { id: 'c001', name: '张伟', phone: '13800138001', gender: '男', age: 28, occupation: 'IT工程师', birthday: '1998-04-15', budget: '2500-3500', area: '光谷', roomType: '两室一厅', tags: ['意向高'], status: '意向高', followCount: 12, createTime: '2026-03-01' },
      { id: 'c002', name: '李娜', phone: '13900139002', gender: '女', age: 25, occupation: '会计', birthday: '2001-04-20', budget: '2000-3000', area: '江汉区', roomType: '一室一厅', tags: ['待跟进'], status: '待跟进', followCount: 3, createTime: '2026-03-10' },
      { id: 'c003', name: '王强', phone: '13700137003', gender: '男', age: 32, occupation: '销售经理', birthday: '1994-05-01', budget: '4000-5000', area: '武昌', roomType: '三室两厅', tags: ['成交中'], status: '成交中', followCount: 8, createTime: '2026-02-20' },
      { id: 'c004', name: '陈静', phone: '13600136004', gender: '女', age: 30, occupation: '教师', birthday: '1996-04-18', budget: '3000-4000', area: '洪山区', roomType: '两室一厅', tags: ['新客户'], status: '新客户', followCount: 1, createTime: '2026-03-25' },
      { id: 'c005', name: '刘洋', phone: '13500135005', gender: '男', age: 26, occupation: '设计师', birthday: '2000-04-25', budget: '2500-3500', area: '光谷', roomType: '一室一厅', tags: ['待跟进'], status: '待跟进', followCount: 5, createTime: '2026-03-05' }
    ];

    const demoHouses = [
      { id: 'h001', title: '光谷广场旁精装两室', address: '武汉市洪山区光谷街88号', community: '光谷花园', roomType: '2室1厅', area: '85', floor: '12/28', orientation: '南', price: '3200', deposit: '6400', facilities: ['空调', '热水器', '洗衣机', '冰箱', '床'], status: '在租', createTime: '2026-03-01' },
      { id: 'h002', title: '江汉路步行街温馨一室', address: '武汉市江汉区江汉路128号', community: '江汉小区', roomType: '1室1厅', area: '55', floor: '6/18', orientation: '东南', price: '2800', deposit: '5600', facilities: ['空调', '热水器', '床', '衣柜'], status: '在租', createTime: '2026-03-05' },
      { id: 'h003', title: '武昌徐东三室两厅豪装', address: '武汉市武昌区徐东大街56号', community: '徐东花园', roomType: '3室2厅', area: '120', floor: '15/30', orientation: '南北', price: '5500', deposit: '11000', facilities: ['空调', '热水器', '洗衣机', '冰箱', '床', '沙发', '电视'], status: '空置', createTime: '2026-03-10' },
      { id: 'h004', title: '洪山区大学城旁精装单间', address: '武汉市洪山区珞瑜路200号', community: '学府佳苑', roomType: '1室0厅', area: '35', floor: '8/22', orientation: '北', price: '1800', deposit: '3600', facilities: ['空调', '热水器', '床', '书桌'], status: '在租', createTime: '2026-03-15' },
      { id: 'h005', title: '汉口CBD轻奢两室', address: '武汉市江汉区建设大道399号', community: 'CBD首义广场', roomType: '2室1厅', area: '90', floor: '20/32', orientation: '南', price: '4200', deposit: '8400', facilities: ['空调', '热水器', '洗衣机', '冰箱', '床', '沙发'], status: '空置', createTime: '2026-03-20' }
    ];

    const demoRecords = [
      { id: 'f001', clientId: 'c001', clientName: '张伟', type: '带看', content: '带看光谷花园2室1厅，客户对装修比较满意，但觉得价格略高，表示回去考虑。', date: '2026-03-28', result: '待回复' },
      { id: 'f002', clientId: 'c001', clientName: '张伟', type: '跟进', content: '电话跟进，客户表示想再看看周边其他小区。已推荐徐东和洪山区的新上房源。', date: '2026-03-27', result: '待回复' },
      { id: 'f003', clientId: 'c002', clientName: '李娜', type: '跟进', content: '微信消息问候，客户表示工作忙，这周没时间看房，约定下周一再联系。', date: '2026-03-26', result: '待回复' },
      { id: 'f004', clientId: 'c003', clientName: '王强', type: '签约', content: '合同谈判顺利，客户确认租赁徐东花园三室，月租5500元，明天签合同。', date: '2026-03-29', result: '待签约' }
    ];

    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
    const demoReminders = [
      { id: 'r001', type: 'birthday', title: '🎂 客户生日提醒', clientId: 'c001', clientName: '张伟', content: '客户张伟明天过生日，记得发送祝福！', date: tomorrow.toISOString().split('T')[0], done: false },
      { id: 'r002', type: 'followup', title: '📋 跟进任务提醒', clientId: 'c002', clientName: '李娜', content: '约定今天电话联系，询问看房意向', date: today.toISOString().split('T')[0], done: false },
      { id: 'r003', type: 'contract', title: '📄 合同到期提醒', clientId: 'c003', clientName: '王强', content: '租金合同7天后到期，请提前与房东/租客确认续约意向', date: nextWeek.toISOString().split('T')[0], done: false }
    ];

    // 一次性写入
    try {
      wx.setStorageSync('clients', demoClients);
      wx.setStorageSync('houses', demoHouses);
      wx.setStorageSync('followRecords', demoRecords);
      wx.setStorageSync('reminders', demoReminders);
      wx.setStorageSync('_demoLoaded', true);
    } catch (e) {
      console.error('初始化数据失败', e);
    }
  }
});
