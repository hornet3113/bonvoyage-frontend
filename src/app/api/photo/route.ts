import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  if (!query) return NextResponse.json({ photoUrl: null });

  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return NextResponse.json({ photoUrl: null });

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return NextResponse.json({ photoUrl: null });
    const data = await res.json();
    return NextResponse.json({ photoUrl: data?.urls?.regular ?? null });
  } catch {
    return NextResponse.json({ photoUrl: null });
  }
}
