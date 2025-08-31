-- PL/SQL Function to update task status based on task_iterations changes
-- This function will set the status to 'pending' in tasks_test when:
-- 1. A task_iteration is inserted or updated
-- 2. The current_stage is NOT "Delivery"

CREATE OR REPLACE FUNCTION update_task_status_on_iteration_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if current_stage is not "Delivery"
    IF NEW.current_stage != 'Delivery' THEN
        -- Update the status in tasks_test to 'pending'
        UPDATE tasks_test 
        SET 
            status = 'pending',
            updated_at = NOW()
        WHERE task_id = NEW.task_id;
        
        -- Log the update for debugging purposes
        RAISE NOTICE 'Updated task % status to pending due to stage change to %', NEW.task_id, NEW.current_stage;
    ELSE
        -- If current_stage is "Delivery", you might want to set a different status
        -- For now, we'll leave it as is, but you can uncomment the lines below if needed
        /*
        UPDATE tasks_test 
        SET 
            status = 'completed',
            updated_at = NOW()
        WHERE task_id = NEW.task_id;
        
        RAISE NOTICE 'Task % moved to Delivery stage', NEW.task_id;
        */
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations on task_iterations
CREATE OR REPLACE TRIGGER trigger_update_task_status_on_insert
    AFTER INSERT ON task_iterations
    FOR EACH ROW
    EXECUTE FUNCTION update_task_status_on_iteration_change();

-- Create trigger for UPDATE operations on task_iterations
CREATE OR REPLACE TRIGGER trigger_update_task_status_on_update
    AFTER UPDATE ON task_iterations
    FOR EACH ROW
    EXECUTE FUNCTION update_task_status_on_iteration_change();

-- Optional: Create a trigger that only fires when current_stage changes
-- This is more efficient as it only runs when the current_stage actually changes
CREATE OR REPLACE TRIGGER trigger_update_task_status_on_stage_change
    AFTER UPDATE OF current_stage ON task_iterations
    FOR EACH ROW
    WHEN (OLD.current_stage IS DISTINCT FROM NEW.current_stage)
    EXECUTE FUNCTION update_task_status_on_iteration_change();

-- Note: You may want to drop the previous triggers if you use the stage-specific one:
-- DROP TRIGGER IF EXISTS trigger_update_task_status_on_insert ON task_iterations;
-- DROP TRIGGER IF EXISTS trigger_update_task_status_on_update ON task_iterations;

-- Example of how to test the function manually:
-- SELECT update_task_status_on_iteration_change() FROM task_iterations WHERE task_id = 'your-task-id-here' LIMIT 1;
