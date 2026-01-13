export const ORDER_FLOW = [ 
    'PICKED',
    'RECEIVED',
    'WASHING',
    'IRONING',
    'READY',
    'DELIVERED'
];

export const isValidTransition = (from, to) => {
    const currentIndex = ORDER_FLOW.indexOf(from);
    const nextIndex = ORDER_FLOW.indexOf(to);
    return nextIndex === currentIndex + 1;  
};
