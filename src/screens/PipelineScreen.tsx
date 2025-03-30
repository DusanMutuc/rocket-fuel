import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Modal,
    TouchableOpacity,
    Button,
    TextInput,
    ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Client } from '../types/Client';
import Toast from 'react-native-toast-message';

const PipelineScreen = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Modal visibility states
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Editable fields for pipeline clients
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    // Replace TextInput for temperature with a Picker-based state
    const [editTemperature, setEditTemperature] = useState<string>('lukewarm');
    const [editPipelineNote, setEditPipelineNote] = useState('');

    // Fetch pipeline clients using the new SQL function
    useEffect(() => {
        const fetchPipelineClients = async () => {
            if (!user) {
                setError('User not logged in');
                setLoading(false);
                return;
            }
            const { data, error } = await supabase.rpc('get_clients_by_client_type', {
                uid: user.id,
                client_type_name: 'Pipeline',
            });
            if (error) {
                setError(error.message);
            } else if (data) {
                setClients(data);
            }
            setLoading(false);
        };

        fetchPipelineClients();
    }, [user]);

    // Refresh pipeline clients by calling the RPC function
    const refreshClients = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_clients_by_client_type', {
            uid: user.id,
            client_type_name: 'Pipeline',
        });
        if (!error && data) {
            setClients(data);
        }
        setLoading(false);
    };

    // Map temperature to a background color
    const getBackgroundColor = (temperature: string) => {
        switch (temperature) {
            case 'lukewarm':
                return '#FFFACD'; // light yellow
            case 'warm':
                return '#FFDAB9'; // peach
            case 'hot':
                return '#FFA07A'; // salmon
            default:
                return '#F0F0F0';
        }
    };

    // Render each pipeline client item
    const renderPipelineItem = ({ item }: { item: Client }) => (
        <TouchableOpacity onPress={() => handleEditPress(item)}>
            <View style={[styles.itemContainer, { backgroundColor: getBackgroundColor(item.temperature) }]}>
                <Text style={styles.name}>
                    {item.first_name} {item.last_name || ''}
                </Text>
                <Text style={styles.temperature}>Temperature: {item.temperature}</Text>
                {item.pipeline_note && <Text style={styles.note}>Pipeline Note: {item.pipeline_note}</Text>}
                <Text style={styles.createdAt}>
                    Logged At: {new Date(item.created_at).toLocaleString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    // When a user taps a pipeline client, open the edit modal
    const handleEditPress = (client: Client) => {
        setSelectedClient(client);
        setEditFirstName(client.first_name);
        setEditLastName(client.last_name || '');
        setEditTemperature(client.temperature || 'lukewarm');
        setEditPipelineNote(client.pipeline_note || '');
        setEditModalVisible(true);
    };

    // Update the pipeline client with new info
    const handleUpdateClient = async () => {
        if (!user || !selectedClient) {
            Toast.show({ type: 'error', text1: 'No user or client selected' });
            return;
        }
        if (!editFirstName.trim()) {
            Toast.show({ type: 'error', text1: 'First name is required' });
            return;
        }
        const { error } = await supabase
            .from('clients')
            .update({
                first_name: editFirstName,
                last_name: editLastName || null,
                temperature: editTemperature,
                pipeline_note: editPipelineNote,
            })
            .eq('client_id', selectedClient.client_id);
        if (error) {
            Toast.show({ type: 'error', text1: 'Error updating client', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Client updated successfully' });
            setEditModalVisible(false);
            setSelectedClient(null);
            refreshClients();
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text>Error: {error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Pipeline Contacts</Text>
            <FlatList
                data={clients}
                keyExtractor={(item) => item.client_id}
                renderItem={renderPipelineItem}
                contentContainerStyle={styles.listContent}
            />
            {/* Button to open modal for adding prospects to pipeline */}
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.addButtonText}>Add Prospect to Pipeline</Text>
            </TouchableOpacity>
            {/* Modal for editing pipeline client */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalHeader}>Edit Pipeline Client</Text>
                            <Text style={styles.label}>First Name</Text>
                            <TextInput style={styles.input} value={editFirstName} onChangeText={setEditFirstName} />
                            <Text style={styles.label}>Last Name</Text>
                            <TextInput style={styles.input} value={editLastName} onChangeText={setEditLastName} />
                            <Text style={styles.label}>Temperature</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={editTemperature}
                                    onValueChange={(value) => setEditTemperature(value)}
                                    mode="dialog"
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Lukewarm" value="lukewarm" />
                                    <Picker.Item label="Warm" value="warm" />
                                    <Picker.Item label="Hot" value="hot" />
                                </Picker>
                            </View>
                            <Text style={styles.label}>Pipeline Note</Text>
                            <TextInput style={styles.input} value={editPipelineNote} onChangeText={setEditPipelineNote} />
                            <Button title="Save Changes" onPress={handleUpdateClient} />
                            <Button title="Cancel" onPress={() => setEditModalVisible(false)} color="red" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            {/* Modal for adding a new prospect (unchanged) */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalHeader}>Add Prospect</Text>
                            {/* Fields for adding a prospect remain the same */}
                            <Text style={styles.label}>First Name</Text>
                            <TextInput style={styles.input} placeholder="First Name" />
                            {/* Additional fields would go here */}
                            <Button title="Add Prospect" onPress={() => { }} />
                            <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    listContent: {
        paddingBottom: 16,
    },
    itemContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 6,
        marginBottom: 12,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
    },
    temperature: {
        fontSize: 16,
        marginBottom: 4,
    },
    note: {
        fontSize: 14,
        color: '#555',
    },
    createdAt: {
        fontSize: 12,
        color: '#555',
        marginTop: 4,
    },
    addButton: {
        backgroundColor: 'tomato',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 16,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
        maxHeight: '80%',
    },
    modalHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    label: {
        fontWeight: '600',
        marginVertical: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginBottom: 12,
        borderRadius: 4,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    picker: {
        width: '100%',
        height: 50,
    },
});

export default PipelineScreen;
