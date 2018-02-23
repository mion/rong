////////////////////////////////////////////////////////////////////////////////
// RONG
//  Version 0.1.0
//
// AUTHORS
//  Gabriel Vieira
//  Rafael Lopes
//  Pedro Masid

////////////////////////////////////////////////////////////////////////////////
// global variables
var game = null;
var canvasHeight = 480;
var canvasWidth = 640;

////////////////////////////////////////////////////////////////////////////////
// updating functions
function updateBall(ball, bounds, pad) {
  if ((ball.position.x + ball.radius) + ball.velocity.x > bounds.x + bounds.width) {
    ball.position.x = (bounds.x + bounds.width) - ball.radius;
    ball.velocity.x *= -1;
  } else if ((ball.position.x - ball.radius) + ball.velocity.x < bounds.x) {
    ball.position.x = bounds.x + ball.radius;
    ball.velocity.x *= -1;
  } else {
    ball.position.x += ball.velocity.x;
  }

  if ((ball.position.y + ball.radius) + ball.velocity.y > bounds.y + bounds.height) {
    ball.position.y = (bounds.y + bounds.height) - ball.radius;
    ball.velocity.y *= -1;
  } else if ((ball.position.y - ball.radius) + ball.velocity.y < bounds.y) {
    ball.position.y = bounds.y + ball.radius;
    ball.velocity.y *= -1;
  } else {
    ball.position.y += ball.velocity.y;
  }

  if (ball.position.dist(pad.position) < (ball.radius + pad.radius)) {
    ball.velocity.mult(-1);
  }
}

function updatePad(pad, bounds) {
  if (keyIsDown(LEFT_ARROW)) {
    pad.velocity.add(createVector(-1, 0));
  }
  if (keyIsDown(RIGHT_ARROW)) {
    pad.velocity.add(createVector(1, 0));
  }

  pad.velocity.mult(0.95);

  if ((pad.position.x + pad.radius) + pad.velocity.x > bounds.x + bounds.width) {
    pad.position.x = (bounds.x + bounds.width) - pad.radius;
    pad.velocity.x *= -1;
  } else if ((pad.position.x - pad.radius) + pad.velocity.x < bounds.x) {
    pad.position.x = bounds.x + pad.radius;
    pad.velocity.x *= -1;
  } else {
    pad.position.x += pad.velocity.x;
  }

  if ((pad.position.y + pad.radius) + pad.velocity.y > bounds.y + bounds.height) {
    pad.position.y = (bounds.y + bounds.height) - pad.radius;
    pad.velocity.y *= -1;
  } else if ((pad.position.y - pad.radius) + pad.velocity.y < bounds.y) {
    pad.position.y = bounds.y + pad.radius;
    pad.velocity.y *= -1;
  } else {
    pad.position.y += pad.velocity.y;
  }
}

function updateGame(game) {
  updateBall(game.ball, game.bounds, game.pad);
  updatePad(game.pad, game.bounds);
}

////////////////////////////////////////////////////////////////////////////////
// drawing functions
function drawHUD(game) {
  var SPACE_AFTER_BOUNDS = 25;
  textSize(16);
  fill('black');
  text('Score: ' + game.score, game.bounds.x, game.bounds.y + game.bounds.height + SPACE_AFTER_BOUNDS);
}

function drawBounds(game) {
  noFill();
  stroke('black');
  rect(game.bounds.x, game.bounds.y, game.bounds.width, game.bounds.height);
}

function drawBall(game) {
  fill('blue');
  noStroke();
  ellipse(game.ball.position.x, game.ball.position.y, game.ball.radius);
}

function drawPad(game) {
  fill('red');
  noStroke();
  ellipse(game.pad.position.x, game.pad.position.y, game.pad.radius);
}

function drawGame(game) {
  clear();
  drawHUD(game);
  drawBall(game);
  drawBounds(game);
  drawPad(game);
}

////////////////////////////////////////////////////////////////////////////////
// main p5 callback functions
function setup() {
  console.log('Welcome to Rong');
  var initialBallSpeed = 3;
  var initialBallVelocity = p5.Vector.random2D();
  initialBallVelocity.mult(initialBallSpeed);

  game = {
    score: 0,
    bounds: {
      x: 5,
      y: 5,
      width: 500,
      height: 400
    },
    ball: {
      position: createVector(25, 50),
      velocity: initialBallVelocity,
      radius: 10
    },
    pad: {
      position: createVector(20, 360),
      velocity: createVector(0, 0),
      radius: 20
    }
  };

  createCanvas(canvasWidth, canvasHeight);
}

function draw() {
  drawGame(game);
  updateGame(game);
}
