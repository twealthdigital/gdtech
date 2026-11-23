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
  { id: "gaming", name: "Gaming", circle: true, brands: ["PlayStation", "Xbox", "Nintendo", "Razer", "Logitech"],
    icon: '<path d="M7 8h10a4 4 0 0 1 4 4.5l-.7 3.5a2.2 2.2 0 0 1-3.9.9L15 15H9l-1.4 1.9a2.2 2.2 0 0 1-3.9-.9L3 12.5A4 4 0 0 1 7 8z"/><path d="M8 10.5v3M6.5 12h3"/><circle cx="16" cy="11.5" r=".6"/>' },
  { id: "smarthome", name: "Smart Home", circle: true, brands: ["Google Nest", "Amazon Echo", "Philips Hue", "Ring", "TP-Link"],
    icon: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9.5 15.5a3.5 3.5 0 0 1 5 0"/><circle cx="12" cy="18" r=".7"/>' },
  { id: "wearables", name: "Wearables", brands: ["Apple Watch", "Samsung", "Garmin", "Fitbit", "Xiaomi"],
    icon: '<rect x="7" y="7" width="10" height="10" rx="3"/><path d="M9 7V3.5h6V7M9 17v3.5h6V17"/>' },
  { id: "cameras", name: "Cameras", brands: ["Canon", "Sony", "Nikon", "GoPro", "DJI"],
    icon: '<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>' },
  { id: "tvs", name: "TVs", brands: ["Samsung", "LG", "Sony", "Hisense", "TCL"],
    icon: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M9 20.5h6M12 16.5v4"/>' },
  { id: "power", name: "Power", brands: ["Anker", "Baseus", "Ugreen", "Belkin", "Oraimo"],
    icon: '<path d="M13 2.5L5.5 13H11l-1 8.5L18.5 10H13z"/>' },
  { id: "networking", name: "Networking", brands: ["TP-Link", "Netgear", "Huawei", "Starlink", "Ubiquiti"],
    icon: '<path d="M2.5 9a15 15 0 0 1 19 0"/><path d="M5.5 12.5a10.5 10.5 0 0 1 13 0"/><path d="M8.5 16a6 6 0 0 1 7 0"/><circle cx="12" cy="19.5" r=".8"/>' },
  { id: "accessories", name: "Accessories", brands: ["Spigen", "Anker", "Belkin", "Logitech", "Apple"],
    icon: '<rect x="5.5" y="3" width="13" height="18" rx="3.5"/><circle cx="12" cy="8" r="2"/>' },
];

export const svg = (inner) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
