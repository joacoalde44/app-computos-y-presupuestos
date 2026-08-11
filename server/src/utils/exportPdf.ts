import puppeteer from "puppeteer-core";
import { construirHtmlComputo } from "./pdfTemplate";

async function resolverExecutablePath(): Promise<string> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return chromium.executablePath();
  }

  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const candidatos = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const fs = await import("fs");
  const encontrado = candidatos.find((p) => fs.existsSync(p));
  if (!encontrado) {
    throw new Error(
      "No se encontro un navegador Chrome/Edge instalado para generar el PDF en desarrollo. Configura la variable de entorno CHROME_PATH."
    );
  }
  return encontrado;
}

export async function generarPdfComputo(computo: any, logoUrl?: string | null): Promise<Buffer> {
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const executablePath = await resolverExecutablePath();

  let args: string[] = [];
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    args = chromium.args;
  }

  const browser = await puppeteer.launch({
    executablePath,
    args,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    const html = construirHtmlComputo(computo, logoUrl);
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
