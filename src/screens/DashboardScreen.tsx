import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { usePortfolio } from '../hooks/usePortfolio';
import { useRefreshStocks } from '../hooks/useStocks';

export default function DashboardScreen() {
  const { data: holdings, refetch } = usePortfolio();
  const refreshMutation = useRefreshStocks();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const symbols = holdings?.map((h) => h.stockSymbol) ?? [];
    if (symbols.length > 0) {
      await refreshMutation.mutateAsync(symbols);
    }
    await refetch();
    setRefreshing(false);
  }, [holdings, refreshMutation, refetch]);

  const totalValue =
    holdings?.reduce((sum, holding) => {
      const currentPrice = holding.stock?.currentPrice ?? 0;
      return sum + currentPrice * holding.quantity;
    }, 0) ?? 0;

  const totalInvested = holdings?.reduce((sum, h) => sum + h.totalInvested, 0) ?? 0;
  const totalGainLoss = totalValue - totalInvested;
  const totalGainLossPercent =
    totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        <View className="py-6">
          <Text className="text-text-primary text-3xl font-bold">Dashboard</Text>
          <Text className="text-text-secondary mt-1">
            Your PSX portfolio at a glance
          </Text>
        </View>

        <Card className="mb-4">
          <Text className="text-text-secondary text-xs mb-2">Portfolio Value</Text>
          <View className="flex-row items-end justify-between">
            <Text className="text-text-primary text-4xl font-bold">
              PKR {totalValue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}
            </Text>
            <Badge value={totalGainLossPercent} />
          </View>
          <Text
            className={`mt-2 text-sm ${
              totalGainLoss >= 0 ? 'text-success' : 'text-danger'
            }`}
          >
            {totalGainLoss >= 0 ? '+' : '-'}PKR{' '}
            {Math.abs(totalGainLoss).toLocaleString('en-PK', {
              maximumFractionDigits: 0,
            })}{' '}
            overall
          </Text>
        </Card>

        <Card className="mb-4 h-48 items-center justify-center">
          <Text className="text-text-secondary text-sm mb-2">
            Performance (chart)
          </Text>
          <Text className="text-text-muted text-xs">
            Chart view will go here (Victory Native)
          </Text>
        </Card>

        {holdings && holdings.length > 0 && (
          <View className="mb-6">
            <Text className="text-text-primary text-xl font-semibold mb-3">
              Top Holdings
            </Text>
            {holdings.slice(0, 5).map((holding) => {
              const currentPrice = holding.stock?.currentPrice ?? 0;
              const currentValue = currentPrice * holding.quantity;
              const gainLoss = currentValue - holding.totalInvested;
              const gainLossPercent =
                holding.totalInvested > 0
                  ? (gainLoss / holding.totalInvested) * 100
                  : 0;

              return (
                <Card key={holding.id} className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-text-primary text-lg font-semibold">
                      {holding.stockSymbol}
                    </Text>
                    <Badge value={holding.stock?.changePercent ?? 0} />
                  </View>
                  <View className="flex-row justify-between mt-1">
                    <View>
                      <Text className="text-text-secondary text-xs">Quantity</Text>
                      <Text className="text-text-primary font-semibold">
                        {holding.quantity}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-text-secondary text-xs">Avg buy</Text>
                      <Text className="text-text-primary font-semibold">
                        PKR {holding.averageBuyPrice.toFixed(2)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-text-secondary text-xs">Value</Text>
                      <Text className="text-text-primary font-semibold">
                        PKR {currentValue.toLocaleString('en-PK')}
                      </Text>
                    </View>
                  </View>
                  <View className="mt-3 pt-2 border-t border-border">
                    <Text
                      className={`text-xs ${
                        gainLoss >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {gainLoss >= 0 ? '+' : '-'}PKR{' '}
                      {Math.abs(gainLoss).toLocaleString('en-PK')} (
                      {gainLossPercent.toFixed(2)}%)
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

