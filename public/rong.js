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
function updateBall(game) {
  var ball = game.ball;
  var pad = game.pad;
  var bounds = game.bounds;

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

  var nextBallPos = p5.Vector.add(ball.position, ball.velocity);
  var distanceToPad = nextBallPos.dist(pad.position);
  var minimumDistanceForCollision = ball.radius + pad.radius;
  if (distanceToPad < minimumDistanceForCollision) {
    // var direction = p5.Vector.sub(pad.position, ball.position);
    // direction.normalize();
    // direction.rotate(-HALF_PI);
    // var speed = ball.velocity.mag();
    // ball.velocity = p5.Vector.mult(direction, speed);
    game.state = 'GAME_OVER';
  }
}

function updatePad(game) {
  var bounds = game.bounds;
  var pad = game.pad;

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
  updateBall(game);
  updatePad(game);
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
  ellipse(game.ball.position.x, game.ball.position.y, 2 * game.ball.radius);
}

function drawPad(game) {
  fill('red');
  noStroke();
  ellipse(game.pad.position.x, game.pad.position.y, 2 * game.pad.radius);
}

function drawGameOverHUD(game) {
  textSize(32);
  fill('black');
  text('GAME OVER', game.center.x, game.center.y);
}

function drawGame(game) {
  clear();
  if (game.state == 'GAME_RUNNING') {
    drawHUD(game);
    drawBall(game);
    drawBounds(game);
    drawPad(game);
  } else if (game.state == 'GAME_OVER') {
    drawGameOverHUD(game);
  }
}

////////////////////////////////////////////////////////////////////////////////
// main p5 callback functions
function setup() {
  console.log('Welcome to Rong');

  var GAME_BOUNDS_PADDING = 5;
  var GAME_BOUNDS_WIDTH = 500;
  var GAME_BOUNDS_HEIGHT = 400;

  var initialBallSpeed = 5;
  var initialBallVelocity = p5.Vector.random2D();
  initialBallVelocity.mult(initialBallSpeed);

  game = {
    state: 'GAME_RUNNING',
    score: 0,
    bounds: {
      x: GAME_BOUNDS_PADDING,
      y: GAME_BOUNDS_PADDING,
      width: GAME_BOUNDS_WIDTH,
      height: GAME_BOUNDS_HEIGHT
    },
    center: createVector(
      GAME_BOUNDS_PADDING + (GAME_BOUNDS_WIDTH / 2),
      GAME_BOUNDS_PADDING + (GAME_BOUNDS_HEIGHT / 2)
    ),
    ball: {
      mass: 1.0,
      position: createVector(25, 50),
      velocity: initialBallVelocity,
      radius: 10
    },
    pad: {
      mass: 1.0,
      position: createVector(20, 360),
      velocity: createVector(0, 0),
      radius: 20
    },
    events: []
  };

  createCanvas(canvasWidth, canvasHeight);
}

function draw() {
  drawGame(game);
  updateGame(game);
}
