-- Cleanup duplicate add-ons in the database
-- This script identifies and removes duplicate add-on entries

-- Step 1: Show current duplicates
SELECT 
    'Current Duplicates' as status,
    addon_key,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at) as duplicate_ids,
    array_agg(name ORDER BY created_at) as duplicate_names,
    array_agg(created_at ORDER BY created_at) as creation_times
FROM public.add_ons
GROUP BY addon_key
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Show all add-ons for verification
SELECT 
    'All Add-ons' as status,
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

-- Step 3: Clean up duplicates (keep the oldest one)
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

-- Step 4: Verify cleanup
SELECT 
    'After Cleanup' as status,
    addon_key,
    COUNT(*) as count
FROM public.add_ons
GROUP BY addon_key
ORDER BY addon_key;

-- Step 5: Show final add-ons
SELECT 
    'Final Add-ons' as status,
    id,
    addon_key,
    name,
    price,
    category,
    requires_plan,
    is_active
FROM public.add_ons
ORDER BY addon_key;

