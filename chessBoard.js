/* 
TODO: 
takebacks, request draws and resigns
handle draws:
	50 move rule
	3 repitition rule
	dead position: K v k, K and B v k, K and N vs k, K and B vs K and B of same color
	other variants
*/

class ChessBoard {
	selector;
	size;
	timerManager;
	board;
	turn;
	showingPawnPromotion;
	capturedPieces;
	moves;
	
	constructor(selector, size, minutes, increment) {
	    this.selector = selector;
		this.size = size;
		this.board = this._initBoard();
		this.turn = 0;
		this.showingPawnPromotion = false;
		this.capturedPieces = [];
		this.moves = new MoveTranslator();
		
		if(minutes != undefined && increment != undefined) {
			this.timerManager = new ChessTimerManager(minutes, increment);
			this.timerManager.startTimer("w", false);
			$("#timer-container").show();
		}
		else {
			this.timerManager = null;
		}
	}

	drawBoard() {
		//draws each square of the board. Use when board array is updated
		$(this.selector).empty();
		for(var y = 0; y < 8; y++) {
			for(var x = 0; x < 8; x++) {
				$(this.selector).append(this._getSquare(x, y));
			}
		}
		this.drawCaptured();
		$("#move-container").html(this.moves.getHTML());
		$(".draggable").draggable({
			containment: $("#board"),
			revert: true,
			zIndex: 5000,
		});
	}

	drawCaptured() {
		$("#b-pieces-captured").empty();
		$("#w-pieces-captured").empty();
		let whitePieces = {
			"queens": [],
			"rooks": [],
			"bishops": [],
			"knights": [],
			"pawns": []
		};
		let blackPieces = {
			"queens": [],
			"rooks": [],
			"bishops": [],
			"knights": [],
			"pawns": []
		};
		for(var i = 0; i < this.capturedPieces.length; i++) {
			let piece = this.capturedPieces[i];
			let pieces = (piece.color == "w" ? whitePieces : blackPieces);
			if(piece instanceof Queen) {
				pieces.queens.push(piece);
			} 
			else if(piece instanceof Rook) {
				pieces.rooks.push(piece);
			} 
			else if(piece instanceof Bishop) {
				pieces.bishops.push(piece);
			} 
			else if(piece instanceof Knight) {
				pieces.knights.push(piece);
			} 
			else if(piece instanceof Pawn) {
				pieces.pawns.push(piece);
			} 
		}

		$.each(whitePieces, function(key, pieces) {
			if(pieces.length > 0) {
				$("#w-pieces-captured").append("<div class='captured-box'>" + pieces[0].getIcon() + pieces.length + "</div>");
			}
		});

		$.each(blackPieces, function(key, pieces) {
			if(pieces.length > 0) {
				$("#b-pieces-captured").append("<div class='captured-box'>" + pieces[0].getIcon() + pieces.length + "</div>");
			}
		});
	}

	_getSquare(x, y) {
		//gets the html for a square at position x, y
		var color = 1;
		if(x % 2 != y % 2) {
			color = 2;
		}
		let piece = this.board[y][x];
		let pieceImg = (piece != null ? piece.getPiece() : "");
		return $("<div class='square color" + color + " pos" + x + "-" + y + "' data-x='" + x + "' data-y='" + y + "' style='width: " + this.size + "px; height: " + this.size + "px;'>" + pieceImg + "</div>").droppable({
			drop: dropper
		});
	}

	_initBoard() {
		return [
			[new Rook("b"), new Knight("b"), new Bishop("b"), new Queen("b"), new King("b"), new Bishop("b"), new Knight("b"), new Rook("b")], 
			//[new Rook("b"), null, null, null, new King("b"), null, null, new Rook("b")], 
			[new Pawn("b"), new Pawn("b"), new Pawn("b"), new Pawn("b"), new Pawn("b"), new Pawn("b"), new Pawn("b"), new Pawn("b")], 
			[null, null, null, null, null, null, null, null], 
			[null, null, null, null, null, null, null, null], 
			[null, null, null, null, null, null, null, null], 
			[null, null, null, null, null, null, null, null], 
			[new Pawn("w"), new Pawn("w"), new Pawn("w"), new Pawn("w"), new Pawn("w"), new Pawn("w"), new Pawn("w"), new Pawn("w")],
			[new Rook("w"), new Knight("w"), new Bishop("w"), new Queen("w"), new King("w"), new Bishop("w"), new Knight("w"), new Rook("w")]
			//[new Rook("w"), null, null, null, new King("w"), null, null, new Rook("w")]
		];
	}

