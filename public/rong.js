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
var CANVAS_HEIGHT = 600;
var CANVAS_WIDTH = 600;
var GAME_BOUNDS_PADDING = 5;
var GAME_BOUNDS_WIDTH = CANVAS_WIDTH - 2*GAME_BOUNDS_PADDING;
var GAME_BOUNDS_HEIGHT = CANVAS_HEIGHT - 2*GAME_BOUNDS_PADDING;
var GAME_GRAVITY_CONSTANT = 37.0;
var BALL_SPEED_BONUS_MULTIPLIER_AFTER_HIT_TARGET = 0.20; // 20%
var BALL_ARROW_SIZE_CONSTANT = 20.0;
var BALL_ARROW_HEAD_CONSTANT = 7.0;
var TAIL_SIZE = 5;
var TAIL_DELAY_MS = 50;
var TAIL_RADIUS = 5.0;

var game = null;
var tail = new Array(TAIL_SIZE);
var sounds = {};
var playerBall = null;

////////////////////////////////////////////////////////////////////////////////
// prototypes

var ScoreEvent = function(opts) {
  this.type = 'SCORE_EVENT';
  this.text = opts.text;
  this.x = opts.x;
  this.y = opts.y;
  this.timeStartedAt = (new Date()).getTime();
  this.timeToLiveMs = opts.delayMs;
  this.counter = 0;
  return this;
};

ScoreEvent.prototype.timeAlive = function () {
  var currentTime = (new Date()).getTime();
  return currentTime - this.timeStartedAt;
};

ScoreEvent.prototype.shouldBeDead = function () {
  return this.timeAlive() > this.timeToLiveMs;
};

ScoreEvent.prototype.process = function (game) {
  if (this.shouldBeDead()) {
    return true;
  } else {
    this.counter += 1;
    return false;
  }
};

var WallHitEvent = function(opts) {
  this.type = 'WALL_HIT_EVENT';
  this.wall = opts.wall;
  this.ball = opts.ball;
  return this;
}

function playTargetHitSound() {
  sounds.targetHit.setVolume(0.5);
  sounds.targetHit.play();
}

function playWallHitSound() {
  sounds.wallHit.setVolume(0.25);
  sounds.wallHit.play();
}

function playLevelUpSound() {
}

function onHitComboCounterIncrease(target, ball, game) {
  game.hitComboCounter += 1;
  game.events.push(new ScoreEvent({
    text: '+score',
    delayMs: 1000,
    x: ball.position.x,
    y: ball.position.y,
  }));
}

function onHitComboCounterDecrease(target, ball, game) {
  game.hitComboCounter -= 1;
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
        onHitComboCounterIncrease(target, this.ball, game);
        playTargetHitSound();
      } else {
        onHitComboCounterDecrease(target, this.ball, game);
        playWallHitSound();
      }
    } else if (target.type === 'TARGET_BOTTOM' && this.ball.position.y > game.center.y) {
      var targetCenterX = GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH * target.axis;
      var targetSize = GAME_BOUNDS_WIDTH * target.size;
      var targetLeftMostX = targetCenterX - (targetSize / 2);
      var targetRightMostX = targetCenterX + (targetSize / 2);
      if ((targetLeftMostX <= this.ball.position.x) && (this.ball.position.x <= targetRightMostX)) {
        updateTargetAfterHit(target, this.ball, game);
        onHitComboCounterIncrease(target, this.ball, game);
        playTargetHitSound();
      } else {
        onHitComboCounterDecrease(target, this.ball, game);
        playWallHitSound();
      }
    } else if (target.type === 'TARGET_LEFT' && this.ball.position.x < game.center.x) {
      var targetCenterY = GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT * target.axis;
      var targetSize = GAME_BOUNDS_HEIGHT * target.size;
      var targetTopMostY = targetCenterY - (targetSize / 2);
      var targetBottomMostY = targetCenterY + (targetSize / 2);
      if ((targetBottomMostY >= this.ball.position.y) && (this.ball.position.y >= targetTopMostY)) {
        updateTargetAfterHit(target, this.ball, game);
        onHitComboCounterIncrease(target, this.ball, game);
        playTargetHitSound();
      } else {
        onHitComboCounterDecrease(target, this.ball, game);
        playWallHitSound();
      }
    } else if (target.type === 'TARGET_RIGHT' && this.ball.position.x > game.center.x) {
      var targetCenterY = GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT * target.axis;
      var targetSize = GAME_BOUNDS_HEIGHT * target.size;
      var targetTopMostY = targetCenterY - (targetSize / 2);
      var targetBottomMostY = targetCenterY + (targetSize / 2);
      if ((targetBottomMostY >= this.ball.position.y) && (this.ball.position.y >= targetTopMostY)) {
        updateTargetAfterHit(target, this.ball, game);
        onHitComboCounterIncrease(target, this.ball, game);
        playTargetHitSound();
      } else {
        onHitComboCounterDecrease(target, this.ball, game);
        playWallHitSound();
      }
    }
  }
  return true;
};

