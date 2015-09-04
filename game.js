// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 450;
document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "images/background.png";

/////////////////////////////////////////////////////////////////////////
///////////////////////////Preloading Images/////////////////////////////
/////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////
/////////////////////////////Game Settings///////////////////////////////
/////////////////////////////////////////////////////////////////////////

var roundTime = 5000, //Time of each round in ms

	keybindings = { //Control bindings for players 1 and 2
	P1: {
		a: 87, //w
		b: 69, //e
		c: 65, //a
		d: 83, //s
		e: 68  //d
	},
	P2: {
		a: 79, //o
		b: 80, //p
		c: 76, //l
		d: 186,//;
		e: 222 //'
	}
};

/////////////////////////////////////////////////////////////////////////
/////////////////////////Constructor Functions///////////////////////////
/////////////////////////////////////////////////////////////////////////

function Actor(imagesrc,x,y) {
	this.image = new Image();
	this.image.src = "images/"+imagesrc+".png";
	//this.image = imageDict[imagesrc];
	this.x = x;
	this.y = y;
	this.draw = function() {ctx.drawImage(this.image,this.x,this.y)};
	this.isTouching = function(other) {
		var L1=this.x,
			R1=L1+this.image.width,
			U1=this.y,
			D1=U1+this.image.height,
			L2=other.x,
			R2=L2+other.image.width,
			U2=other.y,
			D2=U2+other.image.height;
		return (!(L1>R2 || L2>R1 || U1>D2 || U2>D1));
	};
	this.isOffscreen = function() {
		var L=this.x,R=L+this.image.width,U=this.y,D=U+this.image.height;
		return (L<0 || canvas.width<R || U<0 || canvas.height<D);
	};
	this.getTouching = function() {
		var combinedObjects = creatures + conjurations, L = combinedObjects.length, i=0, result=[];
		for (i;i<L;i++) {
			if (this.isTouching(combinedObjects[i])) {result.push(combinedObjects[i]);}
		}
		return result;
	};
	this.isCondemned = false;
}

function Creature(level,health,speed,controller,imagesrc,x,y) {
	Actor.call(this,imagesrc);
	this.level = level;
	this.health = health;
	this.speed = speed;
	this.controller = controller;
}

function Wizard(level,health,speed,imagesrc,x,y) {
	Creature.call(this,level,health,speed,this,imagesrc,x,y);
	this.words = new Words();
}

function Words() {
	this.history = [];
	this.getLast = function(n) {
		var history = this.history, L=history.length, returnList = [];
		if (n>history.length) {return undefined}
		for (n;n>0;n--) {returnList.push(history[L-n])}
		return returnList.join("");
	};
	this.findSpell = function() {
		var key,spell,spelling,matchList=[],result="";
		for (key in spellbook) {
			spell = spellbook[key];
			spelling = spell.spell;
			if (spelling === this.getLast(spelling.length)) {matchList.push(spell);}
		}
		var L=matchList.length,i=0;
		for (i;i<L;i++) {if (matchList[i]["spell"].length>result.length) {result=matchList[i];}}
		return result;
	};
	this.remember = function(c) {
		this.history.push(c);
		while (this.history.length > 20) {this.history.shift();}
	};
}

function Conjuration(caster,rate,duration,damage,imagesrc) { //Images should be from P1's perspective
	Actor.call(this,imagesrc,caster.x,caster.y);
	this.heading = (caster.controller===P1) ? 1 : -1;//heading;//-1 for left, 1 for right
	this.rate = rate;
	this.damage = damage;
	this.caster = caster;
	this.duration = duration;
	this.onUpkeep = function() {
		console.log(this.duration)
		this.duration -= 1;
		if (this.duration === 0) {
			this.isCondemned = true;
			if (this.onDestroy) {this.onDestroy();}
			return;}
		if (this.upkeep) {this.upkeep();} 
	};

	//if (this.heading===-1) {ctx.scale(scaleH, scaleV)}
}

function Fireball(caster) {
	Conjuration.call(this,caster,256,1,5,"fireball");
	this.tag = "fireball"
}

