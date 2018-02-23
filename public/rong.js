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
function updateBall(ball, bounds) {
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
}

function updateGame(game) {
  updateBall(game.ball, game.bounds);
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
  ellipse(game.ball.position.x, game.ball.position.y, game.ball.radius);
}

////////////////////////////////////////////////////////////////////////////////
// main p5 callback functions
function setup() {
  console.log('Welcome to Rong');
  game = {
    score: 0,
    bounds: {
      x: 5,
      y: 5,
      width: 500,
      height: 400
    },
    ball: {
      position: {x: 25, y: 50},
      velocity: {x: 2, y: 6},
      radius: 10
    }
  };
  createCanvas(canvasWidth, canvasHeight);
}

function draw() {
  clear();
  drawHUD(game);
  drawBall(game);
  drawBounds(game);
  updateGame(game);
}
