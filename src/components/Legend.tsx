import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Define the allowed keys for your chart metrics.
export type ChartMetric = 'asks' | 'follow_ups' | 'action_promises' | 'open_houses' | 'handwritten_cards' | 'exercises' |'baseline' | 'gross_revenue';

interface LegendItem {
    key: ChartMetric;
    label: string;
    color: string;
}

interface LegendProps {
    items: LegendItem[];
    onPress: (key: ChartMetric) => void;
    selected: ChartMetric | null;
}

const Legend: React.FC<LegendProps> = ({ items, onPress, selected }) => {
    return (
        <View style={styles.legendContainer}>
            {items.map((item) => (
                <TouchableOpacity
                    key={item.key}
                    style={[
                        styles.legendItem,
                        selected === item.key && styles.selectedItem,
                    ]}
                    onPress={() => onPress(item.key)}
                >
                    <View style={[styles.colorBox, { backgroundColor: item.color }]} />
                    <Text style={styles.label}>{item.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    legendContainer: {
        flexDirection: 'row',    // Arrange items horizontally
        flexWrap: 'wrap',        // Allow wrapping to new rows
        alignItems: 'flex-start',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',            // Each item takes half the width => two columns
        marginBottom: 5,
        padding: 4,
    },
    selectedItem: {
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
    },
    colorBox: {
        width: 14,
        height: 14,
        marginRight: 5,
        borderRadius: 2,
    },
    label: {
        fontSize: 16,
    },
});

export default Legend;
