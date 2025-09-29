-- Check for duplicate add-ons in the database
-- This script helps identify and fix duplicate add-on entries

-- Check for duplicate add-on keys
SELECT 
    addon_key,
    COUNT(*) as duplicate_count,
    array_agg(id) as duplicate_ids,
    array_agg(name) as duplicate_names
FROM public.add_ons
GROUP BY addon_key
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check for duplicate names
SELECT 
    name,
    COUNT(*) as duplicate_count,
    array_agg(id) as duplicate_ids,
    array_agg(addon_key) as duplicate_keys
FROM public.add_ons
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Show all add-ons to verify structure
SELECT 
    id,
    addon_key,
    name,
    price,
    category,
    requires_plan,
    is_active,
    created_at
FROM public.add_ons
ORDER BY addon_key, created_at;

-- If duplicates are found, you can use this script to clean them up:
-- (Uncomment and modify as needed)

/*
-- Clean up duplicate add-ons (keep the oldest one)
WITH duplicates AS (
    SELECT 
        id,
        addon_key,
        ROW_NUMBER() OVER (PARTITION BY addon_key ORDER BY created_at ASC) as rn
    FROM public.add_ons
)
DELETE FROM public.add_ons
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Verify cleanup
SELECT 
    addon_key,
    COUNT(*) as count
FROM public.add_ons
GROUP BY addon_key
ORDER BY addon_key;
*/

