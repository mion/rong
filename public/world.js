class World {
  constructor(opt) {
    this.width = _.defaultTo(opt.width, 100);
    this.height = _.defaultTo(opt.height, 100);
    this.nextId = 1;
    this.particles = {};
    this.targets = {};
    this.events = {};
  }

  getCenter() {
    return new Vector(this.width / 2, this.height / 2);
  }

  addParticle(opt) {
    var p = new Particle(nextId++, opt);
    this.particles[p.id] = p;
    return p;
  }

  removeParticle(id) {
    if (typeof this.particles[id] !== 'undefined') {
      delete this.particles[id];
      return true;
    } else {
      return false;
    }
  }

  update() {
    var deadParticleIds = [];
    _.forEach(this.particles, (particle, id) => {
      particle.update();
      if (particle.dead) {
        deadParticleIds.push(id);
      }
    });
    _.forEach(deadParticleIds, (id) => removeParticle(id));
  }
}
