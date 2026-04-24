export const ROLES = {
  COLLECTOR: "COLLECTOR",
  WASHER: "WASHER",
  SORTER: "SORTER",
  IRONER: "IRONER",
  DRIVER: "DRIVER",
  CASHIER: "CASHIER",
  MANAGER: "MANAGER",
  HOTEL: "HOTEL",
};

export function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

export const canAccess = {
  home: () => true,
  dashboard: (role) => [ROLES.MANAGER, ROLES.CASHIER, ROLES.COLLECTOR].includes(role),
  orders: () => true,
  payments: (role) => [ROLES.CASHIER, ROLES.MANAGER].includes(role),
  reports: (role) => [ROLES.MANAGER].includes(role),
  prices: (role) => [ROLES.MANAGER].includes(role),
  customers: (role) => [ROLES.MANAGER, ROLES.COLLECTOR].includes(role),
  users: (role) => [ROLES.MANAGER].includes(role),
  invoices: (role) => [ROLES.MANAGER, ROLES.CASHIER].includes(role),
};

export function canUpdateOrderStatus(role, currentStatus) {
  if (role === ROLES.MANAGER) return true;
  if (role === ROLES.COLLECTOR && currentStatus === "PICKED") return true;
  if (role === ROLES.WASHER && currentStatus === "RECEIVED") return true;
  if (role === ROLES.SORTER && currentStatus === "WASHING") return true;
  if (role === ROLES.IRONER && currentStatus === "IRONING") return true;
  if (role === ROLES.DRIVER && currentStatus === "READY") return true;
  return false;
}