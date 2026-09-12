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

## 🧠 Core Workflow

•⁠  ⁠*Personalized Input:* Users provide their resume and job preferences via a local UI (⁠ http://localhost:4173 ⁠).
•⁠  ⁠*Multi-Source Discovery:* Ingests and standardizes live job data from Remotive and Arbeitnow APIs.
•⁠  ⁠*Intelligent Curation:* Deduplicates overlapping roles and generates a personalized "Fit Score" for each listing based on the user's resume.
•⁠  ⁠*Comprehensive Output:* Displays the company, title, location, published salary, source, matching rationale, and the original URL.

## ⚙️ Architecture & webcmd Integration

•⁠  ⁠*Responsible Automation:* This agent deliberately *does not* submit applications. It strictly enforces human oversight, ensuring the user retains final approval over their personal data and career moves.
•⁠  ⁠*Browser Verification Layer:* Utilizes the ⁠ webcmd ⁠ infrastructure to dynamically open, navigate, and verify direct-company career pages once a listing is discovered.
•⁠  ⁠*ATS Adapters:* Features custom parsing logic for standard Applicant Tracking Systems, allowing the agent to seamlessly navigate Greenhouse, Lever, Ashby, and Workday listings.

## 🛠️ Quick Start

1.⁠ ⁠Clone this repository and install the project dependencies (⁠ npm install ⁠).
2.⁠ ⁠Start the local frontend interface (⁠ npm run dev ⁠) and open ⁠ http://localhost:4173 ⁠.
3.⁠ ⁠Initialize the underlying agent environment (⁠ webcmd skills add ⁠) to enable the live browser verification layer.