	_includesPosInArray(pos, arr) {
		for(var i = 0; i < arr.length; i++) {
			if(arr[i].x == pos.x && arr[i].y == pos.y) {
				return true;
			}
		}
		return false;
	}

	getColorArr(piece) {
		//used for calculating where a piece can go (because a piece can take a piece of the opposite color)
		var charArr = [];
		for(var y = 0; y < 8; y++) {
			charArr.push([]);
			for(var x = 0; x < 8; x++) {
				if(this.board[y][x] == null) {
					charArr[y].push(null);
				}
				else {
					//only apply en passant to pawns
					if(!(piece instanceof Pawn) && this.board[y][x] instanceof InvisiPawn) {
						charArr[y].push(null);
					}
					else {
						charArr[y].push(this.board[y][x].color);
					}
				}
			}
		}
		return charArr;
	}

	isCastleMove(oldPos, newPos) {
		let piece = this.pieceAtPos(oldPos);
		if(!(piece instanceof King)) return false;
		return !(Math.abs(oldPos.x - newPos.x) < 2);
	}

	isTwoSpacePawnMove(from, to) {
		let piece = this.pieceAtPos(from);
		if(!(piece instanceof Pawn)) return false;
		return !(Math.abs(from.y - to.y) < 2);
	}

	isPawnPromotion(pos, turn) {
		let piece = this.pieceAtPos(pos);
		return (piece instanceof Pawn && (turn == "w" ? 0 : 7) == pos.y); //and is in the correct y pos
	}

	showPawnPromotion(from, pos, turn, captured) {
		$("#pawn-promotion").html(	"<img src='images/" + turn + "queen.png' onclick='promotePiece(\"queen\", \""+turn+"\", "+from.x+", "+from.y+", "+pos.x+", "+pos.y+", "+captured+")'>" +
								  	"<img src='images/" + turn + "rook.png' onclick='promotePiece(\"rook\", \""+turn+"\", "+from.x+", "+from.y+", "+pos.x+", "+pos.y+", "+captured+")'>" +
									"<img src='images/" + turn + "bishop.png' onclick='promotePiece(\"bishop\", \""+turn+"\", "+from.x+", "+from.y+", "+pos.x+", "+pos.y+", "+captured+")'>" +
									"<img src='images/" + turn + "knight.png' onclick='promotePiece(\"knight\", \""+turn+"\", "+from.x+", "+from.y+", "+pos.x+", "+pos.y+", "+captured+")'>");
		$("#pawn-promotion").css("display", "flex");
		this.showingPawnPromotion = true;
	}

	getCheckStr() {
		if(this.isCheckmate(this.getTurn(true))) return "checkmate";
		if(this.isCheck(this.getTurn(true))) return "check";
		return "";
	}
	
