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
  Original: "IconHome",
};

// One section per category, each ending in a "Detail" tile — mirrors the
// repeating section pattern used across the home page. Game names/art here
// are original placeholders, not the names of any real licensed titles.
export const sections = [
  {
    title: "Recommended",
    subtitle: "The most popular electronic games among players",
    noDetail: true,
    games: [
      { name: "Aviator", tag: "Crash Game", badge: "Hot", icon: "IconGameAviator", tint: ["#7c3cff", "#1a0c33"], href: "/game" },
      { name: "Father Kim", tag: "Slots", badge: "Hot", icon: "IconGameCrown", tint: ["#e8531b", "#7a1c0a"] },
      { name: "Labubu's Box", tag: "Rummy", badge: "New", icon: "IconGameCrown", tint: ["#d6296a", "#6e1035"] },
    ],
  },
  {
    title: "Slots",
    subtitle: "Online real-time game dealers, all verified fair games",
    games: [
      { name: "Money Rain", tag: "Slots", badge: "Hot", icon: "IconGameOx", tint: ["#1a9450", "#0d5c30"] },
      { name: "Fortune Dragon", tag: "Slots", badge: "Hot", icon: "IconGameDragon", tint: ["#e8531b", "#7a1c0a"] },
      { name: "Pumpkin Fortune", tag: "Slots", icon: "IconGameCrown", tint: ["#e8531b", "#7a1c0a"] },
      { name: "Father Kim", tag: "Slots", icon: "IconGameCrown", tint: ["#c97a06", "#5c3800"] },
      { name: "Triple 7s", tag: "Slots", badge: "New", icon: "IconGameOx", tint: ["#1a2f8f", "#0a1440"] },
    ],
  },
  {
    title: "Lottery",
    subtitle: "Fair and diverse lottery gameplay",
    noDetail: true,
    games: [
      { name: "Color Predict", tag: "Lottery", icon: "IconGameWheel", tint: ["#2f6fe0", "#123a8f"] },
      { name: "Dice Draw", tag: "Lottery", icon: "IconGameWheel", tint: ["#1a9450", "#0d5c30"] },
      { name: "5D Draw", tag: "Lottery", icon: "IconGameWheel", tint: ["#7c5cff", "#2c1a6e"] },
    ],
  },
  {
    title: "Casino",
    subtitle: "Guided by live dealers, you will experience the fun of baccarat",
    games: [
      { name: "Baccarat Pro", tag: "Casino", icon: "IconGameCards", tint: ["#8f1712", "#3d0705"] },
      { name: "Speed Roulette", tag: "Casino", badge: "Hot", icon: "IconGameWheel", tint: ["#7a1c0a", "#3d0e05"] },
      { name: "Andar Bahar", tag: "Casino", icon: "IconGameCards", tint: ["#c97a06", "#5c3800"] },
      { name: "American Roulette", tag: "Casino", icon: "IconGameWheel", tint: ["#1a0c33", "#0a0515"] },
      { name: "Immersive Roulette", tag: "Casino", icon: "IconGameWheel", tint: ["#0d5c30", "#052e18"] },
    ],
  },
  {
    title: "Rummy",
    subtitle: "Exquisite scenes and delicate graphics, play online with friends",
    games: [
      { name: "Point Rummy", tag: "Rummy", icon: "IconGameCrown", tint: ["#4a2fd6", "#1f1359"] },
      { name: "Card Rally", tag: "Rummy", icon: "IconGameCards", tint: ["#d6296a", "#6e1035"] },
      { name: "Call Break", tag: "Rummy", icon: "IconGameCards", tint: ["#1a0c33", "#0a0515"] },
      { name: "Black Jack", tag: "Rummy", icon: "IconGameCards", tint: ["#0a3a4c", "#041c26"] },
      { name: "Domino Rush", tag: "Rummy", icon: "IconGameCrown", tint: ["#7a1c0a", "#3d0e05"] },
    ],
  },
  {
    title: "Fishing",
    subtitle: "Classic arcade gameplay, super cool visual enjoyment",
    games: [
      { name: "Deep Sea Hunt", tag: "Fishing", icon: "IconGameFish", tint: ["#1580a0", "#0a3a4c"] },
      { name: "Golden Catch", tag: "Fishing", icon: "IconGameFish", tint: ["#1a9450", "#0d5c30"] },
      { name: "Happy Fishing", tag: "Fishing", badge: "Hot", icon: "IconGameFish", tint: ["#123a8f", "#081d47"] },
      { name: "Mega Fishing", tag: "Fishing", icon: "IconGameFish", tint: ["#8f1712", "#3d0705"] },
      { name: "Dino Hunt", tag: "Fishing", icon: "IconGameFish", tint: ["#c97a06", "#5c3800"] },
    ],
  },
  {
    title: "Original",
    subtitle: "The games are independently developed by our team, fun, fair, and safe",
    games: [
      { name: "Aviator", tag: "Crash Game", badge: "Hot", icon: "IconGameAviator", tint: ["#7c3cff", "#1a0c33"], href: "/game" },
      { name: "Crash II", tag: "Crash Game", icon: "IconGameAviator", tint: ["#1580a0", "#0a3a4c"] },
      { name: "7 Up Down", tag: "Original", icon: "IconGameWheel", tint: ["#1a9450", "#0d5c30"] },
      { name: "Lucky Runner", tag: "Original", icon: "IconGameCrown", tint: ["#e8531b", "#7a1c0a"] },
      { name: "Snake Ladder", tag: "Original", icon: "IconGameCrown", tint: ["#4a2fd6", "#1f1359"] },
    ],
  },
];
