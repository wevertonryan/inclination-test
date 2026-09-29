import type { MotionSample, Vector3 } from '../types';

export interface Filter {
  process(sample: MotionSample): MotionSample;
}

export function createFilter(): Filter {
  return {
    process(sample: MotionSample): MotionSample {
      return sample;
    },
  };
}
