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
// prototypes

var WallHitEvent = function(opts) {
  this.type = 'WALL_HIT_EVENT';
  this.wall = opts.wall;
  this.ball = opts.ball;
  return this;
}

WallHitEvent.prototype.process = function(game) {
  console.log('This ball hit the ' + this.wall + ' wall: ', this.ball);
  var hitTargetIndex = null;
  for (var i = 0; i < game.targets.length; i++) {
    var target = game.targets[i];
    if (target.type === 'TARGET_TOP' && this.ball.position.y < game.center.y) {
      var targetCenterX = GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH * target.axis;
      var targetSize = GAME_BOUNDS_WIDTH * target.size;
      var targetLeftMostX = targetCenterX - (targetSize / 2);
      var targetRightMostX = targetCenterX + (targetSize / 2);
      if ((targetLeftMostX <= this.ball.position.x) && (this.ball.position.x <= targetRightMostX)) {
        updateTargetAfterHit(target, this.ball, game);
      }
    } else if (target.type === 'TARGET_BOTTOM' && this.ball.position.y > game.center.y) {
      var targetCenterX = GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH * target.axis;
      var targetSize = GAME_BOUNDS_WIDTH * target.size;
      var targetLeftMostX = targetCenterX - (targetSize / 2);
      var targetRightMostX = targetCenterX + (targetSize / 2);
      if ((targetLeftMostX <= this.ball.position.x) && (this.ball.position.x <= targetRightMostX)) {
        updateTargetAfterHit(target, this.ball, game);
      }
    } else if (target.type === 'TARGET_LEFT' && this.ball.position.x < game.center.x) {
      var targetCenterY = GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT * target.axis;
      var targetSize = GAME_BOUNDS_HEIGHT * target.size;
      var targetTopMostY = targetCenterY - (targetSize / 2);
      var targetBottomMostY = targetCenterY + (targetSize / 2);
      if ((targetBottomMostY >= this.ball.position.y) && (this.ball.position.y >= targetTopMostY)) {
        updateTargetAfterHit(target, this.ball, game);
      }
    } else if (target.type === 'TARGET_RIGHT' && this.ball.position.x > game.center.x) {
      var targetCenterY = GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT * target.axis;
      var targetSize = GAME_BOUNDS_HEIGHT * target.size;
      var targetTopMostY = targetCenterY - (targetSize / 2);
      var targetBottomMostY = targetCenterY + (targetSize / 2);
      if ((targetBottomMostY >= this.ball.position.y) && (this.ball.position.y >= targetTopMostY)) {
        updateTargetAfterHit(target, this.ball, game);
      }
    }
  }
  return true;
};

////////////////////////////////////////////////////////////////////////////////
// updating functions
function updateTargetAfterHit(target, ball, game) {
  console.log('Target hit ("'+target.type+'")');
  var targetIndexToBeRemoved = null;
  for (var i = 0; i < game.targets.length; i++) {
    if (game.targets[i].id === target.id) {
      targetIndexToBeRemoved = i;
      break;
    }
  }
  if (targetIndexToBeRemoved !== null) {
    game.targets.splice(targetIndexToBeRemoved, 1);
    var SCORE_BASE = 50;
    var SCORE_SPEED_BONUS = 20;
    var SCORE_TIME_BONUS = 30;
    var targetHitPointsWorth =
      SCORE_BASE +
      (SCORE_SPEED_BONUS * p5.Vector.mag(ball.velocity)) +
      SCORE_TIME_BONUS;
    game.score += Math.round(targetHitPointsWorth);
    if (game.targets.length === 0) {
      game.level += 1;
      _.each(['TARGET_TOP', 'TARGET_LEFT', 'TARGET_RIGHT', 'TARGET_BOTTOM'], function (type) {
        var size = 0.1 + (0.15 * (1 / game.level));
        var total = ((type === 'TARGET_TOP') || (type === 'TARGET_BOTTOM')) ?
                    GAME_BOUNDS_WIDTH : GAME_BOUNDS_HEIGHT ;
        var target = new Target(type, {
          size: size,
          axis: (size / 2) + (random() * (total - size))
        });
        game.targets.push(target);
      });
    }
  } else {
    throw('could not find hit target with id = ' + target.id);
  }
}

