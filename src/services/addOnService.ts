// Add-on Service
// Phase 3.2: Backend API for Add-ons

import { supabase } from '@/integrations/supabase/client';
import { AddOn, UserAddOn, AddOnSelection, AddOnValidationResult } from '@/utils/addOnConfig';

export class AddOnService {
  // Fetch all available add-ons
  static async getAvailableAddOns(): Promise<AddOn[]> {
    try {
      const { data, error } = await supabase
        .from('add_ons')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching add-ons:', error);
        throw new Error(`Failed to fetch add-ons: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('AddOnService.getAvailableAddOns error:', error);
      throw error;
    }
  }

  // Fetch add-ons available for a specific plan
  static async getAddOnsForPlan(planType: string): Promise<AddOn[]> {
    try {
      const { data, error } = await supabase
        .from('add_ons')
        .select('*')
        .eq('is_active', true)
        .or(`requires_plan.is.null,requires_plan.eq.${planType}`)
        .order('category', { ascending: true })
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching add-ons for plan:', error);
        throw new Error(`Failed to fetch add-ons for plan: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('AddOnService.getAddOnsForPlan error:', error);
      throw error;
    }
  }

  // Validate add-on selection using database function
  static async validateAddOns(
    userId: string,
    planType: string,
    selectedAddOns: AddOnSelection[]
  ): Promise<AddOnValidationResult> {
    try {
      const addOnsJson = JSON.stringify(selectedAddOns);
      
      const { data, error } = await supabase.rpc('validate_addons', {
        p_user_id: userId,
        p_plan_type: planType,
        p_addons_json: addOnsJson
      });

      if (error) {
        console.error('Error validating add-ons:', error);
        throw new Error(`Failed to validate add-ons: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No validation result returned');
      }

      const result = data[0];
      return {
        is_valid: result.is_valid,
        error_message: result.error_message,
        validated_addons: result.validated_addons || [],
        total_price: result.validated_addons ? 
          result.validated_addons.reduce((total: number, addon: any) => total + addon.total, 0) : 0
      };
    } catch (error) {
      console.error('AddOnService.validateAddOns error:', error);
      throw error;
    }
  }

  // Calculate add-ons total using database function
  static async calculateAddOnsTotal(selectedAddOns: AddOnSelection[]): Promise<number> {
    try {
      const addOnsJson = JSON.stringify(selectedAddOns);
      
      const { data, error } = await supabase.rpc('calculate_addons_total', {
        addons_json: addOnsJson
      });

      if (error) {
        console.error('Error calculating add-ons total:', error);
        throw new Error(`Failed to calculate add-ons total: ${error.message}`);
      }

      return data || 0;
    } catch (error) {
      console.error('AddOnService.calculateAddOnsTotal error:', error);
      throw error;
    }
  }

  // Save user's add-on selection
  static async saveUserAddOns(userId: string, selectedAddOns: AddOnSelection[]): Promise<UserAddOn[]> {
    try {
      // First, get add-on IDs
      const addOns = await this.getAvailableAddOns();
      const addOnMap = new Map(addOns.map(addon => [addon.addon_key, addon.id]));

      // Prepare user add-ons data
      const userAddOnsData = selectedAddOns.map(selected => ({
        user_id: userId,
        addon_id: addOnMap.get(selected.addon_key),
        quantity: selected.quantity,
        is_active: true
      })).filter(item => item.addon_id); // Filter out any missing add-on IDs

      if (userAddOnsData.length === 0) {
        return [];
      }

      // Delete existing user add-ons
      await supabase
        .from('user_add_ons')
        .delete()
        .eq('user_id', userId);

      // Insert new user add-ons
      const { data, error } = await supabase
        .from('user_add_ons')
        .insert(userAddOnsData)
        .select(`
          *,
          addon:add_ons(*)
        `);

      if (error) {
        console.error('Error saving user add-ons:', error);
        throw new Error(`Failed to save user add-ons: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('AddOnService.saveUserAddOns error:', error);
      throw error;
    }
  }

  // Get user's selected add-ons
  static async getUserAddOns(userId: string): Promise<UserAddOn[]> {
    try {
      const { data, error } = await supabase
        .from('user_add_ons')
        .select(`
          *,
          addon:add_ons(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('selected_at', { ascending: false });

      if (error) {
        console.error('Error fetching user add-ons:', error);
        throw new Error(`Failed to fetch user add-ons: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('AddOnService.getUserAddOns error:', error);
      throw error;
    }
  }

  // Update payment session with add-ons
  static async updatePaymentSessionWithAddOns(
    paymentSessionId: string,
    selectedAddOns: AddOnSelection[]
  ): Promise<void> {
    try {
      const addOnsTotal = await this.calculateAddOnsTotal(selectedAddOns);
      const addOnsJson = JSON.stringify(selectedAddOns);

      const { error } = await supabase
        .from('payment_sessions')
        .update({
          selected_add_ons: addOnsJson,
          add_ons_total: addOnsTotal
        })
        .eq('id', paymentSessionId);

      if (error) {
        console.error('Error updating payment session with add-ons:', error);
        throw new Error(`Failed to update payment session: ${error.message}`);
      }
    } catch (error) {
      console.error('AddOnService.updatePaymentSessionWithAddOns error:', error);
      throw error;
    }
  }

  // Update interview with add-ons
  static async updateInterviewWithAddOns(
    interviewId: string,
    selectedAddOns: AddOnSelection[]
  ): Promise<void> {
    try {
      const addOnsTotal = await this.calculateAddOnsTotal(selectedAddOns);
      const addOnsJson = JSON.stringify(selectedAddOns);

      const { error } = await supabase
        .from('interviews')
        .update({
          selected_add_ons: addOnsJson,
          add_ons_total: addOnsTotal
        })
        .eq('id', interviewId);

      if (error) {
        console.error('Error updating interview with add-ons:', error);
        throw new Error(`Failed to update interview: ${error.message}`);
      }
    } catch (error) {
      console.error('AddOnService.updateInterviewWithAddOns error:', error);
      throw error;
    }
  }

  // Get add-on by key
  static async getAddOnByKey(addonKey: string): Promise<AddOn | null> {
    try {
      const { data, error } = await supabase
        .from('add_ons')
        .select('*')
        .eq('addon_key', addonKey)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        console.error('Error fetching add-on by key:', error);
        throw new Error(`Failed to fetch add-on: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('AddOnService.getAddOnByKey error:', error);
      throw error;
    }
  }

  // Get add-ons by category
  static async getAddOnsByCategory(category: string): Promise<AddOn[]> {
    try {
      const { data, error } = await supabase
        .from('add_ons')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching add-ons by category:', error);
        throw new Error(`Failed to fetch add-ons by category: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('AddOnService.getAddOnsByCategory error:', error);
      throw error;
    }
  }
}

