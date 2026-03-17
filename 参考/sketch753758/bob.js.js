function Bob(x, y) {
  
  this.pos = new p5.Vector(x, y);
  this.vel = p5.Vector.random2D();
  this.acc = new p5.Vector(0, 0);
  this.target = new p5.Vector(x, y);
  
  this.move = function() {
    // Add constant friction so it can eventually settle.
    this.vel.mult(0.95);
		
		let targetDist = dist(this.pos.x, this.pos.y, this.target.x, this.target.y);
		
		// Calculate multiplier that slows it down the closer it is to the target.
    let distThresh = 50; // If the bob is below this distance it should be slowing down.
		let steerMult = 1;
    if (targetDist < distThresh) {
      steerMult = targetDist / distThresh;
    }
    
    // Steer to its original position.
    if (targetDist > 1) {
      let steer = new p5.Vector(this.target.x, this.target.y);
      steer.sub(this.pos);
      steer.normalize();
      steer.mult(steerMult);
      this.acc.add(steer);
    }
    
    // Use volume as a force to push it away from the scene's center.
		// If the volume exceeds the threshold, just add a constant push.
		// This force is stronger to bobs that are nearer to the center.
		if (volume > volumeThreshold) {
			let centerDist = dist(this.pos.x, this.pos.y, width / 2, height / 2);
			let push = new p5.Vector(this.pos.x, this.pos.y);
			push.sub(new p5.Vector(width / 2, height / 2));
			push.normalize();
			push.mult(5 / centerDist * 50);  // Hate to hardcode this but good enough :)
			this.acc.add(push);
		}
		
		// Limit the velocity so it doesn't go too crazy.
		this.vel.limit(5);
		
    // Finally, move it.
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }
}