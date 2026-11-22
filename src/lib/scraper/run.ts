import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type ScrapeInput = { keyword: string; lat: number; lng: number };
/** stdout: JSONL content; null if the output file was never written (an error, not an empty result). */
export type ScrapeResult = { exitCode: number; stdout: string | null; log: string };
export type ScrapeRunner = (o: ScrapeInput) => Promise<ScrapeResult>;

export type RunnerConfig = { image: string; depth: number; extra: string };

export const TIMEOUT_MS = 10 * 60 * 1000;
/** Parsing depends on this image's exact output format (§13); the image is pinned to the tested version. */
export const DEFAULT_IMAGE =
  "gosom/google-maps-scraper@sha256:1dd971ebc2f090f6d879f701ea72358c89e363a952d5e10e9bdfe300fc43851f";

export function runnerConfigFromEnv(): RunnerConfig {
  return {
    image: process.env.SCRAPER_IMAGE || DEFAULT_IMAGE,
    depth: Number(process.env.SCRAPER_DEPTH || 2),
    extra: process.env.SCRAPER_EXTRA_DOCKER_ARGS || "",
  };
}

export function buildDockerArgs(o: ScrapeInput, hostDir: string, cfg: RunnerConfig, name?: string): string[] {
  return [
    "run", "--rm",
    ...(name ? ["--name", name] : []),
    "-v", `${hostDir}:/work`,
    "-e", "DISABLE_TELEMETRY=1",
    ...cfg.extra.split(/\s+/).filter(Boolean),
    cfg.image,
    "-input", "/work/q.txt", "-results", "/work/out.jsonl", "-json", "-lang", "tr",
    "-geo", `${o.lat},${o.lng}`, "-zoom", "15", "-radius", "2000",
    "-depth", String(cfg.depth), "-exit-on-inactivity", "3m", "-c", "2",
  ];
}

export const FINISHED_MARKER = '"message":"scrapemate exited"';
export const GRACE_MS = 15_000;

/**
 * Runs the scraper process. In real tests, after printing "scrapemate exited" the browser
 * sometimes stays open and the process never exits; in that case it is killed after a grace
 * period and the run counts as successful (the results file is already written).
 */
export function execScraper(
  cmd: string,
  args: string[],
  o: { timeoutMs: number; graceMs: number; onKill: () => void },
): Promise<{ code: number; log: string }> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let log = "";
    let finished = false;
    let killedAfterMarker = false;
    let timedOut = false;
    let grace: NodeJS.Timeout | undefined;
    const kill = () => {
      o.onKill();
      p.kill("SIGKILL");
    };
    const add = (b: Buffer) => {
      log = (log + b.toString()).slice(-20000);
      if (!finished && log.includes(FINISHED_MARKER)) {
        finished = true;
        grace = setTimeout(() => {
          killedAfterMarker = true;
          kill();
        }, o.graceMs);
      }
    };
    p.stdout.on("data", add);
    p.stderr.on("data", add);
    const t = setTimeout(() => {
      timedOut = true;
      kill();
    }, o.timeoutMs);
    const done = (code: number) => {
      clearTimeout(t);
      clearTimeout(grace);
      resolve({ code, log });
    };
    p.on("error", (e) => {
      log += String(e);
      done(-1);
    });
    // "exit" rather than "close": if a child process keeps the pipes open, "close" may never fire.
    p.on("exit", (code) => {
      p.stdout.destroy();
      p.stderr.destroy();
      // Success only if we killed it ourselves after the marker; a process that exits on its own keeps its real code.
      done(killedAfterMarker ? 0 : timedOut ? -1 : (code ?? -1));
    });
  });
}

/** Runs gosom/google-maps-scraper with `docker run` and returns its JSONL output. */
export const dockerRunner: ScrapeRunner = async (o) => {
  const cfg = runnerConfigFromEnv();
  const id = randomUUID();
  const dir = join(process.env.SCRAPE_DIR || "/tmp/lezzet-scrape", id);
  const name = `lr-scrape-${id.slice(0, 8)}`;
  await mkdir(dir, { recursive: true });
  try {
    await writeFile(join(dir, "q.txt"), `${o.keyword}\n`);
    const { code, log } = await execScraper("docker", buildDockerArgs(o, dir, cfg, name), {
      timeoutMs: TIMEOUT_MS,
      graceMs: GRACE_MS,
      onKill: () => void spawn("docker", ["rm", "-f", name], { stdio: "ignore" }),
    });
    const stdout = await readFile(join(dir, "out.jsonl"), "utf8").catch(() => null);
    return { exitCode: code, stdout, log };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};
