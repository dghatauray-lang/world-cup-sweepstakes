// API-Football wrapper (api-sports.io) — free tier: 100 requests/day
// Docs: https://www.api-football.com/documentation-v3

const BASE_URL = "https://v3.football.api-sports.io";

// FIFA World Cup 2026 — league ID 1, season 2026.
// Override via WC_LEAGUE_ID env var if API-Football changes the ID.
const LEAGUE_ID = Number(process.env.WC_LEAGUE_ID ?? 1);
const SEASON = 2026;

export interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string; long: string } };
  league: { round: string };
  teams: { home: { id: number; name: string }; away: { id: number; name: string } };
  goals: { home: number | null; away: number | null };
  score: {
    penalty: { home: number | null; away: number | null };
  };
}

// Normalize API team names to match our seed data.
// API-Football uses slightly different names for some nations.
const API_NAME_MAP: Record<string, string> = {
  "United States":        "USA",
  "Korea Republic":       "South Korea",
  "IR Iran":              "Iran",
  "Czechia":              "Czech Republic",
  "Türkiye":              "Turkey",
  "Bosnia":               "Bosnia and Herzegovina",
};

export function normalizeTeamName(apiName: string): string {
  return API_NAME_MAP[apiName] ?? apiName;
}

export function mapStatus(short: string): "SCHEDULED" | "LIVE" | "FINISHED" {
  if (["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"].includes(short)) return "LIVE";
  if (["FT", "AET", "PEN"].includes(short)) return "FINISHED";
  return "SCHEDULED";
}

// Normalise round strings from the API to our stage labels in points.ts
export function normalizeStage(round: string): string {
  if (round.startsWith("Group Stage")) return "Group Stage";
  if (round.includes("Round of 32"))  return "Round of 32";
  if (round.includes("Round of 16"))  return "Round of 16";
  if (round.includes("Quarter-final") || round.includes("Quarterfinal")) return "Quarter-final";
  if (round.includes("Semi-final")    || round.includes("Semifinal"))    return "Semi-final";
  if (round.includes("3rd Place"))    return "Semi-final"; // 3rd place = same points as semi loss
  if (round.includes("Final"))        return "Final";
  return round;
}

async function apiFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error("API_FOOTBALL_KEY not set in environment.");

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-apisports-key": apiKey },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`API-Football HTTP ${res.status}: ${await res.text()}`);

  const json = await res.json();

  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`);
  }

  return json.response as T;
}

// Fetch all fixtures for WC 2026
export async function fetchAllFixtures(): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture[]>(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`);
}

// Fetch only live + recently finished fixtures (saves API quota mid-tournament)
export async function fetchLiveAndRecentFixtures(): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture[]>(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}&last=20`);
}

// Verify the API key is working and return account info
export async function fetchApiStatus(): Promise<{ account: string; requests: { current: number; limit: number } }> {
  const res = await apiFetch<{ account: { firstname: string }; requests: { current: number; limit_day: number } }[]>("/status");
  const data = res[0];
  return {
    account: data?.account?.firstname ?? "unknown",
    requests: { current: data?.requests?.current ?? 0, limit: data?.requests?.limit_day ?? 100 },
  };
}
