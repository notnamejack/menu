export type Category = {
  id: string;
  name: string;
  order: number;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  composition: string;
  price: number;
  weight: string;
  calories: number;
  tags: string[];
  image: string;
  video: string | null;
  available: boolean;
  published: boolean;
  order: number;
};

export type MenuData = {
  categories: Category[];
  items: MenuItem[];
};
