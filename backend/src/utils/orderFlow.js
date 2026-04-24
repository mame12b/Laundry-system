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

// Keys MUST match req.user.role exactly (as stored in DB - Title case)
export const ROLE_NEXT_STATUS = {
  Collector: "RECEIVED",   // PICKED → RECEIVED
  Washer:    "WASHING",    // RECEIVED → WASHING
  Sorter:    "IRONING",    // WASHING → IRONING
  Ironer:    "READY",      // IRONING → READY
  Driver:    "DELIVERED",  // READY → DELIVERED
};