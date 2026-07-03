/**
 * seed-digital-twin.js
 * Seeds mock/initial hospital campus information for ArogyaMitra Hospital Digital Twin.
 * Run: node seed-digital-twin.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is not set in backend/.env');
  process.exit(1);
}

// Inline schemas for seeding (avoiding TypeScript compilation issues in raw node execution)
const BuildingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  polygon_coordinates: { type: [[Number]], required: true },
  floors_count: { type: Number, default: 1 },
  description: { type: String }
});
const Building = mongoose.model('Building', BuildingSchema);

const FloorSchema = new mongoose.Schema({
  building_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  level: { type: Number, required: true },
  name: { type: String, required: true },
  layout_svg_url: { type: String }
});
const Floor = mongoose.model('Floor', FloorSchema);

const RoomSchema = new mongoose.Schema({
  floor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
  department_id: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String, required: true },
  code: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['ICU', 'OT', 'Pharmacy', 'Laboratory', 'Ward', 'OPD', 'Reception', 'Radiology', 'Billing', 'Emergency', 'Other'], 
    required: true 
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  capacity_beds: { type: Number, default: 0 },
  available_beds: { type: Number, default: 0 }
});
const Room = mongoose.model('Room', RoomSchema);

const LiveAssetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Ventilator', 'Wheelchair', 'ECG', 'Defibrillator', 'Ambulance', 'Other'], required: true },
  status: { type: String, enum: ['Active', 'Maintenance', 'Idle'], default: 'Idle' },
  building_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
  floor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor' },
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  battery_level: { type: Number, default: 100 }
});
const LiveAsset = mongoose.model('LiveAsset', LiveAssetSchema);

const OccupancySchema = new mongoose.Schema({
  target_type: { type: String, enum: ['Building', 'Floor', 'Department', 'Room'], required: true },
  target_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  current_occupancy: { type: Number, default: 0 },
  max_capacity: { type: Number, required: true }
});
const Occupancy = mongoose.model('Occupancy', OccupancySchema);

const NavigationRouteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  start_room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  end_room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  coordinates: { type: [[Number]], required: true },
  distance_meters: { type: Number, required: true },
  estimated_time_seconds: { type: Number, required: true },
  is_emergency: { type: Boolean, default: false },
  is_blocked: { type: Boolean, default: false }
});
const NavigationRoute = mongoose.model('NavigationRoute', NavigationRouteSchema);

const ParkingSchema = new mongoose.Schema({
  slot_number: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Ambulance', 'Staff', 'Visitor'], required: true },
  status: { type: String, enum: ['Available', 'Occupied'], default: 'Available' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  assigned_vehicle_id: { type: String }
});
const Parking = mongoose.model('Parking', ParkingSchema);

// Existing Department schema lookup to link departments
const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  floor: { type: String, required: true }
});
const Department = mongoose.model('Department', DepartmentSchema);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to Database');

  // Clean existing collections
  await Building.deleteMany({});
  await Floor.deleteMany({});
  await Room.deleteMany({});
  await LiveAsset.deleteMany({});
  await Occupancy.deleteMany({});
  await NavigationRoute.deleteMany({});
  await Parking.deleteMany({});
  console.log('Cleaned existing digital twin data');

  // Find existing departments to link them
  const departments = await Department.find({});
  const cardioDept = departments.find(d => d.name === 'Cardiology');
  const orthoDept = departments.find(d => d.name === 'Orthopedics');
  const dermaDept = departments.find(d => d.name === 'Dermatology');
  const genMedDept = departments.find(d => d.name === 'General Medicine');

  // 1. Seed Buildings
  // Main building polygon (square around 21.1458, 79.0882)
  const mainB = await Building.create({
    name: 'Main Clinical block',
    code: 'MAIN',
    latitude: 21.1458,
    longitude: 79.0882,
    polygon_coordinates: [
      [21.1462, 79.0879],
      [21.1462, 79.0885],
      [21.1454, 79.0885],
      [21.1454, 79.0879],
      [21.1462, 79.0879]
    ],
    floors_count: 4,
    description: 'Main multi-specialty clinical block housing ICU, OTs, Wards and OPDs'
  });

  // Emergency block polygon (small building next to main block)
  const erB = await Building.create({
    name: 'Emergency & Trauma Center',
    code: 'ER_BLOCK',
    latitude: 21.1453,
    longitude: 79.0875,
    polygon_coordinates: [
      [21.1455, 79.0873],
      [21.1455, 79.0877],
      [21.1451, 79.0877],
      [21.1451, 79.0873],
      [21.1455, 79.0873]
    ],
    floors_count: 1,
    description: '24/7 Trauma and emergency care unit'
  });

  console.log('✔ Seeded buildings');

  // 2. Seed Floors
  const mainF0 = await Floor.create({ building_id: mainB._id, level: 0, name: 'Ground Floor' });
  const mainF1 = await Floor.create({ building_id: mainB._id, level: 1, name: '1st Floor' });
  const mainF2 = await Floor.create({ building_id: mainB._id, level: 2, name: '2nd Floor' });
  const mainF3 = await Floor.create({ building_id: mainB._id, level: 3, name: '3rd Floor' });

  const erF0 = await Floor.create({ building_id: erB._id, level: 0, name: 'Ground Floor' });
  console.log('✔ Seeded floors');

  // 3. Seed Rooms/Zones
  // MAIN - Ground Floor
  const reception = await Room.create({
    floor_id: mainF0._id,
    name: 'Main Reception & Triage Lobby',
    code: 'ROOM-MAIN-F0-REC',
    type: 'Reception',
    latitude: 21.1455,
    longitude: 79.0881,
    capacity_beds: 0
  });

  const billing = await Room.create({
    floor_id: mainF0._id,
    name: 'Billing Counter & Insurance Desk',
    code: 'ROOM-MAIN-F0-BIL',
    type: 'Billing',
    latitude: 21.1455,
    longitude: 79.0883,
    capacity_beds: 0
  });

  const pharmacy = await Room.create({
    floor_id: mainF0._id,
    name: 'Central Pharmacy',
    code: 'ROOM-MAIN-F0-PHA',
    type: 'Pharmacy',
    latitude: 21.1457,
    longitude: 79.0880,
    capacity_beds: 0
  });

  // MAIN - 1st Floor (OPDs)
  const opdCardio = await Room.create({
    floor_id: mainF1._id,
    department_id: cardioDept ? cardioDept._id : undefined,
    name: 'OPD Room 101 (Cardiology)',
    code: 'ROOM-MAIN-F1-101',
    type: 'OPD',
    latitude: 21.1456,
    longitude: 79.0882,
    capacity_beds: 0
  });

  const opdGenMed = await Room.create({
    floor_id: mainF1._id,
    department_id: genMedDept ? genMedDept._id : undefined,
    name: 'OPD Room 102 (General Medicine)',
    code: 'ROOM-MAIN-F1-102',
    type: 'OPD',
    latitude: 21.1459,
    longitude: 79.0881,
    capacity_beds: 0
  });

  // MAIN - 2nd Floor (Lab & Diagnostics)
  const laboratory = await Room.create({
    floor_id: mainF2._id,
    name: 'Clinical Pathology Laboratory',
    code: 'ROOM-MAIN-F2-LAB',
    type: 'Laboratory',
    latitude: 21.1457,
    longitude: 79.0884,
    capacity_beds: 0
  });

  const radiology = await Room.create({
    floor_id: mainF2._id,
    name: 'Radiology & MRI Zone',
    code: 'ROOM-MAIN-F2-RAD',
    type: 'Radiology',
    latitude: 21.1459,
    longitude: 79.0883,
    capacity_beds: 0
  });

  // MAIN - 3rd Floor (ICU & OT)
  const icu = await Room.create({
    floor_id: mainF3._id,
    department_id: cardioDept ? cardioDept._id : undefined,
    name: 'Intensive Care Unit (ICU)',
    code: 'ROOM-MAIN-F3-ICU',
    type: 'ICU',
    latitude: 21.1456,
    longitude: 79.0882,
    capacity_beds: 15,
    available_beds: 6
  });

  const ot = await Room.create({
    floor_id: mainF3._id,
    name: 'Operating Theater Complex (OT-1)',
    code: 'ROOM-MAIN-F3-OT',
    type: 'OT',
    latitude: 21.1459,
    longitude: 79.0882,
    capacity_beds: 2,
    available_beds: 1
  });

  // ER Block - Ground Floor
  const emergencyER = await Room.create({
    floor_id: erF0._id,
    name: 'Trauma Bay / Emergency Department',
    code: 'ROOM-ER-F0-ER',
    type: 'Emergency',
    latitude: 21.1453,
    longitude: 79.0875,
    capacity_beds: 10,
    available_beds: 3
  });

  console.log('✔ Seeded rooms');

  // 4. Seed Live Assets
  await LiveAsset.create({
    name: 'Emergency Ventilator V-102',
    type: 'Ventilator',
    status: 'Active',
    building_id: mainB._id,
    floor_id: mainF3._id,
    room_id: icu._id,
    latitude: 21.14565,
    longitude: 79.08822,
    battery_level: 92
  });

  await LiveAsset.create({
    name: 'Defibrillator DF-88',
    type: 'Defibrillator',
    status: 'Idle',
    building_id: erB._id,
    floor_id: erF0._id,
    room_id: emergencyER._id,
    latitude: 21.14532,
    longitude: 79.08751,
    battery_level: 100
  });

  await LiveAsset.create({
    name: 'Patient Transport Wheelchair WC-05',
    type: 'Wheelchair',
    status: 'Active',
    building_id: mainB._id,
    floor_id: mainF0._id,
    room_id: reception._id,
    latitude: 21.14552,
    longitude: 79.08812,
    battery_level: 78
  });

  await LiveAsset.create({
    name: 'Emergency Response Ambulance AMB-04',
    type: 'Ambulance',
    status: 'Active',
    latitude: 21.14515,
    longitude: 79.08761,
    battery_level: 100
  });

  console.log('✔ Seeded live assets');

  // 5. Seed Occupancies
  await Occupancy.create({ target_type: 'Building', target_id: mainB._id, current_occupancy: 242, max_capacity: 450 });
  await Occupancy.create({ target_type: 'Building', target_id: erB._id, current_occupancy: 48, max_capacity: 80 });
  await Occupancy.create({ target_type: 'Room', target_id: icu._id, current_occupancy: 9, max_capacity: 15 });
  await Occupancy.create({ target_type: 'Room', target_id: emergencyER._id, current_occupancy: 7, max_capacity: 10 });
  console.log('✔ Seeded occupancy rates');

  // 6. Seed Parking Slots
  // Ambulance parking spots
  await Parking.create({ slot_number: 'AMB-PARK-01', type: 'Ambulance', status: 'Occupied', latitude: 21.14515, longitude: 79.08761 });
  await Parking.create({ slot_number: 'AMB-PARK-02', type: 'Ambulance', status: 'Available', latitude: 21.14515, longitude: 79.08770 });

  // Staff spots
  await Parking.create({ slot_number: 'STF-PARK-01', type: 'Staff', status: 'Occupied', latitude: 21.14522, longitude: 79.08882 });
  await Parking.create({ slot_number: 'STF-PARK-02', type: 'Staff', status: 'Available', latitude: 21.14522, longitude: 79.08892 });

  // Visitor spots
  await Parking.create({ slot_number: 'VIS-PARK-01', type: 'Visitor', status: 'Occupied', latitude: 21.14482, longitude: 79.08832 });
  await Parking.create({ slot_number: 'VIS-PARK-02', type: 'Visitor', status: 'Available', latitude: 21.14482, longitude: 79.08842 });
  await Parking.create({ slot_number: 'VIS-PARK-03', type: 'Visitor', status: 'Available', latitude: 21.14482, longitude: 79.08852 });
  console.log('✔ Seeded parking slots');

  // 7. Seed Navigation Routes
  // Path from Reception to Pharmacy (Ground floor main block)
  await NavigationRoute.create({
    name: 'Reception to Pharmacy Corridor',
    start_room_id: reception._id,
    end_room_id: pharmacy._id,
    coordinates: [
      [21.1455, 79.0881],
      [21.1456, 79.0881],
      [21.1457, 79.0880]
    ],
    distance_meters: 25,
    estimated_time_seconds: 20,
    is_emergency: false,
    is_blocked: false
  });

  // Path from Reception to Billing (Ground floor main block)
  await NavigationRoute.create({
    name: 'Reception to Billing Counter Path',
    start_room_id: reception._id,
    end_room_id: billing._id,
    coordinates: [
      [21.1455, 79.0881],
      [21.1455, 79.0882],
      [21.1455, 79.0883]
    ],
    distance_meters: 22,
    estimated_time_seconds: 15,
    is_emergency: false,
    is_blocked: false
  });

  // Path from Reception to Emergency (Cross-building connection)
  await NavigationRoute.create({
    name: 'Main Reception to Trauma Bay Corridor',
    start_room_id: reception._id,
    end_room_id: emergencyER._id,
    coordinates: [
      [21.1455, 79.0881],
      [21.1453, 79.0881],
      [21.1453, 79.0877],
      [21.1453, 79.0875]
    ],
    distance_meters: 75,
    estimated_time_seconds: 60,
    is_emergency: false,
    is_blocked: false
  });

  // Emergency Route from Trauma bay (ER) to Operating Theater (MAIN 3rd Floor)
  await NavigationRoute.create({
    name: 'Emergency Trauma-to-OT Red Corridor',
    start_room_id: emergencyER._id,
    end_room_id: ot._id,
    coordinates: [
      [21.1453, 79.0875],
      [21.1453, 79.0878],
      [21.1457, 79.0878],
      [21.1457, 79.0882],
      [21.1459, 79.0882]
    ],
    distance_meters: 95,
    estimated_time_seconds: 40,
    is_emergency: true,
    is_blocked: false
  });

  // Emergency Route from Trauma bay (ER) to ICU (MAIN 3rd Floor)
  await NavigationRoute.create({
    name: 'Emergency Trauma-to-ICU Red Corridor',
    start_room_id: emergencyER._id,
    end_room_id: icu._id,
    coordinates: [
      [21.1453, 79.0875],
      [21.1453, 79.0878],
      [21.1457, 79.0878],
      [21.1456, 79.0882]
    ],
    distance_meters: 85,
    estimated_time_seconds: 35,
    is_emergency: true,
    is_blocked: false
  });

  console.log('✔ Seeded navigation routes');
  console.log('✅ Digital twin data seeded successfully!');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
