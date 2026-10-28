export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface GeofenceResult {
  verified: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
}

export enum StopStatus {
  PENDING = 'PENDING',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RTO = 'RTO',
}

export enum TripStatus {
  ASSIGNED = 'ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum LedgerAccountCode {
  CASH_DRIVER = '101-CASH-DRIVER',
  CASH_HUB = '102-CASH-HUB',
  COD_RECEIVABLE = '110-COD-RECEIVABLE',
  MERCHANT_PAYABLE = '201-MERCHANT-PAYABLE',
  DRIVER_REIMBURSEMENT = '202-DRIVER-REIMBURSEMENT',
  DELIVERY_REVENUE = '401-DELIVERY-REVENUE',
  TOLL_EXPENSE = '501-TOLL-EXPENSE',
}
