class ChessTimer {
	selector;
	minutes;
	seconds;
	increment;
	timer;
	ended;
	
	constructor(selector, minutes, increment) {
	    this.selector = selector;
		this.minutes = minutes;
		this.seconds = 0;
		this.increment = increment;
		this.timer = null;
		this.ended = false;
	}

	startTimer() {
		var self = this;
		this.timer = setInterval(function(){self.decrementTimer();}, 1000);
	}

	pauseTimer() {
		clearInterval(this.timer);
	}

	timerEnd() {
		this.pauseTimer();
		this.ended = true;
		boardEndTimer(this.selector);
	}

	decrementTimer() {
		this.seconds--;
		if(this.seconds < 0) {
			this.minutes--;
			this.seconds = 59;
		}
		if(this.minutes == 0 && this.seconds == 0) {
			this.timerEnd();
		}
		this.drawTimer();
	}

	getTimerText() {
		return this.minutes + ":" + this.seconds.toString().padStart(2, "0");
	}

	drawTimer() {
		$(this.selector).text(this.getTimerText());
	}

	incrementTimer() {
		this.seconds += parseInt(this.increment);
		while(this.seconds >= 60) {
			this.seconds -= 60;
			this.minutes++;
		}
	}
}