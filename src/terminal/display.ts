// Terminal image display using terminal-image

import terminalImage from "terminal-image";

export async function displayInTerminal(pngBuffer: Buffer): Promise<boolean> {
  try {
    const image = await terminalImage.buffer(pngBuffer, {
      width: "20%",
      preferNativeRender: true,
      preserveAspectRatio: true,
    });
    console.log(image);
    return true;
  } catch {
    return false;
  }
}

export function getTerminalName(): string {
  return process.env.TERM_PROGRAM || process.env.TERM || "unknown";
}
