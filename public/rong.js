////////////////////////////////////////////////////////////////////////////////
// RONG
//  Version 0.1.0
//
// AUTHORS
//  Gabriel Vieira
//  Rafael Lopes
//  Pedro Masid

////////////////////////////////////////////////////////////////////////////////
// configuration
var game = null;
var CANVAS_HEIGHT = 600;
var CANVAS_WIDTH = 600;
var GAME_BOUNDS_PADDING = 5;
var GAME_BOUNDS_WIDTH = CANVAS_WIDTH - 2*GAME_BOUNDS_PADDING;
var GAME_BOUNDS_HEIGHT = CANVAS_HEIGHT - 2*GAME_BOUNDS_PADDING;

////////////////////////////////////////////////////////////////////////////////
// updating functions
function updateBall(ball, pad, bounds) {
  var GAME_GRAVITY_CONSTANT = 80.0;

  if (keyIsDown(DOWN_ARROW)) {
    var direction = p5.Vector.sub(pad.position, ball.position);
    var distance = ball.position.dist(pad.position);
    var force = (GAME_GRAVITY_CONSTANT * pad.mass * ball.mass) / (distance * distance);
    ball.acceleration = p5.Vector.mult(direction, force);
  } else if (keyIsDown(UP_ARROW)) {
    var direction = p5.Vector.sub(ball.position, pad.position);
    var distance = ball.position.dist(pad.position);
    var force = (GAME_GRAVITY_CONSTANT * pad.mass * ball.mass) / (distance * distance);
    ball.acceleration = p5.Vector.mult(direction, force);
  } else {
    ball.acceleration = createVector(0, 0);
  }

  ball.velocity.add(ball.acceleration);

  if ((ball.position.x + ball.radius) + ball.velocity.x > bounds.x + bounds.width) {
    ball.position.x = (bounds.x + bounds.width) - ball.radius;
    ball.velocity.x *= -1;
    ball.velocity.mult(0.90);
  } else if ((ball.position.x - ball.radius) + ball.velocity.x < bounds.x) {
    ball.position.x = bounds.x + ball.radius;
    ball.velocity.x *= -1;
    ball.velocity.mult(0.90);
  } else {
    ball.position.x += ball.velocity.x;
  }

  if ((ball.position.y + ball.radius) + ball.velocity.y > bounds.y + bounds.height) {
    ball.position.y = (bounds.y + bounds.height) - ball.radius;
    ball.velocity.y *= -1;
    ball.velocity.mult(0.90);
  } else if ((ball.position.y - ball.radius) + ball.velocity.y < bounds.y) {
    ball.position.y = bounds.y + ball.radius;
    ball.velocity.y *= -1;
    ball.velocity.mult(0.90);
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
    pad.velocity.add(createVector(-0.5, 0));
  }

  if (keyIsDown(RIGHT_ARROW)) {
    pad.velocity.add(createVector(0.5, 0));
  }

  pad.velocity.mult(0.95);

  if ((pad.position.x + pad.radius) + pad.velocity.x > bounds.x + bounds.width) {
    pad.position.x = (bounds.x + bounds.width) - pad.radius;
    pad.velocity.x *= -1;
    pad.velocity.mult(0.50);
  } else if ((pad.position.x - pad.radius) + pad.velocity.x < bounds.x) {
    pad.position.x = bounds.x + pad.radius;
    pad.velocity.x *= -1;
    pad.velocity.mult(0.50);
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
  for (var i = 0; i < game.balls.length; i++) {
    var ball = game.balls[i];
    updateBall(ball, game.pad, game.bounds);
  }
  updatePad(game);
}

////////////////////////////////////////////////////////////////////////////////
// drawing functions
function drawHUD(game) {
  var SPACE_AFTER_BOUNDS = 25;
  textSize(16);
  fill('white');
  text('Score: ' + game.score, game.bounds.x, game.bounds.y + game.bounds.height + SPACE_AFTER_BOUNDS);
}

function drawBounds(game) {
  fill('black');
  stroke('white');
  rect(game.bounds.x, game.bounds.y, game.bounds.width, game.bounds.height);
}

function drawBall(ball) {
  fill('white');
  noStroke();
  ellipse(ball.position.x, ball.position.y, 2 * ball.radius);
}

function drawPad(game) {
  if (keyIsDown(DOWN_ARROW)) {
    fill('red');
  } else if (keyIsDown(UP_ARROW)) {
    fill('blue');
  } else {
    fill('white');
  }
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
    drawBounds(game);
    for (var i = 0; i < game.balls.length; i++) {
      var ball = game.balls[i];
      drawBall(ball);
    }
    drawPad(game);
    drawHUD(game);
  } else if (game.state == 'GAME_OVER') {
    drawGameOverHUD(game);
  }
}

////////////////////////////////////////////////////////////////////////////////
// main p5 callback functions
function setup() {
  console.log('Welcome to Rong');

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
    balls: _.times(10, function (n) {
      return {
        mass: 1.0,
        position: createVector(
          GAME_BOUNDS_PADDING + 5 + (random() * GAME_BOUNDS_WIDTH),
          GAME_BOUNDS_PADDING + 5 + (random() * GAME_BOUNDS_HEIGHT)
        ),
        acceleration: createVector(0, 0),
        velocity: initialBallVelocity,
        radius: 5
      };
    }),
    pad: {
      mass: 1.0,
      position: createVector(
        GAME_BOUNDS_PADDING + (GAME_BOUNDS_WIDTH / 2),
        GAME_BOUNDS_PADDING + (GAME_BOUNDS_HEIGHT / 2)
      ),
      acceleration: createVector(0, 0),
      velocity: createVector(0, 0),
      radius: 15
    },
    events: []
  };

  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
}

function draw() {
  drawGame(game);
  updateGame(game);
}
