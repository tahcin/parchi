// District and state from GPS, using BigDataCloud's free client-side reverse geocoding
// endpoint (no key). Returns nulls if the lookup fails; the audit still works.
export async function district(lat: number, lon: number): Promise<{ state: string | null; district: string | null }> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return { state: null, district: null };
    const j = await res.json();
    const admin: { name: string; adminLevel?: number; description?: string }[] = j.localityInfo?.administrative ?? [];
    const d =
      admin.find((a) => /district/i.test(a.description ?? "") || /district/i.test(a.name))?.name ??
      admin.find((a) => a.adminLevel === 5)?.name ??
      j.city ??
      null;
    return { state: j.principalSubdivision || null, district: d ? d.replace(/ district$/i, "") : null };
  } catch {
    return { state: null, district: null };
  }
}
