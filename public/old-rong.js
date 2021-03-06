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

var GAME_SHOULD_LOAD_SOUNDS = false;

var GAME_POINTS_BASE_TARGET = 1000;

var PULL_GRAVITY_CONST = 30.0;
var PUSH_GRAVITY_CONST = 10.0;
var PLAYER_BALL_MASS = 0.4;
var PLAYER_BALL_RADIUS = 7.0;
var BALL_SPEED_BONUS_MULTIPLIER_AFTER_HIT_TARGET = 0.85;
var BALL_SPEED_WALL_DAMPING_MULTIPLIER = 0.75;
var PAD_MASS = 3.2;
var PAD_RADIUS = 9;
var PAD_SPEED = 0.50;
var PAD_DAMPING = 0.95;
var PAD_RADIUS_INCREASE_MULTIPLIER = 0.05;
var TARGET_BONUS_PROB = 0.15;

var GFX_TARGET_ROUNDED_CORNER_RADIUS = 0;
var TARGET_DEFAULT_THICKNESS = 10.0;
var TARGET_BONUS_THICKNESS = 7.5;
var BALL_ARROW_SIZE_CONSTANT = 20.0;
var BALL_ARROW_HEAD_CONSTANT = 7.0;
var TAIL_SIZE = 25;
var TAIL_DELAY_MS = 50;
var TAIL_RADIUS = 5.0;
var EXPLOSION_PARTICLES_MULTIPLIER = 175;

var game = null;
var tail = [];
var sounds = null;
var fonts = {};
var keyForControl = {};
var playerBall = null;
var maximumKinecticEnergy = 35.0;

////////////////////////////////////////////////////////////////////////////////
// prototypes

var _targetsForLevel = function (level) {
  return level;
};

var _ttlForTarget = function (level) {
  return 12000 + 1000 * (4 * _targetsForLevel(level));
};

var _kinecticEnergy = function (ball) {
  var kineticEnergy =
    playerBall.mass *
    Math.pow(playerBall.velocity.mag(), 2);
  if (kineticEnergy > maximumKinecticEnergy) {
    // maximumKinecticEnergy = kineticEnergy;
    kineticEnergy = maximumKinecticEnergy;
  }
  return kineticEnergy;
};

var _kinecticPercentage = function (ball) {
   return (_kinecticEnergy(ball) / maximumKinecticEnergy);
};

/* GameEvent
    The base class for all events. */

/* * * *

var _GameEvent = {
  type: 'GAME_EVENT',
  counter: 0,
  timeToLiveMs: 1000,
  createdAt: null,
  initialize: function (game) {
    this.createdAt = (new Date()).getTime();
  },
};

var createGameEvent = function (game) {
  var obj = Object.create(_GameEvent);
  obj.initialize(gmae);
  return obj;
};

* * * */

var GameEvent = function () {
  return this;
};

GameEvent.prototype.initialize = function (type, opts) {
  this.type = type;
  this.timeStartedAt = (new Date()).getTime();
  this.counter = 0;
  // Options
  opts = _.defaults(
    _.defaultTo(opts, {}), {
      x: 0,
      y: 0,
      timeToLiveMs: 1000,
    });
  this.x = opts.x;
  this.y = opts.y;
  this.timeToLiveMs = opts.timeToLiveMs;
};

GameEvent.prototype.percentage = function () {
  return (this.timeAlive() / this.timeToLiveMs);
};

GameEvent.prototype.timeAlive = function () {
  var currentTime = (new Date()).getTime();
  return currentTime - this.timeStartedAt;
};

GameEvent.prototype.shouldBeDead = function () {
  return this.timeAlive() > this.timeToLiveMs;
};

GameEvent.prototype.update = function (game) {
  if (this.shouldBeDead()) {
    return true;
  } else {
    this.counter += 1;
    return false;
  }
};

GameEvent.prototype.process = function (game) {
  return true;
};

GameEvent.prototype.draw = function (game) {
  return;
};

/* BonusEvent
    Created when a new bonus should be displayed on the screen.
*/
var BONUS_EVENT_DEFAULT_PATH_PERCENTAGE = 0.25;
var BonusEvent = function (opts) {
  this.initialize('BONUS_EVENT', opts);
  this.message = opts.message;
  this.fillColor = opts.fillColor;
  this.initialTextSize = opts.initialTextSize;
  this.finalTextSize = opts.finalTextSize;
  this.speed = _.defaultTo(opts.speed, 8.0);
  this.damping = _.defaultTo(opts.damping, 0.85);
  return this;
};

