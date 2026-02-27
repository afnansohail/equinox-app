import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search } from 'lucide-react-native';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAllStocks, useStockSearch } from '../hooks/useStocks';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MarketsScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const { data: allStocks } = useAllStocks();
  const { data: searchedStocks } = useStockSearch(query.trim());

  const stocks = query.trim() ? searchedStocks ?? [] : allStocks ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-6 pb-2">
        <Text className="text-text-primary text-3xl font-bold mb-4">Markets</Text>
        <View className="bg-card border border-border rounded-xl px-3 py-2 flex-row items-center">
          <Search color="#737373" size={18} />
          <TextInput
            className="flex-1 ml-2 text-text-primary text-sm"
            placeholder="Search stocks by symbol or name"
            placeholderTextColor="#737373"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-4">
        {stocks.map((stock) => (
          <TouchableOpacity
            key={stock.symbol}
            onPress={() => navigation.navigate('StockDetail', { symbol: stock.symbol })}
          >
            <Card className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-text-primary text-lg font-semibold">
                    {stock.symbol}
                  </Text>
                  <Text
                    className="text-text-secondary text-xs"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {stock.name}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-text-primary text-base font-semibold">
                    PKR {stock.currentPrice.toFixed(2)}
                  </Text>
                  <Badge value={stock.changePercent} />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {stocks.length === 0 && (
          <View className="items-center justify-center py-16">
            <Text className="text-text-muted text-sm">
              No stocks found. Try a different search.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

