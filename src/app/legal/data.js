// Static content for the /legal/[slug] pages. Every page here describes Lucky73
// as what it actually is: an educational simulation using demo credits, not
// a real-money gambling product. Do not add claims of licensing, regulatory
// approval, or certification — none exist, because none apply to a demo app.

export const LEGAL_UPDATED = "9 August 2026";

export const LEGAL_PAGES = {
  terms: {
    title: "Terms & Conditions",
    icon: "document",
    blocks: [
      { type: "callout", tone: "info", text: "Lucky73 is a free educational simulation. All balances are virtual funds with no monetary value. Nothing on this platform involves real money, real wagering, or a real gambling license." },
      { type: "h", text: "1. What Lucky73 is" },
      { type: "p", text: "Lucky73 is an educational application built to show how a crash-style prediction game, wallet, and account system could work in an interactive UI. Every account starts with a simulated balance, and every deposit, withdrawal, bet, and payout uses virtual funds. No real currency ever enters or leaves the platform through normal use of the product." },
      { type: "h", text: "2. Eligibility and age requirement" },
      { type: "p", text: "You must be at least 18 years old to create an account. The interface simulates gambling-style mechanics (staking credits on a random outcome), and we apply an 18+ age gate as a matter of responsible design even though no real money or prize is at stake. By registering, you confirm you are 18 or older." },
      { type: "h", text: "3. Account registration" },
      { type: "p", text: "You agree to provide accurate information when creating an account and to keep your login credentials confidential. You are responsible for activity that occurs under your account. We may suspend or terminate accounts used for abuse, automated access, or attempts to exploit the platform." },
      { type: "h", text: "4. Virtual funds" },
      { type: "p", text: "Virtual funds shown in your wallet, in deposit/withdrawal history, and in game results have no cash value, cannot be redeemed for money or goods, and cannot be transferred outside the platform. Any \"deposit\" or \"withdrawal\" flow you complete — including through third-party test/sandbox payment pages — is a simulated transaction for educational purposes only." },
      { type: "h", text: "5. No real-money gambling" },
      { type: "p", text: "Lucky73 does not offer real-money wagering, is not a licensed gambling operator in Pakistan or any other jurisdiction, and does not intend to become one through this product. If any part of the interface reads like a real payment or a real bet, it is a simulation of that experience, not the transaction itself." },
      { type: "h", text: "6. Fair use" },
      { type: "p", text: "You agree not to attempt to manipulate game outcomes, wallet balances, or transaction records outside the normal use of the interface, and not to use the platform for any unlawful purpose." },
      { type: "h", text: "7. Changes" },
      { type: "p", text: "Because this is an educational product, features, content, and these terms may change at any time without prior notice." },
      { type: "h", text: "8. Contact" },
      { type: "p", text: "Questions about these terms can be directed through the Contact/Support page." },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    icon: "shield",
    blocks: [
      { type: "callout", tone: "info", text: "This is an educational application. Use a name, email, or phone number you're comfortable putting into a preview product — avoid submitting sensitive personal or financial information." },
      { type: "h", text: "1. What we collect" },
      { type: "p", text: "To create and operate an account, we store the information you provide at signup (name, phone number and/or email, and a hashed password), plus records the platform generates as you use it: your simulated wallet balance, transaction history (virtual deposits/withdrawals/bets), notifications, and basic activity logs (e.g. login timestamps, IP address at time of request) used for account security and abuse prevention." },
      { type: "h", text: "2. What we don't collect" },
      { type: "p", text: "We do not collect or store real payment card numbers, real bank account credentials, or government identity documents. Any payment-provider integration on this platform runs in test/sandbox mode and does not process real transactions." },
      { type: "h", text: "3. How your data is used" },
      { type: "p", text: "Account data is used only to operate the platform: authenticating you, displaying your simulated balance and history, sending in-app notifications, and maintaining basic security logs. We do not sell your data or share it with third parties for marketing." },
      { type: "h", text: "4. Passwords" },
      { type: "p", text: "Passwords are stored as salted cryptographic hashes, never in plain text. We cannot see or recover your original password." },
      { type: "h", text: "5. Cookies and sessions" },
      { type: "p", text: "We use a single essential session cookie to keep you logged in. It is not used for advertising or cross-site tracking. See the Cookie Policy for details." },
      { type: "h", text: "6. Data retention and deletion" },
      { type: "p", text: "Because this is an educational environment, account and activity data may be periodically reset or deleted without notice. If you'd like your account data removed sooner, contact us through the Contact/Support page." },
      { type: "h", text: "7. Changes" },
      { type: "p", text: "This policy may be updated as the platform evolves. Continued use of the platform after a change means you accept the updated policy." },
    ],
  },

  "responsible-gaming": {
    title: "Responsible Gaming",
    icon: "shield",
    blocks: [
      { type: "callout", tone: "warning", text: "Lucky73 uses virtual funds with no real value — you cannot lose real money here. This page exists because the interface is modeled on real-money gambling products, and we want to be upfront about the behaviors those products can encourage." },
      { type: "h", text: "1. Why this page exists" },
      { type: "p", text: "The crash-game format simulated on this platform — staking credits, watching a multiplier climb, deciding when to cash out — is deliberately based on real-money betting products. Even with no money on the line, mechanics like these are designed to be engaging, and it's worth understanding that before you (or anyone) encounters the real thing." },
      { type: "h", text: "2. If you or someone you know struggles with gambling" },
      { type: "p", text: "If real-money gambling is or has been a problem for you or someone close to you, please consider speaking with a professional or a support service. In Pakistan, a general starting point is speaking with a healthcare provider or a licensed counsellor, since dedicated national gambling-helpline infrastructure is limited; internationally, organizations such as Gamblers Anonymous (gamblersanonymous.org) publish free self-assessment tools and peer-support meeting information that are accessible from anywhere." },
      { type: "h", text: "3. Good habits, even in practice" },
      { type: "ul", items: [
        "Treat any \"limit\" you'd set on a real betting product as worth practicing here too — decide a stopping point before you play.",
        "Notice if you're chasing losses (increasing bets specifically to \"win back\" a previous loss) — that instinct is exactly what real-money products exploit.",
        "Remember the multiplier and crash point in this simulation are generated the same way a real crash game's would be: unpredictable and designed so the house edge always favors the platform over time.",
      ] },
      { type: "h", text: "4. Age restriction" },
      { type: "p", text: "This platform is restricted to users 18 and older, consistent with age requirements for real-money gambling products." },
    ],
  },

  "betting-rules": {
    title: "Betting Rules",
    icon: "document",
    blocks: [
      { type: "callout", tone: "info", text: "These rules describe how the simulated Aviator-style crash game works. All amounts are virtual funds." },
      { type: "h", text: "1. How a round works" },
      { type: "p", text: "Each round starts a multiplier at 1.00x that climbs over time. At an unpredictable point, the round \"crashes\" and the multiplier stops. Players place a bet (a virtual-fund stake) before the round starts, and can cash out any time while the multiplier is climbing." },
      { type: "h", text: "2. Placing a bet" },
      { type: "p", text: "You may place a bet only during the betting window before a round starts, using virtual funds already in your wallet. Bets are deducted from your balance immediately and are final once the round begins — bets cannot be cancelled after the round starts." },
      { type: "h", text: "3. Cashing out" },
      { type: "p", text: "If you cash out before the round crashes, your payout is your stake multiplied by the multiplier value at the moment you cashed out, added to your virtual wallet immediately. If the round crashes before you cash out, your stake for that round is lost." },
      { type: "h", text: "4. Fairness" },
      { type: "p", text: "The crash point for each round is generated server-side, before any bets are visible to the outcome-generation logic, so it cannot be influenced by bet timing or amount. See the Aviator game documentation in this project for the technical detail of how the crash point is derived." },
      { type: "h", text: "5. Disputes" },
      { type: "p", text: "Because all amounts are virtual funds with no cash value, there is no real-money payout to dispute. If you believe a round result was recorded incorrectly, contact us through the Contact/Support page." },
    ],
  },

  "deposit-policy": {
    title: "Deposit Policy",
    icon: "document",
    blocks: [
      { type: "callout", tone: "info", text: "All \"deposits\" on Lucky73 are simulated. No real money is transferred, regardless of which payment method you select." },
      { type: "h", text: "1. Simulated deposits" },
      { type: "p", text: "When you submit a deposit request, the amount is added to your virtual wallet balance as a simulated transaction. Where a real payment provider's checkout page is shown (in test/sandbox mode), completing it does not move real funds — it only demonstrates the integration." },
      { type: "h", text: "2. Minimum amount" },
      { type: "p", text: "A minimum deposit amount applies for educational purposes (shown on the Deposit page) and exists to mirror how a real platform enforces minimums, not because of any real processing cost." },
      { type: "h", text: "3. Approval and status" },
      { type: "p", text: "Deposit requests move through Pending, Approved/Completed, or Failed/Cancelled states, matching how a real platform would track a transaction, and are recorded in your Transaction History regardless of outcome." },
      { type: "h", text: "4. No real payment credentials" },
      { type: "p", text: "Do not enter real card numbers, real bank credentials, or other sensitive real-world payment details anywhere in this preview, even on a linked sandbox checkout page." },
    ],
  },

  "withdrawal-policy": {
    title: "Withdrawal Policy",
    icon: "document",
    blocks: [
      { type: "callout", tone: "info", text: "All \"withdrawals\" on Lucky73 are simulated. No real money is ever sent to any account." },
      { type: "h", text: "1. Simulated withdrawals" },
      { type: "p", text: "A withdrawal request deducts virtual funds from your wallet balance and creates a Pending transaction record, mirroring the shape of a real withdrawal flow. No real transfer to any bank account, mobile wallet, or card occurs at any point." },
      { type: "h", text: "2. Minimum amount and balance checks" },
      { type: "p", text: "A minimum withdrawal amount applies (shown on the Withdraw page). Your requested amount is checked against your current virtual balance before the request is accepted, and funds are held (deducted) at request time so you can't submit more than you have." },
      { type: "h", text: "3. Approval and status" },
      { type: "p", text: "Withdrawal requests are reviewed and marked Approved or Rejected. A rejected withdrawal returns the held virtual funds to your wallet balance." },
      { type: "h", text: "4. Account details" },
      { type: "p", text: "Any \"account number\" or payment destination you enter for a withdrawal is stored only as part of the simulated transaction record — it is never used to send funds anywhere." },
    ],
  },

  "refund-policy": {
    title: "Refund & Cancellation Policy",
    icon: "document",
    blocks: [
      { type: "callout", tone: "info", text: "Because no real money is ever collected, there is nothing to refund in the traditional sense — this page explains how corrections work for virtual funds instead." },
      { type: "h", text: "1. No real-money refunds" },
      { type: "p", text: "Since deposits and withdrawals only ever move simulated virtual funds, there is no real payment to reverse or refund." },
      { type: "h", text: "2. Cancelling a pending request" },
      { type: "p", text: "A deposit or withdrawal request that is still Pending has not yet affected your final balance state in a way that can't be corrected — contact Support if you'd like a pending request reviewed or reversed." },
      { type: "h", text: "3. Incorrect balances" },
      { type: "p", text: "If you believe your virtual wallet balance, transaction history, or game history is incorrect due to a bug rather than the normal outcome of play, contact us through the Contact/Support page and describe what you expected to see." },
    ],
  },

  "cookie-policy": {
    title: "Cookie Policy",
    icon: "shield",
    blocks: [
      { type: "h", text: "1. What we use cookies for" },
      { type: "p", text: "Lucky73 sets one essential, httpOnly session cookie when you log in or sign up. It identifies your logged-in session so the platform can show your account, wallet, and history. It cannot be read by page scripts and is not used for advertising." },
      { type: "h", text: "2. No tracking or advertising cookies" },
      { type: "p", text: "We do not use third-party analytics, advertising, or cross-site tracking cookies on this platform." },
      { type: "h", text: "3. Managing cookies" },
      { type: "p", text: "Because the session cookie is required to stay logged in, blocking or clearing it will simply log you out. You can clear it at any time through your browser's settings." },
    ],
  },

  contact: {
    title: "Contact / Support",
    icon: "shield",
    blocks: [
      { type: "callout", tone: "info", text: "This is an educational product without a live support team. The channels below describe how support is represented in the interface." },
      { type: "h", text: "1. In-app support" },
      { type: "p", text: "The \"Customer Service\" entry on the Sign Up screen and similar entries elsewhere in the app are placeholders that demonstrate where a real live-chat or ticketing integration would go." },
      { type: "h", text: "2. Reporting an issue" },
      { type: "p", text: "If you notice a bug — an incorrect balance, a broken flow, or unexpected behavior — the most useful thing you can do in an educational product like this is note what you did right before it happened and report it to whoever is maintaining this project." },
      { type: "h", text: "3. Legal / policy questions" },
      { type: "p", text: "Questions about the Terms, Privacy Policy, or any other policy page can be directed the same way, through project maintainers rather than a live support desk." },
    ],
  },
};

export function getLegalSlugs() {
  return Object.keys(LEGAL_PAGES);
}
