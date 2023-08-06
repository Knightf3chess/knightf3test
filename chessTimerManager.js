class ChessTimerManager {
	whiteTimer;
	blackTimer;

	constructor(minutes, increment) {
		this.whiteTimer = new ChessTimer("#white-timer", minutes, increment); 
		this.blackTimer = new ChessTimer("#black-timer", minutes, increment); 
		this.drawTimers();
	}

	startTimer(color, increment=true) {
		if(color == "w") {
			this.whiteTimer.startTimer();
			this.blackTimer.pauseTimer();
			if(increment)
				this.blackTimer.incrementTimer();
		}
		else {
			this.blackTimer.startTimer();
			this.whiteTimer.pauseTimer();
			if(increment)
				this.whiteTimer.incrementTimer();
		}
		this.drawTimers();
	}

	drawTimers() {
		this.whiteTimer.drawTimer();
		this.blackTimer.drawTimer();
	}
}