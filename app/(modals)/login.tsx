import React, { useState } from 'react'
import { Alert, StyleSheet, View, ActivityIndicator, Text, TextInput, TouchableOpacity } from 'react-native'
import Colors from '@/constants/Colors'
import { defaultStyles } from '@/constants/Styles'
import { useUserContext } from '@/contexts/user.context'
import { router } from 'expo-router'

export default function Auth() {
  const { login } = useUserContext();

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    if (loading) return;
    if (!email.trim() || !password) {
      Alert.alert("Champs manquants", "Saisissez votre e-mail et votre mot de passe.");
      return;
    }
    try {
      setLoading(true);
      const { profile } = await login({
        email: email.trim(),
        password: password,
      })
      router.back();
      const fullName = [profile.nom?.toUpperCase(), profile.prenom].filter(Boolean).join(' ');
      Alert.alert(fullName ? `Bienvenue ${fullName}` : 'Bienvenue')
    } catch {
      Alert.alert("Erreur de connexion", "E-mail ou mot de passe incorrect.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={{ fontFamily: 'mon-b', color: Colors.grey }}>Adresse Mail</Text>

      <TextInput keyboardType='email-address' textContentType='emailAddress' placeholder='E-mail' value={email} onChangeText={(text) => setEmail(text)} placeholderTextColor={Colors.grey} autoCapitalize='none' style={[defaultStyles.inputField, { marginBottom: 30, fontFamily: 'mon' }]} />
      <Text style={{ fontFamily: 'mon-b', color: Colors.grey }}>Mot de passe</Text>

      <TextInput placeholder='Password' secureTextEntry={true} onChangeText={(text) => setPassword(text)} value={password} placeholderTextColor={Colors.grey} autoCapitalize='none' style={[defaultStyles.inputField, { marginBottom: 30, fontFamily: 'mon' }]} />
      <TouchableOpacity style={[defaultStyles.btn, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 }]}
        disabled={loading}
        onPress={() => { signInWithEmail(); }}>
        {
          loading
            ?
            <>
              <ActivityIndicator color={"white"} />
              <Text style={[defaultStyles.btnText]}>Chargement ...</Text>
            </>
            : <Text style={[defaultStyles.btnText]}>Continuer</Text>
        }

      </TouchableOpacity>
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
        }} /></View>
      {/* <View style={{ gap: 20 }}>
        <TouchableOpacity style={[styles.btnOutline]} >
          <Ionicons name='logo-google' style={[defaultStyles.btnIcon]} size={24}></Ionicons>

          <Text style={[styles.btnOutlineText]}>Continuer avec Google</Text></TouchableOpacity>

        <TouchableOpacity style={[styles.btnOutline]} >
          <Ionicons name='logo-apple' style={[defaultStyles.btnIcon]} size={24}></Ionicons>
          <Text style={[styles.btnOutlineText]}>Continuer avec Apple</Text></TouchableOpacity>
      </View> */}
    </View>

  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    gap: 14,
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
  }
})