const app = getApp();

const defaultSessionConfig = {
  groupTime: 20,
  breakTime: 20,
  groups: 4,
};

const innerAudioContext = wx.createInnerAudioContext()
innerAudioContext.autoplay = false;
innerAudioContext.src = 'audio/clock.mp3';

Page({
  data: {
    canIuseFeedback: wx.canIUse('button.open-type.feedback'),
    groupTimeOptions: [
      {'value': 15, 'isSelected': false},
      {'value': 20, 'isSelected': true},
      {'value': 30, 'isSelected': false},
      {'value': 60, 'isSelected': false},
      {'value': 90, 'isSelected': false},
      {'value': 120, 'isSelected': false},
    ],
    totalGroupOptions: [
      {'value': 1, 'isSelected': false},
      {'value': 2, 'isSelected': false},
      {'value': 4, 'isSelected': true},
      {'value': 8, 'isSelected': false},
    ],
    breakTimeOptions: [
      {'value': 5, 'isSelected': false},
      {'value': 10, 'isSelected': false},
      {'value': 20, 'isSelected': true},
      {'value': 30, 'isSelected': false},
      {'value': 60, 'isSelected': false},
    ],
    userSessionConfg: defaultSessionConfig,
    isSessionStarted: false,
    groupTime: defaultSessionConfig.groupTime,
    breakTime: defaultSessionConfig.breakTime,
    groups: 1,
    timerNumber: 0,
    isInBreak: false,
    timer: null
  },
  onLoad: function () {
    wx.showShareMenu({
      withShareTicket: true
    })
  },
  selectGroupTime: function (event) {
    let selectedItem = event.currentTarget.dataset.item;
    this.setData({
      userSessionConfg: {
        ...this.data.userSessionConfg,
        groupTime: selectedItem.value,
      }
    })
  },
  selectTotalGroup: function (event) {
    let selectedItem = event.currentTarget.dataset.item;
    this.setData({
      userSessionConfg: {
        ...this.data.userSessionConfg,
        groups: selectedItem.value,
      }
    })
  },
  selectBreakTime: function (event) {
    let selectedItem = event.currentTarget.dataset.item;
    this.setData({
      userSessionConfg: {
        ...this.data.userSessionConfg,
        breakTime: selectedItem.value,
      }
    })
  },
  startSession: function () {
    this.setData({
      isSessionStarted: true,
    });
    this.resetTimer();
    this.data.timer = this.startCountdown();
    this.queryRecordOfToday()
    wx.setKeepScreenOn({
      keepScreenOn: true
    })
  },
  endSession: function () {
    this.setData({
      isSessionStarted: false,
    });
    innerAudioContext.stop();
    this.resetTimer();
    clearInterval(this.data.timer);
    wx.setKeepScreenOn({
      keepScreenOn: false
    })
  },
  resetTimer: function () {
    this.setData({
      ...this.data.userSessionConfg,
      groups: 1,
      timerNumber: 0,
      isInBreak: false
    });
  },
  startCountdown: function () {
    var self = this;
    var number = this.data.groupTime;
    var counter = setInterval(function () {
      self.setData({
        timerNumber: number,
      })

      if (number === 0) {
        if (self.data.groups === self.data.userSessionConfg.groups && self.data.isInBreak === false) {
          clearInterval(counter);
        }

        innerAudioContext.stop();
        self.setData({
          isInBreak: !self.data.isInBreak,
          groups: self.data.isInBreak
            ? self.data.groups + 1
            : self.data.groups
        })

        number = self.data.isInBreak
          ? self.data.breakTime
          : self.data.groupTime;
      } else {
        if (number === 5) {
          innerAudioContext.play();
        }
        number--;
      }
    }, 1000);

    return counter;
  },
  addRecord() {
    const db = wx.cloud.database()
    db.collection('counters').add({
      data: {
        count: 1,
        date: new Date().toISOString().substring(0, 10)
      },
      success: res => {
        // 在返回结果中会包含新创建的记录的 _id
        console.log('[数据库] [新增记录] 成功，记录 _id: ', res._id)
      },
      fail: err => {
        console.error('[数据库] [新增记录] 失败：', err)
      }
    })
  },
  queryRecordOfToday() {
    const db = wx.cloud.database()
    // 查询当前用户是否有当日记录
    db.collection('counters').where({
      _openid: this.data.openid,
      date: new Date().toISOString().substring(0, 10)
    }).get({
      success: res => {
        console.log('[数据库] [查询记录] 成功: ', res.data)
        if (res.data.length === 0) {
          this.addRecord()
        }
      },
      fail: err => {
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },
  goToRecordsPage() {
    wx.navigateTo({
      url: '../records/records'
    })
  }
})
