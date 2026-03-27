export interface Program {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: number;
}

export interface Coach {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  achievements?: string[];
  certificates?: string[];
}

export interface SportsNews {
  id: string;
  text: string;
  link?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  registrationEnabled: boolean;
}

export interface GalleryItem {
  id: string;
  url: string;
  category: string;
}

export interface Booking {
  id: string;
  userId: string;
  facilityType: string;
  date: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface Camp {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  fullPrice?: number;
  weeklyPrice?: number;
  activities: string[];
  posterUrl: string;
  details: string;
}

export interface Registration {
  id: string;
  type: 'program' | 'event' | 'camp';
  targetId: string;
  parentName: string;
  childName: string;
  age: number;
  email: string;
  phone: string;
  program?: string;
  registrationType?: 'full' | 'weekly';
  createdAt: string;
}

export interface Update {
  id: string;
  content: string;
  date: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
}
