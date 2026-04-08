import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

export interface HomeShareMetric {
  id: number;
  label: string;
  loggedAmount: number;
  minimalAmount: number;
  optimalAmount: number;
}

interface HomeShareCardProps {
  firstName?: string | null;
  weekNumber: number;
  metrics: HomeShareMetric[];
  pipelineCount: number;
  pipelineTotalRevenue: number;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const HomeShareCard = ({
  firstName,
  weekNumber,
  metrics,
  pipelineCount,
  pipelineTotalRevenue,
}: HomeShareCardProps) => {
  const generatedAt = dateFormatter.format(new Date());
  const title = firstName ? `${firstName}'s progress snapshot` : 'Progress snapshot';

  return (
    <View style={styles.card} collapsable={false}>
      <LinearGradient colors={['#173764', '#2D5B95']} style={styles.hero}>
        <Text style={styles.brand}>ROCKETFUEL</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Week {weekNumber} home overview</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryLabel}>Pipeline contacts</Text>
            <Text style={styles.summaryValue}>{pipelineCount}</Text>
          </View>
          <View style={styles.summaryTile}>
            <Text style={styles.summaryLabel}>Pipeline revenue</Text>
            <Text style={styles.summaryValue}>{currencyFormatter.format(pipelineTotalRevenue)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Weekly activity</Text>

        {metrics.map(metric => {
          const progress =
            metric.optimalAmount > 0
              ? Math.min(Math.max(metric.loggedAmount / metric.optimalAmount, 0), 1)
              : 0;
          const threshold =
            metric.optimalAmount > 0
              ? Math.min(Math.max(metric.minimalAmount / metric.optimalAmount, 0), 1)
              : 0;

          return (
            <View key={metric.id} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>
                  {metric.loggedAmount} / {metric.optimalAmount}
                </Text>
              </View>

              <View style={styles.track}>
                <View style={[styles.fill, { width: `${progress * 100}%` }]} />
                {metric.optimalAmount !== metric.minimalAmount && (
                  <View style={[styles.threshold, { left: `${threshold * 100}%` }]} />
                )}
              </View>

              <Text style={styles.metricHint}>
                {metric.loggedAmount >= metric.minimalAmount
                  ? 'Minimum target reached'
                  : `Minimum target: ${metric.minimalAmount}`}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Shared from Rocketfuel</Text>
        <Text style={styles.footerDate}>{generatedAt}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 360,
    backgroundColor: '#F4F6FB',
    borderRadius: 28,
    overflow: 'hidden',
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
  },
  brand: {
    color: '#C9D8EE',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
  title: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    color: '#DCE8F8',
    fontSize: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    columnGap: 12,
    marginTop: 24,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  summaryLabel: {
    color: '#D6E3F7',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    color: '#173764',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    flex: 1,
    color: '#173764',
    fontSize: 14,
    fontWeight: '700',
    paddingRight: 8,
  },
  metricValue: {
    color: '#173764',
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    position: 'relative',
    height: 10,
    backgroundColor: '#E4EBF5',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  fill: {
    height: '100%',
    backgroundColor: '#173764',
    borderRadius: 999,
  },
  threshold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 3,
    marginLeft: -1.5,
    backgroundColor: '#E04F5F',
  },
  metricHint: {
    marginTop: 10,
    color: '#56657A',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 4,
  },
  footerText: {
    color: '#56657A',
    fontSize: 12,
    fontWeight: '700',
  },
  footerDate: {
    color: '#7C8A9F',
    fontSize: 12,
  },
});

export default HomeShareCard;
