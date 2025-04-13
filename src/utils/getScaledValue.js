export const getScaledValue = (value) => {
    const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
    return value * vmin / 10; // TODO: Readjust divisor to get the right scale
};