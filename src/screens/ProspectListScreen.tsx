// src/screens/ProspectListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Modal,
    TextInput,
    Button,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Client } from '../types/Client';
import Toast from 'react-native-toast-message';

const ProspectListScreen = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Modal visibility states
    const [modalVisible, setModalVisible] = useState(false);        // for Add Prospect
    const [editModalVisible, setEditModalVisible] = useState(false); // for Edit Prospect

    // Fields for "Add Prospect"
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [originalContact, setOriginalContact] = useState(new Date().toISOString());
    const [prospectNote, setProspectNote] = useState('');

    // Fields for "Edit Prospect"
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPhoneNumber, setEditPhoneNumber] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editOriginalContact, setEditOriginalContact] = useState(new Date().toISOString());
    const [editProspectNote, setEditProspectNote] = useState('');

    useEffect(() => {
        const fetchClients = async () => {
            if (!user) {
                setError('User not logged in');
                setLoading(false);
                return;
            }
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                setError(error.message);
            } else if (data) {
                setClients(data);
            }
            setLoading(false);
        };

        fetchClients();
    }, [user]);

    // Refresh clients after adding or editing a prospect
    const refreshClients = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            setError(error.message);
        } else if (data) {
            setClients(data);
        }
        setLoading(false);
    };

    // When a user taps an existing prospect, open the edit modal
    const handleEditPress = (client: Client) => {
        setSelectedClient(client);

        // Pre-fill edit fields with the current data
        setEditFirstName(client.first_name);
        setEditLastName(client.last_name || '');
        setEditEmail(client.email || '');
        setEditPhoneNumber(client.phone_number || '');
        setEditAddress(client.address || '');
        setEditOriginalContact(client.original_contact || new Date().toISOString());
        setEditProspectNote(client.prospect_note || '');

        setEditModalVisible(true);
    };

    const handleUpdateProspect = async () => {
        if (!user || !selectedClient) {
            Toast.show({ type: 'error', text1: 'No user or client selected' });
            return;
        }

        // Basic validation
        if (!editFirstName.trim()) {
            Toast.show({ type: 'error', text1: 'First name is required' });
            return;
        }

        const { error } = await supabase
            .from('clients')
            .update({
                first_name: editFirstName,
                last_name: editLastName || null,
                email: editEmail || null,
                phone_number: editPhoneNumber || null,
                address: editAddress || null,
                original_contact: editOriginalContact,
                prospect_note: editProspectNote,
            })
            .eq('client_id', selectedClient.client_id);

        if (error) {
            Toast.show({ type: 'error', text1: 'Error updating prospect', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Prospect updated successfully' });
            setEditModalVisible(false);
            setSelectedClient(null);
            refreshClients();
        }
    };

    // Function to add a new prospect to the database
    const handleAddProspect = async () => {
        if (!user) {
            Toast.show({ type: 'error', text1: 'User not logged in' });
            return;
        }
        // Basic validation: ensure at least first name is provided.
        if (!firstName.trim()) {
            Toast.show({ type: 'error', text1: 'First name is required' });
            return;
        }

        const { error } = await supabase.from('clients').insert([
            {
                user_id: user.id,
                first_name: firstName,
                last_name: lastName || null,
                email: email || null,
                phone_number: phoneNumber || null,
                address: address || null,
                is_in_pipeline: false, // default value
                temperature: 'none',   // default value
                prospect_note: prospectNote || '',
                pipeline_note: '',     // default empty note
                original_contact: originalContact,
                created_at: new Date().toISOString(),
            },
        ]);

        if (error) {
            Toast.show({ type: 'error', text1: 'Error adding prospect', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Prospect added successfully' });
            setModalVisible(false);

            // Clear fields after adding
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhoneNumber('');
            setAddress('');
            setProspectNote('');
            setOriginalContact(new Date().toISOString());

            refreshClients();
        }
    };

    const renderItem = ({ item }: { item: Client }) => (
        <TouchableOpacity onPress={() => handleEditPress(item)}>
            <View style={styles.itemContainer}>
                <Text style={styles.name}>
                    {item.first_name} {item.last_name || ''}
                </Text>
                {item.email && <Text>Email: {item.email}</Text>}
                {item.phone_number && <Text>Phone: {item.phone_number}</Text>}
                {item.address && <Text>Address: {item.address}</Text>}
                <Text>In Pipeline: {item.is_in_pipeline ? 'Yes' : 'No'}</Text>
                {item.prospect_note && <Text>Note: {item.prospect_note}</Text>}
                {item.original_contact && (
                    <Text>Original Contact: {new Date(item.original_contact).toLocaleDateString()}</Text>
                )}
                <Text style={styles.createdAt}>
                    Logged At: {new Date(item.created_at).toLocaleString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

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
            <Text style={styles.header}>Prospect List</Text>
            <FlatList
                data={clients}
                keyExtractor={(item) => item.client_id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />

            {/* Button to open the "Add Prospect" modal */}
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.addButtonText}>Add Prospect</Text>
            </TouchableOpacity>

            {/* "Add Prospect" Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalHeader}>Add New Prospect</Text>

                            <Text style={styles.label}>First Name (mandatory)</Text>
                            <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                            />

                            <Text style={styles.label}>Last Name</Text>
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                            />

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                            />

                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.label}>Address</Text>
                            <TextInput
                                style={styles.input}
                                value={address}
                                onChangeText={setAddress}
                            />

                            <Text style={styles.label}>Prospect Note</Text>
                            <TextInput
                                style={styles.input}
                                value={prospectNote}
                                onChangeText={setProspectNote}
                            />

                            <Text style={styles.label}>Original Contact</Text>
                            <TextInput
                                style={styles.input}
                                value={originalContact}
                                onChangeText={setOriginalContact}
                            />

                            <Button title="Add Prospect" onPress={handleAddProspect} />
                            <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* "Edit Prospect" Modal */}
            <Modal
                visible={editModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalHeader}>Edit Prospect</Text>

                            <Text style={styles.label}>First Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editFirstName}
                                onChangeText={setEditFirstName}
                            />

                            <Text style={styles.label}>Last Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editLastName}
                                onChangeText={setEditLastName}
                            />

                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={editEmail}
                                onChangeText={setEditEmail}
                                keyboardType="email-address"
                            />

                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={editPhoneNumber}
                                onChangeText={setEditPhoneNumber}
                                keyboardType="phone-pad"
                            />

                            <Text style={styles.label}>Address</Text>
                            <TextInput
                                style={styles.input}
                                value={editAddress}
                                onChangeText={setEditAddress}
                            />

                            <Text style={styles.label}>Prospect Note</Text>
                            <TextInput
                                style={styles.input}
                                value={editProspectNote}
                                onChangeText={setEditProspectNote}
                            />

                            <Text style={styles.label}>Original Contact</Text>
                            <TextInput
                                style={styles.input}
                                value={editOriginalContact}
                                onChangeText={setEditOriginalContact}
                            />

                            <Button title="Save Changes" onPress={handleUpdateProspect} />
                            <Button title="Cancel" onPress={() => setEditModalVisible(false)} color="red" />
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
});

export default ProspectListScreen;
