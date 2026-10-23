import { spawn } from 'node:child_process';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'eda');
const outDir = path.join(root, 'public', 'media');

/** @type {Record<string, string>} */
const NAME_TO_ID = {
  капризе: 'caprese',
  'тартар из лосося': 'tartare',
  'пене аль рагу': 'penne',
  'спагетти карбонара': 'carbonara',
  'ризотто с пармезаном': 'risotto',
  'лосось на гриле': 'salmon',
  тальята: 'tagliata',
  'полло аль лимоне': 'pollo',
  тирамису: 'tiramisu',
  'панна-котта': 'panna',
  джелато: 'gelato',
};

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXT = new Set(['.mov', '.mp4', '.m4v', '.webm']);

function normalizeBase(name) {
  return name.replace(/\s+/g, ' ').trim().toLowerCase();
}

function resolveId(baseName) {
  const key = normalizeBase(baseName);
  const id = NAME_TO_ID[key];
  if (!id) throw new Error(`Неизвестный файл: «${baseName}» (ключ «${key}»)`);
  return id;
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error('ffmpeg-static не вернул путь к бинарнику'));
      return;
    }
    const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}`));
    });
  });
}

async function convertImage(src, dest) {
  await sharp(src)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(dest);
  console.log(`image  → ${path.relative(root, dest)}`);
}

async function convertVideo(src, dest) {
  await runFfmpeg([
    '-y',
    '-i',
    src,
    '-an',
    '-vf',
    "scale='min(960,iw)':-2",
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '28',
    '-preset',
    'medium',
    '-movflags',
    '+faststart',
    dest,
  ]);
  console.log(`video  → ${path.relative(root, dest)}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const entries = await readdir(srcDir);
  /** @type {Map<string, { image?: string, video?: string }>} */
  const byId = new Map();

  for (const file of entries) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, path.extname(file));
    let id;
    try {
      id = resolveId(base);
    } catch (err) {
      console.warn(String(err.message || err));
      continue;
    }
    const slot = byId.get(id) ?? {};
    const full = path.join(srcDir, file);
    if (IMAGE_EXT.has(ext)) slot.image = full;
    else if (VIDEO_EXT.has(ext)) slot.video = full;
    else {
      console.warn(`Пропуск (расширение): ${file}`);
      continue;
    }
    byId.set(id, slot);
  }

  const expected = Object.values(NAME_TO_ID);
  for (const id of expected) {
    const slot = byId.get(id);
    if (!slot?.image) throw new Error(`Нет картинки для ${id}`);
    if (!slot?.video) throw new Error(`Нет видео для ${id}`);
  }

  for (const id of expected) {
    const slot = byId.get(id);
    await convertImage(slot.image, path.join(outDir, `${id}.webp`));
    await convertVideo(slot.video, path.join(outDir, `${id}.mp4`));
  }

  console.log(`Готово: ${expected.length} блюд → ${path.relative(root, outDir)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
