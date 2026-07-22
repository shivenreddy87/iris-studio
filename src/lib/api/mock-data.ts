// Mock data used by feature adapters until FastAPI is wired in.
export type Campaign = {
  id: string;
  name: string;
  status: "draft" | "live" | "review" | "completed";
  brief: string;
  budget: number;
  currency: string;
  goal: string;
  startsAt: string;
  endsAt: string;
  creators: number;
  invited: number;
  spend: number;
  reach: number;
  engagementRate: number;
};

export type Creator = {
  id: string;
  name: string;
  handle: string;
  niche: string;
  location: string;
  followers: number;
  engagementRate: number;
  matchScore: number;
  accent: "violet" | "rose";
  price: number;
  tags: string[];
  bio: string;
};

export type Deal = {
  id: string;
  creatorId: string;
  campaignId: string;
  stage: "invited" | "negotiating" | "agreed" | "in-production" | "delivered";
  offer: number;
  counter?: number;
  lastUpdate: string;
};

export type Message = {
  id: string;
  from: "brand" | "creator" | "iris";
  text: string;
  at: string;
};

export type Conversation = {
  id: string;
  creatorId: string;
  campaignId: string;
  unread: number;
  lastMessageAt: string;
  messages: Message[];
};

export const campaigns: Campaign[] = [
  {
    id: "c_diwali",
    name: "Diwali Hydration Launch",
    status: "live",
    brief:
      "Introduce our new hydration serum to South Asian audiences with authentic Diwali storytelling.",
    budget: 800000,
    currency: "INR",
    goal: "Awareness + trial",
    startsAt: "2026-10-10",
    endsAt: "2026-11-05",
    creators: 12,
    invited: 24,
    spend: 412500,
    reach: 1240000,
    engagementRate: 5.8,
  },
  {
    id: "c_holiday",
    name: "Holiday Gift Edit",
    status: "review",
    brief: "Micro creators unboxing our giftable minis for the holiday window.",
    budget: 45000,
    currency: "USD",
    goal: "Conversion",
    startsAt: "2026-11-20",
    endsAt: "2026-12-24",
    creators: 8,
    invited: 15,
    spend: 12000,
    reach: 420000,
    engagementRate: 6.4,
  },
  {
    id: "c_ss",
    name: "SS27 Campaign Teaser",
    status: "draft",
    brief: "Editorial creators previewing the SS27 palette.",
    budget: 120000,
    currency: "USD",
    goal: "Brand affinity",
    startsAt: "2027-02-01",
    endsAt: "2027-02-28",
    creators: 0,
    invited: 0,
    spend: 0,
    reach: 0,
    engagementRate: 0,
  },
];

