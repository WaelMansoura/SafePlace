import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons, FontAwesome6 } from '@expo/vector-icons'

import Colors from '@/constants/Colors'

const Layout = () => {

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.blue,
      tabBarLabelStyle: {
        fontFamily: 'mon-b'
      }
    }}>
      <Tabs.Screen name='Communauté' options={{
        tabBarIcon: ({ color, size }) => {
          return <FontAwesome6 name="user-group" size={size - 4} color={color} />

        },        headerShown:false

      }} />
      <Tabs.Screen name='index' options={{
        tabBarIcon: ({ color, size }) => {
          return <Ionicons name="map-sharp" size={size} color={color} />
        },
        headerShown: false,
        tabBarLabel:'Carte'
      
      }} />
      <Tabs.Screen name='Aide' options={{
        tabBarIcon: ({ color, size }) => {
          return <Ionicons name="help-buoy-sharp" size={size} color={color} />

        }, headerShown: false

      }} />
    </Tabs>
  )
}

export default Layout