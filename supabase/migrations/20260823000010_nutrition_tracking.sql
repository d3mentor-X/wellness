-- ============================================================================
-- Fitness Application - Nutrition & Food Tracking Migration
-- ============================================================================
-- Migration: 20260823000010_nutrition_tracking.sql
-- Description:
-- 1. Creates nutrition_targets table for private personal macros & calorie goals.
-- 2. Creates foods library table with seeded staple foods.
-- 3. Extends nutrition_logs with meal_type and updated_at.
-- 4. Creates nutrition_log_items table for granular meal items.
-- 5. Implements trigger to recalculate nutrition_logs totals from items.
-- 6. Implements get_daily_nutrition_summary RPC function.
-- 7. Enables strict RLS ensuring complete privacy of nutrition data.
-- ============================================================================

-- 1. Create nutrition_targets table (Strictly private per user)
CREATE TABLE IF NOT EXISTS public.nutrition_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  calories NUMERIC(6,1) NOT NULL DEFAULT 2200 CHECK (calories >= 500 AND calories <= 10000),
  protein NUMERIC(5,1) NOT NULL DEFAULT 150 CHECK (protein >= 0 AND protein <= 1000),
  carbs NUMERIC(5,1) NOT NULL DEFAULT 250 CHECK (carbs >= 0 AND carbs <= 2000),
  fat NUMERIC(5,1) NOT NULL DEFAULT 70 CHECK (fat >= 0 AND fat <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_nutrition_targets UNIQUE (user_id)
);

ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_targets_select_own"
  ON public.nutrition_targets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "nutrition_targets_insert_own"
  ON public.nutrition_targets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "nutrition_targets_update_own"
  ON public.nutrition_targets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Create foods library table
CREATE TABLE IF NOT EXISTS public.foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  serving_size NUMERIC(6,2) NOT NULL DEFAULT 100,
  serving_unit TEXT NOT NULL DEFAULT 'g',
  calories NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (calories >= 0),
  protein NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (protein >= 0),
  carbs NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (carbs >= 0),
  fat NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (fat >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foods_select_authenticated"
  ON public.foods FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "foods_manage_instructors_admins"
  ON public.foods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'instructor') AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'instructor') AND status = 'active'
    )
  );

-- Seed Staple Foods
INSERT INTO public.foods (name, category, serving_size, serving_unit, calories, protein, carbs, fat)
VALUES
  ('Egg (Whole, Large)', 'protein', 1, 'piece', 72.0, 6.3, 0.4, 4.8),
  ('Egg Whites', 'protein', 100, 'g', 52.0, 10.9, 0.7, 0.2),
  ('Chicken Breast (Raw/Skinless)', 'protein', 100, 'g', 120.0, 22.5, 0.0, 2.6),
  ('Chicken Breast (Grilled)', 'protein', 100, 'g', 165.0, 31.0, 0.0, 3.6),
  ('White Rice (Cooked)', 'carbs', 100, 'g', 130.0, 2.7, 28.2, 0.3),
  ('Brown Rice (Cooked)', 'carbs', 100, 'g', 111.0, 2.6, 23.0, 0.9),
  ('Rolled Oats (Raw)', 'carbs', 100, 'g', 389.0, 16.9, 66.3, 6.9),
  ('Banana (Medium)', 'fruits', 1, 'piece', 105.0, 1.3, 27.0, 0.3),
  ('Apple (Medium)', 'fruits', 1, 'piece', 95.0, 0.5, 25.0, 0.3),
  ('Boiled Potato', 'carbs', 100, 'g', 87.0, 1.9, 20.1, 0.1),
  ('Whole Wheat Bread', 'carbs', 1, 'piece', 69.0, 3.6, 12.0, 1.0),
  ('Whole Milk', 'dairy', 250, 'ml', 150.0, 8.0, 12.0, 8.0),
  ('Greek Yogurt (Plain 0%)', 'dairy', 100, 'g', 59.0, 10.0, 3.6, 0.4),
  ('Lentils (Cooked Daal)', 'protein', 100, 'g', 116.0, 9.0, 20.0, 0.4),
  ('Chickpeas (Cooked)', 'protein', 100, 'g', 164.0, 8.9, 27.4, 2.6),
  ('Lean Beef (Minced 90/10)', 'protein', 100, 'g', 176.0, 20.0, 0.0, 10.0),
  ('Salmon Fillet (Grilled)', 'protein', 100, 'g', 206.0, 22.0, 0.0, 12.0),
  ('Tuna (Canned in Water)', 'protein', 100, 'g', 116.0, 25.5, 0.0, 0.8),
  ('Peanut Butter', 'fats', 32, 'g', 190.0, 7.0, 7.0, 16.0),
  ('Almonds (Raw)', 'fats', 30, 'g', 173.0, 6.0, 6.0, 15.0),
  ('Whey Protein Powder (1 Scoop)', 'supplements', 30, 'g', 120.0, 24.0, 2.0, 1.5),
  ('Olive Oil', 'fats', 15, 'ml', 119.0, 0.0, 0.0, 13.5)
ON CONFLICT (name) DO NOTHING;

-- 3. Extend nutrition_logs
ALTER TABLE public.nutrition_logs ADD COLUMN IF NOT EXISTS meal_type TEXT NOT NULL DEFAULT 'breakfast' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'other'));
ALTER TABLE public.nutrition_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ensure RLS on nutrition_logs is strictly private
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nutrition_logs_select_own" ON public.nutrition_logs;
CREATE POLICY "nutrition_logs_select_own"
  ON public.nutrition_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "nutrition_logs_insert_own" ON public.nutrition_logs;
CREATE POLICY "nutrition_logs_insert_own"
  ON public.nutrition_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nutrition_logs_update_own" ON public.nutrition_logs;
