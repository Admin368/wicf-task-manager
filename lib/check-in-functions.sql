-- Drop the function if it already exists to make script idempotent
DROP FUNCTION IF EXISTS get_daily_check_in_counts;

-- Function to get daily check-in counts for a team
CREATE OR REPLACE FUNCTION get_daily_check_in_counts(team_id_param UUID, days_limit INT DEFAULT 30)
RETURNS TABLE (
  check_in_date DATE,
  check_in_count BIGINT
) AS $$
DECLARE
  max_days CONSTANT INT := 90; -- Safety limit
BEGIN
  -- Validate inputs
  IF team_id_param IS NULL THEN
    RAISE EXCEPTION 'team_id_param cannot be null';
  END IF;
  
  -- Limit days to a reasonable maximum
  IF days_limit > max_days THEN
    days_limit := max_days;
  END IF;
  
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - (days_limit - 1), 
      CURRENT_DATE, 
      '1 day'::interval
    )::date AS date
  ),
  check_in_counts AS (
    SELECT 
      check_in_date, 
      COUNT(*) as count
    FROM 
      check_ins
    WHERE 
      team_id = team_id_param
      AND check_in_date >= CURRENT_DATE - (days_limit - 1)
    GROUP BY 
      check_in_date
  )
  SELECT
    ds.date AS check_in_date,
    COALESCE(cc.count, 0) AS check_in_count
  FROM
    date_series ds
  LEFT JOIN
    check_in_counts cc ON ds.date = cc.check_in_date
  ORDER BY
    ds.date DESC;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error and rethrow
    RAISE NOTICE 'Error in get_daily_check_in_counts: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a user is checked in for a specific date
DROP FUNCTION IF EXISTS is_user_checked_in;

CREATE OR REPLACE FUNCTION is_user_checked_in(team_id_param UUID, user_id_param UUID, date_param DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
DECLARE
  is_checked_in BOOLEAN;
BEGIN
  -- Validate inputs
  IF team_id_param IS NULL OR user_id_param IS NULL THEN
    RAISE EXCEPTION 'team_id_param and user_id_param cannot be null';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 
    FROM check_ins 
    WHERE team_id = team_id_param 
    AND user_id = user_id_param 
    AND check_in_date = date_param
  ) INTO is_checked_in;
  
  RETURN is_checked_in;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error and return false as a safe default
    RAISE NOTICE 'Error in is_user_checked_in: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql; 