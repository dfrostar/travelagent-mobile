import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { SearchScreen } from '@/screens/SearchScreen'
import { TripDetailsScreen } from '@/screens/TripDetailsScreen'
import { BookingsScreen } from '@/screens/BookingsScreen'
import { FlightBookingScreen } from '@/screens/FlightBookingScreen'
import { PassengerDetailsScreen } from '@/screens/PassengerDetailsScreen'
import { BookingConfirmationScreen } from '@/screens/BookingConfirmationScreen'
import { colors, typography } from '@/theme'

export type RootStackParamList = {
  MainTabs: undefined
  TripDetails: {
    trip: {
      id: string
      destination: string
      dates: {
        start: string
        end: string
      }
      estimatedCost: number
      activities: string[]
    }
  }
  FlightBooking: undefined
  PassengerDetails: {
    flight: Flight
  }
  BookingConfirmation: {
    booking: BookingConfirmation
  }
}

export type MainTabParamList = {
  Search: undefined
  Bookings: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline'
          } else {
            iconName = focused ? 'bookmark' : 'bookmark-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.background,
        headerTitleStyle: {
          ...typography.h2,
        },
      })}
    >
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Travel Search',
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          title: 'My Bookings',
        }}
      />
    </Tab.Navigator>
  )
}

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.background,
          headerTitleStyle: {
            ...typography.h2,
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TripDetails"
          component={TripDetailsScreen}
          options={{
            title: 'Trip Details',
          }}
        />
        <Stack.Screen
          name="FlightBooking"
          component={FlightBookingScreen}
          options={{
            title: 'Book Flight',
          }}
        />
        <Stack.Screen
          name="PassengerDetails"
          component={PassengerDetailsScreen}
          options={{
            title: 'Passenger Information',
          }}
        />
        <Stack.Screen
          name="BookingConfirmation"
          component={BookingConfirmationScreen}
          options={{
            title: 'Booking Confirmation',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
