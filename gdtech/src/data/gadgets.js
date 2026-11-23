// Laptops, tablets, headsets and gaming for the shop pages (lineups checked November 2026).
// Same shape as phones.js: a brand shop has series (groups), and each series has products.
//   item.price    in naira. PLACEHOLDER numbers, nothing here is a real GDTech price yet. Change one and the shop
//                 card, the product page, the bag and the total all follow.
//   item.storage  the options on the product page (storage, colour or edition, see OPT below)
//   item.prices   one price per option (headsets and gaming use the same price for every option)
// Photos: drop a file named after the product id into src/assets/models/ (for example mac-air-13.webp) and the card
// and product page use it. Until then the brand photo is used.
import { PHONE_SHOPS } from "./phones.js";

// What the option row on the product page is called, per category (phones keep the default storage wording)
export const OPT = {
  laptops: { label: "Select storage", guide: "Storage Guide", note: "Storage is where your apps, files and photos live. 512GB is enough for most people, go bigger if you edit video or keep a lot of files." },
  tablets: { label: "Select storage", guide: "Storage Guide", note: "Storage is the space for your apps, drawings, videos and downloads. Pick more if you film a lot or keep many files." },
  headsets: { label: "Select colour" },
  gaming: { label: "Select edition" },
};

const it = (id, name, price, storage, flat) => ({ id, name, price, storage, ...(flat ? { prices: storage.map(() => price) } : {}) });
const grp = (id, title, tone, items, chip = title) => ({ id, chip, title, tone, items });
const shop = (cat, brand, title, tone, groups) => ({ cat, brand, title, tone, art: cat + ":" + brand, opt: OPT[cat], groups });

const S = {
  neo: ["256GB", "512GB"], mac: ["512GB", "1TB", "2TB"], pc: ["256GB", "512GB", "1TB"],
  tab: ["128GB", "256GB", "512GB"], pro: ["256GB", "512GB", "1TB", "2TB"], air: ["128GB", "256GB", "512GB", "1TB"],
  lite: ["64GB", "128GB", "256GB"],
};
const BW = ["Black", "White"], BS = ["Black", "Silver"], ONE = ["Standard"];

