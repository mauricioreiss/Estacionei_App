export type ParkingStatus = 'OCCUPIED' | 'FREED' | 'VALIDATING' | 'EXPIRED';
export type AIValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: number;
  device_id: string;
  reputation_score: number;
  created_at: string;
}

export interface ParkingEvent {
  id: string;
  user_id: number;
  latitude: number;
  longitude: number;
  status: ParkingStatus;
  ai_validation_status: AIValidationStatus;
  created_at: string;
  updated_at: string | null;
}

export interface AllowedZone {
  id: number;
  polygon: string;
  rule_reference: string | null;
  created_at: string;
}

export interface ZonesResponse {
  events: ParkingEvent[];
  zones: AllowedZone[];
}
