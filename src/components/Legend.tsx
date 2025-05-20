// components/Legend.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';

// Scaling helper (same as in your other screens)
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

// Define the allowed keys for your chart metrics.
export type ChartMetric =
    | 'asks'
    | 'follow_ups'
    | 'action_promises'
    | 'open_houses'
    | 'handwritten_cards'
    | 'exercises'
    | 'baseline'
    | 'gross_revenue';

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
                    <View
                        style={[
                            styles.colorBox,
                            { backgroundColor: item.color },
                        ]}
                    />
                    <Text style={styles.label}>{item.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',            // two columns
        marginBottom: scale(5),
        padding: scale(4),
    },
    selectedItem: {
        backgroundColor: '#e0e0e0',
        borderRadius: scale(4),
    },
    colorBox: {
        width: scale(14),
        height: scale(14),
        marginRight: scale(5),
        borderRadius: scale(2),
    },
    label: {
        fontSize: scale(15),
    },
});

export default Legend;
