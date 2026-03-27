import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'academy.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS academy_info (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT,
    established INTEGER,
    location TEXT,
    motto TEXT,
    students INTEGER,
    coaches INTEGER,
    programs INTEGER
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS sports_news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT
  );

  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    role TEXT,
    bio TEXT,
    image TEXT,
    achievements TEXT, -- JSON string
    certificates TEXT  -- JSON string
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    date TEXT,
    description TEXT,
    registrationEnabled BOOLEAN
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS awards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image TEXT,
    date TEXT
  );

  CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image TEXT,
    date TEXT,
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS camps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    type TEXT,
    startDate TEXT,
    endDate TEXT,
    details TEXT,
    posterUrl TEXT,
    activities TEXT, -- JSON string
    fullPrice INTEGER,
    weeklyPrice INTEGER
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'event', 'camp', 'program'
    targetId TEXT,
    parentName TEXT,
    childName TEXT,
    age TEXT,
    email TEXT,
    phone TEXT,
    registrationType TEXT,
    program TEXT,
    createdAt TEXT
  );
`);

// Seed initial data if empty
const infoCount = db.prepare('SELECT COUNT(*) as count FROM academy_info').get() as { count: number };
if (infoCount.count === 0) {
  db.prepare(`
    INSERT INTO academy_info (id, name, established, location, motto, students, coaches, programs)
    VALUES (1, 'Vendhan Sports Academy', 2015, 'Oddanchathram, Tamilnadu', 'Excellence in Sports, Excellence in Life', 500, 25, 10)
  `).run();
}

const newsCount = db.prepare('SELECT COUNT(*) as count FROM sports_news').get() as { count: number };
if (newsCount.count === 0) {
  const news = [
    "Real Madrid reaches Champions League semi-finals after thrilling victory!",
    "LeBron James sets new record for most career points in NBA history.",
    "Fun Fact: The first Olympic Games were held in 776 BC in Olympia, Greece.",
    "Announcement: Vendhan Academy to host Inter-District Silambam Meet in May!",
    "Fun Fact: A football is actually an 'oblate spheroid', not a perfect sphere.",
    "World News: India wins the Cricket Test Series against Australia 3-1.",
    "Fun Fact: Golf is the only sport to have been played on the moon.",
    "Announcement: Yoga sessions for mental health starting this Saturday at our Coimbatore campus."
  ];
  const insert = db.prepare('INSERT INTO sports_news (text) VALUES (?)');
  news.forEach(n => insert.run(n));
}

const programCount = db.prepare('SELECT COUNT(*) as count FROM programs').get() as { count: number };
if (programCount.count === 0) {
  const programs = [
    { name: 'Silambam', description: 'Traditional martial arts training focusing on stick rotation, agility, and combat techniques.', image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=800&auto=format&fit=crop' },
    { name: 'Football', description: 'Tactical, technical, and physical training for aspiring football players.', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop' },
    { name: 'Yoga', description: 'Enhance mental clarity and physical flexibility through traditional practices.', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop' },
    { name: 'Athletics', description: 'Build speed, endurance, and competitive performance.', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop' },
    { name: 'Skating', description: 'Improve balance, coordination, and agility through skating drills.', image: 'https://images.unsplash.com/photo-1520066331048-1335029e9673?q=80&w=800&auto=format&fit=crop' },
  ];
  const insert = db.prepare('INSERT INTO programs (name, description, image) VALUES (?, ?, ?)');
  programs.forEach(p => insert.run(p.name, p.description, p.image));
}

const coachCount = db.prepare('SELECT COUNT(*) as count FROM coaches').get() as { count: number };
if (coachCount.count === 0) {
  const coaches = [
    { 
      name: 'Master Vendhan', 
      role: 'Founder & Chief Instructor', 
      bio: 'Silambam Grandmaster with 20+ years of experience.', 
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop',
      achievements: JSON.stringify(['Guinness World Record Holder', 'State Best Coach Award 2022', 'International Silambam Federation Member']),
      certificates: JSON.stringify(['Grandmaster Certification', 'Sports Science Diploma', 'Traditional Arts Expert'])
    },
    { 
      name: 'Coach Rajesh', 
      role: 'Head of Football', 
      bio: 'Former state player with a passion for youth development.', 
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
      achievements: JSON.stringify(['Former State Team Captain', 'AIFF D-License Coach', 'Best Striker Award 2018']),
      certificates: JSON.stringify(['AIFF Coaching Certificate', 'First Aid Certified', 'Physical Education Degree'])
    },
    { 
      name: 'Aacharya Meera', 
      role: 'Lead Yoga Instructor', 
      bio: 'Expert in traditional Hatha and Vinyasa yoga.', 
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
      achievements: JSON.stringify(['Yoga Olympiad Gold Medalist', 'Author of "Yoga for Modern Life"', 'Trained 1000+ Students']),
      certificates: JSON.stringify(['RYT 500 Certified', 'Advanced Hatha Yoga Diploma', 'Meditation Specialist'])
    },
  ];
  const insert = db.prepare('INSERT INTO coaches (name, role, bio, image, achievements, certificates) VALUES (?, ?, ?, ?, ?, ?)');
  coaches.forEach(c => insert.run(c.name, c.role, c.bio, c.image, c.achievements, c.certificates));
}

const campCount = db.prepare('SELECT COUNT(*) as count FROM camps').get() as { count: number };
if (campCount.count === 0) {
  const camps = [
    {
      title: 'Exciting Summer Camp 2026',
      type: 'Summer Camp',
      startDate: '2026-04-15',
      endDate: '2026-05-15',
      details: 'Join us for an unforgettable summer filled with sports, creativity, and wellness! Our camp offers a diverse range of activities: \n\n• Sports & Fun: Sports & Games, Traditional Games\n• Creative Activities: Art & Craft, Story Time, Dance & Music, Handwriting & Phonics\n• Mind & Wellness: Brain Boosters, Kids Yoga',
      posterUrl: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?q=80&w=800&auto=format&fit=crop',
      activities: JSON.stringify([
        'Sports & Games',
        'Traditional Games',
        'Brain Boosters',
        'Art & Craft',
        'Story Time',
        'Dance & Music',
        'Kids Yoga',
        'Handwriting & Phonics'
      ]),
      fullPrice: 5000,
      weeklyPrice: 1500
    }
  ];
  const insert = db.prepare('INSERT INTO camps (title, type, startDate, endDate, details, posterUrl, activities, fullPrice, weeklyPrice) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  camps.forEach(c => insert.run(c.title, c.type, c.startDate, c.endDate, c.details, c.posterUrl, c.activities, c.fullPrice, c.weeklyPrice));
}

export default db;
