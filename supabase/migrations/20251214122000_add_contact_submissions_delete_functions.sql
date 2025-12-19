-- Create a function to delete all contact submissions
CREATE OR REPLACE FUNCTION delete_all_contact_submissions()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.contact_submissions;
END;
$$ LANGUAGE plpgsql;

-- Create a function to delete a specific contact submission by ID
CREATE OR REPLACE FUNCTION delete_contact_submission_by_id(submission_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.contact_submissions WHERE id = submission_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to anon and authenticated users
-- (This is needed for the frontend to call these functions)
GRANT EXECUTE ON FUNCTION delete_all_contact_submissions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_contact_submission_by_id(UUID) TO anon, authenticated;