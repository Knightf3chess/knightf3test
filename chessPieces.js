Array.prototype.atPos = function(pos) {
	if(pos.y < 0 || pos.y > 7 || pos.x < 0 || pos.x > 7)
		return "edge";
	
	return this[pos.y][pos.x];
}; 

class ChessPiece {
	image;
	color;
	opposingColor;
	moved;
	
	constructor(image, color) {
		this.image = image;
		this.color = (color == "w" ? "w" : "b");
		this.opposingColor = (color == "w" ? "b" : "w");
		this.moved = false;
	}

	getPiece() {
		return "<img class='draggable no-select' src='" + this.image + "'>";
	}
	
	getIcon() {
		return "<img style='width: 20px;' src='" + this.image + "'>";
	}
}

class Pawn extends ChessPiece {
	colorMultiplier;
	
	constructor(color) {
		if(color == "b") {
			super("/images/bpawn.png", color);
			this.colorMultiplier = 1;
		}
		else {
			super("/images/wpawn.png", color);
			this.colorMultiplier = -1;
		}
	}

	getAvailable(pos, board, onlyCapturing=false) {
		var availablePos = [];
		let firstSquare = {"x":pos.x, "y":pos.y + this.colorMultiplier};
		let secondSquare = {"x":pos.x, "y":pos.y + (this.colorMultiplier * 2)};
		let firstDiag = {"x":pos.x + 1, "y":pos.y + this.colorMultiplier};
		let secondDiag = {"x":pos.x - 1, "y":pos.y + this.colorMultiplier};
		
		if(!onlyCapturing) {
			//if square has no piece in front
			if(board.atPos(firstSquare) == null) { 
				availablePos.push(firstSquare);
	
				//if square has no piece two squares ahead and it is in the correct row
				if((this.colorMultiplier == 1 && pos.y == 1
				  || this.colorMultiplier == -1 && pos.y == 6)
				  && board.atPos(secondSquare) == null) {
					availablePos.push(secondSquare);
				}
			}
		}

		if(board.atPos(firstDiag) == this.opposingColor) {
			availablePos.push(firstDiag);
		}

		if(board.atPos(secondDiag) == this.opposingColor) {
			availablePos.push(secondDiag);
		}
		
		return availablePos;
	}

}

class Bishop extends ChessPiece {
	
	constructor(color) {
		super("/images/"+ color +"bishop.png", color);
	}

	getAvailable(pos, board) {
		var availablePos = [];
		let directionMultiplier = [
			{"x":  1, "y":  1},
			{"x":  1, "y": -1},
			{"x": -1, "y": -1},
			{"x": -1, "y":  1},
		];

		for(let d = 0; d < directionMultiplier.length; d++) {
			for(let i = 1; i < board.length; i++) {
				let checkPos = {"x": pos.x + (i * directionMultiplier[d].x), "y": pos.y + (i * directionMultiplier[d].y)}
				let atPos = board.atPos(checkPos);
				
				//if at the end or its own color then stop searching
				if(atPos == this.color || atPos == "edge") {
					break;
				}
	
				availablePos.push(checkPos);
	
				//if opposing piece, add to available then stop searching this diagonal
				if(atPos == this.opposingColor) {
					break;
				}
			}
		}
		return availablePos;
	}

}

class Rook extends ChessPiece {
	
	constructor(color) {
		super("/images/"+ color +"rook.png", color);
	}

	getAvailable(pos, board) {
		var availablePos = [];
		let directionMultiplier = [
			{"x":  1, "y":  0},
			{"x":  0, "y": -1},
			{"x": -1, "y": 0},
			{"x": 0, "y":  1},
		];

		for(let d = 0; d < directionMultiplier.length; d++) {
			for(let i = 1; i < board.length; i++) {
				let checkPos = {"x": pos.x + (i * directionMultiplier[d].x), "y": pos.y + (i * directionMultiplier[d].y)}
				let atPos = board.atPos(checkPos);

				//if at the end or its own color then stop searching
				if(atPos == this.color || atPos == "edge") {
					break;
				}
	
				availablePos.push(checkPos);
	
				//if opposing piece, add to available then stop searching this diagonal
				if(atPos == this.opposingColor) {
					break;
				}
			}
		}
		return availablePos;
	}

}

class Queen extends ChessPiece {
	
	constructor(color) {
		super("/images/"+ color +"queen.png", color);
	}

	getAvailable(pos, board) {
		var availablePos = [];
		
		let testBishop = new Bishop(this.color);
		let testRook = new Rook(this.color);
		availablePos = testBishop.getAvailable(pos, board).concat(testRook.getAvailable(pos, board));
		return availablePos;
	}

}

class Knight extends ChessPiece {
	
	constructor(color) {
		super("/images/"+ color +"knight.png", color);
	}

	getAvailable(pos, board) {
		var availablePos = [];
		
		let directionMultiplier = [
			{"x":  2, "y": -1},
			{"x":  2, "y":  1},
			{"x": -2, "y": -1},
			{"x": -2, "y":  1},
			{"x":  1, "y": -2},
			{"x":  1, "y":  2},
			{"x": -1, "y": -2},
			{"x": -1, "y":  2}
		];

		for(let d = 0; d < directionMultiplier.length; d++) {
			let checkPos = {"x": pos.x + directionMultiplier[d].x, "y": pos.y + directionMultiplier[d].y}
			let atPos = board.atPos(checkPos);

			if(atPos == this.opposingColor || atPos == null) {
				availablePos.push(checkPos);
			}
		}
		
		return availablePos;
	}

}

class King extends ChessPiece {
	
	constructor(color) {
		super("/images/"+ color +"king.png", color);
	}

	getAvailable(pos, board) {
		var availablePos = [];
		
		let directionMultiplier = [
			{"x":  0, "y": -1},
			{"x":  0, "y":  1},
			{"x":  1, "y": -1},
			{"x":  1, "y":  1},
			{"x":  1, "y":  0},
			{"x": -1, "y":  1},
			{"x": -1, "y": -1},
			{"x": -1, "y":  0}
		];

		for(let d = 0; d < directionMultiplier.length; d++) {
			let checkPos = {"x": pos.x + directionMultiplier[d].x, "y": pos.y + directionMultiplier[d].y}
			let atPos = board.atPos(checkPos);

			if(atPos == this.opposingColor || atPos == null) {
				availablePos.push(checkPos);
			}
		}
		
		return availablePos;
	}

}

class InvisiPawn {

	color;
	
	constructor(color) {
		this.color = color;
	}

	getAvailable(pos, board) {
		return [];
	}

	getPiece() {
		return "";
	}

}