BonusEvent.prototype = new GameEvent();

BonusEvent.prototype.process = function (game) {
  var directionToCenter = p5.Vector.sub(game.center, playerBall.position);
  var distanceToCenter = directionToCenter.mag();
  directionToCenter.normalize();
  var newPosition = p5.Vector.add(
    createVector(this.x, this.y),
    p5.Vector.mult(directionToCenter, this.speed)
  );
  this.x = newPosition.x + (-2 * random()) + (2 * random());
  this.y = newPosition.y + (-2 * random()) + (2 * random());
  this.speed *= this.damping;
  return false;
};

BonusEvent.prototype.draw = function (game) {
  var delta = this.finalTextSize - this.initialTextSize;
  textSize(this.initialTextSize + (this.percentage() * delta));
  fill(this.fillColor);
  noStroke();
  text(this.message, this.x, this.y);
};

function targetSizeForLevel(level) {
  return 0.65 * Math.pow(0.9, level);
}

var ExplosionEvent = function(opts) {
  this.initialize('EXPLOSION_EVENT', opts);
  this.energy = opts.energy;
  this.isBonus = _.defaultTo(opts.isBonus, false);
  return this;
};

ExplosionEvent.prototype = new GameEvent();

ExplosionEvent.prototype.process = function (game) {
  var ttl = this.timeToLiveMs;
  var p = _kinecticPercentage(playerBall);
  var isBonus = this.isBonus;
  _.times(Math.round(20 + (0.80 * p * EXPLOSION_PARTICLES_MULTIPLIER)), function (n) {
    var speed = playerBall.velocity.mag();
    var accel = playerBall.acceleration.mag();
    var dir = playerBall.velocity.copy();
    dir.rotate(PI);
    dir.rotate((random() * HALF_PI) - (random() * HALF_PI));
    dir.normalize();
    var ball = {
      type: 'particle',
      initialKinecticPercentage: _kinecticPercentage(playerBall),
      createdAt: (new Date()).getTime(),
      timeToLiveMs: 750 + random() * 350,
      mass: 0.01,
      position: createVector(
        playerBall.position.x,
        playerBall.position.y
      ),
      isBonus: isBonus,
      acceleration: p5.Vector.mult(dir, (p + 1) * (p + 1) * 15 + random() * 10),
      velocity: p5.Vector.mult(dir, p * 7.25 + random() * 1.25),
      radius: 0.75 + (random() * 0.75)
    };
    game.balls.push(ball);
  });
  return true;
};

/* ScoreEvent
    Whenever the player hits a target.
*/
var ScoreEvent = function (opts) {
  this.initialize('SCORE_EVENT', opts);
  this.fillColor = opts.fillColor;
  this.points = opts.points;
  this.target = opts.target;
  this.textSize = _.defaultTo(opts.textSize, 11);
  return this;
};

ScoreEvent.prototype = new GameEvent();

ScoreEvent.prototype.process = function (game) {
  return false;
};

ScoreEvent.prototype.draw = function (game) {
  var prefix = '+';
  var suffix = 'pts.';
  var dirH = 0;
  var dirV = 0;

  if (this.target.type == 'TARGET_LEFT') {
    dirH = +1;
    dirV = 0;
  } else if (this.target.type == 'TARGET_RIGHT') {
    dirH = -1;
    dirV = 0;
  } else if (this.target.type == 'TARGET_TOP') {
    dirH = 0;
    dirV = 1;
  } else if (this.target.type == 'TARGET_BOTTOM') {
    dirH = 0;
    dirV = -1;
  } else {
    throw('unknown target type = ' + this.target.type);
  }

  var textString = prefix + Math.round(
    (this.percentage() > 0.60) ?
      this.points :
      (this.points * Math.pow(1.0 + this.percentage(), 2))
    ) + suffix;

  var textX = this.x + (dirH * (this.percentage() * 30));
  var textY = this.y + (dirV * (this.percentage() * 30));

  fill(this.fillColor);
  noStroke();
  textFont(fonts.VT323);
  textSize(
    this.textSize + Math.round(4 * Math.pow(1 + this.percentage(), 1.25))
  );
  text(textString, textX, textY);
};

