import React, { useState, useEffect } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Toast from 'react-native-toast-message';

const ContactsScreen = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Picker for contact type – possible values: "Prospect", "SOI", "Agent"
    const [selectedType, setSelectedType] = useState<string>('Prospect');

    // ---------- Modal Visibility States ----------
    // For adding/editing clients (Prospect and SOI)
    const [addClientModalVisible, setAddClientModalVisible] = useState(false);
    const [editClientModalVisible, setEditClientModalVisible] = useState(false);
    // For adding/editing agents
    const [addAgentModalVisible, setAddAgentModalVisible] = useState(false);
    const [editAgentModalVisible, setEditAgentModalVisible] = useState(false);

    // ---------- State for Clients (Prospect & SOI) ----------
    const [clientFirstName, setClientFirstName] = useState('');
    const [clientLastName, setClientLastName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [clientNote, setClientNote] = useState('');
    // Original contact date for Prospect only
    const [clientOriginalContact, setClientOriginalContact] = useState(new Date());
    const [showClientDatePicker, setShowClientDatePicker] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any>(null);

    // ---------- State for Agents ----------
    const [agentName, setAgentName] = useState('');
    const [agentPhone, setAgentPhone] = useState('');
    const [agentEmail, setAgentEmail] = useState('');
    const [agentAddress, setAgentAddress] = useState('');
    const [agentBrokerage, setAgentBrokerage] = useState('');
    const [agentNotes, setAgentNotes] = useState('');
    const [agentOriginalContact, setAgentOriginalContact] = useState(new Date());
    const [showAgentDatePicker, setShowAgentDatePicker] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<any>(null);

    // ---------- Data Fetching ----------
    useEffect(() => {
        const fetchContacts = async () => {
            if (!user) {
                setError('User not logged in');
                setLoading(false);
                return;
            }
            setLoading(true);
            if (selectedType === 'Agent') {
                // Fetch agents
                const { data, error } = await supabase.rpc('get_agents_by_user', { uid: user.id });
                if (error) setError(error.message);
                else setContacts(data);
            } else {
                // Fetch clients with type Prospect or SOI
                const { data, error } = await supabase.rpc('get_clients_by_client_type', {
                    uid: user.id,
                    client_type_name: selectedType,
                });
                if (error) setError(error.message);
                else setContacts(data);
            }
            setLoading(false);
        };
        fetchContacts();
    }, [user, selectedType]);

    const refreshContacts = async () => {
        if (!user) return;
        setLoading(true);
        if (selectedType === 'Agent') {
            const { data, error } = await supabase.rpc('get_agents_by_user', { uid: user.id });
            if (error) setError(error.message);
            else setContacts(data);
        } else {
            const { data, error } = await supabase.rpc('get_clients_by_client_type', {
                uid: user.id,
                client_type_name: selectedType,
            });
            if (error) setError(error.message);
            else setContacts(data);
        }
        setLoading(false);
    };

    // ---------- Rendering Contacts ----------
    const renderItem = ({ item }: { item: any }) => {
        if (selectedType === 'Agent') {
            return (
                <TouchableOpacity onPress={() => handleAgentEdit(item)}>
                    <View style={styles.itemContainer}>
                        <Text style={styles.name}>{item.name}</Text>
                        {item.email && <Text>Email: {item.email}</Text>}
                        {item.phone_number && <Text>Phone: {item.phone_number}</Text>}
                        {item.address && <Text>Address: {item.address}</Text>}
                        {item.brokerage && <Text>Brokerage: {item.brokerage}</Text>}
                        {item.original_contact && (
                            <Text>Original Contact: {new Date(item.original_contact).toLocaleDateString()}</Text>
                        )}
                        {item.notes && <Text>Notes: {item.notes}</Text>}
                    </View>
                </TouchableOpacity>
            );
        } else {
            return (
                <TouchableOpacity onPress={() => handleClientEdit(item)}>
                    <View style={styles.itemContainer}>
                        <Text style={styles.name}>
                            {item.first_name} {item.last_name || ''}
                        </Text>
                        {item.email && <Text>Email: {item.email}</Text>}
                        {item.phone_number && <Text>Phone: {item.phone_number}</Text>}
                        {item.address && <Text>Address: {item.address}</Text>}
                        {selectedType === 'Prospect' && item.original_contact && (
                            <Text>
                                Original Contact: {new Date(item.original_contact).toLocaleDateString()}
                            </Text>
                        )}
                        {item.prospect_note && <Text>Note: {item.prospect_note}</Text>}
                        <Text style={styles.createdAt}>
                            Logged At: {new Date(item.created_at).toLocaleString()}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        }
    };

    // ---------- Editing Handlers ----------
    const handleClientEdit = (client: any) => {
        setSelectedClient(client);
        setClientFirstName(client.first_name);
        setClientLastName(client.last_name || '');
        setClientEmail(client.email || '');
        setClientPhone(client.phone_number || '');
        setClientAddress(client.address || '');
        setClientNote(client.prospect_note || '');
        if (selectedType === 'Prospect') {
            setClientOriginalContact(client.original_contact ? new Date(client.original_contact) : new Date());
        }
        setEditClientModalVisible(true);
    };

    const handleUpdateClient = async () => {
        if (!user || !selectedClient) {
            Toast.show({ type: 'error', text1: 'No user or contact selected' });
            return;
        }
        if (!clientFirstName.trim()) {
            Toast.show({ type: 'error', text1: 'First name is required' });
            return;
        }
        const payload: any = {
            first_name: clientFirstName,
            last_name: clientLastName || null,
            email: clientEmail || null,
            phone_number: clientPhone || null,
            address: clientAddress || null,
            prospect_note: clientNote,
        };
        if (selectedType === 'Prospect') {
            payload.original_contact = clientOriginalContact.toISOString();
        }
        const { error } = await supabase
            .from('clients')
            .update(payload)
            .eq('client_id', selectedClient.client_id);
        if (error) {
            Toast.show({ type: 'error', text1: 'Error updating contact', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Contact updated successfully' });
            setEditClientModalVisible(false);
            setSelectedClient(null);
            refreshContacts();
        }
    };

    const handleAgentEdit = (agent: any) => {
        setSelectedAgent(agent);
        setAgentName(agent.name);
        setAgentPhone(agent.phone_number || '');
        setAgentEmail(agent.email || '');
        setAgentAddress(agent.address || '');
        setAgentBrokerage(agent.brokerage || '');
        setAgentNotes(agent.notes || '');
        setAgentOriginalContact(agent.original_contact ? new Date(agent.original_contact) : new Date());
        setEditAgentModalVisible(true);
    };

    const handleUpdateAgent = async () => {
        if (!user || !selectedAgent) {
            Toast.show({ type: 'error', text1: 'No user or agent selected' });
            return;
        }
        if (!agentName.trim()) {
            Toast.show({ type: 'error', text1: 'Name is required' });
            return;
        }
        // Format the agent's original_contact date as "yyyy-mm-dd" (same as prospect)
        const formattedDate = agentOriginalContact.toISOString().split('T')[0];

        const payload = {
            name: agentName,
            phone_number: agentPhone || null,
            email: agentEmail || null,
            address: agentAddress || null,
            brokerage: agentBrokerage || null,
            original_contact: formattedDate,
            notes: agentNotes || '',
        };

        console.log("Updating agent with id:", selectedAgent.id, "payload:", payload);

        const { error } = await supabase
            .from('agent_contacts')
            .update(payload)
            .eq('id', selectedAgent.id);

        if (error) {
            Toast.show({ type: 'error', text1: 'Error updating agent', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Agent updated successfully' });
            setEditAgentModalVisible(false);
            setSelectedAgent(null);
            refreshContacts();
        }
    };



    // ---------- Adding Handlers ----------
    const handleAddClient = async () => {
        if (!user) {
            Toast.show({ type: 'error', text1: 'User not logged in' });
            return;
        }
        if (!clientFirstName.trim()) {
            Toast.show({ type: 'error', text1: 'First name is required' });
            return;
        }
        const payload: any = {
            user_id: user.id,
            first_name: clientFirstName,
            last_name: clientLastName || null,
            email: clientEmail || null,
            phone_number: clientPhone || null,
            address: clientAddress || null,
            prospect_note: clientNote || '',
            created_at: new Date().toISOString(),
        };
        if (selectedType === 'Prospect') {
            payload.original_contact = clientOriginalContact.toISOString();
        }
        const { error } = await supabase.from('clients').insert([payload]);
        if (error) {
            Toast.show({ type: 'error', text1: 'Error adding contact', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Contact added successfully' });
            setAddClientModalVisible(false);
            setClientFirstName('');
            setClientLastName('');
            setClientEmail('');
            setClientPhone('');
            setClientAddress('');
            setClientNote('');
            setClientOriginalContact(new Date());
            refreshContacts();
        }
    };

    const handleAddAgent = async () => {
        if (!user) {
            Toast.show({ type: 'error', text1: 'User not logged in' });
            return;
        }
        if (!agentName.trim()) {
            Toast.show({ type: 'error', text1: 'Name is required' });
            return;
        }
        const { error } = await supabase.from('agents').insert([
            {
                user_id: user.id,
                name: agentName,
                phone_number: agentPhone || null,
                email: agentEmail || null,
                address: agentAddress || null,
                brokerage: agentBrokerage || null,
                original_contact: agentOriginalContact.toISOString(),
                notes: agentNotes || '',
            },
        ]);
        if (error) {
            Toast.show({ type: 'error', text1: 'Error adding agent', text2: error.message });
        } else {
            Toast.show({ type: 'success', text1: 'Agent added successfully' });
            setAddAgentModalVisible(false);
            setAgentName('');
            setAgentPhone('');
            setAgentEmail('');
            setAgentAddress('');
            setAgentBrokerage('');
            setAgentNotes('');
            setAgentOriginalContact(new Date());
            refreshContacts();
        }
    };

    // Determine add button text based on selected type
    const addButtonText =
        selectedType === 'Agent'
            ? 'Add Agent'
            : selectedType === 'SOI'
                ? 'Add SOI'
                : 'Add Prospect';

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
            <Text style={styles.header}>Contacts Page</Text>
            {/* Picker for selecting contact type */}
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedType}
                    onValueChange={(itemValue) => setSelectedType(itemValue)}
                    style={styles.picker}
                    mode="dialog"
                >
                    <Picker.Item label="Prospect" value="Prospect" />
                    <Picker.Item label="SOI" value="SOI" />
                    <Picker.Item label="Agent" value="Agent" />
                </Picker>
            </View>
            <FlatList
                data={contacts}
                keyExtractor={(item) => (item.client_id ? item.client_id : item.id.toString())}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
            <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                    selectedType === 'Agent'
                        ? setAddAgentModalVisible(true)
                        : setAddClientModalVisible(true)
                }
            >
                <Text style={styles.addButtonText}>{addButtonText}</Text>
            </TouchableOpacity>

            {/* ---------- Add Client Modal (for Prospect and SOI) ---------- */}
            <Modal
                visible={addClientModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAddClientModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalHeader}>
                                {selectedType === 'SOI' ? 'Add SOI' : 'Add Prospect'}
                            </Text>
                            <Text style={styles.label}>First Name</Text>
                            <TextInput style={styles.input} value={clientFirstName} onChangeText={setClientFirstName} />
                            <Text style={styles.label}>Last Name</Text>
                            <TextInput style={styles.input} value={clientLastName} onChangeText={setClientLastName} />
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={clientEmail}
                                onChangeText={setClientEmail}
                                keyboardType="email-address"
                            />
                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={clientPhone}
                                onChangeText={setClientPhone}
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.label}>Address</Text>
                            <TextInput style={styles.input} value={clientAddress} onChangeText={setClientAddress} />
                            <Text style={styles.label}>Note</Text>
                            <TextInput style={styles.input} value={clientNote} onChangeText={setClientNote} />
                            {/* Show original contact only for Prospect */}
                            {selectedType === 'Prospect' && (
                                <>
                                    <Text style={styles.label}>Original Contact</Text>
                                    <TouchableOpacity
                                        style={styles.datePickerButton}
                                        onPress={() => setShowClientDatePicker(true)}
                                    >
                                        <Text>{clientOriginalContact.toLocaleDateString()}</Text>
                                    </TouchableOpacity>
                                    {showClientDatePicker && (
                                        <DateTimePicker
                                            value={clientOriginalContact}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowClientDatePicker(false);
                                                if (selectedDate) setClientOriginalContact(selectedDate);
                                            }}
                                        />
                                    )}
                                </>
                            )}
                            <Button title="Add" onPress={handleAddClient} />
                            <Button title="Cancel" onPress={() => setAddClientModalVisible(false)} color="red" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ---------- Add Agent Modal ---------- */}
            <Modal
                visible={addAgentModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setAddAgentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalHeader}>Add Agent</Text>
                            <Text style={styles.label}>Name</Text>
                            <TextInput style={styles.input} value={agentName} onChangeText={setAgentName} />
                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={agentPhone}
                                onChangeText={setAgentPhone}
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={agentEmail}
                                onChangeText={setAgentEmail}
                                keyboardType="email-address"
                            />
                            <Text style={styles.label}>Address</Text>
                            <TextInput style={styles.input} value={agentAddress} onChangeText={setAgentAddress} />
                            <Text style={styles.label}>Brokerage</Text>
                            <TextInput style={styles.input} value={agentBrokerage} onChangeText={setAgentBrokerage} />
                            <Text style={styles.label}>Notes</Text>
                            <TextInput style={styles.input} value={agentNotes} onChangeText={setAgentNotes} />
                            <Text style={styles.label}>Original Contact</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => setShowAgentDatePicker(true)}
                            >
                                <Text>{agentOriginalContact.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            {showAgentDatePicker && (
                                <DateTimePicker
                                    value={agentOriginalContact}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowAgentDatePicker(false);
                                        if (selectedDate) setAgentOriginalContact(selectedDate);
                                    }}
                                />
                            )}
                            <Button title="Add" onPress={handleAddAgent} />
                            <Button title="Cancel" onPress={() => setAddAgentModalVisible(false)} color="red" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ---------- Edit Client Modal ---------- */}
            <Modal
                visible={editClientModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEditClientModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalHeader}>
                                Edit {selectedType === 'SOI' ? 'SOI' : 'Prospect'}
                            </Text>
                            <Text style={styles.label}>First Name</Text>
                            <TextInput style={styles.input} value={clientFirstName} onChangeText={setClientFirstName} />
                            <Text style={styles.label}>Last Name</Text>
                            <TextInput style={styles.input} value={clientLastName} onChangeText={setClientLastName} />
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={clientEmail}
                                onChangeText={setClientEmail}
                                keyboardType="email-address"
                            />
                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={clientPhone}
                                onChangeText={setClientPhone}
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.label}>Address</Text>
                            <TextInput style={styles.input} value={clientAddress} onChangeText={setClientAddress} />
                            <Text style={styles.label}>Note</Text>
                            <TextInput style={styles.input} value={clientNote} onChangeText={setClientNote} />
                            {selectedType === 'Prospect' && (
                                <>
                                    <Text style={styles.label}>Original Contact</Text>
                                    <TouchableOpacity
                                        style={styles.datePickerButton}
                                        onPress={() => setShowClientDatePicker(true)}
                                    >
                                        <Text>{clientOriginalContact.toLocaleDateString()}</Text>
                                    </TouchableOpacity>
                                    {showClientDatePicker && (
                                        <DateTimePicker
                                            value={clientOriginalContact}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowClientDatePicker(false);
                                                if (selectedDate) setClientOriginalContact(selectedDate);
                                            }}
                                        />
                                    )}
                                </>
                            )}
                            <Button title="Save Changes" onPress={handleUpdateClient} />
                            <Button title="Cancel" onPress={() => setEditClientModalVisible(false)} color="red" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ---------- Edit Agent Modal ---------- */}
            <Modal
                visible={editAgentModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setEditAgentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalHeader}>Edit Agent</Text>
                            <Text style={styles.label}>Name</Text>
                            <TextInput style={styles.input} value={agentName} onChangeText={setAgentName} />
                            <Text style={styles.label}>Phone</Text>
                            <TextInput
                                style={styles.input}
                                value={agentPhone}
                                onChangeText={setAgentPhone}
                                keyboardType="phone-pad"
                            />
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={agentEmail}
                                onChangeText={setAgentEmail}
                                keyboardType="email-address"
                            />
                            <Text style={styles.label}>Address</Text>
                            <TextInput style={styles.input} value={agentAddress} onChangeText={setAgentAddress} />
                            <Text style={styles.label}>Brokerage</Text>
                            <TextInput style={styles.input} value={agentBrokerage} onChangeText={setAgentBrokerage} />
                            <Text style={styles.label}>Notes</Text>
                            <TextInput style={styles.input} value={agentNotes} onChangeText={setAgentNotes} />
                            <Text style={styles.label}>Original Contact</Text>
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => setShowAgentDatePicker(true)}
                            >
                                <Text>{agentOriginalContact.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                            {showAgentDatePicker && (
                                <DateTimePicker
                                    value={agentOriginalContact}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowAgentDatePicker(false);
                                        if (selectedDate) setAgentOriginalContact(selectedDate);
                                    }}
                                />
                            )}
                            <Button title="Save Changes" onPress={handleUpdateAgent} />
                            <Button title="Cancel" onPress={() => setEditAgentModalVisible(false)} color="red" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
    picker: { width: '100%', height: 50 },
    listContent: { paddingBottom: 16 },
    itemContainer: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 6, marginBottom: 12 },
    name: { fontSize: 18, fontWeight: '600' },
    createdAt: { fontSize: 12, color: '#555', marginTop: 4 },
    addButton: { backgroundColor: 'tomato', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 16 },
    addButtonText: { color: '#fff', fontSize: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#fff', padding: 20, borderRadius: 8, maxHeight: '80%' },
    modalHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
    label: { fontWeight: '600', marginVertical: 4 },
    input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12, borderRadius: 4 },
    datePickerButton: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 4, marginBottom: 12, alignItems: 'center' },
});

export default ContactsScreen;
