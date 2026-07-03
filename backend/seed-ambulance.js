/**
 * seed-ambulance.js
 * Seeds a demo driver user and an available ambulance in the database.
 * Run: node seed-ambulance.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is not set in backend/.env');
  process.exit(1);
}

// User Schema (Must match app models)
const UserSchema = new mongoose.Schema({
  abha_id: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin', 'staff', 'lab', 'pharmacy', 'driver'], default: 'patient' },
  password_hash: { type: String, required: true },
  profile: { age: Number, gender: String, address: String }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Ambulance Schema
const AmbulanceSchema = new mongoose.Schema({
  registration_number: { type: String, required: true, unique: true, uppercase: true },
  vehicle_model: { type: String, required: true },
  type: { type: String, enum: ['BLS', 'ALS', 'PTS', 'critical'], default: 'BLS' },
  status: { type: String, enum: ['available', 'dispatched', 'en_route_to_patient', 'arrived_pickup', 'transporting', 'arrived_destination', 'out_of_service'], default: 'available' },
  base_location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: '' },
  },
  current_location: {
    latitude: Number,
    longitude: Number,
    speed: Number,
    heading: Number,
    updated_at: Date,
  },
  current_driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AmbulanceDriver' },
  current_trip_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AmbulanceTrip' },
  is_active: { type: Boolean, default: true },
  equipment: [{ type: String }],
  fuel_level_pct: { type: Number, default: 100 },
}, { timestamps: true });

const Ambulance = mongoose.models.Ambulance || mongoose.model('Ambulance', AmbulanceSchema);

// Ambulance Driver Schema
const AmbulanceDriverSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  license_number: { type: String, required: true, unique: true, uppercase: true, trim: true },
  license_expiry: { type: Date, required: true },
  status: { type: String, enum: ['available', 'on_trip', 'off_duty', 'on_break'], default: 'available' },
  current_ambulance_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
  current_trip_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AmbulanceTrip' },
  total_trips: { type: Number, default: 0 },
  avg_rating: { type: Number, default: 5.0, min: 0, max: 5 },
  is_active: { type: Boolean, default: true },
  address: { type: String, default: '' },
  emergency_contact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  profile_photo: { type: String },
  notes: { type: String, default: '' },
}, { timestamps: true });

const AmbulanceDriver = mongoose.models.AmbulanceDriver || mongoose.model('AmbulanceDriver', AmbulanceDriverSchema);

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Create or Find Driver User
    const email = 'driver@hospital.com';
    let user = await User.findOne({ email });

    if (!user) {
      console.log('Driver user not found, creating...');
      const passwordHash = await bcrypt.hash('password123', 10);
      user = await User.create({
        name: 'Ramesh Kumar (Driver)',
        email,
        phone: '+919876543219',
        role: 'driver',
        password_hash: passwordHash,
        profile: {
          age: 38,
          gender: 'Male',
          address: 'Wardha Road, Nagpur'
        }
      });
      console.log('Driver user created.');
    } else {
      console.log('Driver user already exists.');
    }

    // 2. Create or Find Ambulance
    const registrationNumber = 'MH-31-AM-1234';
    let ambulance = await Ambulance.findOne({ registration_number: registrationNumber });

    if (!ambulance) {
      console.log('Ambulance not found, creating...');
      ambulance = await Ambulance.create({
        registration_number: registrationNumber,
        vehicle_model: 'Force Traveler Advanced Life Support',
        type: 'ALS',
        status: 'available',
        base_location: {
          latitude: 21.1458, // Nagpur Center Hospital Location
          longitude: 79.0882,
          address: 'Orange City Hospital, Nagpur'
        },
        current_location: {
          latitude: 21.1458,
          longitude: 79.0882,
          speed: 0,
          heading: 0,
          updated_at: new Date()
        },
        equipment: ['Defibrillator', 'Ventilator', 'Oxygen Cylinder', 'ECG Monitor']
      });
      console.log('Ambulance created.');
    } else {
      console.log('Ambulance already exists.');
    }

    // 3. Create or Find Ambulance Driver profile
    const licenseNumber = 'DL-31 Nagpur 2024';
    let driver = await AmbulanceDriver.findOne({ license_number: licenseNumber });

    if (!driver) {
      console.log('Ambulance Driver profile not found, creating...');
      driver = await AmbulanceDriver.create({
        user_id: user._id,
        name: user.name,
        phone: user.phone,
        license_number: licenseNumber,
        license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5), // 5 years expiry
        status: 'available',
        current_ambulance_id: ambulance._id,
        address: 'Wardha Road, Nagpur',
        emergency_contact: {
          name: 'Savitri Devi',
          phone: '+919876543218'
        },
        notes: 'Experienced in ALS protocols.'
      });
      console.log('Ambulance Driver profile created.');
    } else {
      console.log('Ambulance Driver profile already exists.');
    }

    // 4. Link Ambulance and Driver status if not linked
    let updated = false;
    if (!ambulance.current_driver_id || !ambulance.current_driver_id.equals(driver._id)) {
      ambulance.current_driver_id = driver._id;
      await ambulance.save();
      updated = true;
    }

    if (!driver.current_ambulance_id || !driver.current_ambulance_id.equals(ambulance._id)) {
      driver.current_ambulance_id = ambulance._id;
      await driver.save();
      updated = true;
    }

    if (updated) {
      console.log('Ambulance and driver profiles linked.');
    }

    console.log('Ambulance seeding completed successfully!');
    console.log('Driver Email: driver@hospital.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
