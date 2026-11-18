import useSWR, { mutate as globalMutate } from 'swr';
import axios from 'axios';
import ToggleSwitch from 'toggle-switch-react-native';

import { ScrollView } from 'react-native';
import { MaterialIcons, Entypo, AntDesign } from '@expo/vector-icons';
import React, { useLayoutEffect, useState } from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { supabase } from '@/lib/supabase';

import Colors from '@/constants/Colors';
import { defaultStyles } from '@/constants/Styles';

import { useUserContext } from '@/contexts/user.context';

import Loading from '@/components/Loading';

const IMG_HEIGHT = 300;

const DetailPage = () => {
    const { id } = useLocalSearchParams()

    const incidentId = parseInt(id as string);

    const { role, isLoggedIn, user } = useUserContext()

    const [address, setAddress] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isVoting, setIsVoting] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    //GeoCoding Inversé
    const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
        const apiKey = process.env.EXPO_PUBLIC_OPENCAGE_API_KEY;
        if (!apiKey) {
            setAddress('');
            return;
        }
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;

        try {
            const response = await axios.get(url);
            if (response.data.results.length > 0) {
                setAddress(response.data.results[0].formatted);
            } else {
                setAddress('Aucune adresse trouvée');
            }
        } catch {
            setAddress('');
        }
    };

    const { data: incident, isLoading, error, mutate } = useSWR(`/incidents/${incidentId}?extend=type_id&extend=auteur_id&extend=votes`, async () => {
        const response = await supabase.from('incidents').select(`
            *,
            type: type_id (*),
            auteur: auteur_id (*),
            votes: incidents_vote!incidents_vote_incident_id_fkey (*)
            `).eq("id", incidentId).single();

        if (response.error) throw response.error;

        await getAddressFromCoordinates(response.data.latitude, response.data.longitude)

        return response.data;
    })

    const Navigation = useNavigation()

    useLayoutEffect(() => {
        Navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity style={styles.roundBtn} onPress={() => Navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={'#000'} />
                </TouchableOpacity>
            ),
        })
    }, [])

    if (isLoading) {
        return (
            <Loading />
        )
    }

    if (error || !incident) {
        return (
            <View style={styles.errorView}>
                <AntDesign name="warning" size={40} color={Colors.red} />
                <Text style={{ color: Colors.red, fontFamily: 'mon-b' }}>Impossible de charger cet incident</Text>
                <TouchableOpacity onPress={() => mutate()}>
                    <Text style={{ color: Colors.grey, fontFamily: 'mon-sb' }}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        )
    }

    const toggleVerif = async (newValue: boolean) => {

        setIsUpdating(true);

        const { error } = await supabase.from('incidents')
            .update({
                est_verifier: newValue
            }).eq("id", incidentId);

        setIsUpdating(false);

        if (error) {
            Alert.alert("Erreur", "Impossible de modifier l'état de vérification.");
            return;
        }

        await mutate({
            ...incident,
            est_verifier: newValue
        }, false);
        // Le fil et le compte affichent aussi l'état de vérification.
        globalMutate((key) => typeof key === 'string' && key.startsWith('incidents'));
    }

    const voteAction = async (value: 1 | -1) => {
        if (!user || isVoting) return;
        setIsVoting(true);
        try {
            const { data: vote, error } = await supabase
                .from('incidents_vote') 
                .insert({
                    auteur_id: user.id,
                    incident_id: incidentId,
                    vote: value,
                }).select("*").single();

            if (error) {
                Alert.alert("Erreur", "Votre vote n'a pas pu être enregistré.");
                return;
            }

            await mutate({
                ...incident,
                votes: [...incident.votes, vote]
            }, false);
            globalMutate((key) => typeof key === 'string' && (key.startsWith('incidents') || key.startsWith('votes')));
        } catch {
            Alert.alert("Erreur", "Votre vote n'a pas pu être enregistré.");
        } finally {
            setIsVoting(false);
        }
    };

    const hasUserVoted = incident.votes.some((vote) => vote.auteur_id === user?.id);
    const imageUri = incident.attachement?.[0];
    const auteur = incident.auteur as { nom?: string | null; prenom?: string | null } | null;

    return (
        <View style={styles.container}>
            <ScrollView>
                <View>
                    {imageUri ? (
                        <>
                            <Image onLoadEnd={() => setIsImageLoaded(true)} style={styles.image} source={{ uri: imageUri }} />
                            {!isImageLoaded && <ActivityIndicator style={styles.activityIndicator} size={'large'} color={Colors.grey} />}
                        </>
                    ) : (
                        <View style={[styles.image, styles.noImage]}>
                            <MaterialIcons name="image-not-supported" size={50} color={Colors.grey} />
                        </View>
                    )}
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{incident.titre}</Text>
                    <Text style={[styles.dateCreation, { color: Colors.grey }]}>
                        {'Le ' + incident.created_at.slice(0, 10) + ' à ' + incident.created_at.slice(11, 16)}
                    </Text>
                    <Text style={[styles.adress, { color: Colors.grey }]}>
                        à {address ? address : '...'}
                    </Text>
                    <View style={styles.divider} />
                    <View style={styles.hostView}>
                        <MaterialIcons style={{}} name="verified" size={40} color={incident.est_verifier ? Colors.blue : Colors.grey} />

                        <View >
                            <Text style={{ fontWeight: '500', fontSize: 16, fontFamily: 'mon-sb' }}>Créé par {auteur?.nom ? `${auteur.nom} ${auteur.prenom ?? ''}` : '...'}
                            </Text>


                            <Text style={{}}>
                                <Text style={{ fontFamily: 'mon' }}>Incident</Text>
                                {incident.est_verifier ? <Text style={{ fontFamily: 'mon' }}> vérifié</Text>
                                    : <Text style={{ fontFamily: 'mon'}}> pas vérifié</Text>
                                }

                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />
                    <Text style={styles.description}>{incident.description ?? ''}</Text>

                </View>
            </ScrollView>

            {isLoggedIn && (
                <Animated.View style={defaultStyles.footer} entering={SlideInDown.delay(1000)}>
                    {(role === "ADMIN" || role === "MODERATEUR") && (

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 5 }}>
                            <Text style={{ fontFamily: 'mon-b', fontSize: 15 }}>Changer l'état de vérification ?</Text>
                            <ToggleSwitch
                                isOn={incident.est_verifier}
                                disabled={isUpdating}
                                onColor={Colors.blue}
                                offColor={Colors.grey}
                                size="medium"
                                onToggle={toggleVerif}
                            />
                        </View>
                    )}

                    {(!hasUserVoted && role === "USER")&& (

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',  }}>
                            <Text style={{ fontFamily: 'mon-b', fontSize: 15 }}>Trouvez-vous cet article utile/fiable ?</Text>
                            <TouchableOpacity style={{ paddingHorizontal: 2 }}
                                disabled={isVoting}
                                onPress={() => voteAction(-1)}
                            >
                                <Entypo name="arrow-with-circle-down" size={40} color={Colors.red} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                disabled={isVoting}
                                onPress={() => voteAction(1)}
                                style={{ paddingHorizontal: 2 }}>
                                <Entypo name="arrow-with-circle-up" size={40} color={Colors.blue} />
                            </TouchableOpacity>
                        </View>

                    )}
                    {(hasUserVoted && (role === 'USER')) && (

                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontFamily: 'mon-b', fontSize: 15 }}>Vous avez déjà voté !</Text>
                        </View>

                    )}

                </Animated.View>
            )}

        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white'
    },
    image: {
        height: IMG_HEIGHT,
        width: "100%"
    },
    infoContainer: {
        padding: 24,
        backgroundColor: '#fff',
    },
    name: {
        fontSize: 26,
        fontWeight: 'bold',
        fontFamily: 'mon-sb',
    },
    dateCreation: {
        fontSize: 18,
        marginTop: 10,
        fontFamily: 'mon-sb',
    },
    adress: {
        fontSize: 14,
        marginTop: 10,
        fontFamily: 'mon',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.grey,
        marginVertical: 16,
    },
    host: {
        width: 50,
        height: 50,
        borderRadius: 50,
        backgroundColor: Colors.grey,
    },
    hostView: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    description: {
        fontSize: 16,
        marginTop: 10,
        fontFamily: 'mon',
        paddingBottom: 100,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    roundBtn: {
        width: 40,
        height: 40,
        borderRadius: 50,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        color: Colors.grey,
    },
    activityIndicator: {
        position: 'absolute',
        alignSelf: 'center',
        top: '50%',
    },
    noImage: {
        backgroundColor: '#eee',
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorView: {
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
});

export default DetailPage