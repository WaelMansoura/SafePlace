import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import React from 'react'
import MapView from "react-native-map-clustering";
import { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import useSWR from 'swr';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { IncidentType } from '@/interfaces/incident.type';
import Colors from '@/constants/Colors';

// Centré sur Oran
const INITIAL_REGION = {
  latitude: 35.69906,
  longitude: -0.63588,
  latitudeDelta: 8.5,
  longitudeDelta: 8.5,
};
const ListingsMap = () => {
  const onMarkerSelected = (item: IncidentType) => {
    router.push(`/listing/${item.id}`)
  };

  const { data, isLoading, error, mutate } = useSWR('incidents/map', async () => {
    const response = await supabase.from('incidents').select('*');
    if (response.error) throw response.error;
    return response.data;
  })

  if (isLoading) {
    return (

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'mon-b', color: Colors.red }}>Impossible de charger les incidents</Text>
        <TouchableOpacity onPress={() => mutate()}>
          <Text style={{ fontFamily: 'mon-sb', color: Colors.grey, marginTop: 10 }}>Réessayer</Text>
        </TouchableOpacity>
      </View>)
  }
  const incidents = data;


  return (
    <View style={{ height: "100%" }}>
      <MapView initialRegion={INITIAL_REGION} style={{ flex: 1 ,}} provider={PROVIDER_DEFAULT}
        showsMyLocationButton={false}
        clusterColor={Colors.red}
        clusterFontFamily	= 'mon-b'
      >

        {incidents.map((item) => {
          return <Marker
            key={`incidents/${item.id}`} onPress={() => onMarkerSelected(item)} coordinate={{ latitude: item.latitude, longitude: item.longitude }}>
            <View style={styles.marker}>
              <Text style={styles.markerStyle}>1</Text>
            </View>
          </Marker>
        })}

      </MapView>
    </View>
  )
}

export default ListingsMap

const styles = StyleSheet.create({
  
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.red,
    padding: 10,
    borderRadius: 12,
    elevation: 5,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {
      width: 1,
      height: 10
    }
  },
  markerStyle: {
    fontSize: 16,
    fontFamily: 'mon-b',
    color:"white"
  }
})