	movePiece(from, to) {
		this.moves.addMove(from, to, this.pieceAtPos(from), null, false, null, "", this.getAmbiguousness(from, to), "");
		if(this.isCastleMove(from, to)) {
			var multiplier = (from.x - to.x > 0 ? -1 : 1);
			let newKingPos = {"x": from.x + (2 * multiplier), "y": from.y};
			let oldRookPos = {"x": (multiplier == -1 ? 0 : 7), "y": from.y};
			let newRookPos = {"x": newKingPos.x + (multiplier * -1), "y": from.y};
			
			this.board[newKingPos.y][newKingPos.x] = this.board[from.y][from.x];
			this.board[from.y][from.x] = null;
			this.board[newKingPos.y][newKingPos.x].moved = true;

			this.board[newRookPos.y][newRookPos.x] = this.board[oldRookPos.y][oldRookPos.x];
			this.board[oldRookPos.y][oldRookPos.x] = null;
			this.board[newRookPos.y][newRookPos.x].moved = true;

			this.getMostRecentMove().castle = true;
			this.getMostRecentMove().check = this.getCheckStr();
			this.deleteInvisiPawns(this.getTurn(true));
			playChessPieceSound();
			return this.nextTurn();
		}
		//for handling en passante in the next turn
		if(this.isTwoSpacePawnMove(from, to)) {
			let piece = this.pieceAtPos(from);
			let multiplier = (from.y - to.y > 0 ? 1 : -1);
			this.board[to.y + multiplier][to.x] = new InvisiPawn(piece.color);
		}
		//check if capturing
		let capturedPiece = this.pieceAtPos(to);
		if(capturedPiece != null) {
			//check if pawn is an InvisiPawn™ to enforce en passante
			if(this.pieceAtPos(from) instanceof Pawn && capturedPiece instanceof InvisiPawn) {
				let realPawnY = to.y + (capturedPiece.color == "w" ? -1 : 1);
				capturedPiece = this.pieceAtPos({"x": to.x, "y": realPawnY});
				this.board[realPawnY][to.x] = null;
			}
			//add piece to captured array
			this.capturedPieces.push(capturedPiece);
			this.getMostRecentMove().captured = capturedPiece;
			playPieceTakesSound();
		}
		else {
			playChessPieceSound();
		}
		
		this.board[to.y][to.x] = this.board[from.y][from.x];
		this.board[from.y][from.x] = null;
		this.board[to.y][to.x].moved = true;
		if(this.isPawnPromotion(to, this.getTurn())) {
			this.showPawnPromotion(from, to, this.getTurn(), capturedPiece != null ? true : null);
		}
		else {
			return this.nextTurn();
		}
	}

	getAvailableAtPos(pos) {
		let piece = this.board[pos.y][pos.x];
		if(piece == null) {
			return [];
		}
		var available = piece.getAvailable(pos, this.getColorArr(piece));
		if(piece instanceof King) {
			var available = available.concat(this.getCastlingAvailable(pos));
		}
		var availableConsideredCheck = [];
		
		for(var i = 0; i < available.length; i++) {
			let newPos = available[i];
			let replaced = this.board[newPos.y][newPos.x];

			//move piece to that location temporarily
			this.board[newPos.y][newPos.x] = this.board[pos.y][pos.x];
			this.board[pos.y][pos.x] = null;

			//if moving piece would not result in a check, add to list
			if(!this.isCheck(this.getTurn())) {
				availableConsideredCheck.push(newPos);
			}

			//put piece back
			this.board[pos.y][pos.x] = this.board[newPos.y][newPos.x];
			this.board[newPos.y][newPos.x] = replaced;
		}

		return availableConsideredCheck;
	}

	validateMove(oldPos, newPos) {
		//ensure it is the correct players turn and pawn promotion screen is hidden
		if(this.getTurn() != this.pieceAtPos(oldPos).color || this.showingPawnPromotion) {
			return false;
		}

		//if this isn't the most recent move (they are looking at a previous move)
		if(this.moves.currentMove != this.moves.moves.length - 1) {
			return false;
		}

		//get available spaces and ensure the new position is included
		let availableSpaces = this.getAvailableAtPos(oldPos);
		return this._includesPosInArray(newPos, availableSpaces);
	}

	pieceAtPos(pos) {
		return this.board[pos.y][pos.x];
	}

	deleteInvisiPawns(side) {
		for(var y = 0; y < 8; y++) {
			for(var x = 0; x < 8; x++) {
				let checkPos = {"x": x, "y": y};
				if(this.pieceAtPos(checkPos) != null && this.pieceAtPos(checkPos).color == side && this.pieceAtPos(checkPos) instanceof InvisiPawn) {
					this.board[y][x] = null;
				}
			}
		}
	}

