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
		var

		tW=this.image.width,
		tH=this.image.height,
		tX=this.x,
		tY=this.y,
		
		tL=tX,
		tR=tX+tW,
		tU=tY,
		tD=tY+tH,
		
		tHor=[tL,tR],tVer=[tU,tD],

		T = {x:this.x,w:this.image.width,y:this.y,h:this.image.height},

		oW=other.image.width,
		oH=other.image.height,
		oX=other.x,
		oY=other.y,
		
		oL=oX,
		oR=oX+oW,
		oU=oY,
		oD=oY+oH,

		oHor=[oL,oR],oVer=[oU,oD],

		O = {x:other.x,w:other.image.width,y:other.y,h:other.image.height}
		; 
		var i=0,j=0;
		for (i;i<2;i++) {//x loop
			for (j;j<2;j++) {//y loop
				if ((isInside(tHor[i],tVer[j]),O) || (isInside(oHor[i],oVer[j],T))) {return true;}
			}
		}
		return false;
	};
}

function isInside(x,y,rect) {
	var L=rect.x,R=L+rect.w,U=rect.y,D=U+rect.H;
	return (L<x && x<R && U<y && y<D)
};

function Creature(level,health,speed,imagesrc,x,y) {
	Actor.call(this,imagesrc);
	this.level = level;
	this.health = health;
	this.speed = speed;
}

function Wizard(level,health,speed,imagesrc,x,y) {
	Creature.call(this,level,health,speed,imagesrc,x,y);
}

function Projectile(heading,rate,damage,imagesrc,x,y) { //Images should be from P1's perspective
	Actor.call(this,imagesrc,x,y);
	this.heading = heading;//-1 for left, 1 for right
	this.rate = rate;

	//if (this.heading===-1) {ctx.scale(scaleH, scaleV)}
}

function Fireball(heading,x,y) {
	Projectile.call(this,heading,5,5,"fireball",x,y);
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
	//console.log(keysDown);
	if (32 in keysDown) {//spacebar
		var fireball = new Fireball(1,P1.x,P1.y)
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
		proj.x+=proj.rate;
		if (proj.isTouching(P2)) {removeIndices.push(i)}
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
	var i=0,L=creatures.length,arr=creatures;
	for (i;i<L;i++) {creatures[i].draw();}
	//Draw projectiles
	L=projectiles.length,arr=projectiles;
	for (i;i<L;i++) {projectiles[i].draw();}

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

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();
reset();
main();
