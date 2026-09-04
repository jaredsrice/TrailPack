export interface ParkDefinition {
  id: string;
  name: string;
  state: string;
  parkCode: string;
}

export const PARK_DEFINITIONS: readonly ParkDefinition[] = [
  { id: "grand-teton", name: "Grand Teton National Park", state: "Wyoming", parkCode: "grte" },
];
