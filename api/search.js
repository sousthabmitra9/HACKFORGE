const skills = [
  "javascript",
  "typescript",
  "python",
  "java",
  "react",
  "node",
  "node.js",
  "sql",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "machine learning",
  "data analysis",
  "excel",
  "power bi",
  "tableau",
  "django",
  "flask",
  "html",
  "css",
  "git"
];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, " ");
}

function getWords(text) {
  return [
    ...new Set(
      normalize(text)
        .split(/\s+/)
        .filter(
          word => word.length > 2
        )
    )
  ];
}

function extractSkills(resume) {

  const text =
    normalize(resume);

  return skills.filter(
    skill =>
      text.includes(
        normalize(skill)
      )
  );
}

async function getJson(url) {

  const response =
    await fetch(url, {
      headers: {
        "User-Agent":
          "JobSeekerAgent/1.0"
      }
    });

  if (!response.ok) {

    throw new Error(
      `API returned ${response.status}`
    );

  }

  return response.json();
}

function extractSalary(text) {

  const match =
    String(text || "").match(
      /(?:\$|USD\s?)\s?\d{2,3}(?:,\d{3})?(?:\s?(?:-|–|to)\s?(?:\$|USD\s?)?\d{2,3}(?:,\d{3})?)?/i
    );

  return match
    ? match[0]
    : "Not listed";
}

async function searchJobs(query) {

  const results = [];

  const warnings = [];

  const remotiveURL =
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(
      query
    )}`;

  try {

    const data =
      await getJson(remotiveURL);

    const jobs =
      Array.isArray(data.jobs)
        ? data.jobs
        : [];

    for (const job of jobs) {

      results.push({

        company:
          job.company_name ||
          "Unknown company",

        title:
          job.title ||
          "Untitled",

        location:
          job.candidate_required_location ||
          "Remote",

        salary:
          job.salary ||
          extractSalary(
            job.description
          ),

        url:
          job.url || "#",

        source:
          "Remotive",

        description:
          job.description || "",

        posted:
          job.publication_date || ""

      });

    }

  } catch (error) {

    console.error(
      "Remotive error:",
      error
    );

    warnings.push(
      "Remotive unavailable"
    );

  }

  try {

    const data =
      await getJson(
        "https://www.arbeitnow.com/api/job-board-api"
      );

    const jobs =
      Array.isArray(data.data)
        ? data.data
        : [];

    const queryWords =
      getWords(query);

    for (const job of jobs) {

      const text =
        normalize(
          `${job.title || ""} ${
            job.description || ""
          }`
        );

      const matches =
        queryWords.length === 0 ||
        queryWords.some(
          word =>
            text.includes(word)
        );

      if (!matches) {
        continue;
      }

      results.push({

        company:
          job.company_name ||
          "Unknown company",

        title:
          job.title ||
          "Untitled",

        location:
          job.location ||
          (
            job.remote
              ? "Remote"
              : "Not listed"
          ),

        salary:
          extractSalary(
            job.description
          ),

        url:
          job.url || "#",

        source:
          "Arbeitnow",

        description:
          job.description || "",

        posted:
          job.created_at || ""

      });

    }

  } catch (error) {

    console.error(
      "Arbeitnow error:",
      error
    );

    warnings.push(
      "Arbeitnow unavailable"
    );

  }

  return {
    results,
    warnings
  };
}

function rankJob(job, profile) {

  const text =
    normalize(
      `${job.title} ${
        job.description
      } ${job.location}`
    );

  const matched =
    profile.skills.filter(
      skill =>
        text.includes(
          normalize(skill)
        )
    );

  const targetWords =
    getWords(
      profile.titles
    );

  const titleMatches =
    targetWords.filter(
      word =>
        normalize(job.title)
          .includes(word)
    );

  let score = 0;

  score +=
    Math.min(
      55,
      matched.length * 14
    );

  score +=
    Math.min(
      25,
      titleMatches.length * 10
    );

  if (
    profile.remote &&
    /remote/i.test(
      job.location
    )
  ) {

    score += 8;

  }

  if (
    profile.location &&
    normalize(
      job.location
    ).includes(
      normalize(
        profile.location
      )
    )
  ) {

    score += 8;

  }

  return {

    ...job,

    fit:
      Math.min(
        100,
        score
      ),

    matched,

    reason:
      matched.length
        ? `Matches ${matched.join(", ")}.`
        : "Keyword-level match; review the job requirements."

  };

}

module.exports =
  async function handler(
    req,
    res
  ) {

    /*
     * Only POST is allowed.
     */

    if (req.method !== "POST") {

      return res
        .status(405)
        .json({
          error:
            "Method not allowed. Use POST."
        });

    }

    try {

      const body =
        req.body || {};

      const resume =
        String(
          body.resume || ""
        ).trim();

      const preferences =
        body.preferences || {};

      if (!resume) {

        return res
          .status(400)
          .json({
            error:
              "Please paste your resume first."
          });

      }

      const detectedSkills =
        extractSkills(
          resume
        );

      const profile = {

        skills:
          detectedSkills,

        terms:
          getWords(resume),

        titles:
          String(
            preferences.titles ||
            ""
          ),

        location:
          String(
            preferences.location ||
            ""
          ),

        remote:
          Boolean(
            preferences.remote
          )

      };

      const query =
        profile.titles ||
        profile.skills
          .slice(0, 3)
          .join(" ") ||
        "software engineer";

      const {
        results,
        warnings
      } =
        await searchJobs(
          query
        );

      const seen =
        new Set();

      const ranked =
        results

          .filter(job => {

            const key =
              normalize(
                `${job.company}|${job.title}|${job.location}`
              );

            if (
              seen.has(key)
            ) {

              return false;

            }

            seen.add(key);

            if (
              profile.remote &&
              !/remote/i.test(
                job.location
              )
            ) {

              return false;

            }

            return true;

          })

          .map(job =>
            rankJob(
              job,
              profile
            )
          )

          .sort(
            (a, b) =>
              b.fit - a.fit
          )

          .slice(0, 100);

      return res
        .status(200)
        .json({

          profile,

          query,

          total:
            ranked.length,

          jobs:
            ranked,

          warnings

        });

    } catch (error) {

      console.error(
        "Search function error:",
        error
      );

      return res
        .status(500)
        .json({

          error:
            error.message ||
            "Internal server error."

        });

    }

  };
