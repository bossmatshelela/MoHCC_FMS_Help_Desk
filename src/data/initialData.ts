import { HealthDocument, UserProfile, AuditLogEntry, SystemNotification, ApiToken } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'USR-MOH-001',
    name: 'Dr. Farai Chidzero',
    email: 'f.chidzero@mohcc.gov.zw',
    role: 'ADMINISTRATOR',
    department: 'IT Help Desk & Infrastructure',
    badgeId: 'HQ-DIR-881',
    clearance: 'RESTRICTED_MEDICAL',
    mfaEnabled: true,
    biometricActive: true,
  },
  {
    id: 'USR-MOH-002',
    name: 'Tinashe Moyo',
    email: 't.moyo@mohcc.gov.zw',
    role: 'HELP_DESK_STAFF',
    department: 'IT Help Desk & Infrastructure',
    badgeId: 'IT-SPEC-402',
    clearance: 'CONFIDENTIAL',
    mfaEnabled: true,
    biometricActive: true,
  },
  {
    id: 'USR-MOH-003',
    name: 'Dr. Nyasha Sithole',
    email: 'n.sithole@mohcc.gov.zw',
    role: 'MEDICAL_OFFICER',
    department: 'Reproductive, Maternal & Child Health',
    badgeId: 'CLIN-PED-119',
    clearance: 'RESTRICTED_MEDICAL',
    mfaEnabled: true,
    biometricActive: true,
  },
  {
    id: 'USR-MOH-004',
    name: 'Blessing Marange',
    email: 'b.marange@mohcc.gov.zw',
    role: 'READ_ONLY_VIEWER',
    department: 'Personnel & Administration',
    badgeId: 'AUD-INSP-055',
    clearance: 'INTERNAL',
    mfaEnabled: true,
    biometricActive: false,
  },
];

