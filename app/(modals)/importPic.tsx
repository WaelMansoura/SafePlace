import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native'
import React from 'react'
import { FontAwesome, AntDesign } from '@expo/vector-icons'
import * as ImagePicker from "expo-image-picker"
import { router } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { defaultStyles } from '@/constants/Styles';
import Colors from '@/constants/Colors';
import { useReport } from '@/contexts/report.context';

const importPic = () => {
    const { image, setImage } = useReport();

    const takePhoto = async () => {
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Permission refusée", "Autorisez l'accès à l'appareil photo dans les réglages pour prendre une photo.");
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                cameraType: ImagePicker.CameraType.back,
                aspect: [1, 1],
                quality: 0.8,
            })
            if (!result.canceled) {
                setImage(result.assets[0].uri);
            }
        } catch {
            Alert.alert("Erreur", "Erreur lors de la prise de photo");
        }
    }

    const pickFromGallery = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Permission refusée", "Autorisez l'accès à la galerie dans les réglages pour importer une image.");
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            })
            if (!result.canceled) {
                setImage(result.assets[0].uri);
            }
        } catch {
            Alert.alert("Erreur", "Erreur lors de l'import");
        }
    }

    return (
        <View style={[defaultStyles.container, { padding: 24,  }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity style={styles.btn} onPress={takePhoto}>
                    <FontAwesome name="camera" size={24} color="black" />
                    <Text style={{ fontFamily: 'mon-sb', color: 'black', fontSize: 15 }}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={pickFromGallery}>
                    <AntDesign name="picture" size={24} color="black" />
                    <Text style={{ fontFamily: 'mon-sb', color: 'black', fontSize: 15 }}>Galerie</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                onPress={() => setImage(null)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderStyle: 'solid',
                    borderRadius: 10,
                    height: 44,
                    marginVertical: 14,
                }}>
                <Text style={{ fontFamily: 'mon-sb', color: 'black', fontSize: 15 }}>Supprimer</Text>
                <FontAwesome name="trash" size={24} color="black" />
            </TouchableOpacity>
            <View style={[styles.seperatorView]}>
                <View style={{
                    borderBottomColor: '#000',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    flex: 1
                }} />

                <Text style={[styles.seperator]}>Image</Text>
                <View style={{
                    borderBottomColor: '#000',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    flex: 1
                }} /></View>
            {image
                ? <Animated.View entering={FadeIn.delay(100)} exiting={FadeOut.delay(100)} style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 14, }} >
                    <Image source={{ uri: image }} style={{ width: 300, aspectRatio: 1, borderRadius: 10 }} />
                    <Text style={{ fontFamily: 'mon-sb', color: Colors.grey, fontSize: 15, textAlign: 'center' }}>Image importée</Text>
                </Animated.View>
                : <Animated.Text entering={FadeIn.delay(100)} exiting={FadeOut.delay(100)}
                    style={{ fontFamily: 'mon-sb', color: Colors.grey, fontSize: 15, textAlign: 'center' }}>Aucune image importée</Animated.Text>
            }
        
            <TouchableOpacity
            style={[styles.importBtn, {
                position:'absolute',
                    bottom: 24,
                    marginBottom: 10,
                    alignSelf:'center',
                    width:'100%'
                 
                }]}
            onPress={() => { router.back() }}
                
            >
                <FontAwesome name="check" size={24} color="white"  />
                <Text
                    style={{ fontFamily: 'mon-b', color: 'white', fontSize: 14, }}
                >Terminer</Text>
            </TouchableOpacity>
            
        </View>
    )
}

const styles = StyleSheet.create({
    image: {
        borderRadius: 10,
        width: 150,
        height: 150,
        borderColor: Colors.grey,
        borderWidth: StyleSheet.hairlineWidth,
        borderStyle: 'dashed'
    }
    ,

    btn: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 50,
        borderColor: Colors.grey,
        borderWidth: StyleSheet.hairlineWidth,
        borderStyle: 'solid',
        borderRadius: 10,

    },
    seperatorView: {
        flexDirection: 'row',
        gap: 15,
        alignItems: 'center',
        marginVertical: 30

    },
    seperator: {
        fontFamily: 'mon-b',
        color: Colors.grey,

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
})

export default importPic