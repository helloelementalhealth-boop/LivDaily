import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, connectWebSocket, connectAuthenticatedWebSocket, waitForMessage } from "./helpers";

describe("API Integration Tests", () => {
  let authToken: string;

  test("Sign up test user", async () => {
    const { token } = await signUpTestUser();
    authToken = token;
    expect(authToken).toBeDefined();
  });

  // Briefings endpoints - /api/briefings/*
  test("GET /api/briefings/today - public endpoint without date", async () => {
    const res = await api("/api/briefings/today");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.headline).toBeDefined();
    expect(data.body).toBeDefined();
  });

  test("GET /api/briefings/today - with date parameter", async () => {
    const res = await api("/api/briefings/today?date=2026-04-01");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.briefing_date).toBeDefined();
  });

  test("POST /api/briefings/override - unauthorized without token", async () => {
    const res = await api("/api/briefings/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "2026-04-02",
        headline: "Test Headline",
        body: "Test Body",
      }),
    });
    await expectStatus(res, 401);
  });

  test("POST /api/briefings/override - create with auth", async () => {
    const res = await authenticatedApi("/api/briefings/override", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "2026-04-02",
        headline: "Override Headline",
        body: "Override Body Content",
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.headline).toBe("Override Headline");
    expect(data.body).toBe("Override Body Content");
    expect(data.is_override).toBe(true);
  });

  test("POST /api/briefings/override - with custom cta_label", async () => {
    const res = await authenticatedApi("/api/briefings/override", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "2026-04-03",
        headline: "Test Briefing",
        body: "Test Content",
        cta_label: "Click Here",
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.cta_label).toBe("Click Here");
  });

  test("POST /api/briefings/override - uses default cta_label when not provided", async () => {
    const res = await authenticatedApi("/api/briefings/override", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: "2026-04-04",
        headline: "Default CTA",
        body: "Testing default",
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.cta_label).toBe("commence protocol");
  });

  // Reports endpoints - /api/reports/*
  test("GET /api/reports/today - unauthorized without token", async () => {
    const res = await api("/api/reports/today");
    await expectStatus(res, 401);
  });

  test("GET /api/reports/today - with auth", async () => {
    const res = await authenticatedApi("/api/reports/today", authToken);
    // Report may or may not exist depending on server state, accept both outcomes
    await expectStatus(res, 200, 404);
    if (res.status === 200) {
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.title).toBeDefined();
    }
  });

  test("GET /api/reports/today - with date parameter", async () => {
    const res = await authenticatedApi(
      "/api/reports/today?date=2026-04-01",
      authToken
    );
    await expectStatus(res, 200, 404);
  });

  // Settings endpoints - /api/settings
  test("GET /api/settings - unauthorized without token", async () => {
    const res = await api("/api/settings");
    await expectStatus(res, 401);
  });

  test("GET /api/settings - with auth", async () => {
    const res = await authenticatedApi("/api/settings", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.settings).toBeDefined();
    expect(typeof data.settings).toBe("object");
  });

  test("POST /api/settings - unauthorized without token", async () => {
    const res = await api("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "test_key", value: "test_value" }),
    });
    await expectStatus(res, 401);
  });

  test("POST /api/settings - create new setting with auth", async () => {
    const res = await authenticatedApi("/api/settings", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "theme_preference", value: "dark" }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.key).toBe("theme_preference");
    expect(data.value).toBe("dark");
  });

  test("POST /api/settings - update existing setting with auth", async () => {
    const res = await authenticatedApi("/api/settings", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "theme_preference", value: "light" }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.key).toBe("theme_preference");
    expect(data.value).toBe("light");
  });

  test("GET /api/settings - verify updated setting persisted", async () => {
    const res = await authenticatedApi("/api/settings", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.settings.theme_preference).toBe("light");
  });

  test("POST /api/settings - create another setting", async () => {
    const res = await authenticatedApi("/api/settings", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "notifications", value: "enabled" }),
    });
    await expectStatus(res, 200);
  });

  test("GET /api/settings - verify multiple settings exist", async () => {
    const res = await authenticatedApi("/api/settings", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.settings.theme_preference).toBe("light");
    expect(data.settings.notifications).toBe("enabled");
  });
});
