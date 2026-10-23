import { assetUrl } from './assets';
import type { Category, MenuData, MenuItem } from '../types';

export class MenuError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MenuError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new MenuError(`${label}: поле «${key}» должно быть непустой строкой.`);
  }
  return value.trim();
}

function readNumber(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new MenuError(`${label}: поле «${key}» должно быть числом.`);
  }
  return value;
}

function readBoolean(record: Record<string, unknown>, key: string, label: string): boolean {
  const value = record[key];
  if (typeof value !== 'boolean') {
    throw new MenuError(`${label}: поле «${key}» должно быть true или false.`);
  }
  return value;
}

function readTags(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new MenuError(`${label}: поле «tags» должно быть списком строк.`);
  }
  return value.map((tag, index) => {
    if (typeof tag === 'string' && tag.trim()) return tag.trim();
    if (isRecord(tag)) {
      const inner = Object.values(tag).find((entry) => typeof entry === 'string' && entry.trim());
      if (typeof inner === 'string') return inner.trim();
    }
    throw new MenuError(`${label}: тег ${index + 1} должен быть строкой.`);
  });
}

function readVideo(value: unknown, label: string): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') {
    throw new MenuError(`${label}: поле «video» должно быть строкой или null.`);
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function parseCategory(value: unknown, index: number): Category {
  const label = `Категория ${index + 1}`;
  if (!isRecord(value)) throw new MenuError(`${label} должна быть объектом.`);
  return {
    id: readString(value, 'id', label),
    name: readString(value, 'name', label),
    order: readNumber(value, 'order', label),
  };
}

function parseItem(value: unknown, index: number, categoryIds: Set<string>): MenuItem {
  if (!isRecord(value)) throw new MenuError(`Блюдо ${index + 1} должно быть объектом.`);
  const name = typeof value.name === 'string' && value.name.trim() ? value.name.trim() : '';
  const label = name ? `Блюдо «${name}»` : `Блюдо ${index + 1}`;
  const item: MenuItem = {
    id: readString(value, 'id', label),
    categoryId: readString(value, 'categoryId', label),
    name: readString(value, 'name', label),
    description: readString(value, 'description', label),
    composition: readString(value, 'composition', label),
    price: readNumber(value, 'price', label),
    weight: readString(value, 'weight', label),
    calories: readNumber(value, 'calories', label),
    tags: readTags(value.tags, label),
    image: readString(value, 'image', label),
    video: readVideo(value.video, label),
    available: readBoolean(value, 'available', label),
    published: readBoolean(value, 'published', label),
    order: readNumber(value, 'order', label),
  };
  if (!categoryIds.has(item.categoryId)) {
    throw new MenuError(`${label}: неизвестная категория «${item.categoryId}».`);
  }
  return item;
}

export function parseMenu(data: unknown): MenuData {
  if (!isRecord(data)) {
    throw new MenuError('Корень файла должен быть объектом с полями categories и items.');
  }
  if (!Array.isArray(data.categories)) {
    throw new MenuError('Поле categories должно быть массивом.');
  }
  if (!Array.isArray(data.items)) {
    throw new MenuError('Поле items должно быть массивом.');
  }
  if (data.categories.length === 0) {
    throw new MenuError('В меню нет ни одной категории.');
  }

  const categories = data.categories.map(parseCategory).sort((a, b) => a.order - b.order);
  const seenCategories = new Set<string>();
  for (const category of categories) {
    if (seenCategories.has(category.id)) {
      throw new MenuError(`Категория «${category.id}» повторяется.`);
    }
    seenCategories.add(category.id);
  }

  const items = data.items
    .map((item, index) => parseItem(item, index, seenCategories))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'ru'));
  const seenItems = new Set<string>();
  for (const item of items) {
    if (seenItems.has(item.id)) throw new MenuError(`Блюдо с id «${item.id}» повторяется.`);
    seenItems.add(item.id);
  }

  return { categories, items };
}

function preloadImages(menu: MenuData) {
  for (const item of menu.items) {
    if (!item.published || !item.image) continue;
    const img = new Image();
    img.decoding = 'async';
    img.src = assetUrl(item.image);
  }
}

export const MENU_POLL_MS = 15_000;

function menuUrl(): string {
  return `${import.meta.env.BASE_URL}data/menu.json`;
}

async function fetchMenu(url: string, cache: RequestCache): Promise<MenuData> {
  let response: Response;
  try {
    response = await fetch(url, { cache });
  } catch {
    throw new MenuError('Не удалось загрузить меню. Проверьте сеть и обновите страницу.');
  }
  if (!response.ok) {
    throw new MenuError(`Файл меню не открылся (код ${response.status}).`);
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new MenuError('Файл меню повреждён: это не JSON.');
  }
  return parseMenu(json);
}

export function menuSnapshot(menu: MenuData): string {
  return JSON.stringify(menu);
}

export async function loadMenu(): Promise<MenuData> {
  const menu = await fetchMenu(menuUrl(), 'default');
  preloadImages(menu);
  return menu;
}

export async function loadFreshMenu(): Promise<MenuData> {
  return fetchMenu(`${menuUrl()}?t=${Date.now()}`, 'no-store');
}
