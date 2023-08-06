const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

var chessPieceSample;
loadSample('audio/chess_move.wav').then(sample => chessPieceSample = sample);

function playChessPieceSound() {
	playRandomPitchSample(chessPieceSample, 0.5, 0.5);
}

var pieceTakesSample;
loadSample('audio/chess_takes_move.wav').then(sample => pieceTakesSample = sample);

function playPieceTakesSound() {
	playRandomPitchSample(pieceTakesSample, 1, 0);
}

var startSample;
loadSample('audio/game_start.wav').then(sample => startSample = sample);

function playStartSound() {
	playSample(startSample);
}

var endSample;
loadSample('audio/game_end.wav').then(sample => endSample = sample);

function playEndSound() {
	playSample(endSample);
}

function loadSample(url) {
  return fetch(url)
    .then(response => response.arrayBuffer())
    .then(buffer => context.decodeAudioData(buffer));
}

function playRandomPitchSample(sample, randFactor, adder) {
	const source = context.createBufferSource();
	source.buffer = sample;
	source.playbackRate.value = 1 + adder + (randFactor * Math.random());
	source.connect(context.destination);
	source.start(0);
}

function playSample(sample) {
	const source = context.createBufferSource();
	source.buffer = sample;
	source.connect(context.destination);
	source.start(0);
}