console.log("Loading script: particle.js");

class Particle {
  constructor(id, opt) {
    this.id = id;
    this.dead = false;
    this.position = _.defaultTo(opt.position, new Vector(0, 0));
    this.velocity = _.defaultTo(opt.velocity, new Vector(0, 0));
    this.acceleration = _.defaultTo(opt.acceleration, new Vector(0, 0));
    this.radius = _.defaultTo(opt.radius, 2);
    this.mass = _.defaultTo(opt.mass, 1.0);
    this.color = _.defaultTo(opt.color, 'white');
  }

  kill() {
    if (this.dead) {
      return false;
    } else {
      this.dead = true;
      return true;
    }
  }

  update() {
    this.velocity = this.velocity.add(this.acceleration);
    this.position = this.position.add(this.velocity);
    return true;
  }
}