	getTurn(nextTurn=false) {
		//nextTurn is to get the opposite (for looking at checks)
		if(!nextTurn)
			return this.turn == 0 ? "w" : "b";
		else 
			return this.turn == 1 ? "w" : "b";
	}

	setTurn(char) {
		this.turn = (char == "w" ? 0 : 1);
	}

	nextTurn() {
		this.turn = (this.turn + 1) % 2;
		this.deleteInvisiPawns(this.getTurn());
		if(this.timerManager != null) {
			this.timerManager.startTimer(this.getTurn());
		}
		return this.isCheckmate(this.getTurn());
	}

	isCheck(side) {
		var enemyMoves = [];
		var kingPos;

		for(var y = 0; y < 8; y++) {
			for(var x = 0; x < 8; x++) {
				let colorArr = this.getColorArr(this.board[y][x]);
				//find all the available spaces for enemy pieces (except pawns non-attacking moves)
				if(this.board[y][x] != null && this.board[y][x].color != side) {
					let checkPos = {"x": x, "y": y};
					enemyMoves = enemyMoves.concat(this.board[y][x].getAvailable(checkPos, colorArr, true));
				}
				//find the kings position
				else if(this.board[y][x] != null && this.board[y][x].color == side && this.board[y][x] instanceof King) {
					kingPos = {"x": x, "y": y};
				}
			}
		}
		//if the king's position is in any of the attacking squares, return true
		return this._includesPosInArray(kingPos, enemyMoves);
	}

	sideHasAvailableMoves(side) {
		for(var y = 0; y < 8; y++) {
			for(var x = 0; x < 8; x++) {
				let checkPos = {"x": x, "y": y};
				if(this.pieceAtPos(checkPos) != null && this.pieceAtPos(checkPos).color == side && this.getAvailableAtPos(checkPos).length > 0) {
					return true;
				}
			}
		}
		return false;
	}

	isCheckmate(side) {
		if(!this.isCheck(side)) {
			return false;
		}

		//if side has no available moves left, they are in checkmate
		return !this.sideHasAvailableMoves(side);
	}

	getKingPos(side) {
		for(var y = 0; y < 8; y++) {
			for(var x = 0; x < 8; x++) {
				if(this.board[y][x] != null && this.board[y][x].color == side && this.board[y][x] instanceof King) {
					return {"x": x, "y": y};
				}
			}
		}
	}

	getUnmovedRooksPos(side) {
		var rooks = [];
		for(var y = 7; y >= 0; y--) {
			for(var x = 7; x >= 0; x--) {
				if(this.board[y][x] != null && this.board[y][x].color == side && this.board[y][x] instanceof Rook && this.board[y][x].moved == false) {
					rooks.push({"x": x, "y": y});
				}
			}
		}
		return rooks;
	}

	getCastleStr() {
		let colors = ["w", "b"];
		var castleStr = "";
		for(let i = 0; i < colors.length; i++) {
			let kingPos = this.getKingPos(colors[i]);
			let king = this.pieceAtPos(kingPos); 
			if(king == null || king.moved) continue;
			
			let unmovedRooks = this.getUnmovedRooksPos(colors[i]);
			for(var x = 0; x < unmovedRooks.length; x++) {
				if(unmovedRooks[x].x == 7) {
					castleStr += (colors[i] == "w" ? "K" : "k");
				}
				if(unmovedRooks[x].x == 0) {
					castleStr += (colors[i] == "w" ? "Q" : "q");
				}
			}
		}
		return (castleStr == "" ? "-" : castleStr);
	}

