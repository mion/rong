lg("Loading script: vector.js");

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  distance(p) {
    return Math.sqrt(Math.pow(p.x - this.x, 2) + Math.pow(p.y - this.y, 2));
  }

  add(p) {
    return new Vector(this.x + p.x, this.y + p.y);
  }

  size() {
    return 0;
  }

  unit() {
    return new Vector(0, 0);
  }

  rotateTo(angleInRadians) {
    return new Vector(0, 0);
  }

  rotateBy(angleInRadians) {
    return new Vector(0, 0);
  }
}
