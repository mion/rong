var nextTargetId = 0;

var Target = function(type, opts) {
  this.id = nextTargetId++;
  this.type = type;
  this.createdAt = (new Date()).getTime();
  this.isBonus = _.defaultTo(opts.isBonus, false);
  this.axis = _.defaultTo(opts.axis, 0.5);
  this.size = _.defaultTo(opts.size, 0.25);
  this.timeToLiveMs = _.defaultTo(opts.timeToLiveMs, Infinity);
  this.fillColor = _.defaultTo(opts.fillColor, 'white');
  this.pointsWorth = _.defaultTo(opts.pointsWorth, GAME_POINTS_BASE_TARGET);
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

Target.prototype.percentage = function () {
  if (this.timeToLiveMs === Infinity) {
    return 0.0;
  } else {
    return this.timeAlive() / this.timeToLiveMs;
  }
};

Target.prototype.timeAlive = function () {
  var currentTime = (new Date()).getTime();
  return currentTime - this.createdAt;
};

Target.prototype.shouldBeDead = function () {
  return this.timeAlive() > this.timeToLiveMs;
};

Target.prototype.thickness = function () {
  return this.isBonus ? TARGET_BONUS_THICKNESS : TARGET_DEFAULT_THICKNESS;
};

Target.prototype.draw = function (game) {
  var bx = GAME_BOUNDS_PADDING
    , by = GAME_BOUNDS_PADDING
    , W = GAME_BOUNDS_WIDTH
    , H = GAME_BOUNDS_HEIGHT
    , t = Math.max(1.0, this.thickness() * (1.0 - this.percentage()))
    , a = this.axis
    , s = this.size
    , w = null
    , h = null
    , x = null
    , y = null
    ;

  if (this.type === 'TARGET_TOP') {
    x = bx + W * (a - (s / 2));
    y = by - t / 2;
    w = W * s;
    h = t;
  } else if (this.type === 'TARGET_RIGHT') {
    x = bx + W - (t / 2);
    y = by + H * (a - (s / 2));
    w = t;
    h = H * s;
  } else if (this.type === 'TARGET_BOTTOM') {
    x = bx + W * (a - (s / 2));
    y = by + H - (t / 2);
    w = W * s;
    h = t;
  } else if (this.type === 'TARGET_LEFT') {
    x = bx - (t / 2);
    y = by + H * (a - (s / 2));
    w = t;
    h = H * s;
  } else {
    console.error('Target has unknown type: ', this);
    throw('unknown target type: ' + this.type);
  }

  noStroke();
  if (this.isBonus) {
    var red = Math.round(100 * random())
    , green = 145 + Math.round(70 * random())
    , blue = 255
    , alpha = random(0.95, 0.99).toPrecision(2)
    fill(`rgba(${red}, ${green}, ${blue}, ${alpha})`);
  } else {
    fill(this.fillColor);
  }

  rect(x, y, w, h, GFX_TARGET_ROUNDED_CORNER_RADIUS);
};
