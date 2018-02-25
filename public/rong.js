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
var BALL_SPEED_BONUS_MULTIPLIER_AFTER_HIT_TARGET = 0.85;
var BALL_SPEED_WALL_DAMPING_MULTIPLIER = 0.95;
var BALL_ARROW_SIZE_CONSTANT = 20.0;
var BALL_ARROW_HEAD_CONSTANT = 7.0;
var PAD_SPEED = 0.40;
var PAD_DAMPING = 0.95;
var PAD_MASS_INCREASE_MULTIPLIER = 0.05;
var PAD_RADIUS_INCREASE_MULTIPLIER = 0.05;
var TAIL_SIZE = 5;
var TAIL_DELAY_MS = 50;
var TAIL_RADIUS = 5.0;
var EXPLOSION_PARTICLES_MULTIPLIER = 100;

var game = null;
var tail = new Array(TAIL_SIZE);
var sounds = {};
var fonts = {};
var playerBall = null;
var maximumKinecticEnergy = 1.0;

////////////////////////////////////////////////////////////////////////////////
// prototypes

var _percentage = function (obj) {
  return (_timeAlive(obj) / obj.timeToLiveMs);
};

var _timeAlive = function (obj) {
  var currentTime = (new Date()).getTime();
  return currentTime - obj.createdAt;
};

// var nextParticleId = 1;
// var Particle = function(opts) {
//   this.id = nextParticleId++;
//   this.position = createVector(opts.x, opts.y);
//   return this;
// };

function targetSizeForLevel(level) {
  return 0.65 * Math.pow(0.9, level);
}

var ExplosionEvent = function(opts) {
  this.type = 'EXPLOSION_EVENT';
  this.x = opts.x;
  this.y = opts.y;
  this.energy = opts.energy;
  this.timeToLiveMs = opts.timeToLiveMs;
  this.particles = [];
  this.timeStartedAt = (new Date()).getTime();
  this.counter = 0;
  return this;
};

ExplosionEvent.prototype.percentage = function () {
  return (this.timeAlive() / this.timeToLiveMs);
};

ExplosionEvent.prototype.timeAlive = function () {
  var currentTime = (new Date()).getTime();
  return currentTime - this.timeStartedAt;
};

ExplosionEvent.prototype.shouldBeDead = function () {
  return this.timeAlive() > this.timeToLiveMs;
};

ExplosionEvent.prototype.process = function (game) {
  var ttl = this.timeToLiveMs;
  _.times(Math.round(this.energy * EXPLOSION_PARTICLES_MULTIPLIER), function(n) {
    var speed = playerBall.velocity.mag();
    var accel = playerBall.acceleration.mag();
    var dir = playerBall.velocity.copy();
    dir.rotate(PI);
    dir.rotate((random() * HALF_PI) - (random() * HALF_PI));
    dir.normalize();
    var ball = {
      type: 'particle',
      createdAt: (new Date()).getTime(),
      timeToLiveMs: ttl,
      mass: 0.01,
      position: createVector(
        playerBall.position.x,
        playerBall.position.y
      ),
      acceleration: p5.Vector.mult(dir, random() * 5 * accel),
      velocity: p5.Vector.mult(dir, random() * 2 * speed),
      radius: 0.75 + (random() * 0.75)
    };
    game.balls.push(ball);
  });
  return true;
};

var ScoreEvent = function(opts) {
  this.type = 'SCORE_EVENT';
  this.points = opts.points;
  this.target = opts.target;
  this.x = opts.x;
  this.y = opts.y;
  this.timeStartedAt = (new Date()).getTime();
  this.timeToLiveMs = opts.delayMs;
  this.counter = 0;
  return this;
};

ScoreEvent.prototype.percentage = function () {
  return (this.timeAlive() / this.timeToLiveMs);
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
  sounds.targetHit.setVolume(0.75);
  sounds.targetHit.play();
}

function playWallHitSound() {
  sounds.wallHit.setVolume(0.25);
  sounds.wallHit.play();
}

function playLevelUpSound() {
  sounds.levelUp.setVolume(1.00);
  sounds.levelUp.play();
}

function playGameOverSound() {
  sounds.gameOver.setVolume(0.50);
  sounds.gameOver.play();
}

var objs = [
  {
    start: 0,
    end: 3,
    loopIndex: 0,
  },
  {
    start: 4,
    end: 7,
    loopIndex: 1,
  },
  {
    start: 8,
    end: 11,
    loopIndex: 2,
  },
  {
    start: 12,
    end: 15,
    loopIndex: 3,
  }
];