export const creators: Creator[] = [
  {
    id: "cr_elena",
    name: "Elena Rossi",
    handle: "@elena.rossi",
    niche: "Minimalist Fashion",
    location: "Milan, IT",
    followers: 240000,
    engagementRate: 6.2,
    matchScore: 98,
    accent: "violet",
    price: 3400,
    tags: ["Fashion", "Editorial", "Reels"],
    bio: "Editorial stylist turned creator. Muted tones, sharp lines, honest storytelling.",
  },
  {
    id: "cr_julian",
    name: "Julian Chen",
    handle: "@julianbuilds",
    niche: "Tech & Design",
    location: "San Francisco, US",
    followers: 1100000,
    engagementRate: 4.1,
    matchScore: 92,
    accent: "rose",
    price: 14000,
    tags: ["Tech", "Reviews", "YouTube"],
    bio: "Ex-Apple designer breaking down tools that matter.",
  },
  {
    id: "cr_aria",
    name: "Aria Vance",
    handle: "@ariavance",
    niche: "Wellness",
    location: "London, UK",
    followers: 85000,
    engagementRate: 8.9,
    matchScore: 95,
    accent: "violet",
    price: 2100,
    tags: ["Wellness", "Ritual", "IG"],
    bio: "Slow mornings and grounded rituals. Community first.",
  },
  {
    id: "cr_maya",
    name: "Maya Sharma",
    handle: "@maya.k",
    niche: "Beauty & Skincare",
    location: "Mumbai, IN",
    followers: 320000,
    engagementRate: 7.4,
    matchScore: 96,
    accent: "rose",
    price: 4200,
    tags: ["Beauty", "Skincare", "Reels"],
    bio: "Dermatology-adjacent beauty. Ingredient-led reviews.",
  },
  {
    id: "cr_theo",
    name: "Theo Marchand",
    handle: "@theomarch",
    niche: "Food & Travel",
    location: "Paris, FR",
    followers: 540000,
    engagementRate: 5.5,
    matchScore: 88,
    accent: "violet",
    price: 6800,
    tags: ["Food", "Travel", "Long-form"],
    bio: "Chef traveling with a camera. Sourcing stories.",
  },
  {
    id: "cr_nia",
    name: "Nia Okafor",
    handle: "@niaokafor",
    niche: "Fitness",
    location: "Lagos, NG",
    followers: 190000,
    engagementRate: 9.2,
    matchScore: 91,
    accent: "rose",
    price: 2600,
    tags: ["Fitness", "Community", "Shorts"],
    bio: "Strength coach. Real reps, real people.",
  },
];

export const deals: Deal[] = [
  {
    id: "d_1",
    creatorId: "cr_elena",
    campaignId: "c_diwali",
    stage: "agreed",
    offer: 3400,
    lastUpdate: "2h ago",
  },
  {
    id: "d_2",
    creatorId: "cr_maya",
    campaignId: "c_diwali",
    stage: "negotiating",
    offer: 4000,
    counter: 4600,
    lastUpdate: "12m ago",
  },
  {
    id: "d_3",
    creatorId: "cr_aria",
    campaignId: "c_holiday",
    stage: "in-production",
    offer: 2100,
    lastUpdate: "1d ago",
  },
];

export const conversations: Conversation[] = [
  {
    id: "conv_elena",
    creatorId: "cr_elena",
    campaignId: "c_diwali",
    unread: 2,
    lastMessageAt: "12m ago",
    messages: [
      { id: "m1", from: "brand", text: "Hi Elena — loved your last edit. Would you be up for our Diwali launch?", at: "10:02" },
      { id: "m2", from: "creator", text: "Thanks! Send over the brief and timelines?", at: "10:14" },
      { id: "m3", from: "iris", text: "Suggested rate: $3,400 for 1 Reel + 3 Stories based on her recent deals.", at: "10:14" },
      { id: "m4", from: "brand", text: "Brief attached. Rate $3,400 works for us.", at: "10:22" },
      { id: "m5", from: "creator", text: "Perfect. Let's do it 💫", at: "10:28" },
    ],
  },
  {
    id: "conv_maya",
    creatorId: "cr_maya",
    campaignId: "c_diwali",
    unread: 0,
    lastMessageAt: "1h ago",
    messages: [
      { id: "m1", from: "creator", text: "Countering at $4,600 given exclusivity window.", at: "09:11" },
      { id: "m2", from: "iris", text: "Fair — her median deal size this quarter is $4,400.", at: "09:11" },
    ],
  },
  {
    id: "conv_aria",
    creatorId: "cr_aria",
    campaignId: "c_holiday",
    unread: 0,
    lastMessageAt: "1d ago",
    messages: [
      { id: "m1", from: "brand", text: "Shot list attached — ping when you're ready.", at: "Yesterday" },
    ],
  },
];

export const lists = [
  { id: "l_wellness", name: "Wellness power circle", count: 18, updated: "2d ago", accent: "violet" as const },
  { id: "l_micros_in", name: "Micro creators — India", count: 42, updated: "1w ago", accent: "rose" as const },
  { id: "l_editorial", name: "Editorial fashion", count: 24, updated: "3d ago", accent: "violet" as const },
];