function updateBall(ball, game) {
  var pad = game.pad;
  var bounds = game.bounds;
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
    if (ball.type === 'player') {
      game.events.push(new WallHitEvent({wall: 'WALL_RIGHT', ball: ball}));
    }
  } else if ((ball.position.x - ball.radius) + ball.velocity.x < bounds.x) {
    ball.position.x = bounds.x + ball.radius;
    ball.velocity.x *= -1;
    ball.velocity.mult(0.90);
    if (ball.type === 'player') {
      game.events.push(new WallHitEvent({wall: 'WALL_LEFT', ball: ball}));
    }
  } else {
    ball.position.x += ball.velocity.x;
  }

  if ((ball.position.y + ball.radius) + ball.velocity.y > bounds.y + bounds.height) {
    ball.position.y = (bounds.y + bounds.height) - ball.radius;
    ball.velocity.y *= -1;
    ball.velocity.mult(0.90);
    if (ball.type === 'player') {
      game.events.push(new WallHitEvent({wall: 'WALL_BOTTOM', ball: ball}));
    }
  } else if ((ball.position.y - ball.radius) + ball.velocity.y < bounds.y) {
    ball.position.y = bounds.y + ball.radius;
    ball.velocity.y *= -1;
    ball.velocity.mult(0.90);
    if (ball.type === 'player') {
      game.events.push(new WallHitEvent({wall: 'WALL_TOP', ball: ball}));
    }
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
    // game.state = 'GAME_OVER';
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

// function updateTarget(target, game) {
//   var indexesToBeRemoved = [];
//   for (var i = 0; i < game.events.length; i++) {
//     var event = game.events[i];
//     if (event.type == 'WALL_HIT_EVENT') {
//       event.process();
//       indexesToBeRemoved.push(i);
//     }
//   }
//   while (indexesToBeRemoved.length > 0) {
//     var index = indexesToBeRemoved.pop();
//     game.events.splice(index, 1);
//   }
// }

function updateGame(game) {
  var indexesToBeRemoved = [];
  for (var i = 0; i < game.events.length; i++) {
    if (game.events[i].process(game)) {
      indexesToBeRemoved.push(i);
    }
  }
  while (indexesToBeRemoved.length > 0) {
    var index = indexesToBeRemoved.pop();
    game.events.splice(index, 1);
  }

  for (var i = 0; i < game.balls.length; i++) {
    var ball = game.balls[i];
    updateBall(ball, game);
  }

  // for (var i = 0; i < game.targets.length; i++) {
  //   var target = game.targets[i];
  //   updateTarget(target, game);
  // }

  updatePad(game);
}

////////////////////////////////////////////////////////////////////////////////
// drawing functions
function drawHUD(game) {
  var SPACE_AFTER_BOUNDS = 25;
  textSize(13);
  fill('white');
  text(
    game.score + " pts.",
    GAME_BOUNDS_PADDING + SPACE_AFTER_BOUNDS/2,
    GAME_BOUNDS_PADDING + SPACE_AFTER_BOUNDS
  );
}

function drawBounds(game) {
  fill('black');
  stroke('white');
  rect(game.bounds.x, game.bounds.y, game.bounds.width, game.bounds.height);
}

function drawBall(ball) {
  if (ball.type === 'player') {
    fill('yellow');
  } else {
    fill('gray');
  }
  noStroke();
  ellipse(ball.position.x, ball.position.y, 2 * ball.radius);
}

function drawTarget(target) {
  var targetThickness = 4;
  if (target.type === 'TARGET_TOP') {
    var targetCenterX = GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH * target.axis;
    var targetSize = GAME_BOUNDS_WIDTH * target.size;
    var targetLeftMostX = targetCenterX - (targetSize / 2);
    fill('green');
    noStroke();
    rect(targetLeftMostX, GAME_BOUNDS_PADDING, targetSize, targetThickness);
  } else if (target.type === 'TARGET_BOTTOM') {
    var targetCenterX = GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH * target.axis;
    var targetSize = GAME_BOUNDS_WIDTH * target.size;
    var targetLeftMostX = targetCenterX - (targetSize / 2);
    fill('green');
    noStroke();
    rect(targetLeftMostX, GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT, targetSize, targetThickness);
  } else if (target.type === 'TARGET_LEFT') {
    var targetCenterY = GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT * target.axis;
    var targetSize = GAME_BOUNDS_HEIGHT * target.size;
    var targetTopMostY = targetCenterY - (targetSize / 2);
    var targetBottomMostY = targetCenterY + (targetSize / 2);
    fill('green');
    noStroke();
    rect(GAME_BOUNDS_PADDING, targetTopMostY, targetThickness, targetSize);
  } else if (target.type === 'TARGET_RIGHT') {
    var targetCenterY = GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT * target.axis;
    var targetSize = GAME_BOUNDS_HEIGHT * target.size;
    var targetTopMostY = targetCenterY - (targetSize / 2);
    var targetBottomMostY = targetCenterY + (targetSize / 2);
    fill('green');
    noStroke();
    rect(GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH, targetTopMostY, targetThickness, targetSize);
  } else {
    throw('unknown target type: ' + target.type);
  }
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
    for (var i = 0; i < game.targets.length; i++) {
      var target = game.targets[i];
      drawTarget(target);
    }
    drawHUD(game);
  } else if (game.state == 'GAME_OVER') {
    drawGameOverHUD(game);
  }
}

var nextTargetId = 0;

var Target = function(type, opts) {
  this.id = nextTargetId++;
  this.type = type;
  this.axis = opts.axis;
  this.size = opts.size;
  return this;
};

//
// Target.prototype.centerX = function () {
//   if (this.type === 'TARGET_TOP') {
//
//   }
// };

////////////////////////////////////////////////////////////////////////////////
// main p5 callback functions
function setup() {
  console.log('Welcome to Rong');

  var initialBallSpeed = 5*random();
  var initialBallVelocity = p5.Vector.random2D();
  initialBallVelocity.mult(initialBallSpeed);

  var balls = _.times(100, function (n) {
    return {
      type: 'decoration',
      mass: 0.1,
      position: createVector(
        GAME_BOUNDS_PADDING + 5 + (random() * GAME_BOUNDS_WIDTH),
        GAME_BOUNDS_PADDING + 5 + (random() * GAME_BOUNDS_HEIGHT)
      ),
      acceleration: createVector(0, 0),
      velocity: createVector(
        random(),
        random()
      ),
      radius: 1.0
    };
  }).concat({
    type: 'player',
    mass: 0.2,
    position: createVector(
      GAME_BOUNDS_WIDTH * random(),
      GAME_BOUNDS_HEIGHT * random()
    ),
    acceleration: createVector(0, 0),
    velocity: createVector(0, 0),
    radius: 4.5
  });

  game = {
    level: 1,
    events: [],
    state: 'GAME_RUNNING',
    score: 0,
    targets: [
      new Target('TARGET_TOP', {axis: 0.5, size: 0.125}),
      new Target('TARGET_LEFT', {axis: 0.5, size: 0.125}),
      new Target('TARGET_RIGHT', {axis: 0.5, size: 0.125}),
      new Target('TARGET_BOTTOM', {axis: 0.5, size: 0.125})
    ],
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
    balls: balls,
    pad: {
      mass: 2.5,
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
