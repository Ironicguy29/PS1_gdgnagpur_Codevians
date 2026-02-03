

# 🏥 AI-Powered Government Hospital Check-up Scheduler

## 📌 Overview
Government hospitals often suffer from **long waiting times**, **overcrowding**, and **manual processes**.  
This project introduces an **AI-powered hospital management system** that automates patient flow, doctor availability, queue management, and crowd monitoring.

The system helps:
- Reduce patient waiting time
- Improve doctor efficiency
- Prevent overcrowding
- Handle emergency cases with priority

---

## 🧠 Core Idea (Simple Explanation)
Instead of standing in long physical queues:
- Patients register digitally
- Tokens are generated automatically
- AI predicts waiting time
- Doctors update availability in real time
- Admin monitors everything from one dashboard

---

## 🧰 Tech Stack

Frontend      : Next.js 14 + Tailwind CSS + Shadcn/UI
Backend       : Node.js + Express + TypeScript + Socket.io
AI Service    : Python + FastAPI
Database      : MongoDB + Redis
Infrastructure: Docker Compose
````

---

## 🏗️ High-Level System Architecture

```
+-------------+        Web/App        +------------------+
|   Patient   |  <---------------->  |    Frontend      |
+-------------+                      | (Next.js 14)     |
        |                              +--------+--------+
        | REST / WebSocket                     |
        v                                       v
+------------------+        API        +------------------+
|    Backend       |  <------------>  |   AI Service     |
| (Node + Express) |                  | (FastAPI)       |
+--------+---------+                  +--------+---------+
         |                                       |
         | DB Calls                              | AI Logic
         v                                       v
+------------------+                  +------------------+
| MongoDB / Redis  |                  | Crowd & Wait AI  |
+------------------+                  +------------------+
```

---

## 🔁 End-to-End Flow

```
Patient Registers
       |
       v
Token Generated
       |
       v
AI Predicts Waiting Time
       |
       v
Queue Updated Dynamically
       |
       v
Doctor Availability Checked
       |
       v
Patient Gets Notification
       |
       v
Check-up Completed
```

---

## 🧩 Module Breakdown

---

### 1️⃣ Smart Patient Registration Module

**Purpose**

* Register patients quickly
* Fetch old patient records automatically

```
Patient --> Registration Form --> MongoDB
```

**Benefits**

* No repeated paperwork
* Faster hospital entry

---

### 2️⃣ Token Generation & Smart Slot Allocation

**Purpose**

* Generate digital tokens
* Assign optimal time slots using AI

```
Registration --> Token Engine --> Time Slot Assigned
```

**Benefits**

* No physical queues
* Reduced crowd near OPD rooms

---

### 3️⃣ Appointment Scheduling Module

**Purpose**

* Online & walk-in appointment booking
* Department-wise scheduling

```
Patient --> Select Department --> Appointment Booked
```

---

### 4️⃣ Dynamic Queue Management Module

**Purpose**

* Automatically reorders queues
* Emergency cases handled first

```
Normal Queue
   |
   +--> Emergency Detected --> Priority Queue
```

---

### 5️⃣ Real-Time Doctor Availability Tracking

**Purpose**

* Track doctor status (Available / Busy / Absent)
* Real-time updates using Socket.io

```
Doctor Status Change
        |
        v
Socket Event --> All Dashboards Updated
```

---

### 6️⃣ 🧠 AI Hospital Crowd Monitor

**Purpose**

* Monitor room-wise crowd conditions
* Prevent overcrowding

**AI Analyzes**

* Number of people in room
* Number of doctors present
* Bed occupancy

```
Room Data / Camera Input
          |
          v
AI Analysis Engine
          |
          v
Crowd Level Prediction
```

**Crowd Levels**

```
🟢 Green  -> Safe
🟡 Yellow -> Warning
🔴 Red    -> Overcrowded
```

---

### 7️⃣ AI-Based Waiting Time Prediction

**Inputs**

* Number of patients
* Number of doctors
* Average consultation time

```
Waiting Time =
(Patients × Avg Consultation Time) / Doctors
```

**Output**

* Displayed to patients and admin

---

### 8️⃣ Priority & Emergency Case Handling

**Who Gets Priority**

* Emergency patients
* Senior citizens
* Pregnant women

```
Emergency Case
      |
      v
Moved to Top of Queue
```

---

### 9️⃣ Real-Time Notifications & Alerts

**What Patients Receive**

* Token number
* Waiting time updates
* Doctor delay alerts

```
System Event --> Notification Service --> SMS / App
```

---

### 🔟 Admin & Hospital Authority Dashboard

**Admin Can View**

* Live crowd status
* Doctor availability
* Bed occupancy
* Emergency alerts

```
Hospital Data --> Dashboard --> Admin Decisions
```

---

## ⚡ Real-Time Communication (Socket.io)

```
Any Status Change
       |
       v
Socket Event Fired
       |
       v
Instant Update to All Connected Users
```

---

## 🗄️ Database Usage

### MongoDB (Permanent Storage)

* Patients
* Doctors
* Appointments
* Tokens

### Redis (Fast Temporary Storage)

* Live queue data
* Active doctor status
* Crowd count

---

## 🐳 Infrastructure (Docker Compose)

```
+------------------+
| Frontend         |
+------------------+
| Backend          |
+------------------+
| AI Service       |
+------------------+
| MongoDB          |
+------------------+
| Redis            |
+------------------+
(All services run together)
```

---

## 🎯 Why This Project is Hackathon-Ready

* Solves a real government healthcare problem
* Uses AI with clear purpose
* Real-time system with live demo capability
* High social impact
* Scalable design

---

## 🚀 Future Enhancements

* Camera-based people counting
* Face recognition for staff attendance
* Government Health ID integration
* Predictive doctor scheduling

```

---


