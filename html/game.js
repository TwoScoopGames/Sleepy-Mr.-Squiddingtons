"use strict";

var Splat = require("splatjs");
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
	//color: "#fff",
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


var gravity = 0.01;

var bubbles = [];
//var velocity = 2;

// function drawTextArea(context, text) {
// 	context.fillStyle = textArea.background;
// 	context.fillRect(textArea.x, textArea.y, textArea.width, textArea.height);
// 	context.fillStyle = textArea.color;
// 	context.font = textArea.font;
// 	centerText(context, text, 0, textArea.y + (textArea.height * 0.6));
// }

// function centerText(context, text, offsetX, offsetY) {
// 	var textWidth = context.measureText(text).width;
// 	var x = offsetX + (bounds.right / 2) - (textWidth / 2) | 0;
// 	var y = offsetY | 0;
// 	context.fillText(text, x, y);
// }


// function drawIntroOverlay(context, scene) {
// 	scene.camera.drawAbsolute(context, function() {
// 		context.fillStyle = "#fff";
// 		context.font = "20px helvetica";
// 		centerText(context, "click or tap to begin", 0, bounds.bottom / 2);
// 		centerText(context, "2014 Two Scoop Games", 0, bounds.bottom - 60);
// 		if (muteSounds) {
// 			soundSwitch = game.images.get("sound-off");
// 			context.drawImage(soundSwitch, (bounds.right - soundSwitch.width), 0);
// 		} else {
// 			soundSwitch = game.images.get("sound-on");
// 			context.drawImage(soundSwitch, (bounds.right - soundSwitch.width), 0);
// 		}
// 	});
// }

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

function drawParticles(context, particles) {
	for (var i = 0; i < particles.length; i++) {
		var particle = particles[i];
		drawCircle(context, "rgba(255,255,255,0.5)", particle.radius, particle.stroke, 0, particle.x, particle.y);
	}
}

function moveParticles(elapsedMillis, particles, gravity) {
	for (var i = 0; i < particles.length; i++) {
		var particle = particles[i];
		particle.x += particle.xv * elapsedMillis;
		particle.y += particle.yv * elapsedMillis;
		if (gravity) {
			particle.yv += particle.gravity;
		}
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


var playerYSpeed = 1.2;
var playerXSpeed = 1.1;
var playerMoving = false;



/*=========================================
				 Scenes 
===========================================*/

game.scenes.add("title", new Splat.Scene(canvas, function() {
	game.scenes.switchTo("main");

}, function() {

}, function() {

}));


game.scenes.add("main", new Splat.Scene(canvas, function() {
		// init
		this.squidIdle = game.animations.get("squid-idle");
		this.squidIdleLeft = game.animations.get("squid-idle-left");
		this.player = new Splat.AnimatedEntity((bounds.right / 2) - (this.squidIdle.width / 2), 25, this.squidIdle.width, this.squidIdle.height, this.squidIdle, 0, 0);
		var self = this;

		this.timers.bubbleTimer = new Splat.Timer(null, 1000, function() {
			spray(bubbles, {
					x: self.player.x + (self.player.width * 0.8),
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


		// 	recycle particles	
		for (var b = 0; b < bubbles.length; b++) {
			if (!isInside(particleBounds, bubbles[b].x, bubbles[b].y)) {
				bubbles.splice(b, 1);
			}
		}

		if (bubbles.length > 0) {
			moveParticles(elapsedMillis, bubbles, true);
		}

		this.squidIdle.move(elapsedMillis);
		this.squidIdleLeft.move(elapsedMillis);

		//player keyboard controls
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

		//move player every frame
		this.player.x += this.player.vx;
		this.player.y += this.player.vy;

		//player is affected by gravity
		this.player.vy += gravity;

		//Player restricted to bounds
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


		//change animations per direction
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

		//draw the player
		this.player.draw(context);

		//var self = this;
		this.camera.drawAbsolute(context, function() {
			drawParticles(context, bubbles);
			// 	//hud
			// 	drawTextArea(context, "all was well, until one day...");


		});

	}));

game.scenes.switchTo("loading");