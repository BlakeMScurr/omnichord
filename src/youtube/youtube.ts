interface ytplayer {
    stopVideo():any
    playVideo():any
    getCurrentTime():any
}

interface Window {
    player?: ytplayer;
}

export class Player {
    underlying: ytplayer;
    constructor() {

        var w: Window = <Window>window;
        var player: any = <ytplayer>w.player;
        this.underlying = player
    }

    stopVideo() {
        this.underlying.stopVideo()
    }

    playVideo() {
        this.underlying.playVideo()
    }

    getCurrentTime() {
        if (this.underlying != undefined) {
            return this.underlying.getCurrentTime()
        }
    }
}

export function GetPlayer() {
    return new Player();
}