"use strict";

var canvas = document.getElementById("canvas");

var manifest = {
	"images": {
		"sound-off": "images/sound-off.png",
		"sound-on": "images/sound-on.png"
	},
	"sounds": {
		"choo": "sound/choo.wav",
		"button": "sound/menuchange.wav"


	},
	"fonts": {

	},
	"animations": {
		"two-scoop": {
			"strip": "images/two-scoop-anim.png",
			"frames": 32,
			"msPerFrame": 50,
			"repeatAt": 31
		},
		"squid-idle": {
			"strip": "images/squid-idle-f6.png",
			"frames": 6,
			"msPerFrame": 200
		}
	}
};


var game = new Splat.Game(canvas, manifest);
var bounds = {
	top: 0,
	left: 0,
	right: canvas.width,
	bottom: canvas.height
};
var muteSounds = false;
var waitingToStart = true;
var gravity = 0.01;

function centerText(context, text, offsetX, offsetY) {
	var textWidth = context.measureText(text).width;
	var x = offsetX + (bounds.right / 2) - (textWidth / 2) | 0;
	var y = offsetY | 0;
	context.fillText(text, x, y);
}
var soundSwitch;

function drawIntroOverlay(context, scene) {
	scene.camera.drawAbsolute(context, function() {

		context.fillStyle = "#fff";
		context.font = "20px helvetica";
		centerText(context, "2014 Two Scoop Games", 0, bounds.bottom - 60);

		if (muteSounds) {
			soundSwitch = game.images.get("sound-off");
			context.drawImage(soundSwitch, (bounds.right - soundSwitch.width), 100);
		} else {
			soundSwitch = game.images.get("sound-on");
			context.drawImage(soundSwitch, (bounds.right - soundSwitch.width), 100);
		}


	});
}

function isInside(container, x, y) {
	return x >= container.x &&
		x < container.x + container.width &&
		y >= container.y &&
		y < container.y + container.height;
}

// function drawCircle(context, color, radius, strokeColor, strokeSize, x, y) {
// 	context.beginPath();
// 	context.arc(x, y, radius, 0, 2 * Math.PI, false);
// 	context.fillStyle = color;
// 	context.fill();
// 	context.lineWidth = strokeSize;
// 	context.strokeStyle = strokeColor;
// 	context.stroke();
// }

/*=========================================
				 Scenes 
===========================================*/

game.scenes.add("title", new Splat.Scene(canvas, function() {
	this.timers.running = new Splat.Timer(null, 2000, function() {
		game.scenes.switchTo("main");
	});
	this.timers.running.start();
}, function(elapsedMillis) {
	game.animations.get("two-scoop").move(elapsedMillis);
}, function(context) {
	context.fillStyle = "#93cbcd";
	context.fillRect(0, 0, bounds.right, bounds.bottom);
	var anim = game.animations.get("two-scoop");
	context.fillStyle = "#ffffff";
	context.font = "50px helvetica";
	centerText(context, "Two Scoop Games", 0, (bounds.bottom / 2) + (anim.height / 2) + 30);
	anim.draw(context, (bounds.right / 2) - (anim.width / 2), (bounds.bottom / 2) - (anim.height / 2));
}));


var playerYSpeed = 1.2;
var playerXSpeed = 1.1;


game.scenes.add("main", new Splat.Scene(canvas, function() {
		// init


		waitingToStart = true;

		this.timers.fadeToBlack = new Splat.Timer(null, 1000, function() {
			game.scenes.switchTo("main");
		});
		this.squidIdle = game.animations.get("squid-idle");
		this.player = new Splat.AnimatedEntity(25, 25, this.squidIdle.width, this.squidIdle.height, this.squidIdle, 0, 0);


	},
	function(elapsedMillis) {
		//simulation

		if (muteSounds) {
			//game.sounds.stop("music");
		}

		if (waitingToStart) {
			var soundSwitch = new Splat.Entity((canvas.width - 115), 100, 115, 109);
			if (isInside(soundSwitch, game.mouse.x, game.mouse.y)) {
				if (game.mouse.consumePressed(0)) {
					if (muteSounds === true) {
						muteSounds = false;
					} else {
						muteSounds = true;
					}
				}
			} else {
				if (game.mouse.consumePressed(0)) {
					if (!muteSounds) {
						game.sounds.play("button");
					}
					setTimeout(function() {
						if (!muteSounds) {
							//game.sounds.play("music", true);
						}
						waitingToStart = false;
					}, 200);
				}
			}

		}

		if (this.timers.fadeToBlack.running) {
			return;
		}


		if (!waitingToStart) {

			game.animations.get("squid-idle").move(elapsedMillis);

			if (game.keyboard.isPressed("left") || game.keyboard.isPressed("a")) {
				this.player.vx = -playerXSpeed;
			}
			if (game.keyboard.isPressed("right") || game.keyboard.isPressed("d")) {
				this.player.vx = playerXSpeed;
			}
			if (game.keyboard.isPressed("up") || game.keyboard.isPressed("w")) {
				this.player.vy = -playerYSpeed;
			}
			if (game.keyboard.isPressed("down") || game.keyboard.isPressed("s")) {
				this.player.vy = playerYSpeed;
			}

			if (game.keyboard.isPressed) {
				this.player.x += this.player.vx;
				this.player.y += this.player.vy;
			} else {
				this.player.x += 0;
				this.player.y += 0;
			}

			this.player.vy += gravity;
			if (this.player.x < bounds.left) {
				this.player.x = bounds.left;
			}
			if (this.player.x + this.player.width > bounds.right) {
				this.player.x = bounds.right - this.player.width;
			}
			if (this.player.y < bounds.top) {
				this.player.y = bounds.top;
			}
			if (this.player.y + this.player.height > bounds.bottom) {
				this.player.y = bounds.bottom - this.player.height;
			}
		}



	},

	function(context) {

		// draw
		context.fillStyle = "#728780";
		context.fillRect(0, 0, canvas.width, canvas.height);

		if (this.timers.fadeToBlack.running) {
			return;
		}

		if (waitingToStart) {
			drawIntroOverlay(context, this);
		} else {

			//console.log("player x: ", this.player.x);
			this.player.draw(context);
			// player bounding box
			//context.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);


			this.camera.drawAbsolute(context, function() {
				//hud
				context.fillStyle = "#ffffff";
				context.font = "20px helvetica";
				centerText(context, "hello world", 0, 25);

			});
		}

	}));

game.scenes.switchTo("loading");