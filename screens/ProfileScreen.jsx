import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Dimensions
} from 'react-native';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import { BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function ProfileScreen({ route, navigation }) {
  const { token } = route.params;
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://10.45.71.76:5000/api/profile/me', {
        headers: { 'x-auth-token': token },
      });
      setProfile(response.data);
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert("Error", "Unable to load profile.", [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  const uploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadingResume(true);
        const formData = new FormData();
        formData.append('resume', {
          uri: file.uri,
          type: file.mimeType || 'application/pdf',
          name: file.name || 'resume.pdf',
        });
        const response = await axios.post(
          'http://10.45.71.76:5000/api/profile/resume', 
          formData, 
          { headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } }
        );
        Alert.alert("Success", "Resume uploaded successfully.", [{ text: "OK" }]);
        setProfile(response.data);
      }
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert("Upload Failed", "Unable to upload resume.", [{ text: "OK" }]);
    } finally {
      setUploadingResume(false);
    }
  };

  const uploadAvatar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', {
          uri: file.uri,
          type: file.mimeType || 'image/jpeg',
          name: file.name || 'avatar.jpg',
        });
        const response = await axios.post(
          'http://10.45.71.76:5000/api/profile/avatar', 
          formData, 
          { headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } }
        );
        Alert.alert("Success", "Profile picture uploaded.", [{ text: "OK" }]);
        setProfile(response.data);
      }
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert("Upload Failed", "Unable to upload picture.", [{ text: "OK" }]);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const addSkills = async () => {
    if (!skills.trim()) {
      Alert.alert("Error", "Please enter at least one skill");
      return;
    }
    setLoading(true);
    try {
      const skillsArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      const response = await axios.post(
        'http://10.45.71.76:5000/api/profile/skills',
        { skills: skillsArray },
        { headers: { 'x-auth-token': token } }
      );
      Alert.alert("Success", "Skills added successfully", [{ text: "OK" }]);
      setSkills('');
      setProfile(response.data);
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert("Failed", "Unable to add skills.", [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>My Profile</Text>
      <Text style={styles.headerSubtitle}>Explore Your Learning Journey</Text>
    </View>
  );

  const renderProfileInfo = () => (
    <View style={styles.section}>
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={uploadAvatar} disabled={uploadingAvatar}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={
                profile?.avatar 
                  ? { uri: profile.avatar } 
                  : require('../assets/icon.png') // Replace with your placeholder
              } 
              style={styles.profileImage}
            />
            {uploadingAvatar && (
              <View style={styles.imageOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.name || 'Your Name'}</Text>
          <Text style={styles.profileDetail}>{profile?.email || 'Your Email'}</Text>
          <Text style={styles.profileDetail}>Level: {profile?.gamification?.level || 0}</Text>
          <Text style={styles.profileDetail}>Points: {profile?.gamification?.points || 0}</Text>
        </View>
      </View>
    </View>
  );

  const renderLearningGoals = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Learning Goals</Text>
      <View style={styles.card}>
        {profile?.learningPath?.goals?.map((goal, index) => (
          <View key={index} style={styles.badge}>
            <Text style={styles.badgeText}>{goal}</Text>
          </View>
        )) || <Text style={styles.noDataText}>No goals set yet</Text>}
      </View>
    </View>
  );

  const renderSkillsChart = () => {
    if (!profile?.skills?.length) return null;
    const data = profile.skills.map((skill, index) => ({
      name: skill.skill,
      population: skill.proficiencyLevel,
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'][index % 5],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills Proficiency</Text>
        <View style={styles.card}>
          <PieChart
            data={data}
            width={screenWidth - 80}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      </View>
    );
  };

  const renderLearningPathChart = () => {
    if (!profile?.learningPath?.recommendedSkills) return null;
    const maxPriority = Math.max(...profile.learningPath.recommendedSkills.map(skill => skill.priority));
    const data = {
      labels: profile.learningPath.recommendedSkills.map(skill => skill.skill),
      datasets: [{
        data: profile.learningPath.recommendedSkills.map(skill => maxPriority - skill.priority + 1),
      }],
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended Learning Path</Text>
        <View style={styles.card}>
          <BarChart
            data={data}
            width={screenWidth - 80}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `#d94c86`,
              labelColor: (opacity = 1) => `#666`,
              style: { borderRadius: 16 },
            }}
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
          {profile.learningPath.recommendedSkills.map((skill, index) => (
            <Text key={index} style={styles.skillReason}>{skill.reason}</Text>
          ))}
        </View>
      </View>
    );
  };

  const renderGamification = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gamification</Text>
      <View style={styles.card}>
        <Text style={styles.detailText}>Current Streak: {profile?.gamification?.streaks?.current || 0} days</Text>
        <Text style={styles.detailText}>Longest Streak: {profile?.gamification?.streaks?.longest || 0} days</Text>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Actions</Text>
      <View style={styles.card}>
        <Text style={styles.inputLabel}>Add Skills (comma-separated)</Text>
        <TextInput
          style={styles.inputField}
          value={skills}
          onChangeText={setSkills}
          placeholder="e.g., JavaScript, Python"
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={addSkills}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Adding...' : 'Add Skills'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, uploadingResume && styles.buttonDisabled]}
          onPress={uploadResume}
          disabled={uploadingResume}
        >
          <Text style={styles.buttonText}>{uploadingResume ? 'Uploading...' : 'Upload Resume'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d94c86" />
      {renderHeader()}
      {loading && !profile ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#d94c86" />
          <Text style={styles.loaderText}>Loading your profile...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderProfileInfo()}
          {renderLearningGoals()}
          {renderSkillsChart()}
          {renderLearningPathChart()}
          {renderGamification()}
          {renderActions()}
        </ScrollView>
      )}
      <View style={styles.tabBar}>
        {['Home', 'Community', 'Lessons', 'Profile'].map((tab, index) => (
          <TouchableOpacity 
            key={tab}
            style={styles.tabItem}
            onPress={() => tab !== 'Profile' && navigation.navigate(tab, { token })}
          >
            <View style={[styles.tabIcon, tab === 'Profile' && styles.activeTab]}>
              <Text style={styles.tabIconText}>
                {['🏠', '👥', '📚', '👤'][index]}
              </Text>
            </View>
            <Text style={[styles.tabText, tab === 'Profile' && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#d94c86',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffebee',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#d94c86',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileDetail: {
    fontSize: 16,
    color: '#666',
    marginVertical: 2,
  },
  badge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 14,
    color: '#d94c86',
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  skillReason: {
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#d94c86',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonDisabled: {
    backgroundColor: '#f8a0bd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 5,
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeTab: {
    backgroundColor: '#d94c86',
  },
  tabIconText: {
    fontSize: 20,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#d94c86',
    fontWeight: '700',
  },
});