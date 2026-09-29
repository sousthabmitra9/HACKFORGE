```javascript
// Job Seeker Agent - Frontend JavaScript

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("jobForm");
  const resumeInput = document.getElementById("resume");
  const titlesInput = document.getElementById("titles");
  const locationInput = document.getElementById("location");
  const remoteInput = document.getElementById("remote");
  const resultsContainer = document.getElementById("results");
  const status = document.getElementById("status");

  // Make sure the form exists
  if (!form) {
    console.error("Job form not found.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const resume = resumeInput
      ? resumeInput.value.trim()
      : "";

    const titles = titlesInput
      ? titlesInput.value.trim()
      : "";

    const location = locationInput
      ? locationInput.value.trim()
      : "";

    const remote = remoteInput
      ? remoteInput.checked
      : false;

    // Validate resume
    if (!resume) {
      showStatus("Please paste your resume first.", true);
      return;
    }

    // Loading state
    showStatus("Searching for suitable jobs...");
    setLoading(true);

    if (resultsContainer) {
      resultsContainer.innerHTML = "";
    }

    try {
      /*
       * IMPORTANT:
       * Use /api/search instead of localhost.
       *
       * Vercel will automatically route this request to:
       * api/search.js
       */
      const response = await fetch("/api/search", {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          resume: resume,

          preferences: {
            titles: titles,
            location: location,
            remote: remote
          }
        })
      });

      // Read response safely
      let data;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          `Server returned an invalid response (${response.status}).`
        );
      }

      // Handle server errors
      if (!response.ok) {
        throw new Error(
          data.error ||
          `Search failed with status ${response.status}.`
        );
      }

      // Display results
      displayResults(data);

      showStatus(
        `Found ${data.total || 0} matching jobs.`
      );

    } catch (error) {
      console.error("Job search error:", error);

      showStatus(
        error.message ||
        "Something went wrong while searching for jobs.",
        true
      );

      if (resultsContainer) {
        resultsContainer.innerHTML = `
          <div class="error-box">
            <h3>Unable to search jobs</h3>
            <p>${escapeHtml(
              error.message ||
              "Please try again later."
            )}</p>
          </div>
        `;
      }

    } finally {
      setLoading(false);
    }
  });

  // --------------------------------------------------
  // Display search results
  // --------------------------------------------------

  function displayResults(data) {
    if (!resultsContainer) {
      return;
    }

    const jobs = Array.isArray(data.jobs)
      ? data.jobs
      : [];

    if (jobs.length === 0) {
      resultsContainer.innerHTML = `
        <div class="no-results">
          <h3>No matching jobs found</h3>
          <p>
            Try changing your job title, location,
            or remote preferences.
          </p>
        </div>
      `;

      return;
    }

    resultsContainer.innerHTML = jobs
      .map((job) => createJobCard(job))
      .join("");

    // Display warnings if any
    if (
      Array.isArray(data.warnings) &&
      data.warnings.length > 0
    ) {
      const warning = document.createElement("div");

      warning.className = "warning-box";

      warning.textContent =
        data.warnings.join(" ");

      resultsContainer.prepend(warning);
    }
  }

  // --------------------------------------------------
  // Create individual job card
  // --------------------------------------------------

  function createJobCard(job) {
    const company =
      job.company || "Company not listed";

    const title =
      job.title || "Untitled position";

    const location =
      job.location || "Location not listed";

    const salary =
      job.salary || "Not listed";

    const source =
      job.source || "Job board";

    const url =
      job.url || "#";

    const fit =
      typeof job.fit === "number"
        ? job.fit
        : 0;

    const reason =
      job.reason ||
      "Review the job description for details.";

    const matched =
      Array.isArray(job.matched)
        ? job.matched
        : [];

    return `
      <article class="job-card">

        <div class="job-card-header">

          <div>
            <h3>${escapeHtml(title)}</h3>

            <p class="company">
              ${escapeHtml(company)}
            </p>
          </div>

          <div class="fit-score">
            ${fit}% match
          </div>

        </div>

        <div class="job-details">

          <span>
            📍 ${escapeHtml(location)}
          </span>

          <span>
            💰 ${escapeHtml(salary)}
          </span>

          <span>
            🔎 ${escapeHtml(source)}
          </span>

        </div>

        ${
          matched.length
            ? `
              <div class="matched-skills">
                ${matched
                  .map(
                    skill =>
                      `<span class="skill">
                        ${escapeHtml(skill)}
                      </span>`
                  )
                  .join("")}
              </div>
            `
            : ""
        }

        <p class="job-reason">
          ${escapeHtml(reason)}
        </p>

        <div class="job-actions">

          ${
            url !== "#"
              ? `
                <a
                  href="${escapeAttribute(url)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="apply-button"
                >
                  View Job
                </a>
              `
              : `
                <button
                  class="apply-button"
                  disabled
                >
                  Link unavailable
                </button>
              `
          }

        </div>

      </article>
    `;
  }

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  function setLoading(isLoading) {
    const submitButton =
      form.querySelector(
        'button[type="submit"]'
      );

    if (!submitButton) {
      return;
    }

    submitButton.disabled = isLoading;

    if (isLoading) {
      submitButton.dataset.originalText =
        submitButton.textContent;

      submitButton.textContent =
        "Searching...";
    } else {
      submitButton.textContent =
        submitButton.dataset.originalText ||
        "Search Jobs";
    }
  }

  // --------------------------------------------------
  // Status message
  // --------------------------------------------------

  function showStatus(message, isError = false) {
    if (!status) {
      return;
    }

    status.textContent = message;

    status.classList.toggle(
      "error",
      isError
    );
  }

  // --------------------------------------------------
  // HTML escaping
  // --------------------------------------------------

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --------------------------------------------------
  // Attribute escaping
  // --------------------------------------------------

  function escapeAttribute(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
});
```
