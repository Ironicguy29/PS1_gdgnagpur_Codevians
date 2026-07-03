/**
 * seed-demo-users.js
 * Seeds demo credentials for the ArogyaMitra platform, including Patient, MedicalProfile, EmergencyContact and Authentication tables.
 * Run:  node seed-demo-users.js
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI is not set in backend/.env');
  process.exit(1);
}

// 1. Legac/Authentication schema mapping for User
const UserSchema = new mongoose.Schema({
  abha_id:       { type: String, unique: true, sparse: true },
  name:          { type: String, required: true },
  email:         { type: String, unique: true, sparse: true },
  phone:         { type: String, required: true },
  role:          { type: String, enum: ['patient', 'doctor', 'admin', 'staff', 'lab', 'pharmacy', 'driver'], default: 'patient' },
  password_hash: { type: String, required: true },
  profile:       { age: Number, gender: String, address: String }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// 2. Patient Schema
const PatientSchema = new mongoose.Schema({
  patient_id: { type: String, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, sparse: true },
  dob: { type: Date, required: true },
  age: { type: Number },
  gender: { type: String, required: true },
  blood_group: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  abha_id: { type: String, unique: true, sparse: true },
  aadhaar_number: { type: String, unique: true, sparse: true },
  registration_date: { type: Date, default: Date.now },
  last_login: { type: Date, default: Date.now },
  medical_profile: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalProfile' },
  emergency_contact: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyContact' }
}, { timestamps: true });

const Patient = mongoose.model('Patient', PatientSchema);

// 3. Medical Profile Schema
const MedicalProfileSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  height: { type: Number, required: true },
  weight: { type: Number, required: true },
  allergies: [{ type: String }],
  existing_diseases: [{ type: String }],
  current_medications: [{ type: String }],
  disability: { type: String }
}, { timestamps: true });

const MedicalProfile = mongoose.model('MedicalProfile', MedicalProfileSchema);

// 4. Emergency Contact Schema
const EmergencyContactSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true }
}, { timestamps: true });

const EmergencyContact = mongoose.model('EmergencyContact', EmergencyContactSchema);

// 4.5 Counter Schema
const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', CounterSchema);

// 5. Authentication Schema
const AuthenticationSchema = new mongoose.Schema({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin', 'staff', 'lab', 'pharmacy', 'driver'], required: true },
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  last_login: { type: Date, default: Date.now },
  registration_date: { type: Date, default: Date.now }
}, { timestamps: true });

const Authentication = mongoose.model('Authentication', AuthenticationSchema);

// 6. Doctor Schema (Inline definition for seeding)
const DoctorSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization: { type: String, required: true },
  department: { type: String, required: true },
  is_available: { type: Boolean, default: false },
  current_queue_length: { type: Number, default: 0 },
  avg_consultation_time: { type: Number, default: 10 }, // minutes
  experience: { type: Number, default: 5 },
  rating: { type: Number, default: 4.5 },
  languages: { type: [String], default: ['English', 'Hindi'] },
  consultation_fee: { type: Number, default: 500 },
  photo_url: { type: String, default: '' }
});
const Doctor = mongoose.model('Doctor', DoctorSchema);

// 7. Department Schema (Inline definition for seeding)
const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  floor: { type: String, required: true },
  is_active: { type: Boolean, default: true }
});
const Department = mongoose.model('Department', DepartmentSchema);

const DEMO_PASSWORD = 'Demo@1234';

async function seed() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB');

  const password_hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Clear existing to avoid duplicate index issues during seeding
  console.log('Cleaning existing collections...');
  await User.deleteMany({ abha_id: 'patient@abha' });
  await User.deleteMany({ email: { $in: [
    'dr.sharma@hospital.gov',
    'dr.verma@hospital.gov',
    'dr.singh@hospital.gov',
    'dr.malhotra@hospital.gov',
    'admin@hospital.gov',
    'lab@hospital.gov',
    'pharmacy@hospital.gov',
    'driver@hospital.gov'
  ] } });
  
  await Authentication.deleteMany({ phone: '+919876543210' });
  await Authentication.deleteMany({ email: { $in: [
    'dr.sharma@hospital.gov',
    'dr.verma@hospital.gov',
    'dr.singh@hospital.gov',
    'dr.malhotra@hospital.gov',
    'admin@hospital.gov',
    'lab@hospital.gov',
    'pharmacy@hospital.gov',
    'driver@hospital.gov'
  ] } });

  await Patient.deleteMany({ phone: '+919876543210' });
  await Counter.deleteMany({ name: 'patient_id' });

  // Clean Doctor and Department collections
  await Doctor.deleteMany({});
  await Department.deleteMany({});

  // Seed Departments
  const cardio = await Department.create({ name: 'Cardiology', code: 'CAR', floor: '3rd Floor', is_active: true });
  const ortho = await Department.create({ name: 'Orthopedics', code: 'ORT', floor: '1st Floor', is_active: true });
  const derma = await Department.create({ name: 'Dermatology', code: 'DER', floor: '2nd Floor', is_active: true });
  const genMed = await Department.create({ name: 'General Medicine', code: 'MED', floor: 'Ground Floor', is_active: true });
  console.log('✔ Seeded departments');

  // Helper to seed a Doctor (User + Doctor + Authentication)
  const seedDoctor = async (name, email, phone, specialization, departmentName, experience, rating, languages, fee, photo_url) => {
    // 1. User doc
    const user = await User.create({
      role: 'doctor',
      email,
      name,
      phone,
      password_hash,
      profile: { age: 35 + Math.floor(Math.random() * 15), gender: 'Male', address: 'Nagpur Civil Hospital' }
    });

    // 2. Doctor doc
    await Doctor.create({
      user_id: user._id,
      specialization,
      department: departmentName,
      is_available: true,
      current_queue_length: 0,
      avg_consultation_time: 15,
      experience,
      rating,
      languages,
      consultation_fee: fee,
      photo_url
    });

    // 3. Authentication doc
    await Authentication.create({
      phone,
      email,
      password_hash,
      role: 'doctor',
      registration_date: new Date(),
      last_login: new Date()
    });

    console.log(`✔ Seeded Doctor: ${name} (${email})`);
  };

  // Seed our 4 doctors
  await seedDoctor(
    'Dr. Anita Sharma',
    'dr.sharma@hospital.gov',
    '+919876543211',
    'Cardiologist',
    'Cardiology',
    12,
    4.8,
    ['English', 'Hindi', 'Marathi'],
    500,
    'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200'
  );

  await seedDoctor(
    'Dr. Rajesh Verma',
    'dr.verma@hospital.gov',
    '+919876543213',
    'Orthopedist',
    'Orthopedics',
    8,
    4.5,
    ['English', 'Hindi'],
    400,
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
  );

  await seedDoctor(
    'Dr. Priya Singh',
    'dr.singh@hospital.gov',
    '+919876543214',
    'Dermatologist',
    'Dermatology',
    6,
    4.6,
    ['English', 'Hindi'],
    450,
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
  );

  await seedDoctor(
    'Dr. Vikram Malhotra',
    'dr.malhotra@hospital.gov',
    '+919876543215',
    'General Physician',
    'General Medicine',
    15,
    4.9,
    ['English', 'Hindi', 'Punjabi'],
    300,
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200'
  );

  // 2. Seed Admin
  await User.create({
    role: 'admin',
    email: 'admin@hospital.gov',
    name: 'Vikram Singh',
    phone: '+919876543212',
    password_hash,
    profile: { age: 55, gender: 'Male', address: 'Nagpur Civil Hospital' }
  });
  console.log('✔ Seeded admin: admin@hospital.gov');

  // Seed Lab Tech
  await User.create({
    role: 'lab',
    email: 'lab@hospital.gov',
    name: 'Ravi Kumar',
    phone: '+919876543220',
    password_hash,
    profile: { age: 40, gender: 'Male', address: 'Nagpur Civil Hospital' }
  });
  await Authentication.create({
    phone: '+919876543220',
    email: 'lab@hospital.gov',
    password_hash,
    role: 'lab',
    registration_date: new Date(),
    last_login: new Date()
  });
  console.log('✔ Seeded lab technician: lab@hospital.gov');

  // Seed Pharmacy Tech
  await User.create({
    role: 'pharmacy',
    email: 'pharmacy@hospital.gov',
    name: 'Meena Joshi',
    phone: '+919876543213',
    password_hash,
    profile: { age: 38, gender: 'Female', address: 'Nagpur Civil Hospital' }
  });
  await Authentication.create({
    phone: '+919876543213',
    email: 'pharmacy@hospital.gov',
    password_hash,
    role: 'pharmacy',
    registration_date: new Date(),
    last_login: new Date()
  });
  console.log('✔ Seeded pharmacist: pharmacy@hospital.gov / Meena Joshi');

  // Seed Ambulance Driver
  await User.create({
    role: 'driver',
    email: 'driver@hospital.gov',
    name: 'Arun Yadav',
    phone: '+919876543214',
    password_hash,
    profile: { age: 32, gender: 'Male', address: 'Nagpur Civil Hospital' }
  });
  await Authentication.create({
    phone: '+919876543214',
    email: 'driver@hospital.gov',
    password_hash,
    role: 'driver',
    registration_date: new Date(),
    last_login: new Date()
  });
  console.log('✔ Seeded driver: driver@hospital.gov / Arun Yadav');

  // 3. Seed Patient Flow
  // A. Create Patient
  const patient = await Patient.create({
    patient_id: 'PAT-2026-000001',
    name: 'Ramesh Patil',
    phone: '+919876543210',
    email: 'ramesh@gmail.com',
    dob: new Date('1984-06-15'),
    age: 42,
    gender: 'Male',
    blood_group: 'O+',
    address: 'Plot 12, Civil Lines',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
    abha_id: 'patient@abha',
    aadhaar_number: '123456789012',
    registration_date: new Date(),
    last_login: new Date()
  });

  // B. Create Medical Profile
  const medical = await MedicalProfile.create({
    patient_id: patient._id,
    height: 175,
    weight: 70,
    allergies: ['Dust', 'Pollen'],
    existing_diseases: ['Hypertension'],
    current_medications: ['Amlodipine 5mg'],
    disability: 'None'
  });

  // C. Create Emergency Contact
  const emergency = await EmergencyContact.create({
    patient_id: patient._id,
    name: 'Sujata Patil',
    relationship: 'Spouse',
    phone: '+919876543219'
  });

  // D. Update Patient links
  patient.medical_profile = medical._id;
  patient.emergency_contact = emergency._id;
  await patient.save();

  // E. Create Authentication record
  await Authentication.create({
    phone: '+919876543210',
    email: 'ramesh@gmail.com',
    password_hash,
    role: 'patient',
    patient_id: patient._id,
    registration_date: new Date(),
    last_login: new Date()
  });

  // F. Create legacy User record for patient compatibility
  await User.create({
    _id: patient._id,
    abha_id: 'patient@abha',
    name: 'Ramesh Patil',
    phone: '+919876543210',
    email: 'ramesh@gmail.com',
    role: 'patient',
    password_hash,
    profile: { age: 42, gender: 'Male', address: 'Plot 12, Civil Lines, Nagpur' }
  });

  console.log('✔ Seeded complete Patient flow for Ramesh Patil (patient@abha / +919876543210)');

  // G. Seed Counter for sequential IDs (Ramesh is PAT-2026-000001)
  await Counter.create({ name: 'patient_id', seq: 1 });
  console.log('✔ Initialized Counter for patient_id at 1');

  console.log('\n✅ Demo users seeded successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