////////////////////////////////////////////////////////////////////////////////
// updating functions
function updateTargetAfterHit(target, ball, game) {
  console.log('Target hit ("'+target.type+'")');
  ball.velocity.mult(1 + BALL_SPEED_BONUS_MULTIPLIER_AFTER_HIT_TARGET);
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
    var SCORE_TIME_BONUS = 1000;
    var SCORE_TIME_CONSTANT = 1 / (0.9 * 4);
    var currentTime = (new Date()).getTime();
    var timeElapsedSeconds = Math.round((currentTime - game.timeLevelStartedAt) / 1000);
    var targetHitPointsWorth =
      SCORE_BASE +
      (SCORE_SPEED_BONUS * p5.Vector.mag(ball.velocity)) +
      (SCORE_TIME_BONUS * (1 / timeElapsedSeconds * SCORE_TIME_CONSTANT));
    game.score += Math.round(targetHitPointsWorth);
    if (game.targets.length === 0) {
      console.log('level up');
      playLevelUpSound();
      game.level += 1;
      game.timeLevelStartedAt = (new Date()).getTime();
      _.each(['TARGET_TOP', 'TARGET_LEFT', 'TARGET_RIGHT', 'TARGET_BOTTOM'], function (type) {
        var size = 0.1 + (0.15 * (1 / game.level));
        var target = new Target(type, {
          size: size,
          axis: (size / 2) + (random() * (1.0 - size))
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

  if (ball.type === 'player') {
    var nextBallPos = p5.Vector.add(ball.position, ball.velocity);
    var distanceToPad = nextBallPos.dist(pad.position);
    var minimumDistanceForCollision = ball.radius + pad.radius;
    if (distanceToPad < minimumDistanceForCollision) {
      game.state = 'GAME_OVER';
    }
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

  // var idx = currentTailIndex++;
  // var t = tail[idx];
  // t.x = playerBall.position.x;
  // t.y = playerBall.position.y;

  updatePad(game);
}

////////////////////////////////////////////////////////////////////////////////
// drawing functions
function drawHUD(game) {
  var HUD_PADDING = 25;
  var HUD_TEXT_SIZE = 13;
  var GOLDEN_RATIO = 1.61803398875;
  textSize(HUD_TEXT_SIZE);
  fill('white');
  text(
    "LEVEL " + game.level,
    GAME_BOUNDS_PADDING + (HUD_PADDING / 2),
    GAME_BOUNDS_PADDING + HUD_PADDING
  );
  text(
    "SCORE " + game.score,
    GAME_BOUNDS_PADDING + (HUD_PADDING / 2),
    (HUD_TEXT_SIZE * GOLDEN_RATIO) + GAME_BOUNDS_PADDING + HUD_PADDING
  );
  var currentTime = (new Date()).getTime();
  var timeElapsedSeconds = Math.round((currentTime - game.timeLevelStartedAt) / 1000);
  text(
    "TIME " + timeElapsedSeconds,
    GAME_BOUNDS_PADDING + (HUD_PADDING / 2),
    2 * (HUD_TEXT_SIZE * GOLDEN_RATIO) + GAME_BOUNDS_PADDING + HUD_PADDING
  );
  text(
    "COMBO " + game.hitComboCounter,
    GAME_BOUNDS_PADDING + (HUD_PADDING / 2),
    3 * (HUD_TEXT_SIZE * GOLDEN_RATIO) + GAME_BOUNDS_PADDING + HUD_PADDING
  );
  text(
    "SPEED " + Math.round(playerBall.velocity.mag()),
    GAME_BOUNDS_PADDING + (HUD_PADDING / 2),
    4 * (HUD_TEXT_SIZE * GOLDEN_RATIO) + GAME_BOUNDS_PADDING + HUD_PADDING
  );
}

function drawBounds(game) {
  fill('black');
  stroke('white');
  rect(game.bounds.x, game.bounds.y, game.bounds.width, game.bounds.height);
}

function drawBall(ball) {
  // draw velocity vector
  if (ball.type === 'player') {
    stroke('gray');
    var pos = ball.position;
    var vel = ball.velocity;
    var head = p5.Vector.add(pos, p5.Vector.mult(vel, BALL_ARROW_SIZE_CONSTANT));
    var left = vel.copy();
    left.normalize();
    left.mult(BALL_ARROW_HEAD_CONSTANT);
    left.rotate(-(3/4)*PI);
    left.add(head);
    var right = vel.copy();
    right.normalize();
    right.mult(BALL_ARROW_HEAD_CONSTANT);
    right.rotate(+(3/4)*PI);
    right.add(head);

    line(pos.x, pos.y, head.x, head.y);
    line(head.x, head.y, left.x, left.y);
    line(head.x, head.y, right.x, right.y);
  }
  // draw the actuall ball
  if (ball.type === 'player') {
    fill('white');
  } else {
    fill('gray');
  }
  noStroke();
  ellipse(ball.position.x, ball.position.y, 2 * ball.radius);
  // draw the tail
  /*
  if (tail.length >= TAIL_SIZE) {
    tail.shift();
  }
  tail.push(createVector(ball.position.x, ball.position.y));
  for (var i = 0; i < tail.length; i++) {
    var point = tail[i];
    fill('blue');
    stroke('white');
    ellipse(point.x, point.y, 2.0);
  }
  */
}

function drawTarget(target) {
  var targetThickness = 5;
  fill('red');
  noStroke();
  if (target.type === 'TARGET_TOP') {
    var targetCenterX = GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH * target.axis;
    var targetSize = GAME_BOUNDS_WIDTH * target.size;
    var targetLeftMostX = targetCenterX - (targetSize / 2);
    rect(targetLeftMostX, GAME_BOUNDS_PADDING, targetSize, targetThickness);
  } else if (target.type === 'TARGET_BOTTOM') {
    var targetCenterX = GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH * target.axis;
    var targetSize = GAME_BOUNDS_WIDTH * target.size;
    var targetLeftMostX = targetCenterX - (targetSize / 2);
    rect(targetLeftMostX, GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT, targetSize, targetThickness);
  } else if (target.type === 'TARGET_LEFT') {
    var targetCenterY = GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT * target.axis;
    var targetSize = GAME_BOUNDS_HEIGHT * target.size;
    var targetTopMostY = targetCenterY - (targetSize / 2);
    var targetBottomMostY = targetCenterY + (targetSize / 2);
    rect(GAME_BOUNDS_PADDING, targetTopMostY, targetThickness, targetSize);
  } else if (target.type === 'TARGET_RIGHT') {
    var targetCenterY = GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT * target.axis;
    var targetSize = GAME_BOUNDS_HEIGHT * target.size;
    var targetTopMostY = targetCenterY - (targetSize / 2);
    var targetBottomMostY = targetCenterY + (targetSize / 2);
    rect(GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH, targetTopMostY, targetThickness, targetSize);
  } else {
    throw('unknown target type: ' + target.type);
  }
}

function drawPad(game) {
  if (keyIsDown(DOWN_ARROW)) {
    fill('orange');
    stroke('orange');
    line(game.pad.position.x, game.pad.position.y, playerBall.position.x, playerBall.position.y);
  } else if (keyIsDown(UP_ARROW)) {
    fill('purple');
    stroke('purple');
    line(game.pad.position.x, game.pad.position.y, playerBall.position.x, playerBall.position.y);
  } else {
    fill('gray');
    stroke('rgba(255, 255, 255, 0.15)');
    line(game.pad.position.x, game.pad.position.y, playerBall.position.x, playerBall.position.y);
  }
  fill('white');
  noStroke();
  ellipse(game.pad.position.x, game.pad.position.y, 2 * game.pad.radius);
}

function drawGameOverHUD(game) {
  textSize(32);
  fill('black');
  text('GAME OVER', game.center.x, game.center.y);
}

function drawTail(game) {
  for (var i = 0; i < tail.length; i++) {
    fill('white');
    noStroke();
    ellipse(tail[i].x, tail[i].y, TAIL_RADIUS);
  }
}

function drawEvent(event) {
  if (event.type === 'SCORE_EVENT') {
    fill('green');
    textSize(13);
    noStroke();
    text(event.text, event.x, event.y);
  }
}

function drawGame(game) {
  clear();
  if (game.state == 'GAME_RUNNING') {
    drawBounds(game);
    for (var i = 0; i < game.balls.length; i++) {
      var ball = game.balls[i];
      if (ball !== playerBall) {
        drawBall(ball);
      }
    }
    drawTail(game);
    drawPad(game);
    drawBall(playerBall);
    for (var i = 0; i < game.targets.length; i++) {
      var target = game.targets[i];
      drawTarget(target);
    }
    drawHUD(game);
    for (var i = 0; i < game.events.length; i++) {
      var event = game.events[i];
      drawEvent(event);
    }
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
function preload() {
  console.log('preload...');
  soundFormats('mp3', 'wav');
  sounds.wallHit = loadSound('sounds/ball2.wav');
  sounds.targetHit = loadSound('sounds/game1.mp3');
  sounds.gameOver = loadSound('sounds/game_over1.wav');
  sounds.levelUp = loadSound('sounds/game6.wav');
  console.log('done!');
}

function setup() {
  console.log('setup');

  var initialBallSpeed = 5*random();
  var initialBallVelocity = p5.Vector.random2D();
  initialBallVelocity.mult(initialBallSpeed);

  playerBall = {
    type: 'player',
    mass: 0.2,
    position: createVector(
      GAME_BOUNDS_WIDTH * random(),
      GAME_BOUNDS_HEIGHT * random()
    ),
    acceleration: createVector(0, 0),
    velocity: createVector(0, 0),
    radius: 3.5
  };
  var balls = _.times(200, function (n) {
    return {
      type: 'decoration',
      mass: 0.01,
      position: createVector(
        GAME_BOUNDS_PADDING + 5 + (random() * GAME_BOUNDS_WIDTH),
        GAME_BOUNDS_PADDING + 5 + (random() * GAME_BOUNDS_HEIGHT)
      ),
      acceleration: createVector(0, 0),
      velocity: createVector(
        random(),
        random()
      ),
      radius: 0.5 + random() * 1.0
    };
  }).concat(playerBall);

  for (var i = 0; i < TAIL_SIZE; i++) {
    tail[i] = {x: 0, y: 0};
  }

  game = {
    level: 1,
    tailSize: TAIL_SIZE,
    timeLevelStartedAt: (new Date()).getTime(),
    hitComboCounter: 0,
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

  setInterval(function() {

  }, TAIL_DELAY_MS);
}

function draw() {
  drawGame(game);
  updateGame(game);
}
