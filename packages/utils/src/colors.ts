const inkOnLight = '#18181b';
const inkOnDark = '#fafafa';

export function colorMix(color: string, amount: number, into: string): string {
  return `color-mix(in srgb, ${color} ${amount}%, ${into})`;
}

export function isLight(color: string): boolean {
  return luminance(color) > 0.4;
}

export function inkOn(background: string): string {
  return isLight(background) ? inkOnLight : inkOnDark;
}

export function contrastRatio(a: string, b: string): number {
  const [darker, lighter] = [luminance(a), luminance(b)].toSorted((x, y) => x - y) as [number, number];

  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(color: string): number {
  const channels = [1, 3, 5].map((index) => {
    const value = Number.parseInt(color.slice(index, index + 2), 16) / 255;

    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}
