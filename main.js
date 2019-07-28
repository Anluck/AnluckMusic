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
    this.bind()
    this.render()
  },
  bind: function () {
    var _this = this
    var itemWidth = _this.$box.find('li').outerWidth(true)
    var rowCount = Math.floor(_this.$box.width() / itemWidth)
    this.$rightBtn.on('click', function () {
      if (!_this.toEnd) {
        _this.$ul.animate({
          left: '-=' + itemWidth * rowCount
        }, 400, function () {
          _this.toStart = false
          if (parseFloat(_this.$box.width() - parseFloat(_this.$ul.css('left'))) >= parseFloat(_this.$ul.css('width'))) {
            _this.toEnd = true
            _this.$rightBtn.addClass('disabled')
          }
        })
      }
    })

    this.$leftBtn.on('click', function () {
      if (!_this.toStart) {
        _this.$ul.animate({
          left: '+=' + itemWidth * rowCount
        }, 400, function () {
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
      EventCenter.fire('selector-album', $(this).attr('data-channel-id'))
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
      html += '<li data-channel-id=' + channel.channel_id + '>' +
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
    this.bind()
  },
  bind: function () {
    EventCenter.on('selector-album', function (e, data) {
      console.log(data)
    })
  }
}

Footer.init()
Fm.init()