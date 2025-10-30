import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AartiBirthday: React.FC = () => {
  const navigate = useNavigate();
  const [showCVForm, setShowCVForm] = useState(false);

  const handleTakeTour = () => {
    setShowCVForm(true);
  };

  if (showCVForm) {
    return <CVForm onBack={() => setShowCVForm(false)} />;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      {/* Birthday Message */}
      <div className="text-center mb-8">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-4" style={{ fontFamily: 'cursive' }}>
          Happy Birthday
        </h1>
        <h2 className="text-4xl md:text-6xl font-bold text-pink-300" style={{ fontFamily: 'cursive' }}>
          Baby
        </h2>
      </div>

      {/* Take Tour Button */}
      <button
        onClick={handleTakeTour}
        className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
      >
        Take a CV Tour
      </button>
    </div>
  );
};

const CVForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [showPreview, setShowPreview] = useState(false);

  const sections = [
    {
      title: "Personal Basics",
      subtitle: "These go at the top of the CV. Keep it simple.",
      fields: [
        { name: "fullName", label: "Full Name?", type: "text", placeholder: "e.g., Aarti Sharma – Just confirm spelling." },
        { name: "phone", label: "Phone Number?", type: "text", placeholder: "Nepal format: 98X-XXXXXXX" },
        { name: "email", label: "Email?", type: "email", placeholder: "Professional one, like firstname.lastname@gmail.com" },
        { name: "linkedin", label: "LinkedIn/Profile?", type: "select", options: ["Yes", "No – If no, suggest making one later."] },
        { name: "address", label: "Address?", type: "text", placeholder: "Current: Biratnagar?" },
        { name: "relocate", label: "Willing to relocate to Kathmandu?", type: "select", options: ["Yes", "No", "Preferences"] },
        { name: "dob", label: "Date of Birth?", type: "date", placeholder: "For age calc – e.g., YYYY-MM-DD" },
        { name: "nationality", label: "Nationality?", type: "text", placeholder: "Nepali? Any other?" },
        { name: "languages", label: "Languages?", type: "multiselect", options: [
          "Nepali – Fluent", "Nepali – Basic", "English – Fluent", "English – Basic",
          "Hindi – Fluent", "Hindi – Basic", "Others? Rate 1-5 for speaking/reading/writing."
        ] }
      ]
    },
    {
      title: "Education & Academics",
      subtitle: "Focus on her BSc—list subjects to show depth for pharma/lab jobs.",
      fields: [
        { name: "degree", label: "Degree Details?", type: "text", placeholder: "BSc Microbiology from [College/Uni Name], Biratnagar, Nepal." },
        { name: "year", label: "Year?", type: "text", placeholder: "202X" },
        { name: "gpa", label: "GPA/Percentage?", type: "text", placeholder: "X% or Division (First/Second)" },
        { name: "subjects", label: "Key Subjects Studied?", type: "multiselect", options: [
          "Core: Microbiology (Bacteriology/Virology/Mycology/Parasitology)",
          "Biochemistry", "Immunology", "Genetics", "Molecular Biology",
          "Lab-Focused: Medical Microbiology", "Clinical Pathology", "Hematology", "Microbiology Techniques",
          "Others: Biotechnology", "Environmental Microbiology", "Food Microbiology", "Pharmacology", "Anatomy/Physiology"
        ]},
        { name: "electives", label: "Any electives/specializations?", type: "text", placeholder: "e.g., Hospital Infection Control, Public Health Micro." },
        { name: "projects", label: "Projects/Thesis?", type: "textarea", placeholder: "Yes/No – If yes: Topic? (e.g., \"Antibiotic Resistance in Hospital Bacteria\" – Short desc: What did you do? Tools used?)" },
        { name: "extracurriculars", label: "Extracurriculars?", type: "textarea", placeholder: "Yes/No (e.g., Science club, lab workshops, online courses like Coursera on Micro basics?)" },
        { name: "awards", label: "Awards/Scholarships?", type: "textarea", placeholder: "Yes/No (e.g., Merit for lab skills?)" }
      ]
    },
    {
      title: "Professional Experience",
      subtitle: "Her Nobel Hospital internship is gold—break it down to quantify (e.g., \"Handled 50+ samples/day\").",
      fields: [
        { name: "internship", label: "Internship Confirmation?", type: "text", placeholder: "3 months at Nobel Hospital, Biratnagar (Dates: From-To?). Role: Microbiology Intern/Lab Assistant?" },
        { name: "sampleHandling", label: "Sample Handling?", type: "multiselect", options: [
          "Collected/processed blood/urine/swabs? (How many/day? Used centrifuges/pipettes?)"
        ]},
        { name: "cultures", label: "Cultures & Testing?", type: "multiselect", options: [
          "Prepared bacterial/fungal cultures?", "Gram staining?", "Antibiotic sensitivity tests (e.g., Kirby-Bauer method)?",
          "Types of media used (Agar plates? Broths?)?"
        ]},
        { name: "microscopy", label: "Microscopy/ID?", type: "multiselect", options: [
          "Microscope work for bacteria/parasites?", "Identified pathogens (e.g., E. coli, TB)?"
        ]},
        { name: "qualityControl", label: "Quality Control?", type: "multiselect", options: [
          "Sterilized equipment?", "Followed lab safety (PPE, biohazard protocols)?", "Calibrated instruments?"
        ]},
        { name: "reporting", label: "Reporting?", type: "multiselect", options: [
          "Recorded results in logs?", "Used software (e.g., Excel for data entry)?", "Shared with doctors?"
        ]},
        { name: "otherWork", label: "Other Hospital Lab Work?", type: "multiselect", options: [
          "Helped in hematology/chemistry sections?", "PCR/ELISA tests?", "Inventory of reagents?"
        ]},
        { name: "achievements", label: "Achievements/Impacts?", type: "textarea", placeholder: "Yes/No (e.g., \"Reduced contamination errors by X%?\" or \"Trained juniors on staining?\")" },
        { name: "supervisors", label: "Supervisors/Team?", type: "textarea", placeholder: "Reported to whom? Team size? Any feedback/letter available? Yes/No." },
        { name: "otherExperience", label: "Other Experience?", type: "textarea", placeholder: "Yes/No (e.g., Volunteer lab work, family clinic help, part-time jobs?)" }
      ]
    },
    {
      title: "Skills Inventory",
      subtitle: "She's vague on skills, so this is a yes/no checklist of 50+ common Microbiology skills for Nepal jobs.",
      fields: [
        { name: "technicalSkills", label: "Technical/Lab Skills (Rate Y/S/N - Essential for Lab Tech/QC roles)?", type: "skillselect", options: [
          "Microscopy (Light/Fluorescence) - Used in hospital labs for pathogen ID?",
          "Gram Staining/KOH Prep - Basic bacterial identification technique?",
          "Culture Techniques (Aerobic/Anaerobic) - Growing bacteria for testing?",
          "Media Preparation (Nutrient Agar/Blood Agar) - Making culture plates?",
          "Biochemical Tests (Catalase/Oxidase/IMViC) - Bacterial species identification?",
          "Antibiotic Susceptibility Testing - Kirby-Bauer disk diffusion method?",
          "Serology (Widal/VDRL Tests) - Blood tests for infections?",
          "ELISA/PCR Basics - Molecular diagnostic techniques?",
          "Hematology (CBC via Autoanalyzer) - Blood cell counting machines?",
          "Sample Collection (Venipuncture/Swab) - Drawing blood/taking swabs?",
          "Sterilization/Autoclaving - Equipment sterilization protocols?",
          "Biosafety Level Handling (BSL-2) - Safe handling of infectious materials?",
          "pH/Electrolyte Testing - Chemical analysis of body fluids?",
          "Water/Food Microbiology Testing - Testing for contamination?",
          "Molecular Techniques (DNA Extraction) - Genetic material isolation?",
          "Microbial Enumeration (Colony Counting) - Counting bacterial colonies?",
          "Antimicrobial Resistance Testing - Checking drug resistance?",
          "Fungal Culture Techniques - Growing and identifying fungi?",
          "Parasitology Techniques - Identifying parasites in samples?",
          "Clinical Chemistry Analyzers - Automated blood chemistry testing?",
          "Urine Analysis (Dipstick/Microscopy) - Testing urine samples?",
          "Stool Examination - Analyzing fecal samples for pathogens?",
          "Blood Banking Techniques - Blood typing/cross-matching?",
          "Quality Control Testing - Ensuring test accuracy/reliability?",
          "Instrument Calibration/Maintenance - Keeping lab equipment working?",
          "Lab Safety Protocols (PPE Usage) - Personal protective equipment?",
          "Biohazard Waste Management - Safe disposal of infectious waste?",
          "Temperature Monitoring (Incubators/Refrigerators) - Maintaining sample conditions?",
          "Documentation/Record Keeping - Maintaining lab logs/reports?",
          "Internal Quality Assurance - Lab quality management systems?",
          "External Quality Assessment - Participating in proficiency testing?"
        ]},
        { name: "softSkills", label: "Soft/Workflow Skills (Rate Y/S/N - Important for hospital/pharma teamwork)?", type: "skillselect", options: [
          "Data Entry/Reporting (Excel/Logs) - Recording test results accurately?",
          "Team Collaboration (With Doctors/Nurses) - Working with healthcare staff?",
          "Time Management (Handling Rush Hours) - Managing urgent test requests?",
          "Problem-Solving (e.g., Contaminated Samples) - Troubleshooting lab issues?",
          "Attention to Detail (Error-Free Results) - Ensuring accuracy in testing?",
          "Patient Interaction (Explaining Tests) - Communicating with patients?",
          "Inventory Management (Reagents/Supplies) - Stocking lab materials?",
          "Communication Skills (Verbal/Written) - Explaining results clearly?",
          "Adaptability (New Procedures/Equipment) - Learning new lab techniques?",
          "Work Ethics (Punctuality/Reliability) - Being dependable at work?",
          "Critical Thinking (Result Interpretation) - Analyzing test outcomes?",
          "Multitasking (Multiple Tests Simultaneously) - Handling several tasks?",
          "Stress Management (High-Pressure Situations) - Working under pressure?",
          "Training/Orientation Skills - Teaching new lab staff?",
          "Customer Service Orientation - Serving patients/doctors well?",
          "Confidentiality Maintenance - Keeping patient data private?",
          "Continuous Learning Mindset - Staying updated with lab advances?",
          "Quality Focus (Zero Error Tolerance) - Maintaining high standards?",
          "Safety Consciousness - Prioritizing lab/hospital safety?",
          "Interpersonal Skills (Building Relationships) - Working well with colleagues?"
        ]},
        { name: "techSkills", label: "Tech/Digital Skills (Rate Y/S/N - Growing importance in modern labs)?", type: "skillselect", options: [
          "MS Office (Word/Excel for Reports) - Creating documents/spreadsheets?",
          "Basic Lab Software (LIS – Lab Info Systems) - Lab management software?",
          "Google Workspace (Docs/Sheets/Drive) - Cloud-based office tools?",
          "Online Research (PubMed for Protocols) - Finding scientific literature?",
          "Any Coding/Data Tools (e.g., Simple stats in Excel) - Basic programming?",
          "Statistical Analysis Software (SPSS/R) - Data analysis tools?",
          "Presentation Software (PowerPoint) - Creating training presentations?",
          "Email Communication - Professional email usage?",
          "Database Management - Organizing lab data?",
          "Digital Microscopy Software - Analyzing microscope images?",
          "Electronic Health Records (EHR) - Hospital patient systems?",
          "Telemedicine Platforms - Remote healthcare tools?",
          "Social Media for Professional Networking - LinkedIn usage?",
          "Online Learning Platforms (Coursera/edX) - Continuing education?",
          "Video Conferencing (Zoom/Teams) - Virtual meetings?",
          "Mobile Apps for Lab Work - Lab-related mobile applications?",
          "Cloud Storage Solutions - Secure data storage?",
          "Cybersecurity Awareness - Protecting sensitive data?",
          "Digital Documentation Tools - Electronic lab notebooks?",
          "Automation Software Knowledge - Robotic lab equipment?"
        ]},
        { name: "industrySkills", label: "Nepal-Specific/Industry Skills (Rate Y/S/N - Tailored for Nepal job market)?", type: "skillselect", options: [
          "GMP/GLP Compliance - Good Manufacturing/Lab Practices?",
          "Quality Assurance in Labs - Ensuring lab quality standards?",
          "Infection Control (Hospital Protocols) - Hospital infection prevention?",
          "Public Health Surveillance (e.g., Outbreak Tracking) - Disease monitoring?",
          "Vaccine/Drug Testing Basics - Pharmaceutical testing knowledge?",
          "Environmental Sampling (Air/Water) - Environmental testing?",
          "Bioinformatics Basics (Sequence Analysis) - Biological data analysis?",
          "Nepali Health System Knowledge - Understanding local healthcare?",
          "Tribhuvan University Teaching Hospital Procedures - Kathmandu hospital experience?",
          "Patan Hospital Protocols - Major hospital workflows?",
          "Nepal Pharmaceuticals Lab Standards - Pharma company requirements?",
          "Private Lab Clinic Operations - Diagnostic center procedures?",
          "Government Hospital Compliance - Public sector lab standards?",
          "Biotech Lab Research Methods - Research laboratory techniques?",
          "Public Health Lab Testing - Government health lab procedures?",
          "Medical College Lab Training - Academic lab experience?",
          "Pharmacy Lab Quality Control - Drug testing procedures?",
          "Food Safety Testing - Food microbiology standards?",
          "Water Quality Analysis - Drinking water testing?",
          "Air Quality Monitoring - Environmental air testing?",
          "Epidemiological Data Collection - Disease pattern tracking?",
          "Health Education/Promotion - Community health awareness?",
          "Medical Waste Management - Healthcare waste handling?",
          "Emergency Response Protocols - Crisis situation handling?",
          "Cultural Competence in Healthcare - Understanding patient diversity?",
          "Nepali Language Medical Terminology - Local medical terms?",
          "Rural Health Camp Experience - Community health outreach?",
          "Mobile Health (mHealth) Solutions - Digital health innovations?",
          "Traditional Medicine Integration - Ayurvedic/modern medicine blend?",
          "Health Insurance Procedures - Insurance claim processes?",
          "Medical Equipment Maintenance - Lab instrument upkeep?"
        ]},
        { name: "topSkills", label: "Pick Top 8-10 Strongest Skills?", type: "multiselect", options: [] }
      ]
    },
    {
      title: "Certifications & Extras",
      subtitle: "These boost credibility for Kathmandu jobs.",
      fields: [
        { name: "certifications", label: "Certifications?", type: "textarea", placeholder: "Yes/No (e.g., Lab Technician Cert from CTEVT? Biosafety Training? First Aid?)" },
        { name: "workshops", label: "Workshops/Seminars?", type: "textarea", placeholder: "Yes/No (e.g., Attended Micro conference? Online from WHO/Nepal Health?)" },
        { name: "memberships", label: "Memberships?", type: "textarea", placeholder: "Yes/No (e.g., Nepal Microbiology Society? Student chapter?)" },
        { name: "hobbies", label: "Hobbies/Interests?", type: "textarea", placeholder: "Tie to job: e.g., Reading science journals? Volunteering health camps?" },
        { name: "references", label: "References?", type: "textarea", placeholder: "Yes/No (e.g., Nobel supervisor contact? 2-3 names/emails.)" }
      ]
    },
    {
      title: "Job Targeting",
      subtitle: "To tailor CV versions for different Kathmandu roles.",
      fields: [
        { name: "dreamRoles", label: "Dream Roles?", type: "multiselect", options: [
          "Hospital Lab Tech", "Pharma QC Analyst", "Research Asst", "Public Health Inspector",
          "Biotech Lab", "Teaching Asst", "Sales Rep (Med Devices)"
        ]},
        { name: "employers", label: "Preferred Employers?", type: "textarea", placeholder: "e.g., Govt: Sukraraj Tropical Hospital; Private: Grande City Lab, Asian Pharma; Orgs: Nepal Red Cross." },
        { name: "salary", label: "Salary Expectation?", type: "text", placeholder: "For CV summary: Entry-level NPR 20k-30k? Don't put exact # in CV." },
        { name: "availability", label: "Availability?", type: "select", options: ["Immediate?", "Notice period?"] },
        { name: "gaps", label: "Any Gaps/Weaknesses?", type: "textarea", placeholder: "e.g., No car? Willing to learn tech? – Frame positively in CV." }
      ]
    }
  ];

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const finishForm = () => {
    setShowPreview(true);
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'date':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent h-24"
          />
        );
      case 'select':
        return (
          <select
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            {field.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options.map((option: string) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(formData[field.name] || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = formData[field.name] || [];
                    if (e.target.checked) {
                      handleInputChange(field.name, [...currentValues, option]);
                    } else {
                      handleInputChange(field.name, currentValues.filter((v: string) => v !== option));
                    }
                  }}
                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        );
      case 'skillselect':
        return (
          <div className="space-y-3">
            {field.options.map((option: string) => (
              <div key={option} className="flex items-center space-x-3">
                <span className="text-sm flex-1">{option}</span>
                <div className="flex space-x-2">
                  {['Yes (Proficient)', 'Somewhat', 'No'].map((level) => (
                    <label key={level} className="flex items-center space-x-1">
                      <input
                        type="radio"
                        name={`${field.name}-${option}`}
                        value={level}
                        checked={formData[field.name]?.[option] === level}
                        onChange={(e) => {
                          const currentSkills = formData[field.name] || {};
                          handleInputChange(field.name, {
                            ...currentSkills,
                            [option]: e.target.value
                          });
                        }}
                        className="text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-xs">{level.split(' ')[0]}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  if (showPreview) {
    return <CVPreview formData={formData} onBack={() => setShowPreview(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">CV Builder for Aarti</h1>
          <div className="text-sm text-gray-600">
            {currentSection + 1} / {sections.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
          ></div>
        </div>

        {/* Section Title */}
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {sections[currentSection].title}
        </h2>
        {sections[currentSection].subtitle && (
          <p className="text-sm text-gray-600 mb-4 italic">
            {sections[currentSection].subtitle}
          </p>
        )}

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          {sections[currentSection].fields.map((field: any) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevSection}
            disabled={currentSection === 0}
            className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Previous
          </button>
          <button
            onClick={currentSection === sections.length - 1 ? finishForm : nextSection}
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {currentSection === sections.length - 1 ? 'Generate CV Preview' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CVPreview: React.FC<{ formData: any; onBack: () => void }> = ({ formData, onBack }) => {
  const generateCVContent = () => {
    const name = formData.fullName || 'Aarti Sharma';
    const phone = formData.phone || '';
    const email = formData.email || '';
    const address = formData.address || '';
    const linkedin = formData.linkedin || '';
    const dob = formData.dob || '';
    const nationality = formData.nationality || '';
    const languages = formData.languages || [];

    let cvContent = `
${name.toUpperCase()}
${address}
Phone: ${phone} | Email: ${email}${linkedin === 'Yes' ? ' | LinkedIn: Available' : ''}

PERSONAL INFORMATION
Date of Birth: ${dob}
Nationality: ${nationality}
Languages: ${languages.join(', ')}

PROFESSIONAL SUMMARY
${formData.fullName || 'Aarti'} is a BSc Microbiology graduate with ${formData.internship ? '3-month hands-on internship experience at Nobel Hospital, Biratnagar' : 'strong academic foundation in microbiology'}. Seeking entry-level position in medical laboratory technology, quality control analyst, or research assistance in Kathmandu's healthcare and pharmaceutical sector. ${formData.relocate === 'Yes' ? 'Willing to relocate to Kathmandu.' : ''}

EDUCATION
${formData.degree || 'BSc Microbiology'}
Institution: ${formData.degree?.includes('Biratnagar') ? 'Biratnagar, Nepal' : 'College/University, Biratnagar, Nepal'}
${formData.year ? `Graduation Year: ${formData.year}` : ''}
${formData.gpa ? `GPA/Percentage: ${formData.gpa}` : ''}

KEY SUBJECTS STUDIED:
${(formData.subjects || []).map(subject => `• ${subject}`).join('\n')}

${formData.electives ? `ELECTIVES/SPECIALIZATIONS:\n• ${formData.electives}` : ''}

${formData.projects ? `PROJECTS/THESIS:\n${formData.projects}` : ''}

${formData.extracurriculars ? `EXTRACURRICULAR ACTIVITIES:\n${formData.extracurriculars}` : ''}

${formData.awards ? `AWARDS/SCHOLARSHIPS:\n${formData.awards}` : ''}

PROFESSIONAL EXPERIENCE
${formData.internship || 'Microbiology Laboratory Intern'}
${formData.dates || '3 Months'}
${formData.role || 'Nobel Hospital, Biratnagar, Nepal'}

KEY RESPONSIBILITIES & ACHIEVEMENTS:
${formData.sampleHandling ? `SAMPLE HANDLING:\n${(formData.sampleHandling || []).map(item => `• ${item}`).join('\n')}` : ''}

${formData.cultures ? `CULTURES & TESTING:\n${(formData.cultures || []).map(item => `• ${item}`).join('\n')}` : ''}

${formData.microscopy ? `MICROSCOPY & IDENTIFICATION:\n${(formData.microscopy || []).map(item => `• ${item}`).join('\n')}` : ''}

${formData.qualityControl ? `QUALITY CONTROL & SAFETY:\n${(formData.qualityControl || []).map(item => `• ${item}`).join('\n')}` : ''}

${formData.reporting ? `REPORTING & DOCUMENTATION:\n${(formData.reporting || []).map(item => `• ${item}`).join('\n')}` : ''}

${formData.otherWork ? `ADDITIONAL RESPONSIBILITIES:\n${(formData.otherWork || []).map(item => `• ${item}`).join('\n')}` : ''}

${formData.achievements ? `KEY ACHIEVEMENTS:\n• ${formData.achievements}` : ''}

${formData.supervisors ? `SUPERVISION & TEAM:\n${formData.supervisors}` : ''}

${formData.otherExperience ? `ADDITIONAL EXPERIENCE:\n${formData.otherExperience}` : ''}

SKILLS INVENTORY

TECHNICAL/LABORATORY SKILLS:
${Object.entries(formData.technicalSkills || {}).filter(([_, level]) => level === 'Yes (Proficient)').map(([skill, _]) => `• ${skill} (Proficient)`).join('\n')}
${Object.entries(formData.technicalSkills || {}).filter(([_, level]) => level === 'Somewhat').map(([skill, _]) => `• ${skill} (Basic Knowledge)`).join('\n')}

SOFT/WORKFLOW SKILLS:
${Object.entries(formData.softSkills || {}).filter(([_, level]) => level === 'Yes (Proficient)').map(([skill, _]) => `• ${skill} (Proficient)`).join('\n')}
${Object.entries(formData.softSkills || {}).filter(([_, level]) => level === 'Somewhat').map(([skill, _]) => `• ${skill} (Developing)`).join('\n')}

TECHNICAL/DIGITAL SKILLS:
${Object.entries(formData.techSkills || {}).filter(([_, level]) => level === 'Yes (Proficient)').map(([skill, _]) => `• ${skill} (Proficient)`).join('\n')}
${Object.entries(formData.techSkills || {}).filter(([_, level]) => level === 'Somewhat').map(([skill, _]) => `• ${skill} (Basic)`).join('\n')}

NEPAL-SPECIFIC/INDUSTRY SKILLS:
${Object.entries(formData.industrySkills || {}).filter(([_, level]) => level === 'Yes (Proficient)').map(([skill, _]) => `• ${skill} (Proficient)`).join('\n')}
${Object.entries(formData.industrySkills || {}).filter(([_, level]) => level === 'Somewhat').map(([skill, _]) => `• ${skill} (Familiar)`).join('\n')}

TOP SKILLS (Most Relevant for Job Applications):
${(formData.topSkills || []).slice(0, 10).map(skill => `• ${skill}`).join('\n')}

CERTIFICATIONS, TRAINING & EXTRAS

${formData.certifications ? `CERTIFICATIONS:\n${formData.certifications}` : 'CERTIFICATIONS:\n• Laboratory Safety Training\n• Biosafety Level 2 Training'}

${formData.workshops ? `WORKSHOPS/SEMINARS:\n${formData.workshops}` : ''}

${formData.memberships ? `MEMBERSHIPS:\n${formData.memberships}` : ''}

${formData.hobbies ? `HOBBIES/INTERESTS:\n${formData.hobbies}` : ''}

JOB TARGETING & PREFERENCES

TARGET ROLES:
${(formData.dreamRoles || []).map(role => `• ${role}`).join('\n')}

PREFERRED EMPLOYERS:
${formData.employers || '• Tribhuvan University Teaching Hospital\n• Patan Hospital\n• Grande International Hospital\n• Nepal Pharmaceuticals Laboratory\n• Private diagnostic labs in Kathmandu'}

SALARY EXPECTATION:
${formData.salary || 'Entry-level: NPR 20,000 - 30,000 per month'}

AVAILABILITY:
${formData.availability || 'Immediate'}

${formData.gaps ? `ADDITIONAL NOTES:\n${formData.gaps}` : ''}

REFERENCES
${formData.references || 'Available upon request from Nobel Hospital supervisors and academic mentors.'}

DECLARATION
I hereby declare that the information provided above is true and accurate to the best of my knowledge.

Date: _______________
${name}
`;

    return cvContent;
  };

  const downloadCV = () => {
    const cvText = generateCVContent();
    const blob = new Blob([cvText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.fullName || 'Aarti'}_CV.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            ← Back to Form
          </button>
          <h1 className="text-2xl font-bold text-gray-800">CV Preview</h1>
          <button
            onClick={downloadCV}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            📄 Download CV
          </button>
        </div>

        {/* CV Preview */}
        <div className="bg-white shadow-lg rounded-lg p-8 font-mono text-sm leading-relaxed">
          <pre className="whitespace-pre-wrap text-gray-800">
            {generateCVContent()}
          </pre>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 CV Tips for Aarti:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Customize this CV for each job application</li>
            <li>• Use keywords from job descriptions</li>
            <li>• Quantify achievements with numbers where possible</li>
            <li>• Keep it to 1 page for entry-level positions</li>
            <li>• Proofread carefully before submitting</li>
            <li>• Consider having it professionally designed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AartiBirthday;