var WallHitEvent = function (opts) {
  this.initialize('WALL_HIT_EVENT', opts);
  this.wall = opts.wall;
  this.ball = opts.ball;
  return this;
};

WallHitEvent.prototype = new GameEvent();

function playMenuSound() {
  if (!sounds) { return; }
  // sounds.menuButton.play();
}

function playTargetHitSound() {
  if (!sounds) { return; }
  var sound = _.shuffle(sounds.targetHit)[0];
  sound.setVolume(0.75);
  sound.play();
}

function playWallHitSound() {
  if (!sounds) { return; }
  sounds.wallHit.setVolume(0.25);
  sounds.wallHit.play();
}

function playLevelUpSound() {
  if (!sounds) { return; }
  sounds.levelUp.setVolume(1.00);
  sounds.levelUp.play();
}

function playGameOverSound() {
  if (!sounds) { return; }
  // sounds.gameOver.setVolume(0.50);
  // sounds.gameOver.play();
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
  var kp = _kinecticPercentage(ball);
  game.hitComboCounter += 1;
  game.events.push(new ScoreEvent({
    points: points,
    target: target,
    timeToLiveMs: kp > 0.75 ? 950 : 750,
    fillColor: kp > 0.75 ? 'yellow' : 'white',
    x: target.centerX,
    y: target.centerY,
    textSize: kp > 0.75 ? 16 : 11,
  }));
  game.events.push(new ExplosionEvent({
    x: ball.position.x,
    y: ball.position.y,
    timeToLiveMs: 900,
    energy: (kp > 0.75 ? 2 : 1) * _kinecticEnergy(ball),
    initialKinecticPercentage: _kinecticPercentage(ball),
    isBonus: target.isBonus
  }));

  if (target.isBonus) {
    game.events.push(new BonusEvent({
      x: ball.position.x,
      y: ball.position.y,
      timeToLiveMs: 510,
      message: `BONUS HIT`,
      fillColor: 'rgba(60, 190, 255, 0.95)',
      initialTextSize: 14,
      finalTextSize: 28,
      speed: 24
    }));
  }

  game.events.push(new BonusEvent({
    x: ball.position.x,
    y: ball.position.y,
    timeToLiveMs: 470,
    message: `${game.hitComboCounter}x COMBO`,
    fillColor: 'rgba(255, 245, 235, 0.85)',
    initialTextSize: 12,
    finalTextSize: 20,
    speed: 18
  }));

  if (kp > 0.75) {
    game.events.push(new BonusEvent({
      x: ball.position.x,
      y: ball.position.y,
      timeToLiveMs: 550,
      message: `SPEED BONUS`,
      fillColor: 'rgba(255, 165, 5, 0.95)',
      initialTextSize: 13,
      finalTextSize: 26,
      speed: 20
    }));
  }

  if (!sounds) { return; }
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

  if (!sounds) { return; }
  _.each(objs, function (obj) {
    if ((game.hitComboCounter >= obj.start) && (game.hitComboCounter <= obj.end)) {
      sounds.loop[obj.loopIndex].setVolume(0.5);
    } else {
      sounds.loop[obj.loopIndex].setVolume(0.0);
    }
  });
}

WallHitEvent.prototype.process = function(game) {
  console.log('The player ball hit the ' + this.wall + ' wall: ', this.ball);
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
function createTarget(bounds) {

}

function updateTargetAfterHit(target, ball, game) {
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

    if (_.filter(game.targets, function (t) { return !t.isBonus; }).length === 0) {
      game.targets = [];
      console.log('level up');
      playLevelUpSound();
      game.pad.radius *= 1.0 + PAD_RADIUS_INCREASE_MULTIPLIER;
      game.level += 1;
      game.timeLevelStartedAt = (new Date()).getTime();

      // create easy targets
      var types = [
        'TARGET_TOP',
        'TARGET_LEFT',
        'TARGET_RIGHT',
        'TARGET_BOTTOM'
      ];
      _.each(types, function (type) {
        var targetsToBeCreated = _targetsForLevel(game.level);
        var maxTargetSize = 1.0 / targetsToBeCreated;
        for (var i = 0; i < targetsToBeCreated; i++) {
          var shouldBeBonus = random() < TARGET_BONUS_PROB;
          game.targets.push(new Target(type, {
            size: maxTargetSize,
            axis: (i * maxTargetSize) + (maxTargetSize / 2),
            timeToLiveMs: shouldBeBonus ? random(3000, 9500) : _ttlForTarget(game.level),
            isBonus: shouldBeBonus
          }));
        }
      });
      console.log('New targets created:', game.targets);
    }
    return targetHitPointsWorth;
  } else {
    throw('could not find hit target with id = ' + target.id);
  }
}