function onHitComboCounterIncrease(points, target, ball, game) {
  game.hitComboCounter += 1;
  // console.log('points: ' + points);
  game.events.push(new ScoreEvent({
    points: points,
    target: target,
    delayMs: 750,
    x: target.centerX,
    y: target.centerY,
  }));
  game.events.push(new ExplosionEvent({
    x: ball.position.x,
    y: ball.position.y,
    timeToLiveMs: 900,
    energy: 2.0,
  }));
  _.each(objs, function (obj) {
    if ((game.hitComboCounter >= obj.start) && (game.hitComboCounter <= obj.end)) {
      sounds.loop[obj.loopIndex].setVolume(0.5);
    } else {
      sounds.loop[obj.loopIndex].setVolume(0.0);
    }
  });
}

function onHitComboCounterDecrease(target, ball, game) {
  game.hitComboCounter -= 1;
  if (game.hitComboCounter < 0) {
    game.hitComboCounter = 0;
  }
  _.each(objs, function (obj) {
    if ((game.hitComboCounter >= obj.start) && (game.hitComboCounter <= obj.end)) {
      sounds.loop[obj.loopIndex].setVolume(0.5);
    } else {
      sounds.loop[obj.loopIndex].setVolume(0.0);
    }
  });
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
        var points = updateTargetAfterHit(target, this.ball, game);
        onHitComboCounterIncrease(points, target, this.ball, game);
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
        var points = updateTargetAfterHit(target, this.ball, game);
        onHitComboCounterIncrease(points, target, this.ball, game);
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
        var points = updateTargetAfterHit(target, this.ball, game);
        onHitComboCounterIncrease(points, target, this.ball, game);
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
        var points = updateTargetAfterHit(target, this.ball, game);
        onHitComboCounterIncrease(points, target, this.ball, game);
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
  ball.velocity.mult(BALL_SPEED_BONUS_MULTIPLIER_AFTER_HIT_TARGET);
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
      (SCORE_TIME_BONUS * (1 / (1 + timeElapsedSeconds) * SCORE_TIME_CONSTANT));
    game.score += Math.round(targetHitPointsWorth);
    if (game.targets.length === 0) {
      console.log('level up');
      playLevelUpSound();
      game.pad.radius *= 1.0 + PAD_RADIUS_INCREASE_MULTIPLIER;
      game.pad.mass *= 1.0 + PAD_MASS_INCREASE_MULTIPLIER;
      game.level += 1;
      game.timeLevelStartedAt = (new Date()).getTime();
      var types = ['TARGET_TOP', 'TARGET_LEFT', 'TARGET_RIGHT', 'TARGET_BOTTOM'];
      _.each(types, function (type) {
        var size = targetSizeForLevel(game.level);
        var target = new Target(type, {
          size: size,
          axis: (size / 2) + (random() * (1.0 - size))
        });
        game.targets.push(target);
      });
    }
    return targetHitPointsWorth;
  } else {
    throw('could not find hit target with id = ' + target.id);
  }
}

function updateBall(ball, game) {
  var pad = game.pad;
  var bounds = game.bounds;

  if (keyIsDown(SHIFT)) {
    var direction = p5.Vector.sub(pad.position, ball.position);
    var distance = ball.position.dist(pad.position);
    var force = (GAME_GRAVITY_CONSTANT * pad.mass * ball.mass) / (distance * distance);
    ball.acceleration = p5.Vector.mult(direction, force);
  } else if (keyIsDown(ESCAPE)) {
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
    ball.velocity.mult(BALL_SPEED_WALL_DAMPING_MULTIPLIER);
    if (ball.type === 'player') {
      game.events.push(new WallHitEvent({wall: 'WALL_RIGHT', ball: ball}));
    }
  } else if ((ball.position.x - ball.radius) + ball.velocity.x < bounds.x) {
    ball.position.x = bounds.x + ball.radius;
    ball.velocity.x *= -1;
    ball.velocity.mult(BALL_SPEED_WALL_DAMPING_MULTIPLIER);
    if (ball.type === 'player') {
      game.events.push(new WallHitEvent({wall: 'WALL_LEFT', ball: ball}));
    }
  } else {
    ball.position.x += ball.velocity.x;
  }

  if ((ball.position.y + ball.radius) + ball.velocity.y > bounds.y + bounds.height) {
    ball.position.y = (bounds.y + bounds.height) - ball.radius;
    ball.velocity.y *= -1;
    ball.velocity.mult(BALL_SPEED_WALL_DAMPING_MULTIPLIER);
    if (ball.type === 'player') {
      game.events.push(new WallHitEvent({wall: 'WALL_BOTTOM', ball: ball}));
    }
  } else if ((ball.position.y - ball.radius) + ball.velocity.y < bounds.y) {
    ball.position.y = bounds.y + ball.radius;
    ball.velocity.y *= -1;
    ball.velocity.mult(BALL_SPEED_WALL_DAMPING_MULTIPLIER);
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
      playGameOverSound();
    }
  }
}

