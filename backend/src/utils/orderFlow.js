export const ORDER_FLOW = [
  "PICKED",
  "RECEIVED",
  "WASHING",
  "IRONING",
  "READY",
  "DELIVERED",
];

export const isValidTransition = (from, to) => {
  if (!from || !to) return false;

  const fromIndex = ORDER_FLOW.indexOf(from);
  const toIndex = ORDER_FLOW.indexOf(to);

  if (fromIndex === -1 || toIndex === -1) return false;

  return toIndex === fromIndex + 1;
};

export const ROLE_NEXT_STATUS = {
  Collector: "RECEIVED",   // PICKED → RECEIVED
  Washer: "WASHING",       // RECEIVED → WASHING
  Ironer: "IRONING",       // WASHING → IRONING
  Driver: "DELIVERED",     // READY → DELIVERED
};


