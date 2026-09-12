# 🎯 CareerMatch Agent (Built with webcmd)

An intelligent, self-learning browser agent designed to automate the most tedious research phases of job hunting while keeping the human in full control of the application process.

## 🧠 Core Workflow

* **Personalized Input:** Users provide their resume and job preferences via a local UI (`http://localhost:4173`).
* **Multi-Source Discovery:** Ingests and standardizes live job data from Remotive and Arbeitnow APIs.
* **Intelligent Curation:** Deduplicates overlapping roles and generates a personalized "Fit Score" for each listing based on the user's resume.
* **Comprehensive Output:** Displays the company, title, location, published salary, source, matching rationale, and the original URL.

## ⚙️ Architecture & webcmd Integration

* **Responsible Automation:** This agent deliberately **does not** submit applications. It strictly enforces human oversight, ensuring the user retains final approval over their personal data and career moves.
* **Browser Verification Layer:** Utilizes the `webcmd` infrastructure to dynamically open, navigate, and verify direct-company career pages once a listing is discovered.
* **ATS Adapters:** Features custom parsing logic for standard Applicant Tracking Systems, allowing the agent to seamlessly navigate Greenhouse, Lever, Ashby, and Workday listings.

## 🛠️ Quick Start

1. Clone this repository and install the project dependencies (`npm install`).
2. Start the local frontend interface (`npm run dev`) and open `http://localhost:4173`.
3. Initialize the underlying agent environment (`webcmd skills add`) to enable the live browser verification layer.
