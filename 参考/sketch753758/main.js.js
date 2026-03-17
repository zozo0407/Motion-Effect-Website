/*
Voronoi audio visualizer

A simulation that is driven from the mic's input then displayed using a voronoi diagram.
Move the mouse to adjust the volume's sensitivity. Move it left for sound that is more quiet, and right for loud sounds.
Click to toggle debug display.

Author:
  Jason Labbe

Site:
  jasonlabbe3d.com
*/

var voronoi;
var boundingBox;
var diagram;
var volume = 0;
var volumeThreshold = 0;
var bobCount = 600;
var bobs = [];
var globalHue = 0;
var debug = false;


function setup() {
  createCanvas(windowWidth, windowHeight);
  
  colorMode(HSB, 255);
  globalHue = random(255);
  
  voronoi = new Voronoi();
  boundingBox = {
		xl: 1, 
		xr: width - 1, 
		yt: 1, 
		yb: height - 1
	};
  
	audio = new p5.AudioIn();
  audio.start();
	
	amp = new p5.Amplitude();
	amp.setInput(audio);
	amp.toggleNormalize(1);
	
	// Populate the scene with bobs and position them around the center.
  for (let i = 0; i < bobCount; i++) {
		let pos = p5.Vector.random2D();
		pos.mult(random(max(width, height) / 4));
		pos.add(width / 2, height / 2);
		bobs[i] = new Bob(pos.x, pos.y);
  }
	
	mouseX = width / 4;
}


function draw() {
	// Get mic's volume and the threshold it must exceed.
	level = amp.getLevel();
	if (level != undefined) {
		volume = map(amp.getLevel(), 0, 1, 0, 2);
	}
	
	volumeThreshold = map(mouseX, 0, width, 0.01, 1);
	
  background(0);
  
  // Simulate bobs.
  for (let i = 0; i < bobs.length; i++) {
    bobs[i].move();
  }
  
  // Collect data to draw voronoi.
  let transform = [];
  
  for (let i = 0; i < bobs.length; i++) {
		// Velocity will determine it's hue and alpha.
		let itsHue = (globalHue + bobs[i].vel.mag() * 10) % 255;
		let itsAlpha = bobs[i].vel.mag() * 20;
		
    transform.push({
			x: bobs[i].pos.x, 
      y: bobs[i].pos.y, 
      color:color(itsHue, 200, 200, itsAlpha)
		});
  }

  voronoi.recycle(diagram);
  diagram = voronoi.compute(transform, boundingBox);
  
	// Begin drawing voronoi.
  for (let i = 0; i < diagram.cells.length; i++) {
    if (!diagram.cells[i].halfedges.length) {
      continue;
    }
    
    if (debug) {
      stroke(127);
      strokeWeight(0.1);
    } else {
      noStroke();
    }
    
		fill(diagram.cells[i].site.color);
		
    beginShape();
    for (let j = 0; j < diagram.cells[i].halfedges.length; j++) {
      let v = diagram.cells[i].halfedges[j].getStartpoint();
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
  }
  
  // Draw points.
	for (let i = 0; i < bobs.length; i++) {
		if (debug) {
			stroke(255, 100);
			strokeWeight(3);
		} else {
			stroke(globalHue, 255, 255, bobs[i].vel.mag() * 5);
			strokeWeight(bobs[i].vel.mag() * 1.5);
		}

		point(bobs[i].pos.x, bobs[i].pos.y);
	}
  
	// Shift scene's hue.
	globalHue = (globalHue + 1) % 255;
	
	// Display the tooltip.
	let tooltip = "".concat(
		"Volume threshold: ", 
		volumeThreshold.toFixed(2), 
		"\n(Move the mouse to adjust the volume's sensitivity)"
	);
	
  fill(255);
  noStroke();
	text(tooltip, 50, 50);
}


function mousePressed() {
  debug = !debug;
}