// Gera AVIF + WebP em várias larguras a partir de tools/source/ e escreve
// content/_images.json (usado pelo componente Picture no build).
// Rode quando adicionar ou trocar uma imagem:  cd tools && npm i && npm run images
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname;
const srcDir = join(root, 'tools/source');
const outDir = join(root, 'public/assets/img');
const steps = [320, 480, 640, 800, 1080, 1280, 1600];

await mkdir(outDir, { recursive: true });
const manifest = {};
for (const file of (await readdir(srcDir)).sort()) {
  if (!/\.(png|jpe?g)$/i.test(file)) continue;
  const name = parse(file).name;
  const hash = createHash('sha1').update(await readFile(join(srcDir, file))).digest('hex').slice(0, 8);
  // O hash vai na URL (?v=): trocar a imagem muda o endereço e o navegador não usa a versão antiga do cache.
  const base = name;
  const img = sharp(join(srcDir, file));
  const { width, height } = await img.metadata();
  const widths = [...new Set([...steps.filter((w) => w < width), width])];
  for (const w of widths) {
    const resized = sharp(join(srcDir, file)).resize({ width: w });
    await resized.clone().avif({ quality: 55, effort: 6 }).toFile(join(outDir, `${base}-${w}.avif`));
    await resized.clone().webp({ quality: 78 }).toFile(join(outDir, `${base}-${w}.webp`));
  }
  manifest[name] = { v: hash, width, height, widths };
  console.log(`${name}: ${widths.join(', ')}`);
}
await writeFile(join(root, 'content/_images.json'), JSON.stringify(manifest, null, 2) + '\n');
