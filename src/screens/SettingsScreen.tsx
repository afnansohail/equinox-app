import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4">
        <View className="py-6">
          <Text className="text-text-primary text-3xl font-bold">Settings</Text>
          <Text className="text-text-secondary mt-1 text-sm">
            Configure Equinox and manage your session.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-text-secondary text-xs mb-1">Signed in as</Text>
          <Text className="text-text-primary text-sm font-semibold mb-1">
            Anonymous user
          </Text>
          <Text className="text-text-muted text-xs">
            User ID: {user?.id ?? 'N/A'}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-text-primary text-base font-semibold mb-2">
            Data refresh
          </Text>
          <Text className="text-text-secondary text-xs mb-3">
            Prices are refreshed automatically by the backend every 30 minutes
            during trading hours. You can also pull to refresh from Dashboard.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-text-primary text-base font-semibold mb-2">
            About
          </Text>
          <Text className="text-text-secondary text-xs leading-5">
            Equinox is a personal PSX portfolio tracker built with Expo, Supabase,
            and serverless scrapers. All data stays tied to your anonymous
            Supabase user.
          </Text>
        </View>

        <View className="mt-8">
          <Button
            title="Sign out"
            variant="secondary"
            onPress={() => {
              void signOut();
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

