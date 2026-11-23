// Phone catalogue for the shop page: only the latest TWO series per brand (checked November 2026).
// Order here is the default order on the page.
//
//  group.fold = true   -> a foldable series. It is shown AFTER the normal phones, unless the shopper
//                         arrived through a foldable button (then foldables are shown FIRST).
//  item.fold  = true   -> a foldable inside a normal series (iPhone Duo, Pixel Pro Fold): gets a Foldable tag.
//  item.price          -> optional, in naira. When set, the card shows the price and a solid bag button that
//                         adds it to the cart. Leave it out and the card shows only the name.
//  Photos: drop a file named after the item id (for example galaxy-s26-ultra.webp) into src/assets/models/
//  and the card uses it automatically. Until then the card shows an icon.

export const PHONE_SHOPS = {
  Apple: {
    title: "iPhone", tone: "orange", art: "mobile:Apple",
    groups: [
      { id: "iphone-18", chip: "iPhone 18", title: "iPhone 18", tone: "orange", items: [
        { id: "iphone-18-pro", name: "iPhone 18 Pro" },
        { id: "iphone-18-pro-max", name: "iPhone 18 Pro Max" },
        { id: "iphone-duo", name: "iPhone Duo", fold: true },
      ] },
      { id: "iphone-17", chip: "iPhone 17", title: "iPhone 17", tone: "ink", items: [
        { id: "iphone-17", name: "iPhone 17" },
        { id: "iphone-air", name: "iPhone Air" },
        { id: "iphone-17-pro", name: "iPhone 17 Pro" },
        { id: "iphone-17-pro-max", name: "iPhone 17 Pro Max" },
      ] },
    ],
  },

  Samsung: {
    title: "Galaxy", tone: "slate", art: "mobile:Samsung",
    groups: [
      { id: "galaxy-s26", chip: "S26", title: "Galaxy S26", tone: "slate", items: [
        { id: "galaxy-s26", name: "Galaxy S26" },
        { id: "galaxy-s26-plus", name: "Galaxy S26+" },
        { id: "galaxy-s26-ultra", name: "Galaxy S26 Ultra" },
      ] },
      { id: "galaxy-s25", chip: "S25", title: "Galaxy S25", tone: "cream", items: [
        { id: "galaxy-s25", name: "Galaxy S25" },
        { id: "galaxy-s25-plus", name: "Galaxy S25+" },
        { id: "galaxy-s25-ultra", name: "Galaxy S25 Ultra" },
      ] },
      // Samsung's foldables sit next to the S series, and come first when the shopper taps a foldable button
      { id: "galaxy-z8", chip: "Fold8 and Flip8", title: "Galaxy Z Fold8 and Flip8", tone: "ink", fold: true, items: [
        { id: "galaxy-z-fold8-ultra", name: "Galaxy Z Fold8 Ultra", fold: true },
        { id: "galaxy-z-fold8", name: "Galaxy Z Fold8", fold: true },
        { id: "galaxy-z-flip8", name: "Galaxy Z Flip8", fold: true },
      ] },
      { id: "galaxy-z7", chip: "Fold7 and Flip7", title: "Galaxy Z Fold7 and Flip7", tone: "plum", fold: true, items: [
        { id: "galaxy-z-fold7", name: "Galaxy Z Fold7", fold: true },
        { id: "galaxy-z-flip7", name: "Galaxy Z Flip7", fold: true },
      ] },
    ],
  },

  Google: {
    title: "Pixel", tone: "cream", art: "mobile:Google",
    groups: [
      { id: "pixel-11", chip: "Pixel 11", title: "Pixel 11", tone: "cream", items: [
        { id: "pixel-11", name: "Pixel 11" },
        { id: "pixel-11-pro", name: "Pixel 11 Pro" },
        { id: "pixel-11-pro-xl", name: "Pixel 11 Pro XL" },
        { id: "pixel-11-pro-fold", name: "Pixel 11 Pro Fold", fold: true },
      ] },
      { id: "pixel-10", chip: "Pixel 10", title: "Pixel 10", tone: "slate", items: [
        { id: "pixel-10", name: "Pixel 10" },
        { id: "pixel-10-pro", name: "Pixel 10 Pro" },
        { id: "pixel-10-pro-xl", name: "Pixel 10 Pro XL" },
        { id: "pixel-10-pro-fold", name: "Pixel 10 Pro Fold", fold: true },
      ] },
    ],
  },

  itel: {
    title: "itel", tone: "plum", art: "mobile:itel",
    groups: [
      { id: "itel-a300", chip: "A300", title: "itel A300", tone: "plum", items: [
        { id: "itel-a300-plus", name: "itel A300+" },
        { id: "itel-a300c", name: "itel A300C" },
      ] },
      { id: "itel-super", chip: "Super", title: "itel Super", tone: "orange", items: [
        { id: "itel-super-26-ultra", name: "itel Super 26 Ultra" },
        { id: "itel-s25-ultra", name: "itel S25 Ultra" },
      ] },
    ],
  },
};
