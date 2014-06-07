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
var gravity = 0.2;

function centerText(context, text, offsetX, offsetY) {
	var textWidth = context.measureText(text).width;
	var x = offsetX + (bounds.right / 2) - (textWidth / 2) | 0;
	var y = offsetY | 0;
	context.fillText(text, x, y);
}

function drawIntroOverlay(context, scene) {
	scene.camera.drawAbsolute(context, function() {

		context.fillStyle = "#fff";
		context.font = "20px lato";
		centerText(context, "2014 Two Scoop Games", 0, bounds.bottom - 60);

		if (muteSounds) {
			var soundSwitch = game.images.get("sound-off");
		} else {
			var soundSwitch = game.images.get("sound-on");
		}
		context.drawImage(soundSwitch, (bounds.right - soundSwitch.width), 100);

	});
}

function isInside(container, x, y) {
	return x >= container.x &&
		x < container.x + container.width &&
		y >= container.y &&
		y < container.y + container.height;
}

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

game.scenes.add("main", new Splat.Scene(canvas, function() {
		// init

		waitingToStart = true;

		this.timers.fadeToBlack = new Splat.Timer(null, 1000, function() {
			game.scenes.switchTo("main");
		});


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
							game.sounds.play("music", true);
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
			// main game loop
		}

	},

	function draw(context) {

		context.fillStyle = "blue";
		context.fillRect(0, 0, canvas.width, canvas.height);



		if (this.timers.fadeToBlack.running) {
			return;
		}

		if (waitingToStart) {
			drawIntroOverlay(context, this);
		} else {
			this.camera.drawAbsolute(context, function() {
				//hud
				context.fillStyle = "#ffffff";
				context.font = "20px helvetica";
				centerText(context, 'hello world', 0, 25);

			});
		}

	}));

game.scenes.switchTo("loading");