function updateBall(ball, game) {
  var pad = game.pad;
  var bounds = game.bounds;

  if (keyIsDown(keyForControl.PULL)) {
    var direction = p5.Vector.sub(pad.position, ball.position);
    var distance = ball.position.dist(pad.position);
    var force = (PULL_GRAVITY_CONST * pad.mass * ball.mass) / (distance * distance);
    ball.acceleration = p5.Vector.mult(direction, force);
  } else if (keyIsDown(keyForControl.PUSH)) {
    var direction = p5.Vector.sub(ball.position, pad.position);
    var distance = ball.position.dist(pad.position);
    var force = (PUSH_GRAVITY_CONST * pad.mass * ball.mass) / (distance * distance);
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
  } else if ((ball.position.y + ball.radius) + ball.velocity.y > bounds.y + bounds.height) {
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
    ball.position.x += ball.velocity.x;
    ball.position.y += ball.velocity.y;
  }

  if (ball.type === 'player') {
    // update tail
    tail.push(ball.position.copy());
    if (tail.length > TAIL_SIZE) {
      tail.shift();
    }
    // check collision
    var nextBallPos = p5.Vector.add(ball.position, ball.velocity);
    var distanceToPad = nextBallPos.dist(pad.position);
    var minimumDistanceForCollision = ball.radius + pad.radius;
    if (distanceToPad < minimumDistanceForCollision) {
      game.state = 'GAME_OVER';
      playGameOverSound();
    }
  }
}

var PAD_ANGULAR_SPEED = 0.0125;
var PAD_ORBIT = 125.0;

function updatePad(game) {
  var bounds = game.bounds;
  var pad = game.pad;

  pad.angle += pad.direction * PAD_ANGULAR_SPEED;
  pad.position.x = game.center.x + PAD_ORBIT * Math.cos(pad.angle);
  pad.position.y = game.center.y + PAD_ORBIT * Math.sin(pad.angle);

  /*
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
  */
}

function updateEvents(game) {
  var indexesToBeRemoved = [];
  for (var i = 0; i < game.events.length; i++) {
    var isEventFinished = game.events[i].update(game);
    var isEventProcessed = game.events[i].process(game);
    if (isEventFinished || isEventProcessed) {
      indexesToBeRemoved.push(i);
    }
  }
  while (indexesToBeRemoved.length > 0) {
    var index = indexesToBeRemoved.pop();
    game.events.splice(index, 1);
  }
}

function updateBalls(game) {
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
}

function updateTargets(game) {
  var indexesToBeRemoved = [];
  for (var i = 0; i < game.targets.length; i++) {
    var target = game.targets[i];
    if (target.shouldBeDead()) {
      indexesToBeRemoved.push(i);
    }
  }
  while (indexesToBeRemoved.length > 0) {
    var index = indexesToBeRemoved.pop();
    game.targets.splice(index, 1);
  }
}

function updateGame(game) {
  updateEvents(game);
  updateBalls(game);
  updatePad(game);
  updateTargets(game);
  if (game.targets.length === 0) {
    game.state = 'GAME_OVER';
    playGameOverSound();
  }
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
  stroke('rgba(255, 255, 255, 0.25)');
  strokeWeight(0.5);
  rect(game.bounds.x, game.bounds.y, game.bounds.width, game.bounds.height);
}

