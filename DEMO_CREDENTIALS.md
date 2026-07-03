# ArogyaMitra — Demo Credentials for Pitching

> **Hospital Secret Code** (for Doctor/Admin registration): `GOV_HOSPITAL_2024`

---

## 🟢 Patient Portal

| Field       | Value              |
|-------------|--------------------|
| **ABHA ID** | `patient@abha`     |
| **Password**| `Demo@1234`        |
| **Name**    | Ramesh Patil       |
| **Phone**   | +91 98765 43210    |

---

## 🔵 Doctor Station

| Field       | Value                   |
|-------------|-------------------------|
| **Email**   | `dr.sharma@hospital.gov`|
| **Password**| `Demo@1234`             |
| **Name**    | Dr. Anita Sharma        |
| **Phone**   | +91 98765 43211         |

---

## ⚫ Admin HQ

| Field       | Value                    |
|-------------|--------------------------|
| **Email**   | `admin@hospital.gov`     |
| **Password**| `Demo@1234`              |
| **Name**    | Vikram Singh (Superintendent) |
| **Phone**   | +91 98765 43212          |

---

---

## 🟣 Lab Diagnostics

| Field       | Value                    |
|-------------|--------------------------|
| **Email**   | `lab@hospital.gov`       |
| **Password**| `Demo@1234`              |
| **Name**    | Ravi Kumar (Chief Pathologist) |
| **Phone**   | +91 98765 43220          |

---

## 🟠 Pharmacy Portal

| Field       | Value                        |
|-------------|------------------------------|
| **Email**   | `pharmacy@hospital.gov`      |
| **Password**| `Demo@1234`                  |
| **Name**    | Meena Joshi (Head Pharmacist)|
| **Phone**   | +91 98765 43213              |

---

## 🟡 Driver Portal

| Field       | Value                        |
|-------------|------------------------------|
| **Email**   | `driver@hospital.gov`        |
| **Password**| `Demo@1234`                  |
| **Name**    | Arun Yadav (Ambulance Driver)|
| **Phone**   | +91 98765 43214              |

---

## Notes

- All passwords are **`Demo@1234`**
- **Login identifiers by role:**
  | Role       | Login with          |
  |------------|---------------------|
  | Patient    | ABHA ID (`patient@abha`) |
  | Doctor     | Email               |
  | Admin HQ   | Email               |
  | Lab        | Email               |
  | Pharmacy   | Email               |
  | Driver     | Email               |
- Doctor / Admin / Lab / Pharmacy / Driver registration requires the **Hospital Secret Code**: `GOV_HOSPITAL_2024`
- Run `node seed-demo-users.js` from the `backend/` directory to seed all 6 demo users into the database
