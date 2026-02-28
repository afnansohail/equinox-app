import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ContinueAsGuest: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  StockDetail: { symbol: string };
  AddTransaction: {
    symbol?: string;
    currentPrice?: number;
    type?: "BUY" | "SELL";
  };
  TransactionHistory: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Search: { symbol?: string } | undefined;
  Portfolio: undefined;
  Settings: undefined;
};
