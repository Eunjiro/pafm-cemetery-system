/**
 * PAFM-C Cemetery Mapping System - API Client
 * 
 * This library provides functions to integrate with the external PAFM-C
 * cemetery mapping system. Use this to send approved burial permits and
 * check plot assignment status.
 */

const CEMETERY_API_BASE_URL = process.env.CEMETERY_API_BASE_URL || '';
const CEMETERY_API_KEY = process.env.CEMETERY_API_KEY || '';

interface CemeteryApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get list of available cemeteries from PAFM-C
 */
export async function fetchAvailableCemeteries() {
  try {
    const response = await fetch(`${CEMETERY_API_BASE_URL}/api/external/cemeteries?active=true`, {
      headers: {
        'Authorization': `Bearer ${CEMETERY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cemeteries: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data: data.cemeteries };
  } catch (error: any) {
    console.error('Error fetching cemeteries:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get list of available plots from PAFM-C
 */
export async function fetchAvailablePlots(cemeteryId?: string) {
  try {
    const params = new URLSearchParams({ available: 'true' });
    if (cemeteryId) {
      params.append('cemetery_id', cemeteryId);
    }

    const response = await fetch(
      `${CEMETERY_API_BASE_URL}/api/external/plots?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${CEMETERY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch plots: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data: data.plots };
  } catch (error: any) {
    console.error('Error fetching plots:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Submit an approved burial permit to PAFM-C
 */
export async function submitBurialPermitToCemetery(permit: {
  permit_id: string;
  permit_type: 'burial' | 'exhumation';
  deceased_first_name: string;
  deceased_middle_name?: string;
  deceased_last_name: string;
  deceased_suffix?: string;
  date_of_birth?: string;
  date_of_death: string;
  gender?: string;
  applicant_name: string;
  applicant_email?: string;
  applicant_phone?: string;
  relationship_to_deceased?: string;
  preferred_cemetery_id?: string;
  preferred_plot_id?: string;
  preferred_section?: string;
  preferred_layer?: number;
  permit_approved_at: string;
  permit_expiry_date?: string;
  permit_document_url?: string;
  metadata?: Record<string, any>;
}): Promise<CemeteryApiResponse<any>> {
  try {
    console.log(`[Cemetery API] Submitting permit to: ${CEMETERY_API_BASE_URL}/api/external/permits`);
    console.log(`[Cemetery API] Permit ID: ${permit.permit_id}`);

    const response = await fetch(`${CEMETERY_API_BASE_URL}/api/external/permits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CEMETERY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(permit),
    });

    // Read response text first
    const responseText = await response.text();
    console.log(`[Cemetery API] Response status: ${response.status}`);
    console.log(`[Cemetery API] Response text: ${responseText.substring(0, 200)}`);

    // Try to parse as JSON
    let data;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.warn(`[Cemetery API] Failed to parse response as JSON: ${e}`);
        data = { raw: responseText };
      }
    }

    if (!response.ok) {
      const errorMsg = data?.error || `Failed to submit permit: ${response.status}`;
      throw new Error(errorMsg);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error submitting permit to cemetery:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check status of submitted permit at PAFM-C
 */
export async function checkPermitStatus(permitId: string): Promise<CemeteryApiResponse<any>> {
  try {
    const response = await fetch(
      `${CEMETERY_API_BASE_URL}/api/external/permits?permit_id=${permitId}`,
      {
        headers: {
          'Authorization': `Bearer ${CEMETERY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Permit not found at cemetery system' };
      }
      throw new Error(`Failed to check permit status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data: data.permit };
  } catch (error: any) {
    console.error('Error checking permit status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if cemetery API is configured and reachable
 */
export async function checkCemeteryApiConnection(): Promise<boolean> {
  if (!CEMETERY_API_BASE_URL || !CEMETERY_API_KEY) {
    console.warn('Cemetery API not configured. Set CEMETERY_API_BASE_URL and CEMETERY_API_KEY in environment variables.');
    return false;
  }

  try {
    const result = await fetchAvailableCemeteries();
    return result.success;
  } catch {
    return false;
  }
}
