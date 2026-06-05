export type Location = {
  id: string;
  name: string;
  slug: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export type Venue = {
  id: string;
  google_place_id: string | null;
  name: string;
  slug: string;
  category_id: string;
  location_id: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  booking_url: string | null;
  description: string | null;
  cover_image_url: string | null;
  photos: string[] | null;
  lat: number | null;
  lng: number | null;
  avg_rating: number;
  review_count: number;
  created_at: string;
  category?: Category;
  location?: Location;
};

export type Review = {
  id: string;
  venue_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  photos: string[] | null;
  created_at: string;
  profile?: Profile;
};

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  review_count: number;
  is_admin: boolean;
};
