-- Let's test the function directly to see if it works
DO $$
DECLARE
    test_result INTEGER;
BEGIN
    -- Test if we can make an HTTP call
    SELECT status INTO test_result FROM net.http_post(
        url := 'https://httpbin.org/post',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('test', 'data')
    );
    
    RAISE LOG 'HTTP test result: %', test_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'HTTP test failed: %', SQLERRM;
END $$;