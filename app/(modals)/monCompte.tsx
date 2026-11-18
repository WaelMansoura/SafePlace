import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useUserContext } from '@/contexts/user.context'
import { defaultStyles } from '@/constants/Styles'
import Colors from '@/constants/Colors'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { Entypo, Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import Loading from '@/components/Loading'
import useSWR from 'swr'

const monCompte = () => {
    const { profile, isLoggedIn, role, user, logout } = useUserContext()

    // Clé SWR propre à l'utilisateur ; null = pas de requête tant qu'on n'est pas connecté.
    const userId = isLoggedIn ? user?.id : undefined;

    const { data: incidents, isLoading, error, mutate } = useSWR(userId ? `incidents/user/${userId}` : null, async () => {
        const response = await supabase.from('incidents')
            .select('*')
            .eq('auteur_id', userId!).order('created_at', { ascending: false });
        if (response.error) throw response.error;
        return response.data;
    })

    const { data: votes, isLoading: isLoadingVote, error: errorVote, mutate: mutateVotes } = useSWR(userId ? `votes/user/${userId}` : null, async () => {
        const response = await supabase.from('incidents_vote')
            .select('*')
            .eq('auteur_id', userId!).order('voted_at', { ascending: false });
        if (response.error) throw response.error;
        return response.data;
    })

    if (isLoading || isLoadingVote) {
        return (
            <Loading />
        )
    }

    if (isLoggedIn && (error || errorVote)) {
        return (
            <View style={[defaultStyles.container, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
                <Text style={{ fontFamily: 'mon-b', color: Colors.red }}>Impossible de charger votre historique</Text>
                <TouchableOpacity onPress={() => { mutate(); mutateVotes(); }}>
                    <Text style={{ fontFamily: 'mon-sb', color: Colors.grey }}>Réessayer</Text>
                </TouchableOpacity>
            </View>
        )
    }

    const prenom = profile?.prenom ?? '';
    const displayName = [profile?.nom?.toUpperCase(), prenom ? prenom[0].toUpperCase() + prenom.slice(1) : ''].filter(Boolean).join(' ');
    return (
        <SafeAreaView style={[defaultStyles.container, { paddingHorizontal: 18, justifyContent: 'space-between' }]}>
            {isLoggedIn
                ? <>
                    <View style={styles.card}>
                        <MaterialIcons name="account-circle" size={40} color={Colors.grey} />
                        <Text style={styles.header}>{displayName}</Text>
                        <Text style={{ color: Colors.grey, fontFamily: 'mon' }}>{`Vous êtes : ` + role}</Text>
                    </View>
                    <View style={[styles.seperatorView]}>
                        <View style={{
                            borderBottomColor: '#000',
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            flex: 1
                        }} />

                        <Text style={[styles.seperator]}>Historique d'activité</Text>
                        <View style={{
                            borderBottomColor: '#000',
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            flex: 1
                        }} /></View>
                    <ScrollView style={{
                        flexDirection: 'column', gap: 20,
                        borderRadius: 8,
                        borderColor: Colors.grey,
                        borderWidth: StyleSheet.hairlineWidth,
                        padding: 15,
                        marginBottom: 14,
                        backgroundColor: 'white',

                    }}>
                        {incidents?.map((item) => {
                            return (

                                <TouchableOpacity
                                    onPress={() => router.push(`/listing/${item.id}`)}
                                    key={`incident-${item.id}`}
                                    style={[styles.historiqueElement, {
                                        marginBottom: 10,

                                    }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialIcons style={{}} name="verified" size={30} color={item.est_verifier ? Colors.blue : Colors.grey} />
                                        <View style={{ paddingHorizontal: 15 }}>
                                            <Text style={{ color: Colors.grey, fontFamily: 'mon-sb' }}>{
                                                item.titre.length > 25
                                                    ? item.titre.slice(0, 25) + " ..."
                                                    : item.titre
                                            }</Text>
                                            <Text style={{ color: Colors.grey, fontFamily: 'mon' }}>{item.created_at.slice(0, 10) + ' à ' + item.created_at.slice(11, 16)}</Text>
                                        </View>
                                    </View>

                                    <Feather style={{}} name="arrow-right" size={20} color={Colors.grey} />


                                </TouchableOpacity>
                            )
                        })}
                        {votes?.map((item) => {
                            return (

                                <TouchableOpacity
                                    onPress={() => router.push(`/listing/${item.incident_id}`)}
                                    key={`vote-${item.incident_id}`}
                                    style={[styles.historiqueElement, {
                                        marginBottom: 10,

                                    }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialIcons name="how-to-vote" size={30} color={Colors.grey} />
                                        <View style={{ paddingHorizontal: 15 }}>
                                            <Text style={{ color: Colors.grey, fontFamily: 'mon-sb' }}>{
                                                'Vous avez voté pour un article'
                                            }</Text>
                                            <Text style={{ color: Colors.grey, fontFamily: 'mon' }}>{'Le ' + item.voted_at.slice(0, 10) + ' à ' + item.voted_at.slice(11, 16)}</Text>
                                        </View>
                                    </View>

                                    <Feather style={{}} name="arrow-right" size={20} color={Colors.grey} />


                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>

                </>
                :
                <View style={styles.card}>
                    <MaterialIcons name="no-accounts" size={40} color={Colors.grey} />
                    <Text style={[{ color: Colors.grey, fontFamily: 'mon', }]}>Vous n'êtes pas connecté</Text>
                </View>
            }

            {isLoggedIn
                ? <TouchableOpacity
                    onPress={async () => { await logout(); router.back() }}
                    style={[defaultStyles.btn, { backgroundColor: Colors.red }]} ><Text style={[defaultStyles.btnText]}>Se déconnecter</Text></TouchableOpacity>
                :
                <SafeAreaView style={{ gap: 15 }}>
                    <TouchableOpacity
                        onPress={() => { router.push('./login') }}
                        style={[defaultStyles.btn, { flexDirection: 'row', gap: 14 }]}>
                        <Text style={[defaultStyles.btnText]}>Se connecter</Text>
                        <Entypo name="login" size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => { router.push('./signIn') }}
                        style={[defaultStyles.btn, { flexDirection: 'row', gap: 14 }]}>
                        <Text style={[defaultStyles.btnText]}>S'inscrire</Text>
                        <MaterialCommunityIcons name="account-edit" size={30} color="white" />
                    </TouchableOpacity>

                </SafeAreaView>
            }

        </SafeAreaView>
    )
}

export default monCompte

const styles = StyleSheet.create({
    historiqueElement: {
        flexDirection: 'row',
        padding: 14,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
        borderRadius: 8,
        backgroundColor: '#eee',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    header: {
        fontFamily: 'mon-sb',
        fontSize: 18,
        color: Colors.grey

    },
    container: {
        flex: 1,
        padding: 14,



    },
    card: {
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15, gap: 14,
        backgroundColor: 'white',
        borderColor: Colors.grey,
        borderWidth: StyleSheet.hairlineWidth,
        width: '100%'
    }, seperatorView: {
        flexDirection: 'row',
        gap: 15,
        alignItems: 'center',
        marginVertical: 20

    }, seperator: {
        fontFamily: 'mon-b',
        color: Colors.grey,

    },

})