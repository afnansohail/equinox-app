import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/ui/Button';
import { useAddTransaction } from '../hooks/usePortfolio';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'AddTransaction'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'AddTransaction'>;

type TxKind = 'BUY' | 'SELL';

export default function AddTransactionScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const mutation = useAddTransaction();

  const [symbol, setSymbol] = useState(route.params?.symbol ?? '');
  const [type, setType] = useState<TxKind>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const onSubmit = async () => {
    const qty = Number(quantity);
    const px = Number(price);
    if (!symbol || !qty || !px) {
      return;
    }

    await mutation.mutateAsync({
      stockSymbol: symbol.toUpperCase(),
      transactionType: type,
      quantity: qty,
      pricePerShare: px,
      totalAmount: qty * px,
      transactionDate: date,
      notes: notes || null,
    } as any);

    navigation.goBack();
  };

  const disabled =
    mutation.isPending || !symbol || !quantity || !price || Number(quantity) <= 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-4 pt-4">
          <View className="mb-4">
            <Text className="text-text-primary text-2xl font-bold mb-1">
              Add transaction
            </Text>
            <Text className="text-text-secondary text-xs">
              Record a buy or sell for your PSX portfolio.
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-text-secondary text-xs mb-1">Symbol</Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-3 py-2 text-text-primary text-sm"
              placeholder="OGDC"
              placeholderTextColor="#737373"
              autoCapitalize="characters"
              value={symbol}
              onChangeText={setSymbol}
            />
          </View>

          <View className="mb-4">
            <Text className="text-text-secondary text-xs mb-1">Type</Text>
            <View className="flex-row gap-3">
              <Button
                title="Buy"
                variant={type === 'BUY' ? 'primary' : 'secondary'}
                className="flex-1"
                onPress={() => setType('BUY')}
              />
              <Button
                title="Sell"
                variant={type === 'SELL' ? 'primary' : 'secondary'}
                className="flex-1"
                onPress={() => setType('SELL')}
              />
            </View>
          </View>

          <View className="mb-4 flex-row gap-3">
            <View className="flex-1">
              <Text className="text-text-secondary text-xs mb-1">Quantity</Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-3 py-2 text-text-primary text-sm"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
            <View className="flex-1">
              <Text className="text-text-secondary text-xs mb-1">
                Price per share (PKR)
              </Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-3 py-2 text-text-primary text-sm"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-text-secondary text-xs mb-1">Date (YYYY-MM-DD)</Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-3 py-2 text-text-primary text-sm"
              value={date}
              onChangeText={setDate}
            />
          </View>

          <View className="mb-6">
            <Text className="text-text-secondary text-xs mb-1">Notes (optional)</Text>
            <TextInput
              className="bg-card border border-border rounded-xl px-3 py-2 text-text-primary text-sm"
              placeholder="Reason, thesis, etc."
              placeholderTextColor="#737373"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <View className="mb-10">
            <Button
              title={mutation.isPending ? 'Saving...' : 'Save transaction'}
              onPress={onSubmit}
              disabled={disabled}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

