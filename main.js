var EventCenter = {
  on: function(type, handler) {
    $(document).on(type, handler);
  },
  fire: function(type, data) {
    $(document).trigger(type, data);
  }
};

// EventCenter.on('hello', function(e, data){
//   console.log(data)
// })
// EventCenter.fire('hello', 'world')

var Footer = {
  init: function() {
    this.$footer = $("footer");
    this.$ul = this.$footer.find(".box ul");
    this.$box = this.$footer.find(".box");
    this.$leftBtn = this.$footer.find(".icon-left");
    this.$rightBtn = this.$footer.find(".icon-right");
    this.toEnd = false;
    this.toStart = true;
    this.isAnimate = false;
    this.bind();
    this.render();
  },
  bind: function() {
    var _this = this;
    var itemWidth = _this.$box.find("li").outerWidth(true);
    var rowCount = Math.floor(_this.$box.width() / itemWidth);
    this.$rightBtn.on("click", function() {
      if (_this.isAnimate) return;
      if (!_this.toEnd) {
        _this.isAnimate = true;
        _this.$ul.animate(
          {
            left: "-=" + itemWidth * rowCount
          },
          400,
          function() {
            _this.isAnimate = false;
            _this.toStart = false;
            if (
              parseFloat(
                _this.$box.width() - parseFloat(_this.$ul.css("left"))
              ) >= parseFloat(_this.$ul.css("width"))
            ) {
              _this.toEnd = true;
              _this.$rightBtn.addClass("disabled");
            }
          }
        );
      }
    });

    this.$leftBtn.on("click", function() {
      if (_this.isAnimate) return;
      if (!_this.toStart) {
        _this.isAnimate = true;
        _this.$ul.animate(
          {
            left: "+=" + itemWidth * rowCount
          },
          400,
          function() {
            _this.isAnimate = false;
            _this.toEnd = false;
            if (parseFloat(_this.$ul.css("left")) >= 0) {
              _this.toStart = true;
              _this.$leftBtn.addClass("disabled");
            }
          }
        );
      }
    });

    this.$footer.on("click", "li", function() {
      $(this)
        .addClass("active")
        .siblings()
        .removeClass("active");
      EventCenter.fire("selector-album", {
        channelId: $(this).attr("data-channel-id"),
        channelName: $(this).attr("data-channel-name")
      });
    });
  },
  render: function() {
    var _this = this;
    $.getJSON("//jirenguapi.applinzi.com/fm/getChannels.php")
      .done(function(ret) {
        // console.log(ret.channels)
        _this.renderFooter(ret.channels);
      })
      .fail(function() {
        console.log("error");
      });
  },
  renderFooter: function(channels) {
    var _this = this;
    var html = "";
    channels.unshift({
      channel_id: 0,
      name: "我的最爱",
      cover_small: "http://cloud.hunger-valley.com/17-10-24/1906806.jpg-small",
      cover_middle:
        "http://cloud.hunger-valley.com/17-10-24/1906806.jpg-middle",
      cover_big: "http://cloud.hunger-valley.com/17-10-24/1906806.jpg-big"
    });
    channels.forEach(function(channel) {
      html +=
        "<li data-channel-id=" +
        channel.channel_id +
        " data-channel-name=" +
        channel.name +
        ">" +
        '<div class="cover" style="background-image:url(' +
        channel.cover_small +
        ')">' +
        "</div>" +
        "<h3>" +
        channel.name +
        "</h3>" +
        "</li>";
      _this.$ul.html(html);
      _this.setStyle();
    });
  },
  setStyle: function() {
    var count = this.$ul.find("li").length;
    var width = this.$ul.find("li").outerWidth(true);
    this.$ul.css({
      width: count * width + "px"
    });
  }
};

