import { describe, expect, it } from "vitest";
import { buildContactUrl, missionSchema, parsePriceCents, toMissionRows, type MissionInput } from "./mission";

/** Data AAAA-MM-DD daqui a N dias. */
function inDays(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const base: MissionInput = {
  title: "Mesa de D&D",
  gameType: "rpg",
  systemName: "D&D 5e",
  kind: "mesa",
  mode: "presencial",
  date: inDays(3),
  time: "19:00",
  durationMinutes: "180",
  maxPlayers: "5",
  recurrence: "none",
  minLevel: "1",
  description: "",
  isPaid: false,
  price: "",
  venueId: "6f1c2c1e-1111-4a4a-8888-123456789abc",
  onlineUrl: "",
  contactType: "whatsapp",
  contactPhone: "(41) 99999-8888",
  contactDiscord: "",
};

function errorOf(input: Partial<MissionInput>, field: string) {
  const result = missionSchema.safeParse({ ...base, ...input });
  return result.success ? undefined : result.error.issues.find((i) => i.path[0] === field)?.message;
}

describe("missionSchema", () => {
  it("aceita uma missão presencial válida e converte os números", () => {
    const data = missionSchema.parse(base);
    expect(data).toMatchObject({ durationMinutes: 180, maxPlayers: 5, minLevel: 1, description: undefined });
  });

  it("presencial exige local; online exige link da sala", () => {
    expect(errorOf({ venueId: "" }, "venueId")).toMatch(/local/);
    expect(errorOf({ mode: "online", venueId: "", onlineUrl: "" }, "onlineUrl")).toMatch(/link da sala/);
    expect(errorOf({ mode: "online", venueId: "", onlineUrl: "http://inseguro.com" }, "onlineUrl")).toMatch(/https/);
    expect(missionSchema.safeParse({ ...base, mode: "online", venueId: "", onlineUrl: "https://meet.google.com/abc" }).success).toBe(true);
  });

  it("a data precisa ser futura e dentro de 12 meses", () => {
    expect(errorOf({ date: inDays(-1) }, "date")).toMatch(/futuro/);
    expect(errorOf({ date: inDays(400) }, "date")).toMatch(/12 meses/);
  });

  it("vagas entre 2 e 20", () => {
    expect(errorOf({ maxPlayers: "1" }, "maxPlayers")).toMatch(/2 a 20/);
    expect(errorOf({ maxPlayers: "21" }, "maxPlayers")).toMatch(/2 a 20/);
  });

  it("mesa paga exige valor", () => {
    expect(errorOf({ isPaid: true, price: "" }, "price")).toMatch(/valor/);
    expect(errorOf({ isPaid: true, price: "abc" }, "price")).toMatch(/valor/);
    expect(errorOf({ isPaid: true, price: "15,00" }, "price")).toBeUndefined();
  });

  it("contato: WhatsApp com DDD ou convite do Discord", () => {
    expect(errorOf({ contactPhone: "9999" }, "contactPhone")).toMatch(/DDD/);
    expect(errorOf({ contactType: "discord", contactDiscord: "https://site.com/x" }, "contactDiscord")).toMatch(/Discord/);
    expect(errorOf({ contactType: "discord", contactDiscord: "https://discord.gg/abc123" }, "contactDiscord")).toBeUndefined();
  });
});

describe("conversões", () => {
  it("valor em centavos", () => {
    expect(parsePriceCents("15,50")).toBe(1550);
    expect(parsePriceCents("R$ 20")).toBe(2000);
    expect(parsePriceCents("1.234,00")).toBeNaN();
  });

  it("link do WhatsApp com código do Brasil", () => {
    expect(buildContactUrl({ contactType: "whatsapp", contactPhone: "(41) 99999-8888", contactDiscord: "" })).toBe(
      "https://wa.me/5541999998888",
    );
  });

  it("monta as linhas do banco: presencial sem link online, online sem local", () => {
    const presencial = toMissionRows(missionSchema.parse(base), "host-1");
    expect(presencial.session).toMatchObject({ host_id: "host-1", venue_id: base.venueId, price_cents: null });
    expect(presencial.session.starts_at).toBe(`${base.date}T19:00:00-03:00`);
    expect(presencial.contacts).toEqual({ contact_url: "https://wa.me/5541999998888", online_url: null });

    const online = toMissionRows(
      missionSchema.parse({ ...base, mode: "online", onlineUrl: "https://discord.gg/sala" }),
      "host-1",
    );
    expect(online.session.venue_id).toBeNull();
    expect(online.contacts.online_url).toBe("https://discord.gg/sala");
  });
});
