import { describe, it, expect } from "vitest";
import { buildDockerArgs } from "./run";

describe("buildDockerArgs", () => {
  it("global kısıtlardaki argümanları kurar, -extra-reviews kullanmaz", () => {
    const args = buildDockerArgs({ keyword: "lahmacun", lat: 40.9905, lng: 29.029 }, "/tmp/x/abc", {
      image: "gosom/google-maps-scraper",
      depth: 2,
      extra: "--network host -e HTTPS_PROXY=http://127.0.0.1:1",
    });
    const s = args.join(" ");
    expect(args.slice(0, 2)).toEqual(["run", "--rm"]);
    expect(s).toContain("-v /tmp/x/abc:/work");
    expect(s).toContain("-e DISABLE_TELEMETRY=1");
    expect(s).toContain("--network host -e HTTPS_PROXY=http://127.0.0.1:1 gosom/google-maps-scraper");
    expect(s).toContain("-input /work/q.txt -results /work/out.jsonl -json -lang tr");
    expect(s).toContain("-geo 40.9905,29.029 -zoom 15 -radius 2000 -depth 2 -exit-on-inactivity 3m -c 2");
    expect(s).not.toContain("extra-reviews");
  });
});

import { execScraper } from "./run";

describe("execScraper", () => {
  it("'scrapemate exited' sonrası süreç asılı kalırsa grace sonunda öldürür ve başarılı sayar", async () => {
    let killed = 0;
    const t0 = Date.now();
    const r = await execScraper(
      "sh",
      ["-c", `echo '{"message":"scrapemate exited"}'; sleep 30`],
      { timeoutMs: 20_000, graceMs: 200, onKill: () => killed++ },
    );
    expect(r.code).toBe(0);
    expect(killed).toBe(1);
    expect(Date.now() - t0).toBeLessThan(5000);
  });

  it("işaret yoksa zaman aşımında -1 döner", async () => {
    const r = await execScraper("sh", ["-c", "sleep 30"], { timeoutMs: 300, graceMs: 100, onKill: () => {} });
    expect(r.code).toBe(-1);
  });

  it("normal çıkışta çıkış kodunu korur", async () => {
    expect((await execScraper("sh", ["-c", "exit 3"], { timeoutMs: 5000, graceMs: 100, onKill: () => {} })).code).toBe(3);
  });
});

import { runnerConfigFromEnv } from "./run";

describe("final review fixes (run)", () => {
  it("I1: işaretten sonra kendi kendine 1 ile çıkan süreç başarılı sayılmaz", async () => {
    const r = await execScraper("sh", ["-c", `echo '{"message":"scrapemate exited"}'; exit 1`], { timeoutMs: 5000, graceMs: 2000, onKill: () => {} });
    expect(r.code).toBe(1);
  });
  it("I4: scraper imajı varsayılan olarak digest ile sabitlenmiş", () => {
    delete process.env.SCRAPER_IMAGE;
    expect(runnerConfigFromEnv().image).toMatch(/^gosom\/google-maps-scraper@sha256:[0-9a-f]{64}$/);
  });
});
