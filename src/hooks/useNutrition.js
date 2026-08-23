import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export function useNutrition(initialDate = null) {
  const { user, membership } = useAuth()
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(initialDate || todayStr)
  const [summary, setSummary] = useState({
    date: selectedDate,
    targets: { calories: 2200, protein: 150, carbs: 250, fat: 70 },
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    meals: [],
  })
  const [foodLibrary, setFoodLibrary] = useState([])
  const [historySummaries, setHistorySummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const userId = user?.id
  const clubId = membership?.club_id

  // 1. Fetch Daily Summary via RPC
  const fetchDailySummary = useCallback(async (date = selectedDate) => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const { data, error: rpcErr } = await supabase.rpc('get_daily_nutrition_summary', {
        p_date: date,
      })

      if (!rpcErr && data) {
        setSummary({
          date: data.date || date,
          targets: data.targets || { calories: 2200, protein: 150, carbs: 250, fat: 70 },
          totals: data.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 },
          meals: Array.isArray(data.meals) ? data.meals : [],
        })
      } else {
        // Fallback direct query
        const { data: logsData } = await supabase
          .from('nutrition_logs')
          .select(`
            id,
            meal_type,
            log_date,
            calories,
            protein,
            carbs,
            fat,
            notes,
            created_at,
            nutrition_log_items (
              id,
              food_name,
              quantity,
              unit,
              calories,
              protein,
              carbs,
              fat,
              created_at
            )
          `)
          .eq('user_id', userId)
          .eq('log_date', date)

        const meals = (logsData || []).map((l) => ({
          ...l,
          items: l.nutrition_log_items || [],
        }))

        const totalCals = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0)
        const totalP = meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0)
        const totalC = meals.reduce((sum, m) => sum + (Number(m.carbs) || 0), 0)
        const totalF = meals.reduce((sum, m) => sum + (Number(m.fat) || 0), 0)

        // Fetch targets
        const { data: targetData } = await supabase
          .from('nutrition_targets')
          .select('*')
          .eq('user_id', userId)
          .single()

        setSummary({
          date,
          targets: targetData
            ? {
                calories: Number(targetData.calories),
                protein: Number(targetData.protein),
                carbs: Number(targetData.carbs),
                fat: Number(targetData.fat),
              }
            : { calories: 2200, protein: 150, carbs: 250, fat: 70 },
          totals: {
            calories: Math.round(totalCals * 10) / 10,
            protein: Math.round(totalP * 10) / 10,
            carbs: Math.round(totalC * 10) / 10,
            fat: Math.round(totalF * 10) / 10,
          },
          meals,
        })
      }
    } catch (err) {
      console.error('Error fetching nutrition summary:', err)
      setError(err.message || 'Failed to load nutrition summary')
    }
  }, [userId, selectedDate])

  // 2. Fetch Food Catalog
  const fetchFoodLibrary = useCallback(async () => {
    try {
      const { data, error: fErr } = await supabase
        .from('foods')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (!fErr && data) {
        setFoodLibrary(data)
      }
    } catch (err) {
      console.error('Error fetching foods library:', err)
    }
  }, [])

  // 3. Fetch 7-Day History for Trends
  const fetchNutritionHistory = useCallback(async () => {
    if (!userId) return
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const { data } = await supabase
        .from('nutrition_logs')
        .select('log_date, calories, protein, carbs, fat')
        .eq('user_id', userId)
        .gte('log_date', sevenDaysAgo)
        .order('log_date', { ascending: true })

      // Aggregate by date
      const grouped = {}
      ;(data || []).forEach((row) => {
        if (!grouped[row.log_date]) {
          grouped[row.log_date] = { date: row.log_date, calories: 0, protein: 0, carbs: 0, fat: 0 }
        }
        grouped[row.log_date].calories += Number(row.calories) || 0
        grouped[row.log_date].protein += Number(row.protein) || 0
        grouped[row.log_date].carbs += Number(row.carbs) || 0
        grouped[row.log_date].fat += Number(row.fat) || 0
      })

      setHistorySummaries(Object.values(grouped))
    } catch (err) {
      console.error('Error fetching nutrition history:', err)
    }
  }, [userId])

  // Initial load
  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      await Promise.all([
        fetchDailySummary(selectedDate),
        fetchFoodLibrary(),
        fetchNutritionHistory(),
      ])
      setLoading(false)
    }
    loadAll()
  }, [fetchDailySummary, fetchFoodLibrary, fetchNutritionHistory, selectedDate])

  // Save Meal with Food Items
  const saveMeal = async ({ meal_type, log_date = selectedDate, notes = null, items = [] }) => {
    if (!userId || !clubId) throw new Error('Not authenticated')
    setActionLoading(true)
    setError(null)

    try {
      // 1. Create parent nutrition_logs record
      const { data: logRecord, error: logErr } = await supabase
        .from('nutrition_logs')
        .insert({
          user_id: userId,
          club_id: clubId,
          log_date,
          meal_type,
          notes: notes?.trim() || null,
        })
        .select()
        .single()

      if (logErr) throw logErr

      // 2. Insert items
      if (items.length > 0) {
        const itemRows = items.map((item) => ({
          nutrition_log_id: logRecord.id,
          food_name: item.food_name.trim(),
          quantity: parseFloat(item.quantity) || 1,
          unit: item.unit || 'g',
          calories: Math.max(0, parseFloat(item.calories) || 0),
          protein: Math.max(0, parseFloat(item.protein) || 0),
          carbs: Math.max(0, parseFloat(item.carbs) || 0),
          fat: Math.max(0, parseFloat(item.fat) || 0),
        }))

        const { error: itemErr } = await supabase
          .from('nutrition_log_items')
          .insert(itemRows)

        if (itemErr) throw itemErr
      }

      await Promise.all([fetchDailySummary(log_date), fetchNutritionHistory()])
    } catch (err) {
      console.error('Error saving meal:', err)
      setError(err.message || 'Failed to save meal')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Entire Meal
  const deleteMeal = async (mealId) => {
    if (!userId) return
    setActionLoading(true)
    try {
      const { error: delErr } = await supabase
        .from('nutrition_logs')
        .delete()
        .eq('id', mealId)
        .eq('user_id', userId)

      if (delErr) throw delErr
      await Promise.all([fetchDailySummary(selectedDate), fetchNutritionHistory()])
    } catch (err) {
      console.error('Error deleting meal:', err)
      setError(err.message || 'Failed to delete meal')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Individual Food Item
  const deleteMealItem = async (itemId) => {
    if (!userId) return
    setActionLoading(true)
    try {
      const { error: delErr } = await supabase
        .from('nutrition_log_items')
        .delete()
        .eq('id', itemId)

      if (delErr) throw delErr
      await Promise.all([fetchDailySummary(selectedDate), fetchNutritionHistory()])
    } catch (err) {
      console.error('Error deleting meal item:', err)
      setError(err.message || 'Failed to delete item')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // Update Personal Targets
  const updateTargets = async ({ calories, protein, carbs, fat }) => {
    if (!userId) return
    setActionLoading(true)
    setError(null)
    try {
      const { error: tErr } = await supabase
        .from('nutrition_targets')
        .upsert(
          {
            user_id: userId,
            club_id: clubId,
            calories: parseFloat(calories) || 2200,
            protein: parseFloat(protein) || 150,
            carbs: parseFloat(carbs) || 250,
            fat: parseFloat(fat) || 70,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (tErr) throw tErr
      await fetchDailySummary(selectedDate)
    } catch (err) {
      console.error('Error updating nutrition targets:', err)
      setError(err.message || 'Failed to update targets')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  return {
    selectedDate,
    setSelectedDate: (d) => {
      setSelectedDate(d)
      fetchDailySummary(d)
    },
    summary,
    foodLibrary,
    historySummaries,
    loading,
    actionLoading,
    error,
    saveMeal,
    deleteMeal,
    deleteMealItem,
    updateTargets,
    refetch: () => {
      fetchDailySummary(selectedDate)
      fetchFoodLibrary()
      fetchNutritionHistory()
    },
  }
}

