import { GoogleFormConfig, FormField } from '../types';

export const DEFAULT_CRM_FIELDS: FormField[] = [
  {
    id: 'name',
    title: 'Full Name',
    type: 'TEXT',
    required: true,
    description: 'First and last name of the prospective client',
  },
  {
    id: 'email',
    title: 'Email Address',
    type: 'TEXT',
    required: true,
    description: 'Where our automated welcome email and follow-ups will be sent',
  },
  {
    id: 'phone',
    title: 'Phone Number',
    type: 'TEXT',
    required: false,
    description: 'Contact number for direct inquiries',
  },
  {
    id: 'company',
    title: 'Company / Organization',
    type: 'TEXT',
    required: false,
    description: 'Name of the business or brand',
  },
  {
    id: 'service',
    title: 'Service Interested In',
    type: 'MULTIPLE_CHOICE',
    required: true,
    options: [
      'Web & App Development',
      'Digital Marketing & SEO',
      'Brand Identity & UI/UX Design',
      'Consulting & Strategy',
      'Other Custom Solution',
    ],
    description: 'Primary area of collaboration',
  },
  {
    id: 'budget_notes',
    title: 'Project Budget & Requirements',
    type: 'PARAGRAPH_TEXT',
    required: false,
    description: 'Brief overview of your timeline, scope, or estimated budget',
  },
];

export async function createGoogleForm(
  accessToken: string,
  title: string = 'Client Intake & Lead Capture Form',
  description: string = 'Please share your details to get started. Our CRM will automatically register your request and send a confirmation welcome message.'
): Promise<GoogleFormConfig> {
  // Step 1: Create empty form
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title,
        documentTitle: title,
      },
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create Google Form (${createRes.status}): ${errorText}`);
  }

  const formData = await createRes.json();
  const formId = formData.formId;

  // Step 2: Batch update to add questions & description
  const requests = [
    {
      updateFormInfo: {
        info: {
          description,
        },
        updateMask: 'description',
      },
    },
    ...DEFAULT_CRM_FIELDS.map((field, index) => {
      if (field.type === 'MULTIPLE_CHOICE') {
        return {
          createItem: {
            item: {
              title: field.title,
              description: field.description,
              questionItem: {
                question: {
                  required: field.required,
                  choiceQuestion: {
                    type: 'RADIO',
                    options: (field.options || []).map((opt) => ({ value: opt })),
                    shuffle: false,
                  },
                },
              },
            },
            location: {
              index,
            },
          },
        };
      }

      return {
        createItem: {
          item: {
            title: field.title,
            description: field.description,
            questionItem: {
              question: {
                required: field.required,
                textQuestion: {
                  paragraph: field.type === 'PARAGRAPH_TEXT',
                },
              },
            },
          },
          location: {
            index,
          },
        },
      };
    }),
  ];

  const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    console.warn(`Form batchUpdate warning (${updateRes.status}):`, errorText);
  }

  // Get full form details
  const getRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const fullForm = getRes.ok ? await getRes.json() : formData;

  return {
    formId,
    responderUri: fullForm.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`,
    editUri: `https://docs.google.com/forms/d/${formId}/edit`,
    title,
    description,
    fields: DEFAULT_CRM_FIELDS,
  };
}

export async function fetchFormDetails(
  accessToken: string,
  formId: string
): Promise<GoogleFormConfig> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to load Google Form details (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return {
    formId: data.formId,
    responderUri: data.responderUri || `https://docs.google.com/forms/d/${data.formId}/viewform`,
    editUri: `https://docs.google.com/forms/d/${data.formId}/edit`,
    title: data.info?.title || 'Client Intake Form',
    description: data.info?.description || '',
    fields: DEFAULT_CRM_FIELDS,
  };
}

export async function fetchFormResponses(accessToken: string, formId: string): Promise<any[]> {
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch form responses: ${errorText}`);
  }

  const data = await res.json();
  return data.responses || [];
}