	getCastlingAvailable(pos) {
		let king = this.pieceAtPos(pos);
		if(king.moved) return [];
		
		let side = king.color; 
		let rooks = this.getUnmovedRooksPos(side);
		
		if(rooks.length == 0) return [];

		if(this.isCheck(side)) return [];

		var castlePositions = [];
		for(var i = 0; i < rooks.length; i++) {
			//check every space between the rook and king
			var moveThroughCheck = false;
			for(var x = Math.min(pos.x, rooks[i].x) + 1; x < Math.max(pos.x, rooks[i].x); x++) {
				let newPos = {"x": x, "y": rooks[i].y};
				let replaced = this.board[newPos.y][newPos.x];

				if(this.pieceAtPos(newPos) != null) {
					moveThroughCheck = true;
				}
				
				//move piece to that location temporarily
				this.board[newPos.y][newPos.x] = this.board[pos.y][pos.x];
				this.board[pos.y][pos.x] = null;
	
				//if moving piece would result in a check, 
				if(this.isCheck(this.getTurn())) {
					moveThroughCheck = true;
				}
	
				//put piece back
				this.board[pos.y][pos.x] = this.board[newPos.y][newPos.x];
				this.board[newPos.y][newPos.x] = replaced;
			}
			
			if(!moveThroughCheck && rooks[i].x == 7) {
				castlePositions.push({"x": pos.x + 2, "y": pos.y});
				castlePositions.push(rooks[i]);
			}
			else if(!moveThroughCheck && rooks[i].x == 0) {
				castlePositions.push({"x": pos.x - 2, "y": pos.y});
				castlePositions.push(rooks[i]);
			}
		}
		return castlePositions;
	}

	getMostRecentMove() {
		if(this.moves.currentMove < 0) return null;
		return this.moves.moves[this.moves.currentMove];
	}

	getAmbiguousness(oldPos, newPos) {
		let piece = this.pieceAtPos(oldPos); 
		let side = piece.color;
		var rankSame = false;
		var fileSame = false;

		for(var y = 0; y < 8; y++) {
			for(var x = 0; x < 8; x++) {
				//skip the piece we are finding ambiguousness for
				if(x == oldPos.x && y == oldPos.y) continue;
				
				let checkPos = {"x": x, "y": y};
				let checkPiece = this.pieceAtPos(checkPos);
				//check if piece is same type as original piece
				if(checkPiece != null && checkPiece.color == side && checkPiece.constructor === piece.constructor) {
					//if piece has new pos as an available position, set return ambiguous accordingly.
					let available = this.getAvailableAtPos(checkPos);
					if(this._includesPosInArray(newPos, available)) {
						if(oldPos.y == checkPos.y) {
							fileSame = true;
						}
						if(oldPos.x == checkPos.x) {
							rankSame = true;
						}
					}
					
				}
			}
		}
		return (fileSame ? "f" : "") + (rankSame ? "r" : "");
	}

	getPieceStr(piece) {
		if(piece instanceof Pawn) {
			return "P";
		}
		else if(piece instanceof Knight) {
			return "N";
		} 
		else if(piece instanceof Bishop) {
			return "B";
		} 
		else if(piece instanceof Rook) {
			return "R";
		} 
		else if(piece instanceof Queen) {
			return "Q";
		} 
		else if(piece instanceof King) {
			return "K";
		} 
	}

	createPieceFromStr(char) {
		let color = (char == char.toUpperCase() ? "w" : "b");
		char = char.toUpperCase();
		
		if(char == "P") {
			return new Pawn(color);
		}
		else if(char == "N") {
			return new Knight(color);
		}
		else if(char == "B") {
			return new Bishop(color);
		}
		else if(char == "R") {
			return new Rook(color);
		}
		else if(char == "Q") {
			return new Queen(color);
		}
		else if(char == "K") {
			return new King(color);
		}
	}

	getFEN() {
		var fenStr = "";
		var spaces = 0;
		var invisiPawnPos = null;
		for(var y = 0; y < 8; y++) {
			for(var x = 0; x < 8; x++) {
				let piece = this.board[y][x];
				if(piece != null && !(piece instanceof InvisiPawn)) {
					if(spaces > 0) {
						fenStr += spaces;
						spaces = 0;
					}
					let pieceChar = this.getPieceStr(piece);
					fenStr += (piece.color == "b" ? pieceChar.toLowerCase() : pieceChar);
				}
				else {
					if(piece != null && piece instanceof InvisiPawn) {
						invisiPawnPos = {"x": x, "y": y};
					}
					spaces++;
				}
			}
			if(spaces > 0) {
				fenStr += spaces;
				spaces = 0;
			}
			if(y != 7) {
				fenStr += "/"; 
			}
		}

		fenStr += " " + this.getTurn();
		fenStr += " " + this.getCastleStr();
		fenStr += " " + (invisiPawnPos == null ? "-" : columns[invisiPawnPos.x] + (8 - invisiPawnPos.y));
		fenStr += " " + this.moves.getHalfmoveClock();
		fenStr += " " + this.moves.getFullMovesCount();
		return fenStr;
	}

