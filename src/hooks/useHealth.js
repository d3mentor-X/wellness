import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export function useHealth(initialDate = null) {
  const { user, membership } = useAuth()
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(initialDate || todayStr)
  
  const [currentLog, setCurrentLog] = useState({
    id: null,
    log_date: selectedDate,
    sleep_minutes: null,
    sleep_goal_minutes: 480, // 8h default
    screen_time_minutes: null,
    screen_time_goal_minutes: 240, // 4h default
    screenshot_url: null,
    is_screenshot_shared: false,
    notes: '',
  })

  const [averages, setAverages] = useState({
    avg_sleep_minutes: 0,
    avg_screen_time_minutes: 0,
  })

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const userId = user?.id
  const clubId = membership?.club_id

  // 1. Fetch Daily Health Summary via RPC or direct fallback
  const fetchHealthSummary = useCallback(async (date = selectedDate) => {
    if (!userId || !clubId) {
      setLoading(false)
      return
    }

    try {
      const { data, error: rpcErr } = await supabase.rpc('get_daily_health_summary', {
        p_club_id: clubId,
        p_date: date,
      })

      if (!rpcErr && data) {
        if (data.current) {
          setCurrentLog(data.current)
        } else {
          setCurrentLog({
            id: null,
            log_date: date,
            sleep_minutes: null,
            sleep_goal_minutes: 480,
            screen_time_minutes: null,
            screen_time_goal_minutes: 240,
            screenshot_url: null,
            is_screenshot_shared: false,
            notes: '',
          })
        }

        if (data.averages_7d) {
          setAverages(data.averages_7d)
        }
        if (Array.isArray(data.history)) {
          setHistory(data.history)
        }
      } else {
        // Fallback direct table query
        const { data: logRow } = await supabase
          .from('daily_health_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('club_id', clubId)
          .eq('log_date', date)
          .maybeSingle()

        if (logRow) {
          setCurrentLog(logRow)
        } else {
          setCurrentLog({
            id: null,
            log_date: date,
            sleep_minutes: null,
            sleep_goal_minutes: 480,
            screen_time_minutes: null,
            screen_time_goal_minutes: 240,
            screenshot_url: null,
            is_screenshot_shared: false,
            notes: '',
          })
        }

        // Fetch 14-day history directly
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const { data: historyRows } = await supabase
          .from('daily_health_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('club_id', clubId)
          .gte('log_date', fourteenDaysAgo)
          .order('log_date', { ascending: false })

        const hist = historyRows || []
        setHistory(hist)

        // Calculate 7d averages
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const recent7 = hist.filter((h) => h.log_date >= sevenDaysAgo)
        const sleepLogs = recent7.filter((h) => h.sleep_minutes !== null && h.sleep_minutes !== undefined)
        const screenLogs = recent7.filter((h) => h.screen_time_minutes !== null && h.screen_time_minutes !== undefined)

        const avgSleep = sleepLogs.length > 0 ? Math.round(sleepLogs.reduce((sum, h) => sum + h.sleep_minutes, 0) / sleepLogs.length) : 0
        const avgScreen = screenLogs.length > 0 ? Math.round(screenLogs.reduce((sum, h) => sum + h.screen_time_minutes, 0) / screenLogs.length) : 0

        setAverages({
          avg_sleep_minutes: avgSleep,
          avg_screen_time_minutes: avgScreen,
        })
      }
    } catch (err) {
      console.error('Error fetching daily health summary:', err)
      setError(err.message || 'Failed to load health summary')
    }
  }, [userId, clubId, selectedDate])

  useEffect(() => {
    async function load() {
      setLoading(true)
      await fetchHealthSummary(selectedDate)
      setLoading(false)
    }
    load()
  }, [fetchHealthSummary, selectedDate])

  // 2. Save Sleep Log
  const saveSleep = async ({ totalMinutes, goalMinutes = 480 }) => {
    if (!userId || !clubId) throw new Error('Not authenticated')
    setActionLoading(true)
    setError(null)

    try {
      const payload = {
        user_id: userId,
        club_id: clubId,
        log_date: selectedDate,
        sleep_minutes: Math.max(0, Math.min(1440, parseInt(totalMinutes, 10) || 0)),
        sleep_goal_minutes: Math.max(180, Math.min(960, parseInt(goalMinutes, 10) || 480)),
        updated_at: new Date().toISOString(),
      }

      const { error: upsertErr } = await supabase
        .from('daily_health_logs')
        .upsert(payload, { onConflict: 'user_id,club_id,log_date' })

      if (upsertErr) throw upsertErr

      await fetchHealthSummary(selectedDate)
    } catch (err) {
      console.error('Error saving sleep log:', err)
      setError(err.message || 'Failed to save sleep log')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // 3. Save Screen Time Log with Optional Screenshot
  const saveScreenTime = async ({
    totalMinutes,
    goalMinutes = 240,
    screenshotFile = null,
    isShared = false,
    notes = null,
  }) => {
    if (!userId || !clubId) throw new Error('Not authenticated')
    setActionLoading(true)
    setError(null)

    try {
      let uploadedScreenshotUrl = currentLog.screenshot_url

      // Handle optional screenshot upload - stores exact object path (userId/filename)
      if (screenshotFile) {
        const fileExt = screenshotFile.name.split('.').pop()
        const fileName = `${userId}/${selectedDate}_${Date.now()}.${fileExt}`
        
        const { error: uploadErr } = await supabase.storage
          .from('health_screenshots')
          .upload(fileName, screenshotFile, { upsert: true })

        if (uploadErr) {
          console.warn('Storage upload error:', uploadErr)
        } else {
          uploadedScreenshotUrl = fileName
        }
      }

      const payload = {
        user_id: userId,
        club_id: clubId,
        log_date: selectedDate,
        screen_time_minutes: Math.max(0, Math.min(1440, parseInt(totalMinutes, 10) || 0)),
        screen_time_goal_minutes: Math.max(0, Math.min(1440, parseInt(goalMinutes, 10) || 240)),
        screenshot_url: uploadedScreenshotUrl || null,
        is_screenshot_shared: !!isShared,
        notes: notes?.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { error: upsertErr } = await supabase
        .from('daily_health_logs')
        .upsert(payload, { onConflict: 'user_id,club_id,log_date' })

      if (upsertErr) throw upsertErr

      await fetchHealthSummary(selectedDate)
    } catch (err) {
      console.error('Error saving screen time log:', err)
      setError(err.message || 'Failed to save screen time')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  // 4. Delete Screenshot
  const deleteScreenshot = async () => {
    if (!userId || !clubId) return
    setActionLoading(true)
    try {
      const { error: updErr } = await supabase
        .from('daily_health_logs')
        .update({
          screenshot_url: null,
          is_screenshot_shared: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('club_id', clubId)
        .eq('log_date', selectedDate)

      if (updErr) throw updErr
      await fetchHealthSummary(selectedDate)
    } catch (err) {
      console.error('Error deleting screenshot:', err)
      setError(err.message || 'Failed to delete screenshot')
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  return {
    selectedDate,
    setSelectedDate: (d) => {
      setSelectedDate(d)
      fetchHealthSummary(d)
    },
    currentLog,
    averages,
    history,
    loading,
    actionLoading,
    error,
    saveSleep,
    saveScreenTime,
    deleteScreenshot,
    refetch: () => fetchHealthSummary(selectedDate),
  }
}

