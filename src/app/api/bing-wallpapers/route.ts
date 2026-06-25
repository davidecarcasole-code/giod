import { NextResponse } from "next/server";

const DENTAL_IMAGES = [
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?fm=jpg&q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1685022036266-7db6e5161ee1?fm=jpg&q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1758205308179-4e00e0e4060b?fm=jpg&q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1758205307876-334bb810a63a?fm=jpg&q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1770321119305-f191c09c5801?fm=jpg&q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1770321119162-05c18fbcfdb9?fm=jpg&q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1777443726993-8f9c8e96e46e?fm=jpg&q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1734379134791-79134fd9e335?fm=jpg&q=80&w=1920&auto=format&fit=crop",
];

export async function GET() {
  return NextResponse.json(DENTAL_IMAGES.map((url) => ({ url })));
}
