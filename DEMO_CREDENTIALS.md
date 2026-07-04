# ArogyaMitra — Demo Credentials for Pitching

> **Hospital Secret Code** (for Doctor/Admin registration): `GOV_HOSPITAL_2024`

---

## 🟢 Patient Portal

| Field        | Value              |
|--------------|--------------------|
| **ABHA ID**  | `patient@abha`     |
| **Password** | `Demo@1234`        |
| **Name**     | Ramesh Patil       |
| **Phone**    | +91 98765 43210    |

---

## 🔵 Doctor Portals — All 4 Doctors

All doctors login with **Email + Password `Demo@1234`**

| # | Name                 | Email                       | Department       | Room        |
|---|----------------------|-----------------------------|------------------|-------------|
| 1 | Dr. Anita Sharma     | `dr.sharma@hospital.gov`    | Cardiology       | 304, 3rd Fl |
| 2 | Dr. Rajesh Verma     | `dr.verma@hospital.gov`     | Orthopedics      | 102, 1st Fl |
| 3 | Dr. Priya Singh      | `dr.singh@hospital.gov`     | Dermatology      | 205, 2nd Fl |
| 4 | Dr. Vikram Malhotra  | `dr.malhotra@hospital.gov`  | General Medicine | 101, GF     |

**Common Doctor Password:** `Demo@1234`

### Quick Doctor Login Steps:
1. Go to → `http://localhost:3000/auth/select`
2. Select **Doctor**
3. Enter email from table above + password `Demo@1234`
4. Dashboard shows **Upcoming Patients Queue** at the top with real-time updates

---

## ⚫ Admin HQ

| Field        | Value                         |
|--------------|-------------------------------|
| **Email**    | `admin@hospital.gov`          |
| **Password** | `Demo@1234`                   |
| **Name**     | Vikram Singh (Superintendent) |

---

## 🟣 Lab Diagnostics

| Field        | Value                          |
|--------------|--------------------------------|
| **Email**    | `lab@hospital.gov`             |
| **Password** | `Demo@1234`                    |
| **Name**     | Ravi Kumar (Chief Pathologist) |

---

## 🟠 Pharmacy Portal

| Field        | Value                         |
|--------------|-------------------------------|
| **Email**    | `pharmacy@hospital.gov`       |
| **Password** | `Demo@1234`                   |
| **Name**     | Meena Joshi (Head Pharmacist) |

Pharmacy dashboard shows a **Live Prescription Queue** at the top — click any prescription to start dispensing.

---

## 🟡 Driver Portal

| Field        | Value                         |
|--------------|-------------------------------|
| **Email**    | `driver@hospital.gov`         |
| **Password** | `Demo@1234`                   |
| **Name**     | Arun Yadav (Ambulance Driver) |

---

## 📋 Flow to Demo (End-to-End)

```
1. Login as Patient (patient@abha / Demo@1234)
   → Click "🎫 Get Token" tab
   → Select a doctor → Generate Token
   → Token appears with queue position + wait time

2. Login as Doctor (e.g. dr.sharma@hospital.gov / Demo@1234)
   → See "Upcoming Patients" panel with all waiting patients
   → Click "Call Next" to serve the next patient
   → Fill vitals, diagnosis, prescriptions → "Save & Close"

3. Login as Pharmacy (pharmacy@hospital.gov / Demo@1234)
   → See "Live Prescription Queue" at top
   → Click a prescription → select batches → Dispense
```

---

## Notes

- All passwords: **`Demo@1234`**
- **Login identifiers by role:**

  | Role      | Login with               |
  |-----------|--------------------------|
  | Patient   | ABHA ID (`patient@abha`) |
  | Doctor    | Email                    |
  | Admin     | Email                    |
  | Lab       | Email                    |
  | Pharmacy  | Email                    |
  | Driver    | Email                    |

- To re-seed all demo users: `cd backend && node seed-demo-users.js`
- `queue.json` at project root mirrors live queue state for demo/offline use

<!-- Hackathon Operational Audit Log: 2026-07-04 -->