function updatePad(game) {
  var bounds = game.bounds;
  var pad = game.pad;

  if (keyIsDown(LEFT_ARROW)) {
    pad.velocity.add(createVector(-PAD_SPEED, 0));
  }

  if (keyIsDown(RIGHT_ARROW)) {
    pad.velocity.add(createVector(PAD_SPEED, 0));
  }

  if (keyIsDown(UP_ARROW)) {
    pad.velocity.add(createVector(0, -PAD_SPEED));
  }

  if (keyIsDown(DOWN_ARROW)) {
    pad.velocity.add(createVector(0, PAD_SPEED));
  }

  pad.velocity.mult(PAD_DAMPING);

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

  var ballIndexesToBeRemoved = [];
  for (var i = 0; i < game.balls.length; i++) {
    var ball = game.balls[i];
    updateBall(ball, game);
    if (ball.type === 'particle') {
      var currentTime = (new Date()).getTime();
      var timeAliveMs = currentTime - ball.createdAt;
      if (timeAliveMs > ball.timeToLiveMs) {
        // tag for deletion
        ballIndexesToBeRemoved.push(i);
      }
    }
  }
  while (ballIndexesToBeRemoved.length > 0) {
    var index = ballIndexesToBeRemoved.pop();
    game.balls.splice(index, 1);
  }

  updatePad(game);
}

