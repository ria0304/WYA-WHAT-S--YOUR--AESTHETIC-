
export interface User {
  id: string;
  name: string;
  email: string;
  location: string;
  birthday: string;
  // Added age property to fix type definition errors in App.tsx and Login.tsx
  age: string;
  gender: string;
  isLoggedIn: boolean;
  emailNotifications?: boolean;
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string;
  fabric: string;
  imageUrl?: string;
  isFavorite: boolean;
  wearCount?: number;
}

export interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  wind: number;
}

export enum AppTab {
  HOME = 'home',
  CLOSET = 'closet',
  MATCHES = 'matches',
  TRAVEL = 'travel',
  ME = 'me'
}
