var EventCenter = {
  on: function (type, handler) {
    $(document).on(type, handler)
  },
  fire: function (type, data) {
    $(document).trigger(type, data)
  }
}

// EventCenter.on('hello', function(e, data){
//   console.log(data)
// })
// EventCenter.fire('hello', 'world')

var Footer = {
  init: function () {
    this.$footer = $('footer')
    this.$ul = this.$footer.find('.box ul')
    this.$box = this.$footer.find('.box')
    this.$leftBtn = this.$footer.find('.icon-left')
    this.$rightBtn = this.$footer.find('.icon-right')
    this.toEnd = false
    this.toStart = true
    this.isAnimate = false
    this.bind()
    this.render()
  },
  bind: function () {
    var _this = this
    var itemWidth = _this.$box.find('li').outerWidth(true)
    var rowCount = Math.floor(_this.$box.width() / itemWidth)
    this.$rightBtn.on('click', function () {
      if (_this.isAnimate) return
      if (!_this.toEnd) {
        _this.isAnimate = true
        _this.$ul.animate({
          left: '-=' + itemWidth * rowCount
        }, 400, function () {
          _this.isAnimate = false
          _this.toStart = false
          if (parseFloat(_this.$box.width() - parseFloat(_this.$ul.css('left'))) >= parseFloat(_this.$ul.css('width'))) {
            _this.toEnd = true
            _this.$rightBtn.addClass('disabled')
          }
        })
      }
    })

    this.$leftBtn.on('click', function () {
      if (_this.isAnimate) return
      if (!_this.toStart) {
        _this.isAnimate = true
        _this.$ul.animate({
          left: '+=' + itemWidth * rowCount
        }, 400, function () {
          _this.isAnimate = false
          _this.toEnd = false
          if (parseFloat(_this.$ul.css('left')) >= 0) {
            _this.toStart = true
            _this.$leftBtn.addClass('disabled')
          }
        })
      }
    })

    this.$footer.on('click', 'li', function () {
      $(this).addClass('active').siblings().removeClass('active')
      EventCenter.fire('selector-album', {
        channelId: $(this).attr('data-channel-id'),
        channelName: $(this).attr('data-channel-name')
      })
    })
  },
  render: function () {
    var _this = this
    $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')
      .done(function (ret) {
        // console.log(ret.channels)
        _this.renderFooter(ret.channels)
      }).fail(function () {
        console.log('error')
      })
  },
  renderFooter: function (channels) {
    var _this = this
    var html = ''
    channels.forEach(function (channel) {
      html += '<li data-channel-id=' + channel.channel_id + ' data-channel-name=' + channel.name + '>' +
        '<div class="cover" style="background-image:url(' + channel.cover_small + ')">' +
        '</div>' +
        '<h3>' + channel.name + '</h3>' +
        '</li>'
      _this.$ul.html(html)
      _this.setStyle()
    })
  },
  setStyle: function () {
    var count = this.$ul.find('li').length
    var width = this.$ul.find('li').outerWidth(true)
    this.$ul.css({
      width: count * width + 'px'
    })
  }
}

var Fm = {
  init: function () {
    this.$container = $('#page-music .layout')
    this.audio = new Audio()
    this.audio.autoplay = true
    this.bind()
  },
  bind: function () {
    var _this = this
    EventCenter.on('selector-album', function (e, channelObj) {
      _this.channelId = channelObj.channelId
      _this.channelName = channelObj.channelName
      _this.loadMusic()
    })

    this.$container.find('.btn-play').on('click', function () {
      var $btn = $(this)
      if ($btn.hasClass('icon-play')) {
        $btn.removeClass('icon-play').addClass('icon-pause')
        _this.audio.play()
      } else {
        $btn.removeClass('icon-pause').addClass('icon-play')
        _this.audio.pause()
      }
    })

    this.$container.find('.btn-next').on('click', function () {
      _this.loadMusic()
    })

    this.audio.addEventListener('play', function () {
      clearInterval(_this.statusClock)
      _this.statusClock = setInterval(function () {
        _this.updaStatus()
      }, 1000)
    })

    this.audio.addEventListener('pause', function () {
      clearInterval(_this.statusClock)
    })
  },
  loadMusic: function () {
    var _this = this
    $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php', {
        channel: this.channelId
      })
      .done(function (ret) {
        _this.song = ret.song[0]
        // console.log(_this.song)
        _this.setMusic()
        _this.loadLyric()
      })
  },
  loadLyric() {
    var _this = this
    $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php', {
        sid: this.song.sid
      })
      .done(function (ret) {
        var lyric = ret.lyric
        var lyricObj = {}
        lyric.split('\n').forEach(function (line) {
          var times = line.match(/\d{2}:\d{2}/g)
          var str = line.replace(/\[.+?\]/g, '')
          if (Array.isArray(times)) {
            times.forEach(function (time) {
              lyricObj[time] = str
            })
          }
        })
        _this.lyricObj = lyricObj
      })
  },
  setMusic: function () {
    var _this = this
    $('.bg').css('background', 'url(' + this.song.picture + ')')
    _this.audio.src = this.song.url
    _this.$container.find('.aside figure').css('background-image', 'url(' + this.song.picture + ')')
    _this.$container.find('.detail h1').text(this.song.title)
    _this.$container.find('.detail .author').text(this.song.artist)
    _this.$container.find('.detail .tag').text(this.channelName)
    _this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause')
  },
  updaStatus: function () {
    var min = Math.floor(this.audio.currentTime / 60)
    var second = Math.floor(this.audio.currentTime % 60) + ''
    second = second.length === 2 ? second : '0' + second
    this.$container.find('.current-time').text(min + ':' + second)
    var progressWidth = this.audio.currentTime / this.audio.duration * 100 + '%'
    this.$container.find('.bar-progress').css('width', progressWidth)

    var line = this.lyricObj['0' + min + ':' + second]
    if (line) {
      this.$container.find('.lyric p').text(line).boomText()
    }
  }
}

$.fn.boomText = function (type) {
  type = type || 'fadeIn'
  this.html(function () {
    var arr = $(this).text()
      .split('').map(function (word) {
        return '<span class="boomText">' + word + '</span>'
      })
    return arr.join('')
  })

  var index = 0
  var $boomTexts = $(this).find('span')
  var clock = setInterval(function () {
    $boomTexts.eq(index).addClass('animated ' + type)
    index++
    if (index >= $boomTexts.length) {
      clearInterval(clock)
    }
  }, 300)
}

Footer.init()
Fm.init()