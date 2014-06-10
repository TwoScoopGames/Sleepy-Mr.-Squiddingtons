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
	"fonts": {},
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
		},
		"squid-idle-left": {
			"strip": "images/squid-idle-left-f6.png",
			"frames": 6,
			"msPerFrame": 200
		}
	}
};

var game = new Splat.Game(canvas, manifest);
var textArea = {
	x: 0,
	y: canvas.height - 100,
	width: canvas.width,
	height: 100,
	background: "rgba(0,0,0,.5)",
	color: "#fff",
	font: "25px helvetica"
};
var bounds = {
	top: 0,
	left: 0,
	right: canvas.width,
	bottom: canvas.height - textArea.height
};

var particleBounds = {
	x: 0,
	y: 0,
	width: canvas.width,
	height: canvas.height
};
var muteSounds = false;
var waitingToStart = true;
var gravity = 0.01;

var bubbles = [];
var velocity = 2;

function drawTextArea(context, text) {
	context.fillStyle = textArea.background;
	context.fillRect(textArea.x, textArea.y, textArea.width, textArea.height);
	context.fillStyle = textArea.color;
	context.font = textArea.font;
	centerText(context, text, 0, textArea.y + (textArea.height * 0.6));
}

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
		centerText(context, "click or tap to begin", 0, bounds.bottom / 2);
		centerText(context, "2014 Two Scoop Games", 0, bounds.bottom - 60);
		if (muteSounds) {
			soundSwitch = game.images.get("sound-off");
			context.drawImage(soundSwitch, (bounds.right - soundSwitch.width), 0);
		} else {
			soundSwitch = game.images.get("sound-on");
			context.drawImage(soundSwitch, (bounds.right - soundSwitch.width), 0);
		}
	});
}

function isInside(container, x, y) {
	return x >= container.x &&
		x < container.x + container.width &&
		y >= container.y &&
		y < container.y + container.height;
}


function spray(array, location, velocityX, velocityY, radius, color, stroke, quantity, gravity) {

	for (var q = 0; q < quantity; q++) {
		array.push({
			x: location.x,
			y: location.y,
			xv: (Math.random() - 0.5) * velocityX,
			yv: (Math.random() - 0.5) * velocityY,
			radius: Math.random() * radius,
			gravity: gravity,
			color: color,
			stroke: stroke
		});

	}
}

function drawParticles(context, particles, color) {
	for (var i = 0; i < particles.length; i++) {
		var particle = particles[i];
		drawCircle(context, particle.color, particle.radius, particle.stroke, 0, particle.x, particle.y);
	}
}

function moveParticles(elapsedMillis, particles, gravity) {
	for (var i = 0; i < particles.length; i++) {
		var particle = particles[i];
		particle.x += particle.xv * elapsedMillis;
		particle.y += particle.yv * elapsedMillis;
		particle.yv += particle.gravity;

	}
}

function drawCircle(context, color, radius, strokeColor, strokeSize, x, y) {
	context.beginPath();
	context.arc(x, y, radius, 0, 2 * Math.PI, false);
	context.fillStyle = color;
	context.fill();
	context.lineWidth = strokeSize;
	context.strokeStyle = strokeColor;
	context.stroke();
}

/*=========================================
				 Scenes 
===========================================*/

