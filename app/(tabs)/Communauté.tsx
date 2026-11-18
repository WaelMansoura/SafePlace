import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import useSWR from 'swr';
import { Link } from 'expo-router';
import { AntDesign, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

import { supabase } from '@/lib/supabase';
import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import Loading from '@/components/Loading';

const fetchFeed = async () => {
  // Les votes sont récupérés dans la même requête pour éviter une requête par incident.
  const response = await supabase
    .from('incidents')
    .select(
      `
      *,
      type: type_id (*),
      votes: incidents_vote!incidents_vote_incident_id_fkey (vote)
      `
    )
    .order('created_at', { ascending: false });
  if (response.error) throw response.error;
  return response.data;
};

type FeedItem = Awaited<ReturnType<typeof fetchFeed>>[number];

const truncate = (text: string, max: number) => (text.length > max ? text.slice(0, max) + '...' : text);

const IncidentImage = ({ uri }: { uri?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!uri) {
    return (
      <View style={[styles.image, styles.noImage]}>
        <MaterialIcons name="image-not-supported" size={50} color={Colors.grey} />
      </View>
    );
  }

  return (
    <View>
      <Image onLoadEnd={() => setIsLoaded(true)} style={styles.image} source={{ uri }} />
      {!isLoaded && <ActivityIndicator style={styles.activityIndicator} size={'large'} color={Colors.grey} />}
    </View>
  );
};

const renderRow: ListRenderItem<FeedItem> = ({ item }) => {
  const upVotes = item.votes.filter((v) => v.vote === 1).length;
  const description = item.description ?? '';
  // La jointure type_id est un objet unique (clé étrangère), mal typée par le client Supabase.
  const typeNom = (item.type as unknown as { nom: string } | null)?.nom;

  return (
    <Link href={`/listing/${item.id}`} asChild>
      <TouchableOpacity>
        <View style={styles.listing}>
          <IncidentImage uri={item.attachement?.[0]} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'mon-sb', fontSize: 17, flexShrink: 1 }}>{truncate(item.titre, 36)}</Text>

            <View style={{ flexDirection: 'row', gap: 5 }}>
              <FontAwesome5 name="arrow-alt-circle-up" size={20} color={'#000'} />
              <Text style={{ fontFamily: 'mon-sb' }}>{upVotes}</Text>
            </View>
          </View>

          {description.length > 0 && (
            <Text style={{ fontFamily: 'mon' }}>
              {description.length > 60 ? (
                <>
                  {description.slice(0, 60)}
                  <Text style={{ color: Colors.grey, fontFamily: 'mon-b' }}> ... Lire la suite</Text>
                </>
              ) : (
                description
              )}
            </Text>
          )}

          {typeNom && <Text style={{ fontFamily: 'mon-b', color: Colors.red }}>{typeNom}</Text>}
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const Page = () => {
  const { data, isValidating, isLoading, error, mutate } = useSWR('incidents/feed', fetchFeed);

  if (isLoading) {
    return <Loading />;
  }

  if (error || !data) {
    return (
      <View style={styles.errorView}>
        <AntDesign name="warning" size={40} color={Colors.red} />
        <Text style={{ color: Colors.red, fontFamily: 'mon-b' }}>Erreur de chargement</Text>
        <TouchableOpacity onPress={() => mutate()}>
          <Text style={{ color: Colors.grey, fontFamily: 'mon-sb' }}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={defaultStyles.container}>
      <FlatList
        refreshControl={<RefreshControl refreshing={isValidating} onRefresh={() => mutate()} />}
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRow}
        ListEmptyComponent={
          <Text style={{ fontFamily: 'mon-sb', color: Colors.grey, textAlign: 'center', marginTop: 40 }}>
            Aucun incident signalé pour le moment
          </Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listing: {
    padding: 16,
    gap: 10,
    marginVertical: 15,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  noImage: {
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIndicator: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
  },
  errorView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
});

export default Page;