function drawBall(ball) {
  // draw velocity vector
  if (ball.type === 'player') {
    // if (keyIsDown(ESCAPE) || keyIsDown(SHIFT)) {
    //   stroke('rgba(255,255,255,0.75)');
    // } else {
    //   noStroke();
    // }
    // var pos = ball.position;
    // var vel = ball.velocity;

    // var head = p5.Vector.add(pos, vel);
    // var left = vel.copy();
    // left.normalize();
    // left.mult(BALL_ARROW_HEAD_CONSTANT);
    // left.rotate(-(3/4)*PI);
    // left.add(head);
    // var right = vel.copy();
    // right.normalize();
    // right.mult(BALL_ARROW_HEAD_CONSTANT);
    // right.rotate(+(3/4)*PI);
    // right.add(head);
    //
    // triangle(
    //   head.x, head.y,
    //   left.x, left.y,
    //   right.x, right.y
    // );

    // line(pos.x, pos.y, head.x, head.y);
    // line(head.x, head.y, left.x, left.y);
    // line(head.x, head.y, right.x, right.y);
  }

  // draw the actuall ball
  if (ball.type === 'particle') {
    var currTime = (new Date()).getTime();
    var isDead = (currTime - ball.createdAt) >= ball.timeToLiveMs;
    var p = isDead ? '0.0' : (1.0 - ((currTime - ball.createdAt) / ball.timeToLiveMs)).toPrecision(2);
    if (ball.isBonus) {
      fill('rgba(60,190,255,'+random().toPrecision(2)+')');
    } else if (ball.initialKinecticPercentage < 0.75) {
      fill('rgba(255,255,255,'+random().toPrecision(2)+')');
    } else {
      var colorStr = 'rgba(255,155,5,'+random().toPrecision(2)+')';
      fill(colorStr);
    }
    // console.log('colorStr = ' + colorStr);
  } else if (ball.type === 'player') {
    if (_kinecticPercentage(ball) < 0.75) {
      fill('rgba(255,255,255,'+random().toPrecision(2)+')');
    } else if (_kinecticPercentage(ball) < 0.90) {
      var perc = (1.0 - _kinecticPercentage(ball)) / 0.25;
      fill(`rgb(250, ${Math.round(160 + 50 * perc)}, 5)`);
    } else {
      fill('rgba(250,175,5,'+random().toPrecision(2)+')');
    }
  } else {
    fill('rgba(255,255,255,0.35)');
  }

  noStroke();
  if (ball.type === 'player') {
    var KINECTIC_CONSTANT = 0.10;
    var kineticEnergy =
      playerBall.mass *
      Math.pow(playerBall.velocity.mag(), 2);
    if (kineticEnergy > maximumKinecticEnergy) {
      // maximumKinecticEnergy = kineticEnergy;
      kineticEnergy = maximumKinecticEnergy;
    }
    var K = kineticEnergy / maximumKinecticEnergy;

    var r = Math.round(250);
    var g = Math.round(160 + 50 * K);
    var b = Math.round(5);
    strokeWeight(1 + (10 * K));
    stroke(`rgba(${r},${g},${b},${K / 2.5})`);
    // var perc = (1.0 - _kinecticPercentage(ball)) / 0.25;
    // stroke(`rgb(250, ${Math.round(160 + 50 * perc)}, 5, ${perc.toPrecision(2)})`);

    ellipse(
      ball.position.x,
      ball.position.y,
      (1 * ball.radius) + (K * ball.radius)
    );
  } else {
    ellipse(ball.position.x, ball.position.y, 2 * ball.radius);
  }

  // draw the tail
  /* * * DEAD

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

  * * */
}

/* * * DEAD

function drawTarget(target) {
  var targetThickness = 5;
  fill('white');
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

* * */

function drawPad(game) {
  // draw orbit
  stroke('rgba(255,255,255,0.5)');
  noFill();
  ellipse(game.center.x, game.center.y, 2 * PAD_ORBIT);
  // draw ball
  noFill();
  var BEAM_ALPHA_ON = 0.5;
  var BEAM_ALPHA_OFF = 0.0;
  if (keyIsDown(keyForControl.PULL)) {
    stroke(`rgba(255, 255, 255, ${BEAM_ALPHA_ON})`);
    line(game.pad.position.x, game.pad.position.y, playerBall.position.x, playerBall.position.y);
  } else if (keyIsDown(keyForControl.PUSH)) {
    stroke(`rgba(255, 255, 255, ${BEAM_ALPHA_ON})`);
    line(game.pad.position.x, game.pad.position.y, playerBall.position.x, playerBall.position.y);
  } else {
    stroke(`rgba(255, 255, 255, ${BEAM_ALPHA_OFF})`);
    line(game.pad.position.x, game.pad.position.y, playerBall.position.x, playerBall.position.y);
  }
  fill('white');
  noStroke();
  ellipse(game.pad.position.x, game.pad.position.y, 2 * game.pad.radius);
}