////////////////////////////////////////////////////////////////////////////////
// drawing functions
function drawHUD(game) {
  var HUD_PADDING = 15;
  var HUD_TEXT_SIZE = 13;
  var GOLDEN_RATIO = 1.61803398875/2;
  textSize(HUD_TEXT_SIZE);
  fill('white');
  textFont(fonts.VT323);
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
    if (keyIsDown(ESCAPE) || keyIsDown(SHIFT)) {
      stroke('rgba(255,255,255,0.75)');
    } else {
      noStroke();
    }
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
  if (ball.type === 'particle') {
    var currTime = (new Date()).getTime();
    var isDead = (currTime - ball.createdAt) >= ball.timeToLiveMs;
    var p = isDead ? '0.0' : (1.0 - ((currTime - ball.createdAt) / ball.timeToLiveMs)).toPrecision(2);
    var colorStr = 'rgba(255,255,0,'+p+')';
    fill(colorStr);
    // console.log('colorStr = ' + colorStr);
  } else if (ball.type === 'player') {
    fill('white');
  } else {
    fill('gray');
  }

  noStroke();
  if (ball.type === 'player') {
    // var KINECTIC_CONSTANT = 0.10;
    var kineticEnergy =
      playerBall.mass *
      Math.pow(playerBall.velocity.mag(), 2);
    if (kineticEnergy > maximumKinecticEnergy) {
      maximumKinecticEnergy = kineticEnergy;
    }
    var K = kineticEnergy / maximumKinecticEnergy;

    var power = K * 55;
    var r = Math.round(200 + power);
    var g = Math.round(50 + power);
    var b = Math.round(power);
    strokeWeight(1 + K * 3);
    stroke(`rgba(${r},${g},${b},${K})`);

    ellipse(
      ball.position.x,
      ball.position.y,
      (2 * ball.radius) + (K * 3)
    );
  } else {
    ellipse(ball.position.x, ball.position.y, 2 * ball.radius);
  }
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
  fill('yellow');
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
  if (keyIsDown(SHIFT)) {
    fill('orange');
    stroke('orange');
    line(game.pad.position.x, game.pad.position.y, playerBall.position.x, playerBall.position.y);
  } else if (keyIsDown(ESCAPE)) {
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
  fill('white');
  noStroke();
  textFont(fonts.VT323);
  text('GAME OVER', game.center.x, game.center.y);
  textSize(48);
  fill('rgba(200,255,25,0.9)');
  noStroke();
  text(game.score + ' pts.', game.center.x, 48 + game.center.y);
}

function drawTail(game) {
  for (var i = 0; i < tail.length; i++) {
    fill('white');
    noStroke();
    ellipse(tail[i].x, tail[i].y, TAIL_RADIUS);
  }
}

function drawEvent(event) {
  if (event.type === 'EXPLOSION_EVENT') {

  } else if (event.type === 'SCORE_EVENT') {
    textSize(11 + Math.round(4 * Math.pow(1 + event.percentage(), 1.25)));
    var prefix = '+';
    var suffix = 'pts.';
    var dirH = 0;
    var dirV = 0;
    if (event.target.type == 'TARGET_LEFT') {
      dirH = +1;
      dirV = 0;
    } else if (event.target.type == 'TARGET_RIGHT') {
      dirH = -1;
      dirV = 0;
    } else if (event.target.type == 'TARGET_TOP') {
      dirH = 0;
      dirV = 1;
    } else if (event.target.type == 'TARGET_BOTTOM') {
      dirH = 0;
      dirV = -1;
    } else {
      throw('unknown target type = ' + event.target.type);
    }

    var textString = prefix + Math.round(
      (event.percentage() > 0.60) ?
        event.points :
        (event.points * Math.pow(1.0 + event.percentage(), 2))
      ) + suffix;
    var textX = event.x + (dirH * (event.percentage() * 30));
    var textY = event.y + (dirV * (event.percentage() * 30));
    if (event.target.type == 'TARGET_BOTTOM') {
      console.log(textX+','+textY + ' => ' + textString);
    }

    fill('yellow');
    noStroke();
    textFont(fonts.VT323);
    // fill('rgba(255,255,128,0.85)');
    // text(
    //   textString,
    //   textX,
    //   textY + 0.1);
    text(
      textString,
      textX,
      textY);
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
  if (type === 'TARGET_TOP' || type === 'TARGET_BOTTOM') {
    this.centerX = GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH * opts.axis;
    this.sizeX = GAME_BOUNDS_WIDTH * opts.size;
    this.leftMostX = this.centerX - (this.sizeX / 2);
    this.rightMostX = this.centerY + (this.sizeX / 2);
    this.centerY = (type === 'TARGET_TOP') ? 0 : GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT;
  }
  if (type === 'TARGET_LEFT' || type === 'TARGET_RIGHT') {
    this.centerY = GAME_BOUNDS_PADDING + GAME_BOUNDS_HEIGHT * opts.axis;
    this.sizeY = GAME_BOUNDS_HEIGHT * opts.size;
    this.topMostY = this.centerY - (this.sizeY / 2);
    this.bottomMostY = this.centerY + (this.sizeY / 2);
    this.centerX = (type === 'TARGET_LEFT') ? 0 : GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH;
  }
  return this;
};

////////////////////////////////////////////////////////////////////////////////
// main p5 callback functions
function preload() {
  console.log('preload...');
  soundFormats('mp3', 'wav');
  sounds.wallHit = loadSound('sounds/ball2.wav');
  sounds.wallHitStronger = loadSound('sounds/rong_wall_hit.mp3');
  sounds.targetHit = loadSound('sounds/rong_target_hit.mp3');
  sounds.gameOver = loadSound('sounds/game_over1.wav');
  sounds.levelUp = loadSound('sounds/rong_target_hit_level_up.mp3');
  sounds.loop = [
    loadSound('sounds/loop_1.mp3'),
    loadSound('sounds/loop_2.mp3'),
    loadSound('sounds/loop_3.mp3'),
    loadSound('sounds/loop_4.mp3')
  ];
  fonts.VT323 = loadFont('fonts/VT323-Regular.ttf');
  fonts.Bungee = loadFont('fonts/Bungee.ttf');
  console.log('done!');
}

function setup() {
  console.log('setup');

  for (var i = 0; i < sounds.loop.length; i++) {
    sounds.loop[i].setVolume(0.0);
    sounds.loop[i].setLoop(true);
    sounds.loop[i].loop();
  }

  var initialBallSpeed = 5*random();
  var initialBallVelocity = p5.Vector.random2D();
  initialBallVelocity.mult(initialBallSpeed);

  playerBall = {
    type: 'player',
    mass: 0.4,
    position: createVector(
      GAME_BOUNDS_WIDTH * random(),
      GAME_BOUNDS_HEIGHT * random()
    ),
    acceleration: createVector(0, 0),
    velocity: createVector(0, 0),
    radius: 7.0
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
      radius: 0.25 + (random() * 0.75)
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
      new Target('TARGET_TOP', {axis: 0.5, size: 0.5}),
      new Target('TARGET_LEFT', {axis: 0.5, size: 0.5}),
      new Target('TARGET_RIGHT', {axis: 0.5, size: 0.5}),
      new Target('TARGET_BOTTOM', {axis: 0.5, size: 0.5})
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
