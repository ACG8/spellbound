// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 450;
document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "images/background.png";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////Preloading Images//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
var imageDict = {};

function loadImages() {
	var imageList = [
		"player1",
		"player2",
		"fireball",
		"shield"
	],
	i=0,L=imageList.length,image,doneLoading = false;
	for (i;i<L;i++) {
		image = imageList[i]
		imageDict[image] = new Image();
		imageDict[image].src = "images/"+image+".png";
		if (i===L-1) {imageDict[image].onload = function() {doneLoading = true;};}
	}
}

loadImages();
*/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////Game Settings////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var roundTime = 5000, //Time of each round in ms

	keybindings = { //Control bindings for players 1 and 2
		P1: {
			a:  81, //q
			b:  87, //w
			c:  69, //e
			d:  65, //a
			e:  68, //d
			"": 83  //s
		},
		P2: {
			a:  219, //[
			b:  80, //p
			c:  79, //o
			d:  222,//'
			e:  76, //l
			"": 186 //;
		}
	},
	runeUR = new Image(),
	runeU = new Image(),
	runeUL = new Image(),
	runeL = new Image(),
	runeR = new Image(),
	runeS = new Image(),

	runeBindings = {
		P1: {
			a:  runeUL,
			b:  runeU,
			c:  runeUR, 
			d:  runeL,
			e:  runeR,
			"": runeS
		},
		P2: {
			a:  runeUR,
			b:  runeU,
			c:  runeUL,
			d:  runeR,
			e:  runeL,
			"": runeS
		}
	};

runeUR.src = "images/URBlock.png";
runeU.src = "images/UBlock.png";
runeUL.src = "images/ULBlock.png";
runeL.src = "images/LBlock.png";
runeR.src = "images/RBlock.png";
runeS.src = "images/SBlock.png";
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////Constructor Functions////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Actor(imagesrc,x,y) {
	this.image = new Image();
	if (imagesrc) {this.image.src = "images/"+imagesrc+".png"};
	//this.image = imageDict[imagesrc];
	this.x = x;
	this.y = y;
	this.isCondemned = false;
}

Actor.prototype = {
	draw : function() {ctx.drawImage(this.image,this.x,this.y)},
	isTouching : function(other) {
		var L1=this.x,
			R1=L1+this.image.width,
			U1=this.y,
			D1=U1+this.image.height,
			L2=other.x,
			R2=L2+other.image.width,
			U2=other.y,
			D2=U2+other.image.height;
		return (!(L1>R2 || L2>R1 || U1>D2 || U2>D1));
	},
	isOffscreen : function() {
		var L=this.x,R=L+this.image.width,U=this.y,D=U+this.image.height;
		return (L<0 || canvas.width<R || U<0 || canvas.height<D);
	},
	getTouching : function() {
		var combinedObjects = creatures + conjurations;
		return combinedObjects.filter(function(o) {return (this.isTouching(o) && (o!==this))})
	}
}

//_____________________________Creature_________________________________________________________________________________________________________

function Creature(level,health,speed,controller,imagesrc,x,y) {
	Actor.call(this,imagesrc);
	this.level = level;
	this.health = health;
	this.speed = speed;
	this.controller = controller;
}

Creature.prototype = new Actor();

//_____________________________Wizard__________________________________________________________________________________________________________

function Wizard(level,health,speed,imagesrc,x,y) {
	Creature.call(this,level,health,speed,this,imagesrc,x,y);
	this.words = new Words();
}

Wizard.prototype = new Creature();
Wizard.prototype.publishHistory = function() {
		var reversedHistory = this.words.history.slice(0);
		reversedHistory.reverse();
		reversedHistory.forEach(function(o,i) {
			ctx.drawImage(runeBindings["P1"][o],canvas.width/2-100-i*50,0);
		})
	};
Wizard.prototype.publishOptions = function() {
		var options = this.words.anticipate(),key,i=0;
		for (key in options) {
			if (options[key].name) {
				ctx.drawImage(runeBindings["P1"][key],0,50+i*50)
				ctx.fillStyle = "rgb(250, 250, 250)";
				ctx.font = "30px Helvetica";
				ctx.fillStyle = "black";
				ctx.textBaseline = "top";
				ctx.textAlign = "left";
				ctx.fillText("" + options[key].name, 50, 50+i*50);
				i++
			}
		}
	};

function Words() {
	this.history = [];
}

Words.prototype = {
	getLast : function(n,history) {
		history = history || this.history;
		var L=history.length, returnList = [];
		if (n>history.length) {return undefined}
		for (n;n>0;n--) {returnList.push(history[L-n])}
		return returnList.join("");
	},
	findSpell : function(history) {
		history = history || this.history;
		var key,spell,spelling,matchList=[],result="";
		for (key in spellbook) {
			spell = spellbook[key];
			spelling = spell.spell;
			if (spelling === this.getLast(spelling.length,history)) {matchList.push(spell);}
		}
		return matchList.reduce(function(prev,curr) {return ((curr.spell.length > prev.spell.length) ? curr : prev)},spellbook["null"]);
	},
	remember : function(c) {
		this.history.push(c);
		while (this.history.length > 7) {this.history.shift();} //don't hardcode max history length
	},
	anticipate : function() {
		var options = {},history = this.history;
		["a","b","c","d","e"].forEach(function(o) {
			options[o] = Words.prototype.findSpell(history.concat([o]));
		});
		return options;
	}
}

//___________________________Conjuration____________________________________________________________________________________________________

