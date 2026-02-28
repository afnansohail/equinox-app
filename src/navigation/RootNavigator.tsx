import React from "react";
import { ActivityIndicator, View } from "react-native";
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
        animation: "fade",
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
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
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
        <ActivityIndicator size="large" color={colors.primary} />
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
            name="AddTransaction"
            component={AddTransactionScreen}
            options={{
              headerShown: true,
              title: "Add Transaction",
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.textPrimary,
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="TransactionHistory"
            component={TransactionHistoryScreen}
            options={{
              headerShown: true,
              title: "Transaction History",
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.textPrimary,
              headerShadowVisible: false,
            }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
