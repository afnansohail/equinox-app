import React from "react";
import { ActivityIndicator, View, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Search, BriefcaseBusiness, Settings } from "lucide-react-native";
import { useAuthStore } from "../stores/authStore";
import { colors } from "../constants/theme";
import type {
  RootStackParamList,
  MainTabParamList,
  AuthStackParamList,
} from "./types";
import DashboardScreen from "../screens/DashboardScreen";
import SearchScreen from "../screens/SearchScreen";
import PortfolioScreen from "../screens/PortfolioScreen";
import SettingsScreen from "../screens/SettingsScreen";
import StockDetailScreen from "../screens/StockDetailScreen";
import AddTransactionScreen from "../screens/AddTransactionScreen";
import TransactionHistoryScreen from "../screens/TransactionHistoryScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import SignInScreen from "../screens/SignInScreen";
import SignUpScreen from "../screens/SignUpScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  const { signInAnonymously } = useAuthStore();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animationEnabled: false,
      }}
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ContinueAsGuest" component={GuestLoaderScreen} />
    </AuthStack.Navigator>
  );
}

function GuestLoaderScreen() {
  const { signInAnonymously } = useAuthStore();

  React.useEffect(() => {
    signInAnonymously();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: "rgba(12, 12, 12, 0.92)",
          borderTopColor: "rgba(255,255,255,0.08)",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 84 : 70,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 10,
          position: "absolute",
        },
        tabBarActiveTintColor: colors.primary, // #f5f5f5 near-white when selected
        tabBarInactiveTintColor: colors.textMuted, // #555 dimmed when inactive
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_500Medium",
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <BriefcaseBusiness color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading, hasCompletedOnboarding } = useAuthStore();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user || !hasCompletedOnboarding ? (
        <AuthNavigator />
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="StockDetail"
            component={StockDetailScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="AddTransaction"
            component={AddTransactionScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="TransactionHistory"
            component={TransactionHistoryScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
