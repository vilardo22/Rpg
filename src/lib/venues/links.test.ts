import { describe, expect, it } from "vitest";
import { directionsUrl, instagramUrl } from "./links";

describe("directionsUrl", () => {
  it("monta a rota com as coordenadas", () => {
    expect(directionsUrl(-25.4425, -49.2395)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=-25.4425,-49.2395",
    );
  });
});

describe("instagramUrl", () => {
  it.each(["@joyjoycafe", "joyjoycafe", "https://www.instagram.com/joyjoycafe/", "instagram.com/joyjoycafe"])(
    "normaliza %s",
    (value) => expect(instagramUrl(value)).toBe("https://www.instagram.com/joyjoycafe/"),
  );

  it("ignora valores vazios ou estranhos", () => {
    expect(instagramUrl(null)).toBeNull();
    expect(instagramUrl("")).toBeNull();
    expect(instagramUrl("javascript:alert(1)")).toBeNull();
  });
});
