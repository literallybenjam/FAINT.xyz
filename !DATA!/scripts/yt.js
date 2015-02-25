/* jslint asi:true, browser:true */
/* global YT */

var yt = {
    frames: null,
    init: null,
    processScroll: null
}

function onYouTubeIframeAPIReady() {
    var i;
    yt.frames = document.querySelectorAll('iframe[src*="//youtube.com/embed/"], iframe[src*="//www.youtube.com/embed/"]');
    for (i = 0; i < yt.frames.length; i++) {
        yt.frames.item(i).yt_player = new YT.Player(yt.frames.item(i));
        yt.frames.item(i).addEventListener("scrolledTo", yt.processScroll, false);
    }
}

yt.processScroll = function(e) {
    console.log(e);
    if (!e.detail || !e.detail.source) return;
    var start = 0;
    var end = 0;
    if (Number(e.detail.source.dataset.ytStart)) start = Number(e.detail.source.dataset.ytStart);
    if (Number(e.detail.source.dataset.ytEnd)) end = Number(e.detail.source.dataset.ytEnd);
    if (start < end) this.yt_player.loadVideoById({videoId: this.yt_player.getVideoData().video_id, startSeconds: start, endSeconds: end});
    else this.yt_player.loadVideoById({videoId: this.yt_player.getVideoData().video_id, startSeconds: start});
}

yt.init = function() {
    var tag = document.createElement('script');
    tag.src = "//www.youtube.com/iframe_api";
    document.head.insertBefore(tag, document.head.firstElementChild);
}

document.addEventListener("DOMContentLoaded", yt.init, false);
