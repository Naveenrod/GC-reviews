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

// Author attribution for a Google Places photo (required by the Places API policies).
export type PhotoAttribution = {
  name: string;
  uri: string | null;
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
  cover_image_url: string | null;        // Google photo name (places/.../photos/...) or legacy URL
  photos: string[] | null;               // Google photo names / legacy URLs
  photo_attributions?: PhotoAttribution[] | null; // parallel to photos
  og_image_url?: string | null;          // venue website hero image (free)
  og_checked_at?: string | null;
  community_cover_url?: string | null;   // first member-uploaded photo (free)
  lat: number | null;
  lng: number | null;
  // Member rating only: computed from the reviews table by trigger.
  avg_rating: number;
  review_count: number;
  // Google's own rating, shown separately with attribution. Cached for at most 30 days.
  google_rating?: number | null;
  google_synced_at?: string | null;
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

export type ReportReason =
  | "defamation"
  | "fake"
  | "privacy"
  | "abuse"
  | "conflict"
  | "other";

export type ReportRelationship = "venue_owner" | "subject" | "member" | "other";

export type ReviewReport = {
  id: string;
  review_id: string | null;
  review_snapshot: {
    rating?: number;
    body?: string | null;
    venue_name?: string;
    venue_path?: string;
    author?: string;
  } | null;
  reporter_user_id: string | null;
  reporter_name: string | null;
  reporter_email: string;
  relationship: ReportRelationship;
  reason: ReportReason;
  details: string;
  page_url: string | null;
  status: "open" | "actioned" | "dismissed";
  resolution: "removed" | "edited" | "kept" | "no_review" | null;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  due_at: string;
  created_at: string;
};
