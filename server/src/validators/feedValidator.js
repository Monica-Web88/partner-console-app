const { XMLParser } = require("fast-xml-parser");

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const URL_LIKE = /^(https?:\/\/|[\w.-]+\.[a-z]{2,}\/)/i;
const RATING_ENUM = ["TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA"];

// Declarative rule set — this is the "schema" a real partner-ops team
// would version and extend as new field requirements roll out.
const FIELD_RULES = [
  { field: "channelId", type: "string", required: true, check: (v) => typeof v === "string" && v.trim().length > 0 },
  { field: "airDate", type: "ISO-8601", required: true, check: (v) => ISO_8601.test(String(v || "")) },
  { field: "programTitle", type: "string", required: true, check: (v) => typeof v === "string" && v.trim().length > 0 },
  { field: "ratingSystem", type: "enum", required: true, check: (v) => RATING_ENUM.includes(v) },
  { field: "closedCaptionUrl", type: "url", required: false, check: (v) => URL_LIKE.test(String(v || "")) },
  {
    field: "durationSeconds",
    type: "integer",
    required: true,
    check: (v) => Number.isInteger(Number(v)),
    warnCheck: (v) => !Number.isNaN(Number(v)), // numeric but not a clean integer -> warn instead of fail
  },
  { field: "contentAdvisory", type: "enum", required: false, check: (v) => typeof v === "string" && v.trim().length > 0 },
  { field: "streamUri", type: "url", required: true, check: (v) => URL_LIKE.test(String(v || "")) },
];

function parseXml(xmlString) {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const parsed = parser.parse(xmlString);
  // Accept either <program>...</program> or <feed><program>...</program></feed>
  const program = parsed.program || (parsed.feed && parsed.feed.program) || parsed;
  return program;
}

// Best-effort reachability check for streamUri / closedCaptionUrl.
// Never throws — an unreachable URL is a validation fact, not a server error.
async function checkReachable(url) {
  if (!URL_LIKE.test(String(url || ""))) return { reachable: false, reason: "not a url" };
  const target = url.startsWith("http") ? url : `https://${url}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(target, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);
    return { reachable: res.ok, status: res.status };
  } catch (err) {
    return { reachable: false, reason: err.name === "AbortError" ? "timeout" : "unreachable" };
  }
}

async function validateFeed(xmlString, { checkUrls = false } = {}) {
  let program;
  try {
    program = parseXml(xmlString);
  } catch (err) {
    return {
      parseError: `XML did not parse: ${err.message}`,
      results: [],
    };
  }

  const results = [];

  for (const rule of FIELD_RULES) {
    const raw = program[rule.field];
    const value = raw === undefined || raw === null ? "" : String(raw);
    let status = "pass";
    let note = null;

    if (rule.required && value === "") {
      status = "fail";
      note = "missing required field";
    } else if (value === "" && !rule.required) {
      status = "warn";
      note = "optional field not provided";
    } else if (!rule.check(value)) {
      if (rule.warnCheck && rule.warnCheck(value)) {
        status = "warn";
        note = `does not match expected type (${rule.type}), coerced`;
      } else {
        status = "fail";
        note = `does not match expected type (${rule.type})`;
      }
    }

    // Optional live reachability check for URL-type fields
    if (checkUrls && status === "pass" && (rule.field === "streamUri" || rule.field === "closedCaptionUrl")) {
      const reach = await checkReachable(value);
      if (!reach.reachable) {
        status = "fail";
        note = `unreachable (${reach.status || reach.reason})`;
      }
    }

    results.push({ field: rule.field, type: rule.type, value: value || "\u2014", status, note });
  }

  return { results };
}

module.exports = { validateFeed, FIELD_RULES };
