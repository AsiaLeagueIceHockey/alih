-- Expand-only: make prediction schedule identity type-safe.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.alih_predictions AS prediction
    LEFT JOIN public.alih_schedule AS schedule ON schedule.id = prediction.schedule_id
    WHERE schedule.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot add prediction schedule FK while orphan predictions exist';
  END IF;
END $$;

ALTER TABLE public.alih_predictions
  ALTER COLUMN schedule_id TYPE BIGINT USING schedule_id::BIGINT;

ALTER TABLE public.alih_predictions
  ADD CONSTRAINT alih_predictions_schedule_id_fkey
  FOREIGN KEY (schedule_id) REFERENCES public.alih_schedule(id)
  ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.alih_predictions
  VALIDATE CONSTRAINT alih_predictions_schedule_id_fkey;