export const INITIAL_DOCUMENTS: HealthDocument[] = [
  {
    id: 'DOC-2026-001',
    referenceNo: 'MOHCC-EPI-2026-081',
    title: 'EPI National Child Immunization Schedule & Cold Chain Protocol',
    category: 'Reproductive, Maternal & Child Health',
    confidentiality: 'RESTRICTED_MEDICAL',
    status: 'APPROVED',
    dateCreated: '2026-11-08T09:15:00Z',
    lastModified: '2026-11-09T14:22:00Z',
    authorName: 'Dr. Nyasha Sithole',
    authorDepartment: 'Reproductive, Maternal & Child Health',
    fileSize: 3420000,
    pageCount: 18,
    scanQuality: 99,
    summary:
      'Standardized national pediatric immunization guidelines for Rotavirus, Pentavalent, BCG, Measles-Rubella, and HPV. Includes NatPharm cold-chain temperature thresholds (+2°C to +8°C).',
    ocrText: `MINISTRY OF HEALTH AND CHILD CARE
EXPANDED PROGRAMME ON IMMUNIZATION (EPI)
REPUBLIC OF ZIMBABWE - NATIONAL DIRECTIVE

Section 1: Pediatric Schedule
- At Birth: BCG (0.05ml intradermal) + OPV-0
- 6 Weeks: Pentavalent-1 (DTP-HepB-Hib) + Rotavirus-1 + PCV13-1 + OPV-1
- 10 Weeks: Pentavalent-2 + Rotavirus-2 + PCV13-2 + OPV-2
- 14 Weeks: Pentavalent-3 + PCV13-3 + IPV (Inactivated Polio)
- 9 Months: Measles-Rubella 1 (MR-1) + Vitamin A
- 18 Months: MR-2 booster

Cold Chain Compliance:
All district storage depots must maintain automated digital data loggers with dual alarms set at <2°C and >8°C. Deviations exceeding 4 hours require immediate quarantine and regional helpdesk notification.`,
    extractedEntities: [
      { label: 'Programme', value: 'National EPI Expansion' },
      { label: 'Target Age', value: '0 - 18 Months' },
      { label: 'Cold-Chain Range', value: '+2°C to +8°C' },
      { label: 'Approval Authority', value: 'Director Maternal & Child Health' },
    ],
    tags: ['EPI', 'Vaccine', 'Pediatrics', 'Cold-Chain', 'Child Health'],
    encryption: {
      algorithm: 'AES-GCM-256',
      iv: 'uA1b90kL+wQ10xZ==',
      keyFingerprint: 'K-256-4F91CA88',
      encryptedSnippet: '8vG+9jHkL2/4q8w19MNaOx923k==',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      cipherLengthBytes: 3420000,
    },
    reviewHistory: [
      {
        reviewerId: 'USR-MOH-002',
        reviewerName: 'Tinashe Moyo',
        reviewerRole: 'HELP_DESK_STAFF',
        action: 'SUBMITTED',
        comment: 'High-resolution scan completed. Edge alignment verified.',
        timestamp: '2026-11-08T09:20:00Z',
      },
      {
        reviewerId: 'USR-MOH-001',
        reviewerName: 'Dr. Farai Chidzero',
        reviewerRole: 'ADMINISTRATOR',
        action: 'APPROVED',
        comment: 'Verified against National Health Strategy 2026-2030.',
        timestamp: '2026-11-09T14:22:00Z',
      },
    ],
    helpDeskTicketId: 'HD-9841',
    sampleScanType: 'vaccine_log',
  },
  {
    id: 'DOC-2026-002',
    referenceNo: 'MOHCC-IT-2026-402',
    title: 'District Hospital IT Infrastructure & EHR Gateway Connectivity Audit',
    category: 'IT Help Desk & Infrastructure',
    confidentiality: 'INTERNAL',
    status: 'APPROVED',
    dateCreated: '2026-11-06T11:30:00Z',
    lastModified: '2026-11-07T16:45:00Z',
    authorName: 'Tinashe Moyo',
    authorDepartment: 'IT Help Desk & Infrastructure',
    fileSize: 1850000,
    pageCount: 12,
    scanQuality: 97,
    summary:
      'Assessment of biometric attendance terminals, fiber optic uplinks, and local backup generators across Midlands and Manicaland provincial medical centers.',
    ocrText: `MINISTRY OF HEALTH AND CHILD CARE
DEPARTMENT OF INFORMATION TECHNOLOGY
PROVINCIAL INFRASTRUCTURE AUDIT REPORT

Facility Audited: Gweru Provincial Hospital & Mutare General Hospital
Scope: Electronic Health Record (EHR) server clusters, VSAT failover links, and biometric staff attendance terminals.

Key Findings:
1. Server Room Environment: Gweru server room temperature stable at 21.4°C. Dual UPS battery backup tested under full load for 4.2 hours.
2. Network Bandwidth: Average latency to Central MoHCC Cloud 18ms over dedicated TelOne MPLS tunnel.
3. Help Desk Tickets: 42 open tickets resolved in Q3; primary root causes were optical fiber trenching disruptions and thermal printer jams.
4. Recommendations: Deploy redundant solar inverters at 6 peripheral clinic relay stations.`,
    extractedEntities: [
      { label: 'Provinces', value: 'Midlands & Manicaland' },
      { label: 'Target Latency', value: '18ms Central Gateway' },
      { label: 'Resolved Tickets', value: '42 Tickets (Q3)' },
      { label: 'Auditor', value: 'IT Infrastructure Division' },
    ],
    tags: ['EHR', 'Infrastructure', 'Hardware', 'Network', 'Help Desk'],
    encryption: {
      algorithm: 'AES-GCM-256',
      iv: '7b9X11mZ0Qk94A1=',
      keyFingerprint: 'K-256-78AC112B',
      encryptedSnippet: 'JkL99201Zxa+912hHkWq==',
      sha256Hash: 'a12bc98342de7718294baec10294817290123fba918237192834bba771629481',
      cipherLengthBytes: 1850000,
    },
    reviewHistory: [
      {
        reviewerId: 'USR-MOH-002',
        reviewerName: 'Tinashe Moyo',
        reviewerRole: 'HELP_DESK_STAFF',
        action: 'SUBMITTED',
        comment: 'Ingested from field engineer physical signoff sheets.',
        timestamp: '2026-11-06T11:40:00Z',
      },
      {
        reviewerId: 'USR-MOH-001',
        reviewerName: 'Dr. Farai Chidzero',
        reviewerRole: 'ADMINISTRATOR',
        action: 'APPROVED',
        comment: 'Procurement recommendation approved for solar inverters.',
        timestamp: '2026-11-07T16:45:00Z',
      },
    ],
    helpDeskTicketId: 'HD-9890',
    sampleScanType: 'it_ticket',
  },
  {
    id: 'DOC-2026-003',
    referenceNo: 'MOHCC-SURV-2026-118',
    title: 'National Waterborne Pathogen & Cholera Early-Warning Surveillance',
    category: 'Epidemiology & Disease Control',
    confidentiality: 'PUBLIC',
    status: 'APPROVED',
    dateCreated: '2026-11-05T08:00:00Z',
    lastModified: '2026-11-05T10:15:00Z',
    authorName: 'Dr. Farai Chidzero',
    authorDepartment: 'Epidemiology & Disease Control',
    fileSize: 940000,
    pageCount: 6,
    scanQuality: 98,
    summary:
      'Weekly epidemiological surveillance bulletin covering water treatment chemical distribution, sentinel testing in high-density suburbs, and rapid oral rehydration salt stockpiles.',
    ocrText: `EPIDEMIOLOGICAL SURVEILLANCE BULLETIN
WEEK 45 - HARARE & CHITUNGWIZA URBAN METROPOLITAN
MINISTRY OF HEALTH AND CHILD CARE

Key Metrics:
- Suspected Cases: 14 (-62% vs prior week)
- Confirmed Cases: 2 (Culture confirmed Vibrio cholerae O1 Inaba)
- Case Fatality Rate: 0.00%
- Water Quality Monitoring: 128 boreholes sampled in Budiriro, Glen View, and Unit L. 96.8% adequate free residual chlorine (>0.5 mg/L).

Interventions:
- Distributed 15,000 WaterGuard sachets.
- Pre-positioned 4 metric tonnes of Ringer's Lactate and oral rehydration salts at Beatrice Road Infectious Diseases Hospital.`,
    extractedEntities: [
      { label: 'Surveillance Week', value: 'Epidemiological W45' },
      { label: 'Confirmed Cases', value: '2 (0.00% CFR)' },
      { label: 'Water Quality', value: '96.8% Chlorination' },
      { label: 'Target Urban Area', value: 'Harare & Chitungwiza' },
    ],
    tags: ['Surveillance', 'Epidemiology', 'Waterborne', 'Public Health'],
    encryption: {
      algorithm: 'AES-GCM-256',
      iv: '4f88192aKkL9==',
      keyFingerprint: 'K-256-11B498AA',
      encryptedSnippet: 'KmL99Axbvc810237+wQ==',
      sha256Hash: '934bca8192038472910283749102837491028374910283749102837491028374',
      cipherLengthBytes: 940000,
    },
    reviewHistory: [
      {
        reviewerId: 'USR-MOH-001',
        reviewerName: 'Dr. Farai Chidzero',
        reviewerRole: 'ADMINISTRATOR',
        action: 'APPROVED',
        comment: 'Cleared for immediate public dissemination.',
        timestamp: '2026-11-05T10:15:00Z',
      },
    ],
    sampleScanType: 'surveillance',
  },
  {
    id: 'DOC-2026-004',
    referenceNo: 'MOHCC-RMNCH-2026-059',
    title: 'Maternal Death Surveillance & Response (MDSR) Confidential Audit',
    category: 'Reproductive, Maternal & Child Health',
    confidentiality: 'RESTRICTED_MEDICAL',
    status: 'PENDING_REVIEW',
    dateCreated: '2026-11-09T14:45:00Z',
    lastModified: '2026-11-10T08:30:00Z',
    authorName: 'Dr. Nyasha Sithole',
    authorDepartment: 'Reproductive, Maternal & Child Health',
    fileSize: 4120000,
    pageCount: 24,
    scanQuality: 96,
    summary:
      'In-depth clinical audit of obstetric emergencies, blood bank cross-match turnaround times, and neonatal resuscitation bundle compliance across referral facilities.',
    ocrText: `CONFIDENTIAL - MEDICAL PRIVILEGE
MATERNAL & PERINATAL DEATH SURVEILLANCE & RESPONSE (MPDSR)
PARIRENYATWA & MPILO CENTRAL HOSPITALS

Case Review Summary:
Audit ID: MPDSR-2026-Q4-019
Facility: Parirenyatwa Group of Hospitals Maternity Unit
Primary Diagnosis: Postpartum Hemorrhage secondary to uterine atony.
Response Timeline:
- Emergency blood requested: 14:12
- Whole blood uncrossmatched released: 14:24 (12 min turnaround)
- Surgical intervention commenced: 14:31

Actionable Systems Improvement:
1. NatPharm must maintain minimum 40 units of O-negative packed red cells at provincial blood transfusion hubs.
2. Refresher training on non-pneumatic anti-shock garments (NASG) scheduled for all district midwives.`,
    extractedEntities: [
      { label: 'Audit Category', value: 'MPDSR Confidential' },
      { label: 'Blood Turnaround', value: '12 Minutes (O-Neg)' },
      { label: 'Primary Focus', value: 'Obstetric Hemorrhage Prevention' },
      { label: 'Clearance Required', value: 'Chief Medical Officer Only' },
    ],
    tags: ['Maternal Health', 'Obstetrics', 'Confidential', 'Audit', 'Child Care'],
    encryption: {
      algorithm: 'AES-GCM-256',
      iv: '88aB199kLmNx==',
      keyFingerprint: 'K-256-EE991044',
      encryptedSnippet: '18bZxXa9012kLmP+019==',
      sha256Hash: '4819203847291028374910283749102837491028374910283749102837491028',
      cipherLengthBytes: 4120000,
    },
    reviewHistory: [
      {
        reviewerId: 'USR-MOH-003',
        reviewerName: 'Dr. Nyasha Sithole',
        reviewerRole: 'MEDICAL_OFFICER',
        action: 'SUBMITTED',
        comment: 'Confidential clinical review notes appended. Awaiting Super Admin sign-off.',
        timestamp: '2026-11-09T14:50:00Z',
      },
    ],
    sampleScanType: 'clinic_card',
  },
  {
    id: 'DOC-2026-005',
    referenceNo: 'MOHCC-PHARM-2026-224',
    title: 'NatPharm Antiretroviral & Antibiotic Cold-Chain Consignment Log',
    category: 'Pharmacy & Logistics (NatPharm)',
    confidentiality: 'INTERNAL',
    status: 'APPROVED',
    dateCreated: '2026-11-04T13:00:00Z',
    lastModified: '2026-11-04T17:10:00Z',
    authorName: 'Tinashe Moyo',
    authorDepartment: 'Pharmacy & Logistics (NatPharm)',
    fileSize: 1540000,
    pageCount: 8,
    scanQuality: 98,
    summary:
      'Electronic temperature tracking and barcoded batch dispatch receipts for Tenofovir/Lamivudine/Dolutegravir (TLD) and Amoxicillin dispersible pediatric tablets.',
    ocrText: `NATIONAL PHARMACEUTICAL COMPANY (NATPHARM)
CENTRAL MEDICAL STORES - HARARE LOGISTICS HUB
CONSIGNMENT DISPATCH & CRYOGENIC AUDIT

Consignment Code: NP-DISP-2026-904
Requisitioning Entity: Chitungwiza Central Hospital & Seke District Depot
Batch Numbers:
- TLD Fixed-Dose Combination: Batch #TLD-9941 (Exp: 2028-10) - 24,000 tins
- Amoxicillin DT 250mg: Batch #AMX-4412 (Exp: 2028-04) - 18,500 blister packs
- Bivalent Oral Polio Vaccine: Batch #BOPV-102 (Exp: 2027-06) - 5,000 vials

Sensitech Cold-Chain Logger Data:
Mean Kinetic Temperature: 3.8°C throughout 48-hour refrigerated transit. Zero thermal excursions logged.`,
    extractedEntities: [
      { label: 'Consignment', value: 'NP-DISP-2026-904' },
      { label: 'Mean Temperature', value: '3.8°C (Nominal)' },
      { label: 'Key Therapeutic', value: 'Pediatric TLD & Amoxicillin' },
      { label: 'Warehouse Hub', value: 'NatPharm Central' },
    ],
    tags: ['Pharmacy', 'NatPharm', 'Logistics', 'Cold-Chain', 'Pediatrics'],
    encryption: {
      algorithm: 'AES-GCM-256',
      iv: '77291aBcDeFg==',
      keyFingerprint: 'K-256-991A4B02',
      encryptedSnippet: '881bCDeFg90123==',
      sha256Hash: '7716294819283749102837491028374910283749102837491028374910283749',
      cipherLengthBytes: 1540000,
    },
    reviewHistory: [
      {
        reviewerId: 'USR-MOH-002',
        reviewerName: 'Tinashe Moyo',
        reviewerRole: 'HELP_DESK_STAFF',
        action: 'SUBMITTED',
        comment: 'Barcode manifests cross-checked with warehouse database.',
        timestamp: '2026-11-04T13:10:00Z',
      },
      {
        reviewerId: 'USR-MOH-001',
        reviewerName: 'Dr. Farai Chidzero',
        reviewerRole: 'ADMINISTRATOR',
        action: 'APPROVED',
        comment: 'Certified compliant with WHO GDP standards.',
        timestamp: '2026-11-04T17:10:00Z',
      },
    ],
    sampleScanType: 'procurement',
  },
  {
    id: 'DOC-2026-006',
    referenceNo: 'MOHCC-PROC-2026-077',
    title: 'Hospital Biometric Terminal & Workstation Procurement Tender',
    category: 'Finance & Health Procurement',
    confidentiality: 'CONFIDENTIAL',
    status: 'NEEDS_REVISION',
    dateCreated: '2026-11-02T10:00:00Z',
    lastModified: '2026-11-03T11:20:00Z',
    authorName: 'Blessing Marange',
    authorDepartment: 'Finance & Health Procurement',
    fileSize: 2280000,
    pageCount: 14,
    scanQuality: 95,
    summary:
      'Procurement specifications for 140 ruggedized touchscreens, optical fingerprint scanners, and smart card readers for primary healthcare clinic reception desks.',
    ocrText: `TENDER SPECIFICATION & PROCUREMENT COMPLIANCE
TENDER NO: PRAZ/MOHCC/IT/2026/04
PROJECT: PRIMARY CARE BIOMETRIC IDENTITY EXPANSION

Hardware Specifications:
- Processor: Min 8-core ARM / x86 embedded, TPM 2.0 cryptographic chip.
- Biometric Scanner: FIPS 201 / PIV compliant optical sensor, 500 DPI, live finger detection.
- Housing: IP54 rated dust and moisture resistant for rural clinical environments.
- Battery Backup: Integrated Lithium iron phosphate battery providing minimum 8 hours runtime.

Review Feedback from IT Directorate:
Section 4 fails to specify WebAuthn / FIDO2 firmware compliance for direct integration with the National Health Identity Gateway. Vendor quotation must also specify on-site SLA terms.`,
    extractedEntities: [
      { label: 'Tender Ref', value: 'PRAZ/MOHCC/IT/2026/04' },
      { label: 'Hardware Units', value: '140 Biometric Kiosks' },
      { label: 'Security Chip', value: 'TPM 2.0 + PIV 500 DPI' },
      { label: 'Deficiency', value: 'Missing FIDO2 Spec' },
    ],
    tags: ['Procurement', 'Hardware', 'Biometric', 'Tender', 'Help Desk'],
    encryption: {
      algorithm: 'AES-GCM-256',
      iv: '556102aBcDeF==',
      keyFingerprint: 'K-256-44AA1982',
      encryptedSnippet: '9018274aBcDeFg==',
      sha256Hash: '1928374910283749102837491028374910283749102837491028374910283749',
      cipherLengthBytes: 2280000,
    },
    reviewHistory: [
      {
        reviewerId: 'USR-MOH-004',
        reviewerName: 'Blessing Marange',
        reviewerRole: 'READ_ONLY_VIEWER',
        action: 'SUBMITTED',
        comment: 'Submitted for IT Director technical concurrence.',
        timestamp: '2026-11-02T10:30:00Z',
      },
      {
        reviewerId: 'USR-MOH-001',
        reviewerName: 'Dr. Farai Chidzero',
        reviewerRole: 'ADMINISTRATOR',
        action: 'REVISION_REQUESTED',
        comment: 'Please mandate FIDO2 / WebAuthn compliance and 3-year warranty before re-submitting.',
        timestamp: '2026-11-03T11:20:00Z',
      },
    ],
    sampleScanType: 'procurement',
  },
  {
    id: 'DOC-2026-007',
    referenceNo: 'MOHCC-SEC-2026-012',
    title: 'MoHCC IT Department Encryption & Cryptographic Key Management SOP',
    category: 'IT Help Desk & Infrastructure',
    confidentiality: 'CONFIDENTIAL',
    status: 'APPROVED',
    dateCreated: '2026-10-28T09:00:00Z',
    lastModified: '2026-10-30T15:00:00Z',
    authorName: 'Dr. Farai Chidzero',
    authorDepartment: 'IT Help Desk & Infrastructure',
    fileSize: 1120000,
    pageCount: 10,
    scanQuality: 100,
    summary:
      'Standard Operating Procedure governing AES-256-GCM envelope encryption, key rotation cadences (every 90 days), biometric multi-factor authentication, and immutable audit trails.',
    ocrText: `MINISTRY OF HEALTH AND CHILD CARE
DIRECTORATE OF INFORMATICS & TELEMEDICINE
STANDARD OPERATING PROCEDURE: CRYPTOGRAPHIC GOVERNANCE (SOP-IT-012)

1.0 Encryption Architecture
All digital scans of patient health identifiers and child health cards must be encrypted client-side using AES-GCM with 256-bit entropy before transmission to the cloud storage layer.
Each document envelope must preserve an unalterable SHA-256 cryptographic digest.

2.0 Access Control Policy
Role-Based Access Control (RBAC) tiers are strictly enforced:
- Tier 1 (Super Admin): System governance, key rotation, auditor oversight.
- Tier 2 (IT Helpdesk): File ingestion, optical scanning, metadata cataloging.
- Tier 3 (Medical Officer): Clinical record approval, obstetric & pediatric access.
- Tier 4 (Compliance Auditor): Read-only log verification, tamper detection.`,
    extractedEntities: [
      { label: 'Cipher Standard', value: 'AES-GCM-256' },
      { label: 'Key Rotation', value: 'Every 90 Days' },
      { label: 'Hash Digest', value: 'SHA-256 Chained Blocks' },
      { label: 'Regulation', value: 'National Health Data Privacy Act' },
    ],
    tags: ['SOP', 'Encryption', 'Security', 'Key Management', 'Policy'],
    encryption: {
      algorithm: 'AES-GCM-256',
      iv: '1234567890aB==',
      keyFingerprint: 'K-256-001A88FF',
      encryptedSnippet: '88776655443322==',
      sha256Hash: '5566778899001122334455667788990011223344556677889900112233445566',
      cipherLengthBytes: 1120000,
    },
    reviewHistory: [
      {
        reviewerId: 'USR-MOH-001',
        reviewerName: 'Dr. Farai Chidzero',
        reviewerRole: 'ADMINISTRATOR',
        action: 'APPROVED',
        comment: 'Official Ministry IT standard adopted.',
        timestamp: '2026-10-30T15:00:00Z',
      },
    ],
    sampleScanType: 'it_ticket',
  },
  {
    id: 'DOC-2026-008',
    referenceNo: 'MOHCC-PED-2026-309',
    title: 'Mbare Poly-Clinic Pediatric Under-Five Child Health Growth Cards Batch',
    category: 'Reproductive, Maternal & Child Health',
    confidentiality: 'RESTRICTED_MEDICAL',
    status: 'PENDING_REVIEW',
    dateCreated: '2026-11-10T10:15:00Z',
    lastModified: '2026-11-10T10:15:00Z',
    authorName: 'Tinashe Moyo',
    authorDepartment: 'IT Help Desk & Infrastructure',
    fileSize: 5200000,
    pageCount: 32,
    scanQuality: 98,
    summary:
      'Digitized batch of 48 physical child health road-to-health growth monitoring cards from Mbare Poly-Clinic, containing weight-for-age percentiles and vitamin A distribution logs.',
    ocrText: `REPUBLIC OF ZIMBABWE - MINISTRY OF HEALTH AND CHILD CARE
CHILD HEALTH RECORD (ROAD TO HEALTH CARD)
BATCH SCAN - HARARE DISTRICT ARCHIVE DIGITIZATION

Facility: Mbare Poly-Clinic Child Welfare Station
Batch Serial: MPC-RTH-2026-B48
Records Included: 48 Under-Five Growth Records

Clinical Summary:
- Moderate Acute Malnutrition (MAM) detected: 2 children (enrolled in Ready-to-Use Supplementary Food program).
- Severe Acute Malnutrition (SAM): 0 children.
- Vitamin A Coverage: 98.4% (6-month dose completed).
- Deworming: Albendazole 200mg administered to all children over 12 months.

Next Step: Pediatric Clinical Officer signoff requested for electronic health record matching.`,
    extractedEntities: [
      { label: 'Facility', value: 'Mbare Poly-Clinic' },
      { label: 'Records Digitized', value: '48 Physical Cards' },
      { label: 'Vit A Coverage', value: '98.4% Completed' },
      { label: 'Status', value: 'Pending Clinical Review' },
    ],
    tags: ['Pediatrics', 'Under-Five', 'Nutrition', 'Mbare', 'Child Health'],
    encryption: {
      algorithm: 'AES-GCM-256',
      iv: '8877112233aa==',
      keyFingerprint: 'K-256-BA770123',
      encryptedSnippet: '00112233445566==',
      sha256Hash: '8899001122334455667788990011223344556677889900112233445566778899',
      cipherLengthBytes: 5200000,
    },
    reviewHistory: [
      {
        reviewerId: 'USR-MOH-002',
        reviewerName: 'Tinashe Moyo',
        reviewerRole: 'HELP_DESK_STAFF',
        action: 'SUBMITTED',
        comment: 'High-speed batch optical scanner ingest complete. 48 cards de-skewed and OCR processed.',
        timestamp: '2026-11-10T10:15:00Z',
      },
    ],
    helpDeskTicketId: 'HD-9942',
    sampleScanType: 'clinic_card',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-11-10T10:45:12Z',
    userId: 'USR-MOH-001',
    userName: 'Dr. Farai Chidzero',
    userRole: 'ADMINISTRATOR',
    action: 'BIOMETRIC_VERIFIED',
    details: 'Biometric fingerprint challenge verified on secure administrative console.',
    ipAddress: '10.240.12.8',
    severity: 'INFO',
    blockHash: '7a19c84e1b2f90a182c47d891b023f89a7123491823901b872c9182391823019',
    verified: true,
  },
  {
    id: 'LOG-002',
    timestamp: '2026-11-10T10:15:00Z',
    userId: 'USR-MOH-002',
    userName: 'Tinashe Moyo',
    userRole: 'HELP_DESK_STAFF',
    action: 'SCAN_INGEST',
    documentId: 'DOC-2026-008',
    documentRef: 'MOHCC-PED-2026-309',
    documentTitle: 'Mbare Poly-Clinic Pediatric Under-Five Child Health Growth Cards Batch',
    details: 'Scanned 32 pages via high-speed feeder. Computed SHA-256 hash and generated AES-GCM-256 envelope.',
    ipAddress: '10.240.14.22',
    severity: 'INFO',
    blockHash: 'f482910384729102837491028374910283749102837491028374910283749102',
    verified: true,
  },
  {
    id: 'LOG-003',
    timestamp: '2026-11-10T09:30:24Z',
    userId: 'USR-MOH-003',
    userName: 'Dr. Nyasha Sithole',
    userRole: 'MEDICAL_OFFICER',
    action: 'DECRYPT_RECORD',
    documentId: 'DOC-2026-004',
    documentRef: 'MOHCC-RMNCH-2026-059',
    documentTitle: 'Maternal Death Surveillance & Response (MDSR) Confidential Audit',
    details: 'Decrypted RESTRICTED_MEDICAL payload following successful 2FA confirmation.',
    ipAddress: '10.240.18.91',
    severity: 'NOTICE',
    blockHash: 'b918273645102938475610293847561029384756102938475610293847561029',
    verified: true,
  },
  {
    id: 'LOG-004',
    timestamp: '2026-11-09T16:20:00Z',
    userId: 'USR-MOH-004',
    userName: 'Blessing Marange',
    userRole: 'READ_ONLY_VIEWER',
    action: 'EXPORT_REPORT_CSV',
    details: 'Exported quarterly compliance document inventory report in CSV format.',
    ipAddress: '10.240.12.104',
    severity: 'INFO',
    blockHash: 'c019283746501928374650192837465019283746501928374650192837465019',
    verified: true,
  },
  {
    id: 'LOG-005',
    timestamp: '2026-11-09T14:22:00Z',
    userId: 'USR-MOH-001',
    userName: 'Dr. Farai Chidzero',
    userRole: 'ADMINISTRATOR',
    action: 'APPROVE_DOCUMENT',
    documentId: 'DOC-2026-001',
    documentRef: 'MOHCC-EPI-2026-081',
    documentTitle: 'EPI National Child Immunization Schedule & Cold Chain Protocol',
    details: 'Approved document after reviewing National Cold Chain thresholds.',
    ipAddress: '10.240.12.8',
    severity: 'NOTICE',
    blockHash: 'd928374650192837465019283746501928374650192837465019283746501928',
    verified: true,
  },
  {
    id: 'LOG-006',
    timestamp: '2026-11-08T18:04:12Z',
    userId: 'USR-ANON-EXT',
    userName: 'Unauthorized IP probe',
    userRole: 'READ_ONLY_VIEWER',
    action: 'UNAUTHORIZED_ACCESS_BLOCKED',
    documentRef: 'MOHCC-RMNCH-2026-059',
    details: 'Direct URL access to restricted pediatric file blocked. Origin IP lacks valid Bearer token.',
    ipAddress: '197.221.44.12',
    severity: 'CRITICAL',
    blockHash: 'e102938475610293847561029384756102938475610293847561029384756102',
    verified: true,
  },
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'NOTIF-001',
    timestamp: '2026-11-10T11:30:00Z',
    title: 'Upcoming Deadline: 48-Hour MPDSR Audit Clearance',
    message: 'Regulatory statutory deadline expires in 28 hours for Maternal Death Audit #MOHCC-RMNCH-2026-059.',
    type: 'UPCOMING_DEADLINE',
    read: false,
    targetDocId: 'DOC-2026-004',
    deadlineDate: '2026-11-12T16:00:00Z',
    severity: 'CRITICAL',
  },
  {
    id: 'NOTIF-002',
    timestamp: '2026-11-10T10:16:00Z',
    title: 'Pending Review: Mbare Pediatric Health Cards Batch #48',
    message: 'IT Help Desk has ingested and encrypted 48 growth cards. Medical Officer clinical sign-off pending.',
    type: 'REVIEW_PENDING',
    read: false,
    targetDocId: 'DOC-2026-008',
    deadlineDate: '2026-11-13T12:00:00Z',
    severity: 'HIGH',
  },
  {
    id: 'NOTIF-003',
    timestamp: '2026-11-10T08:00:00Z',
    title: 'System Update: High-Throughput Indexing v2.4 Active',
    message: 'PostgreSQL database query latency optimized to 12ms. Automated cryptographic backup verified.',
    type: 'SYSTEM_UPDATE',
    read: false,
    severity: 'LOW',
  },
  {
    id: 'NOTIF-004',
    timestamp: '2026-11-09T18:00:00Z',
    title: 'Upcoming Deadline: PRAZ IT Tender Concurrence',
    message: 'Hardware procurement specifications revision submission deadline due in 5 days.',
    type: 'UPCOMING_DEADLINE',
    read: false,
    targetDocId: 'DOC-2026-006',
    deadlineDate: '2026-11-15T17:00:00Z',
    severity: 'MEDIUM',
  },
  {
    id: 'NOTIF-005',
    timestamp: '2026-11-08T18:05:00Z',
    title: 'Security Alert: RBAC Access Violation Blocked',
    message: 'Firewall & RBAC engine prevented unauthorized external access to restricted pediatric file MOHCC-RMNCH-2026-059.',
    type: 'SECURITY_ALERT',
    read: true,
    severity: 'HIGH',
  },
  {
    id: 'NOTIF-006',
    timestamp: '2026-11-07T12:00:00Z',
    title: 'System Update: Scheduled Master Key Vault Rotation',
    message: 'MoHCC Central Key Vault AES-256 master key rotation scheduled for 2026-11-24.',
    type: 'SYSTEM_UPDATE',
    read: true,
    severity: 'MEDIUM',
  },
];

export const INITIAL_API_TOKENS: ApiToken[] = [
  {
    id: 'TOK-01',
    name: 'Parirenyatwa EHR Gateway',
    token: 'moh_sec_live_9a8fbc1276a14e918b',
    department: 'Central Referral Hospitals',
    createdDate: '2026-10-15',
    expiresInDays: 90,
    scopes: ['records:read', 'records:scan', 'audit:read'],
    isActive: true,
  },
  {
    id: 'TOK-02',
    name: 'NatPharm Logistics Bridge',
    token: 'moh_sec_live_21bc908127dfaa0192',
    department: 'Pharmacy & Logistics (NatPharm)',
    createdDate: '2026-11-01',
    expiresInDays: 180,
    scopes: ['records:read', 'records:write'],
    isActive: true,
  },
  {
    id: 'TOK-03',
    name: 'WHO Surveillance Sync API',
    token: 'moh_sec_live_77cc8192aa00bb1122',
    department: 'Epidemiology & Disease Control',
    createdDate: '2026-09-20',
    expiresInDays: 30,
    scopes: ['records:public:read'],
    isActive: true,
  },
];
