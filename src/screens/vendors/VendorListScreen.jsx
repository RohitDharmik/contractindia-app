import React from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, ScreenHeader, VendorCard, EmptyState } from '@/components';
import { mockCompanies } from '@/services/mockData';
import { Routes } from '@/constants/routes';
import { spacing } from '@/constants/sizes';
export default function VendorListScreen() {
    const nav = useNavigation();
    return (<Screen>
      <ScreenHeader title="Vendors" subtitle={`${mockCompanies.length} verified providers`} showBack/>
      <FlatList data={mockCompanies} keyExtractor={(i) => i.id} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl }} ListEmptyComponent={<EmptyState title="No vendors"/>} renderItem={({ item }) => (<VendorCard company={item} onPress={() => nav.navigate(Routes.CompanyProfile, { id: item.id })}/>)}/>
    </Screen>);
}
