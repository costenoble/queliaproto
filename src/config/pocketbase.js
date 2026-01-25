
import PocketBase from 'pocketbase';

// Initialize the PocketBase client
// Using default localhost for development, can be overridden by env var
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
export const pb = new PocketBase(pbUrl);

// Disable auto-cancellation to avoid issues with React Strict Mode double-invocations
pb.autoCancellation(false);

/**
 * PROJECT COLLECTION SCHEMA REFERENCE
 * 
 * Collection Name: projects
 * 
 * Fields:
 * - name (text)
 * - type (select: 'Parc éolien', 'Station solaire', 'Méthanisation', 'Consultation publique', 'Centre de stockage', 'Ligne électrique')
 * - status (select: 'en étude', 'en construction', 'en exploitation', 'consultation en cours')
 * - city (text)
 * - region (text)
 * - latitude (number)
 * - longitude (number)
 * - startDate (date)
 * - endDate (date)
 * - capacity (text) - e.g. "2.5"
 * - capacityUnit (select: 'MW', 'MWh', 'KV', 'Nm3/h')
 * - description (text)
 * 
 * ADMIN USERS
 * - Uses default PocketBase 'users' collection or separate 'admin_users' if configured manually.
 * - For this implementation, we will use the default 'admins' authentication provided by PocketBase
 *   or the 'users' collection if 'admins' is restricted.
 */
