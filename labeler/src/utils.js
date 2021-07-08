export const clip = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
}