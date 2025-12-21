// Font loader for Satori

import { join } from "node:path";
import type { Font } from "satori";

export async function loadFonts(): Promise<Font[]> {
  const fontsDir = join(import.meta.dir, "../../assets/fonts");

  const [regularFont, mediumFont, boldFont] = await Promise.all([
    Bun.file(join(fontsDir, "IBMPlexMono-Regular.ttf")).arrayBuffer(),
    Bun.file(join(fontsDir, "IBMPlexMono-Medium.ttf")).arrayBuffer(),
    Bun.file(join(fontsDir, "IBMPlexMono-Bold.ttf")).arrayBuffer(),
  ]);

  return [
    {
      name: "IBM Plex Mono",
      data: regularFont,
      weight: 400,
      style: "normal",
    },
    {
      name: "IBM Plex Mono",
      data: mediumFont,
      weight: 500,
      style: "normal",
    },
    {
      name: "IBM Plex Mono",
      data: boldFont,
      weight: 700,
      style: "normal",
    },
  ];
}
