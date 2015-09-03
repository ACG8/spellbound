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

function Actor(imagesrc,x,y) {
	this.image = new Image();
	this.image.src = "images/"+imagesrc+".png";
	this.x=x;
	this.y=y;
	this.draw = function() {ctx.drawImage(this.image,this.x,this.y)};
	this.isTouching = function(other) {
		var T = [this.x,this.y,this.image.width,this.image.height],O = [other.x,other.y,other.image.width,other.image.height];
		return (!notTouching(T,O));
	};
	this.isOffscreen = function() {
		var L=this.x,R=L+this.image.width,U=this.y,D=U+this.image.height;
		return (L<0 || canvas.width<R || U<0 || canvas.height<D);
	};
}

function notTouching(rect1,rect2) {//rect1,2 as arrays, format [x,y,w,h]
	var 
	L1=rect1[0],
	R1=L1+rect1[2],
	U1=rect1[1],
	D1=U1+rect1[3]
	L2=rect2[0],
	R2=L2+rect2[2],
	U2=rect2[1],
	D2=U2+rect2[3];
	return (L1>R2 || L2>R1 || U1>D2 || U2>D1);
}

function Creature(level,health,speed,imagesrc,x,y) {
	Actor.call(this,imagesrc);
	this.level = level;
	this.health = health;
	this.speed = speed;
}

function Wizard(level,health,speed,imagesrc,x,y) {
	Creature.call(this,level,health,speed,imagesrc,x,y);
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
	this.remember = function(c) {this.history.push(c)};
}

function Projectile(heading,rate,damage,imagesrc,x,y) { //Images should be from P1's perspective
	Actor.call(this,imagesrc,x,y);
	this.heading = heading;//-1 for left, 1 for right
	this.rate = rate;
	this.damage = damage;

	//if (this.heading===-1) {ctx.scale(scaleH, scaleV)}
}

function Fireball(heading,x,y) {
	Projectile.call(this,heading,256,5,"fireball",x,y);
}
//Load player images
/*
var P1Ready = false;
var P1Image = new Image();
P1Image.onload = function() {P1Ready=true;}

var P2Ready = false;
var P2Image = new Image();
P2Image.onload = function() {P2Ready=true;}
*/
var startX1 = canvas.width / 10;
var startX2 = canvas.width * 8 / 10;
var startY = canvas.height / 2;

var P1 = new Wizard(7,20,4,"wizardRight",startX1,startY);
var P2 = new Wizard(7,20,4,"wizardLeft",startX2,startY);

var creatures = [P1,P2];
var projectiles = [];

/*
// Hero image
var heroReady = false;
var heroImage = new Image();
heroImage.onload = function () {
	heroReady = true;
};
heroImage.src = "images/wizardRight.png";

// Monster image
var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function () {
	monsterReady = true;
};
monsterImage.src = "images/wizardLeft.png";
*/
// Game objects
/*
var hero = {
	speed: 256, // movement in pixels per second
	image: heroImage
};
var monster = {
	image:monsterImage
};
var monstersCaught = 0;
*/
// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

// Reset the game when the player catches a monster
var reset = function () {
	P1.x = canvas.width / 10;
	P1.y = canvas.height / 2;

	// Throw the monster somewhere on the screen randomly
	P2.x = canvas.width * 8 / 10;
	P2.y = canvas.height / 2;
};

// Update game objects
var update = function (modifier) {
	//console.log(keysDown,projectiles);
	if (32 in keysDown && projectiles.length===0) {//spacebar
		var fireball = new Fireball(1,P1.x,P1.y);
		projectiles.push(fireball);
	}
	/*
	if (38 in keysDown) { // Player holding up
		hero.y -= hero.speed * modifier;
	}
	if (40 in keysDown) { // Player holding down
		hero.y += hero.speed * modifier;
	}
	if (37 in keysDown) { // Player holding left
		hero.x -= hero.speed * modifier;
	}
	if (39 in keysDown) { // Player holding right
		hero.x += hero.speed * modifier;
	}
	*/
	
	var i=0,L=projectiles.length,proj,removeIndices=[];
	for (i=0;i<L;i++) {
		proj = projectiles[i];
		proj.x+=proj.rate*modifier;
		if (proj.isTouching(P2)) {P2.health-=proj.damage;removeIndices.push(i);}
		else if (proj.isOffscreen()) {removeIndices.push(i);}
	}
	while (removeIndices.length>0) {
		projectiles.splice(removeIndices[0],1);
		removeIndices.shift();
	}

	// Are they touching?
	/*
	if (
		hero.x <= (monster.x + 32)
		&& monster.x <= (hero.x + 32)
		&& hero.y <= (monster.y + 32)
		&& monster.y <= (hero.y + 32)
	) {
		++monstersCaught;
		reset();
	}
	*/
};

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
	
};

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;

	// Request to do this again ASAP
	requestAnimationFrame(main);
};

var spellbook = {
	fireball: {
		spell:"aabc",
		onCast: function() {
			var proj = new Fireball(1,P1.x,P1.y);
			projectiles.push(proj);
			render();
		}
	}
}

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();
reset();
main();