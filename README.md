# 🛡️ Project Mantis
<img width="754" height="408" alt="image" src="https://github.com/user-attachments/assets/14f1030a-3b23-4eed-bdfa-99fec36bef33" />

> **The Newest Mind on Your Team: Local & Always On**  
> *Privacy-first, autonomous operations and legal compliance assistant designed for modern SMEs.*

[![Microsoft AI Innovators](https://img.shields.io/badge/Microsoft-AI_Innovators_2026-0078D4?logo=microsoft&logoColor=white)](https://github.com)
[![Inference Engine](https://img.shields.io/badge/Engine-Microsoft_Foundry_Local-10B981)](https://github.com)
[![Model](https://img.shields.io/badge/Models-Phi--3.5_/_Phi--4-purple)](https://github.com)
[![Architecture](https://img.shields.io/badge/Architecture-Actionable_RAG_%7C_Harness-orange)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)


---

## 📌 Executive Summary & Problem Statement

Small and Medium Enterprises (SMEs) face immense operational and regulatory overhead—particularly when navigating complex statutory frameworks like **Turkish Labor Law No. 4857 (4857 Sayılı İş Kanunu)** and high-stakes contract reviews. 

### The Enterprise Dilemma:
* **Compliance vs. Privacy:** Cloud-based LLMs pose severe trade-secret and data-leakage risks when handling sensitive corporate records, disciplinary files, and proprietary contracts.
* **Passive AI Gap:** Traditional AI tools offer passive Q&A without taking deterministic, auditable business actions.
* **Operational Latency:** HR and legal teams lose dozens of hours drafting warning letters, cross-checking attendance records, and auditing SLA liabilities manually.

**Project Mantis bridges this gap.** Built entirely on **Microsoft Foundry Local** and the **Microsoft AI Toolkit**, Mantis acts as an on-premise, autonomous team member that audits documents, extracts actionable deliverables, and executes compliance workflows with zero cloud exposure.

---

## 💡 What We Built: Core Pillars & Key Features

### 1. Actionable RAG Pipeline (Doc Vault)
Unlike conventional RAG systems that merely answer queries, Mantis turns unstructured documents into structured business operations:
* **Overlapping Semantic Chunking:** Preserves clause context and penalty terms across large contracts without truncation.
* **Deterministic Redlining:** Automatically highlights regulatory risks, flags non-compliant clauses, and generates diff-based `.docx` revisions.
* **Metric Extraction:** Converts contract SLAs, financial liabilities, and deadlines into normalized JSON payloads.

### 2. HR & Turkish Labor Law (4857 SK) Automation
* **Autonomous Ingestion:** Analyzes raw operational logs, attendance records, and supervisor reports.
* **Statutory Warning Drafts:** Automatically generates formal defense notices (*savunma talep yazısı*) and warning letters (*ihtarname*) compliant with Labor Law Article 25/II.

### 3. Human-in-the-Loop (Harness) Safety Engine
* **Deterministic Guardrails:** Runs at `temperature=0.0` with strict schema validation to eliminate hallucinations.
* **Approval Queue:** High-risk legal actions or external communications are never executed autonomously; they are dispatched to a staging queue for executive human sign-off.

### 4. Agile Project Management & Execution Tracking
* **Embedded Operations Board:** Extracted contract obligations and compliance steps are mapped directly to task queues.
* **Ecosystem Sync:** Syncs approved actions to Google Tasks and local calendars for cross-departmental alignment.

---

## 🏗️ System Architecture & Tech Stack

Mantis moves away from resource-heavy, stateful agent frameworks in favor of a clean, decoupled, and resilient micro-architecture:
Mantis moves away from resource-heavy, stateful agent frameworks (like AutoGen) in favor of a clean, decoupled, and resilient microservices architecture designed for local inference and zero UI-locking:

<img width="1536" height="1024" alt="Copilot_20260901_024713" src="https://github.com/user-attachments/assets/aca0f59d-5e98-4144-9b1a-4ef46445322e" />


## 🌟 What Sets Mantis Apart?

| Capability | Generic Cloud Chatbots | Traditional RAG | Project Mantis |
| :--- | :--- | :--- | :--- |
| **Data Privacy** | ❌ Data leaves premises | ❌ Cloud dependent | ✅ **100% Air-Gapped Local** |
| **Operational Impact** | ⚠️ Conversational only | ⚠️ Read-only extraction | ✅ **Actionable Workflow Engine** |
| **Compliance Scope** | ❌ Generic advice | ❌ No statutory mapping | ✅ **Turkish Labor Law No. 4857** |
| **Execution Safety** | ❌ Uncontrolled generation | ❌ Hallucination-prone | ✅ **Human-in-the-Loop (Harness)** |
| **State Resilience** | ⚠️ Session-based | ⚠️ Volatile memory | ✅ **SQLite + Zustand Store** |

---

## 🗺️ Roadmap & Future Horizons

- [x] **Phase 1 (Delivered MVP):** Local Foundry engine, 4857 SK compliance generator, Doc Vault redlining, unmount-safe UI.
- [ ] **Phase 2 (Harness Deepening):** Dynamic risk-tiered guardrails, continuous learning loop for contract exceptions.
- [ ] **Phase 3 (Enterprise Connectors):** Bi-directional Google Workspace / Microsoft 365 bridge and local ERP (Logo / Paraşüt) sync.

---

## 👥 Acknowledgments & Mentorship

Developed as a capstone project for the **Microsoft AI Innovators Summer Internship 2026**.

* **Author:** Hilal Uluca ([GitHub](https://github.com/hilaluluca) • [LinkedIn](https://linkedin.com/in/hilaluluca))
* **Mentor:** Special thanks to **Barbaros Gunay** for their invaluable mentorship and technical guidance throughout this journey.
