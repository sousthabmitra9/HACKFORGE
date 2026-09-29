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


// ------------------------------------------------------------
// TEXT HELPERS
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// RESUME SKILL EXTRACTION
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// SAFE JSON REQUEST
// ------------------------------------------------------------

async function getJson(url) {

  try {

    const response =
      await fetch(url, {

        method: "GET",

        headers: {
          "User-Agent":
            "JobSeekerAgent/1.0",
          "Accept":
            "application/json"
        },

        // Prevent external APIs from hanging
        signal:
          AbortSignal.timeout(10000)

      });


    if (!response.ok) {

      throw new Error(
        `API returned HTTP ${response.status}`
      );

    }


    return await response.json();

  } catch (error) {

    if (
      error &&
      error.name === "TimeoutError"
    ) {

      throw new Error(
        "External API request timed out"
      );

    }


    if (
      error &&
      error.name === "AbortError"
    ) {

      throw new Error(
        "External API request was aborted"
      );

    }


    throw error;

  }

}


// ------------------------------------------------------------
// SALARY EXTRACTION
// ------------------------------------------------------------

function extractSalary(text) {

  const match =
    String(text || "").match(
      /(?:\$|USD\s?)\s?\d{2,3}(?:,\d{3})?(?:\s?(?:-|–|to)\s?(?:\$|USD\s?)?\d{2,3}(?:,\d{3})?)?/i
    );


  return match
    ? match[0]
    : "Not listed";

}


// ------------------------------------------------------------
// SEARCH REMOTIVE
// ------------------------------------------------------------

async function searchRemotive(query) {

  const url =
    `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(
      query
    )}`;


  try {

    const data =
      await getJson(url);


    const jobs =
      Array.isArray(data.jobs)
        ? data.jobs
        : [];


    return jobs.map(job => ({

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
        job.url ||
        "#",

      source:
        "Remotive",

      description:
        job.description ||
        "",

      posted:
        job.publication_date ||
        ""

    }));


  } catch (error) {

    console.error(
      "Remotive error:",
      error
    );


    return {

      jobs: [],

      warning:
        "Remotive unavailable"

    };

  }

}


// ------------------------------------------------------------
// SEARCH ARBEITNOW
// ------------------------------------------------------------

async function searchArbeitnow(query) {

  const url =
    "https://www.arbeitnow.com/api/job-board-api";


  try {

    const data =
      await getJson(url);


    const jobs =
      Array.isArray(data.data)
        ? data.data
        : [];


    const queryWords =
      getWords(query);


    const results = [];


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
          job.url ||
          "#",

        source:
          "Arbeitnow",

        description:
          job.description ||
          "",

        posted:
          job.created_at ||
          ""

      });

    }


    return {

      jobs: results,

      warning: null

    };


  } catch (error) {

    console.error(
      "Arbeitnow error:",
      error
    );


    return {

      jobs: [],

      warning:
        "Arbeitnow unavailable"

    };

  }

}


// ------------------------------------------------------------
// SEARCH BOTH JOB SOURCES
// ------------------------------------------------------------

async function searchJobs(query) {

  /*
   * Run both APIs at the same time.
   *
   * This is faster than:
   *
   * Remotive → wait → Arbeitnow
   *
   * Instead:
   *
   * Remotive ──┐
   *            ├──> results
   * Arbeitnow ─┘
   */

  const [
    remotiveResult,
    arbeitnowResult
  ] =
    await Promise.all([

      searchRemotive(query),

      searchArbeitnow(query)

    ]);


  const remotiveJobs =
    Array.isArray(remotiveResult)
      ? remotiveResult
      : (
          remotiveResult &&
          Array.isArray(
            remotiveResult.jobs
          )
            ? remotiveResult.jobs
            : []
        );


  const arbeitnowJobs =
    (
      arbeitnowResult &&
      Array.isArray(
        arbeitnowResult.jobs
      )
    )
      ? arbeitnowResult.jobs
      : [];


  const warnings = [];


  if (
    remotiveResult &&
    remotiveResult.warning
  ) {

    warnings.push(
      remotiveResult.warning
    );

  }


  if (
    arbeitnowResult &&
    arbeitnowResult.warning
  ) {

    warnings.push(
      arbeitnowResult.warning
    );

  }


  return {

    results: [
      ...remotiveJobs,
      ...arbeitnowJobs
    ],

    warnings

  };

}


// ------------------------------------------------------------
// JOB RANKING
// ------------------------------------------------------------

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


  // Skill match
  score +=
    Math.min(
      55,
      matched.length * 14
    );


  // Target job title match
  score +=
    Math.min(
      25,
      titleMatches.length * 10
    );


  // Remote preference
  if (
    profile.remote &&
    /remote/i.test(
      job.location
    )
  ) {

    score += 8;

  }


  // Location preference
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


// ------------------------------------------------------------
// VERCEL SERVERLESS FUNCTION
// ------------------------------------------------------------

module.exports =
  async function handler(
    req,
    res
  ) {

    // --------------------------------------------------------
    // METHOD CHECK
    // --------------------------------------------------------

    if (
      req.method !== "POST"
    ) {

      return res
        .status(405)
        .json({

          error:
            "Method not allowed. Use POST."

        });

    }


    try {

      // ------------------------------------------------------
      // REQUEST BODY
      // ------------------------------------------------------

      const body =
        req.body || {};


      const resume =
        String(
          body.resume || ""
        ).trim();


      const preferences =
        body.preferences || {};


      // ------------------------------------------------------
      // VALIDATE RESUME
      // ------------------------------------------------------

      if (!resume) {

        return res
          .status(400)
          .json({

            error:
              "Please paste your resume first."

          });

      }


      // ------------------------------------------------------
      // EXTRACT PROFILE
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // CREATE SEARCH QUERY
      // ------------------------------------------------------

      const query =
        profile.titles ||
        profile.skills
          .slice(0, 3)
          .join(" ") ||
        "software engineer";


      // ------------------------------------------------------
      // SEARCH JOB SOURCES
      // ------------------------------------------------------

      const {
        results,
        warnings
      } =
        await searchJobs(
          query
        );


      // ------------------------------------------------------
      // REMOVE DUPLICATES
      // ------------------------------------------------------

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


            // Remote-only filtering
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


          // --------------------------------------------------
          // RANK
          // --------------------------------------------------

          .map(job =>
            rankJob(
              job,
              profile
            )
          )


          // --------------------------------------------------
          // SORT
          // --------------------------------------------------

          .sort(
            (a, b) =>
              b.fit - a.fit
          )


          // --------------------------------------------------
          // LIMIT RESULTS
          // --------------------------------------------------

          .slice(
            0,
            100
          );


      // ------------------------------------------------------
      // SUCCESS RESPONSE
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // FINAL ERROR HANDLER
      // ------------------------------------------------------

      console.error(
        "Search function error:",
        error
      );


      return res
        .status(500)
        .json({

          error:
            error &&
            error.message
              ? error.message
              : "Internal server error."

        });

    }

  };
