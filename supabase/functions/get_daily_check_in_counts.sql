CREATE OR REPLACE FUNCTION get_daily_check_in_counts(team_id_param UUID, days_limit INTEGER)
RETURNS TABLE (
  check_in_date DATE,
  check_in_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(
      CURRENT_DATE - (days_limit || ' days')::INTERVAL,
      CURRENT_DATE,
      '1 day'::INTERVAL
    )::DATE AS date
  )
  SELECT 
    dr.date as check_in_date,
    COUNT(c.id) as check_in_count
  FROM date_range dr
  LEFT JOIN check_ins c ON DATE(c.check_in_date) = dr.date AND c.team_id = team_id_param
  GROUP BY dr.date
  ORDER BY dr.date DESC
  LIMIT days_limit;
END;
$$ LANGUAGE plpgsql; 