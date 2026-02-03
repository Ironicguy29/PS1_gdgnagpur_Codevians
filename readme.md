🏥 AI-Powered Government Hospital Check-up Scheduler
📌 Overview

Government hospitals face long queues, overcrowding, and poor coordination between patients and doctors.
This project uses AI + real-time systems to manage hospital crowd, appointments, doctors, and emergencies smartly and automatically.

The system:

Reduces patient waiting time

Improves doctor utilization

Prevents overcrowding

Handles emergency cases with priority

🧠 Core Idea (In Simple Words)

Instead of people standing in lines:

Patients get digital tokens

AI predicts waiting time

Doctors update availability in real time

Admin sees everything on one dashboard

🧰 Technical Architecture
Frontend      : Next.js 14 + Tailwind CSS + Shadcn/UI
Backend       : Node.js + Express + TypeScript + Socket.io
AI Service    : Python + FastAPI
Database      : MongoDB + Redis
Infrastructure: Docker Compose

🏗️ System Architecture (High Level)
+-------------+        Web/App        +------------------+
|   Patient   |  <---------------->  |    Frontend      |
+-------------+                      | (Next.js 14)     |
        |                              +--------+--------+
        |                                       |
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

🔁 Complete Flow (End to End)
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

🧩 Module-Wise Explanation
1️⃣ Smart Patient Registration Module

What happens

Patient enters details (mobile / ID)

Old patient history is fetched automatically

Patient --> Registration Form --> Database


Why

Faster entry

No repeated paperwork

2️⃣ Token Generation & Smart Slot Allocation

What happens

System creates a digital token

AI assigns best time slot

Registration --> Token Engine --> Time Slot Assigned


Why

No physical queue

Less crowd near OPD rooms

3️⃣ Appointment Scheduling Module

What happens

Patients can book appointments

Walk-ins also supported

Patient --> Select Department --> Appointment Booked

4️⃣ Dynamic Queue Management Module

What happens

Queue changes automatically

Emergency cases move ahead

Normal Queue
   |
   +--> Emergency Detected --> Priority Queue

5️⃣ Real-Time Doctor Availability Tracking

What happens

Doctors mark status: Available / Busy / Absent

System updates instantly using Socket.io

Doctor Status Change
        |
        v
Real-Time Update --> All Dashboards

6️⃣ 🧠 AI Hospital Crowd Monitor (Key Feature)

What AI Analyzes

Number of people in room

Number of doctors present

Number of beds occupied

Camera / Data Input
        |
        v
AI Analysis Engine
        |
        v
Crowd Level Prediction


Crowd Levels

Green  -> Safe
Yellow -> Warning
Red    -> Overcrowded

7️⃣ Waiting Time Prediction (AI)

Inputs

Patients count

Doctors count

Avg consultation time

Waiting Time =
(Patients × Avg Time) / Doctors


Output

Shown to patient and admin

8️⃣ Priority & Emergency Case Handling

Who gets priority

Emergency patients

Senior citizens

Pregnant women

Emergency Case
      |
      v
Move to Top of Queue

9️⃣ Real-Time Notifications & Alerts

What patients get

Token number

Estimated wait time

Doctor delay alerts

System Event --> Notification Service --> SMS / App Alert

🔟 Admin & Hospital Authority Dashboard

What admin sees

Live crowd per room

Doctor availability

Bed occupancy

Emergency alerts

Hospital Data --> Dashboard Charts --> Admin Decisions

⚡ Real-Time Communication (Socket.io)
Doctor Status Change
        |
        v
Socket Event Fired
        |
        v
All Connected Clients Updated Instantly

🗄️ Database Design (Simple)
MongoDB (Permanent Data)

Patients

Doctors

Appointments

Tokens

Redis (Fast Temporary Data)

Live queue

Current crowd count

Active doctor status

🐳 Infrastructure (Docker Compose)
+------------------+
|  Frontend       |
+------------------+
|  Backend        |
+------------------+
|  AI Service     |
+------------------+
|  MongoDB        |
+------------------+
|  Redis          |
+------------------+
(All run together)

🎯 Why This Project Wins Hackathons

Solves real government problem

Uses AI meaningfully

Real-time + scalable

Clear social impact

Easy to demo visually

🚀 Future Enhancements

Camera-based crowd detection

Face recognition for staff

Government health ID integration

Predictive doctor scheduling
