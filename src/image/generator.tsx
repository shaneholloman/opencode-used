// Image generator using Satori and Resvg

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { WrappedTemplate } from "./template";
import type { OpenCodeStats } from "../types";
import { loadFonts } from "./fonts";
import { HEIGHT, WIDTH } from "../constants";
export async function generateImage(stats: OpenCodeStats): Promise<Buffer> {
  const fonts = await loadFonts();

  // Generate SVG using Satori
  const svg = await satori(<WrappedTemplate stats={stats} />, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });

  // Convert SVG to PNG using Resvg
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: WIDTH,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return Buffer.from(pngBuffer);
}
