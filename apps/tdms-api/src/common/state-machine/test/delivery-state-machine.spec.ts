import { DeliveryStateMachine } from '../delivery-state-machine.js';
import { TripStatus, StopStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('DeliveryStateMachine', () => {
  describe('validateTripTransition', () => {
    it('should allow valid trip transitions', () => {
      expect(() =>
        DeliveryStateMachine.validateTripTransition(TripStatus.ASSIGNED, TripStatus.IN_TRANSIT),
      ).not.toThrow();

      expect(() =>
        DeliveryStateMachine.validateTripTransition(TripStatus.IN_TRANSIT, TripStatus.COMPLETED),
      ).not.toThrow();
    });

    it('should reject invalid transitions (e.g. COMPLETED to IN_TRANSIT)', () => {
      expect(() =>
        DeliveryStateMachine.validateTripTransition(TripStatus.COMPLETED, TripStatus.IN_TRANSIT),
      ).toThrow(BadRequestException);
    });
  });

  describe('validateStopTransition', () => {
    it('should reject marking stop DELIVERED if trip is not IN_TRANSIT', () => {
      expect(() =>
        DeliveryStateMachine.validateStopTransition(
          StopStatus.ARRIVED,
          StopStatus.DELIVERED,
          TripStatus.ASSIGNED,
        ),
      ).toThrow('Trip harus \'IN_TRANSIT\'');
    });

    it('should allow marking stop DELIVERED when trip is IN_TRANSIT and stop is ARRIVED', () => {
      expect(() =>
        DeliveryStateMachine.validateStopTransition(
          StopStatus.ARRIVED,
          StopStatus.DELIVERED,
          TripStatus.IN_TRANSIT,
        ),
      ).not.toThrow();
    });

    it('should reject invalid stop transition (e.g. DELIVERED to PENDING)', () => {
      expect(() =>
        DeliveryStateMachine.validateStopTransition(
          StopStatus.DELIVERED,
          StopStatus.PENDING,
          TripStatus.IN_TRANSIT,
        ),
      ).toThrow(BadRequestException);
    });
  });
});
