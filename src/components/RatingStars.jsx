import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/sizes';
export default function RatingStars({ value, size = 14, showValue = true }) {
    const full = Math.floor(value);
    const half = value - full >= 0.5;
    return (<View style={styles.row}>
      {Array.from({ length: 5 }).map((_, i) => {
            if (i < full)
                return <Ionicons key={i} name="star" size={size} color={colors.rating}/>;
            if (i === full && half)
                return <Ionicons key={i} name="star-half" size={size} color={colors.rating}/>;
            return <Ionicons key={i} name="star-outline" size={size} color={colors.rating}/>;
        })}
      {showValue && <Text style={[typography.small, { color: colors.textMuted, marginLeft: 4 }]}>{value.toFixed(1)}</Text>}
    </View>);
}
const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
});
