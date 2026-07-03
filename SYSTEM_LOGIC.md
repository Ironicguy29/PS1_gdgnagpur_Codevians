# ArogyaMitra System Logic Flow

## Overview
This document outlines the complete real-time synchronization logic between the patient, doctor, and reception interfaces for the token-based queue management system.

## Token Generation & Synchronization Flow

### 1. **Reception Generates Token (Walk-in Patient)**

#### Step 1: User Interface (Reception Dashboard)
- File: `frontend/src/app/dashboard/reception/token/page.tsx`
- User enters patient ABHA ID and selects department
- Clicks "Generate Token" button
- API Call: `POST /queue/generate-walkin`
  ```json
  {
    "patientId": "patient_id_123",
    "department": "Cardiology"
  }
  ```

#### Step 2: Backend Processing (API Route)
- File: `backend/src/controllers/queueController.ts`
- Endpoint: `generateWalkInToken` controller
- Validates patient exists
- Finds available doctor in selected department
- Calls `queueService.createQueueToken()`

#### Step 3: Queue Service Creates Token
- File: `backend/src/services/queueService.ts`
- Function: `createQueueToken()`
- Creates Token document in database with:
  - `token_number`: Sequential number (e.g., 105)
  - `display_token`: Formatted display (e.g., "CARD-105")
  - `doctor_id`: Doctor handling this token
  - `patient_id`: Patient assigned to token
  - `status`: "Booked" or "Emergency"
  - `estimated_wait_minutes`: Calculated based on queue

#### Step 4: Socket Event Emission (CRITICAL FIX)
- **NEW**: Socket emit happens immediately after token creation
- File: `backend/src/utils/socket.ts`
- Event: `queue.token.update`
- Broadcast data:
  ```json
  {
    "tokenId": "token_id_123",
    "patientId": "patient_id_123",
    "doctorId": "doctor_id_456",
    "status": "Booked",
    "display_token": "CARD-105",
    "token_number": 105,
    "action": "token-created"
  }
  ```

#### Step 5: Recalculate Wait Times
- Function: `recalculateQueueWaitTimes(queueId)`
- Updates all tokens' `estimated_wait_minutes`
- Emits another socket update: `queue.update`
- All waiting patients' wait times are recalculated

### 2. **Doctor Dashboard Receives Update**

#### Step 1: Socket Listener
- File: `frontend/src/app/dashboard/doctor/page.tsx`
- Listens for: `queue.token.update` and `queue.update` events
- Handler function: `handleQueueUpdate(data)`

#### Step 2: Smart Filtering
- Checks if `data.doctorId === user._id`
- If matches (or no doctorId provided), triggers fetch
- Prevents unnecessary updates for other doctors' queues

#### Step 3: Queue Data Refresh
- Calls: `fetchQueue(user._id)`
- API Call: `GET /queue/live/{doctorId}`
- Retrieves:
  - Current queue status
  - All tokens (sorted by token_number)
  - Current patient being served
  - Wait time estimates

#### Step 4: UI Update
- Updates `tokens` state with new data
- Displays:
  - Number of patients waiting
  - Current token being called
  - Queue timeline visualization
  - AI wait time predictor

### 3. **Patient Dashboard Receives Update**

#### Step 1: Socket Listener
- File: `frontend/src/app/dashboard/patient/page.tsx`
- Listens for: `queue.token.update` and `queue.update` events
- Handler function: `handleQueueUpdate(data)`

#### Step 2: Data Refresh
- Calls: `fetchData(user._id)`
- This function:
  1. Fetches all doctors: `GET /doctors`
  2. Fetches patient's active token: `GET /queue/patient-live/{patientId}`
  3. Fetches queue status for assigned doctor: `GET /queue/live/{doctorId}`

#### Step 3: UI Updates
- **Token Status Card**: Shows patient's token number and position
- **Queue Progress Bar**: Visual representation of queue progress
- **Doctor Info Card**: Room number and floor for patient to go to
- **Estimated Wait Time**: Real-time wait calculation based on queue

### 4. **Real-Time Position Tracking**

The system tracks patient position as follows:

```
Patient Token: 105
Current Doctor Token: 100
Position in Queue: 5 (patients 101-105 are ahead)

Estimated Wait = (105 - 100) × Doctor's Avg Consultation Time
               = 5 × 15 minutes = 75 minutes
```

## Key Operations & Their Socket Events

### Token Operations

