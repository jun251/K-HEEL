export const trafficQrValues = {
  green: "KHEEL-TRAFFIC-GREEN",
  yellow: "KHEEL-TRAFFIC-YELLOW",
  red: "KHEEL-TRAFFIC-RED",
} as const;

export type TrafficQrSignal = keyof typeof trafficQrValues;
