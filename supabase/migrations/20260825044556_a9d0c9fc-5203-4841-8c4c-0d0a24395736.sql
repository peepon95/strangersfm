CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule('drive-sync-notes') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'drive-sync-notes'
);

SELECT cron.schedule(
  'drive-sync-notes',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--a35c9516-1a66-496f-aa18-df10fce1d42e.lovable.app/api/public/drive-sync',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_HPjvSQpA3ErAESlTk58aYw_RbNnVR_D"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);