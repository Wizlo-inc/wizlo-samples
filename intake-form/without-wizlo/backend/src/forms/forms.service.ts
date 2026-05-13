import { Injectable } from '@nestjs/common';

const MOCK_FORMS = [
  {
    id: 'mock-form-health-intake',
    name: 'Health Intake Form',
    status: 'published',
    description: 'Standard patient health intake questionnaire covering personal info, health profile, and medical history.',
    version: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'mock-form-medical-history',
    name: 'Medical History Form',
    status: 'published',
    description: 'Comprehensive medical history collection including past conditions, medications, and allergies.',
    version: 1,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
];

const MOCK_SCHEMAS: Record<string, unknown> = {
  'mock-form-health-intake': {
    pages: [
      {
        id: 'page_personal',
        title: 'Personal Information',
        rows: [
          { id: 'row_1', order: 1, fields: [{ name: 'full_name', label: 'Full Name', type: 'text', required: true }] },
          { id: 'row_2', order: 2, fields: [{ name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true }] },
          { id: 'row_3', order: 3, fields: [{ name: 'gender', label: 'Gender', type: 'select', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'], required: true }] },
        ],
      },
      {
        id: 'page_health',
        title: 'Health Profile',
        rows: [
          { id: 'row_4', order: 1, fields: [{ name: 'height', label: 'Height', type: 'text', required: false }] },
          { id: 'row_5', order: 2, fields: [{ name: 'weight_lbs', label: 'Weight (lbs)', type: 'number', required: true }] },
          { id: 'row_6', order: 3, fields: [{ name: 'activity_level', label: 'Activity Level', type: 'select', options: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'], required: true }] },
          { id: 'row_7', order: 4, fields: [{ name: 'health_goals', label: 'Health Goals', type: 'multiselect', required: false }] },
        ],
      },
      {
        id: 'page_medical',
        title: 'Medical History',
        rows: [
          { id: 'row_8', order: 1, fields: [{ name: 'medical_conditions', label: 'Medical Conditions', type: 'multiselect', required: false }] },
          { id: 'row_9', order: 2, fields: [{ name: 'current_medications', label: 'Current Medications', type: 'textarea', required: false }] },
          { id: 'row_10', order: 3, fields: [{ name: 'allergies', label: 'Known Allergies', type: 'text', required: false }] },
          { id: 'row_11', order: 4, fields: [{ name: 'smoking_status', label: 'Smoking Status', type: 'select', options: ['Never', 'Former', 'Current'], required: true }] },
          { id: 'row_12', order: 5, fields: [{ name: 'alcohol_use', label: 'Alcohol Use', type: 'select', options: ['Never', 'Rarely', 'Occasionally', 'Regularly'], required: true }] },
        ],
      },
    ],
  },
  'mock-form-medical-history': {
    pages: [
      {
        id: 'page_history',
        title: 'Medical History',
        rows: [
          { id: 'row_1', order: 1, fields: [{ name: 'chief_complaint', label: 'Chief Complaint', type: 'textarea', required: true }] },
          { id: 'row_2', order: 2, fields: [{ name: 'past_medical_history', label: 'Past Medical History', type: 'textarea', required: false }] },
          { id: 'row_3', order: 3, fields: [{ name: 'family_history', label: 'Family History', type: 'textarea', required: false }] },
          { id: 'row_4', order: 4, fields: [{ name: 'current_medications', label: 'Current Medications', type: 'textarea', required: false }] },
          { id: 'row_5', order: 5, fields: [{ name: 'allergies', label: 'Drug Allergies', type: 'text', required: false }] },
          { id: 'row_6', order: 6, fields: [{ name: 'surgical_history', label: 'Surgical History', type: 'textarea', required: false }] },
        ],
      },
    ],
  },
};

@Injectable()
export class FormsService {
  getForms() {
    return { data: MOCK_FORMS, total: MOCK_FORMS.length, page: 1, limit: 50 };
  }

  getFormDetail(formId: string) {
    return MOCK_FORMS.find(f => f.id === formId) ?? null;
  }

  getFormSchema(formId: string) {
    return MOCK_SCHEMAS[formId] ?? null;
  }
}