	setFromFEN(fen) {
		let colorIndex = fen.indexOf(" ") + 1;
		let castleIndex = fen.indexOf(" ", colorIndex + 1) + 1;
		let enPassantIndex = fen.indexOf(" ", castleIndex + 1) + 1;
		let halfmoveClockIndex = fen.indexOf(" ", castleIndex + 1) + 1;
		let wholeMovesIndex = fen.indexOf(" ", halfmoveClockIndex + 1) + 1;

		let pieces = fen.substr(0, colorIndex - 1);
		let color = fen.substr(colorIndex, castleIndex - colorIndex - 1);
		let castle = fen.substr(castleIndex, enPassantIndex - castleIndex - 1);
		let enPassant = fen.substr(enPassantIndex, halfmoveClockIndex - enPassantIndex - 1);
		let halfmoveClock = fen.substr(halfmoveClockIndex, wholeMovesIndex - halfmoveClockIndex - 1);
		let wholeMoves = fen.substr(wholeMovesIndex);

		var x = 0;
		var y = 0;
		var newBoard = [[]];
		for(let i = 0; i < pieces.length; i++) {
			if(x > 8 || y > 8) return false;
			
			let checkChar = pieces.charAt(i);
			//if char is number
			if(!isNaN(checkChar)) {
				for(var j = 0; j < parseInt(checkChar); j++) {
					newBoard[y].push(null);
				}
				x += parseInt(checkChar);
			}
			else if(checkChar == "/"){
				y++;
				x = 0;
				newBoard.push([]);
			}
			else {
				newBoard[y].push(this.createPieceFromStr(checkChar));
			}
		}
		this.board = newBoard;
		this.setTurn(color);
		if(enPassant != "-") {
			//create an InvisiPawn™ with color opposite of whos turn it is
			this.setInvisiPawnFromStr(enPassant, color == "w" ? "b" : "w");
		}
		
		return true;
	}

	setInvisiPawnFromStr(str, color) {
		if(str.length != 2) return;
		let x = getKeyByValue(columns, str.charAt(0));
		let y = 8 - parseInt(str.charAt(1));
		this.board[y][x] = new InvisiPawn(color);
	}

	setFromMove(index) {
		let newBoardInfo = this.moves.setFromMove(index);
		if(newBoardInfo != null && newBoardInfo.fen != null) {
			this.setFromFEN(newBoardInfo.fen);
			this.capturedPieces = newBoardInfo.capturedPieces;
			this.drawBoard();
			highlightPrevious();

			if(newBoardInfo.check == "find") {
				if(this.isCheck(this.getTurn())) {
					let kingPos = this.getKingPos(this.getTurn());
					$(".pos" + kingPos.x + "-" + kingPos.y).addClass("check-square");
				}
				return;
			}
			
			if(newBoardInfo.check != "") {
				let kingPos = board.getKingPos(board.getTurn());
				$(".pos" + kingPos.x + "-" + kingPos.y).addClass("check-square");
			}
		}
	}

	isDraw(toPlay) {
		if(this.isCheck(toPlay)) return false;
		//if side has no available moves, but is not in check, it is a draw
		return !this.sideHasAvailableMoves(toPlay);
	}

	getCompletedStr() {
		if(this.isDraw(this.getTurn())) return "\u00BD - \u00BD";
		if(this.isCheckmate(this.getTurn())) { 
			return this.getWinnerStr(this.getTurn());
		};
		return "";
	}

	getWinnerStr(turn) {
		if(turn == "w")
			return "0 - 1";
		else
			return "1 - 0";
		return "";
	}
}