function Shield(caster) {
	Conjuration.call(this,caster,0,1,0,"shield")
	this.tag = "shield"
	this.x -= 30;this.y -= 30;  //need to find a better solution than hardcoding. Problem is I can't refer to the width because the image is not loaded yet.
	caster.isShielded = true;
	this.onDestroy = function() {caster.isShielded = false};
}
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////Spells//////////////////////////////////
/////////////////////////////////////////////////////////////////////////

var spellbook = {
	fireball: {
		spell:"a",//aabc; will use simple 1 character for testing
		onCast: function(caster) {
			var conj = new Fireball(caster);
			conjurations.push(conj);
		}
	},
	shield: {
		spell:"b",//aabc; will use simple 1 character for testing
		onCast: function(caster) {
			var conj = new Shield(caster);
			conjurations.push(conj);
		}
	}
}

/////////////////////////////////////////////////////////////////////////
//////////////////////////Variable Definitions///////////////////////////
/////////////////////////////////////////////////////////////////////////

var startX1 = canvas.width / 10,
	startX2 = canvas.width * 8 / 10,
	startY = canvas.height / 2,

	P1 = new Wizard(7,20,4,"player1",startX1,startY),
	P2 = new Wizard(7,20,4,"player2",startX2,startY),

	creatures = [P1,P2],
	conjurations = [],
	removeConjurations = [],
	removeCreatures = [],
	keysDown = {},
	orders = {P1:"",P2:""};

/////////////////////////////////////////////////////////////////////////
////////////////////////////Controls Handler/////////////////////////////
/////////////////////////////////////////////////////////////////////////

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

/////////////////////////////////////////////////////////////////////////
/////////////////////////Game Update Functions///////////////////////////
/////////////////////////////////////////////////////////////////////////

// Update game objects
var update = function (modifier) {
	//console.log(keysDown);
	var P,key,controls;
	for (P in keybindings) {
		controls = keybindings[P]
		for (key in controls) {
			if (controls[key] in keysDown) {orders[P]=key}
		}
	}

	var i=0,L=conjurations.length,proj,removeIndices=[];
	for (i;i<L;i++) {
		proj = conjurations[i];
		var enemy = ((proj.caster===P1) ? P2 : P1);
		proj.x+=proj.rate*proj.heading*modifier;
		if (proj.isTouching(enemy)) {
			if (!enemy.isShielded) {enemy.health-=proj.damage}
			if (proj.onDestroy) {proj.onDestroy();}
			proj.isCondemned = true;
		}
		else if (proj.isOffscreen()) {proj.isCondemned=true;if (proj.onDestroy) {proj.onDestroy();}}
	}
	conjurations = conjurations.filter(function(x) {return (!x.isCondemned)})
};

// Reset the game
var reset = function() {
	P1.x = canvas.width / 10;
	P1.y = canvas.height / 2;

	// Throw the monster somewhere on the screen randomly
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

	// Score
	
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica";
	ctx.fillStyle = "green";
	ctx.textBaseline = "top";

	ctx.textAlign = "left";
	ctx.fillText("Life: " + P1.health, 32, 400-32);
	ctx.textAlign = "right";
	ctx.fillText("Life: " + P2.health, 600-32, 400-32);

	// Time
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica";
	ctx.textBaseline = "top";
	ctx.fillStyle = "black";
	ctx.textAlign = "center";
	var text = (parseInt((nextResolve-Date.now())/1000)+1).toString()
	ctx.fillText(text,300,200);
};

//Resolve player actions between rounds
var resolve = function() {
	var P1W = P1.words, P2W = P2.words;
	P1W.remember(orders.P1);
	P2W.remember(orders.P2);
	orders.P1 = "";
	orders.P2 = "";
	//Upkeep for existing spells
	var i=0, combined = creatures + conjurations, L = combined.length;
	conjurations.forEach(function(x,i,arr) {
		if (x.onUpkeep) {x.onUpkeep()}
	});
	for (i;i<L;i++) {
		console.log(combined[i].tag);
		if (combined[i].onUpkeep) {combined[i].onUpkeep();}
	}

	var P1S = P1W.findSpell(),P2S = P2W.findSpell();
	if (P1S) {P1S.onCast(P1)}
	if (P2S) {P2S.onCast(P2)}
	//console.log(P1.words.history);
	//console.log(P2.words.history);
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