function drawGameOverHUD(game) {
  // black cover
  fill('rgba(0, 0, 0, 0.838)');
  rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // game over
  textFont(fonts.VT323);
  textSize(32);
  fill('white');
  noStroke();
  text('GAME OVER', game.center.x, game.center.y);
  // score
  textSize(48);
  fill('rgba(200,255,25,0.9)');
  noStroke();
  text(game.score + ' pts.', game.center.x, 48 + game.center.y);
}

function drawTail(game) {
  for (var i = 0; i < tail.length; i++) {
    var p = ((i + 1) / tail.length);
    if (_kinecticPercentage(playerBall) < 0.75) {
      var clr = Math.round(255 * p);
      stroke(`rgba(${clr},${clr},${clr}, ${(p / 2).toPrecision(2)})`);
      noFill();
    } else {
      noStroke();
      fill('rgba(250, 165, 5, ' + p.toPrecision(2) + ')');
      // fill(`rgba(250, ${Math.round(160 + 50 * perc)}, 5, ${(p / 2).toPrecision(2)})`);
    }
    ellipse(tail[i].x, tail[i].y, (p * TAIL_RADIUS));
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

function drawRunningGame(game) {
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
    target.draw(game);
  }
  drawHUD(game);
  for (var i = 0; i < game.events.length; i++) {
    var event = game.events[i];
    event.draw(game);
  }
}

function drawStartedGame(game) {
  noStroke();
  textFont(fonts.VT323);
  fill('yellow');
  textSize(72);
  var x = GAME_BOUNDS_PADDING + GAME_BOUNDS_WIDTH * (0.20);
  text("RONG", x, game.center.y);
  fill('gray');
  textSize(18);
  text("version 0.1.0", x, 20 + game.center.y);

  var clr_on = 'yellow';
  var clr_off = 'white';
  fill(game.menu.start.newGameSelected ? clr_on : clr_off);
  textSize(32);
  text("> New game", x, 120 + game.center.y);

  fill(game.menu.start.highscoreSelected ? clr_on : clr_off);
  textSize(32);
  text("> Highscore", x, 160 + game.center.y);

  fill(game.menu.start.credisSelected ? clr_on : clr_off);
  textSize(32);
  text("> Credits", x, 200 + game.center.y);
}

function drawGame(game) {
  clear();
  if (game.state == 'GAME_START') {
    drawStartedGame(game);
  } else if (game.state == 'GAME_RUNNING') {
    drawRunningGame(game);
  } else if (game.state == 'GAME_OVER') {
    drawRunningGame(game);
    drawGameOverHUD(game);
  }
}

////////////////////////////////////////////////////////////////////////////////
// main p5 callback functions
function preload() {
  var ct = (new Date()).getTime();
  console.log('preloading...');
  if (GAME_SHOULD_LOAD_SOUNDS) {
    sounds = {};
    soundFormats('wav');
    sounds.wallHit = loadSound('sounds/ball2.wav');
    sounds.targetHit = [
      loadSound('sounds/sfx_ball_hit_a.wav'),
      loadSound('sounds/sfx_ball_hit_b.wav'),
      loadSound('sounds/sfx_ball_hit_c.wav')
    ];
    sounds.bgLoopGameOver = loadSound('sounds/sfx_bg_loop_game_over.wav');
    sounds.bgLoopMenu = loadSound('sounds/sfx_bg_loop_menu.wav');
    sounds.levelUp = loadSound('sounds/sfx_level_up.wav');
    sounds.loop = [
      loadSound('sounds/sfx_tension_1.wav'),
      loadSound('sounds/sfx_tension_2.wav'),
      loadSound('sounds/sfx_tension_3.wav'),
      loadSound('sounds/sfx_tension_4.wav')
    ];
  }
  fonts.VT323 = loadFont('fonts/VT323-Regular.ttf');
  var ft = (new Date()).getTime();
  var et = ((ft - ct) / 1000).toPrecision(2) + " sec.";
  console.log(`done! (${et})`);
}

function createGame() {
  keyForControl['PULL'] = DOWN_ARROW;
  keyForControl['PUSH'] = UP_ARROW;

  var initialBallSpeed = 5*random();
  var initialBallVelocity = p5.Vector.random2D();
  initialBallVelocity.mult(initialBallSpeed);

  playerBall = {
    type: 'player',
    mass: PLAYER_BALL_MASS,
    position: createVector(
      GAME_BOUNDS_WIDTH * random(),
      GAME_BOUNDS_HEIGHT * random()
    ),
    acceleration: createVector(0, 0),
    velocity: createVector(0, 0),
    radius: PLAYER_BALL_RADIUS
  };

  var balls = _.times(200, function (n) {
    return {
      type: 'decoration',
      mass: 0.05,
      position: createVector(
        GAME_BOUNDS_PADDING + 5 + (random() * GAME_BOUNDS_WIDTH),
        GAME_BOUNDS_PADDING + 5 + (random() * GAME_BOUNDS_HEIGHT)
      ),
      acceleration: createVector(0, 0),
      velocity: createVector(
        random(),
        random()
      ),
      radius: 0.3 + (random() * 0.65)
    };
  }).concat(playerBall);

  return {
    level: 1,
    menu: {
      start: {
        newGameSelected: true,
        highscoreSelected: false,
        creditsSelected: false
      },
      pause: {

      },
      gameOver: {

      }
    },
    timeLevelStartedAt: (new Date()).getTime(),
    hitComboCounter: 0,
    events: [],
    state: 'GAME_START',
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
      angle: 0,
      direction: 1,
      mass: PAD_MASS,
      position: createVector(
        GAME_BOUNDS_PADDING + (GAME_BOUNDS_WIDTH / 2),
        GAME_BOUNDS_PADDING + (GAME_BOUNDS_HEIGHT / 2)
      ),
      acceleration: createVector(0, 0),
      velocity: createVector(0, 0),
      radius: PAD_RADIUS
    },
    events: []
  };
}

