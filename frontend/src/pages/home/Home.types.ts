// Типы для главной страницы
export interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon?: string; // Можно добавить иконки позже
}

export interface HomeProps {
  // Можно добавить пропсы, если нужно
}