var Fm = {
  init: function() {
    this.channelId = 'public_shiguang_80hou'
    this.channelName = '80后'
    this.$container = $("#page-music .layout");
    this.audio = new Audio();
    this.audio.autoplay = true;
    this.currentSong = null;
    this.collections = this.loadFormLocal();
    this.bind();
    this.playInit();
  },
  playInit: function() {
    if (this.collections.length > 0) {
      EventCenter.fire("selector-album", {
        channelId: "0",
        channelName: "我的最爱"
      });
    } else {
      this.loadMusic();
    }
  },
  bind: function() {
    var _this = this;
    EventCenter.on("selector-album", function(e, channelObj) {
      _this.channelId = channelObj.channelId;
      _this.channelName = channelObj.channelName;
      _this.loadMusic();
    });

    this.$container.find(".btn-play").on("click", function() {
      var $btn = $(this);
      if ($btn.hasClass("icon-play")) {
        $btn.removeClass("icon-play").addClass("icon-pause");
        _this.audio.play();
      } else {
        $btn.removeClass("icon-pause").addClass("icon-play");
        _this.audio.pause();
      }
    });

    this.$container.find(".btn-next").on("click", function() {
      _this.loadMusic();
    });

    this.audio.addEventListener("play", function() {
      clearInterval(_this.statusClock);
      _this.statusClock = setInterval(function() {
        _this.updaStatus();
      }, 1000);
    });

    this.audio.addEventListener("pause", function() {
      clearInterval(_this.statusClock);
    });

    this.$container.find(".btn-collect").on("click", function() {
      var $btn = $(this);
      if ($btn.hasClass("active")) {
        $btn.removeClass("active");
        delete _this.collections[_this.currentSong.sid];
      } else {
        $(this).addClass("active");
        _this.collections[_this.currentSong.sid] = _this.currentSong;
      }
      _this.saveTolocal();
    });
  },
  loadMusic: function() {
    var _this = this;
    if (_this.channelId === "0") {
      _this.loadCollection();
    } else {
      $.getJSON("//jirenguapi.applinzi.com/fm/getSong.php", {
        channel: this.channelId
      }).done(function(ret) {
        _this.song = ret.song[0];
        _this.setMusic(ret.song[0] || null);
        _this.loadLyric();
      });
    }
  },
  loadLyric() {
    var _this = this;
    $.getJSON("//jirenguapi.applinzi.com/fm/getLyric.php", {
      sid: this.song.sid
    }).done(function(ret) {
      var lyric = ret.lyric;
      var lyricObj = {};
      lyric.split("\n").forEach(function(line) {
        var times = line.match(/\d{2}:\d{2}/g);
        var str = line.replace(/\[.+?\]/g, "");
        if (Array.isArray(times)) {
          times.forEach(function(time) {
            lyricObj[time] = str;
          });
        }
      });
      _this.lyricObj = lyricObj;
    });
  },
  setMusic: function(song) {
    var _this = this;
    _this.currentSong = song;
    $(".bg").css("background", "url(" + this.currentSong.picture + ")");
    _this.audio.src = this.currentSong.url;
    _this.$container
      .find(".aside figure")
      .css("background-image", "url(" + this.currentSong.picture + ")");
    _this.$container.find(".detail h1").text(this.currentSong.title);
    _this.$container.find(".detail .author").text(this.currentSong.artist);
    _this.$container.find(".detail .tag").text(this.channelName);
    _this.$container
      .find(".btn-play")
      .removeClass("icon-play")
      .addClass("icon-pause");

    if (_this.collections[song.sid]) {
      _this.$container.find(".btn-collect").addClass("active");
    } else {
      _this.$container.find(".btn-collect").removeClass("active");
    }
  },
  updaStatus: function() {
    var min = Math.floor(this.audio.currentTime / 60);
    var second = Math.floor(this.audio.currentTime % 60) + "";
    second = second.length === 2 ? second : "0" + second;
    this.$container.find(".current-time").text(min + ":" + second);
    var progressWidth =
      (this.audio.currentTime / this.audio.duration) * 100 + "%";
    this.$container.find(".bar-progress").css("width", progressWidth);
    if (this.lyricObj !== undefined) {
      var line = this.lyricObj["0" + min + ":" + second];
    }
    if (line) {
      this.$container
        .find(".lyric p")
        .text(line)
        .boomText();
    }
  },
  loadFormLocal: function() {
    return JSON.parse(localStorage["collections"] || "{}");
  },
  saveTolocal: function() {
    localStorage["collections"] = JSON.stringify(this.collections);
  },
  loadCollection: function() {
    var keyArray = Object.keys(this.collections);
    if (keyArray.length === 0) return;
    var randomIndex = Math.floor(Math.random() * keyArray.length);
    var randomSid = keyArray[randomIndex];
    this.setMusic(this.collections[randomSid]);
  }
};

$.fn.boomText = function(type) {
  type = type || "fadeIn";
  this.html(function() {
    var arr = $(this)
      .text()
      .split("")
      .map(function(word) {
        return '<span class="boomText">' + word + "</span>";
      });
    return arr.join("");
  });

  var index = 0;
  var $boomTexts = $(this).find("span");
  var clock = setInterval(function() {
    $boomTexts.eq(index).addClass("animated " + type);
    index++;
    if (index >= $boomTexts.length) {
      clearInterval(clock);
    }
  }, 300);
};

Footer.init();
Fm.init();
