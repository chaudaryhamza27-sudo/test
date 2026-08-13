export const heroSlides = [
  { a: "#3f7fe0", b: "#153e91" },
  { a: "#2f6fe0", b: "#123a8f" },
  { a: "#3a6fd0", b: "#0f2e73" },
  { a: "#4a86e8", b: "#173e94" },
  { a: "#3570d8", b: "#11337f" },
  { a: "#3f7fe0", b: "#153e91" },
];

// Top header nav tabs — Home links to the page itself, the rest reuse the
// same demo popup as the category pills below since there are no dedicated
// per-category pages in this showcase.
export const navTabs = [
  { key: "home", label: "Home", icon: "IconHome", href: "/" },
  { key: "slots", label: "Slots", icon: "IconSlots" },
  { key: "lottery", label: "Lottery", icon: "IconLottery" },
  { key: "casino", label: "Casino", icon: "IconCasino" },
  { key: "rummy", label: "Rummy", icon: "IconRummy" },
  { key: "fishing", label: "Fishing", icon: "IconFishing" },
];

export const categories = [
  { key: "slots", label: "Slots", icon: "IconSlots", tint: ["#ff8a3d", "#e8531b"] },
  { key: "lottery", label: "Lottery", icon: "IconLottery", tint: ["#33c46a", "#1a9450"] },
  { key: "casino", label: "Casino", icon: "IconCasino", tint: ["#7c5cff", "#4a2fd6"] },
  { key: "rummy", label: "Rummy", icon: "IconRummy", tint: ["#ff5b8f", "#d6296a"] },
  { key: "fishing", label: "Fishing", icon: "IconFishing", tint: ["#2fb6c4", "#1580a0"] },
];

// tag -> icon key shown next to the category label under each game card
export const TAG_ICONS = {
  "Crash Game": "IconPlane",
  Slots: "IconSlots",
  Lottery: "IconLottery",
  Casino: "IconCasino",
  Rummy: "IconRummy",
  Fishing: "IconFishing",
};

export const sections = [
  {
    title: "Recommended",
    subtitle: "The most popular electronic games among players",
    games: [
      { name: "Aviator", tag: "Crash Game", badge: "Hot", icon: "IconGameAviator", tint: ["#7c3cff", "#1a0c33"], href: "/game" },
      { name: "Golden Ox", tag: "Slots", badge: "Hot", icon: "IconGameOx", tint: ["#e0543a", "#8f1712"] },
      { name: "Lucky Wheel", tag: "Lottery", badge: "New", icon: "IconGameWheel", tint: ["#2f6fe0", "#123a8f"] },
      { name: "Royal Flush", tag: "Casino", badge: "Hot", icon: "IconGameCards", tint: ["#7c5cff", "#2c1a6e"] },
      { name: "Teen Patti", tag: "Rummy", badge: "Hot", icon: "IconGameCrown", tint: ["#d6296a", "#6e1035"] },
      { name: "Big Bass", tag: "Fishing", badge: "New", icon: "IconGameFish", tint: ["#1580a0", "#0a3a4c"] },
      { name: "Fortune Dragon", tag: "Slots", badge: "Hot", icon: "IconGameDragon", tint: ["#e8531b", "#7a1c0a"] },
    ],
  },
];
