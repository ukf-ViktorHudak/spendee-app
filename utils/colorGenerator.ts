export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generating pastel/neon-ish colors suitable for dark mode
  // We manipulate HSL to ensure visibility
  const h = Math.abs(hash % 360);
  const s = 70; // High saturation
  const l = 60; // Medium lightness for contrast against dark bg
  
  return `hsl(${h}, ${s}%, ${l}%)`;
};