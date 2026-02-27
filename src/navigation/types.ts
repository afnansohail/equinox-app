import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  StockDetail: { symbol: string };
  AddTransaction: { symbol?: string };
  TransactionHistory: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Portfolio: undefined;
  Markets: undefined;
  Settings: undefined;
};

