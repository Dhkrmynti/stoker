/**
 * What the 3D map tells the rest of the page, without pulling three.js into the main bundle:
 * the island's layout (published once it is built) and where the camera and the train are now
 * (written every frame, read by the mini-map on its own clock).
 */
export interface MapStation {
  key: string;
  /** the data-cam section the station belongs to */
  cam: string;
  label: string;
  x: number;
  z: number;
}

export interface MapLayout {
  cells: { x: number; z: number; color: number }[];
  track: { x: number; z: number }[];
  stations: MapStation[];
}

export const mapStore = {
  layout: null as MapLayout | null,
  cam: { x: 0, z: 0, yaw: 0 },
  train: { x: 0, z: 0 },
  /** a burn is being played out at the furnace */
  burning: false,
};

/** The stations on the island and the part of the page each one belongs to. */
export const STATIONS: MapStation[] = [
  { key: 'furnace', cam: 'hero', label: 'Furnace 0x…dEaD', x: -44, z: 0 },
  { key: 'gauge', cam: 'gauge', label: 'Gauge tower', x: -22, z: -21 },
  { key: 'whistle', cam: 'whistle', label: 'Water tower', x: -4, z: -22 },
  { key: 'coal', cam: 'coal', label: '$COAL hopper', x: 13, z: -22 },
  { key: 'pay', cam: 'even', label: 'Pay office', x: 28, z: -23 },
  { key: 'platforms', cam: 'line', label: 'Class platforms', x: 0, z: 19 },
  { key: 'logbook', cam: 'logbook', label: 'Logbook depot', x: 44, z: 11 },
  { key: 'cab', cam: 'cab', label: 'Signal box', x: 45, z: -7 },
];
