const $ = (selector) =>
  document.querySelector(selector);

const esc = (value) =>
  String(value || "")
    .replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[char]
    );

const WEBCMD_LABEL =
  "Webcmd job research layer";

$("#status").textContent =
  `${WEBCMD_LABEL} is ready to verify direct company listings.`;

$("#f").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    $("#results").innerHTML = "";

    $("#summary").innerHTML = "";

    $("#status").textContent =
      `${WEBCMD_LABEL}: searching public job sources...`;

    const button =
      $("#f button[type='submit']");

    button.disabled = true;

    button.textContent = "Searching...";

    try {

      const payload = {

        resume:
          $("#resume").value.trim(),

        preferences: {

          titles:
            $("#titles").value.trim(),

          location:
            $("#location").value.trim(),

          remote:
            $("#remote").checked

        }

      };

      if (!payload.resume) {

        throw new Error(
          "Please paste your resume first."
        );

      }

      /*
       * IMPORTANT:
       *
       * This is the Vercel API endpoint.
       *
       * Do NOT use localhost here.
       */
      const response =
        await fetch("/api/search", {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(payload)

        });

      let data;

      try {

        data =
          await response.json();

      } catch {

        throw new Error(
          `Server returned an invalid response (${response.status}).`
        );

      }

      if (!response.ok) {

        throw new Error(
          data.error ||
          `Search failed (${response.status}).`
        );

      }

      const warnings =
        Array.isArray(data.warnings)
          ? data.warnings
          : [];

      $("#status").textContent =
        warnings.length
          ? `${WEBCMD_LABEL}: search finished; ${warnings.join(", ")}.`
          : `${WEBCMD_LABEL}: search complete.`;

      const skills =
        data.profile &&
        Array.isArray(data.profile.skills)
          ? data.profile.skills.join(", ")
          : "none";

      $("#summary").innerHTML = `
        <b>${data.total || 0}</b>
        results for
        <b>${esc(data.query || "")}</b>
        · detected skills:
        ${esc(skills)}
        ·
        <em>
          Use Webcmd to verify a direct-company page before applying.
        </em>
      `;

      const jobs =
        Array.isArray(data.jobs)
          ? data.jobs
          : [];

      $("#results").innerHTML =
        jobs.map((job) => {

          return `

            <article>

              <div>

                <span>
                  ${Number(job.fit || 0)}% fit
                </span>

                <h2>
                  ${esc(job.title)}
                </h2>

                <p>
                  <b>
                    ${esc(job.company)}
                  </b>
                  ·
                  ${esc(job.location)}
                </p>

                <p>
                  ${esc(job.reason)}
                </p>

                <small>
                  Salary:
                  <b>
                    ${esc(job.salary)}
                  </b>
                  ·
                  ${esc(job.source)}
                </small>

              </div>

              <a
                href="${esc(job.url)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Review with Webcmd ↗
              </a>

            </article>

          `;

        }).join("") ||

        "<p>No matching jobs found.</p>";

    } catch (error) {

      console.error(error);

      $("#status").textContent =
        `Search failed: ${error.message}`;

      $("#results").innerHTML = `
        <div class="error">
          <h3>
            Unable to search jobs
          </h3>

          <p>
            ${esc(error.message)}
          </p>
        </div>
      `;

    } finally {

      button.disabled = false;

      button.textContent =
        "Search jobs";

    }

  }
);