function dropper(e, ui) {
	//calculate where the pieces should go from html data
	var oldPos = {};
	var newPos = {};
	oldPos.x = parseInt(ui.draggable.parent().attr("data-x"));
	oldPos.y = parseInt(ui.draggable.parent().attr("data-y"));
	newPos.x = parseInt($(e.target).attr("data-x"));
	newPos.y = parseInt($(e.target).attr("data-y"));

	//ensure movement is valid, then update
	if(board.validateMove(oldPos, newPos)) {
		let isCheckmate = board.movePiece(oldPos, newPos);
		let isCheck = board.isCheck(board.getTurn());
		let isDraw = board.isDraw(board.getTurn());

		if(isCheck) {
			board.getMostRecentMove().check = "check";
		}
		if(isCheckmate) {
			board.getMostRecentMove().check = "checkmate";
		}

		board.moves.completedString = board.getCompletedStr();
		board.drawBoard();
		
		if(isCheckmate || isCheck) {
			let kingPos = board.getKingPos(board.getTurn());
			$(".pos" + kingPos.x + "-" + kingPos.y).addClass("check-square");
		}

		if(isCheckmate || isDraw) {
			$(".draggable").draggable({
				disabled: true
			});
			$("img, .square").css("pointer-events", "none");
			playEndSound();
		}

		board.getMostRecentMove().fen = board.getFEN();
		board.getMostRecentMove().capturedPieces = board.capturedPieces.slice();
		highlightPrevious();
	}
}

function highlightPrevious() {
	if(board.getMostRecentMove() == null) return;
	oldPos = board.getMostRecentMove().oldPos;
	newPos = board.getMostRecentMove().newPos;

	if(oldPos.x % 2 == oldPos.y % 2) {
		$(".pos" + oldPos.x + "-" + oldPos.y).addClass("highlightPrev1");
	}
	else {
		$(".pos" + oldPos.x + "-" + oldPos.y).addClass("highlightPrev2");
	}

	if(newPos.x % 2 == newPos.y % 2) {
		$(".pos" + newPos.x + "-" + newPos.y).addClass("highlightPrev1");
	}
	else {
		$(".pos" + newPos.x + "-" + newPos.y).addClass("highlightPrev2");
	}
}

function promotePiece(newPiece, turn, fromX, fromY, x, y, captured) {
	if(newPiece == "queen") {
		board.board[y][x] = new Queen(turn);
	}
	else if(newPiece == "rook") {
		board.board[y][x] = new Rook(turn);
	}
	else if(newPiece == "bishop") {
		board.board[y][x] = new Bishop(turn);
	}
	else if(newPiece == "knight") {
		board.board[y][x] = new Knight(turn);
	}

	let isCheckmate = board.nextTurn();
	let isCheck = board.isCheck(board.getTurn());

	board.getMostRecentMove().promote = board.board[y][x];
	if(isCheck) {
		board.getMostRecentMove().check = "check";
	}
	if(isCheckmate) {
		board.getMostRecentMove().check = "checkmate";
	}

	board.moves.completedString = board.getCompletedStr();
	board.drawBoard();
	
	if(isCheckmate || isCheck) {
		let kingPos = board.getKingPos(board.getTurn());
		$(".pos" + kingPos.x + "-" + kingPos.y).addClass("check-square");
	}

	if(isCheckmate) {
		$(".draggable").draggable({
			disabled: true
		});
		$("img, .square").css("pointer-events", "none");
		playEndSound();
	}
	board.getMostRecentMove().fen = board.getFEN();
	board.getMostRecentMove().capturedPieces = board.capturedPieces.slice();
	
	$("#pawn-promotion").css("display", "none");
	board.showingPawnPromotion = false;
}

function boardEndTimer(selector) {
	console.log("Ended!");
	let color = "b";
	if(selector == "#white-timer") {
		color = "w";
	}

	board.moves.completedString = board.getWinnerStr(color);
	board.drawBoard();
	
	$(".draggable").draggable({
		disabled: true
	});
	$("img, .square").css("pointer-events", "none");
	$(selector).css("background-color", "#B4522F")
	playEndSound();
}