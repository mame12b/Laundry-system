export const STATUS_PERMISSIONS = {
    collector : ["RECEIVED"],
    washer: ["WASHING"],
    ironer: ["IRONING"],
    manager: ['READY'],
    driver: ['DELIVERED']
};

export const canChangeStatus = (role, newStatus) => {
    return STATUS_PERMISSIONS[role]?.includes(newStatus);
};