function Conjuration(caster,rate,duration,damage,imagesrc) { //Images should be from P1's perspective
	caster = caster || {};
	Actor.call(this,imagesrc,caster.x,caster.y);
	this.heading = (caster.controller===P1) ? 1 : -1;//heading;//-1 for left, 1 for right
	this.rate = rate;
	this.damage = damage;
	this.caster = caster;
	this.duration = duration;
	//if (this.heading===-1) {ctx.scale(scaleH, scaleV)}
}

Conjuration.prototype = new Actor();
Conjuration.prototype.onUpkeep = function() {
		this.duration -= 1;
		if (this.duration === 0) {
			this.isCondemned = true;
			if (this.onDestroy) {this.onDestroy();}
			return;}
		if (this.upkeep) {this.upkeep();} 
	};
//_________________________Fireball___________________________________________________________________________________________________________

function Fireball(caster) {
	Conjuration.call(this,caster,256,1,5,"fireball");
	this.tag = "fireball"
}

Fireball.prototype = new Conjuration();

//________________________Shield_____________________________________________________________________________________________________________

function Shield(caster) {
	Conjuration.call(this,caster,0,1,0,"shield")
	this.tag = "shield"
	this.x -= 30;this.y -= 30;  //need to find a better solution than hardcoding. Problem is I can't refer to the width because the image is not loaded yet.
	caster.isShielded = true;
}

Shield.prototype = new Conjuration();
Shield.prototype.onDestroy = function() {this.caster.isShielded = false};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////Spells///////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var spellbook = {
	"null": {
		spell:"",
		onCast: function(caster) {}
	},
	fireball: {
		name: "Fireball",
		spell:"abc",//aabc; will use simple 1 character for testing
		onCast: function(caster) {
			var conj = new Fireball(caster);
			conjurations.push(conj);
		}
	},
	shield: {
		name: "Shield",
		spell:"b",
		onCast: function(caster) {
			var conj = new Shield(caster);
			conjurations.push(conj);
		}
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////Variable Definitions////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var startX1 = canvas.width / 10,
	startX2 = canvas.width * 8 / 10,
	startY = canvas.height / 2,

	P1 = new Wizard(7,20,4,"player1",startX1,startY),
	P2 = new Wizard(7,20,4,"player2",startX2,startY),

	creatures = [P1,P2],
	conjurations = [],
	keysDown = {},
	orders = {P1:"",P2:""};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////Controls Handler//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////Game Update Functions////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Update game objects
var update = function (modifier) {
	//console.log(keysDown);
	//Log key commands
	var P,key,controls;
	for (P in keybindings) {
		controls = keybindings[P]
		for (key in controls) {
			if (controls[key] in keysDown) {orders[P]=key}
		}
	}

	var enemy;
	conjurations.forEach(function(o,i) {
		enemy = ((o.caster===P1) ? P2 : P1);
		o.x += o.rate * o.heading * modifier;
		if (o.isTouching(enemy)) {
			if (!enemy.isShielded) {enemy.health -= o.damage}
			if (o.onDestroy) {o.onDestroy();}
			o.isCondemned = true;
		}
		else if (o.isOffscreen()) {o.isCondemned=true; if (o.onDestroy) {o.onDestroy();}}
	})
	
	conjurations = conjurations.filter(function(x) {return (!x.isCondemned)})
	creatures = creatures.filter(function(x) {return (!x.isCondemned)})
};

// Reset the game
var reset = function() {
	P1.x = canvas.width / 10;
	P1.y = canvas.height / 2;

	P2.x = canvas.width * 8 / 10;
	P2.y = canvas.height / 2;
}

// Draw everything
var render = function () {
	//Draw background
	if (bgReady) {ctx.drawImage(bgImage, 0, 0);}
	//Draw creatures
	var i=0,L=creatures.length;
	for (i;i<L;i++) {creatures[i].draw();}
	//Draw conjurations
	L=conjurations.length;
	for (i=0;i<L;i++) {conjurations[i].draw();}

	// Life
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "50px Helvetica";
	ctx.fillStyle = "green";
	ctx.textBaseline = "bottom";

	ctx.textAlign = "left";
	ctx.fillText("Life: " + P1.health, 32, canvas.height-32);
	ctx.textAlign = "right";
	ctx.fillText("Life: " + P2.health, canvas.width-32, canvas.height-32);

	// Time
	ctx.font = "60px Helvetica";
	ctx.fillStyle = "black";
	ctx.textAlign = "center";
	var text = (parseInt((nextResolve-Date.now())/1000)+1).toString();
	ctx.fillText(text,canvas.width/2,canvas.height/2);

	P1.publishHistory();
	P1.publishOptions();
};

//Resolve player actions between rounds
var resolve = function() {
	var P1W = P1.words, P2W = P2.words;
	P1W.remember(orders.P1);
	P2W.remember(orders.P2);
	orders.P1 = "";
	orders.P2 = "";

	//Upkeep for existing spells
	conjurations.forEach(function(x) {
		if (x.onUpkeep) {x.onUpkeep()}
	});

	var P1S = P1W.findSpell(),P2S = P2W.findSpell();
	if (P1S) {P1S.onCast(P1)}
	if (P2S) {P2S.onCast(P2)}

	console.log(P1.words.history);
	console.log(P2.words.history);
}

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;

	if (now>nextResolve) {
		resolve()
		nextResolve += roundTime;
	}

	update(delta / 1000);
	render();

	then = now;

	// Request to do this again ASAP
	requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var nextResolve = Date.now() + roundTime;
var then = Date.now();
reset();
main();