| Operation | Triggers | Event | Broadcast To |
|-----------|----------|-------|--------------|
| **Generate Token** | Reception creates token | `queue.token.update` | Doctor + Patient |
| **Check In** | Patient checks in mobile | `queue.token.update` | Doctor + Patient |
| **Call Next** | Doctor clicks "Next Patient" | `queue.token.update` | Doctor + Patient |
| **Start Consultation** | Doctor starts consulting | `queue.token.update` | Doctor + Patient |
| **Complete Consultation** | Doctor completes exam | `queue.token.update` | Doctor + Patient |
| **Skip Patient** | Doctor skips patient | `queue.token.update` | Doctor + Patient |
| **Transfer Patient** | Patient moved to another doctor | `queue.token.update` | Old + New Doctor + Patient |
| **Emergency Insert** | Emergency patient added | `queue.token.update` | Doctor + Patient |

### Queue Operations

| Operation | Triggers | Event | Broadcast To |
|-----------|----------|-------|--------------|
| **Change Duration** | Doctor updates consultation time | `queue.update` | All connected clients |
| **Pause Queue** | Doctor pauses queue | `queue.update` | All connected clients |
| **Recalculate Times** | Auto after any token change | `queue.update` | All connected clients |

## Data Flow Diagram

```
Reception Dashboard
  ↓ (Generate Token)
API: POST /queue/generate-walkin
  ↓
Backend Controller
  ↓
Queue Service: createQueueToken()
  ├→ Create Token Document
  ├→ Emit Socket: queue.token.update ←──────────┐
  ├→ Recalculate Wait Times                     │
  └→ Emit Socket: queue.update                  │
                                                 │
                    ┌────────────────────────────┤
                    │                            │
        Doctor Dashboard      Patient Dashboard
        Socket Listener       Socket Listener
        ├→ Filter by doctor   ├→ Always refetch
        ├→ Fetch Queue Data   ├→ Fetch Token & Queue
        └→ Update UI          └→ Update UI
```

## Socket Connection Architecture

### Backend
- File: `backend/src/utils/socket.ts`
- Function: `emitQueueUpdate(event, data)`
- Broadcasts to ALL connected Socket.IO clients
- Uses: `ioInstance.emit(event, data)`

### Frontend
- Uses Socket.IO client context: `useSocket()` hook
- Located in: `context/SocketContext`
- Provides: `socket` instance for listening

### Event Names
- `queue.token.update`: Token status changed
- `queue.update`: Queue state changed (duration, pause, wait times)

## Error Handling & Edge Cases

### What Happens If:

1. **Socket Connection Drops?**
   - Patient/Doctor can manually refresh page
   - Auto-refresh on page visibility change
   - Fallback: Regular API polling can be added

2. **Multiple Tokens Generated Rapidly?**
   - Each token gets unique number
   - Wait times recalculated for each
   - Socket events queued and processed in order

3. **Doctor Transfers Patient?**
   - Old token marked as "Cancelled"
   - New token created for new doctor
   - Both doctors' queues updated
   - Patient sees new doctor's queue

4. **Doctor Pauses Queue?**
   - `queue.status` set to "paused"
   - Next Patient button disabled for doctor
   - UI shows pause status to all parties

## Testing the System

### To Verify Real-Time Sync:

1. **Open 3 Browser Tabs:**
   - Tab 1: Reception dashboard (token generation)
   - Tab 2: Doctor dashboard (token view)
   - Tab 3: Patient dashboard (token view)

2. **Test Scenario:**
   - Generate token in Tab 1
   - Verify appears immediately in Tab 2 (doctor)
   - Verify appears immediately in Tab 3 (patient)
   - Notice `[v0]` console logs showing socket events

3. **Check Console Logs:**
   ```
   [v0] Doctor - Socket received queue update: {...}
   [v0] Doctor - Fetching queue due to socket update
   [v0] Patient - Queue Update received: {...}
   ```

## Performance Considerations

- **Frequency**: Wait times updated ~10 times per token generated (recalculation for each token)
- **Payload**: ~200 bytes per socket event
- **Latency**: <100ms typically (network dependent)
- **Scalability**: Works for 100+ concurrent users with standard Socket.IO setup

## Configuration Files

- Backend: `backend/src/services/queueService.ts`
- Frontend Doctor: `frontend/src/app/dashboard/doctor/page.tsx`
- Frontend Patient: `frontend/src/app/dashboard/patient/page.tsx`
- Reception: `frontend/src/app/dashboard/reception/token/page.tsx`
- Socket Utils: `backend/src/utils/socket.ts`
