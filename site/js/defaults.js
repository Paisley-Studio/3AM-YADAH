// Default content: shown until the admin edits it, and written to Firestore by "Load default content".
const WA = 'https://chat.whatsapp.com/Isn8z1qczj4DBn9P3nX75u?mode=gi_t';
const g = (n) => `/img/gallery/g${String(n).padStart(2, '0')}.webp`;

export const CONTENT = {
  hero: {
    eyebrow: 'Prayer Ministry · Nairobi, Kenya',
    title: 'Meet God in the',
    accent: 'third hour.',
    text: 'An ecumenical youth prayer ministry. Every Monday, Wednesday and Friday at 3:00 AM we rise together to pray, worship and seek His face.',
    img1: g(4), img2: g(22), img3: g(26),
  },
  notice: {
    on: true,
    title: 'Please read this notice',
    text: 'Welcome to our prayer community! Prayers hold on Monday, Wednesday and Friday at 3:00 AM (EAT) via Google Meet. The link is shared in the WhatsApp group. Read the rules in the group bio before joining. Active participation is required.',
  },
  ticker: ['Arise and shine', 'Prayer · Mon · Wed · Fri', '3:00 AM EAT', 'Fasting every Friday 6am – 6pm', '3-day fast · first week of every month', 'Winning more people to Jesus Christ'],
  about: {
    title: 'Connecting souls through prayer and fellowship',
    text: 'Our mission is to unite believers from all walks of life in a spiritual journey of prayer, fasting and community. We believe in the power of prayer to transform lives and bring healing, hope and restoration.',
    text2: 'Through our online platform we connect individuals with dedicated prayer partners, organise powerful night prayer sessions, and bring believers together for retreats, fasting and deep spiritual conversations. Join us as we build a strong, Christ-centred community committed to making a difference through faith and prayer.',
    signature: 'Founded by You & I',
    mission: 'Empower and guide youth by spreading the word of God.',
    vision: 'Winning more people to Jesus Christ.',
    motto: 'Arise and shine.',
    values: 'Building a morally upright and trustworthy society.',
    img1: g(19), img2: g(14), img3: g(36),
  },
  prayer: {
    days: 'Monday, Wednesday & Friday',
    time: '3:00 AM (EAT)',
    platform: 'Google Meet. Link shared in the WhatsApp group',
    fastWeekly: 'Every Friday, 6am – 6pm, after prayers',
    fastMonthly: 'Three days of fasting in the first week of every month',
  },
  giving: {
    bank: 'Co-operative Bank',
    accountName: '3AM Yadah Encounter Ministry',
    accountNo: '0111023149694001',
    branchNote: 'Mshirula Current Account',
    paybill: '400222',
    mpesaAcc: '110318751#YourName',
    note: 'Love Offering · General Offering · Project Support · Sacrifice',
  },
  contact: {
    email: '3amyadahencounter@gmail.com',
    phone1: '0748 789 728',
    phone2: '0703 426 431',
    address: 'P.O. Box 42254-00100, Nairobi, Kenya',
    whatsapp: WA,
    social: 'https://chat.whatsapp.com/JfDJRHbyT8NIgMivX0XPip',
    facebook: '', instagram: '', youtube: '', tiktok: '',
  },
  constitution: {
    founded: '5th June 2024',
    founder: 'Brian Alubale',
    articles: '9', pages: '9', year: '2024',
    summary: '3AM Yadah Encounter is an ecumenical youth organisation founded on 5th June 2024 by Brian Alubale. Our constitution provides the framework for our operations, membership and leadership as we work to spread the Gospel and serve our community.',
    pdf: 'https://drive.google.com/file/d/1k9eR_ytTCsHNkLGHN7jN4rF22EYUvu3s/view?usp=sharing',
    toc: 'Introduction & Area of Operation\nPurpose, Mission, Vision, Values & Motto\nMembership\nOffices & Leadership Structure\nElections\nMeetings and Quorum\nFinance\nAmendment\nRules and Regulations',
    pillars: 'Spiritual Foundation|Spreading the Gospel and winning souls to Christ\nYouth Empowerment|Nurturing talents and providing mentorship\nCommunity Service|Performing acts of kindness and helping others',
  },
};

export const EVENTS = [
  { title: 'Nairobi Worship Experience', date: '2025-10-31', time: '9:00 PM – 5:00 AM', location: 'Naivasha', status: 'completed', tags: 'Kesha, Worship', stat: '250+ attendees', image: g(7), description: 'An all-night worship experience. Powerful testimonies and breakthroughs as we worshipped from dusk till dawn.' },
  { title: 'Annual Team Building Fellowship', date: '2025-12-06', time: '9:30 AM', location: 'Nairobi', status: 'completed', tags: 'Fellowship, Team Building', stat: '80+ members', image: g(36), description: 'A day of bonding, games, prayer and strategic planning for the ministry’s vision and goals.' },
  { title: 'Monthly 3-Day Fasting & Prayer', date: '', time: 'First week of every month', location: 'Online', status: 'completed', tags: 'Fasting, Prayer', stat: '150+ online', image: g(6), description: 'First-week monthly fasting with online prayer sessions and powerful testimonies of deliverance.' },
];

const album = (name, nums) => nums.map((n) => ({ url: g(n), album: name, caption: '', type: 'image' }));
export const GALLERY = [
  ...album('Naivasha Worship Night', [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]),
  ...album('Team Building', [32, 33, 34, 35, 36, 37, 38, 39, 40]),
  ...album('Other Events', [2, 3, 4, 1, 5, 7, 41, 42, 43, 44, 45]),
];

export const ART = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/img/art/a${n}.webp`);
