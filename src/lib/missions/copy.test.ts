import { describe, expect, it } from "vitest";
import { missionToFormDefaults, nextWeeklyStart, saoPauloParts } from "./copy";
import type { MissionDetail } from "./queries";

describe("saoPauloParts", () => {
  it("separa data e hora no fuso de Curitiba", () => {
    expect(saoPauloParts("2026-10-10T22:00:00Z")).toEqual({ date: "2026-10-10", time: "19:00" });
    // 01h UTC ainda é o dia anterior em Curitiba.
    expect(saoPauloParts("2026-10-11T01:30:00Z")).toEqual({ date: "2026-10-10", time: "22:30" });
  });
});

describe("nextWeeklyStart", () => {
  const start = "2026-10-10T22:00:00.000Z";

  it("uma semana depois, mesmo horário", () => {
    expect(nextWeeklyStart(start, new Date("2026-10-11T00:00:00Z"))).toBe("2026-10-17T22:00:00.000Z");
  });

  it("se já passou mais de uma semana, pula para a próxima data futura", () => {
    expect(nextWeeklyStart(start, new Date("2026-10-20T00:00:00Z"))).toBe("2026-10-24T22:00:00.000Z");
  });
});

describe("missionToFormDefaults", () => {
  const mission = {
    title: "Strahd",
    game_type: "rpg",
    system_name: "D&D 5e",
    kind: "mesa",
    mode: "presencial",
    starts_at: "2026-10-10T22:00:00Z",
    duration_minutes: 180,
    max_players: 5,
    recurrence: "weekly",
    min_level: 2,
    description: null,
    is_paid: true,
    price_cents: 1550,
    venue: { id: "venue-1", name: "Joy Joy Café", address: "Rua X" },
    contacts: { contact_url: "https://wa.me/5541999998888", online_url: null },
  } as unknown as MissionDetail;

  it("copia os dados com a data da semana seguinte", () => {
    expect(missionToFormDefaults(mission, new Date("2026-10-11T00:00:00Z"))).toEqual({
      title: "Strahd",
      gameType: "rpg",
      systemName: "D&D 5e",
      kind: "mesa",
      mode: "presencial",
      date: "2026-10-17",
      time: "19:00",
      durationMinutes: "180",
      maxPlayers: "5",
      recurrence: "weekly",
      minLevel: "2",
      description: "",
      isPaid: true,
      price: "15,50",
      venueId: "venue-1",
      onlineUrl: "",
      contactType: "whatsapp",
      contactPhone: "41999998888",
      contactDiscord: "",
    });
  });

  it("reconhece contato do Discord", () => {
    const discord = { ...mission, contacts: { contact_url: "https://discord.gg/abc", online_url: "https://discord.gg/sala" } } as MissionDetail;
    expect(missionToFormDefaults(discord)).toMatchObject({
      contactType: "discord",
      contactDiscord: "https://discord.gg/abc",
      onlineUrl: "https://discord.gg/sala",
    });
  });
});
