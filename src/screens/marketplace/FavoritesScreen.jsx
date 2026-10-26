import React from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, ServiceCard, EmptyState, Button } from '@/components';
import { useFavoritesStore } from '@/store/favoritesStore';
import { mockServices } from '@/services/mockData';
import { Routes } from '@/constants/routes';
import { spacing } from '@/constants/sizes';
export default function FavoritesScreen() {
    const nav = useNavigation();
    const favs = useFavoritesStore((s) => s.favorites);
    const items = mockServices.filter((s) => favs[s.id]);
    return (<Screen>
      <ScreenHeader title="Favorites" showBack/>
      <FlatList data={items} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }} ListEmptyComponent={<EmptyState icon="heart-outline" title="No favorites yet" body="Tap the heart on any service to save it for later." action={<Button title="Browse marketplace" onPress={() => nav.navigate(Routes.Categories)}/>}/>} renderItem={({ item }) => <ServiceCard service={item} onPress={() => nav.navigate(Routes.ServiceDetail, { id: item.id })}/>}/>
    </Screen>);
}
