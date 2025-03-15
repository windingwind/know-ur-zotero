export { getColorForKey };

/**
 * Generates a stable color for the given key, using a simple hash -> HSL approach.
 * @param key - A string (e.g., the row's key) to be converted into a color.
 */
function getColorForKey(key: string): {
  borderColor: string;
  backgroundColor: string;
} {
  // 1) Compute a simple hash from the key
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  // 2) Use the hash to pick a hue in [0..360).
  //    S (saturation) and L (lightness) can be constants or vary if you prefer.
  const hue = Math.abs(hash) % 360;
  const saturation = 70; // e.g., 70%
  const lightness = 50; // e.g., 50% for the line color

  // 3) Construct HSL strings
  const borderColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  // For fill, we can use a lighter color (increasing lightness) or reduce opacity
  const backgroundColor = `hsla(${hue}, ${saturation}%, ${lightness + 30}%, 0.4)`;

  return { borderColor, backgroundColor };
}
