import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VictoryAxis, VictoryChart, VictoryLine } from 'victory-native';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useStock } from '../hooks/useStocks';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'StockDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'StockDetail'>;

const mockHistory = [
  { x: 1, y: 100 },
  { x: 2, y: 104 },
  { x: 3, y: 101 },
  { x: 4, y: 110 },
  { x: 5, y: 108 },
  { x: 6, y: 115 },
];

export default function StockDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { symbol } = route.params;
  const { data: stock } = useStock(symbol);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="mb-4">
          <Text className="text-text-secondary text-xs mb-1">Symbol</Text>
          <Text className="text-text-primary text-3xl font-bold">{symbol}</Text>
          <Text className="text-text-secondary text-sm mt-1">
            {stock?.name ?? 'Loading stock name...'}
          </Text>
        </View>

        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-text-secondary text-xs mb-1">Last price</Text>
              <Text className="text-text-primary text-3xl font-bold">
                {stock ? `PKR ${stock.currentPrice.toFixed(2)}` : '—'}
              </Text>
            </View>
            {stock && <Badge value={stock.changePercent} />}
          </View>
          {stock && (
            <Text className="text-text-secondary text-xs mt-1">
              Prev close: PKR {stock.previousClose.toFixed(2)}
            </Text>
          )}
        </Card>

        <Card className="mb-4 h-64">
          <Text className="text-text-secondary text-xs mb-2">Performance (mock)</Text>
          <VictoryChart
            padding={{ left: 40, right: 12, top: 12, bottom: 24 }}
            domainPadding={{ x: 10, y: 10 }}
          >
            <VictoryAxis
              style={{
                axis: { stroke: '#262626' },
                tickLabels: { fill: '#737373', fontSize: 9 },
                grid: { stroke: 'transparent' },
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: '#262626' },
                tickLabels: { fill: '#737373', fontSize: 9 },
                grid: { stroke: '#262626', strokeDasharray: '2,4' },
              }}
            />
            <VictoryLine
              interpolation="monotoneX"
              data={mockHistory}
              style={{
                data: { stroke: '#3B82F6', strokeWidth: 2 },
              }}
            />
          </VictoryChart>
        </Card>

        <Card className="mb-4">
          <Text className="text-text-primary text-base font-semibold mb-2">
            Key stats
          </Text>
          <View className="flex-row justify-between mb-2">
            <View>
              <Text className="text-text-secondary text-xs mb-1">52W High</Text>
              <Text className="text-text-primary text-sm font-semibold">
                {stock?.high52Week ? `PKR ${stock.high52Week.toFixed(2)}` : '—'}
              </Text>
            </View>
            <View>
              <Text className="text-text-secondary text-xs mb-1">52W Low</Text>
              <Text className="text-text-primary text-sm font-semibold">
                {stock?.low52Week ? `PKR ${stock.low52Week.toFixed(2)}` : '—'}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between mt-1">
            <View>
              <Text className="text-text-secondary text-xs mb-1">Volume</Text>
              <Text className="text-text-primary text-sm font-semibold">
                {stock ? stock.volume.toLocaleString('en-PK') : '—'}
              </Text>
            </View>
            <View>
              <Text className="text-text-secondary text-xs mb-1">Market cap</Text>
              <Text className="text-text-primary text-sm font-semibold">
                {stock?.marketCap
                  ? `PKR ${stock.marketCap.toLocaleString('en-PK')}`
                  : '—'}
              </Text>
            </View>
          </View>
        </Card>

        <View className="mt-4 mb-10">
          <Button
            title="Add transaction"
            onPress={() => navigation.navigate('AddTransaction', { symbol })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

