import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import Colors from '@/constants/Colors'
import { defaultStyles } from '@/constants/Styles'
import { useUserContext } from '@/contexts/user.context'
import { router } from 'expo-router'


const signIn = () => {
    const {signup}  = useUserContext()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false);
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const MIN_PASSWORD_LENGTH = 7;
    const formIsFull = !!(email.trim() && password.length >= MIN_PASSWORD_LENGTH && nom.trim() && prenom.trim())
    const signupClick = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await signup({ email: email.trim(), password, nom: nom.trim(), prenom: prenom.trim() });
            router.back()
        } catch (error: any) {
            Alert.alert("Inscription impossible", error?.message ?? "Une erreur est survenue, réessayez.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <View style={[defaultStyles.container, { padding: 26 }]}>
            <View style={{ gap: 13 }}>
                <Text style={{ fontFamily: 'mon-b', color: Colors.grey }}>Nom</Text>
                <TextInput
                    onChangeText={(text) => setNom(text)}
                    placeholder='Saisissez votre nom de famille' style={[defaultStyles.inputField, { height: 44, fontFamily: 'mon' }]} placeholderTextColor={Colors.grey} />

                <Text style={{ fontFamily: 'mon-b', color: Colors.grey }} >Prénom</Text>
                <TextInput
                    onChangeText={(text) => setPrenom(text)}
                    placeholder='Saisissez votre prénom' style={[defaultStyles.inputField, { height: 44, fontFamily: 'mon' }]} placeholderTextColor={Colors.grey} />

                <Text style={{ fontFamily: 'mon-b', color: Colors.grey }} >Adresse Mail</Text>
                <TextInput
                keyboardType='email-address' textContentType='emailAddress' autoCapitalize='none'
                    onChangeText={(text) => setEmail(text)}
                    placeholder='E-mail' style={[defaultStyles.inputField, { height: 44, fontFamily: 'mon', }]} placeholderTextColor={Colors.grey} />

                <Text style={{ fontFamily: 'mon-b', color: Colors.grey }} >Mot de passe</Text>
                <TextInput
                    secureTextEntry={true}
                    onChangeText={setPassword}
                    placeholder='Saisissez 7 caractères au min.' style={[defaultStyles.inputField, { height: 44, fontFamily: 'mon', }]} textContentType='password' placeholderTextColor={Colors.grey} />
                <TouchableOpacity
                    style={
                        loading
                        ? [defaultStyles.btn,{backgroundColor : Colors.grey}, { flexDirection: 'row', gap: 14, alignItems: 'center', marginVertical: 10, justifyContent: 'center' }]
                        : [defaultStyles.btn, { flexDirection: 'row', gap: 14, alignItems: 'center', marginVertical: 10, justifyContent: 'center' }]
                    
                    }
                        
                        
                        
                    disabled={loading}
                    onPress={() => {
                        formIsFull ? 
                        signupClick() 
                        :Alert.alert(
                            `Formulaire incomplet`,
                            `Veuillez remplir tous les champs \n (Mot de passe min. 7 caractères)`,
                        );
                    }}>
                    <Text style={[defaultStyles.btnText]}>{loading?'Chargement ...': 'Continuer'}</Text>
                    {
                        loading
                        ?<ActivityIndicator color={'white'}/>
                        : null
                    }</TouchableOpacity>

            </View>
            <View style={[styles.seperatorView]}>
                <View style={{
                    borderBottomColor: '#000',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    flex: 1
                }} />

                <Text style={[styles.seperator]}>Prochainement avec Google et Apple</Text>
                <View style={{
                    borderBottomColor: '#000',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    flex: 1
                }}/></View>

            {/* <View style={{ gap: 20 }}>
                <TouchableOpacity style={[styles.btnOutline]} >
                    <Ionicons name='logo-google' style={[defaultStyles.btnIcon]} size={24}></Ionicons>

                    <Text style={[styles.btnOutlineText]}>S'inscrire avec Google</Text></TouchableOpacity>

                <TouchableOpacity style={[styles.btnOutline]} >
                    <Ionicons name='logo-apple' style={[defaultStyles.btnIcon]} size={24}></Ionicons>
                    <Text style={[styles.btnOutlineText]}>S'inscrire avec Apple</Text></TouchableOpacity>
            </View> */}
        </View>
    )
}

export default signIn

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 26,
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
    btnOutline: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: Colors.grey,
        height: 50,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: 10,
    },
    btnOutlineText: {
        color: "black",
        fontSize: 16,
        fontFamily: 'mon-b'
    },

})