export const GADGET_SHOPS = {
  /* ---------- laptops ---------- */
  "laptops:Apple": shop("laptops", "Apple", "MacBook", "silver", [
    grp("mac-air", "MacBook Air and Neo", "silver", [
      it("mac-neo", "MacBook Neo", 1100000, S.neo),
      it("mac-air-13", "MacBook Air 13 M5", 1900000, S.mac),
      it("mac-air-15", "MacBook Air 15 M5", 2200000, S.mac),
    ], "Air and Neo"),
    grp("mac-pro", "MacBook Pro", "graphite", [
      it("mac-pro-14-m6", "MacBook Pro 14 M6", 3000000, S.mac),
      it("mac-pro-14-m5pro", "MacBook Pro 14 M5 Pro", 3900000, S.mac),
      it("mac-pro-16-m5pro", "MacBook Pro 16 M5 Pro", 4600000, S.mac),
    ], "Pro"),
  ]),
  "laptops:Samsung": shop("laptops", "Samsung", "Galaxy Book", "steel", [
    grp("book6", "Galaxy Book6", "steel", [
      it("sam-book6", "Galaxy Book6", 1300000, S.pc),
      it("sam-book6-pro", "Galaxy Book6 Pro", 2100000, S.pc),
      it("sam-book6-ultra", "Galaxy Book6 Ultra", 3600000, S.pc),
    ], "Book6"),
    grp("book5", "Galaxy Book5", "slate", [
      it("sam-book5-pro", "Galaxy Book5 Pro", 1900000, S.pc),
      it("sam-book5-360", "Galaxy Book5 360", 1600000, S.pc),
    ], "Book5"),
  ]),
  "laptops:Dell": shop("laptops", "Dell", "Dell", "pewter", [
    grp("dell-xps", "Dell XPS", "pewter", [
      it("dell-xps-13", "Dell XPS 13", 1700000, S.pc),
      it("dell-xps-14", "Dell XPS 14", 2500000, S.pc),
      it("dell-xps-16", "Dell XPS 16", 3500000, S.pc),
    ], "XPS"),
    grp("dell-inspiron", "Dell Inspiron", "slate", [
      it("dell-inspiron-14", "Inspiron 14 Plus", 1200000, S.pc),
      it("dell-inspiron-16", "Inspiron 16 Plus", 1400000, S.pc),
    ], "Inspiron"),
  ]),
  "laptops:HP": shop("laptops", "HP", "HP", "navy", [
    grp("hp-omnibook", "HP OmniBook", "navy", [
      it("hp-omnibook-5", "OmniBook 5", 900000, S.pc),
      it("hp-omnibook-7-aero", "OmniBook 7 Aero", 1500000, S.pc),
      it("hp-omnibook-ultra-14", "OmniBook Ultra 14", 2500000, S.pc),
    ], "OmniBook"),
    grp("hp-gaming", "HP Gaming", "ink", [
      it("hp-victus-15", "HP Victus 15", 1100000, S.pc),
      it("hp-omen-16", "HP OMEN 16", 2000000, S.pc),
    ], "Gaming"),
  ]),
  "laptops:Lenovo": shop("laptops", "Lenovo", "Lenovo", "onyx", [
    grp("lenovo-yoga", "Lenovo Yoga", "onyx", [
      it("len-yoga-slim-7i", "Yoga Slim 7i", 1800000, S.pc),
      it("len-yoga-pro-9i", "Yoga Pro 9i", 3300000, S.pc),
    ], "Yoga"),
    grp("lenovo-thinkpad", "Lenovo ThinkPad", "graphite", [
      it("len-x1-carbon", "ThinkPad X1 Carbon", 3100000, S.pc),
      it("len-t14", "ThinkPad T14", 1900000, S.pc),
      it("len-e14", "ThinkPad E14", 1000000, S.pc),
    ], "ThinkPad"),
  ]),
  "laptops:Asus": shop("laptops", "Asus", "Asus", "graphite", [
    grp("asus-zenbook", "Asus Zenbook", "graphite", [
      it("asus-zenbook-s14", "Zenbook S 14", 2000000, S.pc),
      it("asus-zenbook-a16", "Zenbook A16", 2300000, S.pc),
      it("asus-zenbook-duo", "Zenbook Duo", 2800000, S.pc),
    ], "Zenbook"),
    grp("asus-rog", "Asus ROG and TUF", "orange", [
      it("asus-rog-g16", "ROG Zephyrus G16", 3900000, S.pc),
      it("asus-rog-strix-g16", "ROG Strix G16", 2600000, S.pc),
      it("asus-tuf-a14", "TUF Gaming A14", 1800000, S.pc),
    ], "ROG and TUF"),
  ]),

  /* ---------- headsets ---------- */
  "headsets:Sony": shop("headsets", "Sony", "Sony", "cream", [
    grp("sony-over", "Sony Headphones", "cream", [
      it("sony-xm6", "WH-1000XM6", 600000, BS, true),
      it("sony-xm5", "WH-1000XM5", 450000, BS, true),
    ], "Headphones"),
    grp("sony-buds", "Sony Earbuds", "slate", [
      it("sony-wf-xm5", "WF-1000XM5", 380000, BS, true),
      it("sony-wf-c510", "WF-C510", 85000, BW, true),
    ], "Earbuds"),
  ]),
  "headsets:JBL": shop("headsets", "JBL", "JBL", "orange", [
    grp("jbl-over", "JBL Headphones", "orange", [
      it("jbl-tour-one-m3", "Tour One M3", 330000, BW, true),
      it("jbl-live-780nc", "Live 780NC", 190000, BW, true),
    ], "Headphones"),
    grp("jbl-buds", "JBL Earbuds", "ink", [
      it("jbl-tour-pro-3", "Tour Pro 3", 250000, BW, true),
      it("jbl-live-pro-2", "Live Pro 2", 140000, BW, true),
    ], "Earbuds"),
  ]),
  "headsets:Bose": shop("headsets", "Bose", "Bose", "graphite", [
    grp("bose-over", "Bose Headphones", "graphite", [
      it("bose-qc-ultra-2", "QuietComfort Ultra Headphones (2nd Gen)", 560000, BW, true),
      it("bose-qc-2", "QuietComfort Headphones (2nd Gen)", 320000, BW, true),
    ], "Headphones"),
    grp("bose-buds", "Bose Earbuds", "cream", [
      it("bose-ultra-open", "Ultra Open Earbuds (2nd Gen)", 380000, BW, true),
      it("bose-qc-ultra-buds", "QuietComfort Ultra Earbuds", 420000, BW, true),
    ], "Earbuds"),
  ]),
  "headsets:Anker": shop("headsets", "Anker", "Soundcore", "cream", [
    grp("anker-over", "Soundcore Headphones", "cream", [
      it("anker-space-one-pro", "Space One Pro", 170000, BW, true),
      it("anker-space-2", "Space 2", 120000, BW, true),
      it("anker-q20i", "Q20i", 55000, BW, true),
    ], "Headphones"),
    grp("anker-buds", "Soundcore Earbuds", "slate", [
      it("anker-liberty-5-pro", "Liberty 5 Pro", 195000, BW, true),
      it("anker-space-a40", "Space A40", 80000, BW, true),
    ], "Earbuds"),
  ]),
  "headsets:Beats": shop("headsets", "Beats", "Beats", "ink", [
    grp("beats-over", "Beats Headphones", "ink", [
      it("beats-studio-pro", "Studio Pro", 380000, BW, true),
      it("beats-solo-4", "Solo 4", 190000, BW, true),
    ], "Headphones"),
    grp("beats-buds", "Beats Earbuds", "orange", [
      it("beats-powerbeats-pro-2", "Powerbeats Pro 2", 270000, BW, true),
      it("beats-fit-pro", "Beats Fit Pro", 230000, BW, true),
    ], "Earbuds"),
  ]),

  /* ---------- tablets ---------- */
  "tablets:Apple": shop("tablets", "Apple", "iPad", "cream", [
    grp("ipad-pro-air", "iPad Pro and Air", "cream", [
      it("ipad-pro-11", "iPad Pro 11 M5", 1800000, S.pro),
      it("ipad-pro-13", "iPad Pro 13 M5", 2300000, S.pro),
      it("ipad-air-11", "iPad Air 11 M4", 1100000, S.air),
      it("ipad-air-13", "iPad Air 13 M4", 1400000, S.air),
    ], "Pro and Air"),
    grp("ipad-mini", "iPad and iPad mini", "ink", [
      it("ipad-mini", "iPad mini (A17 Pro)", 900000, S.tab),
      it("ipad-a16", "iPad (A16)", 650000, S.tab),
    ], "iPad and mini"),
  ]),
  "tablets:Samsung": shop("tablets", "Samsung", "Galaxy Tab", "slate", [
    grp("tab-s12", "Galaxy Tab S12", "slate", [
      it("tab-s12-ultra", "Galaxy Tab S12 Ultra", 1900000, S.tab),
      it("tab-s12-plus", "Galaxy Tab S12+", 1500000, S.tab),
      it("tab-s12", "Galaxy Tab S12", 1100000, S.tab),
    ], "Tab S12"),
    grp("tab-s11", "Galaxy Tab S11", "cream", [
      it("tab-s11-ultra", "Galaxy Tab S11 Ultra", 1600000, S.tab),
      it("tab-s11", "Galaxy Tab S11", 950000, S.tab),
    ], "Tab S11"),
  ]),
  "tablets:Lenovo": shop("tablets", "Lenovo", "Lenovo", "orange", [
    grp("lenovo-tab", "Lenovo Tab", "orange", [
      it("len-tab-plus-2", "Tab Plus Gen 2", 380000, S.tab),
      it("len-idea-tab-pro-2", "Idea Tab Pro Gen 2", 450000, S.tab),
    ], "Tab"),
    grp("lenovo-yoga-tab", "Lenovo Yoga Tab", "onyx", [
      it("len-yoga-tab-plus", "Yoga Tab Plus", 800000, S.tab),
      it("len-yoga-tab", "Yoga Tab", 550000, S.tab),
    ], "Yoga Tab"),
  ]),
  "tablets:Infinix": shop("tablets", "Infinix", "Infinix", "cream", [
    grp("infinix-xpad", "Infinix XPAD", "cream", [
      it("infinix-xpad-gt", "XPAD GT", 330000, S.tab),
      it("infinix-xpad", "XPAD", 200000, S.lite),
    ], "XPAD"),
  ]),
  "tablets:Huawei": shop("tablets", "Huawei", "Huawei", "ink", [
    grp("huawei-pro", "Huawei MatePad Pro", "ink", [
      it("huawei-matepad-pro-12", "MatePad Pro 12.2", 800000, S.pc),
    ], "MatePad Pro"),
    grp("huawei-matepad", "Huawei MatePad", "plum", [
      it("huawei-matepad-11-s", "MatePad 11.5 S", 400000, S.tab),
      it("huawei-matepad-air", "MatePad Air", 480000, S.tab),
    ], "MatePad"),
  ]),

  /* ---------- gaming ---------- */
  "gaming:PS5": shop("gaming", "PS5", "PlayStation", "slate", [
    grp("ps5-consoles", "PlayStation 5", "slate", [
      it("ps5-pro", "PlayStation 5 Pro", 1400000, ONE, true),
      it("ps5", "PlayStation 5", 1000000, ONE, true),
      it("ps5-digital", "PlayStation 5 Digital", 850000, ONE, true),
    ], "Consoles"),
    grp("ps5-gear", "PlayStation Gear", "ink", [
      it("ps5-dualsense", "DualSense Controller", 95000, BW, true),
      it("ps5-pulse-elite", "PULSE Elite Headset", 170000, BW, true),
    ], "Gear"),
  ]),
  "gaming:Xbox": shop("gaming", "Xbox", "Xbox", "cream", [
    grp("xbox-consoles", "Xbox Series", "cream", [
      it("xbox-series-x", "Xbox Series X", 1250000, ONE, true),
      it("xbox-series-s", "Xbox Series S", 650000, ONE, true),
    ], "Consoles"),
    grp("xbox-gear", "Xbox Controllers", "ink", [
      it("xbox-controller", "Xbox Wireless Controller", 85000, BW, true),
      it("xbox-elite-2", "Xbox Elite Controller Series 2", 260000, BW, true),
    ], "Controllers"),
  ]),
  "gaming:Switch": shop("gaming", "Switch", "Switch", "steel", [
    grp("switch-2", "Nintendo Switch 2", "steel", [
      it("switch-2", "Nintendo Switch 2", 780000, ONE, true),
      it("switch-2-mario", "Switch 2 Mario Kart World Bundle", 850000, ["Bundle"], true),
    ], "Switch 2"),
    grp("switch-gear", "Switch Gear", "ink", [
      it("switch-2-pro-controller", "Switch 2 Pro Controller", 110000, ONE, true),
      it("switch-2-joycon", "Joy-Con 2 Pair", 140000, ONE, true),
    ], "Gear"),
  ]),
  "gaming:ROG": shop("gaming", "ROG", "ROG", "orange", [
    grp("rog-ally", "ROG Xbox Ally", "orange", [
      it("rog-ally-x20", "ROG Xbox Ally X20", 1900000, ONE, true),
      it("rog-ally-x", "ROG Xbox Ally X", 1500000, ONE, true),
      it("rog-ally", "ROG Xbox Ally", 1000000, ONE, true),
    ], "Ally"),
    grp("rog-gear", "ROG Audio", "ink", [
      it("rog-delta-2", "ROG Delta II Headset", 230000, BW, true),
      it("rog-cetra-speednova", "ROG Cetra SpeedNova Earbuds", 120000, BW, true),
    ], "Audio"),
  ]),
  "gaming:Logitech": shop("gaming", "Logitech", "Logitech G", "plum", [
    grp("logi-headsets", "Logitech Headsets", "plum", [
      it("logi-astro-a50-x", "Astro A50 X", 620000, BW, true),
      it("logi-g325", "G325 Headset", 150000, BW, true),
    ], "Headsets"),
    grp("logi-mice", "Logitech Mice", "ink", [
      it("logi-pro-x2-superstrike", "PRO X2 Superstrike", 280000, BW, true),
      it("logi-g502-x-plus", "G502 X Plus", 190000, BW, true),
    ], "Mice"),
  ]),
};

// Everything in one map keyed like the photos ("mobile:Apple", "laptops:Dell"), phones included
export const SHOPS = {};
for (const [brand, cfg] of Object.entries(PHONE_SHOPS)) SHOPS["mobile:" + brand] = { ...cfg, cat: "mobile", brand };
Object.assign(SHOPS, GADGET_SHOPS);

for (const cfg of Object.values(SHOPS)) {
  cfg.groups.forEach((g, gi) => {
    if (cfg.cat !== "mobile") g.isNew = gi === 0;     // the first series of a brand is its newest
    g.items.forEach((item) => { item.cat = cfg.cat; });
  });
}
