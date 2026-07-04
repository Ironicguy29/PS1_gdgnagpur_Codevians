"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import gsap from "gsap";
import axios from "axios";
import {
  Shield,
  UserCheck,
  EyeOff,
  Database,
  Globe2,
  Brain,
  RefreshCw,
  Lock,
  Download,
  Trash2,
  FileText,
  Activity,
  Heart,
  TrendingUp,
  MapPin,
  CheckCircle,
  HelpCircle,
  Cpu,
  Fingerprint,
  Zap,
  ArrowRight,
  Play,
  Pause
} from "lucide-react";

// ==========================================
// 1. PROCEDURAL 3D BRAIN VISUALIZATION (R3F)
// ==========================================

interface BrainNode {
  pos: THREE.Vector3;
  color: string;
  size: number;
}

// Generate brain-like node coordinates (two hemispheres + stem)
const generateBrainNodes = (count = 150): BrainNode[] => {
  const nodes: BrainNode[] = [];
  const colors = ["#00D4AA", "#60A5FA", "#A78BFA", "#F472B6"];
  
  for (let i = 0; i < count; i++) {
    const isLeft = i < count / 2;
    // Spherical coordinates
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    
    // Dimension scale for a brain shape (longer in Z, wider in X, medium in Y)
    const rx = 1.0;
    const ry = 0.95;
    const rz = 1.45;
    
    // Procedural folds: modulate radius based on angles
    const folds = 1.0 + 0.18 * Math.sin(theta * 7) * Math.cos(phi * 7);
    
    let x = rx * folds * Math.sin(phi) * Math.cos(theta);
    let y = ry * folds * Math.sin(phi) * Math.sin(theta);
    let z = rz * folds * Math.cos(phi);
    
    // Hemispherical separation
    if (isLeft) {
      x -= 0.12;
    } else {
      x += 0.12;
    }
    
    // Add brain stem
    if (Math.random() < 0.15) {
      x = (Math.random() - 0.5) * 0.25;
      z = -0.3 + (Math.random() - 0.5) * 0.25;
      y = -0.6 - Math.random() * 0.7;
    }
    
    nodes.push({
      pos: new THREE.Vector3(x, y, z),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 0.04 + Math.random() * 0.05
    });
  }
  return nodes;
};

// Connections between close nodes
interface BrainConnection {
  from: THREE.Vector3;
  to: THREE.Vector3;
  id: string;
}

const generateBrainConnections = (nodes: BrainNode[]): BrainConnection[] => {
  const connections: BrainConnection[] = [];
  const maxDistance = 0.65;
  
  for (let i = 0; i < nodes.length; i++) {
    let matches = 0;
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = nodes[i].pos.distanceTo(nodes[j].pos);
      if (dist < maxDistance) {
        // Keep longitudinal fissure mostly clear (don't connect left & right sides)
        const sameSide = (nodes[i].pos.x < 0 && nodes[j].pos.x < 0) || 
                         (nodes[i].pos.x > 0 && nodes[j].pos.x > 0) ||
                         (Math.abs(nodes[i].pos.x) < 0.15 && Math.abs(nodes[j].pos.x) < 0.15);
                         
        if (sameSide && Math.random() < 0.7) {
          connections.push({
            from: nodes[i].pos,
            to: nodes[j].pos,
            id: `${i}-${j}`
          });
          matches++;
          if (matches > 3) break; // Limit density
        }
      }
    }
  }
  return connections;
};

