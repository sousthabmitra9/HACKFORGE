# 🔎 Job Seeker Agent

An AI-powered job discovery and research agent that helps users find relevant job opportunities based on their resume and job preferences.

The agent searches multiple job sources, removes duplicate listings, evaluates how well each role matches the user's profile, and presents the results in an easy-to-understand format.

---

## ✨ Features

- 📄 **Resume-based job matching**
  - Paste your resume and let the agent understand your skills and experience.

- 🎯 **Job preference matching**
  - Add preferences such as job title, location, work type, and other requirements.

- 🔎 **Multi-source job search**
  - Searches:
    - Remotive
    - Arbeitnow

- 🧹 **Duplicate removal**
  - Automatically deduplicates job listings found across different sources.

- 📊 **Job fit scoring**
  - Scores jobs based on how well they match the user's resume and preferences.

- 💡 **Match rationale**
  - Explains why a particular job may be a good fit.

- 🏢 **Useful job information**
  - Displays:
    - Company
    - Job title
    - Location
    - Salary (when published)
    - Source
    - Match score
    - Match rationale
    - Original job listing URL

- 🌐 **Webcmd browser research**
  - Webcmd is intended to act as the browser/research layer for opening and verifying direct-company job pages after listings are discovered through APIs.

- 🛡️ **Safe by design**
  - The agent does **not automatically submit job applications**.

---

## 🧠 How It Works

The Job Seeker Agent follows this workflow:

```text
                    ┌───────────────┐
                    │     User      │
                    │ Resume +      │
                    │ Preferences   │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Job Seeker    │
                    │    Agent      │
                    └───────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
       ┌─────────────┐             ┌─────────────┐
       │  Remotive   │             │  Arbeitnow  │
       └──────┬──────┘             └──────┬──────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
                    ┌───────────────┐
                    │ Deduplication │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Fit Scoring & │
                    │   Rationale   │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Webcmd     │
                    │ Browser Layer │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Verified Job  │
                    │   Results     │
                    └───────────────┘
