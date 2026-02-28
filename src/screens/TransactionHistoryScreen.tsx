import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '../hooks/usePortfolio';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/shared/EmptyState';
import { colors, theme } from '../constants/theme';

export default function TransactionHistoryScreen() {
  const { data: transactions } = useTransactions();

  return (
    <SafeAreaView style={theme.screen} edges={['top']}>
      <ScrollView
        style={theme.screen}
        contentContainerStyle={[theme.screenPadding, { paddingTop: 16 }]}
      >
        <View style={{ marginBottom: 16 }}>
          <Text style={[theme.title, { fontSize: 24 }]}>
            Transaction history
          </Text>
          <Text style={theme.subtitle}>
            All recorded buys and sells.
          </Text>
        </View>

        {transactions?.map((tx) => {
          const isBuy = tx.transactionType === 'BUY';
          return (
            <Card key={tx.id} style={{ marginBottom: 12 }}>
              <View style={[theme.rowBetween, { marginBottom: 4 }]}>
                <Text style={theme.value}>{tx.stockSymbol}</Text>
                <Text
                  style={[
                    theme.textMuted,
                    { fontWeight: '600' },
                    isBuy ? theme.success : theme.danger,
                  ]}
                >
                  {isBuy ? 'BUY' : 'SELL'}
                </Text>
              </View>
              <View style={[theme.rowBetween, { marginTop: 8 }]}>
                <View>
                  <Text style={theme.label}>Qty</Text>
                  <Text style={theme.valueSmall}>{tx.quantity}</Text>
                </View>
                <View>
                  <Text style={theme.label}>Price (PKR)</Text>
                  <Text style={theme.valueSmall}>
                    {tx.pricePerShare.toFixed(2)}
                  </Text>
                </View>
                <View>
                  <Text style={theme.label}>Total</Text>
                  <Text style={theme.valueSmall}>
                    {tx.totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
              <Text style={[theme.textMuted, { marginTop: 8 }]}>
                {tx.transactionDate}
              </Text>
              {tx.notes ? (
                <Text style={[theme.textMuted, { marginTop: 4 }]}>
                  {tx.notes}
                </Text>
              ) : null}
            </Card>
          );
        })}

        {(!transactions || transactions.length === 0) && (
          <EmptyState message="No transactions recorded yet. Add a buy or sell from Portfolio or Stock detail." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
