import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=it-IT",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error("Bing API error");
    const data = await res.json();
    const images = data.images.map((img: any) => ({
      url: `https://www.bing.com${img.url}`,
      title: img.title,
      copyright: img.copyright,
    }));
    return NextResponse.json(images);
  } catch {
    return NextResponse.json({ error: "Failed to fetch wallpapers" }, { status: 500 });
  }
}