game.scenes.add("title", new Splat.Scene(canvas, function() {
	this.timers.running = new Splat.Timer(null, 1, function() {
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
var playerMoving = false;
var rockSpeed = .1;
game.scenes.add("main", new Splat.Scene(canvas, function() {
		// init
		waitingToStart = true;


		this.timers.fadeToBlack = new Splat.Timer(null, 1000, function() {
			game.scenes.switchTo("main");
		});
		this.squidIdle = game.animations.get("squid-idle");
		this.squidIdleLeft = game.animations.get("squid-idle-left");
		this.player = new Splat.AnimatedEntity((bounds.right / 2) - (this.squidIdle.width / 2), 25, this.squidIdle.width, this.squidIdle.height, this.squidIdle, 0, 0);
		var self = this;
		this.timers.bubbleTimer = new Splat.Timer(null, 1000, function() {

			spray(bubbles, {
					x: self.player.x + (self.player.width * .8),
					y: self.player.y + 35
				},
				0.05, 0.01, 7, "rgba(255,255,255, .3)", "rgba(255,255,255, .5)", 1, -0.001);
			this.reset();
			this.start();
		});
		this.timers.bubbleTimer.start();
		this.rock1 = new Splat.Entity((canvas.width / 2), 0, 50, 50);

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
			this.rock1.move(elapsedMillis);
			this.rock1.vx = 0;
			this.rock1.vy = rockSpeed;

			this.rock1.x += this.rock1.vx;
			this.rock1.y += this.rock1.vy;
			// 	recycle particles	
			for (var b = 0; b < bubbles.length; b++) {
				if (!isInside(particleBounds, bubbles[b].x, bubbles[b].y)) {
					bubbles.splice(b, 1);
				}
			}

			if (bubbles.length > 0) {

				moveParticles(elapsedMillis, bubbles, true);
			}

			game.animations.get("squid-idle").move(elapsedMillis);
			game.animations.get("squid-idle-left").move(elapsedMillis);
			if (game.keyboard.isPressed("left") || game.keyboard.isPressed("a")) {
				this.player.vx = -playerXSpeed;
				playerMoving = true;
			} else if (game.keyboard.isPressed("right") || game.keyboard.isPressed("d")) {
				this.player.vx = playerXSpeed;
				playerMoving = true;
			} else if (game.keyboard.isPressed("up") || game.keyboard.isPressed("w")) {
				this.player.vy = -playerYSpeed;
				playerMoving = true;
			} else if (game.keyboard.isPressed("down") || game.keyboard.isPressed("s")) {
				this.player.vy = playerYSpeed;
				playerMoving = true;
			} else {
				playerMoving = false;
			}

			if (playerMoving) {
				this.squidIdleLeft.msPerFrame = 50;
				this.squidIdle.msPerFrame = 50;
			} else {
				this.squidIdleLeft.msPerFrame = 200;
				this.squidIdle.msPerFrame = 200;
			}

			this.player.x += this.player.vx;
			this.player.y += this.player.vy;

			this.player.vy += gravity;
			if (this.player.x < bounds.left) {
				this.player.x = bounds.left;
				this.player.vx *= -0.5;
			}
			if (this.player.x + this.player.width > bounds.right) {
				this.player.x = bounds.right - this.player.width;
				this.player.vx *= -0.5;
			}
			if (this.player.y < bounds.top) {
				this.player.y = bounds.top;
				this.player.vy *= -0.5;
			}
			if (this.player.y + this.player.height > bounds.bottom) {
				this.player.y = bounds.bottom - this.player.height;
				this.player.vy *= -0.5;
			}


			//rock bounds checks
			if (this.rock1.x < bounds.left) {
				this.rock1.x = bounds.left;
				this.rock1.vx *= -0.5;
			} else if (this.rock1.x + this.rock1.width > bounds.right) {
				this.rock1.x = bounds.right - this.rock1.width;
				this.rock1.vx *= -0.5;
			} else if (this.rock1.y < bounds.top) {
				this.rock1.y = bounds.top;
				this.rock1.vy *= -0.5;
			} else if (this.rock1.y + this.rock1.height > bounds.bottom) {
				this.rock1.y = bounds.bottom - this.rock1.height;
				this.rock1.vy *= -0.5;
			} else {
				this.rock1.y += gravity;
			}
		}

		if (this.player.vx < 0) {
			this.player.sprite = this.squidIdleLeft;

		} else {
			this.player.sprite = this.squidIdle;
		}


	},

	function(context) {

		// draw

		context.fillStyle = "#C3E3B3";

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
			var self = this;
			this.camera.drawAbsolute(context, function() {
				//hud
				drawTextArea(context, "all was well, until one day...");
				drawParticles(context, bubbles);
				drawCircle(context, "brown", self.rock1.width, "brown", 1, self.rock1.x, self.rock1.y)
			});
		}

	}));

game.scenes.switchTo("loading");