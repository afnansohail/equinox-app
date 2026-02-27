import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../hooks/usePortfolio';
import { Card } from '../components/ui/Card';

export default function TransactionHistoryScreen() {
  const { data: transactions } = useTransactions();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="mb-4">
          <Text className="text-text-primary text-2xl font-bold">
            Transaction history
          </Text>
          <Text className="text-text-secondary text-xs mt-1">
            All recorded buys and sells.
          </Text>
        </View>

        {transactions?.map((tx) => {
          const isBuy = tx.transactionType === 'BUY';
          return (
            <Card key={tx.id} className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-text-primary text-base font-semibold">
                  {tx.stockSymbol}
                </Text>
                <Text
                  className={`text-xs font-semibold ${
                    isBuy ? 'text-success' : 'text-danger'
                  }`}
                >
                  {isBuy ? 'BUY' : 'SELL'}
                </Text>
              </View>
              <View className="flex-row justify-between mt-1">
                <View>
                  <Text className="text-text-secondary text-xs mb-1">Qty</Text>
                  <Text className="text-text-primary text-sm font-semibold">
                    {tx.quantity}
                  </Text>
                </View>
                <View>
                  <Text className="text-text-secondary text-xs mb-1">
                    Price (PKR)
                  </Text>
                  <Text className="text-text-primary text-sm font-semibold">
                    {tx.pricePerShare.toFixed(2)}
                  </Text>
                </View>
                <View>
                  <Text className="text-text-secondary text-xs mb-1">Total</Text>
                  <Text className="text-text-primary text-sm font-semibold">
                    {tx.totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
              <Text className="text-text-muted text-xs mt-2">
                {tx.transactionDate}
              </Text>
              {tx.notes && (
                <Text className="text-text-secondary text-xs mt-1">{tx.notes}</Text>
              )}
            </Card>
          );
        })}

        {(!transactions || transactions.length === 0) && (
          <View className="items-center justify-center py-16">
            <Text className="text-text-muted text-sm">
              No transactions recorded yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

