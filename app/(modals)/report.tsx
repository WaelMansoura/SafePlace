import { View, Text, TextInput, ActivityIndicator, Alert, Platform, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons'
import useSWR, { mutate } from 'swr'
import RNPickerSelect from 'react-native-picker-select';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { decode } from 'base64-arraybuffer';

import Colors from '@/constants/Colors'
import { defaultStyles } from '@/constants/Styles'
import { supabase } from '@/lib/supabase'
import { useReport } from '@/contexts/report.context';
import { useUserContext } from '@/contexts/user.context'
import Loading from '@/components/Loading'

const formatDate = (d: Date) =>
    d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const Separator = ({ label }: { label: string }) => (
    <View style={styles.seperatorView}>
        <View style={styles.seperatorLine} />
        <Text style={styles.seperator}>{label}</Text>
        <View style={styles.seperatorLine} />
    </View>
);

const report = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { image, date, setDate, type, setType, title, setTitle, description, setDescription, reset } = useReport();
    const { user } = useUserContext()
    const { data: incidentTypes, isLoading, error, mutate: retryTypes } = useSWR('incident_types', async () => {
        const response = await supabase.from('incident_types').select('*');
        if (response.error) throw response.error;
        return response.data;
    })

    // Position actuelle de l'utilisateur
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLocationError("Permission de localisation refusée.");
                    return;
                }
                setLocation(await Location.getCurrentPositionAsync({}));
            } catch {
                setLocationError("Impossible de récupérer votre position.");
            }
        })();
    }, []);

    // Android n'a pas de mode « datetime » : on enchaîne le choix de la date puis de l'heure.
    const openAndroidPicker = () => {
        DateTimePickerAndroid.open({
            value: date,
            mode: 'date',
            maximumDate: new Date(),
            onChange: (event, pickedDate) => {
                if (event.type !== 'set' || !pickedDate) return;
                DateTimePickerAndroid.open({
                    value: pickedDate,
                    mode: 'time',
                    is24Hour: true,
                    onChange: (timeEvent, pickedTime) => {
                        if (timeEvent.type !== 'set' || !pickedTime) return;
                        setDate(pickedTime > new Date() ? new Date() : pickedTime);
                    },
                });
            },
        });
    };

    if (isLoading) {
        return <Loading />
    }

    if (error || !incidentTypes) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
                <Text style={{ fontFamily: 'mon-b', color: Colors.red }}>Erreur de chargement des types d'incident</Text>
                <TouchableOpacity onPress={() => retryTypes()}>
                    <Text style={{ fontFamily: 'mon-sb', color: Colors.grey }}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        )
    }

    const submitReport = async () => {
        if (!user || !image || !location || type === null) return;
        setIsSubmitting(true);
        try {
            // 1. Envoi de l'image dans le bucket Supabase
            const base64 = await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 });
            const filePath = `${user.id}/${Date.now()}.jpg`;
            const uploadedImage = await supabase.storage
                .from('incidents_attachments')
                .upload(filePath, decode(base64), { contentType: 'image/jpeg' });

            if (uploadedImage.error) throw uploadedImage.error;

            const { data: { publicUrl } } = supabase.storage
                .from('incidents_attachments')
                .getPublicUrl(uploadedImage.data.path);

            // 2. Création de l'incident
            const { error: insertError } = await supabase
                .from('incidents')
                .insert({
                    auteur_id: user.id,
                    titre: title.trim(),
                    description: description.trim(),
                    type_id: type,
                    created_at: date.toISOString(),
                    est_verifier: false,
                    attachement: [publicUrl],
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

            if (insertError) throw insertError;

            // 3. Rafraîchit la carte, le fil et l'historique du compte
            await mutate((key) => typeof key === 'string' && key.startsWith('incidents'));
            reset();
            router.back();
            Alert.alert('Merci !', 'Votre incident a bien été signalé.');
        } catch {
            Alert.alert('Erreur', "Le signalement n'a pas pu être envoyé. Vérifiez votre connexion et réessayez.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const formIsFull = !!(image && date && type !== null && title.trim() && description.trim() && location)

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ gap: 15, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
                <Text style={{ fontFamily: 'mon-sb', color: Colors.grey }}>Titre</Text>
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder='Saisissez un titre' style={[defaultStyles.inputField, { height: 44, fontFamily: 'mon-sb' }]} placeholderTextColor={Colors.grey} />

                <Text style={{ fontFamily: 'mon-sb', color: Colors.grey }} >Description</Text>
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    placeholder='Saisissez une description' style={[defaultStyles.inputField, { height: 80, fontFamily: 'mon-sb', textAlignVertical: 'top' }]} placeholderTextColor={Colors.grey} />

                <Separator label="Type et date" />
                <RNPickerSelect
                    style={pickerSelectStyless}
                    value={type}
                    placeholder={{ label: "Spécifiez le type d'incident", value: null }}
                    onValueChange={(value) => setType(value)}
                    items={incidentTypes.map((item) => ({ label: item.nom, value: item.id }))}
                />

                <View style={styles.dh}>
                    <Text style={{ fontFamily: 'mon-sb', color: Colors.grey }}>Date et heure : </Text>
                    {Platform.OS === 'ios' ? (
                        <DateTimePicker
                            value={date}
                            maximumDate={new Date()}
                            onChange={(_event, selected) => selected && setDate(selected)}
                            style={styles.dateTimePicker}
                            mode='datetime' />
                    ) : (
                        <TouchableOpacity onPress={openAndroidPicker} style={styles.dateBtn}>
                            <Text style={{ fontFamily: 'mon-sb', color: Colors.grey }}>{formatDate(date)}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Separator label="Multimédia" />
                <TouchableOpacity
                    style={styles.importBtn}
                    onPress={() => router.push('/(modals)/importPic')}
                >
                    <FontAwesome name="camera" size={21} color="white" />
                    <Text style={{ fontFamily: 'mon-b', color: 'white', fontSize: 14 }}>{image ? '1 élément importé' : 'Importer/Prendre image'}</Text>
                </TouchableOpacity>

                <Separator label="Position" />
                <View style={[styles.importBtn, { backgroundColor: location ? '#12b82b' : locationError ? Colors.red : 'grey' }]}>
                    {location ? (
                        <>
                            <FontAwesome6 name="location-crosshairs" size={21} color="white" />
                            <Text style={{ fontFamily: 'mon-b', color: 'white', fontSize: 14 }}>Position actuelle sélectionnée</Text>
                        </>
                    ) : locationError ? (
                        <Text style={{ fontFamily: 'mon-b', color: 'white', fontSize: 14 }}>{locationError}</Text>
                    ) : (
                        <>
                            <ActivityIndicator color={"white"} size={'small'} />
                            <Text style={{ fontFamily: 'mon-b', color: 'white', fontSize: 14 }}>Sélection de la position ...</Text>
                        </>
                    )}
                </View>
                <Text style={{ fontFamily: 'mon-l', color: 'grey' }}>*La position sélectionnée est votre position actuelle</Text>
            </ScrollView>

            <TouchableOpacity
                disabled={isSubmitting}
                onPress={() => {
                    formIsFull ? submitReport() : Alert.alert(
                        `Incident incomplet`,
                        `Veuillez remplir tous les champs, ajouter une image et autoriser la localisation.`,
                    );
                }}
                style={[styles.reportBtn, { alignSelf: 'center', position: 'absolute', bottom: 40 }]}
            >
                {isSubmitting ? (
                    <>
                        <ActivityIndicator color={'white'} />
                        <Text style={{ fontFamily: 'mon-b', color: 'white', fontSize: 17 }}>Envoi en cours</Text>
                    </>
                ) : (
                    <Text style={{ fontFamily: 'mon-b', color: 'white', fontSize: 17 }}>Signaler et finir</Text>
                )}
            </TouchableOpacity>
        </View>
    )
}

const pickerSelectStyless = StyleSheet.create({
    inputIOS: {
        fontSize: 14,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#ABABAB',
        borderRadius: 10,
        color: Colors.grey,
        paddingRight: 30, // to ensure the text is never behind the icon
        fontFamily: 'mon-sb'

    },
    inputAndroid: {
        fontSize: 14,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#ABABAB',
        borderRadius: 10,
        color: 'grey',
        paddingRight: 30, // to ensure the text is never behind the icon
        fontFamily: 'mon-sb'

    }
});

const styles = StyleSheet.create({
    dateTimePicker: {
        height: 40,
    },
    dateBtn: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#ABABAB',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    dh: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 26,
    },

    reportBtn: {
        backgroundColor: Colors.red,
        borderRadius: 10,
        padding: 13,
        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.17,
        shadowRadius: 3.05,
        elevation: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 50,

    },
    importBtn: {
        backgroundColor: Colors.grey,
        borderRadius: 10,
        padding: 13,
        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.17,
        shadowRadius: 3.05,
        elevation: 4,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,

        flexDirection: 'row',

    },
    image: {
        borderRadius: 10,
        width: 150,
        height: 150,
        borderColor: Colors.grey,
        borderWidth: StyleSheet.hairlineWidth,
        borderStyle: 'dashed'

    }
    , seperatorView: {
        flexDirection: 'row',
        gap: 15,
        alignItems: 'center',
        marginVertical: 5

    },
    seperator: {
        fontFamily: 'mon-b',
        color: Colors.grey,
    },
    seperatorLine: {
        borderBottomColor: '#000',
        borderBottomWidth: StyleSheet.hairlineWidth,
        flex: 1,
    },

})

export default report
