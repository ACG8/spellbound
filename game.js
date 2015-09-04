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
	this.x=x;
	this.y=y;
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

function Projectile(caster,rate,damage,imagesrc) { //Images should be from P1's perspective
	Actor.call(this,imagesrc,caster.x,caster.y);
	this.heading = (caster.controller===P1) ? 1 : -1;//heading;//-1 for left, 1 for right
	this.rate = rate;
	this.damage = damage;
	this.caster = caster;

	//if (this.heading===-1) {ctx.scale(scaleH, scaleV)}
}

function Fireball(caster) {
	Projectile.call(this,caster,256,5,"fireball");
}
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////Spells//////////////////////////////////
/////////////////////////////////////////////////////////////////////////

var spellbook = {
	fireball: {
		spell:"a",//aabc; will use simple 1 character for testing
		onCast: function(caster) {
			var proj = new Fireball(caster);
			projectiles.push(proj);
		}
	}
}

/////////////////////////////////////////////////////////////////////////
//////////////////////////Variable Definitions///////////////////////////
/////////////////////////////////////////////////////////////////////////

var startX1 = canvas.width / 10,
	startX2 = canvas.width * 8 / 10,
	startY = canvas.height / 2,
	P1 = new Wizard(7,20,4,"wizardRight",startX1,startY),
	P2 = new Wizard(7,20,4,"wizardLeft",startX2,startY),
	creatures = [P1,P2],
	projectiles = [],
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

	var i=0,L=projectiles.length,proj,removeIndices=[];
	for (i;i<L;i++) {
		proj = projectiles[i];
		var enemy = ((proj.caster===P1) ? P2 : P1);
		proj.x+=proj.rate*proj.heading*modifier;
		if (proj.isTouching(enemy)) {enemy.health-=proj.damage;removeIndices.push(i);}
		else if (proj.isOffscreen()) {removeIndices.push(i);}
	}
	while (removeIndices.length>0) {
		projectiles.splice(removeIndices[0],1);
		removeIndices.shift();
	}
}

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
	//Draw projectiles
	L=projectiles.length;
	for (i=0;i<L;i++) {projectiles[i].draw();}

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
	var P1S = P1W.findSpell(),P2S = P2W.findSpell();
	console.log("P1",P1S,"P2",P2S)
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