// Single connection line component with flashing glow animation
function ConnectionLine({ from, to }: { from: THREE.Vector3; to: THREE.Vector3 }) {
  const lineRef = useRef<THREE.LineSegments>(null);
  
  useFrame(({ clock }) => {
    if (lineRef.current) {
      const t = clock.getElapsedTime();
      // Wave of light traversing connection
      const pulse = Math.sin(t * 2 + from.x * 5) * 0.5 + 0.5;
      (lineRef.current.material as THREE.LineBasicMaterial).opacity = 0.08 + pulse * 0.22;
    }
  });

  const points = useMemo(() => [from, to], [from, to]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line ref={lineRef as any}>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial
        color="#60A5FA"
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
}

// 3D Brain Core
function BrainModel({ isUploading, pulseTrigger }: { isUploading: boolean; pulseTrigger: number }) {
  const brainRef = useRef<THREE.Group>(null);
  const explosionRef = useRef<THREE.Points>(null);
  const [scale, setScale] = useState(1.4);
  const pulseScale = useRef(1.4);
  
  const nodes = useMemo(() => generateBrainNodes(140), []);
  const connections = useMemo(() => generateBrainConnections(nodes), [nodes]);

  // Explosion particles state
  const explosionCount = 80;
  const explosionPositions = useMemo(() => new Float32Array(explosionCount * 3), []);
  const explosionVelocities = useMemo(() => new Float32Array(explosionCount * 3), []);
  const explosionLifes = useRef<Float32Array>(new Float32Array(explosionCount));

  useEffect(() => {
    // Trigger explosion and scale pulse when pulseTrigger changes
    if (pulseTrigger > 0) {
      // Pulse scale
      gsap.fromTo(pulseScale, 
        { current: 1.8 }, 
        { current: 1.4, duration: 0.8, ease: "elastic.out(1.1, 0.45)", onUpdate: () => setScale(pulseScale.current) }
      );

      // Trigger explosion particles at brain center
      if (explosionRef.current) {
        const posAttr = explosionRef.current.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < explosionCount; i++) {
          // Reset to random offset inside the brain
          posAttr.setXYZ(i, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
          
          // Random outward velocity
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          const speed = 0.05 + Math.random() * 0.08;
          explosionVelocities[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
          explosionVelocities[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
          explosionVelocities[i * 3 + 2] = speed * Math.cos(phi);
          
          explosionLifes.current[i] = 1.0; // Life starts at 1.0
        }
        posAttr.needsUpdate = true;
      }
    }
  }, [pulseTrigger, explosionVelocities, explosionPositions]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Slow continuous rotation
    if (brainRef.current) {
      brainRef.current.rotation.y = t * 0.12;
      brainRef.current.rotation.x = Math.sin(t * 0.25) * 0.1;
      
      // Breathing pulse when idle
      if (pulseTrigger === 0) {
        const breathing = 1.4 + Math.sin(t * 1.5) * 0.03;
        brainRef.current.scale.setScalar(breathing);
      } else {
        brainRef.current.scale.setScalar(scale);
      }
    }

    // Update explosion particles
    if (explosionRef.current) {
      const posAttr = explosionRef.current.geometry.attributes.position as THREE.BufferAttribute;
      let hasActiveParticles = false;
      for (let i = 0; i < explosionCount; i++) {
        if (explosionLifes.current[i] > 0) {
          hasActiveParticles = true;
          // Move particle
          const px = posAttr.getX(i) + explosionVelocities[i * 3];
          const py = posAttr.getY(i) + explosionVelocities[i * 3 + 1];
          const pz = posAttr.getZ(i) + explosionVelocities[i * 3 + 2];
          posAttr.setXYZ(i, px, py, pz);
          
          // Friction and gravity
          explosionVelocities[i * 3] *= 0.95;
          explosionVelocities[i * 3 + 1] *= 0.95;
          explosionVelocities[i * 3 + 2] *= 0.95;
          
          explosionLifes.current[i] -= 0.025; // Decay life
        } else {
          // Offscreen / hidden
          posAttr.setXYZ(i, 999, 999, 999);
        }
      }
      if (hasActiveParticles) {
        posAttr.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      {/* Brain Structure */}
      <group ref={brainRef}>
        {/* Connection Lines */}
        {connections.map((conn) => (
          <ConnectionLine key={conn.id} from={conn.from} to={conn.to} />
        ))}

        {/* Neurons (Spheres/Points) */}
        {nodes.map((node, i) => (
          <mesh key={i} position={node.pos}>
            <sphereGeometry args={[node.size, 8, 8]} />
            <meshBasicMaterial
              color={isUploading && Math.random() > 0.45 ? "#FFFFFF" : node.color}
              transparent
              opacity={0.85}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Explosion Particles */}
      <points ref={explosionRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[explosionPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00D4AA"
          size={0.1}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Core Glow Aura */}
      <Sphere args={[1.5, 16, 16]}>
        <meshBasicMaterial
          color="#00D4AA"
          transparent
          opacity={0.03 + (isUploading ? 0.06 : 0)}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>
      <Sphere args={[2.0, 16, 16]}>
        <meshBasicMaterial
          color="#A78BFA"
          transparent
          opacity={0.015 + (isUploading ? 0.03 : 0)}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>
    </group>
  );
}

// Lighting & Setup Wrapper
function BrainCanvas({ isUploading, pulseTrigger }: { isUploading: boolean; pulseTrigger: number }) {
  return (
    <div className="w-full h-[400px] md:h-[450px] relative">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#00D4AA" />
        <pointLight position={[-10, -10, -10]} intensity={1.0} color="#A78BFA" />
        <BrainModel isUploading={isUploading} pulseTrigger={pulseTrigger} />
      </Canvas>
    </div>
  );
}

// ==========================================
// 2. MAIN COMMUNITY AI LEARNING COMPONENT
// ==========================================

export default function CommunityAILearning() {
  // Consent toggle
  const [shareConsent, setShareConsent] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"privacy" | "disease_intel">("privacy");

  // Ingestion Simulation state
  const [isIngesting, setIsIngesting] = useState(true);
  const [ingestionLogs, setIngestionLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Live API States
  const [dbStats, setDbStats] = useState({
    total_records: 50000,
    active_cases: 715,
    recovered_cases: 49285,
    critical_cases: 218,
    total_predicted_next_week: 1547,
    model_accuracy: 0.946,
    model_version: "v3.1",
    district_health_score: 93,
    predicted_cases_breakdown: {
      "Heat Stroke": { expected: 330, risk: "High", confidence: "High" },
      "Dehydration": { expected: 594, risk: "High", confidence: "High" },
      "Dengue": { expected: 109, risk: "Medium", confidence: "Medium" },
      "Viral Fever": { expected: 352, risk: "Medium", confidence: "High" },
      "Respiratory Disease": { expected: 9, risk: "Low", confidence: "Low" }
    },
    healthcare_capacity: {
      bed_occupancy_rate: 78.4,
      total_beds: 1200,
      available_beds: 259,
      active_doctors: 124,
      on_call_doctors: 36,
      active_ambulances: 18,
      available_ambulances: 6,
      active_health_camps: 12,
      vaccination_rate: 84.6,
      essential_medicine_levels: {
        "ORS Packets": "92% (High)",
        "IV Fluids": "86% (High)",
        "Paracetamol": "95% (High)",
        "Artemether (Malaria)": "78% (Medium)",
        "Dengue NS1 Kits": "62% (Medium - Restocking)"
      }
    }
  });

  const [weatherCorrelations, setWeatherCorrelations] = useState({
    correlations: {
      temperature_vs_heatstroke: 0.79,
      temperature_vs_dehydration: 0.78,
      rainfall_vs_dengue: 0.88,
      aqi_vs_respiratory: 0.78
    },
    sunstroke_yoy_increase: 100,
    ai_explanation: "Heat stroke cases increased by 100% in the Summer of 2026 compared to 2025. This surge is strongly correlated with prolonged heatwave conditions (correlation score of 0.79 with ambient temperatures exceeding 43°C) and lower pre-monsoon showers (-32% rainfall)."
  });

  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainingState, setTrainingState] = useState({
    status: "idle",
    progress: 0,
    current_epoch: 0,
    total_epochs: 5,
    loss: 0.15,
    accuracy: 0.946,
    batch_size: 256,
    features_importance: {
      "Temperature": 0.30,
      "Humidity": 0.188,
      "Air Quality": 0.162,
      "Rainfall": 0.156,
      "Age": 0.086,
      "District": 0.042,
      "Occupation": 0.031,
      "Gender": 0.015,
      "Village Type": 0.015
    },
    confusion_matrix: [] as number[][],
    last_trained: "2026-07-04 13:31:00",
    cpu_usage: 5,
    gpu_usage: 0,
    error_message: ""
  });

  // Fetch stats from backend
  const fetchDashboardData = async () => {
    try {
      const aiUrl = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';
      const statsRes = await axios.get(`${aiUrl}/api/disease-intelligence/dashboard`);
      setDbStats(statsRes.data);
    } catch (e) {
      console.warn("FastAPI AI Service is unreachable. Using simulated client fallback.", e);
    }
  };

  const fetchWeatherCorrelation = async () => {
    try {
      const aiUrl = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';
      const res = await axios.get(`${aiUrl}/api/disease-intelligence/weather-correlation`);
      setWeatherCorrelations(res.data);
    } catch (e) {
      console.warn("FastAPI weather endpoint failed. Using fallback.", e);
    }
  };

  // Run initial fetch on mount/tab activation
  useEffect(() => {
    if (activeTab === "disease_intel") {
      fetchDashboardData();
      fetchWeatherCorrelation();
      
      // Poll every 3 seconds for fresh data stream
      const statsInterval = setInterval(() => {
        fetchDashboardData();
      }, 3000);
      return () => clearInterval(statsInterval);
    }
  }, [activeTab]);

  // Handle log scrolling
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ingestionLogs]);

  // Simulate Ingestion Console stream
  useEffect(() => {
    if (!isIngesting || activeTab !== "disease_intel") return;

    const districts = ["Rampur", "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Nalanda", "Darbhanga"];
    const diseases = [
      { name: "Heat Stroke", symptoms: "High fever, rapid pulse, hot dry skin" },
      { name: "Dehydration", symptoms: "Extreme thirst, fatigue, dry mouth" },
      { name: "Food Poisoning", symptoms: "Nausea, vomiting, stomach cramps" },
      { name: "Dengue", symptoms: "High fever, joint pain, skin rash" },
      { name: "Malaria", symptoms: "Shivering, fever cycles, headache" },
      { name: "Respiratory Disease", symptoms: "Shortness of breath, chest tightness, coughing" }
    ];
    const ageGroups = ["Children", "Adults", "Seniors"];
    const occupations = ["Farmer", "Construction Worker", "Student", "Merchant", "Unemployed"];
    const genders = ["Male", "Female"];

    const generateLog = () => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const dist = districts[Math.floor(Math.random() * districts.length)];
      const diseaseObj = diseases[Math.floor(Math.random() * diseases.length)];
      const age = Math.floor(Math.random() * 80) + 5;
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const occup = occupations[Math.floor(Math.random() * occupations.length)];

      const logLines = [
        `[${timeStr}] 🔒 Secure Channel opened from client node in ${dist} district.`,
        `[${timeStr}] 🧩 Patient Record anonymized: Dob redacted, Phone masked, ID hashed.`,
        `[${timeStr}] 📥 Received payload size: 1.4KB. Validating schema...`,
        `[${timeStr}] 💾 Inserted to PostgreSQL (Bihar dataset): Age ${age}, ${gender}, ${occup}.`,
        `[${timeStr}] 🧠 AI Feature extractor: Symptoms matched: "${diseaseObj.symptoms}".`,
        `[${timeStr}] 📊 Outbreak predictor: Heat Index verified. Correlation score updated.`
      ];

      setIngestionLogs(prev => {
        const nextLogs = [...prev, ...logLines];
        if (nextLogs.length > 50) return nextLogs.slice(nextLogs.length - 50);
        return nextLogs;
      });
    };

    if (ingestionLogs.length === 0) {
      setIngestionLogs([
        "[" + new Date().toTimeString().split(' ')[0] + "] 🌐 Connection established with Decentralized Medical Nodes.",
        "[" + new Date().toTimeString().split(' ')[0] + "] 🚀 Ingestion Stream ACTIVE. Listening on port 8000...",
        "[" + new Date().toTimeString().split(' ')[0] + "] 📊 PostgreSQL seeding verified: 50,000+ patient records ready."
      ]);
    }

    const interval = setInterval(generateLog, 3000);
    return () => clearInterval(interval);
  }, [isIngesting, activeTab, ingestionLogs.length]);

  // Trigger ML Training
  const triggerModelTraining = async () => {
    if (isTraining) return;
    setIsTraining(true);
    
    setTrainingState(prev => ({
      ...prev,
      status: "training",
      progress: 0,
      current_epoch: 0,
      loss: 2.85,
      accuracy: 0.10,
      cpu_usage: 65,
      gpu_usage: 45
    }));

    try {
      const aiUrl = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';
      await axios.post(`${aiUrl}/api/disease-intelligence/train`);

      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await axios.get(`${aiUrl}/api/disease-intelligence/training-status`);
          const statusData = statusRes.data;

          setTrainingState(prev => ({
            ...prev,
            status: statusData.status,
            progress: statusData.progress,
            current_epoch: statusData.current_epoch,
            total_epochs: statusData.total_epochs,
            loss: statusData.loss,
            accuracy: statusData.accuracy,
            cpu_usage: statusData.status === "training" ? statusData.cpu_usage : 5,
            gpu_usage: statusData.status === "training" ? statusData.gpu_usage : 0,
            features_importance: Object.keys(statusData.features_importance).length > 0
              ? statusData.features_importance
              : prev.features_importance,
            confusion_matrix: statusData.confusion_matrix.length > 0
              ? statusData.confusion_matrix
              : prev.confusion_matrix,
            last_trained: statusData.last_trained || prev.last_trained,
            error_message: statusData.error_message
          }));

          if (statusData.status === "completed" || statusData.status === "failed") {
            clearInterval(pollInterval);
            setIsTraining(false);
            if (statusData.status === "completed") {
              fetchDashboardData();
            }
          }
        } catch (err) {
          console.error("Error polling training status:", err);
          pollCount++;
          if (pollCount > 15) {
            clearInterval(pollInterval);
            setIsTraining(false);
            setTrainingState(prev => ({ ...prev, status: "failed", error_message: "Polling timeout/connection lost." }));
          }
        }
      }, 1000);
    } catch (e) {
      console.error("Failed to start training on FastAPI server. Falling back to local simulation.", e);
      let progress = 0;
      const simInterval = setInterval(() => {
        progress += 20;
        const current_epoch = progress / 20;
        const losses = [2.2, 1.6, 1.1, 0.6, 0.15];
        const accuracies = [0.45, 0.62, 0.78, 0.88, 0.94];
        
        setTrainingState(prev => ({
          ...prev,
          status: progress >= 100 ? "completed" : "training",
          progress,
          current_epoch,
          loss: losses[current_epoch - 1] || 0.15,
          accuracy: accuracies[current_epoch - 1] || 0.94,
          cpu_usage: progress >= 100 ? 5 : Math.floor(Math.random() * 20) + 70,
          gpu_usage: progress >= 100 ? 0 : Math.floor(Math.random() * 30) + 50,
          last_trained: progress >= 100 ? new Date().toLocaleTimeString() : prev.last_trained
        }));

        if (progress >= 100) {
          clearInterval(simInterval);
          setIsTraining(false);
        }
      }, 1000);
    }
  };
  
  // Anonymization process variables
  const [anonymizeStep, setAnonymizeStep] = useState<"idle" | "anonymizing" | "completed">("idle");
  const [privacyScore, setPrivacyScore] = useState(40);
  
  // Pipeline simulation stages
  const [pipelineStage, setPipelineStage] = useState<
    "idle" | "preparing" | "anonymizing" | "encrypting" | "uploading" | "training" | "success"
  >("idle");
  const [progressVal, setProgressVal] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pulseTrigger, setPulseTrigger] = useState(0);
  
  // Anonymized data states
  const [patientInfo, setPatientInfo] = useState({
    name: "Rahul Sharma",
    age: "29",
    dob: "15/08/1996",
    phone: "+91 98765 43210",
    address: "12, Subhash Marg, Rampur",
    doctor: "Dr. Aditya Sen",
    village: "Rampur Village",
    symptoms: "Chronic cough, chest tightness, night fatigue",
    bloodPressure: "128/82 mmHg",
    heartRate: "78 bpm",
    reports: "Chest X-Ray shows consolidation in right lower lobe"
  });

  // Animated numbers
  const [patientCount, setPatientCount] = useState(125487);
  const [contributionsToday, setContributionsToday] = useState(482);
  const [accuracy, setAccuracy] = useState(89.0);
  const [datasetCount, setDatasetCount] = useState(14583);

  // Status updates right panel
  const [learningStatus, setLearningStatus] = useState("Awaiting Anonymous Records...");
  const learningSteps = [
    "Analyzing Symptoms Patterns...",
    "Learning Regional Disease Co-relations...",
    "Updating Transformer Model Weights...",
    "Improving Clinical Diagnosis Predictions..."
  ];

  // SVG Packets layout triggers
  const [activePackets, setActivePackets] = useState<number[]>([]);
  const packetContainerRef = useRef<HTMLDivElement>(null);
  
  // Dashboard increments when contribution succeeds
  useEffect(() => {
    if (pipelineStage === "success") {
      // Animate increment counters
      gsap.to({ val: patientCount }, {
        val: patientCount + 1,
        duration: 2.0,
        onUpdate: function () { setPatientCount(Math.floor(this.targets()[0].val)); }
      });
      gsap.to({ val: contributionsToday }, {
        val: contributionsToday + 1,
        duration: 1.5,
        onUpdate: function () { setContributionsToday(Math.floor(this.targets()[0].val)); }
      });
      gsap.to({ val: datasetCount }, {
        val: datasetCount + 1,
        duration: 1.5,
        onUpdate: function () { setDatasetCount(Math.floor(this.targets()[0].val)); }
      });
      // Increment accuracy in steps
      const accuracyTimeline = gsap.timeline();
      accuracyTimeline
        .to({ val: 89.0 }, {
          val: 89.3,
          duration: 1.0,
          onUpdate: function () { setAccuracy(Number(this.targets()[0].val.toFixed(1))); }
        })
        .to({ val: 89.3 }, {
          val: 89.8,
          duration: 1.0,
          delay: 0.5,
          onUpdate: function () { setAccuracy(Number(this.targets()[0].val.toFixed(1))); }
        })
        .to({ val: 89.8 }, {
          val: 90.2,
          duration: 1.0,
          delay: 0.5,
          onUpdate: function () { setAccuracy(Number(this.targets()[0].val.toFixed(1))); }
        });
    }
  }, [pipelineStage]);

  // Cycles training status dynamically in right panel
  useEffect(() => {
    let index = 0;
    if (pipelineStage === "training") {
      const interval = setInterval(() => {
        setLearningStatus(learningSteps[index]);
        index = (index + 1) % learningSteps.length;
      }, 1000);
      return () => clearInterval(interval);
    } else if (pipelineStage === "success") {
      setLearningStatus("Neural Network Updated (v2.8.4)");
    } else if (pipelineStage === "idle") {
      setLearningStatus("Awaiting Anonymous Records...");
    }
  }, [pipelineStage]);

  // Periodic random map contribution pulses
  useEffect(() => {
    const triggerMapContribution = () => {
      if (Math.random() > 0.4) {
        // Fire packet from one of the map locations
        const packetId = Date.now();
        setActivePackets(prev => [...prev, packetId]);
        
        // Remove packet after animation ends
        setTimeout(() => {
          setActivePackets(prev => prev.filter(id => id !== packetId));
          // Glow brain subtly on receipt of map packet
          setPulseTrigger(p => p + 1);
        }, 1800);
      }
    };
    
    const interval = setInterval(triggerMapContribution, 4500);
    return () => clearInterval(interval);
  }, []);

  // Anonymization animation
  const runAnonymization = async () => {
    if (anonymizeStep !== "idle") return;
    setAnonymizeStep("anonymizing");
    setPipelineStage("anonymizing");
    setProgressVal(15);
    
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Field 1: Name -> redacted
    await delay(600);
    setPatientInfo(prev => ({ ...prev, name: "██████████" }));
    setPrivacyScore(55);
    setProgressVal(20);
    
    // Field 2: Phone -> removed
    await delay(500);
    setPatientInfo(prev => ({ ...prev, phone: "Removed [Privacy Protocol]" }));
    setPrivacyScore(68);
    setProgressVal(25);
    
    // Field 3: Address -> removed
    await delay(500);
    setPatientInfo(prev => ({ ...prev, address: "Removed [Privacy Protocol]" }));
    setPrivacyScore(78);
    setProgressVal(30);
    
    // Field 4: Doctor Name -> removed
    await delay(450);
    setPatientInfo(prev => ({ ...prev, doctor: "Removed [Privacy Protocol]" }));
    setPrivacyScore(85);
    setProgressVal(35);
    
    // Field 5: Village -> Generalize
    await delay(500);
    setPatientInfo(prev => ({ ...prev, village: "Patna District (Generalized)" }));
    setPrivacyScore(92);
    setProgressVal(40);
    
    // Field 6: DOB -> Age Group
    await delay(500);
    setPatientInfo(prev => ({ ...prev, dob: "25-30 Years (Age Grouped)" }));
    setPrivacyScore(100);
    setProgressVal(50);
    
    setAnonymizeStep("completed");
    await delay(400);
  };

  // Full demo animation trigger
  const runFullSecureShare = async () => {
    if (pipelineStage !== "idle" && pipelineStage !== "success") return;
    
    // Auto-enable consent toggle with animation
    setShareConsent(true);
    
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Step 1: Preparing Data
    setPipelineStage("preparing");
    setProgressVal(5);
    await delay(900);
    
    // Step 2: Anonymizing
    await runAnonymization();
    
    // Step 3: Encrypting
    setPipelineStage("encrypting");
    setProgressVal(60);
    await delay(1200);
    
    // Step 4: Uploading
    setPipelineStage("uploading");
    setIsUploading(true);
    setProgressVal(75);
    
    // Launch hexagons flow
    const packetId1 = Date.now();
    const packetId2 = Date.now() + 1;
    const packetId3 = Date.now() + 2;
    setActivePackets(p => [...p, packetId1, packetId2, packetId3]);
    
    await delay(1000);
    setProgressVal(85);
    await delay(800);
    
    // Remove uploading state, trigger brain pulses
    setIsUploading(false);
    setActivePackets(p => p.filter(id => id !== packetId1 && id !== packetId2 && id !== packetId3));
    setPulseTrigger(p => p + 1);
    
    // Step 5: Training AI
    setPipelineStage("training");
    setProgressVal(90);
    await delay(2000);
    
    // Step 6: Success
    setPipelineStage("success");
    setProgressVal(100);
  };

  const resetDemo = () => {
    setShareConsent(false);
    setAnonymizeStep("idle");
    setPrivacyScore(40);
    setPipelineStage("idle");
    setProgressVal(0);
    setIsUploading(false);
    setAccuracy(89.0);
    setPatientInfo({
      name: "Rahul Sharma",
      age: "29",
      dob: "15/08/1996",
      phone: "+91 98765 43210",
      address: "12, Subhash Marg, Rampur",
      doctor: "Dr. Aditya Sen",
      village: "Rampur Village",
      symptoms: "Chronic cough, chest tightness, night fatigue",
      bloodPressure: "128/82 mmHg",
      heartRate: "78 bpm",
      reports: "Chest X-Ray shows consolidation in right lower lobe"
    });
  };

  // Mock download data
  const downloadRecordsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(patientInfo, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "arogyamitra_anonymous_medical_record.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <section 
      id="community-learning"
      className="relative py-28 px-6 md:px-12 bg-gradient-to-b from-navy via-[#070b16] to-navy overflow-hidden w-full border-t border-default"
    >
      
      {/* BACKGROUND DECORATIONS (LABORATORY HUD EFFECT) */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.25] pointer-events-none z-0" />
      
      {/* Floating Laboratory Orbs */}
      <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-teal/5 to-purple-500/5 rounded-full blur-[140px] -top-32 -left-64 pointer-events-none z-0" />
      <div className="absolute w-[700px] h-[700px] bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-[160px] -bottom-32 -right-64 pointer-events-none z-0" />

      {/* Dynamic Background SVG - Medical cross, pulses, and grid accents */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 select-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Pulsing Grid Crosses */}
          <g fill="none" stroke="rgba(0, 212, 170, 0.2)" strokeWidth="1">
            <path d="M 50 100 L 70 100 M 60 90 L 60 110" />
            <path d="M 1200 400 L 1220 400 M 1210 390 L 1210 410" />
            <path d="M 150 700 L 170 700 M 160 690 L 160 710" />
          </g>
          {/* Animated DNA Wave path (Decorative) */}
          <path 
            d="M -100 300 Q 150 150 400 300 T 900 300 T 1400 300" 
            stroke="url(#grad-dna-1)" 
            strokeWidth="1.5" 
            strokeDasharray="6,6"
            fill="none"
          />
          <path 
            d="M -100 320 Q 150 170 400 320 T 900 320 T 1400 320" 
            stroke="url(#grad-dna-2)" 
            strokeWidth="1" 
            strokeDasharray="4,8"
            fill="none"
          />
          
          <defs>
            <linearGradient id="grad-dna-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="grad-dna-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.05" />
              <stop offset="50%" stopColor="#00D4AA" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal mb-4">
            <Brain size={13} className="animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase font-sans">
              Community AI Learning
            </span>
          </div>
          
          <h2 className="text-[36px] md:text-[50px] font-extrabold tracking-tight leading-[1.1] text-text-primary">
            The Smarter Our Community Learns,<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal via-cyan-400 to-blue-400">
              The Better Healthcare Becomes.
            </span>
          </h2>
          
          <p className="text-[16px] md:text-[18px] font-normal leading-[1.6] text-text-secondary mt-5 max-w-2xl mx-auto">
            Your medical information never leaves your control. With one tap, you can anonymously contribute to improving AI diagnosis for millions of rural patients.
          </p>
        </div>

        {/* Glassmorphic Tab Controller */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1 rounded-2xl bg-surface-2/65 backdrop-blur-xl border border-default shadow-lg">
            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === "privacy"
                  ? "bg-teal text-navy shadow-[0_0_15px_rgba(0,212,170,0.3)]"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Shield size={14} />
              Privacy & Data Simulator
            </button>
            <button
              onClick={() => setActiveTab("disease_intel")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all duration-300 relative ${
                activeTab === "disease_intel"
                  ? "bg-teal text-navy shadow-[0_0_15px_rgba(0,212,170,0.3)]"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Activity size={14} />
              Disease Intelligence Dashboard
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "privacy" ? (
            <motion.div
              key="privacy-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              {/* INTERACTIVE WORKSPACE (3 COLUMN GRID) */}
        <div ref={packetContainerRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12 relative">
          
          {/* PACKET TRANSIT OVERLAY CONTAINER */}
          <div className="absolute inset-0 pointer-events-none z-30 hidden lg:block">
            <AnimatePresence>
              {activePackets.map((id, index) => {
                // Different curved paths representing packet travel from Left Panel to Brain
                // Coordinates are calculated as percentage relative offsets
                const yOffset = 250 + (index * 40);
                return (
                  <motion.div
                    key={id}
                    className="absolute w-8 h-8 flex items-center justify-center bg-teal/20 border border-teal rounded-lg backdrop-blur-sm shadow-[0_0_15px_rgba(0,212,170,0.5)] text-teal z-40"
                    initial={{ x: "20%", y: `${yOffset}px`, scale: 0.5, opacity: 0 }}
                    animate={{
                      x: ["20%", "35%", "46%", "49%"],
                      y: [`${yOffset}px`, `${yOffset - 120}px`, `${yOffset - 60}px`, "220px"],
                      scale: [0.5, 1.2, 0.9, 0.1],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                      duration: 1.8,
                      ease: "easeInOut",
                      times: [0, 0.3, 0.8, 1]
                    }}
                  >
                    <Lock size={12} className="animate-pulse" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* COLUMN 1: LEFT PANEL (HEALTH DATA PREPARATION) */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-surface-2/65 backdrop-blur-xl border border-default rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all duration-300">
            {/* Ambient edge glow */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-teal/40 via-transparent to-transparent" />
            
            <div>
              <div className="flex items-center justify-between border-b border-strong pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-text-primary">Your Health Data</h3>
                    <p className="text-[11px] text-text-secondary">Interactive Patient Profile</p>
                  </div>
                </div>
                
                {/* Privacy Badge */}
                <div className="flex items-center gap-1.5 bg-[#0F172A] border border-strong rounded-full px-2.5 py-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${anonymizeStep === "completed" ? "bg-success" : "bg-caution animate-pulse"}`} />
                  <span className="text-[10px] font-bold text-text-primary font-mono">{privacyScore}% Safe</span>
                </div>
              </div>

              {/* Patient Fields Checklist */}
              <div className="space-y-3 font-sans text-sm">
                
                {/* Name */}
                <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-3/50 border border-transparent transition-all">
                  <div className="flex justify-between items-center text-[12px] text-text-secondary">
                    <span>Patient Name</span>
                    <span className="font-mono text-[10px] text-teal">Identity</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-semibold text-text-primary tracking-wide transition-all duration-500">
                      {patientInfo.name}
                    </span>
                    {anonymizeStep === "completed" && <CheckCircle size={14} className="text-success" />}
                  </div>
                </div>

                {/* DOB */}
                <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-3/50 border border-transparent">
                  <div className="flex justify-between items-center text-[12px] text-text-secondary">
                    <span>Date of Birth</span>
                    <span className="font-mono text-[10px] text-teal">Age Grouping</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-text-primary transition-all duration-500 font-mono">
                      {patientInfo.dob}
                    </span>
                    {anonymizeStep === "completed" && <CheckCircle size={14} className="text-success" />}
                  </div>
                </div>

                {/* Contact (Phone) */}
                <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-3/50 border border-transparent">
                  <div className="flex justify-between items-center text-[12px] text-text-secondary">
                    <span>Phone Number</span>
                    <span className="font-mono text-[10px] text-emergency">Removed</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-text-primary font-mono text-[13px] ${anonymizeStep === "completed" ? "text-text-muted italic" : ""}`}>
                      {patientInfo.phone}
                    </span>
                    {anonymizeStep === "completed" && <CheckCircle size={14} className="text-success" />}
                  </div>
                </div>

                {/* Address */}
                <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-3/50 border border-transparent">
                  <div className="flex justify-between items-center text-[12px] text-text-secondary">
                    <span>Address</span>
                    <span className="font-mono text-[10px] text-emergency">Removed</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-text-primary text-[13px] ${anonymizeStep === "completed" ? "text-text-muted italic" : ""}`}>
                      {patientInfo.address}
                    </span>
                    {anonymizeStep === "completed" && <CheckCircle size={14} className="text-success" />}
                  </div>
                </div>

                {/* Village / Generalization */}
                <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-3/50 border border-transparent">
                  <div className="flex justify-between items-center text-[12px] text-text-secondary">
                    <span>Origin Location</span>
                    <span className="font-mono text-[10px] text-teal">Generalized</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-text-primary text-[13px]">
                      {patientInfo.village}
                    </span>
                    {anonymizeStep === "completed" && <CheckCircle size={14} className="text-success" />}
                  </div>
                </div>

                {/* Symptoms / Clinical Details */}
                <div className="flex flex-col gap-1 p-2.5 rounded-lg border border-dashed border-teal/20 bg-teal/5">
                  <div className="flex justify-between items-center text-[12px] text-teal">
                    <span>Symptoms & Diagnostic Text</span>
                    <span className="font-mono text-[10px] font-bold text-success">ANONYMIZED PATTERN</span>
                  </div>
                  <p className="text-xs text-text-primary font-medium mt-1 leading-[1.4]">
                    {patientInfo.symptoms} — BP: {patientInfo.bloodPressure}, HR: {patientInfo.heartRate}.
                  </p>
                  <p className="text-[11px] text-text-secondary mt-1 italic border-t border-white/5 pt-1">
                    {patientInfo.reports}
                  </p>
                </div>
              </div>
            </div>

            {/* Left Column Trigger button */}
            <div className="mt-6 pt-4 border-t border-strong">
              <button
                onClick={runAnonymization}
                disabled={anonymizeStep !== "idle"}
                className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all duration-300 outline-none ${
                  anonymizeStep === "completed"
                    ? "bg-success/10 border-success/20 text-success"
                    : anonymizeStep === "anonymizing"
                    ? "bg-surface-3 border-default text-text-secondary cursor-not-allowed"
                    : "bg-surface-3 hover:bg-surface-2 border-default text-text-primary active:scale-[0.98]"
                }`}
              >
                {anonymizeStep === "completed" ? (
                  <>
                    <UserCheck size={16} />
                    Personal Information Removed
                  </>
                ) : anonymizeStep === "anonymizing" ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Anonymizing Records...
                  </>
                ) : (
                  <>
                    <EyeOff size={16} />
                    Prepare for AI (Anonymize)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* COLUMN 2: CENTERPIECE (3D AI BRAIN VISUALIZATION) */}
          <div className="lg:col-span-5 flex flex-col justify-between items-center relative rounded-3xl bg-surface-2/30 border border-default p-6 shadow-xl overflow-hidden group">
            {/* Cybernetic Laboratory Frame grids */}
            <div className="absolute top-0 right-0 p-3 flex flex-col items-end gap-1 font-mono text-[10px] text-teal/40 pointer-events-none">
              <span>SYS_REF: CL_108</span>
              <span>BRAIN_VOLTAGE: ACTIVE</span>
            </div>

            <div className="text-center w-full">
              <span className="text-[11px] font-mono tracking-widest text-text-secondary uppercase">
                Decentralized Neural Visualizer
              </span>
              <h3 className="text-lg font-bold text-text-primary mt-1">
                Cognitive Model Hub
              </h3>
            </div>

            {/* 3D Brain Render */}
            <div className="w-full relative select-none">
              <BrainCanvas isUploading={isUploading} pulseTrigger={pulseTrigger} />
              
              {/* Radial glow background below the canvas */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,170,0.1)_0%,transparent_60%)] pointer-events-none" />
            </div>

            {/* Simulated Packet Pulse Path Triggers (Mini counters) */}
            <div className="flex items-center justify-between w-full border-t border-strong pt-4 bg-[#080d1b]/60 rounded-xl px-4 py-2 border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal animate-ping" />
                <span className="text-xs text-text-primary font-bold font-mono">Learning Version:</span>
              </div>
              <span className="text-xs text-teal font-bold font-mono">v2.8.4-active</span>
            </div>
          </div>

          {/* COLUMN 3: RIGHT PANEL (AI LEARNING PROGRESS) */}
          <div className="lg:col-span-3 flex flex-col justify-between bg-surface-2/65 backdrop-blur-xl border border-default rounded-3xl p-6 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all duration-300">
            <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-purple-500/40 via-transparent to-transparent" />
            
            <div>
              <div className="flex items-center gap-3 border-b border-strong pb-4 mb-6">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Cpu size={18} />
                </div>
                <div>
                  <h3 className="text-md font-semibold text-text-primary">AI Learning Status</h3>
                  <p className="text-[11px] text-text-secondary">Progress Analytics</p>
                </div>
              </div>

              {/* Large Circular Progress Indicator */}
              <div className="flex flex-col items-center justify-center my-6">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  
                  {/* SVG Circular Track */}
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background Circle */}
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      className="stroke-[#0D1B3E]"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Animated Progress Circle */}
                    <motion.circle
                      cx="72"
                      cy="72"
                      r="60"
                      className="stroke-teal"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={377} // 2 * PI * r = 377
                      initial={{ strokeDashoffset: 377 }}
                      animate={{ strokeDashoffset: 377 - (377 * (progressVal || 10)) / 100 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  
                  {/* Text Center */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[28px] font-bold font-mono text-text-primary tabular-nums">
                      {progressVal || 10}%
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-text-secondary">
                      {pipelineStage === "success" ? "Synced" : "Training"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini Stats list */}
              <div className="space-y-4 pt-4 border-t border-strong">
                
                {/* Dataset Records */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Anonymous Records</span>
                  <span className="font-bold text-text-primary font-mono tabular-nums">
                    {datasetCount.toLocaleString()}
                  </span>
                </div>

                {/* Model Accuracy */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">AI Diagnostic Accuracy</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} className="text-success" />
                    <span className="font-bold text-success font-mono tabular-nums">
                      {accuracy.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Active logs output */}
                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface-3/50 border border-default">
                  <span className="text-[9px] font-mono tracking-widest text-teal uppercase">
                    Learning Console
                  </span>
                  <div className="text-xs text-text-primary font-mono leading-[1.4] min-h-[36px] flex items-center">
                    {learningStatus}
                  </div>
                </div>

              </div>
            </div>

            {/* Active Pipeline Status steps */}
            <div className="mt-6 pt-4 border-t border-strong space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                <span className={`w-1.5 h-1.5 rounded-full ${pipelineStage !== "idle" ? "bg-teal animate-pulse" : "bg-text-muted"}`} />
                <span>Simulation Phase:</span>
                <span className="text-text-primary font-bold uppercase font-mono">{pipelineStage}</span>
              </div>
              <div className="w-full bg-[#0D1B3E] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal to-purple-500 h-full transition-all duration-500" 
                  style={{ width: `${progressVal}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM CONSENT GLASS CARD */}
        <div className="relative rounded-3xl bg-gradient-to-br from-surface-2 to-surface-1 border border-strong p-8 shadow-2xl overflow-hidden mb-16">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-teal via-purple-500 to-teal" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Consent Info */}
            <div className="lg:col-span-7">
              <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Shield className="text-teal" size={22} />
                You Are Always In Control
              </h3>
              <p className="text-sm text-text-secondary mt-3 leading-[1.6]">
                Contributions are 100% voluntary, fully anonymized on your local device before transmission, and secured using AES-256 military-grade encryption. No personal identifiers (name, contacts, location details) ever leave your device.
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs text-teal font-medium">
                <CheckCircle size={14} className="text-teal" />
                <span>Only anonymous medical patterns are shared to build a safer database.</span>
              </div>
            </div>

            {/* Toggle + Actions */}
            <div className="lg:col-span-5 flex flex-col md:flex-row items-center justify-end gap-6">
              
              {/* Premium Slide Toggle */}
              <div className="flex items-center gap-3 bg-surface-3/50 px-4 py-3 rounded-2xl border border-default">
                <span className="text-xs font-semibold text-text-secondary">
                  Share Anonymous Data
                </span>
                
                <button
                  onClick={() => setShareConsent(!shareConsent)}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-300 outline-none ${
                    shareConsent ? "bg-teal" : "bg-surface-2 border border-strong"
                  }`}
                >
                  <motion.div
                    className={`absolute top-[3px] left-[4px] w-6 h-6 rounded-full bg-text-primary shadow-md flex items-center justify-center`}
                    animate={{ x: shareConsent ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  >
                    <Fingerprint size={12} className={shareConsent ? "text-teal" : "text-text-secondary"} />
                  </motion.div>
                </button>
              </div>

              {/* Active Action button */}
              <button
                onClick={runFullSecureShare}
                disabled={pipelineStage !== "idle" && pipelineStage !== "success"}
                className={`relative overflow-hidden px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 outline-none ${
                  pipelineStage !== "idle" && pipelineStage !== "success"
                    ? "bg-surface-3 border border-default text-text-secondary cursor-not-allowed"
                    : "bg-teal text-navy hover:shadow-[0_0_20px_rgba(0,212,170,0.4)] hover:bg-teal-muted active:scale-[0.98]"
                }`}
              >
                {pipelineStage === "success" ? (
                  <>
                    <CheckCircle size={16} />
                    Model Synced Successfully!
                  </>
                ) : pipelineStage !== "idle" ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Secure Transfer Active
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Share Securely
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-strong text-xs font-semibold">
            
            {/* 1. Download Records */}
            <button
              onClick={downloadRecordsJson}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-3 border border-default hover:bg-surface-2 hover:text-teal text-text-secondary transition-all"
            >
              <Download size={14} />
              Download My Records
            </button>

            {/* 2. Delete Data */}
            <button
              onClick={resetDemo}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-3 border border-default hover:bg-emergency/10 hover:border-emergency/30 hover:text-emergency text-text-secondary transition-all"
            >
              <Trash2 size={14} />
              Delete My Data
            </button>

            {/* 3. View Policy */}
            <a
              href="#privacy"
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-3 border border-default hover:bg-surface-2 hover:text-purple-400 text-text-secondary transition-all text-center"
            >
              <Shield size={14} />
              View Privacy Policy
            </a>

            {/* 4. Reset Simulator */}
            <button
              onClick={resetDemo}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-3 border border-default hover:bg-surface-2 hover:text-teal text-text-secondary transition-all"
            >
              <RefreshCw size={14} />
              Reset Simulation
            </button>

          </div>
        </div>

        {/* REAL-TIME DASHBOARD (METRICS COUNTERS) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 p-8 bg-surface-1 border border-default rounded-3xl mb-16 relative overflow-hidden">
          {/* Subtle line sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal/5 to-transparent -translate-x-full animate-shimmer-fast pointer-events-none" />
          
          {/* Item 1: Patients Helped */}
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold">
              Patients Helped
            </span>
            <span className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight font-mono tabular-nums mt-1">
              {patientCount.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-success mt-1">
              <TrendingUp size={10} />
              <span>Real-time impact</span>
            </div>
          </div>

          {/* Item 2: Contributions Today */}
          <div className="flex flex-col border-l border-strong pl-6">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold">
              Contributions Today
            </span>
            <span className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight font-mono tabular-nums mt-1">
              {contributionsToday.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-teal mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
              <span>Active uploads</span>
            </div>
          </div>

          {/* Item 3: Diseases Learned */}
          <div className="flex flex-col border-l border-strong pl-6">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold">
              Diseases Learned
            </span>
            <span className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight font-mono tabular-nums mt-1">
              245
            </span>
            <div className="text-[10px] text-text-secondary mt-1">
              Diagnostic patterns
            </div>
          </div>

          {/* Item 4: AI Model Version */}
          <div className="flex flex-col border-l border-strong pl-6">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold">
              AI Model Version
            </span>
            <span className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight font-mono mt-1">
              v2.8.4
            </span>
            <div className="text-[10px] text-purple-400 mt-1">
              Continuous weights
            </div>
          </div>

          {/* Item 5: Avg Diagnosis Time */}
          <div className="flex flex-col border-l border-strong pl-6">
            <span className="text-[11px] uppercase tracking-wider text-text-secondary font-semibold">
              Avg. Diagnosis Time
            </span>
            <span className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight font-mono tabular-nums mt-1">
              12 sec
            </span>
            <div className="text-[10px] text-text-secondary mt-1">
              99.2% speedup
            </div>
          </div>
        </div>

        {/* GLOBAL MAP SECTION (GLOWING REGIONAL CONTRIBUTIONS) */}
        <div className="relative rounded-3xl bg-surface-2/45 border border-default p-8 shadow-xl overflow-hidden mb-20 text-center">
          <div className="max-w-2xl mx-auto mb-10">
            <h3 className="text-xl font-bold text-text-primary flex items-center justify-center gap-2">
              <Globe2 className="text-teal" size={20} />
              Anonymous Contribution Map
            </h3>
            <p className="text-xs text-text-secondary mt-2">
              Hotspots indicate districts voluntarily providing encrypted patterns to improve state clinical prediction vectors. No patient names or addresses exist in this network.
            </p>
          </div>

          {/* Styled SVG Map Overlay with pulses */}
          <div className="w-full max-w-4xl mx-auto h-[320px] relative bg-[#090d16]/80 rounded-2xl border border-strong flex items-center justify-center overflow-hidden">
            
            {/* World / India grid mapping pattern */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#00D4AA_1px,transparent_1px),linear-gradient(to_bottom,#00D4AA_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* Stylized vector map outline of India (using simple polyline/path vectors) */}
            <svg 
              viewBox="0 0 1000 500" 
              className="w-full h-full text-blue-500/20 fill-none stroke-current stroke-[1.5]"
            >
              {/* General India Shape Outline */}
              <path 
                d="M 500 80 
                   L 520 100 L 530 130 L 580 160 L 610 170 L 620 180 L 590 190 L 570 215 L 595 240 L 580 260 L 640 260 L 660 250 L 680 270 
                   L 660 280 L 620 285 L 590 300 L 570 330 L 550 380 L 540 420 L 525 460 L 520 480 L 515 460 L 500 420 L 490 380 L 460 360 
                   L 440 330 L 442 300 L 420 280 L 390 285 L 360 270 L 380 250 L 365 220 L 410 200 L 430 195 L 435 170 L 450 160 L 470 145 
                   L 465 120 L 480 100 Z" 
                className="stroke-cyan-500/25 fill-cyan-500/5"
              />
              
              {/* Contribution hot-spots (glowing dots) */}
              {[
                { id: "h1", cx: 500, cy: 110, name: "Srinagar Hub" },
                { id: "h2", cx: 460, cy: 180, name: "Rajasthan District" },
                { id: "h3", cx: 505, cy: 215, name: "Madhya Pradesh Rural" },
                { id: "h4", cx: 480, cy: 290, name: "Maharashtra Hub" },
                { id: "h5", cx: 520, cy: 400, name: "Tamil Nadu Triage" },
                { id: "h6", cx: 580, cy: 250, name: "Patna Center" },
                { id: "h7", cx: 640, cy: 260, name: "Assam Outpost" }
              ].map((spot) => (
                <g key={spot.id}>
                  {/* Outer Pulsing Ring */}
                  <circle cx={spot.cx} cy={spot.cy} r="12" className="fill-teal/10 stroke-teal/40 stroke-[0.5] animate-ping" />
                  {/* Central Node */}
                  <circle cx={spot.cx} cy={spot.cy} r="4" className="fill-teal shadow-xl" />
                  
                  {/* Pulse path towards brain center (mocked center: 500, 250) */}
                  <path 
                    d={`M ${spot.cx} ${spot.cy} Q ${(spot.cx + 500) / 2} ${(spot.cy + 250) / 2 - 40} 500 250`} 
                    className="stroke-teal/25 stroke-[1] stroke-dasharray-4 fill-none"
                  />
                </g>
              ))}
            </svg>

            {/* Floating Live contribution notifications */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-surface-3/80 border border-default rounded-xl px-4 py-2.5 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[11px] font-bold text-text-primary font-sans">
                Live Contribution received from Patna District
              </span>
            </div>
          </div>
        </div>

        {/* FEATURE HIGHLIGHTS (GRID OF 5 PREMIUM CARDS) */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-12">
            <h3 className="text-2xl font-bold text-text-primary">
              Built on Zero-Trust Principles
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Enterprise security features engineered for public rural clinics
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                icon: Shield,
                title: "Privacy First",
                desc: "Every medical record is sanitized of direct identifiers locally before model ingestion."
              },
              {
                icon: UserCheck,
                title: "User Controlled",
                desc: "Opt-in or opt-out dynamically at any moment. Your data contribution remains strictly voluntary."
              },
              {
                icon: Trash2,
                title: "Delete Anytime",
                desc: "Withdraw your records from future training runs instantly with our automatic purge engine."
              },
              {
                icon: Database,
                title: "Continuous learning",
                desc: "Clinical accuracy vectors evolve with every secure anonymous dataset upload."
              },
              {
                icon: Globe2,
                title: "Offline First",
                desc: "Secure queue records cache locally and synchronize as soon as cell signal becomes available."
              }
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={i} 
                  className="flex flex-col justify-between bg-surface-2 border border-default hover:border-teal/30 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0F172A] border border-strong flex items-center justify-center text-teal group-hover:bg-teal group-hover:text-navy transition-all duration-300">
                    <Icon size={18} />
                  </div>
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-text-primary">{feat.title}</h4>
                    <p className="text-[12px] text-text-secondary mt-2 leading-[1.5]">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    ) : (
      <motion.div
        key="disease-intel-view"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            {
              title: "Anonymous Records",
              value: dbStats.total_records.toLocaleString() + "+",
              subtext: "Secure Ingestion",
              color: "text-teal",
              icon: Database,
              trend: "Verification: Active",
              trendColor: "text-teal"
            },
            {
              title: "Active Regional Cases",
              value: dbStats.active_cases.toLocaleString(),
              subtext: "Bihar State Seeding",
              color: "text-caution",
              icon: Activity,
              trend: "+4.2% YoY Surge",
              trendColor: "text-caution"
            },
            {
              title: "Critical Admissions",
              value: dbStats.critical_cases.toLocaleString(),
              subtext: "ICU Monitoring",
              color: "text-emergency",
              icon: Heart,
              trend: "Capacity: Critical",
              trendColor: "text-emergency"
            },
            {
              title: "Predicted (Next Week)",
              value: dbStats.total_predicted_next_week.toLocaleString(),
              subtext: "Model projection",
              color: "text-purple-400",
              icon: Brain,
              trend: `Accuracy: ${(dbStats.model_accuracy * 100).toFixed(1)}%`,
              trendColor: "text-success"
            },
            {
              title: "District Health Index",
              value: dbStats.district_health_score + "%",
              subtext: "Bihar State Avg",
              color: "text-success",
              icon: CheckCircle,
              trend: "Health Warning Level: Safe",
              trendColor: "text-success"
            }
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div 
                key={i}
                className="bg-surface-2/65 backdrop-blur-xl border border-default rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-white/10 hover:shadow-2xl hover:shadow-teal/5 transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold font-sans">
                    {card.title}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#0F172A] border border-strong flex items-center justify-center">
                    <Icon size={14} className={card.color} />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-text-primary tracking-tight font-mono">
                    {card.value}
                  </span>
                  <p className="text-[11px] text-text-secondary mt-1 font-sans">{card.subtext}</p>
                </div>
                <div className={`mt-3 pt-2 border-t border-strong text-[10px] font-bold flex items-center gap-1 font-sans ${card.trendColor}`}>
                  <span>{card.trend}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Console & Model Control Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Real-time Ingestion Console */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-surface-2/65 backdrop-blur-xl border border-default rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-teal/40 via-transparent to-transparent pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between border-b border-strong pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
                    <Database size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary font-sans">Real-Time Ingestion Console</h3>
                    <p className="text-[11px] text-text-secondary font-sans">Simulated Patient Data Stream</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 bg-[#0F172A] border border-strong rounded-full px-2.5 py-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isIngesting ? "bg-success animate-pulse" : "bg-text-muted"}`} />
                  <span className="text-[9px] font-bold text-text-primary font-mono">{isIngesting ? "STREAMING" : "PAUSED"}</span>
                </div>
              </div>

              {/* Console Screen */}
              <div className="bg-[#050811] border border-strong font-mono rounded-2xl p-4 text-[10px] h-[340px] overflow-y-auto flex flex-col gap-1.5 text-teal/90 shadow-inner relative custom-scrollbar">
                {ingestionLogs.map((log, idx) => (
                  <div key={idx} className="leading-[1.5] border-b border-white/[0.01] pb-1">
                    {log}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
            </div>

            {/* Console Controls */}
            <div className="mt-4 pt-4 border-t border-strong">
              <button
                onClick={() => setIsIngesting(!isIngesting)}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all duration-300 ${
                  isIngesting
                    ? "bg-caution/10 border-caution/20 text-caution hover:bg-caution/20"
                    : "bg-success/10 border-success/20 text-success hover:bg-success/20"
                }`}
              >
                {isIngesting ? (
                  <>
                    <Pause size={14} />
                    Pause Simulation Stream
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Resume Simulation Stream
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Random Forest ML Pipeline */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-surface-2/65 backdrop-blur-xl border border-default rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-purple-500/40 via-transparent to-transparent pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between border-b border-strong pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary font-sans">Random Forest ML Pipeline</h3>
                    <p className="text-[11px] text-text-secondary font-sans">Predictive Model Control</p>
                  </div>
                </div>
                
                <div className="text-[10px] font-bold font-mono text-text-secondary bg-[#0F172A] border border-strong rounded-full px-2.5 py-1">
                  ACTIVE WEIGHTS: {dbStats.model_version}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                
                {/* Left: Model Metrics & Training Stats */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono tracking-wider text-purple-400 uppercase font-bold">
                      MODEL METRICS
                    </span>
                    
                    {/* Training status card */}
                    <div className="p-3.5 bg-surface-3/50 border border-default rounded-xl space-y-2.5 relative">
                      {isTraining && (
                        <div className="absolute inset-0 bg-navy/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4 z-10 text-center">
                          <RefreshCw className="animate-spin text-teal mb-2" size={24} />
                          <span className="text-xs font-bold text-text-primary font-sans">TRAINING MODEL PIPELINE</span>
                          <span className="text-[10px] text-text-secondary font-mono mt-1">Epoch {trainingState.current_epoch}/{trainingState.total_epochs} | Loss: {trainingState.loss.toFixed(3)}</span>
                          <div className="w-full bg-[#0D1B3E] h-1 rounded-full overflow-hidden mt-2">
                            <div className="bg-teal h-full transition-all duration-300" style={{ width: `${trainingState.progress}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-secondary font-sans">Accuracy Score</span>
                        <span className="font-bold text-success font-mono text-[13px]">
                          {(trainingState.accuracy * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-secondary font-sans">Cross-Entropy Loss</span>
                        <span className="font-bold text-text-primary font-mono">
                          {trainingState.loss.toFixed(3)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-secondary font-sans">Model Version</span>
                        <span className="font-bold text-text-primary font-mono">
                          {dbStats.model_version}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs border-t border-strong/50 pt-2">
                        <span className="text-text-secondary text-[9px] font-sans">Last Trained</span>
                        <span className="font-semibold text-text-secondary text-[9px] font-mono">
                          {trainingState.last_trained || "Awaiting training"}
                        </span>
                      </div>
                    </div>

                    {/* CPU & GPU loads */}
                    <div className="space-y-2.5">
                      <span className="text-[9px] font-mono tracking-wider text-purple-400 uppercase font-bold">
                        COMPUTE RESOURCES
                      </span>
                      
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-1 font-sans">
                          <span>AI Service CPU Load</span>
                          <span className="font-mono text-text-primary">{trainingState.cpu_usage}%</span>
                        </div>
                        <div className="w-full bg-[#0D1B3E] h-1.5 rounded-full overflow-hidden border border-default">
                          <div 
                            className="bg-gradient-to-r from-teal to-blue-400 h-full transition-all duration-300" 
                            style={{ width: `${trainingState.cpu_usage}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-text-secondary mb-1 font-sans">
                          <span>AI Accelerator GPU Load</span>
                          <span className="font-mono text-text-primary">{trainingState.gpu_usage}%</span>
                        </div>
                        <div className="w-full bg-[#0D1B3E] h-1.5 rounded-full overflow-hidden border border-default">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300" 
                            style={{ width: `${trainingState.gpu_usage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={triggerModelTraining}
                    disabled={isTraining}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all duration-300 ${
                      isTraining
                        ? "bg-surface-3 border-default text-text-secondary cursor-not-allowed"
                        : "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20 active:scale-[0.98]"
                    }`}
                  >
                    <RefreshCw size={14} className={isTraining ? "animate-spin" : ""} />
                    {isTraining ? "Training Pipeline..." : "Retrain AI Model Now"}
                  </button>
                </div>

                {/* Right: Feature Importances */}
                <div className="p-4 bg-surface-3/30 border border-default rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono tracking-wider text-teal uppercase block mb-3 font-bold">
                      FEATURE IMPORTANCE (RANDOM FOREST)
                    </span>
                    <div className="space-y-2.5">
                      {Object.entries(trainingState.features_importance)
                        .slice(0, 5)
                        .map(([feature, weight], idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-text-secondary font-sans">
                              <span>{feature}</span>
                              <span className="font-mono text-teal">{(weight * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-[#0D1B3E] h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-teal h-full transition-all duration-500" 
                                style={{ width: `${weight * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-strong/50 text-[10px] text-text-secondary leading-[1.4] font-sans">
                    ℹ️ Features are extracted securely from anonymized health data and represent coefficients used by the Random Forest classifier.
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

        {/* Bottom Outbreak Predictors & Climate Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Weather Correlations */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-surface-2/65 backdrop-blur-xl border border-default rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-teal/40 via-transparent to-transparent pointer-events-none" />
            
            <div>
              <div className="flex items-center gap-3 border-b border-strong pb-4 mb-4">
                <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-sans">Outbreak Predictions & Climate Trends</h3>
                  <p className="text-[11px] text-text-secondary font-sans">Weather & Outbreak Correlation Analysis</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                
                <div className="space-y-4">
                  <span className="text-[9px] font-mono tracking-wider text-teal uppercase block font-bold">
                    PEARSON CORRELATION COEFFICIENTS
                  </span>
                  
                  <div className="space-y-3.5">
                    {[
                      { name: "Temperature vs. Heat Stroke", score: weatherCorrelations.correlations.temperature_vs_heatstroke, desc: "Strong positive correlation" },
                      { name: "Temperature vs. Dehydration", score: weatherCorrelations.correlations.temperature_vs_dehydration, desc: "Strong positive correlation" },
                      { name: "Rainfall vs. Dengue Outbreaks", score: weatherCorrelations.correlations.rainfall_vs_dengue, desc: "Very strong vector-borne correlation" },
                      { name: "AQI vs. Respiratory Attacks", score: weatherCorrelations.correlations.aqi_vs_respiratory, desc: "Strong seasonal air quality correlation" }
                    ].map((corr, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[10.5px] font-bold text-text-secondary font-sans">
                          <span>{corr.name}</span>
                          <span className="font-mono text-teal font-extrabold">+{corr.score.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-[#0D1B3E] h-2 rounded-full overflow-hidden border border-default">
                          <div 
                            className="bg-teal h-full transition-all duration-350" 
                            style={{ width: `${corr.score * 100}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-text-secondary italic font-sans">{corr.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* YoY climate increase report */}
                <div className="p-4 bg-surface-3/30 border border-strong rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-caution">
                      <span className="w-1.5 h-1.5 rounded-full bg-caution animate-ping" />
                      <span className="text-[10px] font-bold font-sans tracking-wide">CLIMATE EMERGENCY</span>
                    </div>
                    <span className="text-[9px] font-mono tracking-wider text-text-secondary uppercase font-bold">
                      YoY SUNSTROKE PATIENTS INCREASE
                    </span>
                    <span className="text-4xl font-extrabold text-caution tracking-tight font-mono block mt-1">
                      +{weatherCorrelations.sunstroke_yoy_increase}%
                    </span>
                    <p className="text-[10.5px] text-text-secondary leading-[1.5] mt-3 bg-[#050811] border border-strong rounded-xl p-3 font-sans">
                      {weatherCorrelations.ai_explanation}
                    </p>
                  </div>
                  <div className="mt-4 text-[9px] text-text-secondary italic font-sans">
                    *Calculated based on actual historical records (2025) vs simulated forecast parameters (2026).
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Healthcare Capacity & Directives */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-surface-2/65 backdrop-blur-xl border border-default rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-purple-500/40 via-transparent to-transparent pointer-events-none" />
            
            <div>
              <div className="flex items-center gap-3 border-b border-strong pb-4 mb-4">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-sans">District Forecast & Actions</h3>
                  <p className="text-[11px] text-text-secondary font-sans">Actionable Insights & Directives</p>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[9px] font-mono tracking-wider text-purple-400 uppercase block font-bold">
                  EXPECTED PATIENTS BY DISEASE
                </span>
                
                <div className="space-y-2 h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                  {Object.entries(dbStats.predicted_cases_breakdown || {}).map(([disease, info]: any, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-[#0F172A]/50 border border-default p-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          info.risk === "High" ? "bg-emergency" : info.risk === "Medium" ? "bg-caution" : "bg-success"
                        }`} />
                        <span className="font-semibold text-text-primary font-sans">{disease}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-text-primary font-mono text-[11px]">{info.expected} expected</span>
                        <span className="text-[9px] text-text-secondary block font-mono uppercase">Confidence: {info.confidence}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-strong">
                  <span className="text-[9px] font-mono tracking-wider text-purple-400 uppercase block font-bold">
                    AI-DRIVEN PREVENTIVE DIRECTIVES
                  </span>
                  <div className="p-3.5 bg-teal/5 border border-teal/15 rounded-xl text-teal text-[11px] leading-[1.5] space-y-1 font-sans">
                    <div className="font-bold flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                      ☀️ Summer Alert: Heatstroke Protection Strategy
                    </div>
                    <div>Deploy cooling centers and pre-position IV fluids (Cold Saline) in Rampur, Gaya, and Patna district hospitals immediately. Advise farmers to avoid working between 11:00 AM and 3:00 PM.</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </motion.div>
    )}
  </AnimatePresence>

</div>
</section>
);
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
