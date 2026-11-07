import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { useTranslation } from '../hooks/useTranslation';

// Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CropsListScreen from '../screens/crops/CropsListScreen';
import AddCropScreen from '../screens/crops/AddCropScreen';
import CropDetailsScreen from '../screens/crops/CropDetailsScreen';

import MachineryBrowseScreen from '../screens/machinery/MachineryBrowseScreen';
import MachineDetailsScreen from '../screens/machinery/MachineDetailsScreen';
import BookMachineScreen from '../screens/machinery/BookMachineScreen';
import MyBookingsScreen from '../screens/machinery/MyBookingsScreen';
import MyFleetScreen from '../screens/machinery/MyFleetScreen';
import AddMachineScreen from '../screens/machinery/AddMachineScreen';
import ManageMachineScreen from '../screens/machinery/ManageMachineScreen';
import MachineryCalendarScreen from '../screens/machinery/MachineryCalendarScreen';

import BuyerMarketScreen from '../screens/market/BuyerMarketScreen';
import MandiRatesScreen from '../screens/market/MandiRatesScreen';

import CommunityScreen from '../screens/community/CommunityScreen';
import CreatePostScreen from '../screens/community/CreatePostScreen';
import PostDetailsScreen from '../screens/community/PostDetailsScreen';

import ConversationsScreen from '../screens/chat/ConversationsScreen';
import ChatScreen from '../screens/chat/ChatScreen';

import GroupsListScreen from '../screens/groups/GroupsListScreen';
import GroupDetailsScreen from '../screens/groups/GroupDetailsScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';

import WeatherScreen from '../screens/weather/WeatherScreen';
import SchemesScreen from '../screens/schemes/SchemesScreen';
import GramSathiScreen from '../screens/ai/GramSathiScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const BottomTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="DashboardTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: t('nav.home', 'Home'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CropsTab"
        component={CropsListScreen}
        options={{
          tabBarLabel: t('nav.crops', 'My Crops'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sprout" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MachineryTab"
        component={MachineryBrowseScreen}
        options={{
          tabBarLabel: t('nav.rent', 'Rent Machinery'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="tractor" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CommunityTab"
        component={CommunityScreen}
        options={{
          tabBarLabel: t('nav.community', 'Community'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('nav.profile', 'Profile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Root Tabs */}
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

      {/* Crops */}
      <Stack.Screen name="Crops" component={CropsListScreen} />
      <Stack.Screen name="AddCrop" component={AddCropScreen} />
      <Stack.Screen name="CropDetails" component={CropDetailsScreen} />

      {/* Machinery */}
      <Stack.Screen name="Machinery" component={MachineryBrowseScreen} />
      <Stack.Screen name="MachineDetails" component={MachineDetailsScreen} />
      <Stack.Screen name="BookMachine" component={BookMachineScreen} />
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="MyFleet" component={MyFleetScreen} />
      <Stack.Screen name="AddMachine" component={AddMachineScreen} />
      <Stack.Screen name="ManageMachine" component={ManageMachineScreen} />
      <Stack.Screen name="MachineryCalendar" component={MachineryCalendarScreen} />

      {/* Market */}
      <Stack.Screen name="BuyerMarket" component={BuyerMarketScreen} />
      <Stack.Screen name="MandiRates" component={MandiRatesScreen} />

      {/* Community */}
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} />
      <Stack.Screen name="PostDetails" component={PostDetailsScreen} />

      {/* Real-time Chat */}
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />

      {/* Workgroups */}
      <Stack.Screen name="Groups" component={GroupsListScreen} />
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />

      {/* Weather, Schemes, AI & Notifications */}
      <Stack.Screen name="Weather" component={WeatherScreen} />
      <Stack.Screen name="Schemes" component={SchemesScreen} />
      <Stack.Screen name="GramSathi" component={GramSathiScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
