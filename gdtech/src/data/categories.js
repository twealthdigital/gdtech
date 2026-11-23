// One source for the category circles and the full category dropdown.
// circle: true means it also shows as a bubble on the home page.
export const CATS = [
  { id: "mobile", name: "Mobile", circle: true, brands: ["Apple", "Samsung", "Google", "itel"],
    icon: '<rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M11 18.5h2"/>' },
  { id: "laptops", name: "Laptops", circle: true, brands: ["Samsung", "Apple", "Asus", "Dell", "HP", "Lenovo"],
    icon: '<rect x="4" y="5" width="16" height="10.5" rx="2"/><path d="M2.5 19h19"/>' },
  { id: "headsets", name: "Headsets", circle: true, brands: ["Sony", "JBL", "Bose", "Anker", "Beats"],
    icon: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.6"/><rect x="17" y="14" width="4" height="6" rx="1.6"/>' },
  { id: "tablets", name: "Tablets", circle: true, brands: ["Apple", "Samsung", "Lenovo", "Infinix", "Huawei"],
    icon: '<rect x="5" y="3" width="14" height="18" rx="2.6"/><path d="M11 18h2"/>' },
  { id: "gaming", name: "Gaming", circle: true, brands: ["PS5", "Xbox", "Switch", "ROG", "Logitech"],
    icon: '<path d="M7 8h10a4 4 0 0 1 4 4.5l-.7 3.5a2.2 2.2 0 0 1-3.9.9L15 15H9l-1.4 1.9a2.2 2.2 0 0 1-3.9-.9L3 12.5A4 4 0 0 1 7 8z"/><path d="M8 10.5v3M6.5 12h3"/><circle cx="16" cy="11.5" r=".6"/>' },
];

export const svg = (inner) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
