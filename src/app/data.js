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
  { key: "slots", label: "Slots", icon: "IconSlots", img: "/solt.jpg", tint: ["#ff8a3d", "#e8531b"] },
  { key: "lottery", label: "Lottery", icon: "IconLottery", img: "/lottery.jpg", tint: ["#33c46a", "#1a9450"] },
  { key: "casino", label: "Casino", icon: "IconCasino", img: "/casion.jpg", tint: ["#7c5cff", "#4a2fd6"] },
  { key: "rummy", label: "Rummy", icon: "IconRummy", img: "/rummy.jpg", tint: ["#ff5b8f", "#d6296a"] },
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
    hideMore: true,
    games: [
      { name: "Aviator", tag: "Crash Game", badge: "Hot", icon: "IconGameAviator", tint: ["#7c3cff", "#1a0c33"], img: "/gamesall/Aviator - Recommended.jpg", href: "/crash", playable: true },
      { name: "Father Kim", tag: "Slots", icon: "IconGameCrown", tint: ["#c97a06", "#5c3800"], img: "/gamesall/Father Kim - Slot.jpg", href: "/crash" },
      { name: "Fortune Dragon", tag: "Slots", badge: "Hot", icon: "IconGameDragon", tint: ["#e8531b", "#7a1c0a"], img: "/gamesall/Fortune Dragon - Slot.jpg", href: "/crash" },
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

// Masked-UID "Latest Winners" list shown on the homepage — first 10 are
// always visible, the rest reveal behind the "Show More Winners" toggle.
export const winners = [
  { uid: "589***", amount: "PKR 18,450" },
  { uid: "227***", amount: "PKR 31,200" },
  { uid: "228***", amount: "PKR 9,780" },
  { uid: "545***", amount: "PKR 52,100" },
  { uid: "635***", amount: "PKR 12,900" },
  { uid: "510***", amount: "PKR 66,340" },
  { uid: "449***", amount: "PKR 7,600" },
  { uid: "450***", amount: "PKR 44,220" },
  { uid: "739***", amount: "PKR 21,070" },
  { uid: "466***", amount: "PKR 88,800" },
  { uid: "707***", amount: "PKR 5,430" },
  { uid: "923***", amount: "PKR 72,310" },
  { uid: "603***", amount: "PKR 16,990" },
  { uid: "673***", amount: "PKR 33,140" },
  { uid: "203***", amount: "PKR 11,860" },
  { uid: "632***", amount: "PKR 27,450" },
  { uid: "223***", amount: "PKR 91,000" },
  { uid: "788***", amount: "PKR 14,720" },
  { uid: "479***", amount: "PKR 39,990" },
  { uid: "864***", amount: "PKR 22,200" },
  { uid: "149***", amount: "PKR 6,870" },
  { uid: "302***", amount: "PKR 19,030" },
  { uid: "831***", amount: "PKR 41,500" },
  { uid: "988***", amount: "PKR 8,230" },
  { uid: "556***", amount: "PKR 63,750" },
  { uid: "691***", amount: "PKR 25,100" },
  { uid: "871***", amount: "PKR 30,600" },
  { uid: "968***", amount: "PKR 13,440" },
  { uid: "829***", amount: "PKR 75,900" },
  { uid: "124***", amount: "PKR 17,650" },
  { uid: "205***", amount: "PKR 49,870" },
  { uid: "911***", amount: "PKR 10,050" },
  { uid: "892***", amount: "PKR 58,320" },
  { uid: "263***", amount: "PKR 34,780" },
  { uid: "998***", amount: "PKR 23,910" },
  { uid: "979***", amount: "PKR 15,560" },
  { uid: "481***", amount: "PKR 81,400" },
  { uid: "108***", amount: "PKR 28,300" },
  { uid: "776***", amount: "PKR 36,900" },
  { uid: "283***", amount: "PKR 20,810" },
  { uid: "309***", amount: "PKR 67,700" },
  { uid: "554***", amount: "PKR 9,260" },
  { uid: "147***", amount: "PKR 45,510" },
  { uid: "586***", amount: "PKR 24,660" },
  { uid: "636***", amount: "PKR 12,350" },
  { uid: "770***", amount: "PKR 79,900" },
  { uid: "519***", amount: "PKR 18,870" },
  { uid: "556***", amount: "PKR 55,120" },
  { uid: "253***", amount: "PKR 29,990" },
  { uid: "326***", amount: "PKR 101,300" },
  { uid: "611***", amount: "PKR 38,500" },
  { uid: "494***", amount: "PKR 11,110" },
  { uid: "453***", amount: "PKR 60,600" },
  { uid: "470***", amount: "PKR 42,220" },
  { uid: "492***", amount: "PKR 26,760" },
  { uid: "561***", amount: "PKR 19,940" },
  { uid: "181***", amount: "PKR 31,870" },
  { uid: "412***", amount: "PKR 57,450" },
  { uid: "846***", amount: "PKR 14,190" },
  { uid: "857***", amount: "PKR 70,010" },
];

const WINNER_PREFIXES = winners.map((w) => w.uid.slice(0, 3));

// Generates a fresh masked-UID winner entry, used to make the homepage
// "Latest Winners" ticker feel live instead of a static fixed list.
export function randomWinnerEntry() {
  const prefix = WINNER_PREFIXES[Math.floor(Math.random() * WINNER_PREFIXES.length)];
  const amount = Math.floor(1000 + Math.random() * 99000);
  return { uid: `${prefix}***`, amount: `PKR ${amount.toLocaleString("en-US")}` };
}
