export const getScaledValue = (value) => {
    // Use vmin (viewport minimum) units for responsive scaling
    const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
    return value * vmin / 10; // Adjust divisor to get the right scale
};