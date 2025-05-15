import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const school = { latitude: -3.749030719831624, longitude: -38.54604683193028 };

export default function App() {
  const [students, setStudents] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [initialRegion, setInitialRegion] = useState<Region>({
    latitude: school.latitude,
    longitude: school.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    const loadStudents = async () => {
      const json = await AsyncStorage.getItem('@students');
      if (json) setStudents(JSON.parse(json));
    };
    loadStudents();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('@students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    const getCurrentLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada para acessar localização');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setInitialRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    };

    getCurrentLocation();
  }, []);

  const geocodeAddress = async (address: string) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'MeuApp/1.0 (email@example.com)',
        },
      });

      if (!res.ok) throw new Error(`Erro ao acessar a API: ${res.statusText}`);
      const data = await res.json();
      if (data.length === 0) throw new Error('Endereço não encontrado');
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    } catch (err) {
      console.error('Erro na geocodificação:', err);
      throw new Error('Erro ao localizar endereço');
    }
  };

  const handleAddStudent = async () => {
    if (!name || !address) return Alert.alert('Preencha nome e endereço');

    try {
      const coords = await geocodeAddress(address);
      const newStudent = {
        id: Date.now().toString(),
        name,
        address,
        ...coords,
      };
      setStudents([...students, newStudent]);
      setName('');
      setAddress('');
    } catch (err) {
      Alert.alert('Erro ao localizar endereço', (err as Error).message);
    }
  };

  const handleDeleteStudent = (id: string) => {
    Alert.alert('Remover Aluno', 'Tem certeza que deseja remover este aluno?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          const updated = students.filter((s) => s.id !== id);
          setStudents(updated);
        },
      },
    ]);
  };

  const openInGoogleMaps = (student: any) => {
    const studentCoords = `${student.latitude},${student.longitude}`;
    const schoolCoords = `${school.latitude},${school.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${studentCoords}&destination=${schoolCoords}&travelmode=driving`;

    Linking.openURL(url).catch((err) => {
      console.error('Erro ao abrir o Google Maps:', err);
      Alert.alert('Erro', 'Não foi possível abrir o Google Maps.');
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <MapView style={styles.map} initialRegion={initialRegion}>
          {students.map((student) => (
            <Marker
              key={student.id}
              coordinate={{
                latitude: student.latitude,
                longitude: student.longitude,
              }}
              title={student.name}
              description={student.address}
              onPress={() => openInGoogleMaps(student)}
            />
          ))}
          <Marker coordinate={school} title="Escola" pinColor="blue" />
        </MapView>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Iniciar Cadastro</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Insira o nome do aluno"
        />
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="Insira o endereço do aluno"
        />
        <Button title="Finalizar cadastro" color="orange" onPress={handleAddStudent} />
      </View>

      <View style={styles.list}>
        <Text style={styles.formTitle}>Lista de Cadastros</Text>
        {students.map((student) => (
          <View key={student.id} style={styles.studentItem}>
            <Text style={{ flex: 1 }}>{student.name}</Text>
            <Button
              title="Remover"
              color="black"
              onPress={() => handleDeleteStudent(student.id)}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: 'gray',
  },
  card: {
    backgroundColor: 'lightgray',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardTitle: {
    padding: 12,
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  map: {
    width: '100%',
    height: Dimensions.get('window').height / 2.2,
  },
  form: {
    backgroundColor: 'lightgray',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  formTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center'
  },
  input: {
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    textAlign: 'center'
  },
  list: {
    backgroundColor: 'lightgray',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    elevation: 2,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
});
