export const ROLE_LABELS = {
  admin: "Administrator",
  administrator: "Administrator",
  ADMIN: "Administrator",

  operator: "LOGISTICS_OPERATOR",
  logistics_operator: "LOGISTICS_OPERATOR",
  LOGISTICS_OPERATOR: "LOGISTICS_OPERATOR",

  business: "BUSINESS_CLIENT",
  business_client: "BUSINESS_CLIENT",
  BUSINESS_CLIENT: "BUSINESS_CLIENT",

  customer: "CUSTOMER",
  CUSTOMER: "CUSTOMER",

  support: "SUPPORT_AGENT",
  support_agent: "SUPPORT_AGENT",
  SUPPORT_AGENT: "SUPPORT_AGENT",
};

export const ROLE_DESCRIPTIONS = {
  admin: "Manage platform, users, security, monitoring & audits",
  administrator: "Manage platform, users, security, monitoring & audits",
  ADMIN: "Manage platform, users, security, monitoring & audits",

  operator: "Delivery personnel responsible for shipment execution",
  logistics_operator: "Delivery personnel responsible for shipment execution",
  LOGISTICS_OPERATOR: "Delivery personnel responsible for shipment execution",

  business: "Company client that sends goods through the platform",
  business_client: "Company client that sends goods through the platform",
  BUSINESS_CLIENT: "Company client that sends goods through the platform",

  customer: "Track your packages & get real-time delivery updates",
  CUSTOMER: "Track your packages & get real-time delivery updates",

  support: "Assist customers and investigate shipment issues",
  support_agent: "Assist customers and investigate shipment issues",
  SUPPORT_AGENT: "Assist customers and investigate shipment issues",
};
export const STATUS_META = {
  CREATED: {
    label: "Created",
    bg: "bg-muted text-muted-foreground",
    dot: "bg-slate-400",
  },
  REACHED_HUB: {
    label: "Reached Hub",
    bg: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  PICKED_UP: {
    label: "Picked Up",
    bg: "bg-info/10 text-info",
    dot: "bg-info",
  },
  IN_TRANSIT: {
    label: "In Transit",
    bg: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    bg: "bg-success/10 text-success",
    dot: "bg-success",
  },
  DELIVERED: {
    label: "Delivered",
    bg: "bg-success/10 text-success",
    dot: "bg-success",
  },
  ARRIVED_AT_HUB: {
    label: "Arrived at Hub",
    bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  FAILED_DELIVERY: {
    label: "Failed Delivery",
    bg: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-muted text-muted-foreground",
    dot: "bg-slate-400",
  },
  RETURNED: {
    label: "Returned to Origin",
    bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    dot: "bg-amber-500",
  },
};