"use client";
import { useState, useEffect } from "react";
import styles from './OptimizeAnalytics.module.css';
import WeeklySummaryChart from "@/components/TasksPage/weekly-summary";

interface Analytics {
  totalOptimizations: number;
  totalSuggestions: number;
  acceptedSuggestions: number;
  acceptanceRate: number;
  moodTrends: {
    mostCommonMood: string;
    totalMoodLogs: number;
    averageMoodPerDay: number;
    moodDistribution: Record<string, number>;
  };
  productivityPatterns: {
    averageTasksPerDay: number;
    averageOptimizationsPerDay: number;
    totalCompletedTasks: number;
    totalOptimizationSessions: number;
  };
  timeInsights: {
    mostProductiveHour: number;
    mostProductiveDay: string;
    hourDistribution: Record<number, number>;
    dayOfWeekDistribution: Record<string, number>;
  };
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export default function OptimizeAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/optimization/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: Record<string, string> = {
      'Ambitious': '🤑',
      'Content': '😊',
      'Neutral': '😐',
      'Overwhelmed': '😓',
      'Tired': '😴',
      'Unmotivated': '😩'
    };
    return moodEmojis[mood] || '😐';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: '#dc3545',
      medium: '#ffc107',
      low: '#28a745'
    };
    return colors[priority as keyof typeof colors] || '#6c757d';
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  if (loading) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading your optimization insights...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className={styles.analyticsContainer}>
        <div className={styles.errorState}>
          <p>Unable to load analytics. Please try again later.</p>
          <button onClick={fetchAnalytics} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analyticsContainer}>
      <h2 className={styles.analyticsTitle}>📊 Optimization Insights</h2>
      
      {/* Overview Cards */}
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <div className={styles.cardIcon}>🎯</div>
          <div className={styles.cardContent}>
            <h3>{analytics.totalOptimizations}</h3>
            <p>Optimization Sessions</p>
          </div>
        </div>
        
        <div className={styles.overviewCard}>
          <div className={styles.cardIcon}>✅</div>
          <div className={styles.cardContent}>
            <h3>{analytics.acceptanceRate}%</h3>
            <p>Acceptance Rate</p>
          </div>
        </div>
        
        <div className={styles.overviewCard}>
          <div className={styles.cardIcon}>📈</div>
          <div className={styles.cardContent}>
            <h3>{analytics.productivityPatterns.averageTasksPerDay}</h3>
            <p>Avg Tasks/Day</p>
          </div>
        </div>
        
        <div className={styles.overviewCard}>
          <div className={styles.cardIcon}>{getMoodEmoji(analytics.moodTrends.mostCommonMood)}</div>
          <div className={styles.cardContent}>
            <h3>{analytics.moodTrends.mostCommonMood}</h3>
            <p>Most Common Mood</p>
          </div>
        </div>
      </div>

      {/* Detailed Insights */}
      <div className={styles.insightsGrid}>
        {/* Productivity Patterns */}
        <div className={styles.insightCard}>
          <h3>📊 Productivity Patterns</h3>
          <div className={styles.insightContent}>
            <div className={styles.insightItem}>
              <span className={styles.insightLabel}>Total Completed Tasks:</span>
              <span className={styles.insightValue}>{analytics.productivityPatterns.totalCompletedTasks}</span>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.insightLabel}>Avg Optimizations/Day:</span>
              <span className={styles.insightValue}>{analytics.productivityPatterns.averageOptimizationsPerDay}</span>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.insightLabel}>Total Suggestions:</span>
              <span className={styles.insightValue}>{analytics.totalSuggestions}</span>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.insightLabel}>Accepted Suggestions:</span>
              <span className={styles.insightValue}>{analytics.acceptedSuggestions}</span>
            </div>
          </div>
        </div>

        {/* Time Insights */}
        <div className={styles.insightCard}>
          <h3>⏰ Time Insights</h3>
          <div className={styles.insightContent}>
            <div className={styles.insightItem}>
              <span className={styles.insightLabel}>Most Productive Hour:</span>
              <span className={styles.insightValue}>{formatHour(analytics.timeInsights.mostProductiveHour)}</span>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.insightLabel}>Most Productive Day:</span>
              <span className={styles.insightValue}>{analytics.timeInsights.mostProductiveDay}</span>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.insightLabel}>Mood Logs:</span>
              <span className={styles.insightValue}>{analytics.moodTrends.totalMoodLogs}</span>
            </div>
            <div className={styles.insightItem}>
              <span className={styles.insightLabel}>Avg Moods/Day:</span>
              <span className={styles.insightValue}>{analytics.moodTrends.averageMoodPerDay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {analytics.recommendations.length > 0 && (
        <div className={styles.recommendationsSection}>
          <h3>💡 Personalized Recommendations</h3>
          <div className={styles.recommendationsGrid}>
            {analytics.recommendations.map((rec, index) => (
              <div 
                key={index} 
                className={styles.recommendationCard}
                style={{ borderLeftColor: getPriorityColor(rec.priority) }}
              >
                <div className={styles.recommendationHeader}>
                  <h4>{rec.title}</h4>
                  <span 
                    className={styles.priorityBadge}
                    style={{ backgroundColor: getPriorityColor(rec.priority) }}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className={styles.recommendationDescription}>{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood Distribution Chart */}
      <div className={styles.chartSection}>
        <h3>😊 Mood Distribution</h3>
        <div className={styles.moodChart}>
          {Object.entries(analytics.moodTrends.moodDistribution).map(([mood, count]) => (
            <div key={mood} className={styles.moodBar}>
              <div className={styles.moodBarLabel}>
                {getMoodEmoji(mood)} {mood}
              </div>
              <div className={styles.moodBarContainer}>
                <div 
                  className={styles.moodBarFill}
                  style={{ 
                    width: `${(count / Math.max(...Object.values(analytics.moodTrends.moodDistribution))) * 100}%` 
                  }}
                ></div>
              </div>
              <div className={styles.moodBarCount}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Weekly Summary Bar Chart */}
      <div className={styles.chartSection}>
        <WeeklySummaryChart />
      </div>
    </div>
  );
}