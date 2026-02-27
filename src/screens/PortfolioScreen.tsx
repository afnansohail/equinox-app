import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { usePortfolio } from '../hooks/usePortfolio';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PortfolioScreen() {
  const navigation = useNavigation<Nav>();
  const { data: holdings } = usePortfolio();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4">
        <View className="py-6 flex-row items-center justify-between">
          <Text className="text-text-primary text-3xl font-bold">Portfolio</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddTransaction', {})}
            className="bg-primary rounded-full w-11 h-11 items-center justify-center"
          >
            <Plus color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>

        <Card className="mb-4 h-44 items-center justify-center">
          <Text className="text-text-secondary text-sm mb-2">
            Allocation by stock (chart)
          </Text>
          <Text className="text-text-muted text-xs">
            Pie / donut chart will go here
          </Text>
        </Card>

        <View className="mb-6">
          <Text className="text-text-primary text-xl font-semibold mb-3">
            Holdings
          </Text>
          {holdings?.map((holding) => {
            const currentPrice = holding.stock?.currentPrice ?? 0;
            const currentValue = currentPrice * holding.quantity;
            const gainLoss = currentValue - holding.totalInvested;
            const gainLossPercent =
              holding.totalInvested > 0
                ? (gainLoss / holding.totalInvested) * 100
                : 0;

            return (
              <TouchableOpacity
                key={holding.id}
                onPress={() =>
                  navigation.navigate('StockDetail', { symbol: holding.stockSymbol })
                }
              >
                <Card className="mb-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-1">
                      <Text className="text-text-primary text-lg font-semibold">
                        {holding.stockSymbol}
                      </Text>
                      <Text className="text-text-secondary text-xs">
                        {holding.stock?.name}
                      </Text>
                    </View>
                    <Badge value={holding.stock?.changePercent ?? 0} />
                  </View>
                  <View className="flex-row justify-between mt-2">
                    <View>
                      <Text className="text-text-secondary text-xs">Qty</Text>
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
              </TouchableOpacity>
            );
          })}

          {(!holdings || holdings.length === 0) && (
            <View className="items-center justify-center py-12">
              <Text className="text-text-muted text-center mb-4">
                No holdings yet.{'\n'}Add your first transaction to get started.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

