export interface JellyfishConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  coreRadius: number;
  tentacleLength: number;
  tentacleSpread: number;
  particleCount: number;
  movementSpeed: number;
  noiseStrength: number;
}

export interface HandInputState {
  tension: number; // 0 to 1, derived from hand closed/tension
  activity: number; // 0 to 1, derived from movement speed
  x: number; // -1 to 1
  y: number; // -1 to 1
}

export enum CameraStatus {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  DENIED = 'DENIED',
  ERROR = 'ERROR'
}