function setup() {
  console.log('setup');

  if (GAME_SHOULD_LOAD_SOUNDS) {
    for (var i = 0; i < sounds.loop.length; i++) {
      sounds.loop[i].setVolume(0.0);
      sounds.loop[i].setLoop(true);
      sounds.loop[i].loop();
    }
  }

  game = createGame();

  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
}

function draw() {
  updateGame(game);
  drawGame(game);
}

function keyPressed(event) {
  console.log('Key value pressed:', event.key);
  console.log('Key code pressed:', event.code);
  if (game.state === 'GAME_START') {
    playMenuSound();
    if (event.key === 'ArrowDown') {
      if (game.menu.start.newGameSelected) {
        game.menu.start.newGameSelected = false;
        game.menu.start.highscoreSelected = true;
        game.menu.start.credisSelected = false;
      } else if (game.menu.start.highscoreSelected) {
        game.menu.start.newGameSelected = false;
        game.menu.start.highscoreSelected = false;
        game.menu.start.credisSelected = true;
      } else {
        game.menu.start.newGameSelected = true;
        game.menu.start.highscoreSelected = false;
        game.menu.start.credisSelected = false;
      }
    } else if (event.key === 'ArrowUp') {
      if (game.menu.start.newGameSelected) {
        game.menu.start.newGameSelected = false;
        game.menu.start.highscoreSelected = false;
        game.menu.start.credisSelected = true;
      } else if (game.menu.start.highscoreSelected) {
        game.menu.start.newGameSelected = true;
        game.menu.start.highscoreSelected = false;
        game.menu.start.credisSelected = false;
      } else {
        game.menu.start.newGameSelected = false;
        game.menu.start.highscoreSelected = true;
        game.menu.start.credisSelected = false;
      }
    } else if (event.key === 'Enter') {
      if (game.menu.start.newGameSelected) {
        game.state = 'GAME_RUNNING';
      } else if (game.menu.highscoreSelected) {
        game.state = 'GAME_HIGHSCORE';
      } else {
        game.state = 'GAME_CREDITS';
      }
    }
  } else if (game.state === 'GAME_RUNNING') {

  } else if (game.state === 'GAME_OVER') {
    game = createGame();
  }
}
