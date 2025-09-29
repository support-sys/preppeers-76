// Add-on Configuration System
// Phase 3.2: Backend API for Add-ons

export interface AddOn {
  id: string;
  addon_key: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: 'enhancement' | 'service' | 'premium';
  is_active: boolean;
  requires_plan?: 'essential' | 'professional';
  max_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface UserAddOn {
  id: string;
  user_id: string;
  addon_id: string;
  quantity: number;
  selected_at: string;
  is_active: boolean;
  addon?: AddOn;
}

export interface AddOnSelection {
  addon_key: string;
  quantity: number;
  price: number;
  total: number;
}

export interface AddOnValidationResult {
  is_valid: boolean;
  error_message?: string;
  validated_addons: AddOnSelection[];
  total_price: number;
}

// Default add-ons configuration (matches database)
export const DEFAULT_ADDONS: Omit<AddOn, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    addon_key: 'resume_review',
    name: 'Resume Review',
    description: 'Professional resume feedback and optimization with detailed suggestions for improvement',
    price: 199.00,
    currency: 'INR',
    category: 'service',
    requires_plan: undefined, // Available for all plans
    max_quantity: 1,
    is_active: true
  },
  {
    addon_key: 'meeting_recording',
    name: 'Meeting Recording',
    description: 'Record your interview session for later review and analysis',
    price: 99.00,
    currency: 'INR',
    category: 'enhancement',
    requires_plan: undefined, // Available for all plans
    max_quantity: 1,
    is_active: true
  },
  {
    addon_key: 'priority_support',
    name: 'Priority Support',
    description: 'Get priority customer support with faster response times',
    price: 149.00,
    currency: 'INR',
    category: 'premium',
    requires_plan: 'professional', // Only for professional plan
    max_quantity: 1,
    is_active: true
  },
  {
    addon_key: 'extended_feedback',
    name: 'Extended Feedback Report',
    description: 'Get a more detailed feedback report with additional insights',
    price: 299.00,
    currency: 'INR',
    category: 'service',
    requires_plan: 'professional', // Only for professional plan
    max_quantity: 1,
    is_active: true
  }
];

// Add-on categories with display information
export const ADDON_CATEGORIES = {
  enhancement: {
    name: 'Enhancement',
    description: 'Additional features to enhance your interview experience',
    icon: '✨',
    color: 'blue'
  },
  service: {
    name: 'Service',
    description: 'Additional services to support your career growth',
    icon: '🎯',
    color: 'green'
  },
  premium: {
    name: 'Premium',
    description: 'Premium features for enhanced experience',
    icon: '⭐',
    color: 'purple'
  }
};

// Utility functions
export const getAddOnByKey = (addons: AddOn[], key: string): AddOn | undefined => {
  return addons.find(addon => addon.addon_key === key);
};

export const getAddOnsByCategory = (addons: AddOn[], category: string): AddOn[] => {
  return addons.filter(addon => addon.category === category);
};

export const getAddOnsForPlan = (addons: AddOn[], planType: string): AddOn[] => {
  return addons.filter(addon => 
    addon.is_active && 
    (addon.requires_plan === undefined || addon.requires_plan === planType)
  );
};

export const calculateAddOnsTotal = (selectedAddOns: AddOnSelection[]): number => {
  return selectedAddOns.reduce((total, addon) => total + addon.total, 0);
};

export const validateAddOnSelection = (
  selectedAddOns: AddOnSelection[],
  availableAddOns: AddOn[],
  planType: string
): AddOnValidationResult => {
  const validatedAddOns: AddOnSelection[] = [];
  let totalPrice = 0;

  for (const selected of selectedAddOns) {
    const addon = getAddOnByKey(availableAddOns, selected.addon_key);
    
    if (!addon) {
      return {
        is_valid: false,
        error_message: `Add-on not found: ${selected.addon_key}`,
        validated_addons: [],
        total_price: 0
      };
    }

    if (!addon.is_active) {
      return {
        is_valid: false,
        error_message: `Add-on is not available: ${addon.name}`,
        validated_addons: [],
        total_price: 0
      };
    }

    if (addon.requires_plan && addon.requires_plan !== planType) {
      return {
        is_valid: false,
        error_message: `${addon.name} requires ${addon.requires_plan} plan`,
        validated_addons: [],
        total_price: 0
      };
    }

    if (selected.quantity > addon.max_quantity) {
      return {
        is_valid: false,
        error_message: `Quantity exceeds maximum for ${addon.name}`,
        validated_addons: [],
        total_price: 0
      };
    }

    const validatedAddon: AddOnSelection = {
      addon_key: selected.addon_key,
      quantity: selected.quantity,
      price: addon.price,
      total: addon.price * selected.quantity
    };

    validatedAddOns.push(validatedAddon);
    totalPrice += validatedAddon.total;
  }

  return {
    is_valid: true,
    validated_addons: validatedAddOns,
    total_price: totalPrice
  };
};

// Convert frontend add-on selection to backend format
export const convertToBackendFormat = (addOns: { [key: string]: boolean }): AddOnSelection[] => {
  const selectedAddOns: AddOnSelection[] = [];
  
  // Map frontend boolean selections to backend format
  const addonMapping = {
    resumeReview: 'resume_review',
    meetingRecording: 'meeting_recording'
  };

  for (const [frontendKey, isSelected] of Object.entries(addOns)) {
    if (isSelected && addonMapping[frontendKey as keyof typeof addonMapping]) {
      const addonKey = addonMapping[frontendKey as keyof typeof addonMapping];
      const addon = DEFAULT_ADDONS.find(a => a.addon_key === addonKey);
      
      if (addon) {
        selectedAddOns.push({
          addon_key: addonKey,
          quantity: 1,
          price: addon.price,
          total: addon.price
        });
      }
    }
  }

  return selectedAddOns;
};

// Convert backend format to frontend format
export const convertToFrontendFormat = (selectedAddOns: AddOnSelection[]): { [key: string]: boolean } => {
  const frontendFormat: { [key: string]: boolean } = {
    resumeReview: false,
    meetingRecording: false
  };

  for (const addon of selectedAddOns) {
    switch (addon.addon_key) {
      case 'resume_review':
        frontendFormat.resumeReview = true;
        break;
      case 'meeting_recording':
        frontendFormat.meetingRecording = true;
        break;
    }
  }

  return frontendFormat;
};