CREATE POLICY "nutrition_logs_update_own"
  ON public.nutrition_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "nutrition_logs_delete_own" ON public.nutrition_logs;
CREATE POLICY "nutrition_logs_delete_own"
  ON public.nutrition_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Create nutrition_log_items table
CREATE TABLE IF NOT EXISTS public.nutrition_log_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_log_id UUID NOT NULL REFERENCES public.nutrition_logs(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity NUMERIC(6,2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'g',
  calories NUMERIC(6,1) NOT NULL CHECK (calories >= 0),
  protein NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (protein >= 0),
  carbs NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (carbs >= 0),
  fat NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (fat >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_log_items_log ON public.nutrition_log_items(nutrition_log_id);

ALTER TABLE public.nutrition_log_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nutrition_log_items_select_own"
  ON public.nutrition_log_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.nutrition_logs nl
      WHERE nl.id = nutrition_log_items.nutrition_log_id AND nl.user_id = auth.uid()
    )
  );

CREATE POLICY "nutrition_log_items_insert_own"
  ON public.nutrition_log_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nutrition_logs nl
      WHERE nl.id = nutrition_log_items.nutrition_log_id AND nl.user_id = auth.uid()
    )
  );

CREATE POLICY "nutrition_log_items_update_own"
  ON public.nutrition_log_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.nutrition_logs nl
      WHERE nl.id = nutrition_log_items.nutrition_log_id AND nl.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nutrition_logs nl
      WHERE nl.id = nutrition_log_items.nutrition_log_id AND nl.user_id = auth.uid()
    )
  );

CREATE POLICY "nutrition_log_items_delete_own"
  ON public.nutrition_log_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.nutrition_logs nl
      WHERE nl.id = nutrition_log_items.nutrition_log_id AND nl.user_id = auth.uid()
    )
  );

-- 5. Trigger to automatically recompute nutrition_logs totals from items
CREATE OR REPLACE FUNCTION public.sync_nutrition_log_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_log_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_log_id := OLD.nutrition_log_id;
  ELSE
    v_log_id := NEW.nutrition_log_id;
  END IF;

  UPDATE public.nutrition_logs
  SET
    calories = COALESCE((SELECT SUM(calories) FROM public.nutrition_log_items WHERE nutrition_log_id = v_log_id), 0),
    protein  = COALESCE((SELECT SUM(protein) FROM public.nutrition_log_items WHERE nutrition_log_id = v_log_id), 0),
    carbs    = COALESCE((SELECT SUM(carbs) FROM public.nutrition_log_items WHERE nutrition_log_id = v_log_id), 0),
    fat      = COALESCE((SELECT SUM(fat) FROM public.nutrition_log_items WHERE nutrition_log_id = v_log_id), 0),
    updated_at = now()
  WHERE id = v_log_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_sync_nutrition_totals ON public.nutrition_log_items;
CREATE TRIGGER trigger_sync_nutrition_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.nutrition_log_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_nutrition_log_totals();

-- 6. RPC Function: Get Daily Nutrition Summary
CREATE OR REPLACE FUNCTION public.get_daily_nutrition_summary(
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_targets RECORD;
  v_totals RECORD;
  v_meals JSONB := '[]'::jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 1. Get or create default targets
  SELECT calories, protein, carbs, fat
  INTO v_targets
  FROM public.nutrition_targets
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.nutrition_targets (user_id, calories, protein, carbs, fat)
    VALUES (v_user_id, 2200, 150, 250, 70)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT 2200::NUMERIC AS calories, 150::NUMERIC AS protein, 250::NUMERIC AS carbs, 70::NUMERIC AS fat
    INTO v_targets;
  END IF;

  -- 2. Daily totals
  SELECT
    COALESCE(SUM(calories), 0)::NUMERIC AS total_calories,
    COALESCE(SUM(protein), 0)::NUMERIC AS total_protein,
    COALESCE(SUM(carbs), 0)::NUMERIC AS total_carbs,
    COALESCE(SUM(fat), 0)::NUMERIC AS total_fat
  INTO v_totals
  FROM public.nutrition_logs
  WHERE user_id = v_user_id AND log_date = p_date;

  -- 3. Meal breakdown with items
  SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
  INTO v_meals
  FROM (
    SELECT
      nl.id,
      nl.meal_type,
      nl.log_date,
      nl.calories,
      nl.protein,
      nl.carbs,
      nl.fat,
      nl.notes,
      nl.created_at,
      COALESCE(
        (
          SELECT jsonb_agg(nli ORDER BY nli.created_at ASC)
          FROM public.nutrition_log_items nli
          WHERE nli.nutrition_log_id = nl.id
        ),
        '[]'::jsonb
      ) AS items
    FROM public.nutrition_logs nl
    WHERE nl.user_id = v_user_id AND nl.log_date = p_date
    ORDER BY
      CASE nl.meal_type
        WHEN 'breakfast' THEN 1
        WHEN 'lunch' THEN 2
        WHEN 'dinner' THEN 3
        WHEN 'snack' THEN 4
        ELSE 5
      END,
      nl.created_at ASC
  ) sub;

  RETURN jsonb_build_object(
    'date', p_date,
    'targets', jsonb_build_object(
      'calories', v_targets.calories,
      'protein', v_targets.protein,
      'carbs', v_targets.carbs,
      'fat', v_targets.fat
    ),
    'totals', jsonb_build_object(
      'calories', ROUND(v_totals.total_calories, 1),
      'protein', ROUND(v_totals.total_protein, 1),
      'carbs', ROUND(v_totals.total_carbs, 1),
      'fat', ROUND(v_totals.total_fat, 1)
    ),
    'meals', v_meals
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_daily_nutrition_summary(DATE) TO authenticated;

