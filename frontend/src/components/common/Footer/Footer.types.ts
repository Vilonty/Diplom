export interface FooterLink {
  id: string;
  label: string;
  path: string;
}

export interface FooterProps {
  companyName?: string;
  year?: number;
  links?: FooterLink[];
}