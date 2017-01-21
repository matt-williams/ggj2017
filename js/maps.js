var maps = [
  {
    scene: 0,
    size: {dx: 200, dz: 200},
    buoys: [
      {x: 60, z: 80}
    ]
  },
  {
    scene: 1,
    size: {dx: 200, dz: 200},
    buoys: [
      {x: 60, z: 80}
    ],
    untappables: [
      {x: 40, z: 60, dx: 40, dz: 40}
    ]
  },
  {
    scene: 2,
    size: {dx: 200, dz: 200},
    buoys: [
      {x: 25, z: 25},
      {x: 175, z: 25},
      {x: 25, z: 175},
      {x: 175, z: 175},
      {x: 100, z: 100}
    ]
  },
  {
    scene: 3,
    size: {dx: 300, dz: 100},
    barriers: [
      {x: 50, z: 0, dx: 250, dz: 40},
      {x: 50, z: 60, dx: 250, dz: 40}
    ],
    buoys: [
      {x: 275, z: 50, onSensitivity: -10.5}
    ],
    untappables: [
      {x: 50, z: 0, dx: 250, dz: 100}
    ]
  },
  {
    scene: 4,
    size: {dx: 300, dz: 100},
    buoys: [
      {x: 50, z: 25},
      {x: 100, z: 25},
      {x: 150, z: 25},
      {x: 200, z: 25},
      {x: 250, z: 25}
    ],
    untappables: [
      {x: 0, z: 0, dx: 300, dz: 50}
    ]
  },
  {
    scene: 5,
    size: {dx: 200, dz: 200},
    barriers: [
      {x: 90, z: 60, dx: 20, dz: 80}
    ],
    buoys: [
      {x: 60, z: 100, onSensitivity: -10.5}
    ],
    untappables: [
      {x: 0, z: 0, dx: 115, dz: 200},
      {x: 135, z: 0, dx: 65, dz: 200},
      {x: 115, z: 0, dx: 20, dz: 90},
      {x: 115, z: 110, dx: 20, dz: 90}
    ]
  },
  {
    scene: 6,
    size: {dx: 300, dz: 100},
    barriers: [
      {x: 50, z: 0, dx: 250, dz: 25},
      {x: 50, z: 75, dx: 250, dz: 25}
    ],
    buoys: [
      {x: 100, z: 50},
      {x: 150, z: 50},
      {x: 200, z: 50},
      {x: 250, z: 50}
    ],
    untappables: [
      {x: 50, z: 0, dx: 250, dz: 100}
    ]
  },
  {
    scene: 7,
    size: {dx: 100, dz: 100},
    barriers: [
      {x: 0, z: 0, dx: 80, dz: 80},
      {x: 85, z: 85, dx: 30, dz: 30, rotation: Math.PI / 4}
    ],
    buoys: [
      {x: 30, z: 90}
    ],
    untappables: [
      {x: 0, z: 80, dx: 100, dz: 20},
      {x: 80, z: 20, dx: 20, dz: 60}
    ]
  },
  {
    scene: 8,
    size: {dx: 400, dz: 200},
    barriers: [
      {x: 198, z: 0, dx: 4, dz: 80},
      {x: 198, z: 84, dx: 4, dz: 32},
      {x: 198, z: 120, dx: 4, dz: 80}
    ],
    buoys: [
      {x: 100, z: 100, onSensitivity: -10.25}
    ],
    untappables: [
      {x: 0, z: 0, dx: 200, dz: 200}
    ]
  },
  {
    scene: 9,
    size: {dx: 200, dz: 200},
    buoys: [
      {x: 180, z: 20}
    ],
    untappables: [
      {x: 0, z: 0, dx: 200, dz: 180},
      {x: 20, z: 180, dx: 180, dz: 20}
    ]
  },
  {
    scene: 10,
    size: {dx: 200, dz: 200},
    barriers: [
      {x: -40 * Math.sqrt(2), z: -40 * Math.sqrt(2), dx: 80 * Math.sqrt(2), dz: 80 * Math.sqrt(2), rotation: Math.PI / 4},
      {x: 200 - 40 * Math.sqrt(2), z: -40 * Math.sqrt(2), dx: 80 * Math.sqrt(2), dz: 80 * Math.sqrt(2), rotation: Math.PI / 4},
      {x: 200 - 40 * Math.sqrt(2), z: 200 - 40 * Math.sqrt(2), dx: 80 * Math.sqrt(2), dz: 80 * Math.sqrt(2), rotation: Math.PI / 4},
      {x: -40 * Math.sqrt(2), z: 200 - 40 * Math.sqrt(2), dx: 80 * Math.sqrt(2), dz: 80 * Math.sqrt(2), rotation: Math.PI / 4},
      {x: 40, z: 80, dx: 120, dz: 40},
      {x: 80, z: 40, dx: 40, dz: 120},
      {x: 100 - 40 * Math.sqrt(2), z: 100 - 20 * Math.sqrt(2), dx: 80 * Math.sqrt(2), dz: 40 * Math.sqrt(2), rotation: Math.PI / 4},
      {x: 100 - 40 * Math.sqrt(2), z: 100 - 20 * Math.sqrt(2), dx: 80 * Math.sqrt(2), dz: 40 * Math.sqrt(2), rotation: -Math.PI / 4}
    ],
    buoys: [
      {x: 20, z: 100},
      {x: 100, z: 20},
      {x: 180, z: 100}
    ],
    untappables: [
      {x: 0, z: 0, dx: 80, dz: 200},
      {x: 80, z: 0, dx: 40, dz: 160},
      {x: 120, z: 0, dx: 80, dz: 200}
    ]
  },
  {
    scene: 11,
    size: {dx: 100, dz: 100},
    barriers: [
      {x: 20, z: 20, dx: 60, dz: 80},
      {x: -10, z: -10, dx: 20, dz: 20, rotation: Math.PI / 4},
      {x: 90, z: -10, dx: 20, dz: 20, rotation: Math.PI / 4}
    ],
    buoys: [
      {x: 90, z: 80}
    ],
    untappables: [
      {x: 0, z: 0, dx: 100, dz: 80},
      {x: 20, z: 80, dx: 80, dz: 20}
    ]
  },
  {
    scene: 12,
    size: {dx: 100, dz: 100},
    barriers: [
      {x: 20, z: 20, dx: 60, dz: 20},
      {x: 60, z: 40, dx: 20, dz: 40},
      {x: 20, z: 40, dx: 20, dz: 60},
      {x: -10, z: -10, dx: 20, dz: 20, rotation: Math.PI / 4},
      {x: 90, z: -10, dx: 20, dz: 20, rotation: Math.PI / 4},
      {x: 90, z: 90, dx: 20, dz: 20, rotation: Math.PI / 4},
      {x: 30, z: 90, dx: 20, dz: 20, rotation: Math.PI / 4}
    ],
    buoys: [
      {x: 50, z: 50}
    ],
    untappables: [
      {x: 0, z: 0, dx: 100, dz: 80},
      {x: 20, z: 80, dx: 80, dz: 20}
    ]
  },
  {
    scene: 13,
    size: {dx: 150, dz: 150},
    barriers: [
      {x: 20, z: 20, dx: 110, dz: 110},
      {x: 100, z: 0, dx: 30, dz: 20},
      {x: 20, z: 130, dx: 30, dz: 20},
      {x: 135, z: 135, dx: 30, dz: 30, rotation: Math.PI / 4},
      {x: -15, z: -15, dx: 30, dz: 30, rotation: Math.PI / 4}
    ],
    buoys: [
      {x: 70, z: 140},
      {x: 90, z: 10}
    ],
    untappables: [
      {x: 0, z: 0, dx: 130, dz: 130},
      {x: 20, z: 130, dx: 110, dz: 20},
      {x: 130, z: 20, dx: 20, dz: 130}
    ]
  },
  {
    scene: 14,
    size: {dx: 200, dz: 200},
    barriers: [
      {x: 40, z: 60, dx: 10, dz: 40},
      {x: 50, z: 60, dx: 30, dz: 10},
      {x: 50, z: 90, dx: 20, dz: 10},
      {x: 70, z: 70, dx: 10, dz: 30, movement: {x: 75, z: 105, duration: 200}}
    ],
    buoys: [
      {x: 60, z: 80}
    ],
    untappables: [
      {x: 40, z: 60, dx: 40, dz: 40}
    ]
  },
  {
    scene: 15,
    size: {dx: 200, dz: 200},
    buoys: [
      {x: 60, z: 80}
    ],
    portals: [
      {x: 120, z: 60, dx: 2, dz: 40, px: -40, pz: 0}
    ]
  },
  {
    scene: 16,
    size: {dx: 200, dz: 200},
    barriers: [
      {x: 40, z: 60, dx: 10, dz: 40},
      {x: 50, z: 60, dx: 30, dz: 10},
      {x: 50, z: 90, dx: 20, dz: 10},
      {x: 70, z: 70, dx: 10, dz: 30}
    ],
    buoys: [
      {x: 60, z: 80, movement: {x: 100, z: 80, duration: 200}}
    ],
    untappables: [
      {x: 40, z: 60, dx: 40, dz: 40}
    ]
  },
  {
    scene: 17,
    size: {dx: 200, dz: 50},
    buoys: [
      {x: 25, z: 25}
    ],
    collectors: [
      {x: 75, z: 0, dx: 2, dz: 50, capacity: 20, yield: -1.8}
    ],
    untappables: [
      {x: 0, z: 0, dx: 100, dz: 50}
    ]
  },
  {
    scene: 18,
    untappables: [
      {x: 40, z: 60, dx: 40, dz: 40}
    ],
    size: {dx: 200, dz: 200},
    barriers: [
      {x: 40, z: 60, dx: 10, dz: 40},
      {x: 50, z: 60, dx: 30, dz: 10},
      {x: 50, z: 90, dx: 30, dz: 10},
      {x: 70, z: 70, dx: 10, dz: 20, gate: 0}
    ],
    buoys: [
      {x: 60, z: 80}
    ],
    gates: [
      {x: 20, z: 80}
    ],
    untappables: [
      {x: 40, z: 60, dx: 40, dz: 40}
    ]
  }
]
