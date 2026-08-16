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

// One section per category, each ending in a "Detail" tile — mirrors the
// repeating section pattern used across the home page. Game names/art here
// are original placeholders, not the names of any real licensed titles.
// `href` points every card at /crash — Aviator is the only game with a real
// backend in this demo, so its `playable: true` tiles link straight there;
// every other card instead opens the "Recharge Required" popup (see
// page.js) since clicking it isn't actually meant to navigate. `img`, where
// present, points at public/gamesall and is rendered instead of the
// icon+gradient placeholder.
export const sections = [
  {
    title: "Recommended",
    subtitle: "The most popular electronic games among players",
    noDetail: true,
    games: [
      { name: "Aviator", tag: "Crash Game", badge: "Hot", icon: "IconGameAviator", tint: ["#7c3cff", "#1a0c33"], img: "/gamesall/Aviator - Recommended.jpg", href: "/crash", playable: true },
    ],
  },
  {
    title: "Slots",
    subtitle: "Online real-time game dealers, all verified fair games",
    games: [
      { name: "Money Rain", tag: "Slots", badge: "Hot", icon: "IconGameOx", tint: ["#1a9450", "#0d5c30"], img: "/gamesall/Money Rain - Slot.jpg", href: "/crash" },
      { name: "Fortune Dragon", tag: "Slots", badge: "Hot", icon: "IconGameDragon", tint: ["#e8531b", "#7a1c0a"], img: "/gamesall/Fortune Dragon - Slot.jpg", href: "/crash" },
      { name: "Pumpkin Fortune", tag: "Slots", icon: "IconGameCrown", tint: ["#e8531b", "#7a1c0a"], img: "/gamesall/Pumpkin Fortune - Slot.jpg", href: "/crash" },
      { name: "Father Kim", tag: "Slots", icon: "IconGameCrown", tint: ["#c97a06", "#5c3800"], img: "/gamesall/Father Kim - Slot.jpg", href: "/crash" },
      { name: "Triple 7s", tag: "Slots", badge: "New", icon: "IconGameOx", tint: ["#1a2f8f", "#0a1440"], img: "/gamesall/Triple 7s - Slot.jpg", href: "/crash" },
    ],
  },
  {
    title: "Lottery",
    subtitle: "Fair and diverse lottery gameplay",
    noDetail: true,
    games: [
      { name: "Color Predict", tag: "Lottery", icon: "IconGameWheel", tint: ["#2f6fe0", "#123a8f"], img: "/gamesall/Color Predict - Lottery.jpg", href: "/crash" },
      { name: "Dice Draw", tag: "Lottery", icon: "IconGameWheel", tint: ["#1a9450", "#0d5c30"], img: "/gamesall/Dice Draw - Lottery.jpg", href: "/crash" },
      { name: "5D Draw", tag: "Lottery", icon: "IconGameWheel", tint: ["#7c5cff", "#2c1a6e"], img: "/gamesall/5D Draw - Lottery.jpg", href: "/crash" },
    ],
  },
  {
    title: "Casino",
    subtitle: "Guided by live dealers, you will experience the fun of baccarat",
    games: [
      { name: "Baccarat Pro", tag: "Casino", icon: "IconGameCards", tint: ["#8f1712", "#3d0705"], img: "/gamesall/Baccarat Pro - Casino.jpg", href: "/crash" },
      { name: "Speed Roulette", tag: "Casino", badge: "Hot", icon: "IconGameWheel", tint: ["#7a1c0a", "#3d0e05"], img: "/gamesall/Speed Roullette - Casino.jpg", href: "/crash" },
      { name: "Andar Bahar", tag: "Casino", icon: "IconGameCards", tint: ["#c97a06", "#5c3800"], img: "/gamesall/Andar Bahar - Casino.jpg", href: "/crash" },
      { name: "American Roulette", tag: "Casino", icon: "IconGameWheel", tint: ["#1a0c33", "#0a0515"], img: "/gamesall/American Roullette - Lottery.jpg", href: "/crash" },
      { name: "Immersive Roulette", tag: "Casino", icon: "IconGameWheel", tint: ["#0d5c30", "#052e18"], img: "/gamesall/Immersive Roullette - Lottery.jpg", href: "/crash" },
    ],
  },
  {
    title: "Rummy",
    subtitle: "Exquisite scenes and delicate graphics, play online with friends",
    games: [
      { name: "Point Rummy", tag: "Rummy", icon: "IconGameCrown", tint: ["#4a2fd6", "#1f1359"], img: "/gamesall/Point Rummy - Rummy.jpg", href: "/crash" },
      { name: "Card Rally", tag: "Rummy", icon: "IconGameCards", tint: ["#d6296a", "#6e1035"], img: "/gamesall/Card Rally - Rummy.png", href: "/crash" },
      { name: "Call Break", tag: "Rummy", icon: "IconGameCards", tint: ["#1a0c33", "#0a0515"], img: "/gamesall/Call Break - Rummy.png", href: "/crash" },
      { name: "Black Jack", tag: "Rummy", icon: "IconGameCards", tint: ["#0a3a4c", "#041c26"], img: "/gamesall/Black Jack - Rummy.jpg", href: "/crash" },
      { name: "Domino Rush", tag: "Rummy", icon: "IconGameCrown", tint: ["#7a1c0a", "#3d0e05"], img: "/gamesall/Domino Rush - Rally.jpg", href: "/crash" },
    ],
  },
  {
    title: "Fishing",
    subtitle: "Classic arcade gameplay, super cool visual enjoyment",
    games: [
      { name: "Deep Sea Hunt", tag: "Fishing", icon: "IconGameFish", tint: ["#1580a0", "#0a3a4c"], img: "/gamesall/Deep Sea Hunt - Fishing.jpg", href: "/crash" },
      { name: "Golden Catch", tag: "Fishing", icon: "IconGameFish", tint: ["#1a9450", "#0d5c30"], img: "/gamesall/Golden Catch - Fishing.jpg", href: "/crash" },
      { name: "Happy Fishing", tag: "Fishing", badge: "Hot", icon: "IconGameFish", tint: ["#123a8f", "#081d47"], img: "/gamesall/Happy Fishing - Fishing.jpg", href: "/crash" },
      { name: "Mega Fishing", tag: "Fishing", icon: "IconGameFish", tint: ["#8f1712", "#3d0705"], img: "/gamesall/Mega Fishing - Fishing.jpg", href: "/crash" },
      { name: "Dino Hunt", tag: "Fishing", icon: "IconGameFish", tint: ["#c97a06", "#5c3800"], img: "/gamesall/Dino Hunt - Fishing.jpg", href: "/crash" },
    ],
  },
];
